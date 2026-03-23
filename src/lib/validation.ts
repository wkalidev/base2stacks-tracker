export function isValidStacksAddress(address: string): boolean {
  return /^S[PM][0-9A-Z]{38,39}$/.test(address)
}

export function isValidAmount(amount: string): boolean {
  const n = parseFloat(amount)
  return !isNaN(n) && n > 0
}

export function isValidLockPeriod(blocks: number): boolean {
  return blocks >= 0 && blocks <= 52560
}

export function sanitizeAmount(amount: string): number {
  return Math.max(0, parseFloat(amount) || 0)
}
