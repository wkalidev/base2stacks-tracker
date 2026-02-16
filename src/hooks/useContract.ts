'use client'

import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { 
  uintCV,
  PostConditionMode,
  AnchorMode,
} from '@stacks/transactions'
import { StacksTestnet } from '@stacks/network'

const network = new StacksTestnet()
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'b2s-token'

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
        contractName: CONTRACT_NAME,
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
      console.error('❌ Claim error:', err)
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
      const microAmount = Math.floor(amount * 1000000)

      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'stake',
        functionArgs: [uintCV(microAmount)],
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
      console.error('❌ Stake error:', err)
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
      const microAmount = Math.floor(amount * 1000000)

      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'unstake',
        functionArgs: [uintCV(microAmount)],
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
      console.error('❌ Unstake error:', err)
      setError(err.message || 'Failed to unstake')
      setLoading(false)
      throw err
    }
  }

  return {
    claimDailyReward,
    stake,
    unstake,
    loading,
    error,
    txId,
  }
}