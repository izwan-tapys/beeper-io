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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse-ring"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>
            <Zap size={28} className="text-white" fill="white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Beeper</h1>
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
          © 2025 Beeper.io — Replace hardware. Go digital.
        </p>
      </div>
    </div>
  )
}
