'use client'

// VERCEL_FORCE_REBUILD_FINAL_V4
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, XCircle, ShieldCheck, 
  Loader2, Search, Smartphone, Store,
  Zap, Clock, BarChart3, Globe, ExternalLink,
  ChevronRight, ArrowUpRight, TrendingUp, AlertCircle, LogOut, ArrowLeft,
  Tv, PlayCircle, Image, Plus, Trash2, Eye, MousePointerClick, Percent,
  MapPin, DollarSign, Clock3
} from 'lucide-react'

const supabase = createClient()
const ADMIN_EMAIL = 'izwan.tapys@gmail.com'

const MERCHANT_CATEGORIES = [
  'Fast Food', 'Casual Dining', 'Cafe & Coffee', 'Fine Dining', 'Seafood',
  'Nasi Kandar', 'Mamak', 'Hawker & Street Food', 'Bakery & Desserts',
  'Other F&B', 'Retail', 'Bank & Finance', 'Entertainment', 'Health & Wellness', 'Other'
]

const AD_CATEGORIES = [
  'Fast Food', 'Casual Dining', 'Cafe & Coffee', 'Fine Dining', 'Retail',
  'Entertainment', 'Health & Wellness', 'Bank & Finance', 'Other'
]

export default function AdminPage() {
  const router = useRouter()
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    totalMerchants: 0,
    totalOrders: 0,
    ordersToday: 0,
    estimatedRevenue: 0
  })

  // Location form state per merchant
  const [locationFormId, setLocationFormId] = useState<string | null>(null)
  const [locationForm, setLocationForm] = useState({ latitude: '', longitude: '', category: '' })
  const [savingLocation, setSavingLocation] = useState(false)

  // Ads State
  const [activeTab, setActiveTab] = useState<'merchants' | 'ads' | 'infra'>('merchants')
  const [adsSubTab, setAdsSubTab] = useState<'active' | 'pending' | 'all'>('active')
  const [ads, setAds] = useState<any[]>([])
  const [adsLoading, setAdsLoading] = useState(false)
  const [isAddingAd, setIsAddingAd] = useState(false)
  const [newAd, setNewAd] = useState({
    title: '',
    description: '',
    cta_text: '',
    category: '',
    video_url: '',
    image_url: '',
    link_url: '',
    target_latitude: '',
    target_longitude: '',
    target_radius_km: '',
    cpv_bid: '',
    is_active: true
  })
  const [adsModerating, setAdsModerating] = useState<string | null>(null)
  const [previewAd, setPreviewAd] = useState<any | null>(null)
  const [totalCpvRevenue, setTotalCpvRevenue] = useState(0)

  // Infra State
  const [infraData, setInfraData] = useState<any>(null)
  const [infraLoading, setInfraLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      const { count: mCount } = await supabase.from('merchants').select('*', { count: 'exact', head: true })
      const { count: sCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true })
      
      const today = new Date()
      today.setHours(0,0,0,0)
      const { count: todayCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', today.toISOString())

      const { data: mData, error: mError } = await supabase
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false })

      if (mError) throw mError

      if (mData) {
        const firstOfMonth = new Date()
        firstOfMonth.setDate(1)
        firstOfMonth.setHours(0,0,0,0)

        const processedMerchants = await Promise.all(mData.map(async (m) => {
          try {
            const { count } = await supabase
              .from('sessions')
              .select('*', { count: 'exact', head: true })
              .eq('merchant_id', m.id)
              .gt('created_at', firstOfMonth.toISOString())
            return { ...m, monthly_count: count || 0 }
          } catch (e) {
            return { ...m, monthly_count: 0 }
          }
        }))
        
        setMerchants(processedMerchants)
        
        setStats({
          totalMerchants: mCount || 0,
          totalOrders: sCount || 0,
          ordersToday: todayCount || 0,
          estimatedRevenue: mData.reduce((acc, m) => {
            if (m.plan_type === 'basic') return acc + 30
            if (m.plan_type === 'pro') return acc + 49
            return acc
          }, 0)
        })
      }
    } catch (error: any) {
      console.error('Admin Fetch Error:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAds = useCallback(async () => {
    setAdsLoading(true)
    try {
      // Fetch ALL ads (no is_active filter)
      const { data: adsData, error: adsError } = await supabase
        .from('ads')
        .select('*')
        .order('created_at', { ascending: false })

      const { data: analyticsData } = await supabase.from('ad_analytics').select('ad_id, event_type')

      // Fetch CPV revenue: sum of debits
      const { data: txData } = await supabase
        .from('ad_wallet_transactions')
        .select('amount')
        .eq('type', 'debit')

      if (txData) {
        const total = txData.reduce((acc, tx) => acc + (tx.amount || 0), 0)
        setTotalCpvRevenue(total)
      }
      
      if (adsData) {
        const enrichedAds = adsData.map((ad: any) => {
          const adAnalytics = analyticsData?.filter((a: any) => a.ad_id === ad.id) || []
          const impressions = adAnalytics.filter((a: any) => a.event_type === 'impression').length
          const clicks = adAnalytics.filter((a: any) => a.event_type === 'click').length
          return { 
            ...ad, 
            impressions, 
            clicks, 
            ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0' 
          }
        })
        setAds(enrichedAds)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAdsLoading(false)
    }
  }, [])

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAd.title.trim()) return
    const { error } = await supabase.from('ads').insert({
      title: newAd.title.trim(),
      description: newAd.description.trim() || null,
      cta_text: newAd.cta_text.trim() || null,
      category: newAd.category || null,
      video_url: newAd.video_url.trim() || null,
      image_url: newAd.image_url.trim() || null,
      link_url: newAd.link_url.trim() || null,
      target_latitude: newAd.target_latitude ? parseFloat(newAd.target_latitude) : null,
      target_longitude: newAd.target_longitude ? parseFloat(newAd.target_longitude) : null,
      target_radius_km: newAd.target_radius_km ? parseFloat(newAd.target_radius_km) : null,
      cpv_bid: newAd.cpv_bid ? parseFloat(newAd.cpv_bid) : null,
      is_active: true,
      status: 'active',
      advertiser_id: null // system ad
    })
    if (!error) {
      setIsAddingAd(false)
      setNewAd({
        title: '', description: '', cta_text: '', category: '',
        video_url: '', image_url: '', link_url: '',
        target_latitude: '', target_longitude: '', target_radius_km: '',
        cpv_bid: '', is_active: true
      })
      fetchAds()
    } else {
      alert('Error adding ad: ' + error.message)
    }
  }

  const handleApproveAd = async (id: string) => {
    setAdsModerating(id)
    const { error } = await supabase.from('ads').update({ status: 'active', is_active: true }).eq('id', id)
    if (!error) fetchAds()
    else alert('Error approving ad: ' + error.message)
    setAdsModerating(null)
  }

  const handleRejectAd = async (id: string) => {
    setAdsModerating(id)
    const { error } = await supabase.from('ads').update({ status: 'rejected', is_active: false }).eq('id', id)
    if (!error) fetchAds()
    else alert('Error rejecting ad: ' + error.message)
    setAdsModerating(null)
  }

  const toggleAdActive = async (id: string, current: boolean) => {
    const { error } = await supabase.from('ads').update({ is_active: !current }).eq('id', id)
    if (!error) fetchAds()
  }

  const deleteAd = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return
    const { error } = await supabase.from('ads').delete().eq('id', id)
    if (!error) fetchAds()
  }

  const fetchInfraData = useCallback(async () => {
    setInfraLoading(true)
    try {
      const res = await fetch('/api/admin/infra-usage')
      if (res.ok) {
        const data = await res.json()
        setInfraData(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setInfraLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isAdmin && activeTab === 'ads') {
      fetchAds()
    }
    if (isAdmin && activeTab === 'infra') {
      fetchInfraData()
      const interval = setInterval(fetchInfraData, 60000) // Poll every 60s
      return () => clearInterval(interval)
    }
  }, [isAdmin, activeTab, fetchAds, fetchInfraData])

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/dashboard')
      return
    }
    setIsAdmin(true)
    fetchStats()
  }, [router, fetchStats])

  const updateMerchant = async (id: string, updates: any) => {
    setVerifyingId(id)
    const { error } = await supabase
      .from('merchants')
      .update(updates)
      .eq('id', id)
    
    if (!error) {
      setMerchants(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
    } else {
      alert('Error: ' + error.message)
    }
    setVerifyingId(null)
  }

  const handleSaveLocation = async (merchantId: string) => {
    setSavingLocation(true)
    const updates: any = {}
    if (locationForm.latitude) updates.latitude = parseFloat(locationForm.latitude)
    if (locationForm.longitude) updates.longitude = parseFloat(locationForm.longitude)
    if (locationForm.category) updates.category = locationForm.category
    await updateMerchant(merchantId, updates)
    setSavingLocation(false)
    setLocationFormId(null)
    setLocationForm({ latitude: '', longitude: '', category: '' })
  }

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  const filteredMerchants = merchants.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone?.includes(searchQuery) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Derived ad lists
  const pendingAds = ads.filter(a => a.status === 'pending_review')
  const activeAds = ads.filter(a => a.status === 'active' || a.is_active)
  const displayedAds = adsSubTab === 'pending' ? pendingAds : adsSubTab === 'active' ? activeAds : ads

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 p-4 md:p-12 relative overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Dynamic Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Header */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-2xl blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-black border border-white/10 flex items-center justify-center shadow-2xl">
                <ShieldCheck size={36} className="text-indigo-500 group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-white mb-1">
                Beepme <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Core</span>
              </h1>
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Administrator Oversight System</p>
              </div>
            </div>
          </div>

          <div className="relative group max-w-xl flex-1">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative flex items-center">
              <Search className="absolute left-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
              <input 
                type="text"
                placeholder="Search global directory..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/[0.03] border border-white/10 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-medium text-sm text-white placeholder:text-slate-600 backdrop-blur-xl"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <ArrowLeft size={16} />
              Dashboard
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-10 p-2 bg-white/[0.02] border border-white/5 rounded-3xl w-max mx-auto md:mx-0 shadow-inner">
          <button
            onClick={() => setActiveTab('merchants')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'merchants' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Store size={16} /> Directory
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ads' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Tv size={16} /> Ad Network
            {pendingAds.length > 0 && activeTab !== 'ads' && (
              <span className="ml-1 bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">{pendingAds.length}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('infra')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'infra' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <BarChart3 size={16} /> Infra Usage
          </button>
        </div>

        {/* Global Stats Grid */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16 ${activeTab !== 'merchants' ? 'hidden' : ''}`}>
          <StatCard 
            icon={<Store size={24} />} 
            label="Total Merchants" 
            value={stats.totalMerchants} 
            color="indigo" 
            trend="+12% this month"
          />
          <StatCard 
            icon={<Zap size={24} />} 
            label="Total Pagers" 
            value={stats.totalOrders.toLocaleString()} 
            color="amber" 
            trend="Active all time"
          />
          <StatCard 
            icon={<TrendingUp size={24} />} 
            label="Orders Today" 
            value={stats.ordersToday} 
            color="emerald" 
            trend="Live pulse"
          />
          <StatCard 
            icon={<BarChart3 size={24} />} 
            label="Est. Revenue" 
            value={`RM${stats.estimatedRevenue}`} 
            color="rose" 
            trend="MRR potential"
          />
        </div>

        {/* Merchants View */}
        <div className={`mb-8 flex items-center justify-between px-2 ${activeTab !== 'merchants' ? 'hidden' : ''}`}>
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Merchant Directory</h2>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase">
            <span>Sort by Latest</span>
            <ChevronRight size={12} />
          </div>
        </div>

        {loading && activeTab === 'merchants' ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 rounded-full border-b-2 border-indigo-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-t-2 border-violet-500/30 animate-spin-slow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck size={24} className="text-indigo-500 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-600 font-bold uppercase tracking-[0.5em] text-[10px] animate-pulse">Syncing Encrypted Data...</p>
          </div>
        ) : activeTab === 'merchants' ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500 bg-white/[0.01]">
                    <th className="py-5 px-6 font-black">Merchant</th>
                    <th className="py-5 px-6 font-black">Contact</th>
                    <th className="py-5 px-6 font-black">Email</th>
                    <th className="py-5 px-6 font-black">Usage</th>
                    <th className="py-5 px-6 font-black">Subscription Plan</th>
                    <th className="py-5 px-6 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMerchants.map((m) => {
                    const isEditingLocation = locationFormId === m.id
                    return (
                      <>
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <div className={`absolute -inset-1 blur-sm rounded-full opacity-20 transition-all duration-500 group-hover:opacity-40 ${m.is_verified ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                                <div className="relative w-12 h-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center font-black text-white group-hover:scale-105 transition-transform">
                                  {m.name?.[0] || 'M'}
                                </div>
                              </div>
                              <div>
                                <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">{m.name || 'Anonymous Store'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${m.is_verified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                                    {m.is_verified ? 'Verified' : 'Pending'}
                                  </span>
                                  {m.category && (
                                    <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{m.category}</span>
                                  )}
                                  <span className="text-[10px] text-slate-600 font-medium">{new Date(m.created_at).toLocaleDateString()}</span>
                                </div>
                                {(m.latitude || m.longitude) && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <MapPin size={9} className="text-indigo-400" />
                                    <span className="text-[9px] text-slate-500 font-mono">{m.latitude?.toFixed(4)}, {m.longitude?.toFixed(4)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-300 transition-colors">
                              <Smartphone size={14} className={m.phone ? 'text-indigo-500' : 'text-slate-600'} />
                              <span className="text-xs font-medium">{m.phone || 'NO PHONE'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="text-slate-400 group-hover:text-slate-300 transition-colors">
                              <span className="text-xs font-medium">{m.email || 'NO EMAIL'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1.5 max-w-[120px]">
                              <div className="flex items-end justify-between">
                                <span className="text-sm font-black text-white">{m.monthly_count.toLocaleString()}</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Pagers</span>
                              </div>
                              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-indigo-500 transition-all duration-1000"
                                  style={{ width: '100%' }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <select 
                              value={m.plan_type}
                              onChange={(e) => {
                                const val = e.target.value
                                const updates: any = { plan_type: val }
                                if (val === 'pro') {
                                  updates.subscription_status = 'active'
                                  const expiry = new Date()
                                  expiry.setDate(expiry.getDate() + 30)
                                  updates.expiry_date = expiry.toISOString()
                                } else {
                                  updates.subscription_status = null
                                  updates.expiry_date = null
                                }
                                updateMerchant(m.id, updates)
                              }}
                              disabled={verifyingId === m.id}
                              className="w-full max-w-[140px] px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer hover:bg-white/[0.06]"
                            >
                              <option value="free" className="bg-[#0a0b0f] text-white">Trial (Free)</option>
                              <option value="pro" className="bg-[#0a0b0f] text-white">Pro (RM39)</option>
                            </select>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  if (isEditingLocation) {
                                    setLocationFormId(null)
                                  } else {
                                    setLocationFormId(m.id)
                                    setLocationForm({
                                      latitude: m.latitude?.toString() || '',
                                      longitude: m.longitude?.toString() || '',
                                      category: m.category || ''
                                    })
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isEditingLocation ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-white/10'}`}
                              >
                                <MapPin size={11} />
                                {isEditingLocation ? 'Cancel' : 'Set Location'}
                              </button>
                              <button 
                                onClick={() => updateMerchant(m.id, { is_verified: !m.is_verified })}
                                disabled={verifyingId === m.id}
                                className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${m.is_verified ? 'bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'}`}
                              >
                                {verifyingId === m.id ? <Loader2 size={12} className="animate-spin" /> : m.is_verified ? 'Kill' : 'Activate'}
                              </button>
                              {m.phone && (
                                <a href={`https://wa.me/${m.phone}`} target="_blank" className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                                  <Smartphone size={14} />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Inline Location Form */}
                        {isEditingLocation && (
                          <tr key={`${m.id}-location`} className="bg-indigo-500/5 border-b border-indigo-500/20">
                            <td colSpan={6} className="px-6 py-5">
                              <div className="flex flex-col gap-4">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                  <MapPin size={12} /> Set Location & Category for {m.name || 'this merchant'}
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Latitude</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={locationForm.latitude}
                                      onChange={e => setLocationForm(f => ({ ...f, latitude: e.target.value }))}
                                      placeholder="e.g. 3.1390"
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white text-xs font-mono outline-none focus:border-indigo-500 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Longitude</label>
                                    <input
                                      type="number"
                                      step="any"
                                      value={locationForm.longitude}
                                      onChange={e => setLocationForm(f => ({ ...f, longitude: e.target.value }))}
                                      placeholder="e.g. 101.6869"
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white text-xs font-mono outline-none focus:border-indigo-500 transition-all"
                                    />
                                  </div>
                                  <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                                    <select
                                      value={locationForm.category}
                                      onChange={e => setLocationForm(f => ({ ...f, category: e.target.value }))}
                                      className="w-full px-3 py-2.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white text-xs outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                    >
                                      <option value="" className="bg-[#0a0b0f]">Select category...</option>
                                      {MERCHANT_CATEGORIES.map(cat => (
                                        <option key={cat} value={cat} className="bg-[#0a0b0f]">{cat}</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => handleSaveLocation(m.id)}
                                    disabled={savingLocation}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                                  >
                                    {savingLocation ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                                    Save Location
                                  </button>
                                  <button
                                    onClick={() => setLocationFormId(null)}
                                    className="px-5 py-2.5 rounded-xl bg-white/5 text-slate-400 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/10"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {filteredMerchants.length === 0 && !loading && activeTab === 'merchants' && (
          <div className="text-center py-40 bg-white/[0.01] rounded-[40px] border border-dashed border-white/10">
            <AlertCircle size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">No Signal Detected in this quadrant.</p>
          </div>
        )}

        {/* Ads Network View */}
        {activeTab === 'ads' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Ad Campaigns</h2>
                <p className="text-[10px] font-bold text-slate-600">Central rotation for Always Free pagers.</p>
              </div>
              <button
                onClick={() => setIsAddingAd(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all active:scale-95"
              >
                <Plus size={16} /> New Ad
              </button>
            </div>

            {/* Ads Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard icon={<Tv size={20} />} label="Total Ads" value={ads.length} color="indigo" trend="All Statuses" />
              <StatCard icon={<Eye size={20} />} label="Impressions" value={ads.reduce((acc, ad) => acc + ad.impressions, 0).toLocaleString()} color="amber" trend="Total Views" />
              <StatCard icon={<MousePointerClick size={20} />} label="Total Clicks" value={ads.reduce((acc, ad) => acc + ad.clicks, 0).toLocaleString()} color="emerald" trend="Engagements" />
              <StatCard icon={<DollarSign size={20} />} label="CPV Revenue" value={`RM ${totalCpvRevenue.toFixed(2)}`} color="rose" trend="Total Debit" />
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-white/[0.02] border border-white/5 rounded-2xl w-max">
              {(['active', 'pending', 'all'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAdsSubTab(tab)}
                  className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${adsSubTab === tab ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                >
                  {tab === 'active' ? <CheckCircle size={12} /> : tab === 'pending' ? <Clock3 size={12} /> : <BarChart3 size={12} />}
                  {tab === 'pending' ? 'Pending Review' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'pending' && pendingAds.length > 0 && (
                    <span className="bg-amber-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full">{pendingAds.length}</span>
                  )}
                </button>
              ))}
            </div>

            {isAddingAd && (
              <form onSubmit={handleSaveAd} className="p-8 rounded-[40px] bg-white/[0.02] border border-white/10 shadow-2xl backdrop-blur-md animate-slide-up space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-black text-white text-xl uppercase tracking-tighter">Create New Campaign</h3>
                  <button type="button" onClick={() => setIsAddingAd(false)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                    <XCircle size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ad Title *</label>
                    <input type="text" required value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} placeholder="e.g. KFC Promo" className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                    <select value={newAd.category} onChange={e => setNewAd({...newAd, category: e.target.value})} className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm appearance-none cursor-pointer">
                      <option value="" className="bg-[#0a0b0f]">Select category...</option>
                      {AD_CATEGORIES.map(cat => <option key={cat} value={cat} className="bg-[#0a0b0f]">{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                    <input type="text" value={newAd.description} onChange={e => setNewAd({...newAd, description: e.target.value})} placeholder="Short ad description..." className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CTA Text</label>
                    <input type="text" value={newAd.cta_text} onChange={e => setNewAd({...newAd, cta_text: e.target.value})} placeholder="e.g. Order Now" className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link Out URL</label>
                    <input type="text" value={newAd.link_url} onChange={e => setNewAd({...newAd, link_url: e.target.value})} placeholder="e.g. https://kfc.com.my" className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">CPV Bid (RM)</label>
                    <input type="number" step="0.001" min="0" value={newAd.cpv_bid} onChange={e => setNewAd({...newAd, cpv_bid: e.target.value})} placeholder="e.g. 0.05" className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Video URL (9:16)</label>
                    <input type="text" value={newAd.video_url} onChange={e => setNewAd({...newAd, video_url: e.target.value})} placeholder="e.g. https://cdn.example.com/ad.mp4" className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fallback Image URL</label>
                    <input type="text" value={newAd.image_url} onChange={e => setNewAd({...newAd, image_url: e.target.value})} placeholder="e.g. https://cdn.example.com/ad.jpg" className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
                  </div>
                </div>
                {/* Geo Targeting */}
                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Geo Targeting (Optional)</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Latitude</label>
                      <input type="number" step="any" value={newAd.target_latitude} onChange={e => setNewAd({...newAd, target_latitude: e.target.value})} placeholder="e.g. 3.1390" className="w-full p-3 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Longitude</label>
                      <input type="number" step="any" value={newAd.target_longitude} onChange={e => setNewAd({...newAd, target_longitude: e.target.value})} placeholder="e.g. 101.6869" className="w-full p-3 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Radius (km)</label>
                      <input type="number" step="0.1" min="0" value={newAd.target_radius_km} onChange={e => setNewAd({...newAd, target_radius_km: e.target.value})} placeholder="e.g. 5" className="w-full p-3 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20">
                  Save Campaign
                </button>
              </form>
            )}

            {adsLoading ? (
               <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader2 size={32} className="text-indigo-500 animate-spin" />
                 <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Loading Network Data...</p>
               </div>
            ) : adsSubTab === 'pending' ? (
              /* Pending Review Section */
              <div className="space-y-4">
                {pendingAds.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.01] rounded-[40px] border border-dashed border-white/10">
                    <CheckCircle size={48} className="mx-auto text-slate-700 mb-4" />
                    <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">No pending ads. All caught up!</p>
                  </div>
                ) : pendingAds.map((ad) => (
                  <div key={ad.id} className="flex items-center gap-6 p-6 rounded-[24px] bg-amber-500/5 border border-amber-500/20 hover:bg-amber-500/10 transition-all">
                    {/* Thumbnail */}
                    <div className="w-16 h-28 rounded-xl overflow-hidden bg-[#0a0b0f] border border-white/10 shrink-0">
                      {ad.image_url ? (
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tv size={20} className="text-slate-700" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">Pending Review</span>
                        {ad.category && <span className="text-[9px] font-bold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">{ad.category}</span>}
                      </div>
                      <h4 className="font-black text-white text-base mb-1 truncate">{ad.title}</h4>
                      {ad.description && <p className="text-xs text-slate-400 mb-2 line-clamp-1">{ad.description}</p>}
                      <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold uppercase">
                        {ad.cpv_bid && <span className="flex items-center gap-1 text-emerald-400"><DollarSign size={10} />RM {ad.cpv_bid}/view</span>}
                        {ad.advertiser_id && <span className="font-mono text-slate-600 truncate max-w-[160px]">{ad.advertiser_id}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={() => setPreviewAd(ad)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all border border-white/10"
                      >
                        <Eye size={12} />
                        Preview
                      </button>
                      <button
                        onClick={() => handleApproveAd(ad.id)}
                        disabled={adsModerating === ad.id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {adsModerating === ad.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectAd(ad.id)}
                        disabled={adsModerating === ad.id}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all border border-rose-500/20 disabled:opacity-50"
                      >
                        {adsModerating === ad.id ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedAds.map((ad) => (
                  <div key={ad.id} className={`group relative rounded-[32px] overflow-hidden border transition-all duration-500 bg-black ${ad.status === 'rejected' ? 'border-rose-500/20 opacity-40 grayscale hover:grayscale-0 hover:opacity-100' : ad.status === 'paused' ? 'border-amber-500/20 opacity-60' : ad.is_active ? 'border-indigo-500/30 hover:border-indigo-500/60 shadow-2xl shadow-indigo-500/10' : 'border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'}`}>
                    <div className="aspect-[9/16] relative bg-[#0a0b0f] w-full">
                      {ad.video_url ? (
                        (() => {
                          const ytMatch = ad.video_url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/)
                          const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null
                          if (ytId) {
                            return (
                              <iframe
                                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
                                className="w-full h-full object-cover pointer-events-none scale-105"
                                allow="autoplay; encrypted-media"
                              />
                            )
                          }
                          const tiktokMatch = ad.video_url.match(/tiktok\.com\/@.*\/video\/(\d+)/)
                          const tiktokId = tiktokMatch ? tiktokMatch[1] : null
                          if (tiktokId) {
                            return (
                              <iframe
                                src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
                                className="w-full h-full object-cover pointer-events-none"
                                allow="autoplay; encrypted-media"
                              />
                            )
                          }
                          return (
                            <video src={ad.video_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                          )
                        })()
                      ) : ad.image_url ? (
                        <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-black p-6 text-center">
                          <p className="text-white font-black text-xl">{ad.title}</p>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
                        {/* Status badge */}
                        <div className="mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${ad.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : ad.status === 'paused' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ad.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-white/10 text-slate-400 border border-white/20'}`}>
                            {ad.status || 'unknown'}
                          </span>
                          {ad.category && <span className="ml-1 text-[9px] font-bold text-slate-400 bg-white/10 px-1.5 py-0.5 rounded-lg border border-white/10">{ad.category}</span>}
                        </div>
                        <h4 className="text-white font-black text-lg leading-tight uppercase tracking-tight line-clamp-2 mb-2">{ad.title}</h4>
                        {ad.cpv_bid && (
                          <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">RM {ad.cpv_bid}/view</p>
                        )}
                        <div className="grid grid-cols-3 gap-2 mb-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10">
                           <div className="text-center">
                             <p className="text-[8px] text-slate-300 uppercase font-black tracking-widest mb-0.5">Views</p>
                             <p className="text-sm font-black text-white">{ad.impressions}</p>
                           </div>
                           <div className="text-center border-x border-white/10">
                             <p className="text-[8px] text-slate-300 uppercase font-black tracking-widest mb-0.5">Clicks</p>
                             <p className="text-sm font-black text-white">{ad.clicks}</p>
                           </div>
                           <div className="text-center">
                             <p className="text-[8px] text-slate-300 uppercase font-black tracking-widest mb-0.5">CTR</p>
                             <p className="text-sm font-black text-emerald-400">{ad.ctr}%</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => toggleAdActive(ad.id, ad.is_active)}
                             className={`flex-1 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${ad.is_active ? 'bg-indigo-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
                           >
                             {ad.is_active ? 'ON' : 'OFF'}
                           </button>
                           <button 
                             onClick={() => deleteAd(ad.id)}
                             className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 shrink-0"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {displayedAds.length === 0 && !adsLoading && adsSubTab !== 'pending' && (
              <div className="text-center py-20 bg-white/[0.01] rounded-[40px] border border-dashed border-white/10">
                <Tv size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">No active campaigns. Default Beepme ad is currently live.</p>
              </div>
            )}
          </div>
        )}

        {/* Infra Usage View */}
        {activeTab === 'infra' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-2">
              <div>
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-1">System Infrastructure</h2>
                <p className="text-[10px] font-bold text-slate-600">Near real-time resource utilization (Updated every 60s)</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${infraLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{infraLoading ? 'Syncing...' : 'Live System'}</span>
              </div>
            </div>

            {infraData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CircularMeter 
                  percentage={(infraData.supabase.databaseSizeBytes / infraData.supabase.databaseLimitBytes) * 100}
                  label="Supabase DB Size"
                  color="indigo"
                  limit={`${(infraData.supabase.databaseLimitBytes / 1024 / 1024).toFixed(0)}MB`}
                  current={`${(infraData.supabase.databaseSizeBytes / 1024 / 1024).toFixed(2)}MB`}
                  description="Total database size consumed by active sessions, pagers, and merchants."
                />
                <CircularMeter 
                  percentage={(infraData.supabase.storageSizeBytes / infraData.supabase.storageLimitBytes) * 100}
                  label="Supabase Storage"
                  color="emerald"
                  limit={`${(infraData.supabase.storageLimitBytes / 1024 / 1024 / 1024).toFixed(0)}GB`}
                  current={`${(infraData.supabase.storageSizeBytes / 1024 / 1024).toFixed(2)}MB`}
                  description="Total storage consumed by WebP compressed merchant logos."
                />
                <CircularMeter 
                  percentage={(infraData.vercel.bandwidthBytes / infraData.vercel.bandwidthLimitBytes) * 100}
                  label="Vercel Bandwidth"
                  color="amber"
                  limit={`${(infraData.vercel.bandwidthLimitBytes / 1024 / 1024 / 1024).toFixed(0)}GB`}
                  current={`${(infraData.vercel.bandwidthBytes / 1024 / 1024 / 1024).toFixed(4)}GB`}
                  description={infraData.vercel.missingToken ? "Simulated data. Set VERCEL_ACCESS_TOKEN for exact API sync." : "Actual bandwidth used this billing cycle."}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                 <Loader2 size={32} className="text-indigo-500 animate-spin" />
                 <p className="text-slate-600 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Calculating Infra Metrics...</p>
              </div>
            )}
            
            <div className="p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-3xl mt-8">
              <h4 className="text-indigo-400 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                <ShieldCheck size={16} /> Cost Optimization Engine
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
                Beeper IO is currently operating in <strong>High Efficiency Mode</strong>. Client-side WebP compression is saving roughly 90% of storage bandwidth. To prevent the Database Size from ballooning, ensure background CRON jobs are active to archive ephemeral session data.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Ad Preview Modal Overlay */}
      {previewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#0a0b0f] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Phone/Ad Preview Frame (Left/Top side) */}
            <div className="w-full md:w-[380px] bg-black flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/5 relative shrink-0">
              <div className="w-[240px] md:w-[280px] aspect-[9/16] rounded-[24px] overflow-hidden border border-white/10 relative shadow-2xl bg-[#020203]">
                {previewAd.video_url ? (
                  (() => {
                    const ytMatch = previewAd.video_url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/)
                    const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null
                    if (ytId) {
                      return (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
                          className="w-full h-full object-cover pointer-events-none scale-105"
                          allow="autoplay; encrypted-media"
                        />
                      )
                    }
                    const tiktokMatch = previewAd.video_url.match(/tiktok\.com\/@.*\/video\/(\d+)/)
                    const tiktokId = tiktokMatch ? tiktokMatch[1] : null
                    if (tiktokId) {
                      return (
                        <iframe
                          src={`https://www.tiktok.com/embed/v2/${tiktokId}`}
                          className="w-full h-full object-cover pointer-events-none"
                          allow="autoplay; encrypted-media"
                        />
                      )
                    }
                    return (
                      <video src={previewAd.video_url} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    )
                  })()
                ) : previewAd.image_url ? (
                  <img src={previewAd.image_url} alt={previewAd.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-black p-6 text-center">
                    <p className="text-white font-black text-xl">{previewAd.title}</p>
                  </div>
                )}
                
                {/* Foreground Overlay mimicking customer view */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent p-4 flex flex-col justify-end">
                  <h4 className="text-white font-black text-base leading-tight uppercase tracking-tight line-clamp-2 mb-1">{previewAd.title}</h4>
                  {previewAd.description && (
                    <p className="text-[11px] text-slate-300 leading-normal line-clamp-3 mb-3">{previewAd.description}</p>
                  )}
                  {previewAd.link_url && (
                    <div className="w-full py-2.5 rounded-xl bg-indigo-600 text-white text-center text-xs font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-indigo-600/35">
                      {previewAd.cta_text || 'Learn More'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Campaign Details & Moderate Actions (Right/Bottom side) */}
            <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-white text-2xl uppercase tracking-tighter">Campaign Moderation</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Review the creative, links, and targeting configuration.</p>
                  </div>
                  <button 
                    onClick={() => setPreviewAd(null)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Campaign Title</p>
                      <p className="text-white font-bold text-sm">{previewAd.title}</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Ad Category</p>
                      <p className="text-white font-bold text-sm">{previewAd.category || 'Uncategorized'}</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Description</p>
                    <p className="text-slate-300 text-xs leading-relaxed">{previewAd.description || 'No description provided.'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">CPV Bid Rate</p>
                      <p className="text-emerald-400 font-bold text-sm">RM {previewAd.cpv_bid || '0.00'}/view</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Advertiser Profile</p>
                      <p className="text-slate-400 font-mono text-[10px] truncate" title={previewAd.advertiser_id}>{previewAd.advertiser_id || 'System Campaign'}</p>
                    </div>
                  </div>

                  <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><MapPin size={11} className="text-indigo-400" /> Targeting Range</p>
                    {previewAd.target_latitude && previewAd.target_longitude ? (
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <span className="text-slate-300 text-xs font-mono">GPS: {previewAd.target_latitude}, {previewAd.target_longitude}</span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Radius: {previewAd.target_radius_km || 5} km</span>
                      </div>
                    ) : (
                      <span className="text-indigo-400 font-black text-[10px] uppercase tracking-widest bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">Global Campaign (All Pagers)</span>
                    )}
                  </div>

                  {previewAd.link_url && (
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Target Link URL</p>
                        <p className="text-slate-300 font-mono text-xs truncate">{previewAd.link_url}</p>
                      </div>
                      <a 
                        href={previewAd.link_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-white hover:bg-indigo-600 hover:border-indigo-500 transition-all shrink-0"
                      >
                        Visit Link <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Moderate Buttons */}
              <div className="flex flex-col md:flex-row items-center gap-4 mt-8 pt-6 border-t border-white/5">
                <button
                  onClick={async () => {
                    await handleApproveAd(previewAd.id)
                    setPreviewAd(null)
                  }}
                  disabled={adsModerating === previewAd.id}
                  className="w-full md:flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {adsModerating === previewAd.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve Campaign
                </button>
                <button
                  onClick={async () => {
                    await handleRejectAd(previewAd.id)
                    setPreviewAd(null)
                  }}
                  disabled={adsModerating === previewAd.id}
                  className="w-full md:flex-1 py-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-black text-xs uppercase tracking-widest transition-all border border-rose-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {adsModerating === previewAd.id ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Reject Campaign
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color, trend }: { icon: React.ReactNode, label: string, value: string | number, color: string, trend: string }) {
  const colors: any = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
    rose: 'from-rose-500/20 to-rose-500/5 text-rose-500 border-rose-500/20'
  }

  return (
    <div className={`relative group p-8 rounded-[32px] bg-gradient-to-br border backdrop-blur-3xl transition-all duration-500 hover:scale-[1.02] ${colors[color]}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 transition-transform duration-500 group-hover:rotate-12">
          {icon}
        </div>
        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest opacity-60">
          <ArrowUpRight size={12} />
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">{label}</p>
        <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
      </div>
      
      {/* Subtle Bottom Glow */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 blur-md opacity-40 group-hover:opacity-100 transition-opacity ${color === 'indigo' ? 'bg-indigo-500' : color === 'amber' ? 'bg-amber-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
    </div>
  )
}

function CircularMeter({ percentage, label, color, limit, current, description }: any) {
  const safePercentage = Math.min(Math.max(percentage, 0), 100)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;
  
  const isDanger = safePercentage >= 80;
  const strokeColor = isDanger ? 'stroke-rose-500' : color === 'indigo' ? 'stroke-indigo-500' : color === 'emerald' ? 'stroke-emerald-500' : 'stroke-amber-500';

  return (
    <div className={`relative p-8 rounded-[32px] bg-white/[0.01] border transition-all duration-500 ${isDanger ? 'border-rose-500/30 shadow-[0_0_30px_-5px_rgba(244,63,94,0.1)] hover:bg-rose-500/5' : 'border-white/5 hover:bg-white/[0.03]'}`}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{label}</p>
             <p className="text-2xl font-black text-white">{current}</p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Limit: {limit}</p>
          </div>
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r={radius} className="stroke-white/5 fill-none" strokeWidth="8" />
              <circle 
                cx="50" cy="50" r={radius} 
                className={`${strokeColor} fill-none transition-all duration-1000 ease-out`} 
                strokeWidth="8" 
                strokeLinecap="round"
                style={{ strokeDasharray: circumference, strokeDashoffset }} 
              />
            </svg>
            <div className={`absolute inset-0 flex flex-col items-center justify-center ${isDanger ? 'animate-pulse text-rose-500' : 'text-white'}`}>
               <span className="text-sm font-black">{safePercentage.toFixed(1)}</span>
               <span className="text-[8px] font-bold uppercase tracking-widest">%</span>
            </div>
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 leading-relaxed min-h-[40px]">{description}</p>
          {isDanger && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2 text-rose-400">
               <AlertCircle size={14} className="shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold leading-tight">Critical Limit Reached. Consider upgrading your plan immediately.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
