'use client'

/**
 * DashboardHeader
 * Extracted from dashboard/page.tsx lines 594-669.
 * Renders the sticky top header with merchant branding, store open/close toggle,
 * settings/logout buttons, and the tab navigation bar.
 */

import { Logo } from '@/components/Logo'
import {
  Zap,
  Smartphone,
  BarChart3,
  Settings,
  LogOut,
  Power,
  PowerOff,
  Loader2,
} from 'lucide-react'
import { Merchant } from '@/types'

interface Props {
  merchant: Merchant | null
  togglingStore: boolean
  activeTab: 'home' | 'promosi' | 'analytics'
  onToggleStore: () => void
  onOpenSettings: () => void
  onLogout: () => void
  onTabChange: (tab: 'home' | 'promosi' | 'analytics') => void
  lang: 'bm' | 'en'
}

export function DashboardHeader({
  merchant,
  togglingStore,
  activeTab,
  onToggleStore,
  onOpenSettings,
  onLogout,
  onTabChange,
  lang,
}: Props) {
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ background: 'rgba(10,11,15,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--card-border)' }}
    >
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Logo size={32} showText={false} />
          <div className="flex flex-col justify-center flex-1 min-w-0 ml-1">
            <span className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">
              Beepme
            </span>
            {merchant && (
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white truncate leading-none">
                  {merchant.name}
                </h1>
                {merchant.plan_type === 'pro' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-[9px] font-black uppercase tracking-widest border border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.2)]">
                    PRO
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="store-toggle-btn"
            onClick={onToggleStore}
            disabled={togglingStore}
            className="p-2.5 rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center"
            style={{
              background: merchant?.is_open ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.15)',
              color: merchant?.is_open ? '#4ade80' : '#818cf8',
              border: `1px solid ${merchant?.is_open ? 'rgba(34,197,94,0.3)' : 'rgba(99,102,241,0.3)'}`,
            }}
            title={merchant?.is_open ? 'Close Store' : 'Open Store'}
          >
            {togglingStore ? (
              <Loader2 size={18} className="animate-spin" />
            ) : merchant?.is_open ? (
              <PowerOff size={18} />
            ) : (
              <Power size={18} />
            )}
          </button>
          <button
            id="settings-btn"
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10"
            style={{ color: 'var(--muted-foreground)' }}
            title="Settings"
          >
            <Settings size={20} />
          </button>
          <button
            id="logout-btn"
            onClick={onLogout}
            className="p-2.5 rounded-xl transition-colors hover:bg-white/5 active:bg-white/10"
            style={{ color: 'var(--muted-foreground)' }}
            title="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="max-w-5xl mx-auto px-4 h-12 flex items-center gap-6 overflow-x-auto no-scrollbar border-t"
        style={{ borderColor: 'var(--card-border)' }}
      >
        <button
          onClick={() => onTabChange('home')}
          className={`h-full flex items-center gap-2 text-sm font-bold border-b-2 transition-all px-2 whitespace-nowrap ${
            activeTab === 'home'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Smartphone size={16} /> {lang === 'bm' ? 'Pesanan' : 'Home / Orders'}
        </button>
        <button
          onClick={() => onTabChange('promosi')}
          className={`h-full flex items-center gap-2 text-sm font-bold border-b-2 transition-all px-2 whitespace-nowrap ${
            activeTab === 'promosi'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <Zap size={16} /> {lang === 'bm' ? 'Promosi' : 'Promotion'}
          {merchant?.plan_type === 'pro' && (
            <span className="px-1.5 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 text-[8px] font-black uppercase tracking-widest border border-yellow-500/20 ml-1">
              PRO
            </span>
          )}
        </button>
        <button
          onClick={() => onTabChange('analytics')}
          className={`h-full flex items-center gap-2 text-sm font-bold border-b-2 transition-all px-2 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-300'
          }`}
        >
          <BarChart3 size={16} /> {lang === 'bm' ? 'Analitis' : 'Analytics'}
        </button>
      </div>
    </header>
  )
}
