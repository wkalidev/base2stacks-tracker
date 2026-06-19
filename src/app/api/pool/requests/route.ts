import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'

export async function GET() {
  try {
    const pool = getPool()
    const { rows } = await pool.query(
      `SELECT id, wallet_address, stx_amount, b2s_amount, message, status, created_at
       FROM pool_requests
       ORDER BY created_at DESC`
    )
    return NextResponse.json(rows)
  } catch (err: any) {
    console.error('GET /api/pool/requests error:', err)
    if (err.message?.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
  }
}
