import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // ToyyibPay sends data as form-urlencoded
    const formData = await request.formData()
    const status_id = formData.get('status_id')
    const order_id = formData.get('order_id') as string // This is our transaction.id
    const transaction_id = formData.get('transaction_id')
    const billcode = formData.get('billcode')

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    const supabase = await createClient()

    // Retrieve the pending transaction
    const { data: tx, error: txError } = await supabase
      .from('ad_wallet_transactions')
      .select('*')
      .eq('id', order_id)
      .single()

    if (txError || !tx) {
      console.error('Transaction not found:', order_id)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    if (tx.status !== 'pending') {
      // Already processed
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    if (status_id === '1') { // 1 = Success
      // Update transaction status to completed
      await supabase
        .from('ad_wallet_transactions')
        .update({ 
          status: 'completed',
          reference_id: transaction_id ? `${billcode}-${transaction_id}` : billcode
        })
        .eq('id', order_id)

      // Increment wallet balance
      const { data: profile, error: profileError } = await supabase
        .from('advertiser_profiles')
        .select('wallet_balance')
        .eq('user_id', tx.advertiser_id)
        .single()

      if (!profileError && profile) {
        await supabase
          .from('advertiser_profiles')
          .update({ wallet_balance: (profile.wallet_balance || 0) + tx.amount })
          .eq('user_id', tx.advertiser_id)
      }
    } else { // Failed or pending
      await supabase
        .from('ad_wallet_transactions')
        .update({ status: 'failed' })
        .eq('id', order_id)
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('ToyyibPay Callback Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
