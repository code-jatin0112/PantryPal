import { useState, useEffect, useMemo } from 'react';
import { createEventLoopDebounce, scheduleMicrotask } from '../utils/eventLoopScheduler';

/**
 * Custom hook for debounced search using the JavaScript Event Loop scheduler
 *
 * @param {string} initialValue
 * @param {number} delayMs
 * @returns {[string, string, Function]} [searchTerm, debouncedSearchTerm, setSearchTerm]
 */
export function useDebouncedSearch(initialValue = '', delayMs = 300) {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const debouncedUpdater = useMemo(
    () =>
      createEventLoopDebounce((val) => {
        // Schedule state update onto microtask queue to avoid layout trashing
        scheduleMicrotask(() => {
          setDebouncedValue(val);
        });
      }, delayMs),
    [delayMs]
  );

  useEffect(() => {
    debouncedUpdater(searchTerm);
  }, [searchTerm, debouncedUpdater]);

  return [searchTerm, debouncedValue, setSearchTerm];
}
