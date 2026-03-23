export const B2S_DECIMALS = 6
export const STX_DECIMALS = 6

export function toMicro(amount: number, decimals = B2S_DECIMALS): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals))
}

export function fromMicro(micro: number | string, decimals = B2S_DECIMALS): number {
  return Number(micro) / 10 ** decimals
}

export function formatToken(amount: number, symbol: string, decimals = 2): string {
  return `${amount.toFixed(decimals)} ${symbol}`
}

export function formatB2S(amount: number): string {
  return formatToken(amount, '$B2S')
}

export function formatSTX(amount: number): string {
  return formatToken(amount, 'STX', 4)
}

// backwards compatibility for toolkit.ts
export function formatAmount(amount: number, decimals = B2S_DECIMALS): string {
  return (amount / 10 ** decimals).toFixed(6)
}

export function parseAmount(amount: string, decimals = B2S_DECIMALS): number {
  return Math.floor(parseFloat(amount) * 10 ** decimals)
}
