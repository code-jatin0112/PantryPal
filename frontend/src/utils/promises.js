/**
 * Promise Utilities & Async Patterns
 */

/**
 * Clean error handler returning [error, data] tuple
 */
export const asyncHandler = async (promise) => {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    return [error, null];
  }
};

/**
 * Settles an array of promises with normalized output
 */
export const settleAllPromises = async (promises) => {
  const results = await Promise.allSettled(promises);
  return results.map((res) => {
    if (res.status === "fulfilled") {
      return { success: true, data: res.value };
    }
    return { success: false, error: res.reason };
  });
};

/**
 * Retries a promise function with exponential backoff
 */
export const retryPromise = async (
  fn,
  retries = 3,
  delayMs = 500,
  backoffFactor = 2
) => {
  let attempt = 0;
  let currentDelay = delayMs;

  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= backoffFactor;
    }
  }
};

/**
 * Races a promise against a timeout
 */
export const promiseWithTimeout = (
  promise,
  timeoutMs = 5000,
  timeoutMessage = "Operation timed out"
) => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    timeoutPromise,
  ]);
};
