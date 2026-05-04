'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  CheckCircle, XCircle, ShieldCheck, 
  Loader2, Search, Smartphone, Store
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

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      router.push('/dashboard')
      return
    }
    setIsAdmin(true)
    fetchPendingMerchants()
  }, [router])

  const fetchPendingMerchants = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      setMerchants(data)
    }
    setLoading(false)
  }

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    setVerifyingId(id)
    const { error } = await supabase
      .from('merchants')
      .update({ is_verified: !currentStatus })
      .eq('id', id)
    
    if (!error) {
      setMerchants(merchants.map(m => m.id === id ? { ...m, is_verified: !currentStatus } : m))
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
    <div className="min-h-screen bg-[#0a0b0f] text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-600/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter">Beeper Admin</h1>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Merchant Verification</p>
            </div>
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Search by name, phone or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 rounded-2xl bg-white/5 border border-white/10 outline-none focus:border-indigo-500 transition-all font-medium"
            />
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Merchants...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMerchants.map((m) => (
              <div 
                key={m.id} 
                className={`p-6 rounded-[32px] border transition-all ${m.is_verified ? 'bg-white/[0.02] border-white/5 opacity-60' : 'bg-indigo-600/5 border-indigo-500/30 shadow-xl shadow-indigo-500/5'}`}
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-indigo-400 font-black">
                      {m.name?.[0] || 'M'}
                    </div>
                    <div>
                      <h3 className="font-bold text-white truncate max-w-[150px]">{m.name || 'No Name'}</h3>
                      <p className="text-[10px] text-slate-500 font-mono">{m.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                  {m.is_verified ? (
                    <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase border border-emerald-500/20">Verified</span>
                  ) : (
                    <span className="px-2 py-1 rounded-md bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase border border-amber-500/20 animate-pulse">Pending</span>
                  )}
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <Smartphone size={14} className="text-indigo-500" />
                    <span className="font-bold">{m.phone || 'No Phone'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <Store size={14} className="text-indigo-500" />
                    <span className="font-medium">Plan: <span className="text-white uppercase">{m.plan_type}</span></span>
                  </div>
                </div>

                <button 
                  onClick={() => toggleVerification(m.id, m.is_verified)}
                  disabled={verifyingId === m.id}
                  className={`w-full py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 ${m.is_verified ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500'}`}
                >
                  {verifyingId === m.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : m.is_verified ? (
                    <>
                      <XCircle size={14} />
                      Unverify Merchant
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Approve & Verify
                    </>
                  )}
                </button>
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
