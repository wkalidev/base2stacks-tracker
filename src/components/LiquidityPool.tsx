'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@/hooks/useWallet';

export default function LiquidityPool() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity'>('swap');
  const [swapDirection, setSwapDirection] = useState<'b2s-to-stx' | 'stx-to-b2s'>('b2s-to-stx');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('0');
  const [loading, setLoading] = useState(false);
  
  // Pool stats
  const [reserveB2S, setReserveB2S] = useState(15000000);
  const [reserveSTX, setReserveSTX] = useState(1500000);
  const [userLPBalance, setUserLPBalance] = useState(0);
  const [poolShare, setPoolShare] = useState(0);

  // Calculate output amount when input changes
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setOutputAmount('0');
      return;
    }

    const input = parseFloat(inputAmount);
    const fee = 0.0025; // 0.25%
    const inputAfterFee = input * (1 - fee);

    if (swapDirection === 'b2s-to-stx') {
      const output = (inputAfterFee * reserveSTX) / (reserveB2S + inputAfterFee);
      setOutputAmount(output.toFixed(6));
    } else {
      const output = (inputAfterFee * reserveB2S) / (reserveSTX + inputAfterFee);
      setOutputAmount(output.toFixed(6));
    }
  }, [inputAmount, swapDirection, reserveB2S, reserveSTX]);

  const handleSwap = () => {
    if (!inputAmount) return;
    setLoading(true);
    setTimeout(() => {
      alert(`Swapped ${inputAmount} ${swapDirection === 'b2s-to-stx' ? '$B2S' : 'STX'} for ${outputAmount} ${swapDirection === 'b2s-to-stx' ? 'STX' : '$B2S'}!`);
      setInputAmount('');
      setOutputAmount('0');
      setLoading(false);
    }, 1000);
  };

  const flipSwapDirection = () => {
    setSwapDirection(swapDirection === 'b2s-to-stx' ? 'stx-to-b2s' : 'b2s-to-stx');
    setInputAmount('');
    setOutputAmount('0');
  };

  const getCurrentPrice = () => {
    return (reserveB2S / reserveSTX).toFixed(2);
  };

  if (!isConnected) {
    return (
      <div className="pool-container bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 text-center">
        <p className="text-white/70 text-lg">Connect your wallet to access the liquidity pool</p>
      </div>
    );
  }

  return (
    <div className="liquidity-pool">
      {/* Header */}
      <div className="pool-header mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">💧 Liquidity Pool</h2>
        <p className="text-white/60">Swap tokens or provide liquidity</p>
      </div>

      {/* Pool Stats */}
      <div className="pool-stats grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-md rounded-lg p-4 border border-blue-500/30">
          <p className="text-white/60 text-xs mb-1">Total Liquidity</p>
          <p className="text-xl font-bold text-white">${((reserveB2S + reserveSTX) / 1000000 * 0.5).toFixed(0)}K</p>
        </div>
        <div className="stat bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-lg p-4 border border-purple-500/30">
          <p className="text-white/60 text-xs mb-1">24h Volume</p>
          <p className="text-xl font-bold text-white">$45.2K</p>
        </div>
        <div className="stat bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-md rounded-lg p-4 border border-green-500/30">
          <p className="text-white/60 text-xs mb-1">24h Fees</p>
          <p className="text-xl font-bold text-white">$113</p>
        </div>
        <div className="stat bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-md rounded-lg p-4 border border-orange-500/30">
          <p className="text-white/60 text-xs mb-1">B2S Price</p>
          <p className="text-xl font-bold text-white">{getCurrentPrice()} STX</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs flex gap-4 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab('swap')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'swap'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          🔄 Swap
        </button>
        <button
          onClick={() => setActiveTab('liquidity')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'liquidity'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/60 hover:text-white'
          }`}
        >
          💧 Add Liquidity
        </button>
      </div>

      {/* Swap Interface */}
      {activeTab === 'swap' && (
        <div className="swap-interface max-w-lg mx-auto">
          <div className="swap-card bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            {/* Input */}
            <div className="input-section mb-2">
              <div className="flex justify-between mb-2">
                <label className="text-white/70 text-sm">You Pay</label>
                <span className="text-white/50 text-xs">Balance: 1,234.56</span>
              </div>
              <div className="input-box bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-center">
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={(e) => setInputAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-white text-2xl font-bold outline-none w-full"
                  />
                  <div className="token-badge flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                    <span className="text-2xl">{swapDirection === 'b2s-to-stx' ? '💎' : '🪙'}</span>
                    <span className="text-white font-semibold">{swapDirection === 'b2s-to-stx' ? '$B2S' : 'STX'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Flip Button */}
            <div className="flex justify-center -my-2 z-10 relative">
              <button
                onClick={flipSwapDirection}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 p-3 rounded-xl border-4 border-[#0f172a] shadow-lg transition-all hover:rotate-180 duration-300"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Output */}
            <div className="output-section mt-2">
              <div className="flex justify-between mb-2">
                <label className="text-white/70 text-sm">You Receive</label>
                <span className="text-white/50 text-xs">Balance: 5.67</span>
              </div>
              <div className="output-box bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-center">
                  <div className="text-white text-2xl font-bold">{outputAmount}</div>
                  <div className="token-badge flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
                    <span className="text-2xl">{swapDirection === 'b2s-to-stx' ? '🪙' : '💎'}</span>
                    <span className="text-white font-semibold">{swapDirection === 'b2s-to-stx' ? 'STX' : '$B2S'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Swap Details */}
            {inputAmount && parseFloat(inputAmount) > 0 && (
              <div className="swap-details mt-4 p-3 bg-white/5 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Rate</span>
                  <span className="text-white">1 {swapDirection === 'b2s-to-stx' ? '$B2S' : 'STX'} = {getCurrentPrice()} {swapDirection === 'b2s-to-stx' ? 'STX' : '$B2S'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Fee (0.25%)</span>
                  <span className="text-white">{(parseFloat(inputAmount) * 0.0025).toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Slippage</span>
                  <span className="text-green-400">{'< 1%'}</span>
                </div>
              </div>
            )}

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              disabled={!inputAmount || parseFloat(inputAmount) <= 0 || loading}
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-all"
            >
              {loading ? '⏳ Swapping...' : '🔄 Swap Tokens'}
            </button>
          </div>

          {/* Price Chart Info */}
          <div className="price-info mt-6 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded text-white/80 text-sm">
            <p className="font-semibold mb-1">💡 Pro Tip</p>
            <p>Large swaps may have higher slippage. Consider splitting into multiple transactions for better rates.</p>
          </div>
        </div>
      )}

      {/* Add Liquidity Interface */}
      {activeTab === 'liquidity' && (
        <div className="liquidity-interface max-w-lg mx-auto">
          <div className="liquidity-card bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Add Liquidity</h3>
            
            {/* Your Position */}
            <div className="position-info mb-6 p-4 bg-white/5 rounded-lg">
              <p className="text-white/60 text-sm mb-2">Your Position</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-white">{userLPBalance.toFixed(2)} LP</p>
                  <p className="text-white/50 text-xs">Pool Share: {poolShare.toFixed(2)}%</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">~$0</p>
                  <p className="text-white/50 text-xs">USD Value</p>
                </div>
              </div>
            </div>

            {/* Input Fields */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/70 text-sm mb-2 block">$B2S Amount</label>
                <input
                  type="number"
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">STX Amount</label>
                <input
                  type="number"
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-4 rounded-lg font-bold text-lg transition-all"
            >
              💧 Add Liquidity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}