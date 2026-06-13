'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Copy, Check, Zap, Store, DollarSign, Clock,
  TrendingUp, LogOut, ExternalLink, ArrowLeft, User
} from 'lucide-react'

const supabase = createClient()

export default function PartnerDashboard() {
  const router = useRouter()
  const [partner, setPartner] = useState<any>(null)
  const [merchants, setMerchants] = useState<any[]>([])
  const [payouts, setPayouts] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [totalEarned, setTotalEarned] = useState(0)
  const [pendingPayout, setPendingPayout] = useState(0)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Check partner profile
    const { data: partnerData, error: partnerError } = await supabase
      .from('partners')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (partnerError || !partnerData) {
      router.push('/partner')
      return
    }

    setPartner(partnerData)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('beepme_own_referral_code', partnerData.referral_code.toUpperCase().trim())
    }

    // Fetch referred merchants
    const { data: merchantData } = await supabase
      .from('merchants')
      .select('id, name, plan_type, subscription_status, created_at, category')
      .eq('referred_by', partnerData.referral_code)
      .order('created_at', { ascending: false })

    if (merchantData) setMerchants(merchantData)

    // Fetch claimable + pending transactions for commission calc
    const merchantIds = merchantData?.map((m: any) => m.id) || []
    if (merchantIds.length > 0) {
      const { data: txData } = await supabase
        .from('merchant_transactions')
        .select('*')
        .in('merchant_id', merchantIds)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (txData) {
        setTransactions(txData)
        const commissionRate = partnerData.commission_rate || 0.30
        const claimableTotal = txData
          .filter((tx: any) => tx.clearance_status === 'claimable')
          .reduce((sum: number, tx: any) => sum + tx.amount * commissionRate, 0)
        const pendingTotal = txData
          .filter((tx: any) => tx.clearance_status === 'pending_clearance')
          .reduce((sum: number, tx: any) => sum + tx.amount * commissionRate, 0)
        setTotalEarned(Math.round(claimableTotal * 100) / 100)
        setPendingPayout(Math.round(pendingTotal * 100) / 100)
      }
    }

    // Fetch payout history
    const { data: payoutData } = await supabase
      .from('partner_payouts')
      .select('*')
      .eq('partner_id', partnerData.id)
      .order('created_at', { ascending: false })

    if (payoutData) setPayouts(payoutData)

    setLoading(false)
  }, [router])

  useEffect(() => { fetchData() }, [fetchData])

  const copyLink = () => {
    if (!partner) return
    navigator.clipboard.writeText(`https://beepme.pro/login?ref=${partner.referral_code}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeMerchants = merchants.filter(m => m.plan_type === 'pro' && m.subscription_status === 'active')
  const commissionRate = partner?.commission_rate || 0.30

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020203] flex items-center justify-center">
        <div className="animate-pulse text-indigo-400 font-black text-sm uppercase tracking-widest">Memuatkan...</div>
      </div>
    )
  }

  if (!partner?.is_active) {
    const waMessage = encodeURIComponent(
      `Salam Admin Beepme.pro! Akaun partner saya masih belum aktif. Sila bantu aktifkan.\n\nE-mel: ${partner?.user_id || ''}\nReferral Code: ${partner?.referral_code || ''}`
    )
    const waUrl = `https://wa.me/60194696158?text=${waMessage}`

    return (
      <div className="min-h-screen bg-[#020203] text-slate-200 font-sans flex items-center justify-center p-6 relative">
        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-md w-full bg-white/[0.02] border border-white/5 rounded-[32px] p-8 text-center space-y-6 relative z-10">
          <div className="mx-auto w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center text-amber-400">
            <Clock size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Akaun Belum Aktif ⏳</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Pendaftaran anda telah diterima! Akaun partner anda sedang menunggu kelulusan dan pengaktifan daripada pihak Admin.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-xs text-left text-slate-400 space-y-2">
            <p><span className="font-bold text-white">Kod Rujukan:</span> {partner?.referral_code}</p>
            <p><span className="font-bold text-white">Bank:</span> {partner?.bank_name} ({partner?.bank_account_no})</p>
            <p><span className="font-bold text-white">Nama Akaun:</span> {partner?.bank_account_name}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/25"
            >
              Hubungi Admin via WhatsApp
            </a>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              className="w-full py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-bold hover:text-white hover:bg-white/5 transition-all"
            >
              Log Keluar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans p-4 md:p-10">
      <div className="fixed top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-600/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between gap-4 mb-12">
          <div>
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1">Dashboard Rakan Kongsi</p>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
              Beepme<span className="text-indigo-500">.pro</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/partner" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              <ArrowLeft size={14} />
              Program
            </Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
            >
              <LogOut size={14} />
              Log Keluar
            </button>
          </div>
        </header>

        {/* Referral Link Box */}
        <div className="p-6 rounded-[28px] border border-indigo-500/30 bg-indigo-500/5 mb-8">
          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-3">Pautan Rujukan Unik Anda</p>
          <div className="flex gap-3">
            <div className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-indigo-300 font-mono text-sm truncate">
              beepme.pro/login?ref={partner?.referral_code}
            </div>
            <button
              onClick={copyLink}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 ${
                copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'
              }`}
            >
              {copied ? <><Check size={14} /> Disalin!</> : <><Copy size={14} /> Salin</>}
            </button>
          </div>
          <p className="text-slate-600 text-[10px] mt-3">Kod Rujukan: <span className="text-white font-black">{partner?.referral_code}</span> · Komisen: <span className="text-indigo-400 font-black">{(commissionRate * 100).toFixed(0)}%</span></p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Jumlah Rujukan', value: merchants.length, icon: <Store size={20} />, color: 'indigo', sub: 'Merchant didaftarkan' },
            { label: 'Aktif Premium', value: activeMerchants.length, icon: <Zap size={20} />, color: 'emerald', sub: 'Kedai berbayar aktif' },
            { label: 'Komisen Boleh Tuntut', value: `RM${totalEarned.toFixed(2)}`, icon: <DollarSign size={20} />, color: 'violet', sub: 'Selepas 14-hari clearance' },
            { label: 'Dalam Proses', value: `RM${pendingPayout.toFixed(2)}`, icon: <Clock size={20} />, color: 'amber', sub: 'Dalam tempoh penahanan' },
          ].map((stat, i) => (
            <div key={i} className="p-5 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className={`text-${stat.color}-500 mb-3`}>{stat.icon}</div>
              <p className="text-2xl font-black text-white">{stat.value}</p>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</p>
              <p className="text-[9px] text-slate-600 mt-0.5">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Merchants Table */}
        <div className="mb-10">
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Merchant Anda Rujuk</h2>
          <div className="rounded-[24px] border border-white/5 bg-white/[0.02] overflow-hidden">
            {merchants.length === 0 ? (
              <div className="text-center py-12 text-slate-600">
                <Store size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Belum ada merchant yang mendaftar melalui pautan anda.</p>
                <p className="text-xs mt-1">Mulakan promosi hari ini!</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-500 bg-white/[0.01]">
                    <th className="py-4 px-5 font-black">Nama Kedai</th>
                    <th className="py-4 px-5 font-black">Kategori</th>
                    <th className="py-4 px-5 font-black">Tarikh Daftar</th>
                    <th className="py-4 px-5 font-black">Status Plan</th>
                    <th className="py-4 px-5 font-black text-right">Komisen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {merchants.map((m) => {
                    const isPro = m.plan_type === 'pro' && m.subscription_status === 'active'
                    const monthlyCommission = isPro ? (49 * commissionRate).toFixed(2) : '0.00'
                    return (
                      <tr key={m.id} className="hover:bg-white/[0.015] transition-colors">
                        <td className="py-3 px-5 text-sm font-bold text-white">{m.name || 'Tanpa Nama'}</td>
                        <td className="py-3 px-5 text-xs text-slate-500">{m.category || '-'}</td>
                        <td className="py-3 px-5 text-xs text-slate-500">{new Date(m.created_at).toLocaleDateString('ms-MY')}</td>
                        <td className="py-3 px-5">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
                            isPro ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-white/5 text-slate-500 border border-white/10'
                          }`}>
                            {isPro ? 'Pro Aktif' : 'Percuma'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className={`text-sm font-black ${isPro ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {isPro ? `+RM${monthlyCommission}/bln` : '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payout History */}
        <div>
          <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Sejarah Payout</h2>
          <div className="rounded-[24px] border border-white/5 bg-white/[0.02] overflow-hidden">
            {payouts.length === 0 ? (
              <div className="text-center py-10 text-slate-600">
                <p className="text-sm">Belum ada payout. Minimum payout RM100.</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 text-[9px] uppercase tracking-widest text-slate-500 bg-white/[0.01]">
                    <th className="py-4 px-5 font-black">Bulan</th>
                    <th className="py-4 px-5 font-black">Jumlah</th>
                    <th className="py-4 px-5 font-black">Bank</th>
                    <th className="py-4 px-5 font-black text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.015]">
                      <td className="py-3 px-5 text-sm text-white">{p.payout_month}</td>
                      <td className="py-3 px-5 text-sm font-black text-white">RM{p.amount.toFixed(2)}</td>
                      <td className="py-3 px-5 text-xs text-slate-500">{p.bank_name_snapshot} - {p.bank_account_no_snapshot}</td>
                      <td className="py-3 px-5 text-right">
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${
                          p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {p.status === 'paid' ? 'Dibayar' : 'Dalam Proses'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <p className="text-center text-slate-700 text-[9px] uppercase tracking-widest mt-12">
          Isu atau pertanyaan? Hubungi Admin di{' '}
          <a href="https://wa.me/60194696158" target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">WhatsApp</a>
        </p>
      </div>
    </div>
  )
}
