'use client'

/**
 * QrModal
 * Extracted from dashboard/page.tsx lines 970-986.
 * Renders a full-screen backdrop modal containing a QR code for a given pager session.
 * The QR encodes the customer-facing pager URL so they can scan and confirm their order.
 */

import { QRCodeSVG } from 'qrcode.react'
import { X } from 'lucide-react'
import { Session } from '@/types'

interface Props {
  session: Session
  pagerUrl: (id: string) => string
  onClose: () => void
}

export function QrModal({ session, pagerUrl, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 sm:p-8 border text-center animate-bounce-in"
        style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-white text-lg">Order #{session.receipt_number}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <X size={18} />
          </button>
        </div>
        <div className="bg-white p-4 rounded-2xl inline-block mb-4">
          <QRCodeSVG value={pagerUrl(session.id)} size={200} level="H" />
        </div>
        <div className="mt-2 text-left border-t border-white/10 pt-4 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 text-center">
            Arahan Imbas QR / QR Scan Instructions
          </p>
          <div className="flex gap-3 items-start bg-white/[0.02] p-3 rounded-xl border border-white/5">
            <span className="text-lg shrink-0 mt-0.5">📸</span>
            <div className="text-xs">
              <p className="font-bold text-white leading-tight">1. Buka Kamera Telefon</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Atau sebarang aplikasi imbas QR / Google Lens</p>
              <p className="text-indigo-400 text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Open Phone Camera / Google Lens</p>
            </div>
          </div>
          <div className="flex gap-3 items-start bg-white/[0.02] p-3 rounded-xl border border-white/5">
            <span className="text-lg shrink-0 mt-0.5">🔗</span>
            <div className="text-xs">
              <p className="font-bold text-white leading-tight">2. Imbas & Ketik Link</p>
              <p className="text-slate-400 text-[10px] mt-0.5">Halakan pada QR dan klik pautan yang muncul untuk aktifkan pager</p>
              <p className="text-indigo-400 text-[9px] font-bold mt-1 uppercase tracking-widest leading-none">Scan & Tap link to activate pager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
