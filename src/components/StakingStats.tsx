'use client';

import { useEffect, useState } from 'react';
import { callReadOnlyFunction } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

interface StakingStatsProps {
  address: string;
}

const network = new StacksTestnet();
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'ST936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const CONTRACT_NAME = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'b2s-token';

export function StakingStats({ address }: StakingStatsProps) {
  const [stakedAmount, setStakedAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStakedAmount = async () => {
      if (!address) return;

      try {
        const result = await callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-staked-amount',
          functionArgs: [],
          senderAddress: address,
        });

        // @ts-ignore
        const staked = result.value?.value || 0;
        setStakedAmount(Number(staked) / 1000000);
      } catch (error) {
        console.error('Error fetching staked amount:', error);
        setStakedAmount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchStakedAmount();

    const interval = setInterval(fetchStakedAmount, 30000);
    return () => clearInterval(interval);
  }, [address]);

  const calculateRewards = () => {
    const apy = 12.5;
    const dailyReward = (stakedAmount * apy) / 365 / 100;
    return dailyReward;
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
        <div className="animate-pulse">
          <div className="h-6 bg-white/10 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-xl p-6 border border-blue-500/20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">Total Staked</p>
          <p className="text-3xl font-bold text-white">
            {stakedAmount.toFixed(2)}
          </p>
          <p className="text-white/40 text-xs">$B2S</p>
        </div>

        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">Daily Rewards</p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">
            {calculateRewards().toFixed(4)}
          </p>
          <p className="text-white/40 text-xs">$B2S per day</p>
        </div>

        <div className="text-center">
          <p className="text-white/60 text-sm mb-2">APY</p>
          <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
            12.5%
          </p>
          <p className="text-white/40 text-xs">Annual yield</p>
        </div>
      </div>

      {stakedAmount === 0 && (
        <div className="mt-4 p-3 bg-blue-500/10 border-l-4 border-blue-500 rounded text-white/80 text-sm">
          💡 <strong>Tip:</strong> Stake your $B2S tokens to start earning 12.5% APY!
        </div>
      )}
    </div>
  );
}