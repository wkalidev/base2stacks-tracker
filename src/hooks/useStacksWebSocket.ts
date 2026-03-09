'use client';
import { useEffect, useRef, useCallback, useState } from 'react';

// ─── Stacks WebSocket — Real-time block + tx updates ─────────
// Replaces polling (30-60s) with instant push (~10s block time)
// Based on stx-labs/explorer v1.341.5 approach

const WS_URL = 'wss://api.mainnet.hiro.so/extended/v1/ws';

export interface StacksBlock {
  block_hash:   string;
  block_height: number;
  burn_block_time: number;
  txs:          string[];
}

export interface StacksTx {
  tx_id:       string;
  tx_type:     string;
  tx_status:   string;
  sender_address: string;
  contract_call?: {
    contract_id:   string;
    function_name: string;
  };
}

interface WebSocketState {
  connected:    boolean;
  lastBlock:    StacksBlock | null;
  lastTx:       StacksTx | null;
  blockHeight:  number | null;
  error:        string | null;
}

interface UseStacksWebSocketOptions {
  onBlock?:       (block: StacksBlock) => void;
  onTransaction?: (tx: StacksTx) => void;
  contractFilter?: string; // e.g. 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
  enabled?:       boolean;
}

export function useStacksWebSocket(options: UseStacksWebSocketOptions = {}) {
  const { onBlock, onTransaction, contractFilter, enabled = true } = options;

  const wsRef         = useRef<WebSocket | null>(null);
  const reconnectRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef    = useRef(true);
  const attemptsRef   = useRef(0);
  const MAX_ATTEMPTS  = 5;

  const [state, setState] = useState<WebSocketState>({
    connected:   false,
    lastBlock:   null,
    lastTx:      null,
    blockHeight: null,
    error:       null,
  });

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        attemptsRef.current = 0;
        setState(s => ({ ...s, connected: true, error: null }));

        // Subscribe to new blocks
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'block_connected',
          params: [],
        }));

        // Subscribe to mempool transactions
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'mempool',
          params: [],
        }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);

          // New block
          if (data.params?.result?.block_hash || data.method === 'block_connected') {
            const block = data.params?.result as StacksBlock;
            if (block?.block_height) {
              setState(s => ({
                ...s,
                lastBlock:   block,
                blockHeight: block.block_height,
              }));
              onBlock?.(block);
            }
          }

          // New transaction
          if (data.params?.result?.tx_id || data.method === 'mempool') {
            const tx = data.params?.result as StacksTx;
            if (tx?.tx_id) {
              // Filter by contract if specified
              const relevant = !contractFilter ||
                tx.contract_call?.contract_id?.startsWith(contractFilter) ||
                tx.sender_address === contractFilter;

              if (relevant) {
                setState(s => ({ ...s, lastTx: tx }));
                onTransaction?.(tx);
              }
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setState(s => ({ ...s, connected: false, error: 'WebSocket error' }));
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setState(s => ({ ...s, connected: false }));

        // Exponential backoff reconnect
        if (attemptsRef.current < MAX_ATTEMPTS) {
          const delay = Math.min(1000 * 2 ** attemptsRef.current, 30000);
          attemptsRef.current++;
          reconnectRef.current = setTimeout(connect, delay);
        } else {
          setState(s => ({ ...s, error: 'Max reconnect attempts reached' }));
        }
      };

    } catch (err) {
      setState(s => ({ ...s, error: 'Failed to connect', connected: false }));
    }
  }, [enabled, contractFilter, onBlock, onTransaction]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on unmount
        wsRef.current.close();
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectRef.current) clearTimeout(reconnectRef.current);
    wsRef.current?.close();
    setState(s => ({ ...s, connected: false }));
  }, []);

  return { ...state, disconnect };
}