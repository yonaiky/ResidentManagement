"use client";

import { useCallback, useEffect, useState } from "react";
import { getCached, invalidateCache, setCached } from "@/lib/client-fetch-cache";

type UseApiQueryOptions = {
  ttlMs?: number;
  enabled?: boolean;
};

export function useApiQuery<T>(
  key: string,
  url: string,
  options?: UseApiQueryOptions
) {
  const ttlMs = options?.ttlMs ?? 60_000;
  const enabled = options?.enabled ?? true;
  const initial = enabled ? getCached<T>(key) : null;

  const [data, setData] = useState<T | null>(initial);
  const [isLoading, setIsLoading] = useState(enabled && initial === null);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(
    async (background: boolean) => {
      if (!enabled) return;

      if (!background) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }
        const json = (await response.json()) as T;
        setCached(key, json, ttlMs);
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        if (!background) {
          setData(null);
        }
      } finally {
        if (!background) {
          setIsLoading(false);
        }
      }
    },
    [enabled, key, ttlMs, url]
  );

  useEffect(() => {
    if (!enabled) return;
    const hasCache = getCached<T>(key) !== null;
    void fetchData(hasCache);
  }, [enabled, fetchData, key]);

  const refresh = useCallback(async () => {
    invalidateCache(key);
    await fetchData(false);
  }, [fetchData, key]);

  return { data, isLoading, error, refresh };
}
