import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { PostConditionMode, AnchorMode } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useDailyReward() {
  const [loading, setLoading] = useState(false)
  const [txId, setTxId]       = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  const claim = async () => {
    setLoading(true)
    setError(null)
    try {
      await openContractCall({
        network,
        contractAddress:   CONTRACT,
        contractName:      'b2s-token',
        functionName:      'claim-daily-reward',
        functionArgs:      [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: d  => { setTxId(d.txId);  setLoading(false) },
        onCancel: () => { setError('Cancelled'); setLoading(false) },
      })
    } catch (e: any) {
      setError(e.message)
      setLoading(false)
    }
  }

  return { claim, loading, txId, error }
}
