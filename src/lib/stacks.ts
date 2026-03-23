import { HIRO_API, CONTRACT_ADDRESS } from './constants'

export async function getSTXBalance(address: string): Promise<number> {
  const res  = await fetch(`${HIRO_API}/extended/v1/address/${address}/balances`)
  const data = await res.json()
  return parseInt(data.stx?.balance || '0') / 1_000_000
}

export async function getB2SBalance(address: string): Promise<number> {
  const res  = await fetch(`${HIRO_API}/extended/v1/address/${address}/balances`)
  const data = await res.json()
  const ft   = data.fungible_tokens || {}
  const key  = Object.keys(ft).find(k => k.includes('b2s-token'))
  return key ? parseInt(ft[key].balance || '0') / 1_000_000 : 0
}

export async function getSTXPrice(): Promise<number> {
  const res  = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=blockstack&vs_currencies=usd')
  const data = await res.json()
  return data.blockstack?.usd || 0
}

export async function getNetworkStatus(): Promise<string> {
  const res  = await fetch(`${HIRO_API}/extended/v1/status`)
  const data = await res.json()
  return data.status || 'ok'
}
