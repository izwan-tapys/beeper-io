'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  Zap, Plus, Search, Phone, CheckCircle, QrCode, Smartphone, ArrowRight,
  LogOut, Power, PowerOff, X, Clock, Loader2, Settings, ShieldCheck
} from 'lucide-react'

type Session = {
  id: string
  receipt_number: string
  status: 'waiting' | 'called' | 'completed' | 'archived'
  is_confirmed: boolean
  created_at: string
}

type Merchant = {
  id: string
  name: string
  is_open: boolean
  logo_url: string | null
  loyverse_token: string | null
  gmb_url: string | null
  phone: string | null
  is_verified: boolean
  plan_type: 'free' | 'basic' | 'pro'
  subscription_status: 'active' | 'expired' | 'trial'
  expiry_date: string | null
}

const supabase = createClient()

export default function DashboardPage() {
  const router = useRouter()

  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [receiptInput, setReceiptInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [qrSession, setQrSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [togglingStore, setTogglingStore] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsName, setSettingsName] = useState('')
  const [settingsLogo, setSettingsLogo] = useState('')
  const [settingsLoyverseToken, setSettingsLoyverseToken] = useState('')
  const [settingsGmbUrl, setSettingsGmbUrl] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [now, setNow] = useState(Date.now())
  const [latestReceipts, setLatestReceipts] = useState<any[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncCooldown, setSyncCooldown] = useState(0)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [onboardingPhone, setOnboardingPhone] = useState('')
  const [savingOnboarding, setSavingOnboarding] = useState(false)
  const [mfaEnrollData, setMfaEnrollData] = useState<any>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [isMfaChallenge, setIsMfaChallenge] = useState(false)
  const [mfaError, setMfaError] = useState('')
  const qrSessionRef = useRef<Session | null>(null)
  const qrWasConfirmedRef = useRef<boolean>(false)
  const wakeLockRef = useRef<any>(null)

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section)
  }

  const handleOpenQr = (session: any) => {
    qrWasConfirmedRef.current = session.is_confirmed || false
    setQrSession(session)
  }

  // Auto-close QR Modal when customer confirms (only if it wasn't confirmed when opened)
  useEffect(() => {
    if (qrSession) {
      const activeSession = sessions.find(s => s.id === qrSession.id)
      if (activeSession?.is_confirmed && !qrWasConfirmedRef.current) {
        setQrSession(null)
      }
    }
  }, [sessions, qrSession])

  // Track initial confirmation state when modal opens
  useEffect(() => {
    if (qrSession) {
      qrWasConfirmedRef.current = qrSession.is_confirmed || false
    }
  }, [qrSession])

  // Reset settings state when modal opens
  useEffect(() => {
    if (isSettingsOpen && merchant) {
      setSettingsName(merchant.name || '')
      setSettingsLogo(merchant.logo_url || '')
      setSettingsLoyverseToken(merchant.loyverse_token || '')
      setSettingsGmbUrl(merchant.gmb_url || '')
      // Note: openSection is NOT reset here so it can be pre-set before opening
    }
  }, [isSettingsOpen, merchant])

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.error('Wake Lock error:', err)
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLockRef.current) wakeLockRef.current.release()
    }
  }, [])

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  // Sync Cooldown Timer
  useEffect(() => {
    if (syncCooldown > 0) {
      const timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [syncCooldown])

  const fetchSessions = useCallback(async () => {
    if (!merchant) return
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('merchant_id', merchant.id)
      .in('status', ['waiting', 'called'])
      .order('created_at', { ascending: true })
    setSessions(data || [])
    setLoading(false)
  }, [merchant])

  const fetchMonthlyCount = useCallback(async () => {
    if (!merchant) return
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count, error } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id)
      .gte('created_at', startOfMonth.toISOString())

    if (!error && count !== null) {
      setMonthlyCount(count)
    }
  }, [merchant])

  useEffect(() => {
    fetchMonthlyCount()
  }, [fetchMonthlyCount, sessions])

  const fetchMerchant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let { data: m, error: fetchError } = await supabase.from('merchants').select('*').eq('user_id', user.id).single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching merchant:', fetchError)
    }

    if (!m) {
      const storeName = user.email?.split('@')[0] || 'My Store'
      const { data: newMerchant, error: insertError } = await supabase.from('merchants').insert({ user_id: user.id, name: storeName }).select().single()
      if (insertError) {
        console.error('Error creating merchant:', insertError)
        return
      }
      m = newMerchant
    }
    
    if (m) {
      setMerchant(m)
      setSettingsName(m.name || '')
      setSettingsLogo(m.logo_url || '')
      setSettingsLoyverseToken(m.loyverse_token || '')
      setSettingsGmbUrl(m.gmb_url || '')

      // Check for MFA Challenge
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (mfaData && mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
        setIsMfaChallenge(true)
      }
    }
  }, [router])

  useEffect(() => { fetchMerchant() }, [fetchMerchant])
  useEffect(() => { if (merchant) fetchSessions() }, [merchant, fetchSessions])

  // Realtime subscription for dashboard
  useEffect(() => {
    if (!merchant) return
    const channel = supabase
      .channel('dashboard-sessions')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `merchant_id=eq.${merchant.id}` }, 
        (payload: any) => {
          fetchSessions()
          // AUTO-CLOSE QR MODAL IF CONFIRMED
          if (qrSessionRef.current?.id === payload.new.id && payload.new.is_confirmed) {
            setQrSession(null)
          }
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sessions', filter: `merchant_id=eq.${merchant.id}` }, 
        () => fetchSessions()
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'sessions', filter: `merchant_id=eq.${merchant.id}` }, 
        () => fetchSessions()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [merchant, fetchSessions])

  const syncLoyverse = async () => {
    if (!merchant) return
    setIsSyncing(true)
    try {
      const res = await fetch(`/api/loyverse/receipts?merchant_id=${merchant.id}`)
      const data = await res.json()
      if (data.receipts) {
        setLatestReceipts(data.receipts)
        setSyncCooldown(2) // 2 saat cooldown (Loyverse limit: 1 req/sec)
      } else if (data.error) {
        alert('Sync Error: ' + data.error)
      }
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const createSession = async (rNum?: string) => {
    const finalReceiptNumber = rNum || receiptInput.trim()
    if (!merchant || !finalReceiptNumber) return

    // Check monthly limit based on plan
    let limit = 20
    if (merchant.plan_type === 'basic') limit = 500
    if (merchant.plan_type === 'pro') limit = 9999999 // Effectively unlimited

    if (merchant.plan_type !== 'pro' && monthlyCount >= limit) {
      alert(`Quota limit reached! You have used your ${limit} monthly orders. Please upgrade your plan for more pagers.`)
      setIsSettingsOpen(true)
      setOpenSection('subscription')
      return
    }

    setCreating(true)
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({ 
        merchant_id: merchant.id, 
        receipt_number: finalReceiptNumber, 
        status: 'waiting' 
      })
      .select()
      .single()

    if (error) {
      console.error('Create session error:', error)
      alert('Gagal buat pager: ' + error.message)
    } else if (data) {
      setReceiptInput('')
      setQrSession(data)
    }
    setCreating(false)
  }

  const callSession = async (id: string) => {
    const { error } = await supabase.from('sessions').update({ status: 'called', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      console.error('Call session error:', error)
      alert('Gagal panggil: ' + error.message)
    }
  }

  const getWaitTime = (createdAt: string) => {
    const start = new Date(createdAt).getTime()
    const seconds = Math.floor((now - start) / 1000)
    if (seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const doneSession = async (id: string) => {
    const { error } = await supabase.from('sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      console.error('Done session error:', error)
      alert('Gagal set selesai: ' + error.message)
    }
  }

  const toggleStore = async () => {
    if (!merchant) return
    setTogglingStore(true)
    if (merchant.is_open) {
      // Close: archive all active sessions
      await supabase.from('sessions').update({ status: 'archived' }).eq('merchant_id', merchant.id).in('status', ['waiting', 'called', 'completed'])
    }
    const newState = !merchant.is_open
    const { error: updateError } = await supabase.from('merchants').update({ is_open: newState }).eq('id', merchant.id)
    
    if (updateError) {
      console.error('Error toggling store:', updateError)
      alert('Failed to update store status. Please try again.')
    } else {
      setMerchant({ ...merchant, is_open: newState })
      if (newState) fetchSessions()
      else setSessions([])
    }
    setTogglingStore(false)
  }

  const resetSessions = async () => {
    if (!merchant) return
    if (!confirm('Are you absolutely sure? This will PERMANENTLY delete all your order history and reset your quota.')) return
    if (!confirm('FINAL WARNING: This action cannot be undone. Delete everything?')) return

    const { error } = await supabase.from('sessions').delete().eq('merchant_id', merchant.id)
    
    if (error) {
      alert('Failed to reset: ' + error.message)
    } else {
      setSessions([])
      setMonthlyCount(0)
      alert('All order history has been cleared.')
      setIsSettingsOpen(false)
    }
  }

  const hasSettingsChanged = () => {
    if (!merchant) return false
    return (
      settingsName !== (merchant.name || '') ||
      settingsLogo !== (merchant.logo_url || '') ||
      settingsLoyverseToken !== (merchant.loyverse_token || '') ||
      settingsGmbUrl !== (merchant.gmb_url || '')
    )
  }

  const closeSettings = () => {
    if (hasSettingsChanged()) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return
      }
    }
    setIsSettingsOpen(false)
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant || !settingsName.trim()) return
    setSavingSettings(true)
    const { error } = await supabase
      .from('merchants')
      .update({ 
        name: settingsName.trim(), 
        logo_url: settingsLogo.trim() || null,
        loyverse_token: settingsLoyverseToken.trim() || null,
        gmb_url: settingsGmbUrl.trim() || null 
      })
      .eq('id', merchant.id)
    
    if (error) {
      console.error('Error saving settings:', error)
      alert('Gagal simpan: ' + error.message)
    } else {
      setMerchant({ 
        ...merchant, 
        name: settingsName.trim(), 
        logo_url: settingsLogo.trim() || null,
        loyverse_token: settingsLoyverseToken.trim() || null,
        gmb_url: settingsGmbUrl.trim() || null 
      })
      setIsSettingsOpen(false)
      fetchMerchant()
    }
    setSavingSettings(false)
  }

  const saveOnboarding = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant || !onboardingPhone.trim()) return
    
    // Basic MY Phone Validation
    const phoneRegex = /^(01)[0-46-9]-*[0-9]{7,8}$/
    const cleanedPhone = onboardingPhone.replace(/-/g, '').trim()
    
    if (!phoneRegex.test(cleanedPhone)) {
      alert('Please enter a valid Malaysian phone number (e.g. 0123456789)')
      return
    }

    setSavingOnboarding(true)
    const { error } = await supabase
      .from('merchants')
      .update({ phone: cleanedPhone })
      .eq('id', merchant.id)

    if (error) {
      if (error.message.includes('unique')) {
        alert('This phone number is already registered with another account. Please use a different number.')
      } else {
        alert('Failed to save: ' + error.message)
      }
    } else {
      // Update local state with phone
      // The UI will automatically switch based on the merchant object
      setMerchant({ ...merchant, phone: cleanedPhone, is_verified: false })
    }
    setSavingOnboarding(false)
  }

  const enrollMfa = async () => {
    setMfaError('')
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp'
    })

    if (error) {
      setMfaError(error.message)
      return
    }

    // Immediately challenge to get challengeId
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId: data.id
    })

    if (challengeError) {
      setMfaError(challengeError.message)
      return
    }

    setMfaEnrollData({ ...data, challengeId: challengeData.id })
  }

  const verifyMfa = async () => {
    if (!mfaEnrollData || !mfaCode) return
    setMfaError('')
    
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaEnrollData.id,
      challengeId: (mfaEnrollData as any).challengeId,
      code: mfaCode
    })

    if (error) {
      setMfaError(error.message)
    } else {
      alert('2FA successfully enabled!')
      setMfaEnrollData(null)
      setMfaCode('')
      fetchMerchant()
    }
  }

  const challengeMfa = async () => {
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors()
    if (factorsError || !factors.totp[0]) return

    const factorId = factors.totp[0].id
    const { data, error } = await supabase.auth.mfa.challenge({ factorId })
    
    if (error) {
      setMfaError(error.message)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: data.id,
      code: mfaCode
    })

    if (verifyError) {
      setMfaError(verifyError.message)
    } else {
      setIsMfaChallenge(false)
      setMfaCode('')
      fetchMerchant()
    }
  }

  const handleUpgrade = async (plan: 'basic' | 'pro', price: number) => {
    try {
      setSavingSettings(true)
      const response = await fetch('/api/payment/toyyibpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: price,
          planName: `Beeper ${plan.charAt(0).toUpperCase() + plan.slice(1)}`
        })
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to initiate payment: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredSessions = sessions.filter(s =>
    s.receipt_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const quota = merchant?.plan_type === 'pro' ? Infinity : merchant?.plan_type === 'basic' ? 500 : 20
  const isOverQuota = monthlyCount >= quota

  const pagerUrl = (sessionId: string) => `${baseUrl}/pager/${sessionId}`

  const showOnboarding = merchant && (!merchant.phone || !merchant.is_verified)

  return (
    <div className={`min-h-screen ${showOnboarding || isMfaChallenge ? 'overflow-hidden' : ''}`} style={{ background: 'var(--background)' }}>
      {/* MFA Challenge Modal */}
      {isMfaChallenge && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80 animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0b0f] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-indigo-500/20 text-center animate-bounce-in">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/40 mx-auto">
              <ShieldCheck size={40} className="text-white" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">2FA Required</h2>
            <p className="text-slate-400 mb-8 text-sm">Enter the 6-digit code from your authenticator app to continue.</p>
            
            <input 
              type="text"
              placeholder="000000"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-3xl text-center outline-none focus:border-indigo-500 transition-all tracking-[0.5em] mb-6"
            />

            {mfaError && <p className="text-rose-500 text-xs font-bold mb-6">{mfaError}</p>}

            <button 
              onClick={challengeMfa}
              className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all shadow-xl shadow-indigo-600/20"
            >
              Verify & Login
            </button>
            <button onClick={handleLogout} className="mt-6 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest">Logout</button>
          </div>
        </div>
      )}

      {/* Onboarding Modal (Forced) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-fade-in">
          <div className="w-full max-w-md bg-[#0a0b0f] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-indigo-500/20 animate-bounce-in">
            <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/40 mx-auto">
              <Smartphone size={40} className="text-white" />
            </div>
            
            <h2 className="text-3xl font-black text-white text-center mb-2">Welcome to Beeper!</h2>
            
            {!merchant?.phone ? (
              <>
                <p className="text-slate-400 text-center mb-10 text-sm leading-relaxed">
                  To keep our community safe and fair, we require a valid phone number to get started.
                </p>

                <form onSubmit={saveOnboarding} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-2">Phone Number</label>
                    <input 
                      type="tel"
                      placeholder="e.g. 0123456789"
                      value={onboardingPhone}
                      onChange={(e) => setOnboardingPhone(e.target.value)}
                      className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold outline-none focus:border-indigo-500 transition-all text-lg"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={savingOnboarding || !onboardingPhone.trim()}
                    className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {savingOnboarding ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                    Next Step
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center animate-fade-in">
                <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                  Last step! Please click the button below to send a verification message to our team via WhatsApp.
                </p>
                
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 mb-8">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Your Verified Phone</p>
                  <p className="text-xl font-bold text-white tracking-widest">{merchant.phone}</p>
                </div>

                <div className="space-y-4">
                  <a 
                    href={`https://wa.me/60194696158?text=${encodeURIComponent(`Salam Beeper, sila sahkan akaun saya.\n\nStore: ${merchant.name}\nPhone: ${merchant.phone}\nID: ${merchant.id}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-5 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-lg transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3"
                  >
                    <Phone size={20} />
                    Verify via WhatsApp
                  </a>
                  
                  <div className="pt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold animate-pulse">
                      <Clock size={14} />
                      Waiting for Admin Approval...
                    </div>
                    <p className="text-[9px] text-slate-500 italic text-center">
                      Once sent, we will approve your account within 10-15 minutes. <br/> You can refresh this page after a while.
                    </p>
                    <button onClick={() => window.location.reload()} className="text-[10px] text-slate-400 hover:text-white underline mt-2">Refresh Page</button>
                  </div>
                </div>
              </div>
            )}
            
            <p className="mt-8 text-[9px] text-slate-600 text-center uppercase tracking-tighter">
              By continuing, you agree to our terms and fair usage policy.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--card-border)' }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-white/10 shrink-0" style={{ background: 'var(--card)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
              <img src="/icon.png" alt="Beeper" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center flex-1 min-w-0 ml-1">
              <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">Beeper</span>
              {merchant && (
                <h1 className="text-sm sm:text-base font-bold text-white truncate leading-none">
                  {merchant.name}
                </h1>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="store-toggle-btn"
              onClick={toggleStore}
              disabled={togglingStore}
              className="p-2.5 rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center"
              style={{
                background: merchant?.is_open ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                color: merchant?.is_open ? '#4ade80' : '#818cf8',
                border: `1px solid ${merchant?.is_open ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
              }}
              title={merchant?.is_open ? 'Close Store' : 'Open Store'}
            >
              {togglingStore ? <Loader2 size={18} className="animate-spin" /> : merchant?.is_open ? <PowerOff size={18} /> : <Power size={18} />}
            </button>
            <button id="settings-btn" onClick={() => setIsSettingsOpen(true)} className="p-2.5 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10" style={{ color: 'var(--muted-foreground)' }} title="Settings">
              <Settings size={20} />
            </button>
            <button id="logout-btn" onClick={handleLogout} className="p-2.5 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10" style={{ color: 'var(--muted-foreground)' }} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Only show content if merchant data is loaded */}
        {!merchant ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-500 animate-pulse text-sm">Synchronizing dashboard...</p>
          </div>
        ) : !merchant.is_open ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Power size={32} style={{ color: 'var(--muted)' }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Store is Closed</h2>
            <p style={{ color: 'var(--muted-foreground)' }}>Click "Open Store" to start accepting orders.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <h2 className="text-lg font-semibold text-white mb-4">Issue New Pager</h2>
                <form 
                  onSubmit={(e) => { 
                    e.preventDefault(); 
                    if (isOverQuota) {
                      setOpenSection('subscription');
                      setIsSettingsOpen(true);
                      return;
                    }
                    createSession(); 
                  }} 
                  className="flex flex-col sm:flex-row gap-3"
                >
                  <input
                    id="receipt-input"
                    type="text"
                    value={receiptInput}
                    onChange={(e) => setReceiptInput(e.target.value)}
                    placeholder={isOverQuota ? "Quota Reached" : "Enter receipt / order number"}
                    disabled={isOverQuota}
                    className="w-full sm:flex-1 px-4 py-3 rounded-xl text-white outline-none"
                    style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                  />
                  <div className="flex gap-2">
                    <button
                      id="create-session-btn"
                      type="submit"
                      disabled={creating || (!isOverQuota && !receiptInput.trim())}
                      className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ 
                        background: isOverQuota ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
                        opacity: creating ? 0.7 : 1,
                        boxShadow: isOverQuota ? '0 0 15px rgba(245, 158, 11, 0.3)' : 'none'
                      }}
                    >
                      {creating ? <Loader2 size={16} className="animate-spin" /> : isOverQuota ? <Zap size={18} /> : <Plus size={18} />}
                      <span>{isOverQuota ? 'Upgrade Plan' : 'Issue'}</span>
                    </button>
                  <button
                    type="button"
                    onClick={syncLoyverse}
                    disabled={isSyncing || syncCooldown > 0 || !merchant?.loyverse_token}
                    className="px-5 py-3 rounded-xl border flex items-center justify-center transition-all min-w-[50px] sm:min-w-0"
                    style={{ 
                      background: 'rgba(234,179,8,0.1)', 
                      borderColor: (merchant?.loyverse_token && syncCooldown === 0) ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.05)',
                      color: (merchant?.loyverse_token && syncCooldown === 0) ? '#eab308' : '#475569'
                    }}
                    title={syncCooldown > 0 ? `Cooldown: ${syncCooldown}s` : "Sync with Loyverse"}
                  >
                    {isSyncing ? <Loader2 size={18} className="animate-spin" /> : syncCooldown > 0 ? <span className="text-xs font-bold">{syncCooldown}</span> : <Zap size={18} />}
                  </button>
                </div>
              </form>

              {/* Monthly Usage Counter */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {merchant?.plan_type === 'pro' ? 'Beeper Pro Usage' : 'Monthly Order Quota'}
                  </span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                    {merchant?.plan_type === 'pro' ? `${monthlyCount} / Unlimited` : `${monthlyCount} / ${merchant?.plan_type === 'basic' ? '500' : '20'}`}
                  </span>
                </div>
                {merchant?.plan_type !== 'pro' && (
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${monthlyCount >= (merchant?.plan_type === 'basic' ? 450 : 15) ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min((monthlyCount / (merchant?.plan_type === 'basic' ? 500 : 20)) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Latest Receipts List */}
              {latestReceipts.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl animate-fade-in" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Latest from Loyverse</h4>
                    <button onClick={() => setLatestReceipts([])} className="text-slate-500 hover:text-white"><X size={14}/></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {latestReceipts.slice(0, 5).map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setReceiptInput(r.receipt_number)
                          createSession(r.receipt_number)
                          setLatestReceipts([])
                        }}
                        className="p-3 rounded-xl bg-black border border-white/5 hover:border-indigo-500/50 transition-all text-center group"
                      >
                        <p className="text-xs text-slate-400 group-hover:text-indigo-400 font-mono">#{r.receipt_number}</p>
                        <p className="text-[10px] font-bold text-white mt-1">RM{r.total}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--card-border)' }}>
                <Search size={16} style={{ color: 'var(--muted)' }} />
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order number..."
                  className="flex-1 bg-transparent text-white outline-none text-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>No active pagers.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                  {filteredSessions.map((session) => (
                    <div key={session.id} className="flex flex-col p-5 hover:bg-white/[0.02] animate-slide-up transition-all border-b border-white/[0.02]" style={{ borderColor: 'var(--card-border)' }}>
                      {/* Top Section: Connection Status, Order Info, and Timer */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-2 h-2 rounded-full shrink-0 mt-3 md:mt-3.5" style={{ background: session.status === 'called' ? 'var(--success)' : 'var(--accent)', boxShadow: `0 0 8px ${session.status === 'called' ? 'var(--success)' : 'var(--accent)'}` }} />
                        
                        <div className="flex-1 flex flex-col">
                          {/* Connection Status Badge */}
                          <div className="flex mb-1.5">
                            {!session.is_confirmed ? (
                              <span className="bg-yellow-500/90 text-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-black animate-pulse">
                                WAITING FOR CUSTOMER
                              </span>
                            ) : (
                              <span className="bg-green-500 text-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-black">
                                CUSTOMER WAITING
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <p className="font-black text-white text-2xl sm:text-3xl">#{session.receipt_number}</p>
                              <span className="hidden xs:inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">
                                {session.status === 'called' ? '🔔 Called' : '⏳ Prep'}
                              </span>
                            </div>

                            {/* Timer on the same line as Order Number for Mobile */}
                            {session.status === 'waiting' && (
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Wait Time</span>
                                <span className="text-xl sm:text-2xl font-mono text-indigo-400 font-bold tabular-nums">
                                  {getWaitTime(session.created_at)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-[10px] font-medium text-slate-600 mt-1 uppercase tracking-tighter">
                            Issued at {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Section: Action Buttons (Full width on mobile) */}
                      <div className="flex items-center gap-2 md:w-auto md:ml-6">
                        <button
                          id={`qr-btn-${session.id}`}
                          onClick={() => handleOpenQr(session)}
                          className="p-3 rounded-xl transition-all active:scale-95 shrink-0"
                          style={{ color: 'var(--muted-foreground)', background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                          title="Show QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                        <button
                          onClick={() => callSession(session.id)}
                          disabled={session.status === 'called' || !session.is_confirmed}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-20 disabled:grayscale whitespace-nowrap"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                        >
                          <Phone size={16} />
                          {session.status === 'called' ? 'CALLED' : 'CALL'}
                        </button>
                        <button
                          onClick={() => doneSession(session.id)}
                          disabled={!session.is_confirmed}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-20 disabled:grayscale whitespace-nowrap"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                        >
                          <CheckCircle size={16} />
                          DONE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* QR Modal */}
      {qrSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-3xl p-6 sm:p-8 border text-center animate-bounce-in" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-lg">Order #{qrSession.receipt_number}</h3>
              <button onClick={() => setQrSession(null)} className="p-1 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCodeSVG value={pagerUrl(qrSession.id)} size={200} level="H" />
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Ask customer to scan QR</p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border animate-bounce-in shadow-2xl" style={{ background: '#0f1117', borderColor: 'var(--card-border)' }}>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Settings size={20} className="text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Settings</h2>
              </div>
              <button 
                type="button"
                onClick={closeSettings} 
                className="text-slate-500 hover:text-white transition-colors p-2 -mr-2"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveSettings} className="flex-1 flex flex-col overflow-hidden">
              {/* Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* 1. Store Profile */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('profile')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Store Profile</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'profile' ? 'rotate-90' : ''}`} />
                </button>
                
                {openSection === 'profile' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Store Name</label>
                      <input
                        type="text"
                        value={settingsName}
                        onChange={(e) => setSettingsName(e.target.value)}
                        placeholder="Nama Kedai"
                        className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Logo URL</label>
                      <input
                        type="text"
                        value={settingsLogo}
                        onChange={(e) => setSettingsLogo(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* 2. Integrations */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('integrations')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Integrations</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'integrations' ? 'rotate-90' : ''}`} />
                </button>

                {openSection === 'integrations' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Loyverse Access Token</label>
                      <input
                        type="password"
                        value={settingsLoyverseToken}
                        onChange={(e) => setSettingsLoyverseToken(e.target.value)}
                        placeholder="Personal Access Token..."
                        className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">GMB Review URL</label>
                      <input
                        type="text"
                        value={settingsGmbUrl}
                        onChange={(e) => setSettingsGmbUrl(e.target.value)}
                        placeholder="https://g.page/..."
                        className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                    
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Webhook Endpoint</p>
                      <code className="block text-[10px] text-indigo-400/80 break-all p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 font-mono">
                        {baseUrl}/api/webhooks/loyverse?merchant_id={merchant?.id}
                      </code>
                    </div>
                  </div>
                )}
              </section>

              {/* 3. Subscription */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('subscription')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Subscription Plan</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'subscription' ? 'rotate-90' : ''}`} />
                </button>

                {openSection === 'subscription' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    {/* Current Plan Status */}
                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${merchant?.plan_type !== 'free' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                          <span className="text-white font-bold uppercase text-sm">
                            Beeper {merchant?.plan_type || 'Free'}
                          </span>
                        </div>
                        {merchant?.expiry_date && (
                          <span className="text-[10px] text-slate-500 mt-1">Expires on {new Date(merchant.expiry_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      {merchant?.plan_type !== 'free' && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest">Active</span>
                      )}
                    </div>

                    {/* Plan Selector */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* Free Plan Card */}
                      <div className={`p-4 rounded-2xl border transition-all ${merchant?.plan_type === 'free' ? 'bg-white/[0.05] border-white/20' : 'bg-white/[0.02] border-white/5 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-white font-bold text-sm">Beeper Free</h3>
                            <p className="text-[10px] text-slate-500">Perfect for starting out</p>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">RM0</span>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">/forever</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 mb-2">
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-slate-500" /> 20 Monthly Orders
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-slate-500" /> Standard Virtual Pager
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-slate-500" /> Loyverse Integration
                          </li>
                        </ul>
                        {merchant?.plan_type === 'free' && (
                          <div className="mt-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Plan</span>
                          </div>
                        )}
                      </div>

                      {/* Basic Plan Card */}
                      <div className={`p-4 rounded-2xl border transition-all ${merchant?.plan_type === 'basic' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/[0.02] border-white/5'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-white font-bold text-sm">Beeper Basic</h3>
                            <p className="text-[10px] text-slate-500">For small cafes & trucks</p>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">RM30</span>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">/month</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 mb-4">
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-indigo-500" /> 500 Monthly Orders
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-indigo-500" /> Custom Branding
                          </li>
                        </ul>
                        {merchant?.plan_type !== 'basic' && merchant?.plan_type !== 'pro' && (
                          <button 
                            onClick={() => handleUpgrade('basic', 30)}
                            disabled={savingSettings}
                            className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"
                          >
                            {savingSettings ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                            Select Basic
                          </button>
                        )}
                      </div>

                      {/* Pro Plan Card */}
                      <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${merchant?.plan_type === 'pro' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-indigo-500/5 border-indigo-500/20'}`}>
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black px-2 py-1 uppercase rounded-bl-lg">Best Value</div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-white font-bold text-sm">Beeper Unlimited</h3>
                            <p className="text-[10px] text-slate-500">For busy restaurants</p>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">RM49</span>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">/month</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 mb-4">
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-indigo-500" /> Unlimited Orders
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-indigo-500" /> Priority Support
                          </li>
                        </ul>
                        {merchant?.plan_type !== 'pro' && (
                          <button 
                            onClick={() => handleUpgrade('pro', 49)}
                            disabled={savingSettings}
                            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                          >
                            {savingSettings ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                            Upgrade to Unlimited
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-[9px] text-slate-600 italic px-1 text-center">*Secure payment via ToyyibPay. RM1.00 fee applies.</p>
                  </div>
                )}
              </section>

               {/* 4. Security */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('security')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Security (2FA)</span>
                  </div>
                  <ShieldCheck size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'security' ? 'rotate-90' : ''}`} />
                </button>

                {openSection === 'security' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    {!mfaEnrollData ? (
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">Google Authenticator</p>
                            <p className="text-[10px] text-slate-500 text-left">Protect your account with an extra layer of security.</p>
                          </div>
                        </div>
                        <button 
                          onClick={enrollMfa}
                          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20"
                        >
                          Enable 2FA
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 text-center space-y-6">
                        <p className="text-xs font-bold text-white">Scan this QR Code</p>
                        <div className="bg-white p-4 rounded-2xl inline-block">
                          <QRCodeSVG value={mfaEnrollData.totp.qr_code} size={160} />
                        </div>
                        <p className="text-[10px] text-slate-400">Scan with Google Authenticator or Authy, then enter the code below:</p>
                        <input 
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          value={mfaCode}
                          onChange={(e) => setMfaCode(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-black text-xl text-center outline-none focus:border-indigo-500 transition-all tracking-widest"
                        />
                        {mfaError && <p className="text-rose-500 text-[10px] font-bold">{mfaError}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => setMfaEnrollData(null)} className="flex-1 py-3 rounded-xl bg-white/5 text-slate-400 text-xs font-bold">Cancel</button>
                          <button onClick={verifyMfa} className="flex-[2] py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/20">Verify & Activate</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* 5. Account */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('account')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Account Control</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'account' ? 'rotate-90' : ''}`} />
                </button>

                {openSection === 'account' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                      <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Danger Zone</h4>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Deleting your order history will reset your monthly quota and permanently remove all past records.
                      </p>
                      <button 
                        onClick={resetSessions}
                        type="button"
                        className="w-full py-2.5 rounded-xl bg-red-500/10 text-red-500 font-bold text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        Clear All Order History
                      </button>
                    </div>
                    <button 
                      onClick={handleLogout} 
                      type="button"
                      className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 font-bold text-sm hover:bg-rose-500/10 transition-all active:scale-95"
                    >
                      <LogOut size={16} />
                      Sign Out from Beeper
                    </button>
                  </div>
                )}
              </section>
            </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
                <button 
                  onClick={closeSettings} 
                  type="button"
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingSettings || !hasSettingsChanged()} 
                  className={`flex-[2] py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                    savingSettings || !hasSettingsChanged() 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                  }`}
                >
                  {savingSettings && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
