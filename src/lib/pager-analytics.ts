/**
 * Pager Analytics — Client-side tracking helper
 *
 * Fire-and-forget inserts into the `pager_analytics` Supabase table.
 * Captures device/browser metadata automatically.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type PagerEventType =
  | 'page_loaded'
  | 'warning_dismissed'
  | 'pager_activated'
  | 'test_beep_clicked'
  | 'alarm_dismissed'
  | 'offline'
  | 'online'
  | 'visibility_hidden'
  | 'visibility_visible'
  | 'qr_scanner_opened'
  | 'qr_scanner_closed'
  | 'qr_code_scanned'
  | 'heartbeat'

interface TrackPagerEventOptions {
  supabase: SupabaseClient
  eventType: PagerEventType
  sessionId?: string | null
  merchantId?: string | null
  clientUuid?: string | null
  /** Elapsed seconds since page_loaded — populated on heartbeat events */
  elapsedSeconds?: number
}

/** Parse a simple OS string from the navigator userAgent */
function parseOS(ua: string): string {
  if (/iP(hone|ad)/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Win/.test(ua)) return 'Windows'
  if (/Mac/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown'
}

/** Parse a simple browser name from the navigator userAgent */
function parseBrowser(ua: string): string {
  if (/SamsungBrowser/.test(ua)) return 'Samsung Browser'
  if (/OPR|Opera/.test(ua)) return 'Opera'
  if (/Edg/.test(ua)) return 'Edge'
  if (/Chrome/.test(ua)) return 'Chrome'
  if (/Safari/.test(ua)) return 'Safari'
  if (/Firefox/.test(ua)) return 'Firefox'
  return 'Unknown'
}

/**
 * Track a customer behavior event on the virtual pager page.
 * Non-blocking — errors are silently swallowed so they never interrupt the user.
 */
export function trackPagerEvent({
  supabase,
  eventType,
  sessionId,
  merchantId,
  clientUuid,
  elapsedSeconds,
}: TrackPagerEventOptions): void {
  // Skip if not running in the browser
  if (typeof window === 'undefined') return

  const ua = navigator.userAgent

  const payload: Record<string, unknown> = {
    event_type: eventType,
    session_id: sessionId ?? null,
    merchant_id: merchantId ?? null,
    client_uuid: clientUuid ?? null,
    elapsed_seconds: elapsedSeconds ?? null,
    browser: parseBrowser(ua),
    os: parseOS(ua),
    screen_width: window.screen.width,
    screen_height: window.screen.height,
  }

  // Fire-and-forget — intentionally not awaited
  supabase
    .from('pager_analytics')
    .insert(payload)
    .then(({ error }) => {
      if (error) {
        console.warn('[pager-analytics] Failed to track event:', error.message)
      }
    })
}
