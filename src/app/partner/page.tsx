'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Zap, Star, DollarSign, Users, ArrowRight, CheckCircle,
  X, QrCode, Smartphone, Bell, Copy, Check, ChevronDown
} from 'lucide-react'

const COMMISSION_RATE = 0.30
const MONTHLY_PRICE = 49
const ANNUAL_PRICE = 490
const INFRA_COST_PER_USER = 3.5
const GATEWAY_FEE_PER_TX = 1.0

export default function PartnerPage() {
  const [merchants, setMerchants] = useState(50)
  const [copied, setCopied] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const monthlyCommission = Math.round(merchants * MONTHLY_PRICE * COMMISSION_RATE * 10) / 10
  const annualCommission = Math.round(merchants * ANNUAL_PRICE * COMMISSION_RATE * 10) / 10
  const yourNet = Math.round(merchants * MONTHLY_PRICE * (1 - COMMISSION_RATE) - merchants * (INFRA_COST_PER_USER + GATEWAY_FEE_PER_TX))

  const waMessage = encodeURIComponent(`Salam Admin Beepme.pro! Saya berminat untuk menyertai Program Rakan Kongsi.\n\nNama: [NAMA ANDA]\nSaluran: [TikTok/Instagram/etc.]\nKod yang saya mahukan: [KOD_ANDA]\n\nSaya telah membaca Terma & Syarat di beepme.pro/partner/terms`)
  const waUrl = `https://wa.me/60194696158?text=${waMessage}`

  const copyUrl = () => {
    navigator.clipboard.writeText(`https://beepme.pro/login?ref=KODANDA`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const faqs = [
    {
      q: 'Apa itu Program Rakan Kongsi Beepme.pro?',
      a: 'Program rujukan (affiliate) di mana anda mendapat komisen berulang (30%) setiap bulan untuk setiap kedai yang mendaftar dan kekal melanggan Premium melalui pautan unik anda. Selagi kedai bayar, selagi anda terima komisen.'
    },
    {
      q: 'Berapa komisen sebenar yang saya terima?',
      a: `Anda mendapat 30% daripada RM${MONTHLY_PRICE}/bulan = RM${(MONTHLY_PRICE * 0.3).toFixed(2)}/bulan per kedai. Jika anda ada 100 kedai aktif, itu RM${(100 * MONTHLY_PRICE * 0.3).toFixed(0)}/bulan pendapatan pasif secara automatik.`
    },
    {
      q: 'Bagaimana cara sistem jejak rujukan saya?',
      a: 'Kami berikan anda pautan unik seperti beepme.pro/login?ref=KODANDA. Bila prospek klik dan daftar, sistem simpan kod anda secara automatik. Anda juga boleh beritahu prospek untuk taip kod anda semasa daftar jika mereka akses web secara berasingan.'
    },
    {
      q: 'Bilakah dan bagaimana komisen dibayar?',
      a: 'Komisen dikira dan dibayar pada awal setiap bulan melalui pindahan bank. Had minimum pengeluaran ialah RM100. Tempoh penahanan 14 hari digunakan untuk memastikan tiada isu pembatalan sebelum komisen dilepaskan.'
    },
    {
      q: 'Siapa yang layak menjadi Rakan Kongsi?',
      a: 'Sesiapa yang mempunyai rangkaian pelanggan dalam industri F&B atau POS — influencer, pembekal hardware, agensi digital, pengurus kawasan restoran, dan sebagainya. Pendaftaran adalah manual dan tertakluk kepada kelulusan Admin.'
    },
    {
      q: 'Adakah terdapat sebarang kos untuk sertai?',
      a: 'Tiada langsung. Program ini 100% percuma untuk disertai. Anda hanya perlu mendaftar dan mula berkongsi pautan anda.'
    },
  ]

  const comparisonRows = [
    { label: 'Kos Setup Awal', hardware: 'RM1,500 - RM3,000+', beepme: 'RM0.00', win: true },
    { label: 'Kos Bulanan Merchant', hardware: 'Tiada (tapi barang rosak/hilang)', beepme: `RM${MONTHLY_PRICE}/bulan`, win: true },
    { label: 'Risiko Rosak/Hilang', hardware: '⚠️ Tinggi (hardware fizikal)', beepme: '✅ Sifar', win: true },
    { label: 'Perlu Cas Elektrik', hardware: '⚠️ Ya, setiap hari', beepme: '✅ Tidak (guna telefon customer)', win: true },
    { label: 'Had Jarak Signal', hardware: '⚠️ Terhad (radio frequency)', beepme: '✅ Tiada had (guna WiFi/data)', win: true },
    { label: 'Kumpul Google Reviews', hardware: '❌ Tidak ada ciri ini', beepme: '✅ Automatik selepas pickup', win: true },
    { label: 'Notifikasi ke Pelanggan', hardware: '🔔 Bunyi sahaja', beepme: '📳 Getar + Bunyi + Skrin', win: true },
  ]

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 font-sans overflow-x-hidden">
      {/* Background glows */}
      <div className="fixed top-[-15%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/8 blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/8 blur-[150px] rounded-full pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl uppercase tracking-tighter italic">
            Beepme<span className="text-indigo-500">.pro</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors border border-white/10 hover:bg-white/5">
              Log Masuk
            </Link>
            <a href={waUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white hover:bg-indigo-500 transition-all active:scale-95">
              Daftar Partner
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex items-center justify-center px-6 pt-20 text-center relative">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-6">
            <Zap size={10} className="fill-indigo-400" />
            Program Rakan Kongsi Eksklusif
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-6">
            Jana{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">
              Pendapatan Pasif
            </span>
            <br />Setiap Bulan.
          </h1>
          <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto mb-4">
            Perkenalkan Beepme.pro kepada kedai F&B. Terima <span className="text-white font-bold">30% komisen berulang</span> selagi mereka melanggan.
          </p>
          <p className="text-indigo-400 font-black text-lg mb-10">
            RM{(MONTHLY_PRICE * 0.3).toFixed(2)} / bulan × bilangan kedai = pendapatan pasif anda.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-base hover:bg-indigo-500 shadow-2xl shadow-indigo-600/25 transition-all active:scale-95">
              Sertai Sebagai Rakan Kongsi
              <ArrowRight size={18} />
            </a>
            <Link href="/partner/terms"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border border-white/10 text-slate-400 font-black text-base hover:text-white hover:bg-white/5 transition-all">
              Baca Terma & Syarat
            </Link>
          </div>
        </div>
      </section>

      {/* What is Beepme section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Apa itu Beepme.pro?</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-2">
              Pager Fizikal Dah Lapuk.
            </h2>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-base">
              Beepme.pro gantikan hardware pager mahal (RM1,500-3,000+) dengan telefon yang <em>sudah ada</em> di tangan customer.
            </p>
          </div>

          {/* 3-Step Process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
            {[
              { icon: <QrCode size={28} />, step: '01', title: 'Kedai Print Poster QR', desc: 'Satu poster QR unik Beepme diletakkan di kaunter pesanan.' },
              { icon: <Smartphone size={28} />, step: '02', title: 'Customer Scan dengan Telefon', desc: 'Customer scan QR dan telefon mereka kini menjadi pager digital.' },
              { icon: <Bell size={28} />, step: '03', title: 'Telefon Bergetar & Berbunyi', desc: 'Apabila makanan siap, kedai klik "Beep" dan telefon customer akan bergetar, berbunyi, dan skrin cerah.' },
            ].map((item) => (
              <div key={item.step} className="p-8 rounded-[32px] border border-white/5 bg-white/[0.02] text-left">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-indigo-500/30 font-black font-mono text-3xl">{item.step}</span>
                  <div className="text-indigo-500">{item.icon}</div>
                </div>
                <h3 className="text-white font-black text-lg mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Comparison Table */}
          <div className="rounded-[32px] border border-white/5 bg-white/[0.02] overflow-hidden">
            <div className="grid grid-cols-3 bg-white/[0.03] border-b border-white/5">
              <div className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Ciri</div>
              <div className="p-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Pager Fizikal</div>
              <div className="p-4 text-[10px] font-black uppercase tracking-widest text-indigo-400">Beepme.pro ✨</div>
            </div>
            {comparisonRows.map((row, i) => (
              <div key={i} className="grid grid-cols-3 border-b border-white/5 last:border-0 hover:bg-white/[0.01] transition-colors">
                <div className="p-4 text-xs font-medium text-slate-400">{row.label}</div>
                <div className="p-4 text-xs text-slate-500">{row.hardware}</div>
                <div className="p-4 text-xs font-bold text-emerald-400">{row.beepme}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Calculator */}
      <section className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Kalkulator Komisen</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-2">Berapa Potensi Anda?</h2>
          </div>

          <div className="p-8 rounded-[40px] border border-indigo-500/20 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-black text-white uppercase tracking-widest">Bilangan Kedai Dirujuk</label>
                <span className="text-indigo-400 font-black text-2xl">{merchants}</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                value={merchants}
                onChange={(e) => setMerchants(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-slate-600 mt-1">
                <span>1 kedai</span>
                <span>500 kedai</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Komisen Bulanan</p>
                <p className="text-3xl font-black text-white">RM{monthlyCommission.toLocaleString()}</p>
                <p className="text-[10px] text-indigo-400 mt-1">{merchants} kedai × RM{MONTHLY_PRICE} × 30%</p>
              </div>
              <div className="p-5 rounded-2xl bg-black/30 border border-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Komisen Tahunan</p>
                <p className="text-3xl font-black text-white">RM{annualCommission.toLocaleString()}</p>
                <p className="text-[10px] text-violet-400 mt-1">Jika langgan RM490/tahun</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-center">
              <p className="text-emerald-400 text-xs font-black">💡 Dengan {merchants} kedai aktif = RM{monthlyCommission.toLocaleString()} / bulan pendapatan pasif anda!</p>
            </div>
          </div>
        </div>
      </section>

      {/* How to Get Your Link */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Cara Bermula</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-2">4 Langkah Mudah.</h2>
          </div>
          <div className="space-y-4">
            {[
              { num: '01', title: 'Hubungi Admin', desc: 'Klik butang WhatsApp di bawah dan hantarkan maklumat anda (Nama, Saluran Media Sosial, Kod Yang Dikehendaki).' },
              { num: '02', title: 'Dapatkan Pautan Unik', desc: 'Admin akan mengaktifkan akaun partner anda dan memberikan link rujukan khas seperti beepme.pro/login?ref=KODANDA.' },
              { num: '03', title: 'Kongsi & Promosikan', desc: 'Kongsikan link semasa Live TikTok, reel, atau caption. Setiap klik link anda akan dijejak secara automatik.' },
              { num: '04', title: 'Terima Komisen Bulanan', desc: 'Login ke Dashboard Partner anda untuk pantau komisen secara live. Duit masuk ke bank anda setiap awal bulan.' },
            ].map((step) => (
              <div key={step.num} className="flex gap-6 p-6 rounded-2xl border border-white/5 bg-white/[0.01] hover:border-indigo-500/20 transition-all items-start">
                <span className="text-3xl font-black text-indigo-500/20 font-mono shrink-0">{step.num}</span>
                <div>
                  <h3 className="text-white font-black text-base mb-1">{step.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-white/[0.01]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em]">Soalan Lazim</span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mt-2">FAQ</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-white font-bold text-sm">{faq.q}</span>
                  <ChevronDown size={16} className={`text-slate-500 shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5">
                    <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
            Sedia Mulakan?
          </h2>
          <p className="text-slate-400 mb-10 text-base">
            Dengan menyertai, anda bersetuju dengan{' '}
            <Link href="/partner/terms" className="text-indigo-400 underline hover:text-indigo-300">Terma & Syarat</Link>{' '}dan{' '}
            <Link href="/privacy" className="text-indigo-400 underline hover:text-indigo-300">Polisi Privasi (PDPA)</Link> kami.
          </p>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-500 shadow-2xl shadow-indigo-600/25 transition-all active:scale-95"
          >
            Hubungi Admin via WhatsApp
            <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.3em]">© 2026 BEEPME.PRO</p>
          <div className="flex gap-6 text-[8px] font-black uppercase tracking-widest text-slate-500">
            <Link href="/privacy">Polisi Privasi</Link>
            <Link href="/partner/terms">Terma Rakan Kongsi</Link>
            <Link href="/login">Log Masuk</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
