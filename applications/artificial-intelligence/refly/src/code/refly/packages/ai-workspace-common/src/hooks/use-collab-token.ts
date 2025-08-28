import { useCallback, useEffect, useState } from 'react';
import { useUserStoreShallow } from '@refly/stores';
import getClient from '../requests/proxiedRequest';

interface UseCollabTokenResult {
  token: string | null;
  refreshToken: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;
let tokenExpirationTime: number | null = null;

// Constants for token management
const TOKEN_EXPIRY_BUFFER = 1000; // 1 second buffer before actual expiration

const isTokenValid = () => {
  if (!tokenExpirationTime || !cachedToken) return false;
  return Date.now() < tokenExpirationTime - TOKEN_EXPIRY_BUFFER;
};

export function useCollabToken(): UseCollabTokenResult {
  const [token, setToken] = useState<string | null>(cachedToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isLogin = useUserStoreShallow((state) => state.isLogin);

  const fetchToken = useCallback(async () => {
    // Return cached token if it's still valid
    if (isTokenValid()) {
      return cachedToken;
    }

    // Use existing promise if a fetch is in progress
    if (tokenFetchPromise) {
      return tokenFetchPromise;
    }

    tokenFetchPromise = getClient()
      .getCollabToken()
      .then(({ data: res, error: err }) => {
        if (err || !res?.data?.token) {
          console.error(err);
          throw new Error('Failed to fetch token');
        }

        const newToken = res.data.token;
        cachedToken = newToken;
        // Set expiration time when new token is received
        tokenExpirationTime = res.data.expiresAt ?? 0;
        return newToken;
      })
      .finally(() => {
        tokenFetchPromise = null;
      });

    return tokenFetchPromise;
  }, []);

  const refreshToken = useCallback(async () => {
    if (!isLogin) {
      setToken(null);
      setError(new Error('User not logged in'));
      return;
    }

    // Skip refresh if token is still valid
    if (isTokenValid()) {
      setToken(cachedToken);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newToken = await fetchToken();
      setToken(newToken);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch token'));
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetchToken, isLogin]);

  // Modify the effect to check token validity
  useEffect(() => {
    if (isLogin && !isLoading && (!token || !isTokenValid())) {
      refreshToken();
    }
  }, [token, isLogin, refreshToken, isLoading]);

  // Clear token when user logs out
  useEffect(() => {
    if (!isLogin) {
      cachedToken = null;
      setToken(null);
    }
  }, [isLogin]);

  // Add this effect for background token refresh
  useEffect(() => {
    if (!isLogin || !isTokenValid()) return;

    const timeUntilRefresh = (tokenExpirationTime ?? 0) - TOKEN_EXPIRY_BUFFER - Date.now();
    const refreshTimer = setTimeout(refreshToken, timeUntilRefresh);

    return () => clearTimeout(refreshTimer);
  }, [isLogin, refreshToken]);

  return {
    token,
    refreshToken,
    isLoading,
    error,
  };
}
