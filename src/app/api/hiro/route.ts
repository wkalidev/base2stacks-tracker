import { NextRequest, NextResponse } from 'next/server'

const HIRO_BASE = 'https://api.hiro.so'
const HIRO_MAINNET = 'https://api.mainnet.hiro.so'

async function proxyRequest(path: string, options: RequestInit = {}) {
  const base = path.startsWith('/metadata') ? HIRO_BASE : HIRO_MAINNET
  
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    next: { revalidate: 30 },
  })

  let data
  try {
    data = await response.json()
  } catch {
    data = { results: [], total: 0 }
  }

  if (!response.ok) {
    return NextResponse.json(
      { results: [], total: 0, error: data?.error ?? 'Not found' },
      { status: 200 }
    )
  }

  return NextResponse.json(data, { status: 200 })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  try {
    return await proxyRequest(path)
  } catch {
    return NextResponse.json({ results: [], total: 0 }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })

  try {
    const body = await request.json()
    return await proxyRequest(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  } catch {
    return NextResponse.json({ result: null }, { status: 200 })
  }
}
