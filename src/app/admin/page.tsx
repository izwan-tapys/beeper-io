'use client'

// VERCEL_FORCE_REBUILD_FINAL_V3
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, XCircle, ShieldCheck, 
  Loader2, Search, Smartphone, Store,
  Zap, Clock, BarChart3, Globe, ExternalLink,
  ChevronRight, ArrowUpRight, TrendingUp, AlertCircle, LogOut, ArrowLeft
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

        {/* Global Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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
        <div className="mb-8 flex items-center justify-between px-2">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500">Merchant Directory</h2>
          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase">
            <span>Sort by Latest</span>
            <ChevronRight size={12} />
          </div>
        </div>

        {loading ? (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredMerchants.map((m) => {
              const quota = m.plan_type === 'pro' ? Infinity : m.plan_type === 'basic' ? 500 : 20;
              const usagePercent = Math.min((m.monthly_count / quota) * 100, 100);
              
              return (
                <div 
                  key={m.id} 
                  className={`group relative rounded-[40px] border transition-all duration-700 bg-white/[0.02] ${m.is_verified ? 'border-white/5 hover:border-white/20' : 'border-indigo-500/20 hover:border-indigo-500/50 shadow-2xl shadow-indigo-500/5'}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-[40px]" />
                  
                  <div className="p-8 relative z-10">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className={`absolute -inset-2 blur-md rounded-full opacity-20 transition-all duration-500 group-hover:opacity-40 ${m.is_verified ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                          <div className="relative w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-2xl font-black text-white group-hover:scale-110 transition-transform duration-500">
                            {m.name?.[0] || 'M'}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">{m.name || 'Anonymous Store'}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${m.is_verified ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'}`}>
                              {m.is_verified ? 'Verified' : 'Pending Approval'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Usage Progress */}
                    <div className="mb-8 space-y-3">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Monthly Throughput</p>
                          <p className="text-xl font-black text-white">{m.monthly_count.toLocaleString()} <span className="text-xs text-slate-600 font-medium">/ {quota === Infinity ? '∞' : quota}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Health</p>
                          <p className={`text-[10px] font-bold ${usagePercent > 90 ? 'text-rose-500' : usagePercent > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>{usagePercent.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/[0.03]">
                        <div 
                          className={`h-full transition-all duration-1000 shadow-[0_0_8px_rgba(99,102,241,0.5)] ${usagePercent > 90 ? 'bg-rose-500' : usagePercent > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                          style={{ width: `${usagePercent}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] transition-colors">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Direct Contact</p>
                        <div className="flex items-center gap-2">
                          <Smartphone size={12} className="text-indigo-500" />
                          <p className="text-xs font-bold text-white truncate">{m.phone || 'NO PHONE'}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 group-hover:bg-white/[0.04] transition-colors">
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Access Level</p>
                        <p className="text-xs font-black text-indigo-400 uppercase">{m.plan_type}</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <select 
                        value={m.plan_type}
                        onChange={(e) => updateMerchant(m.id, { plan_type: e.target.value })}
                        disabled={verifyingId === m.id}
                        className="flex-[2] px-4 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer hover:bg-white/[0.06]"
                      >
                        <option value="free">Lvl 0: Free</option>
                        <option value="basic">Lvl 1: Basic</option>
                        <option value="pro">Lvl 2: Pro</option>
                      </select>
                      
                      <button 
                        onClick={() => updateMerchant(m.id, { is_verified: !m.is_verified })}
                        disabled={verifyingId === m.id}
                        className={`flex-[3] py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 ${m.is_verified ? 'bg-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500'}`}
                      >
                        {verifyingId === m.id ? <Loader2 size={14} className="animate-spin" /> : m.is_verified ? 'Kill Session' : 'Activate Portal'}
                      </button>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                          <Clock size={12} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest leading-none mb-1">Deployment Date</p>
                          <p className="text-[10px] text-white font-medium">{new Date(m.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <a href={`https://wa.me/${m.phone}`} target="_blank" className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all">
                           <Smartphone size={14} />
                         </a>
                         <button className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                           <ExternalLink size={14} />
                         </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filteredMerchants.length === 0 && !loading && (
          <div className="text-center py-40 bg-white/[0.01] rounded-[40px] border border-dashed border-white/10">
            <AlertCircle size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-xs">No Signal Detected in this quadrant.</p>
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
