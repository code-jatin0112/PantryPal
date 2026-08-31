/**
 * Reusable Functional Closures
 */

/**
 * 1. Debounce Closure
 * Delays invoking func until after wait milliseconds have elapsed since the last time it was invoked.
 */
export const debounce = (func, wait = 300) => {
  let timeoutId = null;

  const debounced = function (...args) {
    const context = this;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func.apply(context, args);
      timeoutId = null;
    }, wait);
  };

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
};

/**
 * 2. Throttle Closure
 * Enforces a maximum number of times a func can be called over time.
 */
export const throttle = (func, limit = 200) => {
  let inThrottle = false;
  let lastRan = 0;

  return function (...args) {
    const context = this;
    const now = Date.now();

    if (!inThrottle) {
      func.apply(context, args);
      lastRan = now;
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

/**
 * 3. Private Counter Closure
 * Encapsulates state using private variables inside lexical scope.
 */
export const createPrivateCounter = (initialValue = 0) => {
  let count = initialValue;

  return {
    increment: (by = 1) => {
      count += by;
      return count;
    },
    decrement: (by = 1) => {
      count -= by;
      return count;
    },
    get: () => count,
    reset: () => {
      count = initialValue;
      return count;
    },
  };
};

/**
 * 4. Memoize Closure
 * Caches function results based on arguments.
 */
export const memoize = (fn) => {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
};

/**
 * 5. Reusable API Client Closure
 */
export const createApiWrapper = (baseEndpoint, defaultHeaders = {}) => {
  return async (path = "", options = {}) => {
    const url = `${baseEndpoint}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error ${response.status}`);
    }

    return response.json();
  };
};
