'use client'

import { useState, useEffect, useCallback } from 'react'

const SBTC_CONTRACT = 'SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token'
const HIRO_API = '/api/hiro'

interface SBTCStats {
  totalSupply: number
  holders: number
  price: number
  userBalance: number
}

interface Props {
  userAddress?: string
}

export function SBTCDashboard({ userAddress }: Props) {
  const [stats, setStats] = useState<SBTCStats>({ totalSupply: 0, holders: 0, price: 0, userBalance: 0 })
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState('')

  const fetchStats = useCallback(async () => {
    try {
      const [metaRes, holdersRes] = await Promise.all([
        fetch(`${HIRO_API}?path=${encodeURIComponent('/metadata/v1/ft/SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token')}`),
        fetch(`${HIRO_API}?path=${encodeURIComponent('/extended/v1/tokens/ft/SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token/holders?limit=1')}`),
      ])
      const [metaData, holdersData] = await Promise.all([metaRes.json(), holdersRes.json()])

      let userBalance = 0
      if (userAddress) {
        const balRes = await fetch(`${HIRO_API}?path=${encodeURIComponent('/extended/v1/address/' + userAddress + '/balances')}`)
        const balData = await balRes.json()
        const sbtcBal = balData?.fungible_tokens?.[SBTC_CONTRACT]?.balance
        userBalance = sbtcBal ? Number(sbtcBal) / 1e8 : 0
      }

      setStats({
        totalSupply: metaData?.total_supply ? Number(metaData.total_supply) / 1e8 : 0,
        holders: holdersData?.total || 0,
        price: 66000,
        userBalance,
      })
      setLastSync(new Date().toLocaleTimeString())
    } catch (err) {
      console.error('sBTC fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [userAddress])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const statItems = [
    { label: 'TOTAL_SUPPLY', value: stats.totalSupply.toFixed(4) + ' sBTC', color: '#f7931a' },
    { label: 'HOLDERS', value: stats.holders.toLocaleString(), color: '#00d4ff' },
    { label: 'TVL_USD', value: '$' + (stats.totalSupply * stats.price).toLocaleString(undefined, { maximumFractionDigits: 0 }), color: '#00ff9f' },
    { label: 'YOUR_sBTC', value: stats.userBalance.toFixed(6) + ' sBTC', color: '#ffd700' },
  ]

  return (
    <div style={{ background: 'rgba(5,15,20,0.97)', border: '1px solid rgba(247,147,26,0.3)', borderRadius: '2px', padding: '24px', fontFamily: 'Fira Code, monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#f7931a', marginBottom: '4px' }}>// SBTC_DASHBOARD</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>sBTC — Bitcoin on Stacks</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Native Bitcoin bridged to Stacks mainnet</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '9px', color: '#64748b', letterSpacing: '0.2em' }}>BTC PRICE</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f7931a' }}>${stats.price.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(247,147,26,0.1)', marginBottom: '20px' }}>
        {statItems.map((stat) => (
          <div key={stat.label} style={{ background: 'rgba(5,15,20,0.97)', padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#64748b', marginBottom: '5px' }}>{stat.label}</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: stat.color }}>{loading ? '...' : stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'rgba(247,147,26,0.05)', border: '1px solid rgba(247,147,26,0.15)', borderRadius: '2px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#f7931a', marginBottom: '12px' }}>// BRIDGE_BTC_TO_SBTC</div>
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px', lineHeight: 1.6 }}>
          Bridge your BTC to sBTC on Stacks mainnet. sBTC is fully backed 1:1 by Bitcoin.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <a href="https://app.stacks.co/bridge" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', background: 'rgba(247,147,26,0.1)', border: '1px solid rgba(247,147,26,0.3)', borderRadius: '2px', color: '#f7931a', textAlign: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textDecoration: 'none' }}>
            BRIDGE BTC TO sBTC
          </a>
          <a href="https://explorer.hiro.so/address/SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token?chain=mainnet" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '2px', color: '#00d4ff', textAlign: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textDecoration: 'none' }}>
            VIEW CONTRACT
          </a>
        </div>
      </div>

      <div style={{ fontSize: '9px', color: '#1e3a2f', letterSpacing: '0.15em', textAlign: 'right' }}>
        LAST_SYNC: {lastSync}
      </div>
    </div>
  )
}

export default SBTCDashboard
