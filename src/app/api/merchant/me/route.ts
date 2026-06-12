import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/merchant/me — fetch merchant row for the currently logged-in user
export async function GET() {
  try {
    // 1. Get authenticated user from session
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Use service role to bypass RLS completely
    const service = createServiceClient()

    let { data: merchant, error: fetchError } = await service
      .from('merchants')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Fetch merchant error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // 3. If no merchant row exists, create one automatically
    if (!merchant) {
      const storeName = user.email?.split('@')[0] || 'My Store'
      const { data: newMerchant, error: insertError } = await service
        .from('merchants')
        .insert({ user_id: user.id, name: storeName, email: user.email })
        .select()
        .single()

      if (insertError) {
        console.error('Insert merchant error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      merchant = newMerchant
    } else if (!merchant.email && user.email) {
      // Backfill email if missing
      await service
        .from('merchants')
        .update({ email: user.email })
        .eq('id', merchant.id)
      merchant.email = user.email
    }

    return NextResponse.json({ merchant })
  } catch (error: any) {
    console.error('GET /api/merchant/me error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
