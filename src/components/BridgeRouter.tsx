'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const FEE_ROUTER_CONTRACT = 'b2s-fee-router';
const DECIMALS = 1_000_000;

interface BridgeStats {
  totalVolume: number;
  totalFees: number;
  bridgeCount: number;
  feeBps: number;
  loading: boolean;
}

interface UserStats {
  bridgeCount: number;
  volume: number;
}

const CHAINS = [
  { chain: 'Ethereum', icon: '⟠', color: 'from-blue-500/20 to-indigo-500/20', border: 'border-blue-500/30' },
  { chain: 'Base',     icon: '🔵', color: 'from-blue-400/20 to-cyan-500/20',   border: 'border-cyan-500/30' },
  { chain: 'BNB',      icon: '🟡', color: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30' },
  { chain: 'Polygon',  icon: '💜', color: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30' },
];



export default function BridgeRouter() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'bridge' | 'record' | 'stats'>('bridge');
  const [recordAmount, setRecordAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [stats, setStats] = useState<BridgeStats>({
    totalVolume: 0, totalFees: 0, bridgeCount: 0, feeBps: 30, loading: true,
  });
  const [userStats, setUserStats] = useState<UserStats>({ bridgeCount: 0, volume: 0 });

  // Fetch contract stats
  const fetchStats = useCallback(async () => {
    try {
      const sender = address || CONTRACT_ADDRESS;
      const result = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: FEE_ROUTER_CONTRACT,
        functionName: 'get-stats',
        functionArgs: [],
        senderAddress: sender,
      });
      const data = cvToJSON(result).value;
      setStats({
        totalVolume:  Number(data['total-volume']?.value  || 0) / DECIMALS,
        totalFees:    Number(data['total-fees']?.value    || 0) / DECIMALS,
        bridgeCount:  Number(data['bridge-count']?.value  || 0),
        feeBps:       Number(data['fee-bps']?.value       || 30),
        loading: false,
      });
    } catch {
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [address]);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    if (!address) return;
    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: FEE_ROUTER_CONTRACT,
        functionName: 'get-user-stats',
        functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      });
      const data = cvToJSON(result).value;
      setUserStats({
        bridgeCount: Number(data['bridge-count']?.value || 0),
        volume:      Number(data.volume?.value          || 0) / DECIMALS,
      });
    } catch {}
  }, [address]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  useEffect(() => {
    if (address) fetchUserStats();
  }, [address, fetchUserStats]);

  // Calculate fee preview
  const feePreview = recordAmount
    ? ((parseFloat(recordAmount) * stats.feeBps) / 10000).toFixed(4)
    : '0';
  const netPreview = recordAmount
    ? (parseFloat(recordAmount) - parseFloat(feePreview)).toFixed(4)
    : '0';

  // Record a bridge transaction
  const handleRecordBridge = async () => {
    if (!address || !recordAmount || parseFloat(recordAmount) <= 0) return;
    setLoading(true);
    setTxId(null);
    try {
      const microAmount = Math.floor(parseFloat(recordAmount) * DECIMALS);
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: FEE_ROUTER_CONTRACT,
        functionName: 'record-bridge',
        functionArgs: [uintCV(microAmount)],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId);
          setRecordAmount('');
          setLoading(false);
          setTimeout(() => { fetchStats(); fetchUserStats(); }, 5000);
        },
        onCancel: () => setLoading(false),
      });
    } catch (err) {
      console.error('Bridge record error:', err);
      setLoading(false);
    }
  };

  return (
    <div className="bridge-router">

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🌉 Cross-Chain Bridge</h2>
        <p className="text-white/60">Bridge assets to Stacks — 0.{stats.feeBps}% fee supports the ecosystem</p>
      </div>

      {/* Live Revenue Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Volume',   value: stats.loading ? '...' : `${stats.totalVolume.toLocaleString()} STX`, emoji: '📊', color: 'from-blue-500/20 to-cyan-500/20',     border: 'border-blue-500/30' },
          { label: 'Fees Collected', value: stats.loading ? '...' : `${stats.totalFees.toFixed(4)} STX`,         emoji: '💰', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
          { label: 'Total Bridges',  value: stats.loading ? '...' : stats.bridgeCount.toString(),                emoji: '🌉', color: 'from-purple-500/20 to-pink-500/20',   border: 'border-purple-500/30' },
          { label: 'Fee Rate',       value: `${(stats.feeBps / 100).toFixed(1)}%`,                               emoji: '⚡', color: 'from-orange-500/20 to-red-500/20',    border: 'border-orange-500/30' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-lg p-4 border ${s.border} text-center`}>
            <div className="text-2xl mb-1">{s.emoji}</div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-white/50 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Supported Chains */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {CHAINS.map(c => (
          <div key={c.chain} className={`bg-gradient-to-br ${c.color} rounded-lg p-4 border ${c.border} text-center`}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <p className="text-white font-semibold text-sm">{c.chain}</p>
            <p className="text-white/50 text-xs">Supported</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        {([
          { key: 'bridge', label: '🌉 Bridge' },
          { key: 'record', label: '📝 Record Bridge' },
          { key: 'stats',  label: '📊 My Stats' },
        ] as const).map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`pb-3 px-4 font-semibold transition-all ${activeTab === tab.key ? 'text-white border-b-2 border-blue-500' : 'text-white/60 hover:text-white'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Bridge (Jumper iframe) */}
      {activeTab === 'bridge' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { step: '1', title: 'Select Source', desc: 'Choose your chain and token', icon: '🔗' },
              { step: '2', title: 'Bridge',        desc: 'Best route via 20+ bridges',  icon: '🌉' },
              { step: '3', title: 'Receive',       desc: 'Get USDCx or STX on Stacks', icon: '💎' },
            ].map(s => (
              <div key={s.step} className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                <div className="text-3xl mb-2">{s.icon}</div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-sm font-bold text-white">{s.step}</span>
                </div>
                <h4 className="text-white font-semibold mb-1">{s.title}</h4>
                <p className="text-white/60 text-xs">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[
              { name: 'Stargate',      url: 'https://stargate.finance',              desc: 'Best rates across 20+ chains',    icon: '🚀', recommended: true },
              { name: 'deBridge',      url: 'https://app.debridge.com/r/32893',      desc: 'Fast cross-chain transfers',      icon: '🌉', recommended: false },
              { name: 'Across',        url: 'https://across.to',                     desc: 'Fast & cheap bridging',           icon: '💨', recommended: false },
              { name: 'Celer cBridge', url: 'https://cbridge.celer.network',         desc: 'Multi-chain bridge',              icon: '🔗', recommended: false },
              { name: 'Orbiter',       url: 'https://www.orbiter.finance',           desc: 'ZK-powered bridge',               icon: '🔮', recommended: false },
              { name: 'Rango',         url: 'https://rango.vip/a/o9pwCm',            desc: 'Cross-chain DEX aggregator',      icon: '⚡', recommended: false },
              { name: 'Jupiter Swap',  url: 'https://jup.ag/?ref=j5ft3v5m26eu',      desc: 'Swap 1000+ tokens sur Solana',    icon: '☀️', recommended: false },
            ].map(b => (
              <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer"
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.02] ${
                  b.recommended
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/40 hover:border-blue-400'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}>
                <div className="text-3xl">{b.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{b.name}</span>
                    {b.recommended && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/30 text-blue-300 font-semibold">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-white/50 text-xs">{b.desc}</p>
                </div>
                <span className="text-white/40 text-sm">↗</span>
              </a>
            ))}
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-white/70">
            💡 <span className="text-white font-semibold">Tip:</span> After bridging, come back and use the <span className="text-blue-400">Record Bridge</span> tab to log your transaction and support the ecosystem.
          </div>
        </div>
      )}

      {/* Tab: Record Bridge */}
      {activeTab === 'record' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 mb-4">
            <h3 className="text-xl font-bold text-white mb-2">📝 Record Your Bridge</h3>
            <p className="text-white/50 text-sm mb-6">
              Already bridged via an external bridge? Record it here to support the ecosystem.
              A small {(stats.feeBps / 100).toFixed(1)}% fee goes to the treasury and stakers.
            </p>

            <div className="mb-4">
              <label className="text-white/70 text-sm mb-2 block">Bridge Amount (STX)</label>
              <input
                type="number"
                value={recordAmount}
                onChange={e => setRecordAmount(e.target.value)}
                placeholder="Enter STX amount bridged"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Fee breakdown */}
            {recordAmount && parseFloat(recordAmount) > 0 && (
              <div className="p-4 bg-white/5 rounded-lg space-y-2 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-white/60">Bridge amount</span>
                  <span className="text-white">{parseFloat(recordAmount).toFixed(4)} STX</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Fee ({(stats.feeBps / 100).toFixed(1)}%)</span>
                  <span className="text-yellow-400">-{feePreview} STX</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-semibold">
                  <span className="text-white/80">You pay</span>
                  <span className="text-white">{feePreview} STX</span>
                </div>
                <div className="flex justify-between text-xs text-white/40">
                  <span>50% → Treasury</span>
                  <span>50% → Stakers</span>
                </div>
              </div>
            )}

            {!isConnected ? (
              <div className="text-center py-4 text-white/50">
                Connect your wallet to record bridges
              </div>
            ) : (
              <button
                onClick={handleRecordBridge}
                disabled={!recordAmount || parseFloat(recordAmount) <= 0 || loading}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-all"
              >
                {loading ? '⏳ Recording...' : '🌉 Record Bridge'}
              </button>
            )}

            {txId && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                <p className="text-green-400 font-semibold mb-1">✅ Bridge recorded!</p>
                <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                  className="text-blue-400 hover:underline break-all">
                  View on Explorer ↗
                </a>
              </div>
            )}
          </div>

          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl text-sm text-white/70">
            💡 <span className="font-semibold text-white">How fees work:</span> 50% goes to the B2S treasury for development, 50% is distributed to $B2S stakers as rewards.
          </div>
        </div>
      )}

      {/* Tab: My Stats */}
      {activeTab === 'stats' && (
        <div className="max-w-lg mx-auto">
          {!isConnected ? (
            <div className="bg-white/5 rounded-xl p-8 border border-white/10 text-center">
              <p className="text-white/50">Connect your wallet to see your stats</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-500/30">
                <h3 className="text-white font-bold text-xl mb-4">Your Bridge Activity</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{userStats.bridgeCount}</p>
                    <p className="text-white/50 text-sm">Bridges</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{userStats.volume.toLocaleString()}</p>
                    <p className="text-white/50 text-sm">STX Volume</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-white font-bold mb-4">Global Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Total bridges</span>
                    <span className="text-white font-semibold">{stats.bridgeCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Total volume</span>
                    <span className="text-white font-semibold">{stats.totalVolume.toLocaleString()} STX</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Total fees collected</span>
                    <span className="text-green-400 font-semibold">{stats.totalFees.toFixed(4)} STX</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Current fee rate</span>
                    <span className="text-white font-semibold">{(stats.feeBps / 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <a
                href={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${FEE_ROUTER_CONTRACT}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-blue-400 hover:underline text-sm"
              >
                View contract on Explorer ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}