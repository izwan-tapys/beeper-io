'use client'

import { X, Megaphone } from 'lucide-react'

interface ComingSoonModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ComingSoonModal({ isOpen, onClose }: ComingSoonModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-fade-in">
      <div className="w-full max-w-md bg-[#0a0b0f] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-indigo-500/20 text-center relative overflow-hidden animate-bounce-in">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/40 mx-auto">
          <Megaphone size={40} className="text-white animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-white mb-3">Akan Datang!</h2>
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-6">Sistem Pembayaran Premium</h3>
        <p className="text-slate-400 mb-8 text-sm leading-relaxed">
          Pendaftaran Payment Gateway (Stripe & ToyyibPay) sedang diproses. Beepme akan boleh dilanggan sepenuhnya tidak lama lagi! Terima kasih atas kesabaran anda.
        </p>
        <button
          onClick={onClose}
          className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all shadow-xl shadow-indigo-600/20"
        >
          Baik, Terima Kasih
        </button>
      </div>
    </div>
  )
}
