'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import {
  callReadOnlyFunction, cvToJSON, uintCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
// ✅ v6 — fonctions réelles : get-reserves, add-b2s-stx, swap-b2s-for-stx, swap-stx-for-b2s
const POOL_CONTRACT    = 'b2s-liquidity-pool-v6'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

type SwapDir = 'b2s-to-stx' | 'stx-to-b2s'

interface PoolReserves {
  reserveB2S: number
  reserveSTX: number
  loading:    boolean
}

export default function LiquidityPool() {
  const { address, isConnected } = useWallet()
  const [activeTab,    setActiveTab]    = useState<'swap' | 'liquidity'>('swap')
  const [swapDir,      setSwapDir]      = useState<SwapDir>('stx-to-b2s')
  const [inputAmount,  setInputAmount]  = useState('')
  const [outputAmount, setOutputAmount] = useState('0')
  const [slippage,     setSlippage]     = useState(1)
  const [loading,      setLoading]      = useState(false)
  const [txId,         setTxId]         = useState<string | null>(null)
  const [txType,       setTxType]       = useState('')
  const [b2sAmount,    setB2sAmount]    = useState('')
  const [stxAmount,    setStxAmount]    = useState('')
  const [flipping,     setFlipping]     = useState(false)

  const [pool, setPool] = useState<PoolReserves>({
    reserveB2S: 0, reserveSTX: 0, loading: true,
  })

  // ─── Fetch reserves via get-reserves ──────────────────────────────────────
  // get-reserves retourne (ok { b2s-stx-b: uint, b2s-stx-s: uint })
  const fetchPool = useCallback(async () => {
    try {
      const sender = address || CONTRACT_ADDRESS
      const res = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    POOL_CONTRACT,
        functionName:    'get-reserves',
        functionArgs:    [],
        senderAddress:   sender,
      })
      const data = cvToJSON(res)
      // get-reserves retourne (ok { b2s-stx-b, b2s-stx-s })
      const inner = data?.value?.value ?? data?.value ?? {}
      setPool({
        reserveB2S: Number(inner['b2s-stx-b']?.value ?? 0) / 1_000_000,
        reserveSTX: Number(inner['b2s-stx-s']?.value ?? 0) / 1_000_000,
        loading:    false,
      })
    } catch (e) {
      console.error('fetchPool:', e)
      setPool(p => ({ ...p, loading: false }))
    }
  }, [address])

  useEffect(() => {
    fetchPool()
    const t = setInterval(fetchPool, 30_000)
    return () => clearInterval(t)
  }, [fetchPool])

  // ─── AMM price calc (constant product) ───────────────────────────────────
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0 || pool.loading) {
      setOutputAmount('0'); return
    }
    const input   = parseFloat(inputAmount)
    const FEE_NUM = 9975; const FEE_DENOM = 10000
    const [rIn, rOut] = swapDir === 'stx-to-b2s'
      ? [pool.reserveSTX, pool.reserveB2S]
      : [pool.reserveB2S, pool.reserveSTX]

    const f   = input * FEE_NUM
    const out = (f * rOut) / (rIn * FEE_DENOM + f)
    setOutputAmount(rIn > 0 && rOut > 0 ? out.toFixed(6) : '0')
  }, [inputAmount, swapDir, pool])

  const handleFlip = () => {
    setFlipping(true)
    setTimeout(() => setFlipping(false), 400)
    setSwapDir(d => d === 'stx-to-b2s' ? 'b2s-to-stx' : 'stx-to-b2s')
    setInputAmount(''); setOutputAmount('0')
  }

  // ─── Swap ─────────────────────────────────────────────────────────────────
  // v6 fonctions : swap-stx-for-b2s(in, min-out) / swap-b2s-for-stx(in, min-out)
  const handleSwap = async () => {
    if (!address || !inputAmount || parseFloat(inputAmount) <= 0) return
    setLoading(true); setTxId(null); setTxType('SWAP')
    try {
      const microIn  = Math.floor(parseFloat(inputAmount)  * 1_000_000)
      const minOut   = Math.floor(parseFloat(outputAmount) * (1 - slippage / 100) * 1_000_000)
      const fnName   = swapDir === 'stx-to-b2s' ? 'swap-stx-for-b2s' : 'swap-b2s-for-stx'
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT,
        functionName: fnName,
        functionArgs: [uintCV(microIn), uintCV(minOut)],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId); setInputAmount(''); setOutputAmount('0'); setLoading(false)
          setTimeout(fetchPool, 5000)
        },
        onCancel: () => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  // ─── Add liquidity ────────────────────────────────────────────────────────
  // v6 fonction : add-b2s-stx(b uint, s uint)
  const handleAddLiquidity = async () => {
    if (!address || !b2sAmount || !stxAmount) return
    setLoading(true); setTxType('ADD_LIQUIDITY')
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT,
        functionName: 'add-b2s-stx',
        functionArgs: [
          uintCV(Math.floor(parseFloat(b2sAmount) * 1_000_000)),
          uintCV(Math.floor(parseFloat(stxAmount)  * 1_000_000)),
        ],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId); setB2sAmount(''); setStxAmount('')
          setLoading(false); setTimeout(fetchPool, 5000)
        },
        onCancel: () => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  const fromLabel  = swapDir === 'stx-to-b2s' ? 'STX'  : '$B2S'
  const toLabel    = swapDir === 'stx-to-b2s' ? '$B2S' : 'STX'
  const fromColor  = swapDir === 'stx-to-b2s' ? '#5546ff' : '#00ff9f'
  const toColor    = swapDir === 'stx-to-b2s' ? '#00ff9f' : '#5546ff'
  const priceImpact = inputAmount && parseFloat(inputAmount) > 0 && pool.reserveSTX > 0
    ? Math.min((parseFloat(inputAmount) / pool.reserveSTX) * 100, 99).toFixed(2) : '0.00'

  if (!isConnected) return (
    <div style={{ ...MONO, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>💧</div>
      <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)' }}>CONNECT_WALLET_TO_ACCESS_AMM</div>
    </div>
  )

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Pool stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'RESERVE_B2S', value: pool.reserveB2S, color: '#00ff9f' },
          { label: 'RESERVE_STX', value: pool.reserveSTX, color: '#5546ff' },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px 16px', background: `${s.color}06`, border: `1px solid ${s.color}18`, borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>
              {pool.loading ? '···' : s.value >= 1000 ? `${(s.value / 1000).toFixed(1)}K` : s.value.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', width: 'fit-content', marginBottom: '20px' }}>
        {(['swap', 'liquidity'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            ...MONO, padding: '8px 20px', borderRadius: '8px', fontSize: '10px',
            fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer', border: 'none',
            background: activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent',
            color:      activeTab === tab ? '#fff' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
          }}>
            {tab === 'swap' ? '⇄ SWAP' : '💧 LIQUIDITY'}
          </button>
        ))}
      </div>

      {/* ── SWAP TAB ── */}
      {activeTab === 'swap' && (
        <div style={{ maxWidth: '480px' }}>

          {/* Slippage */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>SLIPPAGE_TOLERANCE</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSlippage(s)} style={{
                  ...MONO, padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                  border:     slippage === s ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background: slippage === s ? 'rgba(0,212,255,0.1)'          : 'rgba(255,255,255,0.03)',
                  color:      slippage === s ? '#00d4ff'                       : 'rgba(255,255,255,0.3)',
                }}>
                  {s}%
                </button>
              ))}
            </div>
          </div>

          {/* Swap box */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
            {/* Input */}
            <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>SELLING</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="number" value={inputAmount} onChange={e => setInputAmount(e.target.value)} placeholder="0.0"
                  style={{ ...MONO, flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '28px', fontWeight: 700 }} />
                <div style={{ padding: '8px 14px', background: `${fromColor}12`, border: `1px solid ${fromColor}30`, borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: fromColor, flexShrink: 0 }}>
                  {fromLabel}
                </div>
              </div>
            </div>

            {/* Flip */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <button onClick={handleFlip} style={{
                ...MONO, width: '32px', height: '32px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '16px',
                transform: flipping ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.4s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>⇅</button>
            </div>

            {/* Output */}
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>BUYING</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ ...MONO, flex: 1, fontSize: '28px', fontWeight: 700, color: parseFloat(outputAmount) > 0 ? toColor : 'rgba(255,255,255,0.15)' }}>
                  {parseFloat(outputAmount) > 0 ? outputAmount : '0.0'}
                </div>
                <div style={{ padding: '8px 14px', background: `${toColor}12`, border: `1px solid ${toColor}30`, borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: toColor, flexShrink: 0 }}>
                  {toLabel}
                </div>
              </div>
            </div>
          </div>

          {/* Swap details */}
          {inputAmount && parseFloat(inputAmount) > 0 && (
            <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
              {[
                { label: 'FEE_(0.25%)',  value: `${(parseFloat(inputAmount) * 0.0025).toFixed(6)} ${fromLabel}`, color: 'rgba(255,255,255,0.4)' },
                { label: 'MIN_RECEIVED', value: `${(parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6)} ${toLabel}`, color: 'rgba(255,255,255,0.4)' },
                { label: 'PRICE_IMPACT', value: `~${priceImpact}%`, color: parseFloat(priceImpact) > 5 ? '#ff4444' : '#00ff9f' },
                { label: 'SLIPPAGE',     value: `${slippage}%`, color: '#ffd700' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>{row.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          <button onClick={handleSwap} disabled={!inputAmount || parseFloat(inputAmount) <= 0 || loading || pool.loading} style={{
            ...MONO, width: '100%', marginTop: '12px', padding: '14px', borderRadius: '12px',
            fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${fromColor}20, ${toColor}20)`,
            border: `1px solid ${loading ? 'rgba(255,255,255,0.08)' : fromColor + '40'}`,
            color:  loading ? 'rgba(255,255,255,0.3)' : fromColor,
            opacity: (!inputAmount || parseFloat(inputAmount) <= 0) ? 0.4 : 1, transition: 'all 0.2s',
          }}>
            {loading ? '⏳ SWAPPING...' : `⇄ SWAP ${fromLabel} → ${toLabel}`}
          </button>

          {txId && (
            <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(0,255,159,0.06)', border: '1px solid rgba(0,255,159,0.2)', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#00ff9f', letterSpacing: '0.15em', marginBottom: '4px' }}>✓ {txType}_SUBMITTED</div>
              <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '9px', color: '#00d4ff', letterSpacing: '0.1em', textDecoration: 'none' }}>
                VIEW_ON_EXPLORER ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── LIQUIDITY TAB ── */}
      {activeTab === 'liquidity' && (
        <div style={{ maxWidth: '480px' }}>

          <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '14px' }}>ADD_LIQUIDITY // B2S + STX</div>

            {[
              { label: '$B2S_AMOUNT', value: b2sAmount, setter: setB2sAmount, color: '#00ff9f' },
              { label: 'STX_AMOUNT',  value: stxAmount, setter: setStxAmount, color: '#5546ff' },
            ].map(field => (
              <div key={field.label} style={{ marginBottom: '10px', padding: '14px', background: `${field.color}06`, border: `1px solid ${field.color}18`, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input type="number" value={field.value} onChange={e => field.setter(e.target.value)} placeholder="0.0"
                  style={{ ...MONO, flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '22px', fontWeight: 700 }} />
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: field.color, padding: '6px 12px', background: `${field.color}12`, border: `1px solid ${field.color}30`, borderRadius: '8px' }}>
                  {field.label.replace('_AMOUNT', '')}
                </div>
              </div>
            ))}

            <button onClick={handleAddLiquidity} disabled={!b2sAmount || !stxAmount || loading} style={{
              ...MONO, width: '100%', padding: '14px', borderRadius: '12px',
              fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(0,255,159,0.1)',
              border: '1px solid rgba(0,255,159,0.3)', color: '#00ff9f',
              opacity: (!b2sAmount || !stxAmount) ? 0.4 : 1, transition: 'all 0.2s',
            }}>
              {loading ? '⏳ PROCESSING...' : '💧 ADD_LIQUIDITY'}
            </button>
          </div>

          {txId && (
            <div style={{ padding: '12px 16px', background: 'rgba(0,255,159,0.06)', border: '1px solid rgba(0,255,159,0.2)', borderRadius: '12px' }}>
              <div style={{ fontSize: '10px', color: '#00ff9f', letterSpacing: '0.15em', marginBottom: '4px' }}>✓ {txType}_SUBMITTED</div>
              <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: '9px', color: '#00d4ff', letterSpacing: '0.1em', textDecoration: 'none' }}>
                VIEW_ON_EXPLORER ↗
              </a>
            </div>
          )}

          <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderLeft: '3px solid rgba(0,212,255,0.5)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
            <span style={{ color: '#00d4ff' }}>AMM_INFO</span> — Formule x×y=k. Fee 0.25%. Pool B2S/STX uniquement sur v6.
          </div>
        </div>
      )}
    </div>
  )
}