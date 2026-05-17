import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { PostConditionMode, AnchorMode } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useClaimRewards() {
  const [loading, setLoading] = useState(false)
  const [txId, setTxId]       = useState<string | null>(null)

  const claim = async () => {
    setLoading(true)
    try {
      await openContractCall({
        network,
        contractAddress:   CONTRACT,
        contractName:      'b2s-rewards-distributor-v3',
        functionName:      'claim-rewards',
        functionArgs:      [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: d => { setTxId(d.txId); setLoading(false) },
        onCancel: ()  => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  return { claim, loading, txId }
}
