'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  X, Settings, Store, Zap, CheckCircle, DollarSign, Megaphone,
  LogOut, Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

interface SettingsModalProps {
  isOpen: boolean
  initialSection?: string | null
  merchant: Merchant
  userEmail: string
  partnerProfile: any
  fetchingPartner: boolean
  activeMfaFactor: any
  baseUrl: string
  isPremiumActive: boolean
  onClose: () => void
  onSaved: (updatedMerchant: Merchant) => void
  onUpgrade: () => void
  onLogout: () => void
  fetchMerchant: () => void
  fetchPartnerProfile: () => void
}

export function SettingsModal({
  isOpen,
  initialSection = null,
  merchant,
  userEmail,
  partnerProfile,
  fetchingPartner,
  activeMfaFactor,
  baseUrl,
  isPremiumActive,
  onClose,
  onSaved,
  onUpgrade,
  onLogout,
  fetchMerchant,
  fetchPartnerProfile,
}: SettingsModalProps) {
  const router = useRouter()

  // --- Form State (lives here, not in parent) ---
  const [openSection, setOpenSection] = useState<string | null>(initialSection)
  const [settingsName, setSettingsName] = useState('')
  const [settingsLogo, setSettingsLogo] = useState('')
  const [settingsLoyverseToken, setSettingsLoyverseToken] = useState('')
  const [settingsGmbUrl, setSettingsGmbUrl] = useState('')
  const [settingsThemeColor, setSettingsThemeColor] = useState('#6366f1')
  const [settingsState, setSettingsState] = useState('')
  const [settingsCategory, setSettingsCategory] = useState('')
  const [settingsUpsellTitle, setSettingsUpsellTitle] = useState('')
  const [settingsUpsellLinkUrl, setSettingsUpsellLinkUrl] = useState('')
  const [settingsUpsellVideoUrl, setSettingsUpsellVideoUrl] = useState('')
  const [settingsUpsellImageUrl, setSettingsUpsellImageUrl] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Partner form state
  const [partnerRefCode, setPartnerRefCode] = useState('')
  const [partnerBankName, setPartnerBankName] = useState('')
  const [partnerBankAccountNo, setPartnerBankAccountNo] = useState('')
  const [partnerBankAccountName, setPartnerBankAccountName] = useState('')
  const [partnerIcNumber, setPartnerIcNumber] = useState('')
  const [partnerAddress, setPartnerAddress] = useState('')

  // MFA state (enroll flow inside settings)
  const [mfaEnrollData, setMfaEnrollData] = useState<any>(null)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState('')

  // Sync form state when modal opens / merchant changes
  useEffect(() => {
    if (isOpen && merchant) {
      setSettingsName(merchant.name || '')
      setSettingsLogo(merchant.logo_url || '')
      setSettingsLoyverseToken(merchant.loyverse_token || '')
      setSettingsGmbUrl(merchant.gmb_url || '')
      setSettingsThemeColor(merchant.theme_color || '#6366f1')
      setSettingsState(merchant.state || '')
      setSettingsCategory(merchant.category || '')
      setSettingsUpsellTitle(merchant.upsell_title || '')
      setSettingsUpsellLinkUrl(merchant.upsell_link_url || '')
      setSettingsUpsellVideoUrl(merchant.upsell_video_url || '')
      setSettingsUpsellImageUrl(merchant.upsell_image_url || '')
    }
  }, [isOpen, merchant])

  // Sync initial section when prop changes (e.g. opened from expired overlay)
  useEffect(() => {
    if (isOpen) {
      setOpenSection(initialSection ?? null)
    }
  }, [isOpen, initialSection])

  if (!isOpen) return null

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section)
  }

  const hasSettingsChanged = () => {
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

  const handleClose = () => {
    if (hasSettingsChanged()) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) return
    }
    onClose()
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    try {
      const img = new Image()
      const reader = new FileReader()

      const compressedFile = await new Promise<Blob>((resolve, reject) => {
        reader.onload = (event) => {
          img.onload = () => {
            const canvas = document.createElement('canvas')
            const size = 512
            canvas.width = size
            canvas.height = size
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Failed to get canvas context'))
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

      const { error: uploadError } = await supabase.storage
        .from('merchant-logos')
        .upload(filePath, compressedFile, { upsert: true, contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('merchant-logos')
        .getPublicUrl(filePath)

      if (merchant.logo_url && merchant.logo_url !== publicUrl) {
        const bucketMatch = merchant.logo_url.split('/merchant-logos/')
        if (bucketMatch.length === 2) {
          await supabase.storage.from('merchant-logos').remove([bucketMatch[1]])
        }
      }

      setSettingsLogo(publicUrl)
    } catch (error: any) {
      console.error('Error uploading logo:', error)
      alert('Error uploading: ' + error.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!settingsName.trim()) return
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
        upsell_image_url: settingsUpsellImageUrl.trim() || null,
      })
      .eq('id', merchant.id)

    if (error) {
      console.error('Error saving settings:', error)
      alert('Gagal simpan: ' + error.message)
    } else {
      onSaved({
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
        upsell_image_url: settingsUpsellImageUrl.trim() || null,
      })
      onClose()
      fetchMerchant()
    }
    setSavingSettings(false)
  }

  const registerAsPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!partnerRefCode.trim()) {
      alert('Sila masukkan kod rujukan.')
      return
    }
    setSavingSettings(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingSettings(false); return }

    const cleanRef = partnerRefCode.trim().toUpperCase()
    const { data: existingRef } = await supabase
      .from('partners')
      .select('id')
      .eq('referral_code', cleanRef)
      .maybeSingle()

    if (existingRef) {
      alert(`Kod rujukan "${cleanRef}" telah digunakan. Sila pilih kod lain.`)
      setSavingSettings(false)
      return
    }

    const { error } = await supabase.from('partners').insert({
      user_id: user.id,
      email: user.email,
      referral_code: cleanRef,
      bank_name: partnerBankName,
      bank_account_no: partnerBankAccountNo,
      bank_account_name: partnerBankAccountName,
      ic_number: partnerIcNumber,
      full_address: partnerAddress,
      is_active: false,
    })

    if (error) {
      alert('Gagal mendaftar: ' + error.message)
    } else {
      alert('Pendaftaran Rakan Kongsi berjaya! Permohonan anda sedang menunggu kelulusan Admin.')
      await fetchPartnerProfile()
    }
    setSavingSettings(false)
  }

  const enrollMfa = async () => {
    setMfaError('')
    try {
      const { data: factorsData, error: listError } = await supabase.auth.mfa.listFactors()
      if (!listError && factorsData?.all) {
        for (const factor of factorsData.all) {
          if (factor.status === 'unverified') {
            await supabase.auth.mfa.unenroll({ factorId: factor.id })
          }
        }
      }
    } catch (err) {
      console.error('Error cleaning up unverified factors:', err)
    }

    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
    if (error) { setMfaError(error.message); return }

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: data.id })
    if (challengeError) { setMfaError(challengeError.message); return }

    setMfaEnrollData({ ...data, challengeId: challengeData.id })
  }

  const verifyMfa = async () => {
    if (!mfaEnrollData || !mfaCode) return
    setMfaError('')
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaEnrollData.id,
      challengeId: mfaEnrollData.challengeId,
      code: mfaCode,
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

  const disableMfa = async () => {
    if (!activeMfaFactor) return
    if (!confirm('Adakah anda pasti mahu mematikan 2FA? Langkah ini akan mengurangkan tahap keselamatan akaun anda.')) return
    setMfaError('')
    const { error } = await supabase.auth.mfa.unenroll({ factorId: activeMfaFactor.id })
    if (error) {
      setMfaError(error.message)
    } else {
      alert('2FA telah dimatikan.')
      fetchMerchant()
    }
  }

  return (
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
          <button type="button" onClick={handleClose} className="text-slate-500 hover:text-white transition-colors p-2 -mr-2">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={saveSettings} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">

            {/* 1. Store Profile */}
            <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
              <button type="button" onClick={() => toggleSection('profile')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Store Profile</span>
                <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'profile' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'profile' && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Registered Email</label>
                    <input type="text" value={userEmail} readOnly disabled className="w-full p-3.5 rounded-xl bg-[#050608] border border-white/5 text-slate-400 outline-none text-sm cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Store Name</label>
                    <input type="text" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} placeholder="Nama Kedai" className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Negeri (State)</label>
                      <select value={settingsState} onChange={(e) => setSettingsState(e.target.value)} className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm cursor-pointer">
                        <option value="">Pilih Negeri...</option>
                        {MALAYSIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Kategori Restoran</label>
                      <select value={settingsCategory} onChange={(e) => setSettingsCategory(e.target.value)} className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm cursor-pointer">
                        <option value="">Pilih Kategori...</option>
                        {MERCHANT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Logo Kedai</label>
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0a0b0f] border border-white/10">
                      <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                        {settingsLogo ? <img src={settingsLogo} alt="Logo Preview" className="w-full h-full object-cover" /> : <Store size={24} className="text-slate-700" />}
                      </div>
                      <div className="flex-1">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} id="logo-upload" className="hidden" disabled={uploadingLogo} />
                        <label htmlFor="logo-upload" className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${uploadingLogo ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
                          {uploadingLogo ? <Loader2 size={12} className="animate-spin" /> : 'Pilih Gambar'}
                        </label>
                        <p className="text-[9px] text-slate-600 mt-2">PNG, JPG up to 2MB. 1:1 ratio recommended.</p>
                      </div>
                      {settingsLogo && (
                        <button type="button" onClick={() => setSettingsLogo('')} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all">
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
              <button type="button" onClick={() => toggleSection('branding')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Custom Branding</span>
                <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'branding' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'branding' && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Pager Theme Color</label>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl border border-white/10 shadow-lg shrink-0" style={{ backgroundColor: settingsThemeColor }} />
                      <div className="flex-1 grid grid-cols-5 gap-2">
                        {['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#ec4899'].map((color) => (
                          <button key={color} type="button" onClick={() => setSettingsThemeColor(color)}
                            className={`h-8 rounded-lg border transition-all ${settingsThemeColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'}`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <input type="color" value={settingsThemeColor} onChange={(e) => setSettingsThemeColor(e.target.value)} className="w-full h-10 rounded-xl bg-[#0a0b0f] border border-white/10 p-1 cursor-pointer" />
                    <p className="text-[9px] text-slate-600">Pilih warna mengikut tema kedai anda.</p>
                  </div>
                </div>
              )}
            </section>

            {/* 3. Integrations */}
            <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
              <button type="button" onClick={() => toggleSection('integrations')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Integrations</span>
                <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'integrations' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'integrations' && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Loyverse Access Token</label>
                    <input type="password" value={settingsLoyverseToken} onChange={(e) => setSettingsLoyverseToken(e.target.value)} placeholder="Personal Access Token..." className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">GMB Review URL</label>
                    <input type="text" value={settingsGmbUrl} onChange={(e) => setSettingsGmbUrl(e.target.value)} placeholder="https://g.page/..." className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                </div>
              )}
            </section>

            {/* 4. Subscription */}
            <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
              <button type="button" onClick={() => toggleSection('subscription')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Subscription Plan</span>
                <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'subscription' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'subscription' && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isPremiumActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                        <span className="text-white font-bold uppercase text-sm">Beepme {isPremiumActive ? 'Premium' : 'Free'}</span>
                      </div>
                      {merchant.expiry_date && isPremiumActive && (
                        <span className="text-[10px] text-slate-500 mt-1">Active until {new Date(merchant.expiry_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      )}
                      {merchant.expiry_date && !isPremiumActive && (
                        <span className="text-[10px] text-rose-500 mt-1">Expired on {new Date(merchant.expiry_date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      )}
                    </div>
                    {isPremiumActive && (
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-widest">Active</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Free Plan */}
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
                        <li className="flex items-center gap-2 text-[10px] text-slate-400"><CheckCircle size={10} className="text-slate-500" /> Unlimited Orders</li>
                        <li className="flex items-center gap-2 text-[10px] text-slate-400"><CheckCircle size={10} className="text-slate-500" /> Digital Pager UI (Ad-Supported)</li>
                        <li className="flex items-center gap-2 text-[10px] text-slate-400"><CheckCircle size={10} className="text-slate-500" /> Loyverse POS Integration</li>
                      </ul>
                      {!isPremiumActive && (
                        <div className="mt-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Current Plan</span>
                        </div>
                      )}
                    </div>

                    {/* Premium Plan */}
                    <div className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${isPremiumActive ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-indigo-500/5 border-indigo-500/20'}`}>
                      <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black px-2 py-1 uppercase rounded-bl-lg">Premium</div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-bold text-sm">Beepme Premium</h3>
                          <p className="text-[10px] text-slate-500">For premium brand experience</p>
                        </div>
                        <div className="text-right">
                          <span className="text-white font-bold text-sm">RM49</span>
                          <p className="text-[8px] text-slate-500 uppercase font-bold">/month</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5 mb-4">
                        <li className="flex items-center gap-2 text-[10px] text-slate-400"><CheckCircle size={10} className="text-indigo-500" /> 100% Ad-Free waiting page</li>
                        <li className="flex items-center gap-2 text-[10px] text-slate-400"><CheckCircle size={10} className="text-indigo-500" /> Custom branding, logo & colors</li>
                        <li className="flex items-center gap-2 text-[10px] text-slate-400"><CheckCircle size={10} className="text-indigo-500" /> Custom Upsell Promotion (Video/Image)</li>
                        <li className="flex items-center gap-2 text-[10px] text-slate-400"><CheckCircle size={10} className="text-indigo-500" /> WhatsApp Admin Approval</li>
                      </ul>
                      {!isPremiumActive ? (
                        <button type="button" onClick={onUpgrade} disabled={savingSettings}
                          className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                          {savingSettings ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                          Upgrade to Premium (RM49)
                        </button>
                      ) : (
                        <div className="mt-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-center">
                          <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Active Plan</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-600 italic px-1 text-center">*Secure checkout via Stripe. Card & FPX supported.</p>
                </div>
              )}
            </section>

            {/* 5. Affiliate Program */}
            <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
              <button type="button" onClick={() => toggleSection('affiliate')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Affiliate Program (Rakan Kongsi)</span>
                <DollarSign size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'affiliate' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'affiliate' && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in text-left">
                  {fetchingPartner ? (
                    <div className="text-center py-4 text-xs text-slate-500 animate-pulse">Memuatkan data partner...</div>
                  ) : partnerProfile ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Status Akaun</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${partnerProfile.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {partnerProfile.is_active ? 'Aktif' : 'Menunggu Kelulusan (Pending)'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {partnerProfile.is_active
                            ? 'Akaun anda aktif! Anda boleh mula berkongsi pautan rujukan untuk menjana komisen 30%.'
                            : 'Permohonan anda telah diterima dan sedang menunggu pengaktifan daripada Admin.'}
                        </p>
                      </div>
                      {partnerProfile.is_active ? (
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Pautan Rujukan Anda</label>
                            <div className="p-3 rounded-xl bg-black/40 border border-white/10 text-indigo-300 font-mono text-xs truncate select-all">
                              {baseUrl}/login?ref={partnerProfile.referral_code}
                            </div>
                          </div>
                          <a href="/partner/dashboard" target="_blank" className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                            <DollarSign size={16} /> Buka Dashboard Rakan Kongsi
                          </a>
                        </div>
                      ) : (
                        <a href={`https://wa.me/60194696158?text=${encodeURIComponent(`Salam Admin Beepme.pro! Saya baru mendaftar akaun Partner dengan e-mel: ${userEmail} dan memohon kod rujukan: ${partnerProfile.referral_code}. Sila bantu approve akaun saya.`)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-sm transition-all active:scale-95">
                          Hubungi Admin via WhatsApp
                        </a>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={registerAsPartner} className="space-y-4">
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Jana <strong>30% komisen berulang</strong> setiap bulan dengan merujuk pemilik restoran F&B lain ke Beepme.pro!
                      </p>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Kod Rujukan Diminta (Referral Code)</label>
                          <input type="text" required placeholder="Cth: MYCODE, TIKTOKPOS" value={partnerRefCode} onChange={(e) => setPartnerRefCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-xs font-mono uppercase" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Nama Bank</label>
                            <input type="text" required placeholder="Cth: Maybank" value={partnerBankName} onChange={(e) => setPartnerBankName(e.target.value)}
                              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-xs" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">No. Akaun Bank</label>
                            <input type="text" required placeholder="Cth: 1640123456" value={partnerBankAccountNo} onChange={(e) => setPartnerBankAccountNo(e.target.value)}
                              className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-xs" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Nama Pemilik Akaun Bank</label>
                          <input type="text" required placeholder="Nama penuh di akaun bank" value={partnerBankAccountName} onChange={(e) => setPartnerBankAccountName(e.target.value)}
                            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">No. Kad Pengenalan (IC)</label>
                          <input type="text" required placeholder="Cth: 900101141234" value={partnerIcNumber} onChange={(e) => setPartnerIcNumber(e.target.value)}
                            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-xs" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Alamat Penuh</label>
                          <textarea rows={2} placeholder="Alamat surat menyurat" value={partnerAddress} onChange={(e) => setPartnerAddress(e.target.value)}
                            className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-xs resize-none" />
                        </div>
                        <button type="submit" disabled={savingSettings}
                          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer">
                          {savingSettings ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                          Daftar Rakan Kongsi
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </section>

            {/* 6. Ad Network */}
            <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
              <button type="button" onClick={() => toggleSection('advertiser')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Ad Network / Ads Manager</span>
                <Megaphone size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'advertiser' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'advertiser' && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in">
                  <p className="text-xs text-slate-400 leading-relaxed text-left">
                    Reach diners at the point of hunger. Switch to the Advertiser Portal to create, top-up, and monitor your ad campaigns across Beepme pager devices.
                  </p>
                  <button type="button" onClick={() => router.push('/ads-manager')}
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-indigo-600/20">
                    <Megaphone size={16} /> Go to Ads Manager
                  </button>
                </div>
              )}
            </section>

            {/* 7. Account Control */}
            <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
              <button type="button" onClick={() => toggleSection('account')} className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Account Control</span>
                <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'account' ? 'rotate-90' : ''}`} />
              </button>
              {openSection === 'account' && (
                <div className="p-4 pt-0 space-y-4 animate-fade-in">
                  <button onClick={onLogout} type="button"
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 font-bold text-sm hover:bg-rose-500/10 transition-all active:scale-95">
                    <LogOut size={16} /> Sign Out from Beepme
                  </button>
                </div>
              )}
            </section>

          </div>

          {/* Footer Buttons */}
          <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
            <button onClick={handleClose} type="button" className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={savingSettings || !hasSettingsChanged()}
              className={`flex-[2] py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${savingSettings || !hasSettingsChanged() ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'}`}>
              {savingSettings && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
