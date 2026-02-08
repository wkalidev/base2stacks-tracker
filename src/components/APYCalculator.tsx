'use client'

import { useState } from 'react'

export function APYCalculator() {
  const [stakeAmount, setStakeAmount] = useState<string>('1000')
  const [stakeDuration, setStakeDuration] = useState<number>(365) // days
  const [apy, setApy] = useState<number>(12.5)

  // Calculate earnings
  const calculateEarnings = () => {
    const principal = parseFloat(stakeAmount) || 0
    const years = stakeDuration / 365
    const rate = apy / 100
    
    // Compound interest: A = P(1 + r)^t
    const totalAmount = principal * Math.pow(1 + rate, years)
    const earnings = totalAmount - principal
    
    return {
      principal,
      earnings: earnings.toFixed(2),
      total: totalAmount.toFixed(2),
      dailyEarnings: (earnings / stakeDuration).toFixed(2),
      monthlyEarnings: (earnings / (stakeDuration / 30)).toFixed(2)
    }
  }

  const results = calculateEarnings()

  // Preset durations
  const presets = [
    { label: '1 Week', days: 7 },
    { label: '1 Month', days: 30 },
    { label: '3 Months', days: 90 },
    { label: '6 Months', days: 180 },
    { label: '1 Year', days: 365 }
  ]

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">📊</span>
        <h3 className="text-white font-semibold text-2xl">APY Calculator</h3>
      </div>

      {/* Input Section */}
      <div className="space-y-6 mb-6">
        {/* Stake Amount */}
        <div>
          <label className="text-white/70 text-sm mb-2 block">
            Stake Amount ($B2S)
          </label>
          <div className="relative">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg font-semibold focus:outline-none focus:border-b2s-accent placeholder-white/40"
              placeholder="Enter amount"
              min="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 text-sm">
              $B2S
            </span>
          </div>
        </div>

        {/* Duration Presets */}
        <div>
          <label className="text-white/70 text-sm mb-2 block">
            Staking Duration
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.days}
                onClick={() => setStakeDuration(preset.days)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  stakeDuration === preset.days
                    ? 'bg-gradient-to-r from-b2s-primary to-b2s-accent text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Duration */}
        <div>
          <label className="text-white/70 text-sm mb-2 block">
            Custom Duration (days)
          </label>
          <input
            type="range"
            min="1"
            max="730"
            value={stakeDuration}
            onChange={(e) => setStakeDuration(parseInt(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-white/60 text-xs mt-1">
            <span>1 day</span>
            <span className="text-white font-semibold">{stakeDuration} days</span>
            <span>2 years</span>
          </div>
        </div>

        {/* APY Slider */}
        <div>
          <label className="text-white/70 text-sm mb-2 block">
            Annual Percentage Yield (APY)
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="0.1"
            value={apy}
            onChange={(e) => setApy(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-white/60 text-xs mt-1">
            <span>0%</span>
            <span className="text-green-400 font-bold text-lg">{apy.toFixed(1)}%</span>
            <span>50%</span>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="bg-white/5 rounded-lg p-6 border border-white/10">
        <h4 className="text-white/70 text-sm mb-4">Estimated Earnings</h4>
        
        <div className="space-y-4">
          {/* Total Earnings */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/20 to-green-600/20 rounded-lg border border-green-500/30">
            <div>
              <p className="text-white/70 text-sm">Total Earnings</p>
              <p className="text-white text-xs mt-1">
                over {stakeDuration} days
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-400">
                +{results.earnings}
              </p>
              <p className="text-white/60 text-sm">$B2S</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            {/* Daily */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/60 text-xs mb-1">Daily</p>
              <p className="text-white font-semibold">+{results.dailyEarnings} $B2S</p>
            </div>

            {/* Monthly */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <p className="text-white/60 text-xs mb-1">Monthly</p>
              <p className="text-white font-semibold">+{results.monthlyEarnings} $B2S</p>
            </div>
          </div>

          {/* Final Balance */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div>
              <p className="text-white/70 text-sm">Initial Stake</p>
              <p className="text-white font-semibold">{results.principal} $B2S</p>
            </div>
            <div className="text-2xl text-white/40">→</div>
            <div className="text-right">
              <p className="text-white/70 text-sm">Final Balance</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                {results.total} $B2S
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
        <p className="text-blue-300 text-xs">
          💡 <strong>Note:</strong> Calculations assume compound interest and constant APY. 
          Actual earnings may vary based on network conditions and staking participation.
        </p>
      </div>
    </div>
  )
}