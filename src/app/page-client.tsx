'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Zap, CheckCircle, Smartphone, Store, 
  ArrowRight, ShieldCheck, 
  Clock, Play, Star, ChevronDown,
  X, Menu, DollarSign, Battery, Infinity as InfinityIcon
} from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function LandingPageClient() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activePriceIndex, setActivePriceIndex] = useState(0)

  const handlePriceScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget
    const index = Math.round(container.scrollLeft / container.clientWidth)
    setActivePriceIndex(index)
  }

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-[#020203] text-slate-200 selection:bg-indigo-500/30 selection:text-white font-sans no-scrollbar">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-4 md:py-6 bg-gradient-to-b from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Logo size={36} />

          <div className="hidden md:flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Link href="/partner" className="hover:text-white transition-colors">
              Partner
            </Link>
            <Link href="/login" className="px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
              Login
            </Link>
            <Link href="/login" className="px-5 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
              Free Start
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-white" aria-label="Toggle navigation menu">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center gap-8 text-2xl font-black uppercase tracking-widest animate-fade-in">
          <Link href="/partner" onClick={() => setIsMenuOpen(false)}>Partner Program</Link>
          <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
          <Link href="/login" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8" aria-label="Close navigation menu"><X size={32} /></button>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="h-screen snap-start shrink-0 relative flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <h2 className="sr-only">Beepme: Sistem Pager Restoran Digital & Sistem Giliran F&B Malaysia (Virtual QR Pager System)</h2>
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] mb-6 md:mb-8 animate-fade-in">
            <Zap size={12} className="fill-indigo-400" />
            The Future of F&B Paging
          </div>

          <h1 className="text-4xl md:text-8xl font-black text-white leading-tight tracking-tighter mb-6 md:mb-8 animate-slide-up">
            Stop Buying <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Hardware Pagers.</span>
          </h1>
          
          <p className="text-base md:text-xl text-slate-400 max-w-xl mx-auto mb-10 md:mb-12 font-medium animate-slide-up" style={{ animationDelay: '100ms' }}>
            Replace expensive hardware with <span className="text-white font-bold">Beepme.pro</span>. 
            Use the screens already in your customers&apos; pockets.
          </p>

          <Link href="/login" className="inline-flex px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 transition-all items-center gap-3 active:scale-95 animate-slide-up" style={{ animationDelay: '200ms' }}>
            Start Free Now
            <ArrowRight size={20} />
          </Link>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600 animate-bounce">
          <span className="text-[8px] font-black uppercase tracking-widest">Scroll</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* 2. WHY BEEPME (CAROUSEL ON MOBILE) */}
      <section className="min-h-screen py-24 md:py-32 snap-start shrink-0 relative flex flex-col items-center justify-center px-6 bg-white/[0.01] overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-8 md:mb-16">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Why Beepme?</p>
            <h2 className="text-3xl md:text-6xl font-black text-white tracking-tight">Better Than Hardware.</h2>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar px-4 md:px-0">
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <FeatureCard 
                icon={<DollarSign size={24} />}
                title="RM0 Setup Cost"
                desc="No more RM3,000 sets. Use what you have."
                color="rose"
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <FeatureCard 
                icon={<Battery size={24} />}
                title="No Charging"
                desc="Hardware dies. Phones are always ready."
                color="amber"
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <FeatureCard 
                icon={<Star size={24} />}
                title="Google Reviews"
                desc="Collect reviews with every order ready."
                color="indigo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROCESS */}
      <section className="min-h-screen py-24 md:py-32 snap-start shrink-0 relative flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-3">Simple Process</p>
            <h2 className="text-3xl md:text-6xl font-black text-white tracking-tight mb-8 md:mb-12">Done in Seconds.</h2>
            
            <div className="space-y-6 md:space-y-10 max-w-md mx-auto lg:mx-0">
              <StepItem num="01" title="Issue Pager" desc="Enter receipt # on your dashboard." />
              <StepItem num="02" title="Customer Scans" desc="Scan QR. Their phone is now the pager." />
              <StepItem num="03" title="Beep Them!" desc="Click Call. Their phone vibrates & rings." />
            </div>
          </div>
          
          <div className="flex-1 relative hidden lg:block">
            <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full" />
            <div className="relative p-10 rounded-[40px] bg-white/[0.02] border border-white/10 backdrop-blur-2xl">
               <div className="flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">
                    <Zap size={32} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-xl mb-1">Order #124</p>
                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-[9px]">Ready to Collect!</p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[70%] animate-pulse" />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING */}
      <section className="min-h-screen py-24 md:py-32 snap-start shrink-0 relative flex flex-col items-center justify-center px-6 bg-white/[0.01] overflow-hidden">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-6 md:mb-12">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2">Pricing Plans</p>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">Choose Your Growth.</h2>
          </div>

          {/* Pricing Grid/Carousel */}
          <div 
            onScroll={handlePriceScroll}
            className="flex md:grid md:grid-cols-2 max-w-4xl mx-auto gap-4 md:gap-8 overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar px-4 md:px-0 pt-8 pb-10 md:pb-0"
          >
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <PricingCard 
                name="Always Free"
                price="RM0"
                period="/ forever"
                features={["Unlimited Orders", "Ad-Supported wait page", "Loyverse POS Integration", "Screen WakeLock API"]}
              />
            </div>
            <div className="min-w-[85%] md:min-w-0 snap-center">
              <PricingCard 
                name="Premium Station"
                price="RM49"
                period="/ month"
                features={["100% Ad-Free Pagers", "Custom Upsell Video/Image", "Custom Brand Logo", "Custom Color Themes", "WhatsApp Admin Approval"]}
                recommended
                isPro
              />
            </div>
          </div>
          
          {/* Mobile indicator for 2 items */}
          <div className="flex md:hidden justify-center gap-2 mt-8">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activePriceIndex === 0 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-white/20'}`} />
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${activePriceIndex === 1 ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' : 'bg-white/20'}`} />
          </div>
        </div>
      </section>

      {/* 5. CTA & FOOTER */}
      <section className="min-h-screen py-24 md:py-32 snap-start shrink-0 relative flex flex-col items-center justify-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5" />
        <div className="relative z-10 w-full max-w-4xl text-center pb-12">
          <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter animate-fade-in">Ready to Beep?</h2>
          <p className="text-slate-400 text-base md:text-xl mb-12 max-w-lg mx-auto">
            Join innovative restaurants in Malaysia today. Instant setup, cancel anytime.
          </p>
          <Link href="/login" className="inline-flex px-12 py-5 rounded-2xl bg-white text-black font-black text-lg hover:bg-slate-100 transition-all active:scale-95 shadow-xl shadow-white/5">
            Create Your Station Now
          </Link>
          
          <div className="mt-16 md:mt-24 flex flex-wrap justify-center gap-6 md:gap-12 opacity-30">
             <span className="flex items-center gap-2 font-black uppercase text-[9px] tracking-widest text-white"><ShieldCheck size={14}/> Safe</span>
             <span className="flex items-center gap-2 font-black uppercase text-[9px] tracking-widest text-white"><Zap size={14}/> Instant</span>
             <span className="flex items-center gap-2 font-black uppercase text-[9px] tracking-widest text-white"><Store size={14}/> F&B Pro</span>
          </div>
        </div>

        <footer className="absolute bottom-0 left-0 right-0 py-6 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.3em]">© 2026 BEEPME.PRO</p>
            <div className="flex flex-wrap justify-center gap-6 text-[8px] font-black uppercase tracking-widest text-slate-500">
               <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
               <Link href="/partner/terms" className="hover:text-white transition-colors">Terms</Link>
               <Link href="/partner" className="hover:text-white transition-colors">Partner Program</Link>
               <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
               <a href="mailto:support@beepme.pro" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </section>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  const colors: any = {
    rose: 'text-rose-500 bg-rose-500/5 border-rose-500/10',
    amber: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
    indigo: 'text-indigo-500 bg-indigo-500/5 border-indigo-500/10',
  }

  return (
    <div className="p-6 md:p-8 rounded-[32px] border border-white/5 bg-white/[0.02] text-left h-full">
      <div className={`p-3 md:p-4 rounded-2xl border mb-5 inline-block ${colors[color]}`}>
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-bold text-white mb-3 tracking-tight">{title}</h3>
      <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function StepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-4 md:gap-6 text-left items-start">
      <div className="text-xl md:text-2xl font-black text-indigo-500/20 font-mono mt-1">{num}</div>
      <div>
        <h3 className="text-lg md:text-xl font-black text-white mb-1 md:mb-2 uppercase tracking-tight">{title}</h3>
        <p className="text-slate-500 text-xs md:text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function PricingCard({ name, price, period, features, recommended, isPro }: { name: string, price: string, period: string, features: string[], recommended?: boolean, isPro?: boolean }) {
  return (
    <div className={`p-6 md:p-8 rounded-[40px] border flex flex-col text-left transition-all relative h-full ${recommended ? 'border-indigo-500/50 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10' : 'border-white/5 bg-white/[0.02]'}`}>
      {recommended && (
        <div className="absolute top-0 right-8 -translate-y-1/2 bg-indigo-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Best Value</div>
      )}
      <p className={`font-bold text-[9px] uppercase tracking-widest mb-1 ${recommended ? 'text-indigo-400' : 'text-slate-600'}`}>{name}</p>
      <h3 className="text-2xl md:text-3xl font-black text-white mb-6">
        {price} <span className="text-xs font-medium text-slate-600">{period}</span>
      </h3>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-[10px] md:text-[11px]">
            {f.includes('Unlimited') ? <InfinityIcon size={12} className="text-indigo-400" /> : <CheckCircle size={12} className={recommended ? 'text-indigo-400' : 'text-slate-800'} />}
            <span className={recommended ? 'text-white' : 'text-slate-500'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/login" className={`w-full py-3.5 rounded-2xl font-black text-xs text-center transition-all active:scale-95 ${recommended ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white/5 text-white'}`}>
        {isPro ? 'Go Unlimited' : 'Get Started'}
      </Link>
    </div>
  )
}
