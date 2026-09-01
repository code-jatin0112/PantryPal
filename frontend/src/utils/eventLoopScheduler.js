/**
 * Event Loop Demonstration & Task Scheduler (Frontend)
 *
 * Demonstrates the JavaScript Event Loop architecture:
 * 1. Synchronous Call Stack (Highest priority execution)
 * 2. Microtask Queue (queueMicrotask, Promise.then - executes before next render/macrotask)
 * 3. Macrotask Queue (setTimeout, setInterval - scheduled in timer queue)
 * 4. Animation Queue (requestAnimationFrame - syncs with display refresh)
 */

/**
 * Schedules a callback onto the Microtask Queue.
 * Microtasks are processed immediately after the current script execution stack completes
 * and before any macrotasks or UI render passes.
 *
 * @param {Function} callback
 */
export function scheduleMicrotask(callback) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(callback);
  } else {
    Promise.resolve().then(callback);
  }
}

/**
 * Schedules a callback onto the Macrotask (Timer) Queue.
 * Macrotasks yield execution back to the browser event loop, allowing UI paint operations.
 *
 * @param {Function} callback
 * @param {number} delayMs
 * @returns {number} timerId
 */
export function scheduleMacrotask(callback, delayMs = 0) {
  return setTimeout(callback, delayMs);
}

/**
 * Custom debouncer built on Event Loop timers to prevent UI thread lock during search
 *
 * @param {Function} func
 * @param {number} waitMs
 * @returns {Function}
 */
export function createEventLoopDebounce(func, waitMs = 250) {
  let timeoutId;
  return function debouncedFunction(...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = scheduleMacrotask(() => {
      func.apply(context, args);
    }, waitMs);
  };
}

/**
 * Event loop execution tracer for debugging task prioritization
 *
 * @returns {Promise<Array<{phase: string, order: number}>>}
 */
export async function traceEventLoopOrder() {
  const executionOrder = [];

  // 1. Synchronous Call Stack
  executionOrder.push({ phase: 'Synchronous Call Stack', order: 1 });

  // 2. Schedule Macrotask
  scheduleMacrotask(() => {
    executionOrder.push({ phase: 'Macrotask Queue (setTimeout)', order: 4 });
  }, 0);

  // 3. Schedule Microtask
  scheduleMicrotask(() => {
    executionOrder.push({ phase: 'Microtask Queue (queueMicrotask)', order: 2 });
  });

  // 4. Promise Microtask
  Promise.resolve().then(() => {
    executionOrder.push({ phase: 'Microtask Queue (Promise.then)', order: 3 });
  });

  return executionOrder;
}
