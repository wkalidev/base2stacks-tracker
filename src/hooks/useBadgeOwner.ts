import { useState, useEffect } from 'react'
import { callReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useBadgeOwner(tokenId: number) {
  const [owner, setOwner]     = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!tokenId) return
    setLoading(true)
    callReadOnlyFunction({
      network,
      contractAddress: CONTRACT,
      contractName:    'b2s-badges',
      functionName:    'get-owner',
      functionArgs:    [uintCV(tokenId)],
      senderAddress:   CONTRACT,
    })
      .then(r => {
        const val = cvToJSON(r).value?.value?.value
        setOwner(val || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [tokenId])

  return { owner, loading }
}
