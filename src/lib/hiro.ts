/**
 * Centralized Hiro API client — all calls go through /api/hiro proxy
 * to avoid CORS issues in the browser.
 */

const PROXY = '/api/hiro'

export async function hiroGet(path: string) {
  const res = await fetch(`${PROXY}?path=${encodeURIComponent(path)}`)
  if (!res.ok) return null
  return res.json()
}

export async function hiroPost(path: string, body: unknown) {
  const res = await fetch(`${PROXY}?path=${encodeURIComponent(path)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return null
  return res.json()
}

export async function readOnly(
  contractAddress: string,
  contractName: string,
  functionName: string,
  args: string[] = [],
  sender?: string
) {
  const path = `/v2/contracts/call-read/${contractAddress}/${contractName}/${functionName}`
  return hiroPost(path, {
    sender: sender ?? contractAddress,
    arguments: args,
  })
}

export async function getBalance(address: string) {
  return hiroGet(`/extended/v1/address/${address}/balances`)
}

export async function getTransactions(address: string, limit = 20) {
  return hiroGet(`/extended/v1/address/${address}/transactions?limit=${limit}`)
}

export async function getCurrentBlock() {
  const data = await hiroGet('/extended/v1/block?limit=1')
  return data?.results?.[0]?.height ?? 0
}
