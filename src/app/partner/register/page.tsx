'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle, Loader2, ShieldCheck, HelpCircle } from 'lucide-react'

export default function PartnerRegisterPage() {
  const router = useRouter()
  
  // Form state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [bankName, setBankName] = useState('')
  const [bankAccountNo, setBankAccountNo] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [icNumber, setIcNumber] = useState('')
  const [companyRegNo, setCompanyRegNo] = useState('')
  const [fullAddress, setFullAddress] = useState('')
  
  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registered, setRegistered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/partner/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          referralCode,
          bankName,
          bankAccountNo,
          bankAccountName,
          icNumber,
          companyRegNo,
          fullAddress,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Ralat semasa mendaftar.')
      } else {
        setRegistered(true)
      }
    } catch (err) {
      console.error(err)
      setError('Ralat sambungan rangkaian.')
    } finally {
      setLoading(false)
    }
  }

  const waMessage = encodeURIComponent(
    `Salam Admin Beepme.pro! Saya baru sahaja mendaftar akaun Partner di web.\n\nE-mel: ${email}\nKod Rujukan diminta: ${referralCode.trim().toUpperCase()}\n\nSila approve akaun saya. Terima kasih!`
  )
  const waUrl = `https://wa.me/60194696158?text=${waMessage}`

  if (registered) {
    return (
      <div className="min-h-screen bg-[#020203] text-slate-200 font-sans flex items-center justify-center p-6 relative">
        <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />
        <div className="max-w-md w-full bg-white/[0.02] border border-white/5 rounded-[32px] p-8 text-center space-y-6 relative z-10">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
            <CheckCircle size={32} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-white tracking-tight">Pendaftaran Berjaya! 🎉</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Akaun rakan kongsi anda telah dicipta. Untuk mula berkongsi pautan rujukan, akaun anda memerlukan kelulusan daripada pihak Admin.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-400 leading-relaxed">
            ⚠️ Sila klik butang di bawah untuk menghantar permintaan kelulusan segera ke WhatsApp Admin.
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-indigo-600 text-white font-black text-sm hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-600/25"
            >
              Hubungi Admin via WhatsApp
              <ArrowRight size={16} />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/10 text-slate-400 text-xs font-bold hover:text-white hover:bg-white/5 transition-all"
            >
              Log Masuk ke Dashboard Partner
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans py-16 px-6 relative">
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Back */}
        <Link href="/partner" className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-10 transition-colors">
          ← Kembali ke Program Rakan Kongsi
        </Link>

        {/* Header */}
        <div className="mb-10 text-center md:text-left">
          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Beepme.pro</span>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1 mb-3">
            Daftar Rakan Kongsi
          </h1>
          <p className="text-slate-400 text-sm max-w-lg">
            Sila isi maklumat akaun anda di bawah. Akaun yang didaftar adalah percuma dan memerlukan pengaktifan oleh pihak pentadbir.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold mb-6">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Kredensial Akaun */}
          <div className="p-6 rounded-[28px] border border-white/5 bg-white/[0.01] space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">1. Kredensial Akaun</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">E-mel</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Kata Laluan</label>
                <input
                  type="password"
                  required
                  placeholder="Minima 6 aksara"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Kod Rujukan Yang Diminta (Referral Code)</label>
                <span className="text-[9px] text-indigo-400 font-bold">Cth: TIKTOKPOS, JAZZCAFE</span>
              </div>
              <input
                type="text"
                required
                placeholder="Kod unik pilihan anda (hanya huruf & nombor sahaja)"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors font-mono uppercase"
              />
            </div>
          </div>

          {/* Section 2: Butiran Peribadi & Cukai */}
          <div className="p-6 rounded-[28px] border border-white/5 bg-white/[0.01] space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">2. Profil Peribadi / Syarikat</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nombor Kad Pengenalan (IC)</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: 900101145566"
                  value={icNumber}
                  onChange={(e) => setIcNumber(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">No Pendaftaran Syarikat (Optional)</label>
                <input
                  type="text"
                  placeholder="SSM (Jika mendaftar atas nama syarikat)"
                  value={companyRegNo}
                  onChange={(e) => setCompanyRegNo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Alamat Penuh</label>
              <textarea
                rows={2}
                placeholder="Alamat surat menyurat anda"
                value={fullAddress}
                onChange={(e) => setFullAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Section 3: Butiran Pembayaran Bank */}
          <div className="p-6 rounded-[28px] border border-white/5 bg-white/[0.01] space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">3. Butiran Pembayaran Bank (Untuk Payout)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nama Bank</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Maybank, CIMB, Public Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nombor Akaun Bank</label>
                <input
                  type="text"
                  required
                  placeholder="Cth: 164012345678"
                  value={bankAccountNo}
                  onChange={(e) => setBankAccountNo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nama Pemilik Akaun Bank</label>
              <input
                type="text"
                required
                placeholder="Mestilah sepadan dengan rekod bank anda"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-600 outline-none text-sm focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 text-center md:text-left pt-2">
            <p className="text-[10px] text-slate-500 leading-relaxed">
              Dengan menekan butang daftar, anda mengesahkan semua data di atas adalah benar, dan anda bersetuju dengan{' '}
              <Link href="/partner/terms" target="_blank" className="underline text-indigo-400 hover:text-indigo-300">Terma & Syarat Rakan Kongsi</Link>{' '}dan{' '}
              <Link href="/privacy" target="_blank" className="underline text-indigo-400 hover:text-indigo-300">Polisi Privasi (PDPA)</Link> kami.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-base transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-600/25 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  Daftar Akaun Partner
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
