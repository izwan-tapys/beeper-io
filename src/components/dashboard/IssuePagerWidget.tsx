'use client'

/**
 * IssuePagerWidget
 * Extracted from dashboard/page.tsx lines 689-835.
 * Renders the "Issue New Pager" card, including the receipt input form,
 * Loyverse sync button, monthly order counter, Google Review quota progress bar,
 * and the latest Loyverse receipts list.
 */

import { Plus, Zap, Loader2, X, Infinity as InfinityIcon } from 'lucide-react'
import { Merchant } from '@/types'

interface Props {
  merchant: Merchant
  isPremiumActive: boolean
  isOverQuota: boolean
  receiptInput: string
  creating: boolean
  isSyncing: boolean
  syncCooldown: number
  monthlyCount: number
  gmbClickCount: number
  latestReceipts: any[]
  onReceiptChange: (val: string) => void
  onSubmit: () => void
  onSync: () => void
  onSelectReceipt: (receiptNumber: string) => void
  onOpenSettings: (section?: string) => void
  onClearReceipts: () => void
}

export function IssuePagerWidget({
  merchant,
  isPremiumActive,
  isOverQuota,
  receiptInput,
  creating,
  isSyncing,
  syncCooldown,
  monthlyCount,
  gmbClickCount,
  latestReceipts,
  onReceiptChange,
  onSubmit,
  onSync,
  onSelectReceipt,
  onOpenSettings,
  onClearReceipts,
}: Props) {
  return (
    <div
      className="rounded-2xl p-6 border"
      style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
    >
      <h2 className="text-lg font-semibold text-white mb-4">Issue New Pager</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (isOverQuota) {
            onOpenSettings('subscription')
            return
          }
          onSubmit()
        }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <input
          id="receipt-input"
          type="text"
          value={receiptInput}
          onChange={(e) => onReceiptChange(e.target.value)}
          placeholder={isOverQuota ? 'Quota Reached' : 'Enter receipt / order number'}
          disabled={isOverQuota}
          className="w-full sm:flex-1 px-4 py-3 rounded-xl text-white outline-none"
          style={{ background: '#0a0b0f', border: '1px solid var(--card-border)' }}
        />
        <div className="flex gap-2">
          <button
            id="create-session-btn"
            type="submit"
            disabled={creating || (!isOverQuota && !receiptInput.trim())}
            className="flex-1 sm:flex-none px-6 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
            style={{
              background: isOverQuota
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              opacity: creating ? 0.7 : 1,
              boxShadow: isOverQuota ? '0 0 15px rgba(245, 158, 11, 0.3)' : 'none',
            }}
          >
            {creating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isOverQuota ? (
              <Zap size={18} />
            ) : (
              <Plus size={18} />
            )}
            <span>{isOverQuota ? 'Upgrade Plan' : 'Issue'}</span>
          </button>
          <button
            type="button"
            onClick={onSync}
            disabled={isSyncing || syncCooldown > 0 || !merchant?.loyverse_token}
            className="px-5 py-3 rounded-xl border flex items-center justify-center transition-all min-w-[50px] sm:min-w-0"
            style={{
              background: 'rgba(234,179,8,0.1)',
              borderColor:
                merchant?.loyverse_token && syncCooldown === 0
                  ? 'rgba(234,179,8,0.3)'
                  : 'rgba(255,255,255,0.05)',
              color:
                merchant?.loyverse_token && syncCooldown === 0 ? '#eab308' : '#475569',
            }}
            title={syncCooldown > 0 ? `Cooldown: ${syncCooldown}s` : 'Sync with Loyverse'}
          >
            {isSyncing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : syncCooldown > 0 ? (
              <span className="text-xs font-bold">{syncCooldown}</span>
            ) : (
              <Zap size={18} />
            )}
          </button>
        </div>
      </form>

      {/* Monthly Usage Counter */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Monthly Orders Processed
          </span>
          <span className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1">
            {monthlyCount} / <InfinityIcon size={14} className="text-indigo-400 font-black inline" />
          </span>
        </div>
      </div>

      {/* Google Review Quota Widget (Free Plan Only) */}
      {!isPremiumActive && merchant?.gmb_url && (() => {
        const GMB_LIMIT = 30
        const pct = Math.min(100, Math.round((gmbClickCount / GMB_LIMIT) * 100))
        const isNear = pct >= 80
        const isOver = gmbClickCount >= GMB_LIMIT
        const barColor = isOver ? '#ef4444' : isNear ? '#f59e0b' : '#6366f1'
        return (
          <div className={`mt-3 pt-3 border-t border-white/5 space-y-2 ${isOver ? 'animate-pulse' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                ⭐ Google Review Clicks
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: barColor }}
              >
                {gmbClickCount} / {GMB_LIMIT}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            {isNear && (
              <div
                className="flex items-center justify-between gap-3 p-3 rounded-xl border"
                style={{
                  background: isOver ? 'rgba(239,68,68,0.05)' : 'rgba(245,158,11,0.05)',
                  borderColor: isOver ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                }}
              >
                <p
                  className="text-[10px] font-bold leading-snug"
                  style={{ color: isOver ? '#f87171' : '#fbbf24' }}
                >
                  {isOver
                    ? '⛔ Google Review had habis bulan ini. Naik taraf ke Pro untuk ulasan tanpa had!'
                    : `⚠️ ${GMB_LIMIT - gmbClickCount} klik lagi sebelum had habis bulan ini.`}
                </p>
                <button
                  onClick={() => onOpenSettings('subscription')}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider text-white transition-all active:scale-95"
                  style={{ background: isOver ? '#ef4444' : '#f59e0b' }}
                >
                  Upgrade
                </button>
              </div>
            )}
          </div>
        )
      })()}

      {/* Latest Receipts List */}
      {latestReceipts.length > 0 && (
        <div
          className="mt-4 p-4 rounded-2xl animate-fade-in"
          style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.1)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
              Latest from Loyverse
            </h4>
            <button onClick={onClearReceipts} className="text-slate-500 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {latestReceipts.slice(0, 6).map((r, i) => (
              <button
                key={i}
                onClick={() => onSelectReceipt(r.receipt_number)}
                className="p-3 rounded-xl bg-black border border-white/5 hover:border-indigo-500/50 transition-all text-center group"
              >
                <p className="text-xs text-slate-400 group-hover:text-indigo-400 font-mono">
                  #{r.receipt_number}
                </p>
                <p className="text-[10px] font-bold text-white mt-1">RM{r.total}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
