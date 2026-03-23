export function shortAddress(address: string): string {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function isMainnetAddress(address: string): boolean {
  return address.startsWith('SP')
}

export function isTestnetAddress(address: string): boolean {
  return address.startsWith('ST')
}

export function getExplorerUrl(address: string): string {
  return `https://explorer.hiro.so/address/${address}?chain=mainnet`
}
