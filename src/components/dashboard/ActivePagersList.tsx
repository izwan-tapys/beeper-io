'use client'

/**
 * ActivePagersList
 * Extracted from dashboard/page.tsx lines 837-940.
 * Renders the active pagers section, including a search input, a list of pager cards
 * with Call/Done/QR action buttons, an empty state, and a loading state.
 * The getWaitTime helper is inlined here since it depends on the `now` timestamp prop.
 */

import { Search, Clock, Loader2, QrCode, Phone, CheckCircle } from 'lucide-react'
import { Session } from '@/types'

interface Props {
  sessions: Session[]
  loading: boolean
  searchQuery: string
  now: number
  cooldowns: Record<string, boolean>
  onSearchChange: (val: string) => void
  onCall: (id: string) => void
  onDone: (id: string) => void
  onOpenQr: (session: Session) => void
}

function getWaitTime(createdAt: string, now: number): string {
  const start = new Date(createdAt).getTime()
  const seconds = Math.floor((now - start) / 1000)
  if (seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function ActivePagersList({
  sessions,
  loading,
  searchQuery,
  now,
  cooldowns,
  onSearchChange,
  onCall,
  onDone,
  onOpenQr,
}: Props) {
  const filteredSessions = sessions.filter((s) =>
    s.receipt_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
    >
      {/* Search Input */}
      <div
        className="p-4 border-b flex items-center gap-3"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <Search size={16} style={{ color: 'var(--muted)' }} />
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search order number..."
          className="flex-1 bg-transparent text-white outline-none text-sm"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-16">
          <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
          <p style={{ color: 'var(--muted-foreground)' }}>No active pagers.</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="flex flex-col p-5 hover:bg-white/[0.02] animate-slide-up transition-all border-b border-white/[0.02]"
              style={{ borderColor: 'var(--card-border)' }}
            >
              {/* Top Section: Connection Status, Order Info, and Timer */}
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-2 h-2 rounded-full shrink-0 mt-3 md:mt-3.5"
                  style={{
                    background:
                      session.status === 'called' ? 'var(--success)' : 'var(--accent)',
                    boxShadow: `0 0 8px ${
                      session.status === 'called' ? 'var(--success)' : 'var(--accent)'
                    }`,
                  }}
                />

                <div className="flex-1 flex flex-col">
                  {/* Connection Status Badge */}
                  <div className="flex mb-1.5">
                    {!session.is_confirmed ? (
                      <span className="bg-yellow-500/90 text-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-black animate-pulse">
                        WAITING FOR CUSTOMER
                      </span>
                    ) : (
                      <span className="bg-green-500 text-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-black">
                        CUSTOMER WAITING
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-white text-2xl sm:text-3xl">
                        #{session.receipt_number}
                      </p>
                      <span className="hidden xs:inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">
                        {session.status === 'called' ? '🔔 Called' : '⏳ Prep'}
                      </span>
                    </div>

                    {/* Timer on the same line as Order Number for Mobile */}
                    {session.status === 'waiting' && (
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                          Wait Time
                        </span>
                        <span className="text-xl sm:text-2xl font-mono text-indigo-400 font-bold tabular-nums">
                          {getWaitTime(session.created_at, now)}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] font-medium text-slate-600 mt-1 uppercase tracking-tighter">
                    Issued at{' '}
                    {new Date(session.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>

              {/* Bottom Section: Action Buttons */}
              <div className="flex items-center gap-2 md:w-auto md:ml-6">
                <button
                  id={`qr-btn-${session.id}`}
                  onClick={() => onOpenQr(session)}
                  className="p-3 rounded-xl transition-all active:scale-95 shrink-0"
                  style={{
                    color: 'var(--muted-foreground)',
                    background: '#0a0b0f',
                    border: '1px solid var(--card-border)',
                  }}
                  title="Show QR Code"
                >
                  <QrCode size={18} />
                </button>
                <button
                  onClick={() => onCall(session.id)}
                  disabled={!session.is_confirmed || cooldowns[session.id]}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-20 disabled:grayscale whitespace-nowrap ${
                    cooldowns[session.id] ? 'animate-pulse' : ''
                  }`}
                  style={{
                    background: 'rgba(99,102,241,0.15)',
                    color: '#818cf8',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}
                >
                  <Phone size={16} />
                  {cooldowns[session.id] ? 'WAIT...' : session.status === 'called' ? 'RECALL' : 'CALL'}
                </button>
                <button
                  onClick={() => onDone(session.id)}
                  disabled={!session.is_confirmed}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-20 disabled:grayscale whitespace-nowrap"
                  style={{
                    background: 'rgba(34,197,94,0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(34,197,94,0.3)',
                  }}
                >
                  <CheckCircle size={16} />
                  DONE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
