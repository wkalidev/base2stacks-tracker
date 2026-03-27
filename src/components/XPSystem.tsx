'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@/hooks/useWallet'

// ── XP Config ─────────────────────────────────────────────────────────────────
const XP_REWARDS = {
  claim_daily:    50,
  stake:         100,
  unstake:        25,
  vote:          150,
  bridge:        200,
  add_liquidity: 120,
  hold_badge:     30,
  first_stake:   500,  // bonus
  streak_7d:     300,  // bonus
}

const LEVELS = [
  { level: 1,  name: 'NEWBIE',        minXP: 0,     color: '#888888', icon: '○' },
  { level: 2,  name: 'HODLER',        minXP: 200,   color: '#00d4ff', icon: '◇' },
  { level: 3,  name: 'STAKER',        minXP: 500,   color: '#00ff9f', icon: '◈' },
  { level: 4,  name: 'YIELD_FARMER',  minXP: 1000,  color: '#ffd700', icon: '◆' },
  { level: 5,  name: 'LIQUIDITY_PRO', minXP: 2000,  color: '#ff00ff', icon: '⬡' },
  { level: 6,  name: 'GOVERNANCE',    minXP: 4000,  color: '#ff6600', icon: '⬢' },
  { level: 7,  name: 'BRIDGE_MASTER', minXP: 7000,  color: '#ff4444', icon: '✦' },
  { level: 8,  name: 'B2S_LEGEND',    minXP: 12000, color: '#ffffff', icon: '★' },
]

const hiroUrl = (p: string) => `/api/hiro?path=${encodeURIComponent(p)}`
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

// ── XP Calculation from onchain activity ──────────────────────────────────────
async function calculateXPFromChain(address: string): Promise<{ xp: number; breakdown: Record<string, number> }> {
  const breakdown: Record<string, number> = {}
  let totalXP = 0

  try {
    // Fetch all transactions involving user
    const res = await fetch(
      `${hiroUrl(`/extended/v1/address/${address}/transactions?limit=50`)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return { xp: 0, breakdown }
    const data = await res.json()
    const txs  = data.results || []

    let hasDailyClaim = false
    let hasStake      = false

    for (const tx of txs) {
      if (tx.tx_type !== 'contract_call' || tx.tx_status !== 'success') continue
      const fn = tx.contract_call?.function_name

      if (fn === 'claim-daily-reward' || fn === 'claim') {
        const xp = XP_REWARDS.claim_daily
        breakdown['DAILY_CLAIM'] = (breakdown['DAILY_CLAIM'] || 0) + xp
        totalXP += xp
        hasDailyClaim = true
      }
      if (fn === 'stake') {
        const xp = XP_REWARDS.stake
        breakdown['STAKE'] = (breakdown['STAKE'] || 0) + xp
        totalXP += xp
        if (!hasStake) {
          breakdown['FIRST_STAKE_BONUS'] = XP_REWARDS.first_stake
          totalXP += XP_REWARDS.first_stake
          hasStake = true
        }
      }
      if (fn === 'unstake') {
        const xp = XP_REWARDS.unstake
        breakdown['UNSTAKE'] = (breakdown['UNSTAKE'] || 0) + xp
        totalXP += xp
      }
      if (fn === 'vote' || fn === 'cast-vote') {
        const xp = XP_REWARDS.vote
        breakdown['VOTE'] = (breakdown['VOTE'] || 0) + xp
        totalXP += xp
      }
      if (fn === 'bridge' || fn === 'verify-bridge') {
        const xp = XP_REWARDS.bridge
        breakdown['BRIDGE'] = (breakdown['BRIDGE'] || 0) + xp
        totalXP += xp
      }
      if (fn === 'add-liquidity') {
        const xp = XP_REWARDS.add_liquidity
        breakdown['LIQUIDITY'] = (breakdown['LIQUIDITY'] || 0) + xp
        totalXP += xp
      }
    }

    // Check NFT badges
    const badgeRes = await fetch(
      `${hiroUrl(`/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=${CONTRACT_ADDRESS}.b2s-badges::b2s-badge&limit=1`)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (badgeRes.ok) {
      const badgeData = await badgeRes.json()
      const count = badgeData.total || 0
      if (count > 0) {
        const xp = count * XP_REWARDS.hold_badge
        breakdown['NFT_BADGES'] = xp
        totalXP += xp
      }
    }
  } catch (e) {
    console.error('XP calculation error:', e)
  }

  return { xp: totalXP, breakdown }
}

function getLevelInfo(xp: number) {
  let current = LEVELS[0]
  let next    = LEVELS[1]
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i]
      next    = LEVELS[i + 1] || LEVELS[i]
      break
    }
  }
  const xpInLevel  = xp - current.minXP
  const xpNeeded   = next.minXP - current.minXP
  const progress   = current.level === LEVELS[LEVELS.length - 1].level ? 100 : Math.min(100, (xpInLevel / xpNeeded) * 100)
  return { current, next, xpInLevel, xpNeeded, progress }
}

// ── Animated counter ───────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const prev = useRef(0)

  useEffect(() => {
    const start = prev.current
    const end   = value
    const steps = 60
    const step  = (end - start) / steps
    let count   = 0

    const t = setInterval(() => {
      count++
      setDisplay(Math.round(start + step * count))
      if (count >= steps) {
        setDisplay(end)
        clearInterval(t)
      }
    }, duration / steps)

    prev.current = value
    return () => clearInterval(t)
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

// ── Level Up Flash ─────────────────────────────────────────────────────────────
function LevelUpFlash({ level, onDone }: { level: typeof LEVELS[0]; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position:       'fixed',
      inset:          0,
      zIndex:         100,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      background:     'rgba(0,0,0,0.85)',
      animation:      'fadeIn 0.3s ease',
    }}>
      <div style={{
        ...MONO,
        textAlign:  'center',
        animation:  'scaleIn 0.4s ease',
      }}>
        <div style={{ fontSize: '72px', marginBottom: '12px', animation: 'spin1 0.6s ease' }}>{level.icon}</div>
        <div style={{ fontSize: '12px', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
          LEVEL_UP
        </div>
        <div style={{ fontSize: '36px', fontWeight: 700, color: level.color, marginBottom: '4px', letterSpacing: '0.1em' }}>
          LVL {level.level}
        </div>
        <div style={{ fontSize: '16px', letterSpacing: '0.3em', color: level.color }}>
          {level.name}
        </div>
        <div style={{ marginTop: '16px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em' }}>
          TAP TO CONTINUE
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function XPSystem() {
  const { address, isConnected } = useWallet()
  const [xp,          setXP]          = useState(0)
  const [breakdown,   setBreakdown]   = useState<Record<string, number>>({})
  const [loading,     setLoading]     = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)
  const [newLevel,    setNewLevel]    = useState<typeof LEVELS[0] | null>(null)
  const prevLevelRef                  = useRef(1)

  const loadXP = useCallback(async () => {
    if (!address) return
    setLoading(true)
    const result = await calculateXPFromChain(address)
    const { current } = getLevelInfo(result.xp)

    if (current.level > prevLevelRef.current) {
      setNewLevel(current)
      setShowLevelUp(true)
    }
    prevLevelRef.current = current.level

    setXP(result.xp)
    setBreakdown(result.breakdown)
    setLoading(false)
  }, [address])

  useEffect(() => {
    if (isConnected && address) loadXP()
  }, [address, isConnected, loadXP])

  const { current, next, xpInLevel, xpNeeded, progress } = getLevelInfo(xp)

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={{
        ...MONO,
        background:   'rgba(255,255,255,0.02)',
        border:       '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px',
        padding:      '40px',
        textAlign:    'center',
      }}>
        <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚡</div>
        <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)' }}>
          CONNECT_WALLET_TO_SEE_YOUR_XP
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes spin1 { from { transform: rotate(-180deg) scale(0) } to { transform: rotate(0deg) scale(1) } }
        @keyframes progressFill { from { width: 0% } to { width: var(--target-width) } }
        @keyframes shimmer {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(400%) }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 8px currentColor }
          50% { box-shadow: 0 0 20px currentColor }
        }
      `}</style>

      {showLevelUp && newLevel && (
        <LevelUpFlash level={newLevel} onDone={() => setShowLevelUp(false)} />
      )}

      <div style={{ ...MONO, color: '#fff' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: current.color, marginBottom: '2px' }}>
              XP_SYSTEM // LEVEL_PROGRESSION
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              EARN XP BY INTERACTING ON-CHAIN
            </div>
          </div>
          <button
            onClick={loadXP}
            disabled={loading}
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px 10px', fontSize: '14px' }}
          >
            {loading ? '⟳' : '⟳'}
          </button>
        </div>

        {/* Level card */}
        <div style={{
          background:    `${current.color}08`,
          border:        `1px solid ${current.color}30`,
          borderRadius:  '16px',
          padding:       '24px',
          marginBottom:  '16px',
          position:      'relative',
          overflow:      'hidden',
        }}>
          {/* Top glow */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${current.color}80, transparent)` }} />

          {/* Shimmer */}
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '30%', height: '100%',
            background: `linear-gradient(90deg, transparent, ${current.color}08, transparent)`,
            animation: 'shimmer 3s linear infinite',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            {/* Level icon */}
            <div style={{
              width:          '64px',
              height:         '64px',
              borderRadius:   '50%',
              background:     `${current.color}15`,
              border:         `2px solid ${current.color}50`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '28px',
              color:          current.color,
              flexShrink:     0,
              animation:      'pulse-glow 3s infinite',
            }}>
              {current.icon}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, color: current.color }}>
                  LVL {current.level}
                </span>
                <span style={{ fontSize: '13px', letterSpacing: '0.2em', color: current.color, opacity: 0.8 }}>
                  {current.name}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                <AnimatedNumber value={xp} /> XP TOTAL
              </div>
            </div>

            {/* XP to next */}
            {current.level < LEVELS.length && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '2px' }}>
                  NEXT_LEVEL
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: next.color }}>
                  {next.icon}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                  {(xpNeeded - xpInLevel).toLocaleString()} XP
                </div>
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
                {current.name}
              </span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em' }}>
                {current.level < LEVELS.length ? next.name : 'MAX_LEVEL'}
              </span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                height:       '100%',
                width:        `${progress}%`,
                borderRadius: '4px',
                background:   `linear-gradient(90deg, ${current.color}80, ${current.color})`,
                transition:   'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position:     'relative',
                overflow:     'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation:  'shimmer 1.5s linear infinite',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span style={{ fontSize: '9px', color: current.color }}>
                {xpInLevel.toLocaleString()} XP
              </span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>
                {progress.toFixed(1)}%
              </span>
              <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>
                {current.level < LEVELS.length ? `${xpNeeded.toLocaleString()} XP` : '∞'}
              </span>
            </div>
          </div>
        </div>

        {/* XP Breakdown */}
        {Object.keys(breakdown).length > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '12px' }}>
              XP_BREAKDOWN
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(breakdown).sort((a, b) => b[1] - a[1]).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', width: '160px', flexShrink: 0 }}>
                    {key}
                  </div>
                  <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                      height:     '100%',
                      width:      `${Math.min(100, (val / xp) * 100)}%`,
                      background: current.color,
                      borderRadius: '2px',
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: current.color, width: '60px', textAlign: 'right' }}>
                    +{val.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All levels */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '12px' }}>
            ALL_LEVELS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {LEVELS.map(lvl => {
              const isUnlocked = xp >= lvl.minXP
              const isCurrent  = lvl.level === current.level
              return (
                <div key={lvl.level} style={{
                  padding:      '10px 12px',
                  borderRadius: '10px',
                  background:   isCurrent ? `${lvl.color}12` : 'rgba(255,255,255,0.02)',
                  border:       `1px solid ${isCurrent ? `${lvl.color}40` : 'rgba(255,255,255,0.05)'}`,
                  opacity:      isUnlocked ? 1 : 0.35,
                  transition:   'all 0.2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ color: lvl.color, fontSize: '14px' }}>{lvl.icon}</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: lvl.color, letterSpacing: '0.1em' }}>
                      LVL {lvl.level}
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', marginBottom: '2px' }}>
                    {lvl.name}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>
                    {lvl.minXP.toLocaleString()} XP
                  </div>
                  {isCurrent && (
                    <div style={{ marginTop: '4px', fontSize: '8px', color: lvl.color, letterSpacing: '0.1em' }}>
                      ◉ CURRENT
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* How to earn */}
        <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderLeft: '3px solid rgba(0,212,255,0.5)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
          <span style={{ color: '#00d4ff' }}>HOW_TO_EARN_XP</span> — Claim daily (+50) · Stake (+100) · Vote (+150) · Bridge (+200) · Add liquidity (+120) · Hold NFT badge (+30)
        </div>
      </div>
    </>
  )
}