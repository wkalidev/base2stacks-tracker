export const REFRESH_INTERVALS = {
  price:     30_000,   // 30s
  balance:   30_000,   // 30s
  stats:     60_000,   // 1min
  history:   60_000,   // 1min
  network:   15_000,   // 15s
}

export function formatRefreshInterval(ms: number): string {
  if (ms < 60_000) return `${ms / 1000}s`
  return `${ms / 60_000}min`
}
