'use client'

export const dynamic = 'force-dynamic'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { use } from 'react'
import { Loader2, Volume2, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { PremiumPagerZone, type ActiveSession } from '@/components/pager/PremiumPagerZone'
import { QrScannerModal } from '@/components/pager/QrScannerModal'

type PagerStatus = 'loading' | 'confirm' | 'waiting' | 'called' | 'completed' | 'error'

// A single session record as returned by Supabase
interface SessionRecord {
  id: string
  status: string
  is_confirmed: boolean
  updated_at: string
  created_at: string
  receipt_number: string
  merchant_id: string
  client_uuid: string | null
  merchants: {
    name: string
    logo_url: string | null
    gmb_url: string | null
    theme_color: string | null
    plan_type: string | null
    subscription_status: string | null
    expiry_date: string | null
    upsell_title: string | null
    upsell_description: string | null
    upsell_link_url: string | null
    upsell_video_url: string | null
    upsell_image_url: string | null
    upsell_cta_text: string | null
    latitude: number | null
    longitude: number | null
    category: string | null
    state: string | null
  } | null
}

const supabase = createClient()

export default function PagerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)

  // ── Primary session state (the one scanned first) ──────────────────────────
  const [status, setStatus] = useState<PagerStatus>('loading')
  const [primaryStatus, setPrimaryStatus] = useState<'loading' | 'confirm' | 'waiting' | 'called' | 'completed' | 'archived' | 'error'>('loading')
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [merchantName, setMerchantName] = useState('')
  const [merchantLogo, setMerchantLogo] = useState<string | null>(null)
  const [merchantId, setMerchantId] = useState<string | null>(null)
  const [gmbUrl, setGmbUrl] = useState<string | null>(null)
  const [receiptNumber, setReceiptNumber] = useState('')
  const [createdAt, setCreatedAt] = useState<string | null>(null)
  const [themeColor, setThemeColor] = useState('#6366f1')

  // ── Multi-session state ────────────────────────────────────────────────────
  // Map of sessionId → SessionRecord for all active sessions on this device
  const [allSessions, setAllSessions] = useState<Map<string, SessionRecord>>(new Map())
  // Set of sessionId that have already been dismissed (alarm silenced)
  const [dismissedSessions, setDismissedSessions] = useState<Set<string>>(new Set())
  // Currently ringing session id (if any)
  const [calledSessionId, setCalledSessionId] = useState<string | null>(null)

  // ── UI state ───────────────────────────────────────────────────────────────
  const [now, setNow] = useState(Date.now())
  const [volume, setVolume] = useState(1.0)
  const [isFlashing, setIsFlashing] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  // ── Ad state ───────────────────────────────────────────────────────────────
  const [clientUuid, setClientUuid] = useState<string | null>(null)
  const [adsList, setAdsList] = useState<any[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState(0)
  const ad = adsList[currentAdIndex] || null
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  // ── QR Scanner & Toast state ────────────────────────────────────────────────
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)

  const lang: 'bm' | 'en' = 'en' as 'bm' | 'en'
  const [touchStartY, setTouchStartY] = useState<number | null>(null)

  // ── Refs ───────────────────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdatedRef = useRef<string | null>(null)
  const lastUpdatedMapRef = useRef<Map<string, string>>(new Map())
  const isInitialFetchRef = useRef<boolean>(true)
  const seenAdsRef = useRef<Set<string>>(new Set())

  useEffect(() => { setIsDescExpanded(false) }, [currentAdIndex])

  // ── Get/create client_uuid ─────────────────────────────────────────────────
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

  // ── Ad rotation timer ──────────────────────────────────────────────────────
  const resetSlideTimer = useCallback(() => {
    if (slideTimerRef.current) clearInterval(slideTimerRef.current)
    if (adsList.length > 1) {
      slideTimerRef.current = setInterval(() => {
        setCurrentAdIndex((prev) => (prev + 1) % adsList.length)
      }, 15000)
    }
  }, [adsList.length])

  useEffect(() => {
    if (status === 'waiting' && adsList.length > 1) resetSlideTimer()
    return () => { if (slideTimerRef.current) clearInterval(slideTimerRef.current) }
  }, [status, adsList.length, resetSlideTimer])

  // ── Touch swipe for ads ────────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartY(e.touches[0].clientY)
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY === null || adsList.length <= 1) return
    const delta = touchStartY - e.changedTouches[0].clientY
    if (delta > 50) { setCurrentAdIndex((p) => (p + 1) % adsList.length); resetSlideTimer() }
    else if (delta < -50) { setCurrentAdIndex((p) => (p - 1 + adsList.length) % adsList.length); resetSlideTimer() }
    setTouchStartY(null)
  }

  // ── Audio ──────────────────────────────────────────────────────────────────
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

  const triggerAlert = useCallback((triggeredSessionId: string) => {
    if (alertIntervalRef.current) return
    setIsFlashing(true)
    setCalledSessionId(triggeredSessionId)
    const runAlert = () => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator)
        navigator.vibrate([800, 200, 800, 200, 800])
      playChime()
    }
    runAlert()
    alertIntervalRef.current = setInterval(runAlert, 2500)
  }, [playChime])

  const stopAlert = useCallback(() => {
    setIsFlashing(false)
    setCalledSessionId(null)
    if (alertIntervalRef.current) { clearInterval(alertIntervalRef.current); alertIntervalRef.current = null }
  }, [])

  // ── Process state of the primary session ───────────────────────────────────
  const processSessionStatus = useCallback((data: any) => {
    setIsConfirmed(!!data.is_confirmed)
    setPrimaryStatus(data.status)
    if (data.updated_at) {
      lastUpdatedRef.current = data.updated_at
    }
  }, [])

  // ── Build the allSessions map entry ────────────────────────────────────────
  const processAllSessions = useCallback((sessions: SessionRecord[]) => {
    const newMap = new Map<string, SessionRecord>()
    for (const s of sessions) newMap.set(s.id, s)
    setAllSessions(newMap)
  }, [])

  // Helper to compile a merged list of all sessions (primary + allSessions device sessions)
  const getSessionsList = useCallback((): SessionRecord[] => {
    const list = Array.from(allSessions.values())
    if (!allSessions.has(sessionId) && primaryStatus !== 'loading' && primaryStatus !== 'error') {
      list.push({
        id: sessionId,
        status: (primaryStatus === 'completed' || primaryStatus === 'archived') ? 'completed' : primaryStatus === 'called' ? 'called' : primaryStatus === 'waiting' ? 'waiting' : 'confirm',
        is_confirmed: isConfirmed,
        receipt_number: receiptNumber,
        created_at: createdAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        merchant_id: merchantId || '',
        client_uuid: clientUuid,
        merchants: {
          name: merchantName,
          logo_url: merchantLogo,
          gmb_url: gmbUrl,
          theme_color: themeColor,
          plan_type: 'free',
          subscription_status: null,
          expiry_date: null,
          upsell_title: null,
          upsell_description: null,
          upsell_link_url: null,
          upsell_video_url: null,
          upsell_image_url: null,
          upsell_cta_text: null,
          latitude: null,
          longitude: null,
          category: null,
          state: null
        }
      })
    }
    return list
  }, [allSessions, sessionId, primaryStatus, isConfirmed, receiptNumber, createdAt, merchantId, clientUuid, merchantName, merchantLogo, gmbUrl, themeColor])

  // ── Reactive effect to compute screen status and handle alarms ─────────────
  useEffect(() => {
    if (primaryStatus === 'loading') {
      setStatus('loading')
      return
    }
    if (primaryStatus === 'error') {
      setStatus('error')
      return
    }

    const list = getSessionsList()

    // Detect re-calls (if updated_at changed while in 'called' state, un-dismiss it)
    let dismissedChanged = false
    const nextDismissed = new Set(dismissedSessions)
    list.forEach((s) => {
      const lastSeen = lastUpdatedMapRef.current.get(s.id)
      if (s.status === 'called' && lastSeen && s.updated_at !== lastSeen) {
        if (nextDismissed.has(s.id)) {
          nextDismissed.delete(s.id)
          dismissedChanged = true
        }
      }
      lastUpdatedMapRef.current.set(s.id, s.updated_at)
    })

    if (dismissedChanged) {
      setDismissedSessions(nextDismissed)
      return
    }

    // Find active sessions
    const activeSessions = list.filter((s) => !['completed', 'archived'].includes(s.status))

    if (activeSessions.length > 0) {
      // Find if any active session is called and not dismissed
      const callingSession = activeSessions.find((s) => s.status === 'called' && !dismissedSessions.has(s.id))

      if (callingSession) {
        setStatus('called')
        if (calledSessionId !== callingSession.id) {
          if (alertIntervalRef.current) {
            clearInterval(alertIntervalRef.current)
            alertIntervalRef.current = null
          }
          triggerAlert(callingSession.id)
        }
      } else {
        stopAlert()
        const primarySessionObj = list.find(s => s.id === sessionId)
        const isPrimaryConfirmed = primarySessionObj?.is_confirmed ?? isConfirmed
        const primarySessionIsActive = primarySessionObj ? !['completed', 'archived'].includes(primarySessionObj.status) : false

        if (!isPrimaryConfirmed && primarySessionIsActive) {
          setStatus('confirm')
        } else {
          setStatus('waiting')
        }
      }
    } else {
      setStatus('completed')
      stopAlert()
    }
  }, [
    primaryStatus,
    isConfirmed,
    getSessionsList,
    sessionId,
    calledSessionId,
    dismissedSessions,
    triggerAlert,
    stopAlert
  ])

  // ── Build ads list from all active sessions (Pro priority) ─────────────────
  const compileAds = useCallback(async (sessions: SessionRecord[], location: { lat: number; lng: number } | null) => {
    const compiled: any[] = []

    for (const session of sessions) {
      const merchant = session.merchants
      if (!merchant) continue

      const isPro = merchant.plan_type === 'pro' &&
        merchant.subscription_status === 'active' &&
        (!!merchant.expiry_date && new Date(merchant.expiry_date) > new Date())

      if (isPro && (merchant.upsell_video_url || merchant.upsell_image_url)) {
        // Add Pro upsell ads — added TWICE for priority weighting
        const proAd = {
          id: `merchant-upsell-${session.merchant_id}`,
          title: merchant.upsell_title || 'Promosi Kedai',
          media_url: merchant.upsell_video_url,
          fallback_image_url: merchant.upsell_image_url,
          link_url: merchant.upsell_link_url || '#',
          description: merchant.upsell_description || '',
          cta_text: merchant.upsell_cta_text ?? 'Ketahui Lebih Lanjut',
        }
        compiled.push(proAd, proAd) // duplicated for 2x weighting
      }
    }

    // If no Pro ads, or to fill the rest, fetch targeted ads
    if (compiled.length === 0) {
      // Use the first session's location/state/category as context
      const firstSession = sessions[0]
      const merchant = firstSession?.merchants
      const mState = merchant?.state || null
      const mCategory = merchant?.category || ''

      const { data: adsData } = await supabase.rpc('get_targeted_ads', {
        p_lat: location?.lat ?? null,
        p_lng: location?.lng ?? null,
        m_state: mState,
        m_category: mCategory,
      })

      if (adsData && adsData.length > 0) {
        const mapped = adsData.map((a: any) => ({
          id: a.id,
          title: a.title,
          media_url: a.video_url,
          fallback_image_url: a.image_url,
          link_url: a.link_url,
          description: a.description || '',
          cta_text: a.cta_text,
        }))
        compiled.push(...mapped)
      } else {
        // Fallback to Beepme self-promo
        compiled.push({
          id: 'default-beepme',
          title: 'Beepme.pro - Pager F&B',
          media_url: null,
          fallback_image_url: null,
          link_url: 'https://beepme.pro',
          description: 'Gantikan pager perkakasan lama dengan telefon pintar pelanggan anda secara PERCUMA!',
        })
      }
    }

    // Shuffle and deduplicate by id (but keep pro ads appearing twice naturally)
    const shuffled = compiled.sort(() => 0.5 - Math.random())
    setAdsList(shuffled)
  }, [])

  // ── Fetch all sessions for this device (by client_uuid) ───────────────────
  const fetchAllDeviceSessions = useCallback(async (uuid: string, location: { lat: number; lng: number } | null) => {
    // Fetch sessions created within the last 24 hours to avoid PostgREST nested OR/AND syntax limitations
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const tenMinAgo = Date.now() - 10 * 60 * 1000

    const { data, error } = await supabase
      .from('sessions')
      .select('*, merchants(name, logo_url, gmb_url, theme_color, plan_type, subscription_status, expiry_date, upsell_title, upsell_description, upsell_link_url, upsell_video_url, upsell_image_url, upsell_cta_text, latitude, longitude, category, state)')
      .eq('client_uuid', uuid)
      .gte('created_at', twentyFourHoursAgo)

    if (error || !data) {
      console.error('Error fetching device sessions:', error)
      return
    }

    // Filter in-memory: active sessions OR recently completed (within last 10 min)
    // To prevent abandoned sessions from sticking on next visits, we ignore any session created > 2 hours ago.
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000
    const filteredSessions = data.filter((s) => {
      const createdAtTime = new Date(s.created_at).getTime()
      if (createdAtTime < twoHoursAgo) return false

      if (['waiting', 'called', 'confirm'].includes(s.status)) return true
      if (['completed', 'archived'].includes(s.status)) {
        const updatedAtTime = new Date(s.updated_at).getTime()
        return updatedAtTime >= tenMinAgo
      }
      return false
    })

    processAllSessions(filteredSessions)
    // Only compile ads for active (non-completed) sessions
    const nonCompletedSessions = filteredSessions.filter((s) => !['completed', 'archived'].includes(s.status))
    if (nonCompletedSessions.length > 0) await compileAds(nonCompletedSessions, location)
  }, [processAllSessions, compileAds])

  // ── Fetch the primary session (initial load) ───────────────────────────────
  const fetchSession = useCallback(async () => {
    if (isInitialFetchRef.current) {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, merchants(name, logo_url, gmb_url, theme_color, plan_type, subscription_status, expiry_date, upsell_title, upsell_description, upsell_link_url, upsell_video_url, upsell_image_url, upsell_cta_text, latitude, longitude, category, state)')
        .eq('id', sessionId)
        .single()

      if (error || !data) {
        if (primaryStatus === 'loading') setPrimaryStatus('error')
        return
      }

      const rawMerchant = data.merchants
      const merchantData = Array.isArray(rawMerchant) ? rawMerchant[0] : rawMerchant

      if (merchantData) {
        setMerchantId(data.merchant_id)
        setMerchantName(merchantData.name || 'Store')
        setMerchantLogo(merchantData.logo_url)
        setGmbUrl(merchantData.gmb_url)
        setThemeColor(merchantData.theme_color || '#6366f1')
      }

      setReceiptNumber(data.receipt_number)
      setCreatedAt(data.created_at)

      if (clientUuid && !data.client_uuid) {
        await supabase.from('sessions').update({ client_uuid: clientUuid }).eq('id', sessionId)
      }

      // Resolve location
      const tryGetLocation = (): Promise<{ lat: number; lng: number } | null> =>
        new Promise((resolve) => {
          if (!navigator.geolocation) { resolve(null); return }
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000, maximumAge: 60000 }
          )
        })

      let resolvedLocation: { lat: number; lng: number } | null = await tryGetLocation()
      if (!resolvedLocation && merchantData?.latitude != null && merchantData?.longitude != null) {
        resolvedLocation = { lat: merchantData.latitude, lng: merchantData.longitude }
      }
      if (resolvedLocation) setUserLocation(resolvedLocation)

      processSessionStatus({ ...data, id: sessionId })
      isInitialFetchRef.current = false

      // After primary session confirmed, load all device sessions
      if (clientUuid) await fetchAllDeviceSessions(clientUuid, resolvedLocation)
    } else {
      const { data, error } = await supabase
        .from('sessions')
        .select('status, is_confirmed, updated_at')
        .eq('id', sessionId)
        .single()
      if (error || !data) return
      processSessionStatus({ ...data, id: sessionId })
    }
  }, [sessionId, clientUuid, processSessionStatus, fetchAllDeviceSessions])

  useEffect(() => { fetchSession() }, [fetchSession])

  // ── Wait timer + polling + realtime subscription ───────────────────────────
  useEffect(() => {
    if (status === 'waiting' || status === 'called') {
      if (!waitTimerRef.current) waitTimerRef.current = setInterval(() => setNow(Date.now()), 1000)
    } else {
      if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null }
    }

    if (status === 'completed' || status === 'error') return

    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        fetchSession()
        if (clientUuid) fetchAllDeviceSessions(clientUuid, userLocation)
      }, 15000)
    }

    // Realtime: primary session channel
    const primaryChannel = supabase
      .channel(`session-${sessionId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload: any) => processSessionStatus({ ...payload.new, id: sessionId })
      )
      .subscribe()

    // Realtime: all sessions for this device (by client_uuid)
    let deviceChannel: ReturnType<typeof supabase.channel> | null = null
    if (clientUuid) {
      deviceChannel = supabase
        .channel(`device-sessions-${clientUuid}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `client_uuid=eq.${clientUuid}` },
          async () => {
            if (clientUuid) await fetchAllDeviceSessions(clientUuid, userLocation)
          }
        )
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSession()
        if (clientUuid) fetchAllDeviceSessions(clientUuid, userLocation)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (waitTimerRef.current) { clearInterval(waitTimerRef.current); waitTimerRef.current = null }
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      supabase.removeChannel(primaryChannel)
      if (deviceChannel) supabase.removeChannel(deviceChannel)
    }
  }, [status, sessionId, clientUuid, fetchSession, processSessionStatus, fetchAllDeviceSessions, userLocation])

  // ── Ad impression tracking ─────────────────────────────────────────────────
  useEffect(() => {
    if (ad && status === 'waiting') {
      if (ad.id !== 'default-beepme' && !ad.id.startsWith('merchant-upsell')) {
        if (!seenAdsRef.current.has(ad.id)) {
          seenAdsRef.current.add(ad.id)
          fetch('/api/ads/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad_id: ad.id, session_id: sessionId, event_type: 'impression' }),
          }).catch((err) => console.error('Failed to track impression:', err))
        }
      } else {
        if (!seenAdsRef.current.has(ad.id)) {
          seenAdsRef.current.add(ad.id)
          supabase.from('ad_analytics').insert({
            ad_id: null,
            merchant_id: ad.id.startsWith('merchant-upsell') ? merchantId : null,
            session_id: sessionId,
            event_type: 'impression',
          }).then(({ error }) => { if (error) console.error('Failed to log impression:', error) })
        }
      }
    }
  }, [ad, status, sessionId, merchantId])

  const handleAdClick = async () => {
    if (!ad) return
    if (ad.id !== 'default-beepme' && !ad.id.startsWith('merchant-upsell')) {
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: ad.id, session_id: sessionId, event_type: 'click' }),
      }).catch(console.error)
    } else {
      supabase.from('ad_analytics').insert({
        ad_id: null,
        merchant_id: ad.id.startsWith('merchant-upsell') ? merchantId : null,
        session_id: sessionId,
        event_type: 'click',
      }).then(({ error }) => { if (error) console.error('Failed to log click:', error) })
    }
  }

  // ── Wake Lock ──────────────────────────────────────────────────────────────
  const acquireWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) wakeLockRef.current = await navigator.wakeLock.request('screen')
    } catch { /* silently fail */ }
  }
  const releaseWakeLock = () => { wakeLockRef.current?.release(); wakeLockRef.current = null }

  useEffect(() => {
    acquireWakeLock()
    const handleVC = () => { if (document.visibilityState === 'visible') acquireWakeLock() }
    document.addEventListener('visibilitychange', handleVC)
    return () => { document.removeEventListener('visibilitychange', handleVC); releaseWakeLock() }
  }, [])

  // ── Audio init ─────────────────────────────────────────────────────────────
  const initAudio = async () => {
    try {
      if (audioCtxRef.current) { await audioCtxRef.current.resume(); setIsAudioReady(true); playChime(); return }
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
    } catch (e) { console.error('Audio init error:', e) }
  }

  // ── Confirm / Activate Pager ───────────────────────────────────────────────
  const handleConfirm = async () => {
    await initAudio()
    const { error } = await supabase.from('sessions').update({
      is_confirmed: true,
      client_uuid: clientUuid,
    }).eq('id', sessionId)
    if (error) { alert('Gagal sambung: ' + error.message) }
    else {
      setStatus('waiting')
      fetchSession()
    }
  }

  // ── QR scan handler ────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  const handleQrScan = async (newSessionId: string) => {
    setShowQrScanner(false)
    if (!clientUuid) return

    // Check if already tracked
    if (allSessions.has(newSessionId)) {
      showToast('⚠️ Gerai ni dah ada dalam senarai')
      return
    }

    // Link to this device
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ client_uuid: clientUuid, is_confirmed: true })
      .eq('id', newSessionId)
      .in('status', ['waiting', 'confirm'])

    if (updateError) {
      showToast('❌ QR tidak sah atau pesanan tamat')
      return
    }

    // Fetch new session data
    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*, merchants(name, logo_url, gmb_url, theme_color, plan_type, subscription_status, expiry_date, upsell_title, upsell_description, upsell_link_url, upsell_video_url, upsell_image_url, upsell_cta_text, latitude, longitude, category, state)')
      .eq('id', newSessionId)
      .single()

    if (fetchError || !data) {
      showToast('❌ QR tidak sah atau pesanan tamat')
      return
    }

    // Add to allSessions map
    setAllSessions((prev) => {
      const next = new Map(prev)
      next.set(newSessionId, data)
      return next
    })

    const m = Array.isArray(data.merchants) ? data.merchants[0] : data.merchants
    const vendorName = m?.name || 'Gerai'
    showToast(`✅ ${vendorName} ditambah!`)

    // Re-compile ads with all updated sessions
    if (clientUuid) await fetchAllDeviceSessions(clientUuid, userLocation)
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const formatWaitTime = (startAt?: string | null) => {
    const start = new Date(startAt ?? createdAt ?? Date.now()).getTime()
    const seconds = Math.max(0, Math.floor((now - start) / 1000))
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const isGhostActive = (startAt?: string | null) => {
    const start = new Date(startAt ?? createdAt ?? Date.now()).getTime()
    return Math.floor((now - start) / 1000) > 1800
  }

  // ── Build ActiveSession list for multi-LCD ────────────────────────────────
  const buildActiveSessions = (): ActiveSession[] => {
    const list: ActiveSession[] = []
    const rawSessions = getSessionsList()

    // Sort: 1. 'called' (priority 1), 2. active/waiting (priority 2), 3. completed/archived (priority 3)
    // Within groups, sort by created_at newest first
    const sortedRaw = [...rawSessions].sort((a, b) => {
      const getPriority = (statusStr: string) => {
        if (statusStr === 'called') return 1
        if (['completed', 'archived'].includes(statusStr)) return 3
        return 2
      }
      const pA = getPriority(a.status)
      const pB = getPriority(b.status)
      if (pA !== pB) return pA - pB
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    sortedRaw.forEach((session) => {
      const m = Array.isArray(session.merchants) ? session.merchants[0] : session.merchants
      list.push({
        sessionId: session.id,
        merchantName: m?.name || 'Gerai',
        merchantLogo: m?.logo_url || null,
        receiptNumber: session.receipt_number,
        status: session.status === 'called' ? 'called' : (session.status === 'completed' || session.status === 'archived') ? 'completed' : 'waiting',
        formattedWaitTime: formatWaitTime(session.created_at),
        isGhostActive: isGhostActive(session.created_at),
        gmbUrl: m?.gmb_url || null,
      })
    })
    return list
  }

  // ── Called screen: identify which stall called ────────────────────────────
  const getCalledSession = () => {
    if (!calledSessionId) return null
    const s = allSessions.get(calledSessionId)
    if (!s) return { receiptNumber, merchantName, themeColor }
    const m = Array.isArray(s.merchants) ? s.merchants[0] : s.merchants
    return {
      receiptNumber: s.receipt_number,
      merchantName: m?.name || merchantName,
      themeColor: m?.theme_color || themeColor,
    }
  }

  // ── Dismiss alarm: mark all currently-called sessions as dismissed ─────────
  const handleDismissAlarm = () => {
    setDismissedSessions((prev) => {
      const next = new Set(prev)
      allSessions.forEach((session, id) => {
        if (session.status === 'called') next.add(id)
      })
      // Only dismiss primary if it is actually called or if allSessions is empty (fallback)
      if (primaryStatus === 'called' || allSessions.size === 0) {
        next.add(sessionId)
      }
      return next
    })
    stopAlert()
  }

  // ── Render: Loading ────────────────────────────────────────────────────────
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#020203]"><Loader2 className="animate-spin text-indigo-500" /></div>
  }

  if (status === 'error') {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#020203]"><h1 className="text-white font-bold text-xl uppercase tracking-widest">Session Expired / Not Found</h1></div>
  }

  // ── Render: Completed ──────────────────────────────────────────────────────
  if (status === 'completed') {
    const completedSessionsWithGmb = getSessionsList()
      .filter((s) => ['completed', 'archived'].includes(s.status))
      .map((s) => {
        const m = Array.isArray(s.merchants) ? s.merchants[0] : s.merchants
        return {
          merchantName: m?.name || 'Gerai',
          merchantLogo: m?.logo_url || null,
          gmbUrl: m?.gmb_url || null,
        }
      })
      .filter((s) => !!s.gmbUrl)

    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-[#050505]">
        <div className="absolute inset-0 opacity-40 blur-[100px] mix-blend-screen" style={{ backgroundImage: `radial-gradient(circle at 50% 30%, ${themeColor}80, transparent 60%)` }} />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: 'spring', damping: 15 }} className="relative mb-8">
            <div className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ backgroundColor: themeColor }} />
            <div className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/10 backdrop-blur-md" style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #000000 150%)` }}>
              <CheckCircle2 size={56} className="text-white drop-shadow-md" />
            </div>
            {completedSessionsWithGmb.length > 1 ? (
              <div className="absolute -bottom-2 -right-4 flex -space-x-3">
                {completedSessionsWithGmb.slice(0, 3).map((item, idx) => (
                  item.merchantLogo ? (
                    <motion.img
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + idx * 0.1 }}
                      src={item.merchantLogo}
                      className="w-10 h-10 rounded-full border-[3px] border-[#050505] shadow-xl z-20 object-cover"
                    />
                  ) : (
                    <div
                      key={idx}
                      className="w-10 h-10 rounded-full bg-indigo-600 border-[3px] border-[#050505] flex items-center justify-center font-black text-xs text-white shadow-xl z-20"
                    >
                      {item.merchantName.charAt(0).toUpperCase()}
                    </div>
                  )
                ))}
              </div>
            ) : (
              merchantLogo && (
                <motion.img initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}
                  src={merchantLogo} className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-[3px] border-[#050505] shadow-xl z-20 object-cover" />
              )
            )}
          </motion.div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-3 tracking-tighter">
            {lang === 'bm' ? 'Pesanan Selesai' : 'Order Completed'}
          </h1>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-[260px]">
            Terima kasih kerana memilih{' '}
            <span className="text-white font-bold">
              {completedSessionsWithGmb.length > 1
                ? (lang === 'bm' ? 'gerai-gerai kami' : 'our stalls')
                : merchantName}
            </span>
            . {lang === 'bm' ? 'Selamat menjamu selera!' : 'Enjoy your meal!'}
          </p>
          {completedSessionsWithGmb.length > 1 ? (
            <div className="w-full space-y-3 mt-6">
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">
                {lang === 'bm' ? 'Nilai Gerai Kami' : 'Rate Our Stalls'}
              </p>
              {completedSessionsWithGmb.map((session, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xl hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {session.merchantLogo ? (
                      <img
                        src={session.merchantLogo}
                        alt={session.merchantName}
                        className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-sm text-indigo-400 shrink-0">
                        {session.merchantName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="text-left min-w-0">
                      <p className="text-white font-bold text-sm truncate leading-tight">{session.merchantName}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span key={s} className="text-xs">⭐</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <a
                    href={session.gmbUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wide shrink-0 transition-transform active:scale-95 hover:bg-slate-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    {lang === 'bm' ? 'Nilai' : 'Rate'}
                  </a>
                </motion.div>
              ))}
            </div>
          ) : completedSessionsWithGmb.length === 1 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 shadow-2xl">
              <a href={completedSessionsWithGmb[0].gmbUrl!} target="_blank" rel="noopener noreferrer" className="w-full flex flex-col items-center justify-center gap-1.5 px-8 py-5 rounded-[24px] bg-white text-black font-black hover:scale-[0.98] transition-transform shadow-[0_0_40px_rgba(255,255,255,0.15)] group relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-1 relative z-10">
                  {[0, 100, 200, 300, 400].map((d) => <span key={d} className="text-2xl animate-bounce" style={{ animationDelay: `${d}ms` }}>⭐</span>)}
                </div>
                <span className="relative z-10 uppercase tracking-wide text-[13px] text-slate-800">
                  {lang === 'bm' 
                    ? `Nilai ${completedSessionsWithGmb[0].merchantName} di Google` 
                    : `Rate ${completedSessionsWithGmb[0].merchantName} on Google`}
                </span>
              </a>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center shadow-2xl">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black">{lang === 'bm' ? 'Jumpa Lagi!' : 'See You Again!'}</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    )
  }

  // ── Render: Called / Alarm ─────────────────────────────────────────────────
  if (status === 'called' || isFlashing) {
    const calledInfo = getCalledSession()
    const calledTheme = calledInfo?.themeColor || themeColor
    const calledReceipt = calledInfo?.receiptNumber || receiptNumber
    const calledName = calledInfo?.merchantName || merchantName

    return (
      <div
        className="h-[100dvh] w-screen fixed inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer overflow-hidden bg-black select-none z-[999]"
        onClick={handleDismissAlarm}
      >
        <motion.div
          animate={{ backgroundColor: ['#000000', calledTheme || '#10b981', '#000000'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 opacity-40"
        />
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{ width: '40vw', height: '40vw', minWidth: '300px', minHeight: '300px', border: `4px solid ${calledTheme || '#10b981'}`, backgroundColor: `${calledTheme || '#10b981'}10` }}
            animate={{ scale: [0.5, 3], opacity: [0.8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
          />
        ))}
        <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 15, stiffness: 200 }} className="mb-4">
            <span className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">🔔</span>
          </motion.div>
          {/* Show which stall is calling */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/70 text-sm font-bold tracking-widest uppercase mb-1"
          >
            {calledName}
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl md:text-5xl font-black text-white mb-2 tracking-widest uppercase">
            {lang === 'bm' ? 'Pesanan Sedia' : 'Order Ready'}
          </motion.h1>
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="mb-12">
            <p className="text-white font-black leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]" style={{ fontSize: 'clamp(5rem, 25vw, 10rem)' }}>
              #{calledReceipt}
            </p>
          </motion.div>
          <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }} className="px-8 py-4 rounded-full border border-white/20 bg-black/40 backdrop-blur-md">
            <span className="text-white font-bold text-sm tracking-widest uppercase">Ketik Di Mana-mana Untuk Berhenti</span>
          </motion.div>
        </div>
      </div>
    )
  }

  // ── Render: Confirm + Waiting ──────────────────────────────────────────────
  const activeSessions = buildActiveSessions()
  const isMultiSession = activeSessions.length > 1

  return (
    <div
      className="h-[100dvh] w-screen fixed inset-0 flex justify-center items-center bg-[#020203] overflow-hidden select-none"
      style={{ backgroundImage: `radial-gradient(circle at top, ${themeColor}1a, #020203)` }}
    >
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
                        <video src={ad.media_url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
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

                  {/* Ad overlay */}
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
                            onClick={(e) => { e.stopPropagation(); setIsDescExpanded(!isDescExpanded) }}
                            className={`text-xs text-slate-200 hover:text-white font-medium leading-snug drop-shadow-md mt-0.5 cursor-pointer select-none transition-all ${isDescExpanded ? 'line-clamp-none max-h-24 overflow-y-auto' : 'line-clamp-2'}`}
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

                  {/* Multi-session indicator badge (top-left) */}
                  {isMultiSession && (
                    <div className="absolute top-2 left-2 z-20">
                      <span className="text-[8px] text-white font-black uppercase tracking-widest bg-indigo-600/80 backdrop-blur-sm px-2 py-0.5 rounded-full">
                        {activeSessions.length} {lang === 'bm' ? 'Gerai' : 'Stalls'}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#020203]">
                  <Loader2 className="animate-spin text-slate-700" />
                </div>
              )}
            </div>

            {/* ── BOTTOM 50%: Retro LCD Pager Zone ── */}
            <PremiumPagerZone
              // Legacy single-session props (used when only 1 session)
              merchantName={merchantName}
              merchantLogo={merchantLogo}
              receiptNumber={receiptNumber}
              lang={lang}
              formattedWaitTime={isGhostActive() ? undefined : formatWaitTime()}
              isGhostActive={isGhostActive()}
              onTestBeep={initAudio}
              onShowWarning={() => setShowInstructions(true)}
              onScanQr={() => setShowQrScanner(true)}
              // Multi-session: pass all active sessions
              sessions={activeSessions.length > 0 ? activeSessions : undefined}
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
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Volume2 size={12} className="text-white" /></div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Kuatkan Volume Audio</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0"><AlertTriangle size={12} className="text-white" /></div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Matikan "Silent Mode"</span>
                    </li>
                  </ul>
                  <button
                    onClick={() => {
                      setShowInstructions(false)
                      initAudio()
                    }}
                    className="w-full py-4 rounded-xl font-black text-[#111] text-xs uppercase tracking-widest bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-transform"
                  >
                    Saya Faham
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── QR Scanner Modal ── */}
        {showQrScanner && (
          <QrScannerModal
            onScan={handleQrScan}
            onClose={() => setShowQrScanner(false)}
          />
        )}

        {/* ── Toast notification ── */}
        {toast && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl font-bold text-sm text-white whitespace-nowrap shadow-2xl"
            style={{
              background: 'rgba(15,17,35,0.92)',
              border: '1px solid rgba(99,102,241,0.35)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
            }}
          >
            {toast}
          </div>
        )}

        {/* ========================================= */}
        {/* CONFIRM SCREEN                           */}
        {/* ========================================= */}
        {status !== 'waiting' && (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: `${themeColor}26` }} />
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
              <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.4em]">Beepme.pro — Virtual Paging System</p>
            </footer>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes flash-green {
          0%, 100% { background-color: #000000; }
          50% { background-color: #10b981; }
        }
        .animate-flash-green { animation: flash-green 0.5s step-end infinite; }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-ping-slow { animation: ping-slow 1s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
        @keyframes lcd-flicker {
          0%, 97%, 100% { opacity: 1; }
          98% { opacity: 0.92; }
          99% { opacity: 1; }
        }
        .animate-lcd-flicker { animation: lcd-flicker 8s ease-in-out infinite; }
        @keyframes lcd-dot {
          0%, 60%, 100% { opacity: 0; }
          30% { opacity: 1; }
        }
        .animate-lcd-dot { animation: lcd-dot 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
