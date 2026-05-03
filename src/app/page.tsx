'use client'

import Link from 'next/link'
import { 
  Zap, Smartphone, Star, BarChart3, ArrowRight, 
  CheckCircle2, Bell, ShieldCheck, Play
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0b0f] text-white selection:bg-indigo-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0b0f]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
              <img src="/icon.png" alt="Beeper Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Beeper</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-semibold hover:text-indigo-400 transition-colors">Login</Link>
            <Link href="/login" className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-slate-200 transition-all shadow-lg shadow-white/5">
              Join Beta
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full -z-10 animate-pulse" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-xs font-bold mb-8 animate-fade-in">
            <Zap size={14} fill="currentColor" />
            <span>LOIVERSE INTEGRATION NOW LIVE</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] animate-slide-up">
            Your Customer&apos;s Phone <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Is Their Pager.
            </span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 mb-12 leading-relaxed animate-slide-up delay-100">
            Replace expensive hardware pagers with a sleek, web-based notification system. 
            Automate your F&B workflow with Loyverse integration and boost your Google reviews instantly.
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
            <Link href="/login" className="w-full md:w-auto px-8 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 group">
              Start Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="w-full md:w-auto px-8 py-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-lg transition-all flex items-center justify-center gap-3">
              <Play size={18} fill="currentColor" />
              Watch Demo
            </button>
          </div>
          
          {/* Mockup Preview */}
          <div className="mt-24 relative max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm shadow-2xl animate-fade-in delay-300">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-black border border-white/5 relative group">
              <div className="absolute inset-0 bg-gradient-to-t from-indigo-600/20 to-transparent" />
              <img 
                src="https://images.unsplash.com/photo-1556742049-0521fd929845?q=80&w=2070&auto=format&fit=crop" 
                alt="Restaurant Dashboard" 
                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-12 rounded-full bg-indigo-600/80 backdrop-blur-md border border-white/20 text-white shadow-2xl cursor-pointer hover:scale-110 transition-transform">
                  <Play size={32} fill="currentColor" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Built for the modern F&B.</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-lg">
              Everything you need to manage your crowd, from table service to quick-service kiosks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Zap className="text-yellow-400" />}
              title="Loyverse Sync"
              description="Automatically issue pagers from your Loyverse POS. No manual typing required."
            />
            <FeatureCard 
              icon={<Smartphone className="text-indigo-400" />}
              title="No App Needed"
              description="Customers just scan a QR code. No downloads, no signups, just instant alerts."
            />
            <FeatureCard 
              icon={<Star className="text-orange-400" />}
              title="Google Review Booster"
              description="Prompt customers to rate you on Google My Business right after they collect their order."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-40 grayscale">
          <span className="text-2xl font-black italic tracking-widest">LOYVERSE</span>
          <span className="text-2xl font-black italic tracking-widest">STRIPE</span>
          <span className="text-2xl font-black italic tracking-widest">GOOGLE</span>
          <span className="text-2xl font-black italic tracking-widest">SUPABASE</span>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-6">Simple, fair pricing.</h2>
          <p className="text-slate-400 mb-16">Free during beta. No credit card required.</p>

          <div className="max-w-md mx-auto p-8 md:p-12 rounded-[40px] bg-gradient-to-b from-indigo-600 to-indigo-800 border border-white/20 shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Zap size={120} />
            </div>
            <div className="relative">
              <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black uppercase tracking-widest mb-6 inline-block">Beta Special</span>
              <h3 className="text-4xl font-black mb-2">FREE</h3>
              <p className="text-indigo-200 mb-8 font-medium">Limited time only. Full features.</p>
              
              <ul className="space-y-4 mb-10">
                <PricingItem text="Unlimited Pager Sessions" />
                <PricingItem text="Loyverse POS Integration" />
                <PricingItem text="Google Review Booster" />
                <PricingItem text="Custom Branding & Logo" />
                <PricingItem text="Real-time Dashboard" />
              </ul>
              
              <Link href="/login" className="block w-full py-5 rounded-2xl bg-white text-indigo-600 font-black text-center text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                Get Started Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
          <div>
            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shadow-lg shadow-indigo-600/20">
                <img src="/icon.png" alt="Beeper Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-black uppercase tracking-tighter">Beeper</span>
            </div>
            <p className="text-slate-500 text-sm max-w-xs">
              The modern customer notification system for progressive F&B brands.
            </p>
          </div>
          <div className="flex gap-12 text-sm font-medium text-slate-500">
            <div className="flex flex-col gap-3">
              <span className="text-white font-bold">Product</span>
              <a href="#" className="hover:text-white transition-colors">Features</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
              <a href="#" className="hover:text-white transition-colors">Updates</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-white font-bold">Company</span>
              <a href="#" className="hover:text-white transition-colors">About</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-slate-600 font-mono">© 2026 BEEPER.IO - BUILT FOR THE CRAFT.</p>
        </div>
      </footer>

      {/* Global CSS for Animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-bounce-in { animation: bounceIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
      `}</style>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-[32px] bg-white/5 border border-white/5 hover:border-indigo-500/20 hover:bg-white/[0.07] transition-all group">
      <div className="w-14 h-14 rounded-2xl bg-[#0a0b0f] border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function PricingItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-indigo-100">
      <CheckCircle2 size={18} className="text-indigo-300" />
      <span className="font-medium">{text}</span>
    </li>
  )
}
