import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Create client inside handler — avoids module-level eval at build time
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const formData = await request.formData()
    const status = formData.get('status') as string
    const billCode = formData.get('billcode') as string
    const userId = formData.get('order_id') as string // billExternalReferenceNo we passed

    // Always return OK to ToyyibPay to prevent retries unless there's a real error
    if (status !== '1' || !billCode || !userId) {
      return new Response('OK', { status: 200 })
    }

    // ─── 1. SERVER-SIDE VERIFICATION ─────────────────────────────────────────
    // Never trust the callback alone. Query ToyyibPay's API to confirm the
    // payment is real and actually succeeded before upgrading the merchant.
    const userSecretKey = process.env.TOYYIBPAY_USER_SECRET_KEY
    if (!userSecretKey) {
      console.error('[ToyyibPay] TOYYIBPAY_USER_SECRET_KEY not configured')
      return new Response('Server Error', { status: 500 })
    }

    const verifyForm = new URLSearchParams()
    verifyForm.append('userSecretKey', userSecretKey)
    verifyForm.append('billCode', billCode)
    verifyForm.append('billpaymentStatus', '1') // Only fetch successful payments

    const verifyRes = await fetch('https://toyyibpay.com/index.php/api/getBillTransactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: verifyForm.toString(),
    })

    if (!verifyRes.ok) {
      console.error('[ToyyibPay] Verification API returned non-OK status:', verifyRes.status)
      return new Response('Verification Failed', { status: 500 })
    }

    const transactions: any[] = await verifyRes.json()

    if (!Array.isArray(transactions) || transactions.length === 0) {
      console.warn('[ToyyibPay] No successful transactions found for billCode:', billCode)
      return new Response('OK', { status: 200 }) // Return OK but skip upgrade
    }

    // Confirm that at least one transaction belongs to this user's order
    const matchedTx = transactions.find(
      (tx: any) =>
        tx.billpaymentStatus === '1' &&
        tx.billExternalReferenceNo === userId
    )

    if (!matchedTx) {
      console.warn('[ToyyibPay] Transaction userId mismatch for billCode:', billCode, '- expected userId:', userId)
      return new Response('OK', { status: 200 }) // Return OK but skip upgrade
    }

    // ─── 2. IDEMPOTENCY CHECK ─────────────────────────────────────────────────
    // ToyyibPay can retry the callback multiple times. Skip processing if we
    // have already handled this exact bill code.
    const { data: existingMerchant } = await supabaseAdmin
      .from('merchants')
      .select('last_bill_code, subscription_status, expiry_date')
      .eq('user_id', userId)
      .single()

    if (existingMerchant?.last_bill_code === billCode) {
      console.log('[ToyyibPay] Duplicate callback ignored for billCode:', billCode)
      return new Response('OK', { status: 200 })
    }

    // ─── 3. DETECT PLAN TYPE ──────────────────────────────────────────────────
    // Determine which plan was purchased from the bill name
    const billName: string = (matchedTx.billName || '').toLowerCase()
    let planType: 'basic' | 'pro' = 'basic'
    if (billName.includes('pro') || billName.includes('unlimited')) {
      planType = 'pro'
    }

    // ─── 4. UPGRADE MERCHANT ─────────────────────────────────────────────────
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + 30)

    const { error } = await supabaseAdmin
      .from('merchants')
      .update({
        plan_type: planType,
        subscription_status: 'active',
        expiry_date: expiryDate.toISOString(),
        last_bill_code: billCode, // Store so we can detect duplicate callbacks
      })
      .eq('user_id', userId)

    if (error) {
      console.error('[ToyyibPay] DB update error:', error)
      return new Response('Database Error', { status: 500 })
    }

    console.log(`[ToyyibPay] ✅ Merchant ${userId} upgraded to plan "${planType}", expires ${expiryDate.toISOString()}`)
    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('[ToyyibPay] Unhandled callback error:', error)
    return new Response('Error', { status: 500 })
  }
}
