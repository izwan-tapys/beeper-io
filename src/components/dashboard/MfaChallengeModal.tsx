'use client'

import { ShieldCheck } from 'lucide-react'

interface MfaChallengeModalProps {
  mfaCode: string
  setMfaCode: (code: string) => void
  mfaError: string
  onChallenge: () => void
  onLogout: () => void
}

export function MfaChallengeModal({
  mfaCode,
  setMfaCode,
  mfaError,
  onChallenge,
  onLogout,
}: MfaChallengeModalProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-3xl bg-black/80 animate-fade-in">
      <div className="w-full max-w-md bg-[#0a0b0f] border border-white/10 rounded-[40px] p-8 md:p-12 shadow-2xl shadow-indigo-500/20 text-center animate-bounce-in">
        <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center mb-8 shadow-xl shadow-indigo-600/40 mx-auto">
          <ShieldCheck size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">2FA Required</h2>
        <p className="text-slate-400 mb-8 text-sm">Enter the 6-digit code from your authenticator app to continue.</p>

        <input
          type="text"
          placeholder="000000"
          maxLength={6}
          value={mfaCode}
          onChange={(e) => setMfaCode(e.target.value)}
          className="w-full px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-3xl text-center outline-none focus:border-indigo-500 transition-all tracking-[0.5em] mb-6"
        />

        {mfaError && <p className="text-rose-500 text-xs font-bold mb-6">{mfaError}</p>}

        <button
          onClick={onChallenge}
          className="w-full py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg transition-all shadow-xl shadow-indigo-600/20"
        >
          Verify & Login
        </button>
        <button
          onClick={onLogout}
          className="mt-6 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
