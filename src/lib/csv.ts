export function toCSV(rows: any[], headers: string[]): string {
  const lines = rows.map(row =>
    headers.map(h => JSON.stringify(row[h] ?? '')).join(',')
  )
  return [headers.join(','), ...lines].join('\n')
}

export function downloadCSV(rows: any[], headers: string[], filename: string) {
  const csv  = toCSV(rows, headers)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
