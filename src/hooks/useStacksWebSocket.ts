'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export interface StacksBlock {
  block_hash:      string;
  block_height:    number;
  burn_block_time: number;
  txs:             string[];
}

export interface StacksTx {
  tx_id:          string;
  tx_type:        string;
  tx_status:      string;
  sender_address: string;
  contract_call?: { contract_id: string; function_name: string };
}

interface UseStacksWebSocketOptions {
  onBlock?:        (block: StacksBlock) => void;
  onTransaction?:  (tx: StacksTx) => void;
  contractFilter?: string;
  enabled?:        boolean;
}

export function useStacksWebSocket(options: UseStacksWebSocketOptions = {}) {
  const { onBlock, enabled = true } = options;
  const [connected, setConnected]       = useState(false);
  const [blockHeight, setBlockHeight]   = useState<number | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch('/api/hiro?path=/extended/v1/block?limit=1')
      const data = await res.json()
      const block = data.results?.[0]
      if (block?.height) {
        setBlockHeight(block.height)
        setConnected(true)
        onBlock?.({
          block_hash: block.hash,
          block_height: block.height,
          burn_block_time: block.burn_block_time,
          txs: block.txs ?? [],
        })
      }
    } catch {
      setConnected(false)
      setError('Polling failed')
    }
  }, [onBlock])

  useEffect(() => {
    if (!enabled) return
    poll()
    intervalRef.current = setInterval(poll, 30_000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [enabled, poll])

  return { connected, blockHeight, error }
}
