'use client'

import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { uintCV, PostConditionMode, AnchorMode } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const REWARDS_CONTRACT = 'b2s-rewards-distributor-v3'
const STAKING_CONTRACT = 'b2s-staking-vault-v2'

export function useContract() {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [txId,    setTxId]    = useState<string | null>(null)

  const call = (contractName: string, functionName: string, functionArgs: any[] = []) =>
    new Promise<string>((resolve, reject) => {
      openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName,
        functionName,
        functionArgs,
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setLoading(false)
          resolve(data.txId)
        },
        onCancel: () => {
          setError('Transaction cancelled')
          setLoading(false)
          reject(new Error('cancelled'))
        },
      }).catch((err: any) => {
        setError(err?.message || 'Transaction failed')
        setLoading(false)
        reject(err)
      })
    })

  // ✅ Claim via b2s-rewards-distributor-v3 — pas b2s-token
  const claimDailyReward = async () => {
    setLoading(true); setError(null); setTxId(null)
    return call(REWARDS_CONTRACT, 'claim-daily-reward')
  }

  // ✅ Stake via b2s-staking-vault-v2
  const stake = async (amount: number) => {
    setLoading(true); setError(null); setTxId(null)
    return call(STAKING_CONTRACT, 'stake', [uintCV(Math.floor(amount * 1_000_000))])
  }

  // ✅ Unstake via b2s-staking-vault-v2
  const unstake = async (amount: number) => {
    setLoading(true); setError(null); setTxId(null)
    return call(STAKING_CONTRACT, 'unstake', [uintCV(Math.floor(amount * 1_000_000))])
  }

  return { claimDailyReward, stake, unstake, loading, error, txId }
}