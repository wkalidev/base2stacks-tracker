'use client'

import { useEffect, useState, useCallback } from 'react'
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV } from '@stacks/transactions'
import { StacksMainnet } from '@stacks/network'

interface StakingStatsProps { address: string }

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const STAKING_CONTRACT = 'b2s-staking-vault-v2'
const DECIMALS         = 1_000_000
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

interface VaultInfo {
  amount:      number
  lockedAt:    number
  lockBlocks:  number
  multiplier:  number
}

interface GlobalStats {
  totalStaked: number
  totalVaults: number
}

async function fetchVault(address: string): Promise<VaultInfo | null> {
  try {
    const result = await callReadOnlyFunction({
      network, contractAddress: CONTRACT_ADDRESS, contractName: STAKING_CONTRACT,
      functionName: 'get-vault',
      functionArgs: [standardPrincipalCV(address)],
      senderAddress: address,
    })
    const json = cvToJSON(result)
    const opt  = json?.value?.value
    if (!opt || opt.type === 'none') return null

    const val = opt?.value ?? opt
    const amount     = Number(val?.amount?.value      ?? 0) / DECIMALS
    const lockedAt   = Number(val?.['locked-at']?.value  ?? 0)
    const lockBlocks = Number(val?.['lock-blocks']?.value ?? 0)
    const multRaw    = Number(val?.multiplier?.value ?? 100)
    const multiplier = multRaw / 100

    return { amount, lockedAt, lockBlocks, multiplier }
  } catch { return null }
}

async function fetchGlobalStats(): Promise<GlobalStats> {
  try {
    const result = await callReadOnlyFunction({
      network, contractAddress: CONTRACT_ADDRESS, contractName: STAKING_CONTRACT,
      functionName: 'get-stats', functionArgs: [],
      senderAddress: CONTRACT_ADDRESS,
    })
    const json = cvToJSON(result)
    const val  = json?.value?.value ?? json?.value ?? {}
    return {
      totalStaked: Number(val?.['total-staked']?.value ?? 0) / DECIMALS,
      totalVaults: Number(val?.['total-vaults']?.value ?? 0),
    }
  } catch { return { totalStaked: 0, totalVaults: 0 } }
}

const MULT_COLOR: Record<number, string> = {
  3: '#00ff9f', 2: '#00d4ff', 1.5: '#ff00ff', 1: 'rgba(255,255,255,0.4)'
}
const MULT_LABEL: Record<number, string> = {
  3: '3x // 14D_LOCK', 2: '2x // 7D_LOCK', 1.5: '1.5x // 3.5D_LOCK', 1: '1x // NO_LOCK'
}

export function StakingStats({ address }: StakingStatsProps) {
  const [vault,       setVault]       = useState<VaultInfo | null>(null)
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null)
  const [loading,     setLoading]     = useState(true)

  const fetchData = useCallback(async () => {
    if (!address) return
    try {
      const [vaultData, stats] = await Promise.all([
        fetchVault(address),
        fetchGlobalStats(),
      ])
      setVault(vaultData)
      setGlobalStats(stats)
    } catch (e) {
      console.error('StakingStats fetchData:', e)
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30_000)
    return () => clearInterval(t)
  }, [fetchData])

  const BASE_APY      = 12.5
  const effectiveApy  = BASE_APY * (vault?.multiplier || 1)
  const dailyRewards  = vault?.amount ? (vault.amount * effectiveApy) / 365 / 100 : 0
  const multColor     = MULT_COLOR[vault?.multiplier || 1] ?? 'rgba(255,255,255,0.4)'

  if (loading) return (
    <div style={{ ...MONO, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{ height: '60px', background: 'rgba(255,255,255,0.04)', borderRadius: '10px' }} />
      ))}
    </div>
  )

  return (
    <div style={{ ...MONO, color: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '12px' }}>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: '12px', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)' }} />
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>YOUR_STAKE</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#00d4ff' }}>
            {vault?.amount ? (vault.amount >= 1000 ? `${(vault.amount/1000).toFixed(1)}K` : vault.amount.toFixed(2)) : '0'}
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>$B2S</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,255,159,0.15)', borderRadius: '12px', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,255,159,0.4), transparent)' }} />
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>DAILY_REWARDS</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#00ff9f' }}>
            {dailyRewards > 0 ? dailyRewards.toFixed(4) : '—'}
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', marginTop: '2px' }}>$B2S / DAY</div>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${multColor}22`, borderRadius: '12px', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${multColor}40, transparent)` }} />
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>
            {vault?.multiplier && vault.multiplier > 1 ? 'EFFECTIVE_APY' : 'BASE_APY'}
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: multColor }}>{effectiveApy.toFixed(1)}%</div>
          <div style={{ fontSize: '9px', color: multColor, marginTop: '2px', opacity: 0.7 }}>
            {MULT_LABEL[vault?.multiplier || 1] ?? '1x // NO_LOCK'}
          </div>
        </div>
      </div>

      {globalStats && (globalStats.totalStaked > 0 || globalStats.totalVaults > 0) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '10px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
            TVL: <span style={{ color: '#00ff9f' }}>
              {globalStats.totalStaked >= 1_000_000
                ? `${(globalStats.totalStaked/1_000_000).toFixed(1)}M`
                : globalStats.totalStaked >= 1000
                ? `${(globalStats.totalStaked/1000).toFixed(1)}K`
                : globalStats.totalStaked.toFixed(0)} $B2S
            </span>
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
            STAKERS: <span style={{ color: '#00d4ff' }}>{globalStats.totalVaults}</span>
          </span>
          <a href={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${STAKING_CONTRACT}?chain=mainnet`}
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: '9px', color: '#ff00ff', letterSpacing: '0.1em', textDecoration: 'none' }}>
            EXPLORER ↗
          </a>
        </div>
      )}

      {!vault?.amount && (
        <div style={{ padding: '10px 14px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderLeft: '3px solid rgba(0,212,255,0.5)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ color: '#00d4ff' }}>TIP</span> — Stake $B2S to earn up to{' '}
          <span style={{ color: '#00ff9f', fontWeight: 700 }}>37.5% APY</span> with 14-day lock.
        </div>
      )}
    </div>
  )
}