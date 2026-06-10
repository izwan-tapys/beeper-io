import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWhatsAppAlert } from '@/lib/whatsapp'

const GMB_FREE_LIMIT = 30

export async function POST(request: Request) {
  try {
    const { merchant_id, session_id } = await request.json()

    if (!merchant_id) {
      return NextResponse.json({ error: 'Missing merchant_id' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Fetch merchant details (plan, phone, name, alert tracking columns)
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, name, phone, plan_type, subscription_status, expiry_date, gmb_alert_80_sent_month, gmb_alert_100_sent_month')
      .eq('id', merchant_id)
      .single()

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // 2. Determine if merchant is on Pro (active subscription, not expired)
    const isPro =
      merchant.plan_type === 'pro' &&
      merchant.subscription_status === 'active' &&
      !!merchant.expiry_date &&
      new Date(merchant.expiry_date) > new Date()

    // 3. Record the GMB click regardless of plan (for analytics)
    const { error: insertError } = await supabase
      .from('ad_analytics')
      .insert({
        ad_id: null,
        merchant_id,
        session_id: session_id || null,
        event_type: 'gmb_click',
      })

    if (insertError) {
      console.error('Error inserting gmb_click:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 4. For Pro merchants: no limit, return immediately
    if (isPro) {
      return NextResponse.json({ allowed: true, count: null, limit: null, isPro: true })
    }

    // 5. For Free merchants: count clicks in current calendar month
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const { count, error: countError } = await supabase
      .from('ad_analytics')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchant_id)
      .eq('event_type', 'gmb_click')
      .gte('created_at', startOfMonth)

    if (countError) {
      console.error('Error counting gmb clicks:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const totalClicks = count ?? 0
    const isExceeded = totalClicks > GMB_FREE_LIMIT

    // 6. Send WhatsApp alerts at 80% and 100% thresholds (once per month each)
    if (merchant.phone) {
      // 80% alert (24 clicks)
      const threshold80 = Math.ceil(GMB_FREE_LIMIT * 0.8)
      if (
        totalClicks >= threshold80 &&
        merchant.gmb_alert_80_sent_month !== currentMonthKey
      ) {
        await sendWhatsAppAlert(merchant.phone, merchant.name, totalClicks, '80')
        await supabase
          .from('merchants')
          .update({ gmb_alert_80_sent_month: currentMonthKey })
          .eq('id', merchant_id)
      }

      // 100% alert (30 clicks)
      if (
        totalClicks >= GMB_FREE_LIMIT &&
        merchant.gmb_alert_100_sent_month !== currentMonthKey
      ) {
        await sendWhatsAppAlert(merchant.phone, merchant.name, totalClicks, '100')
        await supabase
          .from('merchants')
          .update({ gmb_alert_100_sent_month: currentMonthKey })
          .eq('id', merchant_id)
      }
    }

    return NextResponse.json({
      allowed: !isExceeded,
      count: totalClicks,
      limit: GMB_FREE_LIMIT,
      isPro: false,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
