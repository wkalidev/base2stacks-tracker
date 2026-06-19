'use client'

import { useState, useEffect } from 'react'
import { useSwap, type SwapDirection } from '@/hooks/useSwap'
import { useWallet } from '@/hooks/useWallet'

const MONO    = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }
const SLIPPAGE_OPTIONS = [0.5, 1, 2] as const

function Label({ text }: { text: string }) {
  return (
    <p className="text-[9px] tracking-[0.3em] font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
      {text}
    </p>
  )
}

export default function SwapInterface() {
  const { address, isConnected } = useWallet()
  const { pool, getQuote, executeSwap, loading, txId, error, refetch } = useSwap(address || undefined)

  const [direction,  setDirection]  = useState<SwapDirection>('STX_TO_B2S')
  const [amountIn,   setAmountIn]   = useState('')
  const [slippage,   setSlippage]   = useState<0.5 | 1 | 2>(1)

  // Reset amount on direction flip
  const flipDirection = () => {
    setDirection(d => d === 'STX_TO_B2S' ? 'B2S_TO_STX' : 'STX_TO_B2S')
    setAmountIn('')
  }

  const parsed = parseFloat(amountIn) || 0
  const quote  = parsed > 0 ? getQuote(parsed, direction) : null

  const tokenIn  = direction === 'STX_TO_B2S' ? 'STX' : 'B2S'
  const tokenOut = direction === 'STX_TO_B2S' ? 'B2S' : 'STX'

  const minOut    = quote ? quote.minAmountOut(slippage) : 0
  const canSwap   = isConnected && !pool.empty && parsed > 0 && !!quote && !loading
  const impactHigh = (quote?.priceImpact ?? 0) > 5

  const handleSwap = () => {
    if (!canSwap) return
    executeSwap(parsed, minOut, direction)
  }

  // Spot price: STX per B2S
  const spotPrice = !pool.empty && pool.b2s > 0 ? (pool.stx / pool.b2s).toFixed(6) : null

  return (
    <div style={MONO} className="max-w-lg mx-auto space-y-4">

      {/* Pool empty banner */}
      {!pool.loading && pool.empty && (
        <div className="rounded-xl border border-[#ff00ff]/20 bg-[#ff00ff]/5 p-4 text-center">
          <p className="text-[10px] font-black tracking-widest text-[#ff00ff] mb-1">POOL_EMPTY</p>
          <p className="text-[10px] text-white/30 leading-relaxed">
            No liquidity yet — swaps disabled until reserves are seeded.<br />
            Call <span className="text-[#9945ff]">add-b2s-stx(b, s)</span> on{' '}
            <span className="text-white/40">b2s-liquidity-pool-v6</span> to add liquidity.
          </p>
        </div>
      )}

      {/* Swap card */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="border-b border-white/[0.06] p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] tracking-[0.3em] font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>
              AMM_SWAP
            </p>
            <p className="text-[10px] tracking-[0.15em] text-white/40 mt-0.5">
              b2s-liquidity-pool-v6 · 0.25% FEE
            </p>
          </div>
          <button
            onClick={refetch}
            className="text-[9px] tracking-widest font-black px-2 py-1 rounded-lg transition-all hover:opacity-70"
            style={{ color: '#9945ff', border: '1px solid rgba(153,69,255,0.2)', background: 'rgba(153,69,255,0.05)' }}
            title="Refresh reserves"
          >
            ↻
          </button>
        </div>

        <div className="p-5 space-y-3">

          {/* YOU_PAY */}
          <div>
            <Label text="YOU_PAY" />
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="any"
                value={amountIn}
                onChange={e => setAmountIn(e.target.value)}
                placeholder="0.0"
                className="flex-1 px-4 py-3 rounded-xl text-white text-lg font-black placeholder-white/20 focus:outline-none transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
              />
              <div className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-black tracking-widest min-w-[72px]"
                style={{
                  background: direction === 'STX_TO_B2S' ? 'rgba(0,212,255,0.08)' : 'rgba(153,69,255,0.08)',
                  border:     direction === 'STX_TO_B2S' ? '1px solid rgba(0,212,255,0.25)' : '1px solid rgba(153,69,255,0.25)',
                  color:      direction === 'STX_TO_B2S' ? '#00d4ff' : '#9945ff',
                }}>
                {tokenIn}
              </div>
            </div>
          </div>

          {/* Flip direction */}
          <div className="flex justify-center">
            <button
              onClick={flipDirection}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-black transition-all hover:opacity-70 hover:scale-110"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#ff00ff' }}
            >
              ⇄
            </button>
          </div>

          {/* YOU_RECEIVE */}
          <div>
            <Label text="YOU_RECEIVE" />
            <div className="flex gap-2">
              <div
                className="flex-1 px-4 py-3 rounded-xl text-lg font-black"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: quote ? '#00ff9f' : 'rgba(255,255,255,0.15)',
                }}>
                {pool.loading
                  ? '···'
                  : pool.empty
                    ? '—'
                    : quote
                      ? quote.amountOut.toFixed(4)
                      : '0.0'}
              </div>
              <div className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-black tracking-widest min-w-[72px]"
                style={{
                  background: direction === 'STX_TO_B2S' ? 'rgba(153,69,255,0.08)' : 'rgba(0,212,255,0.08)',
                  border:     direction === 'STX_TO_B2S' ? '1px solid rgba(153,69,255,0.25)' : '1px solid rgba(0,212,255,0.25)',
                  color:      direction === 'STX_TO_B2S' ? '#9945ff' : '#00d4ff',
                }}>
                {tokenOut}
              </div>
            </div>
          </div>

          {/* Quote details */}
          {quote && (
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>MIN_RECEIVE ({slippage}% slippage)</span>
                <span className="font-black text-white/60">{minOut.toFixed(4)} {tokenOut}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>PRICE_IMPACT</span>
                <span className="font-black" style={{ color: impactHigh ? '#ff4444' : '#00ff9f' }}>
                  {quote.priceImpact.toFixed(2)}%{impactHigh ? ' ⚠' : ''}
                </span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>FEE</span>
                <span className="font-black text-white/40">0.25%</span>
              </div>
            </div>
          )}

          {/* Slippage */}
          <div>
            <Label text="SLIPPAGE_TOLERANCE" />
            <div className="flex gap-2">
              {SLIPPAGE_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setSlippage(s)}
                  className="flex-1 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all hover:opacity-80"
                  style={{
                    background: slippage === s ? 'rgba(153,69,255,0.15)' : 'rgba(255,255,255,0.03)',
                    border:     slippage === s ? '1px solid rgba(153,69,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                    color:      slippage === s ? '#9945ff' : 'rgba(255,255,255,0.3)',
                  }}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          {/* Swap button */}
          {!isConnected ? (
            <div className="py-3 rounded-xl text-center text-[10px] font-black tracking-widest"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.2)' }}>
              CONNECT_WALLET_TO_SWAP
            </div>
          ) : (
            <button
              onClick={handleSwap}
              disabled={!canSwap}
              className="w-full py-3 rounded-xl text-[11px] font-black tracking-widest transition-all hover:opacity-80 disabled:opacity-25"
              style={{
                background: canSwap ? 'rgba(153,69,255,0.15)' : 'rgba(255,255,255,0.03)',
                border:     canSwap ? '1px solid rgba(153,69,255,0.4)' : '1px solid rgba(255,255,255,0.07)',
                color:      canSwap ? '#9945ff' : 'rgba(255,255,255,0.2)',
              }}
            >
              {loading
                ? '⏳ AWAITING_SIGNATURE...'
                : pool.empty
                  ? '// NO_LIQUIDITY'
                  : `▶ SWAP ${tokenIn} FOR $${tokenOut}`}
            </button>
          )}

          {/* TX confirmation */}
          {txId && (
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(0,255,159,0.05)', border: '1px solid rgba(0,255,159,0.2)' }}>
              <p className="text-[9px] tracking-[0.3em] font-black text-[#00ff9f] mb-1">TX_SUBMITTED</p>
              <a
                href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-white/40 hover:text-white/60 transition-colors break-all"
              >
                {txId.slice(0, 20)}…{txId.slice(-8)} ↗
              </a>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,68,68,0.05)', border: '1px solid rgba(255,68,68,0.2)' }}>
              <p className="text-[9px] tracking-[0.3em] font-black text-[#ff4444] mb-0.5">SWAP_ERROR</p>
              <p className="text-[10px] text-white/30">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Pool stats */}
      {!pool.loading && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <Label text="POOL_STATS // b2s-liquidity-pool-v6" />
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { label: 'STX_RESERVE',  value: pool.empty ? '—' : pool.stx.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' STX' },
              { label: 'B2S_RESERVE',  value: pool.empty ? '—' : pool.b2s.toLocaleString(undefined, { maximumFractionDigits: 2 }) + ' B2S' },
              { label: 'SPOT_PRICE',   value: spotPrice ? spotPrice + ' STX/B2S' : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-[8px] tracking-[0.2em] font-black text-white/20 mb-1">{label}</p>
                <p className="text-[10px] font-black" style={{ color: pool.empty ? 'rgba(255,255,255,0.2)' : '#00d4ff' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
