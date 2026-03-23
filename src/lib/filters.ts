export type TxFilter = 'all' | 'claim' | 'stake' | 'swap' | 'bridge' | 'vote'

export const TX_FILTERS: { value: TxFilter; label: string }[] = [
  { value: 'all',    label: 'All'       },
  { value: 'claim',  label: '🎁 Claim'  },
  { value: 'stake',  label: '💰 Stake'  },
  { value: 'swap',   label: '🔄 Swap'   },
  { value: 'bridge', label: '🌉 Bridge' },
  { value: 'vote',   label: '🏛️ Vote'  },
]

const FN_MAP: Record<TxFilter, string[]> = {
  all:    [],
  claim:  ['claim-daily-reward'],
  stake:  ['stake', 'unstake', 'compound-rewards'],
  swap:   ['swap-b2s-for-stx', 'swap-stx-for-b2s'],
  bridge: ['record-bridge', 'track-bridge-tx'],
  vote:   ['vote', 'create-proposal'],
}

export function filterTxs(txs: any[], filter: TxFilter): any[] {
  if (filter === 'all') return txs
  const fns = FN_MAP[filter]
  return txs.filter(tx => fns.includes(tx.contract_call?.function_name))
}
