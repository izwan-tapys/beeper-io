import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = 'izwan.tapys@gmail.com'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? null

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // If a specific `next` was passed in the URL, honour it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Otherwise resolve role-based redirect
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        if (user.email === ADMIN_EMAIL) {
          return NextResponse.redirect(`${origin}/admin`)
        }

        const [advertiserRes, merchantRes] = await Promise.all([
          supabase.from('advertiser_profiles').select('id').eq('user_id', user.id).single(),
          supabase.from('merchants').select('id').eq('user_id', user.id).single(),
        ])

        const isAdvertiser = !advertiserRes.error && !!advertiserRes.data
        const isMerchant = !merchantRes.error && !!merchantRes.data

        if (isMerchant) return NextResponse.redirect(`${origin}/dashboard`)
        if (isAdvertiser) return NextResponse.redirect(`${origin}/ads-manager`)
      }

      // Default fallback
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`)
}
