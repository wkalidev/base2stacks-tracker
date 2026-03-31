'use client'

import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { uintCV, principalCV, noneCV, PostConditionMode, AnchorMode } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const TOKEN_CONTRACT = 'b2s-token-v4'
const REWARDS_CONTRACT = 'b2s-rewards-distributor'
const STAKING_CONTRACT = 'b2s-staking-vault-v2'

export function useContract() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [txId, setTxId] = useState<string | null>(null)

  const claimDailyReward = async () => {
    setLoading(true)
    setError(null)
    setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: TOKEN_CONTRACT,
        functionName: 'claim-daily-reward',
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setLoading(false) },
        onCancel: () => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to claim')
      setLoading(false)
    }
  }

  // ✅ Stake via b2s-rewards-distributor (no token transfer needed)
  const stake = async (amount: number) => {
    setLoading(true)
    setError(null)
    setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: REWARDS_CONTRACT,
        functionName: 'stake',
        functionArgs: [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setLoading(false) },
        onCancel: () => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to stake')
      setLoading(false)
    }
  }

  // ✅ Unstake via b2s-rewards-distributor
  const unstake = async (amount: number) => {
    setLoading(true)
    setError(null)
    setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: REWARDS_CONTRACT,
        functionName: 'unstake',
        functionArgs: [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setLoading(false) },
        onCancel: () => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to unstake')
      setLoading(false)
    }
  }

  // ✅ Real token transfer — sender must be the connected wallet
  const transfer = async (amount: number, sender: string, recipient: string) => {
    setLoading(true)
    setError(null)
    setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: TOKEN_CONTRACT,
        functionName: 'transfer',
        functionArgs: [
          uintCV(Math.floor(amount * 1_000_000)),
          principalCV(sender),
          principalCV(recipient),
          noneCV(),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setLoading(false) },
        onCancel: () => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to transfer')
      setLoading(false)
    }
  }

  // ✅ Place bet on prediction market
  const placeBet = async (marketId: number, vote: boolean, amount: number) => {
    setLoading(true)
    setError(null)
    setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'b2s-prediction-market',
        functionName: 'place-bet',
        functionArgs: [
          uintCV(marketId),
          { type: 4, value: vote } as any,
          uintCV(Math.floor(amount * 1_000_000)),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setLoading(false) },
        onCancel: () => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to place bet')
      setLoading(false)
    }
  }

  // ✅ Create prediction market
  const createMarket = async (question: string, category: string, deadlineBlocks: number) => {
    setLoading(true)
    setError(null)
    setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: 'b2s-prediction-market',
        functionName: 'create-market',
        functionArgs: [
          { type: 14, data: question } as any,
          { type: 13, data: category } as any,
          uintCV(deadlineBlocks),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setLoading(false) },
        onCancel: () => { setError('Cancelled'); setLoading(false) },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create market')
      setLoading(false)
    }
  }

  return { claimDailyReward, stake, unstake, transfer, placeBet, createMarket, loading, error, txId }
}
