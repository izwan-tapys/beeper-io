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
  gmb_url: string | null
  plan_type: 'free' | 'pro'
  subscription_status: 'active' | 'expired' | 'trial'
  expiry_date: string | null
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
  const [settingsGmbUrl, setSettingsGmbUrl] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [baseUrl, setBaseUrl] = useState('')
  const [now, setNow] = useState(Date.now())
  const [latestReceipts, setLatestReceipts] = useState<any[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncCooldown, setSyncCooldown] = useState(0)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const qrSessionRef = useRef<Session | null>(null)

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section)
  }

  // Reset settings state when modal opens
  useEffect(() => {
    if (isSettingsOpen && merchant) {
      setSettingsName(merchant.name || '')
      setSettingsLogo(merchant.logo_url || '')
      setSettingsLoyverseToken(merchant.loyverse_token || '')
      setSettingsGmbUrl(merchant.gmb_url || '')
      setOpenSection(null) // Also reset accordion state
    }
  }, [isSettingsOpen, merchant])

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setBaseUrl(window.location.origin)
  }, [])

  // Sync Cooldown Timer
  useEffect(() => {
    if (syncCooldown > 0) {
      const timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [syncCooldown])

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
    
    if (m) {
      setMerchant(m)
      setSettingsName(m.name || '')
      setSettingsLogo(m.logo_url || '')
      setSettingsLoyverseToken(m.loyverse_token || '')
      setSettingsGmbUrl(m.gmb_url || '')
    }
  }, [router])

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

  const syncLoyverse = async () => {
    if (!merchant) return
    setIsSyncing(true)
    try {
      const res = await fetch(`/api/loyverse/receipts?merchant_id=${merchant.id}`)
      const data = await res.json()
      if (data.receipts) {
        setLatestReceipts(data.receipts)
        setSyncCooldown(2) // 2 saat cooldown (Loyverse limit: 1 req/sec)
      } else if (data.error) {
        alert('Sync Error: ' + data.error)
      }
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setIsSyncing(false)
    }
  }

  const createSession = async (rNum?: string) => {
    const finalReceiptNumber = rNum || receiptInput.trim()
    if (!merchant || !finalReceiptNumber) return
    setCreating(true)
    
    const { data, error } = await supabase
      .from('sessions')
      .insert({ 
        merchant_id: merchant.id, 
        receipt_number: finalReceiptNumber, 
        status: 'waiting' 
      })
      .select()
      .single()

    if (error) {
      console.error('Create session error:', error)
      alert('Gagal buat pager: ' + error.message)
    } else if (data) {
      setReceiptInput('')
      setQrSession(data)
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

  const hasSettingsChanged = () => {
    if (!merchant) return false
    return (
      settingsName !== (merchant.name || '') ||
      settingsLogo !== (merchant.logo_url || '') ||
      settingsLoyverseToken !== (merchant.loyverse_token || '') ||
      settingsGmbUrl !== (merchant.gmb_url || '')
    )
  }

  const closeSettings = () => {
    if (hasSettingsChanged()) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return
      }
    }
    setIsSettingsOpen(false)
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
        loyverse_token: settingsLoyverseToken.trim() || null,
        gmb_url: settingsGmbUrl.trim() || null 
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
        loyverse_token: settingsLoyverseToken.trim() || null,
        gmb_url: settingsGmbUrl.trim() || null 
      })
      setIsSettingsOpen(false)
      fetchMerchant()
    }
    setSavingSettings(false)
  }

  const handleUpgrade = async () => {
    try {
      setSavingSettings(true)
      const response = await fetch('/api/payment/toyyibpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 50.00, // Example price RM50
          planName: 'Pro Monthly'
        })
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Failed to initiate payment: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Upgrade error:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setSavingSettings(false)
    }
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
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-white/10 shrink-0" style={{ background: 'var(--card)', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
              <img src="/icon.png" alt="Beeper" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">Beeper</span>
              {merchant && (
                <span className="text-sm sm:text-base font-bold text-white truncate max-w-[140px] sm:max-w-none leading-none">
                  {merchant.name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="store-toggle-btn"
              onClick={toggleStore}
              disabled={togglingStore}
              className="p-2.5 rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center"
              style={{
                background: merchant?.is_open ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
                color: merchant?.is_open ? '#4ade80' : '#818cf8',
                border: `1px solid ${merchant?.is_open ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
              }}
              title={merchant?.is_open ? 'Close Store' : 'Open Store'}
            >
              {togglingStore ? <Loader2 size={18} className="animate-spin" /> : merchant?.is_open ? <PowerOff size={18} /> : <Power size={18} />}
            </button>
            <button id="settings-btn" onClick={() => setIsSettingsOpen(true)} className="p-2.5 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10" style={{ color: 'var(--muted-foreground)' }} title="Settings">
              <Settings size={20} />
            </button>
            <button id="logout-btn" onClick={handleLogout} className="p-2.5 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10" style={{ color: 'var(--muted-foreground)' }} title="Logout">
              <LogOut size={18} />
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
              <form onSubmit={(e) => { e.preventDefault(); createSession() }} className="flex flex-col sm:flex-row gap-3">
                <input
                  id="receipt-input"
                  type="text"
                  value={receiptInput}
                  onChange={(e) => setReceiptInput(e.target.value)}
                  placeholder="Enter receipt / order number"
                  className="w-full sm:flex-1 px-4 py-3 rounded-xl text-white outline-none"
                  style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                />
                <div className="flex gap-2">
                  <button
                    id="create-session-btn"
                    type="submit"
                    disabled={creating || !receiptInput.trim()}
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', opacity: creating ? 0.7 : 1 }}
                  >
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
                    <span>Issue</span>
                  </button>
                  <button
                    type="button"
                    onClick={syncLoyverse}
                    disabled={isSyncing || syncCooldown > 0 || !merchant?.loyverse_token}
                    className="px-5 py-3 rounded-xl border flex items-center justify-center transition-all min-w-[50px] sm:min-w-0"
                    style={{ 
                      background: 'rgba(234,179,8,0.1)', 
                      borderColor: (merchant?.loyverse_token && syncCooldown === 0) ? 'rgba(234,179,8,0.3)' : 'rgba(255,255,255,0.05)',
                      color: (merchant?.loyverse_token && syncCooldown === 0) ? '#eab308' : '#475569'
                    }}
                    title={syncCooldown > 0 ? `Cooldown: ${syncCooldown}s` : "Sync with Loyverse"}
                  >
                    {isSyncing ? <Loader2 size={18} className="animate-spin" /> : syncCooldown > 0 ? <span className="text-xs font-bold">{syncCooldown}</span> : <Zap size={18} />}
                  </button>
                </div>
              </form>

              {/* Latest Receipts List */}
              {latestReceipts.length > 0 && (
                <div className="mt-4 p-4 rounded-2xl animate-fade-in" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Latest from Loyverse</h4>
                    <button onClick={() => setLatestReceipts([])} className="text-slate-500 hover:text-white"><X size={14}/></button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {latestReceipts.slice(0, 5).map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setReceiptInput(r.receipt_number)
                          createSession(r.receipt_number)
                          setLatestReceipts([])
                        }}
                        className="p-3 rounded-xl bg-black border border-white/5 hover:border-indigo-500/50 transition-all text-center group"
                      >
                        <p className="text-xs text-slate-400 group-hover:text-indigo-400 font-mono">#{r.receipt_number}</p>
                        <p className="text-[10px] font-bold text-white mt-1">RM{r.total}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                    <div key={session.id} className="flex flex-col p-5 hover:bg-white/[0.02] animate-slide-up transition-all border-b border-white/[0.02]" style={{ borderColor: 'var(--card-border)' }}>
                      {/* Top Section: Connection Status, Order Info, and Timer */}
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-2 h-2 rounded-full shrink-0 mt-3 md:mt-3.5" style={{ background: session.status === 'called' ? 'var(--success)' : 'var(--accent)', boxShadow: `0 0 8px ${session.status === 'called' ? 'var(--success)' : 'var(--accent)'}` }} />
                        
                        <div className="flex-1 flex flex-col">
                          {/* Connection Status Badge */}
                          <div className="flex mb-1.5">
                            {!session.is_confirmed ? (
                              <span className="bg-yellow-500/90 text-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-black animate-pulse">
                                WAITING FOR CUSTOMER
                              </span>
                            ) : (
                              <span className="bg-green-500 text-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded font-black">
                                CUSTOMER WAITING
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <p className="font-black text-white text-2xl sm:text-3xl">#{session.receipt_number}</p>
                              <span className="hidden xs:inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400">
                                {session.status === 'called' ? '🔔 Called' : '⏳ Prep'}
                              </span>
                            </div>

                            {/* Timer on the same line as Order Number for Mobile */}
                            {session.status === 'waiting' && (
                              <div className="flex flex-col items-end shrink-0">
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Wait Time</span>
                                <span className="text-xl sm:text-2xl font-mono text-indigo-400 font-bold tabular-nums">
                                  {getWaitTime(session.created_at)}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <p className="text-[10px] font-medium text-slate-600 mt-1 uppercase tracking-tighter">
                            Issued at {new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Section: Action Buttons (Full width on mobile) */}
                      <div className="flex items-center gap-2 md:w-auto md:ml-6">
                        <button
                          id={`qr-btn-${session.id}`}
                          onClick={() => setQrSession(session)}
                          className="p-3 rounded-xl transition-all active:scale-95 shrink-0"
                          style={{ color: 'var(--muted-foreground)', background: '#0a0b0f', border: '1px solid var(--card-border)' }}
                          title="Show QR Code"
                        >
                          <QrCode size={18} />
                        </button>
                        <button
                          onClick={() => callSession(session.id)}
                          disabled={session.status === 'called' || !session.is_confirmed}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-20 disabled:grayscale whitespace-nowrap"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}
                        >
                          <Phone size={16} />
                          {session.status === 'called' ? 'CALLED' : 'CALL'}
                        </button>
                        <button
                          onClick={() => doneSession(session.id)}
                          disabled={!session.is_confirmed}
                          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-20 disabled:grayscale whitespace-nowrap"
                          style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}
                        >
                          <CheckCircle size={16} />
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
          <div className="w-full max-w-sm rounded-3xl p-6 sm:p-8 border text-center animate-bounce-in" style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}>
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
          <div className="w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col rounded-3xl border animate-bounce-in shadow-2xl" style={{ background: '#0f1117', borderColor: 'var(--card-border)' }}>
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <Settings size={20} className="text-indigo-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Settings</h2>
              </div>
              <button 
                type="button"
                onClick={closeSettings} 
                className="text-slate-500 hover:text-white transition-colors p-2 -mr-2"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={saveSettings} className="flex-1 flex flex-col overflow-hidden">
              {/* Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* 1. Store Profile */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('profile')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Store Profile</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'profile' ? 'rotate-90' : ''}`} />
                </button>
                
                {openSection === 'profile' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Store Name</label>
                      <input
                        type="text"
                        value={settingsName}
                        onChange={(e) => setSettingsName(e.target.value)}
                        placeholder="Nama Kedai"
                        className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Logo URL</label>
                      <input
                        type="text"
                        value={settingsLogo}
                        onChange={(e) => setSettingsLogo(e.target.value)}
                        placeholder="https://..."
                        className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                  </div>
                )}
              </section>

              {/* 2. Integrations */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('integrations')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Integrations</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'integrations' ? 'rotate-90' : ''}`} />
                </button>

                {openSection === 'integrations' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Loyverse Access Token</label>
                      <input
                        type="password"
                        value={settingsLoyverseToken}
                        onChange={(e) => setSettingsLoyverseToken(e.target.value)}
                        placeholder="Personal Access Token..."
                        className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">GMB Review URL</label>
                      <input
                        type="text"
                        value={settingsGmbUrl}
                        onChange={(e) => setSettingsGmbUrl(e.target.value)}
                        placeholder="https://g.page/..."
                        className="w-full p-3.5 rounded-xl bg-[#0a0b0f] border border-white/10 text-white outline-none focus:border-indigo-500 transition-all text-sm"
                      />
                    </div>
                    
                    <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                      <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest">Webhook Endpoint</p>
                      <code className="block text-[10px] text-indigo-400/80 break-all p-2 rounded-lg bg-indigo-500/5 border border-indigo-500/10 font-mono">
                        {baseUrl}/api/webhooks/loyverse?merchant_id={merchant?.id}
                      </code>
                    </div>
                  </div>
                )}
              </section>

              {/* 3. Subscription */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('subscription')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Subscription Plan</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'subscription' ? 'rotate-90' : ''}`} />
                </button>

                {openSection === 'subscription' && (
                  <div className="p-4 pt-0 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${merchant?.plan_type === 'pro' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                          <span className="text-white font-bold uppercase text-sm">
                            {merchant?.plan_type === 'pro' ? 'Beeper Pro' : 'Beeper Free'}
                          </span>
                        </div>
                        {merchant?.plan_type === 'pro' && merchant?.expiry_date && (
                          <span className="text-[10px] text-slate-500 mt-1">Expires on {new Date(merchant.expiry_date).toLocaleDateString()}</span>
                        )}
                      </div>
                      
                      {merchant?.plan_type !== 'pro' ? (
                        <button 
                          onClick={handleUpgrade}
                          type="button"
                          disabled={savingSettings}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-2"
                        >
                          {savingSettings ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                          Upgrade
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase">Active</span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-600 italic px-1">*RM1.00 fee applied at ToyyibPay (borne by merchant).</p>
                  </div>
                )}
              </section>

              {/* 4. Account */}
              <section className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                <button 
                  type="button"
                  onClick={() => toggleSection('account')}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Account Control</span>
                  </div>
                  <Settings size={14} className={`text-slate-600 transition-transform duration-300 ${openSection === 'account' ? 'rotate-90' : ''}`} />
                </button>

                {openSection === 'account' && (
                  <div className="p-4 pt-0 animate-fade-in">
                    <button 
                      onClick={handleLogout} 
                      type="button"
                      className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-500 font-bold text-sm hover:bg-rose-500/10 transition-all active:scale-95"
                    >
                      <LogOut size={16} />
                      Sign Out from Beeper
                    </button>
                  </div>
                )}
              </section>
            </div>

              {/* Footer Buttons */}
              <div className="p-6 border-t border-white/5 bg-white/[0.02] flex gap-3">
                <button 
                  onClick={closeSettings} 
                  type="button"
                  className="flex-1 py-3.5 rounded-2xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={savingSettings || !hasSettingsChanged()} 
                  className={`flex-[2] py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${
                    savingSettings || !hasSettingsChanged() 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20'
                  }`}
                >
                  {savingSettings && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
