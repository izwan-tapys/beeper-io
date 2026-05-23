'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

export default function PromoPoster() {
  const themeColor = '#10b981' // emerald-500
  
  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4 font-sans">
      {/* 9:16 Aspect Ratio Container */}
      <div 
        className="relative bg-black w-full max-w-[400px] aspect-[9/16] overflow-hidden rounded-[40px] shadow-2xl border-8 border-neutral-800 flex flex-col items-center justify-center"
        style={{ backgroundImage: `radial-gradient(circle at top, ${themeColor}33, #000000)` }}
      >
        {/* Copywriting / Header */}
        <div className="absolute top-12 left-0 w-full text-center z-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-4"
          >
            <span className="text-white text-xs font-bold tracking-widest uppercase">Digital Pager F&B</span>
          </motion.div>
          <h1 className="text-3xl font-black text-white leading-tight mb-2">
            TINGGALKAN PAGER<br/>LAMA ANDA.
          </h1>
          <p className="text-emerald-400 font-semibold text-sm">Alert terus ke phone pelanggan!</p>
        </div>

        {/* Real UI Replica (The "Pesanan Sedia" Screen) */}
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 flex flex-col items-center justify-center w-full mt-20"
        >
          {/* Hypnotic Ripples from Real UI */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[300px] h-[300px] rounded-full border-4 border-emerald-500/30 animate-ping absolute" style={{ animationDuration: '3s' }} />
            <div className="w-[200px] h-[200px] rounded-full border-4 border-emerald-500/50 animate-ping absolute" style={{ animationDuration: '2s' }} />
          </div>

          <motion.div 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mb-6 relative z-10"
          >
            <span className="text-7xl drop-shadow-[0_0_20px_rgba(16,185,129,0.8)]">🔔</span>
          </motion.div>
          
          <h2 className="text-4xl font-black text-white mb-2 tracking-widest uppercase relative z-10">
            Pesanan Sedia
          </h2>

          <div className="mb-8 relative z-10">
            <p 
              className="text-white font-black leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]"
              style={{ fontSize: '6rem' }}
            >
              #089
            </p>
          </div>

          <div className="mt-4 px-6 py-3 rounded-full border border-white/20 bg-black/40 backdrop-blur-md relative z-10">
            <span className="text-white font-bold text-xs tracking-widest uppercase">
              Ketik Di Mana-mana Untuk Berhenti
            </span>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <div className="absolute bottom-10 left-0 w-full px-8 z-20">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Daftar Percuma</p>
              <p className="text-white/60 text-xs">beepme.pro</p>
            </div>
            <div className="bg-emerald-500 text-black p-2 rounded-full">
              <CheckCircle2 size={20} className="text-black" />
            </div>
          </div>
        </div>

        {/* Dynamic Background Glow */}
        <motion.div
          animate={{ backgroundColor: ['#000000', '#10b98115', '#000000'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        />
      </div>
      
      {/* Instructions for user */}
      <div className="ml-8 text-neutral-400 max-w-sm hidden md:block">
        <h3 className="text-white font-bold text-xl mb-2">📸 Cara ambil gambar:</h3>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Buka <code className="text-emerald-400 bg-neutral-800 px-1 rounded">localhost:3000/promo-poster</code></li>
          <li>Gunakan &quot;Snipping Tool&quot; atau screenshot phone.</li>
          <li>Design ini dibina menggunakan <strong className="text-white">Real UI (Tailwind & Framer Motion)</strong> dari app Beepme.</li>
        </ol>
      </div>
    </div>
  )
}
