'use client'

import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import {
  uintCV, principalCV, noneCV,
  boolCV, stringUtf8CV, stringAsciiCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'

// ✅ Contrats réellement déployés sur mainnet (vérifiés sur explorer)
const TOKEN_CONTRACT   = 'b2s-token-v4'  // claim-daily-reward
const STAKING_CONTRACT = 'b2s-token-v4'     // stake / unstake (confirmé sur explorer nonce 104)

export function useContract() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [txId,    setTxId]    = useState<string | null>(null)

  // ─── Claim daily reward ────────────────────────────────────────────────────
  const claimDailyReward = async () => {
    setLoading(true); setError(null); setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    TOKEN_CONTRACT,
        functionName:    'claim-daily-reward',
        functionArgs:    [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId);   setLoading(false) },
        onCancel: ()     => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to claim')
      setLoading(false)
    }
  }

  // ─── Stake via b2s-token ───────────────────────────────────────────────────
  // ✅ Confirmé sur mainnet : stake → b2s-token (nonce 104, result ok true)
  const stake = async (amount: number) => {
    setLoading(true); setError(null); setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    STAKING_CONTRACT,
        functionName:    'stake',
        functionArgs:    [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId);   setLoading(false) },
        onCancel: ()     => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to stake')
      setLoading(false)
    }
  }

  // ─── Unstake via b2s-token ─────────────────────────────────────────────────
  const unstake = async (amount: number) => {
    setLoading(true); setError(null); setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    STAKING_CONTRACT,
        functionName:    'unstake',
        functionArgs:    [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId);   setLoading(false) },
        onCancel: ()     => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to unstake')
      setLoading(false)
    }
  }

  // ─── Transfer (b2s-token-v4) ───────────────────────────────────────────────
  const transfer = async (amount: number, sender: string, recipient: string) => {
    setLoading(true); setError(null); setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    TOKEN_CONTRACT,
        functionName:    'transfer',
        functionArgs:    [
          uintCV(Math.floor(amount * 1_000_000)),
          principalCV(sender),
          principalCV(recipient),
          noneCV(),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId);   setLoading(false) },
        onCancel: ()     => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to transfer')
      setLoading(false)
    }
  }

  // ─── Place bet ─────────────────────────────────────────────────────────────
  // ✅ boolCV au lieu de { type: 4, value: vote } as any
  const placeBet = async (marketId: number, vote: boolean, amount: number) => {
    setLoading(true); setError(null); setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    'b2s-prediction-market',
        functionName:    'place-bet',
        functionArgs:    [
          uintCV(marketId),
          boolCV(vote),
          uintCV(Math.floor(amount * 1_000_000)),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId);   setLoading(false) },
        onCancel: ()     => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to place bet')
      setLoading(false)
    }
  }

  // ─── Create market ─────────────────────────────────────────────────────────
  // ✅ stringUtf8CV + stringAsciiCV au lieu de { type: 14 } as any
  const createMarket = async (question: string, category: string, deadlineBlocks: number) => {
    setLoading(true); setError(null); setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    'b2s-prediction-market',
        functionName:    'create-market',
        functionArgs:    [
          stringUtf8CV(question),
          stringAsciiCV(category),
          uintCV(deadlineBlocks),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId);   setLoading(false) },
        onCancel: ()     => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create market')
      setLoading(false)
    }
  }

  return { claimDailyReward, stake, unstake, transfer, placeBet, createMarket, loading, error, txId }
}