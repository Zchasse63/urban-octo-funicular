"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UsePollingOptions<T> {
  fetcher: () => Promise<T>;
  interval?: number;
  enabled?: boolean;
  shouldStop?: (data: T) => boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UsePollingResult<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isPolling: boolean;
  start: () => void;
  stop: () => void;
  refetch: () => Promise<void>;
}

export default function usePolling<T>({
  fetcher,
  interval = 3000,
  enabled = true,
  shouldStop,
  onSuccess,
  onError,
}: UsePollingOptions<T>): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(enabled);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetcher();

      if (!mountedRef.current) return;

      setData(result);
      onSuccess?.(result);

      if (shouldStop?.(result)) {
        setIsPolling(false);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [fetcher, shouldStop, onSuccess, onError]);

  const start = useCallback(() => setIsPolling(true), []);
  const stop = useCallback(() => setIsPolling(false), []);

  useEffect(() => {
    mountedRef.current = true;

    if (isPolling) {
      fetchData();
      intervalRef.current = setInterval(fetchData, interval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPolling, interval, fetchData]);

  return { data, isLoading, error, isPolling, start, stop, refetch: fetchData };
}
