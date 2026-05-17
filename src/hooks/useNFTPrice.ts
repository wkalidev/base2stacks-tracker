import { useState, useEffect } from 'react'

const HIRO    = 'https://api.mainnet.hiro.so'
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useNFTPrice() {
  const [floorPrice, setFloorPrice] = useState(0)
  const [volume, setVolume]         = useState(0)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`${HIRO}/extended/v1/address/${CONTRACT}.b2s-marketplace/transactions?limit=50`)
      .then(r => r.json())
      .then(d => {
        const sales = (d.results || []).filter(
          (tx: any) => tx.contract_call?.function_name === 'buy-badge'
        )
        setVolume(sales.length)
        setFloorPrice(1000)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return { floorPrice, volume, loading }
}
