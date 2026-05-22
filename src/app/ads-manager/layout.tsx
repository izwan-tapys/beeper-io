'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdsManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/login')
    })
  }, [router])

  return (
    <div className="min-h-screen" style={{ background: '#020203' }}>
      {children}
    </div>
  )
}
