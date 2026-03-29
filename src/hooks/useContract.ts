'use client'

import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { uintCV, PostConditionMode, AnchorMode } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const TOKEN_CONTRACT = 'b2s-token-v4'
const REWARDS_CONTRACT = 'b2s-rewards-distributor-v3'
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
        contractName: REWARDS_CONTRACT, // ✅ b2s-rewards-distributor-v3
        functionName: 'claim-daily-reward',
        functionArgs: [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          console.log('✅ Claim submitted:', data.txId)
        },
        onCancel: () => {
          setError('Transaction cancelled')
          setLoading(false)
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to claim reward')
      setLoading(false)
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
        contractName: STAKING_CONTRACT, // ✅ b2s-staking-vault-v2
        functionName: 'stake',
        functionArgs: [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          console.log('✅ Stake submitted:', data.txId)
        },
        onCancel: () => {
          setError('Transaction cancelled')
          setLoading(false)
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to stake')
      setLoading(false)
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
        contractName: STAKING_CONTRACT, // ✅ b2s-staking-vault-v2
        functionName: 'unstake',
        functionArgs: [uintCV(Math.floor(amount * 1_000_000))],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          console.log('✅ Unstake submitted:', data.txId)
        },
        onCancel: () => {
          setError('Transaction cancelled')
          setLoading(false)
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to unstake')
      setLoading(false)
    }
  }

  const transfer = async (amount: number, recipient: string) => {
    setLoading(true)
    setError(null)
    setTxId(null)
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: TOKEN_CONTRACT, // ✅ b2s-token-v4
        functionName: 'transfer',
        functionArgs: [
          uintCV(Math.floor(amount * 1_000_000)),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          console.log('✅ Transfer submitted:', data.txId)
        },
        onCancel: () => {
          setError('Transaction cancelled')
          setLoading(false)
        },
      })
    } catch (err: any) {
      setError(err.message || 'Failed to transfer')
      setLoading(false)
    }
  }

  return { claimDailyReward, stake, unstake, transfer, loading, error, txId }
}
