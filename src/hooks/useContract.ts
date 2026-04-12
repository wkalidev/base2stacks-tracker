'use client'

import { useState, useRef } from 'react'
import { openContractCall } from '@stacks/connect'
import {
  uintCV, principalCV, noneCV,
  boolCV, stringUtf8CV, stringAsciiCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'

const TOKEN_CONTRACT   = 'b2s-token-v4'
const STAKING_CONTRACT = 'b2s-staking-vault-v2'

export function useContract() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [txId,    setTxId]    = useState<string | null>(null)
  const isPending = useRef(false) // 🛡️ guard anti double-call

  const startCall = () => {
    if (isPending.current) return false
    isPending.current = true
    setLoading(true); setError(null); setTxId(null)
    return true
  }

  const endCall = (txid?: string, err?: string) => {
    isPending.current = false
    setLoading(false)
    if (txid) setTxId(txid)
    if (err)  setError(err)
  }

  // ─── Claim daily reward ────────────────────────────────────────────────────
  const claimDailyReward = async () => {
    if (!startCall()) return
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    TOKEN_CONTRACT,
        functionName:    'claim-daily-reward',
        functionArgs:    [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => endCall(data.txId),
        onCancel: ()     => endCall(undefined, 'Cancelled'),
      })
    } catch (err: any) {
      endCall(undefined, err.message || 'Failed to claim')
    }
  }

  // ─── Stake via b2s-token-v4 ───────────────────────────────────────────────
  const stake = async (amount: number) => {
    if (!startCall()) return
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    STAKING_CONTRACT,
        functionName:    'stake',
        functionArgs:    [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => endCall(data.txId),
        onCancel: ()     => endCall(undefined, 'Cancelled'),
      })
    } catch (err: any) {
      endCall(undefined, err.message || 'Failed to stake')
    }
  }

  // ─── Unstake via b2s-token-v4 ─────────────────────────────────────────────
  const unstake = async (amount: number) => {
    if (!startCall()) return
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName:    STAKING_CONTRACT,
        functionName:    'unstake',
        functionArgs:    [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => endCall(data.txId),
        onCancel: ()     => endCall(undefined, 'Cancelled'),
      })
    } catch (err: any) {
      endCall(undefined, err.message || 'Failed to unstake')
    }
  }

  // ─── Transfer (b2s-token-v4) ──────────────────────────────────────────────
  const transfer = async (amount: number, sender: string, recipient: string) => {
    if (!startCall()) return
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
        onFinish: (data) => endCall(data.txId),
        onCancel: ()     => endCall(undefined, 'Cancelled'),
      })
    } catch (err: any) {
      endCall(undefined, err.message || 'Failed to transfer')
    }
  }

  // ─── Place bet ─────────────────────────────────────────────────────────────
  const placeBet = async (marketId: number, vote: boolean, amount: number) => {
    if (!startCall()) return
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
        onFinish: (data) => endCall(data.txId),
        onCancel: ()     => endCall(undefined, 'Cancelled'),
      })
    } catch (err: any) {
      endCall(undefined, err.message || 'Failed to place bet')
    }
  }

  // ─── Create market ─────────────────────────────────────────────────────────
  const createMarket = async (question: string, category: string, deadlineBlocks: number) => {
    if (!startCall()) return
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
        onFinish: (data) => endCall(data.txId),
        onCancel: ()     => endCall(undefined, 'Cancelled'),
      })
    } catch (err: any) {
      endCall(undefined, err.message || 'Failed to create market')
    }
  }

  return { claimDailyReward, stake, unstake, transfer, placeBet, createMarket, loading, error, txId }
}