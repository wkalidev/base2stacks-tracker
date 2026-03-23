export interface Market {
  id:          number
  question:    string
  category:    string
  yesPool:     number
  noPool:      number
  resolved:    boolean
  outcome?:    boolean
}

export function calcOdds(yesPool: number, noPool: number): { yes: number; no: number } {
  const total = yesPool + noPool
  if (total === 0) return { yes: 50, no: 50 }
  return {
    yes: Math.round((yesPool / total) * 100),
    no:  Math.round((noPool  / total) * 100),
  }
}

export function calcPotentialReturn(
  betAmount: number,
  betPool: number,
  totalPool: number
): number {
  if (betPool === 0) return 0
  return (betAmount / betPool) * totalPool * 0.975 // 2.5% fee
}
