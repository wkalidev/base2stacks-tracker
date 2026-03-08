'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV,
  PostConditionMode, AnchorMode,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const GOV_CONTRACT = 'b2s-governance';
const STAKING_CONTRACT = 'b2s-staking-vault-v2';
const HIRO_API = 'https://api.mainnet.hiro.so';
const DECIMALS = 1_000_000;

interface Proposal {
  id: number;
  title: string;
  description: string;
  category: string;
  yesVotes: number;
  noVotes: number;
  endBlock: number;
  status: 'active' | 'passed' | 'failed' | 'executed';
  proposer: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  economic:  'bg-green-500/20 text-green-400 border-green-500/30',
  security:  'bg-red-500/20 text-red-400 border-red-500/30',
  technical: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  community: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

async function fetchCurrentBlock(): Promise<number> {
  try {
    const res = await fetch(`${HIRO_API}/extended/v1/block?limit=1`);
    const data = await res.json();
    return data.results?.[0]?.height || 0;
  } catch {
    return 0;
  }
}

async function fetchProposalsFromTxs(): Promise<Proposal[]> {
  try {
    const res = await fetch(
      `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${GOV_CONTRACT}/transactions?limit=50`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const proposals: Proposal[] = [];
    let id = 1;

    for (const tx of data.results || []) {
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'create-proposal' &&
        tx.tx_status === 'success'
      ) {
        const args = tx.contract_call?.function_args || [];
        const title = args[0]?.repr?.replace(/^u?"/, '').replace(/"$/, '') || `Proposal #${id}`;
        const description = args[1]?.repr?.replace(/^u?"/, '').replace(/"$/, '') || '';
        const category = args[2]?.repr?.replace(/^"/, '').replace(/"$/, '') || 'general';
        const endBlock = args[3]?.repr ? parseInt(args[3].repr.replace('u', '')) : 0;

        proposals.push({
          id: id++,
          title,
          description,
          category,
          yesVotes: 0,
          noVotes: 0,
          endBlock,
          status: 'active',
          proposer: tx.sender_address,
        });
      }
    }

    return proposals;
  } catch {
    return [];
  }
}

async function fetchVotesForProposal(
  proposalId: number,
  proposals: Proposal[]
): Promise<{ yes: number; no: number }> {
  try {
    const res = await fetch(
      `${HIRO_API}/extended/v1/address/${CONTRACT_ADDRESS}.${GOV_CONTRACT}/transactions?limit=50`,
      { headers: { Accept: 'application/json' } }
    );
    if (!res.ok) return { yes: 0, no: 0 };
    const data = await res.json();

    let yes = 0;
    let no = 0;

    for (const tx of data.results || []) {
      if (
        tx.tx_type === 'contract_call' &&
        tx.contract_call?.function_name === 'vote' &&
        tx.tx_status === 'success'
      ) {
        const args = tx.contract_call?.function_args || [];
        const txProposalId = args[0]?.repr ? parseInt(args[0].repr.replace('u', '')) : -1;
        const voteVal = args[1]?.repr;
        if (txProposalId === proposalId) {
          if (voteVal === 'true') yes += 1;
          else no += 1;
        }
      }
    }

    return { yes, no };
  } catch {
    return { yes: 0, no: 0 };
  }
}

export default function GovernanceDAO() {
  const { address, isConnected } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [votingLoading, setVotingLoading] = useState<Record<number, boolean>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votingPower, setVotingPower] = useState(0);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [txIds, setTxIds] = useState<Record<number, string>>({});
  const [userVotes, setUserVotes] = useState<Record<number, boolean>>({});
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    category: 'economic',
    days: '7',
  });
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch voting power from staking vault
  const fetchVotingPower = useCallback(async () => {
    if (!address) return;
    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: STAKING_CONTRACT,
        functionName: 'get-vault',
        functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      });
      const json = cvToJSON(result);
      const amount = Number(json?.value?.value?.amount?.value || 0) / DECIMALS;
      setVotingPower(amount);
    } catch {
      setVotingPower(0);
    }
  }, [address]);

  // Load all proposals + votes
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [block, rawProposals] = await Promise.all([
        fetchCurrentBlock(),
        fetchProposalsFromTxs(),
      ]);

      setCurrentBlock(block);

      // Enrich with vote counts and status
      const enriched = await Promise.all(
        rawProposals.map(async (p) => {
          const votes = await fetchVotesForProposal(p.id, rawProposals);
          const isExpired = block > p.endBlock && p.endBlock > 0;
          let status: Proposal['status'] = 'active';
          if (isExpired) {
            status = votes.yes > votes.no ? 'passed' : 'failed';
          }
          return { ...p, yesVotes: votes.yes, noVotes: votes.no, status };
        })
      );

      setProposals(enriched);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120_000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    if (address) fetchVotingPower();
  }, [address, fetchVotingPower]);

  const handleVote = async (proposalId: number, voteYes: boolean) => {
    if (!address) return;
    setVotingLoading(prev => ({ ...prev, [proposalId]: true }));
    try {
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: GOV_CONTRACT,
        functionName: 'vote',
        functionArgs: [uintCV(proposalId), { type: 13, value: voteYes } as any],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxIds(prev => ({ ...prev, [proposalId]: data.txId }));
          setUserVotes(prev => ({ ...prev, [proposalId]: true }));
          setVotingLoading(prev => ({ ...prev, [proposalId]: false }));
          setTimeout(loadData, 5000);
        },
        onCancel: () => setVotingLoading(prev => ({ ...prev, [proposalId]: false })),
      });
    } catch {
      setVotingLoading(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleCreateProposal = async () => {
    if (!address || !newProposal.title) return;
    try {
      const { stringUtf8CV, stringAsciiCV } = await import('@stacks/transactions');
      const blocks = parseInt(newProposal.days) * 144;
      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: GOV_CONTRACT,
        functionName: 'create-proposal',
        functionArgs: [
          stringUtf8CV(newProposal.title),
          stringUtf8CV(newProposal.description),
          stringAsciiCV(newProposal.category),
          uintCV(blocks),
        ],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: () => {
          setShowCreateModal(false);
          setNewProposal({ title: '', description: '', category: 'economic', days: '7' });
          setTimeout(loadData, 5000);
        },
        onCancel: () => {},
      });
    } catch (err) {
      console.error('Create proposal error:', err);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':   return 'bg-green-500/20 text-green-400';
      case 'passed':   return 'bg-blue-500/20 text-blue-400';
      case 'executed': return 'bg-purple-500/20 text-purple-400';
      default:         return 'bg-red-500/20 text-red-400';
    }
  };

  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 text-center">
        <p className="text-4xl mb-4">🏛️</p>
        <p className="text-white font-semibold text-lg mb-2">Connect your wallet</p>
        <p className="text-white/50 text-sm">Connect to participate in B2S governance</p>
      </div>
    );
  }

  return (
    <div className="governance-dao">
      {/* Header */}
      <div className="dao-header flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🏛️ Governance DAO</h2>
          <div className="flex items-center gap-3">
            <p className="text-white/60">Vote on protocol decisions — live on-chain</p>
            {lastUpdated && (
              <span className="text-white/30 text-xs">· {lastUpdated.toLocaleTimeString()}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
            title="Refresh"
          >
            🔄
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={votingPower < 10000}
            title={votingPower < 10000 ? 'Need 10,000 $B2S staked to create proposal' : ''}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all text-sm"
          >
            + Create Proposal
          </button>
        </div>
      </div>

      {/* Voting Power Card */}
      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white/70 text-sm mb-1">Your Voting Power</h3>
            <p className="text-3xl font-bold text-white">{votingPower.toLocaleString()} $B2S</p>
            {votingPower < 10000 && (
              <p className="text-yellow-400 text-xs mt-1">
                ⚠️ Need 10,000 $B2S staked to create proposals
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Block height</p>
            <p className="text-white font-mono">#{currentBlock.toLocaleString()}</p>
            <a
              href={`https://explorer.hiro.so/address/${CONTRACT_ADDRESS}.${GOV_CONTRACT}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-400 text-xs hover:underline"
            >
              View contract ↗
            </a>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-white/5 rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && proposals.length === 0 && (
        <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
          <p className="text-4xl mb-4">🗳️</p>
          <p className="text-white font-semibold text-lg mb-2">No proposals yet</p>
          <p className="text-white/50 text-sm mb-4">
            Be the first to create a governance proposal
          </p>
          <p className="text-white/30 text-xs">
            Requires 10,000 $B2S staked in b2s-staking-vault-v2
          </p>
        </div>
      )}

      {/* Proposals */}
      {!loading && proposals.length > 0 && (
        <div className="proposals-list space-y-6">
          {proposals.map(proposal => {
            const total = proposal.yesVotes + proposal.noVotes;
            const yesPercent = total > 0 ? (proposal.yesVotes / total) * 100 : 50;
            const noPercent = 100 - yesPercent;
            const blocksLeft = proposal.endBlock - currentBlock;
            const daysLeft = blocksLeft > 0 ? (blocksLeft / 144).toFixed(1) : '0';
            const hasVoted = userVotes[proposal.id];

            return (
              <div
                key={proposal.id}
                className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-2xl font-bold text-white">#{proposal.id}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(proposal.status)}`}>
                        {proposal.status.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs border ${CATEGORY_COLORS[proposal.category] || 'bg-white/10 text-white/60 border-white/10'}`}>
                        {proposal.category}
                      </span>
                      {blocksLeft > 0 && (
                        <span className="text-white/40 text-xs">⏱ {daysLeft} days left</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
                    {proposal.description && (
                      <p className="text-white/70 text-sm mb-2">{proposal.description}</p>
                    )}
                    <a
                      href={`https://explorer.hiro.so/address/${proposal.proposer}?chain=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/30 text-xs hover:text-white/60 font-mono"
                    >
                      By {proposal.proposer.slice(0, 8)}...{proposal.proposer.slice(-4)}
                    </a>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-green-400">✅ Yes: {proposal.yesVotes} votes</span>
                    <span className="text-white/40 text-xs">{total} total</span>
                    <span className="text-red-400">No: {proposal.noVotes} votes ❌</span>
                  </div>
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div className="flex h-full">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${yesPercent}%` }}
                      />
                      <div
                        className="bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-500"
                        style={{ width: `${noPercent}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-white/40 mt-1">
                    <span>{yesPercent.toFixed(1)}%</span>
                    <span>{noPercent.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Vote Buttons */}
                {proposal.status === 'active' && !hasVoted && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleVote(proposal.id, true)}
                      disabled={!!votingLoading[proposal.id] || votingPower === 0}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      {votingLoading[proposal.id] ? '⏳' : '✅ Vote Yes'}
                    </button>
                    <button
                      onClick={() => handleVote(proposal.id, false)}
                      disabled={!!votingLoading[proposal.id] || votingPower === 0}
                      className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all"
                    >
                      {votingLoading[proposal.id] ? '⏳' : '❌ Vote No'}
                    </button>
                  </div>
                )}

                {hasVoted && (
                  <div className="text-center py-2 text-green-400 font-semibold text-sm">
                    ✅ You voted on this proposal
                  </div>
                )}

                {votingPower === 0 && proposal.status === 'active' && (
                  <p className="text-white/30 text-xs text-center mt-2">
                    Stake $B2S to get voting power
                  </p>
                )}

                {/* TX link */}
                {txIds[proposal.id] && (
                  <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
                    <a
                      href={`https://explorer.hiro.so/txid/${txIds[proposal.id]}?chain=mainnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 hover:underline"
                    >
                      ✅ View on Explorer ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-white/20 rounded-2xl p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-white mb-2">Create Proposal</h3>
            <p className="text-white/40 text-sm mb-6">Requires 10,000 $B2S staked</p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/70 text-sm mb-2 block">Title</label>
                <input
                  type="text"
                  value={newProposal.title}
                  onChange={e => setNewProposal(p => ({ ...p, title: e.target.value }))}
                  placeholder="Enter proposal title"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-white/70 text-sm mb-2 block">Description</label>
                <textarea
                  value={newProposal.description}
                  onChange={e => setNewProposal(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your proposal in detail"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">Category</label>
                  <select
                    value={newProposal.category}
                    onChange={e => setNewProposal(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="economic">Economic</option>
                    <option value="security">Security</option>
                    <option value="technical">Technical</option>
                    <option value="community">Community</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/70 text-sm mb-2 block">Duration (days)</label>
                  <input
                    type="number"
                    value={newProposal.days}
                    onChange={e => setNewProposal(p => ({ ...p, days: e.target.value }))}
                    placeholder="7"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-white/30 text-xs mt-1">≈ {(parseInt(newProposal.days || '0') * 144).toLocaleString()} blocks</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-white/10 text-white px-6 py-3 rounded-lg font-semibold border border-white/20 hover:bg-white/20 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProposal}
                disabled={!newProposal.title}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all"
              >
                Create Proposal 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}