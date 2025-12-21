import { useState, useEffect, useCallback } from "react";

interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  enabled?: boolean;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useApi<T>(
  fetchFn: () => Promise<T>,
  deps: any[] = [],
  options: UseApiOptions<T> = {}
): UseApiReturn<T> {
  const { initialData = null, onSuccess, onError, enabled = true } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [enabled, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
