'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface CalledScreenProps {
  calledName: string
  calledReceipt: string
  calledTheme: string
  lang: 'bm' | 'en'
  onDismiss: () => void
}

export function CalledScreen({
  calledName,
  calledReceipt,
  calledTheme,
  lang,
  onDismiss,
}: CalledScreenProps) {
  const theme = calledTheme || '#10b981'

  return (
    <div
      className="h-[100dvh] w-screen fixed inset-0 flex flex-col items-center justify-center p-6 text-center cursor-pointer overflow-hidden bg-black select-none z-[999]"
      onClick={onDismiss}
    >
      <motion.div
        animate={{ backgroundColor: ['#000000', theme, '#000000'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 opacity-40"
      />
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: '40vw',
            height: '40vw',
            minWidth: '300px',
            minHeight: '300px',
            border: `4px solid ${theme}`,
            backgroundColor: `${theme}10`,
          }}
          animate={{ scale: [0.5, 3], opacity: [0.8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
        />
      ))}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-md">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 200 }}
          className="mb-4"
        >
          <span className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">🔔</span>
        </motion.div>
        {/* Show which stall is calling */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/70 text-sm font-bold tracking-widest uppercase mb-1"
        >
          {calledName}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-black text-white mb-2 tracking-widest uppercase"
        >
          {lang === 'bm' ? 'Pesanan Sedia' : 'Order Ready'}
        </motion.h1>
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="mb-12"
        >
          <p
            className="text-white font-black leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.6)]"
            style={{ fontSize: 'clamp(5rem, 25vw, 10rem)' }}
          >
            #{calledReceipt}
          </p>
        </motion.div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="px-8 py-4 rounded-full border border-white/20 bg-black/40 backdrop-blur-md"
        >
          <span className="text-white font-bold text-sm tracking-widest uppercase">
            {lang === 'bm' ? 'Ketik Di Mana-mana Untuk Berhenti' : 'Tap Anywhere To Stop'}
          </span>
        </motion.div>
      </div>
    </div>
  )
}
