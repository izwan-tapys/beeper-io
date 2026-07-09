import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Merchant, Session } from '@/types'

const supabase = createClient()

/**
 * Custom hook that manages all data fetching, state, and realtime subscriptions
 * for the merchant dashboard. Extracted from dashboard/page.tsx to separate
 * data logic from UI rendering.
 */
export function useDashboardData() {
  const router = useRouter()

  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState('')
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [gmbClickCount, setGmbClickCount] = useState(0)
  const [partnerProfile, setPartnerProfile] = useState<any>(null)
  const [fetchingPartner, setFetchingPartner] = useState(true)
  const [isMfaChallenge, setIsMfaChallenge] = useState(false)
  const [activeMfaFactor, setActiveMfaFactor] = useState<any>(null)

  const qrSessionRef = useRef<Session | null>(null)

  // ── Fetch all active/called sessions for this merchant ──────────────────────
  const fetchSessions = useCallback(async (merchantId: string) => {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('merchant_id', merchantId)
      .in('status', ['waiting', 'called'])
      .order('created_at', { ascending: true })
    setSessions(data || [])
    setLoading(false)
  }, [])

  // ── Fetch monthly session + GMB click counts ────────────────────────────────
  const fetchMonthlyCount = useCallback(async (m: Merchant) => {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', m.id)
      .gte('created_at', startOfMonth.toISOString())

    if (!error && count !== null) setMonthlyCount(count)

    const isPro =
      m.plan_type === 'pro' &&
      m.subscription_status === 'active' &&
      !!m.expiry_date &&
      new Date(m.expiry_date) > new Date()

    if (!isPro && m.gmb_url) {
      const { count: gmbCount } = await supabase
        .from('ad_analytics')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', m.id)
        .eq('event_type', 'gmb_click')
        .gte('created_at', startOfMonth.toISOString())
      setGmbClickCount(gmbCount ?? 0)
    }
  }, [])

  // ── Fetch partner/affiliate profile ─────────────────────────────────────────
  const fetchPartnerProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      setPartnerProfile(data)
      if (data && typeof window !== 'undefined') {
        localStorage.setItem('beepme_own_referral_code', data.referral_code.toUpperCase().trim())
      }
    } catch (err) {
      console.error('Error fetching partner profile:', err)
    } finally {
      setFetchingPartner(false)
    }
  }, [])

  // ── Fetch merchant data + check MFA status ───────────────────────────────────
  const fetchMerchant = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email || '')
        if (user.email === 'izwan.tapys@gmail.com') {
          router.push('/admin')
          return
        }
      }

      const storedRef = typeof window !== 'undefined' ? localStorage.getItem('beepme_referred_by') : null
      const url = storedRef ? `/api/merchant/me?ref=${encodeURIComponent(storedRef)}` : '/api/merchant/me'

      const res = await fetch(url)

      if (res.status === 401) { router.push('/login'); return }
      if (!res.ok) { setLoading(false); return }

      const json = await res.json()
      const m = json.merchant

      if (!m) { setLoading(false); return }

      if (typeof window !== 'undefined') localStorage.removeItem('beepme_referred_by')

      fetchPartnerProfile()
      setMerchant(m)

      // MFA check
      const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
        setIsMfaChallenge(true)
      }

      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors()
      if (!factorsError && factorsData?.totp) {
        const verifiedFactor = factorsData.totp.find((f: any) => f.status === 'verified')
        setActiveMfaFactor(verifiedFactor || null)
      } else {
        setActiveMfaFactor(null)
      }
    } catch (err) {
      console.error('Unexpected error in fetchMerchant:', err)
      setLoading(false)
    }
  }, [router, fetchPartnerProfile])

  // ── Initial load ─────────────────────────────────────────────────────────────
  useEffect(() => { fetchMerchant() }, [fetchMerchant])

  useEffect(() => {
    if (merchant) fetchSessions(merchant.id)
  }, [merchant, fetchSessions])

  useEffect(() => {
    if (merchant) fetchMonthlyCount(merchant)
  }, [merchant, sessions, fetchMonthlyCount])

  // ── Realtime subscription ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!merchant) return
    const channel = supabase
      .channel('dashboard-sessions')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'sessions' },
        (payload: any) => {
          const record = payload.new || payload.old
          if (record && record.merchant_id === merchant.id) {
            fetchSessions(merchant.id)
            if (payload.eventType === 'UPDATE' && qrSessionRef.current?.id === record.id && record.is_confirmed) {
              // Signal QR modal to close — consumers should watch this
            }
          }
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [merchant, fetchSessions])

  return {
    supabase,
    merchant,
    setMerchant,
    sessions,
    loading,
    userEmail,
    monthlyCount,
    gmbClickCount,
    partnerProfile,
    fetchingPartner,
    isMfaChallenge,
    setIsMfaChallenge,
    activeMfaFactor,
    qrSessionRef,
    fetchMerchant,
    fetchSessions,
    fetchPartnerProfile,
  }
}
