'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV } from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';
import { PostConditionMode, AnchorMode } from '@stacks/transactions';

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const POOL_CONTRACT = 'b2s-liquidity-pool-v5';

interface PoolReserves {
  reserveB2S: number;
  reserveSTX: number;
  totalLPSupply: number;
  loading: boolean;
}

export default function LiquidityPool() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState<'swap' | 'liquidity'>('swap');
  const [swapDirection, setSwapDirection] = useState<'b2s-to-stx' | 'stx-to-b2s'>('b2s-to-stx');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('0');
  const [slippage, setSlippage] = useState(1); // 1%
  const [loading, setLoading] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);

  // Liquidity inputs
  const [b2sAmount, setB2sAmount] = useState('');
  const [stxAmount, setStxAmount] = useState('');
  const [userLPBalance, setUserLPBalance] = useState(0);

  const [pool, setPool] = useState<PoolReserves>({
    reserveB2S: 0,
    reserveSTX: 0,
    totalLPSupply: 0,
    loading: true,
  });

  // Fetch pool reserves from contract
  const fetchPoolData = useCallback(async () => {
    try {
      const sender = address || CONTRACT_ADDRESS;

      const [b2sRes, stxRes, lpRes] = await Promise.all([
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: POOL_CONTRACT,
          functionName: 'get-reserve-b2s',
          functionArgs: [],
          senderAddress: sender,
        }),
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: POOL_CONTRACT,
          functionName: 'get-reserve-stx',
          functionArgs: [],
          senderAddress: sender,
        }),
        callReadOnlyFunction({
          network,
          contractAddress: CONTRACT_ADDRESS,
          contractName: POOL_CONTRACT,
          functionName: 'get-total-lp-supply',
          functionArgs: [],
          senderAddress: sender,
        }),
      ]);

      setPool({
        reserveB2S: Number(cvToJSON(b2sRes).value) / 1_000_000,
        reserveSTX: Number(cvToJSON(stxRes).value) / 1_000_000,
        totalLPSupply: Number(cvToJSON(lpRes).value) / 1_000_000,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to fetch pool data:', err);
      setPool(prev => ({ ...prev, loading: false }));
    }
  }, [address]);

  // Fetch user LP balance
  const fetchUserLP = useCallback(async () => {
    if (!address) return;
    try {
      const result = await callReadOnlyFunction({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: POOL_CONTRACT,
        functionName: 'get-lp-balance',
        functionArgs: [standardPrincipalCV(address)],
        senderAddress: address,
      });
      setUserLPBalance(Number(cvToJSON(result).value) / 1_000_000);
    } catch (err) {
      console.error('Failed to fetch LP balance:', err);
    }
  }, [address]);

  useEffect(() => {
    fetchPoolData();
    const interval = setInterval(fetchPoolData, 30_000);
    return () => clearInterval(interval);
  }, [fetchPoolData]);

  useEffect(() => {
    if (address) fetchUserLP();
  }, [address, fetchUserLP]);

  // AMM formula: x * y = k with 0.25% fee
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0 || pool.loading) {
      setOutputAmount('0');
      return;
    }
    const input = parseFloat(inputAmount);
    const FEE_NUM = 9975;
    const FEE_DENOM = 10000;

    if (swapDirection === 'b2s-to-stx') {
      const num = input * FEE_NUM * pool.reserveSTX;
      const den = pool.reserveB2S * FEE_DENOM + input * FEE_NUM;
      setOutputAmount(den > 0 ? (num / den).toFixed(6) : '0');
    } else {
      const num = input * FEE_NUM * pool.reserveB2S;
      const den = pool.reserveSTX * FEE_DENOM + input * FEE_NUM;
      setOutputAmount(den > 0 ? (num / den).toFixed(6) : '0');
    }
  }, [inputAmount, swapDirection, pool]);

  const getMinOutput = () => {
    const out = parseFloat(outputAmount);
    if (!out) return 0;
    return Math.floor(out * (1 - slippage / 100) * 1_000_000);
  };

  const handleSwap = async () => {
    if (!address || !inputAmount || parseFloat(inputAmount) <= 0) return;
    setLoading(true);
    setTxId(null);

    try {
      const microInput = Math.floor(parseFloat(inputAmount) * 1_000_000);
      const minOut = getMinOutput();
      const functionName = swapDirection === 'b2s-to-stx' ? 'swap-b2s-for-stx' : 'swap-stx-for-b2s';

      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: POOL_CONTRACT,
        functionName,
        functionArgs: [uintCV(microInput), uintCV(minOut)],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId);
          setInputAmount('');
          setOutputAmount('0');
          setLoading(false);
          setTimeout(fetchPoolData, 5000);
        },
        onCancel: () => setLoading(false),
      });
    } catch (err) {
      console.error('Swap error:', err);
      setLoading(false);
    }
  };

  const handleAddLiquidity = async () => {
    if (!address || !b2sAmount || !stxAmount) return;
    setLoading(true);
    try {
      const microB2S = Math.floor(parseFloat(b2sAmount) * 1_000_000);
      const microSTX = Math.floor(parseFloat(stxAmount) * 1_000_000);

      await openContractCall({
        network,
        contractAddress: CONTRACT_ADDRESS,
        contractName: POOL_CONTRACT,
        functionName: 'add-liquidity',
        functionArgs: [uintCV(microB2S), uintCV(microSTX), uintCV(0)],
        postConditionMode: PostConditionMode.Allow,
        anchorMode: AnchorMode.Any,
        onFinish: (data) => {
          setTxId(data.txId);
          setB2sAmount('');
          setStxAmount('');
          setLoading(false);
          setTimeout(() => { fetchPoolData(); fetchUserLP(); }, 5000);
        },
        onCancel: () => setLoading(false),
      });
    } catch (err) {
      console.error('Add liquidity error:', err);
      setLoading(false);
    }
  };

  const flipSwapDirection = () => {
    setSwapDirection(d => d === 'b2s-to-stx' ? 'stx-to-b2s' : 'b2s-to-stx');
    setInputAmount('');
    setOutputAmount('0');
  };

  const getPrice = () => {
    if (!pool.reserveSTX || !pool.reserveB2S) return '—';
    return (pool.reserveB2S / pool.reserveSTX).toFixed(4);
  };

  const poolShare = pool.totalLPSupply > 0
    ? ((userLPBalance / pool.totalLPSupply) * 100).toFixed(2)
    : '0.00';

  if (!isConnected) {
    return (
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-8 border border-white/10 text-center">
        <p className="text-white/70 text-lg">Connect your wallet to access the liquidity pool</p>
      </div>
    );
  }

  return (
    <div className="liquidity-pool">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">💧 Liquidity Pool</h2>
        <p className="text-white/60">Swap tokens or provide liquidity — Stacks Mainnet</p>
      </div>

      {/* Pool Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg p-4 border border-blue-500/30">
          <p className="text-white/60 text-xs mb-1">Reserve $B2S</p>
          <p className="text-xl font-bold text-white">
            {pool.loading ? '...' : pool.reserveB2S.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg p-4 border border-purple-500/30">
          <p className="text-white/60 text-xs mb-1">Reserve STX</p>
          <p className="text-xl font-bold text-white">
            {pool.loading ? '...' : pool.reserveSTX.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-4 border border-green-500/30">
          <p className="text-white/60 text-xs mb-1">LP Supply</p>
          <p className="text-xl font-bold text-white">
            {pool.loading ? '...' : pool.totalLPSupply.toLocaleString()}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
          <p className="text-white/60 text-xs mb-1">B2S/STX Price</p>
          <p className="text-xl font-bold text-white">{getPrice()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-white/10">
        {(['swap', 'liquidity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 font-semibold transition-all ${
              activeTab === tab ? 'text-white border-b-2 border-blue-500' : 'text-white/60 hover:text-white'
            }`}
          >
            {tab === 'swap' ? '🔄 Swap' : '💧 Add Liquidity'}
          </button>
        ))}
      </div>

      {/* Swap */}
      {activeTab === 'swap' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">

            {/* Slippage */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-white/60 text-sm">Slippage tolerance</span>
              <div className="flex gap-2">
                {[0.5, 1, 2].map(s => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                      slippage === s ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="mb-2">
              <div className="flex justify-between mb-2">
                <label className="text-white/70 text-sm">You Pay</label>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex justify-between items-center">
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  placeholder="0.0"
                  className="bg-transparent text-white text-2xl font-bold outline-none w-full"
                />
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg ml-2">
                  <span className="text-2xl">{swapDirection === 'b2s-to-stx' ? '💎' : '🪙'}</span>
                  <span className="text-white font-semibold">{swapDirection === 'b2s-to-stx' ? '$B2S' : 'STX'}</span>
                </div>
              </div>
            </div>

            {/* Flip */}
            <div className="flex justify-center -my-2 z-10 relative">
              <button
                onClick={flipSwapDirection}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 p-3 rounded-xl border-4 border-[#0f172a] transition-all hover:rotate-180 duration-300"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* Output */}
            <div className="mt-2 mb-4">
              <div className="flex justify-between mb-2">
                <label className="text-white/70 text-sm">You Receive</label>
                <span className="text-white/50 text-xs">Min: {(parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6)}</span>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10 flex justify-between items-center">
                <div className="text-white text-2xl font-bold">{outputAmount}</div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg ml-2">
                  <span className="text-2xl">{swapDirection === 'b2s-to-stx' ? '🪙' : '💎'}</span>
                  <span className="text-white font-semibold">{swapDirection === 'b2s-to-stx' ? 'STX' : '$B2S'}</span>
                </div>
              </div>
            </div>

            {/* Details */}
            {inputAmount && parseFloat(inputAmount) > 0 && (
              <div className="p-3 bg-white/5 rounded-lg space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-white/60">Rate</span>
                  <span className="text-white">1 {swapDirection === 'b2s-to-stx' ? '$B2S' : 'STX'} ≈ {getPrice()} {swapDirection === 'b2s-to-stx' ? 'STX' : '$B2S'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Fee (0.25%)</span>
                  <span className="text-white">{(parseFloat(inputAmount) * 0.0025).toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Slippage</span>
                  <span className="text-yellow-400">{slippage}%</span>
                </div>
              </div>
            )}

            <button
              onClick={handleSwap}
              disabled={!inputAmount || parseFloat(inputAmount) <= 0 || loading || pool.loading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-all"
            >
              {loading ? '⏳ Swapping...' : '🔄 Swap Tokens'}
            </button>

            {txId && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                <p className="text-green-400 font-semibold mb-1">✅ Transaction submitted!</p>
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
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded text-white/80 text-sm">
            <p className="font-semibold mb-1">💡 Pro Tip</p>
            <p>Large swaps may have higher slippage. Consider splitting into multiple transactions for better rates.</p>
          </div>
        </div>
      )}

      {/* Add Liquidity */}
      {activeTab === 'liquidity' && (
        <div className="max-w-lg mx-auto">
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Add Liquidity</h3>

            {/* Your Position */}
            <div className="mb-6 p-4 bg-white/5 rounded-lg">
              <p className="text-white/60 text-sm mb-2">Your Position</p>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-white">{userLPBalance.toFixed(4)} LP</p>
                  <p className="text-white/50 text-xs">Pool Share: {poolShare}%</p>
                </div>
                <div className="text-right text-white/50 text-xs">
                  {pool.totalLPSupply > 0 && userLPBalance > 0 && (
                    <>
                      <p>{(pool.reserveB2S * userLPBalance / pool.totalLPSupply).toFixed(2)} $B2S</p>
                      <p>{(pool.reserveSTX * userLPBalance / pool.totalLPSupply).toFixed(2)} STX</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/70 text-sm mb-2 block">$B2S Amount</label>
                <input
                  type="number"
                  value={b2sAmount}
                  onChange={(e) => setB2sAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">STX Amount</label>
                <input
                  type="number"
                  value={stxAmount}
                  onChange={(e) => setStxAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={handleAddLiquidity}
              disabled={!b2sAmount || !stxAmount || loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-6 py-4 rounded-lg font-bold text-lg transition-all"
            >
              {loading ? '⏳ Processing...' : '💧 Add Liquidity'}
            </button>

            {txId && (
              <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm">
                <p className="text-green-400 font-semibold mb-1">✅ Transaction submitted!</p>
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
          </div>
        </div>
      )}
    </div>
  );
}