'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  callReadOnlyFunction, cvToJSON,
  uintCV, PostConditionMode, AnchorMode,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'
import { calcAmountOut, calcMinAmountOut, calcPriceImpact } from '@/lib/swap'

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'
const CONTRACT_NAME    = 'b2s-liquidity-pool-v6'
const DECIMALS         = 1_000_000

export type SwapDirection = 'STX_TO_B2S' | 'B2S_TO_STX'

export interface PoolState {
  b2s:     number
  stx:     number
  loading: boolean
  empty:   boolean
}

export interface SwapQuote {
  amountOut:    number
  priceImpact:  number
  minAmountOut: (slippagePct: number) => number
}

export function useSwap(senderAddress?: string) {
  const [pool,    setPool]    = useState<PoolState>({ b2s: 0, stx: 0, loading: true, empty: true })
  const [loading, setLoading] = useState(false)
  const [txId,    setTxId]    = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const fetchReserves = useCallback(async () => {
    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    CONTRACT_NAME,
        functionName:    'get-reserves',
        functionArgs:    [],
        senderAddress:   senderAddress || CONTRACT_ADDRESS,
      })
      // (ok {b2s-stx-b: uint, b2s-stx-s: uint})
      const val = cvToJSON(result)?.value?.value ?? {}
      const b2s = Number(val?.['b2s-stx-b']?.value ?? 0) / DECIMALS
      const stx = Number(val?.['b2s-stx-s']?.value ?? 0) / DECIMALS
      setPool({ b2s, stx, loading: false, empty: b2s === 0 || stx === 0 })
    } catch {
      setPool(p => ({ ...p, loading: false }))
    }
  }, [senderAddress])

  useEffect(() => {
    fetchReserves()
    const t = setInterval(fetchReserves, 30_000)
    return () => clearInterval(t)
  }, [fetchReserves])

  // Client-side AMM quote — uses src/lib/swap.ts (no duplication)
  const getQuote = useCallback((amountIn: number, direction: SwapDirection): SwapQuote | null => {
    if (pool.empty || amountIn <= 0) return null
    const [ri, ro] = direction === 'STX_TO_B2S'
      ? [pool.stx, pool.b2s]
      : [pool.b2s, pool.stx]
    const amountOut   = calcAmountOut(amountIn, ri, ro)
    const priceImpact = calcPriceImpact(amountIn, ri)
    return {
      amountOut,
      priceImpact,
      minAmountOut: (slippagePct: number) => calcMinAmountOut(amountOut, slippagePct),
    }
  }, [pool])

  const executeSwap = async (
    amountIn:     number,
    minAmountOut: number,
    direction:    SwapDirection,
  ) => {
    if (!senderAddress) return
    setLoading(true); setTxId(null); setError(null)
    try {
      await openContractCall({
        network,
        contractAddress:   CONTRACT_ADDRESS,
        contractName:      CONTRACT_NAME,
        functionName:      direction === 'STX_TO_B2S' ? 'swap-stx-for-b2s' : 'swap-b2s-for-stx',
        functionArgs: [
          uintCV(Math.floor(amountIn    * DECIMALS)),
          uintCV(Math.floor(minAmountOut * DECIMALS)),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          setTimeout(fetchReserves, 5_000)
        },
        onCancel: () => setLoading(false),
      })
    } catch (err: any) {
      setError(err?.message ?? 'Swap failed')
      setLoading(false)
    }
  }

  return { pool, getQuote, executeSwap, loading, txId, error, refetch: fetchReserves }
}
