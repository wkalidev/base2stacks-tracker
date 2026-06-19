import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wallet_address, stx_amount, b2s_amount, message } = body ?? {}

    // Validate
    if (typeof wallet_address !== 'string' || !wallet_address.startsWith('SP')) {
      return NextResponse.json(
        { error: 'wallet_address must be a Stacks mainnet address starting with SP' },
        { status: 400 }
      )
    }
    const stx = Number(stx_amount)
    const b2s = Number(b2s_amount)
    if (!stx || stx <= 0) {
      return NextResponse.json({ error: 'stx_amount must be greater than 0' }, { status: 400 })
    }
    if (!b2s || b2s <= 0) {
      return NextResponse.json({ error: 'b2s_amount must be greater than 0' }, { status: 400 })
    }
    const msg = typeof message === 'string' ? message.trim().slice(0, 500) : null

    const pool = getPool()
    const { rows } = await pool.query<{ id: string; status: string }>(
      `INSERT INTO pool_requests (wallet_address, stx_amount, b2s_amount, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status`,
      [wallet_address, stx, b2s, msg]
    )

    return NextResponse.json({ id: rows[0].id, status: rows[0].status }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/pool/request error:', err)
    if (err.message?.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
  }
}
