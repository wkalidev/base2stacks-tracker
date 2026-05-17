import { useState, useEffect } from 'react'
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useLastTokenId() {
  const [lastId, setLastId]   = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    callReadOnlyFunction({
      network,
      contractAddress: CONTRACT,
      contractName:    'b2s-badges',
      functionName:    'get-last-token-id',
      functionArgs:    [],
      senderAddress:   CONTRACT,
    })
      .then(r => {
        const val = cvToJSON(r).value?.value
        setLastId(val ? Number(val) : 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { lastId, loading }
}
