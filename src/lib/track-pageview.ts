/**
 * Visitor Tracking — Client-side page view helper
 *
 * Fire-and-forget inserts into the `page_views` Supabase table.
 * Captures path, referrer, browser, OS, and screen metadata.
 */

import { createClient } from './supabase/client'

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
 * Tracks a page view event.
 * Non-blocking — errors are silently swallowed to avoid disturbing user experience.
 */
export function trackPageView(path: string): void {
  // Skip if not running in the browser
  if (typeof window === 'undefined') return

  // Do NOT track admin pages
  if (path.startsWith('/admin')) return

  const ua = navigator.userAgent
  const supabase = createClient()

  const payload = {
    path,
    referrer: document.referrer || null,
    browser: parseBrowser(ua),
    os: parseOS(ua),
    screen_width: window.screen.width,
    screen_height: window.screen.height,
  }

  // Fire-and-forget — intentionally not awaited
  supabase
    .from('page_views')
    .insert(payload)
    .then(({ error }) => {
      if (error) {
        console.warn('[track-pageview] Failed to track page view:', error.message)
      }
    })
}
