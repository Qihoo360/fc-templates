import pRetry from 'p-retry';
import pTimeout from 'p-timeout';

// 用于为一个函数添加 retry 机制
export const retryify = async (
  fn: any,
  {
    maxTimeout,
    maxRetries,
    signal,
  }: {
    maxTimeout: number;
    maxRetries: number;
    signal?: AbortSignal;
  },
) => {
  return await pTimeout(
    pRetry(fn, {
      retries: maxRetries,
      maxTimeout: maxTimeout,
      signal,
    }),
    {
      milliseconds: maxTimeout,
      signal,
    },
  );
};
