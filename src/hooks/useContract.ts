'use client'

import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { uintCV, PostConditionMode, AnchorMode } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network = new StacksMainnet()
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'b2s-token'
const REWARDS_CONTRACT = 'b2s-rewards-distributor-v3'

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
        contractName: CONTRACT_NAME, // ✅ b2s-rewards-distributor-v3
        functionName: 'claim-daily-reward',
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          console.log('✅ Claim transaction submitted:', data.txId)
        },
        onCancel: () => {
          setError('Transaction cancelled by user')
          setLoading(false)
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to claim reward')
      setLoading(false)
      throw err
    }
  }

  const stake = async (amount: number) => {
    setLoading(true)
    setError(null)
    setTxId(null)

    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME, // b2s-token
        functionName: 'stake',
        functionArgs: [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          console.log('✅ Stake transaction submitted:', data.txId)
        },
        onCancel: () => {
          setError('Transaction cancelled by user')
          setLoading(false)
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to stake')
      setLoading(false)
      throw err
    }
  }

  const unstake = async (amount: number) => {
    setLoading(true)
    setError(null)
    setTxId(null)

    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME, // b2s-token
        functionName: 'unstake',
        functionArgs: [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          console.log('✅ Unstake transaction submitted:', data.txId)
        },
        onCancel: () => {
          setError('Transaction cancelled by user')
          setLoading(false)
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to unstake')
      setLoading(false)
      throw err
    }
  }

  return { claimDailyReward, stake, unstake, loading, error, txId }
}