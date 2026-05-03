'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import {
  Zap, Plus, Search, Phone, CheckCircle, QrCode,
  LogOut, Power, PowerOff, X, Clock, Loader2, Settings
} from 'lucide-react'

type Session = {
  id: string
  receipt_number: string
  status: 'waiting' | 'called' | 'completed' | 'archived'
  is_confirmed: boolean
  created_at: string
}

type Merchant = {
  id: string
  name: string
  is_open: boolean
  logo_url: string | null
  loyverse_token: string | null
}

const supabase = createClient()

export default function DashboardPage() {
  const router = useRouter()

  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [receiptInput, setReceiptInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [qrSession, setQrSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [togglingStore, setTogglingStore] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [settingsName, setSettingsName] = useState('')
  const [settingsLogo, setSettingsLogo] = useState('')
  const [settingsLoyverseToken, setSettingsLoyverseToken] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [now, setNow] = useState(Date.now())
  const qrSessionRef = useRef<Session | null>(null)

  useEffect(() => {
    qrSessionRef.current = qrSession
  }, [qrSession])

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  const fetchMerchant = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    let { data: m, error: fetchError } = await supabase.from('merchants').select('*').eq('user_id', user.id).single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching merchant:', fetchError)
    }

    if (!m) {
      const storeName = user.email?.split('@')[0] || 'My Store'
      const { data: newMerchant, error: insertError } = await supabase.from('merchants').insert({ user_id: user.id, name: storeName }).select().single()
      if (insertError) {
        console.error('Error creating merchant:', insertError)
        return
      }
      m = newMerchant
    }
    
    setMerchant(m)
    setSettingsName(m.name)
    setSettingsLogo(m.logo_url || '')
    setSettingsLoyverseToken(m.loyverse_token || '')
  }, [router])

  const fetchSessions = useCallback(async () => {
    if (!merchant) return
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('merchant_id', merchant.id)
      .in('status', ['waiting', 'called'])
      .order('created_at', { ascending: true })
    setSessions(data || [])
    setLoading(false)
  }, [merchant])

  useEffect(() => { fetchMerchant() }, [fetchMerchant])
  useEffect(() => { if (merchant) fetchSessions() }, [merchant, fetchSessions])

  // Realtime subscription for dashboard
  useEffect(() => {
    if (!merchant) return
    const channel = supabase
      .channel('dashboard-sessions')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `merchant_id=eq.${merchant.id}` }, 
        (payload: any) => {
          fetchSessions()
          // AUTO-CLOSE QR MODAL IF CONFIRMED
          if (qrSessionRef.current?.id === payload.new.id && payload.new.is_confirmed) {
            setQrSession(null)
          }
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'sessions', filter: `merchant_id=eq.${merchant.id}` }, 
        () => fetchSessions()
      )
      .on('postgres_changes', 
        { event: 'DELETE', schema: 'public', table: 'sessions', filter: `merchant_id=eq.${merchant.id}` }, 
        () => fetchSessions()
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [merchant, fetchSessions])

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiptInput.trim() || !merchant) return
    setCreating(true)
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({ 
        merchant_id: merchant.id, 
        receipt_number: receiptInput.trim(), 
        status: 'waiting' 
      })
      .select()
      .single()

    if (error) {
      console.error('Create session error:', error)
      alert('Gagal buat pager: ' + error.message)
    } else if (data) {
      setReceiptInput('')
      setQrSession(data) // TERUS BUKA QR MODAL!
    }
    setCreating(false)
  }

  const callSession = async (id: string) => {
    const { error } = await supabase.from('sessions').update({ status: 'called', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      console.error('Call session error:', error)
      alert('Gagal panggil: ' + error.message)
    }
  }

  const getWaitTime = (createdAt: string) => {
    const start = new Date(createdAt).getTime()
    const seconds = Math.floor((now - start) / 1000)
    if (seconds < 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const doneSession = async (id: string) => {
    const { error } = await supabase.from('sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) {
      console.error('Done session error:', error)
      alert('Gagal set selesai: ' + error.message)
    }
  }

  const toggleStore = async () => {
    if (!merchant) return
    setTogglingStore(true)
    if (merchant.is_open) {
      // Close: archive all active sessions
      await supabase.from('sessions').update({ status: 'archived' }).eq('merchant_id', merchant.id).in('status', ['waiting', 'called', 'completed'])
    }
    const newState = !merchant.is_open
    const { error: updateError } = await supabase.from('merchants').update({ is_open: newState }).eq('id', merchant.id)
    
    if (updateError) {
      console.error('Error toggling store:', updateError)
      alert('Failed to update store status. Please try again.')
    } else {
      setMerchant({ ...merchant, is_open: newState })
      if (newState) fetchSessions()
      else setSessions([])
    }
    setTogglingStore(false)
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchant || !settingsName.trim()) return
    setSavingSettings(true)
    const { error } = await supabase
      .from('merchants')
      .update({ 
        name: settingsName.trim(), 
        logo_url: settingsLogo.trim() || null,
        loyverse_token: settingsLoyverseToken.trim() || null 
      })
      .eq('id', merchant.id)
    
    if (error) {
      console.error('Error saving settings:', error)
      alert('Gagal simpan: ' + error.message)
    } else {
      setMerchant({ 
        ...merchant, 
        name: settingsName.trim(), 
        logo_url: settingsLogo.trim() || null,
        loyverse_token: settingsLoyverseToken.trim() || null 
      })
      setIsSettingsOpen(false)
      fetchMerchant()
    }
    setSavingSettings(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredSessions = sessions.filter(s =>
    s.receipt_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const pagerUrl = (sessionId: string) => `${baseUrl}/pager/${sessionId}`

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--card-border)' }}>
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10" style={{ background: 'var(--card)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
              <img src="/icon.png" alt="Beeper" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-white text-lg">Beeper</span>
            {merchant && (
              <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--card-border)' }}>
                {merchant.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              id="store-toggle-btn"
              onClick={toggleStore}
              disabled={togglingStore}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-300"
              style={{
                background: merchant?.is_open ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                color: merchant?.is_open ? '#4ade80' : '#818cf8',
                border: `1px solid ${merchant?.is_open ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
              }}
            >
              {togglingStore ? <Loader2 size={14} className="animate-spin" /> : merchant?.is_open ? <PowerOff size={14} /> : <Power size={14} />}
              {merchant?.is_open ? 'Close Store' : 'Open Store'}
            </button>
            <button id="settings-btn" onClick={() => setIsSettingsOpen(true)} className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'var(--muted-foreground)' }} title="Settings">
              <Settings size={18} />
            </button>
            <button id="logout-btn" onClick={handleLogout} className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'var(--muted-foreground)' }} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Only show content if merchant data is loaded */}
        {!merchant ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 size={32} className="animate-spin text-indigo-500 mb-4" />
            <p className="text-slate-500 animate-pulse text-sm">Synchronizing dashboard...</p>
          </div>
        ) : !merchant.is_open ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Power size={32} style={{ color: 'var(--muted)' }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Store is Closed</h2>
            <p style={{ color: 'var(--muted-foreground)' }}>Click "Open Store" to start accepting orders.</p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <h2 className="text-lg font-semibold text-white mb-4">Issue New Pager</h2>
              <form onSubmit={createSession} className="flex gap-3">
                <input
                  id="receipt-input"
                  type="text"
                  value={receiptInput}
                  onChange={(e) => setReceiptInput(e.target.value)}
                  placeholder="Enter receipt / order number"
                  className="flex-1 px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                />
                <button
                  id="create-session-btn"
                  type="submit"
                  disabled={creating || !receiptInput.trim()}
                  className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: creating ? 0.7 : 1 }}
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Issue
                </button>
              </form>
            </div>

            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--card-border)' }}>
                <Search size={16} style={{ color: 'var(--muted)' }} />
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order number..."
                  className="flex-1 bg-transparent text-white outline-none text-sm"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin" />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>No active pagers.</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                  {filteredSessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-4 p-4 hover:bg-white/[0.02] animate-slide-up">
                      <div className="w-2 h-2 rounded-full" style={{ background: session.status === 'called' ? 'var(--success)' : 'var(--accent)', boxShadow: `0 0 8px ${session.status === 'called' ? 'var(--success)' : 'var(--accent)'}` }} />
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <p className="font-black text-white text-xl">Order #{session.receipt_number}</p>
                          {session.status === 'waiting' && (
                            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-400/20 animate-pulse">
                              {getWaitTime(session.created_at)}
                            </span>
                          )}
                          <div className="flex shrink-0">
                            {!session.is_confirmed ? (
                              <span className="bg-yellow-500 text-black text-[10px] px-2 py-1 rounded font-black animate-pulse shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                                WAITING FOR CUSTOMER
                              </span>
                            ) : (
                              <span className="bg-green-500 text-black text-[10px] px-2 py-1 rounded font-black shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                                CUSTOMER WAITING
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                          {session.status === 'called' ? '🔔 CALLED' : '⏳ PREPARING'} · {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          id={`qr-btn-${session.id}`}
                          onClick={() => setQrSession(session)}
                          className="p-2 rounded-lg"
                          style={{ color: 'var(--muted-foreground)', background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                        >
                          <QrCode size={14} />
                        </button>
                        <button
                          onClick={() => callSession(session.id)}
                          disabled={session.status === 'called' || !session.is_confirmed}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-20 disabled:grayscale"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                        >
                          <Phone size={14} />
                          {session.status === 'called' ? 'CALLED' : 'CALL'}
                        </button>
                        <button
                          onClick={() => doneSession(session.id)}
                          disabled={!session.is_confirmed}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all disabled:opacity-20 disabled:grayscale"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                        >
                          <CheckCircle size={14} />
                          DONE
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* QR Modal */}
      {qrSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-8 border text-center animate-bounce-in" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-lg">Order #{qrSession.receipt_number}</h3>
              <button onClick={() => setQrSession(null)} className="p-1 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCodeSVG value={pagerUrl(qrSession.id)} size={200} level="H" />
            </div>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Ask customer to scan QR</p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-8 border animate-bounce-in" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-lg">Store Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={saveSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Store Name</label>
                <input
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                />
              </div>
              <div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-400">Logo URL</label>
                  <input
                    type="text"
                    value={settingsLogo}
                    onChange={(e) => setSettingsLogo(e.target.value)}
                    placeholder="https://..."
                    className="p-3 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-400">Loyverse Access Token</label>
                  <input
                    type="password"
                    value={settingsLoyverseToken}
                    onChange={(e) => setSettingsLoyverseToken(e.target.value)}
                    placeholder="Masukkan Personal Access Token..."
                    className="p-3 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                  />
                  <p className="text-[10px] text-slate-600">
                    Get this from Loyverse > Settings > Access Tokens.
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loyverse Integration</h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-black border border-white/5 space-y-2">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Webhook URL (Receipt Created)</p>
                    <div className="group relative">
                      <code className="block text-[11px] text-indigo-400 break-all p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 select-all cursor-pointer font-mono">
                        {baseUrl}/api/webhooks/loyverse?merchant_id={merchant?.id}
                      </code>
                    </div>
                    <p className="text-[9px] text-slate-600 italic leading-relaxed">
                      Copy this URL to your Loyverse Back Office &gt; Settings &gt; Webhooks.
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3 rounded-xl font-semibold text-white mt-4"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                {savingSettings ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
