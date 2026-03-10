'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV, PostConditionMode, AnchorMode } from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number
}

const TOAST_CONFIG: Record<ToastType, { color: string; icon: string; label: string }> = {
  success: { color: '#00ff9f', icon: '✓', label: 'SUCCESS' },
  error:   { color: '#ff4444', icon: '✗', label: 'ERROR'   },
  info:    { color: '#00d4ff', icon: 'i', label: 'INFO'    },
  warning: { color: '#ffd700', icon: '⚠', label: 'WARN'    },
}

export function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [progress, setProgress] = useState(100)
  const cfg = TOAST_CONFIG[type]

  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    const step  = 50
    const decrement = (step / duration) * 100
    const interval = setInterval(() => setProgress(p => Math.max(0, p - decrement)), step)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [duration, onClose])

  return (
    <div
      style={{ ...MONO, animation: 'slideInRight 0.2s ease-out' }}
      className="relative overflow-hidden rounded-xl border bg-black/95 min-w-[300px] max-w-sm shadow-2xl"
      // @ts-ignore
      style={{ ...MONO, border: `1px solid ${cfg.color}30`, boxShadow: `0 0 20px ${cfg.color}15`, animation: 'slideInRight 0.2s ease-out' }}
    >
      {/* top neon line */}
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${cfg.color}80,transparent)` }} />

      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
             style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40`, color: cfg.color }}>
          {cfg.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] tracking-[0.3em] font-black mb-0.5" style={{ color: cfg.color }}>{cfg.label}</p>
          <p className="text-white/80 text-xs leading-relaxed">{message}</p>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors text-xs flex-shrink-0 font-black">✕</button>
      </div>

      {/* Progress bar */}
      <div className="h-px bg-white/5">
        <div className="h-full transition-all duration-50" style={{ width: `${progress}%`, background: cfg.color, opacity: 0.6 }} />
      </div>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>
  onRemove: (id: string) => void
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type} onClose={() => onRemove(t.id)} />
      ))}
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// LIVE INDICATOR
// ═══════════════════════════════════════════════════════════

export function LiveIndicator({ connected, blockHeight }: { connected: boolean; blockHeight: number | null }) {
  return (
    <div style={MONO} className="flex items-center gap-2">
      <span
        className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'animate-pulse' : ''}`}
        style={{ background: connected ? '#00ff9f' : '#ff4444', boxShadow: connected ? '0 0 6px #00ff9f' : '0 0 6px #ff4444' }}
      />
      <span className="text-[10px] tracking-widest font-black" style={{ color: connected ? '#00ff9f' : '#ff4444' }}>
        {connected
          ? `LIVE${blockHeight ? ` // #${blockHeight.toLocaleString()}` : ''}`
          : 'RECONNECTING...'}
      </span>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// LOADING SPINNER
// ═══════════════════════════════════════════════════════════

export function LoadingSpinner({ size = 'md', color = '#00ff9f' }: { size?: 'sm' | 'md' | 'lg'; color?: string }) {
  const px = { sm: 14, md: 20, lg: 28 }[size]
  return (
    <svg width={px} height={px} viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" strokeOpacity="0.15" />
      <path d="M12 2 A10 10 0 0 1 22 12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function ButtonLoading({ children, loading, color = '#00ff9f', ...props }: any) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading
        ? <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" color={color} />{children}</span>
        : children
      }
    </button>
  )
}


// ═══════════════════════════════════════════════════════════
// SKELETONS
// ═══════════════════════════════════════════════════════════

const SkeletonLine = ({ w = 'w-full', h = 'h-4' }: { w?: string; h?: string }) => (
  <div className={`${w} ${h} rounded-lg bg-white/[0.05] animate-pulse`} />
)

export function CardSkeleton() {
  return (
    <div style={MONO} className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-white/10 animate-pulse" />
        <SkeletonLine w="w-32" h="h-3" />
      </div>
      <SkeletonLine w="w-3/4" h="h-5" />
      <SkeletonLine w="w-1/2" />
      <SkeletonLine w="w-2/3" />
    </div>
  )
}

export function LeaderboardSkeleton() {
  return (
    <div style={MONO} className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] animate-pulse">
          <div className="w-10 h-10 rounded-full bg-white/[0.06] flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <SkeletonLine w="w-32" h="h-3" />
            <SkeletonLine w="w-24" h="h-2.5" />
          </div>
          <div className="space-y-1.5 text-right">
            <SkeletonLine w="w-16" h="h-3" />
            <SkeletonLine w="w-10" h="h-2.5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} style={MONO} className="rounded-2xl border border-white/[0.06] bg-black/40 p-4 space-y-2 animate-pulse">
          <SkeletonLine w="w-20" h="h-2.5" />
          <SkeletonLine w="w-16" h="h-6" />
          <SkeletonLine w="w-12" h="h-2" />
        </div>
      ))}
    </div>
  )
}

export function TransactionSkeleton() {
  return (
    <div className="space-y-1.5">
      {[...Array(3)].map((_, i) => (
        <div key={i} style={MONO} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] p-3 animate-pulse">
          <div className="w-1 h-10 rounded-full bg-white/10 flex-shrink-0" />
          <div className="flex-1 space-y-1.5"><SkeletonLine w="w-20" h="h-3" /><SkeletonLine w="w-28" h="h-2.5" /></div>
          <div className="space-y-1.5 text-right"><SkeletonLine w="w-16" h="h-3" /><SkeletonLine w="w-12" h="h-2.5" /></div>
        </div>
      ))}
    </div>
  )
}

export function CalculatorSkeleton() {
  return (
    <div style={MONO} className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 space-y-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-white/10" />
        <SkeletonLine w="w-40" h="h-2.5" />
      </div>
      <SkeletonLine w="w-1/2" h="h-6" />
      <SkeletonLine h="h-12" />
      <div className="flex gap-2">{[...Array(5)].map((_,i) => <SkeletonLine key={i} h="h-9" />)}</div>
      <SkeletonLine h="h-2" />
      <SkeletonLine h="h-28" />
    </div>
  )
}

export function BalanceSkeleton() {
  return (
    <div style={MONO} className="rounded-2xl border border-white/[0.06] bg-black/40 p-5 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2"><SkeletonLine w="w-24" h="h-2.5" /><SkeletonLine h="h-3" /></div>
        <div className="space-y-2"><SkeletonLine w="w-20" h="h-2.5" /><SkeletonLine w="w-32" h="h-7" /></div>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════════════════════
// BRIDGE ROUTER
// ═══════════════════════════════════════════════════════════

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const FEE_ROUTER_CONTRACT = 'b2s-fee-router'
const DECIMALS         = 1_000_000

const BRIDGE_CHAINS = [
  { chain: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { chain: 'Base',     icon: '●', color: '#0052FF' },
  { chain: 'BNB',      icon: '◆', color: '#F3BA2F' },
  { chain: 'Polygon',  icon: '◈', color: '#8247E5' },
]

const BRIDGE_LIST = [
  { name: 'Stargate',     url: 'https://stargate.finance',           tag: 'RECOMMENDED', color: '#00ff9f', routes: 20 },
  { name: 'deBridge',     url: 'https://app.debridge.com/r/32893',   tag: 'AFFILIATE',   color: '#ff00ff', routes: 8  },
  { name: 'Across',       url: 'https://across.to',                  tag: 'FAST',        color: '#00d4ff', routes: 10 },
  { name: 'Celer cBridge',url: 'https://cbridge.celer.network',      tag: 'MULTI-CHAIN', color: '#ffff00', routes: 15 },
  { name: 'Orbiter',      url: 'https://www.orbiter.finance',        tag: 'ZK-POWERED',  color: '#cc00ff', routes: 6  },
  { name: 'Rango',        url: 'https://rango.vip/a/o9pwCm',         tag: 'AFFILIATE',   color: '#ff6600', routes: 12 },
  { name: 'Jupiter Swap', url: 'https://jup.ag/?ref=j5ft3v5m26eu',   tag: 'SOLANA',      color: '#ffd700', routes: 5  },
]

interface BridgeStats { totalVolume: number; totalFees: number; bridgeCount: number; feeBps: number; loading: boolean }
interface UserStats   { bridgeCount: number; volume: number }

export default function BridgeRouter() {
  const { address, isConnected } = useWallet()
  const [activeTab, setActiveTab]     = useState<'bridge'|'record'|'stats'>('bridge')
  const [recordAmount, setRecordAmount] = useState('')
  const [loading, setLoading]         = useState(false)
  const [txId, setTxId]               = useState<string | null>(null)
  const [stats, setStats]             = useState<BridgeStats>({ totalVolume: 0, totalFees: 0, bridgeCount: 0, feeBps: 30, loading: true })
  const [userStats, setUserStats]     = useState<UserStats>({ bridgeCount: 0, volume: 0 })

  const fetchStats = useCallback(async () => {
    try {
      const result = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: FEE_ROUTER_CONTRACT, functionName: 'get-stats', functionArgs: [], senderAddress: address || CONTRACT_ADDRESS })
      const data = cvToJSON(result).value
      setStats({ totalVolume: Number(data['total-volume']?.value || 0) / DECIMALS, totalFees: Number(data['total-fees']?.value || 0) / DECIMALS, bridgeCount: Number(data['bridge-count']?.value || 0), feeBps: Number(data['fee-bps']?.value || 30), loading: false })
    } catch { setStats(p => ({ ...p, loading: false })) }
  }, [address])

  const fetchUserStats = useCallback(async () => {
    if (!address) return
    try {
      const result = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: FEE_ROUTER_CONTRACT, functionName: 'get-user-stats', functionArgs: [standardPrincipalCV(address)], senderAddress: address })
      const data = cvToJSON(result).value
      setUserStats({ bridgeCount: Number(data['bridge-count']?.value || 0), volume: Number(data.volume?.value || 0) / DECIMALS })
    } catch {}
  }, [address])

  useEffect(() => { fetchStats(); const t = setInterval(fetchStats, 30_000); return () => clearInterval(t) }, [fetchStats])
  useEffect(() => { if (address) fetchUserStats() }, [address, fetchUserStats])

  const feePreview = recordAmount ? ((parseFloat(recordAmount) * stats.feeBps) / 10000).toFixed(4) : '0'

  const handleRecordBridge = async () => {
    if (!address || !recordAmount || parseFloat(recordAmount) <= 0) return
    setLoading(true); setTxId(null)
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: FEE_ROUTER_CONTRACT,
        functionName: 'record-bridge', functionArgs: [uintCV(Math.floor(parseFloat(recordAmount) * DECIMALS))],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (d) => { setTxId(d.txId); setRecordAmount(''); setLoading(false); setTimeout(() => { fetchStats(); fetchUserStats() }, 5000) },
        onCancel: () => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  const TABS = [
    { key: 'bridge', label: '// BRIDGE'  },
    { key: 'record', label: '// RECORD'  },
    { key: 'stats',  label: '// MY STATS'},
  ] as const

  return (
    <div style={MONO} className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#00d4ff]/20 bg-black/70 p-5">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,212,255,0.01) 3px,rgba(0,212,255,0.01) 4px)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/60 to-transparent" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" style={{ boxShadow: '0 0 8px #00d4ff' }} />
              <span className="text-[#00d4ff] text-[10px] tracking-[0.3em] font-black">FEE ROUTER // B2S-FEE-ROUTER</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">CROSS-CHAIN BRIDGE</h2>
            <p className="text-white/25 text-[10px] mt-1 tracking-wider">
              {(stats.feeBps / 100).toFixed(1)}% FEE → 50% TREASURY · 50% STAKERS
            </p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'VOLUME',  val: stats.loading ? '...' : `${stats.totalVolume.toLocaleString()}`, unit: 'STX', color: '#00d4ff' },
              { label: 'FEES',    val: stats.loading ? '...' : stats.totalFees.toFixed(2),              unit: 'STX', color: '#00ff9f' },
              { label: 'BRIDGES', val: stats.loading ? '...' : stats.bridgeCount,                       unit: 'txs', color: '#ff00ff' },
              { label: 'FEE',     val: `${(stats.feeBps / 100).toFixed(1)}%`,                           unit: 'rate',color: '#ffd700' },
            ].map(s => (
              <div key={s.label} className="rounded-xl px-2.5 py-2 text-center" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                <p className="font-black text-base tabular-nums" style={{ color: s.color, textShadow: `0 0 8px ${s.color}50` }}>{s.val}</p>
                <p className="text-white/20 text-[9px] tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chains */}
      <div className="flex gap-3">
        {BRIDGE_CHAINS.map(c => (
          <div key={c.chain} className="flex-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center hover:border-white/20 transition-all">
            <span className="text-xl block mb-1" style={{ color: c.color }}>{c.icon}</span>
            <p className="text-[9px] font-black tracking-widest" style={{ color: c.color }}>{c.chain.toUpperCase()}</p>
          </div>
        ))}
        <div className="flex-1 rounded-xl border border-[#FF5500]/20 bg-[#FF5500]/[0.06] p-3 text-center">
          <span className="text-xl block mb-1" style={{ color: '#FF5500' }}>₿</span>
          <p className="text-[9px] font-black tracking-widest" style={{ color: '#FF5500' }}>STACKS</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-2xl border border-white/[0.06] w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className="px-5 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all"
            style={{
              background: activeTab === t.key ? 'rgba(0,212,255,0.12)' : 'transparent',
              border:     activeTab === t.key ? '1px solid rgba(0,212,255,0.3)' : '1px solid transparent',
              color:      activeTab === t.key ? '#00d4ff' : 'rgba(255,255,255,0.3)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: BRIDGE ── */}
      {activeTab === 'bridge' && (
        <div className="space-y-4">
          {/* Steps */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { n: '01', title: 'SELECT SOURCE', desc: 'Choose chain + token',    color: '#00d4ff' },
              { n: '02', title: 'BRIDGE',        desc: 'Best route 20+ bridges',  color: '#ff00ff' },
              { n: '03', title: 'RECEIVE',       desc: 'USDCx or STX on Stacks', color: '#00ff9f' },
            ].map(s => (
              <div key={s.n} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: s.color }}>{s.n}</p>
                <p className="text-white font-black text-xs tracking-wide mb-1">{s.title}</p>
                <p className="text-white/25 text-[10px]">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* Bridge cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {BRIDGE_LIST.map(b => (
              <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 hover:border-white/20 transition-all duration-200 hover:-translate-y-px flex items-center gap-3">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at 0% 50%, ${b.color}08, transparent 60%)` }} />
                <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: b.color }} />
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest" style={{ color: b.color, background: `${b.color}15`, border: `1px solid ${b.color}30` }}>{b.tag}</span>
                  </div>
                  <p className="text-white font-black text-sm">{b.name}</p>
                  <p className="text-white/20 text-[9px] font-mono">{b.routes} routes</p>
                </div>
                <span className="text-white/20 group-hover:text-white/60 transition-colors text-sm relative">↗</span>
              </a>
            ))}
          </div>

          <div className="rounded-xl border border-[#00d4ff]/15 bg-[#00d4ff]/[0.04] px-4 py-3">
            <p className="text-[10px] font-mono" style={{ color: 'rgba(0,212,255,0.6)' }}>
              {'>'} After bridging, use the RECORD tab to log your TX and support the ecosystem<span className="animate-pulse">_</span>
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: RECORD ── */}
      {activeTab === 'record' && (
        <div className="max-w-lg mx-auto space-y-4">
          <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5 space-y-4">
            <div>
              <p className="text-white/25 text-[9px] tracking-widest font-black mb-1">RECORD_BRIDGE_TX</p>
              <p className="text-white/40 text-xs leading-relaxed">
                Already bridged via external protocol? Log it here.
                {' '}<span style={{ color: '#ffd700' }}>{(stats.feeBps / 100).toFixed(1)}%</span> fee → treasury + stakers.
              </p>
            </div>

            <div className="relative">
              <input
                type="number" value={recordAmount} onChange={e => setRecordAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-lg font-black placeholder-white/20 focus:outline-none focus:border-[#00d4ff]/40 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 text-xs font-black">STX</span>
            </div>

            {recordAmount && parseFloat(recordAmount) > 0 && (
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] divide-y divide-white/[0.04] text-xs">
                {[
                  { label: 'BRIDGE AMOUNT', val: `${parseFloat(recordAmount).toFixed(4)} STX`,  color: '' },
                  { label: `FEE (${(stats.feeBps/100).toFixed(1)}%)`, val: `-${feePreview} STX`, color: '#ffd700' },
                  { label: '→ 50% TREASURY', val: `${(parseFloat(feePreview)/2).toFixed(4)} STX`, color: 'rgba(255,255,255,0.3)' },
                  { label: '→ 50% STAKERS',  val: `${(parseFloat(feePreview)/2).toFixed(4)} STX`, color: 'rgba(255,255,255,0.3)' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between px-4 py-2.5">
                    <span className="text-white/25 text-[9px] tracking-widest">{row.label}</span>
                    <span className="font-black text-[10px]" style={{ color: row.color || 'rgba(255,255,255,0.6)' }}>{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {!isConnected
              ? <p className="text-center text-white/20 text-xs py-3 font-mono">WALLET_NOT_CONNECTED</p>
              : <button
                  onClick={handleRecordBridge}
                  disabled={!recordAmount || parseFloat(recordAmount) <= 0 || loading}
                  className="w-full py-3 rounded-xl text-xs font-black tracking-widest transition-all disabled:opacity-30 hover:opacity-80"
                  style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.35)', color: '#00d4ff' }}>
                  {loading ? '⏳ RECORDING...' : '▶ RECORD BRIDGE TX'}
                </button>
            }

            {txId && (
              <div className="rounded-xl border border-[#00ff9f]/20 bg-[#00ff9f]/[0.05] px-4 py-3">
                <p className="text-[#00ff9f] text-[9px] font-black tracking-widest mb-1">✓ TX_RECORDED</p>
                <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                  className="text-white/25 text-[10px] font-mono hover:text-white/50 break-all">VIEW_EXPLORER ↗</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: STATS ── */}
      {activeTab === 'stats' && (
        <div className="max-w-lg mx-auto space-y-4">
          {!isConnected
            ? <div className="text-center py-12 rounded-2xl border border-white/[0.07] bg-black/40">
                <p className="text-white font-black tracking-widest mb-1">WALLET_NOT_CONNECTED</p>
                <p className="text-white/25 text-xs">Connect to view your bridge stats</p>
              </div>
            : <>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'YOUR BRIDGES', val: userStats.bridgeCount, color: '#00d4ff' },
                    { label: 'YOUR VOLUME',  val: `${userStats.volume.toLocaleString()} STX`, color: '#00ff9f' },
                  ].map(s => (
                    <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-center">
                      <p className="text-white/25 text-[9px] tracking-widest mb-1">{s.label}</p>
                      <p className="font-black text-2xl tabular-nums" style={{ color: s.color, textShadow: `0 0 12px ${s.color}50` }}>{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5 divide-y divide-white/[0.05]">
                  <p className="text-white/25 text-[9px] tracking-widest font-black pb-3">GLOBAL_STATS</p>
                  {[
                    { label: 'TOTAL_BRIDGES', val: stats.bridgeCount.toString(),              color: '' },
                    { label: 'TOTAL_VOLUME',  val: `${stats.totalVolume.toLocaleString()} STX`, color: '' },
                    { label: 'FEES_COLLECTED',val: `${stats.totalFees.toFixed(4)} STX`,        color: '#00ff9f' },
                    { label: 'FEE_RATE',      val: `${(stats.feeBps/100).toFixed(1)}%`,        color: '#ffd700' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between py-2.5 text-xs font-mono">
                      <span className="text-white/25 tracking-widest">{row.label}</span>
                      <span className="font-black" style={{ color: row.color || 'rgba(255,255,255,0.6)' }}>{row.val}</span>
                    </div>
                  ))}
                </div>

                <a href={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${FEE_ROUTER_CONTRACT}?chain=mainnet`}
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center text-[10px] font-black tracking-widest hover:opacity-70 transition-opacity py-2" style={{ color: '#00d4ff' }}>
                  VIEW_CONTRACT_EXPLORER ↗
                </a>
              </>
          }
        </div>
      )}
    </div>
  )
}