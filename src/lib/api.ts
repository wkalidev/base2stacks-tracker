function hiroUrl(path: string): string {
  return `/api/hiro?path=${encodeURIComponent(path)}`
}

export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getBalance(address: string) {
  return fetchJSON(hiroUrl(`/extended/v1/address/${address}/balances`))
}

export async function getTransactions(address: string, limit = 20) {
  return fetchJSON(hiroUrl(`/extended/v1/address/${address}/transactions?limit=${limit}`))
}

export async function getNFTHoldings(address: string, assetId: string) {
  return fetchJSON(hiroUrl(`/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=${assetId}`))
}

export async function getSTXPrice(): Promise<number> {
  const data: any = await fetchJSON(
    'https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd'
  )
  return data.blockstack?.usd || 0
}
