'use client'

interface StakingStatsProps {
  totalStaked: number
  rewards: number
  apy: number
}

export function StakingStats({ totalStaked, rewards, apy }: StakingStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl p-6 border border-blue-500/30 hover:scale-105 transition-transform">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">💰</span>
          <h4 className="text-white/70 text-sm">Total Staked</h4>
        </div>
        <p className="text-3xl font-bold text-white">
          {totalStaked.toFixed(2)} $B2S
        </p>
      </div>

      <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl p-6 border border-green-500/30 hover:scale-105 transition-transform">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🎁</span>
          <h4 className="text-white/70 text-sm">Total Rewards</h4>
        </div>
        <p className="text-3xl font-bold text-white">
          {rewards.toFixed(2)} $B2S
        </p>
      </div>

      <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl p-6 border border-purple-500/30 hover:scale-105 transition-transform">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">📈</span>
          <h4 className="text-white/70 text-sm">Current APY</h4>
        </div>
        <p className="text-3xl font-bold text-white">
          {apy.toFixed(1)}%
        </p>
      </div>
    </div>
  )
}