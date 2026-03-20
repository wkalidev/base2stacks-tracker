'use client'

interface GalxeQuestsProps {
  userAddress?: string
}

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

const QUESTS = [
  {
    id:           'b2s-pioneer',
    name:         'B2S Pioneer — Join the Ecosystem',
    type:         'Points',
    description:  'Follow @willycodexwar, visit base2stacks-tracker.vercel.app and star the GitHub repo to earn 100 Galxe points.',
    points:       100,
    cap:          500,
    participants: 0,
    color:        '#ffd700',
    tasks: [
      'Follow @willycodexwar on Twitter',
      'Visit base2stacks-tracker.vercel.app',
      'Star github.com/wkalidev/base2stacks-tracker',
    ],
  },
  {
    id:           'b2s-staker',
    name:         'B2S Staker — Stake on Mainnet',
    type:         'Airdrop',
    description:  'Stake at least 10 $B2S tokens on Base2Stacks mainnet to earn the Staker NFT badge and 250 points.',
    points:       250,
    cap:          200,
    participants: 0,
    color:        '#00ff9f',
    tasks: [
      'Connect Leather or Xverse wallet',
      'Stake minimum 10 $B2S tokens',
      'Hold staked position for 24h',
    ],
  },
  {
    id:           'b2s-bridge',
    name:         'B2S Bridge Pioneer — Cross-Chain',
    type:         'Drop',
    description:  'Complete a bridge transaction from Base Network to Stacks to earn the rare Bridge Pioneer NFT badge.',
    points:       500,
    cap:          100,
    participants: 0,
    color:        '#ff00ff',
    tasks: [
      'Bridge any token from Base to Stacks',
      'Verify transaction on Hiro Explorer',
      'Claim your Bridge Pioneer NFT',
    ],
  },
]

const TYPE_COLORS: Record<string, string> = {
  Points:  '#ffd700',
  Airdrop: '#00ff9f',
  Drop:    '#ff00ff',
}

export default function GalxeQuests({ userAddress }: GalxeQuestsProps) {
  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#ffd700', marginBottom: '2px' }}>
            GALXE_QUESTS
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
            COMPLETE MISSIONS // EARN POINTS + NFT BADGES
          </div>
        </div>
        <span style={{
          fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px',
          background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: '20px', color: '#ffd700',
        }}>
          PREVIEW
        </span>
      </div>

      {/* Quest grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        {QUESTS.map(quest => {
          const typeColor = TYPE_COLORS[quest.type] || '#00d4ff'
          const pct       = quest.cap > 0 ? Math.min(100, (quest.participants / quest.cap) * 100) : 0

          return (
            <div key={quest.id} style={{
              background:   'rgba(255,255,255,0.02)',
              border:       `1px solid ${quest.color}22`,
              borderRadius: '14px',
              padding:      '18px',
              position:     'relative',
              overflow:     'hidden',
            }}>
              {/* Top glow */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${quest.color}50, transparent)` }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <span style={{
                  fontSize: '9px', letterSpacing: '0.15em', padding: '3px 8px', borderRadius: '20px',
                  background: `${typeColor}15`, border: `1px solid ${typeColor}30`, color: typeColor,
                }}>
                  {quest.type.toUpperCase()}
                </span>
                <span style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#ffd700' }}>
                  +{quest.points} PTS
                </span>
              </div>

              {/* Title */}
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '6px', lineHeight: 1.3 }}>
                {quest.name}
              </div>

              {/* Description */}
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '12px', lineHeight: 1.5 }}>
                {quest.description}
              </div>

              {/* Tasks */}
              <div style={{ marginBottom: '12px' }}>
                {quest.tasks.map((task, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '5px' }}>
                    <span style={{ color: quest.color, fontSize: '10px', flexShrink: 0, marginTop: '1px' }}>▸</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.4 }}>{task}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>PARTICIPANTS</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>
                    {quest.participants} / {quest.cap}
                  </span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: quest.color, borderRadius: '2px' }} />
                </div>
              </div>

              {/* CTA */}
              <a
                href="https://app.galxe.com/base2stacks"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:        'block',
                  textAlign:      'center',
                  ...MONO,
                  fontSize:       '11px',
                  fontWeight:     700,
                  letterSpacing:  '0.1em',
                  padding:        '9px 14px',
                  borderRadius:   '8px',
                  background:     `${quest.color}12`,
                  border:         `1px solid ${quest.color}35`,
                  color:          quest.color,
                  textDecoration: 'none',
                  transition:     'all 0.15s',
                }}
              >
                ▶ PARTICIPATE_ON_GALXE ↗
              </a>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.15)' }}>
        POWERED BY{' '}
        <a href="https://app.galxe.com" target="_blank" rel="noopener noreferrer"
          style={{ color: '#ffd700', textDecoration: 'none' }}>
          GALXE
        </a>
        {' '}// EARN POINTS & NFT BADGES
      </div>
    </div>
  )
}