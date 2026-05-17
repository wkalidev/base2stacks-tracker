const hiroUrl = (path: string) => `/api/hiro?path=${encodeURIComponent(path)}`
const CONTRACT = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export async function getNFTHoldings(address: string, assetId: string) {
  const res = await fetch(hiroUrl(`/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=${assetId}`))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function getBadgeCount() {
  const res = await fetch(hiroUrl(`/extended/v1/tokens/nft/holdings?asset_identifiers=${CONTRACT}.b2s-badges::b2s-badge&limit=1`))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
