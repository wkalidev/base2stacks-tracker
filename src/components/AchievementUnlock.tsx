'use client'

import { useState, useEffect, useCallback } from 'react'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

export interface Achievement {
  id:          string
  title:       string
  description: string
  icon:        string
  color:       string
  rarity:      'common' | 'rare' | 'epic' | 'legendary'
  xp:          number
}

const RARITY_COLORS = {
  common:    '#888888',
  rare:      '#00d4ff',
  epic:      '#ff00ff',
  legendary: '#ffd700',
}

const RARITY_LABELS = {
  common:    'COMMON',
  rare:      'RARE',
  epic:      'EPIC',
  legendary: 'LEGENDARY',
}

interface AchievementUnlockProps {
  achievement: Achievement | null
  onClose: () => void
}

export function AchievementUnlock({ achievement, onClose }: AchievementUnlockProps) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')

  useEffect(() => {
    if (!achievement) return
    setPhase('enter')
    const t1 = setTimeout(() => setPhase('show'), 300)
    const t2 = setTimeout(() => setPhase('exit'), 3500)
    const t3 = setTimeout(() => { onClose() }, 4000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [achievement, onClose])

  if (!achievement) return null

  const color = RARITY_COLORS[achievement.rarity]

  return (
    <>
      <style>{`
        @keyframes achievement-enter {
          from { transform: translateY(-100px) scale(0.8); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes achievement-exit {
          from { transform: translateY(0) scale(1); opacity: 1; }
          to   { transform: translateY(-80px) scale(0.9); opacity: 0; }
        }
        @keyframes sparkle {
          0%,100% { transform: scale(0) rotate(0deg);   opacity: 0; }
          50%      { transform: scale(1) rotate(180deg); opacity: 1; }
        }
        @keyframes ring-expand {
          from { transform: scale(0.5); opacity: 0.8; }
          to   { transform: scale(2.5); opacity: 0; }
        }
        @keyframes icon-bounce {
          0%,100% { transform: scale(1); }
          30%      { transform: scale(1.3); }
          60%      { transform: scale(0.95); }
        }
      `}</style>

      <div style={{
        position:   'fixed',
        top:        '80px',
        left:       '50%',
        transform:  'translateX(-50%)',
        zIndex:     200,
        animation:  phase === 'exit' ? 'achievement-exit 0.5s ease forwards' : 'achievement-enter 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards',
        width:      'min(360px, 90vw)',
      }}>
        <div style={{
          ...MONO,
          background:   '#080b12',
          border:       `1px solid ${color}50`,
          borderRadius: '16px',
          padding:      '20px',
          position:     'relative',
          overflow:     'hidden',
          boxShadow:    `0 0 40px ${color}30, 0 20px 60px rgba(0,0,0,0.8)`,
        }}>
          {/* Top glow line */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

          {/* Ring effect */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100px', height: '100px',
            borderRadius: '50%',
            border: `2px solid ${color}`,
            animation: 'ring-expand 1s ease-out forwards',
            pointerEvents: 'none',
          }} />

          {/* Sparkles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position:  'absolute',
              top:       `${20 + Math.sin(i * 60 * Math.PI / 180) * 30}%`,
              left:      `${50 + Math.cos(i * 60 * Math.PI / 180) * 40}%`,
              fontSize:  '12px',
              animation: `sparkle 0.6s ease ${i * 100}ms both`,
              color,
            }}>✦</div>
          ))}

          {/* Content */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
            <div style={{
              width:          '56px',
              height:         '56px',
              borderRadius:   '14px',
              background:     `${color}15`,
              border:         `1px solid ${color}40`,
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '28px',
              flexShrink:     0,
              animation:      'icon-bounce 0.6s ease',
            }}>
              {achievement.icon}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>
                ACHIEVEMENT_UNLOCKED
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                {achievement.title}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                {achievement.description}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '8px', letterSpacing: '0.15em', padding: '2px 8px', borderRadius: '10px', background: `${color}15`, border: `1px solid ${color}30`, color }}>
                  {RARITY_LABELS[achievement.rarity]}
                </span>
                <span style={{ fontSize: '10px', color: '#ffd700', fontWeight: 700 }}>
                  +{achievement.xp} XP
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Achievement Manager — tracks and triggers unlocks ─────────────────────────
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_claim',    title: 'FIRST_CLAIM',      description: 'Claimed your first $B2S',       icon: '🎁', color: '#00ff9f', rarity: 'common',    xp: 50   },
  { id: 'streak_3',       title: '3_DAY_STREAK',     description: '3 days in a row',               icon: '🔥', color: '#ff6600', rarity: 'rare',      xp: 150  },
  { id: 'streak_7',       title: 'WEEK_WARRIOR',     description: '7 day claim streak',            icon: '💪', color: '#00d4ff', rarity: 'epic',      xp: 350  },
  { id: 'first_stake',    title: 'FIRST_STAKE',      description: 'Staked $B2S for the first time', icon: '💎', color: '#ff00ff', rarity: 'rare',      xp: 200  },
  { id: 'staker_1k',      title: 'STAKER_1K',        description: 'Staked 1,000+ $B2S',           icon: '🏦', color: '#ffd700', rarity: 'epic',      xp: 500  },
  { id: 'first_vote',     title: 'VOTER',            description: 'Voted on a governance proposal', icon: '🗳️', color: '#cc00ff', rarity: 'rare',      xp: 150  },
  { id: 'nft_holder',     title: 'NFT_COLLECTOR',    description: 'Holds at least 1 B2S badge',   icon: '🏅', color: '#ff6600', rarity: 'rare',      xp: 100  },
  { id: 'lp_provider',    title: 'LP_PROVIDER',      description: 'Added liquidity to B2S AMM',   icon: '💧', color: '#00ff9f', rarity: 'epic',      xp: 300  },
  { id: 'bridge_master',  title: 'BRIDGE_MASTER',    description: 'Completed a cross-chain bridge', icon: '🌉', color: '#00d4ff', rarity: 'epic',      xp: 400  },
  { id: 'b2s_legend',     title: 'B2S_LEGEND',       description: 'Reached max level LVL 8',      icon: '★',  color: '#ffd700', rarity: 'legendary', xp: 2000 },
]

interface AchievementManagerProps {
  unlockedIds: string[]
}

export function AchievementManager({ unlockedIds }: AchievementManagerProps) {
  const [current,  setCurrent]  = useState<Achievement | null>(null)
  const [queue,    setQueue]    = useState<Achievement[]>([])

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('b2s_achievements') || '[]') as string[]
    const newOnes = unlockedIds.filter(id => !stored.includes(id))
    if (newOnes.length === 0) return

    const toShow = newOnes
      .map(id => ACHIEVEMENTS.find(a => a.id === id))
      .filter(Boolean) as Achievement[]

    setQueue(prev => [...prev, ...toShow])
    localStorage.setItem('b2s_achievements', JSON.stringify([...stored, ...newOnes]))
  }, [unlockedIds])

  useEffect(() => {
    if (current === null && queue.length > 0) {
      setCurrent(queue[0])
      setQueue(prev => prev.slice(1))
    }
  }, [current, queue])

  return <AchievementUnlock achievement={current} onClose={() => setCurrent(null)} />
}