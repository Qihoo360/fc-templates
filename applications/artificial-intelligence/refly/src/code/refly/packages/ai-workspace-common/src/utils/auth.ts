import { AuthenticationExpiredError, ConnectionError } from '@refly/errors';
import getClient from '@refly-packages/ai-workspace-common/requests/proxiedRequest';
import { logout } from '@refly-packages/ai-workspace-common/hooks/use-logout';

interface RefreshResult {
  isRefreshed: boolean;
  error?: unknown;
}

let isRefreshing = false;
let refreshPromise: Promise<RefreshResult> | null = null;
const requestQueue: Array<{
  resolve: (value: Response) => void;
  reject: (error: unknown) => void;
  failedRequest: Request;
}> = [];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_RETRIES = 3;
const RETRY_DELAY = 100;
const NETWORK_ERROR_RETRY_DELAY = 1000;
const MAX_NETWORK_RETRIES = 5;

// Track network status
let isOnline = navigator.onLine;
window.addEventListener('online', () => {
  isOnline = true;
  // When network recovers, try to process any queued requests
  if (requestQueue.length > 0) {
    processQueuedRequests();
  }
});
window.addEventListener('offline', () => {
  isOnline = false;
});

// Helper to determine if an error is likely a network error
const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return (
      error.name === 'NetworkError' ||
      error.message.includes('network') ||
      error.message.includes('connection') ||
      error.message.includes('offline')
    );
  }
  return false;
};

export const refreshToken = async (): Promise<RefreshResult> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    let retryCount = 0;
    let networkRetryCount = 0;

    while (retryCount <= MAX_RETRIES) {
      try {
        // Check if we're online before attempting
        if (!isOnline) {
          console.warn('Network appears to be offline, waiting for connection...');
          await new Promise<void>((resolve) => {
            const checkOnline = () => {
              if (navigator.onLine) {
                window.removeEventListener('online', checkOnline);
                resolve();
              }
            };
            window.addEventListener('online', checkOnline);
            // Also set a timeout to check periodically
            setTimeout(() => {
              if (navigator.onLine) {
                window.removeEventListener('online', checkOnline);
                resolve();
              }
            }, NETWORK_ERROR_RETRY_DELAY);
          });
        }

        const { response, error } = await getClient().refreshToken();

        // Don't retry on 401 status - this means the refresh token itself is invalid
        if (response?.status === 401) {
          return { isRefreshed: false };
        }

        if (error) {
          throw error;
        }

        return { isRefreshed: true };
      } catch (error) {
        console.error('Error refreshing token:', error);

        // Handle network errors differently
        if (isNetworkError(error) && networkRetryCount < MAX_NETWORK_RETRIES) {
          console.warn(
            `Network error during token refresh, retrying in ${NETWORK_ERROR_RETRY_DELAY}ms (${networkRetryCount + 1}/${MAX_NETWORK_RETRIES})`,
          );
          await delay(NETWORK_ERROR_RETRY_DELAY);
          networkRetryCount++;
          continue;
        }

        // If we have regular retries left, retry with fixed delay
        if (retryCount < MAX_RETRIES) {
          console.warn(
            `Refresh token attempt ${retryCount + 1} failed, retrying in ${RETRY_DELAY}ms`,
          );
          await delay(RETRY_DELAY);
          retryCount++;
          continue;
        }

        return { isRefreshed: false, error };
      }
    }

    return { isRefreshed: false };
  })();

  try {
    const result = await refreshPromise;
    return result;
  } finally {
    isRefreshing = false;
    refreshPromise = null;
  }
};

// Process queued requests after token refresh or network recovery
const processQueuedRequests = async () => {
  // Process all queued requests
  while (requestQueue.length > 0) {
    const { resolve, reject, failedRequest } = requestQueue.shift() ?? {
      resolve: () => {},
      reject: () => {},
      failedRequest: new Request(''),
    };

    try {
      const retriedResponse = await fetch(failedRequest);
      resolve(retriedResponse);
    } catch (error) {
      // If it's a network error and we're offline, keep it in the queue
      if (isNetworkError(error) && !navigator.onLine) {
        requestQueue.unshift({ resolve, reject, failedRequest });
        break; // Stop processing until we're back online
      } else {
        reject(error);
      }
    }
  }
};

export const refreshTokenAndRetry = async (failedRequest: Request): Promise<Response> => {
  // If we're offline, queue the request and wait for network
  if (!navigator.onLine) {
    return new Promise<Response>((resolve, reject) => {
      requestQueue.push({ resolve, reject, failedRequest });
    });
  }

  // If there are already requests in the queue, add this one too
  if (requestQueue.length > 0) {
    return new Promise<Response>((resolve, reject) => {
      requestQueue.push({ resolve, reject, failedRequest });
    });
  }

  const { isRefreshed, error } = await refreshToken();

  // If refresh failed due to network issues but we're not sure about auth status
  if (!isRefreshed && isNetworkError(error)) {
    // Queue the request instead of rejecting immediately
    return new Promise<Response>((resolve, reject) => {
      requestQueue.push({ resolve, reject, failedRequest });
    });
  }

  // If refresh definitely failed for auth reasons
  if (!isRefreshed || error) {
    // Only clear queue and reject if it's a definite auth failure
    if (!isNetworkError(error)) {
      // Clear queue and reject all pending requests
      while (requestQueue.length > 0) {
        const request = requestQueue.shift();
        if (request) {
          request.reject(new AuthenticationExpiredError());
        }
      }

      if (!isRefreshed) {
        throw new AuthenticationExpiredError();
      }
    }

    if (error && !isNetworkError(error)) {
      console.error('Error refreshing token:', error);
      throw new ConnectionError();
    }
  }

  // Process the current request
  try {
    const retryResponse = await fetch(failedRequest);

    // Process any other queued requests
    processQueuedRequests();

    return retryResponse;
  } catch (error) {
    // If it's a network error, queue the request for later
    if (isNetworkError(error)) {
      return new Promise<Response>((resolve, reject) => {
        requestQueue.push({ resolve, reject, failedRequest });
      });
    }
    throw error;
  }
};

export const responseInterceptorWithTokenRefresh = async (
  response: Response,
  request: Request,
): Promise<Response> => {
  if (request.url.includes('/v1/auth/refreshToken')) {
    return response;
  }

  if (response?.status === 401) {
    try {
      const retryResponse = await refreshTokenAndRetry(request);
      return retryResponse;
    } catch (error) {
      if (error instanceof AuthenticationExpiredError) {
        // Only logout if we're online and got a definite auth error
        // This prevents logout during temporary network issues
        if (navigator.onLine) {
          await logout();
        } else {
          // If offline, we'll keep the session and retry when back online
          console.warn('Authentication error while offline, will retry when online');
          return new Promise<Response>((resolve) => {
            const onlineHandler = async () => {
              window.removeEventListener('online', onlineHandler);
              try {
                const retryResponse = await refreshTokenAndRetry(request);
                resolve(retryResponse);
              } catch (_) {
                // If still failing when back online, then logout
                await logout();
                resolve(response);
              }
            };
            window.addEventListener('online', onlineHandler);
          });
        }
      }
      return response;
    }
  }

  return response;
};
