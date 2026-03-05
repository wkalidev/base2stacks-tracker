import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';

const HIRO_API = 'https://api.hiro.so';
const CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const TOKEN_CONTRACT = `${CONTRACT}.b2s-token`;
const POOL_CONTRACT = `${CONTRACT}.b2s-liquidity-pool-v5`;
const REWARDS_CONTRACT = `${CONTRACT}.b2s-rewards-distributor-v3`;

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Metrics {
  totalTxCount: number;
  holders: number;
  totalSupply: number;
  poolTxCount: number;
  rewardsTxCount: number;
  loading: boolean;
}

interface TxPoint {
  date: string;
  count: number;
  cumulative: number;
}

interface HolderBucket {
  range: string;
  holders: number;
}

interface AnalyticsDashboardProps {
  contractAddress?: string;
  refreshInterval?: number;
  theme?: 'light' | 'dark';
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  refreshInterval = 60000,
  theme = 'dark',
}) => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalTxCount: 0,
    holders: 0,
    totalSupply: 0,
    poolTxCount: 0,
    rewardsTxCount: 0,
    loading: true,
  });

  const [txHistory, setTxHistory] = useState<TxPoint[]>([]);
  const [holderDist, setHolderDist] = useState<HolderBucket[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchMetrics = useCallback(async () => {
    try {
      const [tokenTx, holderRes, poolTx, rewardsTx] = await Promise.all([
        fetch(`${HIRO_API}/extended/v1/address/${TOKEN_CONTRACT}/transactions?limit=1`),
        fetch(`${HIRO_API}/extended/v1/tokens/ft/${TOKEN_CONTRACT}/holders?limit=1`),
        fetch(`${HIRO_API}/extended/v1/address/${POOL_CONTRACT}/transactions?limit=1`),
        fetch(`${HIRO_API}/extended/v1/address/${REWARDS_CONTRACT}/transactions?limit=1`),
      ]);

      const [tokenData, holderData, poolData, rewardsData] = await Promise.all([
        tokenTx.json(),
        holderRes.json(),
        poolTx.json(),
        rewardsTx.json(),
      ]);

      // Total supply from FT metadata
      const metaRes = await fetch(`${HIRO_API}/metadata/v1/ft/${TOKEN_CONTRACT}`);
      const meta = await metaRes.json();

      setMetrics({
        totalTxCount: tokenData.total || 0,
        holders: holderData.total || 0,
        totalSupply: meta.total_supply ? Number(meta.total_supply) / 1_000_000 : 0,
        poolTxCount: poolData.total || 0,
        rewardsTxCount: rewardsData.total || 0,
        loading: false,
      });

      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const fetchTxHistory = useCallback(async () => {
    try {
      // Fetch last 50 transactions to build daily activity chart
      const res = await fetch(
        `${HIRO_API}/extended/v1/address/${TOKEN_CONTRACT}/transactions?limit=50&offset=0`
      );
      const data = await res.json();
      const txs: { burn_block_time_iso: string }[] = data.results || [];

      // Group by day
      const byDay: Record<string, number> = {};
      txs.forEach(tx => {
        const day = tx.burn_block_time_iso?.slice(0, 10);
        if (day) byDay[day] = (byDay[day] || 0) + 1;
      });

      // Last 14 days
      const sorted = Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-14);

      let cumulative = 0;
      const points: TxPoint[] = sorted.map(([date, count]) => {
        cumulative += count;
        return {
          date: date.slice(5), // MM-DD
          count,
          cumulative,
        };
      });

      setTxHistory(points);
    } catch (err) {
      console.error('Failed to fetch tx history:', err);
    }
  }, []);

  const fetchHolderDistribution = useCallback(async () => {
    try {
      const res = await fetch(
        `${HIRO_API}/extended/v1/tokens/ft/${TOKEN_CONTRACT}/holders?limit=200`
      );
      const data = await res.json();
      const holders: { balance: string }[] = data.results || [];

      // Bucket by balance size
      const buckets: Record<string, number> = {
        '0–100': 0,
        '100–1K': 0,
        '1K–10K': 0,
        '10K–100K': 0,
        '100K+': 0,
      };

      holders.forEach(h => {
        const bal = Number(h.balance) / 1_000_000;
        if (bal < 100) buckets['0–100']++;
        else if (bal < 1000) buckets['100–1K']++;
        else if (bal < 10000) buckets['1K–10K']++;
        else if (bal < 100000) buckets['10K–100K']++;
        else buckets['100K+']++;
      });

      setHolderDist(
        Object.entries(buckets).map(([range, holders]) => ({ range, holders }))
      );
    } catch (err) {
      console.error('Failed to fetch holder distribution:', err);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    fetchTxHistory();
    fetchHolderDistribution();
    const interval = setInterval(() => {
      fetchMetrics();
      fetchTxHistory();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMetrics, fetchTxHistory, fetchHolderDistribution, refreshInterval]);

  const bg = theme === 'dark' ? '#0f172a' : '#ffffff';
  const card = theme === 'dark' ? '#1e293b' : '#f8fafc';
  const border = theme === 'dark' ? '#334155' : '#e2e8f0';
  const text = theme === 'dark' ? '#f1f5f9' : '#0f172a';
  const muted = theme === 'dark' ? '#94a3b8' : '#64748b';

  const statCards = [
    { title: 'Token Transactions', value: metrics.totalTxCount.toLocaleString(), unit: 'total', icon: '⚡' },
    { title: 'Holders', value: metrics.holders.toLocaleString(), unit: 'wallets', icon: '👥' },
    { title: 'Total Supply', value: metrics.totalSupply > 0 ? `${(metrics.totalSupply / 1_000_000).toFixed(1)}M` : '—', unit: '$B2S', icon: '💎' },
    { title: 'Pool Swaps', value: metrics.poolTxCount.toLocaleString(), unit: 'txns', icon: '💧' },
    { title: 'Staking Txns', value: metrics.rewardsTxCount.toLocaleString(), unit: 'txns', icon: '🔒' },
  ];

  return (
    <div style={{ background: bg, color: text, padding: '24px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{ color: muted, fontSize: '14px' }}>
          🟢 Live — Stacks Mainnet
          {lastUpdate && <span style={{ marginLeft: '12px' }}>Last updated: {lastUpdate}</span>}
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {statCards.map(card_ => (
          <div key={card_.title} style={{
            background: card, border: `1px solid ${border}`,
            borderRadius: '12px', padding: '20px',
            transition: 'transform 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: muted, fontSize: '13px' }}>
              <span style={{ fontSize: '20px' }}>{card_.icon}</span>
              {card_.title}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
              {metrics.loading ? '...' : card_.value}
              <span style={{ fontSize: '13px', fontWeight: 'normal', color: muted, marginLeft: '6px' }}>{card_.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* Daily TX Activity */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>⚡ Daily Transaction Activity</h3>
          {txHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={txHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="date" tick={{ fill: muted, fontSize: 11 }} />
                <YAxis tick={{ fill: muted, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, color: text }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted }}>
              Loading...
            </div>
          )}
        </div>

        {/* Cumulative TX */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📈 Cumulative Activity</h3>
          {txHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={txHistory}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="date" tick={{ fill: muted, fontSize: 11 }} />
                <YAxis tick={{ fill: muted, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, color: text }} />
                <Area type="monotone" dataKey="cumulative" stroke="#06b6d4" fill="url(#areaGrad)" name="Cumulative" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted }}>
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Holder Distribution */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>🥧 Holder Distribution</h3>
          {holderDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={holderDist} dataKey="holders" nameKey="range" cx="50%" cy="50%" outerRadius={90} label={({ range, percent }) => `${range} (${(percent * 100).toFixed(0)}%)`}>
                  {holderDist.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, color: text }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted }}>
              Loading...
            </div>
          )}
        </div>

        {/* Contract Activity Comparison */}
        <div style={{ background: card, border: `1px solid ${border}`, borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>📊 Contract Activity</h3>
          {!metrics.loading ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Token', txns: metrics.totalTxCount },
                { name: 'Pool', txns: metrics.poolTxCount },
                { name: 'Staking', txns: metrics.rewardsTxCount },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="name" tick={{ fill: muted, fontSize: 12 }} />
                <YAxis tick={{ fill: muted, fontSize: 12 }} />
                <Tooltip contentStyle={{ background: card, border: `1px solid ${border}`, color: text }} />
                <Bar dataKey="txns" radius={[6, 6, 0, 0]} name="Transactions">
                  {['#3b82f6', '#06b6d4', '#10b981'].map((color, i) => (
                    <Cell key={i} fill={color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted }}>
              Loading...
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '32px', color: muted, fontSize: '13px' }}>
        Data sourced from Hiro Mainnet API · Contract: {TOKEN_CONTRACT}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;