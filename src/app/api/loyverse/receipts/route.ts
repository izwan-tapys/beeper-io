import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Auth: verify the caller is a logged-in merchant
  const supabaseAuth = await createClient()
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Service client for privileged DB reads
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchant_id')

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchant_id' }, { status: 400 })
    }

    // VULN-005 Fix: Verify this merchant belongs to the authenticated user
    const { data: ownerCheck, error: ownerError } = await supabase
      .from('merchants')
      .select('user_id')
      .eq('id', merchantId)
      .single()

    if (ownerError || !ownerCheck || ownerCheck.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Ambil token Loyverse dan status subscription dari database
    const { data: merchant, error: mError } = await supabase
      .from('merchants')
      .select('loyverse_token, subscription_status, expiry_date, plan_type')
      .eq('id', merchantId)
      .single()

    if (mError || !merchant?.loyverse_token) {
      return NextResponse.json({ error: 'Loyverse token not found' }, { status: 404 })
    }

    // 2. Check subscription status for paid plans
    if (merchant.plan_type !== 'free') {
      const isExpired =
        merchant.subscription_status !== 'active' ||
        (merchant.expiry_date && new Date(merchant.expiry_date) < new Date())

      if (isExpired) {
        return NextResponse.json({ error: 'Subscription expired. Please renew your plan.' }, { status: 402 })
      }
    }

    // 3. Tarik resit dari Loyverse API (Latest 10 SALES only)
    const response = await fetch('https://api.loyverse.com/v1.0/receipts?limit=10&receipt_type=SALE', {
      headers: {
        'Authorization': `Bearer ${merchant.loyverse_token}`
      }
    })

    if (!response.ok) {
      const errData = await response.json()
      return NextResponse.json({ error: 'Loyverse API error', details: errData }, { status: response.status })
    }

    const data = await response.json()

    // Tapis manual untuk pastikan HANYA SALE sahaja (Loyverse kadang-kadang hantar semua)
    const salesOnly = (data.receipts || []).filter((r: any) => r.receipt_type === 'SALE')

    // 4. Filter data yang penting saja (Receipt Number & Created At)
    const receipts = salesOnly.map((r: any) => ({
      receipt_number: r.receipt_number,
      created_at: r.receipt_date,
      total: r.total_money
    }))

    return NextResponse.json({ receipts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
