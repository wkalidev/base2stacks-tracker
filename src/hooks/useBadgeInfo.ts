import { useState, useEffect } from 'react'
import { callReadOnlyFunction, cvToJSON, uintCV } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useBadgeInfo(badgeId: number) {
  const [info, setInfo]       = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!badgeId) return
    setLoading(true)
    callReadOnlyFunction({
      network,
      contractAddress: CONTRACT,
      contractName:    'b2s-badges',
      functionName:    'get-badge-info',
      functionArgs:    [uintCV(badgeId)],
      senderAddress:   CONTRACT,
    })
      .then(r => setInfo(cvToJSON(r).value))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [badgeId])

  return { info, loading }
}
