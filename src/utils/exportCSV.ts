interface Transaction {
  id: string
  type: 'claim' | 'stake' | 'unstake'
  amount: number
  timestamp: Date
  status: 'pending' | 'confirmed' | 'failed'
}

export function exportToCSV(transactions: Transaction[], filename: string = 'b2s-transactions.csv') {
  // Convert transactions to CSV format
  const headers = ['Date', 'Type', 'Amount ($B2S)', 'Status', 'Transaction ID']
  
  const rows = transactions.map(tx => [
    tx.timestamp.toLocaleString(),
    tx.type.toUpperCase(),
    tx.amount.toString(),
    tx.status,
    tx.id
  ])

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Export JSON alternative
export function exportToJSON(transactions: Transaction[], filename: string = 'b2s-transactions.json') {
  const jsonContent = JSON.stringify(transactions, null, 2)
  const blob = new Blob([jsonContent], { type: 'application/json' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}