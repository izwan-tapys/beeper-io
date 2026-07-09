import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getWebhookToken } from '@/lib/webhook'

export const dynamic = 'force-dynamic'

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
    const receivedToken = searchParams.get('token')

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchant_id' }, { status: 400 })
    }

    // ─── 1. WEBHOOK TOKEN VALIDATION ─────────────────────────────────────────
    // Verify the request came from a URL we gave this merchant (not forged).
    // Merchants without a token in their webhook URL will be rejected — they
    // need to update their Loyverse webhook to the URL shown in Settings.
    const expectedToken = getWebhookToken(merchantId)
    if (!receivedToken || receivedToken !== expectedToken) {
      console.warn('[Loyverse Webhook] Invalid token for merchant:', merchantId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ─── 2. SUBSCRIPTION CHECK ───────────────────────────────────────────────
    // Don't create pager sessions for merchants with expired subscriptions.
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, subscription_status, expiry_date, plan_type')
      .eq('id', merchantId)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Check plan quota: free plan is always allowed (up to DB-enforced limits)
    // Paid plans must not be expired
    if (merchant.plan_type !== 'free') {
      const isExpired =
        merchant.subscription_status !== 'active' ||
        (merchant.expiry_date && new Date(merchant.expiry_date) < new Date())

      if (isExpired) {
        console.warn('[Loyverse Webhook] Subscription expired for merchant:', merchantId)
        return NextResponse.json({ error: 'Subscription expired' }, { status: 402 })
      }
    }

    const body = await request.json()
    console.log('[Loyverse Webhook] Received for merchant:', merchantId)

    // ─── 3. PROCESS WEBHOOK ──────────────────────────────────────────────────
    if (body.entity === 'RECEIPT' && body.action === 'CREATED') {
      const receiptNumber = body.receipt_number
      console.log('[Loyverse Webhook] Processing Receipt #', receiptNumber)

      // VULN-F Fix: Rate limit session creation to prevent flood attacks via leaked webhook URLs.
      // If someone obtains the webhook URL (e.g., from a merchant who shared it accidentally),
      // they cannot create unlimited bogus sessions to disrupt operations.
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
      const { count: recentCount } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .gte('created_at', oneMinuteAgo)

      const RATE_LIMIT_PER_MINUTE = 20
      if ((recentCount ?? 0) >= RATE_LIMIT_PER_MINUTE) {
        console.warn(`[Loyverse Webhook] Rate limit exceeded for merchant: ${merchantId} (${recentCount} sessions in last 60s)`)
        return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
      }

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
        console.error('[Loyverse Webhook] Insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, session: data })
    }

    return NextResponse.json({ message: 'Ignored action' })
  } catch (err: any) {
    console.error('[Loyverse Webhook] General error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
