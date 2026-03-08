'use client';

import { useEffect, useState, useCallback } from 'react';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';

interface StakingStatsProps {
  address: string;
}

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const STAKING_CONTRACT = 'b2s-staking-vault-v2';
const DECIMALS = 1_000_000;

interface VaultInfo {
  amount: number;
  lockedAt: number;
  lockBlocks: number;
  multiplier: number;
}

interface GlobalStats {
  totalStaked: number;
  totalVaults: number;
  baseApy: number;
}

async function fetchVault(address: string): Promise<VaultInfo | null> {
  try {
    const result = await callReadOnlyFunction({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: STAKING_CONTRACT,
      functionName: 'get-vault',
      functionArgs: [standardPrincipalCV(address)],
      senderAddress: address,
    });
    const json = cvToJSON(result);
    const val = json?.value?.value;
    if (!val) return null;

    const amount = Number(val.amount?.value || 0) / DECIMALS;
    const lockedAt = Number(val['locked-at']?.value || 0);
    const lockBlocks = Number(val['lock-blocks']?.value || 0);

    // Multiplier logic matching contract:
    // >= 2100 blocks (~14 days) → 3x
    // >= 1050 blocks (~7 days)  → 2x
    // >= 525 blocks (~3.5 days) → 1.5x
    // else                      → 1x
    const multiplier =
      lockBlocks >= 2100 ? 3 :
      lockBlocks >= 1050 ? 2 :
      lockBlocks >= 525  ? 1.5 : 1;

    return { amount, lockedAt, lockBlocks, multiplier };
  } catch {
    return null;
  }
}

async function fetchGlobalStats(): Promise<GlobalStats> {
  try {
    const result = await callReadOnlyFunction({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName: STAKING_CONTRACT,
      functionName: 'get-stats',
      functionArgs: [],
      senderAddress: CONTRACT_ADDRESS,
    });
    const json = cvToJSON(result);
    const val = json?.value?.value || json?.value || {};

    // base-apy stored as basis points (e.g. 1250 = 12.5%)
    const rawApy = Number(val['base-apy']?.value || val['base-reward-rate']?.value || 0);
    const baseApy = rawApy > 0 ? rawApy / 100 : 12.5;

    return {
      totalStaked: Number(val['total-staked']?.value || 0) / DECIMALS,
      totalVaults: Number(val['total-vaults']?.value || 0),
      baseApy,
    };
  } catch {
    return { totalStaked: 0, totalVaults: 0, baseApy: 12.5 };
  }
}

export function StakingStats({ address }: StakingStatsProps) {
  const [vault, setVault] = useState<VaultInfo | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!address) return;
    try {
      const [vaultData, stats] = await Promise.all([
        fetchVault(address),
        fetchGlobalStats(),
      ]);
      setVault(vaultData);
      setGlobalStats(stats);
    } catch (error) {
      console.error('Error fetching staking stats:', error);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const effectiveApy = globalStats
    ? globalStats.baseApy * (vault?.multiplier || 1)
    : 0;

  const dailyRewards = vault?.amount
    ? (vault.amount * effectiveApy) / 365 / 100
    : 0;

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-xl p-6 border border-blue-500/20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Staked amount */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">Your Staked</p>
          <p className="text-3xl font-bold text-white">
            {vault?.amount
              ? vault.amount >= 1000
                ? `${(vault.amount / 1000).toFixed(1)}K`
                : vault.amount.toFixed(2)
              : '0'}
          </p>
          <p className="text-white/40 text-xs">$B2S</p>
          {vault?.multiplier && vault.multiplier > 1 && (
            <p className="text-yellow-400 text-xs mt-1 font-semibold">
              {vault.multiplier}x lock multiplier
            </p>
          )}
        </div>

        {/* Daily rewards */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">Daily Rewards</p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            {dailyRewards > 0 ? dailyRewards.toFixed(4) : '—'}
          </p>
          <p className="text-white/40 text-xs">$B2S per day</p>
        </div>

        {/* APY */}
        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">
            {vault?.multiplier && vault.multiplier > 1 ? 'Effective APY' : 'Base APY'}
          </p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            {globalStats ? `${effectiveApy.toFixed(1)}%` : '—'}
          </p>
          <p className="text-white/40 text-xs">
            {globalStats ? `Base: ${globalStats.baseApy.toFixed(1)}%` : 'Annual yield'}
          </p>
        </div>
      </div>

      {/* Global stats footer */}
      {globalStats && (globalStats.totalStaked > 0 || globalStats.totalVaults > 0) && (
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs text-white/40">
          <span>
            Total staked:{' '}
            <span className="text-white/60">
              {globalStats.totalStaked >= 1_000_000
                ? `${(globalStats.totalStaked / 1_000_000).toFixed(1)}M`
                : globalStats.totalStaked >= 1000
                ? `${(globalStats.totalStaked / 1000).toFixed(1)}K`
                : globalStats.totalStaked.toFixed(0)}{' '}
              $B2S
            </span>
          </span>
          <span>
            Stakers: <span className="text-white/60">{globalStats.totalVaults}</span>
          </span>
          <a
            href={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${STAKING_CONTRACT}?chain=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:underline"
          >
            Explorer ↗
          </a>
        </div>
      )}

      {/* No stake CTA */}
      {!vault?.amount && (
        <div className="mt-4 p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded text-white/80 text-sm">
          💡 <strong>Tip:</strong> Stake your $B2S tokens to start earning — up to{' '}
          {globalStats ? `${(globalStats.baseApy * 3).toFixed(0)}%` : '37.5%'} APY with max lock!
        </div>
      )}
    </div>
  );
}