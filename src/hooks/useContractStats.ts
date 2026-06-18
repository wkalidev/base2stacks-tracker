import { useState, useEffect } from 'react'

const HIRO    = 'https://api.mainnet.hiro.so'
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export function useContractStats() {
  const [stats, setStats] = useState({
    stakingTxs:  0,
    rewardsTxs:  0,
    loading:     true,
  })

  useEffect(() => {
    Promise.all([
      fetch(`${HIRO}/extended/v1/address/${CONTRACT}.b2s-staking-vault-v2/transactions?limit=1`).then(r => r.json()),
      fetch(`${HIRO}/extended/v1/address/${CONTRACT}.b2s-rewards-distributor/transactions?limit=1`).then(r => r.json()),
    ])
      .then(([s, r]) => setStats({
        stakingTxs: s.total || 0,
        rewardsTxs: r.total || 0,
        loading:    false,
      }))
      .catch(() => setStats(p => ({ ...p, loading: false })))
  }, [])

  return stats
}
