'use client'

import { useState, useEffect, useCallback } from 'react'
import { exportToCSV, exportToJSON } from '@/utils/exportCSV'

const HIRO_API = 'https://api.mainnet.hiro.so'
const CONTRACT_ADDRESS = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const DECIMALS = 1_000_000

const TRACKED_CONTRACTS: Record<string, string> = {
  'b2s-staking-vault-v2':       'stake',
  'b2s-rewards-distributor-v3': 'claim',
  'b2s-liquidity-pool-v5':      'swap',
  'b2s-liquidity-pool-v6':      'swap',
  'b2s-prediction-market':      'bet',
  'b2s-governance':              'governance',
  'b2s-airdrop-v2':             'airdrop',
}

const TX_TYPE_COLORS: Record<string, string> = {
  stake:      'bg-blue-500/20 text-blue-400',
  unstake:    'bg-orange-500/20 text-orange-400',
  claim:      'bg-green-500/20 text-green-400',
  swap:       'bg-cyan-500/20 text-cyan-400',
  bet:        'bg-purple-500/20 text-purple-400',
  governance: 'bg-pink-500/20 text-pink-400',
  airdrop:    'bg-yellow-500/20 text-yellow-400',
  other:      'bg-white/10 text-white/60',
}

interface Transaction {
  id: string
  type: string
  amount: number
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
  contractName: string
  functionName: string
  blockHeight: number
}

function classifyTx(tx: any): { type: string; amount: number; contractName: string } {
  const contractName = tx.contract_call?.contract_id?.split('.')?.[1] || ''
  const functionName = tx.contract_call?.function_name || ''
  const args = tx.contract_call?.function_args || []

  const baseType = TRACKED_CONTRACTS[contractName] || 'other'

  // Refine type for unstake
  let type = baseType
  if (functionName === 'unstake') type = 'unstake'
  if (functionName === 'claim-daily-reward' || functionName === 'claim-rewards') type = 'claim'

  // Extract amount from first uint arg if present
  const amount = args[0]?.repr?.startsWith('u')
    ? parseInt(args[0].repr.replace('u', '')) / DECIMALS
    : 0

  return { type, amount, contractName }
}

async function fetchAddressTransactions(address: string): Promise<Transaction[]> {
  const results: Transaction[] = []

  // Fetch from all tracked contracts in parallel
  const fetches = Object.keys(TRACKED_CONTRACTS).map(contractName =>
    fetch(
      `${HIRO_API}/extended/v1/address/${address}/transactions?limit=20&offset=0`,
      { headers: { Accept: 'application/json' } }
    )
  )

  // Actually fetch from address transactions (filtered by contract calls to our contracts)
  const res = await fetch(
    `${HIRO_API}/extended/v1/address/${address}/transactions?limit=50`,
    { headers: { Accept: 'application/json' } }
  )

  if (!res.ok) return []
  const data = await res.json()

  for (const tx of data.results || []) {
    if (tx.tx_type !== 'contract_call') continue

    const contractId = tx.contract_call?.contract_id || ''
    const [contractOwner, contractName] = contractId.split('.')

    // Only show our contracts
    if (contractOwner !== CONTRACT_ADDRESS) continue
    if (!TRACKED_CONTRACTS[contractName]) continue

    const { type, amount, contractName: cn } = classifyTx(tx)

    const status: Transaction['status'] =
      tx.tx_status === 'success' ? 'confirmed' :
      tx.tx_status === 'pending' ? 'pending' : 'failed'

    results.push({
      id: tx.tx_id,
      type,
      amount,
      timestamp: new Date(tx.burn_block_time_iso || Date.now()),
      status,
      contractName: contractName,
      functionName: tx.contract_call?.function_name || '',
      blockHeight: tx.block_height || 0,
    })
  }

  return results
}

export function TransactionHistory({ address }: { address: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const loadTransactions = useCallback(async () => {
    if (!address) return
    try {
      setLoading(true)
      setError(null)
      const txs = await fetchAddressTransactions(address)
      setTransactions(txs)
    } catch {
      setError('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    loadTransactions()
    const interval = setInterval(loadTransactions, 60_000)
    return () => clearInterval(interval)
  }, [loadTransactions])

  const handleExportCSV = () => {
    exportToCSV(
      transactions.map(t => ({
        ...t,
        timestamp: t.timestamp.toISOString(),
      })),
      `b2s-transactions-${address.slice(0, 8)}.csv`
    )
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    exportToJSON(
      transactions.map(t => ({
        ...t,
        timestamp: t.timestamp.toISOString(),
      })),
      `b2s-transactions-${address.slice(0, 8)}.json`
    )
    setShowExportMenu(false)
  }

  const txTypes = ['all', ...Array.from(new Set(transactions.map(t => t.type)))]

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.type === filter)

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse">
            <div className="flex justify-between">
              <div>
                <div className="h-5 bg-white/10 rounded w-20 mb-2" />
                <div className="h-4 bg-white/10 rounded w-24" />
              </div>
              <div className="text-right">
                <div className="h-4 bg-white/10 rounded w-20 mb-2" />
                <div className="h-3 bg-white/10 rounded w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
        ⚠️ {error}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <p className="text-2xl mb-2">📭</p>
        <p>No B2S transactions found</p>
        <p className="text-sm mt-2">Start by staking or swapping $B2S!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header: Filter + Export */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        {/* Type filter */}
        <div className="flex gap-2 flex-wrap">
          {txTypes.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize ${
                filter === t
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-all border border-white/20"
          >
            📥 Export
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-lg shadow-xl z-10 overflow-hidden">
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all flex items-center gap-2"
              >
                📊 Export as CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-all flex items-center gap-2 border-t border-white/10"
              >
                📄 Export as JSON
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Transaction list */}
      {filtered.map(tx => (
        <div
          key={tx.id}
          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${TX_TYPE_COLORS[tx.type] || TX_TYPE_COLORS.other}`}>
                  {tx.type.toUpperCase()}
                </span>
                <span className="text-white/40 text-xs">{tx.contractName}</span>
              </div>
              {tx.amount > 0 && (
                <p className="text-white font-semibold mt-1">
                  {tx.amount >= 1000
                    ? `${(tx.amount / 1000).toFixed(1)}K`
                    : tx.amount.toFixed(2)}{' '}
                  $B2S
                </p>
              )}
              <p className="text-white/40 text-xs mt-1 font-mono">
                {tx.functionName}
              </p>
            </div>

            <div className="text-right">
              <p className={`text-xs font-semibold mb-1 ${
                tx.status === 'confirmed' ? 'text-green-400' :
                tx.status === 'pending' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {tx.status === 'confirmed' ? '✅' : tx.status === 'pending' ? '⏳' : '❌'} {tx.status}
              </p>
              <p className="text-white/50 text-xs">
                {tx.timestamp.toLocaleDateString()} {tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <a
                href={`https://explorer.hiro.so/txid/${tx.id}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 text-xs hover:underline"
              >
                #{tx.blockHeight} ↗
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}