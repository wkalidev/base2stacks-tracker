'use client';

import { useState, useEffect } from 'react';
import { useConnect } from '@stacks/connect-react';
import { 
  callReadOnlyFunction, 
  makeContractCall,
  uintCV,
  PostConditionMode
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const network = new StacksTestnet();
const contractAddress = 'ST936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const contractName = 'b2s-rewards-distributor';

export default function RewardsDistributor() {
  const { address, isSignedIn } = useConnect();
  const [stakedAmount, setStakedAmount] = useState(0);
  const [pendingRewards, setPendingRewards] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [stakeInput, setStakeInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (address) {
      fetchStakerInfo();
    }
  }, [address]);

  const fetchStakerInfo = async () => {
    if (!address) return;

    try {
      // Get staker info
      const infoResult = await callReadOnlyFunction({
        network,
        contractAddress,
        contractName,
        functionName: 'get-staker-info',
        functionArgs: [],
        senderAddress: address
      });

      // Get pending rewards
      const pendingResult = await callReadOnlyFunction({
        network,
        contractAddress,
        contractName,
        functionName: 'get-pending-rewards',
        functionArgs: [],
        senderAddress: address
      });

      // Parse results
      const info = infoResult.value;
      setStakedAmount(Number(info['staked-amount'].value) / 1000000);
      setTotalEarned(Number(info['total-rewards-earned'].value) / 1000000);
      setPendingRewards(Number(pendingResult.value) / 1000000);
    } catch (error) {
      console.error('Error fetching staker info:', error);
    }
  };

  const handleStake = async () => {
    if (!address || !stakeInput) return;

    const amount = parseFloat(stakeInput);
    if (amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const microAmount = Math.floor(amount * 1000000);

      await makeContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'stake',
        functionArgs: [uintCV(microAmount)],
        senderKey: '', // Wallet will provide
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log('Stake successful:', data);
          setStakeInput('');
          setTimeout(fetchStakerInfo, 2000);
        }
      });
    } catch (error) {
      console.error('Stake error:', error);
      alert('Staking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!address) return;

    setLoading(true);
    try {
      await makeContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'claim-rewards',
        functionArgs: [],
        senderKey: '',
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log('Claim successful:', data);
          alert(`Claimed ${pendingRewards.toFixed(2)} $B2S rewards!`);
          setTimeout(fetchStakerInfo, 2000);
        }
      });
    } catch (error) {
      console.error('Claim error:', error);
      alert('Claim failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!address || !stakeInput) return;

    const amount = parseFloat(stakeInput);
    if (amount <= 0 || amount > stakedAmount) {
      alert('Invalid unstake amount');
      return;
    }

    setLoading(true);
    try {
      const microAmount = Math.floor(amount * 1000000);

      await makeContractCall({
        network,
        contractAddress,
        contractName,
        functionName: 'unstake',
        functionArgs: [uintCV(microAmount)],
        senderKey: '',
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data) => {
          console.log('Unstake successful:', data);
          setStakeInput('');
          setTimeout(fetchStakerInfo, 2000);
        }
      });
    } catch (error) {
      console.error('Unstake error:', error);
      alert('Unstaking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="rewards-container">
        <p>Please connect your wallet to access rewards</p>
      </div>
    );
  }

  return (
    <div className="rewards-distributor">
      <h2>💰 Rewards Distributor</h2>
      
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Staked Amount</h3>
          <p className="amount">{stakedAmount.toFixed(2)} $B2S</p>
        </div>
        
        <div className="stat-card pending">
          <h3>Pending Rewards</h3>
          <p className="amount">{pendingRewards.toFixed(6)} $B2S</p>
          <button 
            onClick={handleClaimRewards}
            disabled={loading || pendingRewards === 0}
            className="claim-btn"
          >
            {loading ? '⏳ Claiming...' : '🎁 Claim Rewards'}
          </button>
        </div>
        
        <div className="stat-card">
          <h3>Total Earned</h3>
          <p className="amount">{totalEarned.toFixed(2)} $B2S</p>
        </div>
      </div>

      {/* Stake/Unstake Section */}
      <div className="action-section">
        <h3>Manage Staking</h3>
        
        <div className="input-group">
          <input
            type="number"
            value={stakeInput}
            onChange={(e) => setStakeInput(e.target.value)}
            placeholder="Amount"
            disabled={loading}
          />
          <span className="currency">$B2S</span>
        </div>

        <div className="button-group">
          <button 
            onClick={handleStake}
            disabled={loading || !stakeInput}
            className="btn-primary"
          >
            {loading ? '⏳' : '🔒'} Stake
          </button>
          
          <button 
            onClick={handleUnstake}
            disabled={loading || !stakeInput}
            className="btn-secondary"
          >
            {loading ? '⏳' : '🔓'} Unstake
          </button>
        </div>
      </div>

      <style jsx>{`
        .rewards-distributor {
          padding: 24px;
          max-width: 1000px;
          margin: 0 auto;
        }

        h2 {
          text-align: center;
          margin-bottom: 32px;
          font-size: 32px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #475569;
        }

        .stat-card.pending {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
        }

        .stat-card h3 {
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 12px;
        }

        .amount {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 16px;
        }

        .claim-btn {
          width: 100%;
          padding: 12px;
          background: white;
          color: #1e40af;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .claim-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255,255,255,0.3);
        }

        .claim-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .action-section {
          background: #1e293b;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #475569;
        }

        .input-group {
          position: relative;
          margin: 20px 0;
        }

        .input-group input {
          width: 100%;
          padding: 16px;
          font-size: 18px;
          border: 2px solid #475569;
          border-radius: 8px;
          background: #0f172a;
          color: white;
        }

        .currency {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          opacity: 0.6;
        }

        .button-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .btn-primary, .btn-secondary {
          padding: 16px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          color: white;
        }

        .btn-secondary {
          background: #475569;
          color: white;
        }

        .btn-primary:hover:not(:disabled),
        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3);
        }

        .btn-primary:disabled,
        .btn-secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}