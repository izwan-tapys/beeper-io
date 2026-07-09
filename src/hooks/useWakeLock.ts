import { useRef, useEffect } from 'react'

/**
 * Keeps the screen on while the component is mounted using the Wake Lock API.
 * Automatically re-acquires the lock when the tab becomes visible again.
 * Extracted from dashboard/page.tsx and pager/[sessionId]/page.tsx.
 */
export function useWakeLock() {
  const wakeLockRef = useRef<any>(null)

  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen')
        }
      } catch (err) {
        console.error('Wake Lock error:', err)
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (wakeLockRef.current !== null && document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLockRef.current) wakeLockRef.current.release()
    }
  }, [])
}
