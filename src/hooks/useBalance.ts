'use client'

import { useState, useEffect } from 'react'
import { StacksMainnet } from '@stacks/network'
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions'

const network = new StacksMainnet()
const contractAddress = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96' // mainnet SP...
const contractName = 'b2s-token-v4'

export function useBalance(address: string) {
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return

    const fetchBalance = async () => {
      setLoading(true)
      try {
        const result = await callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: 'get-balance',
          functionArgs: [standardPrincipalCV(address)],
          network,
          senderAddress: address,
        })

        const jsonResult = cvToJSON(result)
        const balanceValue = jsonResult.value?.value || 0
        setBalance(Number(balanceValue) / 1_000_000) // micro-units → tokens
      } catch (error) {
        console.error('Failed to fetch balance:', error)
        setBalance(0)
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 30_000) // refresh every 30s
    return () => clearInterval(interval)
  }, [address])

  return { balance, loading }
}