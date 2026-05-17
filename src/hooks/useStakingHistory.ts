import { useState, useEffect } from 'react'

const HIRO    = 'https://api.mainnet.hiro.so'
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useStakingHistory(address: string) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    fetch(`${HIRO}/extended/v1/address/${address}/transactions?limit=50`)
      .then(r => r.json())
      .then(d => {
        const stakingTxs = (d.results || []).filter(
          (tx: any) => ['stake', 'unstake', 'compound-rewards', 'claim-rewards']
            .includes(tx.contract_call?.function_name)
        )
        setHistory(stakingTxs)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  return { history, loading }
}
