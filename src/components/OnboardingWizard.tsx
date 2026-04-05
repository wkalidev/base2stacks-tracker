'use client'

import { useState, useEffect, useCallback } from 'react'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

interface Step {
  id: number
  title: string
  subtitle: string
  description: string
  icon: string
  color: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  skip?: boolean
}

const STEPS: Step[] = [
  {
    id: 1,
    title: 'WELCOME TO',
    subtitle: 'BASE2STACKS',
    description: 'The first DeFi protocol bridging Base Network and Stacks — secured by Bitcoin. Earn $B2S tokens for every on-chain action.',
    icon: '🌉',
    color: '#00d4ff',
  },
  {
    id: 2,
    title: 'STEP 01',
    subtitle: 'CONNECT_WALLET',
    description: 'Use Leather or Xverse wallet to connect to the Stacks mainnet. Your keys, your crypto — no custodians.',
    icon: '🔑',
    color: '#00ff9f',
    action: { label: 'GET LEATHER WALLET ↗', href: 'https://leather.io' },
  },
  {
    id: 3,
    title: 'STEP 02',
    subtitle: 'CLAIM_DAILY',
    description: 'Claim 5 $B2S tokens every 24 hours. Just connect your wallet and hit CLAIM. Free tokens, every day, forever.',
    icon: '🎁',
    color: '#ffd700',
    action: { label: 'START CLAIMING →', href: '#claim' },
  },
  {
    id: 4,
    title: 'STEP 03',
    subtitle: 'STAKE_&_EARN',
    description: 'Stake your $B2S to earn up to 37.5% APY. Lock for 14 days to get the 3x multiplier. Unstake anytime — no penalties.',
    icon: '💎',
    color: '#ff00ff',
    action: { label: 'STAKE NOW →', href: '#staking' },
  },
  {
    id: 5,
    title: 'STEP 04',
    subtitle: 'EARN_XP_LEVELS',
    description: 'Every on-chain action earns XP. Reach B2S Legend (LVL 8) by staking, bridging, voting, and providing liquidity.',
    icon: '⚡',
    color: '#ff6600',
    action: { label: 'VIEW YOUR XP →', href: '#progression' },
  },
  {
    id: 6,
    title: 'STEP 05',
    subtitle: 'COLLECT_NFTS',
    description: '567 NFT badges across 3 series: Infosec, Glitch Art, and Galactic. Rare badges unlock exclusive governance power.',
    icon: '🎨',
    color: '#9945ff',
    action: { label: 'EXPLORE BADGES →', href: '#nft' },
  },
  {
    id: 7,
    title: "YOU'RE READY",
    subtitle: 'LFG_ANON',
    description: 'Join hundreds of builders on Stacks mainnet. Bridge, stake, vote, predict — and earn $B2S for everything you do.',
    icon: '🚀',
    color: '#00ff9f',
    action: { label: '▶ ENTER THE APP', href: '#' },
  },
]

interface OnboardingWizardProps {
  onComplete?: () => void
  defaultVisible?: boolean
}

export default function OnboardingWizard({ onComplete, defaultVisible = false }: OnboardingWizardProps) {
  const [visible,  setVisible]  = useState(defaultVisible)
  const [step,     setStep]     = useState(0)
  const [exiting,  setExiting]  = useState(false)
  const [entering, setEntering] = useState(true)
  const [checked,  setChecked]  = useState(false)

  const currentStep = STEPS[step]
  const isLast      = step === STEPS.length - 1
  const progress    = ((step + 1) / STEPS.length) * 100

  useEffect(() => {
    const seen = localStorage.getItem('b2s_onboarding_done')
    if (!seen && !defaultVisible) setVisible(true)
  }, [defaultVisible])

  useEffect(() => {
    setEntering(true)
    const t = setTimeout(() => setEntering(false), 400)
    return () => clearTimeout(t)
  }, [step])

  // ✅ complete défini avant next pour éviter le warning de deps
  const complete = useCallback(() => {
    localStorage.setItem('b2s_onboarding_done', '1')
    setVisible(false)
    onComplete?.()
  }, [onComplete])

  // ✅ Fix — complete ajouté dans les deps
  const next = useCallback(() => {
    if (isLast) {
      complete()
      return
    }
    setExiting(true)
    setTimeout(() => {
      setStep(s => s + 1)
      setExiting(false)
    }, 200)
  }, [isLast, complete])

  const prev = useCallback(() => {
    if (step === 0) return
    setExiting(true)
    setTimeout(() => {
      setStep(s => s - 1)
      setExiting(false)
    }, 200)
  }, [step])

  void checked

  if (!visible) return null

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeDown {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-16px); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.85); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.4; }
          100% { transform: translateY(500px); opacity: 0; }
        }
      `}</style>

      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}
        onClick={e => { if (e.target === e.currentTarget) complete() }}
      >
        <div style={{
          ...MONO, width: '100%', maxWidth: '420px',
          background: '#080b12', border: `1px solid ${currentStep.color}30`,
          borderRadius: '24px', overflow: 'hidden', position: 'relative',
          animation: 'scaleIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          boxShadow: `0 0 60px ${currentStep.color}15, 0 32px 80px rgba(0,0,0,0.8)`,
          transition: 'border-color 0.4s ease, box-shadow 0.4s ease',
        }}>

          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '24px' }}>
            <div style={{ position: 'absolute', width: '100%', height: '2px', background: `linear-gradient(90deg, transparent, ${currentStep.color}20, transparent)`, animation: 'scan 5s linear infinite' }} />
          </div>

          <div style={{ height: '2px', background: `linear-gradient(90deg, transparent, ${currentStep.color}, transparent)`, transition: 'all 0.4s ease' }} />

          <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${currentStep.color}80, ${currentStep.color})`,
              transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)', animation: 'shimmer 1.5s linear infinite' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px 0' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  onClick={() => { if (i < step) setStep(i) }}
                  style={{
                    width: i === step ? '16px' : '5px', height: '5px', borderRadius: '3px',
                    background: i === step ? currentStep.color : i < step ? `${currentStep.color}50` : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.3s ease', cursor: i < step ? 'pointer' : 'default',
                  }}
                />
              ))}
            </div>
            <button onClick={complete} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', ...MONO }}>
              SKIP
            </button>
          </div>

          <div style={{
            padding: '24px 24px 28px',
            animation: entering ? 'fadeUp 0.35s ease' : exiting ? 'fadeDown 0.2s ease' : 'none',
          }}>

            <div style={{
              width: '80px', height: '80px', borderRadius: '24px',
              background: `${currentStep.color}12`, border: `1px solid ${currentStep.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '36px', marginBottom: '20px',
              animation: 'float 3s ease-in-out infinite', transition: 'all 0.4s ease',
            }}>
              {currentStep.icon}
            </div>

            <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: currentStep.color, marginBottom: '4px', transition: 'color 0.4s ease' }}>
              {currentStep.title}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 700, color: '#fff', marginBottom: '14px', letterSpacing: '0.05em', lineHeight: 1.1 }}>
              {currentStep.subtitle}
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: '24px' }}>
              {currentStep.description}
            </div>

            {currentStep.action && (
              <a
                href={currentStep.action.href || '#'}
                target={currentStep.action.href?.startsWith('http') ? '_blank' : '_self'}
                rel="noopener noreferrer"
                style={{
                  display: 'block', textAlign: 'center', padding: '12px', borderRadius: '12px',
                  marginBottom: '12px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
                  background: `${currentStep.color}12`, border: `1px solid ${currentStep.color}35`,
                  color: currentStep.color, textDecoration: 'none', transition: 'all 0.2s ease', ...MONO,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = `${currentStep.color}20`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = `${currentStep.color}12`; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {currentStep.action.label}
              </a>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {step > 0 && (
                <button onClick={prev} style={{
                  ...MONO, flex: '0 0 auto', padding: '12px 16px', borderRadius: '12px',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em',
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >
                  ←
                </button>
              )}
              <button onClick={next} style={{
                ...MONO, flex: 1, padding: '12px', borderRadius: '12px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
                background: `${currentStep.color}18`, border: `1px solid ${currentStep.color}45`,
                color: currentStep.color, cursor: 'pointer', transition: 'all 0.2s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = `${currentStep.color}28`; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.background = `${currentStep.color}18`; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                {isLast ? '▶ ENTER_THE_APP' : `NEXT → ${step + 2}/${STEPS.length}`}
              </button>
            </div>

            {isLast && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={e => setChecked(e.target.checked)}
                  style={{ accentColor: currentStep.color, width: '14px', height: '14px' }}
                />
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
                  {"DON'T SHOW AGAIN"}
                </span>
              </label>
            )}
          </div>
        </div>
      </div>
    </>
  )
}