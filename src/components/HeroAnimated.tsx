'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useContract } from '@/hooks/useContract'
import { useDashboardStats } from '@/hooks/useDashboardStats'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }
const HIRO_API = 'https://api.mainnet.hiro.so'

// ── Particle system ───────────────────────────────────────────────────────────
interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  symbol: string
  color: string
  rotation: number
  rotationSpeed: number
}

const SYMBOLS = ['₿', '⬡', '◈', '◆', '✦', '⚡', '◎', '⬢']
const COLORS  = ['#f7931a', '#00ff9f', '#00d4ff', '#ff00ff', '#ffd700', '#5546ff', '#ff4444', '#9945ff']

function createParticle(id: number, width: number, height: number): Particle {
  return {
    id,
    x:             Math.random() * width,
    y:             Math.random() * height,
    vx:            (Math.random() - 0.5) * 0.4,
    vy:            -Math.random() * 0.5 - 0.2,
    size:          Math.random() * 14 + 8,
    opacity:       Math.random() * 0.25 + 0.05,
    symbol:        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
    color:         COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation:      Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 0.8,
  }
}

function ParticleCanvas() {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const particles   = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)

  useEffect(() => {
    const canvas  = canvasRef.current
    if (!canvas) return
    const ctx     = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      particles.current = Array.from({ length: 40 }, (_, i) =>
        createParticle(i, canvas.width, canvas.height)
      )
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.current.forEach(p => {
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.font        = `${p.size}px 'JetBrains Mono', monospace`
        ctx.fillStyle   = p.color
        ctx.textAlign   = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(p.symbol, 0, 0)
        ctx.restore()

        p.x        += p.vx
        p.y        += p.vy
        p.rotation += p.rotationSpeed

        if (p.y < -20) {
          p.y      = canvas.height + 20
          p.x      = Math.random() * canvas.width
          p.opacity = Math.random() * 0.25 + 0.05
        }
        if (p.x < -20)              p.x = canvas.width + 20
        if (p.x > canvas.width + 20) p.x = -20
      })

      animFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  )
}

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ value, suffix = '', prefix = '', decimals = 0, color = '#00d4ff' }: {
  value: number; suffix?: string; prefix?: string; decimals?: number; color?: string
}) {
  const [display, setDisplay] = useState(0)
  const prevRef               = useRef(0)

  useEffect(() => {
    if (value === 0) return
    const start = prevRef.current
    const end   = value
    const dur   = 1200
    const startTime = performance.now()

    const animate = (now: number) => {
      const elapsed  = now - startTime
      const progress = Math.min(elapsed / dur, 1)
      const eased    = 1 - Math.pow(1 - progress, 3)
      setDisplay(start + (end - start) * eased)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
    prevRef.current = value
  }, [value])

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : display >= 1_000_000
      ? `${(display / 1_000_000).toFixed(1)}M`
      : display >= 1_000
        ? `${(display / 1_000).toFixed(1)}K`
        : Math.round(display).toLocaleString()

  return (
    <span style={{ color, ...MONO }}>
      {prefix}{formatted}{suffix}
    </span>
  )
}

// ── Live stat card ────────────────────────────────────────────────────────────
function StatCard({ label, value, suffix, prefix, color, loading }: {
  label: string; value: number; suffix?: string; prefix?: string; color: string; loading: boolean
}) {
  return (
    <div style={{
      flex:         '1 1 0',
      minWidth:     '80px',
      textAlign:    'center',
      padding:      '12px 8px',
      background:   `${color}08`,
      border:       `1px solid ${color}20`,
      borderRadius: '12px',
      position:     'relative',
      overflow:     'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${color}40, transparent)` }} />
      <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
        {loading
          ? <span style={{ color: 'rgba(255,255,255,0.2)', ...MONO }}>···</span>
          : <Counter value={value} suffix={suffix} prefix={prefix} color={color} />
        }
      </div>
      <div style={{ fontSize: '8px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', ...MONO }}>
        {label}
      </div>
    </div>
  )
}

// ── Typewriter ────────────────────────────────────────────────────────────────
function Typewriter({ texts, color }: { texts: string[]; color: string }) {
  const [idx,     setIdx]     = useState(0)
  const [display, setDisplay] = useState('')
  const [typing,  setTyping]  = useState(true)

  useEffect(() => {
    const current = texts[idx]
    if (typing) {
      if (display.length < current.length) {
        const t = setTimeout(() => setDisplay(current.slice(0, display.length + 1)), 60)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setTyping(false), 2000)
        return () => clearTimeout(t)
      }
    } else {
      if (display.length > 0) {
        const t = setTimeout(() => setDisplay(display.slice(0, -1)), 30)
        return () => clearTimeout(t)
      } else {
        setIdx(i => (i + 1) % texts.length)
        setTyping(true)
      }
    }
  }, [display, typing, idx, texts])

  return (
    <span style={{ color, ...MONO }}>
      {display}<span style={{ animation: 'blink 1s infinite', opacity: 0.8 }}>_</span>
    </span>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface HeroAnimatedProps {
  onClaim?: () => void
  onStake?: () => void
  onConnect?: () => void
}

export default function HeroAnimated({ onClaim, onStake, onConnect }: HeroAnimatedProps) {
  const { isConnected, address, connect } = useWallet()
  const { claimDailyReward, loading }     = useContract()
  const dashStats                         = useDashboardStats()
  const [blockHeight, setBlockHeight]     = useState(0)
  const [blockLoading, setBlockLoading]   = useState(true)

  // Live block height
  const fetchBlock = useCallback(async () => {
    try {
      const res  = await fetch(`${HIRO_API}/extended/v1/block?limit=1`)
      const data = await res.json()
      setBlockHeight(data.results?.[0]?.height || 0)
    } catch { /* silent */ }
    finally { setBlockLoading(false) }
  }, [])

  useEffect(() => {
    fetchBlock()
    const t = setInterval(fetchBlock, 10_000)
    return () => clearInterval(t)
  }, [fetchBlock])

  const handleClaim = async () => {
    try { await claimDailyReward(); onClaim?.() }
    catch (e) { console.error(e) }
  }

  const shortAddr = (a: string) => `${a.slice(0, 6)}···${a.slice(-4)}`

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes glow-pulse {
          0%,100% { opacity:0.3; transform:scale(1); }
          50%      { opacity:0.6; transform:scale(1.05); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(90px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(90px) rotate(-360deg); }
        }
        @keyframes orbit2 {
          from { transform: rotate(120deg) translateX(70px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(70px) rotate(-480deg); }
        }
        @keyframes orbit3 {
          from { transform: rotate(240deg) translateX(55px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(55px) rotate(-600deg); }
        }
        .hero-btn {
          transition: all 0.2s ease !important;
        }
        .hero-btn:hover {
          transform: translateY(-2px) !important;
          filter: brightness(1.15) !important;
        }
        .hero-btn:active {
          transform: translateY(0px) !important;
        }
      `}</style>

      <section style={{
        position:  'relative',
        minHeight: '100vh',
        display:   'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow:  'hidden',
        background: '#000',
        padding:   '80px 16px 40px',
      }}>

        {/* Particle canvas */}
        <ParticleCanvas />

        {/* Background glow orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '15%', left: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08), transparent 70%)', animation: 'glow-pulse 4s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '20%', right: '8%', width: '250px', height: '250px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,255,0.06), transparent 70%)', animation: 'glow-pulse 5s ease-in-out infinite 1s' }} />
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,255,159,0.03), transparent 70%)' }} />
        </div>

        {/* Grid lines overlay */}
        <div style={{
          position:    'absolute',
          inset:       0,
          pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        {/* Main content */}
        <div style={{ ...MONO, color: '#fff', textAlign: 'center', position: 'relative', zIndex: 1, maxWidth: '520px', width: '100%' }}>

          {/* Live badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(0,255,159,0.2)', background: 'rgba(0,255,159,0.06)', marginBottom: '28px', animation: 'fadeUp 0.5s ease' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00ff9f', boxShadow: '0 0 8px #00ff9f', animation: 'blink 2s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#00ff9f' }}>
              STACKS_MAINNET // BUILDER_REWARDS_MARCH_2026
            </span>
          </div>

          {/* Logo orbit */}
          <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto 28px', animation: 'fadeUp 0.6s ease 0.1s both' }}>
            {/* Orbit rings */}
            <div style={{ position: 'absolute', inset: '10px', borderRadius: '50%', border: '1px solid rgba(0,212,255,0.1)' }} />
            <div style={{ position: 'absolute', inset: '30px', borderRadius: '50%', border: '1px solid rgba(255,0,255,0.1)' }} />

            {/* Orbiting symbols */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '16px', color: '#f7931a', animation: 'orbit 8s linear infinite', position: 'absolute' }}>₿</span>
              <span style={{ fontSize: '14px', color: '#00ff9f', animation: 'orbit2 6s linear infinite', position: 'absolute' }}>◈</span>
              <span style={{ fontSize: '12px', color: '#ff00ff', animation: 'orbit3 10s linear infinite', position: 'absolute' }}>✦</span>
            </div>

            {/* Center logo */}
            <div style={{ position: 'absolute', inset: '40px', borderRadius: '30px', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px' }}>
              🌉
            </div>
          </div>

          {/* Headline */}
          <div style={{ fontSize: '11px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.3)', marginBottom: '8px', animation: 'fadeUp 0.5s ease 0.2s both' }}>
            THE BITCOIN DEFI PROTOCOL
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 7vw, 44px)', fontWeight: 700, lineHeight: 1.1, marginBottom: '8px', animation: 'fadeUp 0.5s ease 0.3s both' }}>
            TRACK CROSS-CHAIN
            <br />
            <span style={{ color: '#00d4ff', textShadow: '0 0 40px rgba(0,212,255,0.4)' }}>
              BRIDGES
            </span>
          </h1>

          {/* Typewriter */}
          <div style={{ fontSize: '13px', marginBottom: '28px', minHeight: '24px', animation: 'fadeUp 0.5s ease 0.4s both' }}>
            <Typewriter
              color="#00ff9f"
              texts={['EARN $B2S DAILY', 'STAKE & EARN 37.5% APY', 'BRIDGE BASE → STACKS', 'VOTE ON GOVERNANCE', 'COLLECT NFT BADGES']}
            />
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '32px', animation: 'fadeUp 0.5s ease 0.5s both' }}>
            {isConnected ? (
              <>
                <button
                  onClick={handleClaim}
                  disabled={loading}
                  className="hero-btn"
                  style={{
                    ...MONO,
                    padding:       '13px 24px',
                    borderRadius:  '12px',
                    fontSize:      '11px',
                    fontWeight:    700,
                    letterSpacing: '0.12em',
                    background:    'rgba(0,255,159,0.1)',
                    border:        '1px solid rgba(0,255,159,0.35)',
                    color:         '#00ff9f',
                    cursor:        loading ? 'not-allowed' : 'pointer',
                    opacity:       loading ? 0.5 : 1,
                    boxShadow:     '0 0 20px rgba(0,255,159,0.1)',
                  }}
                >
                  {loading ? '⏳ CLAIMING...' : '▶ CLAIM_DAILY // 5 $B2S'}
                </button>
                <button
                  onClick={onStake}
                  className="hero-btn"
                  style={{
                    ...MONO,
                    padding:       '13px 24px',
                    borderRadius:  '12px',
                    fontSize:      '11px',
                    fontWeight:    700,
                    letterSpacing: '0.12em',
                    background:    'rgba(255,215,0,0.06)',
                    border:        '1px solid rgba(255,215,0,0.25)',
                    color:         '#ffd700',
                    cursor:        'pointer',
                  }}
                >
                  ◆ STAKE_$B2S
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={connect}
                  className="hero-btn"
                  style={{
                    ...MONO,
                    padding:       '13px 28px',
                    borderRadius:  '12px',
                    fontSize:      '11px',
                    fontWeight:    700,
                    letterSpacing: '0.12em',
                    background:    'rgba(0,212,255,0.1)',
                    border:        '1px solid rgba(0,212,255,0.4)',
                    color:         '#00d4ff',
                    cursor:        'pointer',
                    boxShadow:     '0 0 30px rgba(0,212,255,0.1)',
                  }}
                >
                  ▶ CONNECT_WALLET
                </button>
                <button
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hero-btn"
                  style={{
                    ...MONO,
                    padding:       '13px 24px',
                    borderRadius:  '12px',
                    fontSize:      '11px',
                    fontWeight:    700,
                    letterSpacing: '0.12em',
                    background:    'rgba(255,255,255,0.03)',
                    border:        '1px solid rgba(255,255,255,0.1)',
                    color:         'rgba(255,255,255,0.4)',
                    cursor:        'pointer',
                  }}
                >
                  HOW_IT_WORKS ↓
                </button>
              </>
            )}
          </div>

          {/* Connected wallet info */}
          {isConnected && address && (
            <div style={{ marginBottom: '24px', padding: '10px 16px', borderRadius: '10px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', animation: 'fadeUp 0.3s ease' }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>CONNECTED </span>
              <span style={{ fontSize: '11px', color: '#00d4ff' }}>{shortAddr(address)}</span>
            </div>
          )}

          {/* Live stats */}
          <div style={{ display: 'flex', gap: '8px', animation: 'fadeUp 0.5s ease 0.6s both' }}>
            <StatCard
              label="TRANSACTIONS"
              value={dashStats.totalTxCount}
              color="#00d4ff"
              loading={dashStats.loading}
            />
            <StatCard
              label="HOLDERS"
              value={dashStats.totalHolders}
              color="#ff00ff"
              loading={dashStats.loading}
            />
            <StatCard
              label="SUPPLY"
              value={dashStats.totalSupply}
              color="#ffd700"
              loading={dashStats.loading}
            />
            <StatCard
              label="BLOCK"
              value={blockHeight}
              prefix="#"
              color="#00ff9f"
              loading={blockLoading}
            />
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: '40px', animation: 'fadeUp 0.5s ease 0.8s both' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.15)', marginBottom: '8px' }}>
              SCROLL_TO_EXPLORE
            </div>
            <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.15)', animation: 'blink 2s infinite' }}>↓</div>
          </div>
        </div>
      </section>
    </>
  )
}