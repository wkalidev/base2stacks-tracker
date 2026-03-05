'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { callReadOnlyFunction, cvToJSON, standardPrincipalCV, uintCV, PostConditionMode, AnchorMode } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();
const contractAddress = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const contractName = 'b2s-rewards-distributor-v3';

export default function RewardsDistributor() {
  const { address, isConnected } = useWallet();
  const [stakedAmount, setStakedAmount] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [stakeInput, setStakeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [txType, setTxType] = useState<string>('');

  const fetchStakerInfo = useCallback(async () => {
    if (!address) return;
    try {
      const infoResult = await callReadOnlyFunction({
        network, contractAddress, contractName,
        functionName: 'get-staker-info',
        functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      });
      const info = cvToJSON(infoResult);
      if (info.value) {
        setStakedAmount(Number(info.value['staked-amount']?.value || 0) / 1_000_000);
        setTotalEarned(Number(info.value['total-rewards-earned']?.value || 0) / 1_000_000);
      }

      const rewardsResult = await callReadOnlyFunction({
        network, contractAddress, contractName,
        functionName: 'get-pending-rewards',
        functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      });
      setPendingRewards(Number(cvToJSON(rewardsResult).value?.value || 0) / 1_000_000);
    } catch (error) {
      console.error('Error fetching staker info:', error);
    }
  }, [address]);

  useEffect(() => {
    if (address && isConnected) fetchStakerInfo();
  }, [address, isConnected, fetchStakerInfo]);

  const callContract = async (functionName: string, args: any[], type: string) => {
    if (!address) return;
    setLoading(true);
    setTxId(null);
    setTxType(type);
    try {
      await openContractCall({
        network, contractAddress, contractName,
        functionName,
        functionArgs: args,
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId);
          setStakeInput('');
          setLoading(false);
          setTimeout(fetchStakerInfo, 5000);
        },
        onCancel: () => setLoading(false),
      });
    } catch (err) {
      console.error(`${type} error:`, err);
      setLoading(false);
    }
  };

  const handleStake = () => {
    const amount = parseFloat(stakeInput);
    if (!amount || amount <= 0) return;
    callContract('stake', [uintCV(Math.floor(amount * 1_000_000))], 'Stake');
  };

  const handleUnstake = () => {
    const amount = parseFloat(stakeInput);
    if (!amount || amount <= 0 || amount > stakedAmount) return;
    callContract('unstake', [uintCV(Math.floor(amount * 1_000_000))], 'Unstake');
  };

  const handleClaimRewards = () => {
    if (pendingRewards === 0) return;
    callContract('claim-rewards', [], 'Claim');
  };

  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 text-center">
        <p className="text-white/70 text-lg">Please connect your wallet to access rewards distribution</p>
      </div>
    );
  }

  return (
    <div className="rewards-distributor">
      <h2 className="text-3xl font-bold text-white text-center mb-8">💰 Rewards Distributor</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md rounded-xl p-6 border border-blue-500/30">
          <h3 className="text-white/70 text-sm mb-2">Staked Amount</h3>
          <p className="text-3xl font-bold text-white">{stakedAmount.toFixed(2)} $B2S</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-xl p-6 border border-green-500/30">
          <h3 className="text-white/70 text-sm mb-2">Pending Rewards</h3>
          <p className="text-3xl font-bold text-green-400">{pendingRewards.toFixed(6)} $B2S</p>
          <button
            onClick={handleClaimRewards}
            disabled={loading || pendingRewards === 0}
            className="mt-4 w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-semibold transition-all"
          >
            {loading && txType === 'Claim' ? '⏳ Claiming...' : 'Claim Rewards'}
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-xl p-6 border border-purple-500/30">
          <h3 className="text-white/70 text-sm mb-2">Total Earned</h3>
          <p className="text-3xl font-bold text-purple-400">{totalEarned.toFixed(2)} $B2S</p>
        </div>
      </div>

      <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
        <h3 className="text-white font-semibold text-xl mb-4">Manage Staking</h3>
        <div className="relative mb-4">
          <input
            type="number"
            value={stakeInput}
            onChange={(e) => setStakeInput(e.target.value)}
            placeholder="Enter amount"
            disabled={loading}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60">$B2S</span>
        </div>
        {stakeInput && parseFloat(stakeInput) > stakedAmount && (
          <p className="text-red-400 text-xs mb-3">⚠️ Cannot unstake more than your staked balance ({stakedAmount.toFixed(2)} $B2S)</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleStake}
            disabled={loading || !stakeInput || parseFloat(stakeInput) <= 0}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all"
          >
            {loading && txType === 'Stake' ? '⏳ Staking...' : 'Stake'}
          </button>
          <button
            onClick={handleUnstake}
            disabled={loading || !stakeInput || parseFloat(stakeInput) > stakedAmount}
            className="bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold border border-white/20 transition-all"
          >
            {loading && txType === 'Unstake' ? '⏳ Unstaking...' : 'Unstake'}
          </button>
        </div>
      </div>

      {txId && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
          <p className="text-green-400 font-semibold mb-1">✅ {txType} submitted!</p>
          <a
            href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline break-all"
          >
            View on Explorer ↗
          </a>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded text-white/80 text-sm">
        <strong>Note:</strong> Staked tokens earn continuous rewards at 12.5% APY. You can unstake at any time without penalties.
      </div>
    </div>
  );
}