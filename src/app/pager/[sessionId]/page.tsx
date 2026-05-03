'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'

type PagerStatus = 'loading' | 'confirm' | 'waiting' | 'called' | 'completed' | 'error'

export default function PagerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const supabase = createClient()

  const [status, setStatus] = useState<PagerStatus>('loading')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [waitTime, setWaitTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [isFlashing, setIsFlashing] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch initial session status
  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase.from('sessions').select('*, merchants(name)').eq('id', sessionId).single()
      if (error || !data) { setStatus('error'); return }
      setReceiptNumber(data.receipt_number)
      if (data.status === 'called') { setStatus('called'); triggerAlert() }
      else if (data.status === 'completed' || data.status === 'archived') { setStatus('completed') }
      else { setStatus('confirm') }
    }
    fetchSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // Wait timer
  useEffect(() => {
    if (status === 'waiting') {
      waitTimerRef.current = setInterval(() => setWaitTime(t => t + 1), 1000)
    }
    return () => { if (waitTimerRef.current) clearInterval(waitTimerRef.current) }
  }, [status])

  // Visibility change handler — check status when user returns to tab
  const checkStatus = useCallback(async () => {
    const { data } = await supabase.from('sessions').select('status').eq('id', sessionId).single()
    if (data?.status === 'called' && status !== 'called') {
      setStatus('called')
      triggerAlert()
    } else if ((data?.status === 'completed' || data?.status === 'archived') && status === 'waiting') {
      setStatus('completed')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, status])

  useEffect(() => {
    const handleVisibility = () => {
      if (!document.hidden && status === 'waiting') { checkStatus() }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [checkStatus, status])

  const acquireWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch { /* silently fail if not supported */ }
  }

  const releaseWakeLock = () => {
    wakeLockRef.current?.release()
    wakeLockRef.current = null
  }

  const triggerAlert = () => {
    // Vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([500, 250, 500, 250, 500, 250, 500])
    }
    // Audio chime
    playChime()
    // Visual flash
    setIsFlashing(true)
  }

  const playChime = () => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const vol = volume

    // Create a pleasant multi-tone chime
    const tones = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18)
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.18)
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + i * 0.18 + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.6)
    })

    // Repeat chime 3 times
    setTimeout(() => { tones.forEach((freq, i) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0, ctx.currentTime + i * 0.18); g.gain.linearRampToValueAtTime(vol * 0.7, ctx.currentTime + i * 0.18 + 0.05); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.4); o.start(ctx.currentTime + i * 0.18); o.stop(ctx.currentTime + i * 0.18 + 0.5) }) }, 1200)
  }

  const handleConfirm = async () => {
    // Init AudioContext (MUST be inside user gesture)
    const ctx = new AudioContext()
    await ctx.resume()
    audioCtxRef.current = ctx

    // Play a silent buffer to unlock audio on iOS
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start()

    await acquireWakeLock()
    setStatus('waiting')

    // Subscribe to realtime
    channelRef.current = supabase.channel(`session-${sessionId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, (payload) => {
        const newStatus = payload.new.status
        if (newStatus === 'called') {
          setStatus('called')
          triggerAlert()
        } else if (newStatus === 'completed' || newStatus === 'archived') {
          setStatus('completed')
          releaseWakeLock()
        }
      })
      .subscribe()
  }

  const formatWaitTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // --- UI STATES ---

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0b0f' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent)' }} />
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: '#0a0b0f' }}>
        <div>
          <div className="text-4xl mb-4">😕</div>
          <h1 className="text-xl font-bold text-white mb-2">Pager Not Found</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>This QR code may have expired. Please ask the cashier for a new one.</p>
        </div>
      </div>
    )
  }

  if (status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: '#0a0b0f' }}>
        <div className="animate-bounce-in">
          <div className="text-6xl mb-6">🙏</div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p style={{ color: 'var(--muted-foreground)' }}>Order #{receiptNumber} has been collected. Enjoy your meal!</p>
        </div>
      </div>
    )
  }

  if (status === 'called' || isFlashing) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6 text-center cursor-pointer"
        style={{ background: '#22c55e', animation: 'flash-green 0.8s ease-in-out infinite' }}
        onClick={() => setIsFlashing(false)}
      >
        <div className="animate-bounce-in">
          <div className="text-8xl mb-4">🔔</div>
          <h1 className="text-4xl font-black text-white mb-3" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            YOUR ORDER IS READY!
          </h1>
          <div className="bg-white/20 rounded-2xl px-8 py-4 mb-6 inline-block">
            <p className="text-white/80 text-lg font-medium">Order Number</p>
            <p className="text-white text-5xl font-black">#{receiptNumber}</p>
          </div>
          <p className="text-white/70 text-lg">Please collect at the counter</p>
          <p className="text-white/50 text-sm mt-6">Tap anywhere to dismiss</p>
        </div>
      </div>
    )
  }

  // Confirm & Waiting states
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'radial-gradient(ellipse at top, #1a1b2e 0%, #0a0b0f 70%)' }}>
      {/* Header */}
      <header className="p-6 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            <span className="text-white text-xs font-bold">B</span>
          </div>
          <span className="font-bold text-white">Beeper</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">

        {status === 'confirm' && (
          <div className="w-full max-w-sm text-center animate-slide-up">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-ring"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 40px rgba(99,102,241,0.5)' }}>
              <span className="text-4xl">🛎️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Order #{receiptNumber}</h1>
            <p className="mb-8" style={{ color: 'var(--muted-foreground)' }}>
              We&apos;ll alert you right here on this screen when your order is ready.
            </p>

            {/* Controls */}
            <div className="rounded-2xl p-5 mb-6 text-left space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <div>
                <label className="text-sm font-medium flex justify-between mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  <span>Alert Volume</span>
                  <span style={{ color: 'var(--accent)' }}>{Math.round(volume * 100)}%</span>
                </label>
                <input
                  id="volume-slider"
                  type="range" min="0" max="1" step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Vibration</label>
                <button
                  id="vibration-toggle"
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className={`w-12 h-6 rounded-full transition-all relative`}
                  style={{ background: vibrationEnabled ? 'var(--accent)' : 'var(--card-border)' }}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${vibrationEnabled ? 'left-6' : 'left-0.5'}`} />
                </button>
              </div>
            </div>

            <button
              id="confirm-order-btn"
              onClick={handleConfirm}
              className="w-full py-5 rounded-2xl font-bold text-white text-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 25px rgba(99,102,241,0.5)' }}
            >
              ✅ Confirm Order
            </button>

            <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>
              Keep this page open for instant alerts. You may also freely browse other apps.
            </p>
          </div>
        )}

        {status === 'waiting' && (
          <div className="w-full max-w-sm text-center animate-fade-in">
            {/* Pulsing ring */}
            <div className="relative w-36 h-36 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: 'var(--accent)' }} />
              <div className="absolute inset-2 rounded-full animate-ping opacity-10 animation-delay-300" style={{ background: 'var(--accent)' }} />
              <div className="relative w-full h-full rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e2030, #252838)', border: '2px solid rgba(99,102,241,0.3)' }}>
                <span className="text-5xl">⏳</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-1">Preparing Your Order</h1>
            <p className="mb-4" style={{ color: 'var(--muted-foreground)' }}>Order #{receiptNumber}</p>

            {/* Wait timer */}
            <div className="inline-block px-6 py-3 rounded-2xl mb-6" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Waiting Time</p>
              <p className="text-3xl font-black font-mono" style={{ color: 'var(--accent)' }}>{formatWaitTime(waitTime)}</p>
            </div>

            <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              🔔 Your screen will flash and buzzer will sound when ready. You can browse other apps — just come back to check!
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Powered by Beeper.io</p>
      </footer>
    </div>
  )
}
