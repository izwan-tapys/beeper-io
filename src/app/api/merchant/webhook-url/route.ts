import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWebhookToken } from '@/lib/webhook'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the merchant associated with this user
    const { data: merchant, error } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (error || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const origin = new URL(request.url).origin
    const token = getWebhookToken(merchant.id)
    const webhookUrl = `${origin}/api/webhooks/loyverse?merchant_id=${merchant.id}&token=${token}`

    return NextResponse.json({ webhookUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
