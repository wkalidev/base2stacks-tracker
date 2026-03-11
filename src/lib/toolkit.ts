// base2stacks-tracker — Toolkit Integration
// src/lib/toolkit.ts

import { amountAfterFee } from './math';
import { formatAmount, parseAmount } from './tokens';
import { isValidStacksAddress, isInRange, isNonZero } from './validation';

// ============================================================
// Fee calculations
// ============================================================

export function calcBridgeFee(amount: bigint)     { return amountAfterFee(amount, 30n);  }
export function calcSwapFee(amount: bigint)        { return amountAfterFee(amount, 25n);  }
export function calcMarketplaceFee(amount: bigint) { return amountAfterFee(amount, 250n); }
export function calcPredictionFee(amount: bigint)  { return amountAfterFee(amount, 200n); }

// ============================================================
// APY calculations
// ============================================================

const BASE_APY_BPS = 1250n; // 12.5%

export type LockDuration = 'none' | '1w' | '2w' | '1m';

const MULTIPLIERS: Record<LockDuration, bigint> = {
  none: 100n,
  '1w': 150n,
  '2w': 200n,
  '1m': 300n,
};

export function getEffectiveAPY(lock: LockDuration): bigint {
  return (BASE_APY_BPS * MULTIPLIERS[lock]) / 100n;
}

export function estimateRewards(amount: bigint, lock: LockDuration, days: bigint): bigint {
  const apyBps = getEffectiveAPY(lock);
  const dailyBps = apyBps / 365n;
  return (amount * dailyBps * days) / 10000n;
}

// ============================================================
// Display helpers
// ============================================================

export const formatB2S = (raw: bigint) => formatAmount(raw, 6);
export const formatSTX = (raw: bigint) => formatAmount(raw, 6);
export const parseB2S  = (display: string) => parseAmount(display, 6);

// ============================================================
// Validation
// ============================================================

export { isValidStacksAddress, isInRange, isNonZero };

export function isValidStakeAmount(amount: bigint): boolean {
  return isInRange(amount, 1_000_000n, 100_000_000_000_000n);
}

export function meetsGovernanceMinimum(stakedAmount: bigint): boolean {
  return stakedAmount >= 10_000_000_000n; // 10,000 B2S
}