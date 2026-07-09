import { useState, useEffect } from 'react'

/**
 * Detects browser online/offline status.
 * Extracted from dashboard/page.tsx and pager/[sessionId]/page.tsx
 * to avoid duplicating the same event listener logic in both files.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return { isOnline }
}
