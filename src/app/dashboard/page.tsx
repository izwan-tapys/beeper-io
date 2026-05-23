'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  Zap, Plus, Search, Phone, CheckCircle, QrCode, Smartphone, ArrowRight,
  LogOut, Power, PowerOff, X, Clock, Loader2, Settings, ShieldCheck, Store, Infinity as InfinityIcon
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { AdsBuilder } from '@/components/AdsBuilder'

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
  theme_color: string | null
  upsell_video_url: string | null
  upsell_image_url: string | null
  upsell_title: string | null
  upsell_description: string | null
  upsell_cta_text: string | null
  upsell_link_url: string | null
  state: string | null
  category: string | null
}

const MALAYSIAN_STATES = [
  'Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Pahang', 'Negeri Sembilan',
  'Melaka', 'Kedah', 'Kelantan', 'Terengganu', 'Perlis', 'Sabah', 'Sarawak', 'Labuan', 'Putrajaya'
]

const MERCHANT_CATEGORIES = [
  'Fast Food', 'Casual Dining', 'Cafe & Coffee', 'Fine Dining', 'Seafood',
  'Nasi Kandar', 'Mamak', 'Hawker & Street Food', 'Bakery & Desserts',
  'Other F&B', 'Retail', 'Bank & Finance', 'Entertainment', 'Health & Wellness', 'Other'
]

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
  const [userEmail, setUserEmail] = useState('')
  const [activeTab, setActiveTab] = useState<'home' | 'promosi'>('home')
  const [settingsUpsellTitle, setSettingsUpsellTitle] = useState('')
  const [settingsUpsellLinkUrl, setSettingsUpsellLinkUrl] = useState('')
  const [settingsUpsellVideoUrl, setSettingsUpsellVideoUrl] = useState('')
  const [settingsUpsellImageUrl, setSettingsUpsellImageUrl] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [now, setNow] = useState(Date.now())
  const [latestReceipts, setLatestReceipts] = useState<any[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncCooldown, setSyncCooldown] = useState(0)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [monthlyCount, setMonthlyCount] = useState(0)
  const [isOnline, setIsOnline] = useState(true)
  const [onboardingPhone, setOnboardingPhone] = useState('')
  const [savingOnboarding, setSavingOnboarding] = useState(false)
  const [mfaEnrollData, setMfaEnrollData] = useState<any>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [isMfaChallenge, setIsMfaChallenge] = useState(false)
  const [mfaError, setMfaError] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [settingsThemeColor, setSettingsThemeColor] = useState('#6366f1')
  const [settingsState, setSettingsState] = useState('')
  const [settingsCategory, setSettingsCategory] = useState('')
  const [cooldowns, setCooldowns] = useState<Record<string, boolean>>({})
  const [webhookUrl, setWebhookUrl] = useState('')
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
      setSettingsUpsellTitle(merchant.upsell_title || '')
      setSettingsUpsellLinkUrl(merchant.upsell_link_url || '')
      setSettingsUpsellVideoUrl(merchant.upsell_video_url || '')
      setSettingsUpsellImageUrl(merchant.upsell_image_url || '')
      // Note: openSection is NOT reset here so it can be pre-set before opening
    }
  }, [isSettingsOpen, merchant])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !merchant) return

    setUploadingLogo(true)
    try {
      // 1. Create a canvas to resize and compress
      const img = new Image()
      const reader = new FileReader()

      const compressedFile = await new Promise<Blob>((resolve, reject) => {
        reader.onload = (event) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const size = 512 // Standard logo size
            canvas.width = size
            canvas.height = size
            
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Failed to get canvas context'))

            // Draw and crop to square (center)
            const minSide = Math.min(img.width, img.height)
            const sx = (img.width - minSide) / 2
            const sy = (img.height - minSide) / 2
            
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size)
            
            canvas.toBlob((blob) => {
              if (blob) resolve(blob)
              else reject(new Error('Canvas to Blob failed'))
            }, 'image/webp', 0.8)
          }
          img.src = event.target?.result as string
        }
        reader.readAsDataURL(file)
      })

      const fileName = `${merchant.id}/${Date.now()}.webp`
      const filePath = `logos/${fileName}`

      // Delete old logo if it exists
      if (merchant.logo_url) {
        const bucketMatch = merchant.logo_url.split('/merchant-logos/');
        if (bucketMatch.length === 2) {
          await supabase.storage.from('merchant-logos').remove([bucketMatch[1]]);
        }
      }

      // 2. Upload the compressed WebP blob to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('merchant-logos')
        .upload(filePath, compressedFile, { 
          upsert: true,
          contentType: 'image/webp'
        })

      if (uploadError) throw uploadError

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('merchant-logos')
        .getPublicUrl(filePath)

      setSettingsLogo(publicUrl)
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      alert('Error uploading: ' + error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

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

  // ─── Online / Offline Detection ─────────────────────────────────────────────
  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
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
    setUserEmail(user.email || '')

    let { data: m, error: fetchError } = await supabase.from('merchants').select('*').eq('user_id', user.id).single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching merchant:', fetchError)
    }

    if (!m) {
      const storeName = user.email?.split('@')[0] || 'My Store'
      const { data: newMerchant, error: insertError } = await supabase.from('merchants').insert({ user_id: user.id, name: storeName, email: user.email }).select().single()
      if (insertError) {
        console.error('Error creating merchant:', insertError)
        return
      }
      m = newMerchant
    } else if (!m.email && user.email) {
      // Auto-backfill email for existing merchants when they login
      await supabase.from('merchants').update({ email: user.email }).eq('id', m.id)
      m.email = user.email
    }
    
    if (m) {
      setMerchant(m)
      setSettingsName(m.name || '')
      setSettingsLogo(m.logo_url || '')
      setSettingsLoyverseToken(m.loyverse_token || '')
      setSettingsGmbUrl(m.gmb_url || '')
      setSettingsThemeColor(m.theme_color || '#6366f1')
      setSettingsState(m.state || '')
      setSettingsCategory(m.category || '')

      // Fetch webhook URL securely from backend API
      fetch('/api/merchant/webhook-url')
        .then(res => res.json())
        .then(data => {
          if (data.webhookUrl) setWebhookUrl(data.webhookUrl)
        })
        .catch(err => console.error('Failed to fetch webhook URL:', err))


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

    // No monthly limits for Always Free or Premium plan

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
    if (cooldowns[id]) return

    // Set cooldown
    setCooldowns(prev => ({ ...prev, [id]: true }))
    setTimeout(() => {
      setCooldowns(prev => ({ ...prev, [id]: false }))
    }, 10000)

    const { error } = await supabase.from('sessions').update({ status: 'called', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      console.error('Call session error:', error)
      alert('Gagal panggil: ' + error.message)
      setCooldowns(prev => ({ ...prev, [id]: false })) // release cooldown on error
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



  const hasSettingsChanged = () => {
    if (!merchant) return false
    return (
      settingsName !== (merchant.name || '') ||
      settingsLogo !== (merchant.logo_url || '') ||
      settingsLoyverseToken !== (merchant.loyverse_token || '') ||
      settingsGmbUrl !== (merchant.gmb_url || '') ||
      settingsThemeColor !== (merchant.theme_color || '#6366f1') ||
      settingsState !== (merchant.state || '') ||
      settingsCategory !== (merchant.category || '') ||
      settingsUpsellTitle !== (merchant.upsell_title || '') ||
      settingsUpsellLinkUrl !== (merchant.upsell_link_url || '') ||
      settingsUpsellVideoUrl !== (merchant.upsell_video_url || '') ||
      settingsUpsellImageUrl !== (merchant.upsell_image_url || '')
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
        gmb_url: settingsGmbUrl.trim() || null,
        theme_color: settingsThemeColor,
        state: settingsState || null,
        category: settingsCategory || null,
        upsell_title: settingsUpsellTitle.trim() || null,
        upsell_link_url: settingsUpsellLinkUrl.trim() || null,
        upsell_video_url: settingsUpsellVideoUrl.trim() || null,
        upsell_image_url: settingsUpsellImageUrl.trim() || null
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
        gmb_url: settingsGmbUrl.trim() || null,
        theme_color: settingsThemeColor,
        state: settingsState || null,
        category: settingsCategory || null,
        upsell_title: settingsUpsellTitle.trim() || null,
        upsell_link_url: settingsUpsellLinkUrl.trim() || null,
        upsell_video_url: settingsUpsellVideoUrl.trim() || null,
        upsell_image_url: settingsUpsellImageUrl.trim() || null
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
          planName: `Beepme ${plan.charAt(0).toUpperCase() + plan.slice(1)}`
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

  const isPremiumActive = merchant?.plan_type === 'pro' &&
    merchant?.subscription_status === 'active' &&
    (!!merchant?.expiry_date && new Date(merchant.expiry_date) > new Date())

  const quota = Infinity

  // Subscription expiry: free plan never expires; paid plans expire on expiry_date
  const isExpired = merchant
    ? merchant.plan_type !== 'free' &&
      (merchant.subscription_status !== 'active' ||
        (!!merchant.expiry_date && new Date(merchant.expiry_date) < new Date()))
    : false

  const isOverQuota = false

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
            
            <h2 className="text-3xl font-black text-white text-center mb-2">Welcome to Beepme!</h2>
            
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
                    href={`https://wa.me/60194696158?text=${encodeURIComponent(`Salam Beepme, sila sahkan akaun saya.\n\nStore: ${merchant.name}\nPhone: ${merchant.phone}\nID: ${merchant.id}`)}`}
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

      {/* ─── Offline Alert Banner ──────────────────────────────────────────── */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-center gap-3 px-4 py-3 bg-rose-600/95 backdrop-blur-md border-b border-rose-500/50 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
          <p className="text-white text-xs font-black uppercase tracking-widest">
            ⚠️ No Internet Connection — Real-time pager notifications paused. Reconnect to resume.
          </p>
        </div>
      )}

      {/* ─── Subscription Expired Overlay ────────────────────────────────────── */}
      {isExpired && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-[#0a0b0f] border border-rose-500/30 rounded-[32px] p-8 shadow-2xl shadow-rose-500/10 text-center animate-bounce-in">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
              <Zap size={32} className="text-rose-400" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Subscription Expired</h2>
            <p className="text-slate-400 text-sm mb-2">
              Your <span className="text-white font-bold capitalize">{merchant?.plan_type}</span> plan expired on{' '}
              <span className="text-rose-400 font-bold">
                {merchant?.expiry_date ? new Date(merchant.expiry_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
              </span>.
            </p>
            <p className="text-slate-500 text-xs mb-8">Renew your plan to continue issuing pagers and receiving orders.</p>
            <button
              onClick={() => { setOpenSection('subscription'); setIsSettingsOpen(true) }}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
            >
              <Zap size={16} /> Renew Subscription
            </button>
            <button
              onClick={handleLogout}
              className="mt-4 text-slate-600 hover:text-white text-xs font-bold uppercase tracking-widest"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--card-border)' }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={32} showText={false} />
            <div className="flex flex-col justify-center flex-1 min-w-0 ml-1">
              <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">Beepme</span>
              {merchant && (
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-bold text-white truncate leading-none">
                    {merchant.name}
                  </h1>
                  {merchant.plan_type === 'pro' && (
                    <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-[9px] font-black uppercase tracking-widest border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                      PRO
                    </span>
                  )}
                </div>
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

        {/* Tab Navigation */}
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-6 overflow-x-auto no-scrollbar border-t" style={{ borderColor: 'var(--card-border)' }}>
          <button
            onClick={() => setActiveTab('home')}
            className={`h-full flex items-center gap-2 text-sm font-bold border-b-2 transition-all px-2 whitespace-nowrap ${
              activeTab === 'home' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Smartphone size={16} /> Home / Orders
          </button>
          <button
            onClick={() => setActiveTab('promosi')}
            className={`h-full flex items-center gap-2 text-sm font-bold border-b-2 transition-all px-2 whitespace-nowrap ${
              activeTab === 'promosi' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Zap size={16} /> Promosi (Ads Editor)
            {merchant?.plan_type === 'pro' && (
              <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase tracking-widest border border-yellow-500/20 ml-1">PRO</span>
            )}
          </button>
        </div>
      </header>

      {activeTab === 'home' ? (
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
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Monthly Orders Processed
                  </span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
                    {monthlyCount} / <InfinityIcon size={14} className="text-indigo-400 font-black inline" />
                  </span>
                </div>
              </div>

              {/* Latest Receipts List */}
              {latestReceipts.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl animate-fade-in" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Latest from Loyverse</h4>
                    <button onClick={() => setLatestReceipts([])} className="text-slate-500 hover:text-white"><X size={14}/></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {latestReceipts.slice(0, 6).map((r, i) => (
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
                          disabled={!session.is_confirmed || cooldowns[session.id]}
                          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-20 disabled:grayscale whitespace-nowrap ${cooldowns[session.id] ? 'animate-pulse' : ''}`}
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                        >
                          <Phone size={16} />
                          {cooldowns[session.id] ? 'WAIT...' : (session.status === 'called' ? 'RECALL' : 'CALL')}
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
      ) : (
        <main className="max-w-5xl mx-auto px-4 py-6">
          <AdsBuilder 
            merchant={merchant} 
            isPremiumActive={isPremiumActive}
            onUpgrade={() => handleUpgrade('pro', 99)}
            onUpdate={(updatedMerchant) => {
              setMerchant(updatedMerchant)
              fetchMerchant() // Refresh to sync
            }} 
          />
        </main>
      )}

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
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Registered Email</label>
                      <input
                        type="text"
                        value={userEmail}
                        readOnly
                        disabled
                        className="w-full p-3.5 rounded-xl bg-[#050608] border border-white/5 text-slate-400 outline-none text-sm cursor-not-allowed"
                      />
                    </div>

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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Negeri (State)</label>
                        <select
                          value={settingsState}
                          onChange={(e) => setSettingsState(e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm cursor-pointer"
                        >
                          <option value="">Pilih Negeri...</option>
                          {MALAYSIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Kategori Restoran</label>
                        <select
                          value={settingsCategory}
                          onChange={(e) => setSettingsCategory(e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm cursor-pointer"
                        >
                          <option value="">Pilih Kategori...</option>
                          {MERCHANT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Logo Kedai</label>
                      <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0b0f] border border-white/10">
                        <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {settingsLogo ? (
                            <img src={settingsLogo} alt="Logo Preview" className="w-full h-full object-cover" />
                          ) : (
                            <Store size={24} className="text-slate-700" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            id="logo-upload"
                            className="hidden"
                            disabled={uploadingLogo}
                          />
                          <label 
                            htmlFor="logo-upload"
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${
                              uploadingLogo ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                            }`}
                          >
                            {uploadingLogo ? <Loader2 size={12} className="animate-spin" /> : 'Pilih Gambar'}
                          </label>
                          <p className="text-[9px] text-slate-600 mt-2">PNG, JPG up to 2MB. 1:1 ratio recommended.</p>
                        </div>
                        {settingsLogo && (
                          <button 
                            type="button"
                            onClick={() => setSettingsLogo('')}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* 2. Custom Branding */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('branding')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Custom Branding</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'branding' ? 'rotate-90' : ''}`} />
                </button>
                
                {openSection === 'branding' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Pager Theme Color</label>
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-xl border border-white/10 shadow-lg shrink-0" 
                          style={{ backgroundColor: settingsThemeColor }}
                        />
                        <div className="flex-1 grid grid-cols-5 gap-2">
                          {['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setSettingsThemeColor(color)}
                              className={`h-8 rounded-lg border transition-all ${settingsThemeColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <input 
                        type="color" 
                        value={settingsThemeColor}
                        onChange={(e) => setSettingsThemeColor(e.target.value)}
                        className="w-full h-10 rounded-xl bg-[#0a0b0f] border border-white/10 p-1 cursor-pointer"
                      />
                      <p className="text-[9px] text-slate-600">Pilih warna mengikut tema kedai anda.</p>
                    </div>
                  </div>
                )}
              </section>

              {/* 3. Upsell & Promosi */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('upsell')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Upsell & Promosi</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'upsell' ? 'rotate-90' : ''}`} />
                </button>
                
                {openSection === 'upsell' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    {!isPremiumActive ? (
                      <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-center space-y-3">
                        <div className="text-2xl">🔒</div>
                        <h4 className="text-white font-bold text-sm">Beepme Premium Feature</h4>
                        <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                          Urus promosi & banner anda sendiri di halaman wait customer menggunakan Ads Editor interaktif kami. Sila langgan Beepme Premium.
                        </p>
                        <button
                          type="button"
                          onClick={() => setOpenSection('subscription')}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all shadow-md shadow-indigo-600/20"
                        >
                          Upgrade Sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center mx-auto border border-indigo-500/30 shadow-xl shadow-indigo-500/10">
                          <Smartphone size={32} className="text-indigo-400" />
                        </div>
                        <div>
                          <h4 className="text-white font-bold text-lg mb-1">Visual Ads Editor</h4>
                          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                            Bina dan edit iklan promosi anda secara interaktif. Apa yang anda lihat adalah apa yang pelanggan nampak (WYSIWYG).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSettingsOpen(false);
                            setActiveTab('promosi');
                          }}
                          className="w-full py-4 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                          Buka Ads Editor <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
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
                        {webhookUrl || `${baseUrl}/api/webhooks/loyverse?merchant_id=${merchant?.id}&token=...`}
                      </code>
                      <p className="text-[9px] text-slate-600">⚠️ Copy this full URL into your Loyverse webhook settings. The token secures this endpoint.</p>
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
                          <span className={`w-2 h-2 rounded-full ${isPremiumActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                          <span className="text-white font-bold uppercase text-sm">
                            Beepme {isPremiumActive ? 'Premium' : 'Free'}
                          </span>
                        </div>
                        {merchant?.expiry_date && isPremiumActive && (
                          <span className="text-[10px] text-slate-500 mt-1">Active until {new Date(merchant.expiry_date).toLocaleDateString()}</span>
                        )}
                        {merchant?.expiry_date && !isPremiumActive && (
                          <span className="text-[10px] text-rose-500 mt-1">Expired on {new Date(merchant.expiry_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      {isPremiumActive && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest">Active</span>
                      )}
                    </div>

                    {/* Plan Selector */}
                    <div className="grid grid-cols-1 gap-3">
                      {/* Free Plan Card */}
                      <div className={`p-4 rounded-2xl border transition-all ${!isPremiumActive ? 'bg-white/[0.05] border-white/20' : 'bg-white/[0.02] border-white/5 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-white font-bold text-sm">Always Free</h3>
                            <p className="text-[10px] text-slate-500">Essential paging system</p>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">RM0</span>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">/forever</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 mb-2">
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-slate-500" /> Unlimited Orders
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-slate-500" /> Digital Pager UI (Ad-Supported)
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-slate-500" /> Loyverse POS Integration
                          </li>
                        </ul>
                        {!isPremiumActive && (
                          <div className="mt-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Plan</span>
                          </div>
                        )}
                      </div>

                      {/* Premium Plan Card */}
                      <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${isPremiumActive ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-indigo-500/5 border-indigo-500/20'}`}>
                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black px-2 py-1 uppercase rounded-bl-lg">Premium</div>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-white font-bold text-sm">Beepme Premium</h3>
                            <p className="text-[10px] text-slate-500">For premium brand experience</p>
                          </div>
                          <div className="text-right">
                            <span className="text-white font-bold text-sm">RM39</span>
                            <p className="text-[8px] text-slate-500 uppercase font-bold">/month</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 mb-4">
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-indigo-500" /> 100% Ad-Free waiting page
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-indigo-500" /> Custom branding, logo & colors
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-indigo-500" /> Custom Upsell Promotion (Video/Image)
                          </li>
                          <li className="flex items-center gap-2 text-[10px] text-slate-400">
                            <CheckCircle size={10} className="text-indigo-500" /> WhatsApp Admin Approval
                          </li>
                        </ul>
                        {!isPremiumActive ? (
                          <button 
                            type="button"
                            onClick={() => handleUpgrade('pro', 39)}
                            disabled={savingSettings}
                            className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                          >
                            {savingSettings ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                            Upgrade to Premium (RM39)
                          </button>
                        ) : (
                          <div className="mt-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center">
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Plan</span>
                          </div>
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
                    <button 
                      onClick={handleLogout} 
                      type="button"
                      className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 font-bold text-sm hover:bg-rose-500/10 transition-all active:scale-95"
                    >
                      <LogOut size={16} />
                      Sign Out from Beepme
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
