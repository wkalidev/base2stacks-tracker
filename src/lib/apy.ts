export const BASE_APY        = 12.5
export const MULTIPLIER_1W   = 1.5
export const MULTIPLIER_2W   = 2.0
export const MULTIPLIER_1M   = 3.0
export const BLOCKS_PER_YEAR = 52560

export function getAPY(lockBlocks: number): number {
  if (lockBlocks >= 2100) return BASE_APY * MULTIPLIER_1M
  if (lockBlocks >= 1050) return BASE_APY * MULTIPLIER_2W
  if (lockBlocks >= 525)  return BASE_APY * MULTIPLIER_1W
  return BASE_APY
}

export function calcDailyRewards(amount: number, lockBlocks = 0): number {
  return amount * getAPY(lockBlocks) / 100 / 365
}

export function calcMonthlyRewards(amount: number, lockBlocks = 0): number {
  return amount * getAPY(lockBlocks) / 100 / 12
}

export function calcYearlyRewards(amount: number, lockBlocks = 0): number {
  return amount * getAPY(lockBlocks) / 100
}
