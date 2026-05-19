type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL_MS = 60_000;

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCache(key?: string): void {
  if (key) {
    cache.delete(key);
    return;
  }
  cache.clear();
}

export async function fetchWithCache<T>(
  key: string,
  url: string,
  options?: { ttlMs?: number; init?: RequestInit }
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) return cached;

  const response = await fetch(url, options?.init);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  const data = (await response.json()) as T;
  setCached(key, data, options?.ttlMs);
  return data;
}
