export function searchTransactions(txs: any[], query: string) {
  const q = query.toLowerCase()
  return txs.filter(tx =>
    tx.tx_id?.toLowerCase().includes(q) ||
    tx.sender_address?.toLowerCase().includes(q) ||
    tx.contract_call?.function_name?.toLowerCase().includes(q)
  )
}

export function filterByType(txs: any[], type: string) {
  if (type === 'all') return txs
  return txs.filter(tx => tx.contract_call?.function_name === type)
}

export function sortByDate(txs: any[], order: 'asc' | 'desc' = 'desc') {
  return [...txs].sort((a, b) => {
    const diff = new Date(a.burn_block_time_iso).getTime() -
                 new Date(b.burn_block_time_iso).getTime()
    return order === 'desc' ? -diff : diff
  })
}
