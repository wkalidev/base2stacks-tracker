import { useState, useEffect, useCallback } from 'react'
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useVault(address: string) {
  const [vault, setVault]     = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const fetch_ = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT,
        contractName:    'b2s-staking-vault-v2',
        functionName:    'get-vault',
        functionArgs:    [standardPrincipalCV(address)],
        senderAddress:   address,
      })
      setVault(cvToJSON(result).value)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => { fetch_() }, [fetch_])

  return { vault, loading, refetch: fetch_ }
}
