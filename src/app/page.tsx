'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import { useContract } from '@/hooks/useContract'
import { useBalance } from '@/hooks/useBalance'
import { useToast } from '@/hooks/useToast'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { useStacksWebSocket } from '@/hooks/useStacksWebSocket'

// ── UI Components (fichiers séparés — PAS de ui-primitives ici) ──────
import { LiveIndicator } from '@/components/LiveIndicator'
import { TransactionHistory } from '@/components/TransactionHistory'
import { StakingStats } from '@/components/StakingStats'
import { LeaderboardAdvanced } from '@/components/LeaderboardAdvanced'
import { APYCalculator } from '@/components/APYCalculator'
import { ToastContainer } from '@/components/Toast'
import { ButtonLoading } from '@/components/LoadingSpinner'
import { TransactionToast, ErrorToast } from '@/components/TransactionToast'
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard'
import RewardsDistributor from '@/components/RewardsDistributor'
import GovernanceDAO from '@/components/GovernanceDAO'
import NFTMarketplace from '@/components/NFTMarketplace'
import LiquidityPool from '@/components/LiquidityPool'
import PredictionMarket from '@/components/PredictionMarket'
import MarketData from '@/components/MarketData'
import BridgeRouter from '@/components/BridgeRouter'

const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

// ── Section wrapper ──────────────────────────────────────────────────
function Section({ title, color = '#00d4ff', children, maxWidth = 'max-w-6xl' }: {
  title: string; color?: string; children: React.ReactNode; maxWidth?: string
}) {
  return (
    <section className="container mx-auto px-4 py-10 sm:py-16">
      <div className={`${maxWidth} mx-auto`}>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
          <h3
            style={{ ...MONO, color, textShadow: `0 0 20px ${color}50` }}
            className="text-[10px] sm:text-xs font-black tracking-[0.3em] uppercase whitespace-nowrap"
          >
            {title}
          </h3>
          <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${color}40, transparent)` }} />
        </div>
        {children}
      </div>
    </section>
  )
}

export default function Page() {
  const { mounted, connect, disconnect, isConnected, address } = useWallet()
  const { claimDailyReward, stake, loading, error, txId } = useContract()
  const { balance, loading: balanceLoading } = useBalance(address)
  const { toasts, removeToast, success, error: showError } = useToast()
  const dashStats = useDashboardStats()

  const [stakeAmount, setStakeAmount]       = useState('')
  const [showStakeModal, setShowStakeModal] = useState(false)
  const [showTxToast, setShowTxToast]       = useState(false)
  const [showErrorToast, setShowErrorToast] = useState(false)
  const [liveActivity, setLiveActivity]     = useState<string | null>(null)
  const [statsKey, setStatsKey]             = useState(0)

  const handleBlock = useCallback(() => setStatsKey(k => k + 1), [])

  const handleTx = useCallback((tx: any) => {
    const fn   = tx.contract_call?.function_name
    const addr = tx.sender_address?.slice(0, 8) ?? '?'
    const map: Record<string, string> = {
      'stake':       `STAKE_TX // ${addr}`,
      'unstake':     `UNSTAKE_TX // ${addr}`,
      'claim-daily': `CLAIM_TX // ${addr}`,
      'vote':        `VOTE_TX // ${addr}`,
      'bridge':      `BRIDGE_TX // ${tx.tx_id?.slice(0, 10)}`,
    }
    if (map[fn]) setLiveActivity(map[fn])
    setTimeout(() => setLiveActivity(null), 5000)
  }, [])

  const { connected: wsConnected, blockHeight } = useStacksWebSocket({
    onBlock: handleBlock, onTransaction: handleTx,
    contractFilter: CONTRACT_ADDRESS, enabled: true,
  })

  useEffect(() => { if (txId)  { setShowTxToast(true);   success('TX_SUBMITTED // OK') } }, [txId])
  useEffect(() => { if (error) { setShowErrorToast(true) }                               }, [error])

  if (!mounted) return null

  const handleClaim = async () => { try { await claimDailyReward() } catch (e) { console.error(e) } }

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) { showError('Invalid amount'); return }
    try { await stake(parseFloat(stakeAmount)); setShowStakeModal(false); setStakeAmount('') }
    catch (e) { console.error(e) }
  }

  const shortAddress = (addr: string) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''

  const STATS = [
    { label: 'TRANSACTIONS',  value: dashStats.loading ? '···' : formatNumber(dashStats.totalTxCount),         color: '#00d4ff' },
    { label: 'TOKEN_HOLDERS', value: dashStats.loading ? '···' : formatNumber(dashStats.totalHolders),         color: '#ff00ff' },
    { label: 'TOTAL_SUPPLY',  value: dashStats.loading ? '···' : formatNumber(dashStats.totalSupply),          color: '#ffd700' },
    { label: 'STX_IN_POOL',   value: dashStats.loading ? '···' : `${formatNumber(dashStats.totalStaked)} STX`, color: '#00ff9f' },
  ]

  return (
    <div className="min-h-screen bg-black" style={MONO}>

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src="/android-chrome-192x192.png" alt="B2S" className="w-9 h-9 rounded-xl" />
              <div>
                <div className="text-white font-black text-sm tracking-tight leading-none">
                  BASE<span style={{ color: '#00d4ff' }}>2</span>STACKS
                </div>
                <div className="text-[9px] tracking-[0.3em] font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>MAINNET</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <LiveIndicator connected={wsConnected} blockHeight={blockHeight} />
              {isConnected && address && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] text-[10px] font-black tracking-widest"
                     style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {shortAddress(address)}
                </div>
              )}
              <button
                onClick={isConnected ? disconnect : connect}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all hover:opacity-80 disabled:opacity-30"
                style={{
                  background: isConnected ? 'rgba(255,68,68,0.1)'   : 'rgba(0,212,255,0.1)',
                  border:     isConnected ? '1px solid rgba(255,68,68,0.3)' : '1px solid rgba(0,212,255,0.3)',
                  color:      isConnected ? '#ff4444' : '#00d4ff',
                }}
              >
                {isConnected ? '◼ DISCONNECT' : '▶ CONNECT_WALLET'}
              </button>
            </div>
          </nav>

          {liveActivity && (
            <div className="mt-2 text-center text-[9px] font-black tracking-[0.3em] animate-pulse" style={{ color: '#ff00ff' }}>
              {'>'} {liveActivity}<span className="animate-pulse">_</span>
            </div>
          )}
        </div>
      </header>

      {/* ══ HERO ════════════════════════════════════════════════════ */}
      <section className="container mx-auto px-4 pt-16 pb-12 text-center">
        <div className="max-w-3xl mx-auto">

          <div className="relative inline-block mb-8">
            <div className="absolute inset-0 rounded-full blur-3xl opacity-30"
                 style={{ background: 'radial-gradient(circle, #00d4ff, #ff00ff)' }} />
            <img src="/android-chrome-512x512.png" alt="Base2Stacks"
                 className="relative mx-auto w-28 h-28 sm:w-36 sm:h-36 animate-float rounded-3xl" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00ff9f]/20 bg-[#00ff9f]/[0.06] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00ff9f] animate-pulse" />
            <span className="text-[9px] font-black tracking-[0.3em]" style={{ color: '#00ff9f' }}>
              STACKS_BUILDER_REWARDS // MAINNET
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white mb-2 leading-none tracking-tight">
            TRACK CROSS-CHAIN
          </h2>
          <h2 className="text-3xl sm:text-5xl font-black mb-6 leading-none tracking-tight"
              style={{ color: '#00d4ff', textShadow: '0 0 40px rgba(0,212,255,0.4)' }}>
            BRIDGES
          </h2>
          <p className="text-white/25 text-xs tracking-[0.2em] mb-10">
            CONNECT_WALLET → CLAIM_REWARDS → STAKE → EARN
          </p>

          {isConnected ? (
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <ButtonLoading
                onClick={handleClaim} loading={loading}
                className="px-8 py-3 rounded-xl text-xs font-black tracking-widest transition-all hover:opacity-80 disabled:opacity-30"
                style={{ background: 'rgba(0,255,159,0.1)', border: '1px solid rgba(0,255,159,0.3)', color: '#00ff9f' }}
              >
                ▶ CLAIM_DAILY // 5 $B2S
              </ButtonLoading>
              <button
                onClick={() => setShowStakeModal(true)}
                className="px-8 py-3 rounded-xl text-xs font-black tracking-widest transition-all hover:opacity-80"
                style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', color: '#ffd700' }}
              >
                ◆ STAKE_$B2S
              </button>
            </div>
          ) : (
            <button onClick={connect}
              className="px-10 py-3 rounded-xl text-xs font-black tracking-widest transition-all hover:opacity-80"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.35)', color: '#00d4ff', boxShadow: '0 0 30px rgba(0,212,255,0.1)' }}>
              ▶ CONNECT_WALLET_TO_START
            </button>
          )}

          {isConnected && address && (
            <div className="mt-8 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 text-left space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <p className="text-[9px] tracking-[0.3em] font-black text-white/25 mb-1.5">WALLET_ADDRESS</p>
                  <p className="text-white/50 text-xs font-mono break-all leading-relaxed">{address}</p>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.3em] font-black text-white/25 mb-1.5">$B2S_BALANCE</p>
                  <p className="text-3xl font-black tabular-nums"
                     style={{ color: '#00d4ff', textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
                    {balanceLoading ? '···' : balance.toFixed(2)}
                    <span className="text-sm ml-2 text-white/25">$B2S</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {isConnected && address && (
            <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="text-[9px] tracking-[0.3em] font-black text-white/25 mb-4 text-left">RECENT_TRANSACTIONS</p>
              <TransactionHistory address={address} />
            </div>
          )}

          {isConnected && address && (
            <div className="mt-4">
              <p className="text-[9px] tracking-[0.3em] font-black text-white/25 mb-4 text-left">YOUR_STAKING</p>
              <StakingStats address={address} />
            </div>
          )}
        </div>
      </section>

      {/* ══ SECTIONS ════════════════════════════════════════════════ */}
      <Section title="// LIVE_STATS" color="#00d4ff" maxWidth="max-w-5xl">
        <div key={statsKey} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STATS.map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center hover:border-white/[0.12] transition-all">
              <p className="text-[9px] tracking-[0.3em] font-black text-white/20 mb-2">{s.label}</p>
              <p className="text-2xl sm:text-3xl font-black tabular-nums"
                 style={{ color: s.color, textShadow: `0 0 20px ${s.color}40` }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="// MARKET_DATA" color="#ffd700" maxWidth="max-w-5xl">
        <MarketData />
      </Section>

      <Section title="// HOW_IT_WORKS" color="#ff00ff" maxWidth="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { n: '01', title: 'CONNECT_WALLET', desc: 'Leather or Xverse wallet',  color: '#00d4ff' },
            { n: '02', title: 'CLAIM_REWARDS',  desc: 'Claim 5 $B2S tokens daily', color: '#00ff9f' },
            { n: '03', title: 'STAKE_AND_EARN', desc: 'Earn up to 37.5% APY',      color: '#ffd700' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center hover:border-white/[0.12] transition-all">
              <p className="text-4xl font-black mb-3" style={{ color: s.color, textShadow: `0 0 20px ${s.color}40` }}>{s.n}</p>
              <p className="text-xs font-black tracking-widest text-white mb-2">{s.title}</p>
              <p className="text-white/25 text-[10px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="// ANALYTICS_DASHBOARD" color="#00ff9f" maxWidth="max-w-7xl">
        <AnalyticsDashboard refreshInterval={60000} />
      </Section>

      <Section title="// TOP_STAKERS" color="#ffd700" maxWidth="max-w-4xl">
        <LeaderboardAdvanced />
      </Section>

      <Section title="// APY_CALCULATOR" color="#00d4ff" maxWidth="max-w-3xl">
        <APYCalculator />
      </Section>

      <Section title="// REWARDS_DISTRIBUTION" color="#ff00ff" maxWidth="max-w-5xl">
        <RewardsDistributor />
      </Section>

      <Section title="// GOVERNANCE_DAO" color="#cc00ff" maxWidth="max-w-6xl">
        <GovernanceDAO />
      </Section>

      <Section title="// NFT_BADGE_MARKETPLACE" color="#ff6600" maxWidth="max-w-7xl">
        <NFTMarketplace />
      </Section>

      <Section title="// LIQUIDITY_POOL" color="#00ff9f" maxWidth="max-w-7xl">
        <LiquidityPool />
      </Section>

      <Section title="// CROSS_CHAIN_BRIDGE" color="#00d4ff" maxWidth="max-w-6xl">
        <BridgeRouter />
      </Section>

      <Section title="// PREDICTION_MARKET" color="#ff4444" maxWidth="max-w-6xl">
        <PredictionMarket />
      </Section>

      {/* ══ FOOTER ══════════════════════════════════════════════════ */}
      <footer className="border-t border-white/[0.06] mt-8">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="flex items-center gap-3">
              <img src="/android-chrome-192x192.png" alt="B2S" className="w-7 h-7 rounded-xl" />
              <span className="text-xs font-black tracking-[0.2em] text-white/40">BASE2STACKS_TRACKER</span>
            </div>
            <p className="text-[10px] tracking-widest text-white/20">
              BUILT WITH ❤️ BY <span style={{ color: '#2015f4' }}>WKALIDEV(ZCODEBASE)</span> // MAINNET
            </p>
            <div className="flex items-center gap-6">
              {[
                { label: 'GITHUB',    href: 'https://github.com/wkalidev/base2stacks-tracker' },
                { label: 'TWITTER',   href: 'https://twitter.com/willycodexwar'               },
                { label: 'FARCASTER', href: 'https://warpcast.com/willywarrior'               },
              ].map(l => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                   className="text-[9px] font-black tracking-[0.2em] text-white/20 hover:text-white/60 transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ══ STAKING MODAL ════════════════════════════════════════════ */}
      {showStakeModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
             onClick={() => setShowStakeModal(false)}>
          <div className="relative rounded-2xl border border-white/[0.07] bg-black p-6 max-w-sm w-full"
               style={{ boxShadow: '0 0 60px rgba(0,212,255,0.1)' }}
               onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00d4ff]/40 to-transparent rounded-t-2xl" />
            <p className="text-[9px] tracking-[0.3em] font-black text-white/25 mb-1">STAKE_MODAL</p>
            <h3 className="text-white font-black text-xl mb-5">STAKE $B2S</h3>
            <div className="mb-4">
              <p className="text-[9px] tracking-widest font-black text-white/25 mb-2">AMOUNT</p>
              <div className="relative">
                <input
                  type="number" value={stakeAmount} onChange={e => setStakeAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-lg font-black placeholder-white/20 focus:outline-none focus:border-[#00d4ff]/40 transition-colors"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 text-xs font-black">$B2S</span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowStakeModal(false)}
                className="flex-1 py-3 rounded-xl text-xs font-black tracking-widest text-white/30 border border-white/[0.08] hover:border-white/20 transition-all">
                CANCEL
              </button>
              <button onClick={handleStake} disabled={loading}
                className="flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all hover:opacity-80 disabled:opacity-30"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff' }}>
                {loading ? '⏳ STAKING...' : '▶ CONFIRM_STAKE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ TOASTS ══════════════════════════════════════════════════ */}
      {showTxToast    && txId  && <TransactionToast txId={txId} onClose={() => setShowTxToast(false)}    />}
      {showErrorToast && error && <ErrorToast error={error}     onClose={() => setShowErrorToast(false)} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}