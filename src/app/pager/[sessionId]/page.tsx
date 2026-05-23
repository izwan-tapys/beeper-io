'use client'

export const dynamic = 'force-dynamic'

import { motion, AnimatePresence, useAnimation, PanInfo } from 'framer-motion'
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
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null)
  const [merchantCategory, setMerchantCategory] = useState<string>('')
  const [merchantState, setMerchantState] = useState<string>('')

  const [isExpanded, setIsExpanded] = useState(false)
  const controls = useAnimation()
  const [clientUuid, setClientUuid] = useState<string | null>(null)
  const [adsList, setAdsList] = useState<any[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const ad = adsList[currentAdIndex] || null

  const [isAdExpanded, setIsAdExpanded] = useState(false)
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

  
  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.y < -30) {
      setIsExpanded(true)
    } else if (info.offset.y > 30) {
      setIsExpanded(false)
    }
  }
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
            Pesanan Selesai
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
                className="w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] bg-white text-black font-black text-lg hover:scale-[0.98] transition-transform shadow-[0_0_40px_rgba(255,255,255,0.15)] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-2xl relative z-10 animate-bounce">⭐</span>
                <span className="relative z-10 uppercase tracking-wide text-sm">Nilai Kami di Google</span>
              </a>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center shadow-2xl"
            >
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black">Jumpa Lagi!</p>
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
            Pesanan Sedia
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

            {/* 2. Middle Overlay (Invisible Spacer) */}
            <div className="flex-1" />

            {/* 3. Bottom Section Wrapper (Dynamic Island) */}
            <div className="relative z-50 w-full flex flex-col justify-end items-center pointer-events-none">
              
              {/* Overlays (Hidden when expanded so it doesn't clutter) */}
              <AnimatePresence>
                {!isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="w-full relative pointer-events-auto"
                  >
                    {/* Right Sidebar */}
                    <div className="absolute right-4 bottom-[10px] flex flex-col items-center gap-4">
                      {gmbUrl && (
                        <a 
                          href={gmbUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-white flex flex-col items-center justify-center gap-0.5 shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95 transition-transform relative"
                        >
                          <span className="text-lg leading-none">⭐</span>
                          <span className="text-[7px] font-black uppercase text-black">Review</span>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                        </a>
                      )}
                      <button 
                        onClick={() => setShowInstructions(true)}
                        className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex flex-col items-center justify-center gap-1 shadow-xl active:scale-95 transition-transform"
                      >
                        <AlertTriangle size={20} className="text-amber-400 drop-shadow-md" />
                        <span className="text-[8px] font-black uppercase text-amber-100">Amaran</span>
                      </button>
                    </div>

                    {/* Left Ad Details */}
                    {ad && (
                      <div className={`absolute left-2 bottom-[10px] w-[85%] max-w-[320px] text-left z-50 pt-3 px-3 ${isAdExpanded ? 'pb-3 bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl translate-y-[-10px] rounded-3xl' : 'pb-0 bg-transparent rounded-none'} transition-all duration-500 ease-in-out`}>
                        <div className="space-y-1.5 drop-shadow-lg">
                          <h4 className="text-sm font-black text-white tracking-tight uppercase leading-tight">
                            <a href={ad.link_url} target="_blank" rel="noopener noreferrer" onClick={handleAdClick}>@{ad.title}</a>
                          </h4>
                          
                          {ad.description && (
                            <div 
                              className="cursor-pointer" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsAdExpanded(!isAdExpanded);
                              }}
                            >
                              <p className={`text-[11px] text-slate-100 font-medium leading-snug transition-all duration-500 ${isAdExpanded ? 'line-clamp-none' : 'line-clamp-2'}`}>
                                {ad.description}
                              </p>
                              {!isAdExpanded && ad.description.length > 80 && (
                                <span className="text-[10px] font-bold text-white/80 hover:text-white inline-block mt-0.5">... Baca lagi</span>
                              )}
                            </div>
                          )}
                          
                          {ad.cta_text && (
                            <a
                              href={ad.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={handleAdClick}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest mt-2 shadow-lg active:scale-95 transition-all"
                            >
                              {ad.cta_text}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* The Dynamic Island / Pager Drawer */}
              <motion.div 
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                animate={{
                  height: isExpanded ? 'auto' : '64px',
                  borderRadius: isExpanded ? '32px 32px 0 0' : '9999px',
                  width: isExpanded ? '100%' : '90%',
                  marginBottom: isExpanded ? '0px' : '12px',
                  backgroundColor: isExpanded ? '#ffffff' : 'rgba(0,0,0,0.65)',
                  backdropFilter: isExpanded ? 'none' : 'blur(16px)',
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="pointer-events-auto overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10 dark:border-white/5 relative z-50"
                onClick={() => !isExpanded && setIsExpanded(true)}
              >
                {/* Ensure dark mode support for expanded state via class injection if needed, but hardcoded #fff is fine if we inject standard classes inside */}
                <div className={isExpanded ? 'dark:bg-[#0c0d12] w-full h-full' : 'w-full h-full'}>
                  <AnimatePresence mode="wait">
                    {!isExpanded ? (
                      /* COLLAPSED STATE (PILL) */
                      <motion.div 
                        key="collapsed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex items-center justify-between px-6 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {merchantLogo ? (
                            <img src={merchantLogo} alt={merchantName} className="w-8 h-8 rounded-full object-cover border border-white/20 shadow-sm" />
                          ) : (
                            <Logo size={24} showText={false} />
                          )}
                          <span className="text-white font-black tracking-tight text-sm">#{receiptNumber}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[#10b981] font-mono font-bold text-sm">{formatWaitTime()}</span>
                          <div className="w-8 h-1 bg-white/30 rounded-full" />
                        </div>
                      </motion.div>
                    ) : (
                      /* EXPANDED STATE (FULL CARD) */
                      <motion.div 
                        key="expanded"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full p-6 pt-5 bg-white dark:bg-[#0c0d12]"
                      >
                        {/* Pull indicator / handle */}
                        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-5 cursor-pointer" onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }} />

                        {/* Baris 1: Logo, Nama Kedai & Status */}
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800/50">
                          <div className="flex items-center gap-2.5">
                            {merchantLogo ? (
                              <img src={merchantLogo} alt={merchantName} className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm" />
                            ) : (
                              <Logo size={28} showText={false} />
                            )}
                            <h2 className="font-black text-slate-800 dark:text-white text-base tracking-tight uppercase">{merchantName}</h2>
                          </div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10b981]/10 rounded-full border border-[#10b981]/20">
                            <div className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[9px] font-black uppercase tracking-widest text-[#10b981]">Disediakan</span>
                          </div>
                        </div>

                        {/* Baris 2: Nombor Pesanan & Masa */}
                        <div className="flex items-end justify-between mb-6">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">No. Pesanan</p>
                            <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                              #{receiptNumber}
                            </p>
                          </div>
                          <div className="text-right">
                            {isGhostActive() ? (
                              <>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-sm font-bold text-slate-500 italic animate-pulse leading-tight">Sibuk</p>
                              </>
                            ) : (
                              <>
                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Masa Menunggu</p>
                                <p className="text-3xl font-black font-mono tracking-tight text-[#10b981] leading-none">{formatWaitTime()}</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Baris 3: Butang Uji Bunyi */}
                        <button 
                          onClick={(e) => { e.stopPropagation(); initAudio(); }}
                          className="w-full flex flex-col items-center justify-center gap-1 py-3.5 rounded-2xl transition-all active:scale-95 border border-slate-200 dark:border-white/5 relative overflow-hidden group"
                          style={{ backgroundColor: themeColor, boxShadow: `0 8px 24px ${themeColor}40` }}
                        >
                          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                          <div className="relative z-10 flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
                            <Volume2 size={16} />
                            Uji Bunyi Pager
                          </div>
                          <span className="relative z-10 text-[9px] text-white/80 font-medium">Pastikan 'Silent Mode' dimatikan</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
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
