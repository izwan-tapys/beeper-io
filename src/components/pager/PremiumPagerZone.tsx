'use client'

import React from 'react'
import { Volume2, AlertTriangle, Clock, ChevronRight } from 'lucide-react'

export interface ActiveSession {
  sessionId: string
  merchantName: string
  merchantLogo?: string | null
  receiptNumber: string
  status: 'waiting' | 'called' | 'completed'
  formattedWaitTime?: string
  isGhostActive?: boolean
}

interface PremiumPagerZoneProps {
  // Single-session mode (legacy)
  merchantName?: string
  merchantLogo?: string | null
  receiptNumber?: string
  lang: 'bm' | 'en'
  formattedWaitTime?: string
  isGhostActive?: boolean
  onTestBeep?: () => void
  onShowWarning?: () => void
  previewMode?: boolean

  // Multi-session mode
  sessions?: ActiveSession[]
}

// ── Pulsing status dot ────────────────────────────────────────────────────────
function StatusDot({ color = '#f59e0b' }: { color?: string }) {
  return (
    <span className="relative inline-flex items-center justify-center w-2.5 h-2.5">
      <span
        className="absolute inline-flex w-full h-full rounded-full animate-ping opacity-60"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full w-1.5 h-1.5"
        style={{ backgroundColor: color }}
      />
    </span>
  )
}

// ── Single-session Premium Card ───────────────────────────────────────────────
function SinglePagerCard({
  merchantName,
  merchantLogo,
  receiptNumber,
  lang,
  formattedWaitTime = '0:00',
  isGhostActive = false,
  onTestBeep,
  onShowWarning,
  previewMode = false,
}: Required<Pick<PremiumPagerZoneProps, 'merchantName' | 'receiptNumber' | 'lang'>> &
  Pick<PremiumPagerZoneProps, 'merchantLogo' | 'formattedWaitTime' | 'isGhostActive' | 'onTestBeep' | 'onShowWarning' | 'previewMode'>) {
  return (
    <div
      className="h-1/2 w-full flex-shrink-0 flex flex-col items-center justify-center px-4 py-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(170deg, #0f0c0a 0%, #1a1108 45%, #0a0a0a 100%)' }}
    >
      {/* Subtle radial glow from bottom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 110%, rgba(245,158,11,0.08) 0%, transparent 65%)',
        }}
      />

      {/* Merchant header */}
      <div className="flex items-center gap-2.5 mb-4 relative z-10 w-full max-w-xs">
        {merchantLogo ? (
          <img
            src={merchantLogo}
            alt={merchantName}
            className="w-9 h-9 rounded-full object-cover shadow-md"
            style={{ border: '1.5px solid rgba(245,158,11,0.3)' }}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-amber-400 font-black text-base shadow-md"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
              border: '1.5px solid rgba(245,158,11,0.25)',
            }}
          >
            {merchantName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-white/90 text-sm font-bold tracking-wide truncate">
            {merchantName}
          </span>
          <span className="text-amber-400/50 text-[9px] font-bold uppercase tracking-widest">
            beepme.pro
          </span>
        </div>
      </div>

      {/* Main glass card */}
      <div
        className="relative w-full max-w-xs rounded-2xl overflow-hidden z-10"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(245,158,11,0.18)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)' }}
        />

        <div className="px-5 pt-4 pb-4">
          {/* Status row */}
          <div className="flex items-center gap-2 mb-3">
            <StatusDot />
            <span className="text-amber-400/80 text-[10px] font-bold uppercase tracking-[0.2em]">
              {lang === 'bm' ? 'Menyedia Pesanan' : 'Preparing Order'}
            </span>
          </div>

          {/* Order number — the hero */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-white/30 text-xl font-black tracking-tight">#</span>
            <span
              className="font-black leading-none text-transparent bg-clip-text"
              style={{
                fontSize: 'clamp(3rem, 16vw, 5rem)',
                backgroundImage: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 50%, #d97706 100%)',
                letterSpacing: '-0.02em',
              }}
            >
              {receiptNumber}
            </span>
          </div>

          {/* Wait time row */}
          <div
            className="flex items-center justify-between px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div className="flex items-center gap-1.5 text-white/40 text-[11px] font-bold uppercase tracking-wider">
              <Clock size={11} />
              <span>{lang === 'bm' ? 'Masa Tunggu' : 'Wait Time'}</span>
            </div>
            <span className="text-white/70 text-sm font-black tabular-nums tracking-wider">
              {isGhostActive ? (lang === 'bm' ? 'Sibuk' : 'Busy') : formattedWaitTime}
            </span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3 w-full max-w-xs relative z-10">
        <button
          id="pager-test-beep-btn"
          onClick={!previewMode ? onTestBeep : undefined}
          disabled={previewMode}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.06))',
            border: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b',
            boxShadow: '0 0 12px rgba(245,158,11,0.06)',
          }}
        >
          <Volume2 size={13} />
          {lang === 'bm' ? 'Uji Bunyi' : 'Test Beep'}
        </button>
        <button
          id="pager-warning-btn"
          onClick={!previewMode ? onShowWarning : undefined}
          disabled={previewMode}
          className="w-11 flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#f59e0b',
          }}
        >
          <AlertTriangle size={15} />
        </button>
      </div>
    </div>
  )
}

// ── Multi-session Premium Board ───────────────────────────────────────────────
function MultiPagerCard({
  sessions,
  lang,
  onTestBeep,
  onShowWarning,
  previewMode = false,
}: {
  sessions: ActiveSession[]
  lang: 'bm' | 'en'
  onTestBeep?: () => void
  onShowWarning?: () => void
  previewMode?: boolean
}) {
  return (
    <div
      className="h-1/2 w-full flex-shrink-0 flex flex-col px-4 py-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(170deg, #0f0c0a 0%, #1a1108 45%, #0a0a0a 100%)' }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 110%, rgba(245,158,11,0.08) 0%, transparent 65%)',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <StatusDot />
          <span className="text-amber-400/80 text-[10px] font-bold uppercase tracking-[0.2em]">
            {lang === 'bm' ? 'Pesanan Aktif' : 'Active Orders'}
          </span>
        </div>
        <span
          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.25)',
            color: '#f59e0b',
          }}
        >
          {sessions.length} {lang === 'bm' ? 'Gerai' : 'Stalls'}
        </span>
      </div>

      {/* Sessions list */}
      <div className="flex-1 min-h-0 overflow-y-auto relative z-10 space-y-2 pr-0.5">
        {sessions.map((session) => {
          const isCalled = session.status === 'called'
          return (
            <div
              key={session.sessionId}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                background: isCalled
                  ? 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.06))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                border: isCalled
                  ? '1px solid rgba(245,158,11,0.35)'
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isCalled ? '0 0 12px rgba(245,158,11,0.08)' : 'none',
                animation: isCalled ? 'premium-row-pulse 1.2s ease-in-out infinite' : undefined,
              }}
            >
              {/* Logo */}
              {session.merchantLogo ? (
                <img
                  src={session.merchantLogo}
                  alt={session.merchantName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  style={{ border: '1.5px solid rgba(245,158,11,0.2)' }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-amber-400 font-black text-sm"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1.5px solid rgba(245,158,11,0.2)',
                  }}
                >
                  {session.merchantName.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-bold truncate leading-none">
                  {session.merchantName}
                </p>
                {isCalled ? (
                  <p className="text-amber-400 text-[10px] font-black uppercase tracking-wider mt-0.5">
                    🔔 {lang === 'bm' ? 'Sedia!' : 'Ready!'}
                  </p>
                ) : (
                  <p className="text-white/30 text-[10px] font-bold mt-0.5">
                    {session.isGhostActive ? (lang === 'bm' ? 'Sibuk' : 'Busy') : session.formattedWaitTime ?? '...'}
                  </p>
                )}
              </div>

              {/* Receipt number */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span
                  className="font-black text-lg leading-none"
                  style={{
                    color: isCalled ? '#f59e0b' : 'rgba(255,255,255,0.6)',
                    textShadow: isCalled ? '0 0 12px rgba(245,158,11,0.5)' : 'none',
                  }}
                >
                  #{session.receiptNumber}
                </span>
                <ChevronRight size={12} className="text-white/20" />
              </div>
            </div>
          )
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mt-3 relative z-10">
        <button
          id="pager-multi-test-beep-btn"
          onClick={!previewMode ? onTestBeep : undefined}
          disabled={previewMode}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.06))',
            border: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b',
          }}
        >
          <Volume2 size={13} />
          {lang === 'bm' ? 'Uji Bunyi' : 'Test Beep'}
        </button>
        <button
          id="pager-multi-warning-btn"
          onClick={!previewMode ? onShowWarning : undefined}
          disabled={previewMode}
          className="w-11 flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
          style={{
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#f59e0b',
          }}
        >
          <AlertTriangle size={15} />
        </button>
      </div>

      <style>{`
        @keyframes premium-row-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.75; }
        }
      `}</style>
    </div>
  )
}

// ── Public export — auto-selects mode ─────────────────────────────────────────
export function PremiumPagerZone({
  merchantName,
  merchantLogo,
  receiptNumber,
  lang,
  formattedWaitTime,
  isGhostActive,
  onTestBeep,
  onShowWarning,
  previewMode = false,
  sessions,
}: PremiumPagerZoneProps) {
  // Multi-session mode: if sessions array provided with >1 entry
  if (sessions && sessions.length > 1) {
    return (
      <MultiPagerCard
        sessions={sessions}
        lang={lang}
        onTestBeep={onTestBeep}
        onShowWarning={onShowWarning}
        previewMode={previewMode}
      />
    )
  }

  // Single-session mode (original)
  const singleSession = sessions?.[0]
  return (
    <SinglePagerCard
      merchantName={singleSession?.merchantName ?? merchantName ?? ''}
      merchantLogo={singleSession?.merchantLogo ?? merchantLogo}
      receiptNumber={singleSession?.receiptNumber ?? receiptNumber ?? ''}
      lang={lang}
      formattedWaitTime={singleSession?.formattedWaitTime ?? formattedWaitTime}
      isGhostActive={singleSession?.isGhostActive ?? isGhostActive}
      onTestBeep={onTestBeep}
      onShowWarning={onShowWarning}
      previewMode={previewMode}
    />
  )
}
