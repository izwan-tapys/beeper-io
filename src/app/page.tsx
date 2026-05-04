'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Zap, CheckCircle, Smartphone, Store, 
  ArrowRight, ShieldCheck, BarChart3, 
  Clock, Heart, Play, Star, ChevronDown,
  X, Menu, DollarSign, Battery
} from 'lucide-react'

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 selection:bg-indigo-500/30 selection:text-white font-sans">
      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.3)] bg-[#0f1117] flex items-center justify-center">
              <img src="/icon.png" alt="Beepme Logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase text-white">Beepme<span className="text-indigo-500">.pro</span></span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Process</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
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
        <div className="fixed inset-0 z-40 bg-black flex flex-col items-center justify-center gap-8 text-2xl font-black uppercase tracking-widest animate-fade-in">
          <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
          <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
          <Link href="/login" onClick={() => setIsMenuOpen(false)}>Login</Link>
          <button onClick={() => setIsMenuOpen(false)} className="absolute top-8 right-8"><X size={32} /></button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 animate-bounce-in">
            <Zap size={14} className="fill-indigo-400" />
            The Future of F&B Guest Paging
          </div>

          <h1 className="text-5xl md:text-8xl font-black text-white leading-[1] tracking-tighter mb-8 max-w-5xl mx-auto">
            Stop Buying <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">Hardware Pagers.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Your customers already have the world&apos;s best screen in their pockets. <span className="text-white font-bold">Use it.</span> Replace expensive hardware with Beepme.pro.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <Link href="/login" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-indigo-600 text-white font-black text-lg hover:bg-indigo-500 shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 group active:scale-95">
              Start Your Free Station
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              <Play size={20} className="fill-white" />
              See How It Works
            </a>
          </div>

          {/* Product Mockup Container */}
          <div className="relative max-w-5xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-[40px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative rounded-[40px] border border-white/10 overflow-hidden shadow-2xl bg-[#0f1117]">
              <img 
                src="/mockup.png" 
                alt="Beepme App Interface" 
                className="w-full h-auto hover:scale-[1.01] transition-transform duration-1000"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Grid */}
      <section id="features" className="py-32 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">Old Way vs New Way</h2>
            <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight">Hardware is Dying. <br className="hidden md:block"/> Beepme is the Cure.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<DollarSign size={28} className="text-rose-500" />}
              title="RM0 Setup Cost"
              desc="Forget spending RM3,000+ on hardware sets. Start Beepme for free on any device you already own."
            />
            <FeatureCard 
              icon={<Battery size={28} className="text-amber-500" />}
              title="No Charging Required"
              desc="Hardware pagers die in the middle of a rush. Your customers phones are always ready for a beep."
            />
            <FeatureCard 
              icon={<Star size={28} className="text-indigo-500" />}
              title="Kumpul GMB Review"
              desc="Turn every 'Order Ready' notification into a 5-star Google Review automatically."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 text-left">
              <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">Simple as 1-2-3</h2>
              <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8">Ready in 30 Seconds.</h3>
              
              <div className="space-y-12">
                <StepItem 
                  num="01" 
                  title="Issue a Pager" 
                  desc="Enter the receipt number on your dashboard. No physical pager needed."
                />
                <StepItem 
                  num="02" 
                  title="Customer Scans" 
                  desc="Customer scans the QR code at your counter. Their phone is now their pager."
                />
                <StepItem 
                  num="03" 
                  title="Beep Them!" 
                  desc="Click 'Call' and their phone vibrates, sounds, and shows your logo."
                />
              </div>
            </div>
            
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-indigo-600/20 blur-[80px] rounded-full" />
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
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="h-10 rounded-xl bg-white/5 border border-white/5" />
                    <div className="h-10 rounded-xl bg-white/5 border border-white/5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">Pricing Plans</h2>
          <h3 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-16">Invest RM1, Save RM100.</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="p-10 rounded-[40px] border border-white/5 bg-white/[0.02] flex flex-col text-left group hover:border-white/20 transition-all">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Free Station</p>
              <h4 className="text-3xl font-black text-white mb-6">RM0 <span className="text-sm font-medium text-slate-600">/ forever</span></h4>
              <ul className="space-y-4 mb-10 flex-1">
                <PricingFeature text="20 Monthly Orders" />
                <PricingFeature text="Full Digital Pager UI" />
                <PricingFeature text="Loyverse Integration" />
                <PricingFeature text="iOS & Android Ready" />
              </ul>
              <Link href="/login" className="w-full py-4 rounded-2xl bg-white/5 text-white font-black text-center hover:bg-white/10 transition-all">
                Get Started
              </Link>
            </div>

            {/* Basic - Recommended */}
            <div className="p-10 rounded-[40px] border border-indigo-500/50 bg-indigo-500/5 flex flex-col text-left relative shadow-2xl shadow-indigo-500/10 scale-105 z-10">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Recommended</div>
              <p className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-2">Basic Cafe</p>
              <h4 className="text-3xl font-black text-white mb-6">RM30 <span className="text-sm font-medium text-slate-500">/ month</span></h4>
              <ul className="space-y-4 mb-10 flex-1">
                <PricingFeature text="500 Monthly Orders" active />
                <PricingFeature text="Priority Webhook Processing" active />
                <PricingFeature text="Loyverse Pro Integration" active />
                <PricingFeature text="GMB Review Collection" active />
              </ul>
              <Link href="/login" className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black text-center hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30">
                Choose Basic
              </Link>
            </div>

            {/* Pro */}
            <div className="p-10 rounded-[40px] border border-white/5 bg-white/[0.02] flex flex-col text-left group hover:border-white/20 transition-all">
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">Unlimited Store</p>
              <h4 className="text-3xl font-black text-white mb-6">RM49 <span className="text-sm font-medium text-slate-600">/ month</span></h4>
              <ul className="space-y-4 mb-10 flex-1">
                <PricingFeature text="Unlimited Monthly Orders" />
                <PricingFeature text="Custom Branding (Soon)" />
                <PricingFeature text="Priority 24/7 Support" />
                <PricingFeature text="Advanced Analytics" />
              </ul>
              <Link href="/login" className="w-full py-4 rounded-2xl bg-white/5 text-white font-black text-center hover:bg-white/10 transition-all">
                Go Unlimited
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-600/5" />
        <div className="max-w-5xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tighter">Ready to Beep?</h2>
          <p className="text-slate-400 text-lg mb-12 max-w-xl mx-auto">
            Join the most innovative restaurants in Malaysia today. No contract, no setup fee, cancel anytime.
          </p>
          <Link href="/login" className="inline-flex items-center gap-3 px-12 py-6 rounded-2xl bg-white text-black font-black text-xl hover:bg-slate-100 transition-all active:scale-95">
            Create Your Station Now
            <ArrowRight size={24} />
          </Link>
          
          <div className="mt-20 flex flex-wrap justify-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all">
             <div className="flex items-center gap-2 font-black uppercase text-sm tracking-widest text-white">
                <ShieldCheck /> Safe & Secure
             </div>
             <div className="flex items-center gap-2 font-black uppercase text-sm tracking-widest text-white">
                <Zap /> Instant Setup
             </div>
             <div className="flex items-center gap-2 font-black uppercase text-sm tracking-widest text-white">
                <Store /> Made for F&B
             </div>
          </div>
        </div>
      </section>

      {/* Final Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 bg-[#0f1117] flex items-center justify-center">
              <img src="/icon.png" alt="Beepme Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-black uppercase tracking-tighter text-white">Beepme<span className="text-indigo-500">.pro</span></span>
          </div>
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">
            © 2026 BEEPME.PRO — BUILT FOR THE CRAFT.
          </p>
          <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
             <a href="#" className="hover:text-white">Privacy</a>
             <a href="#" className="hover:text-white">Terms</a>
             <a href="#" className="hover:text-white">Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-[32px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 inline-block mb-6 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <h4 className="text-xl font-bold text-white mb-4 tracking-tight">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function StepItem({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="text-2xl font-black text-indigo-500/30 font-mono leading-none">{num}</div>
      <div>
        <h4 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{title}</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function PricingFeature({ text, active }: { text: string, active?: boolean }) {
  return (
    <li className="flex items-center gap-3 text-xs">
      <CheckCircle size={14} className={active ? 'text-indigo-400' : 'text-slate-700'} />
      <span className={active ? 'text-white' : 'text-slate-500'}>{text}</span>
    </li>
  )
}
