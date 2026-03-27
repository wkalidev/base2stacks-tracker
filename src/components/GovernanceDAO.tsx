'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'
import {
  callReadOnlyFunction, cvToJSON,
  uintCV, standardPrincipalCV, boolCV,
  stringUtf8CV, stringAsciiCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions'
import { openContractCall } from '@stacks/connect'
import { StacksMainnet } from '@stacks/network'

const network          = new StacksMainnet()
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const GOV_CONTRACT     = 'b2s-governance'
const STAKING_CONTRACT = 'b2s-staking-vault-v2'
const hiroUrl = (p: string) => `/api/hiro?path=${encodeURIComponent(p)}`
const DECIMALS         = 1_000_000
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

interface Proposal {
  id:          number
  title:       string
  description: string
  category:    string
  yesVotes:    number
  noVotes:     number
  endBlock:    number
  status:      'active' | 'passed' | 'failed' | 'executed'
  proposer:    string
}

const CAT_COLOR: Record<string, string> = {
  economic:  '#00ff9f',
  security:  '#ff4444',
  technical: '#00d4ff',
  community: '#ff00ff',
  general:   '#ffd700',
}

const STATUS_COLOR: Record<string, string> = {
  active:   '#00ff9f',
  passed:   '#00d4ff',
  executed: '#ff00ff',
  failed:   '#ff4444',
}

async function fetchCurrentBlock(): Promise<number> {
  try {
    const r = await fetch(`${hiroUrl(`/extended/v1/block?limit=1`)}`)
    const d = await r.json()
    return d.results?.[0]?.height || 0
  } catch { return 0 }
}

async function fetchProposalsFromTxs(): Promise<Proposal[]> {
  try {
    const res  = await fetch(
      `${hiroUrl(`/extended/v1/address/${CONTRACT_ADDRESS}.${GOV_CONTRACT}/transactions?limit=50`)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return []
    const data = await res.json()
    const proposals: Proposal[] = []
    let id = 1

    for (const tx of data.results || []) {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.function_name === 'create-proposal' && tx.tx_status === 'success') {
        const args = tx.contract_call?.function_args || []
        proposals.push({
          id:          id++,
          title:       args[0]?.repr?.replace(/^u?"/, '').replace(/"$/, '') || `Proposal #${id}`,
          description: args[1]?.repr?.replace(/^u?"/, '').replace(/"$/, '') || '',
          category:    args[2]?.repr?.replace(/^"/, '').replace(/"$/, '')   || 'general',
          endBlock:    args[3]?.repr ? parseInt(args[3].repr.replace('u', '')) : 0,
          yesVotes: 0, noVotes: 0, status: 'active',
          proposer: tx.sender_address,
        })
      }
    }
    return proposals
  } catch { return [] }
}

async function fetchVotesForProposal(proposalId: number): Promise<{ yes: number; no: number }> {
  try {
    const res  = await fetch(
      `${hiroUrl(`/extended/v1/address/${CONTRACT_ADDRESS}.${GOV_CONTRACT}/transactions?limit=50`)}`,
      { headers: { Accept: 'application/json' } }
    )
    if (!res.ok) return { yes: 0, no: 0 }
    const data = await res.json()
    let yes = 0, no = 0

    for (const tx of data.results || []) {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.function_name === 'vote' && tx.tx_status === 'success') {
        const args       = tx.contract_call?.function_args || []
        const txPropId   = args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) : -1
        if (txPropId === proposalId) { args[1]?.repr === 'true' ? yes++ : no++ }
      }
    }
    return { yes, no }
  } catch { return { yes: 0, no: 0 } }
}

export default function GovernanceDAO() {
  const { address, isConnected } = useWallet()
  const [proposals,       setProposals]       = useState<Proposal[]>([])
  const [loading,         setLoading]         = useState(true)
  const [votingLoading,   setVotingLoading]   = useState<Record<number, boolean>>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [votingPower,     setVotingPower]     = useState(0)
  const [currentBlock,    setCurrentBlock]    = useState(0)
  const [txIds,           setTxIds]           = useState<Record<number, string>>({})
  const [userVotes,       setUserVotes]       = useState<Record<number, boolean>>({})
  const [newProposal,     setNewProposal]     = useState({ title: '', description: '', category: 'economic', days: '7' })
  const [error,           setError]           = useState<string | null>(null)
  const [lastUpdated,     setLastUpdated]     = useState<Date | null>(null)
  const [filter,          setFilter]          = useState<'all' | 'active' | 'passed' | 'failed'>('all')

  const fetchVotingPower = useCallback(async () => {
    if (!address) return
    try {
      const result = await callReadOnlyFunction({
        network, contractAddress: CONTRACT_ADDRESS, contractName: STAKING_CONTRACT,
        functionName: 'get-vault', functionArgs: [standardPrincipalCV(address)], senderAddress: address,
      })
      setVotingPower(Number(cvToJSON(result)?.value?.value?.amount?.value || 0) / DECIMALS)
    } catch { setVotingPower(0) }
  }, [address])

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError(null)
      const [block, raw] = await Promise.all([fetchCurrentBlock(), fetchProposalsFromTxs()])
      setCurrentBlock(block)
      const enriched = await Promise.all(raw.map(async p => {
        const votes   = await fetchVotesForProposal(p.id)
        const expired = block > p.endBlock && p.endBlock > 0
        const status: Proposal['status'] = expired ? (votes.yes > votes.no ? 'passed' : 'failed') : 'active'
        return { ...p, yesVotes: votes.yes, noVotes: votes.no, status }
      }))
      setProposals(enriched); setLastUpdated(new Date())
    } catch { setError('RPC_ERROR: failed to load governance data') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadData(); const t = setInterval(loadData, 120_000); return () => clearInterval(t) }, [loadData])
  useEffect(() => { if (address) fetchVotingPower() }, [address, fetchVotingPower])

  const handleVote = async (proposalId: number, voteYes: boolean) => {
    if (!address) return
    setVotingLoading(prev => ({ ...prev, [proposalId]: true }))
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: GOV_CONTRACT,
        functionName: 'vote', functionArgs: [uintCV(proposalId), boolCV(voteYes)],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (d) => {
          setTxIds(prev => ({ ...prev, [proposalId]: d.txId }))
          setUserVotes(prev => ({ ...prev, [proposalId]: true }))
          setVotingLoading(prev => ({ ...prev, [proposalId]: false }))
          setTimeout(loadData, 5000)
        },
        onCancel: () => setVotingLoading(prev => ({ ...prev, [proposalId]: false })),
      })
    } catch { setVotingLoading(prev => ({ ...prev, [proposalId]: false })) }
  }

  const handleCreateProposal = async () => {
    if (!address || !newProposal.title) return
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: GOV_CONTRACT,
        functionName: 'create-proposal',
        functionArgs: [
          stringUtf8CV(newProposal.title),
          stringUtf8CV(newProposal.description),
          stringAsciiCV(newProposal.category),
          uintCV(parseInt(newProposal.days) * 144),
        ],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: () => { setShowCreateModal(false); setNewProposal({ title: '', description: '', category: 'economic', days: '7' }); setTimeout(loadData, 5000) },
        onCancel: () => {},
      })
    } catch (err) { console.error('createProposal:', err) }
  }

  const filtered = filter === 'all' ? proposals : proposals.filter(p => p.status === filter)

  if (!isConnected) return (
    <div style={{ ...MONO, background: 'rgba(255,0,255,0.03)', border: '1px solid rgba(255,0,255,0.15)', borderRadius: '16px', padding: '48px', textAlign: 'center' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>🏛️</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px', letterSpacing: '0.1em' }}>WALLET_NOT_CONNECTED</div>
      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>Connect to participate in B2S governance</div>
    </div>
  )

  return (
    <div style={{ ...MONO, color: '#fff' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ff00ff', boxShadow: '0 0 8px #ff00ff', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: '10px', letterSpacing: '0.3em', color: '#ff00ff' }}>GOVERNANCE_DAO // ON-CHAIN</span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, marginBottom: '2px' }}>PROTOCOL_VOTING</div>
          {lastUpdated && (
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
              LAST_SYNC: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={loadData} style={{ ...MONO, padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px' }}>⟳</button>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={votingPower < 10000}
            title={votingPower < 10000 ? 'Need 10,000 $B2S staked' : ''}
            style={{ ...MONO, padding: '8px 16px', background: 'rgba(255,0,255,0.12)', border: '1px solid rgba(255,0,255,0.3)', borderRadius: '10px', color: '#ff00ff', cursor: votingPower >= 10000 ? 'pointer' : 'not-allowed', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', opacity: votingPower < 10000 ? 0.5 : 1 }}
          >
            + CREATE_PROPOSAL
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'VOTING_POWER', val: `${votingPower >= 1000 ? `${(votingPower/1000).toFixed(1)}K` : votingPower.toFixed(0)} $B2S`, color: '#ff00ff', warn: votingPower < 10000 },
          { label: 'BLOCK_HEIGHT', val: `#${currentBlock.toLocaleString()}`,   color: '#00d4ff', warn: false },
          { label: 'PROPOSALS',    val: String(proposals.length),               color: '#00ff9f', warn: false },
          { label: 'ACTIVE',       val: String(proposals.filter(p => p.status === 'active').length), color: '#ffd700', warn: false },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 14px', background: `${s.color}06`, border: `1px solid ${s.color}18`, borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
            <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: s.color }}>{s.val}</div>
            {s.warn && <div style={{ fontSize: '8px', color: '#ffd700', marginTop: '2px', letterSpacing: '0.1em' }}>⚠ NEED 10K TO PROPOSE</div>}
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', width: 'fit-content', marginBottom: '16px' }}>
        {(['all', 'active', 'passed', 'failed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...MONO,
            padding: '6px 14px', borderRadius: '8px', fontSize: '10px',
            fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer', border: 'none',
            background: filter === f ? 'rgba(255,0,255,0.12)' : 'transparent',
            color:      filter === f ? '#ff00ff' : 'rgba(255,255,255,0.3)',
            transition: 'all 0.15s',
          }}>
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)', borderRadius: '10px', fontSize: '11px', color: '#ff4444', marginBottom: '12px' }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>🗳️</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px', letterSpacing: '0.1em' }}>
            {filter === 'all' ? 'NO_PROPOSALS_FOUND' : `NO_${filter.toUpperCase()}_PROPOSALS`}
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>
            Requires 10,000 $B2S staked in b2s-staking-vault-v2
          </div>
        </div>
      )}

      {/* Proposals */}
      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(p => {
            const total      = p.yesVotes + p.noVotes
            const yesPct     = total > 0 ? (p.yesVotes / total) * 100 : 50
            const blocksLeft = p.endBlock - currentBlock
            const daysLeft   = blocksLeft > 0 ? (blocksLeft / 144).toFixed(1) : '0'
            const catColor   = CAT_COLOR[p.category]  || '#ffffff'
            const stColor    = STATUS_COLOR[p.status] || '#ffffff'
            const quorum     = total >= 20

            return (
              <div key={p.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${stColor}18`, borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: `linear-gradient(90deg, transparent, ${stColor}50, transparent)` }} />

                <div style={{ padding: '18px 20px' }}>
                  {/* Header badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <span style={{ ...MONO, fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>#{String(p.id).padStart(3, '0')}</span>
                    <span style={{ fontSize: '8px', letterSpacing: '0.15em', padding: '2px 8px', borderRadius: '10px', background: `${stColor}15`, border: `1px solid ${stColor}30`, color: stColor }}>
                      {p.status.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '8px', letterSpacing: '0.12em', padding: '2px 8px', borderRadius: '10px', background: `${catColor}10`, border: `1px solid ${catColor}25`, color: catColor }}>
                      {p.category.toUpperCase()}
                    </span>
                    {blocksLeft > 0 && (
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>⏱ {daysLeft}d left</span>
                    )}
                    {!quorum && (
                      <span style={{ fontSize: '8px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', color: '#ffd700', letterSpacing: '0.1em' }}>
                        NO_QUORUM
                      </span>
                    )}
                  </div>

                  {/* Title + description */}
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px', letterSpacing: '0.02em' }}>{p.title}</div>
                  {p.description && (
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px', lineHeight: 1.6 }}>{p.description}</div>
                  )}
                  <a href={`https://explorer.hiro.so/address/${p.proposer}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textDecoration: 'none' }}>
                    BY: {p.proposer.slice(0, 8)}···{p.proposer.slice(-4)}
                  </a>

                  {/* Vote bar */}
                  <div style={{ marginTop: '14px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#00ff9f', letterSpacing: '0.1em' }}>YES {p.yesVotes} [{yesPct.toFixed(1)}%]</span>
                      <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)' }}>{total} VOTES</span>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#ff4444', letterSpacing: '0.1em' }}>[{(100-yesPct).toFixed(1)}%] {p.noVotes} NO</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ display: 'flex', height: '100%' }}>
                        <div style={{ width: `${yesPct}%`, background: 'linear-gradient(90deg, #00ff9f, #00d4ff)', transition: 'width 0.7s ease' }} />
                        <div style={{ width: `${100-yesPct}%`, background: 'linear-gradient(90deg, #ff6644, #ff4444)', transition: 'width 0.7s ease' }} />
                      </div>
                    </div>
                  </div>

                  {/* Vote buttons */}
                  {p.status === 'active' && !userVotes[p.id] && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { label: '✓ VOTE_YES', vote: true,  color: '#00ff9f' },
                        { label: '✗ VOTE_NO',  vote: false, color: '#ff4444' },
                      ].map(btn => (
                        <button key={String(btn.vote)} onClick={() => handleVote(p.id, btn.vote)}
                          disabled={!!votingLoading[p.id] || votingPower === 0}
                          style={{
                            ...MONO,
                            padding: '10px', borderRadius: '10px', fontSize: '10px',
                            fontWeight: 700, letterSpacing: '0.12em', cursor: 'pointer',
                            background: `${btn.color}10`, border: `1px solid ${btn.color}35`, color: btn.color,
                            opacity: votingPower === 0 ? 0.3 : 1, transition: 'all 0.15s',
                          }}>
                          {votingLoading[p.id] ? '⏳ PENDING...' : btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {userVotes[p.id] && (
                    <div style={{ textAlign: 'center', padding: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', color: '#00ff9f' }}>
                      ✓ VOTE_RECORDED_ON-CHAIN
                    </div>
                  )}

                  {votingPower === 0 && p.status === 'active' && !userVotes[p.id] && (
                    <div style={{ textAlign: 'center', padding: '8px', fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
                      STAKE_$B2S_TO_GAIN_VOTING_POWER
                    </div>
                  )}

                  {txIds[p.id] && (
                    <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(0,255,159,0.05)', border: '1px solid rgba(0,255,159,0.2)', borderRadius: '8px' }}>
                      <a href={`https://explorer.hiro.so/txid/${txIds[p.id]}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '9px', color: '#00ff9f', letterSpacing: '0.1em', textDecoration: 'none' }}>
                        ✓ TX_SUBMITTED → VIEW_EXPLORER ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}
          onClick={() => setShowCreateModal(false)}>
          <div style={{ ...MONO, width: '100%', maxWidth: '520px', background: '#080b12', border: '1px solid rgba(255,0,255,0.25)', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,0,255,0.8), transparent)' }} />

            <div style={{ padding: '24px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: '#ff00ff', marginBottom: '4px' }}>CREATE_PROPOSAL // REQUIRES 10K $B2S</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '20px' }}>NEW_GOVERNANCE_PROPOSAL</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>TITLE</div>
                  <input type="text" value={newProposal.title} onChange={e => setNewProposal(p => ({ ...p, title: e.target.value }))}
                    placeholder="Adjust fee structure v2..."
                    style={{ ...MONO, width: '100%', padding: '10px 14px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '14px', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,0,255,0.4)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>DESCRIPTION</div>
                  <textarea rows={3} value={newProposal.description} onChange={e => setNewProposal(p => ({ ...p, description: e.target.value }))}
                    placeholder="Detailed proposal description..."
                    style={{ ...MONO, width: '100%', padding: '10px 14px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none' }}
                    onFocus={e => e.target.style.borderColor = 'rgba(255,0,255,0.4)'}
                    onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>CATEGORY</div>
                    <select value={newProposal.category} onChange={e => setNewProposal(p => ({ ...p, category: e.target.value }))}
                      style={{ ...MONO, width: '100%', padding: '10px 14px', boxSizing: 'border-box', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '12px', outline: 'none' }}>
                      {Object.keys(CAT_COLOR).map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', marginBottom: '6px' }}>DURATION</div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['7', '14', '30'].map(d => (
                        <button key={d} onClick={() => setNewProposal(p => ({ ...p, days: d }))} style={{
                          ...MONO,
                          flex: 1, padding: '10px 4px', borderRadius: '8px', fontSize: '11px',
                          fontWeight: 700, cursor: 'pointer', border: 'none',
                          background: newProposal.days === d ? 'rgba(255,0,255,0.15)' : 'rgba(255,255,255,0.04)',
                          outline: newProposal.days === d ? '1px solid rgba(255,0,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                          color: newProposal.days === d ? '#ff00ff' : 'rgba(255,255,255,0.3)',
                        }}>
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowCreateModal(false)} style={{ ...MONO, flex: 1, padding: '12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}>
                  CANCEL
                </button>
                <button onClick={handleCreateProposal} disabled={!newProposal.title} style={{ ...MONO, flex: 1, padding: '12px', borderRadius: '10px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', cursor: 'pointer', background: 'rgba(255,0,255,0.15)', border: '1px solid rgba(255,0,255,0.4)', color: '#ff00ff', opacity: !newProposal.title ? 0.4 : 1 }}>
                  DEPLOY_PROPOSAL 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}