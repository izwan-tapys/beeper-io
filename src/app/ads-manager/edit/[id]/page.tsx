'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, use, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Megaphone, MapPin, DollarSign,
  CheckCircle, Loader2, Globe, AlertCircle, ArrowRight,
  Search, ChevronDown, Check
} from 'lucide-react'
import { AdsBuilder } from '@/components/AdsBuilder'

const supabase = createClient()

const CATEGORIES = [
  'Retail & Shopping',
  'Bank & Finance',
  'Entertainment & Leisure',
  'Health & Wellness',
  'Automotive & Vehicles',
  'Education & Training',
  'Real Estate & Housing',
  'Travel & Tourism',
  'IT & Technology',
  'Beauty & Personal Care',
  'Professional Services',
  'Events & Weddings',
  'Fashion & Apparel',
  'Other',
]

const MALAYSIAN_STATES = [
  'Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Pahang', 'Negeri Sembilan',
  'Melaka', 'Kedah', 'Kelantan', 'Terengganu', 'Perlis', 'Sabah', 'Sarawak', 'Labuan', 'Putrajaya'
]

const MERCHANT_CATEGORIES = [
  'Fast Food', 'Casual Dining', 'Cafe & Coffee', 'Fine Dining', 'Seafood',
  'Nasi Kandar', 'Mamak', 'Hawker & Street Food', 'Bakery & Desserts',
  'Other F&B', 'Retail', 'Bank & Finance', 'Entertainment', 'Health & Wellness', 'Other'
]

let leafletPromise: Promise<any> | null = null

const loadLeaflet = () => {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise((resolve) => {
    if ((window as any).L) {
      resolve((window as any).L)
      return
    }

    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => {
      resolve((window as any).L)
    }
    document.head.appendChild(script)
  })

  return leafletPromise
}

type FormData = {
  title: string
  description: string
  video_url: string
  fallback_image_url: string
  link_url: string
  cta_text: string
  category: string
  // Targeting
  target_states: string[]
  target_categories: string[]
  gps_enabled: boolean
  target_location_name: string
  target_lat: string
  target_lng: string
  radius_km: string
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

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [fetchingAd, setFetchingAd] = useState(true)
  const [adError, setAdError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [locating, setLocating] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')

  // State multi-select targeting
  const [isStatesOpen, setIsStatesOpen] = useState(false)
  const [stateSearch, setStateSearch] = useState('')
  const [isTargetCatsOpen, setIsTargetCatsOpen] = useState(false)
  const [targetCatSearch, setTargetCatSearch] = useState('')

  // Geocoding & Nominatim
  const [addressSearch, setAddressSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchingAddress, setSearchingAddress] = useState(false)

  // Map references
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerInstanceRef = useRef<any>(null)
  const circleInstanceRef = useRef<any>(null)

  const [form, setForm] = useState<FormData>({
    title: '',
    description: '',
    video_url: '',
    fallback_image_url: '',
    link_url: '',
    cta_text: 'Learn More',
    category: '',
    target_states: [],
    target_categories: [],
    gps_enabled: false,
    target_location_name: '',
    target_lat: '',
    target_lng: '',
    radius_km: '5',
    cpv_bid: '0.05',
  })

  const filteredCategories = CATEGORIES.filter(c =>
    c.toLowerCase().includes(categorySearch.toLowerCase())
  )

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.replace('/login'); return }
        setUserId(user.id)

        // Fetch wallet balance
        const { data: prof } = await supabase
          .from('advertiser_profiles')
          .select('wallet_balance')
          .eq('user_id', user.id)
          .single()
        if (prof) setWalletBalance(prof.wallet_balance)

        // Fetch ad details
        const { data: adData, error: adFetchError } = await supabase
          .from('ads')
          .select('*')
          .eq('id', id)
          .single()

        if (adFetchError || !adData) {
          setAdError('Campaign not found or you do not have permission to view it.')
          setFetchingAd(false)
          return
        }

        if (adData.advertiser_id !== user.id) {
          setAdError('You do not have permission to edit this campaign.')
          setFetchingAd(false)
          return
        }

        // Pre-fill form state
        setForm({
          title: adData.title || '',
          description: adData.description || '',
          video_url: adData.video_url || '',
          fallback_image_url: adData.image_url || '',
          link_url: adData.link_url || '',
          cta_text: adData.cta_text || 'Learn More',
          category: adData.category || '',
          target_states: adData.target_states || [],
          target_categories: adData.target_categories || [],
          gps_enabled: !!adData.target_latitude,
          target_location_name: adData.target_latitude ? (adData.target_location_name || 'Targeted Area') : '',
          target_lat: adData.target_latitude ? adData.target_latitude.toString() : '',
          target_lng: adData.target_longitude ? adData.target_longitude.toString() : '',
          radius_km: adData.target_radius_km ? adData.target_radius_km.toString() : '5',
          cpv_bid: adData.cpv_bid ? adData.cpv_bid.toString() : '0.05',
        })
      } catch (err: any) {
        setAdError('An error occurred while loading the campaign: ' + err.message)
      } finally {
        setFetchingAd(false)
      }
    }
    init()
  }, [id, router])

  // Load Leaflet and construct the map
  useEffect(() => {
    let active = true

    if (form.gps_enabled) {
      const initMap = async () => {
        const L = await loadLeaflet()
        if (!active) return

        const DefaultIcon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
        L.Marker.prototype.options.icon = DefaultIcon

        const lat = parseFloat(form.target_lat) || 3.1390
        const lng = parseFloat(form.target_lng) || 101.6869
        const radius = parseFloat(form.radius_km) || 5

        if (!mapInstanceRef.current && mapContainerRef.current) {
          mapInstanceRef.current = L.map(mapContainerRef.current).setView([lat, lng], 12)
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(mapInstanceRef.current)

          markerInstanceRef.current = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current)
          
          circleInstanceRef.current = L.circle([lat, lng], {
            color: '#4f46e5',
            fillColor: '#4f46e5',
            fillOpacity: 0.15,
            radius: radius * 1000
          }).addTo(mapInstanceRef.current)

          mapInstanceRef.current.on('click', (e: any) => {
            const { lat: clickLat, lng: clickLng } = e.latlng
            setForm(prev => ({
              ...prev,
              target_lat: clickLat.toFixed(6),
              target_lng: clickLng.toFixed(6)
            }))
          })

          markerInstanceRef.current.on('dragend', () => {
            const pos = markerInstanceRef.current.getLatLng()
            setForm(prev => ({
              ...prev,
              target_lat: pos.lat.toFixed(6),
              target_lng: pos.lng.toFixed(6)
            }))
          })
          
          setMapLoaded(true)
        } else if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng])
          if (markerInstanceRef.current) {
            markerInstanceRef.current.setLatLng([lat, lng])
          }
          if (circleInstanceRef.current) {
            circleInstanceRef.current.setLatLng([lat, lng])
            circleInstanceRef.current.setRadius(radius * 1000)
          }
        }
      }

      initMap()
    } else {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerInstanceRef.current = null
        circleInstanceRef.current = null
      }
      setMapLoaded(false)
    }

    return () => {
      active = false
    }
  }, [form.gps_enabled, form.target_lat, form.target_lng, form.radius_km])

  const toggleGps = () => {
    const nextVal = !form.gps_enabled
    setForm(prev => {
      const updates: Partial<FormData> = { gps_enabled: nextVal }
      if (nextVal) {
        if (!prev.target_lat) updates.target_lat = '3.1390'
        if (!prev.target_lng) updates.target_lng = '101.6869'
        if (!prev.target_location_name) updates.target_location_name = 'Kuala Lumpur'
      }
      return { ...prev, ...updates }
    })
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

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

    // Delete old image if it exists and upload was successful
    if (form.fallback_image_url && form.fallback_image_url !== publicUrl) {
      const bucketMatch = form.fallback_image_url.split('/merchant-logos/');
      if (bucketMatch.length === 2) {
        await supabase.storage.from('merchant-logos').remove([bucketMatch[1]]);
      }
    }

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

  const handleSearchAddress = async () => {
    if (!addressSearch.trim()) return
    setSearchingAddress(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(addressSearch)}`, {
        headers: { 'User-Agent': 'BeepmeAdManager/1.0' }
      })
      const data = await res.json()
      setSearchResults(data)
    } catch (err) {
      console.error(err)
      alert('Gagal mencari alamat. Sila cuba lagi.')
    } finally {
      setSearchingAddress(false)
    }
  }

  const handleSelectAddress = (result: any) => {
    const lat = parseFloat(result.lat)
    const lon = parseFloat(result.lon)
    setForm(prev => ({
      ...prev,
      target_location_name: result.display_name,
      target_lat: lat.toFixed(6),
      target_lng: lon.toFixed(6)
    }))
    setSearchResults([])
    setAddressSearch('')
  }

  const validateStep2 = () => {
    if (!form.gps_enabled) return true
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

    try {
      const response = await fetch('/api/ads/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          title: form.title,
          description: form.description,
          video_url: form.video_url,
          fallback_image_url: form.fallback_image_url,
          link_url: form.link_url,
          cta_text: form.cta_text,
          category: form.category,
          target_lat: form.target_lat,
          target_lng: form.target_lng,
          radius_km: form.radius_km,
          target_all: !form.gps_enabled,
          cpv_bid: form.cpv_bid,
          target_states: form.target_states.length > 0 ? form.target_states : null,
          target_categories: form.target_categories.length > 0 ? form.target_categories : null,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        alert('Failed to update campaign: ' + (result.error || 'Unknown error'))
        setSubmitting(false)
        return
      }

      router.push('/ads-manager?success=2')
    } catch (err: any) {
      alert('Error updating campaign: ' + err.message)
      setSubmitting(false)
    }
  }

  const pageVariants: any = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
  }

  if (fetchingAd) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020203' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
            <Loader2 size={32} className="text-indigo-400 animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading campaign details...</p>
        </div>
      </div>
    )
  }

  if (adError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020203' }}>
        <div className="max-w-md w-full px-6 py-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto">
            <AlertCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-white font-bold text-lg">Error</h2>
          <p className="text-slate-400 text-sm">{adError}</p>
          <button
            onClick={() => router.push('/ads-manager')}
            className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
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
            <h1 className="text-xl font-black text-white">Edit Campaign</h1>
            <p className="text-xs text-slate-500">Update campaign details and resubmit for moderation</p>
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
                <div className="relative">
                  <label className={labelClass}>Category <span className="text-rose-500">*</span></label>
                  
                  <div className="relative z-50">
                    <div className="relative">
                      <input
                        type="text"
                        className={inputClass + " pr-10 cursor-pointer"}
                        placeholder="Select or search category..."
                        value={isCategoryOpen ? categorySearch : form.category}
                        onChange={e => {
                          setCategorySearch(e.target.value)
                          if (!isCategoryOpen) setIsCategoryOpen(true)
                        }}
                        onFocus={() => {
                          setIsCategoryOpen(true)
                          setCategorySearch('')
                        }}
                        readOnly={!isCategoryOpen}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                        {isCategoryOpen ? <Search size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {isCategoryOpen && (
                      <div className="absolute left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl bg-[#0d0e16] border border-white/10 p-1.5 shadow-2xl z-50">
                        {filteredCategories.length === 0 ? (
                          <div className="px-4 py-2.5 text-xs text-slate-500 text-center">
                            No categories found
                          </div>
                        ) : (
                          filteredCategories.map(c => {
                            const isSelected = form.category === c
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  set('category', c)
                                  setIsCategoryOpen(false)
                                  setCategorySearch('')
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-sm rounded-lg transition-colors cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold' 
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span>{c}</span>
                                {isSelected && <Check size={14} className="text-indigo-400" />}
                              </button>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {isCategoryOpen && (
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => {
                        setIsCategoryOpen(false)
                        setCategorySearch('')
                      }}
                    />
                  )}

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
                className="p-8 space-y-6"
              >
                <div>
                  <h2 className="text-lg font-black text-white mb-1">Targeting</h2>
                  <p className="text-sm text-slate-500">Define where and who will see your ad</p>
                </div>

                {/* Target States */}
                <div className="relative">
                  <label className={labelClass}>Target States / Negeri</label>
                  <div className="relative z-30">
                    <button
                      type="button"
                      onClick={() => setIsStatesOpen(!isStatesOpen)}
                      className={`${inputClass} flex items-center justify-between text-left cursor-pointer`}
                    >
                      <span className={form.target_states.length === 0 ? 'text-slate-500' : 'text-white'}>
                        {form.target_states.length === 0 
                          ? 'All States (Global)' 
                          : `${form.target_states.length} State(s) Selected`}
                      </span>
                      <ChevronDown size={16} className="text-slate-500" />
                    </button>

                    {isStatesOpen && (
                      <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl bg-[#0d0e16] border border-white/10 p-2 shadow-2xl z-50">
                        <div className="flex items-center gap-2 mb-2 p-1 border-b border-white/5">
                          <Search size={14} className="text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search state..."
                            value={stateSearch}
                            onChange={e => setStateSearch(e.target.value)}
                            className="w-full bg-transparent text-white text-xs outline-none"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-indigo-400 px-2 mb-1">
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, target_states: MALAYSIAN_STATES }))}
                            className="hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, target_states: [] }))}
                            className="hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          {MALAYSIAN_STATES.filter(s => s.toLowerCase().includes(stateSearch.toLowerCase())).map(s => {
                            const isSelected = form.target_states.includes(s)
                            return (
                              <button
                                key={s}
                                type="button"
                                onClick={() => {
                                  setForm(prev => {
                                    const exists = prev.target_states.includes(s)
                                    const updated = exists
                                      ? prev.target_states.filter(x => x !== s)
                                      : [...prev.target_states, s]
                                    return { ...prev, target_states: updated }
                                  })
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left text-xs rounded-lg transition-colors cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold' 
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span>{s}</span>
                                {isSelected && <Check size={12} className="text-indigo-400" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {isStatesOpen && (
                    <div 
                      className="fixed inset-0 z-20 bg-transparent" 
                      onClick={() => {
                        setIsStatesOpen(false)
                        setStateSearch('')
                      }}
                    />
                  )}
                  <p className="text-[10px] text-slate-500 mt-1 ml-1">If no state is selected, the campaign targets all states.</p>
                </div>

                {/* Target Merchant Categories */}
                <div className="relative">
                  <label className={labelClass}>Target Restaurant Categories</label>
                  <div className="relative z-20">
                    <button
                      type="button"
                      onClick={() => setIsTargetCatsOpen(!isTargetCatsOpen)}
                      className={`${inputClass} flex items-center justify-between text-left cursor-pointer`}
                    >
                      <span className={form.target_categories.length === 0 ? 'text-slate-500' : 'text-white'}>
                        {form.target_categories.length === 0 
                          ? 'All Categories' 
                          : `${form.target_categories.length} Category(ies) Selected`}
                      </span>
                      <ChevronDown size={16} className="text-slate-500" />
                    </button>

                    {isTargetCatsOpen && (
                      <div className="absolute left-0 right-0 mt-1 max-h-64 overflow-y-auto rounded-xl bg-[#0d0e16] border border-white/10 p-2 shadow-2xl z-50">
                        <div className="flex items-center gap-2 mb-2 p-1 border-b border-white/5">
                          <Search size={14} className="text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search category..."
                            value={targetCatSearch}
                            onChange={e => setTargetCatSearch(e.target.value)}
                            className="w-full bg-transparent text-white text-xs outline-none"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-indigo-400 px-2 mb-1">
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, target_categories: MERCHANT_CATEGORIES }))}
                            className="hover:underline cursor-pointer"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, target_categories: [] }))}
                            className="hover:underline cursor-pointer"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-0.5">
                          {MERCHANT_CATEGORIES.filter(c => c.toLowerCase().includes(targetCatSearch.toLowerCase())).map(c => {
                            const isSelected = form.target_categories.includes(c)
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => {
                                  setForm(prev => {
                                    const exists = prev.target_categories.includes(c)
                                    const updated = exists
                                      ? prev.target_categories.filter(x => x !== c)
                                      : [...prev.target_categories, c]
                                    return { ...prev, target_categories: updated }
                                  })
                                }}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left text-xs rounded-lg transition-colors cursor-pointer ${
                                  isSelected 
                                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold' 
                                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span>{c}</span>
                                {isSelected && <Check size={12} className="text-indigo-400" />}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  {isTargetCatsOpen && (
                    <div 
                      className="fixed inset-0 z-10 bg-transparent" 
                      onClick={() => {
                        setIsTargetCatsOpen(false)
                        setTargetCatSearch('')
                      }}
                    />
                  )}
                  <p className="text-[10px] text-slate-500 mt-1 ml-1">If no category is selected, the campaign targets all merchant categories.</p>
                </div>

                {/* Limit by GPS Radius Toggle */}
                <label className="flex items-center gap-3 p-4 rounded-xl border border-white/10 cursor-pointer hover:border-indigo-500/30 transition-all bg-white/3">
                  <div
                    className={`w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${form.gps_enabled ? 'bg-indigo-600 border-indigo-600' : 'border-slate-600'}`}
                    onClick={toggleGps}
                  >
                    {form.gps_enabled && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-indigo-400" />
                      <span className="text-white font-semibold text-sm">Limit by GPS Radius</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">Show this ad only to users near specific coordinates</p>
                  </div>
                </label>

                {form.gps_enabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-2"
                  >
                    {/* Address search via Nominatim */}
                    <div className="relative">
                      <label className={labelClass}>Search Address / Location</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Mid Valley Megamall..."
                          value={addressSearch}
                          onChange={e => setAddressSearch(e.target.value)}
                          className={inputClass}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleSearchAddress()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleSearchAddress}
                          disabled={searchingAddress}
                          className="px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center min-w-[80px]"
                        >
                          {searchingAddress ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
                        </button>
                      </div>

                      {searchResults.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl bg-[#0d0e16] border border-white/10 p-1 shadow-2xl z-50">
                          {searchResults.map((r, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleSelectAddress(r)}
                              className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors border-b border-white/5 last:border-0 truncate block cursor-pointer"
                              title={r.display_name}
                            >
                              {r.display_name}
                            </button>
                          ))}
                        </div>
                      )}
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
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={locating}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-indigo-500/20 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-bold text-xs transition-all disabled:opacity-50"
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

                    {/* Leaflet Map Preview Container */}
                    <div className="relative">
                      <div 
                        ref={mapContainerRef} 
                        className="h-60 w-full rounded-xl border border-white/10 overflow-hidden bg-slate-950 z-10" 
                        style={{ minHeight: '240px' }}
                      />
                      <p className="text-[10px] text-slate-500 mt-1 ml-1">You can drag the marker or click on the map to set the center coordinate.</p>
                    </div>

                    {/* Lat / Lng inputs */}
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

                    {/* Radius Slider / input */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className={labelClass}>Radius (km) <span className="text-rose-500">*</span></label>
                        <span className="text-xs font-semibold text-indigo-400">{form.radius_km} km</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <input
                          type="range"
                          min="0.5"
                          max="50"
                          step="0.5"
                          value={form.radius_km}
                          onChange={e => set('radius_km', e.target.value)}
                          className="flex-1 accent-indigo-600"
                        />
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          className={`${inputClass} w-24 py-1.5 px-3 text-center`}
                          value={form.radius_km}
                          onChange={e => set('radius_km', e.target.value)}
                        />
                      </div>
                      {errors.radius_km && <p className="text-rose-500 text-xs mt-1 ml-1">{errors.radius_km}</p>}
                    </div>
                  </motion.div>
                )}

                <div className="flex gap-3 mt-4">
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
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Campaign Summary (Edited)</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {[
                      { label: 'Title', value: form.title || '—' },
                      { label: 'Category', value: form.category || '—' },
                      { label: 'CTA', value: form.cta_text || '—' },
                      { label: 'Video', value: form.video_url ? '✓ Set' : '—' },
                      { label: 'Target States', value: form.target_states.length === 0 ? 'All States (Global)' : form.target_states.join(', ') },
                      { label: 'Target Categories', value: form.target_categories.length === 0 ? 'All Categories' : form.target_categories.join(', ') },
                      { label: 'GPS Radius', value: form.gps_enabled ? `${form.target_location_name || 'Custom GPS'} (${form.radius_km} km)` : 'No Limit' },
                      { label: 'Bid', value: `RM ${Number(form.cpv_bid).toFixed(2)}/view` },
                      { label: 'Status After Edit', value: 'Pending Review' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-5 py-3">
                        <span className="text-xs text-slate-500">{row.label}</span>
                        <span className="text-sm text-white font-medium text-right max-w-[55%] truncate" title={row.value}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 text-center">
                  Saving changes will automatically disable the campaign and submit it for moderation.
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
                      <><Loader2 size={18} className="animate-spin" />Saving...</>
                    ) : (
                      <><ArrowRight size={18} />Save & Resubmit</>
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
