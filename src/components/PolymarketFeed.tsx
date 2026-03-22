'use client'

import { useState, useEffect, useCallback } from 'react'

const MONO       = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }
const GAMMA_API  = 'https://gamma-api.polymarket.com'
const CLOB_API   = 'https://clob.polymarket.com'

interface Market {
  condition_id:  string
  question:      string
  slug:          string
  volume:        number
  liquidity:     number
  end_date_iso:  string
  active:        boolean
  category:      string
  tokens: { outcome: string; price: number; token_id: string }[]
}

const CAT_COLOR: Record<string, string> = {
  crypto:     '#f7931a',
  politics:   '#ff00ff',
  sports:     '#00d4ff',
  economics:  '#00ff9f',
  science:    '#9945ff',
  technology: '#00d4ff',
  default:    '#ffd700',
}

export default function PolymarketFeed({ apiKey }: { apiKey?: string }) {
  const [markets,   setMarkets]   = useState<Market[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [sortBy,    setSortBy]    = useState<'volume' | 'liquidity' | 'ending'>('volume')
  const [page,      setPage]      = useState(0)
  const [selected,  setSelected]  = useState<Market | null>(null)
  const [tradeTab,  setTradeTab]  = useState<'yes' | 'no'>('yes')
  const [tradeAmt,  setTradeAmt]  = useState('')
  const [txStatus,  setTxStatus]  = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txMsg,     setTxMsg]     = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const PER_PAGE = 20

  const fetchMarkets = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = new URLSearchParams({
        limit:     '100',
        active:    'true',
        closed:    'false',
        order:     sortBy === 'ending' ? 'end_date_iso' : sortBy,
        ascending: sortBy === 'ending' ? 'true' : 'false',
      })

      const res  = await fetch(`${GAMMA_API}/markets?${params}`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const data = await res.json()
      const list: Market[] = Array.isArray(data) ? data : data.markets || []

      // Extract unique categories
      const cats = Array.from(new Set(list.map(m => m.category?.toLowerCase()).filter(Boolean))) as string[]
      setCategories(cats)
      setMarkets(list)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sortBy])

  useEffect(() => { fetchMarkets() }, [fetchMarkets])

  const filtered = markets
    .filter(m => filter === 'all' || m.category?.toLowerCase() === filter)
    .filter(m => !search || m.question?.toLowerCase().includes(search.toLowerCase()))

  const pages     = Math.ceil(filtered.length / PER_PAGE)
  const displayed = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE)

  const formatVol = (v: number) => {
    if (!v) return '—'
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
    if (v >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
    return `$${v.toFixed(0)}`
  }

  const formatDate = (iso: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const diff = Math.ceil((d.getTime() - Date.now()) / 86400000)
    if (diff < 0)  return 'EXPIRED'
    if (diff === 0) return 'TODAY'
    if (diff === 1) return '1D LEFT'
    if (diff < 30)  return `${diff}D LEFT`
    return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }

  const placeOrder = async () => {
    if (!selected || !tradeAmt || !apiKey) return
    setTxStatus('pending'); setTxMsg('')
    try {
      const token   = tradeTab === 'yes' ? selected.tokens[0] : selected.tokens[1]
      const price   = token?.price || 0.5
      const size    = parseFloat(tradeAmt)

      const res = await fetch(`${CLOB_API}/order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'POLY-API-KEY': apiKey },
        body: JSON.stringify({
          order: {
            salt:          Date.now(),
            tokenId:       token?.token_id,
            makerAmount:   String(Math.floor(size * 1e6)),
            takerAmount:   String(Math.floor(size * price * 1e6)),
            expiration:    '0',
            nonce:         '0',
            feeRateBps:    '0',
            side:          'BUY',
            signatureType: 0,
            signature:     '0x',
          },
          orderType: 'FOK',
        }),
      })
      const data = await res.json()
      if (data.errorMsg) throw new Error(data.errorMsg)
      setTxStatus('success')
      setTxMsg(`ORDER_PLACED // ${data.orderId || data.transactionHash || 'pending'}`)
      setTradeAmt('')
    } catch (e: any) {
      setTxStatus('error')
      setTxMsg(e.message || 'ORDER_FAILED')
    }
  }

  const totalStats = {
    markets:   filtered.length,
    volume:    filtered.reduce((a, m) => a + (m.volume || 0), 0),
    liquidity: filtered.reduce((a, m) => a + (m.liquidity || 0), 0),
  }

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#00ff9f', boxShadow: '0 0 8px #00ff9f', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#00ff9f' }}>POLYMARKET // ALL_MARKETS</span>
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
            {totalStats.markets} MARKETS · VOL {formatVol(totalStats.volume)} · LIQ {formatVol(totalStats.liquidity)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={fetchMarkets} style={{ ...MONO, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '13px' }}>⟳</button>
          <a href="https://polymarket.com" target="_blank" rel="noopener noreferrer" style={{ ...MONO, padding: '6px 12px', background: 'rgba(0,255,159,0.08)', border: '1px solid rgba(0,255,159,0.2)', borderRadius: '8px', color: '#00ff9f', fontSize: '9px', letterSpacing: '0.1em', textDecoration: 'none' }}>
            POLYMARKET.COM ↗
          </a>
        </div>
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => { setSearch(e.target.value); setPage(0) }}
        placeholder="SEARCH_MARKETS..."
        style={{ ...MONO, width: '100%', padding: '10px 14px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', outline: 'none', marginBottom: '12px' }}
        onFocus={e => e.target.style.borderColor = 'rgba(0,255,159,0.4)'}
        onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {['all', ...categories].map(cat => {
            const color  = CAT_COLOR[cat] || CAT_COLOR.default
            const active = filter === cat
            return (
              <button key={cat} onClick={() => { setFilter(cat); setPage(0) }} style={{
                ...MONO,
                padding: '4px 12px', borderRadius: '20px', fontSize: '9px',
                fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
                border:      active ? `1px solid ${color}50` : '1px solid rgba(255,255,255,0.07)',
                background:  active ? `${color}12` : 'rgba(255,255,255,0.02)',
                color:       active ? color : 'rgba(255,255,255,0.35)',
                transition:  'all 0.15s',
              }}>
                {cat.toUpperCase()}
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
          {(['volume', 'liquidity', 'ending'] as const).map(s => (
            <button key={s} onClick={() => { setSortBy(s); setPage(0) }} style={{
              ...MONO,
              padding: '6px 12px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
              cursor: 'pointer', border: 'none',
              background: sortBy === s ? 'rgba(0,255,159,0.12)' : 'transparent',
              color:      sortBy === s ? '#00ff9f' : 'rgba(255,255,255,0.3)',
            }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '10px', fontSize: '11px', color: '#ff4444', marginBottom: '12px' }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ height: '72px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      )}

      {/* Market list */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {displayed.map(market => {
            const yes       = market.tokens?.[0]
            const no        = market.tokens?.[1]
            const yesPct    = Math.round((yes?.price || 0.5) * 100)
            const noPct     = 100 - yesPct
            const color     = CAT_COLOR[market.category?.toLowerCase()] || CAT_COLOR.default
            const isOpen    = selected?.condition_id === market.condition_id
            const daysLeft  = formatDate(market.end_date_iso)
            const isExpiring = daysLeft.includes('D LEFT') && parseInt(daysLeft) <= 7

            return (
              <div key={market.condition_id} style={{
                background:   isOpen ? `${color}06` : 'rgba(255,255,255,0.02)',
                border:       `1px solid ${isOpen ? color + '30' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '12px',
                overflow:     'hidden',
                transition:   'all 0.15s',
              }}>

                {/* Row */}
                <div
                  style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
                  onClick={() => { setSelected(isOpen ? null : market); setTxStatus('idle'); setTradeAmt('') }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.parentElement!.style.borderColor = `${color}25` }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.parentElement!.style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  {/* YES % */}
                  <div style={{ width: '40px', textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#00ff9f', lineHeight: 1 }}>{yesPct}%</div>
                    <div style={{ fontSize: '7px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>YES</div>
                  </div>

                  {/* Question + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', marginBottom: '4px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as any}>
                      {market.question}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '8px', letterSpacing: '0.08em', padding: '1px 6px', borderRadius: '8px', background: `${color}10`, border: `1px solid ${color}20`, color }}>
                        {market.category?.toUpperCase() || 'MISC'}
                      </span>
                      <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.25)' }}>VOL {formatVol(market.volume)}</span>
                      <span style={{ fontSize: '8px', color: isExpiring ? '#ff4444' : 'rgba(255,255,255,0.2)' }}>{daysLeft}</span>
                    </div>
                  </div>

                  {/* Mini bar */}
                  <div style={{ width: '60px', flexShrink: 0 }}>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', height: '100%' }}>
                        <div style={{ width: `${yesPct}%`, background: '#00ff9f' }} />
                        <div style={{ width: `${noPct}%`,  background: '#ff4444' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ fontSize: '7px', color: '#00ff9f' }}>{yesPct}</span>
                      <span style={{ fontSize: '7px', color: '#ff4444' }}>{noPct}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>↓</div>
                </div>

                {/* Expanded trade panel */}
                {isOpen && (
                  <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>

                    {/* Full odds */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '12px 0', marginBottom: '8px' }}>
                      <div style={{ padding: '10px', background: 'rgba(0,255,159,0.06)', border: '1px solid rgba(0,255,159,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#00ff9f' }}>{yesPct}¢</div>
                        <div style={{ fontSize: '8px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>YES PRICE</div>
                      </div>
                      <div style={{ padding: '10px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#ff4444' }}>{noPct}¢</div>
                        <div style={{ fontSize: '8px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>NO PRICE</div>
                      </div>
                    </div>

                    {/* Trade tabs */}
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                      {(['yes', 'no'] as const).map(t => (
                        <button key={t} onClick={() => setTradeTab(t)} style={{
                          ...MONO,
                          flex: 1, padding: '8px', borderRadius: '8px', fontSize: '10px',
                          fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', border: 'none',
                          background: tradeTab === t ? (t === 'yes' ? 'rgba(0,255,159,0.15)' : 'rgba(255,68,68,0.15)') : 'rgba(255,255,255,0.03)',
                          outline:    tradeTab === t ? `1px solid ${t === 'yes' ? 'rgba(0,255,159,0.4)' : 'rgba(255,68,68,0.4)'}` : '1px solid rgba(255,255,255,0.07)',
                          color:      tradeTab === t ? (t === 'yes' ? '#00ff9f' : '#ff4444') : 'rgba(255,255,255,0.3)',
                        }}>
                          BUY {t.toUpperCase()} · {t === 'yes' ? yesPct : noPct}¢
                        </button>
                      ))}
                    </div>

                    {/* Amount */}
                    <div style={{ position: 'relative', marginBottom: '6px' }}>
                      <input
                        type="number"
                        placeholder="AMOUNT (USDC)..."
                        value={tradeAmt}
                        onChange={e => setTradeAmt(e.target.value)}
                        style={{ ...MONO, width: '100%', padding: '9px 50px 9px 12px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = 'rgba(0,255,159,0.4)'}
                        onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                      <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '9px', color: 'rgba(255,255,255,0.25)' }}>USDC</span>
                    </div>

                    {/* Quick amounts */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                      {[10, 25, 50, 100].map(amt => (
                        <button key={amt} onClick={() => setTradeAmt(String(amt))} style={{
                          ...MONO,
                          flex: 1, padding: '4px', borderRadius: '6px', fontSize: '9px',
                          fontWeight: 700, cursor: 'pointer',
                          border:     tradeAmt === String(amt) ? '1px solid rgba(0,255,159,0.4)' : '1px solid rgba(255,255,255,0.07)',
                          background: tradeAmt === String(amt) ? 'rgba(0,255,159,0.1)' : 'rgba(255,255,255,0.02)',
                          color:      tradeAmt === String(amt) ? '#00ff9f' : 'rgba(255,255,255,0.3)',
                        }}>
                          ${amt}
                        </button>
                      ))}
                    </div>

                    {/* Estimated shares */}
                    {tradeAmt && parseFloat(tradeAmt) > 0 && (
                      <div style={{ marginBottom: '8px', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: '7px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                        ≈ <span style={{ color: tradeTab === 'yes' ? '#00ff9f' : '#ff4444', fontWeight: 700 }}>
                          {(parseFloat(tradeAmt) / ((tradeTab === 'yes' ? yesPct : noPct) / 100)).toFixed(2)} shares
                        </span>
                        {' '}· potential payout: <span style={{ color: '#ffd700' }}>${parseFloat(tradeAmt || '0') > 0 ? (parseFloat(tradeAmt) / ((tradeTab === 'yes' ? yesPct : noPct) / 100)).toFixed(2) : '0'}</span>
                      </div>
                    )}

                    {/* Buy button */}
                    {apiKey ? (
                      <button
                        onClick={placeOrder}
                        disabled={!tradeAmt || parseFloat(tradeAmt) <= 0 || txStatus === 'pending'}
                        style={{
                          ...MONO,
                          width: '100%', padding: '11px', borderRadius: '10px',
                          fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer',
                          background: tradeTab === 'yes' ? 'rgba(0,255,159,0.12)' : 'rgba(255,68,68,0.12)',
                          border:     tradeTab === 'yes' ? '1px solid rgba(0,255,159,0.35)' : '1px solid rgba(255,68,68,0.35)',
                          color:      tradeTab === 'yes' ? '#00ff9f' : '#ff4444',
                          opacity:    (!tradeAmt || txStatus === 'pending') ? 0.4 : 1,
                          transition: 'all 0.15s',
                          marginBottom: '6px',
                        }}
                      >
                        {txStatus === 'pending' ? '⏳ PLACING_ORDER...' : `▶ BUY_${tradeTab.toUpperCase()} $${tradeAmt || '0'} USDC`}
                      </button>
                    ) : (
                      <div style={{ padding: '10px', textAlign: 'center', fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', marginBottom: '6px' }}>
                        SET_POLYMARKET_API_KEY_TO_TRADE
                      </div>
                    )}

                    {/* TX status */}
                    {txStatus !== 'idle' && txMsg && (
                      <div style={{ padding: '7px 10px', background: txStatus === 'success' ? 'rgba(0,255,159,0.06)' : 'rgba(255,68,68,0.06)', border: `1px solid ${txStatus === 'success' ? 'rgba(0,255,159,0.2)' : 'rgba(255,68,68,0.2)'}`, borderRadius: '7px', fontSize: '9px', color: txStatus === 'success' ? '#00ff9f' : '#ff4444', letterSpacing: '0.08em', marginBottom: '6px' }}>
                        {txStatus === 'success' ? '✓' : '✗'} {txMsg}
                      </div>
                    )}

                    <a href={`https://polymarket.com/event/${market.slug}`} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'block', textAlign: 'center', fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>
                      VIEW_ON_POLYMARKET ↗
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '14px' }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ ...MONO, padding: '7px 14px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', opacity: page === 0 ? 0.3 : 1 }}>← PREV</button>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.1em' }}>{page + 1} / {pages} · {filtered.length} MARKETS</span>
          <button onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} style={{ ...MONO, padding: '7px 14px', borderRadius: '8px', fontSize: '10px', fontWeight: 700, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', opacity: page === pages - 1 ? 0.3 : 1 }}>NEXT →</button>
        </div>
      )}

      <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(0,255,159,0.03)', border: '1px solid rgba(0,255,159,0.1)', borderLeft: '3px solid rgba(0,255,159,0.4)', borderRadius: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
        <span style={{ color: '#00ff9f' }}>POLYMARKET</span> — Real money prediction markets on Polygon · USDC collateral · Non-custodial
      </div>
    </div>
  )
}