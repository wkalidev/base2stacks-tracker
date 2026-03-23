export function calcSwapOutput(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps = 25
): number {
  const amountWithFee = amountIn * (10000 - feeBps) / 10000
  return (amountWithFee * reserveOut) / (reserveIn + amountWithFee)
}

export function calcPriceImpact(
  amountIn: number,
  reserveIn: number
): number {
  return (amountIn / reserveIn) * 100
}

export function calcLPTokens(
  amountA: number,
  amountB: number,
  totalLP: number,
  reserveA: number,
  reserveB: number
): number {
  if (totalLP === 0) return Math.sqrt(amountA * amountB)
  return Math.min(
    (amountA * totalLP) / reserveA,
    (amountB * totalLP) / reserveB
  )
}
