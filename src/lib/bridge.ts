export const BRIDGE_PARTNERS = [
  { name: 'deBridge',  url: 'https://app.debridge.com/r/32893',  fee: '0.1%' },
  { name: 'Rango',     url: 'https://rango.vip/a/o9pwCm',        fee: '0.3%' },
  { name: 'Stargate',  url: 'https://stargate.finance',          fee: '0.06%' },
]

export function getBestBridge() {
  return BRIDGE_PARTNERS[0]
}

export function formatBridgeFee(fee: string, amount: number): string {
  const pct = parseFloat(fee) / 100
  return `${(amount * pct).toFixed(4)} STX`
}
