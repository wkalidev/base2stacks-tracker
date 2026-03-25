'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

const WS_URL = 'wss://api.mainnet.hiro.so/extended/v1/ws';

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
  const { onBlock, onTransaction, contractFilter, enabled = true } = options;
  const wsRef        = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef   = useRef(true);
  const attemptsRef  = useRef(0);

  const [connected,    setConnected]    = useState(false);
  const [blockHeight,  setBlockHeight]  = useState<number | null>(null);
  const [error,        setError]        = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        attemptsRef.current = 0;
        setConnected(true);
        setError(null);
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'block_connected', params: [] }));
        ws.send(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'mempool', params: [] }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          const block = data.params?.result;
          if (block?.block_height) {
            setBlockHeight(block.block_height);
            onBlock?.(block);
          }
          const tx = data.params?.result;
          if (tx?.tx_id) {
            const relevant = !contractFilter ||
              tx.contract_call?.contract_id?.startsWith(contractFilter) ||
              tx.sender_address === contractFilter;
            if (relevant) onTransaction?.(tx);
          }
        } catch {}
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setConnected(false);
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        if (attemptsRef.current < 5) {
          const delay = Math.min(1000 * 2 ** attemptsRef.current, 30000);
          attemptsRef.current++;
          reconnectRef.current = setTimeout(connect, delay);
        }
      };
    } catch {
      setError('Failed to connect');
    }
  }, [enabled, contractFilter, onBlock, onTransaction]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
    };
  }, [connect]);

  return { connected, blockHeight, error };
}
