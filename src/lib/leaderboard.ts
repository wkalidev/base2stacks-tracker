const HIRO_API = 'https://api.mainnet.hiro.so'
const CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'

export async function getTopHolders(limit = 10) {
  const res  = await fetch(
    `${HIRO_API}/extended/v1/tokens/ft/${CONTRACT}.b2s-token/holders?limit=${limit}`
  )
  return res.json()
}

export function getRankEmoji(rank: number): string {
  if (rank === 1) return '👑'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  if (rank <= 10) return '🏆'
  return '⭐'
}

export function getRankLabel(rank: number): string {
  if (rank <= 3)  return 'Legend'
  if (rank <= 10) return 'Elite'
  if (rank <= 50) return 'Pro'
  return 'Member'
}
