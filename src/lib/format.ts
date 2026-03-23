export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

export function formatSTX(n: number): string {
  return `${n.toFixed(4)} STX`
}

export function formatB2S(n: number): string {
  return `${n.toFixed(2)} $B2S`
}

export function formatAddress(addr: string): string {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString()
}

export function formatAPY(apy: number): string {
  return `${apy.toFixed(1)}%`
}
