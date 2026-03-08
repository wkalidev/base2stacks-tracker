export function exportToCSV(transactions: Record<string, any>[], filename: string = 'b2s-transactions.csv') {
  if (transactions.length === 0) return
  const headers = Object.keys(transactions[0])
  const rows = transactions.map(tx => headers.map(h => tx[h] ?? ''))
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportToJSON(transactions: Record<string, any>[], filename: string = 'b2s-transactions.json') {
  const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
