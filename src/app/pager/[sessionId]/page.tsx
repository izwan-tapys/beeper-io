'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'
import { Loader2, Volume2, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'

type PagerStatus = 'loading' | 'confirm' | 'waiting' | 'called' | 'completed' | 'error'

const supabase = createClient()

export default function PagerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)

  const [status, setStatus] = useState<PagerStatus>('loading')
  const [merchantId, setMerchantId] = useState<string | null>(null)
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

  const [clientUuid, setClientUuid] = useState<string | null>(null)
  const [adsList, setAdsList] = useState<any[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const ad = adsList[currentAdIndex] || null

    const [touchStartY, setTouchStartY] = useState<number | null>(null)

  const resetSlideTimer = useCallback(() => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current)
    if (adsList.length > 1) {
      slideTimerRef.current = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adsList.length)
      }, 15000)
    }
  }, [adsList.length])

  useEffect(() => {
    if (status === 'waiting' && adsList.length > 1) {
      resetSlideTimer()
    }
    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current)
    }
  }, [status, adsList.length, resetSlideTimer])

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null || adsList.length <= 1) return
    const touchEndY = e.changedTouches[0].clientY
    const deltaY = touchStartY - touchEndY
    
    if (deltaY > 50) {
      setCurrentAdIndex((prev) => (prev + 1) % adsList.length)
      resetSlideTimer()
    } else if (deltaY < -50) {
      setCurrentAdIndex((prev) => (prev - 1 + adsList.length) % adsList.length)
      resetSlideTimer()
    }
    setTouchStartY(null)
  }

  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const impressionLoggedRef = useRef<boolean>(false)

  // Use a ref for status to avoid closure issues in polling
  const statusRef = useRef<PagerStatus>('loading')
  useEffect(() => { statusRef.current = status }, [status])

  // Get or create client_uuid from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let uuid = localStorage.getItem('beepme_client_uuid')
      if (!uuid) {
        uuid = crypto.randomUUID()
        localStorage.setItem('beepme_client_uuid', uuid)
      }
      setClientUuid(uuid)
    }
  }, [])

  const fetchAd = useCallback(async (mId: string, isPremium: boolean, upsellData: any) => {
    try {
      if (isPremium && (upsellData.upsell_video_url || upsellData.upsell_image_url)) {
        setAdsList([{
          id: 'merchant-upsell',
          title: upsellData.upsell_title || 'Promosi Kedai',
          media_url: upsellData.upsell_video_url,
          fallback_image_url: upsellData.upsell_image_url,
          link_url: upsellData.upsell_link_url || '#'
        }])
        return
      }

      // Fetch global active ads
      const { data: adsData, error } = await supabase
        .from('ads')
        .select('*')
        .eq('is_active', true)

      if (error || !adsData || adsData.length === 0) {
        setAdsList([{
          id: 'default-beepme',
          title: 'Beepme.pro - Pager F&B',
          media_url: null,
          fallback_image_url: null,
          link_url: 'https://beepme.pro',
          description: 'Gantikan pager perkakasan lama dengan telefon pintar pelanggan anda secara PERCUMA!'
        }])
        return
      }

      // We no longer pick just one ad. We use the full array and shuffle them.
      const shuffledAds = adsData.map(adItem => ({
        id: adItem.id,
        title: adItem.title,
        media_url: adItem.video_url,
        fallback_image_url: adItem.image_url,
        link_url: adItem.link_url,
        description: adItem.description || ''
      })).sort(() => 0.5 - Math.random())

      setAdsList(shuffledAds)
    } catch (err) {
      console.error('Error fetching ads:', err)
    }
  }, [])

  const fetchSession = useCallback(async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, merchants(name, logo_url, gmb_url, theme_color, plan_type, subscription_status, expiry_date, upsell_title, upsell_link_url, upsell_video_url, upsell_image_url)')
      .eq('id', sessionId)
      .single()

    if (error || !data) { 
      if (statusRef.current === 'loading') setStatus('error')
      return 
    }
    
    const rawMerchant = data.merchants
    const merchantData = Array.isArray(rawMerchant) ? rawMerchant[0] : rawMerchant
    
    let isPremium = false
    if (merchantData) {
      setMerchantId(data.merchant_id)
      setMerchantName(merchantData.name || 'Store')
      setMerchantLogo(merchantData.logo_url)
      setGmbUrl(merchantData.gmb_url)
      setThemeColor(merchantData.theme_color || '#6366f1')

      isPremium = merchantData.plan_type === 'pro' &&
        merchantData.subscription_status === 'active' &&
        (!!merchantData.expiry_date && new Date(merchantData.expiry_date) > new Date())
    }
    
    setReceiptNumber(data.receipt_number)
    setCreatedAt(data.created_at)

    // Sync client_uuid if empty
    if (clientUuid && !data.client_uuid) {
      await supabase.from('sessions').update({ client_uuid: clientUuid }).eq('id', sessionId)
    }

    // Trigger ad fetch once merchant is loaded
    if (!ad && merchantData) {
      fetchAd(data.merchant_id, isPremium, merchantData)
    }

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
  }, [sessionId, clientUuid, ad, fetchAd])

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

  // Track ad impression
  useEffect(() => {
    if (ad && status === 'waiting' && !impressionLoggedRef.current) {
      impressionLoggedRef.current = true
      supabase.from('ad_analytics').insert({
        ad_id: ad.id === 'default-beepme' || ad.id === 'merchant-upsell' ? null : ad.id,
        merchant_id: ad.id === 'merchant-upsell' ? merchantId : null,
        session_id: sessionId,
        event_type: 'impression'
      }).then(({ error }) => {
        if (error) console.error('Failed to log impression:', error)
      })
    }
  }, [ad, status, sessionId, merchantId])

  const handleAdClick = async () => {
    if (!ad) return
    try {
      await supabase.from('ad_analytics').insert({
        ad_id: ad.id === 'default-beepme' || ad.id === 'merchant-upsell' ? null : ad.id,
        merchant_id: ad.id === 'merchant-upsell' ? merchantId : null,
        session_id: sessionId,
        event_type: 'click'
      })
    } catch (err) {
      console.error('Failed to log click:', err)
    }
  }

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
    const { error } = await supabase.from('sessions').update({ 
      is_confirmed: true,
      client_uuid: clientUuid
    }).eq('id', sessionId)
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

  const isGhostActive = () => {
    if (!createdAt) return false
    const start = new Date(createdAt).getTime()
    const seconds = Math.floor((now - start) / 1000)
    return seconds > 900 // 15 minutes
  }

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#020203]"><Loader2 className="animate-spin text-indigo-500" /></div>
  }

  if (status === 'error') {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#020203]"><h1 className="text-white font-bold text-xl uppercase tracking-widest">Session Expired / Not Found</h1></div>
  }

  if (status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#020203]" style={{ backgroundImage: `radial-gradient(circle at center, ${themeColor}1a, #020203)` }}>
        <div className="animate-bounce-in max-w-sm w-full flex flex-col items-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            {merchantLogo ? (
              <img 
                src={merchantLogo} 
                alt={merchantName} 
                className="w-24 h-24 rounded-full object-cover border border-white/10 shadow-xl" 
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
            )}
            {merchantLogo && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1.5 border-4 border-[#020203] shadow-md flex items-center justify-center">
                <CheckCircle2 size={16} className="text-white" />
              </div>
            )}
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
    <div className="h-[100dvh] w-screen fixed inset-0 flex justify-center items-center bg-[#020203] overflow-hidden select-none" style={{ backgroundImage: `radial-gradient(circle at top, ${themeColor}1a, #020203)` }}>
      
      {/* Centered Device Wrapper for Tablet/Desktop */}
      <div className={`w-full max-w-md h-full flex flex-col relative z-10 border-x border-white/5 ${status === 'waiting' ? 'bg-black' : 'justify-between p-6 bg-[#020203]/40 backdrop-blur-3xl'} shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden`}>
        
        {/* ========================================= */}
        {/* TIKTOK UX WAITING SCREEN                 */}
        {/* ========================================= */}
        {status === 'waiting' && (
          <div className="w-full h-full relative flex flex-col justify-between" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            {/* 1. Fullscreen Background Ad */}
            <div className="absolute inset-0 z-0 animate-fade-in" key={currentAdIndex}>
              {ad ? (
                <>
                  {ad.media_url ? (
                    (() => {
                      const ytMatch = ad.media_url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/);
                      const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;
                      if (ytId) {
                        return (
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
                            className="w-full h-full object-cover pointer-events-none scale-[1.15]"
                            allow="autoplay; encrypted-media"
                          />
                        )
                      }
                      
                      const tiktokMatch = ad.media_url.match(/tiktok\.com\/@.*\/video\/(\d+)/);
                      const tiktokId = tiktokMatch ? tiktokMatch[1] : null;
                      if (tiktokId) {
                        return (
                          <iframe
                            src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
                            className="w-full h-full object-cover"
                            allow="autoplay; encrypted-media"
                          />
                        )
                      }

                      return (
                        <video
                          src={ad.media_url}
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      )
                    })()
                  ) : ad.fallback_image_url ? (
                    <img
                      src={ad.fallback_image_url}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0c0d12] via-[#020203] to-[#1e1b4b] p-6 flex flex-col justify-center text-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-4">
                          <span className="text-white font-black text-xl">B</span>
                        </div>
                        <h4 className="text-xl font-black text-white leading-tight uppercase tracking-tight mb-2">Beepme.pro</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-[200px]">Gantikan Pager Perkakasan Mahal. Daftar Percuma.</p>
                      </div>
                    </div>
                  )}
                  {/* Vertical Top/Bottom Gradients for readability */}
                  <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none z-10" />
                  <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#020203]">
                  <Loader2 className="animate-spin text-slate-700" />
                </div>
              )}
            </div>

            {/* 2. Transparent Header (Single Row) */}
            <header className="relative z-50 w-full p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {merchantLogo ? (
                  <img src={merchantLogo} alt={merchantName} className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-md" />
                ) : (
                  <Logo size={24} showText={false} />
                )}
                <h2 className="font-black text-white text-sm tracking-tight uppercase drop-shadow-md">{merchantName}</h2>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white">Sedang Disediakan</span>
              </div>
            </header>

            {/* 3. Middle Overlay (Invisible Spacer) */}
            <div className="flex-1" />

            {/* 4. Bottom Section Wrapper */}
            <div className="relative z-50 w-full flex flex-col justify-end">
              
              {/* Right Sidebar (Like/Comment area) */}
              <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4">
                <button 
                  onClick={() => setShowInstructions(true)}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-1 shadow-xl active:scale-95 transition-transform"
                >
                  <AlertTriangle size={20} className="text-amber-400 drop-shadow-md" />
                  <span className="text-[8px] font-black uppercase text-amber-100">Amaran</span>
                </button>
              </div>

              {/* Bottom Left Ad Details */}
              {ad && (
                <a
                  href={ad.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleAdClick}
                  className="absolute left-4 bottom-24 max-w-[70%] text-left"
                >
                  <div className="space-y-1.5 drop-shadow-lg">
                    <h4 className="text-sm font-black text-white tracking-tight uppercase line-clamp-2 leading-tight">@{ad.title}</h4>
                    {ad.description && <p className="text-[11px] text-slate-100 font-medium leading-snug line-clamp-2">{ad.description}</p>}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest mt-1 shadow-lg active:bg-white/30 transition-colors">
                      Ketahui Lebih Lanjut
                    </div>
                  </div>
                </a>
              )}

              {/* 5. Bottom Navbar */}
              <footer className="w-full p-4 pt-0">
                <div className="flex items-stretch gap-2.5 w-full">
                  {/* Wait Time Box */}
                  <div className="flex-1 bg-black/50 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-2xl shadow-inner text-left flex flex-col justify-center">
                    {isGhostActive() ? (
                      <>
                        <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mb-0.5">Status Pesanan</p>
                        <p className="text-[10px] font-bold text-white italic animate-pulse leading-tight">Kitchen congestion</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white/60 text-[8px] font-black uppercase tracking-widest mb-0.5">Tempoh Menunggu</p>
                        <p className="text-lg font-black font-mono tracking-tight text-[#10b981] leading-none drop-shadow-md">{formatWaitTime()}</p>
                      </>
                    )}
                  </div>

                  {/* Uji Bunyi Box */}
                  <div className="flex-1 bg-black/50 backdrop-blur-xl border border-white/10 px-3 py-2.5 rounded-2xl flex flex-col justify-between items-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundColor: themeColor }} />
                    <div className="relative z-10 flex items-center gap-1.5 mb-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                       <span className="text-[7px] font-black text-white/80 uppercase tracking-widest">Sistem Aktif</span>
                    </div>
                    <button 
                       onClick={() => initAudio()}
                       className="relative z-10 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md border border-white/10"
                       style={{ backgroundColor: themeColor, boxShadow: `0 4px 12px ${themeColor}40` }}
                    >
                      <Volume2 size={12} />
                      Uji Bunyi
                    </button>
                  </div>
                </div>
              </footer>

            </div>

            {/* Modal Popup for Sound Warning */}
            {showInstructions && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-[280px] bg-[#111] border border-white/10 rounded-[32px] p-6 shadow-2xl animate-scale-in flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400" />
                  
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-amber-500" />
                  </div>
                  
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Penting: Amaran Bunyi</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">Sila pastikan anda mengikut arahan di bawah supaya pager ini berfungsi dengan sempurna.</p>
                  
                  <ul className="w-full space-y-3 mb-6 text-left">
                    <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <Volume2 size={12} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Kuatkan Volume Audio</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={12} className="text-white" />
                      </div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Matikan "Silent Mode"</span>
                    </li>
                  </ul>

                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="w-full py-4 rounded-xl font-black text-[#111] text-xs uppercase tracking-widest bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-transform"
                  >
                    Saya Faham
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================= */}
        {/* CONFIRM SCREEN                           */}
        {/* ========================================= */}
        {status !== 'waiting' && (
          <>
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: `${themeColor}26` }} />

            {/* Header */}
            <header className="p-2 text-center relative z-20 shrink-0 mb-4 pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                {merchantLogo ? (
                  <img src={merchantLogo} alt={merchantName} className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-md" />
                ) : (
                  <Logo size={36} showText={false} />
                )}
                <h2 className="font-black text-white text-base tracking-tight uppercase">{merchantName}</h2>
              </div>
            </header>

            {/* Main content */}
            <main className="flex-1 flex flex-col items-center justify-center px-2 relative z-10 min-h-0 w-full">
              {status === 'confirm' && (
                <div className="w-full max-w-sm text-center animate-slide-up">
                  <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">#{receiptNumber}</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Connect Your Pager</p>
                    
                    <div className="space-y-4 text-left mb-8">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                        <Smartphone size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-indigo-200 leading-snug">Telefon ini akan bergetar dan mengeluarkan bunyi apabila pesanan sedia.</p>
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
            </main>

            <footer className="p-2 relative z-20 shrink-0 mt-4 text-center">
              <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.4em]">
                Beepme.pro — Virtual Paging System
              </p>
            </footer>
          </>
        )}

      </div>

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
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  )
}
