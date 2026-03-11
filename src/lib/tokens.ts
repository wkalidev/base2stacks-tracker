// Stacks Clarity Toolkit - Token Helpers (TypeScript)

import { makeContractCall, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

export interface TransferResult {
  txid: string;
  success: boolean;
}

/**
 * Validate transfer params before building a tx
 */
export function validateTransfer(amount: bigint, sender: string, recipient: string): void {
  if (amount <= 0n) throw new Error('Amount must be > 0');
  if (sender === recipient) throw new Error('Sender and recipient must differ');
  if (!sender.startsWith('SP') && !sender.startsWith('ST'))
    throw new Error('Invalid sender address');
  if (!recipient.startsWith('SP') && !recipient.startsWith('ST'))
    throw new Error('Invalid recipient address');
}

/**
 * Format a token amount for display
 * @example formatAmount(1000000n, 6) → "1.000000"
 */
export function formatAmount(amount: bigint, decimals: number = 6): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = (amount % divisor).toString().padStart(decimals, '0');
  return `${whole}.${fraction}`;
}

/**
 * Parse a display amount back to raw bigint
 * @example parseAmount("1.5", 6) → 1500000n
 */
export function parseAmount(display: string, decimals: number = 6): bigint {
  const [whole, fraction = ''] = display.split('.');
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(whole) * BigInt(10 ** decimals) + BigInt(paddedFraction);
}

/**
 * Calculate fee for a transfer
 * @param amount raw token amount
 * @param feeBps fee in basis points (e.g. 30 = 0.3%)
 */
export function calculateFee(amount: bigint, feeBps: number): { net: bigint; fee: bigint } {
  const fee = (amount * BigInt(feeBps)) / 10000n;
  return { net: amount - fee, fee };
}