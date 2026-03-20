'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const HIRO_API         = 'https://api.mainnet.hiro.so'
const DECIMALS         = 1_000_000
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

interface Portfolio {
  wallet:    number
  staked:    number
  liquidity: number
  rewards:   number
}

// ── Donut Chart ───────────────────────────────────────────────────────────────
interface DonutSlice {
  label:  string
  value:  number
  color:  string
  pct:    number
}

function DonutChart({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const size   = 200
  const cx     = size / 2
  const cy     = size / 2
  const r      = 72
  const inner  = 48
  const [hovered, setHovered] = useState<number | null>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  let cumAngle = -90

  const paths = slices
    .filter(s => s.value > 0)
    .map((slice, i) => {
      const angle    = (slice.pct / 100) * 360
      const startRad = (cumAngle * Math.PI) / 180
      const endRad   = ((cumAngle + angle) * Math.PI) / 180
      const isHovered = hovered === i
      const scale    = isHovered ? 1.05 : 1
      const x1 = cx + r * Math.cos(startRad)
      const y1 = cy + r * Math.sin(startRad)
      const x2 = cx + r * Math.cos(endRad)
      const y2 = cy + r * Math.sin(endRad)
      const ix1 = cx + inner * Math.cos(startRad)
      const iy1 = cy + inner * Math.sin(startRad)
      const ix2 = cx + inner * Math.cos(endRad)
      const iy2 = cy + inner * Math.sin(endRad)
      const large = angle > 180 ? 1 : 0
      const midAngle = cumAngle + angle / 2
      const midRad = (midAngle * Math.PI) / 180
      const midR = (r + inner) / 2
      const midX = cx + midR * Math.cos(midRad)
      const midY = cy + midR * Math.sin(midRad)

      const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`
      cumAngle += angle

      return { path, slice, i, scale, midX, midY }
    })

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ overflow: 'visible' }}
      >
        {/* Glow filter */}
        <defs>
          {slices.map((s, i) => (
            <filter key={i} id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {/* Background ring */}
        <circle cx={cx} cy={cy} r={(r + inner) / 2} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={r - inner} />

        {/* Slices */}
        {paths.map(({ path, slice, i, scale }) => (
          <path
            key={i}
            d={path}
            fill={slice.color}
            opacity={animated ? (hovered === null || hovered === i ? 0.9 : 0.35) : 0}
            transform={`scale(${scale})`}
            transformOrigin={`${cx} ${cy}`}
            style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {/* Center text */}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="18" fontWeight="700"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {total >= 1000 ? `${(total / 1000).toFixed(1)}K` : total.toFixed(0)}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="8"
          style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.15em' }}>
          $B2S
        </text>
        <text x={cx} y={cy + 22} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="7"
          style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
          TOTAL
        </text>

        {/* Hover label */}
        {hovered !== null && paths[hovered] && (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" fill={slices[hovered]?.color} fontSize="16" fontWeight="700"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {slices[hovered]?.pct.toFixed(1)}%
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fill={slices[hovered]?.color} fontSize="8"
              style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
              {slices[hovered]?.label}
            </text>
          </>
        )}
      </svg>
    </div>
  )
}

// ── Fetch portfolio data ───────────────────────────────────────────────────────
async function fetchPortfolio(address: string): Promise<Portfolio> {
  const result: Portfolio = { wallet: 0, staked: 0, liquidity: 0, rewards: 0 }

  try {
    // Wallet balance
    const balRes  = await fetch(`${HIRO_API}/extended/v1/tokens/ft/${CONTRACT_ADDRESS}.b2s-token/holders?principal=${address}`)
    if (balRes.ok) {
      const balData = await balRes.json()
      result.wallet = Number(balData.results?.[0]?.balance || 0) / DECIMALS
    }
  } catch { /* silent */ }

  try {
    // Staked amount from vault
    const stakeResult = await callReadOnlyFunction({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName:    'b2s-staking-vault-v2',
      functionName:    'get-vault',
      functionArgs:    [standardPrincipalCV(address)],
      senderAddress:   address,
    })
    const json = cvToJSON(stakeResult)
    result.staked = Number(json?.value?.value?.amount?.value || 0) / DECIMALS
  } catch { /* silent */ }

  try {
    // Pending rewards
    const rewardsResult = await callReadOnlyFunction({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName:    'b2s-rewards-distributor-v3',
      functionName:    'get-pending-rewards',
      functionArgs:    [standardPrincipalCV(address)],
      senderAddress:   address,
    })
    result.rewards = Number(cvToJSON(rewardsResult).value?.value || 0) / DECIMALS
  } catch { /* silent */ }

  try {
    // LP position
    const lpResult = await callReadOnlyFunction({
      network,
      contractAddress: CONTRACT_ADDRESS,
      contractName:    'b2s-liquidity-pool-v5',
      functionName:    'get-lp-tokens',
      functionArgs:    [standardPrincipalCV(address)],
      senderAddress:   address,
    })
    result.liquidity = Number(cvToJSON(lpResult).value?.value || 0) / DECIMALS
  } catch { /* silent */ }

  return result
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function PortfolioSummary() {
  const { address, isConnected } = useWallet()
  const [portfolio, setPortfolio] = useState<Portfolio>({ wallet: 0, staked: 0, liquidity: 0, rewards: 0 })
  const [loading,   setLoading]   = useState(false)
  const [lastSync,  setLastSync]  = useState<Date | null>(null)

  const load = useCallback(async () => {
    if (!address) return
    setLoading(true)
    const data = await fetchPortfolio(address)
    setPortfolio(data)
    setLastSync(new Date())
    setLoading(false)
  }, [address])

  useEffect(() => {
    if (isConnected && address) load()
  }, [address, isConnected, load])

  const total = portfolio.wallet + portfolio.staked + portfolio.liquidity + portfolio.rewards

  const SLICES = [
    { label: 'WALLET',    value: portfolio.wallet,    color: '#00d4ff', pct: total > 0 ? (portfolio.wallet    / total) * 100 : 0 },
    { label: 'STAKED',    value: portfolio.staked,    color: '#00ff9f', pct: total > 0 ? (portfolio.staked    / total) * 100 : 0 },
    { label: 'LIQUIDITY', value: portfolio.liquidity, color: '#ff00ff', pct: total > 0 ? (portfolio.liquidity / total) * 100 : 0 },
    { label: 'REWARDS',   value: portfolio.rewards,   color: '#ffd700', pct: total > 0 ? (portfolio.rewards   / total) * 100 : 0 },
  ]

  const APY      = 12.5
  const yearlyEst = portfolio.staked * (APY / 100)
  const dailyEst  = yearlyEst / 365

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
        <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
        <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)' }}>
          CONNECT_WALLET_TO_SEE_PORTFOLIO
        </div>
      </div>
    )
  }

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#00d4ff', marginBottom: '2px' }}>
            PORTFOLIO_SUMMARY
          </div>
          {lastSync && (
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              LAST_SYNC: {lastSync.toLocaleTimeString()}
            </div>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px 10px', fontSize: '14px' }}
        >
          {loading ? '⟳' : '⟳'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '24px', alignItems: 'center' }}>

        {/* Donut chart */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {loading ? (
            <div style={{ width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>
              LOADING...
            </div>
          ) : (
            <DonutChart slices={SLICES} total={total} />
          )}
        </div>

        {/* Legend + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SLICES.map(slice => (
            <div key={slice.label} style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '12px',
              padding:      '10px 14px',
              background:   `${slice.color}06`,
              border:       `1px solid ${slice.color}18`,
              borderRadius: '10px',
              position:     'relative',
              overflow:     'hidden',
            }}>
              {/* Progress bar background */}
              <div style={{
                position:   'absolute',
                left:       0,
                top:        0,
                bottom:     0,
                width:      `${slice.pct}%`,
                background: `${slice.color}08`,
                transition: 'width 1s ease',
              }} />

              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: slice.color, flexShrink: 0, position: 'relative' }} />

              <div style={{ flex: 1, position: 'relative' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>
                  {slice.label}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: slice.color }}>
                  {slice.value >= 1000
                    ? `${(slice.value / 1000).toFixed(2)}K`
                    : slice.value.toFixed(2)
                  }
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: '4px' }}>$B2S</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', position: 'relative' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: slice.color }}>
                  {slice.pct.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yield estimates */}
      {portfolio.staked > 0 && (
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { label: 'DAILY_EST',   value: `+${dailyEst.toFixed(4)}`,  color: '#00ff9f', sub: '$B2S / day'  },
            { label: 'YEARLY_EST',  value: `+${yearlyEst.toFixed(2)}`, color: '#ffd700', sub: '$B2S / year' },
            { label: 'BASE_APY',    value: `${APY}%`,                  color: '#ff00ff', sub: 'up to 37.5%' },
          ].map(s => (
            <div key={s.label} style={{
              padding:      '12px 14px',
              background:   `${s.color}06`,
              border:       `1px solid ${s.color}18`,
              borderRadius: '10px',
              position:     'relative',
              overflow:     'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
              <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '4px' }}>{s.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {total === 0 && !loading && (
        <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderLeft: '3px solid rgba(0,212,255,0.5)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ color: '#00d4ff' }}>TIP</span> — Claim daily $B2S, stake to earn APY, and add liquidity to build your portfolio.
        </div>
      )}
    </div>
  )
}