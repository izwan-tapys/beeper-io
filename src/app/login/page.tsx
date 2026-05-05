'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Zap } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
      } else {
        // Small delay to ensure cookies are saved
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 500)
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setMessage('Account created! Please check your email to verify, then log in.')
        setIsLogin(true)
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(ellipse at top, #1a1b2e 0%, #0a0b0f 60%)' }}>
      <div className="w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 overflow-hidden border border-white/10"
            style={{ background: '#0f1117', boxShadow: '0 0 30px rgba(99,102,241,0.3)' }}>
            <img src="/icon.png" alt="Beepme Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight uppercase">Beepme<span className="text-indigo-500">.pro</span></h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>Virtual Pager for F&B Businesses</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <h2 className="text-xl font-semibold text-white mb-6">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Email Address</label>
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@restaurant.com"
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all focus:ring-2"
                style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Password</label>
              <input
                id="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none transition-all"
                style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </div>
            )}
            {message && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}>
                {message}
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 mt-2"
              style={{ background: loading ? '#4f46e5' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : null}
              {isLogin ? 'Sign In to Dashboard' : 'Create Account'}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'var(--card-border)' }}></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-4 text-slate-500" style={{ background: 'var(--card)' }}>Or continue with</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            onClick={async () => {
              const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback`,
                },
              })
              if (error) setError(error.message)
            }}
            className="w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-3 border border-white/10 hover:bg-white/5 active:scale-95"
            style={{ background: '#0a0b0f' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.8c2.3-2.1 3.6-5.1 3.6-8.6z" fill="#4285F4"/>
              <path d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-3c-1.1.7-2.5 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5H1.3v3.1C3.3 21.4 7.4 24 12 24z" fill="#34A853"/>
              <path d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3V6.6H1.3c-.8 1.6-1.3 3.4-1.3 5.4s.5 3.8 1.3 5.4l3.9-3.1z" fill="#FBBC05"/>
              <path d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.3 2.6 1.3 6.6l3.9 3.1c.9-2.9 3.6-5 6.8-5z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--muted-foreground)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              id="auth-toggle-btn"
              onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null) }}
              className="font-medium transition-colors"
              style={{ color: 'var(--accent)' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.color = 'var(--accent-hover)'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.color = 'var(--accent)'}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--muted)' }}>
          © 2026 Beepme.pro — Replace hardware. Go digital.
        </p>
      </div>
    </div>
  )
}
