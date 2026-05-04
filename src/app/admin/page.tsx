'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, XCircle, ShieldCheck, 
  Loader2, Search, Smartphone, Store,
  Zap, Clock, BarChart3
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
      // 1. Total Merchants
      const { count: mCount } = await supabase.from('merchants').select('*', { count: 'exact', head: true })
      
      // 2. Total Orders (All Time)
      const { count: sCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true })
      
      // 3. Orders Today
      const today = new Date()
      today.setHours(0,0,0,0)
      const { count: todayCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gt('created_at', today.toISOString())

      // 4. Fetch all merchants
      const { data: mData, error: mError } = await supabase
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false })

      if (mError) throw mError

      if (mData) {
        const firstOfMonth = new Date()
        firstOfMonth.setDate(1)
        firstOfMonth.setHours(0,0,0,0)

        // Fetch monthly counts for all merchants
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
      alert('Error fetching admin data: ' + error.message)
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
    m.id.includes(searchQuery)
  )

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-[#06070a] text-white p-6 md:p-12 selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center shadow-2xl shadow-indigo-600/40 border border-white/10">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mb-1">Command Center</h1>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Live System Oversight</p>
              </div>
            </div>
          </div>

          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text"
              placeholder="Search merchants, phones, IDs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-[20px] bg-white/[0.03] border border-white/5 outline-none focus:border-indigo-500/50 focus:bg-white/[0.05] transition-all font-medium text-sm backdrop-blur-md"
            />
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard icon={<Store className="text-indigo-400" />} label="Merchants" value={stats.totalMerchants} />
          <StatCard icon={<Zap className="text-amber-400" />} label="Total Orders" value={stats.totalOrders} />
          <StatCard icon={<Clock className="text-emerald-400" />} label="Orders Today" value={stats.ordersToday} />
          <StatCard icon={<BarChart3 className="text-rose-400" />} label="Est. Revenue" value={`RM${stats.estimatedRevenue}`} />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck size={20} className="text-indigo-500" />
              </div>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">Synchronizing Intel...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMerchants.map((m) => (
              <div 
                key={m.id} 
                className={`p-8 rounded-[40px] border transition-all duration-500 group relative overflow-hidden ${m.is_verified ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]' : 'bg-indigo-600/[0.03] border-indigo-500/30 shadow-2xl shadow-indigo-500/10'}`}
              >
                {!m.is_verified && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] font-black px-4 py-1.5 uppercase rounded-bl-2xl tracking-widest animate-pulse">Action Required</div>}
                
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.01] border border-white/5 flex items-center justify-center text-xl font-black text-indigo-400 group-hover:scale-110 transition-transform">
                      {m.name?.[0] || 'M'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg leading-tight">{m.name || 'Untitled Store'}</h3>
                      <p className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{m.id.split('-')[0]}...</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Monthly Usage</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-white">{m.monthly_count}</span>
                      <span className="text-[10px] text-slate-500">/ {m.plan_type === 'pro' ? '∞' : m.plan_type === 'basic' ? '500' : '20'}</span>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-1">Phone</p>
                    <p className="text-xs font-bold text-white truncate">{m.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Account Plan</label>
                    <select 
                      value={m.plan_type}
                      onChange={(e) => updateMerchant(m.id, { plan_type: e.target.value })}
                      disabled={verifyingId === m.id}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="free">Beeper Free</option>
                      <option value="basic">Beeper Basic (RM30)</option>
                      <option value="pro">Beeper Unlimited (RM49)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Status Control</label>
                    <button 
                      onClick={() => updateMerchant(m.id, { is_verified: !m.is_verified })}
                      disabled={verifyingId === m.id}
                      className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 ${m.is_verified ? 'bg-white/5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 hover:bg-indigo-500'}`}
                    >
                      {verifyingId === m.id ? <Loader2 size={14} className="animate-spin" /> : m.is_verified ? 'Deactivate Account' : 'Approve & Verify'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Clock size={12} />
                    <span className="text-[10px] font-medium italic">Joined {new Date(m.created_at).toLocaleDateString()}</span>
                  </div>
                  {m.expiry_date && (
                    <span className="text-[9px] font-bold text-emerald-500/80">Expires {new Date(m.expiry_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredMerchants.length === 0 && !loading && (
          <div className="text-center py-32">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No merchants found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-lg bg-white/5 text-sm">{icon}</div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  )
}
