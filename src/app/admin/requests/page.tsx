'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@/hooks/useWallet'

const MONO         = { fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace" }
const ADMIN_WALLET = 'SP1V72500C63KN9E348QDK9X879MASSTN0J3KBQ5N'

interface PoolRequestRow {
  id:                  string
  wallet_address:      string
  stx_amount:          string
  b2s_amount:          string
  message:             string | null
  status:              'pending' | 'approved' | 'rejected'
  created_at:          string
  github_issue_number: number | null
}

type ActionStatus = 'idle' | 'loading' | 'done' | 'error'

function StatusBadge({ status }: { status: PoolRequestRow['status'] }) {
  const map = {
    pending:  { label: '🟡 PENDING',  color: '#ffd700', bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.3)' },
    approved: { label: '✅ APPROVED', color: '#00ff9f', bg: 'rgba(0,255,159,0.08)', border: 'rgba(0,255,159,0.3)' },
    rejected: { label: '❌ REJECTED', color: '#ff4444', bg: 'rgba(255,68,68,0.08)',  border: 'rgba(255,68,68,0.3)' },
  }
  const s = map[status] ?? map.pending
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-black tracking-widest"
      style={{ background: s.bg, border: `1px solid ${s.border}`, color: s.color }}>
      {s.label}
    </span>
  )
}

function fmt(iso: string) {
  try { return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
  catch { return '—' }
}

export default function AdminRequestsPage() {
  const { address, isConnected, connect, mounted } = useWallet()

  const [requests, setRequests]  = useState<PoolRequestRow[]>([])
  const [loading,  setLoading]   = useState(true)
  const [listErr,  setListErr]   = useState<string | null>(null)
  const [actions,  setActions]   = useState<Record<string, ActionStatus>>({})
  const [actionMsg, setActionMsg] = useState<Record<string, string>>({})

  const isAdmin = isConnected && address === ADMIN_WALLET

  const fetchRequests = useCallback(async () => {
    setLoading(true); setListErr(null)
    try {
      const res  = await fetch('/api/pool/requests')
      if (!res.ok) { setListErr('Failed to load requests'); return }
      const data = await res.json()
      if (Array.isArray(data)) setRequests(data)
    } catch {
      setListErr('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin) fetchRequests()
  }, [isAdmin, fetchRequests])

  const act = async (id: string, status: 'approved' | 'rejected') => {
    setActions(a => ({ ...a, [id]: 'loading' }))
    setActionMsg(m => ({ ...m, [id]: '' }))
    try {
      const res  = await fetch(`/api/pool/requests/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ admin_wallet: address, status }),
      })
      const data = await res.json()
      if (!res.ok) {
        setActions(a => ({ ...a, [id]: 'error' }))
        setActionMsg(m => ({ ...m, [id]: data.error ?? 'Failed' }))
        return
      }
      setActions(a => ({ ...a, [id]: 'done' }))
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: data.status } : r))
    } catch {
      setActions(a => ({ ...a, [id]: 'error' }))
      setActionMsg(m => ({ ...m, [id]: 'Network error' }))
    }
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const decided  = requests.filter(r => r.status !== 'pending')

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-black p-6" style={MONO}>
      {/* Header */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] tracking-[0.4em] font-black" style={{ color: 'rgba(255,0,255,0.4)' }}>
              // ADMIN_PANEL
            </p>
            <h1 className="text-xl font-black text-white mt-1" style={{ textShadow: '0 0 30px rgba(255,0,255,0.3)' }}>
              POOL_REQUEST_ADMIN
            </h1>
            <p className="text-[10px] text-white/25 mt-1">
              b2s-liquidity-pool-v6 · base2stacks-tracker
            </p>
          </div>
          <a href="/"
            className="text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg transition-all hover:opacity-70"
            style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
            ← BACK_TO_APP
          </a>
        </div>

        {/* Glowing separator */}
        <div className="mt-6 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,0,255,0.4), transparent)' }} />
      </div>

      <div className="max-w-5xl mx-auto">

        {/* Not connected */}
        {!isConnected && (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 text-center space-y-4">
            <p className="text-[9px] tracking-[0.4em] font-black" style={{ color: 'rgba(255,0,255,0.4)' }}>ACCESS_CONTROL</p>
            <p className="text-base font-black text-white/40">Connect admin wallet to continue</p>
            <button
              onClick={connect}
              className="px-6 py-2.5 rounded-xl text-[10px] font-black tracking-widest transition-all hover:opacity-80"
              style={{ background: 'rgba(255,0,255,0.1)', border: '1px solid rgba(255,0,255,0.3)', color: '#ff00ff' }}>
              ▶ CONNECT_WALLET
            </button>
          </div>
        )}

        {/* Connected but wrong wallet */}
        {isConnected && !isAdmin && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-10 text-center space-y-3">
            <p className="text-2xl">🚫</p>
            <p className="text-[10px] font-black tracking-[0.4em]" style={{ color: '#ff4444' }}>ACCESS_DENIED</p>
            <p className="text-[10px] text-white/30">This panel requires the owner wallet</p>
            <p className="text-[9px] text-white/20 font-mono break-all">{ADMIN_WALLET}</p>
            <p className="text-[10px] text-white/20">Connected: <span className="text-white/40">{address}</span></p>
          </div>
        )}

        {/* Admin panel */}
        {isAdmin && (
          <div className="space-y-6">

            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'TOTAL',    value: requests.length,                          color: '#00d4ff' },
                { label: 'PENDING',  value: pending.length,                           color: '#ffd700' },
                { label: 'DECIDED',  value: decided.length,                           color: '#00ff9f' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                  <p className="text-[8px] tracking-[0.3em] font-black text-white/20 mb-1">{label}</p>
                  <p className="text-2xl font-black tabular-nums" style={{ color }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Refresh + info bar */}
            <div className="flex items-center justify-between">
              <p className="text-[9px] tracking-[0.3em] font-black text-white/20">
                ADMIN: <span style={{ color: '#ff00ff' }}>{address?.slice(0, 10)}…</span>
              </p>
              <button
                onClick={fetchRequests}
                className="text-[9px] font-black tracking-widest px-3 py-1.5 rounded-lg transition-all hover:opacity-70"
                style={{ color: '#ff00ff', border: '1px solid rgba(255,0,255,0.25)', background: 'rgba(255,0,255,0.05)' }}>
                ↻ REFRESH
              </button>
            </div>

            {loading ? (
              <p className="text-center text-[10px] font-black tracking-widest py-12 text-white/20 animate-pulse">
                LOADING_REQUESTS...
              </p>
            ) : listErr ? (
              <p className="text-center text-[10px] font-black tracking-widest py-12" style={{ color: '#ff4444' }}>
                {listErr}
              </p>
            ) : requests.length === 0 ? (
              <p className="text-center text-[10px] font-black tracking-widest py-12 text-white/20">
                NO_REQUESTS_YET
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map(r => {
                  const aStatus = actions[r.id] ?? 'idle'
                  const isPending = r.status === 'pending'
                  return (
                    <div key={r.id}
                      className="rounded-2xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">

                      {/* Row header */}
                      <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-white/[0.05]">
                        <div className="space-y-0.5">
                          <p className="text-[9px] tracking-[0.2em] font-black text-white/20">WALLET</p>
                          <p className="text-xs font-black text-white/60 font-mono break-all">{r.wallet_address}</p>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>

                      {/* Amounts + message */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 border-b border-white/[0.05]">
                        <div>
                          <p className="text-[8px] tracking-[0.2em] font-black text-white/20 mb-0.5">STX_AMOUNT</p>
                          <p className="text-sm font-black tabular-nums" style={{ color: '#00d4ff' }}>
                            {Number(r.stx_amount).toLocaleString()} STX
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] tracking-[0.2em] font-black text-white/20 mb-0.5">B2S_AMOUNT</p>
                          <p className="text-sm font-black tabular-nums" style={{ color: '#9945ff' }}>
                            {Number(r.b2s_amount).toLocaleString()} $B2S
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] tracking-[0.2em] font-black text-white/20 mb-0.5">DATE</p>
                          <p className="text-[10px] text-white/40">{fmt(r.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-[8px] tracking-[0.2em] font-black text-white/20 mb-0.5">GITHUB_ISSUE</p>
                          {r.github_issue_number ? (
                            <a
                              href={`https://github.com/wkalidev/base2stacks-tracker/issues/${r.github_issue_number}`}
                              target="_blank" rel="noopener noreferrer"
                              className="text-[10px] font-black hover:opacity-70 transition-opacity"
                              style={{ color: '#00d4ff' }}>
                              #{r.github_issue_number} ↗
                            </a>
                          ) : (
                            <p className="text-[10px] text-white/20">—</p>
                          )}
                        </div>
                      </div>

                      {/* Message */}
                      {r.message && (
                        <div className="px-4 py-3 border-b border-white/[0.05]">
                          <p className="text-[8px] tracking-[0.2em] font-black text-white/20 mb-1">MESSAGE</p>
                          <p className="text-[10px] text-white/40 leading-relaxed">{r.message}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="p-4 flex items-center gap-3">
                        {isPending && aStatus === 'idle' && (
                          <>
                            <button
                              onClick={() => act(r.id, 'approved')}
                              className="px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all hover:opacity-80"
                              style={{ background: 'rgba(0,255,159,0.1)', border: '1px solid rgba(0,255,159,0.35)', color: '#00ff9f' }}>
                              ✅ APPROVE
                            </button>
                            <button
                              onClick={() => act(r.id, 'rejected')}
                              className="px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all hover:opacity-80"
                              style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.35)', color: '#ff4444' }}>
                              ❌ REJECT
                            </button>
                          </>
                        )}
                        {aStatus === 'loading' && (
                          <p className="text-[10px] font-black tracking-widest text-white/30 animate-pulse">
                            ⏳ UPDATING...
                          </p>
                        )}
                        {aStatus === 'done' && (
                          <p className="text-[10px] font-black tracking-widest" style={{ color: '#00ff9f' }}>
                            ✓ UPDATED — GitHub issue commented + closed
                          </p>
                        )}
                        {aStatus === 'error' && (
                          <p className="text-[10px] font-black tracking-widest" style={{ color: '#ff4444' }}>
                            ⚠ {actionMsg[r.id] ?? 'Failed'}
                          </p>
                        )}
                        {!isPending && aStatus === 'idle' && (
                          <p className="text-[10px] font-black tracking-widest text-white/20">
                            ALREADY_{r.status.toUpperCase()}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
