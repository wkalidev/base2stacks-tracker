import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { PostConditionMode, AnchorMode } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useCompound() {
  const [loading, setLoading] = useState(false)
  const [txId, setTxId]       = useState<string | null>(null)

  const compound = async () => {
    setLoading(true)
    try {
      await openContractCall({
        network,
        contractAddress:   CONTRACT,
        contractName:      'b2s-staking-vault-v2',
        functionName:      'compound-rewards',
        functionArgs:      [],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: d => { setTxId(d.txId); setLoading(false) },
        onCancel: ()  => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  return { compound, loading, txId }
}
