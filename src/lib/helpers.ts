export const MICRO_UNITS = 1_000_000n

export function toMicroUnits(amount: number): bigint {
  if (!isFinite(amount) || amount < 0) throw new RangeError(`Invalid amount: ${amount}`)
  return BigInt(Math.round(amount * Number(MICRO_UNITS)))
}

export function fromMicroUnits(micro: bigint): number {
  return Number(micro) / Number(MICRO_UNITS)
}

export function formatB2S(micro: bigint, decimals = 6): string {
  return `${fromMicroUnits(micro).toFixed(decimals)} B2S`
}

export function calcSwapOutput(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeBps = 25n
): { amountOut: bigint; fee: bigint; priceImpact: number } {
  if (reserveIn === 0n || reserveOut === 0n) throw new Error('Empty pool')
  const amountInWithFee = amountIn * (10_000n - feeBps)
  const numerator = amountInWithFee * reserveOut
  const denominator = reserveIn * 10_000n + amountInWithFee
  const amountOut = numerator / denominator
  const fee = (amountIn * feeBps) / 10_000n
  const priceBefore = Number(reserveOut) / Number(reserveIn)
  const priceAfter = Number(reserveOut - amountOut) / Number(reserveIn + amountIn)
  const priceImpact = Math.abs((priceAfter - priceBefore) / priceBefore) * 100
  return { amountOut, fee, priceImpact }
}

export function calcEffectiveApy(lockBlocks: number): number {
  if (lockBlocks >= 2100) return 37.5
  if (lockBlocks >= 1050) return 25
  if (lockBlocks >= 525)  return 18.75
  return 12.5
}

export function calcBridgeFee(amountMicro: bigint) {
  const totalFeeMicro = (amountMicro * 30n) / 10_000n
  const toTreasury = totalFeeMicro / 2n
  const toStakers = totalFeeMicro - toTreasury
  return { totalFeeMicro, toTreasury, toStakers, feeRateBps: 30 }
}

export function isValidStacksAddress(address: string): boolean {
  return /^S[PM][0-9A-Z]{30,33}$/.test(address)
}

export function truncateAddress(address: string, start = 6, end = 3): string {
  if (address.length <= start + end + 3) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function blocksToDuration(blocks: number): string {
  const secs = blocks * 600
  const days = Math.floor(secs / 86400)
  const hours = Math.floor((secs % 86400) / 3600)
  if (days > 0) return `~${days}d ${hours}h`
  return `~${hours}h`
}
