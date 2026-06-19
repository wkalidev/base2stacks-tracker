import { NextRequest, NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { addIssueComment, addIssueLabels, closeIssue } from '@/lib/github'

const ADMIN_WALLET = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json()
    const { admin_wallet, status } = body ?? {}

    if (admin_wallet !== ADMIN_WALLET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be "approved" or "rejected"' },
        { status: 400 }
      )
    }

    const { id } = await params

    const pool = getPool()
    const { rows } = await pool.query(
      `UPDATE pool_requests
       SET    status = $1
       WHERE  id = $2
       RETURNING id, status, github_issue_number, wallet_address, stx_amount, b2s_amount`,
      [status, id]
    )

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const row = rows[0]

    // Update the GitHub issue if one was created
    if (row.github_issue_number) {
      const num      = row.github_issue_number as number
      const approved = status === 'approved'
      const emoji    = approved ? '✅' : '❌'

      await addIssueComment(
        num,
        [
          `## ${emoji} Request ${approved ? 'Approved' : 'Rejected'}`,
          ``,
          `The pool owner has **${status}** this request.`,
          ``,
          `| Field | Value |`,
          `|-------|-------|`,
          `| **Wallet** | \`${row.wallet_address}\` |`,
          `| **STX** | ${Number(row.stx_amount)} STX |`,
          `| **$B2S** | ${Number(row.b2s_amount)} $B2S |`,
          `| **Decision** | ${status.toUpperCase()} |`,
          `| **Decided at** | ${new Date().toUTCString()} |`,
        ].join('\n')
      )
      await addIssueLabels(num, [status])
      await closeIssue(num)
    }

    return NextResponse.json({ id: row.id, status: row.status })
  } catch (err: any) {
    console.error('PATCH /api/pool/requests/[id] error:', err)
    if (err.message?.includes('DATABASE_URL')) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
  }
}
