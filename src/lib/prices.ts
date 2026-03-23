const COINGECKO = 'https://api.coingecko.com/api/v3'

export async function getSTXPrice(): Promise<number> {
  try {
    const res  = await fetch(`${COINGECKO}/simple/price?ids=blockstack&vs_currencies=usd`)
    const data = await res.json()
    return data.blockstack?.usd || 0
  } catch { return 0 }
}

export async function getBTCPrice(): Promise<number> {
  try {
    const res  = await fetch(`${COINGECKO}/simple/price?ids=bitcoin&vs_currencies=usd`)
    const data = await res.json()
    return data.bitcoin?.usd || 0
  } catch { return 0 }
}

export function calcUSDValue(amount: number, price: number): number {
  return amount * price
}
