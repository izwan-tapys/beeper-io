'use client'
/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */

export const dynamic = 'force-dynamic'

import { use, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertTriangle, Volume2, Smartphone } from 'lucide-react'

// ─── Hooks ────────────────────────────────────────────────────────────────────
import { usePagerSession } from '@/hooks/usePagerSession'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

// ─── Contexts ─────────────────────────────────────────────────────────────────
import { useLanguage } from '@/contexts/LanguageContext'

// ─── Components ───────────────────────────────────────────────────────────────
import { Logo } from '@/components/Logo'
import { PremiumPagerZone, type ActiveSession } from '@/components/pager/PremiumPagerZone'
import { QrScannerModal } from '@/components/pager/QrScannerModal'
import { AdBanner } from '@/components/pager/AdBanner'
import { CalledScreen } from '@/components/pager/CalledScreen'
import { CompletedScreen } from '@/components/pager/CompletedScreen'

// ─── Analytics ────────────────────────────────────────────────────────────────
import { trackPagerEvent } from '@/lib/pager-analytics'

export default function PagerPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params)
  const { lang, setLang } = useLanguage()

  // ── Pager logic hook ────────────────────────────────────────────────────────
  const {
    supabase,
    status,
    setStatus,
    primaryStatus,
    isConfirmed,
    receiptNumber,
    createdAt,
    merchantId,
    merchantName,
    merchantLogo,
    gmbUrl,
    themeColor,
    clientUuid,
    isIos,
    now,
    allSessions,
    setAllSessions,
    dismissedSessions,
    setDismissedSessions,
    calledSessionId,
    isGmbQuotaExceeded,
    setIsGmbQuotaExceeded,
    adsList,
    currentAdIndex,
    setCurrentAdIndex,
    isFlashing,
    initAudio,
    playChime,
    triggerAlert,
    stopAlert,
    fetchAllDeviceSessions,
    fetchSession,
    getSessionsList,
  } = usePagerSession(sessionId)

  const { isOnline } = useOnlineStatus()

  // ── Local UI State ─────────────────────────────────────────────────────────
  const [showInstructions, setShowInstructions] = useState(true)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [isDescExpanded, setIsDescExpanded] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [touchStartY, setTouchStartY] = useState<number | null>(null)
  const [toastTimer, setToastTimer] = useState<NodeJS.Timeout | null>(null)

  // Clear toast timer on unmount
  useEffect(() => {
    return () => { if (toastTimer) clearTimeout(toastTimer) }
  }, [toastTimer])

  // ── Actions & Helpers ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    await initAudio()

    const { error } = await supabase
      .from('sessions')
      .update({ is_confirmed: true, client_uuid: clientUuid })
      .eq('id', sessionId)

    if (error) {
      alert('Gagal sambung: ' + error.message)
    } else {
      trackPagerEvent({ supabase, eventType: 'pager_activated', sessionId, merchantId, clientUuid })
      setStatus('waiting')
      fetchSession()
    }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer) clearTimeout(toastTimer)
    const t = setTimeout(() => setToast(null), 3000)
    setToastTimer(t)
  }

  const handleQrScan = async (newSessionId: string) => {
    setShowQrScanner(false)
    if (!clientUuid) return

    if (allSessions.has(newSessionId)) {
      showToast('⚠️ Gerai ni dah ada dalam senarai')
      return
    }

    const { error: updateError } = await supabase
      .from('sessions')
      .update({ client_uuid: clientUuid, is_confirmed: true })
      .eq('id', newSessionId)
      .in('status', ['waiting', 'confirm'])

    if (updateError) {
      showToast('❌ QR tidak sah atau pesanan tamat')
      return
    }

    const { data, error: fetchError } = await supabase
      .from('sessions')
      .select('*, merchants(name, logo_url, gmb_url, theme_color, plan_type, subscription_status, expiry_date, upsell_title, upsell_description, upsell_link_url, upsell_video_url, upsell_image_url, upsell_cta_text, latitude, longitude, category, state)')
      .eq('id', newSessionId)
      .single()

    if (fetchError || !data) {
      showToast('❌ QR tidak sah atau pesanan tamat')
      return
    }

    setAllSessions((prev) => {
      const next = new Map(prev)
      next.set(newSessionId, data)
      return next
    })

    const m = Array.isArray(data.merchants) ? data.merchants[0] : data.merchants
    const vendorName = m?.name || 'Gerai'
    showToast(`✅ ${vendorName} ditambah!`)
    trackPagerEvent({ supabase, eventType: 'qr_code_scanned', sessionId, merchantId, clientUuid })

    await fetchAllDeviceSessions(clientUuid)
  }

  const handleAdClick = async () => {
    const ad = adsList[currentAdIndex]
    if (!ad) return
    if (ad.id !== 'default-beepme' && !ad.id.startsWith('merchant-upsell')) {
      fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: ad.id, session_id: sessionId, event_type: 'click' }),
      }).catch(console.error)
    } else {
      await supabase.from('ad_analytics').insert({
        ad_id: null,
        merchant_id: ad.id.startsWith('merchant-upsell') ? merchantId : null,
        session_id: sessionId,
        event_type: 'click',
      })
    }
  }

  const handleGmbClick = async (gmbHref: string) => {
    if (!merchantId) return
    fetch('/api/merchant/track-gmb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchant_id: merchantId, session_id: sessionId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.isPro && (data.count ?? 0) >= 30) setIsGmbQuotaExceeded(true)
      })
      .catch(console.error)
    window.open(gmbHref, '_blank', 'noopener,noreferrer')
  }

  const handleDismissAlarm = () => {
    setDismissedSessions((prev) => {
      const next = new Set(prev)
      allSessions.forEach((session, id) => {
        if (session.status === 'called') next.add(id)
      })
      if (primaryStatus === 'called' || allSessions.size === 0) {
        next.add(sessionId)
      }
      return next
    })
    trackPagerEvent({ supabase, eventType: 'alarm_dismissed', sessionId, merchantId, clientUuid })
    stopAlert()
  }

  // ── Render Helpers ─────────────────────────────────────────────────────────
  const formatWaitTime = (startAt?: string | null) => {
    const start = new Date(startAt ?? createdAt ?? now).getTime()
    const seconds = Math.max(0, Math.floor((now - start) / 1000))
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`
  }

  const isGhostActive = (startAt?: string | null) => {
    const start = new Date(startAt ?? createdAt ?? now).getTime()
    return Math.floor((now - start) / 1000) > 1800
  }

  const buildActiveSessions = (): ActiveSession[] => {
    const list: ActiveSession[] = []
    const rawSessions = getSessionsList()

    const sortedRaw = [...rawSessions].sort((a, b) => {
      const getPriority = (statusStr: string) => {
        if (statusStr === 'called') return 1
        if (['completed', 'archived'].includes(statusStr)) return 3
        return 2
      }
      const pA = getPriority(a.status)
      const pB = getPriority(b.status)
      if (pA !== pB) return pA - pB
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    sortedRaw.forEach((session) => {
      const m = Array.isArray(session.merchants) ? session.merchants[0] : session.merchants
      list.push({
        sessionId: session.id,
        merchantName: m?.name || 'Gerai',
        merchantLogo: m?.logo_url || null,
        receiptNumber: session.receipt_number,
        status: session.status === 'called' ? 'called' : (session.status === 'completed' || session.status === 'archived') ? 'completed' : 'waiting',
        formattedWaitTime: formatWaitTime(session.created_at),
        isGhostActive: isGhostActive(session.created_at),
        gmbUrl: m?.gmb_url || null,
      })
    })
    return list
  }

  const getCalledSession = () => {
    if (!calledSessionId) return null
    const s = allSessions.get(calledSessionId)
    if (!s) return { receiptNumber, merchantName, themeColor }
    const m = Array.isArray(s.merchants) ? s.merchants[0] : s.merchants
    return {
      receiptNumber: s.receipt_number,
      merchantName: m?.name || merchantName,
      themeColor: m?.theme_color || themeColor,
    }
  }

  // ── Render States ──────────────────────────────────────────────────────────
  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#020203]"><Loader2 className="animate-spin text-indigo-500" /></div>
  }

  if (status === 'error') {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center bg-[#020203]"><h1 className="text-white font-bold text-xl uppercase tracking-widest">Session Expired / Not Found</h1></div>
  }

  if (status === 'completed') {
    const rawCompleted = getSessionsList()
      .filter((s) => ['completed', 'archived'].includes(s.status))
      .map((s) => {
        const m = Array.isArray(s.merchants) ? s.merchants[0] : s.merchants
        return {
          merchantName: m?.name || 'Gerai',
          merchantLogo: m?.logo_url || null,
          gmbUrl: m?.gmb_url || null,
        }
      })
      .filter((s) => !!s.gmbUrl)

    // Deduplicate by gmbUrl / merchantName so same merchant rating link shows only once
    const completedSessionsWithGmb: typeof rawCompleted = []
    const seenGmb = new Set<string>()
    for (const item of rawCompleted) {
      const key = item.gmbUrl || item.merchantName
      if (!seenGmb.has(key)) {
        seenGmb.add(key)
        completedSessionsWithGmb.push(item)
      }
    }

    return (
      <CompletedScreen
        lang={lang}
        onLangChange={() => setLang(lang === 'bm' ? 'en' : 'bm')}
        themeColor={themeColor}
        merchantLogo={merchantLogo}
        merchantName={merchantName}
        isGmbQuotaExceeded={isGmbQuotaExceeded}
        completedSessionsWithGmb={completedSessionsWithGmb}
        onGmbClick={handleGmbClick}
      />
    )
  }

  if (status === 'called' || isFlashing) {
    const calledInfo = getCalledSession()
    return (
      <CalledScreen
        calledName={calledInfo?.merchantName || merchantName}
        calledReceipt={calledInfo?.receiptNumber || receiptNumber}
        calledTheme={calledInfo?.themeColor || themeColor}
        lang={lang}
        onDismiss={handleDismissAlarm}
      />
    )
  }

  const activeSessions = buildActiveSessions()
  const isMultiSession = activeSessions.length > 1
  const ad = adsList[currentAdIndex] || null

  return (
    <div
      className="h-[100dvh] w-screen fixed inset-0 flex justify-center items-center bg-[#020203] overflow-hidden select-none"
      style={{ backgroundImage: `radial-gradient(circle at top, ${themeColor}1a, #020203)` }}
    >
      <div className={`w-full max-w-md h-full flex flex-col relative z-10 border-x border-white/5 ${status === 'waiting' ? 'bg-black' : 'justify-between p-6 bg-[#020203]/40 backdrop-blur-3xl'} shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden`}>
        {status === 'waiting' && (
          <div
            className="w-full h-full flex flex-col"
            onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
            onTouchEnd={(e) => {
              if (touchStartY === null || adsList.length <= 1) return
              const delta = touchStartY - e.changedTouches[0].clientY
              if (delta > 50) {
                setCurrentAdIndex((p) => (p + 1) % adsList.length)
              } else if (delta < -50) {
                setCurrentAdIndex((p) => (p - 1 + adsList.length) % adsList.length)
              }
              setTouchStartY(null)
            }}
          >
            <AdBanner
              ad={ad}
              lang={lang}
              isDescExpanded={isDescExpanded}
              onToggleDesc={() => setIsDescExpanded(!isDescExpanded)}
              onAdClick={handleAdClick}
              onGmbClick={handleGmbClick}
              gmbUrl={gmbUrl}
              isGmbQuotaExceeded={isGmbQuotaExceeded}
              isMultiSession={isMultiSession}
              activeStallsCount={activeSessions.length}
            />

            <PremiumPagerZone
              merchantName={merchantName}
              merchantLogo={merchantLogo}
              receiptNumber={receiptNumber}
              lang={lang}
              formattedWaitTime={isGhostActive() ? undefined : formatWaitTime()}
              isGhostActive={isGhostActive()}
              onTestBeep={() => {
                trackPagerEvent({ supabase, eventType: 'test_beep_clicked', sessionId, merchantId, clientUuid })
                initAudio()
              }}
              onShowWarning={() => setShowInstructions(true)}
              onScanQr={() => {
                trackPagerEvent({ supabase, eventType: 'qr_scanner_opened', sessionId, merchantId, clientUuid })
                setShowQrScanner(true)
              }}
              sessions={activeSessions.length > 0 ? activeSessions : undefined}
            />

            {showInstructions && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="w-full max-w-[280px] bg-[#111] border border-white/10 rounded-[32px] p-6 shadow-2xl animate-scale-in flex flex-col items-center text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-600 to-amber-400" />
                  <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <span className="text-3xl text-amber-500">⚠</span>
                  </div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Penting: Amaran Bunyi</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed mb-6">
                    {lang === 'bm' ? 'Sila pastikan anda mengikut arahan di bawah supaya pager ini berfungsi dengan sempurna.' : 'Please follow the instructions below so this pager works perfectly.'}
                  </p>
                  <ul className="w-full space-y-3 mb-6 text-left">
                    <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0"><Volume2 size={12} className="text-white" /></div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Kuatkan Volume Audio</span>
                    </li>
                    <li className="flex items-center gap-3 bg-white/[0.03] p-3 rounded-2xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0"><span>⚠</span></div>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wide">Matikan &quot;Silent Mode&quot;</span>
                    </li>
                    {isIos && (
                      <li className="flex items-start gap-3 bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5"><span className="text-amber-500 text-[10px]">⚠</span></div>
                        <span className="text-[10px] font-bold text-amber-200 uppercase tracking-wide leading-snug">
                          {lang === 'bm' ? 'Biarkan Skrin Aktif & Tab Terbuka' : 'Keep Screen On & Tab Open'}
                        </span>
                      </li>
                    )}
                  </ul>
                  <button
                    onClick={() => {
                      setShowInstructions(false)
                      trackPagerEvent({ supabase, eventType: 'warning_dismissed', sessionId, merchantId, clientUuid })
                      initAudio()
                    }}
                    className="w-full py-4 rounded-xl font-black text-[#111] text-xs uppercase tracking-widest bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.3)] active:scale-95 transition-transform"
                  >
                    Saya Faham
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showQrScanner && (
          <QrScannerModal
            onScan={handleQrScan}
            onClose={() => {
              trackPagerEvent({ supabase, eventType: 'qr_scanner_closed', sessionId, merchantId, clientUuid })
              setShowQrScanner(false)
            }}
          />
        )}

        {toast && (
          <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl font-bold text-sm text-white whitespace-nowrap shadow-2xl"
            style={{
              background: 'rgba(15,17,35,0.92)',
              border: '1px solid rgba(99,102,241,0.35)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(99,102,241,0.1)',
            }}
          >
            {toast}
          </div>
        )}

        {status !== 'waiting' && (
          <>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[50%] blur-[120px] rounded-full pointer-events-none" style={{ backgroundColor: `${themeColor}26` }} />
            <header className="p-2 text-center relative z-20 shrink-0 mb-4 pointer-events-none">
              <div className="flex flex-col items-center gap-2">
                {merchantLogo ? (
                  <img src={merchantLogo} alt={merchantName} className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-md" />
                ) : (
                  <Logo size={36} showText={false} />
                )}
                <h2 className="font-black text-white text-base tracking-tight uppercase">{merchantName}</h2>
              </div>
            </header>
            <main className="flex-1 flex flex-col items-center justify-center px-2 relative z-10 min-h-0 w-full">
              {status === 'confirm' && (
                <div className="w-full max-w-sm text-center animate-slide-up">
                  <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl shadow-2xl mb-8">
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter italic">#{receiptNumber}</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Connect Your Pager</p>
                    <div className="space-y-4 text-left mb-8">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                        <Smartphone size={18} className="text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-indigo-200 leading-snug">
                          {isIos
                            ? (lang === 'bm' ? 'Telefon ini akan berbunyi apabila pesanan sedia (Sila aktifkan bunyi).' : 'This phone will ring when your order is ready (Please enable sound).')
                            : (lang === 'bm' ? 'Telefon ini akan bergetar dan mengeluarkan bunyi apabila pesanan sedia.' : 'This phone will vibrate and make a sound when your order is ready.')}
                        </p>
                      </div>
                      {isIos && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                          <span className="text-amber-500 text-xs shrink-0 mt-0.5">⚠</span>
                          <p className="text-[11px] text-amber-200 leading-snug">
                            {lang === 'bm'
                              ? 'Pengguna iPhone: Jangan kunci skrin atau tutup tab pelayar ini agar panggilan real-time tidak terganggu.'
                              : 'iPhone Users: Do not lock your screen or close this browser tab to ensure real-time alerts work.'}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleConfirm}
                      className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"
                      style={{ backgroundColor: themeColor, boxShadow: `0 20px 40px ${themeColor}33` }}
                    >
                      ACTIVATE PAGER
                    </button>
                  </div>
                </div>
              )}
            </main>
            <footer className="p-2 relative z-20 shrink-0 mt-4 text-center space-y-1">
              <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.4em]">Beepme.pro — Virtual Paging System</p>
              <p className="text-[7px] text-slate-800 leading-relaxed">
                Tiada data peribadi dikumpul. ID peranti rawak digunakan semata-mata untuk giliran ini.{' '}
                <a href="/privacy" className="underline hover:text-slate-600">Polisi Privasi (PDPA)</a>
              </p>
            </footer>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes flash-green {
          0%, 100% { background-color: #000000; }
          50% { background-color: #10b981; }
        }
        .animate-flash-green { animation: flash-green 0.5s step-end infinite; }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-ping-slow { animation: ping-slow 1s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
        @keyframes lcd-flicker {
          0%, 97%, 100% { opacity: 1; }
          98% { opacity: 0.92; }
          99% { opacity: 1; }
        }
        .animate-lcd-flicker { animation: lcd-flicker 8s ease-in-out infinite; }
        @keyframes lcd-dot {
          0%, 60%, 100% { opacity: 0; }
          30% { opacity: 1; }
        }
        .animate-lcd-dot { animation: lcd-dot 1.4s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
