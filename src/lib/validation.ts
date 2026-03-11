// Stacks Clarity Toolkit - Validation Helpers (TypeScript)

/**
 * Check if a string is a valid Stacks mainnet address
 */
export function isValidStacksAddress(addr: string): boolean {
  return /^SP[0-9A-Z]{38,39}$/.test(addr) || /^ST[0-9A-Z]{38,39}$/.test(addr);
}

/**
 * Check if value is in range [min, max]
 */
export function isInRange(value: bigint, min: bigint, max: bigint): boolean {
  return value >= min && value <= max;
}

/**
 * Check if string length is within max
 */
export function isValidLength(str: string, maxLen: number): boolean {
  return str.length <= maxLen;
}

/**
 * Check if amount is non-zero
 */
export function isNonZero(value: bigint): boolean {
  return value > 0n;
}

/**
 * Validate a proposal title (max 100 chars, non-empty)
 */
export function isValidProposalTitle(title: string): boolean {
  return title.length > 0 && title.length <= 100;
}