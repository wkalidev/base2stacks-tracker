'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'

const MONO = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }

interface PoolRequestRow {
  id:             string
  wallet_address: string
  stx_amount:     string
  b2s_amount:     string
  message:        string | null
  status:         'pending' | 'approved' | 'rejected'
  created_at:     string
}

function StatusBadge({ status }: { status: PoolRequestRow['status'] }) {
  const map = {
    pending:  { icon: '🟡', label: 'PENDING',  color: '#ffd700', bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.25)' },
    approved: { icon: '✅', label: 'APPROVED', color: '#00ff9f', bg: 'rgba(0,255,159,0.08)', border: 'rgba(0,255,159,0.25)' },
    rejected: { icon: '❌', label: 'REJECTED', color: '#ff4444', bg: 'rgba(255,68,68,0.08)',  border: 'rgba(255,68,68,0.25)' },
  }
  const s = map[status] ?? map.pending
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.icon} {s.label}
    </span>
  )
}

function truncate(addr: string) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '—'
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

export default function PoolRequest() {
  const { address, isConnected } = useWallet()

  // Form state
  const [stxAmt,   setStxAmt]   = useState('')
  const [b2sAmt,   setB2sAmt]   = useState('')
  const [msg,      setMsg]       = useState('')
  const [sending,  setSending]   = useState(false)
  const [success,  setSuccess]   = useState(false)
  const [formErr,  setFormErr]   = useState<string | null>(null)

  // List state
  const [requests, setRequests] = useState<PoolRequestRow[]>([])
  const [listErr,  setListErr]  = useState<string | null>(null)
  const [loading,  setLoading]  = useState(true)

  const fetchRequests = useCallback(async () => {
    try {
      const res  = await fetch('/api/pool/requests')
      if (!res.ok) { setListErr('Failed to load requests'); return }
      const data = await res.json()
      if (Array.isArray(data)) setRequests(data)
    } catch {
      setListErr('Could not load requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const handleSubmit = async () => {
    setFormErr(null)
    const stx = parseFloat(stxAmt)
    const b2s = parseFloat(b2sAmt)
    if (!stx || stx <= 0) { setFormErr('STX amount must be > 0'); return }
    if (!b2s || b2s <= 0) { setFormErr('$B2S amount must be > 0'); return }
    if (!address) { setFormErr('Connect your wallet first'); return }

    setSending(true)
    try {
      const res = await fetch('/api/pool/request', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          wallet_address: address,
          stx_amount:     stx,
          b2s_amount:     b2s,
          message:        msg.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setFormErr(data.error ?? 'Submission failed'); return }
      setSuccess(true)
      setStxAmt(''); setB2sAmt(''); setMsg('')
      fetchRequests()
    } catch {
      setFormErr('Network error — try again')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={MONO} className="space-y-6 mt-8">

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: 'linear-gradient(90deg, rgba(153,69,255,0.3), transparent)' }} />
        <span className="text-[9px] tracking-[0.3em] font-black" style={{ color: 'rgba(153,69,255,0.5)' }}>
          // LIQUIDITY_REQUESTS
        </span>
        <div className="h-px flex-1" style={{ background: 'linear-gradient(270deg, rgba(153,69,255,0.3), transparent)' }} />
      </div>

      {/* SECTION A — Submit form */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="border-b border-white/[0.06] p-4">
          <p className="text-[9px] tracking-[0.3em] font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>
            REQUEST_LIQUIDITY
          </p>
          <p className="text-[10px] text-white/30 mt-0.5">
            Signal your intent to provide liquidity — the pool owner will review
          </p>
        </div>

        <div className="p-5 space-y-4">
          {!isConnected ? (
            <p className="text-center text-[10px] font-black tracking-widest py-4"
              style={{ color: 'rgba(255,255,255,0.2)' }}>
              CONNECT_WALLET_TO_SUBMIT
            </p>
          ) : success ? (
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(0,255,159,0.05)', border: '1px solid rgba(0,255,159,0.2)' }}>
              <p className="text-[10px] font-black tracking-[0.3em]" style={{ color: '#00ff9f' }}>
                ✅ // REQUEST_SUBMITTED
              </p>
              <p className="text-[10px] text-white/30 mt-1">Owner will review and approve</p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-3 text-[9px] font-black tracking-widest px-3 py-1 rounded-lg transition-all hover:opacity-70"
                style={{ color: '#9945ff', border: '1px solid rgba(153,69,255,0.25)', background: 'rgba(153,69,255,0.05)' }}>
                SUBMIT_ANOTHER
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] tracking-[0.3em] font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    STX_AMOUNT
                  </p>
                  <div className="relative">
                    <input
                      type="number" min="0" step="any"
                      value={stxAmt}
                      onChange={e => setStxAmt(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2.5 rounded-xl text-white font-black placeholder-white/20 focus:outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black" style={{ color: '#00d4ff' }}>STX</span>
                  </div>
                </div>
                <div>
                  <p className="text-[9px] tracking-[0.3em] font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    B2S_AMOUNT
                  </p>
                  <div className="relative">
                    <input
                      type="number" min="0" step="any"
                      value={b2sAmt}
                      onChange={e => setB2sAmt(e.target.value)}
                      placeholder="0.0"
                      className="w-full px-3 py-2.5 rounded-xl text-white font-black placeholder-white/20 focus:outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black" style={{ color: '#9945ff' }}>$B2S</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[9px] tracking-[0.3em] font-black mb-1.5" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  MESSAGE_OPTIONAL
                </p>
                <textarea
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder="Why you want to provide liquidity..."
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2.5 rounded-xl text-white/80 text-xs placeholder-white/20 focus:outline-none transition-colors resize-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
                <p className="text-right text-[9px] font-black mt-0.5" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  {msg.length}/500
                </p>
              </div>

              {formErr && (
                <p className="text-[10px] font-black tracking-wide" style={{ color: '#ff4444' }}>
                  ⚠ {formErr}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={sending}
                className="w-full py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all hover:opacity-80 disabled:opacity-30"
                style={{
                  background: 'rgba(153,69,255,0.12)',
                  border:     '1px solid rgba(153,69,255,0.35)',
                  color:      '#9945ff',
                }}>
                {sending ? '⏳ SUBMITTING...' : '▶ SUBMIT_REQUEST'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* SECTION B — Request list */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="border-b border-white/[0.06] p-4 flex items-center justify-between">
          <div>
            <p className="text-[9px] tracking-[0.3em] font-black" style={{ color: 'rgba(255,255,255,0.2)' }}>
              ALL_REQUESTS
            </p>
            <p className="text-[10px] text-white/25 mt-0.5">{requests.length} total</p>
          </div>
          <button
            onClick={fetchRequests}
            className="text-[9px] tracking-widest font-black px-2 py-1 rounded-lg transition-all hover:opacity-70"
            style={{ color: '#9945ff', border: '1px solid rgba(153,69,255,0.2)', background: 'rgba(153,69,255,0.05)' }}>
            ↻
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center text-[10px] font-black tracking-widest py-8 text-white/20 animate-pulse">
              LOADING_REQUESTS...
            </p>
          ) : listErr ? (
            <p className="text-center text-[10px] font-black tracking-widest py-8" style={{ color: '#ff4444' }}>
              {listErr}
            </p>
          ) : requests.length === 0 ? (
            <p className="text-center text-[10px] font-black tracking-widest py-8 text-white/20">
              NO_REQUESTS_YET
            </p>
          ) : (
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['WALLET', 'STX', '$B2S', 'STATUS', 'DATE'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-black tracking-[0.2em]"
                      style={{ color: 'rgba(255,255,255,0.2)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => (
                  <tr key={r.id}
                    className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.02]"
                    style={{ borderBottomColor: i === requests.length - 1 ? 'transparent' : undefined }}>
                    <td className="px-4 py-3 font-black" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {truncate(r.wallet_address)}
                    </td>
                    <td className="px-4 py-3 font-black tabular-nums" style={{ color: '#00d4ff' }}>
                      {Number(r.stx_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 font-black tabular-nums" style={{ color: '#9945ff' }}>
                      {Number(r.b2s_amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                      {formatDate(r.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
