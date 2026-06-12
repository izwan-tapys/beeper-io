import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not logged in', userError })
    }

    const { data: merchant, error: fetchError } = await supabase
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      user: { id: user.id, email: user.email },
      merchant,
      fetchError: fetchError ? {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint
      } : null
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message })
  }
}
