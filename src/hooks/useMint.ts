import { useState } from 'react'
import { openContractCall } from '@stacks/connect'
import { uintCV, standardPrincipalCV, PostConditionMode, AnchorMode } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

const network  = new StacksMainnet()
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useMint() {
  const [loading, setLoading] = useState(false)
  const [txId, setTxId]       = useState<string | null>(null)

  const mint = async (recipient: string, badgeId: number) => {
    setLoading(true)
    try {
      await openContractCall({
        network,
        contractAddress:   CONTRACT,
        contractName:      'b2s-badges',
        functionName:      'mint-badge',
        functionArgs:      [standardPrincipalCV(recipient), uintCV(badgeId)],
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: d => { setTxId(d.txId); setLoading(false) },
        onCancel: ()  => setLoading(false),
      })
    } catch { setLoading(false) }
  }

  return { mint, loading, txId }
}
