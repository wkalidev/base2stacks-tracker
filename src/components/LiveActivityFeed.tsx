'use client'

import { useState, useEffect, useRef } from 'react'

const hiroUrl = (p: string) => `/api/hiro?path=${encodeURIComponent(p)}`
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

interface ActivityItem {
  id:       string
  type:     string
  address:  string
  amount?:  number
  time:     string
  color:    string
  icon:     string
  label:    string
}

const TX_MAP: Record<string, { color: string; icon: string; label: string }> = {
  'stake':             { color: '#00ff9f', icon: '💎', label: 'STAKED'     },
  'unstake':           { color: '#ff4444', icon: '↩',  label: 'UNSTAKED'   },
  'create-market':     { color: '#00d4ff', icon: '🎯', label: 'MARKET'     },
  'place-bet':         { color: '#ff9f00', icon: '🎲', label: 'BET'        },
  'claim-rewards':     { color: '#ffd700', icon: '🎁', label: 'CLAIMED'    },
  'claim-daily-reward':{ color: '#ffd700', icon: '🎁', label: 'CLAIMED'    },
  'claim':             { color: '#ffd700', icon: '🎁', label: 'CLAIMED'    },
  'vote':              { color: '#cc00ff', icon: '🗳️', label: 'VOTED'      },
  'create-proposal':   { color: '#ff00ff', icon: '📝', label: 'PROPOSED'   },
  'add-liquidity':     { color: '#00d4ff', icon: '💧', label: 'LP_ADDED'   },
  'swap':              { color: '#00ff9f', icon: '⇄',  label: 'SWAPPED'    },
  'verify-bridge':     { color: '#f7931a', icon: '🌉', label: 'BRIDGED'    },
}

async function fetchActivity(): Promise<ActivityItem[]> {
  try {
    const res  = await fetch(
      `${hiroUrl(`/extended/v1/address/${CONTRACT_ADDRESS}.b2s-token-v4/transactions?limit=20`)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return []
    const data = await res.json()

    return (data.results || [])
      .filter((tx: any) => tx.tx_type === 'contract_call')
      .slice(0, 12)
      .map((tx: any) => {
        const fn     = tx.contract_call?.function_name || 'transfer'
        const meta   = TX_MAP[fn] || { color: '#888', icon: '◈', label: fn.toUpperCase().slice(0, 8) }
        const args   = tx.contract_call?.function_args || []
        const amount = args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) / 1_000_000 : undefined
        const ago    = getTimeAgo(tx.burn_block_time_iso)

        return {
          id:      tx.tx_id,
          type:    fn,
          address: tx.sender_address,
          amount,
          time:    ago,
          ...meta,
        }
      })
  } catch {
    return []
  }
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function LiveActivityFeed() {
  const [items,   setItems]   = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newIds,  setNewIds]  = useState<Set<string>>(new Set())
  const prevIds               = useRef<Set<string>>(new Set())

  useEffect(() => {
    const load = async () => {
      const data = await fetchActivity()
      const incoming = new Set(data.map(d => d.id))
      const fresh    = new Set([...incoming].filter(id => !prevIds.current.has(id)))
      setNewIds(fresh)
      prevIds.current = incoming
      setItems(data)
      setLoading(false)
      setTimeout(() => setNewIds(new Set()), 2000)
    }

    load()
    const t = setInterval(load, 15_000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(-12px); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        @keyframes new-item-flash {
          0%,100% { background: transparent; }
          50%      { background: rgba(0,255,159,0.06); }
        }
      `}</style>

      <div style={{ ...MONO, color: '#fff' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#00ff9f', marginBottom: '2px' }}>
              LIVE_ACTIVITY
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              ON-CHAIN TRANSACTIONS // UPDATES EVERY 15S
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff9f', boxShadow: '0 0 6px #00ff9f', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: '#00ff9f' }}>LIVE</span>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ height: '44px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.2em' }}>
            NO_ACTIVITY_YET
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          '10px',
                  padding:      '8px 12px',
                  background:   `${item.color}06`,
                  border:       `1px solid ${item.color}15`,
                  borderRadius: '10px',
                  animation:    newIds.has(item.id)
                    ? 'new-item-flash 1s ease, slide-in 0.3s ease'
                    : `slide-in 0.3s ease ${i * 40}ms both`,
                  transition:   'all 0.2s',
                  cursor:       'pointer',
                }}
                onClick={() => window.open(`https://explorer.hiro.so/txid/${item.id}?chain=mainnet`, '_blank')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = `${item.color}35` }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${item.color}15` }}
              >
                {/* Icon */}
                <div style={{ fontSize: '16px', width: '20px', textAlign: 'center', flexShrink: 0 }}>
                  {item.icon}
                </div>

                {/* Address + action */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: item.color, letterSpacing: '0.08em' }}>
                      {item.label}
                    </span>
                    {item.amount && item.amount > 0 && (
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>
                        {item.amount >= 1000 ? `${(item.amount / 1000).toFixed(1)}K` : item.amount.toFixed(2)} $B2S
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
                    {item.address.slice(0, 6)}···{item.address.slice(-4)}
                  </div>
                </div>

                {/* Time */}
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em', flexShrink: 0 }}>
                  {item.time}
                </div>

                {/* Arrow */}
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', flexShrink: 0 }}>↗</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}