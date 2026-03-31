interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Get cached data or fetch fresh. Skips cache read (but still writes) when
 * bypass is true. Never caches if the key contains today's date.
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; bypass?: boolean }
): Promise<T> {
  const ttl = options?.ttl ?? DEFAULT_TTL;
  const bypass = options?.bypass ?? false;

  // Never cache today's date — check if key contains today's YYYY-MM-DD
  const today = new Date().toISOString().slice(0, 10);
  const isToday = key.includes(today);

  if (!bypass && !isToday) {
    const cached = store.get(key) as CacheEntry<T> | undefined;
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
  }

  const data = await fetcher();

  if (!isToday) {
    store.set(key, { data, timestamp: Date.now() });
  }

  return data;
}

/** Clear all cached entries. Useful for testing. */
export function clearCache(): void {
  store.clear();
}
