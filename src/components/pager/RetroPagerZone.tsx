'use client'

import React from 'react'
import { Volume2, AlertTriangle } from 'lucide-react'

interface RetroPagerZoneProps {
  merchantName: string
  merchantLogo?: string | null
  receiptNumber: string
  lang: 'bm' | 'en'
  formattedWaitTime?: string
  isGhostActive?: boolean
  onTestBeep?: () => void
  onShowWarning?: () => void
  previewMode?: boolean
}

export function RetroPagerZone({
  merchantName,
  merchantLogo = null,
  receiptNumber,
  lang,
  formattedWaitTime = '00:00',
  isGhostActive = false,
  onTestBeep,
  onShowWarning,
  previewMode = false,
}: RetroPagerZoneProps) {
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
      <div className="flex items-center gap-2.5 mb-3.5 relative z-10">
        {merchantLogo ? (
          <img
            src={merchantLogo}
            alt={merchantName}
            className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-md"
          />
        ) : (
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-white/5 shadow-md">
            <span className="text-white text-sm font-black leading-none">B</span>
          </div>
        )}
        <span
          className="text-slate-200 text-sm font-black tracking-widest uppercase"
        >
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
            <span>{lang === 'bm' ? 'MENYEDIA PESANAN...' : 'PREPARING ORDER...'}</span>
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-[#39ff14]/20" />

          {/* Line 2: Order Number */}
          <div className="flex items-baseline justify-between text-2xl tracking-widest leading-tight">
            <span className="opacity-60 text-lg">ORDER</span>
            <span className="text-3xl">
              #{receiptNumber}
              <span className="animate-lcd-blink text-2xl">_</span>
            </span>
          </div>

          {/* Line 3: Wait Time */}
          <div className="flex items-baseline justify-between text-xl tracking-widest leading-tight mt-0.5">
            <span className="opacity-60 text-base">WAIT</span>
            {isGhostActive ? (
              <span className="text-2xl opacity-50">BUSY...</span>
            ) : (
              <span className="text-3xl tabular-nums">{formattedWaitTime}</span>
            )}
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-[#39ff14]/20" />

          {/* Line 4: Footer */}
          <div className="text-sm tracking-[0.3em] opacity-40 text-right leading-tight">BEEPME.PRO</div>
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
          className="w-12 flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-transform font-['VT323'] text-base disabled:pointer-events-none"
          style={{
            background: '#1a1200',
            border: '2px solid #f59e0b',
            color: '#f59e0b',
            textShadow: '0 0 6px rgba(245,158,11,0.7)',
            boxShadow: '0 0 6px rgba(245,158,11,0.1)',
          }}
        >
          <AlertTriangle size={14} />
          <span className="text-[10px]">!</span>
        </button>
      </div>
    </div>
  )
}
