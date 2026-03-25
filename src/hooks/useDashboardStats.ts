'use client'
import { useState, useEffect } from 'react'

const CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'

async function hiroFetch(path: string) {
  const res = await fetch(`/api/hiro?path=${encodeURIComponent(path)}`)
  return res.json()
}

export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalHolders: 0, totalSupply: 0, totalDistributed: 0,
    totalStaked: 0, totalTxCount: 0, loading: true,
  })

  useEffect(() => {
    const fetch_ = async () => {
      try {
        const [tx, holders, meta, pool, rewards] = await Promise.all([
          hiroFetch(`/extended/v1/address/${CONTRACT}.b2s-token/transactions?limit=1`),
          hiroFetch(`/extended/v1/tokens/ft/${CONTRACT}.b2s-token/holders?limit=1`),
          hiroFetch(`/metadata/v1/ft/${CONTRACT}.b2s-token`),
          hiroFetch(`/extended/v1/address/${CONTRACT}.b2s-liquidity-pool-v5/balances`),
          hiroFetch(`/extended/v1/address/${CONTRACT}.b2s-rewards-distributor-v3/transactions?limit=1`),
        ])
        setStats({
          totalTxCount:    tx.total || 0,
          totalHolders:    holders.total || 0,
          totalSupply:     meta.total_supply ? Number(meta.total_supply) / 1_000_000 : 0,
          totalStaked:     pool.stx?.balance ? Number(pool.stx.balance) / 1_000_000 : 0,
          totalDistributed:rewards.total || 0,
          loading:         false,
        })
      } catch {
        setStats(p => ({ ...p, loading: false }))
      }
    }
    fetch_()
    const i = setInterval(fetch_, 60000)
    return () => clearInterval(i)
  }, [])

  return stats
}
