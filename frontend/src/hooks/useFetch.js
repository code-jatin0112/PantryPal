import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Custom Hook: useFetch
 * Fetches data asynchronously with AbortController cancellation on unmount/dependency change.
 */
export const useFetch = (fetchFn, dependencies = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const executeFetch = useCallback(async () => {
    // Abort previous in-flight request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(abortController.signal);
      if (!abortController.signal.aborted) {
        setData(result);
      }
    } catch (err) {
      if (err.name !== "AbortError" && !abortController.signal.aborted) {
        setError(err.message || "An unexpected error occurred");
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    executeFetch();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [executeFetch]);

  return { data, isLoading, error, refetch: executeFetch };
};

export default useFetch;
