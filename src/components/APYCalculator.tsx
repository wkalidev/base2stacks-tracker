'use client'

import { useState, useEffect, useRef } from 'react'

const LOCK_TIERS = [
  { label: '1W',  days: 7,   blocks: 1008,  mult: 1,   color: 'rgba(255,255,255,0.3)' },
  { label: '1M',  days: 30,  blocks: 4320,  mult: 1.5, color: '#ff00ff' },
  { label: '3M',  days: 90,  blocks: 12960, mult: 2,   color: '#00d4ff' },
  { label: '6M',  days: 180, blocks: 25920, mult: 2.5, color: '#00ff9f' },
  { label: '1Y',  days: 365, blocks: 52560, mult: 3,   color: '#ffd700' },
]

const PRESETS = [
  { label: '1 WEEK',  days: 7   },
  { label: '1 MONTH', days: 30  },
  { label: '3 MONTHS',days: 90  },
  { label: '6 MONTHS',days: 180 },
  { label: '1 YEAR',  days: 365 },
]

export function APYCalculator() {
  const [stakeAmount, setStakeAmount]   = useState('1000')
  const [stakeDuration, setStakeDuration] = useState(365)
  const [apy, setApy]                   = useState(12.5)
  const [animating, setAnimating]       = useState(false)
  const prevEarnings                    = useRef(0)

  const multiplier = stakeDuration >= 365 ? 3 : stakeDuration >= 180 ? 2.5 : stakeDuration >= 90 ? 2 : stakeDuration >= 30 ? 1.5 : 1
  const effectiveApy = apy * multiplier

  const calc = () => {
    const principal = parseFloat(stakeAmount) || 0
    const years     = stakeDuration / 365
    const total     = principal * Math.pow(1 + effectiveApy / 100, years)
    const earnings  = total - principal
    return {
      principal,
      earnings:        earnings.toFixed(2),
      total:           total.toFixed(2),
      daily:           (earnings / stakeDuration).toFixed(3),
      monthly:         (earnings / (stakeDuration / 30)).toFixed(2),
      effectiveApy:    effectiveApy.toFixed(1),
    }
  }

  const results = calc()

  useEffect(() => {
    const cur = parseFloat(results.earnings)
    if (cur !== prevEarnings.current) { setAnimating(true); setTimeout(() => setAnimating(false), 300); prevEarnings.current = cur }
  }, [results.earnings])

  const activeTier = LOCK_TIERS.find(t => stakeDuration >= t.days) || LOCK_TIERS[0]
  const tierColor  = LOCK_TIERS.slice().reverse().find(t => stakeDuration >= t.days)?.color || 'rgba(255,255,255,0.3)'

  const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

  return (
    <div style={MONO} className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#00ff9f]/20 bg-black/70 p-5">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,255,159,0.012) 3px,rgba(0,255,159,0.012) 4px)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ff9f]/60 to-transparent" />
        <div className="relative flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#00ff9f] animate-pulse" style={{ boxShadow: '0 0 8px #00ff9f' }} />
          <span className="text-[#00ff9f] text-[10px] tracking-[0.3em] font-black">STAKING SIMULATOR // B2S-STAKING-VAULT-V2</span>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight">APY CALCULATOR</h2>
        <p className="text-white/25 text-[10px] mt-1 tracking-wider">COMPOUND INTEREST · LOCK MULTIPLIER ACTIVE</p>
      </div>

      {/* Lock tier indicator */}
      <div className="flex gap-2">
        {LOCK_TIERS.map(t => {
          const active = stakeDuration >= t.days && (LOCK_TIERS.indexOf(t) === LOCK_TIERS.length - 1 || stakeDuration < LOCK_TIERS[LOCK_TIERS.indexOf(t) + 1].days)
          const reached = stakeDuration >= t.days
          return (
            <div key={t.label} className="flex-1 rounded-xl border p-2 text-center cursor-pointer transition-all hover:opacity-80"
              onClick={() => setStakeDuration(t.days)}
              style={{ borderColor: reached ? `${t.color}40` : 'rgba(255,255,255,0.06)', background: active ? `${t.color}12` : reached ? `${t.color}06` : 'rgba(255,255,255,0.02)' }}>
              <p className="text-[10px] font-black tracking-widest" style={{ color: reached ? t.color : 'rgba(255,255,255,0.2)' }}>{t.label}</p>
              <p className="text-[9px] text-white/20 mt-0.5">{t.mult}x</p>
            </div>
          )
        })}
      </div>

      {/* Inputs */}
      <div className="rounded-2xl border border-white/[0.07] bg-black/50 p-5 space-y-5">

        {/* Amount */}
        <div>
          <label className="text-white/30 text-[9px] tracking-widest font-black block mb-2">STAKE_AMOUNT ($B2S)</label>
          <div className="relative">
            <input
              type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xl font-black placeholder-white/20 focus:outline-none focus:border-[#00ff9f]/40 transition-colors"
              placeholder="0"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 text-xs font-black tracking-widest">$B2S</span>
          </div>
          <div className="flex gap-2 mt-2">
            {[100, 1000, 10000, 100000].map(v => (
              <button key={v} onClick={() => setStakeAmount(String(v))}
                className="flex-1 py-1.5 rounded-lg text-[9px] font-black tracking-wider border border-white/[0.07] bg-white/[0.02] text-white/30 hover:text-white hover:border-white/20 transition-all">
                {v >= 1000 ? `${v/1000}K` : v}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-white/30 text-[9px] tracking-widest font-black">LOCK_DURATION</label>
            <span className="text-xs font-black tabular-nums" style={{ color: tierColor }}>{stakeDuration} DAYS</span>
          </div>
          <input type="range" min="1" max="730" value={stakeDuration} onChange={e => setStakeDuration(parseInt(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(90deg, ${tierColor} ${(stakeDuration/730)*100}%, rgba(255,255,255,0.1) ${(stakeDuration/730)*100}%)` }} />
          <div className="flex justify-between text-[9px] text-white/20 mt-1">
            <span>1 DAY</span><span>2 YEARS</span>
          </div>
          <div className="flex gap-2 mt-2">
            {PRESETS.map(p => (
              <button key={p.days} onClick={() => setStakeDuration(p.days)}
                className="flex-1 py-1.5 rounded-lg text-[9px] font-black border transition-all"
                style={{
                  borderColor: stakeDuration === p.days ? `${tierColor}50` : 'rgba(255,255,255,0.07)',
                  background:  stakeDuration === p.days ? `${tierColor}10` : 'rgba(255,255,255,0.02)',
                  color:       stakeDuration === p.days ? tierColor : 'rgba(255,255,255,0.3)',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* APY slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-white/30 text-[9px] tracking-widest font-black">BASE_APY</label>
            <span className="text-[#00d4ff] text-sm font-black tabular-nums" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>{apy.toFixed(1)}%</span>
          </div>
          <input type="range" min="0" max="50" step="0.1" value={apy} onChange={e => setApy(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{ background: `linear-gradient(90deg,#00d4ff ${(apy/50)*100}%, rgba(255,255,255,0.1) ${(apy/50)*100}%)` }} />
          <div className="flex justify-between text-[9px] text-white/20 mt-1"><span>0%</span><span>50%</span></div>
        </div>
      </div>

      {/* Results */}
      <div className="rounded-2xl border bg-black/60 overflow-hidden" style={{ borderColor: `${tierColor}25` }}>
        <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: `${tierColor}15` }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: tierColor, boxShadow: `0 0 8px ${tierColor}` }} />
          <span className="text-[10px] tracking-[0.3em] font-black" style={{ color: tierColor }}>// SIMULATION OUTPUT</span>
          <span className="ml-auto px-2 py-0.5 rounded text-[9px] font-black" style={{ background: `${tierColor}15`, color: tierColor, border: `1px solid ${tierColor}30` }}>
            {multiplier}x MULT · {results.effectiveApy}% EFF.APY
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Big earnings number */}
          <div className="text-center py-4 rounded-xl" style={{ background: `${tierColor}06`, border: `1px solid ${tierColor}15` }}>
            <p className="text-white/30 text-[9px] tracking-widest mb-1">TOTAL_EARNINGS</p>
            <p className={`text-4xl font-black tabular-nums transition-all duration-300 ${animating ? 'scale-105' : 'scale-100'}`}
               style={{ color: tierColor, textShadow: `0 0 20px ${tierColor}60` }}>
              +{results.earnings}
            </p>
            <p className="text-white/25 text-xs mt-1">$B2S over {stakeDuration} days</p>
          </div>

          {/* Breakdown grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'DAILY',   val: `+${results.daily}`, sub: '$B2S/day' },
              { label: 'MONTHLY', val: `+${results.monthly}`, sub: '$B2S/month' },
            ].map(r => (
              <div key={r.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 text-center">
                <p className="text-white/25 text-[9px] tracking-widest mb-1">{r.label}</p>
                <p className="text-white font-black text-sm tabular-nums">{r.val}</p>
                <p className="text-white/20 text-[9px]">{r.sub}</p>
              </div>
            ))}
          </div>

          {/* Principal → Final */}
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex-1">
              <p className="text-white/25 text-[9px] tracking-widest mb-1">INPUT</p>
              <p className="text-white font-black text-lg tabular-nums">{results.principal.toLocaleString()}</p>
              <p className="text-white/20 text-[9px]">$B2S staked</p>
            </div>
            <div className="text-2xl font-black" style={{ color: tierColor }}>→</div>
            <div className="flex-1 text-right">
              <p className="text-white/25 text-[9px] tracking-widest mb-1">OUTPUT</p>
              <p className="font-black text-lg tabular-nums" style={{ color: tierColor }}>{parseFloat(results.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
              <p className="text-white/20 text-[9px]">$B2S total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-[#ffff00]/15 bg-[#ffff00]/[0.03] px-4 py-3 flex gap-2">
        <span className="text-[#ffff00] flex-shrink-0 text-sm">⚠</span>
        <p className="text-white/25 text-[10px] leading-relaxed font-mono">
          Simulation assumes compound interest and constant APY. Actual yield varies with network conditions and total staking participation.
        </p>
      </div>
    </div>
  )
}