export function calcAmountOut(
  amountIn: number,
  reserveIn: number,
  reserveOut: number,
  feeBps = 25
): number {
  if (reserveIn === 0 || reserveOut === 0) return 0
  const amountWithFee = amountIn * (10000 - feeBps) / 10000
  return (amountWithFee * reserveOut) / (reserveIn + amountWithFee)
}

export function calcMinAmountOut(amount: number, slippagePct: number): number {
  return amount * (1 - slippagePct / 100)
}

export function calcPriceImpact(amountIn: number, reserveIn: number): number {
  if (reserveIn === 0) return 0
  return (amountIn / reserveIn) * 100
}

export function calcSpotPrice(reserveA: number, reserveB: number): number {
  if (reserveB === 0) return 0
  return reserveA / reserveB
}
