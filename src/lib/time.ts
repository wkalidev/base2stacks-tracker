export const BLOCKS_PER_DAY  = 144
export const BLOCKS_PER_WEEK = 1008
export const BLOCKS_PER_YEAR = 52560

export function blocksToSeconds(blocks: number): number {
  return blocks * 600 // ~10 min per block
}

export function blocksToHours(blocks: number): number {
  return blocksToSeconds(blocks) / 3600
}

export function blocksToDays(blocks: number): number {
  return blocks / BLOCKS_PER_DAY
}

export function daysToBlocks(days: number): number {
  return Math.floor(days * BLOCKS_PER_DAY)
}

export function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60)   return `${mins}m ago`
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`
  return `${Math.floor(mins / 1440)}d ago`
}
