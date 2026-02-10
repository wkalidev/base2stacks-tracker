'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';

interface Proposal {
  id: number;
  title: string;
  description: string;
  category: string;
  yesVotes: number;
  noVotes: number;
  endBlock: number;
  status: 'active' | 'passed' | 'failed' | 'executed';
  voted: boolean;
}

export default function GovernanceDAO() {
  const { address, isConnected } = useWallet();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [votingPower, setVotingPower] = useState(0);
  
  // Mock data for now
  useEffect(() => {
    if (isConnected) {
      setVotingPower(10000);
      setProposals([
        {
          id: 1,
          title: "Increase Base APY to 15%",
          description: "Proposal to increase the base staking APY from 12.5% to 15% to attract more stakers and increase TVL.",
          category: "economic",
          yesVotes: 125000,
          noVotes: 45000,
          endBlock: 999999,
          status: 'active',
          voted: false
        },
        {
          id: 2,
          title: "Add Multi-sig Treasury",
          description: "Implement a 3-of-5 multi-sig wallet for treasury management to improve security.",
          category: "security",
          yesVotes: 98000,
          noVotes: 12000,
          endBlock: 999900,
          status: 'passed',
          voted: true
        }
      ]);
    }
  }, [isConnected]);

  const handleVote = (proposalId: number, voteYes: boolean) => {
    alert(`Voted ${voteYes ? 'YES' : 'NO'} on proposal #${proposalId}`);
    // Update local state
    setProposals(proposals.map(p => 
      p.id === proposalId ? {...p, voted: true} : p
    ));
  };

  if (!isConnected) {
    return (
      <div className="governance-container bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 text-center">
        <p className="text-white/70 text-lg">Connect your wallet to participate in governance</p>
      </div>
    );
  }

  return (
    <div className="governance-dao">
      <div className="dao-header flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">🏛️ Governance DAO</h2>
          <p className="text-white/60">Vote on protocol decisions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
        >
          Create Proposal
        </button>
      </div>

      {/* Voting Power Card */}
      <div className="voting-power-card bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-white/70 text-sm mb-1">Your Voting Power</h3>
            <p className="text-3xl font-bold text-white">{votingPower.toLocaleString()} votes</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Based on staked $B2S</p>
            <p className="text-white/80">1 token = 1 vote</p>
          </div>
        </div>
      </div>

      {/* Proposals List */}
      <div className="proposals-list space-y-6">
        {proposals.map(proposal => (
          <div key={proposal.id} className="proposal-card bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-white">#{proposal.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    proposal.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    proposal.status === 'passed' ? 'bg-blue-500/20 text-blue-400' :
                    proposal.status === 'executed' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {proposal.status.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 bg-white/10 rounded text-xs text-white/70">
                    {proposal.category}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
                <p className="text-white/70 text-sm">{proposal.description}</p>
              </div>
            </div>

            {/* Voting Progress */}
            <div className="voting-progress mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-400">Yes: {proposal.yesVotes.toLocaleString()}</span>
                <span className="text-red-400">No: {proposal.noVotes.toLocaleString()}</span>
              </div>
              <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                <div className="flex h-full">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-500"
                    style={{width: `${(proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 100}%`}}
                  />
                  <div 
                    className="bg-gradient-to-r from-red-500 to-pink-500"
                    style={{width: `${(proposal.noVotes / (proposal.yesVotes + proposal.noVotes)) * 100}%`}}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-white/60 mt-1">
                <span>{((proposal.yesVotes / (proposal.yesVotes + proposal.noVotes)) * 100).toFixed(1)}%</span>
                <span>{((proposal.noVotes / (proposal.yesVotes + proposal.noVotes)) * 100).toFixed(1)}%</span>
              </div>
            </div>

            {/* Vote Buttons */}
            {proposal.status === 'active' && !proposal.voted && (
              <div className="vote-buttons flex gap-3">
                <button
                  onClick={() => handleVote(proposal.id, true)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  ✅ Vote Yes
                </button>
                <button
                  onClick={() => handleVote(proposal.id, false)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                >
                  ❌ Vote No
                </button>
              </div>
            )}
            
            {proposal.voted && (
              <div className="text-center py-2 text-green-400 font-semibold">
                ✅ You voted on this proposal
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Proposal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-base-dark to-stacks-dark border border-white/20 rounded-2xl p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Create Proposal</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/70 text-sm mb-2 block">Title</label>
                <input
                  type="text"
                  placeholder="Enter proposal title"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="text-white/70 text-sm mb-2 block">Description</label>
                <textarea
                  placeholder="Describe your proposal in detail"
                  rows={4}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                />
              </div>
              
              <div>
                <label className="text-white/70 text-sm mb-2 block">Category</label>
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500">
                  <option value="economic">Economic</option>
                  <option value="security">Security</option>
                  <option value="technical">Technical</option>
                  <option value="community">Community</option>
                </select>
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
                onClick={() => {
                  alert('Proposal creation coming soon!');
                  setShowCreateModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all"
              >
                Create Proposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}