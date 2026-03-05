'use client'

import { useState, useEffect } from 'react'

const HIRO_API = 'https://api.hiro.so'
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const TOKEN_CONTRACT = 'b2s-token'
const REWARDS_CONTRACT = 'b2s-rewards-distributor-v3'
const POOL_CONTRACT = 'b2s-liquidity-pool-v5'

interface DashboardStats {
  totalHolders: number
  totalSupply: number
  totalDistributed: number
  totalStaked: number
  totalTxCount: number
  loading: boolean
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalHolders: 0,
    totalSupply: 0,
    totalDistributed: 0,
    totalStaked: 0,
    totalTxCount: 0,
    loading: true,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Total transactions on b2s-token contract (proxy for "bridges tracked")
        const txRes = await fetch(
          `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}/transactions?limit=1`
        )
        const txData = await txRes.json()
        const totalTxCount = txData.total || 0

        // 2. Token holders count
        const holdersRes = await fetch(
          `${HIRO_API}/extended/v1/tokens/ft/${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}/holders?limit=1`
        )
        const holdersData = await holdersRes.json()
        const totalHolders = holdersData.total || 0

        // 3. Total supply from FT metadata
        const ftRes = await fetch(
          `${HIRO_API}/metadata/v1/ft/${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}`
        )
        const ftData = await ftRes.json()
        const totalSupply = ftData.total_supply
          ? Number(ftData.total_supply) / 1_000_000
          : 0

        // 4. STX locked in liquidity pool (proxy for TVL/staked)
        const poolRes = await fetch(
          `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${POOL_CONTRACT}/balances`
        )
        const poolData = await poolRes.json()
        const totalStaked = poolData.stx?.balance
          ? Number(poolData.stx.balance) / 1_000_000
          : 0

        // 5. Rewards distributor tx count (proxy for rewards distributed)
        const rewardsRes = await fetch(
          `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${REWARDS_CONTRACT}/transactions?limit=1`
        )
        const rewardsData = await rewardsRes.json()
        const totalDistributed = rewardsData.total || 0

        setStats({
          totalHolders,
          totalSupply,
          totalDistributed,
          totalStaked,
          totalTxCount,
          loading: false,
        })
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        setStats(prev => ({ ...prev, loading: false }))
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 60_000) // refresh every 60s
    return () => clearInterval(interval)
  }, [])

  return stats
}