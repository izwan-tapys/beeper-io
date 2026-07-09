import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { trackPagerEvent } from '@/lib/pager-analytics'
import type { SessionRecord, PagerStatus } from '@/types'

const supabase = createClient()

/**
 * Custom hook to manage all pager page state, audio alerts, and realtime subscriptions.
 * Extracted from pager/[sessionId]/page.tsx.
 */
export function usePagerSession(sessionId: string) {
  // ── States ──────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<PagerStatus>('loading')
  const [primaryStatus, setPrimaryStatus] = useState<string>('loading')
  const [isConfirmed, setIsConfirmed] = useState<boolean>(false)
  const [receiptNumber, setReceiptNumber] = useState<string>('')
  const [createdAt, setCreatedAt] = useState<string | null>(null)

  const [merchantId, setMerchantId] = useState<string>('')
  const [merchantName, setMerchantName] = useState<string>('Store')
  const [merchantLogo, setMerchantLogo] = useState<string | null>(null)
  const [gmbUrl, setGmbUrl] = useState<string | null>(null)
  const [themeColor, setThemeColor] = useState<string>('#6366f1')

  const [clientUuid, setClientUuid] = useState<string>('')
  const [isIos, setIsIos] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [now, setNow] = useState<number>(Date.now())

  // Multi-session state
  const [allSessions, setAllSessions] = useState<Map<string, SessionRecord>>(new Map())
  const [dismissedSessions, setDismissedSessions] = useState<Set<string>>(new Set())
  const [calledSessionId, setCalledSessionId] = useState<string | null>(null)

  // GMB/Quota state
  const [isGmbQuotaExceeded, setIsGmbQuotaExceeded] = useState<boolean>(false)

  // Ads state
  const [adsList, setAdsList] = useState<any[]>([])
  const [currentAdIndex, setCurrentAdIndex] = useState<number>(0)

  // Audio/Alarm state
  const [volume] = useState<number>(0.85)
  const [isFlashing, setIsFlashing] = useState<boolean>(false)
  const [isAudioReady, setIsAudioReady] = useState<boolean>(false)

  // ── Refs ────────────────────────────────────────────────────────────────────
  const audioCtxRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<any>(null)
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null)
  const alertIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const slideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdatedRef = useRef<string | null>(null)
  const lastUpdatedMapRef = useRef<Map<string, string>>(new Map())
  const isInitialFetchRef = useRef<boolean>(true)
  const seenAdsRef = useRef<Set<string>>(new Set())
  const lastCompiledMerchantIdsRef = useRef<string | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const pageLoadedAtRef = useRef<number>(Date.now())
  const hasTrackedLoadRef = useRef<boolean>(false)

  // Setup client UUID and iOS check on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let uuid = null
      try {
        uuid = localStorage.getItem('beepme_client_uuid')
      } catch (e) {
        console.warn('localStorage is blocked:', e)
      }

      if (!uuid) {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          uuid = crypto.randomUUID()
        } else {
          uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0
            const v = c === 'x' ? r : (r & 0x3) | 0x8
            return v.toString(16)
          })
        }

        try {
          localStorage.setItem('beepme_client_uuid', uuid!)
        } catch (e) {
          console.warn('Failed to save client_uuid to localStorage:', e)
        }
      }
      setClientUuid(uuid!)

      const userAgent = window.navigator.userAgent.toLowerCase()
      const ios = /iphone|ipad|ipod/.test(userAgent) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
      setIsIos(ios)
    }
  }, [])

  // Audio Play Chime
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

  // Audio Context initialization to bypass iOS/Safari autplay block
  const initAudio = useCallback(async () => {
    try {
      if (audioCtxRef.current) {
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume()
        }
        setIsAudioReady(true)
        playChime()
        return
      }
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      audioCtxRef.current = ctx

      // Play a short silent buffer to unlock audio context
      const buffer = ctx.createBuffer(1, 1, 22050)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(ctx.destination)
      source.start()

      setIsAudioReady(true)
      playChime()
    } catch (e) {
      console.error('Audio init error:', e)
    }
  }, [playChime])

  const triggerAlert = useCallback((triggeredSessionId: string) => {
    if (alertIntervalRef.current) return
    setIsFlashing(true)
    setCalledSessionId(triggeredSessionId)
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
    setCalledSessionId(null)
    if (alertIntervalRef.current) {
      clearInterval(alertIntervalRef.current)
      alertIntervalRef.current = null
    }
  }, [])

  // Process single session status
  const processSessionStatus = useCallback((data: any) => {
    setIsConfirmed(!!data.is_confirmed)
    setPrimaryStatus(data.status)
    if (data.updated_at) {
      lastUpdatedRef.current = data.updated_at
    }
  }, [])

  // Process all sessions
  const processAllSessions = useCallback((sessions: SessionRecord[]) => {
    const newMap = new Map<string, SessionRecord>()
    for (const s of sessions) newMap.set(s.id, s)
    setAllSessions(newMap)
  }, [])

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
          state: null,
        },
      })
    }
    return list
  }, [allSessions, sessionId, primaryStatus, isConfirmed, receiptNumber, createdAt, merchantId, clientUuid, merchantName, merchantLogo, gmbUrl, themeColor])

  // Reactive screen status compiler
  useEffect(() => {
    if (primaryStatus === 'loading') { setStatus('loading'); return }
    if (primaryStatus === 'error') { setStatus('error'); return }

    const list = getSessionsList()
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

    const activeSessions = list.filter((s) => !['completed', 'archived'].includes(s.status))

    if (activeSessions.length > 0) {
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
  }, [primaryStatus, isConfirmed, getSessionsList, sessionId, calledSessionId, dismissedSessions, triggerAlert, stopAlert])

  // Ad compiler
  const compileAds = useCallback(async (sessions: SessionRecord[]) => {
    const activeMerchantIdsKey = sessions.map((s) => s.merchant_id).sort().join(',')
    if (lastCompiledMerchantIdsRef.current === activeMerchantIdsKey) return
    lastCompiledMerchantIdsRef.current = activeMerchantIdsKey

    const compiled: any[] = []

    for (const session of sessions) {
      const merchant = session.merchants
      if (!merchant) continue

      const isPro = merchant.plan_type === 'pro' &&
        merchant.subscription_status === 'active' &&
        (!!merchant.expiry_date && new Date(merchant.expiry_date) > new Date())

      if (isPro && (merchant.upsell_video_url || merchant.upsell_image_url)) {
        const proAd = {
          id: `merchant-upsell-${session.merchant_id}`,
          title: merchant.upsell_title || 'Promosi Kedai',
          media_url: merchant.upsell_video_url,
          fallback_image_url: merchant.upsell_image_url,
          link_url: merchant.upsell_link_url || '#',
          description: merchant.upsell_description || '',
          cta_text: merchant.upsell_cta_text ?? 'Ketahui Lebih Lanjut',
        }
        compiled.push(proAd, proAd)
      }
    }

    if (compiled.length === 0) {
      const firstSession = sessions[0]
      const merchant = firstSession?.merchants
      const mState = merchant?.state || null
      const mCategory = merchant?.category || ''

      const { data: adsData } = await supabase.rpc('get_targeted_ads', {
        p_lat: null,
        p_lng: null,
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

    const shuffled = compiled.sort(() => 0.5 - Math.random())
    setAdsList(shuffled)
  }, [])

  // Device sessions loader
  const fetchAllDeviceSessions = useCallback(async (uuid: string) => {
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
    const nonCompletedSessions = filteredSessions.filter((s) => !['completed', 'archived'].includes(s.status))
    if (nonCompletedSessions.length > 0) await compileAds(nonCompletedSessions)
  }, [processAllSessions, compileAds])

  // Single primary session loader
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

        const isMerchantPro =
          merchantData.plan_type === 'pro' &&
          merchantData.subscription_status === 'active' &&
          !!merchantData.expiry_date &&
          new Date(merchantData.expiry_date) > new Date()

        if (!isMerchantPro && merchantData.gmb_url) {
          const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
          const { count } = await supabase
            .from('ad_analytics')
            .select('id', { count: 'exact', head: true })
            .eq('merchant_id', data.merchant_id)
            .eq('event_type', 'gmb_click')
            .gte('created_at', startOfMonth)
          setIsGmbQuotaExceeded((count ?? 0) >= 30)
        }
      }

      setReceiptNumber(data.receipt_number)
      setCreatedAt(data.created_at)

      if (clientUuid && !data.client_uuid) {
        await supabase.from('sessions').update({ client_uuid: clientUuid }).eq('id', sessionId)
      }

      processSessionStatus({ ...data, id: sessionId })
      isInitialFetchRef.current = false

      if (!hasTrackedLoadRef.current) {
        hasTrackedLoadRef.current = true
        pageLoadedAtRef.current = Date.now()
        trackPagerEvent({ supabase, eventType: 'page_loaded', sessionId, merchantId: data.merchant_id, clientUuid })
      }

      if (clientUuid) await fetchAllDeviceSessions(clientUuid)
    } else {
      const { data, error } = await supabase
        .from('sessions')
        .select('status, is_confirmed, updated_at')
        .eq('id', sessionId)
        .single()
      if (error || !data) return
      processSessionStatus({ ...data, id: sessionId })
    }
  }, [sessionId, clientUuid, primaryStatus, processSessionStatus, fetchAllDeviceSessions])

  useEffect(() => { fetchSession() }, [fetchSession])

  // Realtime subscription + heartbeats + timers
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
        if (clientUuid) fetchAllDeviceSessions(clientUuid)
      }, 90000)
    }

    if (!heartbeatRef.current) {
      heartbeatRef.current = setInterval(() => {
        if (document.visibilityState !== 'visible') return
        const elapsed = Math.floor((Date.now() - pageLoadedAtRef.current) / 1000)
        trackPagerEvent({ supabase, eventType: 'heartbeat', sessionId, merchantId, clientUuid, elapsedSeconds: elapsed })
      }, 30000)
    }

    const primaryChannel = supabase
      .channel(`session-${sessionId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sessionId}` },
        (payload: any) => processSessionStatus({ ...payload.new, id: sessionId })
      )
      .subscribe()

    let deviceChannel: ReturnType<typeof supabase.channel> | null = null
    if (clientUuid) {
      deviceChannel = supabase
        .channel(`device-sessions-${clientUuid}`)
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `client_uuid=eq.${clientUuid}` },
          async () => { if (clientUuid) await fetchAllDeviceSessions(clientUuid) }
        )
        .subscribe()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSession()
        if (clientUuid) fetchAllDeviceSessions(clientUuid)
        trackPagerEvent({ supabase, eventType: 'visibility_visible', sessionId, merchantId, clientUuid })
      } else {
        trackPagerEvent({ supabase, eventType: 'visibility_hidden', sessionId, merchantId, clientUuid })
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (waitTimerRef.current) clearInterval(waitTimerRef.current)
      if (pollingRef.current) clearInterval(pollingRef.current)
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      supabase.removeChannel(primaryChannel)
      if (deviceChannel) supabase.removeChannel(deviceChannel)
    }
  }, [status, sessionId, clientUuid, merchantId, fetchSession, processSessionStatus, fetchAllDeviceSessions])

  return {
    supabase,
    status,
    setStatus,
    primaryStatus,
    isConfirmed,
    receiptNumber,
    createdAt,
    merchantId,
    merchantName,
    merchantLogo,
    gmbUrl,
    themeColor,
    clientUuid,
    isIos,
    isOnline,
    now,
    allSessions,
    setAllSessions,
    dismissedSessions,
    setDismissedSessions,
    calledSessionId,
    isGmbQuotaExceeded,
    setIsGmbQuotaExceeded,
    adsList,
    currentAdIndex,
    setCurrentAdIndex,
    isFlashing,
    isAudioReady,
    setIsAudioReady,
    initAudio,
    playChime,
    triggerAlert,
    stopAlert,
    fetchAllDeviceSessions,
    fetchSession,
    getSessionsList,
  }
}
