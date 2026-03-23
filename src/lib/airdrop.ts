const CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const HIRO_API = 'https://api.mainnet.hiro.so'

export async function checkAirdropEligibility(address: string): Promise<boolean> {
  try {
    const res  = await fetch(
      `${HIRO_API}/extended/v1/address/${address}/transactions?limit=1`
    )
    const data = await res.json()
    return (data.total || 0) > 0
  } catch { return false }
}

export function getAirdropAmount(txCount: number): number {
  if (txCount >= 100) return 500
  if (txCount >= 50)  return 250
  if (txCount >= 10)  return 100
  return 50
}
