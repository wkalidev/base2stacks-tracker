export interface EcosystemMetrics {
  totalContracts:  number
  totalTxs:        number
  totalHolders:    number
  totalSupply:     number
  totalStaked:     number
  dailyActiveUsers:number
  bridgeVolume:    number
}

export function calcTVL(stxLocked: number, stxPrice: number): number {
  return stxLocked * stxPrice
}

export function calcMarketCap(supply: number, price: number): number {
  return supply * price
}

export function calcDailyVolume(txs: any[]): number {
  const today = new Date().toISOString().slice(0, 10)
  return txs.filter(tx => tx.burn_block_time_iso?.startsWith(today)).length
}
