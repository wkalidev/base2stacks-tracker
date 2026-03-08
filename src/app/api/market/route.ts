// src/app/api/market/route.ts
import { NextResponse } from 'next/server'

const API_KEY = process.env.COINGECKO_API_KEY

let cache: { data: any; ts: number } | null = null
const CACHE_TTL = 60_000

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, { headers: { 'X-Cache': 'HIT' } })
  }

  try {
    // Demo API key goes as query param, not header
    const url = new URL('https://api.coingecko.com/api/v3/coins/blockstack')
    url.searchParams.set('localization', 'false')
    url.searchParams.set('tickers', 'false')
    url.searchParams.set('community_data', 'false')
    url.searchParams.set('developer_data', 'false')
    if (API_KEY) {
      url.searchParams.set('x_cg_demo_api_key', API_KEY)
    }

    console.log('Fetching:', url.toString())

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('CoinGecko error:', res.status, text)
      if (cache) return NextResponse.json(cache.data, { headers: { 'X-Cache': 'STALE' } })
      return NextResponse.json({ error: `CoinGecko error: ${res.status}` }, { status: res.status })
    }

    const raw = await res.json()
    const m = raw.market_data

    const data = {
      price:             m.current_price.usd,
      change24h:         m.price_change_percentage_24h,
      change7d:          m.price_change_percentage_7d,
      marketCap:         m.market_cap.usd,
      volume24h:         m.total_volume.usd,
      high24h:           m.high_24h.usd,
      low24h:            m.low_24h.usd,
      circulatingSupply: m.circulating_supply,
      ath:               m.ath.usd,
      athDate:           m.ath_date?.usd?.slice(0, 10) || '',
      lastUpdated:       raw.last_updated,
    }

    cache = { data, ts: Date.now() }
    return NextResponse.json(data, { headers: { 'X-Cache': 'MISS' } })

  } catch (err) {
    console.error('API route error:', err)
    if (cache) return NextResponse.json(cache.data, { headers: { 'X-Cache': 'STALE' } })
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}