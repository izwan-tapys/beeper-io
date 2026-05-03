import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchant_id')

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchant_id' }, { status: 400 })
    }

    const body = await request.json()
    console.log('--- LOYVERSE WEBHOOK RECEIVED ---')
    console.log('Merchant ID:', merchantId)
    console.log('Payload:', JSON.stringify(body, null, 2))

    // Semak jika ini adalah webhook RECEIPT CREATED
    if (body.entity === 'RECEIPT' && body.action === 'CREATED') {
      const receiptNumber = body.receipt_number
      console.log('Processing Receipt #', receiptNumber)

      // Masukkan ke dalam database sessions
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          merchant_id: merchantId,
          receipt_number: receiptNumber,
          status: 'waiting'
        })
        .select()
        .single()

      if (error) {
        console.error('Webhook insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, session: data })
    }

    return NextResponse.json({ message: 'Ignored action' })
  } catch (err: any) {
    console.error('Webhook general error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
