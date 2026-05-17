/**
 * Block and time utilities for Stacks blockchain
 * Average block time: ~10 minutes (600 seconds)
 */

export const AVG_BLOCK_SECONDS = 600
export const BLOCKS_PER_HOUR = 6
export const BLOCKS_PER_DAY = 144
export const BLOCKS_PER_WEEK = 1008
export const BLOCKS_PER_YEAR = 52_560

export function blocksToSeconds(blocks: number): number {
  return blocks * AVG_BLOCK_SECONDS
}

export function secondsToBlocks(seconds: number): number {
  return Math.ceil(seconds / AVG_BLOCK_SECONDS)
}

export function blocksToDuration(blocks: number): string {
  const secs = blocksToSeconds(blocks)
  const days = Math.floor(secs / 86400)
  const hours = Math.floor((secs % 86400) / 3600)
  const mins = Math.floor((secs % 3600) / 60)
  if (days > 0) return `~${days}d ${hours}h`
  if (hours > 0) return `~${hours}h ${mins}m`
  return `~${mins}m`
}

export function estimateUnlockDate(currentBlock: number, unlockBlock: number): Date {
  const blocksRemaining = Math.max(0, unlockBlock - currentBlock)
  const msRemaining = blocksRemaining * AVG_BLOCK_SECONDS * 1000
  return new Date(Date.now() + msRemaining)
}

export function blocksUntil(currentBlock: number, targetBlock: number): number {
  return Math.max(0, targetBlock - currentBlock)
}
