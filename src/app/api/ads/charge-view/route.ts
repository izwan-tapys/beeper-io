import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Use service role key to bypass RLS for wallet deductions
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const body = await request.json()
    const { ad_id, session_id } = body

    if (!ad_id || !session_id) {
      return NextResponse.json({ error: 'Missing ad_id or session_id' }, { status: 400 })
    }

    // VULN-001 Fix: Verify that the session_id is a valid, existing session in the database
    const { data: sessionExists, error: sessionError } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', session_id)
      .single()

    if (sessionError || !sessionExists) {
      return NextResponse.json({ error: 'Invalid or expired session_id' }, { status: 400 })
    }

    // 1. Fetch the ad to get cpv_bid and advertiser_id
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id, cpv_bid, advertiser_id, status')
      .eq('id', ad_id)
      .single()

    if (adError || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // 2. If no cpv_bid or no advertiser_id, it's a system/Beepme ad — no charge needed
    if (!ad.cpv_bid || ad.cpv_bid <= 0 || !ad.advertiser_id) {
      return NextResponse.json({ success: true, charged: false, reason: 'system_ad' })
    }

    // 2b. Check if we already charged for this session and ad (idempotency check)
    const { data: existingTx, error: txCheckError } = await supabase
      .from('ad_wallet_transactions')
      .select('id')
      .eq('session_id', session_id)
      .eq('ad_id', ad_id)
      .eq('type', 'debit')
      .maybeSingle()

    if (existingTx) {
      return NextResponse.json({ success: true, charged: false, reason: 'already_charged' })
    }


    // 3. Fetch the advertiser_profile for that advertiser_id
    const { data: profile, error: profileError } = await supabase
      .from('advertiser_profiles')
      .select('id, wallet_balance')
      .eq('user_id', ad.advertiser_id)
      .single()

    if (profileError || !profile) {
      // No profile found — pause the campaign to be safe
      await supabase.from('ads').update({ status: 'paused' }).eq('id', ad_id)
      return NextResponse.json({ success: true, charged: false, reason: 'no_profile', paused: true })
    }

    const currentBalance = profile.wallet_balance ?? 0

    // 4. If wallet_balance < cpv_bid, pause the campaign
    if (currentBalance < ad.cpv_bid) {
      await supabase.from('ads').update({ status: 'paused' }).eq('id', ad_id)
      return NextResponse.json({ success: true, charged: false, reason: 'insufficient_balance', paused: true })
    }

    // 5. Deduct cpv_bid from wallet_balance
    const { error: deductError } = await supabase
      .from('advertiser_profiles')
      .update({ wallet_balance: currentBalance - ad.cpv_bid })
      .eq('id', profile.id)

    if (deductError) {
      return NextResponse.json({ error: 'Failed to deduct wallet balance', details: deductError.message }, { status: 500 })
    }

    // 6. Insert a debit record into ad_wallet_transactions
    const { error: txError } = await supabase
      .from('ad_wallet_transactions')
      .insert({
        advertiser_id: profile.id,
        ad_id,
        session_id,
        amount: ad.cpv_bid,
        type: 'debit',
      })

    if (txError) {
      // Non-fatal — the deduction already happened, log the error
      console.error('Failed to insert wallet transaction:', txError.message)
    }

    // 7. If new balance <= 0 after deduction, pause the campaign
    const newBalance = currentBalance - ad.cpv_bid
    if (newBalance <= 0) {
      await supabase.from('ads').update({ status: 'paused' }).eq('id', ad_id)
      return NextResponse.json({ success: true, charged: true, paused: true, new_balance: newBalance })
    }

    return NextResponse.json({ success: true, charged: true, paused: false, new_balance: newBalance })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
