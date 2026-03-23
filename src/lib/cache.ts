const cache = new Map<string, { value: any; expires: number }>()

export function setCache(key: string, value: any, ttlMs = 60000) {
  cache.set(key, { value, expires: Date.now() + ttlMs })
}

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expires) { cache.delete(key); return null }
  return entry.value as T
}

export function clearCache() { cache.clear() }
export function deleteCache(key: string) { cache.delete(key) }
