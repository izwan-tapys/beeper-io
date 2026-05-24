'use client'

export const dynamic = 'force-dynamic'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'
import { Loader2, Volume2, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { useLanguage } from '@/contexts/LanguageContext'
import { RetroPagerZone } from '@/components/pager/RetroPagerZone'

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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [merchantCategory, setMerchantCategory] = useState<string>('')
  const [merchantState, setMerchantState] = useState<string>('')

  const [clientUuid, setClientUuid] = useState<string | null>(null)
  const [adsList, setAdsList] = useState<any[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const ad = adsList[currentAdIndex] || null
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  useEffect(() => {
    setIsDescExpanded(false)
  }, [currentAdIndex])

  const { lang, setLang } = useLanguage()
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
  const lastUpdatedRef = useRef<string | null>(null)
  const isInitialFetchRef = useRef<boolean>(true)
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

  const fetchAd = useCallback(async (mId: string, isPremium: boolean, upsellData: any, location: {lat: number, lng: number} | null, mState: string, mCategory: string) => {
    try {
      if (isPremium) {
        if (upsellData.upsell_video_url || upsellData.upsell_image_url) {
          setAdsList([{
            id: 'merchant-upsell',
            title: upsellData.upsell_title || 'Promosi Kedai',
            media_url: upsellData.upsell_video_url,
            fallback_image_url: upsellData.upsell_image_url,
            link_url: upsellData.upsell_link_url || '#',
            description: upsellData.upsell_description || '',
            cta_text: upsellData.upsell_cta_text ?? 'Ketahui Lebih Lanjut'
          }])
        } else {
          setAdsList([{
            id: 'default-beepme',
            title: 'Beepme.pro - Pager F&B',
            media_url: null,
            fallback_image_url: null,
            link_url: 'https://beepme.pro',
            description: 'Gantikan pager perkakasan lama dengan telefon pintar pelanggan anda secara PERCUMA!'
          }])
        }
        return
      }

      const fallbackToAllAds = async () => {
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

        const shuffledAds = adsData.map(adItem => ({
          id: adItem.id,
          title: adItem.title,
          media_url: adItem.video_url,
          fallback_image_url: adItem.image_url,
          link_url: adItem.link_url,
          description: adItem.description || ''
        })).sort(() => 0.5 - Math.random())

        setAdsList(shuffledAds)
      }

      // Try targeted ads RPC (location-aware + state & category matched)
      const { data: adsData, error } = await supabase.rpc('get_targeted_ads', {
        p_lat: location?.lat ?? null,
        p_lng: location?.lng ?? null,
        m_state: mState || null,
        m_category: mCategory || ''
      })

      if (!error && adsData && adsData.length > 0) {
        const shuffledAds = adsData.map((adItem: any) => ({
          id: adItem.id,
          title: adItem.title,
          media_url: adItem.video_url,
          fallback_image_url: adItem.image_url,
          link_url: adItem.link_url,
          description: adItem.description || ''
        })).sort(() => 0.5 - Math.random())

        setAdsList(shuffledAds)
        return
      }

      // Fallback: fetch all active ads
      await fallbackToAllAds()
    } catch (err) {
      console.error('Error fetching ads:', err)
    }
  }, [])

  const playChime = useCallback(async () => {
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
  }, [volume])

  const triggerAlert = useCallback(() => {
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
  }, [playChime])

  const stopAlert = useCallback(() => {
    setIsFlashing(false)
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current)
      alertIntervalRef.current = null
    }
  }, [])

  const processSessionStatus = useCallback((data: any) => {
    if (data.status === 'called') {
      if (statusRef.current !== 'called' || (lastUpdatedRef.current && data.updated_at !== lastUpdatedRef.current)) {
        setStatus('called')
        triggerAlert()
      }
      lastUpdatedRef.current = data.updated_at
    } else if (data.status === 'completed' || data.status === 'archived') {
      setStatus('completed')
      stopAlert()
    } else if (data.is_confirmed) {
      setStatus('waiting')
    } else {
      setStatus('confirm')
    }
  }, [triggerAlert, stopAlert])

  const fetchSession = useCallback(async () => {
    if (isInitialFetchRef.current) {
      // Heavy fetch on initial load
      const { data, error } = await supabase
        .from('sessions')
        .select('*, merchants(name, logo_url, gmb_url, theme_color, plan_type, subscription_status, expiry_date, upsell_title, upsell_description, upsell_link_url, upsell_video_url, upsell_image_url, latitude, longitude, category, state)')
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
        setMerchantCategory(merchantData.category || '')
        setMerchantState(merchantData.state || '')

        isPremium = merchantData.plan_type === 'pro' &&
          merchantData.subscription_status === 'active' &&
          (!!merchantData.expiry_date && new Date(merchantData.expiry_date) > new Date())
      }
      
      setReceiptNumber(data.receipt_number)
      setCreatedAt(data.created_at)

      if (clientUuid && !data.client_uuid) {
        await supabase.from('sessions').update({ client_uuid: clientUuid }).eq('id', sessionId)
      }

      if (!ad && merchantData) {
        // Try to get user GPS. If denied or unavailable, fallback to merchant location.
        const tryGetLocation = (): Promise<{lat: number, lng: number} | null> => {
          return new Promise((resolve) => {
            if (!navigator.geolocation) { resolve(null); return }
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => resolve(null), // User denied - fallback to merchant
              { timeout: 5000, maximumAge: 60000 }
            )
          })
        }

        let resolvedLocation: {lat: number, lng: number} | null = await tryGetLocation()

        if (!resolvedLocation && merchantData.latitude != null && merchantData.longitude != null) {
          resolvedLocation = { lat: merchantData.latitude, lng: merchantData.longitude }
        }

        if (resolvedLocation) setUserLocation(resolvedLocation)

        fetchAd(data.merchant_id, isPremium, merchantData, resolvedLocation, merchantData.state || '', merchantData.category || '')
      }

      processSessionStatus(data)
      isInitialFetchRef.current = false
    } else {
      // Light fetch for polling
      const { data, error } = await supabase
        .from('sessions')
        .select('status, is_confirmed, updated_at')
        .eq('id', sessionId)
        .single()
        
      if (error || !data) return
      processSessionStatus(data)
    }
  }, [sessionId, clientUuid, ad, fetchAd, processSessionStatus])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  useEffect(() => {
    // 1. Setup Wait Timer
    if (status === 'waiting' || status === 'called') {
      if (!waitTimerRef.current) {
        waitTimerRef.current = setInterval(() => setNow(Date.now()), 1000)
      }
    } else {
      if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null }
    }

    if (status === 'completed' || status === 'error') {
      return
    }

    // 2. Setup 15-second Light Polling Fallback
    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        fetchSession()
      }, 15000) // Changed from 3s to 15s
    }

    // 3. Setup Supabase Realtime for instant updates (0.1s)
    const channel = supabase
      .channel(`session-${sessionId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` }, 
        (payload: any) => {
          processSessionStatus(payload.new)
        }
      )
      .subscribe()

    // 4. Setup Visibility API for instant resume
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSession() // Immediately fetch latest state when screen wakes up
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => { 
      if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null }
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      supabase.removeChannel(channel)
    }
  }, [status, sessionId, fetchSession, processSessionStatus])

  // Track ad impressions per ad
  const seenAdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (ad && status === 'waiting') {
      // Don't track default/upsell ads for billing, but log analytics if needed.
      // For real ads, track via API route which handles DB deduplication and billing.
      if (ad.id !== 'default-beepme' && ad.id !== 'merchant-upsell') {
        if (!seenAdsRef.current.has(ad.id)) {
          seenAdsRef.current.add(ad.id)
          fetch('/api/ads/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad_id: ad.id, session_id: sessionId, event_type: 'impression' })
          }).catch((err) => console.error('Failed to track impression:', err))
        }
      } else {
        // Track free ads directly to analytics
        if (!seenAdsRef.current.has(ad.id)) {
          seenAdsRef.current.add(ad.id)
          supabase.from('ad_analytics').insert({
            ad_id: null,
            merchant_id: ad.id === 'merchant-upsell' ? merchantId : null,
            session_id: sessionId,
            event_type: 'impression'
          }).then(({ error }) => { if (error) console.error('Failed to log impression:', error) })
        }
      }
    }
  }, [ad, status, sessionId, merchantId])

  const handleAdClick = async () => {
    if (!ad) return
    if (ad.id !== 'default-beepme' && ad.id !== 'merchant-upsell') {
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: ad.id, session_id: sessionId, event_type: 'click' })
      }).catch(console.error)
    } else {
      supabase.from('ad_analytics').insert({
        ad_id: null,
        merchant_id: ad.id === 'merchant-upsell' ? merchantId : null,
        session_id: sessionId,
        event_type: 'click'
      }).then(({ error }) => { if (error) console.error('Failed to log click:', error) })
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
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-[#050505]">

      {/* Language Toggle Button */}
      <button 
        onClick={() => setLang(lang === 'bm' ? 'en' : 'bm')}
        className="fixed top-4 right-4 z-[999] bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-[10px] font-black tracking-widest uppercase transition-transform active:scale-95 flex items-center gap-2"
      >
        <span className={lang === 'bm' ? 'text-white' : 'text-white/40'}>BM</span>
        <span className="w-[1px] h-3 bg-white/20"></span>
        <span className={lang === 'en' ? 'text-white' : 'text-white/40'}>EN</span>
      </button>

        {/* Deep ambient glow */}
        <div 
          className="absolute inset-0 opacity-40 blur-[100px] mix-blend-screen"
          style={{ backgroundImage: `radial-gradient(circle at 50% 30%, ${themeColor}80, transparent 60%)` }}
        />
        
        {/* Animated Grid / Mesh for texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center"
        >
          {/* Glowing Checkmark */}
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', damping: 15 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: themeColor }} />
            <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/10 backdrop-blur-md" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #000000 150%)` }}>
              <CheckCircle2 size={56} className="text-white drop-shadow-md" />
            </div>
            {/* Tiny floating merchant logo on the checkmark */}
            {merchantLogo && (
              <motion.img 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                src={merchantLogo} 
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-[3px] border-[#050505] shadow-xl z-20 object-cover"
              />
            )}
          </motion.div>

          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-3 tracking-tighter">
            {lang === 'bm' ? 'Pesanan Selesai' : 'Order Completed'}
          </h1>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-[260px]">
            Terima kasih kerana memilih <span className="text-white font-bold">{merchantName}</span>. Selamat menjamu selera!
          </p>

          {/* Glassmorphism Action Card */}
          {gmbUrl ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 shadow-2xl"
            >
              <a 
                href={gmbUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex flex-col items-center justify-center gap-1.5 px-8 py-5 rounded-[24px] bg-white text-black font-black hover:scale-[0.98] transition-transform shadow-[0_0_40px_rgba(255,255,255,0.15)] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-1 relative z-10">
                  <span className="text-2xl animate-bounce" style={{animationDelay: '0ms'}}>⭐</span>
                  <span className="text-2xl animate-bounce" style={{animationDelay: '100ms'}}>⭐</span>
                  <span className="text-2xl animate-bounce" style={{animationDelay: '200ms'}}>⭐</span>
                  <span className="text-2xl animate-bounce" style={{animationDelay: '300ms'}}>⭐</span>
                  <span className="text-2xl animate-bounce" style={{animationDelay: '400ms'}}>⭐</span>
                </div>
                <span className="relative z-10 uppercase tracking-wide text-[13px] text-slate-800">{lang === 'bm' ? 'Nilai Kami di Google' : 'Rate Us on Google'}</span>
              </a>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center shadow-2xl"
            >
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black">{lang === 'bm' ? 'Jumpa Lagi!' : 'See You Again!'}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    )
  }

  if (status === 'called' || isFlashing) {
    return (
      <div 
        className="h-[100dvh] w-screen fixed inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer overflow-hidden bg-black select-none z-[999]" 
        onClick={stopAlert}
      >
        {/* Dynamic Background */}
        <motion.div
          animate={{ backgroundColor: ['#000000', themeColor || '#10b981', '#000000'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 opacity-40"
        />

        {/* Hypnotic Ripples */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ 
              width: '40vw', 
              height: '40vw', 
              minWidth: '300px', 
              minHeight: '300px', 
              border: `4px solid ${themeColor || '#10b981'}`,
              backgroundColor: `${themeColor || '#10b981'}10`
            }}
            animate={{ 
              scale: [0.5, 3], 
              opacity: [0.8, 0] 
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              delay: i * 0.8, 
              ease: "easeOut" 
            }}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="mb-8"
          >
            <span className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">🔔</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl font-black text-white mb-2 tracking-widest uppercase"
          >
            {lang === 'bm' ? 'Pesanan Sedia' : 'Order Ready'}
          </motion.h1>

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="mb-16"
          >
            <p 
              className="text-white font-black leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]"
              style={{ fontSize: 'clamp(5rem, 25vw, 10rem)' }}
            >
              #{receiptNumber}
            </p>
          </motion.div>

          <motion.div 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="mt-8 px-8 py-4 rounded-full border border-white/20 bg-black/40 backdrop-blur-md"
          >
            <span className="text-white font-bold text-sm tracking-widest uppercase">
              Ketik Di Mana-mana Untuk Berhenti
            </span>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] w-screen fixed inset-0 flex justify-center items-center bg-[#020203] overflow-hidden select-none" style={{ backgroundImage: `radial-gradient(circle at top, ${themeColor}1a, #020203)` }}>
      
      {/* Centered Device Wrapper for Tablet/Desktop */}
      <div className={`w-full max-w-md h-full flex flex-col relative z-10 border-x border-white/5 ${status === 'waiting' ? 'bg-black' : 'justify-between p-6 bg-[#020203]/40 backdrop-blur-3xl'} shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden`}>
        
        {/* ========================================= */}
        {/* 50-50 WAITING SCREEN                     */}
        {/* ========================================= */}
        {status === 'waiting' && (
          <div className="w-full h-full flex flex-col" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

            {/* ── TOP 50%: Ad Zone ── */}
            <div className="h-1/2 relative overflow-hidden flex-shrink-0 animate-fade-in" key={currentAdIndex}>
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
                            className="w-full h-full object-cover pointer-events-none"
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
                    <img src={ad.fallback_image_url} alt={ad.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#0c0d12] via-[#020203] to-[#1e1b4b] flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-indigo-500/5 blur-[50px] rounded-full pointer-events-none" />
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3">
                          <span className="text-white font-black text-xl">B</span>
                        </div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">Beepme.pro</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium max-w-[200px]">Gantikan Pager Perkakasan Mahal. Daftar Percuma.</p>
                      </div>
                    </div>
                  )}

                  {/* Ad overlay — title + CTA at bottom of ad zone */}
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
                  {(ad.title || ad.cta_text) && (
                    <div className="absolute bottom-3 left-3 right-3 z-20 flex items-end justify-between">
                      <div className="flex-1 mr-2">
                        {ad.title && (
                          <a href={ad.link_url} target="_blank" rel="noopener noreferrer" onClick={handleAdClick}
                            className="text-sm font-black text-white uppercase tracking-tight leading-tight line-clamp-1 drop-shadow-lg block">
                            @{ad.title}
                          </a>
                        )}
                        {ad.description && (
                          <p 
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsDescExpanded(!isDescExpanded)
                            }}
                            className={`text-xs text-slate-200 hover:text-white font-medium leading-snug drop-shadow-md mt-0.5 cursor-pointer select-none transition-all ${
                              isDescExpanded ? 'line-clamp-none max-h-24 overflow-y-auto' : 'line-clamp-2'
                            }`}
                          >
                            {ad.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {ad.cta_text && (
                          <a href={ad.link_url} target="_blank" rel="noopener noreferrer" onClick={handleAdClick}
                            className="px-2.5 py-1 bg-white/25 backdrop-blur-md rounded-md text-[9px] font-black text-white uppercase tracking-widest shadow-lg active:scale-95 transition-all whitespace-nowrap">
                            {ad.cta_text}
                          </a>
                        )}
                        {gmbUrl && (
                          <a href={gmbUrl} target="_blank" rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white flex flex-col items-center justify-center gap-0.5 shadow-lg active:scale-95 transition-transform relative">
                            <span className="text-sm leading-none">⭐</span>
                            <span className="text-[6px] font-black uppercase text-black">Rate</span>
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Sponsored label */}
                  <div className="absolute top-2 right-2 z-20">
                    <span className="text-[8px] text-white/50 font-bold uppercase tracking-widest bg-black/30 backdrop-blur-sm px-2 py-0.5 rounded-full">Sponsored</span>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#020203]">
                  <Loader2 className="animate-spin text-slate-700" />
                </div>
              )}
            </div>

            {/* ── BOTTOM 50%: Retro LCD Pager Zone ── */}
            <RetroPagerZone
              merchantName={merchantName}
              merchantLogo={merchantLogo}
              receiptNumber={receiptNumber}
              lang={lang}
              formattedWaitTime={isGhostActive() ? undefined : formatWaitTime()}
              isGhostActive={isGhostActive()}
              onTestBeep={initAudio}
              onShowWarning={() => setShowInstructions(true)}
            />

            {/* Modal Popup for Sound Warning */}
            {showInstructions && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-[280px] bg-[#111] border border-white/10 rounded-[32px] p-6 shadow-2xl animate-scale-in flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400" />
                  
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <AlertTriangle size={32} className="text-amber-500" />
                  </div>
                  
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Penting: Amaran Bunyi</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">{lang === 'bm' ? 'Sila pastikan anda mengikut arahan di bawah supaya pager ini berfungsi dengan sempurna.' : 'Please follow the instructions below so this pager works perfectly.'}</p>
                  
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
