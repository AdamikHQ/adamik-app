import { useState, useEffect, useCallback } from "react";

interface UseLoadingStateOptions {
  debounceDelay?: number;
  minimumLoadingTime?: number;
}

export const useLoadingState = (
  initialState = false,
  options: UseLoadingStateOptions = {}
) => {
  const {
    debounceDelay = 200, // Default debounce delay to prevent flickering
    minimumLoadingTime = 500, // Minimum time to show loading state
  } = options;

  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [debouncedLoading, setDebouncedLoading] = useState(initialState);

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    if (isLoading) {
      // Start loading immediately
      setDebouncedLoading(true);
      setLoadingStartTime(Date.now());
    } else {
      // When stopping loading, ensure minimum time has passed
      const currentTime = Date.now();
      const timeElapsed = loadingStartTime ? currentTime - loadingStartTime : 0;
      const remainingTime = Math.max(0, minimumLoadingTime - timeElapsed);

      debounceTimer = setTimeout(() => {
        setDebouncedLoading(false);
        setLoadingStartTime(null);
      }, remainingTime);
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [isLoading, minimumLoadingTime, loadingStartTime]);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return {
    isLoading: debouncedLoading,
    startLoading,
    stopLoading,
  };
};
