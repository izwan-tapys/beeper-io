import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchant_id')

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchant_id' }, { status: 400 })
    }

    // 1. Ambil token Loyverse dari database
    const { data: merchant, error: mError } = await supabase
      .from('merchants')
      .select('loyverse_token')
      .eq('id', merchantId)
      .single()

    if (mError || !merchant?.loyverse_token) {
      return NextResponse.json({ error: 'Loyverse token not found' }, { status: 404 })
    }

    // 2. Tarik resit dari Loyverse API (Latest 10)
    const response = await fetch('https://api.loyverse.com/v1.0/receipts?limit=10', {
      headers: {
        'Authorization': `Bearer ${merchant.loyverse_token}`
      }
    })

    if (!response.ok) {
      const errData = await response.json()
      return NextResponse.json({ error: 'Loyverse API error', details: errData }, { status: response.status })
    }

    const data = await response.json()
    
    // 3. Filter data yang penting saja (Receipt Number & Created At)
    const receipts = data.receipts.map((r: any) => ({
      receipt_number: r.receipt_number,
      created_at: r.receipt_date,
      total: r.total_money
    }))

    return NextResponse.json({ receipts })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
