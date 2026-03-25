// Use Next.js API proxy to avoid CORS issues
export async function hiroFetch(path: string): Promise<any> {
  const res = await fetch(`/api/hiro?path=${encodeURIComponent(path)}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function hiroPost(path: string, body: any): Promise<any> {
  const res = await fetch(`/api/hiro?path=${encodeURIComponent(path)}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
