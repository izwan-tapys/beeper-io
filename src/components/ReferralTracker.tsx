'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref && typeof window !== 'undefined') {
      // Last-click wins: always overwrite with the latest referral code
      localStorage.setItem('beepme_referred_by', ref.toUpperCase().trim())
    }
  }, [searchParams])

  return null
}
