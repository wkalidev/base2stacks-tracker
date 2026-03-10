'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { callReadOnlyFunction, cvToJSON, uintCV, boolCV, standardPrincipalCV, PostConditionMode, AnchorMode } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const CONTRACT_NAME = 'b2s-prediction-market';

const SEED_MARKETS = [
  { id: 1,  question: 'Will Bitcoin reach $120,000 before end of Q2 2026?',            category: 'price',      deadline: 999999, resolved: false, outcome: false, totalYes: 3200, totalNo: 1800 },
  { id: 2,  question: 'Will Stacks TVL exceed $500M in 2026?',                          category: 'stacks',     deadline: 999999, resolved: false, outcome: false, totalYes: 2100, totalNo: 900  },
  { id: 3,  question: 'Will B2S governance proposal #1 pass?',                          category: 'governance', deadline: 999999, resolved: false, outcome: false, totalYes: 1500, totalNo: 500  },
  { id: 4,  question: '🚨 Will a major CEX halt withdrawals in 2026?',                  category: 'crisis',     deadline: 999999, resolved: false, outcome: false, totalYes: 800,  totalNo: 4200 },
  { id: 5,  question: 'Will STX outperform ETH in Q2 2026?',                            category: 'price',      deadline: 999999, resolved: false, outcome: false, totalYes: 2800, totalNo: 2200 },
  { id: 6,  question: 'Will Solana flip Ethereum in market cap by end of 2026?',        category: 'price',      deadline: 999999, resolved: false, outcome: false, totalYes: 1200, totalNo: 3800 },
  { id: 7,  question: 'Will the US approve a Spot ETH ETF staking by Q3 2026?',        category: 'regulation', deadline: 999999, resolved: false, outcome: false, totalYes: 2600, totalNo: 1400 },
  { id: 8,  question: 'Will Base chain surpass Ethereum L1 in daily transactions?',     category: 'stacks',     deadline: 999999, resolved: false, outcome: false, totalYes: 3100, totalNo: 1900 },
  { id: 9,  question: 'Will DeFi total TVL exceed $200B in 2026?',                      category: 'defi',       deadline: 999999, resolved: false, outcome: false, totalYes: 2900, totalNo: 2100 },
  { id: 10, question: 'Will B2S token reach $1 market price in 2026?',                 category: 'b2s',        deadline: 999999, resolved: false, outcome: false, totalYes: 4100, totalNo: 900  },
  { id: 11, question: 'Will a nation-state add Bitcoin to its treasury reserves?',      category: 'macro',      deadline: 999999, resolved: false, outcome: false, totalYes: 3500, totalNo: 1500 },
  { id: 12, question: 'Will Stacks implement full EVM compatibility by end of 2026?',   category: 'stacks',     deadline: 999999, resolved: false, outcome: false, totalYes: 1800, totalNo: 2200 },
];

const CATEGORY_META: Record<string, { emoji: string; label: string; gradient: string; glow: string; border: string }> = {
  price:      { emoji: '📈', label: 'Price',      gradient: 'from-emerald-900/40 to-teal-900/40',    glow: 'shadow-emerald-500/10',   border: 'border-emerald-500/20' },
  stacks:     { emoji: '🟠', label: 'Stacks',     gradient: 'from-orange-900/40 to-amber-900/40',    glow: 'shadow-orange-500/10',    border: 'border-orange-500/20'  },
  governance: { emoji: '🏛️', label: 'Governance', gradient: 'from-violet-900/40 to-purple-900/40',   glow: 'shadow-violet-500/10',    border: 'border-violet-500/20'  },
  sport:      { emoji: '⚽', label: 'Sport',      gradient: 'from-blue-900/40 to-sky-900/40',        glow: 'shadow-blue-500/10',      border: 'border-blue-500/20'    },
  crisis:     { emoji: '🚨', label: 'Crisis',     gradient: 'from-red-900/40 to-rose-900/40',        glow: 'shadow-red-500/10',       border: 'border-red-500/20'     },
  regulation: { emoji: '⚖️', label: 'Regulation', gradient: 'from-yellow-900/40 to-lime-900/40',     glow: 'shadow-yellow-500/10',    border: 'border-yellow-500/20'  },
  defi:       { emoji: '💧', label: 'DeFi',       gradient: 'from-cyan-900/40 to-blue-900/40',       glow: 'shadow-cyan-500/10',      border: 'border-cyan-500/20'    },
  b2s:        { emoji: '💎', label: 'B2S',        gradient: 'from-indigo-900/40 to-violet-900/40',   glow: 'shadow-indigo-500/10',    border: 'border-indigo-500/20'  },
  macro:      { emoji: '🌍', label: 'Macro',      gradient: 'from-slate-800/60 to-gray-900/60',      glow: 'shadow-slate-500/10',     border: 'border-slate-500/20'   },
};

interface Market {
  id: number;
  question: string;
  category: string;
  deadline: number;
  resolved: boolean;
  outcome: boolean;
  totalYes: number;
  totalNo: number;
}

function OddsBar({ yes, no, totalYes, totalNo }: { yes: number; no: number; totalYes: number; totalNo: number }) {
  const total = totalYes + totalNo;
  return (
    <div className="mb-5">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-black text-lg tabular-nums">{yes}%</span>
          <span className="text-white/40 text-xs">YES</span>
        </div>
        <div className="text-center">
          <span className="text-white/30 text-xs tabular-nums">{total.toLocaleString()} $B2S pool</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">NO</span>
          <span className="text-red-400 font-black text-lg tabular-nums">{no}%</span>
        </div>
      </div>
      <div className="relative w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
          style={{ width: `${yes}%` }}
        />
        <div className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }} />
      </div>
      <div className="flex justify-between mt-1.5 text-xs text-white/20 tabular-nums">
        <span>{totalYes.toLocaleString()} B2S</span>
        <span>{totalNo.toLocaleString()} B2S</span>
      </div>
    </div>
  );
}

function HotBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold animate-pulse">
      🔥 HOT
    </span>
  );
}

export default function PredictionMarket() {
  const { address, isConnected } = useWallet();
  const [markets, setMarkets]             = useState<Market[]>(SEED_MARKETS);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [betAmounts, setBetAmounts]       = useState<Record<number, string>>({});
  const [loading, setLoading]             = useState<Record<number, boolean>>({});
  const [txIds, setTxIds]                 = useState<Record<number, string>>({});
  const [userBets, setUserBets]           = useState<Record<number, { yes: number; no: number; claimed: boolean }>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMarket, setNewMarket]         = useState({ question: '', category: 'price', days: '7' });
  const [sortBy, setSortBy]               = useState<'volume' | 'hot' | 'new'>('volume');
  const [expandedId, setExpandedId]       = useState<number | null>(null);

  const fetchMarkets = useCallback(async () => {
    try {
      const countResult = await callReadOnlyFunction({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'get-market-count', functionArgs: [], senderAddress: CONTRACT_ADDRESS,
      });
      const count = Number(cvToJSON(countResult).value);
      if (count === 0) return;

      const fetched: Market[] = [];
      for (let i = 1; i <= count; i++) {
        const result = await callReadOnlyFunction({
          network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
          functionName: 'get-market', functionArgs: [uintCV(i)], senderAddress: CONTRACT_ADDRESS,
        });
        const m = cvToJSON(result).value;
        if (m) {
          fetched.push({
            id: i,
            question: m.question?.value || '',
            category: m.category?.value || 'price',
            deadline: Number(m.deadline?.value || 0),
            resolved: m.resolved?.value || false,
            outcome: m.outcome?.value || false,
            totalYes: Number(m['total-yes']?.value || 0) / 1_000_000,
            totalNo: Number(m['total-no']?.value || 0) / 1_000_000,
          });
        }
      }
      if (fetched.length > 0) setMarkets(fetched);
    } catch {}
  }, []);

  const fetchUserBets = useCallback(async () => {
    if (!address) return;
    const bets: Record<number, { yes: number; no: number; claimed: boolean }> = {};
    for (const market of markets) {
      try {
        const result = await callReadOnlyFunction({
          network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
          functionName: 'get-bet',
          functionArgs: [uintCV(market.id), standardPrincipalCV(address)],
          senderAddress: address,
        });
        const b = cvToJSON(result).value;
        if (b) bets[market.id] = {
          yes: Number(b['yes-amount']?.value || 0) / 1_000_000,
          no: Number(b['no-amount']?.value || 0) / 1_000_000,
          claimed: b.claimed?.value || false,
        };
      } catch {}
    }
    setUserBets(bets);
  }, [address, markets]);

  useEffect(() => { fetchMarkets(); }, [fetchMarkets]);
  useEffect(() => { if (address) fetchUserBets(); }, [address, fetchUserBets]);

  const handleBet = async (marketId: number, vote: boolean) => {
    if (!address) return;
    const amount = parseFloat(betAmounts[marketId] || '0');
    if (!amount || amount < 1) return;
    setLoading(prev => ({ ...prev, [marketId]: true }));
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'place-bet',
        functionArgs: [uintCV(marketId), boolCV(vote), uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxIds(prev => ({ ...prev, [marketId]: data.txId }));
          setBetAmounts(prev => ({ ...prev, [marketId]: '' }));
          setLoading(prev => ({ ...prev, [marketId]: false }));
          setTimeout(fetchMarkets, 5000);
        },
        onCancel: () => setLoading(prev => ({ ...prev, [marketId]: false })),
      });
    } catch { setLoading(prev => ({ ...prev, [marketId]: false })); }
  };

  const handleClaim = async (marketId: number) => {
    if (!address) return;
    setLoading(prev => ({ ...prev, [marketId]: true }));
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'claim-winnings', functionArgs: [uintCV(marketId)],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxIds(prev => ({ ...prev, [marketId]: data.txId }));
          setLoading(prev => ({ ...prev, [marketId]: false }));
          setTimeout(fetchUserBets, 5000);
        },
        onCancel: () => setLoading(prev => ({ ...prev, [marketId]: false })),
      });
    } catch { setLoading(prev => ({ ...prev, [marketId]: false })); }
  };

  const getOdds = (yes: number, no: number) => {
    const total = yes + no;
    if (total === 0) return { yes: 50, no: 50 };
    return { yes: Math.round((yes / total) * 100), no: Math.round((no / total) * 100) };
  };

  const totalVolume = markets.reduce((acc, m) => acc + m.totalYes + m.totalNo, 0);
  const categories = ['all', ...Array.from(new Set(markets.map(m => m.category)))];

  const sorted = [...markets]
    .filter(m => activeCategory === 'all' || m.category === activeCategory)
    .sort((a, b) => {
      if (sortBy === 'volume') return (b.totalYes + b.totalNo) - (a.totalYes + a.totalNo);
      if (sortBy === 'hot') return Math.abs(getOdds(b.totalYes, b.totalNo).yes - 50) - Math.abs(getOdds(a.totalYes, a.totalNo).yes - 50);
      return b.id - a.id;
    });

  return (
    <div className="prediction-market space-y-8">

      {/* ── Hero Stats Bar ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Markets',  value: markets.filter(m => !m.resolved).length,              sub: 'open for bets',    color: 'text-emerald-400' },
          { label: 'Total Volume',    value: `${(totalVolume / 1000).toFixed(1)}K`,                 sub: '$B2S in pools',    color: 'text-violet-400'  },
          { label: 'Resolved',        value: markets.filter(m => m.resolved).length,                sub: 'markets closed',   color: 'text-amber-400'   },
          { label: 'Categories',      value: categories.length - 1,                                 sub: 'market types',     color: 'text-cyan-400'    },
        ].map((s, i) => (
          <div key={i} className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 group hover:border-white/15 transition-all duration-300">
            <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/[0.02] group-hover:bg-white/[0.04] transition-all" />
            <p className={`text-2xl font-black tabular-nums ${s.color}`}>{s.value}</p>
            <p className="text-white font-semibold text-sm mt-0.5">{s.label}</p>
            <p className="text-white/30 text-xs mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">

        {/* Category pills */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
                  activeCategory === cat
                    ? 'bg-white text-black border-white'
                    : 'bg-white/5 text-white/50 border-white/10 hover:border-white/30 hover:text-white'
                }`}
              >
                {cat === 'all' ? '⚡ All' : `${meta?.emoji} ${meta?.label}`}
              </button>
            );
          })}
        </div>

        {/* Sort + Create */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex rounded-xl overflow-hidden border border-white/10">
            {(['volume', 'hot', 'new'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                  sortBy === s ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {s === 'volume' ? '📊 Volume' : s === 'hot' ? '🔥 Hot' : '🆕 New'}
              </button>
            ))}
          </div>
          {isConnected && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:opacity-90 transition-all border border-violet-500/30"
            >
              ➕ Create
            </button>
          )}
        </div>
      </div>

      {/* ── Market Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sorted.map(market => {
          const odds    = getOdds(market.totalYes, market.totalNo);
          const meta    = CATEGORY_META[market.category] || CATEGORY_META.price;
          const userBet = userBets[market.id];
          const total   = market.totalYes + market.totalNo;
          const isHot   = total > 4000;
          const isExpanded = expandedId === market.id;

          return (
            <div
              key={market.id}
              className={`relative rounded-2xl border transition-all duration-300 overflow-hidden ${meta.gradient} ${meta.border} bg-gradient-to-br shadow-lg ${meta.glow} hover:shadow-xl hover:-translate-y-0.5`}
            >
              {/* Subtle noise texture overlay */}
              <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

              <div className="relative p-5">
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border bg-black/20 ${meta.border} text-white/70`}>
                      {meta.emoji} {meta.label}
                    </span>
                    {isHot && <HotBadge />}
                    {market.resolved && (
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${market.outcome ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {market.outcome ? '✅ YES Won' : '❌ NO Won'}
                      </span>
                    )}
                    {!market.resolved && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        🟢 Live
                      </span>
                    )}
                  </div>
                  <span className="text-white/20 text-xs font-mono flex-shrink-0">#{market.id}</span>
                </div>

                {/* Question */}
                <h3 className="text-white font-bold text-base leading-snug mb-4 pr-2">
                  {market.question}
                </h3>

                {/* Odds Bar */}
                <OddsBar yes={odds.yes} no={odds.no} totalYes={market.totalYes} totalNo={market.totalNo} />

                {/* User position */}
                {userBet && (userBet.yes > 0 || userBet.no > 0) && (
                  <div className="mb-4 flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-white/40 text-xs">Your bet:</span>
                    {userBet.yes > 0 && <span className="text-emerald-400 text-xs font-bold">✅ {userBet.yes.toFixed(1)} $B2S YES</span>}
                    {userBet.no  > 0 && <span className="text-red-400 text-xs font-bold">❌ {userBet.no.toFixed(1)} $B2S NO</span>}
                  </div>
                )}

                {/* Bet Interface */}
                {!market.resolved && isConnected && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="Amount in $B2S..."
                        value={betAmounts[market.id] || ''}
                        onChange={e => setBetAmounts(prev => ({ ...prev, [market.id]: e.target.value }))}
                        className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                      />
                      {betAmounts[market.id] && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-xs">$B2S</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleBet(market.id, true)}
                        disabled={loading[market.id] || !betAmounts[market.id]}
                        className="relative overflow-hidden py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                        style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                      >
                        <span className="relative z-10">{loading[market.id] ? '⏳' : `✅ YES · ${odds.yes}%`}</span>
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                      </button>
                      <button
                        onClick={() => handleBet(market.id, false)}
                        disabled={loading[market.id] || !betAmounts[market.id]}
                        className="relative overflow-hidden py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
                        style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
                      >
                        <span className="relative z-10">{loading[market.id] ? '⏳' : `❌ NO · ${odds.no}%`}</span>
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                      </button>
                    </div>
                    {/* Quick bet amounts */}
                    <div className="flex gap-1.5">
                      {[10, 50, 100, 500].map(amt => (
                        <button
                          key={amt}
                          onClick={() => setBetAmounts(prev => ({ ...prev, [market.id]: String(amt) }))}
                          className="flex-1 py-1 rounded-lg text-xs font-semibold bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all border border-white/5"
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Claim winnings */}
                {market.resolved && isConnected && userBet && !userBet.claimed &&
                  ((market.outcome && userBet.yes > 0) || (!market.outcome && userBet.no > 0)) && (
                  <button
                    onClick={() => handleClaim(market.id)}
                    disabled={loading[market.id]}
                    className="w-full mt-2 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}
                  >
                    {loading[market.id] ? '⏳ Claiming...' : '🏆 Claim Winnings'}
                  </button>
                )}

                {/* Not connected */}
                {!isConnected && !market.resolved && (
                  <p className="text-white/25 text-xs text-center mt-2 py-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    🔒 Connect wallet to place a bet
                  </p>
                )}

                {/* TX link */}
                {txIds[market.id] && (
                  <div className="mt-3 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <a
                      href={`https://explorer.hiro.so/txid/${txIds[market.id]}?chain=mainnet`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-emerald-400 text-xs font-semibold hover:underline"
                    >
                      ✅ View on Explorer ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Create Market Modal ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden border border-white/10"
               style={{ background: 'linear-gradient(135deg, #0d0d1a, #0a0a14)' }}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />
            <div className="p-8">
              <h3 className="text-2xl font-black text-white mb-1">Create Market</h3>
              <p className="text-white/40 text-sm mb-6">Deploy a prediction on Stacks mainnet</p>

              <div className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 block">Question</label>
                  <textarea
                    value={newMarket.question}
                    onChange={e => setNewMarket(prev => ({ ...prev, question: e.target.value }))}
                    placeholder="Will Bitcoin reach $150K before 2027?"
                    rows={3}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm placeholder-white/20 focus:outline-none focus:border-violet-500/40 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 block">Category</label>
                  <select
                    value={newMarket.category}
                    onChange={e => setNewMarket(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40 transition-colors"
                  >
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji} {v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2 block">Duration</label>
                  <div className="flex gap-2">
                    {[7, 14, 30, 90].map(d => (
                      <button
                        key={d}
                        onClick={() => setNewMarket(prev => ({ ...prev, days: String(d) }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          newMarket.days === String(d)
                            ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
                            : 'bg-white/[0.03] border-white/10 text-white/40 hover:text-white/70'
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                  <p className="text-white/25 text-xs mt-1.5">≈ {(parseInt(newMarket.days) * 144).toLocaleString()} blocks</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 text-white/60 hover:bg-white/10 transition-all border border-white/10"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!address || !newMarket.question) return;
                    const blocks = parseInt(newMarket.days) * 144;
                    try {
                      const { stringUtf8CV, stringAsciiCV } = await import('@stacks/transactions');
                      await openContractCall({
                        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
                        functionName: 'create-market',
                        functionArgs: [stringUtf8CV(newMarket.question), stringAsciiCV(newMarket.category), uintCV(blocks)],
                        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
                        onFinish: () => {
                          setShowCreateModal(false);
                          setNewMarket({ question: '', category: 'price', days: '7' });
                          setTimeout(fetchMarkets, 5000);
                        },
                        onCancel: () => {},
                      });
                    } catch (err) { console.error(err); }
                  }}
                  disabled={!newMarket.question}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
                >
                  Deploy Market 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}