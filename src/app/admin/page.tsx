'use client'

// VERCEL_FORCE_REBUILD_FINAL_V4
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { PremiumPagerZone } from '@/components/pager/PremiumPagerZone'
import { 
  CheckCircle, XCircle, ShieldCheck, 
  Loader2, Search, Smartphone, Store,
  Zap, Clock, BarChart3, Globe, ExternalLink,
  ChevronRight, ArrowUpRight, TrendingUp, AlertCircle, LogOut, ArrowLeft,
  Tv, PlayCircle, Image, Plus, Trash2, Eye, MousePointerClick, Percent,
  MapPin, DollarSign, Clock3, Activity, Users, WifiOff, CheckCheck, Gauge
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
  const lang: 'bm' | 'en' = 'en' as 'bm' | 'en'
  const [merchants, setMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [merchantSort, setMerchantSort] = useState<'latest' | 'today' | 'monthly'>('latest')
  const [stats, setStats] = useState({
    totalMerchants: 0,
    totalOrders: 0,
    ordersToday: 0,
    estimatedRevenue: 0
  })

  // Location form state per merchant
  const [locationFormId, setLocationFormId] = useState<string | null>(null)
  const [locationForm, setLocationForm] = useState({ latitude: '', longitude: '', category: '', state: '' })
  const [savingLocation, setSavingLocation] = useState(false)

  // Ads State
  const [activeTab, setActiveTab] = useState<'merchants' | 'ads' | 'infra' | 'behavior' | 'visitors' | 'partners'>('merchants')
  const [adsSubTab, setAdsSubTab] = useState<'active' | 'pending' | 'all'>('active')
  const [ads, setAds] = useState<any[]>([])
  const [adsLoading, setAdsLoading] = useState(false)
  const [isAddingAd, setIsAddingAd] = useState(false)
  // Partners state
  const [partners, setPartners] = useState<any[]>([])
  const [partnerTransactions, setPartnerTransactions] = useState<Record<string, any[]>>({})
  const [partnerPayouts, setPartnerPayouts] = useState<Record<string, any[]>>({})
  const [partnersLoading, setPartnersLoading] = useState(false)
  const [partnerPayoutMonth, setPartnerPayoutMonth] = useState('')
  const [partnerPayoutNote, setPartnerPayoutNote] = useState('')
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

  // Behavior Analytics State
  const [behaviorStats, setBehaviorStats] = useState<{
    totalLoads: number
    totalActivated: number
    totalTestBeeps: number
    totalAlarmDismissed: number
    totalOfflineEvents: number
    avgDurationSeconds: number
    browserBreakdown: Record<string, number>
    osBreakdown: Record<string, number>
  } | null>(null)
  const [behaviorLog, setBehaviorLog] = useState<any[]>([])
  const [behaviorLoading, setBehaviorLoading] = useState(false)

  // Visitor Analytics State
  const [visitorStats, setVisitorStats] = useState<{
    totalViews: number
    uniquePaths: number
    pathBreakdown: Record<string, number>
    referrerBreakdown: Record<string, number>
    browserBreakdown: Record<string, number>
    osBreakdown: Record<string, number>
  } | null>(null)
  const [visitorLog, setVisitorLog] = useState<any[]>([])
  const [visitorLoading, setVisitorLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    try {
      // Use server-side API route (service role) to bypass RLS
      const res = await fetch('/api/admin/merchants')
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to fetch merchants')
      }
      const { merchants: merchantList, stats: fetchedStats } = await res.json()
      setMerchants(merchantList || [])
      setStats(fetchedStats || { totalMerchants: 0, totalOrders: 0, ordersToday: 0, estimatedRevenue: 0 })
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
        const enrichedAds = await Promise.all(
          adsData.map(async (ad: any) => {
            // Fetch impressions count
            const { count: impressions } = await supabase
              .from('ad_analytics')
              .select('*', { count: 'exact', head: true })
              .eq('ad_id', ad.id)
              .eq('event_type', 'impression')

            // Fetch clicks count
            const { count: clicks } = await supabase
              .from('ad_analytics')
              .select('*', { count: 'exact', head: true })
              .eq('ad_id', ad.id)
              .eq('event_type', 'click')

            const impCount = impressions || 0
            const clickCount = clicks || 0

            return { 
              ...ad, 
              impressions: impCount, 
              clicks: clickCount, 
              ctr: impCount > 0 ? ((clickCount / impCount) * 100).toFixed(1) : '0.0' 
            }
          })
        )
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

  const fetchBehaviorData = useCallback(async () => {
    setBehaviorLoading(true)
    try {
      // Fetch the latest 50 events for the activity log
      const { data: logData } = await supabase
        .from('pager_analytics')
        .select('*, sessions(receipt_number, merchant_id), merchants(name)')
        .order('created_at', { ascending: false })
        .limit(50)

      if (logData) setBehaviorLog(logData)

      // Aggregate counts for stat cards
      const eventTypes = ['page_loaded', 'pager_activated', 'test_beep_clicked', 'alarm_dismissed', 'offline'] as const
      const counts: Record<string, number> = {}
      for (const et of eventTypes) {
        const { count } = await supabase
          .from('pager_analytics')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', et)
        counts[et] = count ?? 0
      }

      // Average duration from heartbeat events
      const { data: heartbeats } = await supabase
        .from('pager_analytics')
        .select('elapsed_seconds')
        .eq('event_type', 'heartbeat')
        .not('elapsed_seconds', 'is', null)
        .order('elapsed_seconds', { ascending: false })
        .limit(500)

      const avgDuration = heartbeats && heartbeats.length > 0
        ? Math.round(heartbeats.reduce((acc, h) => acc + (h.elapsed_seconds ?? 0), 0) / heartbeats.length)
        : 0

      // Device breakdowns from all events
      const { data: allRows } = await supabase
        .from('pager_analytics')
        .select('browser, os')
        .order('created_at', { ascending: false })
        .limit(500)

      const browserBreakdown: Record<string, number> = {}
      const osBreakdown: Record<string, number> = {}
      if (allRows) {
        for (const row of allRows) {
          if (row.browser) browserBreakdown[row.browser] = (browserBreakdown[row.browser] ?? 0) + 1
          if (row.os) osBreakdown[row.os] = (osBreakdown[row.os] ?? 0) + 1
        }
      }

      setBehaviorStats({
        totalLoads: counts['page_loaded'] ?? 0,
        totalActivated: counts['pager_activated'] ?? 0,
        totalTestBeeps: counts['test_beep_clicked'] ?? 0,
        totalAlarmDismissed: counts['alarm_dismissed'] ?? 0,
        totalOfflineEvents: counts['offline'] ?? 0,
        avgDurationSeconds: avgDuration,
        browserBreakdown,
        osBreakdown,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setBehaviorLoading(false)
    }
  }, [])

  const fetchVisitorsData = useCallback(async () => {
    setVisitorLoading(true)
    try {
      // 1. Get the total count of page views
      const { count: totalViewsCount } = await supabase
        .from('page_views')
        .select('*', { count: 'exact', head: true })

      // 2. Fetch the latest 100 page views for the activity log
      const { data: logData } = await supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (logData) setVisitorLog(logData)

      // 3. Fetch the latest 1000 page views to compute breakdowns
      const { data: recentViews } = await supabase
        .from('page_views')
        .select('path, referrer, browser, os')
        .order('created_at', { ascending: false })
        .limit(1000)

      const pathBreakdown: Record<string, number> = {}
      const referrerBreakdown: Record<string, number> = {}
      const browserBreakdown: Record<string, number> = {}
      const osBreakdown: Record<string, number> = {}
      const uniquePathsSet = new Set<string>()

      if (recentViews) {
        for (const view of recentViews) {
          if (view.path) {
            pathBreakdown[view.path] = (pathBreakdown[view.path] ?? 0) + 1
            uniquePathsSet.add(view.path)
          }
          if (view.referrer) {
            const ref = view.referrer.trim()
            referrerBreakdown[ref] = (referrerBreakdown[ref] ?? 0) + 1
          } else {
            referrerBreakdown['Direct / None'] = (referrerBreakdown['Direct / None'] ?? 0) + 1
          }
          if (view.browser) {
            browserBreakdown[view.browser] = (browserBreakdown[view.browser] ?? 0) + 1
          }
          if (view.os) {
            osBreakdown[view.os] = (osBreakdown[view.os] ?? 0) + 1
          }
        }
      }

      setVisitorStats({
        totalViews: totalViewsCount ?? 0,
        uniquePaths: uniquePathsSet.size,
        pathBreakdown,
        referrerBreakdown,
        browserBreakdown,
        osBreakdown,
      })
    } catch (e) {
      console.error(e)
    } finally {
      setVisitorLoading(false)
    }
  }, [])

  const fetchPartnersData = useCallback(async () => {
    if (!isAdmin) return
    setPartnersLoading(true)
    const { data: partnerList } = await supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })
    if (partnerList) {
      setPartners(partnerList)
      // For each partner, fetch their referred merchants' transactions
      for (const p of partnerList) {
        const { data: merchantIds } = await supabase
          .from('merchants')
          .select('id')
          .eq('referred_by', p.referral_code)
        const ids = merchantIds?.map((m: any) => m.id) || []
        if (ids.length > 0) {
          const { data: txs } = await supabase
            .from('merchant_transactions')
            .select('*')
            .in('merchant_id', ids)
            .eq('status', 'completed')
          setPartnerTransactions(prev => ({ ...prev, [p.id]: txs || [] }))
        }
        const { data: pays } = await supabase
          .from('partner_payouts')
          .select('*')
          .eq('partner_id', p.id)
          .order('created_at', { ascending: false })
        setPartnerPayouts(prev => ({ ...prev, [p.id]: pays || [] }))
      }
    }
    setPartnersLoading(false)
  }, [isAdmin])

  useEffect(() => {
    if (isAdmin && activeTab === 'ads') {
      fetchAds()
    }
    if (isAdmin && activeTab === 'infra') {
      fetchInfraData()
      const interval = setInterval(fetchInfraData, 60000) // Poll every 60s
      return () => clearInterval(interval)
    }
    if (isAdmin && activeTab === 'behavior') {
      fetchBehaviorData()
    }
    if (isAdmin && activeTab === 'visitors') {
      fetchVisitorsData()
    }
  }, [isAdmin, activeTab, fetchAds, fetchInfraData, fetchBehaviorData, fetchVisitorsData])

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
    try {
      const res = await fetch('/api/admin/merchants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert('Error: ' + (err.error || 'Unknown error'))
      } else {
        setMerchants(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m))
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    }
    setVerifyingId(null)
  }

  const handleSaveLocation = async (merchantId: string) => {
    setSavingLocation(true)
    const updates: any = {}
    updates.latitude = locationForm.latitude ? parseFloat(locationForm.latitude) : null
    updates.longitude = locationForm.longitude ? parseFloat(locationForm.longitude) : null
    updates.category = locationForm.category || null
    updates.state = locationForm.state || null
    await updateMerchant(merchantId, updates)
    setSavingLocation(false)
    setLocationFormId(null)
    setLocationForm({ latitude: '', longitude: '', category: '', state: '' })
  }

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  const filteredMerchants = merchants
    .filter(m => 
      m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone?.includes(searchQuery) ||
      m.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (merchantSort === 'today') {
        return (b.today_count || 0) - (a.today_count || 0)
      }
      if (merchantSort === 'monthly') {
        return (b.monthly_count || 0) - (a.monthly_count || 0)
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

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
              {lang === 'bm' ? 'Papan Pemuka' : 'Dashboard'}
            </button>
            <button 
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
            >
              <LogOut size={16} />
              {lang === 'bm' ? 'Log Keluar' : 'Sign Out'}
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-4 mb-10 p-2 bg-white/[0.02] border border-white/5 rounded-3xl w-max mx-auto md:mx-0 shadow-inner">
          <button
            onClick={() => setActiveTab('merchants')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'merchants' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Store size={16} /> {lang === 'bm' ? 'Direktori' : 'Directory'}
          </button>
          <button
            onClick={() => setActiveTab('ads')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'ads' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Tv size={16} /> {lang === 'bm' ? 'Rangkaian Iklan' : 'Ad Network'}
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
          <button
            onClick={() => setActiveTab('behavior')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'behavior' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Activity size={16} /> Behavior
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'visitors' ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <Users size={16} /> Visitors
          </button>
          <button
            onClick={() => { setActiveTab('partners'); fetchPartnersData() }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'partners' ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
          >
            <DollarSign size={16} /> Partners
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
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            <span className="text-slate-500">Sort:</span>
            <select
              value={merchantSort}
              onChange={(e) => setMerchantSort(e.target.value as any)}
              className="bg-transparent text-white font-black uppercase outline-none cursor-pointer pr-1"
            >
              <option value="latest" className="bg-[#0a0b0f] text-white">Latest Joined</option>
              <option value="today" className="bg-[#0a0b0f] text-white">Today's Pagers</option>
              <option value="monthly" className="bg-[#0a0b0f] text-white">Monthly Pagers</option>
            </select>
          </div>
        </div>

        {activeTab === 'merchants' && (
          <div className={`transition-opacity duration-300 ${loading && merchants.length > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
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
                    {loading && merchants.length === 0 ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <Skeleton className="w-12 h-12 rounded-xl" />
                              <div className="space-y-2">
                                <Skeleton className="w-32 h-4" />
                                <div className="flex items-center gap-2">
                                  <Skeleton className="w-12 h-3" />
                                  <Skeleton className="w-16 h-3" />
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Skeleton className="w-4 h-4 rounded-full" />
                              <Skeleton className="w-20 h-3" />
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Skeleton className="w-32 h-3" />
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-col gap-1.5 max-w-[120px]">
                              <Skeleton className="w-8 h-4" />
                              <Skeleton className="w-full h-1.5 rounded-full" />
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <Skeleton className="w-28 h-8 rounded-xl" />
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Skeleton className="w-24 h-8 rounded-xl" />
                              <Skeleton className="w-20 h-8 rounded-xl" />
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : filteredMerchants.map((m) => {
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
                              <div className="flex flex-col gap-1 min-w-[110px]">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Today</span>
                                  <span className="text-xs font-black text-white bg-white/5 border border-white/10 px-2 py-0.5 rounded">{m.today_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Month</span>
                                  <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">{m.monthly_count || 0}</span>
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
                                    updates.last_bill_code = 'admin_override'
                                  } else {
                                    updates.subscription_status = null
                                    updates.expiry_date = null
                                    updates.last_bill_code = null
                                  }
                                  updateMerchant(m.id, updates)
                                }}
                                disabled={verifyingId === m.id}
                                className="w-full max-w-[140px] px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer hover:bg-white/[0.06]"
                              >
                                <option value="free" className="bg-[#0a0b0f] text-white">Trial (Free)</option>
                                <option value="pro" className="bg-[#0a0b0f] text-white">Pro (RM49)</option>
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
                                        category: m.category || '',
                                        state: m.state || ''
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
                                  <a 
                                    href={`https://wa.me/${(() => {
                                      const cleaned = m.phone.replace(/\D/g, '');
                                      return cleaned.startsWith('0') ? '6' + cleaned : cleaned;
                                    })()}`} 
                                    target="_blank" 
                                    className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all"
                                  >
                                    <Smartphone size={14} />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                          {isEditingLocation && (
                            <tr key={`${m.id}-location`} className="bg-indigo-500/5 border-b border-indigo-500/20">
                              <td colSpan={6} className="px-6 py-5">
                                <div className="flex flex-col gap-4">
                                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                    <MapPin size={12} /> Set Location & Category for {m.name || 'this merchant'}
                                  </p>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">State (Negeri)</label>
                                      <select
                                        value={locationForm.state}
                                        onChange={e => setLocationForm(f => ({ ...f, state: e.target.value }))}
                                        className="w-full px-3 py-2.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white text-xs outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                      >
                                        <option value="" className="bg-[#0a0b0f]">Select state...</option>
                                        {['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Pahang', 'Negeri Sembilan', 'Melaka', 'Kedah', 'Kelantan', 'Terengganu', 'Perlis', 'Sabah', 'Sarawak', 'Labuan', 'Putrajaya'].map(st => (
                                          <option key={st} value={st} className="bg-[#0a0b0f]">{st}</option>
                                        ))}
                                      </select>
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
          </div>
        )}

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
              <StatCard icon={<Tv size={20} />} label="Total Ads" value={ads.length} color="indigo" trend="All Statuses" isLoading={adsLoading && ads.length === 0} />
              <StatCard icon={<Eye size={20} />} label="Impressions" value={ads.reduce((acc, ad) => acc + ad.impressions, 0).toLocaleString()} color="amber" trend="Total Views" isLoading={adsLoading && ads.length === 0} />
              <StatCard icon={<MousePointerClick size={20} />} label="Total Clicks" value={ads.reduce((acc, ad) => acc + ad.clicks, 0).toLocaleString()} color="emerald" trend="Engagements" isLoading={adsLoading && ads.length === 0} />
              <StatCard icon={<DollarSign size={20} />} label="CPV Revenue" value={`RM ${totalCpvRevenue.toFixed(2)}`} color="rose" trend="Total Debit" isLoading={adsLoading && ads.length === 0} />
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

            <div className={`transition-opacity duration-300 ${adsLoading && ads.length > 0 ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500 bg-white/[0.01]">
                        <th className="py-5 px-6 font-black">Ad Campaign</th>
                        <th className="py-5 px-6 font-black">CPV Bid</th>
                        <th className="py-5 px-6 font-black">Category</th>
                        <th className="py-5 px-6 font-black">Performance Stats</th>
                        <th className="py-5 px-6 font-black">Status</th>
                        <th className="py-5 px-6 font-black text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {adsLoading && ads.length === 0 ? (
                        Array.from({ length: 4 }).map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <Skeleton className="w-10 h-16 rounded-lg" />
                                <div className="space-y-2">
                                  <Skeleton className="w-32 h-4" />
                                  <Skeleton className="w-48 h-3" />
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Skeleton className="w-16 h-4" />
                            </td>
                            <td className="py-4 px-6">
                              <Skeleton className="w-16 h-5 rounded-lg" />
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <Skeleton className="w-20 h-3" />
                                <Skeleton className="w-20 h-3" />
                                <Skeleton className="w-20 h-3" />
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Skeleton className="w-16 h-5 rounded-lg" />
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex justify-end gap-2">
                                <Skeleton className="w-20 h-8 rounded-xl" />
                                <Skeleton className="w-10 h-8 rounded-xl" />
                                <Skeleton className="w-8 h-8 rounded-xl" />
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        displayedAds.map((ad) => (
                          <tr key={ad.id} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="absolute -inset-1 blur-sm rounded-lg opacity-20 bg-indigo-500" />
                                  <div className="relative w-10 h-16 rounded-lg bg-white/[0.03] border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                    {ad.image_url ? (
                                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover" />
                                    ) : ad.video_url ? (
                                      <div className="w-full h-full flex items-center justify-center bg-indigo-950/20">
                                        <PlayCircle size={18} className="text-indigo-400" />
                                      </div>
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                        <Tv size={18} className="text-slate-600" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors truncate max-w-[200px]" title={ad.title}>
                                    {ad.title}
                                  </p>
                                  {ad.description && (
                                    <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[250px]" title={ad.description}>
                                      {ad.description}
                                    </p>
                                  )}
                                  {ad.link_url && (
                                    <a 
                                      href={ad.link_url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="flex items-center gap-1 mt-1 text-[10px] text-indigo-400/80 hover:text-indigo-400 font-mono truncate max-w-[200px]"
                                    >
                                      {ad.cta_text || 'Link'} <ExternalLink size={8} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              {ad.cpv_bid ? (
                                <span className="text-emerald-400 text-xs font-mono font-bold">RM {ad.cpv_bid.toFixed(3)}</span>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {ad.category ? (
                                <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                                  {ad.category}
                                </span>
                              ) : (
                                <span className="text-slate-600 text-xs">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex flex-col gap-0.5 text-xs text-slate-400">
                                <div>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Views:</span>{' '}
                                  <span className="font-mono text-white font-bold">{ad.impressions || 0}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Clicks:</span>{' '}
                                  <span className="font-mono text-white font-bold">{ad.clicks || 0}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CTR:</span>{' '}
                                  <span className="font-mono text-emerald-400 font-bold">{ad.ctr || '0.0'}%</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${
                                ad.status === 'active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : ad.status === 'pending_review' 
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                                    : ad.status === 'paused' 
                                      ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                                      : ad.status === 'rejected'
                                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                        : 'bg-white/5 text-slate-400 border-white/10'
                              }`}>
                                {ad.status || 'unknown'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setPreviewAd(ad)}
                                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 font-black text-[9px] uppercase tracking-widest transition-all"
                                  title="Preview Ad"
                                >
                                  <Eye size={11} />
                                  Preview
                                </button>
                                
                                {ad.status === 'pending_review' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleApproveAd(ad.id)}
                                      disabled={adsModerating === ad.id}
                                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-50"
                                      title="Approve"
                                    >
                                      {adsModerating === ad.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
                                      Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRejectAd(ad.id)}
                                      disabled={adsModerating === ad.id}
                                      className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 font-black text-[9px] uppercase tracking-widest transition-all disabled:opacity-50"
                                      title="Reject"
                                    >
                                      {adsModerating === ad.id ? <Loader2 size={11} className="animate-spin" /> : <XCircle size={11} />}
                                      Reject
                                    </button>
                                  </>
                                )}

                                <button
                                  type="button"
                                  onClick={() => toggleAdActive(ad.id, ad.is_active)}
                                  className={`px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                                    ad.is_active 
                                      ? 'bg-indigo-600 text-white hover:bg-indigo-500' 
                                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                  }`}
                                  title={ad.is_active ? 'Turn OFF' : 'Turn ON'}
                                >
                                  {ad.is_active ? 'ON' : 'OFF'}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteAd(ad.id)}
                                  className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all shrink-0"
                                  title="Delete Ad"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {displayedAds.length === 0 && !adsLoading && (
              <div className="text-center py-20 bg-white/[0.01] rounded-[40px] border border-dashed border-white/10">
                <Tv size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">
                  {adsSubTab === 'pending' 
                    ? 'No pending ads. All caught up!' 
                    : 'No campaigns found for this section.'}
                </p>
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

            <div className={`transition-opacity duration-300 ${infraLoading && infraData ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <CircularMeter 
                  percentage={infraData ? (infraData.supabase.databaseSizeBytes / infraData.supabase.databaseLimitBytes) * 100 : 0}
                  label="Supabase DB Size"
                  color="indigo"
                  limit={infraData ? `${(infraData.supabase.databaseLimitBytes / 1024 / 1024).toFixed(0)}MB` : ''}
                  current={infraData ? `${(infraData.supabase.databaseSizeBytes / 1024 / 1024).toFixed(2)}MB` : ''}
                  description="Total database size consumed by active sessions, pagers, and merchants."
                  isLoading={infraLoading && !infraData}
                />
                <CircularMeter 
                  percentage={infraData ? (infraData.supabase.storageSizeBytes / infraData.supabase.storageLimitBytes) * 100 : 0}
                  label="Supabase Storage"
                  color="emerald"
                  limit={infraData ? `${(infraData.supabase.storageLimitBytes / 1024 / 1024 / 1024).toFixed(0)}GB` : ''}
                  current={infraData ? `${(infraData.supabase.storageSizeBytes / 1024 / 1024).toFixed(2)}MB` : ''}
                  description="Total storage consumed by WebP compressed merchant logos."
                  isLoading={infraLoading && !infraData}
                />
                <CircularMeter 
                  percentage={infraData ? (infraData.vercel.bandwidthBytes / infraData.vercel.bandwidthLimitBytes) * 100 : 0}
                  label="Vercel Bandwidth"
                  color="amber"
                  limit={infraData ? `${(infraData.vercel.bandwidthLimitBytes / 1024 / 1024 / 1024).toFixed(0)}GB` : ''}
                  current={infraData ? `${(infraData.vercel.bandwidthBytes / 1024 / 1024 / 1024).toFixed(4)}GB` : ''}
                  description={infraData ? (infraData.vercel.missingToken ? "Simulated data. Set VERCEL_ACCESS_TOKEN for exact API sync." : "Actual bandwidth used this billing cycle.") : ""}
                  isLoading={infraLoading && !infraData}
                />
              </div>
            </div>
            
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

      {/* ─────────────────────────────────────── */}
      {/* BEHAVIOR TAB                            */}
      {/* ─────────────────────────────────────── */}
      {activeTab === 'behavior' && (
        <div className="max-w-7xl mx-auto relative z-10 mt-0 space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Customer Behavior Analytics</h2>
              <p className="text-[10px] font-bold text-slate-600">How customers interact with the virtual pager page.</p>
            </div>
            <button
              onClick={fetchBehaviorData}
              disabled={behaviorLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs font-black text-violet-400 hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50"
            >
              {behaviorLoading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
              Refresh
            </button>
          </div>

          <div className={`transition-opacity duration-300 ${behaviorLoading && behaviorStats ? 'opacity-60 pointer-events-none' : ''}`}>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatCard
                icon={<Users size={20} />}
                label="Page Loads"
                value={behaviorStats ? behaviorStats.totalLoads.toLocaleString() : 0}
                color="indigo"
                trend="All time"
                isLoading={behaviorLoading && !behaviorStats}
              />
              <StatCard
                icon={<CheckCheck size={20} />}
                label="Activated"
                value={behaviorStats && behaviorStats.totalLoads > 0
                  ? `${((behaviorStats.totalActivated / behaviorStats.totalLoads) * 100).toFixed(1)}%`
                  : '—'}
                color="emerald"
                trend={behaviorStats ? `${behaviorStats.totalActivated} total` : ''}
                isLoading={behaviorLoading && !behaviorStats}
              />
              <StatCard
                icon={<Gauge size={20} />}
                label="Avg Duration"
                value={behaviorStats && behaviorStats.avgDurationSeconds > 0
                  ? `${Math.floor(behaviorStats.avgDurationSeconds / 60)}m ${behaviorStats.avgDurationSeconds % 60}s`
                  : '—'}
                color="amber"
                trend="Per session"
                isLoading={behaviorLoading && !behaviorStats}
              />
              <StatCard
                icon={<Activity size={20} />}
                label="Test Beeps"
                value={behaviorStats && behaviorStats.totalLoads > 0
                  ? `${((behaviorStats.totalTestBeeps / behaviorStats.totalLoads) * 100).toFixed(1)}%`
                  : '—'}
                color="indigo"
                trend={behaviorStats ? `${behaviorStats.totalTestBeeps} total` : ''}
                isLoading={behaviorLoading && !behaviorStats}
              />
              <StatCard
                icon={<WifiOff size={20} />}
                label="Offline Events"
                value={behaviorStats ? behaviorStats.totalOfflineEvents.toLocaleString() : 0}
                color="rose"
                trend="Network drops"
                isLoading={behaviorLoading && !behaviorStats}
              />
              <StatCard
                icon={<Zap size={20} />}
                label="Alarm Dismissed"
                value={behaviorStats ? behaviorStats.totalAlarmDismissed.toLocaleString() : 0}
                color="amber"
                trend="Dings silenced"
                isLoading={behaviorLoading && !behaviorStats}
              />
            </div>

            {/* ── Device Breakdown ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Browser */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5 flex items-center gap-2">
                  <Globe size={13} /> Browser Breakdown
                </p>
                <div className="space-y-3">
                  {behaviorLoading && !behaviorStats ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="w-16 h-3" />
                          <Skeleton className="w-10 h-3" />
                        </div>
                        <Skeleton className="w-full h-1.5 rounded-full" />
                      </div>
                    ))
                  ) : behaviorStats ? (
                    Object.entries(behaviorStats.browserBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([browser, count]) => {
                        const total = Object.values(behaviorStats.browserBreakdown).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
                        return (
                          <div key={browser}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white/80">{browser}</span>
                              <span className="text-[10px] font-mono text-slate-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  ) : null}
                  {behaviorStats && Object.keys(behaviorStats.browserBreakdown).length === 0 && (
                    <p className="text-slate-600 text-xs">No data yet.</p>
                  )}
                </div>
              </div>

              {/* OS */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5 flex items-center gap-2">
                  <Smartphone size={13} /> OS Breakdown
                </p>
                <div className="space-y-3">
                  {behaviorLoading && !behaviorStats ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="w-16 h-3" />
                          <Skeleton className="w-10 h-3" />
                        </div>
                        <Skeleton className="w-full h-1.5 rounded-full" />
                      </div>
                    ))
                  ) : behaviorStats ? (
                    Object.entries(behaviorStats.osBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([os, count]) => {
                        const total = Object.values(behaviorStats.osBreakdown).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
                        return (
                          <div key={os}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white/80">{os}</span>
                              <span className="text-[10px] font-mono text-slate-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-violet-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  ) : null}
                  {behaviorStats && Object.keys(behaviorStats.osBreakdown).length === 0 && (
                    <p className="text-slate-600 text-xs">No data yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Activity Log ── */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden mt-8">
              <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                  <Clock size={13} /> Latest 50 Events
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500 bg-white/[0.01]">
                      <th className="py-4 px-5 font-black">Event</th>
                      <th className="py-4 px-5 font-black">Session / Receipt</th>
                      <th className="py-4 px-5 font-black">Device</th>
                      <th className="py-4 px-5 font-black">Duration</th>
                      <th className="py-4 px-5 font-black text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {behaviorLoading && !behaviorStats ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-3 px-5">
                            <Skeleton className="w-24 h-5 rounded-lg" />
                          </td>
                          <td className="py-3 px-5">
                            <Skeleton className="w-16 h-4" />
                          </td>
                          <td className="py-3 px-5">
                            <Skeleton className="w-32 h-4" />
                          </td>
                          <td className="py-3 px-5">
                            <Skeleton className="w-16 h-4" />
                          </td>
                          <td className="py-3 px-5 text-right">
                            <Skeleton className="w-24 h-4 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      behaviorLog.map((row) => {
                        const eventColors: Record<string, string> = {
                          page_loaded: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
                          pager_activated: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
                          test_beep_clicked: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
                          alarm_dismissed: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
                          warning_dismissed: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
                          offline: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
                          online: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
                          heartbeat: 'bg-white/5 text-slate-400 border-white/10',
                          visibility_hidden: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                          visibility_visible: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
                          qr_scanner_opened: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                          qr_scanner_closed: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
                          qr_code_scanned: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
                        }
                        const colorClass = eventColors[row.event_type] || 'bg-white/5 text-slate-400 border-white/10'
                        const receiptNum = row.sessions?.receipt_number ?? '—'
                        return (
                          <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-5">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${colorClass}`}>
                                {row.event_type}
                              </span>
                            </td>
                            <td className="py-3 px-5">
                              <span className="text-xs font-mono text-slate-400">#{receiptNum}</span>
                            </td>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-medium">{row.os ?? '—'}</span>
                                <span className="text-white/20">·</span>
                                <span className="text-[10px] text-slate-500">{row.browser ?? '—'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-5">
                              {row.elapsed_seconds != null
                                ? <span className="text-xs font-mono text-slate-400">{Math.floor(row.elapsed_seconds / 60)}m {row.elapsed_seconds % 60}s</span>
                                : <span className="text-slate-700">—</span>}
                            </td>
                            <td className="py-3 px-5 text-right">
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(row.created_at).toLocaleString('en-MY', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────── */}
      {/* VISITORS TAB                            */}
      {/* ─────────────────────────────────────── */}
      {activeTab === 'visitors' && (
        <div className="max-w-7xl mx-auto relative z-10 mt-0 space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Page Visitor Analytics</h2>
              <p className="text-[10px] font-bold text-slate-600">Track and monitor custom page view metrics directly from Supabase.</p>
            </div>
            <button
              onClick={fetchVisitorsData}
              disabled={visitorLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600/10 border border-teal-500/20 text-xs font-black text-teal-400 hover:bg-teal-600 hover:text-white transition-all disabled:opacity-50"
            >
              {visitorLoading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
              Refresh
            </button>
          </div>

          <div className={`transition-opacity duration-300 ${visitorLoading && visitorStats ? 'opacity-60 pointer-events-none' : ''}`}>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Eye size={20} />}
                label="Total Page Views"
                value={visitorStats ? visitorStats.totalViews.toLocaleString() : 0}
                color="indigo"
                trend="All pages"
                isLoading={visitorLoading && !visitorStats}
              />
              <StatCard
                icon={<Globe size={20} />}
                label="Unique Paths"
                value={visitorStats ? visitorStats.uniquePaths.toLocaleString() : 0}
                color="amber"
                trend="Different routes"
                isLoading={visitorLoading && !visitorStats}
              />
              <StatCard
                icon={<Users size={20} />}
                label="Unique Browsers"
                value={visitorStats ? Object.keys(visitorStats.browserBreakdown).length.toLocaleString() : 0}
                color="emerald"
                trend="Device types"
                isLoading={visitorLoading && !visitorStats}
              />
              <StatCard
                icon={<Smartphone size={20} />}
                label="Unique OSs"
                value={visitorStats ? Object.keys(visitorStats.osBreakdown).length.toLocaleString() : 0}
                color="rose"
                trend="Operating systems"
                isLoading={visitorLoading && !visitorStats}
              />
            </div>

            {/* ── Popular Pages & Referrers Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Popular Pages */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5 flex items-center gap-2">
                  <Globe size={13} /> Popular Pages (Top 10)
                </p>
                <div className="space-y-3">
                  {visitorLoading && !visitorStats ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="w-1/2 h-3" />
                          <Skeleton className="w-10 h-3" />
                        </div>
                        <Skeleton className="w-full h-1.5 rounded-full" />
                      </div>
                    ))
                  ) : visitorStats ? (
                    Object.entries(visitorStats.pathBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([path, count]) => {
                        const total = Object.values(visitorStats.pathBreakdown).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
                        return (
                          <div key={path}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white/80 font-mono truncate max-w-[70%]">{path}</span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  ) : null}
                  {visitorStats && Object.keys(visitorStats.pathBreakdown).length === 0 && (
                    <p className="text-slate-600 text-xs">No data yet.</p>
                  )}
                </div>
              </div>

              {/* Referrers */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5 flex items-center gap-2">
                  <ArrowUpRight size={13} /> Top Referrers (Top 10)
                </p>
                <div className="space-y-3">
                  {visitorLoading && !visitorStats ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="w-1/2 h-3" />
                          <Skeleton className="w-10 h-3" />
                        </div>
                        <Skeleton className="w-full h-1.5 rounded-full" />
                      </div>
                    ))
                  ) : visitorStats ? (
                    Object.entries(visitorStats.referrerBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([referrer, count]) => {
                        const total = Object.values(visitorStats.referrerBreakdown).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
                        return (
                          <div key={referrer}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white/80 font-mono truncate max-w-[70%]" title={referrer}>{referrer}</span>
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  ) : null}
                  {visitorStats && Object.keys(visitorStats.referrerBreakdown).length === 0 && (
                    <p className="text-slate-600 text-xs">No data yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Browser & OS Breakdowns ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {/* Browser */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5 flex items-center gap-2">
                  <Globe size={13} /> Browser Breakdown
                </p>
                <div className="space-y-3">
                  {visitorLoading && !visitorStats ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="w-16 h-3" />
                          <Skeleton className="w-10 h-3" />
                        </div>
                        <Skeleton className="w-full h-1.5 rounded-full" />
                      </div>
                    ))
                  ) : visitorStats ? (
                    Object.entries(visitorStats.browserBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([browser, count]) => {
                        const total = Object.values(visitorStats.browserBreakdown).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
                        return (
                          <div key={browser}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white/80">{browser}</span>
                              <span className="text-[10px] font-mono text-slate-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  ) : null}
                  {visitorStats && Object.keys(visitorStats.browserBreakdown).length === 0 && (
                    <p className="text-slate-600 text-xs">No data yet.</p>
                  )}
                </div>
              </div>

              {/* OS */}
              <div className="bg-white/[0.02] border border-white/5 rounded-[28px] p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-5 flex items-center gap-2">
                  <Smartphone size={13} /> OS Breakdown
                </p>
                <div className="space-y-3">
                  {visitorLoading && !visitorStats ? (
                    Array.from({ length: 3 }).map((_, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Skeleton className="w-16 h-3" />
                          <Skeleton className="w-10 h-3" />
                        </div>
                        <Skeleton className="w-full h-1.5 rounded-full" />
                      </div>
                    ))
                  ) : visitorStats ? (
                    Object.entries(visitorStats.osBreakdown)
                      .sort((a, b) => b[1] - a[1])
                      .map(([os, count]) => {
                        const total = Object.values(visitorStats.osBreakdown).reduce((a, b) => a + b, 0)
                        const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
                        return (
                          <div key={os}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white/80">{os}</span>
                              <span className="text-[10px] font-mono text-slate-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-700"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })
                  ) : null}
                  {visitorStats && Object.keys(visitorStats.osBreakdown).length === 0 && (
                    <p className="text-slate-600 text-xs">No data yet.</p>
                  )}
                </div>
              </div>
            </div>

            {/* ── Visitor Activity Log ── */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[32px] overflow-hidden mt-8">
              <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-white/5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                  <Clock size={13} /> Latest 100 Page Views
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-slate-500 bg-white/[0.01]">
                      <th className="py-4 px-5 font-black">Path</th>
                      <th className="py-4 px-5 font-black">Referrer</th>
                      <th className="py-4 px-5 font-black">Device & Browser</th>
                      <th className="py-4 px-5 font-black">Resolution</th>
                      <th className="py-4 px-5 font-black text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {visitorLoading && !visitorStats ? (
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={idx} className="animate-pulse">
                          <td className="py-3 px-5">
                            <Skeleton className="w-32 h-4" />
                          </td>
                          <td className="py-3 px-5">
                            <Skeleton className="w-40 h-4" />
                          </td>
                          <td className="py-3 px-5">
                            <Skeleton className="w-24 h-4" />
                          </td>
                          <td className="py-3 px-5">
                            <Skeleton className="w-16 h-4" />
                          </td>
                          <td className="py-3 px-5 text-right">
                            <Skeleton className="w-24 h-4 ml-auto" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      visitorLog.map((row) => {
                        return (
                          <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-5">
                              <span className="text-xs font-mono font-bold text-teal-400">
                                {row.path}
                              </span>
                            </td>
                            <td className="py-3 px-5 max-w-[200px] truncate">
                              <span className="text-xs font-mono text-slate-400">
                                {row.referrer || 'Direct / None'}
                              </span>
                            </td>
                            <td className="py-3 px-5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-slate-400 font-medium">{row.os ?? '—'}</span>
                                <span className="text-white/20">·</span>
                                <span className="text-[10px] text-slate-500">{row.browser ?? '—'}</span>
                              </div>
                            </td>
                            <td className="py-3 px-5">
                              <span className="text-xs font-mono text-slate-400">
                                {row.screen_width && row.screen_height ? `${row.screen_width}x${row.screen_height}` : '—'}
                              </span>
                            </td>
                            <td className="py-3 px-5 text-right">
                              <span className="text-[10px] text-slate-500 font-mono">
                                {new Date(row.created_at).toLocaleString('en-MY', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ad Preview Modal Overlay */}
      {previewAd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#0a0b0f] border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
            
            {/* Phone/Ad Preview Frame (Left/Top side) */}
            <div className="w-full md:w-[380px] bg-black flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-white/5 relative shrink-0">
              <div className="w-[240px] md:w-[280px] aspect-[9/16] rounded-[24px] overflow-hidden border border-white/10 relative shadow-2xl bg-[#020203] flex flex-col">
                
                {/* ── TOP 50%: Ad Zone ── */}
                <div className="relative h-1/2 overflow-hidden bg-[#020203] flex-shrink-0">
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
                    <h4 className="text-white font-black text-sm leading-tight uppercase tracking-tight line-clamp-1 mb-0.5">@{previewAd.title}</h4>
                    {previewAd.description && (
                      <p className="text-[10px] text-slate-300 leading-normal line-clamp-2 mb-2">{previewAd.description}</p>
                    )}
                    {previewAd.link_url && (
                      <div className="w-fit px-2.5 py-1 rounded bg-white/20 backdrop-blur-md text-white text-center text-[8px] font-black uppercase tracking-widest cursor-pointer shadow-lg">
                        {previewAd.cta_text || 'Learn More'}
                      </div>
                    )}
                  </div>

                  {/* Sponsored badge */}
                  <div className="absolute top-2 right-2 z-20">
                    <span className="text-[7px] text-white/50 font-bold uppercase tracking-widest bg-black/30 backdrop-blur-sm px-1.5 py-0.5 rounded-full">Sponsored</span>
                  </div>
                </div>

                {/* ── BOTTOM 50%: Premium Pager Zone (Read-only mockup) ── */}
                {(() => {
                  const adMerchant = merchants.find((m) => m.id === previewAd.advertiser_id)
                  return (
                    <PremiumPagerZone
                      merchantName={adMerchant?.name || "BEEPME MERCHANT"}
                      merchantLogo={adMerchant?.logo_url || null}
                      receiptNumber="001"
                      lang="bm"
                      formattedWaitTime="05:00"
                      previewMode={true}
                    />
                  )
                })()}

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

      {activeTab === 'partners' && (
        <div className="max-w-7xl mx-auto relative z-10 mt-0 space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Partner &amp; Commission Console</h2>
              <p className="text-[10px] font-bold text-slate-600">Urus komisen rakan kongsi dan rekod payout.</p>
            </div>
            <button
              onClick={fetchPartnersData}
              disabled={partnersLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs font-black text-violet-400 hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50"
            >
              {partnersLoading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
              Refresh
            </button>
          </div>

          {partnersLoading && partners.length === 0 ? (
            <div className="text-center py-12 text-slate-600"><Loader2 size={24} className="mx-auto animate-spin mb-2" />Memuatkan data partner...</div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12 text-slate-600">
              <DollarSign size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Tiada partner aktif lagi.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {partners.map((partner) => {
                const txs = partnerTransactions[partner.id] || []
                const pays = partnerPayouts[partner.id] || []
                const commRate = partner.commission_rate || 0.30
                const claimable = txs
                  .filter((tx: any) => tx.clearance_status === 'claimable')
                  .reduce((s: number, tx: any) => s + tx.amount * commRate, 0)
                const pending = txs
                  .filter((tx: any) => tx.clearance_status === 'pending_clearance')
                  .reduce((s: number, tx: any) => s + tx.amount * commRate, 0)
                const totalPaid = pays
                  .filter((p: any) => p.status === 'paid')
                  .reduce((s: number, p: any) => s + p.amount, 0)

                return (
                  <div key={partner.id} className="rounded-[32px] border border-white/5 bg-white/[0.02] p-8 space-y-6">
                    {/* Partner Header */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                            partner.is_active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>{partner.is_active ? 'Aktif' : 'Tidak Aktif'}</span>
                          <span className="text-slate-500 text-[10px] font-mono">{partner.referral_code}</span>
                          <span className="text-violet-400 text-[10px] font-black">{(commRate * 100).toFixed(0)}% komisen</span>
                          {!partner.is_active && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Sahkan kelulusan untuk ${partner.bank_account_name || partner.user_id}?`)) return
                                const { error } = await supabase
                                  .from('partners')
                                  .update({ is_active: true })
                                  .eq('id', partner.id)
                                if (!error) {
                                  alert('✅ Partner berjaya diaktifkan!')
                                  fetchPartnersData()
                                } else {
                                  alert('❌ Error: ' + error.message)
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] uppercase tracking-wider transition-all ml-2"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                        <p className="text-sm font-black text-white">{partner.bank_account_name || partner.user_id}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{partner.bank_name} · {partner.bank_account_no}</p>
                        {partner.ic_number && <p className="text-[10px] text-slate-600 mt-0.5">IC: {partner.ic_number}</p>}
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-right">
                        <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Boleh Tuntut</p>
                          <p className="text-xl font-black text-violet-400">RM{claimable.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Dalam Proses</p>
                          <p className="text-xl font-black text-amber-400">RM{pending.toFixed(2)}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-black/30 border border-white/5">
                          <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Sudah Dibayar</p>
                          <p className="text-xl font-black text-emerald-400">RM{totalPaid.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Pay Out button */}
                    {claimable >= 100 && (
                      <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
                        <p className="text-xs font-black text-white mb-3">Rekod Payout Baharu</p>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Bulan (cth: Jun 2026)"
                            value={partnerPayoutMonth}
                            onChange={(e) => setPartnerPayoutMonth(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-xl bg-black/30 border border-white/10 text-white text-sm"
                          />
                          <button
                            onClick={async () => {
                              if (!partnerPayoutMonth) return
                              if (!confirm(`Sahkan payout RM${claimable.toFixed(2)} untuk ${partner.bank_account_name}?`)) return
                              const { error } = await supabase.from('partner_payouts').insert({
                                partner_id: partner.id,
                                amount: Math.round(claimable * 100) / 100,
                                payout_month: partnerPayoutMonth,
                                status: 'paid',
                                bank_name_snapshot: partner.bank_name,
                                bank_account_no_snapshot: partner.bank_account_no,
                                bank_account_name_snapshot: partner.bank_account_name,
                              })
                              if (!error) {
                                alert('✅ Payout berjaya direkodkan!')
                                setPartnerPayoutMonth('')
                                fetchPartnersData()
                              } else {
                                alert('❌ Error: ' + error.message)
                              }
                            }}
                            className="px-5 py-2 rounded-xl bg-violet-600 text-white font-black text-xs hover:bg-violet-500 transition-all active:scale-95"
                          >
                            Rekod Payout
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Payout History */}
                    {pays.length > 0 && (
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Sejarah Payout</p>
                        <div className="space-y-2">
                          {pays.map((p: any) => (
                            <div key={p.id} className="flex items-center justify-between px-4 py-2 rounded-xl bg-black/20 border border-white/5 text-xs">
                              <span className="text-slate-400">{p.payout_month}</span>
                              <span className="font-black text-white">RM{p.amount.toFixed(2)}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>{p.status === 'paid' ? 'Dibayar' : 'Pending'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-white/5 rounded border border-white/5 ${className}`} />
  )
}

function StatCard({ icon, label, value, color, trend, isLoading }: { icon: React.ReactNode, label: string, value: string | number, color: string, trend: string, isLoading?: boolean }) {
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
          {isLoading ? <Skeleton className="w-10 h-3" /> : trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-1">{label}</p>
        {isLoading ? (
          <Skeleton className="w-24 h-8 mt-1" />
        ) : (
          <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
        )}
      </div>
      
      {/* Subtle Bottom Glow */}
      <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 blur-md opacity-40 group-hover:opacity-100 transition-opacity ${color === 'indigo' ? 'bg-indigo-500' : color === 'amber' ? 'bg-amber-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
    </div>
  )
}

function CircularMeter({ percentage, label, color, limit, current, description, isLoading }: any) {
  const safePercentage = Math.min(Math.max(percentage || 0, 0), 100)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safePercentage / 100) * circumference;
  
  const isDanger = safePercentage >= 80;
  const strokeColor = isDanger ? 'stroke-rose-500' : color === 'indigo' ? 'stroke-indigo-500' : color === 'emerald' ? 'stroke-emerald-500' : 'stroke-amber-500';

  return (
    <div className={`relative p-8 rounded-[32px] bg-white/[0.01] border transition-all duration-500 ${isDanger ? 'border-rose-500/30 shadow-[0_0_30px_-5px_rgba(244,63,94,0.1)] hover:bg-rose-500/5' : 'border-white/5 hover:bg-white/[0.03]'}`}>
      {isLoading ? (
        <div className="flex flex-col gap-6 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="w-24 h-3" />
              <Skeleton className="w-16 h-6" />
              <Skeleton className="w-20 h-3" />
            </div>
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/5 shrink-0" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-full h-3" />
            <Skeleton className="w-2/3 h-3" />
          </div>
        </div>
      ) : (
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
      )}
    </div>
  )
}
