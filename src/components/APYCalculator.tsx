'use client'

import { useState, useEffect, useRef } from 'react'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

const LOCK_TIERS = [
{ label: '1W', days: 7, blocks: 1008, mult: 1, color: 'rgba(255,255,255,0.35)' },
{ label: '1M', days: 30, blocks: 4320, mult: 1.5, color: '#ff00ff' },
{ label: '3M', days: 90, blocks: 12960, mult: 2, color: '#00d4ff' },
{ label: '6M', days: 180, blocks: 25920, mult: 2.5, color: '#00ff9f' },
{ label: '1Y', days: 365, blocks: 52560, mult: 3, color: '#ffd700' },
]

const PRESETS = [
{ label: '1W', days: 7 },
{ label: '1M', days: 30 },
{ label: '3M', days: 90 },
{ label: '6M', days: 180 },
{ label: '1Y', days: 365 },
]

const AMOUNTS = [100, 1000, 10000, 100000]

export function APYCalculator() {
const [stakeAmount, setStakeAmount] = useState('1000')
const [stakeDuration, setStakeDuration] = useState(365)
const [apy, setApy] = useState(12.5)
const [animating, setAnimating] = useState(false)

// NEW STATES
const [liveMode, setLiveMode] = useState(false)
const [liveEarnings, setLiveEarnings] = useState(0)

const prevEarnings = useRef(0)

const tierColor =
LOCK_TIERS.slice().reverse().find(t => stakeDuration >= t.days)?.color ||
'rgba(255,255,255,0.3)'

const multiplier =
stakeDuration >= 365 ? 3 :
stakeDuration >= 180 ? 2.5 :
stakeDuration >= 90 ? 2 :
stakeDuration >= 30 ? 1.5 : 1

const effectiveApy = apy * multiplier

const calc = () => {
const principal = parseFloat(stakeAmount) || 0
const years = stakeDuration / 365
const total = principal * Math.pow(1 + effectiveApy / 100, years)
const earnings = total - principal

return {
  principal,
  earnings: earnings.toFixed(2),
  total: total.toFixed(2),
  daily: (earnings / stakeDuration).toFixed(4),
  monthly: (earnings / (stakeDuration / 30)).toFixed(2),
  effectiveApy: effectiveApy.toFixed(1),
  rawEarnings: earnings,
}

}

const results = calc()

//  per-second earnings
const earningsPerSecond =
results.rawEarnings / (stakeDuration * 24 * 60 * 60)

//  LIVE MODE EFFECT
useEffect(() => {
if (!liveMode) return

const interval = setInterval(() => {
  setLiveEarnings(prev => prev + earningsPerSecond)
}, 1000)

return () => clearInterval(interval)

}, [liveMode, earningsPerSecond])

//  reset live earnings when inputs change
useEffect(() => {
setLiveEarnings(0)
}, [stakeAmount, stakeDuration, apy])

const displayEarnings = liveMode
? liveEarnings.toFixed(2)
: results.earnings

useEffect(() => {
const cur = parseFloat(displayEarnings)
if (cur !== prevEarnings.current) {
setAnimating(true)
setTimeout(() => setAnimating(false), 400)
prevEarnings.current = cur
}
}, [displayEarnings])

return (
<>
{ @keyframes count-up { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } } @keyframes glow-pulse { 0%,100% { text-shadow: 0 0 20px currentColor; } 50% { text-shadow: 0 0 40px currentColor, 0 0 80px currentColor; } } }

  <div style={{ ...MONO, color: '#fff' }}>

    {/*  LIVE TOGGLE */}
    <div style={{ marginBottom: '10px', textAlign: 'right' }}>
      <button
        onClick={() => setLiveMode(!liveMode)}
        style={{
          ...MONO,
          fontSize: '10px',
          padding: '6px 10px',
          borderRadius: '8px',
          cursor: 'pointer',
          border: `1px solid ${liveMode ? '#00ff9f' : 'rgba(255,255,255,0.2)'}`,
          background: liveMode ? 'rgba(0,255,159,0.1)' : 'transparent',
          color: liveMode ? '#00ff9f' : 'rgba(255,255,255,0.4)',
        }}
      >
        {liveMode ? '● LIVE MODE' : '○ LIVE MODE'}
      </button>
    </div>

    {/* BIG NUMBER */}
    <div style={{
      padding: '20px',
      borderRadius: '14px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: '32px',
        fontWeight: 700,
        color: tierColor,
        animation: animating ? 'count-up 0.4s ease' : 'glow-pulse 3s infinite',
      }}>
        +{displayEarnings}
      </div>
    </div>

  </div>
</>

)
}
