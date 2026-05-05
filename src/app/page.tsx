'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Zap, CheckCircle, Smartphone, Store, 
  ArrowRight, ShieldCheck, 
  Clock, Play, Star, ChevronDown,
  X, Menu, DollarSign, Battery, Infinity as InfinityIcon
} from 'lucide-react'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-[#020203] text-slate-200 selection:bg-indigo-500/30 selection:text-white font-sans">
      {/* Navbar - Fixed at top of viewport */}
      <nav className="fixed top-0 left-0 right-0 z-50 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-[#0f1117] flex items-center justify-center">
              <img src="/icon.png" alt="Beepme Logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-white">Beepme<span className="text-indigo-500">.pro</span></span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Link href="/login" className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all">
              Merchant Login
            </Link>
            <Link href="/login" className="px-6 py-2.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
              Get Started Free
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-white">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center gap-8 text-2xl font-black uppercase tracking-widest animate-fade-in">
          <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
          <Link href="/login" onClick={() => setIsMenuOpen(false)}>Get Started</Link>
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8"><X size={32} /></button>
        </div>
      )}

      {/* 1. HERO SECTION */}
      <section className="h-screen snap-start shrink-0 relative flex flex-col items-center justify-center overflow-hidden px-6 text-center">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-bounce-in">
            <Zap size={14} className="fill-indigo-400" />
            The Future of F&B Guest Paging
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-white leading-[1] tracking-tighter mb-8">
            Stop Buying <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Hardware Pagers.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Your customers already have the world&apos;s best screen in their pockets. <span className="text-white font-bold">Use it.</span> Replace expensive hardware with Beepme.pro.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 group active:scale-95">
              Start Free Station
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-500 animate-bounce">
          <span className="text-[10px] font-black uppercase tracking-widest">Scroll Down</span>
          <ChevronDown size={20} />
        </div>
      </section>

      {/* 2. PROBLEM/SOLUTION */}
      <section className="h-screen snap-start shrink-0 relative flex flex-col items-center justify-center overflow-hidden px-6 bg-white/[0.01]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/[0.02] blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center mb-16">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">Why Beepme?</h2>
            <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight">Hardware is Dying.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <FeatureCard 
              icon={<DollarSign size={28} className="text-rose-500" />}
              title="RM0 Setup Cost"
              desc="Forget spending RM3,000+ on hardware. Use any device you already own."
              color="rose"
            />
            <FeatureCard 
              icon={<Battery size={28} className="text-amber-500" />}
              title="No Charging"
              desc="Hardware pagers die in the rush. Customers' phones are always ready."
              color="amber"
            />
            <FeatureCard 
              icon={<Star size={28} className="text-indigo-500" />}
              title="Get More Reviews"
              desc="Turn 'Order Ready' alerts into 5-star Google Reviews automatically."
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="h-screen snap-start shrink-0 relative flex flex-col items-center justify-center overflow-hidden px-6">
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">The Process</h2>
              <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-12">Ready in 30 Seconds.</h3>
              
              <div className="space-y-8 md:space-y-12 max-w-lg mx-auto lg:mx-0">
                <StepItem num="01" title="Issue a Pager" desc="Enter receipt number on your dashboard." />
                <StepItem num="02" title="Customer Scans" desc="They scan your QR. Their phone is now their pager." />
                <StepItem num="03" title="Beep Them!" desc="Click 'Call' and their phone vibrates & rings." />
              </div>
            </div>
            
            <div className="flex-1 relative hidden md:block">
              <div className="absolute inset-0 bg-indigo-600/10 blur-[80px] rounded-full" />
              <div className="relative p-12 rounded-[50px] bg-white/[0.03] border border-white/10 backdrop-blur-3xl shadow-2xl">
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">
                    <Zap size={40} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-black text-2xl mb-2">Order #124</p>
                    <p className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Your Order is Ready!</p>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[60%] animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PRICING */}
      <section className="h-screen snap-start shrink-0 relative flex flex-col items-center justify-center overflow-hidden px-6 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="text-center mb-12">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">Pricing Plans</h2>
            <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight">Invest RM1, Save RM100.</h3>
          </div>

          <div className="flex md:grid md:grid-cols-3 gap-6 max-w-6xl mx-auto overflow-x-auto md:overflow-visible snap-x snap-mandatory no-scrollbar px-4 md:px-0 pb-10 md:pb-0">
            {/* Free */}
            <div className="min-w-[80vw] sm:min-w-[350px] md:min-w-0 snap-center">
              <PricingCard 
                name="Free Station"
                price="RM0"
                period="/ forever"
                features={["20 Monthly Orders", "Full Digital Pager UI", "Loyverse Integration"]}
              />
            </div>

            {/* Basic */}
            <div className="min-w-[80vw] sm:min-w-[350px] md:min-w-0 snap-center">
              <PricingCard 
                name="Basic Cafe"
                price="RM30"
                period="/ month"
                features={["500 Monthly Orders", "GMB Review Collection", "Loyverse Pro Sync"]}
                recommended
              />
            </div>

            {/* Pro */}
            <div className="min-w-[80vw] sm:min-w-[350px] md:min-w-0 snap-center">
              <PricingCard 
                name="Unlimited"
                price="RM49"
                period="/ month"
                features={["Unlimited Orders", "Custom Branding", "Priority 24/7 Support"]}
                isPro
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA & FOOTER */}
      <section className="h-screen snap-start shrink-0 relative flex flex-col items-center justify-center overflow-hidden px-6">
        <div className="absolute inset-0 bg-indigo-600/5" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter">Ready to Beep?</h2>
          <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-xl mx-auto">
            Join the most innovative restaurants in Malaysia today. Instant setup, cancel anytime.
          </p>
          <Link href="/login" className="inline-flex items-center gap-3 px-12 py-6 rounded-2xl bg-white text-black font-black text-xl hover:bg-slate-100 transition-all active:scale-95 shadow-2xl shadow-white/10">
            Create Your Station Now
            <ArrowRight size={24} />
          </Link>

          <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          
          <div className="mt-20 flex flex-wrap justify-center gap-8 md:gap-12 opacity-30">
             <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-white">
                <ShieldCheck size={16} /> Safe & Secure
             </div>
             <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-white">
                <Zap size={16} /> Instant Setup
             </div>
             <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-widest text-white">
                <Store size={16} /> Made for F&B
             </div>
          </div>
        </div>

        <footer className="absolute bottom-0 left-0 right-0 py-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
              © 2026 BEEPME.PRO — BUILT FOR THE CRAFT.
            </p>
            <div className="flex gap-6 text-[9px] font-black uppercase tracking-widest text-slate-500">
               <a href="#" className="hover:text-white">Privacy</a>
               <a href="#" className="hover:text-white">Terms</a>
               <a href="#" className="hover:text-white">Support</a>
            </div>
          </div>
        </footer>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, desc, color }: { icon: React.ReactNode, title: string, desc: string, color: string }) {
  const colors: any = {
    rose: 'group-hover:text-rose-400 bg-rose-500/5 border-rose-500/10',
    amber: 'group-hover:text-amber-400 bg-amber-500/5 border-amber-500/10',
    indigo: 'group-hover:text-indigo-400 bg-indigo-500/5 border-indigo-500/10',
  }

  return (
    <div className={`p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group text-left`}>
      <div className={`p-4 rounded-2xl border mb-6 group-hover:scale-110 transition-transform duration-500 inline-block ${colors[color]}`}>
        {icon}
      </div>
      <h4 className="text-xl font-bold text-white mb-4 tracking-tight">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function StepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6 text-left">
      <div className="text-2xl font-black text-indigo-500/30 font-mono leading-none">{num}</div>
      <div>
        <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function PricingCard({ name, price, period, features, recommended, isPro }: { name: string, price: string, period: string, features: string[], recommended?: boolean, isPro?: boolean }) {
  return (
    <div className={`p-8 rounded-[40px] border flex flex-col text-left transition-all ${recommended ? 'border-indigo-500/50 bg-indigo-500/5 scale-105 z-10 shadow-2xl shadow-indigo-500/10' : 'border-white/5 bg-white/[0.02] opacity-80 hover:opacity-100'}`}>
      {recommended && (
        <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Recommended</div>
      )}
      <p className={`font-bold text-[10px] uppercase tracking-widest mb-2 ${recommended ? 'text-indigo-400' : 'text-slate-500'}`}>{name}</p>
      <h4 className="text-3xl font-black text-white mb-6">
        {price} <span className="text-sm font-medium text-slate-600">{period}</span>
      </h4>
      <ul className="space-y-4 mb-10 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-3 text-[11px]">
            {f.includes('Unlimited') ? <InfinityIcon size={14} className="text-indigo-400" /> : <CheckCircle size={14} className={recommended ? 'text-indigo-400' : 'text-slate-700'} />}
            <span className={recommended ? 'text-white' : 'text-slate-400'}>{f}</span>
          </li>
        ))}
      </ul>
      <Link href="/login" className={`w-full py-4 rounded-2xl font-black text-center transition-all active:scale-95 ${recommended ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/30' : 'bg-white/5 text-white hover:bg-white/10'}`}>
        {isPro ? 'Go Unlimited' : 'Get Started'}
      </Link>
    </div>
  )
}
