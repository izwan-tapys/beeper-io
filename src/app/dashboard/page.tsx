'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { useDashboardData } from '@/hooks/useDashboardData'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useWakeLock } from '@/hooks/useWakeLock'

// ─── Components ───────────────────────────────────────────────────────────────
import { AdsBuilder } from '@/components/AdsBuilder'
import { ComingSoonModal } from '@/components/dashboard/ComingSoonModal'
import { MfaChallengeModal } from '@/components/dashboard/MfaChallengeModal'
import { OnboardingModal } from '@/components/dashboard/OnboardingModal'
import { SettingsModal } from '@/components/dashboard/SettingsModal'
import AnalyticsDashboard from '@/components/dashboard/AnalyticsDashboard'
import { SubscriptionExpiredOverlay } from '@/components/dashboard/SubscriptionExpiredOverlay'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { IssuePagerWidget } from '@/components/dashboard/IssuePagerWidget'
import { ActivePagersList } from '@/components/dashboard/ActivePagersList'
import { QrModal } from '@/components/dashboard/QrModal'

// ─── Types ────────────────────────────────────────────────────────────────────
import type { Session, Merchant } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const lang: 'bm' | 'en' = 'en'

  // ── Hooks ──────────────────────────────────────────────────────────────────
  useWakeLock()
  const { isOnline } = useOnlineStatus()
  const {
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
  } = useDashboardData()

  // ── Local UI State ─────────────────────────────────────────────────────────
  const [receiptInput, setReceiptInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [qrSession, setQrSession] = useState<Session | null>(null)
  const [creating, setCreating] = useState(false)
  const [togglingStore, setTogglingStore] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsInitialSection, setSettingsInitialSection] = useState<string | null>(null)
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'home' | 'promosi' | 'analytics'>('home')
  const [baseUrl, setBaseUrl] = useState('')
  const [now, setNow] = useState(Date.now())
  const [latestReceipts, setLatestReceipts] = useState<any[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncCooldown, setSyncCooldown] = useState(0)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({})

  // ── Derived constants ──────────────────────────────────────────────────────
  useEffect(() => { setBaseUrl(window.location.origin) }, [])
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  useEffect(() => {
    if (syncCooldown > 0) {
      const timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [syncCooldown])

  // ── QR Modal auto-close when confirmed ─────────────────────────────────────
  const qrWasConfirmedRef = useRef<boolean>(false)
  const handleOpenQr = (session: Session) => {
    qrWasConfirmedRef.current = session.is_confirmed || false
    setQrSession(session)
  }
  useEffect(() => {
    if (qrSession) {
      const activeSession = sessions.find(s => s.id === qrSession.id)
      if (activeSession?.is_confirmed && !qrWasConfirmedRef.current) {
        setQrSession(null)
      }
    }
  }, [sessions, qrSession])
  useEffect(() => {
    if (qrSession) qrWasConfirmedRef.current = qrSession.is_confirmed || false
  }, [qrSession])
  useEffect(() => {
    qrSessionRef.current = qrSession
  }, [qrSession, qrSessionRef])

  // ── Derived computed values ────────────────────────────────────────────────
  const isPremiumActive = merchant?.plan_type === 'pro' &&
    merchant?.subscription_status === 'active' &&
    (!!merchant?.expiry_date && new Date(merchant.expiry_date) > new Date())

  const isExpired = merchant
    ? merchant.plan_type !== 'free' &&
      (merchant.subscription_status !== 'active' ||
        (!!merchant.expiry_date && new Date(merchant.expiry_date) < new Date()))
    : false

  const isOverQuota = false
  const pagerUrl = (sessionId: string) => `${baseUrl}/pager/${sessionId}`
  const showOnboarding = merchant && (!merchant.phone || !merchant.is_verified)

  // ── Helpers ────────────────────────────────────────────────────────────────
  const openSettings = (section?: string) => {
    setSettingsInitialSection(section ?? null)
    setIsSettingsOpen(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleUpgrade = () => setIsComingSoonOpen(true)

  // ── Session Actions ────────────────────────────────────────────────────────
  const createSession = async (rNum?: string) => {
    const finalReceiptNumber = rNum || receiptInput.trim()
    if (!merchant || !finalReceiptNumber) return
    setCreating(true)
    const { data, error } = await supabase
      .from('sessions')
      .insert({ merchant_id: merchant.id, receipt_number: finalReceiptNumber, status: 'waiting' })
      .select()
      .single()
    if (error) {
      alert('Gagal buat pager: ' + error.message)
    } else if (data) {
      setReceiptInput('')
      setQrSession(data)
      fetchSessions(merchant.id)
    }
    setCreating(false)
  }

  const callSession = async (id: string) => {
    if (cooldowns[id]) return
    setCooldowns(prev => ({ ...prev, [id]: true }))
    setTimeout(() => setCooldowns(prev => ({ ...prev, [id]: false })), 10000)
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'called', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      alert('Gagal panggil: ' + error.message)
      setCooldowns(prev => ({ ...prev, [id]: false }))
    } else {
      fetchSessions(merchant!.id)
    }
  }

  const doneSession = async (id: string) => {
    const { error } = await supabase
      .from('sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      alert('Gagal set selesai: ' + error.message)
    } else {
      fetchSessions(merchant!.id)
    }
  }

  const toggleStore = async () => {
    if (!merchant) return
    setTogglingStore(true)
    if (merchant.is_open) {
      await supabase
        .from('sessions')
        .update({ status: 'archived' })
        .eq('merchant_id', merchant.id)
        .in('status', ['waiting', 'called', 'completed'])
    }
    const newState = !merchant.is_open
    const { error } = await supabase
      .from('merchants')
      .update({ is_open: newState })
      .eq('id', merchant.id)
    if (error) {
      alert('Failed to update store status. Please try again.')
    } else {
      setMerchant({ ...merchant, is_open: newState })
      if (newState) fetchSessions(merchant.id)
    }
    setTogglingStore(false)
  }

  const syncLoyverse = async () => {
    if (!merchant) return
    setIsSyncing(true)
    try {
      const res = await fetch(`/api/loyverse/receipts?merchant_id=${merchant.id}`)
      const data = await res.json()
      if (data.receipts) {
        setLatestReceipts(data.receipts)
        setSyncCooldown(2)
      } else if (data.error) {
        alert('Sync Error: ' + data.error)
      }
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const challengeMfa = async () => {
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError || !factors.totp[0]) return
    const factorId = factors.totp[0].id
    const { data, error } = await supabase.auth.mfa.challenge({ factorId })
    if (error) { setMfaError(error.message); return }
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId, challengeId: data.id, code: mfaCode,
    })
    if (verifyError) {
      setMfaError(verifyError.message)
    } else {
      setIsMfaChallenge(false)
      setMfaCode('')
      fetchMerchant()
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className={`min-h-screen ${showOnboarding || isMfaChallenge || isComingSoonOpen ? 'overflow-hidden' : ''}`}
      style={{ background: 'var(--background)' }}
    >
      {/* Modals */}
      <ComingSoonModal isOpen={isComingSoonOpen} onClose={() => setIsComingSoonOpen(false)} />

      {isMfaChallenge && (
        <MfaChallengeModal
          mfaCode={mfaCode}
          setMfaCode={setMfaCode}
          mfaError={mfaError}
          onChallenge={challengeMfa}
          onLogout={handleLogout}
        />
      )}

      {showOnboarding && (
        <OnboardingModal
          merchant={merchant!}
          onPhoneSaved={(updated) => setMerchant(updated as Merchant)}
        />
      )}

      {/* Offline Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-3 px-4 py-3 bg-rose-600/95 backdrop-blur-md border-b border-rose-500/50 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
          <p className="text-white text-xs font-black uppercase tracking-widest">
            ⚠️ No Internet Connection — Real-time pager notifications paused. Reconnect to resume.
          </p>
        </div>
      )}

      {/* Subscription Expired Overlay */}
      {isExpired && merchant && (
        <SubscriptionExpiredOverlay
          merchant={merchant}
          onRenew={() => openSettings('subscription')}
          onLogout={handleLogout}
        />
      )}

      {/* Header */}
      <DashboardHeader
        merchant={merchant}
        togglingStore={togglingStore}
        activeTab={activeTab}
        lang={lang}
        onToggleStore={toggleStore}
        onOpenSettings={openSettings}
        onLogout={handleLogout}
        onTabChange={setActiveTab}
      />

      {/* ── Tab: Home / Orders ─────────────────────────────────────────────── */}
      {activeTab === 'home' && (
        <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
          {!merchant ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
              <p className="text-slate-500 animate-pulse text-sm">Synchronizing dashboard...</p>
            </div>
          ) : !merchant.is_open ? (
            <div className="text-center py-24 animate-fade-in">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
                <span className="text-3xl" style={{ color: 'var(--muted)' }}>⏻</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Store is Closed</h2>
              <p style={{ color: 'var(--muted-foreground)' }}>Click &quot;Open Store&quot; to start accepting orders.</p>
            </div>
          ) : (
            <>
              <IssuePagerWidget
                merchant={merchant}
                isPremiumActive={isPremiumActive}
                isOverQuota={isOverQuota}
                receiptInput={receiptInput}
                creating={creating}
                isSyncing={isSyncing}
                syncCooldown={syncCooldown}
                monthlyCount={monthlyCount}
                gmbClickCount={gmbClickCount}
                latestReceipts={latestReceipts}
                onReceiptChange={setReceiptInput}
                onSubmit={createSession}
                onSync={syncLoyverse}
                onSelectReceipt={(receiptNumber) => {
                  setReceiptInput(receiptNumber)
                  createSession(receiptNumber)
                  setLatestReceipts([])
                }}
                onOpenSettings={openSettings}
                onClearReceipts={() => setLatestReceipts([])}
              />

              <ActivePagersList
                sessions={sessions}
                loading={loading}
                searchQuery={searchQuery}
                now={now}
                cooldowns={cooldowns}
                onSearchChange={setSearchQuery}
                onCall={callSession}
                onDone={doneSession}
                onOpenQr={handleOpenQr}
              />
            </>
          )}
        </main>
      )}

      {/* ── Tab: Promosi ───────────────────────────────────────────────────── */}
      {activeTab === 'promosi' && (
        <main className="max-w-5xl mx-auto px-4 py-6">
          <AdsBuilder
            merchant={merchant}
            isPremiumActive={isPremiumActive}
            onUpgrade={handleUpgrade}
            onUpdate={(updatedMerchant) => {
              setMerchant(updatedMerchant)
              fetchMerchant()
            }}
          />
        </main>
      )}

      {/* ── Tab: Analytics ─────────────────────────────────────────────────── */}
      {activeTab === 'analytics' && merchant && (
        <main className="max-w-5xl mx-auto px-4 py-6 animate-fade-in">
          <AnalyticsDashboard
            supabase={supabase}
            merchantId={merchant.id}
            merchantPlan={merchant.plan_type}
          />
        </main>
      )}

      {/* QR Modal */}
      {qrSession && (
        <QrModal
          session={qrSession}
          pagerUrl={pagerUrl}
          onClose={() => setQrSession(null)}
        />
      )}

      {/* Settings Modal */}
      {merchant && (
        <SettingsModal
          isOpen={isSettingsOpen}
          initialSection={settingsInitialSection}
          merchant={merchant}
          userEmail={userEmail}
          partnerProfile={partnerProfile}
          fetchingPartner={fetchingPartner}
          activeMfaFactor={activeMfaFactor}
          baseUrl={baseUrl}
          isPremiumActive={isPremiumActive}
          onClose={() => setIsSettingsOpen(false)}
          onSaved={(updated) => setMerchant(updated)}
          onUpgrade={handleUpgrade}
          onLogout={handleLogout}
          fetchMerchant={fetchMerchant}
          fetchPartnerProfile={fetchPartnerProfile}
        />
      )}
    </div>
  )
}
