'use client'

/**
 * SubscriptionExpiredOverlay
 * Extracted from dashboard/page.tsx lines 564-592.
 * Renders a full-screen modal overlay when a merchant's paid subscription has expired,
 * prompting them to renew or log out.
 */

import { Zap } from 'lucide-react'

interface Props {
  merchant: { plan_type: string; expiry_date: string | null }
  onRenew: () => void
  onLogout: () => void
}

export function SubscriptionExpiredOverlay({ merchant, onRenew, onLogout }: Props) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-[#0a0b0f] border border-rose-500/30 rounded-[32px] p-8 shadow-2xl shadow-rose-500/10 text-center animate-bounce-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
          <Zap size={32} className="text-rose-400" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Subscription Expired</h2>
        <p className="text-slate-400 text-sm mb-2">
          Your <span className="text-white font-bold capitalize">{merchant.plan_type}</span> plan expired on{' '}
          <span className="text-rose-400 font-bold">
            {merchant.expiry_date
              ? new Date(merchant.expiry_date).toLocaleDateString('en-MY', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })
              : 'N/A'}
          </span>
          .
        </p>
        <p className="text-slate-500 text-xs mb-8">
          Renew your plan to continue issuing pagers and receiving orders.
        </p>
        <button
          onClick={onRenew}
          className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
        >
          <Zap size={16} /> Renew Subscription
        </button>
        <button
          onClick={onLogout}
          className="mt-4 text-slate-600 hover:text-white text-xs font-bold uppercase tracking-widest"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
