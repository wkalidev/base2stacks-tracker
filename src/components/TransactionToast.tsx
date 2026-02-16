'use client'

import { useEffect, useState } from 'react'

interface TransactionToastProps {
  txId: string | null
  onClose: () => void
}

export function TransactionToast(props: TransactionToastProps) {
  const { txId, onClose } = props
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (txId) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [txId, onClose])

  if (!visible || !txId) {
    return null
  }

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const explorerLink = 'https://explorer.stacks.co/txid/' + txId + '?chain=testnet'

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-2xl border border-green-400 max-w-md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✅</div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Transaction Submitted</h3>
            <p className="text-sm text-white/90 mb-2">Your transaction has been broadcast.</p>
            <a href={explorerLink} target="_blank" rel="noopener noreferrer" className="text-sm underline">View on Explorer</a>
          </div>
          <button onClick={handleClose} className="text-white text-xl">×</button>
        </div>
      </div>
    </div>
  )
}

interface ErrorToastProps {
  error: string | null
  onClose: () => void
}

export function ErrorToast(props: ErrorToastProps) {
  const { error, onClose } = props
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (error) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onClose, 300)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [error, onClose])

  if (!visible || !error) {
    return null
  }

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-lg shadow-2xl border border-red-400 max-w-md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">❌</div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Transaction Failed</h3>
            <p className="text-sm text-white/90">{error}</p>
          </div>
          <button onClick={handleClose} className="text-white text-xl">×</button>
        </div>
      </div>
    </div>
  )
}