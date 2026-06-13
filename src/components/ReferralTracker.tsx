'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export function ReferralTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (ref && typeof window !== 'undefined') {
      const ownRef = localStorage.getItem('beepme_own_referral_code')
      if (ownRef && ownRef === ref.toUpperCase().trim()) {
        console.warn('Self-referral detected. Skipping referral tracking.')
        return
      }
      // Last-click wins: always overwrite with the latest referral code
      localStorage.setItem('beepme_referred_by', ref.toUpperCase().trim())
    }
  }, [searchParams])

  return null
}
