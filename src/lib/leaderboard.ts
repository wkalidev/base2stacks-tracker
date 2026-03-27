const hiroUrl = (path: string) => `/api/hiro?path=${encodeURIComponent(path)}`

export async function getTokenHolders(CONTRACT: string, limit = 50) {
  const res = await fetch(hiroUrl(`/extended/v1/tokens/ft/${CONTRACT}.b2s-token/holders?limit=${limit}`))
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
