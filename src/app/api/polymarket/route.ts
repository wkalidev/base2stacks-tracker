import { NextRequest, NextResponse } from 'next/server'

const POLYMARKET_API = 'https://gamma-api.polymarket.com'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') ?? '/markets?limit=100&active=true&closed=false&order=volume&ascending=false'

  try {
    const response = await fetch(`${POLYMARKET_API}${path}`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    })
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: 'Polymarket API error' }, { status: 500 })
  }
}
