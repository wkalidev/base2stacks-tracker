'use client';

import { useEffect, useState } from 'react';

interface TransactionToastProps {
  txId: string | null;
  onClose: () => void;
}

export function TransactionToast({ txId, onClose }: TransactionToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (txId) {
      setVisible(true);
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [txId, onClose]);

  if (!visible || !txId) return null;

  const explorerUrl = `https://explorer.stacks.co/txid/${txId}?chain=testnet`;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-4 rounded-lg shadow-2xl border border-green-400 max-w-md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">✅</div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Transaction Submitted!</h3>
            <p className="text-sm text-white/90 mb-2">
              Your transaction has been broadcast to the network.
            </p>
            
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline hover:text-green-100 inline-flex items-center gap-1"
            >
              View on Explorer
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorToastProps {
  error: string | null;
  onClose: () => void;
}

export function ErrorToast({ error, onClose }: ErrorToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 300);
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [error, onClose]);

  if (!visible || !error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-4 rounded-lg shadow-2xl border border-red-400 max-w-md">
        <div className="flex items-start gap-3">
          <div className="text-2xl">❌</div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Transaction Failed</h3>
            <p className="text-sm text-white/90">{error}</p>
          </div>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 300);
            }}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}