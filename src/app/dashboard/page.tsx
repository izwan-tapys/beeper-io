'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback } from 'react'
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
  created_at: string
}

type Merchant = {
  id: string
  name: string
  is_open: boolean
  logo_url: string | null
}

export default function DashboardPage() {
  const supabase = createClient()
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
  const [savingSettings, setSavingSettings] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')

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
      console.log('Merchant not found, creating new one...')
      const storeName = user.email?.split('@')[0] || 'My Store'
      const { data: newMerchant, error: insertError } = await supabase.from('merchants').insert({ user_id: user.id, name: storeName }).select().single()
      if (insertError) {
        console.error('Error creating merchant:', insertError)
        return
      }
      m = newMerchant
    }
    
    console.log('Merchant loaded:', m)
    setMerchant(m)
    setSettingsName(m.name)
    setSettingsLogo(m.logo_url || '')
  }, [supabase, router])

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
  }, [supabase, merchant])

  useEffect(() => { fetchMerchant() }, [fetchMerchant])
  useEffect(() => { if (merchant) fetchSessions() }, [merchant, fetchSessions])

  // Realtime subscription for dashboard
  useEffect(() => {
    if (!merchant) return
    const channel = supabase
      .channel('dashboard-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `merchant_id=eq.${merchant.id}` }, () => {
        fetchSessions()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [merchant, supabase, fetchSessions])

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!receiptInput.trim() || !merchant) return
    setCreating(true)
    await supabase.from('sessions').insert({ merchant_id: merchant.id, receipt_number: receiptInput.trim(), status: 'waiting' })
    setReceiptInput('')
    setCreating(false)
  }

  const callSession = async (id: string) => {
    await supabase.from('sessions').update({ status: 'called', updated_at: new Date().toISOString() }).eq('id', id)
  }

  const doneSession = async (id: string) => {
    await supabase.from('sessions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', id)
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
      .update({ name: settingsName.trim(), logo_url: settingsLogo.trim() || null })
      .eq('id', merchant.id)
    
    if (!error) {
      setMerchant({ ...merchant, name: settingsName.trim(), logo_url: settingsLogo.trim() || null })
      setIsSettingsOpen(false)
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
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span className="font-bold text-white text-lg">Beeper</span>
            {merchant && (
              <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--card)', color: 'var(--muted-foreground)', border: '1px solid var(--card-border)' }}>
                {merchant.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Open/Close Store Toggle */}
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
            <button 
              id="settings-btn" 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl transition-colors hover:bg-white/5" 
              style={{ color: 'var(--muted-foreground)' }} 
              title="Settings"
            >
              <Settings size={18} />
            </button>
            <button id="logout-btn" onClick={handleLogout} className="p-2 rounded-xl transition-colors hover:bg-white/5" style={{ color: 'var(--muted-foreground)' }} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {!merchant?.is_open ? (
          // Store Closed State
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--card)', border: '1px solid var(--card-border)' }}>
              <Power size={32} style={{ color: 'var(--muted)' }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Store is Closed</h2>
            <p style={{ color: 'var(--muted-foreground)' }}>Click "Open Store" to start accepting orders and issuing pagers.</p>
          </div>
        ) : (
          <>
            {/* Create Session Form */}
            <div className="rounded-2xl p-6 border" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              <h2 className="text-lg font-semibold text-white mb-4">Issue New Pager</h2>
              <form onSubmit={createSession} className="flex gap-3">
                <input
                  id="receipt-input"
                  type="text"
                  value={receiptInput}
                  onChange={(e) => setReceiptInput(e.target.value)}
                  placeholder="Enter receipt / order number (e.g. 1024)"
                  className="flex-1 px-4 py-3 rounded-xl text-white placeholder-slate-500 outline-none"
                  style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--card-border)'}
                />
                <button
                  id="create-session-btn"
                  type="submit"
                  disabled={creating || !receiptInput.trim()}
                  className="px-6 py-3 rounded-xl font-semibold text-white flex items-center gap-2 transition-all"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: creating ? 0.7 : 1, boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Issue
                </button>
              </form>
            </div>

            {/* Active Sessions */}
            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
              {/* Search Bar */}
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--card-border)' }}>
                <Search size={16} style={{ color: 'var(--muted)' }} />
                <input
                  id="search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by receipt number..."
                  className="flex-1 bg-transparent text-white placeholder-slate-600 outline-none text-sm"
                />
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#0a0b0f', color: 'var(--muted-foreground)' }}>
                  {filteredSessions.length} active
                </span>
              </div>

              {/* Session List */}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 size={24} className="animate-spin" style={{ color: 'var(--muted)' }} />
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="text-center py-16">
                  <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--muted)' }} />
                  <p style={{ color: 'var(--muted-foreground)' }}>No active pagers. Issue one above!</p>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--card-border)' }}>
                  {filteredSessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-white/[0.02] animate-slide-up">
                      {/* Status indicator */}
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: session.status === 'called' ? 'var(--success)' : 'var(--accent)', boxShadow: session.status === 'called' ? '0 0 8px var(--success)' : '0 0 8px var(--accent)' }} />

                      {/* Receipt info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white">Order #{session.receipt_number}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                          {session.status === 'called' ? '🔔 Called — awaiting pickup' : '⏳ Waiting'}
                          {' · '}
                          {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Show QR */}
                        <button
                          id={`qr-btn-${session.id}`}
                          onClick={() => setQrSession(session)}
                          className="p-2 rounded-lg transition-colors"
                          title="Show QR Code"
                          style={{ color: 'var(--muted-foreground)', background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                        >
                          <QrCode size={14} />
                        </button>

                        {/* Call */}
                        {session.status === 'waiting' && (
                          <button
                            id={`call-btn-${session.id}`}
                            onClick={() => callSession(session.id)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                          >
                            <Phone size={12} />
                            CALL
                          </button>
                        )}

                        {/* Done */}
                        <button
                          id={`done-btn-${session.id}`}
                          onClick={() => doneSession(session.id)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-semibold text-xs transition-all"
                          style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}
                        >
                          <CheckCircle size={12} />
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

      {/* QR Code Modal */}
      {qrSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-8 border text-center animate-bounce-in" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-lg">Order #{qrSession.receipt_number}</h3>
              <button id="close-qr-btn" onClick={() => setQrSession(null)} className="p-1 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="bg-white p-4 rounded-xl inline-block mb-4">
              <QRCodeSVG
                value={pagerUrl(qrSession.id)}
                size={200}
                level="H"
              />
            </div>
            <p className="text-sm mb-1" style={{ color: 'var(--muted-foreground)' }}>Ask customer to scan this QR code</p>
            <p className="text-xs font-mono px-3 py-2 rounded-lg mt-2 break-all" style={{ background: '#0a0b0f', color: 'var(--muted-foreground)', border: '1px solid var(--card-border)' }}>
              {pagerUrl(qrSession.id)}
            </p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-md rounded-2xl p-8 border animate-bounce-in" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white text-lg">Store Settings</h3>
              <button id="close-settings-btn" onClick={() => setIsSettingsOpen(false)} className="p-1 rounded-lg" style={{ color: 'var(--muted-foreground)' }}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={saveSettings} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Store Name</label>
                <input
                  id="settings-name-input"
                  type="text"
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  placeholder="e.g. Nasi Lemak Royale"
                  required
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>Logo URL</label>
                <input
                  id="settings-logo-input"
                  type="text"
                  value={settingsLogo}
                  onChange={(e) => setSettingsLogo(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                />
                <p className="text-[10px] mt-2" style={{ color: 'var(--muted)' }}>Tip: Upload to Imgur or postimages.org and paste the direct link here.</p>
              </div>

              {settingsLogo && (
                <div className="pt-2">
                  <p className="text-xs mb-2" style={{ color: 'var(--muted-foreground)' }}>Preview Logo:</p>
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={settingsLogo} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'} />
                  </div>
                </div>
              )}

              <button
                id="save-settings-btn"
                type="submit"
                disabled={savingSettings || !settingsName.trim()}
                className="w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 mt-4 transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: savingSettings ? 0.7 : 1 }}
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
