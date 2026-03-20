'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import {
  callReadOnlyFunction, cvToJSON, uintCV, boolCV,
  standardPrincipalCV, PostConditionMode, AnchorMode,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const CONTRACT_NAME    = 'b2s-prediction-market'
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

const SEED_MARKETS = [
  { id: 1,  question: 'Will Bitcoin reach $120,000 before end of Q2 2026?',           category: 'price',      deadline: 999999, resolved: false, outcome: false, totalYes: 3200, totalNo: 1800 },
  { id: 2,  question: 'Will Stacks TVL exceed $500M in 2026?',                         category: 'stacks',     deadline: 999999, resolved: false, outcome: false, totalYes: 2100, totalNo: 900  },
  { id: 3,  question: 'Will B2S governance proposal #1 pass?',                         category: 'governance', deadline: 999999, resolved: false, outcome: false, totalYes: 1500, totalNo: 500  },
  { id: 4,  question: 'Will a major CEX halt withdrawals in 2026?',                    category: 'crisis',     deadline: 999999, resolved: false, outcome: false, totalYes: 800,  totalNo: 4200 },
  { id: 5,  question: 'Will STX outperform ETH in Q2 2026?',                           category: 'price',      deadline: 999999, resolved: false, outcome: false, totalYes: 2800, totalNo: 2200 },
  { id: 6,  question: 'Will Solana flip Ethereum in market cap by end of 2026?',       category: 'price',      deadline: 999999, resolved: false, outcome: false, totalYes: 1200, totalNo: 3800 },
  { id: 7,  question: 'Will the US approve a Spot ETH ETF staking by Q3 2026?',       category: 'regulation', deadline: 999999, resolved: false, outcome: false, totalYes: 2600, totalNo: 1400 },
  { id: 8,  question: 'Will Base chain surpass Ethereum L1 in daily transactions?',    category: 'stacks',     deadline: 999999, resolved: false, outcome: false, totalYes: 3100, totalNo: 1900 },
  { id: 9,  question: 'Will DeFi total TVL exceed $200B in 2026?',                     category: 'defi',       deadline: 999999, resolved: false, outcome: false, totalYes: 2900, totalNo: 2100 },
  { id: 10, question: 'Will B2S token reach $1 market price in 2026?',                category: 'b2s',        deadline: 999999, resolved: false, outcome: false, totalYes: 4100, totalNo: 900  },
  { id: 11, question: 'Will a nation-state add Bitcoin to its treasury reserves?',     category: 'macro',      deadline: 999999, resolved: false, outcome: false, totalYes: 3500, totalNo: 1500 },
  { id: 12, question: 'Will Stacks implement full EVM compatibility by end of 2026?',  category: 'stacks',     deadline: 999999, resolved: false, outcome: false, totalYes: 1800, totalNo: 2200 },
]

const CAT_COLOR: Record<string, string> = {
  price:      '#00ff9f',
  stacks:     '#ff6600',
  governance: '#ff00ff',
  crisis:     '#ff4444',
  regulation: '#ffd700',
  defi:       '#00d4ff',
  b2s:        '#9945ff',
  macro:      '#888888',
}

const CAT_ICON: Record<string, string> = {
  price: '📈', stacks: '🟠', governance: '🏛️', crisis: '🚨',
  regulation: '⚖️', defi: '💧', b2s: '💎', macro: '🌍',
}

interface Market {
  id:        number
  question:  string
  category:  string
  deadline:  number
  resolved:  boolean
  outcome:   boolean
  totalYes:  number
  totalNo:   number
}

function getOdds(yes: number, no: number) {
  const total = yes + no
  if (total === 0) return { yes: 50, no: 50 }
  return { yes: Math.round((yes / total) * 100), no: Math.round((no / total) * 100) }
}

export default function PredictionMarket() {
  const { address, isConnected } = useWallet()
  const [markets,     setMarkets]     = useState<Market[]>(SEED_MARKETS)
  const [activecat,   setActiveCat]   = useState('all')
  const [sortBy,      setSortBy]      = useState<'volume' | 'hot' | 'new'>('volume')
  const [betAmounts,  setBetAmounts]  = useState<Record<number, string>>({})
  const [loading,     setLoading]     = useState<Record<number, boolean>>({})
  const [txIds,       setTxIds]       = useState<Record<number, string>>({})
  const [userBets,    setUserBets]    = useState<Record<number, { yes: number; no: number; claimed: boolean }>>({})
  const [showCreate,  setShowCreate]  = useState(false)
  const [newMarket,   setNewMarket]   = useState({ question: '', category: 'price', days: '7' })

  const fetchMarkets = useCallback(async () => {
    try {
      const countRes = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME, functionName: 'get-market-count', functionArgs: [], senderAddress: CONTRACT_ADDRESS })
      const count = Number(cvToJSON(countRes).value)
      if (count === 0) return
      const fetched: Market[] = []
      for (let i = 1; i <= count; i++) {
        const res = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME, functionName: 'get-market', functionArgs: [uintCV(i)], senderAddress: CONTRACT_ADDRESS })
        const m = cvToJSON(res).value
        if (m) fetched.push({ id: i, question: m.question?.value || '', category: m.category?.value || 'price', deadline: Number(m.deadline?.value || 0), resolved: m.resolved?.value || false, outcome: m.outcome?.value || false, totalYes: Number(m['total-yes']?.value || 0) / 1_000_000, totalNo: Number(m['total-no']?.value || 0) / 1_000_000 })
      }
      if (fetched.length > 0) setMarkets(fetched)
    } catch {}
  }, [])

  const fetchUserBets = useCallback(async () => {
    if (!address) return
    const bets: Record<number, { yes: number; no: number; claimed: boolean }> = {}
    for (const m of markets) {
      try {
        const res = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME, functionName: 'get-bet', functionArgs: [uintCV(m.id), standardPrincipalCV(address)], senderAddress: address })
        const b = cvToJSON(res).value
        if (b) bets[m.id] = { yes: Number(b['yes-amount']?.value || 0) / 1_000_000, no: Number(b['no-amount']?.value || 0) / 1_000_000, claimed: b.claimed?.value || false }
      } catch {}
    }
    setUserBets(bets)
  }, [address, markets])

  useEffect(() => { fetchMarkets() }, [fetchMarkets])
  useEffect(() => { if (address) fetchUserBets() }, [address, fetchUserBets])

  const handleBet = async (marketId: number, vote: boolean) => {
    if (!address) return
    const amount = parseFloat(betAmounts[marketId] || '0')
    if (!amount || amount < 1) return
    setLoading(p => ({ ...p, [marketId]: true }))
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'place-bet',
        functionArgs: [uintCV(marketId), boolCV(vote), uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (d) => { setTxIds(p => ({ ...p, [marketId]: d.txId })); setBetAmounts(p => ({ ...p, [marketId]: '' })); setLoading(p => ({ ...p, [marketId]: false })); setTimeout(fetchMarkets, 5000) },
        onCancel: () => setLoading(p => ({ ...p, [marketId]: false })),
      })
    } catch { setLoading(p => ({ ...p, [marketId]: false })) }
  }

  const handleClaim = async (marketId: number) => {
    if (!address) return
    setLoading(p => ({ ...p, [marketId]: true }))
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'claim-winnings', functionArgs: [uintCV(marketId)],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (d) => { setTxIds(p => ({ ...p, [marketId]: d.txId })); setLoading(p => ({ ...p, [marketId]: false })); setTimeout(fetchUserBets, 5000) },
        onCancel: () => setLoading(p => ({ ...p, [marketId]: false })),
      })
    } catch { setLoading(p => ({ ...p, [marketId]: false })) }
  }

  const totalVolume = markets.reduce((a, m) => a + m.totalYes + m.totalNo, 0)
  const categories  = ['all', ...Array.from(new Set(markets.map(m => m.category)))]

  const sorted = [...markets]
    .filter(m => activecat === 'all' || m.category === activecat)
    .sort((a, b) => {
      if (sortBy === 'volume') return (b.totalYes + b.totalNo) - (a.totalYes + a.totalNo)
      if (sortBy === 'hot')    return Math.abs(getOdds(b.totalYes, b.totalNo).yes - 50) - Math.abs(getOdds(a.totalYes, a.totalNo).yes - 50)
      return b.id - a.id
    })

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff4444', boxShadow: '0 0 8px #ff4444', animation: 'pulse 2s infinite', display: 'inline-block' }} />
        <span style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#ff4444' }}>PREDICTION_MARKET // ON-CHAIN</span>
      </div>
      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: '20px' }}>
        PLACE BETS WITH $B2S · 2% PLATFORM FEE · TRUSTLESS RESOLUTION
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        {[
          { label: 'ACTIVE',   val: markets.filter(m => !m.resolved).length, color: '#00ff9f' },
          { label: 'VOLUME',   val: `${(totalVolume / 1000).toFixed(1)}K`,    color: '#ff00ff' },
          { label: 'RESOLVED', val: markets.filter(m => m.resolved).length,   color: '#ffd700' },
          { label: 'MARKETS',  val: markets.length,                           color: '#ff4444' },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px', background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const color  = CAT_COLOR[cat] || '#fff'
            const active = activecat === cat
            return (
              <button key={cat} onClick={() => setActiveCat(cat)} style={{
                ...MONO,
                padding: '4px 12px', borderRadius: '20px', fontSize: '9px',
                fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
                border: active ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.08)',
                background: active ? `${color}12` : 'rgba(255,255,255,0.02)',
                color: active ? color : 'rgba(255,255,255,0.35)',
                transition: 'all 0.15s',
              }}>
                {cat === 'all' ? '⚡ ALL' : `${CAT_ICON[cat] || ''} ${cat.toUpperCase()}`}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* Sort */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
            {(['volume', 'hot', 'new'] as const).map(s => (
              <button key={s} onClick={() => setSortBy(s)} style={{
                ...MONO,
                padding: '6px 12px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
                cursor: 'pointer', border: 'none',
                background: sortBy === s ? 'rgba(255,68,68,0.15)' : 'transparent',
                color: sortBy === s ? '#ff4444' : 'rgba(255,255,255,0.3)',
                transition: 'all 0.15s',
              }}>
                {s === 'volume' ? '📊' : s === 'hot' ? '🔥' : '🆕'} {s.toUpperCase()}
              </button>
            ))}
          </div>

          {isConnected && (
            <button onClick={() => setShowCreate(true)} style={{
              ...MONO,
              padding: '6px 14px', borderRadius: '10px', fontSize: '10px',
              fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
              background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)', color: '#ff4444',
            }}>
              + CREATE
            </button>
          )}
        </div>
      </div>

      {/* Market grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
        {sorted.map(market => {
          const odds    = getOdds(market.totalYes, market.totalNo)
          const color   = CAT_COLOR[market.category] || '#fff'
          const userBet = userBets[market.id]
          const total   = market.totalYes + market.totalNo
          const isHot   = total > 4000

          return (
            <div key={market.id} style={{
              background:   `${color}05`,
              border:       `1px solid ${color}20`,
              borderRadius: '16px',
              padding:      '18px',
              position:     'relative',
              overflow:     'hidden',
              transition:   'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}40`; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}20`; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '8px', letterSpacing: '0.12em', padding: '2px 8px', borderRadius: '10px', background: `${color}12`, border: `1px solid ${color}25`, color }}>
                    {CAT_ICON[market.category]} {market.category.toUpperCase()}
                  </span>
                  {isHot && (
                    <span style={{ fontSize: '8px', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,102,0,0.12)', border: '1px solid rgba(255,102,0,0.3)', color: '#ff6600', animation: 'pulse 2s infinite' }}>
                      🔥 HOT
                    </span>
                  )}
                  {market.resolved && (
                    <span style={{ fontSize: '8px', letterSpacing: '0.1em', padding: '2px 8px', borderRadius: '10px', background: market.outcome ? 'rgba(0,255,159,0.1)' : 'rgba(255,68,68,0.1)', border: `1px solid ${market.outcome ? 'rgba(0,255,159,0.3)' : 'rgba(255,68,68,0.3)'}`, color: market.outcome ? '#00ff9f' : '#ff4444' }}>
                      {market.outcome ? '✓ YES WON' : '✗ NO WON'}
                    </span>
                  )}
                  {!market.resolved && (
                    <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,255,159,0.08)', border: '1px solid rgba(0,255,159,0.2)', color: '#00ff9f' }}>
                      ● LIVE
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>#{market.id}</span>
              </div>

              {/* Question */}
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '14px', lineHeight: 1.4 }}>
                {market.question}
              </div>

              {/* Odds bar */}
              <div style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#00ff9f' }}>{odds.yes}% YES</span>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>{total.toLocaleString()} $B2S</span>
                  <span style={{ fontSize: '16px', fontWeight: 700, color: '#ff4444' }}>NO {odds.no}%</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', height: '100%' }}>
                    <div style={{ width: `${odds.yes}%`, background: 'linear-gradient(90deg, #00ff9f, #00d4ff)', transition: 'width 0.7s ease' }} />
                    <div style={{ width: `${odds.no}%`,  background: 'linear-gradient(90deg, #ff6644, #ff4444)', transition: 'width 0.7s ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{market.totalYes.toLocaleString()} B2S</span>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{market.totalNo.toLocaleString()} B2S</span>
                </div>
              </div>

              {/* User bet */}
              {userBet && (userBet.yes > 0 || userBet.no > 0) && (
                <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>YOUR_BET</span>
                  {userBet.yes > 0 && <span style={{ fontSize: '10px', fontWeight: 700, color: '#00ff9f' }}>✓ {userBet.yes.toFixed(1)} YES</span>}
                  {userBet.no  > 0 && <span style={{ fontSize: '10px', fontWeight: 700, color: '#ff4444' }}>✗ {userBet.no.toFixed(1)} NO</span>}
                </div>
              )}

              {/* Bet interface */}
              {!market.resolved && isConnected && (
                <div>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <input
                      type="number"
                      placeholder="AMOUNT..."
                      value={betAmounts[market.id] || ''}
                      onChange={e => setBetAmounts(p => ({ ...p, [market.id]: e.target.value }))}
                      style={{ ...MONO, width: '100%', padding: '9px 44px 9px 12px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = `${color}40`}
                      onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>$B2S</span>
                  </div>

                  {/* Quick amounts */}
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    {[10, 50, 100, 500].map(amt => (
                      <button key={amt} onClick={() => setBetAmounts(p => ({ ...p, [market.id]: String(amt) }))} style={{
                        ...MONO,
                        flex: 1, padding: '5px 2px', borderRadius: '7px', fontSize: '9px',
                        fontWeight: 700, cursor: 'pointer',
                        border: betAmounts[market.id] === String(amt) ? `1px solid ${color}40` : '1px solid rgba(255,255,255,0.07)',
                        background: betAmounts[market.id] === String(amt) ? `${color}10` : 'rgba(255,255,255,0.02)',
                        color: betAmounts[market.id] === String(amt) ? color : 'rgba(255,255,255,0.3)',
                        transition: 'all 0.12s',
                      }}>
                        {amt}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button onClick={() => handleBet(market.id, true)} disabled={loading[market.id] || !betAmounts[market.id]} style={{
                      ...MONO,
                      padding: '10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                      cursor: 'pointer', background: 'rgba(0,255,159,0.12)', border: '1px solid rgba(0,255,159,0.35)', color: '#00ff9f',
                      opacity: (!betAmounts[market.id] || loading[market.id]) ? 0.4 : 1, transition: 'all 0.15s',
                    }}>
                      {loading[market.id] ? '⏳' : `✓ YES · ${odds.yes}%`}
                    </button>
                    <button onClick={() => handleBet(market.id, false)} disabled={loading[market.id] || !betAmounts[market.id]} style={{
                      ...MONO,
                      padding: '10px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em',
                      cursor: 'pointer', background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.35)', color: '#ff4444',
                      opacity: (!betAmounts[market.id] || loading[market.id]) ? 0.4 : 1, transition: 'all 0.15s',
                    }}>
                      {loading[market.id] ? '⏳' : `✗ NO · ${odds.no}%`}
                    </button>
                  </div>
                </div>
              )}

              {/* Claim winnings */}
              {market.resolved && isConnected && userBet && !userBet.claimed &&
               ((market.outcome && userBet.yes > 0) || (!market.outcome && userBet.no > 0)) && (
                <button onClick={() => handleClaim(market.id)} disabled={loading[market.id]} style={{
                  ...MONO,
                  width: '100%', marginTop: '8px', padding: '11px', borderRadius: '10px',
                  fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
                  background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)', color: '#ffd700',
                  transition: 'all 0.15s',
                }}>
                  {loading[market.id] ? '⏳ CLAIMING...' : '🏆 CLAIM_WINNINGS'}
                </button>
              )}

              {/* Not connected */}
              {!isConnected && !market.resolved && (
                <div style={{ padding: '8px', textAlign: 'center', fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  CONNECT_WALLET_TO_BET
                </div>
              )}

              {/* TX link */}
              {txIds[market.id] && (
                <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(0,255,159,0.05)', border: '1px solid rgba(0,255,159,0.2)', borderRadius: '8px' }}>
                  <a href={`https://explorer.hiro.so/txid/${txIds[market.id]}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '9px', letterSpacing: '0.1em', color: '#00ff9f', textDecoration: 'none' }}>
                    ✓ TX_SUBMITTED → VIEW_EXPLORER ↗
                  </a>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setShowCreate(false)}>
          <div style={{ ...MONO, width: '100%', maxWidth: '460px', background: '#080b12', border: '1px solid rgba(255,68,68,0.25)', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,68,68,0.8), transparent)' }} />

            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: '#ff4444', marginBottom: '4px' }}>CREATE_PREDICTION_MARKET</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>NEW_MARKET</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>QUESTION</div>
                  <textarea rows={3} value={newMarket.question} onChange={e => setNewMarket(p => ({ ...p, question: e.target.value }))}
                    placeholder="Will Bitcoin reach $150K before 2027?"
                    style={{ ...MONO, width: '100%', padding: '10px 14px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,68,68,0.4)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>CATEGORY</div>
                  <select value={newMarket.category} onChange={e => setNewMarket(p => ({ ...p, category: e.target.value }))}
                    style={{ ...MONO, width: '100%', padding: '10px 14px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', outline: 'none' }}>
                    {Object.keys(CAT_COLOR).map(c => <option key={c} value={c}>{CAT_ICON[c]} {c.toUpperCase()}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>DURATION</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['7', '14', '30', '90'].map(d => (
                      <button key={d} onClick={() => setNewMarket(p => ({ ...p, days: d }))} style={{
                        ...MONO,
                        flex: 1, padding: '9px 4px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                        cursor: 'pointer', border: 'none',
                        background: newMarket.days === d ? 'rgba(255,68,68,0.15)' : 'rgba(255,255,255,0.04)',
                        outline: newMarket.days === d ? '1px solid rgba(255,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: newMarket.days === d ? '#ff4444' : 'rgba(255,255,255,0.3)',
                      }}>
                        {d}d
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '4px', letterSpacing: '0.1em' }}>
                    ≈ {(parseInt(newMarket.days) * 144).toLocaleString()} BLOCKS
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowCreate(false)} style={{ ...MONO, flex: 1, padding: '12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}>
                  CANCEL
                </button>
                <button
                  disabled={!newMarket.question}
                  onClick={async () => {
                    if (!address || !newMarket.question) return
                    const blocks = parseInt(newMarket.days) * 144
                    try {
                      const { stringUtf8CV, stringAsciiCV } = await import('@stacks/transactions')
                      await openContractCall({
                        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
                        functionName: 'create-market',
                        functionArgs: [stringUtf8CV(newMarket.question), stringAsciiCV(newMarket.category), uintCV(blocks)],
                        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
                        onFinish: () => { setShowCreate(false); setNewMarket({ question: '', category: 'price', days: '7' }); setTimeout(fetchMarkets, 5000) },
                        onCancel: () => {},
                      })
                    } catch (err) { console.error(err) }
                  }}
                  style={{ ...MONO, flex: 1, padding: '12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.4)', color: '#ff4444', opacity: !newMarket.question ? 0.4 : 1 }}>
                  DEPLOY_MARKET 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}