const CONTRACT = 'SP936YWJPST8GB8FFRCN7CC6P2YR5K6NNBAARQ96'
const HIRO_API = 'https://api.mainnet.hiro.so'

export async function getNFTHoldings(address: string) {
  const assetId = `${CONTRACT}.b2s-badges::b2s-badge`
  const res  = await fetch(
    `${HIRO_API}/extended/v1/tokens/nft/holdings?principal=${address}&asset_identifiers=${assetId}`
  )
  return res.json()
}

export async function getLastTokenId(): Promise<number> {
  const res  = await fetch(
    `${HIRO_API}/extended/v1/tokens/nft/holdings?asset_identifiers=${CONTRACT}.b2s-badges::b2s-badge&limit=1`
  )
  const data = await res.json()
  return data.total || 0
}

export function getBadgeImageUrl(tokenId: number): string {
  return `https://ipfs.io/ipfs/QmXxxx/${tokenId}.png`
}
