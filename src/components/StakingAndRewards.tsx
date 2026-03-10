'use client';

import { useEffect, useState, useCallback } from 'react';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV, PostConditionMode, AnchorMode } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';
import { useWallet } from '@/hooks/useWallet';

const network          = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const STAKING_CONTRACT = 'b2s-staking-vault-v2';
const REWARDS_CONTRACT = 'b2s-rewards-distributor-v3';
const DECIMALS         = 1_000_000;

interface VaultInfo   { amount: number; lockedAt: number; lockBlocks: number; multiplier: number }
interface GlobalStats { totalStaked: number; totalVaults: number; baseApy: number }

async function fetchVault(address: string): Promise<VaultInfo | null> {
  try {
    const result = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: STAKING_CONTRACT, functionName: 'get-vault', functionArgs: [standardPrincipalCV(address)], senderAddress: address });
    const val = cvToJSON(result)?.value?.value;
    if (!val) return null;
    const lockBlocks = Number(val['lock-blocks']?.value || 0);
    return { amount: Number(val.amount?.value || 0) / DECIMALS, lockedAt: Number(val['locked-at']?.value || 0), lockBlocks, multiplier: lockBlocks >= 2100 ? 3 : lockBlocks >= 1050 ? 2 : lockBlocks >= 525 ? 1.5 : 1 };
  } catch { return null; }
}

async function fetchGlobalStats(): Promise<GlobalStats> {
  try {
    const result = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: STAKING_CONTRACT, functionName: 'get-stats', functionArgs: [], senderAddress: CONTRACT_ADDRESS });
    const val = cvToJSON(result)?.value?.value || cvToJSON(result)?.value || {};
    const rawApy = Number(val['base-apy']?.value || val['base-reward-rate']?.value || 0);
    return { totalStaked: Number(val['total-staked']?.value || 0) / DECIMALS, totalVaults: Number(val['total-vaults']?.value || 0), baseApy: rawApy > 0 ? rawApy / 100 : 12.5 };
  } catch { return { totalStaked: 0, totalVaults: 0, baseApy: 12.5 }; }
}

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" };

// ── StakingStats ──────────────────────────────────────────────────────────────
export function StakingStats({ address }: { address: string }) {
  const [vault, setVault]           = useState<VaultInfo | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading]       = useState(true);

  const fetchData = useCallback(async () => {
    if (!address) return;
    try {
      const [v, s] = await Promise.all([fetchVault(address), fetchGlobalStats()]);
      setVault(v); setGlobalStats(s);
    } catch {} finally { setLoading(false); }
  }, [address]);

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 30_000); return () => clearInterval(t); }, [fetchData]);

  const effectiveApy  = globalStats ? globalStats.baseApy * (vault?.multiplier || 1) : 0;
  const dailyRewards  = vault?.amount ? (vault.amount * effectiveApy) / 365 / 100 : 0;
  const multColor     = vault?.multiplier === 3 ? '#ffd700' : vault?.multiplier === 2 ? '#00d4ff' : vault?.multiplier === 1.5 ? '#ff00ff' : '#00ff9f';

  if (loading) return (
    <div style={MONO} className="rounded-2xl border border-white/[0.07] bg-black/50 p-6 animate-pulse">
      <div className="h-4 bg-white/10 rounded w-1/3 mb-4" /><div className="h-4 bg-white/10 rounded w-1/2" />
    </div>
  );

  return (
    <div style={MONO} className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-[#00ff9f]/20 bg-black/60 p-5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff9f]/60 to-transparent" />
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-[#00ff9f] animate-pulse" style={{ boxShadow: '0 0 8px #00ff9f' }} />
          <span className="text-[#00ff9f] text-[10px] tracking-[0.3em] font-black">STAKING_VAULT // LIVE STATS</span>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'YOUR STAKE', val: vault?.amount ? (vault.amount >= 1000 ? `${(vault.amount/1000).toFixed(1)}K` : vault.amount.toFixed(2)) : '0', sub: '$B2S', color: '#00ff9f' },
            { label: 'DAILY YIELD', val: dailyRewards > 0 ? dailyRewards.toFixed(4) : '—', sub: '$B2S/day', color: '#00d4ff' },
            { label: vault?.multiplier && vault.multiplier > 1 ? 'EFF. APY' : 'BASE APY', val: globalStats ? `${effectiveApy.toFixed(1)}%` : '—', sub: `base: ${globalStats?.baseApy.toFixed(1) || 12.5}%`, color: '#ffd700' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-white/25 text-[9px] tracking-widest mb-1">{s.label}</p>
              <p className="text-xl font-black tabular-nums" style={{ color: s.color, textShadow: `0 0 12px ${s.color}50` }}>{s.val}</p>
              <p className="text-white/20 text-[9px] mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {vault?.multiplier && vault.multiplier > 1 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: `${multColor}08`, border: `1px solid ${multColor}20` }}>
            <span style={{ color: multColor }}>💎</span>
            <p className="text-[10px] font-black tracking-wider" style={{ color: multColor }}>{vault.multiplier}x LOCK MULTIPLIER ACTIVE</p>
          </div>
        )}

        {globalStats && (globalStats.totalStaked > 0 || globalStats.totalVaults > 0) && (
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-between text-[10px] font-mono text-white/25">
            <span>TOTAL_STAKED: <span className="text-white/50">{globalStats.totalStaked >= 1000 ? `${(globalStats.totalStaked/1000).toFixed(1)}K` : globalStats.totalStaked.toFixed(0)} $B2S</span></span>
            <span>STAKERS: <span className="text-white/50">{globalStats.totalVaults}</span></span>
            <a href={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${STAKING_CONTRACT}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
              className="hover:text-[#00ff9f] transition-colors" style={{ color: '#00ff9f' }}>EXPLORER ↗</a>
          </div>
        )}

        {!vault?.amount && (
          <div className="mt-4 px-4 py-3 rounded-xl border border-[#00d4ff]/20 bg-[#00d4ff]/[0.05]">
            <p className="text-[10px] font-mono" style={{ color: 'rgba(0,212,255,0.7)' }}>
              {'>'} STAKE $B2S TO START EARNING — UP TO {globalStats ? `${(globalStats.baseApy * 3).toFixed(0)}%` : '37.5%'} APY WITH MAX LOCK<span className="animate-pulse">_</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── RewardsDistributor ────────────────────────────────────────────────────────
export default function RewardsDistributor() {
  const { address, isConnected } = useWallet();
  const [stakedAmount, setStakedAmount]     = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [totalEarned, setTotalEarned]       = useState(0);
  const [stakeInput, setStakeInput]         = useState('');
  const [loading, setLoading]               = useState(false);
  const [txId, setTxId]                     = useState<string | null>(null);
  const [txType, setTxType]                 = useState('');

  const fetchStakerInfo = useCallback(async () => {
    if (!address) return;
    try {
      const infoResult = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: REWARDS_CONTRACT, functionName: 'get-staker-info', functionArgs: [standardPrincipalCV(address)], senderAddress: address });
      const info = cvToJSON(infoResult);
      if (info.value) { setStakedAmount(Number(info.value['staked-amount']?.value || 0) / DECIMALS); setTotalEarned(Number(info.value['total-rewards-earned']?.value || 0) / DECIMALS); }
      const rr = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: REWARDS_CONTRACT, functionName: 'get-pending-rewards', functionArgs: [standardPrincipalCV(address)], senderAddress: address });
      setPendingRewards(Number(cvToJSON(rr).value?.value || 0) / DECIMALS);
    } catch {}
  }, [address]);

  useEffect(() => { if (address && isConnected) fetchStakerInfo(); }, [address, isConnected, fetchStakerInfo]);

  const callContract = async (functionName: string, args: any[], type: string) => {
    if (!address) return;
    setLoading(true); setTxId(null); setTxType(type);
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: REWARDS_CONTRACT,
        functionName, functionArgs: args,
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (d) => { setTxId(d.txId); setStakeInput(''); setLoading(false); setTimeout(fetchStakerInfo, 5000); },
        onCancel: () => setLoading(false),
      });
    } catch { setLoading(false); }
  };

  if (!isConnected) return (
    <div style={MONO} className="rounded-2xl border border-white/[0.07] bg-black/50 p-10 text-center">
      <p className="text-4xl mb-3">💰</p>
      <p className="text-white font-black tracking-widest">WALLET_NOT_CONNECTED</p>
      <p className="text-white/25 text-xs mt-1">Connect to access rewards distribution</p>
    </div>
  );

  const canUnstake = !!stakeInput && parseFloat(stakeInput) <= stakedAmount;

  return (
    <div style={MONO} className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#ffd700]/20 bg-black/70 p-5">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,215,0,0.01) 3px,rgba(255,215,0,0.01) 4px)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ffd700]/60 to-transparent" />
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#ffd700] animate-pulse" style={{ boxShadow: '0 0 8px #ffd700' }} />
          <span className="text-[#ffd700] text-[10px] tracking-[0.3em] font-black">REWARDS DISTRIBUTOR // 12.5% APY</span>
        </div>
        <h2 className="text-2xl font-black text-white">STAKING REWARDS</h2>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'STAKED',        val: `${stakedAmount.toFixed(2)}`,   sub: '$B2S',     color: '#00d4ff' },
          { label: 'PENDING',       val: `${pendingRewards.toFixed(6)}`, sub: '$B2S',     color: '#00ff9f' },
          { label: 'TOTAL EARNED',  val: `${totalEarned.toFixed(2)}`,    sub: '$B2S all', color: '#ff00ff' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
            <p className="text-white/25 text-[9px] tracking-widest mb-1">{s.label}</p>
            <p className="font-black text-lg tabular-nums" style={{ color: s.color, textShadow: `0 0 10px ${s.color}50` }}>{s.val}</p>
            <p className="text-white/20 text-[9px]">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Claim button */}
      <button
        onClick={() => callContract('claim-rewards', [], 'Claim')}
        disabled={loading || pendingRewards === 0}
        className="w-full py-3 rounded-xl text-sm font-black tracking-widest transition-all disabled:opacity-30 hover:opacity-80"
        style={{ background: 'rgba(0,255,159,0.12)', border: '1px solid rgba(0,255,159,0.35)', color: '#00ff9f' }}
      >
        {loading && txType === 'Claim' ? '⏳ CLAIMING...' : `✓ CLAIM ${pendingRewards.toFixed(4)} $B2S`}
      </button>

      {/* Stake/Unstake */}
      <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5 space-y-4">
        <p className="text-white/30 text-[9px] tracking-widest font-black">MANAGE_VAULT</p>

        <div className="relative">
          <input
            type="number" value={stakeInput} onChange={e => setStakeInput(e.target.value)}
            placeholder="0.0" disabled={loading}
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-lg font-black placeholder-white/20 focus:outline-none focus:border-[#00d4ff]/40 transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 text-xs font-black">$B2S</span>
        </div>

        {stakeInput && parseFloat(stakeInput) > stakedAmount && (
          <p className="text-[#ff4444] text-[10px] font-mono tracking-wider">
            ⚠ INSUFFICIENT_BALANCE: max {stakedAmount.toFixed(2)} $B2S
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => callContract('stake', [uintCV(Math.floor(parseFloat(stakeInput) * DECIMALS))], 'Stake')}
            disabled={loading || !stakeInput || parseFloat(stakeInput) <= 0}
            className="flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all disabled:opacity-30 hover:opacity-80"
            style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.35)', color: '#00d4ff' }}>
            {loading && txType === 'Stake' ? '⏳ STAKING...' : '▲ STAKE'}
          </button>
          <button
            onClick={() => callContract('unstake', [uintCV(Math.floor(parseFloat(stakeInput) * DECIMALS))], 'Unstake')}
            disabled={loading || !canUnstake}
            className="flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all disabled:opacity-30 hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}>
            {loading && txType === 'Unstake' ? '⏳ UNSTAKING...' : '▼ UNSTAKE'}
          </button>
        </div>
      </div>

      {txId && (
        <div className="rounded-xl border border-[#00ff9f]/20 bg-[#00ff9f]/[0.05] px-4 py-3">
          <p className="text-[#00ff9f] text-[10px] font-black tracking-widest mb-1">✓ {txType.toUpperCase()}_TX_SUBMITTED</p>
          <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer" className="text-white/30 text-[10px] font-mono hover:text-white/60 break-all">
            VIEW_EXPLORER ↗ {txId.slice(0, 20)}...
          </a>
        </div>
      )}

      <div className="rounded-xl border border-[#00d4ff]/15 bg-[#00d4ff]/[0.04] px-4 py-3">
        <p className="text-[10px] font-mono" style={{ color: 'rgba(0,212,255,0.6)' }}>
          {'>'} Staked tokens earn 12.5% APY. Unstake at any time, no penalties.<span className="animate-pulse">_</span>
        </p>
      </div>
    </div>
  );
}