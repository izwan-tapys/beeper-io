'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

interface CompletedScreenProps {
  lang: 'bm' | 'en'
  onLangChange: () => void
  themeColor: string
  merchantLogo: string | null
  merchantName: string
  isGmbQuotaExceeded: boolean
  completedSessionsWithGmb: any[]
  onGmbClick: (url: string) => void
}

export function CompletedScreen({
  lang,
  onLangChange,
  themeColor,
  merchantLogo,
  merchantName,
  isGmbQuotaExceeded,
  completedSessionsWithGmb,
  onGmbClick,
}: CompletedScreenProps) {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-[#050505]">
      <button
        onClick={onLangChange}
        className="fixed top-4 right-4 z-[999] bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-full text-white text-[10px] font-black tracking-widest uppercase transition-transform active:scale-95 flex items-center gap-2"
      >
        <span className={lang === 'bm' ? 'text-white' : 'text-white/40'}>BM</span>
        <span className="w-[1px] h-3 bg-white/20" />
        <span className={lang === 'en' ? 'text-white' : 'text-white/40'}>EN</span>
      </button>
      <div
        className="absolute inset-0 opacity-40 blur-[100px] mix-blend-screen"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 30%, ${themeColor}80, transparent 60%)`,
        }}
      />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-sm flex flex-col items-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', damping: 15 }}
          className="relative mb-8"
        >
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-30"
            style={{ backgroundColor: themeColor }}
          />
          <div
            className="w-28 h-28 rounded-full flex items-center justify-center shadow-2xl relative z-10 border-4 border-white/10 backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, ${themeColor} 0%, #000000 150%)`,
            }}
          >
            <CheckCircle2 size={56} className="text-white drop-shadow-md" />
          </div>
          {completedSessionsWithGmb.length > 1 ? (
            <div className="absolute -bottom-2 -right-4 flex -space-x-3">
              {completedSessionsWithGmb.slice(0, 3).map((item, idx) =>
                item.merchantLogo ? (
                  <motion.img
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.1 }}
                    src={item.merchantLogo}
                    className="w-10 h-10 rounded-full border-[3px] border-[#050505] shadow-xl z-20 object-cover"
                  />
                ) : (
                  <div
                    key={idx}
                    className="w-10 h-10 rounded-full bg-indigo-600 border-[3px] border-[#050505] flex items-center justify-center font-black text-xs text-white shadow-xl z-20"
                  >
                    {item.merchantName.charAt(0).toUpperCase()}
                  </div>
                )
              )}
            </div>
          ) : (
            merchantLogo && (
              <motion.img
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                src={merchantLogo}
                className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full border-[3px] border-[#050505] shadow-xl z-20 object-cover"
              />
            )
          )}
        </motion.div>
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-3 tracking-tighter">
          {lang === 'bm' ? 'Pesanan Selesai' : 'Order Completed'}
        </h1>
        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10 max-w-[260px]">
          Terima kasih kerana memilih{' '}
          <span className="text-white font-bold">
            {completedSessionsWithGmb.length > 1
              ? lang === 'bm'
                ? 'gerai-gerai kami'
                : 'our stalls'
              : merchantName}
          </span>
          . {lang === 'bm' ? 'Selamat menjamu selera!' : 'Enjoy your meal!'}
        </p>
        {completedSessionsWithGmb.length > 1 ? (
          <div className="w-full space-y-3 mt-6">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-2">
              {lang === 'bm' ? 'Nilai Gerai Kami' : 'Rate Our Stalls'}
            </p>
            {completedSessionsWithGmb.map((session, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xl hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {session.merchantLogo ? (
                    <img
                      src={session.merchantLogo}
                      alt={session.merchantName}
                      className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-black text-sm text-indigo-400 shrink-0">
                      {session.merchantName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left min-w-0">
                    <p className="text-white font-bold text-sm truncate leading-tight">
                      {session.merchantName}
                    </p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className="text-xs">
                          ⭐
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onGmbClick(session.gmbUrl!)}
                  className="px-4 py-2 rounded-xl bg-white text-black font-black text-xs uppercase tracking-wide shrink-0 transition-transform active:scale-95 hover:bg-slate-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                  {lang === 'bm' ? 'Nilai' : 'Rate'}
                </button>
              </motion.div>
            ))}
          </div>
        ) : completedSessionsWithGmb.length === 1 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-2 shadow-2xl"
          >
            {isGmbQuotaExceeded ? (
              <div className="w-full flex flex-col items-center justify-center gap-1.5 px-8 py-5 rounded-[24px] bg-white/5 border border-white/10 text-center">
                <span className="text-2xl">👋</span>
                <span className="uppercase tracking-wide text-[13px] text-slate-400 font-bold">
                  {lang === 'bm' ? 'Jumpa Lagi!' : 'See You Again!'}
                </span>
              </div>
            ) : (
              <button
                onClick={() => onGmbClick(completedSessionsWithGmb[0].gmbUrl!)}
                className="w-full flex flex-col items-center justify-center gap-1.5 px-8 py-5 rounded-[24px] bg-white text-black font-black hover:scale-[0.98] transition-transform shadow-[0_0_40px_rgba(255,255,255,0.15)] group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-yellow-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex gap-1 relative z-10">
                  {[0, 100, 200, 300, 400].map((d) => (
                    <span
                      key={d}
                      className="text-2xl animate-bounce"
                      style={{ animationDelay: `${d}ms` }}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <span className="relative z-10 uppercase tracking-wide text-[13px] text-slate-800">
                  {lang === 'bm'
                    ? `Nilai ${completedSessionsWithGmb[0].merchantName} di Google`
                    : `Rate ${completedSessionsWithGmb[0].merchantName} on Google`}
                </span>
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] p-6 text-center shadow-2xl"
          >
            <p className="text-xs text-slate-500 uppercase tracking-widest font-black">
              {lang === 'bm' ? 'Jumpa Lagi!' : 'See You Again!'}
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
