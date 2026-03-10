'use client';

import { useState, useEffect, useRef } from 'react';

const CHAINS = [
  { chain: 'Ethereum', icon: '⟠', tag: 'ETH',   color: '#627EEA', glow: 'shadow-[0_0_20px_rgba(98,126,234,0.4)]',  border: 'border-[#627EEA]/40', bg: 'bg-[#627EEA]/10', tvl: '~$2.1B',  latency: '~12s' },
  { chain: 'Base',     icon: '●', tag: 'BASE',   color: '#0052FF', glow: 'shadow-[0_0_20px_rgba(0,82,255,0.4)]',    border: 'border-[#0052FF]/40', bg: 'bg-[#0052FF]/10', tvl: '~$890M',  latency: '~2s'  },
  { chain: 'BNB',      icon: '◆', tag: 'BNB',   color: '#F3BA2F', glow: 'shadow-[0_0_20px_rgba(243,186,47,0.4)]',  border: 'border-[#F3BA2F]/40', bg: 'bg-[#F3BA2F]/10', tvl: '~$650M',  latency: '~3s'  },
  { chain: 'Polygon',  icon: '◈', tag: 'MATIC', color: '#8247E5', glow: 'shadow-[0_0_20px_rgba(130,71,229,0.4)]',  border: 'border-[#8247E5]/40', bg: 'bg-[#8247E5]/10', tvl: '~$420M',  latency: '~2s'  },
  { chain: 'Solana',   icon: '◎', tag: 'SOL',   color: '#9945FF', glow: 'shadow-[0_0_20px_rgba(153,69,255,0.4)]',  border: 'border-[#9945FF]/40', bg: 'bg-[#9945FF]/10', tvl: '~$1.4B',  latency: '~0.4s'},
  { chain: 'Arbitrum', icon: '◇', tag: 'ARB',   color: '#28A0F0', glow: 'shadow-[0_0_20px_rgba(40,160,240,0.4)]',  border: 'border-[#28A0F0]/40', bg: 'bg-[#28A0F0]/10', tvl: '~$980M',  latency: '~1s'  },
  { chain: 'Avalanche',icon: '▲', tag: 'AVAX',  color: '#E84142', glow: 'shadow-[0_0_20px_rgba(232,65,66,0.4)]',   border: 'border-[#E84142]/40', bg: 'bg-[#E84142]/10', tvl: '~$310M',  latency: '~2s'  },
  { chain: 'Stacks',   icon: '₿', tag: 'STX',   color: '#FF5500', glow: 'shadow-[0_0_20px_rgba(255,85,0,0.5)]',    border: 'border-[#FF5500]/40', bg: 'bg-[#FF5500]/10', tvl: '~$190M',  latency: '~10m', dest: true },
];

const BRIDGES = [
  { name: 'Jumper Exchange', url: 'https://jumper.exchange',           tag: 'RECOMMENDED', color: '#00ff9f', routes: 20, fee: '0.05%' },
  { name: 'deBridge',        url: 'https://app.debridge.com/r/32893',  tag: 'AFFILIATE',   color: '#ff00ff', routes: 8,  fee: '0.10%' },
  { name: 'Stargate',        url: 'https://stargate.finance',          tag: 'LAYER ZERO',  color: '#00d4ff', routes: 12, fee: '0.06%' },
  { name: 'Celer cBridge',   url: 'https://cbridge.celer.network',     tag: 'FAST',        color: '#ffff00', routes: 15, fee: '0.04%' },
  { name: 'Across',          url: 'https://across.to',                 tag: 'OPTIMISTIC',  color: '#ff6600', routes: 10, fee: '0.03%' },
  { name: 'Orbiter',         url: 'https://www.orbiter.finance',       tag: 'L2 NATIVE',   color: '#cc00ff', routes: 6,  fee: '0.08%' },
];

const STEPS = [
  { step: '01', title: 'SELECT SOURCE',   desc: 'Pick origin chain + token',                   color: '#00ff9f' },
  { step: '02', title: 'ROUTE SCAN',      desc: 'AI finds best path across 20+ bridges',       color: '#00d4ff' },
  { step: '03', title: 'EXECUTE TX',      desc: 'Sign once, bridge in seconds',                color: '#ff00ff' },
  { step: '04', title: 'RECEIVE STX',     desc: 'Land USDCx or STX on Stacks mainnet',         color: '#ff5500' },
];

const LOGS = [
  '> INITIALIZING bridge scanner...',
  '> SCANNING 20 protocols across 8 chains...',
  '> FOUND 6 viable paths',
  '> BEST ROUTE: ETH → Jumper → STX  [fee: 0.05%]',
  '> SECURITY CHECK: contract verified ✓',
  '> LIQUIDITY depth: SUFFICIENT ✓',
  '> SLIPPAGE estimate: 0.12% ✓',
  '> STATUS: READY — awaiting confirmation',
];

function TerminalLog() {
  const [lines, setLines] = useState<string[]>([]);
  const [cursor, setCursor] = useState(true);
  const idx = useRef(0);

  useEffect(() => {
    idx.current = 0;
    setLines([]);
    const push = () => {
      if (idx.current < LOGS.length) {
        setLines(prev => [...prev, LOGS[idx.current]]);
        idx.current++;
      } else {
        setTimeout(() => { idx.current = 0; setLines([]); }, 2000);
      }
    };
    push();
    const t = setInterval(push, 800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="font-mono text-xs leading-relaxed space-y-1">
      {lines.map((l, i) => (
        <div
          key={i}
          className="transition-all duration-300"
          style={{ color: i === lines.length - 1 ? '#00ff9f' : 'rgba(0,255,159,0.35)' }}
        >
          {l}{i === lines.length - 1 && <span className={cursor ? 'opacity-100' : 'opacity-0'}>█</span>}
        </div>
      ))}
    </div>
  );
}

function ChainCard({ chain, selected, onClick, isTarget }: {
  chain: typeof CHAINS[0]; selected: boolean; onClick: () => void; isTarget?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-xl border p-3 text-left transition-all duration-300 w-full
        ${selected
          ? `${chain.border} ${chain.bg} ${chain.glow}`
          : 'border-white/[0.07] bg-white/[0.02] hover:border-white/20'
        }
      `}
    >
      {isTarget && (
        <div
          className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest"
          style={{ background: `${chain.color}20`, color: chain.color, border: `1px solid ${chain.color}40` }}
        >
          DEST
        </div>
      )}
      {selected && (
        <div className="absolute inset-0 opacity-[0.08]"
             style={{ background: `radial-gradient(circle at 30% 50%, ${chain.color}, transparent 70%)` }} />
      )}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xl" style={{ color: selected ? chain.color : 'rgba(255,255,255,0.3)' }}>
          {chain.icon}
        </span>
        <span
          className="text-[10px] font-black tracking-widest"
          style={{ color: selected ? chain.color : 'rgba(255,255,255,0.3)' }}
        >
          {chain.tag}
        </span>
      </div>
      <p className={`text-xs font-bold ${selected ? 'text-white' : 'text-white/40'}`}>{chain.chain}</p>
      <div className="mt-1.5 flex gap-2">
        <p className="text-[9px] text-white/20">TVL {chain.tvl}</p>
        <p className="text-[9px] text-white/20">{chain.latency}</p>
      </div>
      {selected && (
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${chain.color}, transparent)` }}
        />
      )}
    </button>
  );
}

export default function CrossChainBridge() {
  const [selectedFrom, setSelectedFrom] = useState(0);
  const [showWidget, setShowWidget]     = useState(false);
  const [scanning, setScanning]         = useState(false);

  const triggerScan = () => {
    setScanning(false);
    setTimeout(() => setScanning(true), 50);
  };

  return (
    <div
      className="cross-chain-bridge space-y-5"
      style={{ fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}
    >

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden rounded-2xl border border-[#00ff9f]/20 bg-black/70 p-6">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,159,0.012) 3px, rgba(0,255,159,0.012) 4px)',
          }}
        />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff9f]/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff9f]/20 to-transparent" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff9f] animate-pulse shadow-[0_0_8px_#00ff9f]" />
              <span className="text-[#00ff9f] text-[10px] tracking-[0.3em] font-black">SYSTEM ONLINE // v2.4.1</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              CROSS-CHAIN BRIDGE
            </h2>
            <p className="text-white/30 text-[10px] mt-1 tracking-[0.2em]">
              ROUTE ETH · BASE · BNB · SOL · MATIC → STACKS MAINNET
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'BRIDGES', val: '20+',  color: '#00ff9f' },
              { label: 'CHAINS',  val: '8',    color: '#00d4ff' },
              { label: 'UPTIME',  val: '99.9%',color: '#ff00ff' },
            ].map(s => (
              <div key={s.label} className="px-3 py-2 rounded-xl text-center" style={{ border: `1px solid ${s.color}20`, background: `${s.color}08` }}>
                <p className="font-black text-xl tabular-nums" style={{ color: s.color, textShadow: `0 0 12px ${s.color}60` }}>{s.val}</p>
                <p className="text-white/25 text-[9px] tracking-widest mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CHAIN SELECTOR ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[#00d4ff] text-[10px] tracking-[0.3em] font-black">// SELECT CHAINS</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[#00d4ff]/30 to-transparent" />
        </div>

        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* FROM */}
          <div className="flex-1 w-full">
            <p className="text-white/25 text-[9px] tracking-[0.3em] font-black mb-3">FROM</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
              {CHAINS.filter(c => !c.dest).map((chain, i) => (
                <ChainCard
                  key={chain.chain}
                  chain={chain}
                  selected={selectedFrom === i}
                  onClick={() => setSelectedFrom(i)}
                />
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex lg:flex-col items-center justify-center gap-2 lg:py-8 self-center">
            <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-transparent via-[#00ff9f]/40 to-transparent" />
            <div
              className="text-3xl font-black animate-pulse lg:rotate-90"
              style={{ color: '#00ff9f', textShadow: '0 0 12px #00ff9f' }}
            >
              →
            </div>
            <div className="hidden lg:block w-px h-12 bg-gradient-to-b from-[#00ff9f]/40 via-transparent to-transparent" />
          </div>

          {/* TO — Stacks only */}
          <div className="lg:w-44 w-full">
            <p className="text-white/25 text-[9px] tracking-[0.3em] font-black mb-3">TO</p>
            <ChainCard chain={CHAINS[7]} selected={true} onClick={() => {}} isTarget />
          </div>
        </div>
      </div>

      {/* ── TERMINAL SCANNER ── */}
      <div className="rounded-2xl border border-[#00ff9f]/15 bg-black/70 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#00ff9f]/10">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
            </div>
            <span className="text-[#00ff9f]/60 text-[10px] tracking-widest">bridge-scanner — bash</span>
          </div>
          <button
            onClick={triggerScan}
            className="px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all hover:opacity-80"
            style={{ background: 'rgba(0,255,159,0.1)', border: '1px solid rgba(0,255,159,0.3)', color: '#00ff9f' }}
          >
            ▶ RUN SCAN
          </button>
        </div>
        <div className="p-5 min-h-[140px]">
          {scanning
            ? <TerminalLog key={String(scanning)} />
            : <p className="text-white/15 text-xs font-mono">{'>'} Awaiting scan trigger<span className="animate-pulse">_</span></p>
          }
        </div>
      </div>

      {/* ── PIPELINE ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[#ff00ff] text-[10px] tracking-[0.3em] font-black">// EXECUTION PIPELINE</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[#ff00ff]/30 to-transparent" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STEPS.map((s, i) => (
            <div key={s.step} className="relative group">
              {i < STEPS.length - 1 && (
                <div
                  className="hidden md:block absolute top-6 left-full w-full h-px z-10"
                  style={{ background: `linear-gradient(90deg, ${s.color}50, transparent)` }}
                />
              )}
              <div
                className="rounded-xl p-4 border transition-all duration-300 hover:-translate-y-0.5"
                style={{ borderColor: `${s.color}20`, background: `${s.color}06` }}
              >
                <p
                  className="text-[10px] font-black tracking-widest mb-2"
                  style={{ color: s.color, textShadow: `0 0 8px ${s.color}60` }}
                >
                  {s.step}
                </p>
                <p className="text-white font-black text-xs tracking-wide mb-1">{s.title}</p>
                <p className="text-white/30 text-[10px] leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── WIDGET ── */}
      <div className="rounded-2xl border border-[#00d4ff]/20 bg-black/60 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#00d4ff]/10">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse"
              style={{ boxShadow: '0 0 8px #00d4ff' }}
            />
            <span className="text-[#00d4ff] text-[10px] tracking-widest font-black">// JUMPER BRIDGE INTERFACE</span>
          </div>
          <button
            onClick={() => setShowWidget(w => !w)}
            className="px-4 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all hover:opacity-80"
            style={{
              background: showWidget ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
              border: '1px solid rgba(0,212,255,0.3)',
              color: '#00d4ff',
            }}
          >
            {showWidget ? '▼ COLLAPSE' : '▶ LAUNCH WIDGET'}
          </button>
        </div>

        {!showWidget ? (
          <div className="px-5 py-8 text-center">
            <p className="text-white/15 text-xs font-mono mb-4">
              {'>'} Widget collapsed — click LAUNCH to open bridge UI<span className="animate-pulse">_</span>
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {['Jumper', 'Li.Fi', 'Squid', 'Socket', 'LayerZero', 'Axelar'].map(p => (
                <span
                  key={p}
                  className="px-2 py-1 rounded text-[9px] font-black tracking-wider"
                  style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', color: 'rgba(0,212,255,0.5)' }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ height: '640px' }}>
            <iframe
              src="https://jumper.exchange/?theme=dark"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              title="Cross-Chain Bridge via Jumper"
              allow="clipboard-write"
            />
          </div>
        )}
      </div>

      {/* ── BRIDGE DIRECTORY ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[#ffff00] text-[10px] tracking-[0.3em] font-black">// BRIDGE DIRECTORY</span>
          <div className="flex-1 h-px bg-gradient-to-r from-[#ffff00]/30 to-transparent" />
          <span className="text-white/15 text-[9px] tracking-widest">{BRIDGES.length} PROTOCOLS</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BRIDGES.map(b => (
            <a
              key={b.name}
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 hover:border-white/20 transition-all duration-300 hover:-translate-y-0.5 block"
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: `radial-gradient(circle at 50% 0%, ${b.color}0a, transparent 60%)` }}
              />
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, transparent, ${b.color}80, transparent)` }}
              />

              <div className="flex items-start justify-between mb-3">
                <span
                  className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest"
                  style={{ color: b.color, border: `1px solid ${b.color}40`, background: `${b.color}10` }}
                >
                  {b.tag}
                </span>
                <span className="text-white/20 text-sm group-hover:text-white/60 transition-colors">↗</span>
              </div>

              <p className="text-white font-black text-sm tracking-wide mb-2">{b.name}</p>

              <div className="flex gap-4 text-[10px] text-white/25 font-mono">
                <span>{b.routes} routes</span>
                <span>fee {b.fee}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* ── SECURITY NOTICE ── */}
      <div
        className="rounded-xl px-5 py-4 flex items-start gap-3"
        style={{ border: '1px solid rgba(255,102,0,0.2)', background: 'rgba(255,102,0,0.04)' }}
      >
        <span className="text-[#ff6600] text-base flex-shrink-0" style={{ textShadow: '0 0 8px #ff660060' }}>⚠</span>
        <div>
          <p className="text-[#ff6600] text-[10px] font-black tracking-widest mb-1">SECURITY NOTICE</p>
          <p className="text-white/30 text-[10px] leading-relaxed font-mono">
            Always verify contract addresses on Explorer. Never bridge to unverified addresses.
            deBridge link is affiliate — same protocol, same fees.
          </p>
        </div>
      </div>

    </div>
  );
}