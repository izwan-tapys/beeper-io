'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView } from '@/lib/track-pageview'

export function PageViewTracker() {
  const pathname = usePathname()
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    if (pathname && pathname !== lastTrackedPath.current) {
      trackPageView(pathname)
      lastTrackedPath.current = pathname
    }
  }, [pathname])

  return null
}
