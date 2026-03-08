'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y';

const TV_INTERVALS: Record<Timeframe, string> = {
  '1D': '60', '1W': '240', '1M': 'D', '3M': 'W', '1Y': 'W',
};
const TV_RANGES: Record<Timeframe, string> = {
  '1D': '1D', '1W': '5D', '1M': '1M', '3M': '3M', '1Y': '12M',
};

interface CoinData {
  price: number;
  change24h: number;
  change7d: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  circulatingSupply: number;
  ath: number;
  athDate: string;
  lastUpdated: string;
}

function formatNum(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function PriceTicker({ value, change }: { value: number; change: number }) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(value > prevRef.current ? 'up' : 'down');
      prevRef.current = value;
      const t = setTimeout(() => setFlash(null), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <div className={`transition-colors duration-300 ${flash === 'up' ? 'text-emerald-300' : flash === 'down' ? 'text-red-300' : 'text-white'}`}>
      <span className="text-4xl font-bold tabular-nums tracking-tight">
        ${value < 1 ? value.toFixed(4) : value.toFixed(2)}
      </span>
      <span className={`ml-3 text-lg font-semibold ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
        {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(2)}%
      </span>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 hover:border-white/20 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 to-cyan-500/0 group-hover:from-violet-500/5 group-hover:to-cyan-500/5 transition-all duration-500" />
      <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-lg font-bold tabular-nums ${accent ? 'text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function TradingViewChart({ timeframe }: { timeframe: Timeframe }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const widget = document.createElement('div');
    widget.className = 'tradingview-widget-container__widget';
    widget.style.height = '100%';
    widget.style.width = '100%';
    containerRef.current.appendChild(widget);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: 'COINBASE:STXUSD',
      interval: TV_INTERVALS[timeframe],
      range: TV_RANGES[timeframe],
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      backgroundColor: 'rgba(0,0,0,0)',
      gridColor: 'rgba(255,255,255,0.04)',
      hide_top_toolbar: false,
      save_image: false,
      hide_volume: false,
      studies: ['RSI@tv-basicstudies'],
      overrides: {
        'mainSeriesProperties.candleStyle.upColor':         '#10b981',
        'mainSeriesProperties.candleStyle.downColor':       '#ef4444',
        'mainSeriesProperties.candleStyle.borderUpColor':   '#10b981',
        'mainSeriesProperties.candleStyle.borderDownColor': '#ef4444',
        'mainSeriesProperties.candleStyle.wickUpColor':     '#10b981',
        'mainSeriesProperties.candleStyle.wickDownColor':   '#ef4444',
        'paneProperties.background':                        'rgba(0,0,0,0)',
        'paneProperties.backgroundType':                    'solid',
      },
    });
    containerRef.current.appendChild(script);

    return () => { if (containerRef.current) containerRef.current.innerHTML = ''; };
  }, [timeframe]);

  return (
    <div ref={containerRef} className="tradingview-widget-container" style={{ height: '420px', width: '100%' }} />
  );
}

export default function MarketData() {
  const [coin, setCoin]           = useState<CoinData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>('1W');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // ← Appel au proxy Next.js /api/market (pas directement CoinGecko)
  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/market');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: CoinData = await res.json();
      setCoin(data);
      setLastFetch(new Date());
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y'];

  return (
    <div className="market-data">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-base font-black">S</span>
            STX / USD
          </h2>
          <p className="text-white/40 text-sm">
            Stacks · CoinGecko + TradingView
            {lastFetch && <span className="ml-2">· {lastFetch.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all">
          🔄
        </button>
      </div>

      {/* Live Price */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-cyan-500/10 border border-white/10">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-10 bg-white/10 rounded w-48 mb-3" />
            <div className="h-5 bg-white/10 rounded w-32" />
          </div>
        ) : error ? (
          <p className="text-red-400 text-sm">⚠️ Could not load price data — check /api/market</p>
        ) : coin ? (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <PriceTicker value={coin.price} change={coin.change24h} />
              <div className="flex items-center gap-4 mt-2">
                <span className="text-white/40 text-sm">H: <span className="text-white/70">${coin.high24h.toFixed(3)}</span></span>
                <span className="text-white/40 text-sm">L: <span className="text-white/70">${coin.low24h.toFixed(3)}</span></span>
                <span className={`text-sm font-medium ${coin.change7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  7d: {coin.change7d >= 0 ? '+' : ''}{coin.change7d.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-white/40">
              <p>ATH <span className="text-white/60 font-semibold">${coin.ath.toFixed(2)}</span></p>
              <p>{coin.athDate}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Stats Grid */}
      {coin && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard label="Market Cap"  value={formatNum(coin.marketCap)}                                          sub="USD"   accent />
          <StatCard label="Volume 24h"  value={formatNum(coin.volume24h)}                                          sub="USD"         />
          <StatCard label="Circulating" value={`${(coin.circulatingSupply / 1e6).toFixed(0)}M`}                    sub="STX"         />
          <StatCard label="Vol/MCap"    value={`${((coin.volume24h / coin.marketCap) * 100).toFixed(2)}%`}         sub="ratio" accent />
        </div>
      )}

      {/* TradingView Chart */}
      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black/20 mb-4">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-white/[0.06]">
          <span className="text-white/30 text-xs">STXUSD · COINBASE</span>
          <div className="flex gap-1">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  timeframe === tf
                    ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="px-2 pb-2">
          <TradingViewChart timeframe={timeframe} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-white/20">
        <span>Data: CoinGecko via /api/market · Chart: TradingView</span>
        <div className="flex gap-4">
          <a href="https://www.coingecko.com/en/coins/blockstack" target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">CoinGecko ↗</a>
          <a href="https://www.tradingview.com/symbols/STXUSD/"    target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition-colors">TradingView ↗</a>
        </div>
      </div>
    </div>
  );
}