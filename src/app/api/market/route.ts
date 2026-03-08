// src/app/api/market/route.ts
import { NextResponse } from 'next/server'

// CoinGecko public API — no key required, 30 req/min
// With 60s cache, we only make 1 req/min max — well within limits
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/coins/blockstack?localization=false&tickers=false&community_data=false&developer_data=false'

let cache: { data: any; ts: number } | null = null
const CACHE_TTL = 60_000 // 60 seconds

export async function GET() {
  // Serve from cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data, { headers: { 'X-Cache': 'HIT' } })
  }

  try {
    const res = await fetch(COINGECKO_URL, {
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      console.error('CoinGecko error:', res.status)
      if (cache) return NextResponse.json(cache.data, { headers: { 'X-Cache': 'STALE' } })
      return NextResponse.json({ error: `CoinGecko ${res.status}` }, { status: res.status })
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