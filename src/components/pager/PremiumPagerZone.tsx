'use client'

import React from 'react'
import { Volume2, AlertTriangle, Clock, ChevronRight, QrCode } from 'lucide-react'

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
  onScanQr?: () => void
  previewMode?: boolean

  // Multi-session mode
  sessions?: ActiveSession[]
}

// ── Pulsing status dot ────────────────────────────────────────────────────────
function StatusDot({ color = '#6366f1' }: { color?: string }) {
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

// ── Shared action button row ───────────────────────────────────────────────────
function ActionButtons({
  lang,
  previewMode,
  onTestBeep,
  onShowWarning,
  onScanQr,
  testBeepId,
  warningId,
  scanId,
}: {
  lang: 'bm' | 'en'
  previewMode?: boolean
  onTestBeep?: () => void
  onShowWarning?: () => void
  onScanQr?: () => void
  testBeepId: string
  warningId: string
  scanId: string
}) {
  return (
    <div className="flex gap-2 w-full">
      {/* Test Beep */}
      <button
        id={testBeepId}
        onClick={!previewMode ? onTestBeep : undefined}
        disabled={previewMode}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs tracking-widest uppercase transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(99,102,241,0.06))',
          border: '1px solid rgba(99,102,241,0.3)',
          color: '#818cf8',
          boxShadow: '0 0 12px rgba(99,102,241,0.06)',
        }}
      >
        <Volume2 size={13} />
        {lang === 'bm' ? 'Uji Bunyi' : 'Test Beep'}
      </button>

      {/* QR Scan */}
      <button
        id={scanId}
        onClick={!previewMode ? onScanQr : undefined}
        disabled={previewMode}
        className="w-11 flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        style={{
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.28)',
          color: '#818cf8',
        }}
        title={lang === 'bm' ? 'Imbas QR Gerai Lain' : 'Scan Another Stall QR'}
      >
        <QrCode size={15} />
      </button>

      {/* Warning */}
      <button
        id={warningId}
        onClick={!previewMode ? onShowWarning : undefined}
        disabled={previewMode}
        className="w-11 flex items-center justify-center rounded-xl transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        style={{
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.2)',
          color: '#818cf8',
        }}
      >
        <AlertTriangle size={15} />
      </button>
    </div>
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
  onScanQr,
  previewMode = false,
}: Required<Pick<PremiumPagerZoneProps, 'merchantName' | 'receiptNumber' | 'lang'>> &
  Pick<PremiumPagerZoneProps, 'merchantLogo' | 'formattedWaitTime' | 'isGhostActive' | 'onTestBeep' | 'onShowWarning' | 'onScanQr' | 'previewMode'>) {
  return (
    <div
      className="h-1/2 w-full flex-shrink-0 flex flex-col items-center justify-center px-4 py-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(170deg, #0a0c18 0%, #0c101f 45%, #08090f 100%)' }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 110%, rgba(99,102,241,0.08) 0%, transparent 65%)',
        }}
      />

      {/* Merchant header */}
      <div className="flex items-center gap-2.5 mb-4 relative z-10 w-full max-w-xs">
        {merchantLogo ? (
          <img
            src={merchantLogo}
            alt={merchantName}
            className="w-9 h-9 rounded-full object-cover shadow-md"
            style={{ border: '1.5px solid rgba(99,102,241,0.3)' }}
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-black text-base shadow-md"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.07))',
              border: '1.5px solid rgba(99,102,241,0.28)',
              color: '#818cf8',
            }}
          >
            {merchantName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-white/90 text-sm font-bold tracking-wide truncate">
            {merchantName}
          </span>
          <span
            className="text-[9px] font-bold uppercase tracking-widest"
            style={{ color: 'rgba(99,102,241,0.55)' }}
          >
            beepme.pro
          </span>
        </div>
      </div>

      {/* Main glass card */}
      <div
        className="relative w-full max-w-xs rounded-2xl overflow-hidden z-10"
        style={{
          background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(99,102,241,0.18)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Top accent line */}
        <div
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)' }}
        />

        <div className="px-5 pt-4 pb-4">
          {/* Status row */}
          <div className="flex items-center gap-2 mb-3">
            <StatusDot />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'rgba(129,140,248,0.8)' }}
            >
              {lang === 'bm' ? 'Menyedia Pesanan' : 'Preparing Order'}
            </span>
          </div>

          {/* Order number — hero */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-white/30 text-xl font-black tracking-tight">#</span>
            <span
              className="font-black leading-none text-transparent bg-clip-text"
              style={{
                fontSize: 'clamp(3rem, 16vw, 5rem)',
                backgroundImage: 'linear-gradient(135deg, #c7d2fe 0%, #818cf8 50%, #6366f1 100%)',
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
      <div className="mt-3 w-full max-w-xs relative z-10">
        <ActionButtons
          lang={lang}
          previewMode={previewMode}
          onTestBeep={onTestBeep}
          onShowWarning={onShowWarning}
          onScanQr={onScanQr}
          testBeepId="pager-test-beep-btn"
          warningId="pager-warning-btn"
          scanId="pager-scan-qr-btn"
        />
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
  onScanQr,
  previewMode = false,
}: {
  sessions: ActiveSession[]
  lang: 'bm' | 'en'
  onTestBeep?: () => void
  onShowWarning?: () => void
  onScanQr?: () => void
  previewMode?: boolean
}) {
  return (
    <div
      className="h-1/2 w-full flex-shrink-0 flex flex-col px-4 py-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(170deg, #0a0c18 0%, #0c101f 45%, #08090f 100%)' }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 110%, rgba(99,102,241,0.08) 0%, transparent 65%)',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <StatusDot />
          <span
            className="text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ color: 'rgba(129,140,248,0.8)' }}
          >
            {lang === 'bm' ? 'Pesanan Aktif' : 'Active Orders'}
          </span>
        </div>
        <span
          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#818cf8',
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
                  ? 'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(99,102,241,0.06))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                border: isCalled
                  ? '1px solid rgba(99,102,241,0.38)'
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: isCalled ? '0 0 14px rgba(99,102,241,0.1)' : 'none',
                animation: isCalled ? 'premium-row-pulse 1.2s ease-in-out infinite' : undefined,
              }}
            >
              {/* Logo */}
              {session.merchantLogo ? (
                <img
                  src={session.merchantLogo}
                  alt={session.merchantName}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  style={{ border: '1.5px solid rgba(99,102,241,0.22)' }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-black text-sm"
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1.5px solid rgba(99,102,241,0.22)',
                    color: '#818cf8',
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
                  <p
                    className="text-[10px] font-black uppercase tracking-wider mt-0.5"
                    style={{ color: '#818cf8' }}
                  >
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
                    color: isCalled ? '#818cf8' : 'rgba(255,255,255,0.6)',
                    textShadow: isCalled ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
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
      <div className="mt-3 relative z-10">
        <ActionButtons
          lang={lang}
          previewMode={previewMode}
          onTestBeep={onTestBeep}
          onShowWarning={onShowWarning}
          onScanQr={onScanQr}
          testBeepId="pager-multi-test-beep-btn"
          warningId="pager-multi-warning-btn"
          scanId="pager-multi-scan-qr-btn"
        />
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
  onScanQr,
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
        onScanQr={onScanQr}
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
      onScanQr={onScanQr}
      previewMode={previewMode}
    />
  )
}
