'use client'

import { useState, useEffect } from 'react'

interface LeaderboardEntry {
  rank: number
  address: string
  displayName?: string
  staked: number
  rewards: number
  badges: string[]
  joinDate: string
}

export function LeaderboardAdvanced() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'top10' | 'top50'>('top10')

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockData: LeaderboardEntry[] = [
        { 
          rank: 1, 
          address: 'SP1ABC...XYZ', 
          displayName: 'CryptoWhale',
          staked: 150000, 
          rewards: 18750,
          badges: ['🥇', '🔥', '💎'],
          joinDate: '2026-01-15'
        },
        { 
          rank: 2, 
          address: 'SP2DEF...ABC', 
          displayName: 'StacksBuilder',
          staked: 125000, 
          rewards: 15625,
          badges: ['🥈', '🔥'],
          joinDate: '2026-01-18'
        },
        { 
          rank: 3, 
          address: 'SP3GHI...DEF', 
          displayName: 'DeFiKing',
          staked: 100000, 
          rewards: 12500,
          badges: ['🥉', '💎'],
          joinDate: '2026-01-20'
        },
        { 
          rank: 4, 
          address: 'SP4JKL...GHI', 
          staked: 85000, 
          rewards: 10625,
          badges: ['🔥'],
          joinDate: '2026-01-22'
        },
        { 
          rank: 5, 
          address: 'SP5MNO...JKL', 
          staked: 70000, 
          rewards: 8750,
          badges: ['💎'],
          joinDate: '2026-01-25'
        },
        { 
          rank: 6, 
          address: 'SP6PQR...MNO', 
          staked: 60000, 
          rewards: 7500,
          badges: ['⭐'],
          joinDate: '2026-01-28'
        },
        { 
          rank: 7, 
          address: 'SP7STU...PQR', 
          staked: 50000, 
          rewards: 6250,
          badges: ['⚡'],
          joinDate: '2026-02-01'
        },
        { 
          rank: 8, 
          address: 'SP8VWX...STU', 
          staked: 45000, 
          rewards: 5625,
          badges: ['🎯'],
          joinDate: '2026-02-02'
        },
        { 
          rank: 9, 
          address: 'SP9YZA...VWX', 
          staked: 40000, 
          rewards: 5000,
          badges: ['🌟'],
          joinDate: '2026-02-04'
        },
        { 
          rank: 10, 
          address: 'SP0BCD...YZA', 
          staked: 35000, 
          rewards: 4375,
          badges: ['✨'],
          joinDate: '2026-02-05'
        },
      ]
      
      setEntries(mockData)
      setLoading(false)
    }, 1000)
  }, [])

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600'
    if (rank === 2) return 'from-gray-300 to-gray-400'
    if (rank === 3) return 'from-orange-400 to-orange-600'
    return 'from-blue-400 to-blue-600'
  }

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '👑'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return '🏅'
  }

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-white/10 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-2xl flex items-center gap-2">
          🏆 Leaderboard
        </h3>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          {(['top10', 'top50', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                filter === f
                  ? 'bg-gradient-to-r from-b2s-primary to-b2s-accent text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {f === 'top10' ? 'Top 10' : f === 'top50' ? 'Top 50' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Entries */}
      <div className="space-y-3">
        {entries.map((entry, index) => (
          <div 
            key={entry.rank}
            className="group relative bg-gradient-to-r from-white/5 to-white/10 rounded-lg p-4 border border-white/10 hover:border-b2s-primary/50 transition-all hover:scale-[1.02] animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="flex items-center justify-between">
              {/* Left: Rank & User */}
              <div className="flex items-center gap-4">
                {/* Rank Badge */}
                <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(entry.rank)} shadow-lg`}>
                  <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-semibold">
                      {entry.displayName || 'Anonymous'}
                    </span>
                    {entry.badges.map((badge, i) => (
                      <span key={i} className="text-lg">{badge}</span>
                    ))}
                  </div>
                  <p className="text-white/60 text-sm font-mono">
                    {entry.address}
                  </p>
                </div>
              </div>

              {/* Right: Stats */}
              <div className="text-right">
                <div className="flex items-center gap-4">
                  {/* Staked */}
                  <div>
                    <p className="text-white/60 text-xs mb-1">Staked</p>
                    <p className="text-white font-bold">
                      {(entry.staked / 1000).toFixed(1)}K $B2S
                    </p>
                  </div>

                  {/* Rewards */}
                  <div>
                    <p className="text-white/60 text-xs mb-1">Rewards</p>
                    <p className="text-green-400 font-bold">
                      {(entry.rewards / 1000).toFixed(1)}K $B2S
                    </p>
                  </div>

                  {/* Rank Number */}
                  <div className="w-12 text-center">
                    <p className={`text-2xl font-bold ${
                      entry.rank <= 3 ? 'text-transparent bg-clip-text bg-gradient-to-r ' + getRankColor(entry.rank) : 'text-white/40'
                    }`}>
                      #{entry.rank}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Hover Effect - Show Join Date */}
            <div className="absolute inset-0 bg-gradient-to-r from-b2s-primary/0 to-b2s-accent/0 group-hover:from-b2s-primary/5 group-hover:to-b2s-accent/5 rounded-lg transition-all pointer-events-none"></div>
          </div>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-white/60 text-sm mb-1">Total Stakers</p>
          <p className="text-white font-bold text-xl">892</p>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-1">Total Staked</p>
          <p className="text-white font-bold text-xl">15.2M $B2S</p>
        </div>
        <div>
          <p className="text-white/60 text-sm mb-1">Avg. APY</p>
          <p className="text-green-400 font-bold text-xl">12.5%</p>
        </div>
      </div>
    </div>
  )
}