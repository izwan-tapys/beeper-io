import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const status_id = formData.get('status_id') as string
    const order_id = formData.get('order_id') as string   // our transaction.id
    const billcode = formData.get('billcode') as string
    const transaction_id = formData.get('transaction_id') as string

    // Always return 200 to stop ToyyibPay retries, but only process valid payloads
    if (!order_id || !billcode) {
      return new Response('OK', { status: 200 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ─── VULN-003 Fix: Server-side verification with ToyyibPay API ────────────
    // Never trust the callback status_id alone — always verify with ToyyibPay.
    const userSecretKey = process.env.TOYYIBPAY_SECRET_KEY
    if (!userSecretKey) {
      console.error('[ToyyibPay Callback] TOYYIBPAY_SECRET_KEY not configured')
      return new Response('Server Error', { status: 500 })
    }

    const verifyForm = new URLSearchParams()
    verifyForm.append('userSecretKey', userSecretKey)
    verifyForm.append('billCode', billcode)
    verifyForm.append('billpaymentStatus', '1') // Only confirmed-successful payments

    const verifyRes = await fetch('https://toyyibpay.com/index.php/api/getBillTransactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyForm.toString(),
    })

    if (!verifyRes.ok) {
      console.error('[ToyyibPay Callback] Verification API error:', verifyRes.status)
      return new Response('Verification Failed', { status: 500 })
    }

    const transactions: any[] = await verifyRes.json()
    const isVerified =
      Array.isArray(transactions) &&
      transactions.some(
        (tx) =>
          tx.billpaymentStatus === '1' &&
          tx.billExternalReferenceNo === order_id
      )

    // ─── Idempotency check ────────────────────────────────────────────────────
    const { data: tx, error: txError } = await supabaseAdmin
      .from('ad_wallet_transactions')
      .select('*')
      .eq('id', order_id)
      .single()

    if (txError || !tx) {
      console.error('[ToyyibPay Callback] Transaction not found:', order_id)
      return new Response('OK', { status: 200 }) // Don't leak 404 to ToyyibPay
    }

    if (tx.status !== 'pending') {
      // Already processed — idempotency guard
      return new Response('OK', { status: 200 })
    }

    if (isVerified) {
      // ─── Credit wallet ───────────────────────────────────────────────────────
      await supabaseAdmin
        .from('ad_wallet_transactions')
        .update({
          status: 'completed',
          reference_id: transaction_id ? `${billcode}-${transaction_id}` : billcode,
        })
        .eq('id', order_id)

      const { data: profile } = await supabaseAdmin
        .from('advertiser_profiles')
        .select('wallet_balance')
        .eq('id', tx.advertiser_id)
        .single()

      if (profile) {
        await supabaseAdmin
          .from('advertiser_profiles')
          .update({ wallet_balance: (profile.wallet_balance || 0) + tx.amount })
          .eq('id', tx.advertiser_id)
      }

      console.log(`[ToyyibPay Callback] ✅ Wallet credited RM${tx.amount} for advertiser ${tx.advertiser_id}`)
    } else {
      // Payment not verified or failed — mark as failed
      await supabaseAdmin
        .from('ad_wallet_transactions')
        .update({ status: 'failed' })
        .eq('id', order_id)

      console.warn('[ToyyibPay Callback] ❌ Payment not verified for order:', order_id)
    }

    return new Response('OK', { status: 200 })
  } catch (err: any) {
    console.error('[ToyyibPay Callback] Unhandled error:', err)
    return new Response('Error', { status: 500 })
  }
}
