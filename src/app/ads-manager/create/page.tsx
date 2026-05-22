'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Megaphone, MapPin, DollarSign,
  CheckCircle, Loader2, Globe, AlertCircle, ArrowRight
} from 'lucide-react'
import { AdsBuilder } from '@/components/AdsBuilder'

const supabase = createClient()

const CATEGORIES = [
  'Fast Food', 'Casual Dining', 'Cafe & Coffee', 'Fine Dining',
  'Seafood', 'Nasi Kandar', 'Mamak', 'Hawker & Street Food',
  'Bakery & Desserts', 'Other F&B', 'Retail', 'Bank & Finance',
  'Entertainment', 'Health & Wellness', 'Other',
]

type FormData = {
  title: string
  description: string
  video_url: string
  fallback_image_url: string
  link_url: string
  cta_text: string
  category: string
  // Geo
  target_location_name: string
  target_lat: string
  target_lng: string
  radius_km: string
  target_all: boolean
  // Bidding
  cpv_bid: string
}

const STEPS = [
  { id: 1, label: 'Creative', icon: Megaphone },
  { id: 2, label: 'Targeting', icon: MapPin },
  { id: 3, label: 'Bidding', icon: DollarSign },
]

const inputClass = `
  w-full px-4 py-3 rounded-xl text-white text-sm font-medium outline-none transition-all
  bg-white/5 border border-white/10 placeholder:text-slate-600
  focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30
`

const labelClass = 'block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1'

export default function CreateCampaignPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    video_url: '',
    fallback_image_url: '',
    link_url: '',
    cta_text: 'Learn More',
    category: '',
    target_location_name: '',
    target_lat: '',
    target_lng: '',
    radius_km: '5',
    target_all: false,
    cpv_bid: '0.05',
  })

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      const { data: prof } = await supabase
        .from('advertiser_profiles')
        .select('wallet_balance')
        .eq('user_id', user.id)
        .single()
      if (prof) setWalletBalance(prof.wallet_balance)
    }
    init()
  }, [router])

  const handleUploadImage = async (blob: Blob): Promise<string> => {
    if (!userId) throw new Error('User not authenticated')
    const fileName = `campaigns/${userId}/${Date.now()}.webp`
    const { error: uploadError } = await supabase.storage
      .from('merchant-logos')
      .upload(fileName, blob, {
        upsert: true,
        contentType: 'image/webp'
      })
    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('merchant-logos')
      .getPublicUrl(fileName)
    return publicUrl
  }

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Pelayar web anda tidak menyokong akses GPS.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('target_lat', pos.coords.latitude.toString())
        set('target_lng', pos.coords.longitude.toString())
        setLocating(false)
      },
      (err) => {
        console.error(err)
        alert('Gagal mendapatkan lokasi semasa. Sila pastikan kebenaran GPS/lokasi dibenarkan dalam pelayar web anda.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validateStep1 = () => {
    const e: typeof errors = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.category) e.category = 'Please select a category'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = () => {
    if (form.target_all) return true
    const e: typeof errors = {}
    if (!form.target_location_name.trim()) e.target_location_name = 'Location name is required'
    if (!form.target_lat.trim()) e.target_lat = 'Latitude is required'
    if (!form.target_lng.trim()) e.target_lng = 'Longitude is required'
    if (!form.radius_km.trim() || Number(form.radius_km) <= 0) e.radius_km = 'Radius must be > 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const validateStep3 = () => {
    const e: typeof errors = {}
    if (!form.cpv_bid || Number(form.cpv_bid) < 0.01) e.cpv_bid = 'Minimum bid is RM 0.01'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep(s => s + 1)
  }

  const prevStep = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    if (!validateStep3()) return
    if (!userId) return
    setSubmitting(true)

    const payload: Record<string, unknown> = {
      advertiser_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      video_url: form.video_url.trim() || null,
      image_url: form.fallback_image_url.trim() || null,
      link_url: form.link_url.trim() || null,
      cta_text: form.cta_text.trim() || 'Learn More',
      category: form.category,
      cpv_bid: Number(form.cpv_bid),
      status: 'pending_review',
    }

    if (!form.target_all) {
      payload.target_latitude = Number(form.target_lat)
      payload.target_longitude = Number(form.target_lng)
      payload.target_radius_km = Number(form.radius_km)
    }

    const { error } = await supabase.from('ads').insert(payload)

    if (error) {
      alert('Failed to create campaign: ' + error.message)
      setSubmitting(false)
      return
    }

    router.push('/ads-manager?success=1')
  }

  const pageVariants: any = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
  }

  return (
    <div className="min-h-screen" style={{ background: '#020203' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/3 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/ads-manager')}
          className="flex items-center gap-2 text-slate-500 hover:text-white text-sm font-medium transition-colors mb-8"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </button>

        {/* Page Title */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
            <Megaphone size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Create Campaign</h1>
            <p className="text-xs text-slate-500">Reach diners across Beepme restaurants</p>
          </div>
        </div>

        {/* Step Progress */}
        <div className="flex items-center mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <motion.div
                    animate={{
                      background: isDone ? '#059669' : isActive ? '#4f46e5' : 'rgba(255,255,255,0.05)',
                      borderColor: isDone ? '#059669' : isActive ? '#4f46e5' : 'rgba(255,255,255,0.1)',
                    }}
                    className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
                  >
                    {isDone ? (
                      <CheckCircle size={18} className="text-white" />
                    ) : (
                      <Icon size={18} className={isActive ? 'text-white' : 'text-slate-600'} />
                    )}
                  </motion.div>
                  <span className={`text-xs font-semibold hidden sm:block ${isActive ? 'text-indigo-400' : isDone ? 'text-emerald-400' : 'text-slate-600'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px mx-3 mb-5" style={{ background: step > s.id ? 'rgba(5,150,105,0.4)' : 'rgba(255,255,255,0.06)' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step Content Card */}
        <div className="rounded-3xl border border-white/8 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d0e1a 0%, #0a0b0f 100%)' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-8 space-y-6"
              >
                <div>
                  <h2 className="text-lg font-black text-white mb-1">Ad Creative</h2>
                  <p className="text-sm text-slate-500">Design your ad and select a category</p>
                </div>

                {/* Category */}
                <div>
                  <label className={labelClass}>Category <span className="text-rose-500">*</span></label>
                  <select
                    className={inputClass}
                    value={form.category}
                    onChange={e => set('category', e.target.value)}
                  >
                    <option value="" disabled>Select a category...</option>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.category}</p>}
                </div>

                {/* Video URL */}
                <div>
                  <label className={labelClass}>Video URL <span className="text-slate-600 normal-case font-normal">(YouTube, TikTok, or direct)</span></label>
                  <input
                    type="url"
                    className={inputClass}
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.video_url}
                    onChange={e => set('video_url', e.target.value)}
                  />
                </div>

                {/* Visual Ads Editor */}
                <div className="pt-6 border-t border-white/5">
                  <label className={labelClass + ' text-center block mb-6 text-indigo-400 font-black'}>Visual Ads Builder</label>
                  {errors.title && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
                      <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
                      <span className="font-bold">{errors.title}</span>
                    </div>
                  )}
                  <AdsBuilder
                    imageUrl={form.fallback_image_url}
                    title={form.title}
                    description={form.description}
                    ctaText={form.cta_text}
                    linkUrl={form.link_url}
                    onChange={({ imageUrl, title, description, ctaText, linkUrl }) => {
                      setForm(prev => ({
                        ...prev,
                        fallback_image_url: imageUrl,
                        title,
                        description,
                        cta_text: ctaText,
                        link_url: linkUrl
                      }))
                      if (title.trim() && errors.title) {
                        setErrors(prev => ({ ...prev, title: undefined }))
                      }
                    }}
                    onUploadImage={handleUploadImage}
                    showSaveButton={false}
                    isPremiumActive={true}
                    editorTitle="Ad Creative Design"
                    videoUrl={form.video_url}
                  />
                </div>

                <button
                  onClick={nextStep}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20 mt-2"
                >
                  Next: Geo-Targeting
                  <ChevronRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-8 space-y-5"
              >
                <div>
                  <h2 className="text-lg font-black text-white mb-1">Geo-Targeting</h2>
                  <p className="text-sm text-slate-500">Define where your ad will be shown</p>
                </div>

                {/* Target All */}
                <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 cursor-pointer hover:border-indigo-500/30 transition-all">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${form.target_all ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}
                    onClick={() => set('target_all', !form.target_all)}
                  >
                    {form.target_all && <CheckCircle size={12} className="text-white" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-indigo-400" />
                      <span className="text-white font-semibold text-sm">Target All Locations</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">Show your ad to all Beepme users regardless of location</p>
                  </div>
                </label>

                {!form.target_all && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-5"
                  >
                    {/* Helper */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
                      <AlertCircle size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
                      <p className="text-slate-400 text-xs leading-relaxed">
                        You can find coordinates by right-clicking any location on{' '}
                        <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">Google Maps</a>{' '}
                        and selecting the coordinates shown.
                      </p>
                    </div>

                    {/* Location Name */}
                    <div>
                      <label className={labelClass}>Target Location Name <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Kuala Lumpur City Centre"
                        value={form.target_location_name}
                        onChange={e => set('target_location_name', e.target.value)}
                      />
                      {errors.target_location_name && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.target_location_name}</p>}
                    </div>

                    {/* Auto location button */}
                    <div>
                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={locating}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-indigo-500/20 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {locating ? (
                          <>
                            <Loader2 size={14} className="animate-spin text-indigo-400" />
                            <span>Mendapatkan Lokasi Semasa...</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={14} className="text-indigo-400" />
                            <span>Gunakan Lokasi Semasa Saya</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Lat / Lng */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>Latitude <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          step="any"
                          className={inputClass}
                          placeholder="3.1390"
                          value={form.target_lat}
                          onChange={e => set('target_lat', e.target.value)}
                        />
                        {errors.target_lat && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.target_lat}</p>}
                      </div>
                      <div>
                        <label className={labelClass}>Longitude <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          step="any"
                          className={inputClass}
                          placeholder="101.6869"
                          value={form.target_lng}
                          onChange={e => set('target_lng', e.target.value)}
                        />
                        {errors.target_lng && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.target_lng}</p>}
                      </div>
                    </div>

                    {/* Radius */}
                    <div>
                      <label className={labelClass}>Radius (km) <span className="text-rose-500">*</span></label>
                      <input
                        type="number"
                        min="0.5"
                        step="0.5"
                        className={inputClass}
                        placeholder="5"
                        value={form.radius_km}
                        onChange={e => set('radius_km', e.target.value)}
                      />
                      {errors.radius_km && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.radius_km}</p>}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={prevStep}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white font-bold transition-all"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    Next: Bidding
                    <ChevronRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                variants={pageVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="p-8 space-y-6"
              >
                <div>
                  <h2 className="text-lg font-black text-white mb-1">Bidding & Review</h2>
                  <p className="text-sm text-slate-500">Set your bid and confirm the details</p>
                </div>

                {/* CPV Bid */}
                <div>
                  <label className={labelClass}>CPV Bid – RM per view <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">RM</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className={inputClass + ' pl-12'}
                      placeholder="0.05"
                      value={form.cpv_bid}
                      onChange={e => set('cpv_bid', e.target.value)}
                    />
                  </div>
                  {errors.cpv_bid && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.cpv_bid}</p>}
                  <p className="text-xs text-slate-600 mt-1.5 ml-1">Minimum RM 0.01 · Higher bids = higher placement priority</p>
                </div>

                {/* Wallet Balance */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/8">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/15 flex items-center justify-center">
                    <DollarSign size={16} className="text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Current Wallet Balance</p>
                    <p className="text-white font-bold">RM {walletBalance.toFixed(2)}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-2xl border border-white/8 overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/8 bg-white/2">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Campaign Summary</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { label: 'Title', value: form.title || '—' },
                      { label: 'Category', value: form.category || '—' },
                      { label: 'CTA', value: form.cta_text || '—' },
                      { label: 'Video', value: form.video_url ? '✓ Set' : '—' },
                      { label: 'Target', value: form.target_all ? 'All Locations' : form.target_location_name || '—' },
                      { label: 'Radius', value: form.target_all ? 'Global' : `${form.radius_km} km` },
                      { label: 'Bid', value: `RM ${Number(form.cpv_bid).toFixed(2)}/view` },
                      { label: 'Status', value: 'Pending Review' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-5 py-3">
                        <span className="text-xs text-slate-500">{row.label}</span>
                        <span className="text-sm text-white font-medium text-right max-w-[55%] truncate">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 text-center">
                  Your campaign will be reviewed by our team before going live. Usually within 24 hours.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={prevStep}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white font-bold transition-all"
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
                  >
                    {submitting ? (
                      <><Loader2 size={18} className="animate-spin" />Submitting...</>
                    ) : (
                      <><ArrowRight size={18} />Submit Campaign</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
