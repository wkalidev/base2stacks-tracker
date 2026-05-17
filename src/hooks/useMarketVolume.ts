import { useState, useEffect } from 'react'

const HIRO    = 'https://api.mainnet.hiro.so'
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useMarketVolume() {
  const [sales, setSales]     = useState(0)
  const [listings, setListings] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${HIRO}/extended/v1/address/${CONTRACT}.b2s-marketplace/transactions?limit=100`)
      .then(r => r.json())
      .then(d => {
        const txs = d.results || []
        setSales(txs.filter((tx: any) => tx.contract_call?.function_name === 'buy-badge').length)
        setListings(txs.filter((tx: any) => tx.contract_call?.function_name === 'list-badge').length)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { sales, listings, loading }
}
