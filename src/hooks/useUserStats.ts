import { useState, useEffect } from 'react'

const HIRO    = 'https://api.mainnet.hiro.so'
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useUserStats(address: string) {
  const [badgeCount, setBadgeCount] = useState(0)
  const [txCount, setTxCount]       = useState(0)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (!address) return
    setLoading(true)
    Promise.all([
      fetch(`${HIRO}/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=${CONTRACT}.b2s-badges::b2s-badge`).then(r => r.json()),
      fetch(`${HIRO}/extended/v1/address/${address}/transactions?limit=1`).then(r => r.json()),
    ])
      .then(([nft, txs]) => {
        setBadgeCount(nft.total || 0)
        setTxCount(txs.total || 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [address])

  return { badgeCount, txCount, loading }
}
