import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';

const HIRO_API        = 'https://api.hiro.so';
const CONTRACT        = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const TOKEN_CONTRACT  = `${CONTRACT}.b2s-token`;
const POOL_CONTRACT   = `${CONTRACT}.b2s-liquidity-pool-v5`;
const REWARDS_CONTRACT= `${CONTRACT}.b2s-rewards-distributor-v3`;

const NEON = ['#00ff9f','#00d4ff','#ff00ff','#ffd700','#ff6600','#9945ff'];

interface Metrics { totalTxCount: number; holders: number; totalSupply: number; poolTxCount: number; rewardsTxCount: number; loading: boolean }
interface TxPoint  { date: string; count: number; cumulative: number }
interface HolderBucket { range: string; holders: number }

const CUSTOM_TOOLTIP_STYLE = {
  background: '#0a0a14',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  fontFamily: "'JetBrains Mono','Fira Code',monospace",
  fontSize: '11px',
  color: '#fff',
};

function NeonTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CUSTOM_TOOLTIP_STYLE} className="px-3 py-2">
      <p className="text-white/40 text-[9px] tracking-widest mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || '#00ff9f' }} className="font-black text-xs">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

export const AnalyticsDashboard: React.FC<{ refreshInterval?: number }> = ({ refreshInterval = 60000 }) => {
  const [metrics, setMetrics]       = useState<Metrics>({ totalTxCount: 0, holders: 0, totalSupply: 0, poolTxCount: 0, rewardsTxCount: 0, loading: true });
  const [txHistory, setTxHistory]   = useState<TxPoint[]>([]);
  const [holderDist, setHolderDist] = useState<HolderBucket[]>([]);
  const [lastUpdate, setLastUpdate] = useState('');

  const fetchMetrics = useCallback(async () => {
    try {
      const [tokenTx, holderRes, poolTx, rewardsTx] = await Promise.all([
        fetch(`${HIRO_API}/extended/v1/address/${TOKEN_CONTRACT}/transactions?limit=1`),
        fetch(`${HIRO_API}/extended/v1/tokens/ft/${TOKEN_CONTRACT}/holders?limit=1`),
        fetch(`${HIRO_API}/extended/v1/address/${POOL_CONTRACT}/transactions?limit=1`),
        fetch(`${HIRO_API}/extended/v1/address/${REWARDS_CONTRACT}/transactions?limit=1`),
      ]);
      const [tokenData, holderData, poolData, rewardsData] = await Promise.all([tokenTx.json(), holderRes.json(), poolTx.json(), rewardsTx.json()]);
      const metaRes = await fetch(`${HIRO_API}/metadata/v1/ft/${TOKEN_CONTRACT}`);
      const meta    = await metaRes.json();
      setMetrics({ totalTxCount: tokenData.total || 0, holders: holderData.total || 0, totalSupply: meta.total_supply ? Number(meta.total_supply) / 1_000_000 : 0, poolTxCount: poolData.total || 0, rewardsTxCount: rewardsData.total || 0, loading: false });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch { setMetrics(p => ({ ...p, loading: false })); }
  }, []);

  const fetchTxHistory = useCallback(async () => {
    try {
      const res  = await fetch(`${HIRO_API}/extended/v1/address/${TOKEN_CONTRACT}/transactions?limit=50&offset=0`);
      const data = await res.json();
      const byDay: Record<string, number> = {};
      (data.results || []).forEach((tx: any) => { const d = tx.burn_block_time_iso?.slice(0,10); if (d) byDay[d] = (byDay[d] || 0) + 1; });
      let cumulative = 0;
      setTxHistory(Object.entries(byDay).sort(([a],[b]) => a.localeCompare(b)).slice(-14).map(([date, count]) => { cumulative += count; return { date: date.slice(5), count, cumulative }; }));
    } catch {}
  }, []);

  const fetchHolderDistribution = useCallback(async () => {
    try {
      const res  = await fetch(`${HIRO_API}/extended/v1/tokens/ft/${TOKEN_CONTRACT}/holders?limit=200`);
      const data = await res.json();
      const buckets: Record<string, number> = { '0–100': 0, '100–1K': 0, '1K–10K': 0, '10K–100K': 0, '100K+': 0 };
      (data.results || []).forEach((h: any) => {
        const b = Number(h.balance) / 1_000_000;
        if (b < 100) buckets['0–100']++; else if (b < 1000) buckets['100–1K']++; else if (b < 10000) buckets['1K–10K']++; else if (b < 100000) buckets['10K–100K']++; else buckets['100K+']++;
      });
      setHolderDist(Object.entries(buckets).map(([range, holders]) => ({ range, holders })));
    } catch {}
  }, []);

  useEffect(() => {
    fetchMetrics(); fetchTxHistory(); fetchHolderDistribution();
    const t = setInterval(() => { fetchMetrics(); fetchTxHistory(); }, refreshInterval);
    return () => clearInterval(t);
  }, [fetchMetrics, fetchTxHistory, fetchHolderDistribution, refreshInterval]);

  const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" };
  const AXIS_STYLE = { fill: 'rgba(255,255,255,0.25)', fontSize: 10 };
  const GRID_STYLE = { stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '3 3' };

  const STAT_CARDS = [
    { title: 'TOKEN_TXS',   val: metrics.totalTxCount,  unit: 'total',   color: '#00ff9f', icon: '⚡' },
    { title: 'HOLDERS',     val: metrics.holders,        unit: 'wallets', color: '#00d4ff', icon: '👤' },
    { title: 'SUPPLY',      val: metrics.totalSupply > 0 ? `${(metrics.totalSupply/1_000_000).toFixed(1)}M` : '—', unit: '$B2S', color: '#ff00ff', icon: '💎' },
    { title: 'POOL_SWAPS',  val: metrics.poolTxCount,   unit: 'txns',    color: '#ffd700', icon: '💧' },
    { title: 'STAKING_TXS', val: metrics.rewardsTxCount, unit: 'txns',   color: '#ff6600', icon: '🔒' },
  ];

  return (
    <div style={MONO} className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#00d4ff]/20 bg-black/70 p-5">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.01) 3px,rgba(0,212,255,0.01) 4px)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" style={{ boxShadow: '0 0 8px #00d4ff' }} />
              <span className="text-[#00d4ff] text-[10px] tracking-[0.3em] font-black">ANALYTICS DASHBOARD // STACKS MAINNET</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">PROTOCOL METRICS</h2>
          </div>
          {lastUpdate && <p className="text-white/20 text-[10px] font-mono">LAST_SYNC: {lastUpdate}</p>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {STAT_CARDS.map(c => (
          <div key={c.title} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 group hover:border-white/15 transition-all">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base">{c.icon}</span>
              <span className="text-white/25 text-[9px] tracking-widest">{c.title}</span>
            </div>
            {metrics.loading
              ? <div className="h-5 bg-white/10 rounded animate-pulse" />
              : <p className="font-black text-xl tabular-nums" style={{ color: c.color, textShadow: `0 0 10px ${c.color}50` }}>{typeof c.val === 'number' ? c.val.toLocaleString() : c.val}</p>
            }
            <p className="text-white/20 text-[9px] mt-0.5">{c.unit}</p>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Daily TX */}
        <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9f]" />
            <span className="text-[#00ff9f] text-[10px] tracking-widest font-black">// DAILY TX ACTIVITY</span>
          </div>
          {txHistory.length > 0
            ? <ResponsiveContainer width="100%" height={220}>
                <BarChart data={txHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="date" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} />
                  <Tooltip content={<NeonTooltip />} />
                  <Bar dataKey="count" fill="#00ff9f" radius={[3,3,0,0]} name="Txns" opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            : <div className="h-[220px] flex items-center justify-center text-white/20 text-xs font-mono">{'>'} Loading<span className="animate-pulse">_</span></div>
          }
        </div>

        {/* Cumulative */}
        <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
            <span className="text-[#00d4ff] text-[10px] tracking-widest font-black">// CUMULATIVE ACTIVITY</span>
          </div>
          {txHistory.length > 0
            ? <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={txHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#00d4ff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00d4ff" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="date" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} />
                  <Tooltip content={<NeonTooltip />} />
                  <Area type="monotone" dataKey="cumulative" stroke="#00d4ff" strokeWidth={2} fill="url(#cyanGrad)" name="Cumulative" />
                </AreaChart>
              </ResponsiveContainer>
            : <div className="h-[220px] flex items-center justify-center text-white/20 text-xs font-mono">{'>'} Loading<span className="animate-pulse">_</span></div>
          }
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Holder distribution */}
        <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff00ff]" />
            <span className="text-[#ff00ff] text-[10px] tracking-widest font-black">// HOLDER DISTRIBUTION</span>
          </div>
          {holderDist.length > 0
            ? <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={holderDist} dataKey="holders" nameKey="range" cx="50%" cy="50%" outerRadius={85} innerRadius={40}
                    label={({ range, percent }) => `${range} ${(percent*100).toFixed(0)}%`}
                    labelLine={{ stroke: 'rgba(255,255,255,0.15)' }}>
                    {holderDist.map((_, i) => <Cell key={i} fill={NEON[i % NEON.length]} opacity={0.85} />)}
                  </Pie>
                  <Tooltip content={<NeonTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            : <div className="h-[220px] flex items-center justify-center text-white/20 text-xs font-mono">{'>'} Loading<span className="animate-pulse">_</span></div>
          }
        </div>

        {/* Contract activity */}
        <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ffd700]" />
            <span className="text-[#ffd700] text-[10px] tracking-widest font-black">// CONTRACT ACTIVITY</span>
          </div>
          {!metrics.loading
            ? <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { name: 'TOKEN',   txns: metrics.totalTxCount  },
                  { name: 'POOL',    txns: metrics.poolTxCount   },
                  { name: 'STAKING', txns: metrics.rewardsTxCount },
                ]} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="name" tick={AXIS_STYLE} />
                  <YAxis tick={AXIS_STYLE} />
                  <Tooltip content={<NeonTooltip />} />
                  <Bar dataKey="txns" radius={[4,4,0,0]} name="Transactions" opacity={0.85}>
                    {['#00ff9f','#ff00ff','#ffd700'].map((color, i) => <Cell key={i} fill={color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            : <div className="h-[220px] flex items-center justify-center text-white/20 text-xs font-mono">{'>'} Loading<span className="animate-pulse">_</span></div>
          }
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-3 border-t border-white/[0.05]">
        <p className="text-white/15 text-[9px] tracking-widest font-mono">
          DATA_SOURCE: HIRO MAINNET API // CONTRACT: {TOKEN_CONTRACT}
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;