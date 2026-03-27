export const NETWORKS = {
  mainnet: {
    name:    'Stacks Mainnet',
    api:     '/api/hiro',
    explorer:'https://explorer.hiro.so',
  },
  testnet: {
    name:    'Stacks Testnet',
    api:     'https://api.testnet.hiro.so',
    explorer:'https://explorer.hiro.so/?chain=testnet',
  },
}

export type NetworkName = keyof typeof NETWORKS

export function getNetwork(name: NetworkName = 'mainnet') {
  return NETWORKS[name]
}

export function getExplorerTxUrl(txId: string): string {
  return `${NETWORKS.mainnet.explorer}/txid/${txId}?chain=mainnet`
}
