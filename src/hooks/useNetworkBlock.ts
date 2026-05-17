import { useState, useEffect } from 'react'

const HIRO = 'https://api.mainnet.hiro.so'

export function useNetworkBlock() {
  const [block, setBlock]     = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch_ = () => {
      fetch(`${HIRO}/extended/v1/status`)
        .then(r => r.json())
        .then(d => setBlock(d.stacks_tip_height || 0))
        .catch(console.error)
    }
    setLoading(true)
    fetch_()
    setLoading(false)
    const i = setInterval(fetch_, 15000)
    return () => clearInterval(i)
  }, [])

  return { block, loading }
}
