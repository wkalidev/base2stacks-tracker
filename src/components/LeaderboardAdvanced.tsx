'use client'

import { useState, useEffect, useCallback } from 'react'

const STAKING_CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-staking-vault-v2'
const HIRO_API = 'https://api.mainnet.hiro.so'
const DECIMALS = 1_000_000

interface LeaderboardEntry {
  rank: number
  address: string
  staked: number
  multiplier: number
  unlockBlock: number
  badges: string[]
}

interface OnChainStats {
  totalStaked: number
  totalVaults: number
}

async function fetchOnChainStats(): Promise<OnChainStats> {
  try {
    const res = await fetch(
      `${HIRO_API}/v2/contracts/call-read/${STAKING_CONTRACT.split('.')[0]}/${STAKING_CONTRACT.split('.')[1]}/get-stats`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sender: STAKING_CONTRACT.split('.')[0], arguments: [] }) }
    )
    if (!res.ok) return { totalStaked: 0, totalVaults: 0 }
    const data = await res.json()
    const result = data?.result || ''
    const stakedMatch = result.match(/total-staked.*?u(\d+)/)
    const vaultsMatch = result.match(/total-vaults.*?u(\d+)/)
    return {
      totalStaked: stakedMatch ? parseInt(stakedMatch[1]) / DECIMALS : 0,
      totalVaults: vaultsMatch ? parseInt(vaultsMatch[1]) : 0,
    }
  } catch { return { totalStaked: 0, totalVaults: 0 } }
}

async function fetchStakers(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/address/${STAKING_CONTRACT}/transactions?limit=50&offset=0`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    const stakers = new Map<string, { staked: number; multiplier: number; unlockBlock: number }>()
    for (const tx of data.results || []) {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.function_name === 'stake' && tx.tx_status === 'success') {
        const args = tx.contract_call?.function_args || []
        const amount = args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) / DECIMALS : 0
        const lockBlocks = args[1]?.repr ? parseInt(args[1].repr.replace('u', '')) : 0
        const multiplier = lockBlocks >= 2100 ? 3 : lockBlocks >= 1050 ? 2 : lockBlocks >= 525 ? 1.5 : 1
        const blockHeight = tx.block_height || 0
        if (!stakers.has(tx.sender_address) || stakers.get(tx.sender_address)!.staked < amount)
          stakers.set(tx.sender_address, { staked: amount, multiplier, unlockBlock: blockHeight + lockBlocks })
      }
      if (tx.tx_type === 'contract_call' && tx.contract_call?.function_name === 'unstake' && tx.tx_status === 'success')
        stakers.delete(tx.sender_address)
    }
    return Array.from(stakers.entries()).sort((a, b) => b[1].staked - a[1].staked).map(([address, d], i) => ({
      rank: i + 1, address, staked: d.staked, multiplier: d.multiplier, unlockBlock: d.unlockBlock,
      badges: getBadges(i + 1, d.multiplier),
    }))
  } catch { return [] }
}

function getBadges(rank: number, multiplier: number): string[] {
  const b: string[] = []
  if (rank === 1) b.push('👑')
  if (rank === 2) b.push('🥈')
  if (rank === 3) b.push('🥉')
  if (multiplier >= 3) b.push('💎')
  if (multiplier >= 2) b.push('🔥')
  if (multiplier >= 1.5) b.push('⚡')
  return b
}

const RANK_COLOR: Record<number, string> = { 1: '#ffd700', 2: '#c0c0c0', 3: '#cd7f32' }
const MULT_COLOR: Record<number, string> = { 3: '#00ff9f', 2: '#00d4ff', 1.5: '#ff00ff', 1: 'rgba(255,255,255,0.3)' }

function formatAddress(a: string) { return `${a.slice(0, 6)}···${a.slice(-4)}` }

export function LeaderboardAdvanced() {
  const [entries, setEntries]   = useState<LeaderboardEntry[]>([])
  const [stats, setStats]       = useState<OnChainStats>({ totalStaked: 0, totalVaults: 0 })
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState<'top10' | 'top50' | 'all'>('top10')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const [stakers, onChainStats] = await Promise.all([fetchStakers(), fetchOnChainStats()])
      setEntries(stakers); setStats(onChainStats); setLastUpdated(new Date())
    } catch { setError('FETCH_ERROR: failed to reach mainnet') } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData(); const t = setInterval(loadData, 120_000); return () => clearInterval(t) }, [loadData])

  const visible = entries.slice(0, filter === 'top10' ? 10 : filter === 'top50' ? 50 : entries.length)

  return (
    <div style={{ fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }} className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#ffd700]/20 bg-black/70 p-5">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,215,0,0.01) 3px,rgba(255,215,0,0.01) 4px)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ffd700]/60 to-transparent" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#ffd700] animate-pulse" style={{ boxShadow: '0 0 8px #ffd700' }} />
              <span className="text-[#ffd700] text-[10px] tracking-[0.3em] font-black">STAKING LEADERBOARD // LIVE</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">VAULT RANKINGS</h2>
            {lastUpdated && <p className="text-white/20 text-[10px] mt-1 font-mono">LAST_SYNC: {lastUpdated.toLocaleTimeString()}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadData} className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/40 hover:text-white transition-all text-sm hover:border-white/20">⟳</button>
            <div className="flex rounded-xl overflow-hidden border border-white/10">
              {(['top10','top50','all'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className="px-3 py-1.5 text-[10px] font-black tracking-widest transition-all"
                  style={{ background: filter === f ? 'rgba(255,215,0,0.15)' : 'transparent', color: filter === f ? '#ffd700' : 'rgba(255,255,255,0.3)' }}>
                  {f === 'top10' ? 'TOP 10' : f === 'top50' ? 'TOP 50' : 'ALL'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-[#ff4444]/30 bg-[#ff4444]/[0.06] px-4 py-3 text-[#ff4444] text-xs font-mono">
          ⚠ {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl border border-white/[0.05] bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && entries.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-white/[0.07] bg-black/40">
          <p className="text-4xl mb-3">🏦</p>
          <p className="text-white font-black tracking-wide mb-1">NO_STAKERS_FOUND</p>
          <a href={`https://explorer.hiro.so/address/${STAKING_CONTRACT}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
            className="text-[10px] tracking-widest font-mono" style={{ color: '#ffd700' }}>
            VIEW CONTRACT ↗
          </a>
        </div>
      )}

      {/* Entries */}
      {!loading && visible.length > 0 && (
        <div className="space-y-2">
          {visible.map((entry, idx) => {
            const rankColor = RANK_COLOR[entry.rank] || 'rgba(255,255,255,0.2)'
            const multColor = MULT_COLOR[entry.multiplier] || 'rgba(255,255,255,0.3)'
            const isTop3 = entry.rank <= 3
            return (
              <div key={entry.address}
                className="group relative overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
                style={{ borderColor: isTop3 ? `${rankColor}30` : 'rgba(255,255,255,0.06)', background: isTop3 ? `${rankColor}06` : 'rgba(255,255,255,0.02)' }}>
                {isTop3 && <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${rankColor}60,transparent)` }} />}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at 0% 50%, ${rankColor}08, transparent 60%)` }} />

                <div className="relative flex items-center gap-4 px-4 py-3">
                  {/* Rank */}
                  <div className="w-10 text-center">
                    <span className="text-xl font-black tabular-nums" style={{ color: rankColor, textShadow: isTop3 ? `0 0 12px ${rankColor}60` : 'none' }}>
                      {entry.rank <= 3 ? ['👑','🥈','🥉'][entry.rank - 1] : `#${entry.rank}`}
                    </span>
                  </div>

                  {/* Address + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <a href={`https://explorer.hiro.so/address/${entry.address}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                        className="text-white font-black text-sm font-mono hover:opacity-70 transition-opacity tracking-wide">
                        {formatAddress(entry.address)}
                      </a>
                      {entry.badges.map((b, i) => <span key={i}>{b}</span>)}
                    </div>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                      UNLOCK: #{entry.unlockBlock.toLocaleString()}
                    </p>
                  </div>

                  {/* Multiplier */}
                  <div className="text-center hidden sm:block">
                    <p className="text-xs font-black" style={{ color: multColor, textShadow: `0 0 8px ${multColor}60` }}>{entry.multiplier}x</p>
                    <p className="text-[9px] text-white/20 tracking-widest">MULT</p>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <p className="text-white font-black text-sm tabular-nums">
                      {entry.staked >= 1000 ? `${(entry.staked/1000).toFixed(1)}K` : entry.staked.toFixed(2)}
                    </p>
                    <p className="text-[9px] text-white/20 tracking-widest">$B2S</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        {[
          { label: 'TOTAL STAKERS', val: stats.totalVaults > 0 ? stats.totalVaults : entries.length, color: '#ffd700' },
          { label: 'TOTAL STAKED',  val: stats.totalStaked >= 1000 ? `${(stats.totalStaked/1000).toFixed(1)}K` : stats.totalStaked.toFixed(0), color: '#00ff9f' },
          { label: 'CONTRACT',      val: 'EXPLORER ↗', color: '#00d4ff', link: `https://explorer.hiro.so/address/${STAKING_CONTRACT}?chain=mainnet` },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
            <p className="text-white/25 text-[9px] tracking-widest mb-1">{s.label}</p>
            {s.link
              ? <a href={s.link} target="_blank" rel="noopener noreferrer" className="text-sm font-black" style={{ color: s.color }}>{s.val}</a>
              : <p className="text-sm font-black tabular-nums" style={{ color: s.color }}>{s.val}</p>
            }
          </div>
        ))}
      </div>
    </div>
  )
}