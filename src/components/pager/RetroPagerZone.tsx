'use client'

import React from 'react'
import { Volume2, AlertTriangle } from 'lucide-react'

export interface ActiveSession {
  sessionId: string
  merchantName: string
  merchantLogo?: string | null
  receiptNumber: string
  status: 'waiting' | 'called' | 'completed'
  formattedWaitTime?: string
  isGhostActive?: boolean
}

interface RetroPagerZoneProps {
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

// ── Single-session LCD (original design) ──────────────────────────────────────
function SinglePagerLCD({
  merchantName,
  merchantLogo,
  receiptNumber,
  lang,
  formattedWaitTime = '00:00',
  isGhostActive = false,
  onTestBeep,
  onShowWarning,
  previewMode = false,
}: Required<Pick<RetroPagerZoneProps, 'merchantName' | 'receiptNumber' | 'lang'>> &
  Pick<RetroPagerZoneProps, 'merchantLogo' | 'formattedWaitTime' | 'isGhostActive' | 'onTestBeep' | 'onShowWarning' | 'previewMode'>) {
  return (
    <div
      className="h-1/2 w-full flex-shrink-0 flex flex-col items-center justify-center px-5 py-3 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #111 50%, #0a0a0a 100%)' }}
    >
      {/* Dark chassis texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.5) 3px, rgba(255,255,255,0.5) 4px)',
        }}
      />

      {/* Merchant logo + name — label above LCD */}
      <div className="flex items-center gap-3 mb-4 relative z-10">
        {merchantLogo ? (
          <img
            src={merchantLogo}
            alt={merchantName}
            className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-md"
          />
        ) : (
          <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-white/5 shadow-md">
            <span className="text-white text-base font-black leading-none">B</span>
          </div>
        )}
        <span className="text-slate-200 text-lg font-black tracking-widest uppercase">
          {merchantName}
        </span>
      </div>

      {/* LCD Screen Panel */}
      <div
        className="relative w-full max-w-xs rounded-sm overflow-hidden animate-lcd-flicker"
        style={{
          background: '#001800',
          border: '3px solid #1a2e1a',
          boxShadow:
            'inset 0 0 20px rgba(0,0,0,0.8), 0 0 20px rgba(57,255,20,0.08), inset 0 0 40px rgba(57,255,20,0.04)',
        }}
      >
        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* LCD Content */}
        <div
          className="relative z-10 px-4 py-3 font-['VT323']"
          style={{
            color: '#39ff14',
            textShadow: '0 0 8px rgba(57,255,20,0.8), 0 0 20px rgba(57,255,20,0.4)',
          }}
        >
          {/* Line 1: Status */}
          <div className="text-lg tracking-widest leading-tight opacity-80 flex items-center gap-1">
            <span>{'> '}</span>
            <span className="flex items-center">
              <span>{lang === 'bm' ? 'MENYEDIA PESANAN' : 'PREPARING ORDER'}</span>
              <span className="inline-flex ml-1">
                <span className="animate-lcd-dot" style={{ animationDelay: '0s' }}>.</span>
                <span className="animate-lcd-dot" style={{ animationDelay: '0.2s' }}>.</span>
                <span className="animate-lcd-dot" style={{ animationDelay: '0.4s' }}>.</span>
              </span>
            </span>
          </div>

          {/* Divider */}
          <div className="my-1.5 border-t border-[#39ff14]/20" />

          {/* Line 2: Order Number */}
          <div className="flex items-baseline justify-between py-2.5 text-3xl tracking-widest leading-none">
            <span className="opacity-60 text-xl">ORDER</span>
            <span className="text-5xl">#{receiptNumber}</span>
          </div>

          {/* Divider */}
          <div className="my-1.5 border-t border-[#39ff14]/20" />

          {/* Line 3: Footer with Wait Time */}
          <div className="text-sm opacity-50 flex justify-between items-baseline leading-none">
            <span className="tracking-[0.1em]">
              {isGhostActive ? 'WAIT: BUSY' : `WAIT: ${formattedWaitTime}`}
            </span>
            <span className="opacity-75 tracking-[0.3em]">BEEPME.PRO</span>
          </div>
        </div>

        {/* LCD corner reflection */}
        <div
          className="absolute top-0 left-0 w-12 h-8 pointer-events-none z-30"
          style={{ background: 'linear-gradient(135deg, rgba(57,255,20,0.06) 0%, transparent 60%)' }}
        />
      </div>

      {/* Buttons below LCD — retro style */}
      <div className="flex gap-2 mt-3 w-full max-w-xs relative z-10">
        <button
          onClick={!previewMode ? onTestBeep : undefined}
          disabled={previewMode}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 font-['VT323'] text-lg tracking-widest uppercase transition-all active:scale-95 disabled:pointer-events-none"
          style={{
            background: '#0d1a0d',
            border: '2px solid #39ff14',
            color: '#39ff14',
            textShadow: '0 0 8px rgba(57,255,20,0.8)',
            boxShadow: '0 0 8px rgba(57,255,20,0.15), inset 0 0 8px rgba(0,0,0,0.5)',
          }}
        >
          <Volume2 size={14} />
          {lang === 'bm' ? '[UJI BUNYI]' : '[TEST BEEP]'}
        </button>
        <button
          onClick={!previewMode ? onShowWarning : undefined}
          disabled={previewMode}
          className="w-12 flex items-center justify-center active:scale-95 transition-transform disabled:pointer-events-none"
          style={{
            background: '#1a1200',
            border: '2px solid #f59e0b',
            color: '#f59e0b',
            textShadow: '0 0 6px rgba(245,158,11,0.7)',
            boxShadow: '0 0 6px rgba(245,158,11,0.1)',
          }}
        >
          <AlertTriangle size={18} />
        </button>
      </div>
    </div>
  )
}

// ── Multi-session Terminal LCD (new flight-board style) ────────────────────────
function MultiPagerLCD({ sessions, lang, onTestBeep, onShowWarning, previewMode = false }: {
  sessions: ActiveSession[]
  lang: 'bm' | 'en'
  onTestBeep?: () => void
  onShowWarning?: () => void
  previewMode?: boolean
}) {
  return (
    <div
      className="h-1/2 w-full flex-shrink-0 flex flex-col items-center justify-center px-3 py-3 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d0d0d 0%, #111 50%, #0a0a0a 100%)' }}
    >
      {/* Dark chassis texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.5) 3px, rgba(255,255,255,0.5) 4px)',
        }}
      />

      {/* Header label */}
      <div className="flex items-center gap-2 mb-2 relative z-10 w-full max-w-xs">
        <div className="h-px flex-1 bg-[#39ff14]/20" />
        <span
          className="text-[10px] font-['VT323'] tracking-[0.3em] uppercase"
          style={{ color: '#39ff14', textShadow: '0 0 6px rgba(57,255,20,0.6)' }}
        >
          {lang === 'bm' ? 'PESANAN AKTIF' : 'ACTIVE ORDERS'}
        </span>
        <div className="h-px flex-1 bg-[#39ff14]/20" />
      </div>

      {/* LCD Panel — flight-board terminal */}
      <div
        className="relative w-full max-w-xs rounded-sm overflow-hidden"
        style={{
          background: '#001800',
          border: '3px solid #1a2e1a',
          boxShadow:
            'inset 0 0 20px rgba(0,0,0,0.8), 0 0 20px rgba(57,255,20,0.08), inset 0 0 40px rgba(57,255,20,0.04)',
          maxHeight: '180px',
        }}
      >
        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.25) 2px, rgba(0,0,0,0.25) 4px)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Table header */}
        <div
          className="relative z-10 px-3 pt-2 pb-1 font-['VT323'] border-b border-[#39ff14]/20"
          style={{
            color: '#39ff14',
            textShadow: '0 0 6px rgba(57,255,20,0.6)',
          }}
        >
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 text-[11px] tracking-widest opacity-50">
            <span>{lang === 'bm' ? 'GERAI' : 'STALL'}</span>
            <span className="text-right">{lang === 'bm' ? 'NO.' : 'NO.'}</span>
            <span className="text-right w-16">{lang === 'bm' ? 'STATUS' : 'STATUS'}</span>
          </div>
        </div>

        {/* Session rows */}
        <div className="relative z-10 font-['VT323'] overflow-y-auto" style={{ maxHeight: '130px' }}>
          {sessions.map((session, idx) => {
            const isCalled = session.status === 'called'
            const rowColor = isCalled ? '#ff9500' : '#39ff14'
            const rowGlow = isCalled
              ? '0 0 8px rgba(255,149,0,0.8), 0 0 20px rgba(255,149,0,0.4)'
              : '0 0 8px rgba(57,255,20,0.8), 0 0 20px rgba(57,255,20,0.4)'

            return (
              <div
                key={session.sessionId}
                className="px-3 py-1.5"
                style={{
                  borderBottom: idx < sessions.length - 1 ? '1px solid rgba(57,255,20,0.08)' : 'none',
                  color: rowColor,
                  textShadow: rowGlow,
                  animation: isCalled ? 'lcd-row-flash 0.8s step-end infinite' : undefined,
                }}
              >
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 items-center text-base tracking-widest leading-tight">
                  {/* Stall name — truncated */}
                  <span className="truncate text-[13px]">
                    {session.merchantName.toUpperCase()}
                  </span>
                  {/* Receipt number */}
                  <span className="text-right text-xl font-bold">
                    #{session.receiptNumber}
                  </span>
                  {/* Status badge */}
                  <span
                    className="text-right text-[10px] tracking-widest w-16"
                    style={{ opacity: isCalled ? 1 : 0.65 }}
                  >
                    {isCalled
                      ? '🔔 READY'
                      : session.isGhostActive
                      ? 'BUSY'
                      : session.formattedWaitTime ?? '...'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* LCD corner reflection */}
        <div
          className="absolute top-0 left-0 w-12 h-8 pointer-events-none z-30"
          style={{ background: 'linear-gradient(135deg, rgba(57,255,20,0.06) 0%, transparent 60%)' }}
        />
      </div>

      {/* BEEPME.PRO watermark + count */}
      <div
        className="mt-2 flex justify-between w-full max-w-xs relative z-10 font-['VT323'] text-[10px] tracking-[0.3em]"
        style={{ color: '#39ff14', opacity: 0.35, textShadow: '0 0 4px rgba(57,255,20,0.4)' }}
      >
        <span>{sessions.length} {lang === 'bm' ? 'PESANAN AKTIF' : 'ACTIVE ORDERS'}</span>
        <span>BEEPME.PRO</span>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 mt-2 w-full max-w-xs relative z-10">
        <button
          onClick={!previewMode ? onTestBeep : undefined}
          disabled={previewMode}
          className="flex-1 flex items-center justify-center gap-2 py-2 font-['VT323'] text-base tracking-widest uppercase transition-all active:scale-95 disabled:pointer-events-none"
          style={{
            background: '#0d1a0d',
            border: '2px solid #39ff14',
            color: '#39ff14',
            textShadow: '0 0 8px rgba(57,255,20,0.8)',
            boxShadow: '0 0 8px rgba(57,255,20,0.15), inset 0 0 8px rgba(0,0,0,0.5)',
          }}
        >
          <Volume2 size={13} />
          {lang === 'bm' ? '[UJI BUNYI]' : '[TEST BEEP]'}
        </button>
        <button
          onClick={!previewMode ? onShowWarning : undefined}
          disabled={previewMode}
          className="w-10 flex items-center justify-center active:scale-95 transition-transform disabled:pointer-events-none"
          style={{
            background: '#1a1200',
            border: '2px solid #f59e0b',
            color: '#f59e0b',
            textShadow: '0 0 6px rgba(245,158,11,0.7)',
            boxShadow: '0 0 6px rgba(245,158,11,0.1)',
          }}
        >
          <AlertTriangle size={16} />
        </button>
      </div>

      <style>{`
        @keyframes lcd-row-flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}

// ── Public export — auto-selects mode ─────────────────────────────────────────
export function RetroPagerZone({
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
}: RetroPagerZoneProps) {
  // Multi-session mode: if sessions array provided with >1 entry
  if (sessions && sessions.length > 1) {
    return (
      <MultiPagerLCD
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
    <SinglePagerLCD
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
