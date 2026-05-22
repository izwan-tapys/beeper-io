'use client'

// VERCEL_FORCE_REBUILD_FINAL_V3
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, XCircle, ShieldCheck, 
  Loader2, Search, Smartphone, Store,
  Zap, Clock, BarChart3, Globe, ExternalLink,
  ChevronRight, ArrowUpRight, TrendingUp, AlertCircle, LogOut, ArrowLeft,
  Tv, PlayCircle, Image, Plus, Trash2, Eye, MousePointerClick, Percent
} from 'lucide-react'

const supabase = createClient()
const ADMIN_EMAIL = 'izwan.tapys@gmail.com'

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

  // Ads State
  const [activeTab, setActiveTab] = useState<'merchants' | 'ads'>('merchants')
  const [ads, setAds] = useState<any[]>([])
  const [adsLoading, setAdsLoading] = useState(false)
  const [isAddingAd, setIsAddingAd] = useState(false)
  const [newAd, setNewAd] = useState({ title: '', video_url: '', image_url: '', link_url: '', is_active: true })

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
      const { data: adsData, error: adsError } = await supabase.from('ads').select('*').order('created_at', { ascending: false })
      const { data: analyticsData } = await supabase.from('ad_analytics').select('ad_id, event_type')
      
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
      video_url: newAd.video_url.trim() || null,
      image_url: newAd.image_url.trim() || null,
      link_url: newAd.link_url.trim() || null,
      is_active: newAd.is_active
    })
    if (!error) {
      setIsAddingAd(false)
      setNewAd({ title: '', video_url: '', image_url: '', link_url: '', is_active: true })
      fetchAds()
    } else {
      alert('Error adding ad: ' + error.message)
    }
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

  useEffect(() => {
    if (isAdmin && activeTab === 'ads') {
      fetchAds()
    }
  }, [isAdmin, activeTab, fetchAds])

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

  useEffect(() => {
    checkAdmin()
  }, [checkAdmin])

  const filteredMerchants = merchants.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone?.includes(searchQuery) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                    return (
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
                                <span className="text-[10px] text-slate-600 font-medium">{new Date(m.created_at).toLocaleDateString()}</span>
                              </div>
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
            <div className="grid grid-cols-3 gap-6">
              <StatCard icon={<Tv size={20} />} label="Total Ads" value={ads.length} color="indigo" trend="Active Network" />
              <StatCard icon={<Eye size={20} />} label="Impressions" value={ads.reduce((acc, ad) => acc + ad.impressions, 0).toLocaleString()} color="amber" trend="Total Views" />
              <StatCard icon={<MousePointerClick size={20} />} label="Total Clicks" value={ads.reduce((acc, ad) => acc + ad.clicks, 0).toLocaleString()} color="emerald" trend="Engagements" />
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ad Title</label>
                    <input type="text" required value={newAd.title} onChange={e => setNewAd({...newAd, title: e.target.value})} placeholder="e.g. KFC Promo" className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Link Out URL</label>
                    <input type="text" value={newAd.link_url} onChange={e => setNewAd({...newAd, link_url: e.target.value})} placeholder="e.g. https://kfc.com.my" className="w-full p-4 rounded-2xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono" />
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
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={newAd.is_active} onChange={e => setNewAd({...newAd, is_active: e.target.checked})} />
                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                  </label>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Immediately</span>
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ads.map((ad) => (
                  <div key={ad.id} className={`group relative rounded-[32px] overflow-hidden border transition-all duration-500 bg-black ${ad.is_active ? 'border-indigo-500/30 hover:border-indigo-500/60 shadow-2xl shadow-indigo-500/10' : 'border-white/5 opacity-50 grayscale hover:grayscale-0 hover:opacity-100'}`}>
                    <div className="aspect-[9/16] relative bg-[#0a0b0f] w-full">
                      {ad.video_url ? (
                        (() => {
                          const ytMatch = ad.video_url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/);
                          const ytId = (ytMatch && ytMatch[2].length === 11) ? ytMatch[2] : null;
                          if (ytId) {
                            return (
                              <iframe
                                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
                                className="w-full h-full object-cover pointer-events-none scale-105"
                                allow="autoplay; encrypted-media"
                              />
                            )
                          }
                          const tiktokMatch = ad.video_url.match(/tiktok\.com\/@.*\/video\/(\d+)/);
                          const tiktokId = tiktokMatch ? tiktokMatch[1] : null;
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
                        <h4 className="text-white font-black text-lg leading-tight uppercase tracking-tight line-clamp-2 mb-2">{ad.title}</h4>
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
            
            {ads.length === 0 && !adsLoading && (
              <div className="text-center py-20 bg-white/[0.01] rounded-[40px] border border-dashed border-white/10">
                <Tv size={48} className="mx-auto text-slate-700 mb-4" />
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">No active campaigns. Default Beepme ad is currently live.</p>
              </div>
            )}
          </div>
        )}
      </div>
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
