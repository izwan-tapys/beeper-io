'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone, Wallet, BarChart3, Eye, Plus, LogOut, Store,
  TrendingUp, Clock, CheckCircle, PauseCircle, XCircle,
  AlertCircle, Loader2, ChevronRight, MessageCircle, Sparkles,
  ArrowUpRight, ArrowDownRight
} from 'lucide-react'

const supabase = createClient()

type AdvertiserProfile = {
  id: string
  user_id: string
  wallet_balance: number
}

type Ad = {
  id: string
  title: string
  status: 'pending_review' | 'active' | 'paused' | 'depleted'
  category: string
  cpv_bid: number
  advertiser_id: string
  created_at: string
  total_views?: number
}

type Transaction = {
  id: string
  advertiser_id: string
  ad_id?: string
  session_id?: string
  amount: number
  type: 'topup' | 'debit'
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  reference_id?: string
  ad_title?: string
}

const STATUS_CONFIG = {
  pending_review: {
    label: 'Pending Review',
    icon: Clock,
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  },
  active: {
    label: 'Active',
    icon: CheckCircle,
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  },
  paused: {
    label: 'Paused',
    icon: PauseCircle,
    className: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
  },
  depleted: {
    label: 'Depleted',
    icon: XCircle,
    className: 'bg-red-500/10 text-red-400 border border-red-500/20',
  },
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  const day = date.getDate()
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const month = monthNames[date.getMonth()]
  const year = date.getFullYear()
  
  return `${day} ${month} ${year}`
}

export default function AdsManagerPage() {
  const router = useRouter()

  const [profile, setProfile] = useState<AdvertiserProfile | null>(null)
  const [ads, setAds] = useState<Ad[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [totalImpressions, setTotalImpressions] = useState(0)
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    // Check for success query param
    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') {
      setSuccessMsg('Campaign submitted for review! ✅')
      setTimeout(() => setSuccessMsg(''), 6000)
      window.history.replaceState({}, '', '/ads-manager')
    } else if (params.get('success') === '2') {
      setSuccessMsg('Campaign updated and resubmitted for review! ✅')
      setTimeout(() => setSuccessMsg(''), 6000)
      window.history.replaceState({}, '', '/ads-manager')
    } else if (params.get('success') === '3') {
      setSuccessMsg('Payment successful! Your wallet has been topped up. 💸')
      setTimeout(() => setSuccessMsg(''), 6000)
      window.history.replaceState({}, '', '/ads-manager')
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      // Fetch or create advertiser profile
      let { data: prof } = await supabase
        .from('advertiser_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!prof) {
        const { data: newProf } = await supabase
          .from('advertiser_profiles')
          .insert({ user_id: user.id, wallet_balance: 0 })
          .select()
          .single()
        prof = newProf
      }
      if (prof) setProfile(prof)

      // Fetch ads
      const { data: adsData } = await supabase
        .from('ads')
        .select('*')
        .eq('advertiser_id', user.id)
        .order('created_at', { ascending: false })

      if (adsData) {
        // Fetch total views per ad from ad_analytics
        const adsWithViews = await Promise.all(
          adsData.map(async (ad: Ad) => {
            const { count } = await supabase
              .from('ad_analytics')
              .select('*', { count: 'exact', head: true })
              .eq('ad_id', ad.id)
              .eq('event_type', 'impression')
            return { ...ad, total_views: count || 0 }
          })
        )
        setAds(adsWithViews)

        // Total impressions across all ads
        const total = adsWithViews.reduce((sum, a) => sum + (a.total_views || 0), 0)
        setTotalImpressions(total)
      }

      // Fetch transaction history
      if (prof) {
        const { data: txsData } = await supabase
          .from('ad_wallet_transactions')
          .select('*')
          .eq('advertiser_id', prof.id)
          .order('created_at', { ascending: false })

        if (txsData) {
          const enrichedTxs = txsData.map((tx: any) => {
            const relatedAd = adsData?.find((a: any) => a.id === tx.ad_id)
            return {
              ...tx,
              ad_title: relatedAd ? relatedAd.title : undefined
            }
          })
          setTransactions(enrichedTxs)
        }
      }

      setLoading(false)
    }
    init()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#020203' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center">
            <Loader2 size={32} className="text-indigo-400 animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#020203' }}>
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Success Toast */}
        <AnimatePresence>
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold text-sm backdrop-blur-xl shadow-xl"
            >
              {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Megaphone size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Beepme Ad Network</h1>
              <p className="text-xs text-slate-500">Advertiser Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white text-sm font-medium transition-all"
            >
              <Store size={16} />
              <span className="hidden sm:inline">Merchant Dashboard</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 text-sm font-medium transition-all"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {/* Wallet Balance */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-2xl p-6 border border-white/10 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d0e1a 0%, #111827 100%)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Wallet size={18} className="text-indigo-400" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Wallet Balance</span>
            </div>
            <p className="text-3xl font-black text-white">
              RM {(profile?.wallet_balance ?? 0).toFixed(2)}
            </p>
            <p className="text-xs text-slate-600 mt-1">Available credit</p>
          </motion.div>

          {/* Total Campaigns */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-2xl p-6 border border-white/10 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d0e1a 0%, #111827 100%)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <BarChart3 size={18} className="text-violet-400" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Campaigns</span>
            </div>
            <p className="text-3xl font-black text-white">{ads.length}</p>
            <p className="text-xs text-slate-600 mt-1">Total created</p>
          </motion.div>

          {/* Total Views */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-2xl p-6 border border-white/10 overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #0d0e1a 0%, #111827 100%)' }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl" />
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 flex items-center justify-center">
                <Eye size={18} className="text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Views</span>
            </div>
            <p className="text-3xl font-black text-white">{totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-slate-600 mt-1">Ad impressions</p>
          </motion.div>
        </motion.div>

        {/* Top Up Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-6 border border-indigo-500/20"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(109,40,217,0.05) 100%)' }}
        >
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
              <Wallet size={20} className="text-indigo-400" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-white font-bold mb-1">Top Up Wallet</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Add credit securely via FPX or Credit Card to keep your ad campaigns running.
                </p>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  const form = e.target as HTMLFormElement
                  const amount = parseFloat((form.elements.namedItem('amount') as HTMLInputElement).value)
                  if (!amount || amount < 10) return alert('Minimum top-up is RM 10')
                  
                  const btn = form.querySelector('button[type="submit"]') as HTMLButtonElement
                  btn.disabled = true
                  btn.innerHTML = 'Processing...'
                  
                  try {
                    const res = await fetch('/api/payment/stripe/topup', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        amount 
                      })
                    })
                    const data = await res.json()
                    if (data.url) {
                      window.location.href = data.url
                    } else {
                      throw new Error(data.error || 'Failed to initiate payment')
                    }
                  } catch (err: any) {
                    alert('Error: ' + err.message)
                    btn.disabled = false
                    btn.innerHTML = 'Top Up Now'
                  }
                }}
                className="flex items-center gap-3"
              >
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">RM</span>
                  <input 
                    type="number" 
                    name="amount"
                    min="10" 
                    step="1"
                    placeholder="100" 
                    defaultValue="50"
                    required
                    className="w-32 pl-12 pr-4 py-3 rounded-xl bg-[#0a0b0f] border border-white/10 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
                >
                  Top Up Now
                </button>
              </form>
            </div>
            
            <div className="hidden md:block w-px h-24 bg-white/10" />
            
            <div className="flex-1">
              <h3 className="text-white font-bold mb-1">Manual Transfer</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-3">
                For large amounts (RM1000+) or manual bank transfer.
              </p>
              <a
                href={`https://wa.me/60194696158?text=${encodeURIComponent('Hi Beepme, I would like to manually top up my Ad Network wallet.\n\nAmount: RM ___\nEmail: ___')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/20 text-[#25D366] text-xs font-semibold transition-all"
              >
                <MessageCircle size={14} />
                WhatsApp Us
              </a>
            </div>
          </div>
        </motion.div>

        {/* My Campaigns */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-black text-white">My Campaigns</h2>
              {ads.length > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-400">
                  {ads.length}
                </span>
              )}
            </div>
            <button
              onClick={() => router.push('/ads-manager/create')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40"
            >
              <Plus size={16} />
              Create Campaign
            </button>
          </div>

          {ads.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-white/5 p-12 text-center"
              style={{ background: 'linear-gradient(135deg, #0d0e1a 0%, #0a0b0f 100%)' }}
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-indigo-400" />
              </div>
              <p className="text-white font-bold text-lg mb-2">No campaigns yet</p>
              <p className="text-slate-500 text-sm mb-6">Create your first ad campaign to reach diners across Beepme merchants.</p>
              <button
                onClick={() => router.push('/ads-manager/create')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus size={16} />
                Create Your First Campaign
              </button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {ads.map((ad, i) => {
                  const statusConf = STATUS_CONFIG[ad.status]
                  const StatusIcon = statusConf.icon
                  return (
                    <motion.div
                      key={ad.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex items-center gap-4 p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                      style={{ background: 'linear-gradient(135deg, #0d0e1a 0%, #0a0b0f 100%)' }}
                    >
                      {/* Status indicator */}
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                        <StatusIcon size={18} className={ad.status === 'active' ? 'text-emerald-400' : ad.status === 'pending_review' ? 'text-amber-400' : ad.status === 'paused' ? 'text-slate-400' : 'text-red-400'} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-white font-semibold text-sm truncate">{ad.title}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${statusConf.className}`}>
                            {statusConf.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>{ad.category}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <TrendingUp size={11} />
                            RM {Number(ad.cpv_bid).toFixed(2)}/view
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Eye size={11} />
                            {(ad.total_views || 0).toLocaleString()} views
                          </span>
                        </div>
                      </div>

                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/ads-manager/edit/${ad.id}`)
                        }}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-indigo-600 hover:text-white border border-white/10 text-xs font-black uppercase tracking-wider text-slate-300 transition-all active:scale-95 shrink-0"
                      >
                        Edit
                      </button>

                      {/* Arrow */}
                      <ChevronRight size={16} className="text-slate-700 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black text-white">Transaction History</h2>
            {transactions.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-400">
                {transactions.length}
              </span>
            )}
          </div>

          {transactions.length === 0 ? (
            <div
              className="rounded-2xl border border-white/5 p-8 text-center text-slate-500 text-sm"
              style={{ background: 'linear-gradient(135deg, #0d0e1a 0%, #0a0b0f 100%)' }}
            >
              No transactions recorded yet.
            </div>
          ) : (
            <div 
              className="rounded-2xl border border-white/5 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0d0e1a 0%, #0a0b0f 100%)' }}
            >
              <div className="max-h-[350px] overflow-y-auto divide-y divide-white/5">
                {transactions.map((tx) => {
                  const isTopup = tx.type === 'topup'
                  const isCompleted = tx.status === 'completed'
                  const isFailed = tx.status === 'failed'

                  return (
                    <div 
                      key={tx.id} 
                      className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isTopup 
                            ? isCompleted 
                              ? 'bg-emerald-500/10 text-emerald-400' 
                              : isFailed
                                ? 'bg-red-500/10 text-red-400'
                                : 'bg-amber-500/10 text-amber-400'
                            : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {isTopup ? (
                            <ArrowUpRight size={16} />
                          ) : (
                            <ArrowDownRight size={16} />
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm truncate">
                            {isTopup ? 'Ad Wallet Top-up' : `Charge for view`}
                          </p>
                          <p className="text-slate-500 text-xs truncate">
                            {isTopup 
                              ? `Via Stripe ${tx.reference_id ? `(${tx.reference_id.substring(0, 8)}...)` : ''}` 
                              : `Campaign: ${tx.ad_title || 'Ad View'}`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Right side: Amount & Date */}
                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className={`font-bold text-sm ${
                          isTopup 
                            ? isCompleted 
                              ? 'text-emerald-400' 
                              : isFailed
                                ? 'text-red-400'
                                : 'text-amber-400'
                            : 'text-slate-300'
                        }`}>
                          {isTopup ? '+' : '-'} RM {Number(tx.amount).toFixed(2)}
                        </p>
                        <div className="flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
                          {isTopup && (
                            <span className={`px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[8px] ${
                              isCompleted 
                                ? 'bg-emerald-500/10 text-emerald-400' 
                                : isFailed
                                  ? 'bg-red-500/10 text-red-400'
                                  : 'bg-amber-500/10 text-amber-400'
                            }`}>
                              {tx.status}
                            </span>
                          )}
                          <span>{formatDate(tx.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs text-slate-700">Beepme Ad Network · Reach diners at the point of hunger</p>
        </div>
      </div>
    </div>
  )
}
