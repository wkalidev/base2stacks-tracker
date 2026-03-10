'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV, PostConditionMode, AnchorMode } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const GOV_CONTRACT     = 'b2s-governance';
const STAKING_CONTRACT = 'b2s-staking-vault-v2';
const HIRO_API         = 'https://api.mainnet.hiro.so';
const DECIMALS         = 1_000_000;

interface Proposal {
  id: number; title: string; description: string; category: string;
  yesVotes: number; noVotes: number; endBlock: number;
  status: 'active' | 'passed' | 'failed' | 'executed';
  proposer: string;
}

const CAT_COLOR: Record<string, string> = {
  economic:  '#00ff9f',
  security:  '#ff4444',
  technical: '#00d4ff',
  community: '#ff00ff',
  general:   '#ffff00',
}

const STATUS_COLOR: Record<string, string> = {
  active:   '#00ff9f',
  passed:   '#00d4ff',
  executed: '#ff00ff',
  failed:   '#ff4444',
}

async function fetchCurrentBlock(): Promise<number> {
  try { const r = await fetch(`${HIRO_API}/extended/v1/block?limit=1`); const d = await r.json(); return d.results?.[0]?.height || 0 }
  catch { return 0 }
}

async function fetchProposalsFromTxs(): Promise<Proposal[]> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${GOV_CONTRACT}/transactions?limit=50`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return []
    const data = await res.json()
    const proposals: Proposal[] = []; let id = 1
    for (const tx of data.results || []) {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.function_name === 'create-proposal' && tx.tx_status === 'success') {
        const args = tx.contract_call?.function_args || []
        proposals.push({
          id: id++,
          title: args[0]?.repr?.replace(/^u?"/, '').replace(/"$/, '') || `Proposal #${id}`,
          description: args[1]?.repr?.replace(/^u?"/, '').replace(/"$/, '') || '',
          category: args[2]?.repr?.replace(/^"/, '').replace(/"$/, '') || 'general',
          endBlock: args[3]?.repr ? parseInt(args[3].repr.replace('u', '')) : 0,
          yesVotes: 0, noVotes: 0, status: 'active', proposer: tx.sender_address,
        })
      }
    }
    return proposals
  } catch { return [] }
}

async function fetchVotesForProposal(proposalId: number): Promise<{ yes: number; no: number }> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${GOV_CONTRACT}/transactions?limit=50`, { headers: { Accept: 'application/json' } })
    if (!res.ok) return { yes: 0, no: 0 }
    const data = await res.json()
    let yes = 0, no = 0
    for (const tx of data.results || []) {
      if (tx.tx_type === 'contract_call' && tx.contract_call?.function_name === 'vote' && tx.tx_status === 'success') {
        const args = tx.contract_call?.function_args || []
        if (args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) === proposalId : false)
          args[1]?.repr === 'true' ? yes++ : no++
      }
    }
    return { yes, no }
  } catch { return { yes: 0, no: 0 } }
}

export default function GovernanceDAO() {
  const { address, isConnected } = useWallet();
  const [proposals, setProposals]     = useState<Proposal[]>([]);
  const [loading, setLoading]         = useState(true);
  const [votingLoading, setVotingLoading] = useState<Record<number, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votingPower, setVotingPower] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [txIds, setTxIds]             = useState<Record<number, string>>({});
  const [userVotes, setUserVotes]     = useState<Record<number, boolean>>({});
  const [newProposal, setNewProposal] = useState({ title: '', description: '', category: 'economic', days: '7' });
  const [error, setError]             = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchVotingPower = useCallback(async () => {
    if (!address) return;
    try {
      const result = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: STAKING_CONTRACT, functionName: 'get-vault', functionArgs: [standardPrincipalCV(address)], senderAddress: address });
      const json = cvToJSON(result);
      setVotingPower(Number(json?.value?.value?.amount?.value || 0) / DECIMALS);
    } catch { setVotingPower(0); }
  }, [address]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const [block, raw] = await Promise.all([fetchCurrentBlock(), fetchProposalsFromTxs()]);
      setCurrentBlock(block);
      const enriched = await Promise.all(raw.map(async p => {
        const votes = await fetchVotesForProposal(p.id);
        const expired = block > p.endBlock && p.endBlock > 0;
        return { ...p, yesVotes: votes.yes, noVotes: votes.no, status: expired ? (votes.yes > votes.no ? 'passed' : 'failed') : 'active' as Proposal['status'] };
      }));
      setProposals(enriched); setLastUpdated(new Date());
    } catch { setError('RPC_ERROR: failed to load governance data'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); const t = setInterval(loadData, 120_000); return () => clearInterval(t); }, [loadData]);
  useEffect(() => { if (address) fetchVotingPower(); }, [address, fetchVotingPower]);

  const handleVote = async (proposalId: number, voteYes: boolean) => {
    if (!address) return;
    setVotingLoading(p => ({ ...p, [proposalId]: true }));
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: GOV_CONTRACT,
        functionName: 'vote', functionArgs: [uintCV(proposalId), { type: 13, value: voteYes } as any],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (d) => { setTxIds(p => ({ ...p, [proposalId]: d.txId })); setUserVotes(p => ({ ...p, [proposalId]: true })); setVotingLoading(p => ({ ...p, [proposalId]: false })); setTimeout(loadData, 5000); },
        onCancel: () => setVotingLoading(p => ({ ...p, [proposalId]: false })),
      });
    } catch { setVotingLoading(p => ({ ...p, [proposalId]: false })); }
  };

  const handleCreateProposal = async () => {
    if (!address || !newProposal.title) return;
    try {
      const { stringUtf8CV, stringAsciiCV } = await import('@stacks/transactions');
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: GOV_CONTRACT,
        functionName: 'create-proposal',
        functionArgs: [stringUtf8CV(newProposal.title), stringUtf8CV(newProposal.description), stringAsciiCV(newProposal.category), uintCV(parseInt(newProposal.days) * 144)],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: () => { setShowCreateModal(false); setNewProposal({ title: '', description: '', category: 'economic', days: '7' }); setTimeout(loadData, 5000); },
        onCancel: () => {},
      });
    } catch (err) { console.error(err); }
  };

  const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" };

  if (!isConnected) return (
    <div style={MONO} className="rounded-2xl border border-[#ff00ff]/20 bg-black/70 p-10 text-center">
      <p className="text-5xl mb-4">🏛️</p>
      <p className="text-white font-black tracking-widest mb-1">WALLET_NOT_CONNECTED</p>
      <p className="text-white/30 text-xs tracking-wider">Connect to participate in B2S governance</p>
    </div>
  );

  return (
    <div style={MONO} className="space-y-5">

      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[#ff00ff]/20 bg-black/70 p-5">
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,0,255,0.01) 3px,rgba(255,0,255,0.01) 4px)' }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff00ff]/60 to-transparent" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#ff00ff] animate-pulse" style={{ boxShadow: '0 0 8px #ff00ff' }} />
              <span className="text-[#ff00ff] text-[10px] tracking-[0.3em] font-black">GOVERNANCE DAO // ON-CHAIN</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">PROTOCOL VOTING</h2>
            {lastUpdated && <p className="text-white/20 text-[10px] mt-1">LAST_SYNC: {lastUpdated.toLocaleTimeString()}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={loadData} className="p-2 rounded-xl border border-white/10 bg-white/[0.04] text-white/40 hover:text-white transition-all">⟳</button>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={votingPower < 10000}
              title={votingPower < 10000 ? 'Need 10,000 $B2S staked' : ''}
              className="px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all disabled:opacity-30"
              style={{ background: 'rgba(255,0,255,0.12)', border: '1px solid rgba(255,0,255,0.3)', color: '#ff00ff' }}
            >
              + CREATE PROPOSAL
            </button>
          </div>
        </div>
      </div>

      {/* Voting power + block */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'VOTING POWER', val: `${votingPower.toLocaleString()} $B2S`, color: '#ff00ff', warn: votingPower < 10000 },
          { label: 'BLOCK HEIGHT', val: `#${currentBlock.toLocaleString()}`, color: '#00d4ff' },
          { label: 'PROPOSALS',    val: proposals.length, color: '#00ff9f' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-white/25 text-[9px] tracking-widest mb-1">{s.label}</p>
            <p className="font-black text-lg" style={{ color: s.color, textShadow: `0 0 12px ${s.color}50` }}>{s.val}</p>
            {(s as any).warn && <p className="text-[#ffff00] text-[9px] mt-1 tracking-wider">⚠ NEED 10K B2S TO PROPOSE</p>}
          </div>
        ))}
      </div>

      {error && <div className="rounded-xl border border-[#ff4444]/30 bg-[#ff4444]/[0.06] px-4 py-3 text-[#ff4444] text-xs font-mono">⚠ {error}</div>}

      {loading && <div className="space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-32 rounded-xl border border-white/[0.05] bg-white/[0.02] animate-pulse" />)}</div>}

      {!loading && proposals.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-white/[0.07] bg-black/40">
          <p className="text-4xl mb-3">🗳️</p>
          <p className="text-white font-black tracking-widest mb-2">NO_PROPOSALS_FOUND</p>
          <p className="text-white/25 text-xs">Requires 10,000 $B2S staked in b2s-staking-vault-v2</p>
        </div>
      )}

      {/* Proposals */}
      <div className="space-y-4">
        {proposals.map(p => {
          const total = p.yesVotes + p.noVotes;
          const yesPct = total > 0 ? (p.yesVotes / total) * 100 : 50;
          const blocksLeft = p.endBlock - currentBlock;
          const daysLeft = blocksLeft > 0 ? (blocksLeft / 144).toFixed(1) : '0';
          const catColor = CAT_COLOR[p.category] || '#ffffff';
          const statusColor = STATUS_COLOR[p.status] || '#ffffff';

          return (
            <div key={p.id} className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-black/50 transition-all duration-300 hover:border-white/15">
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${statusColor}50,transparent)` }} />

              <div className="p-5">
                {/* Proposal header */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-white/30 font-black text-sm font-mono">#{String(p.id).padStart(3,'0')}</span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-widest" style={{ color: statusColor, background: `${statusColor}15`, border: `1px solid ${statusColor}30` }}>
                    {p.status.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-black tracking-widest" style={{ color: catColor, background: `${catColor}10`, border: `1px solid ${catColor}25` }}>
                    {p.category.toUpperCase()}
                  </span>
                  {blocksLeft > 0 && <span className="text-white/25 text-[10px] font-mono">⏱ {daysLeft} days</span>}
                </div>

                <h3 className="text-white font-black text-base tracking-wide mb-1">{p.title}</h3>
                {p.description && <p className="text-white/35 text-xs leading-relaxed mb-3">{p.description}</p>}
                <a href={`https://explorer.hiro.so/address/${p.proposer}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                  className="text-white/20 text-[10px] font-mono hover:text-white/50 transition-colors">
                  BY: {p.proposer.slice(0,8)}...{p.proposer.slice(-4)}
                </a>

                {/* Vote bar */}
                <div className="mt-4 mb-4">
                  <div className="flex justify-between text-[10px] font-mono mb-1.5">
                    <span style={{ color: '#00ff9f' }}>YES {p.yesVotes} [{yesPct.toFixed(1)}%]</span>
                    <span className="text-white/20">{total} TOTAL</span>
                    <span style={{ color: '#ff4444' }}>[{(100 - yesPct).toFixed(1)}%] {p.noVotes} NO</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div className="h-full rounded-l-full transition-all duration-700" style={{ width: `${yesPct}%`, background: 'linear-gradient(90deg,#00ff9f,#00d4ff)' }} />
                      <div className="h-full rounded-r-full transition-all duration-700" style={{ width: `${100 - yesPct}%`, background: 'linear-gradient(90deg,#ff6644,#ff4444)' }} />
                    </div>
                  </div>
                </div>

                {/* Vote buttons */}
                {p.status === 'active' && !userVotes[p.id] && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '✓ VOTE YES', vote: true,  color: '#00ff9f' },
                      { label: '✗ VOTE NO',  vote: false, color: '#ff4444' },
                    ].map(btn => (
                      <button key={String(btn.vote)}
                        onClick={() => handleVote(p.id, btn.vote)}
                        disabled={!!votingLoading[p.id] || votingPower === 0}
                        className="py-2.5 rounded-xl text-xs font-black tracking-widest transition-all disabled:opacity-30 hover:opacity-80"
                        style={{ background: `${btn.color}12`, border: `1px solid ${btn.color}40`, color: btn.color }}>
                        {votingLoading[p.id] ? '⏳ PENDING...' : btn.label}
                      </button>
                    ))}
                  </div>
                )}

                {userVotes[p.id] && (
                  <div className="py-2 text-center text-[10px] font-black tracking-widest" style={{ color: '#00ff9f' }}>
                    ✓ VOTE_RECORDED ON-CHAIN
                  </div>
                )}

                {votingPower === 0 && p.status === 'active' && (
                  <p className="text-white/20 text-[10px] text-center mt-2 tracking-wider">STAKE $B2S TO GAIN VOTING POWER</p>
                )}

                {txIds[p.id] && (
                  <div className="mt-3 px-3 py-2 rounded-xl border border-[#00ff9f]/20 bg-[#00ff9f]/[0.05]">
                    <a href={`https://explorer.hiro.so/txid/${txIds[p.id]}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                      className="text-[#00ff9f] text-[10px] font-mono hover:underline">
                      ✓ TX_SUBMITTED → VIEW_EXPLORER ↗
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div style={MONO} className="relative w-full max-w-xl rounded-2xl overflow-hidden border border-[#ff00ff]/20 bg-black/95">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff00ff]/60 to-transparent" />
            <div className="p-7">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#ff00ff] animate-pulse" />
                <span className="text-[#ff00ff] text-[10px] tracking-[0.3em] font-black">CREATE_PROPOSAL // REQUIRES 10K $B2S</span>
              </div>
              <h3 className="text-xl font-black text-white mb-5">NEW GOVERNANCE PROPOSAL</h3>

              <div className="space-y-4 mb-6">
                {[
                  { label: 'TITLE', key: 'title', type: 'input', placeholder: 'Adjust fee structure v2...' },
                  { label: 'DESCRIPTION', key: 'description', type: 'textarea', placeholder: 'Detailed proposal description...' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-white/30 text-[9px] tracking-widest font-black block mb-1.5">{f.label}</label>
                    {f.type === 'input'
                      ? <input type="text" value={(newProposal as any)[f.key]} onChange={e => setNewProposal(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#ff00ff]/40 transition-colors" />
                      : <textarea rows={3} value={(newProposal as any)[f.key]} onChange={e => setNewProposal(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                          className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[#ff00ff]/40 transition-colors resize-none" />
                    }
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/30 text-[9px] tracking-widest font-black block mb-1.5">CATEGORY</label>
                    <select value={newProposal.category} onChange={e => setNewProposal(p => ({ ...p, category: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-sm focus:outline-none">
                      {Object.keys(CAT_COLOR).map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-white/30 text-[9px] tracking-widest font-black block mb-1.5">DURATION</label>
                    <div className="flex gap-1">
                      {['7','14','30'].map(d => (
                        <button key={d} onClick={() => setNewProposal(p => ({ ...p, days: d }))}
                          className="flex-1 py-2.5 rounded-xl text-xs font-black transition-all"
                          style={{ background: newProposal.days === d ? 'rgba(255,0,255,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${newProposal.days === d ? 'rgba(255,0,255,0.4)' : 'rgba(255,255,255,0.1)'}`, color: newProposal.days === d ? '#ff00ff' : 'rgba(255,255,255,0.3)' }}>
                          {d}d
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl text-xs font-black tracking-widest border border-white/10 bg-white/[0.04] text-white/40 hover:text-white transition-all">CANCEL</button>
                <button onClick={handleCreateProposal} disabled={!newProposal.title}
                  className="flex-1 py-3 rounded-xl text-xs font-black tracking-widest transition-all disabled:opacity-30 hover:opacity-80"
                  style={{ background: 'rgba(255,0,255,0.15)', border: '1px solid rgba(255,0,255,0.4)', color: '#ff00ff' }}>
                  DEPLOY PROPOSAL 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}