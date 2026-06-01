'use client'

import React, { useEffect, useRef, useState } from 'react'
import { X, QrCode, Camera, AlertCircle } from 'lucide-react'

interface QrScannerModalProps {
  onScan: (sessionId: string) => void
  onClose: () => void
}

export function QrScannerModal({ onScan, onClose }: QrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [error, setError] = useState<'permission' | 'unavailable' | null>(null)
  const [scanning, setScanning] = useState(true)
  const scannedRef = useRef(false)

  useEffect(() => {
    let mounted = true

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('unavailable')
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch (e: any) {
        if (!mounted) return
        if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError') {
          setError('permission')
        } else {
          setError('unavailable')
        }
      }
    }

    startCamera()

    return () => {
      mounted = false
      stopAll()
    }
  }, [])

  const stopAll = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
  }

  const handleClose = () => {
    stopAll()
    onClose()
  }

  // Kick off the decode loop once video is playing
  const handleVideoPlay = async () => {
    // Lazy-import jsQR to avoid SSR issues
    const jsQR = (await import('jsqr')).default

    const decode = () => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas || scannedRef.current) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        })
        if (code?.data) {
          const match = code.data.match(
            /beepme\.pro\/pager\/([a-zA-Z0-9_-]+)/
          )
          if (match?.[1]) {
            scannedRef.current = true
            setScanning(false)
            stopAll()
            onScan(match[1])
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(decode)
    }

    rafRef.current = requestAnimationFrame(decode)
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(8px)' }}
    >
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between px-5 py-4 relative z-10">
        <div className="flex items-center gap-2">
          <QrCode size={18} style={{ color: '#818cf8' }} />
          <span
            className="font-black text-sm uppercase tracking-widest"
            style={{ color: '#c7d2fe' }}
          >
            Imbas QR Gerai
          </span>
        </div>
        <button
          onClick={handleClose}
          className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90"
          style={{
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.25)',
            color: '#818cf8',
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Camera / Error area */}
      <div className="relative w-full max-w-sm flex-1 flex items-center justify-center px-5 pb-8">
        {error === 'permission' && (
          <div className="flex flex-col items-center text-center gap-4 px-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h3 className="font-black text-white text-lg uppercase tracking-tight">
              Akses Kamera Ditolak
            </h3>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              Sila benarkan akses kamera dalam tetapan pelayar anda, kemudian cuba semula.
            </p>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8',
              }}
            >
              Tutup
            </button>
          </div>
        )}

        {error === 'unavailable' && (
          <div className="flex flex-col items-center text-center gap-4 px-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
              }}
            >
              <Camera size={32} className="text-amber-400" />
            </div>
            <h3 className="font-black text-white text-lg uppercase tracking-tight">
              Kamera Tidak Tersedia
            </h3>
            <p className="text-sm font-medium text-slate-400 leading-relaxed">
              Peranti atau pelayar ini tidak menyokong kamera web.
            </p>
            <button
              onClick={handleClose}
              className="mt-2 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95"
              style={{
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                color: '#818cf8',
              }}
            >
              Tutup
            </button>
          </div>
        )}

        {!error && (
          <div className="relative w-full aspect-square max-w-[300px]">
            {/* Video feed */}
            <video
              ref={videoRef}
              onPlay={handleVideoPlay}
              className="w-full h-full object-cover rounded-2xl"
              style={{
                border: '2px solid rgba(99,102,241,0.3)',
              }}
              playsInline
              muted
            />

            {/* Hidden canvas for QR decode */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan frame overlay */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Corner brackets */}
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                <div
                  key={pos}
                  className="absolute w-10 h-10"
                  style={{
                    top: pos.includes('top') ? 12 : undefined,
                    bottom: pos.includes('bottom') ? 12 : undefined,
                    left: pos.includes('left') ? 12 : undefined,
                    right: pos.includes('right') ? 12 : undefined,
                    borderTop: pos.includes('top') ? '3px solid #6366f1' : undefined,
                    borderBottom: pos.includes('bottom') ? '3px solid #6366f1' : undefined,
                    borderLeft: pos.includes('left') ? '3px solid #6366f1' : undefined,
                    borderRight: pos.includes('right') ? '3px solid #6366f1' : undefined,
                    borderTopLeftRadius: pos === 'top-left' ? 8 : 0,
                    borderTopRightRadius: pos === 'top-right' ? 8 : 0,
                    borderBottomLeftRadius: pos === 'bottom-left' ? 8 : 0,
                    borderBottomRightRadius: pos === 'bottom-right' ? 8 : 0,
                  }}
                />
              ))}

              {/* Scanning laser line */}
              {scanning && (
                <div
                  className="absolute inset-x-4"
                  style={{
                    height: '2px',
                    background: 'linear-gradient(90deg, transparent, #6366f1, transparent)',
                    boxShadow: '0 0 8px rgba(99,102,241,0.8)',
                    animation: 'qr-scan-line 2s ease-in-out infinite',
                    top: '50%',
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hint text */}
      {!error && (
        <p
          className="pb-10 text-center text-[11px] font-bold uppercase tracking-widest"
          style={{ color: 'rgba(99,102,241,0.6)' }}
        >
          Tuju kamera ke QR Code gerai
        </p>
      )}

      <style>{`
        @keyframes qr-scan-line {
          0%, 100% { transform: translateY(-60px); opacity: 0.3; }
          50% { transform: translateY(60px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
