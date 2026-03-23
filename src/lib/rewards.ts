export const DAILY_REWARD    = 5
export const BLOCKS_PER_DAY  = 144

export function canClaim(lastClaimBlock: number, currentBlock: number): boolean {
  return currentBlock >= lastClaimBlock + BLOCKS_PER_DAY
}

export function blocksUntilClaim(lastClaimBlock: number, currentBlock: number): number {
  return Math.max(0, lastClaimBlock + BLOCKS_PER_DAY - currentBlock)
}

export function calcTotalEarned(claimCount: number): number {
  return claimCount * DAILY_REWARD
}

export function calcProjectedMonthly(dailyAmount: number): number {
  return dailyAmount * 30
}
