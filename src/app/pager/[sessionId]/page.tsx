'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'
import { Loader2 } from 'lucide-react'

type PagerStatus = 'loading' | 'confirm' | 'waiting' | 'called' | 'completed' | 'error'

const supabase = createClient()

export default function PagerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)

  const [status, setStatus] = useState<PagerStatus>('loading')
  const [merchantName, setMerchantName] = useState('')
  const [merchantLogo, setMerchantLogo] = useState<string | null>(null)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [waitTime, setWaitTime] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isFlashing, setIsFlashing] = useState(false)
  const [lastChecked, setLastChecked] = useState(0)
  const [isAudioReady, setIsAudioReady] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Use a ref for status to avoid closure issues in polling
  const statusRef = useRef<PagerStatus>('loading')
  useEffect(() => { statusRef.current = status }, [status])

  const fetchSession = useCallback(async () => {
    const { data, error } = await supabase.from('sessions').select('*, merchants(name, logo_url)').eq('id', sessionId).single()
    if (error || !data) { 
      if (statusRef.current === 'loading') setStatus('error')
      return 
    }
    
    const rawMerchant = data.merchants
    const merchantData = Array.isArray(rawMerchant) ? rawMerchant[0] : rawMerchant
    
    if (merchantData) {
      setMerchantName(merchantData.name || 'Store')
      setMerchantLogo(merchantData.logo_url)
    }
    
    setReceiptNumber(data.receipt_number)

    // Log logic to decide status
    if (data.status === 'called') {
      if (statusRef.current !== 'called') {
        setStatus('called')
        triggerAlert()
      }
    } else if (data.status === 'completed' || data.status === 'archived') {
      setStatus('completed')
    } else if (data.is_confirmed) {
      // IF ALREADY CONFIRMED, GO TO WAITING
      setStatus('waiting')
    } else {
      setStatus('confirm')
    }
  }, [sessionId])

  // Initial Fetch
  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  // Wait timer & Polling fallback
  useEffect(() => {
    if (status === 'waiting') {
      if (!waitTimerRef.current) {
        waitTimerRef.current = setInterval(() => setWaitTime(t => t + 1), 1000)
      }
      
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          setLastChecked(prev => prev + 1)
          fetchSession()
        }, 3000)
      }
    } else {
      if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null }
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    }

    return () => { 
      if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null }
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
    }
  }, [status, fetchSession])

  const acquireWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      }
    } catch { /* silently fail */ }
  }

  const releaseWakeLock = () => {
    wakeLockRef.current?.release()
    wakeLockRef.current = null
  }

  const triggerAlert = () => {
    if (alertIntervalRef.current) return
    setIsFlashing(true)
    const runAlert = () => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500])
      }
      playChime()
    }
    runAlert()
    alertIntervalRef.current = setInterval(runAlert, 3000)
  }

  const stopAlert = () => {
    setIsFlashing(false)
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current)
      alertIntervalRef.current = null
    }
  }

  const playChime = () => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const tones = [523.25, 659.25, 783.99, 1046.5]
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18)
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.18)
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + i * 0.18 + 0.05)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.5)
      osc.start(ctx.currentTime + i * 0.18)
      osc.stop(ctx.currentTime + i * 0.18 + 0.6)
    })
  }

  const initAudio = async () => {
    try {
      if (audioCtxRef.current) {
        await audioCtxRef.current.resume()
        setIsAudioReady(true)
        return
      }
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      await ctx.resume()
      audioCtxRef.current = ctx
      
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start()
      
      setIsAudioReady(true)
      await acquireWakeLock()
    } catch (e) {
      console.error('Audio init error:', e)
    }
  }

  const handleConfirm = async () => {
    await initAudio()
    const { error } = await supabase.from('sessions').update({ is_confirmed: true }).eq('id', sessionId)
    if (error) {
      alert('Gagal sambung: ' + error.message)
    } else {
      setStatus('waiting')
      fetchSession()
    }
  }

  const formatWaitTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#0a0b0f]"><Loader2 className="animate-spin text-indigo-500" /></div>
  }

  if (status === 'error') {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#0a0b0f]"><h1 className="text-white font-bold text-xl">Order Not Found</h1></div>
  }

  if (status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#0a0b0f]">
        <div className="animate-bounce-in">
          <div className="text-6xl mb-6">🙏</div>
          <h1 className="text-2xl font-bold text-white mb-2">Thank You!</h1>
          <p className="text-slate-400">Order #{receiptNumber} collected.</p>
        </div>
      </div>
    )
  }

  if (status === 'called' || isFlashing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center cursor-pointer bg-green-500 animate-pulse" onClick={stopAlert}>
        <div className="text-8xl mb-4">🔔</div>
        <h1 className="text-4xl font-black text-white mb-3">YOUR ORDER IS READY!</h1>
        <p className="text-white text-5xl font-black mb-6">#{receiptNumber}</p>
        <p className="text-white text-sm font-bold border border-white/40 px-6 py-2 rounded-full uppercase">Tap to stop sound</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0b0f]">
      <header className="p-6 text-center relative">
        <div className="flex flex-col items-center gap-3">
          {merchantLogo ? (
            <img src={merchantLogo} alt={merchantName} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">{merchantName?.[0]}</div>
          )}
          <span className="font-bold text-white text-xl">{merchantName}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {status === 'confirm' && (
          <div className="w-full max-w-sm text-center animate-slide-up">
            <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(79,70,229,0.4)]">
              <span className="text-4xl">🛎️</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Order #{receiptNumber}</h1>
            <p className="text-slate-400 mb-8 text-sm">We&apos;ll alert you when your order is ready.</p>
            <button onClick={handleConfirm} className="w-full py-5 rounded-2xl font-bold text-white text-xl bg-indigo-600 shadow-xl active:scale-95 transition-all">✅ Confirm Order</button>
          </div>
        )}

        {status === 'waiting' && (
          <div className="w-full max-w-sm text-center animate-fade-in">
            <div className="relative w-32 h-32 mx-auto mb-8 flex items-center justify-center rounded-full border-2 border-indigo-500/30">
              <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500/20" />
              <span className="text-5xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Preparing Order</h1>
            <p className="text-slate-400 mb-6 text-sm">Order #{receiptNumber}</p>
            <div className="bg-white/5 border border-white/10 px-8 py-4 rounded-3xl inline-block mb-8">
              <p className="text-indigo-400 text-3xl font-black font-mono">{formatWaitTime(waitTime)}</p>
            </div>

            {!isAudioReady && (
              <button 
                onClick={initAudio}
                className="block mx-auto px-6 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-bold text-sm animate-pulse"
              >
                🔊 Tap to Enable Sound
              </button>
            )}
          </div>
        )}
      </main>

      <footer className="p-4 text-center">
        <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">
          {status === 'waiting' ? `Auto-check: ${lastChecked}` : 'Beeper.io'}
        </p>
      </footer>
    </div>
  )
}
