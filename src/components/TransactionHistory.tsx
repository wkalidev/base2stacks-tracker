'use client'

import { useState, useEffect, useCallback } from 'react'
import { exportToCSV, exportToJSON } from '@/utils/exportCSV'

const HIRO_API         = 'https://api.mainnet.hiro.so'
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const DECIMALS         = 1_000_000

const TRACKED_CONTRACTS: Record<string, string> = {
  'b2s-token':                  'claim',
  'b2s-token-v4':               'claim',
  'b2s-staking-vault-v2':       'stake',
  'b2s-rewards-distributor-v3': 'claim',
  'b2s-liquidity-pool-v5':      'swap',
  'b2s-liquidity-pool-v6':      'swap',
  'b2s-prediction-market':      'bet',
  'b2s-governance':             'governance',
  'b2s-airdrop-v2':             'airdrop',
}

const TX_STYLE: Record<string, { color: string; label: string }> = {
  stake:      { color: '#00d4ff', label: 'STAKE'      },
  unstake:    { color: '#ff6600', label: 'UNSTAKE'    },
  claim:      { color: '#00ff9f', label: 'CLAIM'      },
  swap:       { color: '#ff00ff', label: 'SWAP'       },
  bet:        { color: '#9945ff', label: 'BET'        },
  governance: { color: '#ffd700', label: 'GOVERNANCE' },
  airdrop:    { color: '#ffff00', label: 'AIRDROP'    },
  other:      { color: 'rgba(255,255,255,0.3)', label: 'OTHER' },
}

interface Transaction {
  id: string; type: string; amount: number; timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
  contractName: string; functionName: string; blockHeight: number
}

function classifyTx(tx: any) {
  const contractName = tx.contract_call?.contract_id?.split('.')?.[1] || ''
  const functionName = tx.contract_call?.function_name || ''
  const args         = tx.contract_call?.function_args || []
  let type = TRACKED_CONTRACTS[contractName] || 'other'
  if (functionName === 'unstake') type = 'unstake'
  if (functionName === 'claim-daily-reward' || functionName === 'claim-rewards') type = 'claim'
  const amount = args[0]?.repr?.startsWith('u') ? parseInt(args[0].repr.replace('u','')) / DECIMALS : 0
  return { type, amount, contractName }
}

async function fetchAddressTransactions(address: string): Promise<Transaction[]> {
  const [res, mempoolRes] = await Promise.all([
    fetch(`${HIRO_API}/extended/v1/address/${address}/transactions?limit=50`, { headers: { Accept: 'application/json' }, cache: 'no-store' }),
    fetch(`${HIRO_API}/extended/v1/address/${address}/mempool?limit=20`, { headers: { Accept: 'application/json' }, cache: 'no-store' }),
  ])
  if (!res.ok) return []
  const [data, mempoolData] = await Promise.all([res.json(), mempoolRes.ok ? mempoolRes.json() : { results: [] }])
  const allTxs = [...(mempoolData.results || []).map((tx: any) => ({ ...tx, tx_status: 'pending' })), ...(data.results || [])]
  const results: Transaction[] = []
  for (const tx of allTxs) {
    if (tx.tx_type !== 'contract_call') continue
    const [owner, name] = (tx.contract_call?.contract_id || '').split('.')
    if (owner !== CONTRACT_ADDRESS || !TRACKED_CONTRACTS[name]) continue
    const { type, amount } = classifyTx(tx)
    results.push({
      id: tx.tx_id, type, amount,
      timestamp: tx.burn_block_time_iso ? new Date(tx.burn_block_time_iso) : tx.receipt_time_iso ? new Date(tx.receipt_time_iso) : tx.receipt_time ? new Date(tx.receipt_time * 1000) : new Date(),
      status: tx.tx_status === 'success' ? 'confirmed' : tx.tx_status === 'pending' ? 'pending' : 'failed',
      contractName: name, functionName: tx.contract_call?.function_name || '', blockHeight: tx.block_height || 0,
    })
  }
  const seen = new Set<string>()
  return results.filter(tx => { if (seen.has(tx.id)) return false; seen.add(tx.id); return true })
}

const STATUS_COLOR = { confirmed: '#00ff9f', pending: '#ffd700', failed: '#ff4444' }
const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

export function TransactionHistory({ address }: { address: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading]           = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [error, setError]               = useState<string | null>(null)
  const [filter, setFilter]             = useState('all')

  const loadTransactions = useCallback(async () => {
    if (!address) return
    try { setLoading(true); setError(null); setTransactions(await fetchAddressTransactions(address)) }
    catch { setError('RPC_ERROR: failed to load transactions') }
    finally { setLoading(false) }
  }, [address])

  useEffect(() => { loadTransactions(); const t = setInterval(loadTransactions, 30_000); return () => clearInterval(t) }, [loadTransactions])

  const exportRows = () => transactions.map(t => ({ id: t.id, type: t.type, amount: t.amount, status: t.status, contractName: t.contractName, functionName: t.functionName, blockHeight: t.blockHeight, timestamp: t.timestamp.toISOString() }))
  const txTypes    = ['all', ...Array.from(new Set(transactions.map(t => t.type)))]
  const filtered   = filter === 'all' ? transactions : transactions.filter(t => t.type === filter)

  if (loading) return (
    <div style={MONO} className="space-y-2">
      {[...Array(4)].map((_, i) => <div key={i} className="h-14 rounded-xl border border-white/[0.05] bg-white/[0.02] animate-pulse" />)}
    </div>
  )

  if (error) return (
    <div style={MONO} className="rounded-xl border border-[#ff4444]/30 bg-[#ff4444]/[0.06] px-4 py-3 text-[#ff4444] text-xs font-mono">⚠ {error}</div>
  )

  if (transactions.length === 0) return (
    <div style={MONO} className="text-center py-10 rounded-2xl border border-white/[0.07] bg-black/40">
      <p className="text-3xl mb-2">📭</p>
      <p className="text-white font-black tracking-widest mb-1">NO_TRANSACTIONS_FOUND</p>
      <p className="text-white/25 text-xs">Start staking or swapping $B2S</p>
    </div>
  )

  return (
    <div style={MONO} className="space-y-4">

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {txTypes.map(t => {
            const style = TX_STYLE[t] || TX_STYLE.other
            return (
              <button key={t} onClick={() => setFilter(t)}
                className="px-3 py-1.5 rounded-xl text-[9px] font-black tracking-widest transition-all"
                style={{
                  background: filter === t ? `${style.color}15` : 'rgba(255,255,255,0.03)',
                  border:     `1px solid ${filter === t ? `${style.color}40` : 'rgba(255,255,255,0.07)'}`,
                  color:      filter === t ? style.color : 'rgba(255,255,255,0.3)',
                }}>
                {t === 'all' ? 'ALL' : style.label}
              </button>
            )
          })}
        </div>

        <div className="relative">
          <button onClick={() => setShowExportMenu(e => !e)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
            ↓ EXPORT
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/10 bg-black/95 overflow-hidden z-10" style={MONO}>
              {[
                { label: '⬛ EXPORT CSV',  fn: () => { exportToCSV(exportRows(), `b2s-txs-${address.slice(0,8)}.csv`); setShowExportMenu(false) } },
                { label: '⬛ EXPORT JSON', fn: () => { exportToJSON(exportRows(), `b2s-txs-${address.slice(0,8)}.json`); setShowExportMenu(false) } },
              ].map(item => (
                <button key={item.label} onClick={item.fn} className="w-full px-4 py-3 text-left text-[10px] font-black text-white/50 hover:text-white hover:bg-white/5 transition-all tracking-widest border-b border-white/[0.05] last:border-0">
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TX list */}
      <div className="space-y-1.5">
        {filtered.map(tx => {
          const style   = TX_STYLE[tx.type] || TX_STYLE.other
          const sColor  = STATUS_COLOR[tx.status]
          const pending = tx.status === 'pending'

          return (
            <div key={tx.id}
              className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/15 transition-all duration-200 hover:-translate-y-px">
              {pending && <div className="absolute inset-0 animate-pulse" style={{ background: 'rgba(255,215,0,0.02)' }} />}
              <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: style.color }} />

              <div className="flex items-center gap-3 px-4 py-3">
                {/* Type badge */}
                <span className="px-2 py-0.5 rounded text-[8px] font-black tracking-widest flex-shrink-0"
                      style={{ background: `${style.color}15`, border: `1px solid ${style.color}30`, color: style.color }}>
                  {style.label}
                </span>

                {/* Contract + fn */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-[10px] font-mono truncate">{tx.contractName}</span>
                    {pending && <span className="text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>PENDING</span>}
                  </div>
                  <p className="text-white/20 text-[9px] font-mono">{tx.functionName}</p>
                </div>

                {/* Amount */}
                {tx.amount > 0 && (
                  <div className="text-center hidden sm:block">
                    <p className="text-white font-black text-sm tabular-nums">
                      {tx.amount >= 1000 ? `${(tx.amount/1000).toFixed(1)}K` : tx.amount.toFixed(2)}
                    </p>
                    <p className="text-white/20 text-[9px]">$B2S</p>
                  </div>
                )}

                {/* Status + time */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[9px] font-black tracking-wider" style={{ color: sColor }}>
                    {tx.status === 'confirmed' ? '✓' : tx.status === 'pending' ? '◌' : '✗'} {tx.status.toUpperCase()}
                  </p>
                  <p className="text-white/20 text-[9px] font-mono mt-0.5">
                    {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <a href={`https://explorer.hiro.so/txid/${tx.id}?chain=mainnet`} target="_blank" rel="noopener noreferrer"
                    className="text-[9px] font-mono transition-colors hover:opacity-80" style={{ color: style.color }}>
                    {tx.blockHeight > 0 ? `#${tx.blockHeight}` : 'VIEW'} ↗
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}