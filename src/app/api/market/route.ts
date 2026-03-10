import { NextResponse } from 'next/server'

const COINGECKO_MULTI = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=blockstack,bitcoin,ethereum,solana&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d'
const COINGECKO_STX   = 'https://api.coingecko.com/api/v3/coins/blockstack?localization=false&tickers=false&community_data=false&developer_data=false'

let cache: { data: any; ts: number } | null = null
const CACHE_TTL = 60_000 // 60s

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'stx' | 'multi' | null → default stx

  // Serve from cache if fresh
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    const payload = type === 'multi' ? cache.data : cache.data.stx
    return NextResponse.json(payload, { headers: { 'X-Cache': 'HIT' } })
  }

  try {
    // Fetch STX detail + multi coins en parallèle
    const [stxRes, multiRes] = await Promise.all([
      fetch(COINGECKO_STX,   { headers: { Accept: 'application/json' } }),
      fetch(COINGECKO_MULTI, { headers: { Accept: 'application/json' } }),
    ])

    if (!stxRes.ok) {
      if (cache) return NextResponse.json(cache.data.stx, { headers: { 'X-Cache': 'STALE' } })
      return NextResponse.json({ error: `CoinGecko ${stxRes.status}` }, { status: stxRes.status })
    }

    const raw   = await stxRes.json()
    const m     = raw.market_data
    const multi = multiRes.ok ? await multiRes.json() : []

    const stx = {
      price:             m.current_price.usd,
      change24h:         m.price_change_percentage_24h,
      change7d:          m.price_change_percentage_7d,
      change30d:         m.price_change_percentage_30d,
      marketCap:         m.market_cap.usd,
      marketCapRank:     m.market_cap_rank,
      volume24h:         m.total_volume.usd,
      high24h:           m.high_24h.usd,
      low24h:            m.low_24h.usd,
      circulatingSupply: m.circulating_supply,
      totalSupply:       m.total_supply,
      ath:               m.ath.usd,
      athDate:           m.ath_date?.usd?.slice(0, 10) || '',
      atl:               m.atl.usd,
      lastUpdated:       raw.last_updated,
    }

    // Format multi coins pour affichage rapide
    const coins = multi.map((c: any) => ({
      id:        c.id,
      symbol:    c.symbol.toUpperCase(),
      name:      c.name,
      price:     c.current_price,
      change24h: c.price_change_percentage_24h,
      change7d:  c.price_change_percentage_7d_in_currency,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      image:     c.image,
    }))

    const data = { stx, coins }
    cache = { data, ts: Date.now() }

    const payload = type === 'multi' ? data : stx
    return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS' } })

  } catch (err) {
    console.error('Market API error:', err)
    if (cache) return NextResponse.json(cache.data.stx, { headers: { 'X-Cache': 'STALE' } })
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}