import { NextRequest, NextResponse } from 'next/server'

const HIRO_BASE = 'https://api.hiro.so'
const HIRO_MAINNET = 'https://api.mainnet.hiro.so'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  const base = path.startsWith('/metadata') ? HIRO_BASE : HIRO_MAINNET

  try {
    const response = await fetch(`${base}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      next: { revalidate: 30 },
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Hiro API error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
  }

  const base = path.startsWith('/metadata') ? HIRO_BASE : HIRO_MAINNET

  try {
    const body = await request.json()
    const response = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error) {
    return NextResponse.json({ error: 'Hiro API error' }, { status: 500 })
  }
}
