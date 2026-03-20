'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import {
  callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV,
  PostConditionMode, AnchorMode, contractPrincipalCV,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const POOL_CONTRACT    = 'b2s-liquidity-pool-v5'
const USDCX_ADDRESS    = 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE'
const USDCX_CONTRACT   = 'tokensoft-token'
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

type SwapPair = 'b2s-stx' | 'b2s-usdcx' | 'stx-usdcx'
type SwapDir  = 'forward' | 'reverse'

const PAIRS: Record<SwapPair, { tokenA: string; tokenB: string; colorA: string; colorB: string }> = {
  'b2s-stx':   { tokenA: '$B2S', tokenB: 'STX',   colorA: '#00ff9f', colorB: '#5546ff' },
  'b2s-usdcx': { tokenA: '$B2S', tokenB: 'USDCx', colorA: '#00ff9f', colorB: '#00d4ff' },
  'stx-usdcx': { tokenA: 'STX',  tokenB: 'USDCx', colorA: '#5546ff', colorB: '#00d4ff' },
}

interface PoolReserves {
  reserveB2S:    number
  reserveSTX:    number
  reserveUSDCx:  number
  totalLPSupply: number
  loading:       boolean
}

export default function LiquidityPool() {
  const { address, isConnected } = useWallet()
  const [activeTab,   setActiveTab]   = useState<'swap' | 'liquidity'>('swap')
  const [activePair,  setActivePair]  = useState<SwapPair>('b2s-stx')
  const [swapDir,     setSwapDir]     = useState<SwapDir>('forward')
  const [inputAmount, setInputAmount] = useState('')
  const [outputAmount,setOutputAmount]= useState('0')
  const [slippage,    setSlippage]    = useState(1)
  const [loading,     setLoading]     = useState(false)
  const [txId,        setTxId]        = useState<string | null>(null)
  const [txType,      setTxType]      = useState('')
  const [b2sAmount,   setB2sAmount]   = useState('')
  const [stxAmount,   setStxAmount]   = useState('')
  const [userLP,      setUserLP]      = useState(0)
  const [flipping,    setFlipping]    = useState(false)

  const [pool, setPool] = useState<PoolReserves>({
    reserveB2S: 0, reserveSTX: 0, reserveUSDCx: 0, totalLPSupply: 0, loading: true,
  })

  const fetchPool = useCallback(async () => {
    try {
      const sender = address || CONTRACT_ADDRESS
      const [b2sRes, stxRes, lpRes] = await Promise.all([
        callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-reserve-b2s',     functionArgs: [], senderAddress: sender }),
        callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-reserve-stx',     functionArgs: [], senderAddress: sender }),
        callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-total-lp-supply', functionArgs: [], senderAddress: sender }),
      ])
      let usdcx = 0
      try {
        const u = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-reserve-usdcx', functionArgs: [], senderAddress: sender })
        usdcx = Number(cvToJSON(u).value) / 1_000_000
      } catch {}
      setPool({
        reserveB2S:    Number(cvToJSON(b2sRes).value) / 1_000_000,
        reserveSTX:    Number(cvToJSON(stxRes).value) / 1_000_000,
        reserveUSDCx:  usdcx,
        totalLPSupply: Number(cvToJSON(lpRes).value) / 1_000_000,
        loading: false,
      })
    } catch { setPool(p => ({ ...p, loading: false })) }
  }, [address])

  const fetchUserLP = useCallback(async () => {
    if (!address) return
    try {
      const r = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-lp-balance', functionArgs: [standardPrincipalCV(address)], senderAddress: address })
      setUserLP(Number(cvToJSON(r).value) / 1_000_000)
    } catch {}
  }, [address])

  useEffect(() => { fetchPool(); const t = setInterval(fetchPool, 30_000); return () => clearInterval(t) }, [fetchPool])
  useEffect(() => { if (address) fetchUserLP() }, [address, fetchUserLP])

  // AMM price calc
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0 || pool.loading) { setOutputAmount('0'); return }
    const input = parseFloat(inputAmount)
    const FEE = 9975; const DENOM = 10000
    const getRes = (): [number, number] => {
      if (activePair === 'b2s-stx')   return swapDir === 'forward' ? [pool.reserveB2S, pool.reserveSTX]   : [pool.reserveSTX,   pool.reserveB2S]
      if (activePair === 'b2s-usdcx') return swapDir === 'forward' ? [pool.reserveB2S, pool.reserveUSDCx] : [pool.reserveUSDCx, pool.reserveB2S]
      return swapDir === 'forward' ? [pool.reserveSTX, pool.reserveUSDCx] : [pool.reserveUSDCx, pool.reserveSTX]
    }
    const [rIn, rOut] = getRes()
    const num = input * FEE * rOut
    const den = rIn * DENOM + input * FEE
    setOutputAmount(den > 0 ? (num / den).toFixed(6) : '0')
  }, [inputAmount, activePair, swapDir, pool])

  const getTokenLabels = () => {
    const pair = PAIRS[activePair]
    return swapDir === 'forward'
      ? { from: pair.tokenA, to: pair.tokenB, colorFrom: pair.colorA, colorTo: pair.colorB }
      : { from: pair.tokenB, to: pair.tokenA, colorFrom: pair.colorB, colorTo: pair.colorA }
  }

  const getFunctionName = (): string => {
    const map: Record<string, Record<SwapDir, string>> = {
      'b2s-stx':   { forward: 'swap-b2s-for-stx',   reverse: 'swap-stx-for-b2s'   },
      'b2s-usdcx': { forward: 'swap-b2s-for-usdcx', reverse: 'swap-usdcx-for-b2s' },
      'stx-usdcx': { forward: 'swap-stx-for-usdcx', reverse: 'swap-usdcx-for-stx' },
    }
    return map[activePair][swapDir]
  }

  const handleSwap = async () => {
    if (!address || !inputAmount || parseFloat(inputAmount) <= 0) return
    setLoading(true); setTxId(null); setTxType('SWAP')
    try {
      const microIn  = Math.floor(parseFloat(inputAmount)  * 1_000_000)
      const minOut   = Math.floor(parseFloat(outputAmount) * (1 - slippage / 100) * 1_000_000)
      const baseArgs = [uintCV(microIn), uintCV(minOut)]
      const functionArgs = activePair.includes('usdcx')
        ? [...baseArgs, contractPrincipalCV(USDCX_ADDRESS, USDCX_CONTRACT)]
        : baseArgs
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT,
        functionName: getFunctionName(), functionArgs,
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setInputAmount(''); setOutputAmount('0'); setLoading(false); setTimeout(fetchPool, 5000) },
        onCancel:  () => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  const handleAddLiquidity = async () => {
    if (!address || !b2sAmount || !stxAmount) return
    setLoading(true); setTxType('ADD_LIQUIDITY')
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT,
        functionName: 'add-liquidity',
        functionArgs: [uintCV(Math.floor(parseFloat(b2sAmount) * 1_000_000)), uintCV(Math.floor(parseFloat(stxAmount) * 1_000_000)), uintCV(0)],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setB2sAmount(''); setStxAmount(''); setLoading(false); setTimeout(() => { fetchPool(); fetchUserLP() }, 5000) },
        onCancel:  () => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  const handleFlip = () => {
    setFlipping(true)
    setTimeout(() => setFlipping(false), 400)
    setSwapDir(d => d === 'forward' ? 'reverse' : 'forward')
    setInputAmount(''); setOutputAmount('0')
  }

  const { from, to, colorFrom, colorTo } = getTokenLabels()
  const poolShare   = pool.totalLPSupply > 0 ? ((userLP / pool.totalLPSupply) * 100).toFixed(2) : '0.00'
  const priceImpact = inputAmount && parseFloat(inputAmount) > 0
    ? Math.min((parseFloat(inputAmount) / (pool.reserveB2S || 1)) * 100, 99).toFixed(2) : '0.00'

  const STATS = [
    { label: 'RESERVE_B2S',  value: pool.reserveB2S,    color: '#00ff9f' },
    { label: 'RESERVE_STX',  value: pool.reserveSTX,    color: '#5546ff' },
    { label: 'RESERVE_USDCX',value: pool.reserveUSDCx,  color: '#00d4ff' },
    { label: 'LP_SUPPLY',    value: pool.totalLPSupply, color: '#ff00ff' },
  ]

  if (!isConnected) return (
    <div style={{ ...MONO, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '40px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>💧</div>
      <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)' }}>CONNECT_WALLET_TO_ACCESS_AMM</div>
    </div>
  )

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Pool stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {STATS.map(s => (
          <div key={s.label} style={{ padding: '14px 16px', background: `${s.color}06`, border: `1px solid ${s.color}18`, borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: s.color }}>
              {pool.loading ? '···' : s.value >= 1000 ? `${(s.value / 1000).toFixed(1)}K` : s.value.toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', width: 'fit-content', marginBottom: '20px' }}>
        {(['swap', 'liquidity'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            ...MONO,
            padding:       '8px 20px',
            borderRadius:  '8px',
            fontSize:      '10px',
            fontWeight:    700,
            letterSpacing: '0.15em',
            cursor:        'pointer',
            border:        'none',
            background:    activeTab === tab ? 'rgba(255,255,255,0.08)' : 'transparent',
            color:         activeTab === tab ? '#fff' : 'rgba(255,255,255,0.3)',
            transition:    'all 0.15s',
          }}>
            {tab === 'swap' ? '⇄ SWAP' : '💧 LIQUIDITY'}
          </button>
        ))}
      </div>

      {/* ── SWAP TAB ── */}
      {activeTab === 'swap' && (
        <div style={{ maxWidth: '480px' }}>

          {/* Pair selector */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
            {(Object.keys(PAIRS) as SwapPair[]).map(pair => {
              const p = PAIRS[pair]
              const active = activePair === pair
              return (
                <button key={pair} onClick={() => { setActivePair(pair); setSwapDir('forward'); setInputAmount(''); setOutputAmount('0') }} style={{
                  ...MONO,
                  flex:          1,
                  padding:       '8px 4px',
                  borderRadius:  '10px',
                  fontSize:      '10px',
                  fontWeight:    700,
                  letterSpacing: '0.05em',
                  cursor:        'pointer',
                  border:        `1px solid ${active ? `${p.colorA}40` : 'rgba(255,255,255,0.07)'}`,
                  background:    active ? `${p.colorA}10` : 'rgba(255,255,255,0.02)',
                  color:         active ? p.colorA : 'rgba(255,255,255,0.35)',
                  transition:    'all 0.15s',
                }}>
                  <span style={{ color: p.colorA }}>{p.tokenA}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 3px' }}>/</span>
                  <span style={{ color: p.colorB }}>{p.tokenB}</span>
                </button>
              )
            })}
          </div>

          {/* Slippage */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)' }}>SLIPPAGE_TOLERANCE</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSlippage(s)} style={{
                  ...MONO,
                  padding:       '4px 10px',
                  borderRadius:  '6px',
                  fontSize:      '10px',
                  fontWeight:    700,
                  cursor:        'pointer',
                  border:        slippage === s ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  background:    slippage === s ? 'rgba(0,212,255,0.1)' : 'rgba(255,255,255,0.03)',
                  color:         slippage === s ? '#00d4ff' : 'rgba(255,255,255,0.3)',
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
                <input
                  type="number"
                  value={inputAmount}
                  onChange={e => setInputAmount(e.target.value)}
                  placeholder="0.0"
                  style={{
                    ...MONO,
                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                    color: '#fff', fontSize: '28px', fontWeight: 700,
                  }}
                />
                <div style={{ padding: '8px 14px', background: `${colorFrom}12`, border: `1px solid ${colorFrom}30`, borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: colorFrom, flexShrink: 0 }}>
                  {from}
                </div>
              </div>
            </div>

            {/* Flip */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '8px', background: 'rgba(255,255,255,0.02)' }}>
              <button onClick={handleFlip} style={{
                ...MONO,
                width: '32px', height: '32px', borderRadius: '8px',
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
                <div style={{ ...MONO, flex: 1, fontSize: '28px', fontWeight: 700, color: parseFloat(outputAmount) > 0 ? colorTo : 'rgba(255,255,255,0.15)' }}>
                  {parseFloat(outputAmount) > 0 ? outputAmount : '0.0'}
                </div>
                <div style={{ padding: '8px 14px', background: `${colorTo}12`, border: `1px solid ${colorTo}30`, borderRadius: '10px', fontSize: '13px', fontWeight: 700, color: colorTo, flexShrink: 0 }}>
                  {to}
                </div>
              </div>
            </div>
          </div>

          {/* Swap details */}
          {inputAmount && parseFloat(inputAmount) > 0 && (
            <div style={{ marginTop: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', overflow: 'hidden' }}>
              {[
                { label: 'FEE_(0.25%)',  value: `${(parseFloat(inputAmount) * 0.0025).toFixed(6)} ${from}`,                                   color: 'rgba(255,255,255,0.4)' },
                { label: 'MIN_RECEIVED', value: `${(parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6)} ${to}`,                      color: 'rgba(255,255,255,0.4)' },
                { label: 'PRICE_IMPACT', value: `~${priceImpact}%`,                                                                            color: parseFloat(priceImpact) > 5 ? '#ff4444' : '#00ff9f' },
                { label: 'SLIPPAGE',     value: `${slippage}%`,                                                                                color: '#ffd700' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)' }}>{row.label}</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: row.color }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Swap button */}
          <button onClick={handleSwap} disabled={!inputAmount || parseFloat(inputAmount) <= 0 || loading || pool.loading} style={{
            ...MONO,
            width: '100%', marginTop: '12px',
            padding: '14px', borderRadius: '12px',
            fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em',
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(255,255,255,0.04)' : `linear-gradient(135deg, ${colorFrom}20, ${colorTo}20)`,
            border: `1px solid ${loading ? 'rgba(255,255,255,0.08)' : colorFrom + '40'}`,
            color: loading ? 'rgba(255,255,255,0.3)' : colorFrom,
            opacity: (!inputAmount || parseFloat(inputAmount) <= 0) ? 0.4 : 1,
            transition: 'all 0.2s',
          }}>
            {loading ? '⏳ SWAPPING...' : `⇄ SWAP ${from} → ${to}`}
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

          {/* User position */}
          <div style={{ padding: '18px', background: 'rgba(255,0,255,0.05)', border: '1px solid rgba(255,0,255,0.15)', borderRadius: '14px', marginBottom: '14px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,0,255,0.5), transparent)' }} />
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '10px' }}>YOUR_POSITION</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#ff00ff' }}>{userLP.toFixed(4)}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: '2px' }}>
                  LP_TOKENS — {poolShare}% POOL_SHARE
                </div>
              </div>
              {pool.totalLPSupply > 0 && userLP > 0 && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '10px', color: '#00ff9f', letterSpacing: '0.05em' }}>
                    {(pool.reserveB2S * userLP / pool.totalLPSupply).toFixed(2)} $B2S
                  </div>
                  <div style={{ fontSize: '10px', color: '#5546ff', letterSpacing: '0.05em' }}>
                    {(pool.reserveSTX * userLP / pool.totalLPSupply).toFixed(2)} STX
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Add liquidity */}
          <div style={{ padding: '18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', marginBottom: '12px' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '14px' }}>ADD_LIQUIDITY</div>
            {[
              { label: '$B2S_AMOUNT', value: b2sAmount, setter: setB2sAmount, color: '#00ff9f' },
              { label: 'STX_AMOUNT',  value: stxAmount, setter: setStxAmount, color: '#5546ff' },
            ].map(field => (
              <div key={field.label} style={{ marginBottom: '10px', padding: '14px', background: `${field.color}06`, border: `1px solid ${field.color}18`, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="number"
                  value={field.value}
                  onChange={e => field.setter(e.target.value)}
                  placeholder="0.0"
                  style={{ ...MONO, flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '22px', fontWeight: 700 }}
                />
                <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: field.color, padding: '6px 12px', background: `${field.color}12`, border: `1px solid ${field.color}30`, borderRadius: '8px' }}>
                  {field.label.replace('_AMOUNT', '')}
                </div>
              </div>
            ))}

            <button onClick={handleAddLiquidity} disabled={!b2sAmount || !stxAmount || loading} style={{
              ...MONO,
              width: '100%', padding: '14px', borderRadius: '12px',
              fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? 'rgba(255,255,255,0.04)' : 'rgba(255,0,255,0.1)',
              border: '1px solid rgba(255,0,255,0.3)', color: '#ff00ff',
              opacity: (!b2sAmount || !stxAmount) ? 0.4 : 1,
              transition: 'all 0.2s',
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
        </div>
      )}

      {/* Info */}
      <div style={{ marginTop: '16px', padding: '12px 16px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderLeft: '3px solid rgba(0,212,255,0.5)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
        <span style={{ color: '#00d4ff' }}>AMM_INFO</span> — Constant product formula (x×y=k). 0.25% fee split between LP providers. USDCx = Circle USDC bridged to Stacks.
      </div>
    </div>
  )
}