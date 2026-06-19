import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { createIssue } from '@/lib/github'

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

    // Insert into DB
    const { rows } = await pool.query<{ id: string; status: string }>(
      `INSERT INTO pool_requests (wallet_address, stx_amount, b2s_amount, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, status`,
      [wallet_address, stx, b2s, msg]
    )
    const { id, status } = rows[0]

    // Create GitHub issue (fire-and-forget on failure — don't block the response)
    const walletShort  = `${wallet_address.slice(0, 6)}…${wallet_address.slice(-4)}`
    const issueTitle   = `Pool Request — ${walletShort} wants ${stx} STX + ${b2s} $B2S`
    const issueBody    = [
      `## Pool Liquidity Request`,
      ``,
      `| Field | Value |`,
      `|-------|-------|`,
      `| **Wallet** | \`${wallet_address}\` |`,
      `| **STX Amount** | ${stx} STX |`,
      `| **$B2S Amount** | ${b2s} $B2S |`,
      `| **Message** | ${msg ?? '_(none)_'} |`,
      `| **Submitted** | ${new Date().toUTCString()} |`,
      `| **DB ID** | \`${id}\` |`,
      ``,
      `> Manage this request via the [admin panel](https://base2stacks-tracker.vercel.app/admin/requests).`,
    ].join('\n')

    const issueNumber = await createIssue(issueTitle, issueBody, ['pool-request', 'pending'])

    if (issueNumber) {
      await pool.query(
        `UPDATE pool_requests SET github_issue_number = $1 WHERE id = $2`,
        [issueNumber, id]
      )
    }

    return NextResponse.json({ id, status, github_issue_number: issueNumber }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/pool/request error:', err)
    if (err.message?.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to save request' }, { status: 500 })
  }
}
