'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'
import { Loader2, Volume2, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react'

type PagerStatus = 'loading' | 'confirm' | 'waiting' | 'called' | 'completed' | 'error'

const supabase = createClient()

export default function PagerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)

  const [status, setStatus] = useState<PagerStatus>('loading')
  const [merchantName, setMerchantName] = useState('')
  const [merchantLogo, setMerchantLogo] = useState<string | null>(null)
  const [gmbUrl, setGmbUrl] = useState<string | null>(null)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const [volume, setVolume] = useState(1.0)
  const [isFlashing, setIsFlashing] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [themeColor, setThemeColor] = useState('#6366f1')
  const [showInstructions, setShowInstructions] = useState(true)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Use a ref for status to avoid closure issues in polling
  const statusRef = useRef<PagerStatus>('loading')
  useEffect(() => { statusRef.current = status }, [status])

  const fetchSession = useCallback(async () => {
    const { data, error } = await supabase.from('sessions').select('*, merchants(name, logo_url, gmb_url, theme_color)').eq('id', sessionId).single()
    if (error || !data) { 
      if (statusRef.current === 'loading') setStatus('error')
      return 
    }
    
    const rawMerchant = data.merchants
    const merchantData = Array.isArray(rawMerchant) ? rawMerchant[0] : rawMerchant
    
    if (merchantData) {
      setMerchantName(merchantData.name || 'Store')
      setMerchantLogo(merchantData.logo_url)
      setGmbUrl(merchantData.gmb_url)
      setThemeColor(merchantData.theme_color || '#6366f1')
    }
    
    setReceiptNumber(data.receipt_number)
    setCreatedAt(data.created_at)

    if (data.status === 'called') {
      if (statusRef.current !== 'called') {
        setStatus('called')
        triggerAlert()
      }
    } else if (data.status === 'completed' || data.status === 'archived') {
      setStatus('completed')
      stopAlert()
    } else if (data.is_confirmed) {
      setStatus('waiting')
    } else {
      setStatus('confirm')
    }
  }, [sessionId])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    if (status === 'waiting' || status === 'called') {
      if (!waitTimerRef.current) {
        waitTimerRef.current = setInterval(() => setNow(Date.now()), 1000)
      }
      if (!pollingRef.current) {
        pollingRef.current = setInterval(() => {
          fetchSession()
        }, 3000)
      }
    }
    if (status === 'completed' || status === 'error') {
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

  useEffect(() => {
    acquireWakeLock()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') acquireWakeLock()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [])

  const triggerAlert = () => {
    if (alertIntervalRef.current) return
    setIsFlashing(true)
    const runAlert = () => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([800, 200, 800, 200, 800])
      }
      playChime()
    }
    runAlert()
    alertIntervalRef.current = setInterval(runAlert, 2500)
  }

  const stopAlert = () => {
    setIsFlashing(false)
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current)
      alertIntervalRef.current = null
    }
    // Attempt to update status in DB to completion if needed, 
    // but usually completion is handled by merchant
  }

  const playChime = async () => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    if (ctx.state === 'suspended') await ctx.resume()

    const tones = [1046.50, 1318.51, 1567.98, 2093.00]
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
      gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.1)
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + i * 0.1 + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.35)
      osc.start(ctx.currentTime + i * 0.1)
      osc.stop(ctx.currentTime + i * 0.1 + 0.4)
    })
  }

  const initAudio = async () => {
    try {
      if (audioCtxRef.current) {
        await audioCtxRef.current.resume()
        setIsAudioReady(true)
        playChime()
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
      playChime()
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

  const formatWaitTime = () => {
    if (!createdAt) return '0:00'
    const start = new Date(createdAt).getTime()
    const seconds = Math.floor((now - start) / 1000)
    const totalSeconds = seconds > 0 ? seconds : 0
    const m = Math.floor(totalSeconds / 60)
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#020203]"><Loader2 className="animate-spin text-indigo-500" /></div>
  }

  if (status === 'error') {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#020203]"><h1 className="text-white font-bold text-xl uppercase tracking-widest">Session Expired / Not Found</h1></div>
  }

  if (status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#020203]">
        <div className="animate-bounce-in max-w-sm">
          <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-8 border border-green-500/20">
            <CheckCircle2 size={48} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Order Collected</h1>
          <p className="text-slate-400 mb-10 text-sm">Thank you for visiting {merchantName}! We hope you enjoyed your meal.</p>

          {gmbUrl && (
            <a 
              href={gmbUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-slate-100 transition-all shadow-xl shadow-white/5"
            >
              ⭐ Rate us on Google
            </a>
          )}
        </div>
      </div>
    )
  }

  if (status === 'called' || isFlashing) {
    return (
      <div 
        className="h-[100dvh] w-screen fixed inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer overflow-hidden animate-flash-green" 
        onClick={stopAlert}
      >
        <div className="animate-ping-slow text-9xl mb-8">🔔</div>
        <h1 className="text-6xl font-black text-white mb-4 tracking-tighter italic">READY!</h1>
        <p className="text-white text-7xl font-black mb-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">#{receiptNumber}</p>
        <div className="bg-white text-black px-8 py-4 rounded-full font-black text-xl animate-bounce uppercase tracking-widest">
           TAP TO STOP
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-screen fixed inset-0 flex flex-col bg-[#020203] overflow-hidden" style={{ backgroundImage: `radial-gradient(circle at top, ${themeColor}1a, #020203)` }}>
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: `${themeColor}26` }} />

      <header className="p-4 sm:p-8 text-center relative z-10 shrink-0">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 flex items-center justify-center rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl backdrop-blur-xl">
             <img src="/icon.png" alt="Beepme" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
          </div>
          <h2 className="font-black text-white text-2xl tracking-tight uppercase">{merchantName}</h2>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 min-h-0">
        {status === 'confirm' && (
          <div className="w-full max-w-sm text-center animate-slide-up">
            <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl mb-8">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">#{receiptNumber}</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Connect Your Pager</p>
              
              <div className="space-y-4 text-left mb-8">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <Smartphone size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-indigo-200 leading-snug">This phone will vibrate and sound when your order is ready.</p>
                </div>
              </div>

              <button 
                onClick={handleConfirm} 
                className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                style={{ backgroundColor: themeColor, boxShadow: `0 20px 40px ${themeColor}33` }}
              >
                ACTIVATE PAGER
              </button>
            </div>
          </div>
        )}

        {status === 'waiting' && (
          <div className="w-full max-w-sm text-center animate-fade-in flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center min-h-0">
            {merchantLogo && (
              <div className="relative w-28 h-28 sm:w-40 sm:h-40 mx-auto mb-4 sm:mb-10 flex items-center justify-center rounded-[32px] sm:rounded-[40px] overflow-hidden border border-white/10 shadow-2xl bg-white/[0.02] shrink-0">
                <div className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: `${themeColor}1a` }} />
                <img src={merchantLogo} alt={merchantName} className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[32px] object-cover relative z-10 animate-pulse shadow-2xl border border-white/5" />
              </div>
            )}

            <div className="mb-4 sm:mb-10 shrink-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white mb-1 uppercase tracking-tighter italic">PREPARING...</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Order #{receiptNumber}</p>
            </div>

            <div className="bg-white/[0.03] border border-white/10 px-6 py-4 sm:px-10 sm:py-6 rounded-3xl sm:rounded-[32px] inline-block mb-4 sm:mb-12 shadow-inner shrink-0">
               <p className="text-slate-500 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1">Waiting Time</p>
               <p className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[#10b981]">{formatWaitTime()}</p>
            </div>

            </div>

            {/* Verification Tools */}
            <div className="mt-auto w-full shrink-0 pt-4">
              <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 space-y-3 sm:space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Online</span>
                </div>
                <button 
                   onClick={() => initAudio()}
                   className="flex items-center gap-2 px-4 py-2 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95"
                   style={{ backgroundColor: themeColor }}
                >
                  <Volume2 size={14} />
                  Test Sound
                </button>
              </div>

              {showInstructions && (
                <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/5 border border-amber-500/20 text-left">
                   <div className="flex items-center gap-2 text-amber-500 mb-1 sm:mb-2">
                      <AlertTriangle size={14} />
                      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Important for Sound</span>
                   </div>
                   <ul className="text-[9px] sm:text-[10px] text-amber-200/60 space-y-1 sm:space-y-1.5 font-medium leading-relaxed">
                      <li>• Turn OFF Silent Mode (Mute Switch)</li>
                      <li>• Increase Volume to Maximum</li>
                      <li>• Keep this page open in browser</li>
                   </ul>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </main>

      <footer className="p-4 sm:p-8 text-center relative z-10 shrink-0">
        <p className="text-[9px] text-slate-700 font-black uppercase tracking-[0.4em]">
          Beepme.pro — Virtual Paging System
        </p>
      </footer>

      <style jsx global>{`
        @keyframes flash-green {
          0%, 100% { background-color: #000000; }
          50% { background-color: #10b981; }
        }
        .animate-flash-green {
          animation: flash-green 0.5s step-end infinite;
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-ping-slow {
          animation: ping-slow 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
