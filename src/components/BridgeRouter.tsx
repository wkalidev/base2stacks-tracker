'use client'

import { useEffect, useState, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import {
  callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'

const MONO             = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }
const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const FEE_ROUTER       = 'b2s-fee-router'
const DECIMALS         = 1_000_000

const BRIDGE_CHAINS = [
  { chain: 'Ethereum', symbol: 'ETH',    color: '#627EEA' },
  { chain: 'Base',     symbol: 'BASE',   color: '#0052FF' },
  { chain: 'BNB',      symbol: 'BNB',    color: '#F3BA2F' },
  { chain: 'Polygon',  symbol: 'MATIC',  color: '#8247E5' },
  { chain: 'Stacks',   symbol: 'STX',    color: '#FF5500' },
]

const BRIDGE_LIST = [
  { name: 'Stargate',      url: 'https://stargate.finance',           tag: 'RECOMMENDED', color: '#00ff9f', routes: 20 },
  { name: 'deBridge',      url: 'https://app.debridge.com/r/32893',   tag: 'AFFILIATE',   color: '#ff00ff', routes: 8  },
  { name: 'Across',        url: 'https://across.to',                  tag: 'FAST',        color: '#00d4ff', routes: 10 },
  { name: 'Celer cBridge', url: 'https://cbridge.celer.network',      tag: 'MULTI-CHAIN', color: '#ffd700', routes: 15 },
  { name: 'Orbiter',       url: 'https://www.orbiter.finance',        tag: 'ZK-POWERED',  color: '#cc00ff', routes: 6  },
  { name: 'Jupiter',       url: 'https://jup.ag/?ref=j5ft3v5m26eu',   tag: 'AFFILIATE',   color: '#f7931a', routes: 5  },
]

interface BridgeStats {
  totalVolume: number
  totalFees:   number
  bridgeCount: number
  feeBps:      number
  loading:     boolean
}

interface UserStats {
  bridgeCount: number
  volume:      number
}

export default function BridgeRouter() {
  const { address, isConnected } = useWallet()
  const [activeTab,     setActiveTab]     = useState<'bridge' | 'record' | 'stats'>('bridge')
  const [recordAmount,  setRecordAmount]  = useState('')
  const [loading,       setLoading]       = useState(false)
  const [txId,          setTxId]          = useState<string | null>(null)
  const [stats,         setStats]         = useState<BridgeStats>({ totalVolume: 0, totalFees: 0, bridgeCount: 0, feeBps: 30, loading: true })
  const [userStats,     setUserStats]     = useState<UserStats>({ bridgeCount: 0, volume: 0 })

  const fetchStats = useCallback(async () => {
    try {
      const result = await callReadOnlyFunction({
        network, contractAddress: CONTRACT_ADDRESS, contractName: FEE_ROUTER,
        functionName: 'get-stats', functionArgs: [],
        senderAddress: address || CONTRACT_ADDRESS,
      })
      const data = cvToJSON(result).value
      setStats({
        totalVolume: Number(data['total-volume']?.value || 0) / DECIMALS,
        totalFees:   Number(data['total-fees']?.value   || 0) / DECIMALS,
        bridgeCount: Number(data['bridge-count']?.value || 0),
        feeBps:      Number(data['fee-bps']?.value      || 30),
        loading:     false,
      })
    } catch { setStats(p => ({ ...p, loading: false })) }
  }, [address])

  const fetchUserStats = useCallback(async () => {
    if (!address) return
    try {
      const result = await callReadOnlyFunction({
        network, contractAddress: CONTRACT_ADDRESS, contractName: FEE_ROUTER,
        functionName: 'get-user-stats', functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      })
      const data = cvToJSON(result).value
      setUserStats({
        bridgeCount: Number(data['bridge-count']?.value || 0),
        volume:      Number(data.volume?.value          || 0) / DECIMALS,
      })
    } catch {}
  }, [address])

  useEffect(() => {
    fetchStats()
    const t = setInterval(fetchStats, 30_000)
    return () => clearInterval(t)
  }, [fetchStats])

  useEffect(() => { if (address) fetchUserStats() }, [address, fetchUserStats])

  const feePreview = recordAmount ? ((parseFloat(recordAmount) * stats.feeBps) / 10000).toFixed(4) : '0'

  const handleRecord = async () => {
    if (!address || !recordAmount || parseFloat(recordAmount) <= 0) return
    setLoading(true); setTxId(null)
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: FEE_ROUTER,
        functionName: 'record-bridge',
        functionArgs: [uintCV(Math.floor(parseFloat(recordAmount) * DECIMALS))],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (d) => {
          setTxId(d.txId); setRecordAmount(''); setLoading(false)
          setTimeout(() => { fetchStats(); fetchUserStats() }, 5000)
        },
        onCancel: () => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  const STAT_CARDS = [
    { label: 'VOLUME',   val: stats.loading ? '···' : `${stats.totalVolume >= 1000 ? `${(stats.totalVolume/1000).toFixed(1)}K` : stats.totalVolume.toFixed(0)}`, color: '#00d4ff' },
    { label: 'FEES',     val: stats.loading ? '···' : stats.totalFees.toFixed(2),                                                                                color: '#00ff9f' },
    { label: 'BRIDGES',  val: stats.loading ? '···' : String(stats.bridgeCount),                                                                                 color: '#ff00ff' },
    { label: 'FEE_RATE', val: `${(stats.feeBps / 100).toFixed(1)}%`,                                                                                             color: '#ffd700' },
  ]

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 8px #00d4ff', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#00d4ff' }}>FEE_ROUTER // B2S-FEE-ROUTER</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '2px' }}>CROSS-CHAIN_BRIDGE</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
            {(stats.feeBps / 100).toFixed(1)}% FEE → 50% TREASURY · 50% STAKERS
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {STAT_CARDS.map(s => (
            <div key={s.label} style={{ padding: '8px 12px', background: `${s.color}08`, border: `1px solid ${s.color}20`, borderRadius: '10px', textAlign: 'center', minWidth: '64px' }}>
              <div style={{ fontSize: '16px', fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '8px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chain badges */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {BRIDGE_CHAINS.map(c => (
          <div key={c.chain} style={{ padding: '6px 12px', background: `${c.color}10`, border: `1px solid ${c.color}30`, borderRadius: '20px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', color: c.color }}>
            {c.symbol}
          </div>
        ))}
        <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
          +20 CHAINS
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', width: 'fit-content', marginBottom: '20px' }}>
        {(['bridge', 'record', 'stats'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            ...MONO,
            padding: '7px 18px', borderRadius: '8px', fontSize: '10px',
            fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer', border: 'none',
            background: activeTab === tab ? 'rgba(0,212,255,0.12)' : 'transparent',
            color:      activeTab === tab ? '#00d4ff' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
          }}>
            // {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── TAB: BRIDGE ── */}
      {activeTab === 'bridge' && (
        <div>
          {/* Steps */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
            {[
              { n: '01', title: 'SELECT_SOURCE', desc: 'Choose chain + token',   color: '#00d4ff' },
              { n: '02', title: 'BRIDGE',        desc: 'Best route, 20+ bridges', color: '#ff00ff' },
              { n: '03', title: 'RECEIVE',       desc: 'USDCx or STX on Stacks', color: '#00ff9f' },
            ].map(s => (
              <div key={s.n} style={{ padding: '14px', background: `${s.color}06`, border: `1px solid ${s.color}18`, borderRadius: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.2em', color: s.color, marginBottom: '4px' }}>{s.n}</div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{s.title}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Bridge cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px', marginBottom: '14px' }}>
            {BRIDGE_LIST.map(b => (
              <a key={b.name} href={b.url} target="_blank" rel="noopener noreferrer" style={{
                display:        'block',
                textDecoration: 'none',
                padding:        '14px 16px',
                background:     `${b.color}06`,
                border:         `1px solid ${b.color}18`,
                borderLeft:     `3px solid ${b.color}`,
                borderRadius:   '12px',
                transition:     'all 0.2s',
                cursor:         'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${b.color}12`; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = `${b.color}06`; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ marginBottom: '4px' }}>
                      <span style={{ fontSize: '8px', letterSpacing: '0.15em', padding: '2px 7px', borderRadius: '10px', background: `${b.color}15`, border: `1px solid ${b.color}30`, color: b.color }}>
                        {b.tag}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{b.name}</div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', marginTop: '2px' }}>{b.routes} ROUTES</div>
                  </div>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.2)' }}>↗</span>
                </div>
              </a>
            ))}
          </div>

          <div style={{ padding: '10px 14px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderLeft: '3px solid rgba(0,212,255,0.5)', borderRadius: '8px', fontSize: '11px', color: 'rgba(0,212,255,0.6)' }}>
            {'>'} After bridging, go to <span style={{ color: '#00d4ff' }}>// RECORD</span> tab to log your TX and support the ecosystem.
          </div>
        </div>
      )}

      {/* ── TAB: RECORD ── */}
      {activeTab === 'record' && (
        <div style={{ maxWidth: '480px' }}>
          <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '4px' }}>RECORD_BRIDGE_TX</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px', lineHeight: 1.6 }}>
              Bridged via external protocol? Log it here.{' '}
              <span style={{ color: '#ffd700' }}>{(stats.feeBps / 100).toFixed(1)}%</span> fee split between treasury + stakers.
            </div>

            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="number"
                value={recordAmount}
                onChange={e => setRecordAmount(e.target.value)}
                placeholder="0.0"
                style={{
                  ...MONO,
                  width: '100%', padding: '12px 48px 12px 14px',
                  boxSizing: 'border-box', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', fontSize: '20px', fontWeight: 700, outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(0,212,255,0.4)'}
                onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>STX</span>
            </div>

            {recordAmount && parseFloat(recordAmount) > 0 && (
              <div style={{ marginBottom: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                {[
                  { label: 'BRIDGE_AMOUNT',  val: `${parseFloat(recordAmount).toFixed(4)} STX`,     color: 'rgba(255,255,255,0.5)' },
                  { label: `FEE_(${(stats.feeBps/100).toFixed(1)}%)`, val: `-${feePreview} STX`,    color: '#ffd700' },
                  { label: '→ 50%_TREASURY', val: `${(parseFloat(feePreview)/2).toFixed(4)} STX`,   color: 'rgba(255,255,255,0.3)' },
                  { label: '→ 50%_STAKERS',  val: `${(parseFloat(feePreview)/2).toFixed(4)} STX`,   color: '#00ff9f' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '9px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.25)' }}>{row.label}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {!isConnected ? (
              <div style={{ textAlign: 'center', padding: '14px', fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)' }}>
                CONNECT_WALLET_TO_RECORD
              </div>
            ) : (
              <button onClick={handleRecord} disabled={!recordAmount || parseFloat(recordAmount) <= 0 || loading} style={{
                ...MONO,
                width: '100%', padding: '13px', borderRadius: '12px',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.3)', color: '#00d4ff',
                opacity: (!recordAmount || parseFloat(recordAmount) <= 0) ? 0.4 : 1,
                transition: 'all 0.15s',
              }}>
                {loading ? '⏳ RECORDING...' : '▶ RECORD_BRIDGE_TX'}
              </button>
            )}

            {txId && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(0,255,159,0.06)', border: '1px solid rgba(0,255,159,0.2)', borderRadius: '10px' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#00ff9f', marginBottom: '4px' }}>✓ TX_RECORDED</div>
                <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: '9px', color: '#00d4ff', letterSpacing: '0.1em', textDecoration: 'none' }}>
                  VIEW_EXPLORER ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: STATS ── */}
      {activeTab === 'stats' && (
        <div style={{ maxWidth: '480px' }}>
          {!isConnected ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>🌉</div>
              <div style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)' }}>CONNECT_WALLET_TO_SEE_STATS</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                {[
                  { label: 'YOUR_BRIDGES', val: String(userStats.bridgeCount), color: '#00d4ff' },
                  { label: 'YOUR_VOLUME',  val: `${userStats.volume >= 1000 ? `${(userStats.volume/1000).toFixed(1)}K` : userStats.volume.toFixed(0)} STX`, color: '#00ff9f' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '16px', background: `${s.color}06`, border: `1px solid ${s.color}18`, borderRadius: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 700, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>
                  GLOBAL_STATS
                </div>
                {[
                  { label: 'TOTAL_BRIDGES',  val: String(stats.bridgeCount),                                       color: '' },
                  { label: 'TOTAL_VOLUME',   val: `${stats.totalVolume.toLocaleString()} STX`,                     color: '' },
                  { label: 'FEES_COLLECTED', val: `${stats.totalFees.toFixed(4)} STX`,                             color: '#00ff9f' },
                  { label: 'FEE_RATE',       val: `${(stats.feeBps / 100).toFixed(1)}%`,                           color: '#ffd700' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>{row.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: row.color || 'rgba(255,255,255,0.5)' }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <a href={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${FEE_ROUTER}?chain=mainnet`}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', marginTop: '10px', fontSize: '10px', letterSpacing: '0.2em', color: '#00d4ff', textDecoration: 'none' }}>
                VIEW_CONTRACT_EXPLORER ↗
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}