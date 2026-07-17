'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Zap, CheckCircle2, Smartphone, Store, 
  ArrowRight, ShieldCheck, 
  Clock, Play, Star, ChevronDown,
  X, Menu, DollarSign, Battery, Infinity as InfinityIcon,
  HelpCircle, MessageCircle, AlertTriangle, Sparkles, Plus, Minus
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { motion, AnimatePresence } from 'framer-motion'

export default function LandingPageClient() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeFaq, setActiveFaq] = useState<number | null>(null)
  
  // Interactive Phone Demo States
  const [phoneState, setPhoneState] = useState<'waiting' | 'called' | 'claimed'>('waiting')
  const [isPhoneShaking, setIsPhoneShaking] = useState(false)
  const [orderNumber, setOrderNumber] = useState('124')
  
  // Savings Calculator States
  const [pagerCount, setPagerCount] = useState(15)

  // Web Audio Beep Synth
  const playBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      
      const playSingleBeep = (startTime: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        
        osc.type = 'sine'
        osc.frequency.setValueAtTime(987.77, startTime) // B5 note - crisp beep
        
        gain.gain.setValueAtTime(0, startTime)
        gain.gain.linearRampToValueAtTime(0.6, startTime + 0.05)
        gain.gain.linearRampToValueAtTime(0.6, startTime + 0.15)
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25)
        
        osc.start(startTime)
        osc.stop(startTime + 0.25)
      }
      
      const now = ctx.currentTime
      playSingleBeep(now)
      playSingleBeep(now + 0.3)
      playSingleBeep(now + 0.6)
    } catch (err) {
      console.warn("Audio Context blocked or not supported: ", err)
    }
  }

  // Trigger Phone Beep Call
  const handleCallDemo = () => {
    if (phoneState === 'called') return
    setPhoneState('called')
    setIsPhoneShaking(true)
    playBeep()
    
    // Interval beep sound while phone is active
    const beepInterval = setInterval(() => {
      playBeep()
    }, 1200)

    // Stop shaking after some seconds, but keep called state
    const shakeTimeout = setTimeout(() => {
      setIsPhoneShaking(false)
    }, 3000)

    ;(window as any)._beepInterval = beepInterval
    ;(window as any)._shakeTimeout = shakeTimeout
  }

  const handleClaimDemo = () => {
    clearInterval((window as any)._beepInterval)
    clearTimeout((window as any)._shakeTimeout)
    setIsPhoneShaking(false)
    setPhoneState('claimed')
  }

  const handleResetDemo = () => {
    clearInterval((window as any)._beepInterval)
    clearTimeout((window as any)._shakeTimeout)
    setIsPhoneShaking(false)
    setPhoneState('waiting')
  }

  useEffect(() => {
    return () => {
      clearInterval((window as any)._beepInterval)
      clearTimeout((window as any)._shakeTimeout)
    }
  }, [])

  // Math for Savings
  const physicalCost = (pagerCount * 250) + 600
  const beepmeCost = 0
  const savings = physicalCost - beepmeCost

  const faqs = [
    {
      q_bm: "Adakah pelanggan perlu memuat turun (install) sebarang aplikasi?",
      q_en: "Do customers need to download any application?",
      a_bm: "Tidak sama sekali. Pelanggan hanya perlu mengimbas kod QR di kaunter menggunakan kamera telefon pintar mereka. Skrin pager maya akan terbuka secara automatik melalui pelayar web (browser) seperti Safari atau Chrome.",
      a_en: "No. Customers only need to scan the QR code at the counter using their phone camera. The virtual pager screen will open automatically in their browser."
    },
    {
      q_bm: "Bagaimana jika telefon pelanggan berada dalam mod senyap (Silent Mode)?",
      q_en: "What if the customer's phone is on Silent Mode?",
      a_bm: "Jangan risau! Apabila dipanggil, sistem Beepme akan mengaktifkan getaran (vibration) fizikal telefon pintar secara berturut-turut, memaparkan kelipan skrin merah-putih yang sangat terang, serta membunyikan nada dering khas sebaik sahaja dibenarkan oleh pengguna.",
      a_en: "Don't worry! When called, Beepme triggers repeating physical vibrations, flashes a highly noticeable red-and-white screen, and plays a chime once permitted by the user."
    },
    {
      q_bm: "Adakah terdapat had bilangan pesanan untuk akaun percuma?",
      q_en: "Is there a limit to the number of orders for the free plan?",
      a_bm: "Tiada had! Anda boleh memproses seberapa banyak pesanan yang anda mahu secara percuma. Akaun percuma disokong oleh paparan iklan tajaan yang dipaparkan di skrin menunggu pelanggan.",
      a_en: "No limit! You can process as many orders as you want for free. Free accounts are supported by showing sponsored ads on the customer's wait screen."
    },
    {
      q_bm: "Bagaimanakah fungsi pengumpul Google Review 5-Bintang berfungsi?",
      q_en: "How does the 5-Star Google Review booster work?",
      a_bm: "Apabila pelanggan menekan butang 'Makanan Diambil' di telefon mereka, Beepme akan memaparkan mesej penghargaan mesra berserta pautan terus ke profil Google Business anda. Ini mendorong pelanggan gembira menulis review dalam satu klik!",
      a_en: "When customers tap 'Order Received' on their phone, Beepme shows a friendly thank you card with a direct link to your Google Business profile. This prompts happy customers to write reviews in one click!"
    },
    {
      q_bm: "Apakah POS yang disokong oleh Beepme secara automatik?",
      q_en: "Which POS systems does Beepme integrate with automatically?",
      a_bm: "Kami menyokong integrasi automatik dengan Loyverse POS melalui Webhook. Sebaik sahaja resit dicetak di Loyverse, sesi pager maya akan dijana secara automatik. Bagi POS lain, anda boleh menggunakan dashboard manual kami yang sangat pantas.",
      a_en: "We support Loyverse POS integrations out-of-the-box. When a receipt is printed, a virtual pager session is auto-generated. For other POS systems, you can easily use our manual dashboard."
    }
  ]

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 selection:bg-orange-500/30 selection:text-white font-sans scroll-smooth">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orange-600/5 blur-[150px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 blur-[180px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-10 left-1/3 w-[450px] h-[450px] bg-amber-600/5 blur-[130px] rounded-full pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 bg-[#07080a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Logo size={34} />

          <div className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <Link href="#kelebihan" className="hover:text-white transition-colors">Kelebihan</Link>
            <Link href="#langkah" className="hover:text-white transition-colors">Cara Guna</Link>
            <Link href="#kalkulator" className="hover:text-white transition-colors">Kalkulator</Link>
            <Link href="#harga" className="hover:text-white transition-colors">Harga</Link>
            <Link href="/partner" className="text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">
              <Sparkles size={12} />
              Partner Program
            </Link>
            <Link href="/login" className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
              Daftar / Masuk
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-white" aria-label="Toggle navigation menu">
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[65px] z-40 bg-[#07080a] border-b border-white/10 flex flex-col p-6 gap-6 text-sm font-semibold tracking-wide md:hidden"
          >
            <Link href="#kelebihan" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-white py-2 border-b border-white/5">Kelebihan</Link>
            <Link href="#langkah" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-white py-2 border-b border-white/5">Cara Guna</Link>
            <Link href="#kalkulator" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-white py-2 border-b border-white/5">Kalkulator Penjimatan</Link>
            <Link href="#harga" onClick={() => setIsMenuOpen(false)} className="text-slate-300 hover:text-white py-2 border-b border-white/5">Harga</Link>
            <Link href="/partner" onClick={() => setIsMenuOpen(false)} className="text-orange-400 hover:text-orange-300 py-2 border-b border-white/5">Partner Program</Link>
            <div className="flex gap-4 pt-2">
              <Link href="/login" className="flex-1 py-3 text-center rounded-xl bg-white/5 border border-white/10 text-white font-bold">
                Log Masuk
              </Link>
              <Link href="/login" className="flex-1 py-3 text-center rounded-xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/20">
                Daftar Percuma
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. HERO SECTION */}
      <section className="pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Hero */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-widest mb-2">
              <Zap size={14} className="fill-orange-400" />
              Tiada Lagi Pager Fizikal Mahal
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              Telefon Pelanggan Adalah <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-300">
                Pager Kedai Anda.
              </span>
            </h1>

            <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Gantikan <strong className="text-white">buzzer / pager perkakasan</strong> restoran anda yang sering pecah dan hilang dengan sistem QR virtual <strong className="text-white">Beepme.pro</strong>. Jimat ribuan ringgit hari ini juga!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/login" className="inline-flex px-8 py-4 rounded-xl bg-orange-600 text-white font-black text-base hover:bg-orange-500 shadow-xl shadow-orange-600/30 transition-all items-center justify-center gap-2 active:scale-95">
                Mula Percuma Sekarang
                <ArrowRight size={18} />
              </Link>
              <Link href="#demo" className="inline-flex px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all justify-center items-center gap-2">
                <Play size={16} className="fill-white" />
                Lihat Demo Pager
              </Link>
            </div>

            {/* Trusted By Badges */}
            <div className="pt-6 border-t border-white/5 space-y-3">
              <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Sesuai digunakan oleh:</p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {['Mamak', 'Kopitiam', 'Hipster Cafe', 'Medan Selera', 'Food Truck', 'Restoran'].map((tag, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] font-bold text-slate-400">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Hero: Interactive Phone Mockup */}
          <div id="demo" className="lg:col-span-5 flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none -z-10" />
            
            {/* Control Panel for Demo */}
            <div className="w-full max-w-sm mb-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md text-center space-y-3">
              <p className="text-xs font-bold text-slate-400">
                Langkah Simulasi Peniaga:
              </p>
              
              <div className="flex gap-2">
                <button 
                  onClick={handleCallDemo}
                  disabled={phoneState === 'called'}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    phoneState === 'called' 
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20 active:scale-95'
                  }`}
                >
                  <Zap size={14} className="fill-white" />
                  Panggil Resit #{orderNumber}
                </button>

                <button 
                  onClick={handleResetDemo}
                  className="py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/5"
                >
                  Reset Demo
                </button>
              </div>
            </div>

            {/* Smart Phone Shell */}
            <div className="relative w-[300px] h-[580px] rounded-[48px] border-[6px] border-slate-700 bg-black p-3.5 shadow-2xl overflow-hidden">
              {/* Speaker / Dynamic Island notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-slate-800 rounded-full" />
              </div>

              {/* Internal Screen Content */}
              <div className={`w-full h-full rounded-[36px] overflow-hidden relative flex flex-col justify-between p-6 ${
                phoneState === 'called' ? 'bg-[#ff0c2b] animate-lcd-flicker text-white' : 'bg-[#0f1118] text-slate-200'
              } transition-colors duration-300`}>
                
                {/* Header status bar */}
                <div className="flex justify-between items-center text-[10px] font-bold opacity-70">
                  <span>9:41 AM</span>
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-4 h-2 border border-current rounded-xs" />
                  </div>
                </div>

                {/* Main Notification screen */}
                <div className="my-auto flex flex-col items-center text-center space-y-6">
                  {phoneState === 'waiting' && (
                    <div className="space-y-4">
                      {/* Logo and Cafe Mock name */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 mb-2">
                          <Store size={24} />
                        </div>
                        <h4 className="font-bold text-sm text-white">Restoran Nasi Lemak Ong</h4>
                        <p className="text-[10px] text-slate-500">Kuala Lumpur</p>
                      </div>

                      {/* Receipt Display */}
                      <div className="py-4 px-6 rounded-2xl bg-white/[0.03] border border-white/5">
                        <p className="text-xs text-slate-400">Nombor Giliran Anda</p>
                        <h3 className="text-3xl font-black text-white mt-1">#{orderNumber}</h3>
                      </div>

                      {/* Status indicator */}
                      <div className="space-y-2">
                        <div className="flex justify-center gap-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500/40" />
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500/20" />
                        </div>
                        <p className="text-xs text-slate-400 font-medium">Sila tunggu... Makanan anda sedang disediakan oleh dapur.</p>
                      </div>
                      
                      <div className="pt-2">
                        <span className="text-[8px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-white/5 text-slate-500 border border-white/5">
                          Screen Wake-Lock Active
                        </span>
                      </div>
                    </div>
                  )}

                  {phoneState === 'called' && (
                    <motion.div 
                      animate={isPhoneShaking ? {
                        x: [0, -10, 10, -10, 10, -5, 5, 0],
                        y: [0, 5, -5, 5, -5, 2, -2, 0]
                      } : {}}
                      transition={{ repeat: Infinity, duration: 0.5 }}
                      className="space-y-6"
                    >
                      <div className="w-20 h-20 rounded-full bg-white text-[#ff0c2b] flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                        <Zap size={40} className="fill-[#ff0c2b] animate-bounce" />
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-3xl font-black tracking-tight text-white animate-pulse">
                          PESANAN SEDIA!
                        </h3>
                        <p className="text-sm font-bold text-white/90">
                          Sila ambil makanan anda di kaunter sekarang.
                        </p>
                      </div>

                      <div className="py-2 px-4 rounded-xl bg-black/30 font-black text-xl text-white inline-block">
                        Order #{orderNumber}
                      </div>

                      <button
                        onClick={handleClaimDemo}
                        className="w-full py-4 px-6 rounded-2xl bg-white text-black font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl"
                      >
                        ✓ Saya Dah Ambil
                      </button>
                    </motion.div>
                  )}

                  {phoneState === 'claimed' && (
                    <div className="space-y-5 animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 mx-auto">
                        <CheckCircle2 size={24} />
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-bold text-sm text-white">Terima Kasih!</h4>
                        <p className="text-xs text-slate-400">Harap anda berpuas hati dengan makanan kami.</p>
                      </div>

                      {/* Google Review Booster Card */}
                      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-left space-y-3">
                        <div className="flex items-center gap-1.5 text-yellow-400">
                          {[1,2,3,4,5].map((s) => <Star key={s} size={10} className="fill-yellow-400" />)}
                          <span className="text-[10px] text-white font-bold ml-1">5-Bintang</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                          Bantu kedai kami berkembang! Tulis review 5-bintang anda di Google Maps sekarang.
                        </p>
                        <a 
                          href="https://maps.google.com" 
                          target="_blank" 
                          rel="noreferrer"
                          className="block w-full py-2.5 text-center rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-colors"
                        >
                          Tulis Review Di Google
                        </a>
                      </div>

                      <button 
                        onClick={handleResetDemo}
                        className="text-[10px] text-slate-500 hover:text-slate-400 underline"
                      >
                        Reset & Cuba Sekali Lagi
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer home indicator */}
                <div className="w-24 h-1 bg-slate-800 rounded-full mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. WHY BEEPME COMPARISON */}
      <section id="kelebihan" className="py-24 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] font-black text-orange-500">Kenapa Tukar Kepada Beepme?</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Kelemahan Pager Fizikal vs Kelebihan Beepme.pro</h3>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Bandingkan kos perolehan dan kekangan pengurusan peranti fizikal berbanding sistem maya digital berasaskan QR.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Physical Pager Column */}
            <div className="p-8 rounded-3xl bg-red-950/10 border border-red-500/10 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] rounded-full" />
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="text-lg font-black text-white">Pager Fizikal Kuno (Hardware)</h4>
              </div>

              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span><strong>Kos Sangat Tinggi:</strong> Satu set pager (10 unit) berharga RM1,800 ke RM3,000. Sangat membebankan usahawan kecil.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span><strong>Masalah Bateri:</strong> Bateri pager fizikal cepat kong dan perlu diletakkan di dock cas setiap hari.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span><strong>Risiko Hilang & Pecah:</strong> Pelanggan sering tersalah bawa balik atau tercicir sehingga pecah. Kos ganti rugi mahal.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">✕</span>
                  <span><strong>Had Jarak Isyarat:</strong> Isyarat frekuensi radio tidak lepas jika pelanggan menunggu di dalam kereta atau kedai bersebelahan.</span>
                </li>
              </ul>
            </div>

            {/* Beepme QR Pager Column */}
            <div className="p-8 rounded-3xl bg-indigo-950/15 border border-indigo-500/25 space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full" />
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles size={24} />
                </div>
                <h4 className="text-lg font-black text-white">Beepme.pro Virtual Pager</h4>
              </div>

              <ul className="space-y-4 text-sm text-slate-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <span><strong>Kos Setup RM0:</strong> Tidak memerlukan sebarang pembelian perkakasan. Cuma cetak kod QR sedia ada.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <span><strong>Tanpa Senggaraan Bateri:</strong> Menggunakan telefon bimbit pelanggan sendiri. Bateri sentiasa tersedia.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <span><strong>Kumpul Google Reviews:</strong> Satu-satunya sistem yang mendorong pelanggan menulis review sebaik sahaja order sedia.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold mt-0.5">✓</span>
                  <span><strong>Sistem Berasaskan Awan:</strong> Berfungsi pada sebarang jarak selagi peranti mempunyai akses internet/data.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE SAVINGS CALCULATOR */}
      <section id="kalkulator" className="py-24 px-6 border-t border-white/5 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] font-black text-orange-500">Kalkulator Penjimatan Kos</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Kira Berapa Anda Boleh Jimat</h3>
            <p className="text-slate-400 text-sm sm:text-base">
              Bandingkan harga purata set pager fizikal di pasaran Malaysia dengan menggunakan sistem Beepme.pro.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-300">
                  Anggaran Bilangan Pager Fizikal Diperlukan:
                </label>
                <span className="text-2xl font-black text-orange-400">{pagerCount} Pager</span>
              </div>
              
              {/* Slider Input */}
              <input 
                type="range" 
                min="5" 
                max="50" 
                value={pagerCount} 
                onChange={(e) => setPagerCount(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-orange-500" 
              />
              
              <div className="flex justify-between text-xs text-slate-500 font-bold">
                <span>5 Pager</span>
                <span>25 Pager</span>
                <span>50 Pager</span>
              </div>
            </div>

            {/* Calculations Output */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase">Harga Set Pager Fizikal:</p>
                <p className="text-2xl font-black text-red-500">
                  RM {physicalCost.toLocaleString()}
                  <span className="text-xs text-slate-500 font-medium block">
                    (Anggaran RM250/pager + RM600 Transmitter base)
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-slate-500 font-bold uppercase">Harga Beepme.pro:</p>
                <p className="text-2xl font-black text-green-400">
                  RM 0 <span className="text-xs text-slate-500 font-medium">/ Selamanya Percuma</span>
                  <span className="text-xs text-slate-500 font-medium block">
                    (Atau upgrade ke Premium serendah RM49/bulan)
                  </span>
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 text-center space-y-1">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Anda Menjimatkan Kos Setup Sebanyak:</p>
              <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                RM {savings.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PROCESS / STEPS */}
      <section id="langkah" className="py-24 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] font-black text-orange-500">Kemudahan Operasi</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">3 Langkah Mudah Setup Di Kedai</h3>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Tidak memerlukan kepakaran IT. Anda boleh memulakan sistem pager maya ini dalam masa kurang dari 5 minit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              step="01"
              title="Jana Pager di Dashboard"
              desc="Masukkan nombor resit/pesanan di dashboard Beepme anda (atau ia dijana secara automatik daripada integrasi POS) untuk menghasilkan kod QR unik."
            />
            <StepCard 
              step="02"
              title="Tunjuk & Imbas QR"
              desc="Tunjukkan kod QR pada skrin peranti/tablet kaunter atau cetak pada resit. Pelanggan hanya perlu imbas untuk mengaktifkan pager maya."
            />
            <StepCard 
              step="03"
              title="Panggil Apabila Siap"
              desc="Masukkan nombor resit di Dashboard Beepme anda dan klik 'Call'. Telefon pelanggan akan berdering, bergetar dan berkelip."
            />
          </div>
        </div>
      </section>

      {/* 5. SPOTLIGHT FEATURES: GOOGLE REVIEWS & POS */}
      <section className="py-24 px-6 border-t border-white/5 relative">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Spotlight 1: Google Reviews */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider">
                <Star size={12} className="fill-yellow-400" />
                Google Review Booster
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Tingkatkan Penarafan Kedai di Google Maps Secara Automatik
              </h3>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Kunci kejayaan kedai makan zaman sekarang ialah review bintang di Google. Beepme.pro mempunyai sistem terbina untuk mengajak pelanggan menulis ulasan 5-bintang sejurus selepas mereka selesai mengambil makanan dari kaunter anda.
              </p>
              <div className="space-y-3 font-semibold text-sm text-slate-300 text-left max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-yellow-400 flex-shrink-0" />
                  <span>Mendorong rating positif daripada pelanggan gembira.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-yellow-400 flex-shrink-0" />
                  <span>Meningkatkan visibility restoran di carian 'Kedai Makan Terdekat'.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 flex justify-center">
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md max-w-md space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 blur-[40px] rounded-full" />
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Rating Kedai Anda</h4>
                  <span className="text-xs text-slate-500">Kemaskini Real-Time</span>
                </div>
                
                <div className="flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="text-center border-r border-white/10 pr-6">
                    <h5 className="text-4xl font-black text-white">4.9</h5>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Purata Skor</p>
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex gap-1 text-yellow-400">
                      {[1,2,3,4,5].map((s) => <Star key={s} size={12} className="fill-yellow-400" />)}
                    </div>
                    <p className="text-xs text-slate-300 font-bold">248 review baru bulan ini</p>
                    <p className="text-[10px] text-slate-500">+115% peningkatan berbanding bulan lepas</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed italic">
                  &quot;Semenjak pakai Beepme, pelanggan rajin bagi Google Review masa tunggu nasi beriyani siap. Rating gerai kami naik mendadak ke 4.9 bintang!&quot;
                  <span className="block font-bold text-slate-300 mt-2 not-italic">— Restoran Nasi Kandar Jamil, Penang</span>
                </p>
              </div>
            </div>
          </div>

          {/* Spotlight 2: Loyverse POS Integration */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center pt-10">
            <div className="lg:col-span-6 lg:order-2 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Store size={12} />
                Integrasi Automatik
              </div>
              <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Integrasi Pintar Bersama Loyverse POS
              </h3>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                Adakah anda menggunakan Loyverse POS di kedai? Segerakkan pesanan anda secara automatik. Apabila juruwang mencetak resit di POS, sistem Beepme akan terus menjana pager digital tanpa memerlukan input manual.
              </p>
              <div className="space-y-3 font-semibold text-sm text-slate-300 text-left max-w-md mx-auto lg:mx-0">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-indigo-400 flex-shrink-0" />
                  <span>Pengeluaran pager automatik tanpa melambatkan cashier.</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-indigo-400 flex-shrink-0" />
                  <span>Sinkronisasi data jualan selamat menerusi Secure Webhooks.</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 lg:order-1 flex justify-center">
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 backdrop-blur-md max-w-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">Status Webhook POS</span>
                  <span className="px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">CONNECTED</span>
                </div>

                <div className="space-y-2 text-xs">
                  <p className="text-slate-500 font-bold">URL Webhook Unik Kedai Anda:</p>
                  <div className="p-3 rounded-xl bg-black/60 border border-white/5 text-[10px] font-mono text-indigo-400 break-all select-all">
                    https://beepme.pro/api/webhooks/loyverse?merchant_id=9a7c...
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    L
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white">Loyverse API Connector</p>
                    <p className="text-[10px] text-slate-500">Sync automatik jualan sale aktif</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. PRICING SECTION */}
      <section id="harga" className="py-24 px-6 border-t border-white/5 bg-white/[0.01] relative">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] font-black text-orange-500">Pakej Langganan</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Pelan Harga Telus & Berpatutan</h3>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              Pilih pelan yang sesuai dengan kapasiti operasi perniagaan anda. Tiada yuran tersembunyi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-[36px] bg-white/[0.02] border border-white/5 flex flex-col justify-between space-y-8 relative overflow-hidden">
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Pelan Asas</p>
                  <h4 className="text-2xl font-black text-white mt-1">Selamanya Percuma</h4>
                </div>

                <div className="flex items-baseline text-white">
                  <span className="text-5xl font-black">RM 0</span>
                  <span className="text-xs text-slate-500 ml-2 font-bold">/ selamanya</span>
                </div>

                <ul className="space-y-4 text-xs font-semibold text-slate-400 border-t border-white/5 pt-6">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-slate-600 flex-shrink-0" />
                    <span>Bilangan Pesanan Tanpa Had (Unlimited)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-slate-600 flex-shrink-0" />
                    <span>Skrin Pager Maya (Disokong Iklan Sponsor)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-slate-600 flex-shrink-0" />
                    <span>Integrasi Loyverse POS</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-slate-600 flex-shrink-0" />
                    <span>Screen Wake Lock API</span>
                  </li>
                </ul>
              </div>

              <Link href="/login" className="w-full py-4 text-center rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm hover:bg-white/10 transition-all active:scale-95">
                Daftar Akaun Percuma
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="p-8 rounded-[36px] bg-gradient-to-b from-orange-500/5 to-transparent border border-orange-500/30 flex flex-col justify-between space-y-8 relative shadow-2xl shadow-orange-500/5">
              <div className="absolute top-0 right-8 -translate-y-1/2 bg-orange-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                Paling Popular
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-xs font-black uppercase text-orange-400 tracking-wider">Premium Station</p>
                  <h4 className="text-2xl font-black text-white mt-1">Tanpa Sebarang Iklan</h4>
                </div>

                <div className="flex items-baseline text-white">
                  <span className="text-5xl font-black">RM 49</span>
                  <span className="text-xs text-slate-500 ml-2 font-bold">/ sebulan</span>
                </div>

                <ul className="space-y-4 text-xs font-semibold text-slate-300 border-t border-white/5 pt-6">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-orange-500 flex-shrink-0" />
                    <span><strong>100% Bebas Iklan Pihak Ketiga</strong></span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-orange-500 flex-shrink-0" />
                    <span>Tampal Promosi / Banner Anda Sendiri</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-orange-500 flex-shrink-0" />
                    <span>Letak Logo & Tukar Tema Warna Skrin Kedai</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-orange-500 flex-shrink-0" />
                    <span>Sistem Booster Google Review Terbina</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 size={16} className="text-orange-500 flex-shrink-0" />
                    <span>Bantuan VIP Terus Ke Telefon Anda</span>
                  </li>
                </ul>
              </div>

              <Link href="/login" className="w-full py-4 text-center rounded-2xl bg-orange-500 text-white font-black text-sm hover:bg-orange-400 transition-all active:scale-95 shadow-xl shadow-orange-500/20">
                Langgan Premium Sekarang
              </Link>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 font-medium">
            *Tiada kontrak diikat. Anda boleh membatalkan langganan premium anda pada bila-bila masa sahaja.
          </p>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs uppercase tracking-[0.25em] font-black text-orange-500">Soalan Lazim</h2>
            <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Soalan Mengenai Beepme.pro</h3>
            <p className="text-slate-400 text-sm sm:text-base">
              Kami sedia menjawab segala keraguan anda tentang penggunaan sistem pager pintar ini.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all cursor-pointer"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="text-left">
                    <h4 className="font-bold text-white text-sm sm:text-base">{faq.q_bm}</h4>
                    <p className="text-[10px] text-slate-500 italic font-medium mt-0.5">{faq.q_en}</p>
                  </div>
                  <div className="text-slate-500 flex-shrink-0">
                    {activeFaq === idx ? <Minus size={18} /> : <Plus size={18} />}
                  </div>
                </div>

                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-4 pt-4 border-t border-white/5 text-left text-xs sm:text-sm text-slate-400 space-y-2 leading-relaxed"
                    >
                      <p>{faq.a_bm}</p>
                      <p className="text-slate-500 italic">{faq.a_en}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. BOTTOM CTA & FOOTER */}
      <section className="py-24 px-6 border-t border-white/5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-600/5 -z-10" />
        
        <div className="max-w-4xl mx-auto space-y-12">
          <h2 className="text-4xl sm:text-7xl font-black text-white tracking-tight">
            Tingkatkan Kecekapan Kedai Makan Anda Hari Ini.
          </h2>
          
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Sertai ratusan kafe, mamak, dan warung di Malaysia yang menggunakan Beepme untuk mengurangkan barisan menunggu.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login" className="px-10 py-5 rounded-2xl bg-orange-500 text-white font-black text-lg hover:bg-orange-400 shadow-xl shadow-orange-500/20 transition-all active:scale-95">
              Daftar Percuma Sekarang
            </Link>
            
            <a 
              href="https://wa.me/60123456789?text=Saya%20berminat%20tahu%20lebih%20lanjut%20tentang%20Beepme.pro" 
              target="_blank" 
              rel="noreferrer"
              className="px-10 py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-emerald-600/10"
            >
              <MessageCircle size={22} className="fill-white text-emerald-600" />
              Hubungi Kami di WhatsApp
            </a>
          </div>

          <div className="pt-12 flex flex-wrap justify-center gap-8 opacity-40">
             <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-white"><ShieldCheck size={14}/> 100% Selamat</span>
             <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-white"><Zap size={14}/> Setup Serta-Merta</span>
             <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-white"><Store size={14}/> Dibina khas untuk F&B</span>
          </div>
        </div>

        <footer className="mt-20 pt-10 border-t border-white/5 max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">© 2026 BEEPME.PRO. HAK CIPTA TERPELIHARA.</p>
          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">
             <Link href="/privacy" className="hover:text-white transition-colors">Polisi Privasi</Link>
             <Link href="/partner/terms" className="hover:text-white transition-colors">Terma & Syarat</Link>
             <Link href="/partner" className="hover:text-white transition-colors">Program Affiliate</Link>
             <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
             <a href="mailto:support@beepme.pro" className="hover:text-white transition-colors">Bantuan</a>
          </div>
        </footer>
      </section>

      {/* Floating WhatsApp Help Widget */}
      <a 
        href="https://wa.me/60123456789?text=Saya%20berminat%20tahu%20lebih%20lanjut%20tentang%20Beepme.pro" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group"
        aria-label="Contact us on WhatsApp"
      >
        <MessageCircle size={24} className="fill-white text-emerald-500 group-hover:rotate-12 transition-transform duration-300" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 text-xs font-bold transition-all duration-300 whitespace-nowrap">
          Sembang WhatsApp
        </span>
      </a>
    </div>
  )
}

function StepCard({ step, title, desc }: { step: string, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 text-left hover:border-white/10 transition-all hover:scale-[1.02] duration-300 flex flex-col justify-between h-full">
      <div className="space-y-6">
        <div className="text-3xl font-black text-orange-500/20 font-mono">
          {step}
        </div>
        <h4 className="text-lg font-black text-white uppercase tracking-tight">
          {title}
        </h4>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          {desc}
        </p>
      </div>
    </div>
  )
}
