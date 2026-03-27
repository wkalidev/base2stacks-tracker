const hiroUrl = (path: string) => `/api/hiro?path=${encodeURIComponent(path)}`

export async function getLastTransaction(address: string) {
  const res = await fetch(hiroUrl(`/extended/v1/address/${address}/transactions?limit=1`))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
