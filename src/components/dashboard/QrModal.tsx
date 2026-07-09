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
        <div className="bg-white p-4 rounded-xl inline-block mb-4">
          <QRCodeSVG value={pagerUrl(session.id)} size={200} level="H" />
        </div>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Ask customer to scan QR
        </p>
      </div>
    </div>
  )
}
