const IPFS_GATEWAY = 'https://ipfs.io/ipfs'

export function ipfsToHttp(ipfsUrl: string): string {
  if (!ipfsUrl?.startsWith('ipfs://')) return ipfsUrl
  return ipfsUrl.replace('ipfs://', `${IPFS_GATEWAY}/`)
}

export function getMetadataUrl(tokenId: number): string {
  return `${IPFS_GATEWAY}/QmXxxx/${tokenId}.json`
}

export function getImageUrl(tokenId: number): string {
  return `${IPFS_GATEWAY}/QmXxxx/${tokenId}.png`
}
