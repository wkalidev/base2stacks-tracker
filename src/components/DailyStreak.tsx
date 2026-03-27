'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'

const hiroUrl = (p: string) => `/api/hiro?path=${encodeURIComponent(p)}`
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

interface StreakData {
  current:    number
  longest:    number
  lastClaim:  string | null
  canClaim:   boolean
  totalClaims: number
  history:    boolean[] // last 14 days — true = claimed
}

const STREAK_MILESTONES = [
  { days: 3,   reward: '🔥',  label: '3_DAY_STREAK',   xp: 50  },
  { days: 7,   reward: '💎',  label: 'WEEK_WARRIOR',   xp: 150 },
  { days: 14,  reward: '⚡',  label: 'TWO_WEEK_LEGEND', xp: 350 },
  { days: 30,  reward: '👑',  label: 'MONTHLY_KING',   xp: 1000 },
]

async function fetchStreakData(address: string): Promise<StreakData> {
  const result: StreakData = {
    current: 0, longest: 0, lastClaim: null,
    canClaim: true, totalClaims: 0, history: Array(14).fill(false),
  }

  try {
    const res  = await fetch(
      `${hiroUrl(`/extended/v1/address/${address}/transactions?limit=50`)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return result
    const data = await res.json()

    const claims = (data.results || []).filter((tx: any) =>
      tx.tx_status === 'success' &&
      (tx.contract_call?.function_name === 'claim-daily-reward' ||
       tx.contract_call?.function_name === 'claim')
    )

    result.totalClaims = claims.length

    if (claims.length === 0) return result

    // Build day map
    const claimedDays = new Set<string>()
    claims.forEach((tx: any) => {
      const day = tx.burn_block_time_iso?.slice(0, 10)
      if (day) claimedDays.add(day)
    })

    // Last 14 days history
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - (13 - i))
      const key = d.toISOString().slice(0, 10)
      result.history[i] = claimedDays.has(key)
    }

    // Last claim
    result.lastClaim = claims[0]?.burn_block_time_iso?.slice(0, 10) || null

    // Can claim today?
    const todayStr = today.toISOString().slice(0, 10)
    result.canClaim = !claimedDays.has(todayStr)

    // Current streak
    let streak = 0
    const checkDate = new Date(today)
    if (!result.canClaim) {
      // Claimed today — start counting from today
      while (true) {
        const key = checkDate.toISOString().slice(0, 10)
        if (!claimedDays.has(key)) break
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    } else {
      // Not yet claimed today — start from yesterday
      checkDate.setDate(checkDate.getDate() - 1)
      while (true) {
        const key = checkDate.toISOString().slice(0, 10)
        if (!claimedDays.has(key)) break
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      }
    }
    result.current = streak

    // Longest streak
    let maxStreak = 0, cur = 0
    const sortedDays = Array.from(claimedDays).sort()
    for (let i = 0; i < sortedDays.length; i++) {
      if (i === 0) { cur = 1; continue }
      const prev = new Date(sortedDays[i - 1])
      const curr = new Date(sortedDays[i])
      const diff = (curr.getTime() - prev.getTime()) / 86400000
      if (diff === 1) { cur++; maxStreak = Math.max(maxStreak, cur) }
      else { cur = 1 }
    }
    result.longest = Math.max(maxStreak, result.current)
  } catch (e) {
    console.error('fetchStreakData:', e)
  }

  return result
}

// ── Flame component ────────────────────────────────────────────────────────────
function Flame({ size = 40, intensity = 1 }: { size?: number; intensity?: number }) {
  const color = intensity >= 3 ? '#ff4444' : intensity >= 2 ? '#ff6600' : '#ffd700'
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        fontSize:  size * 0.8,
        animation: 'flame-flicker 0.8s ease-in-out infinite alternate',
        filter:    `drop-shadow(0 0 ${size * 0.2}px ${color})`,
      }}>
        🔥
      </div>
    </div>
  )
}

export default function DailyStreak() {
  const { address, isConnected } = useWallet()
  const [streak,  setStreak]  = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!address) return
    setLoading(true)
    const data = await fetchStreakData(address)
    setStreak(data)
    setLoading(false)
  }, [address])

  useEffect(() => {
    if (isConnected && address) load()
  }, [address, isConnected, load])

  const nextMilestone = STREAK_MILESTONES.find(m => streak && m.days > streak.current)
  const daysToNext    = nextMilestone && streak ? nextMilestone.days - streak.current : 0

  if (!isConnected) return null

  return (
    <>
      <style>{`
        @keyframes flame-flicker {
          from { transform: scale(1) rotate(-2deg); }
          to   { transform: scale(1.1) rotate(2deg); }
        }
        @keyframes streak-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,215,0,0); }
          50%      { box-shadow: 0 0 0 8px rgba(255,215,0,0.1); }
        }
        @keyframes day-pop {
          from { transform: scale(0.8); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>

      <div style={{ ...MONO, color: '#fff' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#ffd700', marginBottom: '2px' }}>
              DAILY_STREAK
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              CLAIM EVERY DAY TO KEEP YOUR STREAK
            </div>
          </div>
          <button onClick={load} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px 10px', fontSize: '14px' }}>
            ⟳
          </button>
        </div>

        {loading ? (
          <div style={{ height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', animation: 'pulse 1.5s infinite' }} />
        ) : streak ? (
          <>
            {/* Main streak card */}
            <div style={{
              background:   streak.current > 0 ? 'rgba(255,215,0,0.05)' : 'rgba(255,255,255,0.02)',
              border:       `1px solid ${streak.current > 0 ? 'rgba(255,215,0,0.25)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: '16px',
              padding:      '20px',
              marginBottom: '12px',
              position:     'relative',
              overflow:     'hidden',
              animation:    streak.current > 0 ? 'streak-pulse 3s infinite' : 'none',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${streak.current > 0 ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.1)'}, transparent)` }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Flame size={56} intensity={streak.current >= 7 ? 3 : streak.current >= 3 ? 2 : 1} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#ffd700', lineHeight: 1 }}>
                    {streak.current}
                  </div>
                  <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                    DAY{streak.current !== 1 ? 'S' : ''}_IN_A_ROW
                  </div>
                  {streak.canClaim && (
                    <div style={{ marginTop: '6px', fontSize: '9px', letterSpacing: '0.15em', color: '#00ff9f', animation: 'flame-flicker 1s infinite alternate' }}>
                      ▶ CLAIM TODAY TO CONTINUE
                    </div>
                  )}
                  {!streak.canClaim && (
                    <div style={{ marginTop: '6px', fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)' }}>
                      ✓ CLAIMED TODAY
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '4px' }}>LONGEST</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{streak.longest}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>days</div>
                </div>
              </div>

              {/* Next milestone */}
              {nextMilestone && daysToNext > 0 && (
                <div style={{ marginTop: '14px', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>
                    NEXT: {nextMilestone.reward} {nextMilestone.label}
                  </span>
                  <span style={{ fontSize: '10px', color: '#ffd700', fontWeight: 700 }}>
                    {daysToNext} day{daysToNext !== 1 ? 's' : ''} away
                  </span>
                </div>
              )}
            </div>

            {/* 14-day calendar */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>
                LAST_14_DAYS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {streak.history.map((claimed, i) => {
                  const isToday   = i === 13
                  const dayOffset = 13 - i
                  const date      = new Date()
                  date.setDate(date.getDate() - dayOffset)
                  const dayLabel  = date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1)

                  return (
                    <div key={i} style={{ textAlign: 'center', animation: `day-pop 0.3s ease ${i * 30}ms both` }}>
                      <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', marginBottom: '4px', letterSpacing: '0.05em' }}>
                        {dayLabel}
                      </div>
                      <div style={{
                        width:        '100%',
                        aspectRatio:  '1',
                        borderRadius: '6px',
                        background:   claimed
                          ? isToday ? '#ffd700' : 'rgba(255,215,0,0.35)'
                          : isToday ? 'rgba(0,255,159,0.1)' : 'rgba(255,255,255,0.04)',
                        border:       isToday
                          ? `1px solid ${claimed ? '#ffd700' : '#00ff9f'}`
                          : claimed ? '1px solid rgba(255,215,0,0.3)' : '1px solid rgba(255,255,255,0.06)',
                        display:      'flex',
                        alignItems:   'center',
                        justifyContent: 'center',
                        fontSize:     '10px',
                      }}>
                        {claimed ? '✓' : isToday ? '·' : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {[
                { label: 'TOTAL_CLAIMS', value: streak.totalClaims, color: '#00d4ff' },
                { label: 'CURRENT',      value: streak.current,      color: '#ffd700' },
                { label: 'LONGEST',      value: streak.longest,      color: '#ff00ff' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px', background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {STREAK_MILESTONES.map(m => {
                const unlocked = streak.current >= m.days
                return (
                  <div key={m.days} style={{
                    padding:      '5px 10px',
                    borderRadius: '20px',
                    fontSize:     '9px',
                    letterSpacing: '0.1em',
                    background:   unlocked ? 'rgba(255,215,0,0.12)' : 'rgba(255,255,255,0.03)',
                    border:       `1px solid ${unlocked ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.06)'}`,
                    color:        unlocked ? '#ffd700' : 'rgba(255,255,255,0.2)',
                  }}>
                    {m.reward} {m.days}D — {m.label} {unlocked ? '✓' : `+${m.xp}XP`}
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.2em' }}>
            NO_CLAIM_HISTORY_YET
          </div>
        )}
      </div>
    </>
  )
}