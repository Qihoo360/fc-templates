import { LangCode } from './types';

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // Base delay of 1 second
  maxDelay: 10000, // Maximum delay of 10 seconds
  backoffMultiplier: 2, // Exponential backoff multiplier
};

/**
 * Delay function
 * @param ms Delay in milliseconds
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate retry delay time with exponential backoff
 * @param attempt Retry attempt number (starting from 0)
 * @returns Delay time in milliseconds
 */
const calculateRetryDelay = (attempt: number): number => {
  const delayTime = RETRY_CONFIG.baseDelay * RETRY_CONFIG.backoffMultiplier ** attempt;
  return Math.min(delayTime, RETRY_CONFIG.maxDelay);
};

/**
 * Check if error is retryable
 * @param error Error object
 * @returns Whether the error should be retried
 */
const isRetryableError = (error: unknown): boolean => {
  // Type guard for error-like objects
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const err = error as Record<string, unknown>;

  // Network-related errors are retryable
  if (
    err.name === 'TypeError' &&
    typeof err.message === 'string' &&
    err.message.includes('fetch failed')
  ) {
    return true;
  }

  // Connection timeout errors are retryable
  if (
    err.code === 'UND_ERR_CONNECT_TIMEOUT' ||
    (typeof err.message === 'string' && err.message.includes('timeout'))
  ) {
    return true;
  }

  // HTTP 5xx server errors are retryable
  if (typeof err.status === 'number' && err.status >= 500 && err.status < 600) {
    return true;
  }

  // 429 rate limiting errors are retryable
  if (err.status === 429) {
    return true;
  }

  return false;
};

/**
 * Fetch function with retry mechanism
 * @param url Request URL
 * @param options Fetch options
 * @returns Promise<Response>
 */
const fetchWithRetry = async (url: string, options?: RequestInit): Promise<Response> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Retry on 429 rate limiting or 5xx server errors
      if (
        (response.status === 429 || response.status >= 500) &&
        attempt < RETRY_CONFIG.maxRetries
      ) {
        const retryDelay = calculateRetryDelay(attempt);
        console.warn(
          `Translation request failed with status ${response.status}, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`,
        );
        await sleep(retryDelay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;

      // If this is the last attempt or error is not retryable, throw
      if (attempt === RETRY_CONFIG.maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const retryDelay = calculateRetryDelay(attempt);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.warn(
        `Translation request failed: ${errorMessage}, retrying in ${retryDelay}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})`,
      );
      await sleep(retryDelay);
    }
  }

  // This should never be reached, but included for type safety
  throw lastError;
};

// Language detection function
export async function detectLanguage(text: string): Promise<LangCode> {
  try {
    const truncatedText = text.length > 1000 ? text.slice(0, 1000) : text;

    const response = await fetchWithRetry(
      `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=auto&tl=en&q=${encodeURIComponent(truncatedText)}`,
    );

    if (!response.ok) {
      throw new Error(`Language detection failed with status: ${response.status}`);
    }

    const data = await response.json();
    // Google API returns the detected language code in the third element
    const detectedLang = data?.[2] as string;

    // Handle special cases
    if (detectedLang === 'zh-CN') return 'zh-Hans';
    if (detectedLang === 'zh-TW') return 'zh-Hant';

    return (detectedLang as LangCode) || 'en';
  } catch (error) {
    console.error('Language detection error after retries:', error);
    return 'en';
  }
}

// Translation function
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage = 'auto',
): Promise<string> {
  try {
    // If the target language is auto, return the original text
    if (targetLanguage === 'auto') {
      return text;
    }

    // Handle special cases for Chinese
    const normalizedTarget =
      targetLanguage === 'zh-Hans'
        ? 'zh-CN'
        : targetLanguage === 'zh-Hant'
          ? 'zh-TW'
          : targetLanguage;

    const normalizedSource =
      sourceLanguage === 'zh-Hans'
        ? 'zh-CN'
        : sourceLanguage === 'zh-Hant'
          ? 'zh-TW'
          : sourceLanguage;

    const response = await fetchWithRetry(
      `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${normalizedSource}&tl=${normalizedTarget}&q=${encodeURIComponent(
        text,
      )}`,
    );

    if (!response.ok) {
      throw new Error(`Translation failed with status: ${response.status}`);
    }

    const data = await response.json();
    // Merge all translation fragments
    const translatedText = data[0]
      .map((item: any[]) => item[0])
      .filter(Boolean)
      .join('');

    return translatedText || text;
  } catch (error) {
    console.error('Translation error after retries:', error);
    return text; // Return original text if an error occurs
  }
}

// Batch translation function with improved error handling
export async function batchTranslateText(
  texts: string[],
  targetLanguage: string,
  sourceLanguage = 'auto',
): Promise<string[]> {
  const results: string[] = [];

  for (const text of texts) {
    try {
      const translated = await translateText(text, targetLanguage, sourceLanguage);
      results.push(translated);

      // Add request interval to avoid rate limiting
      await sleep(200); // 200ms interval
    } catch (error) {
      console.error(`Failed to translate text: "${text.substring(0, 50)}..."`, error);
      // Continue processing other texts even if one translation fails
      results.push(text);
    }
  }

  return results;
}
