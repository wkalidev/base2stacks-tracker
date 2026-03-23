import { getCache, setCache } from './cache'

export async function cachedFetch<T>(
  url: string,
  ttlMs = 30000
): Promise<T> {
  const cached = getCache<T>(url)
  if (cached) return cached
  const res  = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  setCache(url, data, ttlMs)
  return data
}

export async function fetchWithTimeout<T>(
  url: string,
  timeoutMs = 5000
): Promise<T> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res.json()
  } finally {
    clearTimeout(id)
  }
}
