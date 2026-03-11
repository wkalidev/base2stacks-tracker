// Stacks Clarity Toolkit - Math Helpers (TypeScript)
// Mirror of toolkit-math.clar for off-chain calculations

/**
 * Safe addition — throws if overflow (> MAX_UINT)
 */
export function safeAdd(a: bigint, b: bigint): bigint {
  const result = a + b;
  if (result < a) throw new Error('Overflow');
  return result;
}

/**
 * Safe subtraction — throws if underflow
 */
export function safeSub(a: bigint, b: bigint): bigint {
  if (b > a) throw new Error('Underflow');
  return a - b;
}

/**
 * Safe multiplication — throws if overflow
 */
export function safeMul(a: bigint, b: bigint): bigint {
  if (a === 0n) return 0n;
  const result = a * b;
  if (result / a !== b) throw new Error('Overflow');
  return result;
}

/**
 * Calculate percentage: amount * percent / 100
 * @example percentage(1000n, 5n) → 50n
 */
export function percentage(amount: bigint, percent: bigint): bigint {
  return (amount * percent) / 100n;
}

/**
 * Calculate basis points: amount * bps / 10000
 * @example basisPoints(10000n, 30n) → 30n  (0.3% fee)
 */
export function basisPoints(amount: bigint, bps: bigint): bigint {
  return (amount * bps) / 10000n;
}

/**
 * Calculate transfer amount and fee
 * @returns { net, fee }
 */
export function amountAfterFee(amount: bigint, feeBps: bigint): { net: bigint; fee: bigint } {
  const fee = basisPoints(amount, feeBps);
  return { net: amount - fee, fee };
}

export const min = (a: bigint, b: bigint): bigint => a <= b ? a : b;
export const max = (a: bigint, b: bigint): bigint => a >= b ? a : b;
export const absDiff = (a: bigint, b: bigint): bigint => a >= b ? a - b : b - a;
export const average = (a: bigint, b: bigint): bigint => (a + b) / 2n;
export const isEven = (n: bigint): boolean => n % 2n === 0n;
export const isOdd  = (n: bigint): boolean => n % 2n === 1n;

/**
 * Clamp value between min and max
 */
export function clamp(value: bigint, minVal: bigint, maxVal: bigint): bigint {
  return max(minVal, min(value, maxVal));
}

/**
 * Linear interpolation — t in [0, 100]
 * @example lerp(0n, 100n, 50n) → 50n
 */
export function lerp(a: bigint, b: bigint, t: bigint): bigint {
  if (t > 100n) throw new Error('t must be in [0, 100]');
  if (b >= a) return a + ((b - a) * t) / 100n;
  return a - ((a - b) * t) / 100n;
}