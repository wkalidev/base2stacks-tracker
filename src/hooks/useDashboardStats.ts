'use client'

import { useState, useEffect } from 'react'

const HIRO_API        = 'https://api.hiro.so'
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const TOKEN_CONTRACT   = 'b2s-token'
const REWARDS_CONTRACT = 'b2s-rewards-distributor-v3'
const POOL_CONTRACT    = 'b2s-liquidity-pool-v5'
const ASSET_ID         = `${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}::b2s-token`

interface DashboardStats {
  totalHolders:     number
  totalSupply:      number
  totalDistributed: number
  totalStaked:      number
  totalTxCount:     number
  loading:          boolean
}

export function useDashboardStats(): DashboardStats {
  const [stats, setStats] = useState<DashboardStats>({
    totalHolders:     0,
    totalSupply:      0,
    totalDistributed: 0,
    totalStaked:      0,
    totalTxCount:     0,
    loading:          true,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // ── 1. Total transactions on b2s-token ────────────────────────────
        const txRes  = await fetch(
          `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}/transactions?limit=1`
        )
        const txData      = await txRes.json()
        const totalTxCount = txData.total || 0

        // ── 2. Token holders — use token-holders endpoint with asset ID ───
        let totalHolders = 0
        try {
          const holdersRes  = await fetch(
            `${HIRO_API}/extended/v1/tokens/ft/holders?asset_identifier=${encodeURIComponent(ASSET_ID)}&limit=1`
          )
          const holdersData = await holdersRes.json()
          totalHolders = holdersData.total || 0

          // Fallback: count unique senders from recent transactions
          if (totalHolders === 0) {
            const txsRes  = await fetch(
              `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}/transactions?limit=50`
            )
            const txsData = await txsRes.json()
            const uniqueAddresses = new Set(
              (txsData.results || []).map((tx: any) => tx.sender_address).filter(Boolean)
            )
            totalHolders = uniqueAddresses.size
          }
        } catch {
          // Second fallback: count from token transfer events
          try {
            const eventsRes  = await fetch(
              `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}/transactions?limit=50`
            )
            const eventsData = await eventsRes.json()
            const uniqueAddresses = new Set(
              (eventsData.results || []).map((tx: any) => tx.sender_address).filter(Boolean)
            )
            totalHolders = uniqueAddresses.size
          } catch {}
        }

        // ── 3. Total supply ───────────────────────────────────────────────
        let totalSupply = 0
        try {
          // Try metadata API first
          const ftRes  = await fetch(
            `${HIRO_API}/metadata/v1/ft/${CONTRACT_ADDRESS}.${TOKEN_CONTRACT}`
          )
          const ftData = await ftRes.json()
          if (ftData.total_supply) {
            totalSupply = Number(ftData.total_supply) / 1_000_000
          } else {
            // Fallback: call get-total-supply read-only
            const supplyRes  = await fetch(
              `${HIRO_API}/v2/contracts/call-read/${CONTRACT_ADDRESS}/${TOKEN_CONTRACT}/get-total-supply`,
              {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ sender: CONTRACT_ADDRESS, arguments: [] }),
              }
            )
            const supplyData = await supplyRes.json()
            if (supplyData.result) {
              // Clarity uint result is hex: 0x0100000000... 
              const hex = supplyData.result.replace('0x', '')
              totalSupply = parseInt(hex.slice(2), 16) / 1_000_000
            }
          }
        } catch {}

        // ── 4. STX locked in liquidity pool ──────────────────────────────
        let totalStaked = 0
        try {
          const poolRes  = await fetch(
            `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${POOL_CONTRACT}/balances`
          )
          const poolData = await poolRes.json()
          totalStaked = poolData.stx?.balance
            ? Number(poolData.stx.balance) / 1_000_000
            : 0
        } catch {}

        // ── 5. Rewards distributed ────────────────────────────────────────
        let totalDistributed = 0
        try {
          const rewardsRes  = await fetch(
            `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${REWARDS_CONTRACT}/transactions?limit=1`
          )
          const rewardsData = await rewardsRes.json()
          totalDistributed = rewardsData.total || 0
        } catch {}

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
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [])

  return stats
}