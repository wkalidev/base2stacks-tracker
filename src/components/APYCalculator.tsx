'use client'

import { useState, useEffect, useRef } from 'react'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

const LOCK_TIERS = [
  { label: '1W',  days: 7,   blocks: 1008,  mult: 1,   color: 'rgba(255,255,255,0.35)' },
  { label: '1M',  days: 30,  blocks: 4320,  mult: 1.5, color: '#ff00ff' },
  { label: '3M',  days: 90,  blocks: 12960, mult: 2,   color: '#00d4ff' },
  { label: '6M',  days: 180, blocks: 25920, mult: 2.5, color: '#00ff9f' },
  { label: '1Y',  days: 365, blocks: 52560, mult: 3,   color: '#ffd700' },
]

const PRESETS = [
  { label: '1W',   days: 7   },
  { label: '1M',   days: 30  },
  { label: '3M',   days: 90  },
  { label: '6M',   days: 180 },
  { label: '1Y',   days: 365 },
]

const AMOUNTS = [100, 1000, 10000, 100000]

export function APYCalculator() {
  const [stakeAmount,    setStakeAmount]    = useState('1000')
  const [stakeDuration,  setStakeDuration]  = useState(365)
  const [apy,            setApy]            = useState(12.5)
  const [animating,      setAnimating]      = useState(false)
  const prevEarnings                        = useRef(0)

  const tierColor   = LOCK_TIERS.slice().reverse().find(t => stakeDuration >= t.days)?.color || 'rgba(255,255,255,0.3)'
  const multiplier  = stakeDuration >= 365 ? 3 : stakeDuration >= 180 ? 2.5 : stakeDuration >= 90 ? 2 : stakeDuration >= 30 ? 1.5 : 1
  const effectiveApy = apy * multiplier

  const calc = () => {
    const principal = parseFloat(stakeAmount) || 0
    const years     = stakeDuration / 365
    const total     = principal * Math.pow(1 + effectiveApy / 100, years)
    const earnings  = total - principal
    return {
      principal,
      earnings:     earnings.toFixed(2),
      total:        total.toFixed(2),
      daily:        (earnings / stakeDuration).toFixed(4),
      monthly:      (earnings / (stakeDuration / 30)).toFixed(2),
      effectiveApy: effectiveApy.toFixed(1),
    }
  }

  const results = calc()

  useEffect(() => {
    const cur = parseFloat(results.earnings)
    if (cur !== prevEarnings.current) {
      setAnimating(true)
      setTimeout(() => setAnimating(false), 400)
      prevEarnings.current = cur
    }
  }, [results.earnings])

  return (
    <>
      <style>{`
        @keyframes count-up {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes glow-pulse {
          0%,100% { text-shadow: 0 0 20px currentColor; }
          50%      { text-shadow: 0 0 40px currentColor, 0 0 80px currentColor; }
        }
        input[type=range] {
          -webkit-appearance: none;
          height: 4px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: var(--thumb-color, #fff);
          border: 2px solid rgba(0,0,0,0.5);
          cursor: pointer;
          transition: transform 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover { transform: scale(1.2); }
      `}</style>

      <div style={{ ...MONO, color: '#fff' }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff9f', boxShadow: '0 0 8px #00ff9f', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#00ff9f' }}>APY_CALCULATOR // B2S-STAKING-VAULT-V2</span>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
            COMPOUND_INTEREST · LOCK_MULTIPLIER · REAL_TIME_SIMULATION
          </div>
        </div>

        {/* Tier badges */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {LOCK_TIERS.map((t, idx) => {
            const reached = stakeDuration >= t.days
            const active  = reached && (idx === LOCK_TIERS.length - 1 || stakeDuration < LOCK_TIERS[idx + 1].days)
            return (
              <div
                key={t.label}
                onClick={() => setStakeDuration(t.days)}
                style={{
                  flex:         1,
                  padding:      '10px 4px',
                  borderRadius: '10px',
                  textAlign:    'center',
                  cursor:       'pointer',
                  border:       `1px solid ${reached ? t.color + '40' : 'rgba(255,255,255,0.06)'}`,
                  background:   active ? `${t.color}15` : reached ? `${t.color}06` : 'rgba(255,255,255,0.02)',
                  transition:   'all 0.2s',
                  position:     'relative',
                  overflow:     'hidden',
                }}
              >
                {active && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${t.color}, transparent)` }} />
                )}
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: reached ? t.color : 'rgba(255,255,255,0.2)' }}>
                  {t.label}
                </div>
                <div style={{ fontSize: '9px', color: reached ? t.color : 'rgba(255,255,255,0.15)', marginTop: '2px', opacity: 0.8 }}>
                  {t.mult}x
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>

          {/* Left — inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Amount */}
            <div>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>
                STAKE_AMOUNT
              </div>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={e => setStakeAmount(e.target.value)}
                  placeholder="0"
                  style={{
                    ...MONO,
                    width: '100%', padding: '12px 48px 12px 14px',
                    borderRadius: '12px', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '20px', fontWeight: 700,
                    outline: 'none',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(0,255,159,0.4)'}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
                  $B2S
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {AMOUNTS.map(v => (
                  <button key={v} onClick={() => setStakeAmount(String(v))} style={{
                    ...MONO,
                    flex: 1, padding: '5px 2px', borderRadius: '7px',
                    fontSize: '9px', fontWeight: 700, letterSpacing: '0.05em',
                    cursor: 'pointer',
                    border: stakeAmount === String(v) ? `1px solid ${tierColor}50` : '1px solid rgba(255,255,255,0.07)',
                    background: stakeAmount === String(v) ? `${tierColor}10` : 'rgba(255,255,255,0.02)',
                    color: stakeAmount === String(v) ? tierColor : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.15s',
                  }}>
                    {v >= 1000 ? `${v / 1000}K` : v}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>LOCK_DURATION</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: tierColor }}>{stakeDuration}_DAYS</span>
              </div>
              <input
                type="range" min="1" max="730" value={stakeDuration}
                onChange={e => setStakeDuration(parseInt(e.target.value))}
                style={{
                  width: '100%',
                  background: `linear-gradient(90deg, ${tierColor} ${(stakeDuration / 730) * 100}%, rgba(255,255,255,0.1) ${(stakeDuration / 730) * 100}%)`,
                  '--thumb-color': tierColor,
                } as any}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
                <span>1D</span><span>2Y</span>
              </div>
              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                {PRESETS.map(p => (
                  <button key={p.days} onClick={() => setStakeDuration(p.days)} style={{
                    ...MONO,
                    flex: 1, padding: '5px 2px', borderRadius: '7px',
                    fontSize: '9px', fontWeight: 700,
                    cursor: 'pointer',
                    border: stakeDuration === p.days ? `1px solid ${tierColor}50` : '1px solid rgba(255,255,255,0.07)',
                    background: stakeDuration === p.days ? `${tierColor}10` : 'rgba(255,255,255,0.02)',
                    color: stakeDuration === p.days ? tierColor : 'rgba(255,255,255,0.3)',
                    transition: 'all 0.15s',
                  }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* APY slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>BASE_APY</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#00d4ff' }}>{apy.toFixed(1)}%</span>
              </div>
              <input
                type="range" min="0" max="50" step="0.1" value={apy}
                onChange={e => setApy(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  background: `linear-gradient(90deg, #00d4ff ${(apy / 50) * 100}%, rgba(255,255,255,0.1) ${(apy / 50) * 100}%)`,
                  '--thumb-color': '#00d4ff',
                } as any}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '4px' }}>
                <span>0%</span><span>50%</span>
              </div>
            </div>
          </div>

          {/* Right — results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Big number */}
            <div style={{
              flex: 1,
              padding: '20px',
              background: `${tierColor}08`,
              border: `1px solid ${tierColor}25`,
              borderRadius: '14px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${tierColor}, transparent)` }} />

              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>
                TOTAL_EARNINGS
              </div>
              <div style={{
                fontSize: '32px', fontWeight: 700, color: tierColor,
                animation: animating ? 'count-up 0.4s ease' : 'glow-pulse 3s ease-in-out infinite',
                lineHeight: 1,
              }}>
                +{results.earnings}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginTop: '6px' }}>
                $B2S / {stakeDuration}d
              </div>

              <div style={{ marginTop: '14px', padding: '6px 12px', background: `${tierColor}12`, border: `1px solid ${tierColor}25`, borderRadius: '20px', fontSize: '9px', color: tierColor, letterSpacing: '0.1em' }}>
                {multiplier}x MULT · {results.effectiveApy}% EFF_APY
              </div>
            </div>

            {/* Daily / Monthly */}
            {[
              { label: 'DAILY',   value: `+${results.daily}`,   sub: '$B2S/day'   },
              { label: 'MONTHLY', value: `+${results.monthly}`, sub: '$B2S/month' },
            ].map(r => (
              <div key={r.label} style={{
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '12px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>{r.label}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{r.value}</div>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)' }}>{r.sub}</div>
                </div>
              </div>
            ))}

            {/* Principal → Total */}
            <div style={{
              padding: '12px 14px',
              background: `${tierColor}06`,
              border: `1px solid ${tierColor}18`,
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>INPUT</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                  {parseFloat(stakeAmount || '0').toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '20px', color: tierColor }}>→</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>OUTPUT</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: tierColor }}>
                  {parseFloat(results.total).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ padding: '10px 14px', background: 'rgba(255,255,0,0.03)', border: '1px solid rgba(255,255,0,0.12)', borderLeft: '3px solid rgba(255,255,0,0.3)', borderRadius: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
          <span style={{ color: '#ffff00' }}>⚠ DISCLAIMER</span> — Simulation assumes compound interest and constant APY. Actual yield varies with network conditions and total staking participation.
        </div>
      </div>
    </>
  )
}