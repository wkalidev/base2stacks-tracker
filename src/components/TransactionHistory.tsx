'use client'

import { useState, useEffect } from 'react'
import { exportToCSV, exportToJSON } from '@/utils/exportCSV'

interface Transaction {
  id: string
  type: 'claim' | 'stake' | 'unstake'
  amount: number
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

export function TransactionHistory({ address }: { address: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showExportMenu, setShowExportMenu] = useState(false)

  // Mock data for now - will integrate with real API later
  useEffect(() => {
    if (!address) return

    const mockTransactions: Transaction[] = [
      {
        id: '0x1234...5678',
        type: 'claim',
        amount: 5,
        timestamp: new Date(),
        status: 'confirmed'
      }
    ]

    setTransactions(mockTransactions)
  }, [address])

  const handleExportCSV = () => {
    exportToCSV(transactions, `b2s-transactions-${address.slice(0, 8)}.csv`)
    setShowExportMenu(false)
  }

  const handleExportJSON = () => {
    exportToJSON(transactions, `b2s-transactions-${address.slice(0, 8)}.json`)
    setShowExportMenu(false)
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>No transactions yet</p>
        <p className="text-sm mt-2">Start by claiming your daily reward!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-semibold transition-all border border-white/20"
          >
            📥 Export
          </button>

          {/* Export Menu */}
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

      {/* Transactions List */}
      {transactions.map((tx) => (
        <div 
          key={tx.id}
          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-all"
        >
          <div className="flex justify-between items-center">
            <div>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                tx.type === 'claim' ? 'bg-green-500/20 text-green-400' :
                tx.type === 'stake' ? 'bg-blue-500/20 text-blue-400' :
                'bg-orange-500/20 text-orange-400'
              }`}>
                {tx.type.toUpperCase()}
              </span>
              <p className="text-white mt-2 font-semibold">
                {tx.amount} $B2S
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">
                {tx.timestamp.toLocaleDateString()}
              </p>
              <p className={`text-xs mt-1 ${
                tx.status === 'confirmed' ? 'text-green-400' :
                tx.status === 'pending' ? 'text-yellow-400' :
                'text-red-400'
              }`}>
                {tx.status}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}