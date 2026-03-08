'use client'

import { useState, useEffect, useCallback } from 'react'

const STAKING_CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-staking-vault-v2'
const TOKEN_CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96.b2s-token'
const HIRO_API = 'https://api.mainnet.hiro.so'
const DECIMALS = 1_000_000

interface VaultData {
  amount: number
  lockedAt: number
  lockBlocks: number
  multiplier: number
}

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

// Fetch vault data for a specific address
async function fetchVault(address: string): Promise<VaultData | null> {
  try {
    const res = await fetch(
      `${HIRO_API}/v2/contracts/call-read/${STAKING_CONTRACT.split('.')[0]}/${STAKING_CONTRACT.split('.')[1]}/get-vault`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: address,
          arguments: [`0x${bufferCV(address)}`],
        }),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    return parseVault(data)
  } catch {
    return null
  }
}

// Encode principal as Clarity value
function bufferCV(address: string): string {
  // Use Hiro read-only with principal type
  return ''
}

function parseVault(data: any): VaultData | null {
  try {
    if (!data?.result) return null
    // Parse Clarity tuple response
    const result = data.result
    if (result === '0x09' || result.includes('none')) return null
    return null
  } catch {
    return null
  }
}

// Fetch on-chain stats from get-stats
async function fetchOnChainStats(): Promise<OnChainStats> {
  try {
    const res = await fetch(
      `${HIRO_API}/v2/contracts/call-read/${STAKING_CONTRACT.split('.')[0]}/${STAKING_CONTRACT.split('.')[1]}/get-stats`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: STAKING_CONTRACT.split('.')[0],
          arguments: [],
        }),
      }
    )
    if (!res.ok) return { totalStaked: 0, totalVaults: 0 }
    const data = await res.json()
    return parseStats(data)
  } catch {
    return { totalStaked: 0, totalVaults: 0 }
  }
}

function parseStats(data: any): OnChainStats {
  try {
    const result = data?.result || ''
    // Parse Clarity tuple: (ok {total-staked: uX, total-vaults: uY})
    const stakedMatch = result.match(/total-staked.*?u(\d+)/)
    const vaultsMatch = result.match(/total-vaults.*?u(\d+)/)
    return {
      totalStaked: stakedMatch ? parseInt(stakedMatch[1]) / DECIMALS : 0,
      totalVaults: vaultsMatch ? parseInt(vaultsMatch[1]) : 0,
    }
  } catch {
    return { totalStaked: 0, totalVaults: 0 }
  }
}

// Fetch all stakers from contract transactions
async function fetchStakers(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch(
      `${HIRO_API}/extended/v1/address/${STAKING_CONTRACT}/transactions?limit=50&offset=0`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    
    const stakers = new Map<string, { staked: number; multiplier: number; unlockBlock: number }>()

    for (const tx of data.results || []) {
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'stake' &&
        tx.tx_status === 'success'
      ) {
        const sender = tx.sender_address
        const args = tx.contract_call?.function_args || []
        const amount = args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) / DECIMALS : 0
        const lockBlocks = args[1]?.repr ? parseInt(args[1].repr.replace('u', '')) : 0
        const multiplier = lockBlocks >= 2100 ? 3 : lockBlocks >= 1050 ? 2 : lockBlocks >= 525 ? 1.5 : 1
        const blockHeight = tx.block_height || 0

        if (!stakers.has(sender) || stakers.get(sender)!.staked < amount) {
          stakers.set(sender, {
            staked: amount,
            multiplier,
            unlockBlock: blockHeight + lockBlocks,
          })
        }
      }

      // Remove unstakers
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'unstake' &&
        tx.tx_status === 'success'
      ) {
        stakers.delete(tx.sender_address)
      }
    }

    const entries: LeaderboardEntry[] = Array.from(stakers.entries())
      .sort((a, b) => b[1].staked - a[1].staked)
      .map(([address, data], index) => ({
        rank: index + 1,
        address,
        staked: data.staked,
        multiplier: data.multiplier,
        unlockBlock: data.unlockBlock,
        badges: getBadges(index + 1, data.multiplier),
      }))

    return entries
  } catch {
    return []
  }
}

function getBadges(rank: number, multiplier: number): string[] {
  const badges: string[] = []
  if (rank === 1) badges.push('👑')
  if (rank === 2) badges.push('🥈')
  if (rank === 3) badges.push('🥉')
  if (multiplier >= 3) badges.push('💎')
  if (multiplier >= 2) badges.push('🔥')
  if (multiplier >= 1.5) badges.push('⚡')
  return badges
}

function getRankColor(rank: number) {
  if (rank === 1) return 'from-yellow-400 to-yellow-600'
  if (rank === 2) return 'from-gray-300 to-gray-400'
  if (rank === 3) return 'from-orange-400 to-orange-600'
  return 'from-blue-400 to-blue-600'
}

function getRankEmoji(rank: number) {
  if (rank === 1) return '👑'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return '🏅'
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function LeaderboardAdvanced() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [stats, setStats] = useState<OnChainStats>({ totalStaked: 0, totalVaults: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'top10' | 'top50' | 'all'>('top10')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [stakers, onChainStats] = await Promise.all([
        fetchStakers(),
        fetchOnChainStats(),
      ])
      setEntries(stakers)
      setStats(onChainStats)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Failed to load blockchain data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
    // Refresh every 2 minutes
    const interval = setInterval(loadData, 120_000)
    return () => clearInterval(interval)
  }, [loadData])

  const filteredEntries = entries.slice(
    0,
    filter === 'top10' ? 10 : filter === 'top50' ? 50 : entries.length
  )

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          <div className="h-6 w-40 bg-white/10 rounded animate-pulse" />
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/10 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-semibold text-2xl flex items-center gap-2">
            🏆 Leaderboard
          </h3>
          {lastUpdated && (
            <p className="text-white/40 text-xs mt-1">
              Live · Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh button */}
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all text-sm"
            title="Refresh"
          >
            🔄
          </button>

          {/* Filter Buttons */}
          {(['top10', 'top50', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {f === 'top10' ? 'Top 10' : f === 'top50' ? 'Top 50' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {!error && entries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🏦</p>
          <p className="text-white font-semibold text-lg mb-2">No stakers yet</p>
          <p className="text-white/50 text-sm">
            Be the first to stake on{' '}
            <a
              href={`https://explorer.hiro.so/address/${STAKING_CONTRACT}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 hover:underline"
            >
              b2s-staking-vault-v2
            </a>
          </p>
        </div>
      )}

      {/* Leaderboard Entries */}
      {filteredEntries.length > 0 && (
        <div className="space-y-3">
          {filteredEntries.map((entry, index) => (
            <div
              key={entry.address}
              className="group relative bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-center justify-between">
                {/* Left: Rank & User */}
                <div className="flex items-center gap-4">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(entry.rank)} shadow-lg`}>
                    <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={`https://explorer.hiro.so/address/${entry.address}?chain=mainnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white font-semibold hover:text-purple-400 transition-colors font-mono text-sm"
                      >
                        {formatAddress(entry.address)}
                      </a>
                      {entry.badges.map((badge, i) => (
                        <span key={i} className="text-lg">{badge}</span>
                      ))}
                    </div>
                    <p className="text-white/40 text-xs">
                      {entry.multiplier}x multiplier · Unlocks at block #{entry.unlockBlock.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Right: Stats */}
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-white/60 text-xs mb-1">Staked</p>
                    <p className="text-white font-bold">
                      {entry.staked >= 1000
                        ? `${(entry.staked / 1000).toFixed(1)}K`
                        : entry.staked.toFixed(2)}{' '}
                      $B2S
                    </p>
                  </div>

                  <div className={`text-2xl font-bold ${
                    entry.rank <= 3
                      ? `text-transparent bg-clip-text bg-gradient-to-r ${getRankColor(entry.rank)}`
                      : 'text-white/40'
                  }`}>
                    #{entry.rank}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-white/60 text-sm mb-1">Total Stakers</p>
          <p className="text-white font-bold text-xl">
            {stats.totalVaults > 0 ? stats.totalVaults : entries.length}
          </p>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-1">Total Staked</p>
          <p className="text-white font-bold text-xl">
            {stats.totalStaked >= 1_000_000
              ? `${(stats.totalStaked / 1_000_000).toFixed(1)}M`
              : stats.totalStaked >= 1000
              ? `${(stats.totalStaked / 1000).toFixed(1)}K`
              : stats.totalStaked.toFixed(0)}{' '}
            $B2S
          </p>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-1">Contract</p>
          <a
            href={`https://explorer.hiro.so/address/${STAKING_CONTRACT}?chain=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 font-bold text-sm hover:underline"
          >
            Explorer ↗
          </a>
        </div>
      </div>
    </div>
  )
}