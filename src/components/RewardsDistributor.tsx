'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import {
  callReadOnlyFunction, cvToJSON,
  standardPrincipalCV, uintCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const CONTRACT_NAME    = 'b2s-rewards-distributor'
const DECIMALS         = 1_000_000
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

const LOCK_OPTIONS = [
  { label: 'NO_LOCK',   blocks: 0,    apy: 12.5,  color: 'rgba(255,255,255,0.4)', mult: '1x'   },
  { label: '3.5D_LOCK', blocks: 525,  apy: 18.75, color: '#ff00ff',              mult: '1.5x' },
  { label: '7D_LOCK',   blocks: 1050, apy: 25,    color: '#00d4ff',              mult: '2x'   },
  { label: '14D_LOCK',  blocks: 2100, apy: 37.5,  color: '#00ff9f',              mult: '3x'   },
]

export default function RewardsDistributor() {
  const { address, isConnected } = useWallet()
  const [stakedAmount,   setStakedAmount]   = useState(0)
  const [pendingRewards, setPendingRewards] = useState(0)
  const [totalEarned,    setTotalEarned]    = useState(0)
  const [stakeInput,     setStakeInput]     = useState('')
  const [lockOption,     setLockOption]     = useState(LOCK_OPTIONS[0])
  const [loading,        setLoading]        = useState(false)
  const [txId,           setTxId]           = useState<string | null>(null)
  const [txType,         setTxType]         = useState('')
  const [error,          setError]          = useState<string | null>(null)

  const fetchStakerInfo = useCallback(async () => {
    if (!address) return
    try {
      const infoResult = await callReadOnlyFunction({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'get-staker-info',
        functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      })
      const json = cvToJSON(infoResult)
      const info = json?.value?.value
      if (info) {
        setStakedAmount(Number(info['staked-amount']?.value ?? 0) / DECIMALS)
        setTotalEarned(Number(info['total-rewards-earned']?.value ?? 0) / DECIMALS)
      } else {
        setStakedAmount(0)
        setTotalEarned(0)
      }

      const rewardsResult = await callReadOnlyFunction({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName: 'get-pending-rewards',
        functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      })
      const pending = cvToJSON(rewardsResult)
      setPendingRewards(Number(pending?.value?.value ?? pending?.value ?? 0) / DECIMALS)
    } catch (e) {
      console.error('fetchStakerInfo:', e)
    }
  }, [address])

  useEffect(() => {
    if (address && isConnected) fetchStakerInfo()
  }, [address, isConnected, fetchStakerInfo])

  const callContract = async (functionName: string, args: any[], type: string) => {
    if (!address) return
    setLoading(true); setTxId(null); setError(null); setTxType(type)
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: CONTRACT_NAME,
        functionName,
        functionArgs: args,
        postConditionMode: PostConditionMode.Allow,
        anchorMode:        AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId)
          setStakeInput('')
          setLoading(false)
          setTimeout(fetchStakerInfo, 5000)
        },
        onCancel: () => setLoading(false),
      })
    } catch (err: any) {
      setError(err?.message ?? `${type} failed`)
      setLoading(false)
    }
  }

  const handleStake = () => {
    const amount = parseFloat(stakeInput)
    if (!amount || amount <= 0) return
    callContract('stake', [
      uintCV(Math.floor(amount * DECIMALS)),
      uintCV(lockOption.blocks),
    ], 'STAKE')
  }

  const handleUnstake = () => {
    const amount = parseFloat(stakeInput)
    if (!amount || amount <= 0 || amount > stakedAmount) return
    callContract('unstake', [uintCV(Math.floor(amount * DECIMALS))], 'UNSTAKE')
  }

  const handleClaim = () => {
    if (pendingRewards === 0) return
    callContract('claim-rewards', [], 'CLAIM')
  }

  if (!isConnected) return (
    <div style={{ ...MONO, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
      <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: 'rgba(255,255,255,0.3)' }}>CONNECT_WALLET_TO_ACCESS_REWARDS</div>
    </div>
  )

  const inputAmount = parseFloat(stakeInput) || 0
  const canStake    = inputAmount > 0 && !loading
  const canUnstake  = inputAmount > 0 && inputAmount <= stakedAmount && !loading
  const canClaim    = pendingRewards > 0 && !loading

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '11px', letterSpacing: '0.25em', color: '#00ff9f', marginBottom: '2px' }}>REWARDS_DISTRIBUTOR</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>CONTRACT: {CONTRACT_NAME}</div>
        </div>
        <button onClick={fetchStakerInfo} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: '6px 10px', fontSize: '14px' }}>⟳</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'STAKED',          value: `${stakedAmount.toFixed(2)} $B2S`,   color: '#00d4ff' },
          { label: 'PENDING_REWARDS', value: `${pendingRewards.toFixed(6)} $B2S`, color: '#00ff9f' },
          { label: 'TOTAL_EARNED',    value: `${totalEarned.toFixed(2)} $B2S`,    color: '#ff00ff' },
          { label: 'APY',             value: `${lockOption.apy}%`,               color: lockOption.color },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${s.color}20`, borderRadius: '12px', padding: '14px 16px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
            <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <button onClick={handleClaim} disabled={!canClaim} style={{
        width: '100%', padding: '14px', borderRadius: '12px', marginBottom: '16px',
        fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em',
        cursor: canClaim ? 'pointer' : 'not-allowed',
        border:  canClaim ? '1px solid rgba(0,255,159,0.4)' : '1px solid rgba(255,255,255,0.06)',
        background: canClaim ? 'rgba(0,255,159,0.08)' : 'rgba(255,255,255,0.02)',
        color:   canClaim ? '#00ff9f' : 'rgba(255,255,255,0.2)',
        transition: 'all 0.2s', ...MONO,
      }}>
        {loading && txType === 'CLAIM' ? '⏳ CLAIMING_REWARDS...' : `▶ CLAIM_REWARDS // ${pendingRewards.toFixed(4)} $B2S`}
      </button>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
        <div style={{ fontSize: '10px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '12px' }}>MANAGE_STAKING</div>

        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <input type="number" value={stakeInput} onChange={e => setStakeInput(e.target.value)}
            placeholder="0.0" disabled={loading}
            style={{ ...MONO, width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '20px', fontWeight: 700, padding: '12px 60px 12px 16px', outline: 'none', boxSizing: 'border-box' }} />
          <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>$B2S</span>
        </div>

        {/* Lock period selector */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>LOCK_PERIOD // APY_MULTIPLIER</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
            {LOCK_OPTIONS.map(opt => (
              <button key={opt.blocks} onClick={() => setLockOption(opt)} style={{
                ...MONO, padding: '8px 4px', borderRadius: '8px', fontSize: '9px',
                fontWeight: lockOption.blocks === opt.blocks ? 700 : 400,
                letterSpacing: '0.08em', cursor: 'pointer', transition: 'all 0.2s',
                border:  lockOption.blocks === opt.blocks ? `1px solid ${opt.color}80` : '1px solid rgba(255,255,255,0.06)',
                background: lockOption.blocks === opt.blocks ? `${opt.color}15` : 'rgba(255,255,255,0.02)',
                color: lockOption.blocks === opt.blocks ? opt.color : 'rgba(255,255,255,0.3)',
              }}>
                <div>{opt.mult}</div>
                <div style={{ fontSize: '8px', marginTop: '2px' }}>{opt.apy}%</div>
                <div style={{ fontSize: '7px', opacity: 0.7, marginTop: '1px' }}>{opt.label}</div>
              </button>
            ))}
          </div>
        </div>

        {inputAmount > stakedAmount && inputAmount > 0 && (
          <div style={{ fontSize: '10px', color: '#ff4444', marginBottom: '10px', letterSpacing: '0.1em' }}>⚠ MAX_UNSTAKE: {stakedAmount.toFixed(2)} $B2S</div>
        )}

        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginBottom: '12px', letterSpacing: '0.1em' }}>
          STAKED_BALANCE: {stakedAmount.toFixed(2)} $B2S
          {stakedAmount > 0 && (
            <button onClick={() => setStakeInput(stakedAmount.toString())}
              style={{ marginLeft: '8px', background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontSize: '10px', ...MONO }}>
              MAX
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={handleStake} disabled={!canStake} style={{
            ...MONO, padding: '12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
            cursor: canStake ? 'pointer' : 'not-allowed',
            border:  canStake ? '1px solid rgba(0,212,255,0.4)' : '1px solid rgba(255,255,255,0.06)',
            background: canStake ? 'rgba(0,212,255,0.08)' : 'rgba(255,255,255,0.02)',
            color:   canStake ? '#00d4ff' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s',
          }}>
            {loading && txType === 'STAKE' ? '⏳ STAKING...' : '▲ STAKE'}
          </button>
          <button onClick={handleUnstake} disabled={!canUnstake} style={{
            ...MONO, padding: '12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
            cursor: canUnstake ? 'pointer' : 'not-allowed',
            border:  canUnstake ? '1px solid rgba(255,0,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
            background: canUnstake ? 'rgba(255,0,255,0.06)' : 'rgba(255,255,255,0.02)',
            color:   canUnstake ? '#ff00ff' : 'rgba(255,255,255,0.2)', transition: 'all 0.2s',
          }}>
            {loading && txType === 'UNSTAKE' ? '⏳ UNSTAKING...' : '▼ UNSTAKE'}
          </button>
        </div>
      </div>

      <div style={{ padding: '12px 16px', background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.12)', borderLeft: '3px solid rgba(0,212,255,0.5)', borderRadius: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: '12px' }}>
        <span style={{ color: '#00d4ff' }}>APY_INFO</span> — Base: 12.5% · Lock 14d for 3x multiplier (37.5%) · Min stake: 1 $B2S
      </div>

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '8px', fontSize: '11px', color: '#ff4444', ...MONO, marginBottom: '10px' }}>
          ERR: {error}
        </div>
      )}

      {txId && !error && (
        <div style={{ padding: '12px 16px', background: 'rgba(0,255,159,0.06)', border: '1px solid rgba(0,255,159,0.2)', borderRadius: '10px', fontSize: '11px', ...MONO }}>
          <div style={{ color: '#00ff9f', fontWeight: 700, marginBottom: '4px' }}>✓ {txType}_SUBMITTED</div>
          <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
            style={{ color: '#00d4ff', wordBreak: 'break-all' }}>
            {txId.slice(0, 20)}...{txId.slice(-8)} ↗
          </a>
        </div>
      )}
    </div>
  )
}