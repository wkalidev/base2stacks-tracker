import { useState, useEffect, useCallback } from 'react'
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useUnlockBlock(address: string) {
  const [unlockBlock, setUnlockBlock] = useState(0)
  const [loading, setLoading]         = useState(false)

  const fetch_ = useCallback(async () => {
    if (!address) return
    setLoading(true)
    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT,
        contractName:    'b2s-staking-vault-v2',
        functionName:    'get-unlock-block',
        functionArgs:    [standardPrincipalCV(address)],
        senderAddress:   address,
      })
      const val = cvToJSON(result).value?.value
      setUnlockBlock(val ? Number(val) : 0)
    } catch {
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => { fetch_() }, [fetch_])
  return { unlockBlock, loading }
}
