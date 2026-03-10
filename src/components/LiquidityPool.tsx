'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/hooks/useWallet';
import {
  callReadOnlyFunction, cvToJSON, uintCV, standardPrincipalCV,
  PostConditionMode, AnchorMode, contractPrincipalCV,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import { StacksMainnet } from '@stacks/network';

const network = new StacksMainnet();
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96';
const POOL_CONTRACT    = 'b2s-liquidity-pool-v5';
const USDCX_ADDRESS   = 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE';
const USDCX_CONTRACT  = 'tokensoft-token';

type SwapPair = 'b2s-stx' | 'b2s-usdcx' | 'stx-usdcx';
type SwapDir  = 'forward' | 'reverse';

const PAIRS: Record<SwapPair, { tokenA: string; tokenB: string; iconA: string; iconB: string }> = {
  'b2s-stx':   { tokenA: '$B2S', tokenB: 'STX',   iconA: '💎', iconB: '🪙' },
  'b2s-usdcx': { tokenA: '$B2S', tokenB: 'USDCx', iconA: '💎', iconB: '💵' },
  'stx-usdcx': { tokenA: 'STX',  tokenB: 'USDCx', iconA: '🪙', iconB: '💵' },
};

interface PoolReserves {
  reserveB2S: number;
  reserveSTX: number;
  reserveUSDCx: number;
  totalLPSupply: number;
  loading: boolean;
}

// ── Mini stat card ────────────────────────────────────────────────────────────
function PoolStat({ label, value, icon, loading }: { label: string; value: number; icon: string; loading: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 group hover:border-white/15 transition-all duration-300">
      <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/[0.02] group-hover:bg-white/[0.04] transition-all" />
      <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-2">{label}</p>
      {loading ? (
        <div className="h-6 w-20 bg-white/10 rounded animate-pulse" />
      ) : (
        <p className="text-white font-black text-xl tabular-nums">
          {icon} {value > 0 ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : <span className="text-white/20">0</span>}
        </p>
      )}
    </div>
  );
}

export default function LiquidityPool() {
  const { address, isConnected } = useWallet();
  const [activeTab, setActiveTab]     = useState<'swap' | 'liquidity'>('swap');
  const [activePair, setActivePair]   = useState<SwapPair>('b2s-stx');
  const [swapDir, setSwapDir]         = useState<SwapDir>('forward');
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('0');
  const [slippage, setSlippage]       = useState(1);
  const [loading, setLoading]         = useState(false);
  const [txId, setTxId]               = useState<string | null>(null);
  const [txType, setTxType]           = useState('');
  const [b2sAmount, setB2sAmount]     = useState('');
  const [stxAmount, setStxAmount]     = useState('');
  const [userLPBalance, setUserLPBalance] = useState(0);
  const [flipping, setFlipping]       = useState(false);

  const [pool, setPool] = useState<PoolReserves>({
    reserveB2S: 0, reserveSTX: 0, reserveUSDCx: 0, totalLPSupply: 0, loading: true,
  });

  // ── Fetch pool reserves ───────────────────────────────────────────────────
  const fetchPoolData = useCallback(async () => {
    try {
      const sender = address || CONTRACT_ADDRESS;
      const [b2sRes, stxRes, lpRes] = await Promise.all([
        callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-reserve-b2s',      functionArgs: [], senderAddress: sender }),
        callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-reserve-stx',      functionArgs: [], senderAddress: sender }),
        callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-total-lp-supply',  functionArgs: [], senderAddress: sender }),
      ]);
      let usdcxReserve = 0;
      try {
        const uRes = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-reserve-usdcx', functionArgs: [], senderAddress: sender });
        usdcxReserve = Number(cvToJSON(uRes).value) / 1_000_000;
      } catch {}
      setPool({
        reserveB2S:    Number(cvToJSON(b2sRes).value) / 1_000_000,
        reserveSTX:    Number(cvToJSON(stxRes).value) / 1_000_000,
        reserveUSDCx:  usdcxReserve,
        totalLPSupply: Number(cvToJSON(lpRes).value) / 1_000_000,
        loading: false,
      });
    } catch {
      setPool(prev => ({ ...prev, loading: false }));
    }
  }, [address]);

  const fetchUserLP = useCallback(async () => {
    if (!address) return;
    try {
      const result = await callReadOnlyFunction({ network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT, functionName: 'get-lp-balance', functionArgs: [standardPrincipalCV(address)], senderAddress: address });
      setUserLPBalance(Number(cvToJSON(result).value) / 1_000_000);
    } catch {}
  }, [address]);

  useEffect(() => {
    fetchPoolData();
    const interval = setInterval(fetchPoolData, 30_000);
    return () => clearInterval(interval);
  }, [fetchPoolData]);

  useEffect(() => { if (address) fetchUserLP(); }, [address, fetchUserLP]);

  // ── AMM price calc ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!inputAmount || parseFloat(inputAmount) <= 0 || pool.loading) { setOutputAmount('0'); return; }
    const input = parseFloat(inputAmount);
    const FEE = 9975; const DENOM = 10000;
    const getReserves = (): [number, number] => {
      if (activePair === 'b2s-stx')   return swapDir === 'forward' ? [pool.reserveB2S,  pool.reserveSTX]   : [pool.reserveSTX,   pool.reserveB2S];
      if (activePair === 'b2s-usdcx') return swapDir === 'forward' ? [pool.reserveB2S,  pool.reserveUSDCx] : [pool.reserveUSDCx, pool.reserveB2S];
      return swapDir === 'forward' ? [pool.reserveSTX, pool.reserveUSDCx] : [pool.reserveUSDCx, pool.reserveSTX];
    };
    const [rIn, rOut] = getReserves();
    const num = input * FEE * rOut;
    const den = rIn * DENOM + input * FEE;
    setOutputAmount(den > 0 ? (num / den).toFixed(6) : '0');
  }, [inputAmount, activePair, swapDir, pool]);

  const getTokenLabels = () => {
    const pair = PAIRS[activePair];
    return swapDir === 'forward'
      ? { from: pair.tokenA, to: pair.tokenB, iconFrom: pair.iconA, iconTo: pair.iconB }
      : { from: pair.tokenB, to: pair.tokenA, iconFrom: pair.iconB, iconTo: pair.iconA };
  };

  const getFunctionName = (): string => {
    const map: Record<string, Record<SwapDir, string>> = {
      'b2s-stx':   { forward: 'swap-b2s-for-stx',   reverse: 'swap-stx-for-b2s'   },
      'b2s-usdcx': { forward: 'swap-b2s-for-usdcx', reverse: 'swap-usdcx-for-b2s' },
      'stx-usdcx': { forward: 'swap-stx-for-usdcx', reverse: 'swap-usdcx-for-stx' },
    };
    return map[activePair][swapDir];
  };

  const handleSwap = async () => {
    if (!address || !inputAmount || parseFloat(inputAmount) <= 0) return;
    setLoading(true); setTxId(null); setTxType('Swap');
    try {
      const microInput = Math.floor(parseFloat(inputAmount) * 1_000_000);
      const minOut     = Math.floor(parseFloat(outputAmount) * (1 - slippage / 100) * 1_000_000);
      const baseArgs   = [uintCV(microInput), uintCV(minOut)];
      const functionArgs = activePair.includes('usdcx')
        ? [...baseArgs, contractPrincipalCV(USDCX_ADDRESS, USDCX_CONTRACT)]
        : baseArgs;
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT,
        functionName: getFunctionName(), functionArgs,
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setInputAmount(''); setOutputAmount('0'); setLoading(false); setTimeout(fetchPoolData, 5000); },
        onCancel: () => setLoading(false),
      });
    } catch { setLoading(false); }
  };

  const handleAddLiquidity = async () => {
    if (!address || !b2sAmount || !stxAmount) return;
    setLoading(true); setTxType('Add Liquidity');
    try {
      await openContractCall({
        network, contractAddress: CONTRACT_ADDRESS, contractName: POOL_CONTRACT,
        functionName: 'add-liquidity',
        functionArgs: [uintCV(Math.floor(parseFloat(b2sAmount) * 1_000_000)), uintCV(Math.floor(parseFloat(stxAmount) * 1_000_000)), uintCV(0)],
        postConditionMode: PostConditionMode.Allow, anchorMode: AnchorMode.Any,
        onFinish: (data) => { setTxId(data.txId); setB2sAmount(''); setStxAmount(''); setLoading(false); setTimeout(() => { fetchPoolData(); fetchUserLP(); }, 5000); },
        onCancel: () => setLoading(false),
      });
    } catch { setLoading(false); }
  };

  const handleFlip = () => {
    setFlipping(true);
    setTimeout(() => setFlipping(false), 400);
    setSwapDir(d => d === 'forward' ? 'reverse' : 'forward');
    setInputAmount('');
    setOutputAmount('0');
  };

  const poolShare = pool.totalLPSupply > 0 ? ((userLPBalance / pool.totalLPSupply) * 100).toFixed(2) : '0.00';
  const { from, to, iconFrom, iconTo } = getTokenLabels();
  const priceImpact = inputAmount && parseFloat(inputAmount) > 0
    ? Math.min(((parseFloat(inputAmount) / (pool.reserveB2S || 1)) * 100), 99).toFixed(2)
    : '0.00';

  // ── Not connected ─────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center">
        <div className="text-5xl mb-4">💧</div>
        <p className="text-white/50 text-base">Connect your wallet to access the liquidity pool</p>
      </div>
    );
  }

  return (
    <div className="liquidity-pool space-y-6">

      {/* ── Pool Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <PoolStat label="Reserve $B2S"  value={pool.reserveB2S}    icon="💎" loading={pool.loading} />
        <PoolStat label="Reserve STX"   value={pool.reserveSTX}    icon="🪙" loading={pool.loading} />
        <PoolStat label="Reserve USDCx" value={pool.reserveUSDCx}  icon="💵" loading={pool.loading} />
        <PoolStat label="LP Supply"     value={pool.totalLPSupply} icon="🏊" loading={pool.loading} />
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.07] w-fit">
        {(['swap', 'liquidity'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === tab
                ? 'bg-white text-black shadow-lg'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {tab === 'swap' ? '🔄 Swap' : '💧 Add Liquidity'}
          </button>
        ))}
      </div>

      {/* ── Swap Tab ── */}
      {activeTab === 'swap' && (
        <div className="max-w-lg mx-auto space-y-4">

          {/* Pair selector */}
          <div className="flex gap-2">
            {(Object.keys(PAIRS) as SwapPair[]).map(pair => (
              <button
                key={pair}
                onClick={() => { setActivePair(pair); setSwapDir('forward'); setInputAmount(''); setOutputAmount('0'); }}
                className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                  activePair === pair
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-white/[0.04] border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/20'
                }`}
              >
                {PAIRS[pair].iconA} {PAIRS[pair].tokenA}/{PAIRS[pair].tokenB} {PAIRS[pair].iconB}
              </button>
            ))}
          </div>

          {/* Swap card */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">

            {/* Slippage */}
            <div className="flex justify-between items-center px-5 py-3 border-b border-white/[0.05]">
              <span className="text-white/30 text-xs font-semibold uppercase tracking-wider">Slippage</span>
              <div className="flex gap-1">
                {[0.5, 1, 2].map(s => (
                  <button
                    key={s}
                    onClick={() => setSlippage(s)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      slippage === s
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-2">
              {/* Input field */}
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-4 flex items-center gap-3 focus-within:border-white/20 transition-colors">
                <div className="flex flex-col flex-1">
                  <span className="text-white/30 text-xs mb-1">Selling</span>
                  <input
                    type="number"
                    value={inputAmount}
                    onChange={e => setInputAmount(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-white text-2xl font-black outline-none w-full placeholder-white/20"
                  />
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl flex-shrink-0">
                  <span className="text-xl">{iconFrom}</span>
                  <span className="text-white font-bold text-sm">{from}</span>
                </div>
              </div>

              {/* Flip button */}
              <div className="flex justify-center relative z-10 -my-1">
                <button
                  onClick={handleFlip}
                  className={`p-2.5 rounded-xl border border-white/10 bg-white/[0.06] hover:bg-white/10 text-white transition-all duration-300 ${flipping ? 'rotate-180' : ''}`}
                >
                  ⇅
                </button>
              </div>

              {/* Output field */}
              <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-4 flex items-center gap-3">
                <div className="flex flex-col flex-1">
                  <span className="text-white/30 text-xs mb-1">Buying</span>
                  <div className="text-white text-2xl font-black tabular-nums">
                    {parseFloat(outputAmount) > 0 ? outputAmount : <span className="text-white/20">0.0</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl flex-shrink-0">
                  <span className="text-xl">{iconTo}</span>
                  <span className="text-white font-bold text-sm">{to}</span>
                </div>
              </div>

              {/* Swap details */}
              {inputAmount && parseFloat(inputAmount) > 0 && (
                <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] divide-y divide-white/[0.04] text-xs">
                  {[
                    { label: 'Fee (0.25%)',    value: `${(parseFloat(inputAmount) * 0.0025).toFixed(6)} ${from}`,                      color: '' },
                    { label: 'Min received',   value: `${(parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6)} ${to}`,          color: '' },
                    { label: 'Price impact',   value: `~${priceImpact}%`,                                                                color: parseFloat(priceImpact) > 5 ? 'text-red-400' : 'text-emerald-400' },
                    { label: 'Slippage',       value: `${slippage}%`,                                                                   color: 'text-amber-400' },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between px-4 py-2.5">
                      <span className="text-white/30">{row.label}</span>
                      <span className={row.color || 'text-white/70'}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Swap button */}
              <button
                onClick={handleSwap}
                disabled={!inputAmount || parseFloat(inputAmount) <= 0 || loading || pool.loading}
                className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: loading ? '#1e293b' : 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}
              >
                {loading ? '⏳ Swapping...' : `🔄 Swap ${from} → ${to}`}
              </button>
            </div>
          </div>

          {/* USDCx info */}
          <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/20">
            <span className="text-lg flex-shrink-0">💵</span>
            <p className="text-white/50 text-xs leading-relaxed">
              <span className="text-white/70 font-semibold">USDCx on Stacks</span> — Circle USDC bridged natively to Stacks. 1 USDCx = 1 USD, fully backed.
            </p>
          </div>

          {/* TX confirmation */}
          {txId && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 font-bold text-sm mb-1">✅ {txType} submitted!</p>
              <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline break-all">View on Explorer ↗</a>
            </div>
          )}
        </div>
      )}

      {/* ── Liquidity Tab ── */}
      {activeTab === 'liquidity' && (
        <div className="max-w-lg mx-auto space-y-4">

          {/* User position */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
            <p className="text-white/30 text-xs font-semibold uppercase tracking-wider mb-3">Your Position</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-black text-white tabular-nums">{userLPBalance.toFixed(4)}</p>
                <p className="text-white/30 text-xs mt-0.5">LP Tokens · {poolShare}% pool share</p>
              </div>
              {pool.totalLPSupply > 0 && userLPBalance > 0 && (
                <div className="text-right space-y-1">
                  <p className="text-white/50 text-xs">💎 {(pool.reserveB2S * userLPBalance / pool.totalLPSupply).toFixed(2)} $B2S</p>
                  <p className="text-white/50 text-xs">🪙 {(pool.reserveSTX * userLPBalance / pool.totalLPSupply).toFixed(2)} STX</p>
                </div>
              )}
            </div>
          </div>

          {/* Add liquidity form */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 space-y-3">
            <p className="text-white/50 text-sm font-semibold">Add Liquidity</p>
            {[
              { label: '$B2S Amount', value: b2sAmount, setter: setB2sAmount, icon: '💎' },
              { label: 'STX Amount',  value: stxAmount, setter: setStxAmount, icon: '🪙' },
            ].map(field => (
              <div key={field.label} className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-4 flex items-center gap-3 focus-within:border-white/20 transition-colors">
                <span className="text-xl">{field.icon}</span>
                <div className="flex-1">
                  <p className="text-white/30 text-xs mb-1">{field.label}</p>
                  <input
                    type="number"
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-white text-xl font-black outline-none w-full placeholder-white/20"
                  />
                </div>
              </div>
            ))}

            <button
              onClick={handleAddLiquidity}
              disabled={!b2sAmount || !stxAmount || loading}
              className="w-full py-4 rounded-xl font-black text-base transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: loading ? '#1e293b' : 'linear-gradient(135deg, #7c3aed, #db2777)' }}
            >
              {loading ? '⏳ Processing...' : '💧 Add Liquidity'}
            </button>
          </div>

          {txId && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 font-bold text-sm mb-1">✅ {txType} submitted!</p>
              <a href={`https://explorer.hiro.so/txid/${txId}?chain=mainnet`} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs hover:underline break-all">View on Explorer ↗</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}