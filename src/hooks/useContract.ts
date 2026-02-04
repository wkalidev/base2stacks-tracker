'use client'

import { useState } from 'react'
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  stringAsciiCV,
  uintCV,
  principalCV,
} from '@stacks/transactions'
import { StacksTestnet } from '@stacks/network'
import { useWallet } from './useWallet'

const network = new StacksTestnet()
const contractAddress = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM' // Sera mis à jour après déploiement
const contractName = 'b2s-token'

export function useContract() {
  const { address, userData } = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const claimDailyReward = async () => {
    if (!address || !userData) {
      setError('Please connect your wallet first')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const txOptions = {
        contractAddress,
        contractName,
        functionName: 'claim-daily-reward',
        functionArgs: [],
        senderKey: userData.appPrivateKey,
        validateWithAbi: false,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      }

      const transaction = await makeContractCall(txOptions)
      const broadcastResponse = await broadcastTransaction(transaction, network)
      
      setLoading(false)
      return broadcastResponse.txid
    } catch (err: any) {
      console.error('Claim error:', err)
      setError(err.message || 'Failed to claim reward')
      setLoading(false)
      return null
    }
  }

  const stake = async (amount: number) => {
    if (!address || !userData) {
      setError('Please connect your wallet first')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const txOptions = {
        contractAddress,
        contractName,
        functionName: 'stake',
        functionArgs: [uintCV(amount * 1000000)], // Convert to micro-units
        senderKey: userData.appPrivateKey,
        validateWithAbi: false,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      }

      const transaction = await makeContractCall(txOptions)
      const broadcastResponse = await broadcastTransaction(transaction, network)
      
      setLoading(false)
      return broadcastResponse.txid
    } catch (err: any) {
      console.error('Stake error:', err)
      setError(err.message || 'Failed to stake')
      setLoading(false)
      return null
    }
  }

  const unstake = async (amount: number) => {
    if (!address || !userData) {
      setError('Please connect your wallet first')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const txOptions = {
        contractAddress,
        contractName,
        functionName: 'unstake',
        functionArgs: [uintCV(amount * 1000000)],
        senderKey: userData.appPrivateKey,
        validateWithAbi: false,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      }

      const transaction = await makeContractCall(txOptions)
      const broadcastResponse = await broadcastTransaction(transaction, network)
      
      setLoading(false)
      return broadcastResponse.txid
    } catch (err: any) {
      console.error('Unstake error:', err)
      setError(err.message || 'Failed to unstake')
      setLoading(false)
      return null
    }
  }

  const getBalance = async (address: string) => {
    // Cette fonction nécessiterait l'API Stacks pour lire l'état
    // Pour l'instant, on retourne une valeur mock
    return 0
  }

  return {
    claimDailyReward,
    stake,
    unstake,
    getBalance,
    loading,
    error,
  }
}