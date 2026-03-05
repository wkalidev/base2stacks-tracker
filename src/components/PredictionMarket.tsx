'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { callReadOnlyFunction, cvToJSON, uintCV, boolCV, standardPrincipalCV, PostConditionMode, AnchorMode } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const CONTRACT_NAME = 'b2s-prediction-market';

// Seed markets for display before contract has data
const SEED_MARKETS = [
  {
    id: 1,
    question: 'Will Bitcoin reach $120,000 before end of Q2 2026?',
    category: 'price',
    deadline: 999999,
    resolved: false,
    outcome: false,
    totalYes: 0,
    totalNo: 0,
  },
  {
    id: 2,
    question: 'Will Stacks TVL exceed $500M in 2026?',
    category: 'stacks',
    deadline: 999999,
    resolved: false,
    outcome: false,
    totalYes: 0,
    totalNo: 0,
  },
  {
    id: 3,
    question: 'Will B2S governance proposal #1 pass?',
    category: 'governance',
    deadline: 999999,
    resolved: false,
    outcome: false,
    totalYes: 0,
    totalNo: 0,
  },
  {
    id: 4,
    question: '🚨 Crisis Alert: Will a major CEX halt withdrawals in 2026?',
    category: 'crisis',
    deadline: 999999,
    resolved: false,
    outcome: false,
    totalYes: 0,
    totalNo: 0,
  },
  {
    id: 5,
    question: 'Will STX outperform ETH in Q2 2026?',
    category: 'price',
    deadline: 999999,
    resolved: false,
    outcome: false,
    totalYes: 0,
    totalNo: 0,
  },
];

const CATEGORY_META: Record<string, { emoji: string; label: string; color: string }> = {
  price:      { emoji: '📈', label: 'Price',      color: 'from-green-500/20 to-emerald-500/20 border-green-500/30' },
  stacks:     { emoji: '🟠', label: 'Stacks',     color: 'from-orange-500/20 to-amber-500/20 border-orange-500/30' },
  governance: { emoji: '🏛️', label: 'Governance', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30' },
  sport:      { emoji: '⚽', label: 'Sport',      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30' },
  crisis:     { emoji: '🚨', label: 'Crisis',     color: 'from-red-500/20 to-rose-500/20 border-red-500/30' },
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

export default function PredictionMarket() {
  const { address, isConnected } = useWallet();
  const [markets, setMarkets] = useState<Market[]>(SEED_MARKETS);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [betAmounts, setBetAmounts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [txIds, setTxIds] = useState<Record<number, string>>({});
  const [userBets, setUserBets] = useState<Record<number, { yes: number; no: number; claimed: boolean }>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMarket, setNewMarket] = useState({ question: '', category: 'price', days: '7' });

  // Fetch all markets from contract
  const fetchMarkets = useCallback(async () => {
    try {
      const countResult = await callReadOnlyFunction({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'get-market-count',
        functionArgs: [],
        senderAddress: CONTRACT_ADDRESS,
      });
      const count = Number(cvToJSON(countResult).value);
      if (count === 0) return;

      const fetched: Market[] = [];
      for (let i = 1; i <= count; i++) {
        const result = await callReadOnlyFunction({
          network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
          functionName: 'get-market',
          functionArgs: [uintCV(i)],
          senderAddress: CONTRACT_ADDRESS,
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
    } catch (err) {
      console.error('Failed to fetch markets:', err);
    }
  }, []);

  // Fetch user bets
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
        if (b) {
          bets[market.id] = {
            yes: Number(b['yes-amount']?.value || 0) / 1_000_000,
            no: Number(b['no-amount']?.value || 0) / 1_000_000,
            claimed: b.claimed?.value || false,
          };
        }
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
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxIds(prev => ({ ...prev, [marketId]: data.txId }));
          setBetAmounts(prev => ({ ...prev, [marketId]: '' }));
          setLoading(prev => ({ ...prev, [marketId]: false }));
          setTimeout(fetchMarkets, 5000);
        },
        onCancel: () => setLoading(prev => ({ ...prev, [marketId]: false })),
      });
    } catch (err) {
      console.error('Bet error:', err);
      setLoading(prev => ({ ...prev, [marketId]: false }));
    }
  };

  const handleClaim = async (marketId: number) => {
    if (!address) return;
    setLoading(prev => ({ ...prev, [marketId]: true }));
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'claim-winnings',
        functionArgs: [uintCV(marketId)],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxIds(prev => ({ ...prev, [marketId]: data.txId }));
          setLoading(prev => ({ ...prev, [marketId]: false }));
          setTimeout(fetchUserBets, 5000);
        },
        onCancel: () => setLoading(prev => ({ ...prev, [marketId]: false })),
      });
    } catch (err) {
      console.error('Claim error:', err);
      setLoading(prev => ({ ...prev, [marketId]: false }));
    }
  };

  const getOdds = (yes: number, no: number) => {
    const total = yes + no;
    if (total === 0) return { yes: 50, no: 50 };
    return {
      yes: Math.round((yes / total) * 100),
      no: Math.round((no / total) * 100),
    };
  };

  const filteredMarkets = activeCategory === 'all'
    ? markets
    : markets.filter(m => m.category === activeCategory);

  const categories = ['all', 'price', 'stacks', 'governance', 'sport', 'crisis'];

  return (
    <div className="prediction-market">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🔮 Prediction Market</h2>
        <p className="text-white/60">Bet $B2S on real-world outcomes — Powered by Stacks</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Markets', value: markets.filter(m => !m.resolved).length, emoji: '🎯' },
          { label: 'Resolved', value: markets.filter(m => m.resolved).length, emoji: '✅' },
          { label: 'Total Volume', value: `${markets.reduce((acc, m) => acc + m.totalYes + m.totalNo, 0).toFixed(0)} $B2S`, emoji: '💰' },
          { label: 'Categories', value: 5, emoji: '📂' },
        ].map((s, i) => (
          <div key={i} className="bg-white/5 backdrop-blur-md rounded-lg p-4 border border-white/10 text-center">
            <div className="text-2xl mb-1">{s.emoji}</div>
            <p className="text-xl font-bold text-white">{s.value}</p>
            <p className="text-white/50 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-b2s-primary to-b2s-accent text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {cat === 'all' ? '🌐 All' : `${CATEGORY_META[cat]?.emoji} ${CATEGORY_META[cat]?.label}`}
          </button>
        ))}

        {isConnected && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="ml-auto px-4 py-2 rounded-full text-sm font-semibold bg-white/10 text-white/60 hover:bg-white/20 transition-all border border-white/20"
          >
            ➕ Create Market
          </button>
        )}
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMarkets.map(market => {
          const odds = getOdds(market.totalYes, market.totalNo);
          const meta = CATEGORY_META[market.category] || CATEGORY_META.price;
          const userBet = userBets[market.id];
          const totalPool = market.totalYes + market.totalNo;

          return (
            <div
              key={market.id}
              className={`bg-gradient-to-br ${meta.color} backdrop-blur-md rounded-xl p-6 border transition-all hover:scale-[1.01]`}
            >
              {/* Market Header */}
              <div className="flex items-start justify-between mb-4">
                <span className={`px-2 py-1 rounded text-xs font-semibold bg-white/10 text-white`}>
                  {meta.emoji} {meta.label}
                </span>
                {market.resolved ? (
                  <span className={`px-2 py-1 rounded text-xs font-bold ${market.outcome ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {market.outcome ? '✅ YES Won' : '❌ NO Won'}
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">🟢 Open</span>
                )}
              </div>

              {/* Question */}
              <h3 className="text-white font-bold text-lg mb-4 leading-snug">{market.question}</h3>

              {/* Odds Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-400 font-semibold">YES {odds.yes}%</span>
                  <span className="text-white/50 text-xs">Pool: {totalPool.toFixed(0)} $B2S</span>
                  <span className="text-red-400 font-semibold">{odds.no}% NO</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${odds.yes}%` }}
                  />
                </div>
              </div>

              {/* User bet info */}
              {userBet && (userBet.yes > 0 || userBet.no > 0) && (
                <div className="mb-4 p-3 bg-white/5 rounded-lg text-xs">
                  <p className="text-white/60 mb-1">Your position:</p>
                  <div className="flex gap-4">
                    {userBet.yes > 0 && <span className="text-green-400">✅ YES: {userBet.yes.toFixed(2)} $B2S</span>}
                    {userBet.no > 0 && <span className="text-red-400">❌ NO: {userBet.no.toFixed(2)} $B2S</span>}
                  </div>
                </div>
              )}

              {/* Bet Interface */}
              {!market.resolved && isConnected && (
                <div className="space-y-3">
                  <input
                    type="number"
                    placeholder="Amount in $B2S (min 1)"
                    value={betAmounts[market.id] || ''}
                    onChange={(e) => setBetAmounts(prev => ({ ...prev, [market.id]: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/30"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleBet(market.id, true)}
                      disabled={loading[market.id] || !betAmounts[market.id]}
                      className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold text-sm transition-all"
                    >
                      {loading[market.id] ? '⏳' : `✅ YES ${odds.yes}%`}
                    </button>
                    <button
                      onClick={() => handleBet(market.id, false)}
                      disabled={loading[market.id] || !betAmounts[market.id]}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-semibold text-sm transition-all"
                    >
                      {loading[market.id] ? '⏳' : `❌ NO ${odds.no}%`}
                    </button>
                  </div>
                </div>
              )}

              {/* Claim winnings */}
              {market.resolved && isConnected && userBet && !userBet.claimed &&
                ((market.outcome && userBet.yes > 0) || (!market.outcome && userBet.no > 0)) && (
                <button
                  onClick={() => handleClaim(market.id)}
                  disabled={loading[market.id]}
                  className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-3 rounded-lg font-bold transition-all"
                >
                  {loading[market.id] ? '⏳ Claiming...' : '🏆 Claim Winnings'}
                </button>
              )}

              {/* TX confirmation */}
              {txIds[market.id] && (
                <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
                  <a
                    href={`https://explorer.hiro.so/txid/${txIds[market.id]}?chain=mainnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:underline"
                  >
                    ✅ View on Explorer ↗
                  </a>
                </div>
              )}

              {!isConnected && !market.resolved && (
                <p className="text-white/40 text-sm text-center mt-3">Connect wallet to bet</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Create Market Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/20 rounded-2xl p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">➕ Create Market</h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/70 text-sm mb-2 block">Question</label>
                <textarea
                  value={newMarket.question}
                  onChange={(e) => setNewMarket(prev => ({ ...prev, question: e.target.value }))}
                  placeholder="Will Bitcoin reach $100K before June 2026?"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm mb-2 block">Category</label>
                <select
                  value={newMarket.category}
                  onChange={(e) => setNewMarket(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none"
                >
                  <option value="price">📈 Price</option>
                  <option value="stacks">🟠 Stacks</option>
                  <option value="governance">🏛️ Governance</option>
                  <option value="sport">⚽ Sport</option>
                  <option value="crisis">🚨 Crisis Alert</option>
                </select>
              </div>

              <div>
                <label className="text-white/70 text-sm mb-2 block">Duration (days)</label>
                <input
                  type="number"
                  value={newMarket.days}
                  onChange={(e) => setNewMarket(prev => ({ ...prev, days: e.target.value }))}
                  placeholder="7"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none"
                />
                <p className="text-white/40 text-xs mt-1">≈ {(parseInt(newMarket.days) * 144).toLocaleString()} blocks</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all"
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
                      functionArgs: [
                        stringUtf8CV(newMarket.question),
                        stringAsciiCV(newMarket.category),
                        uintCV(blocks),
                      ],
                      postConditionMode: PostConditionMode.Allow,
                      anchorMode: AnchorMode.Any,
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
                className="flex-1 bg-gradient-to-r from-b2s-primary to-b2s-accent disabled:from-gray-600 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Create 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
