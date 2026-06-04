import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { ad_id, session_id, event_type } = await request.json()

    // Validate event_type against explicit allowlist
    const ALLOWED_EVENT_TYPES = ['impression', 'click', 'complete']
    if (!ad_id || !event_type || !ALLOWED_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 })
    }

    // Initialize Supabase admin client using Service Role Key to bypass RLS for tracking operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Verify if session_id is valid and exists
    if (session_id) {
      const { data: sessionExists, error: sessionError } = await supabase
        .from('sessions')
        .select('id')
        .eq('id', session_id)
        .single()

      if (sessionError || !sessionExists) {
        return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 })
      }
    }

    // 1. Check for deduplication (only for impressions)
    if (event_type === 'impression' && session_id) {
      const { data: existingImpression } = await supabase
        .from('ad_analytics')
        .select('id')
        .eq('ad_id', ad_id)
        .eq('session_id', session_id)
        .eq('event_type', 'impression')
        .maybeSingle()

      if (existingImpression) {
        // Already tracked for this session, exit early
        return NextResponse.json({ success: true, already_tracked: true })
      }
    }

    // 2. Fetch ad details (bid and advertiser)
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('id, cpv_bid, advertiser_id, impressions_count')
      .eq('id', ad_id)
      .single()

    if (adError || !ad) {
      return NextResponse.json({ error: 'Ad not found' }, { status: 404 })
    }

    // 3. Resolve session's merchant_id
    let merchantId = null
    if (session_id) {
      const { data: session } = await supabase
        .from('sessions')
        .select('merchant_id')
        .eq('id', session_id)
        .single()
      
      if (session) {
        merchantId = session.merchant_id
      }
    }

    // 4. Wallet deduction & logging (only for impressions of paid ads)
    if (event_type === 'impression' && ad.cpv_bid && ad.cpv_bid > 0 && ad.advertiser_id) {
      // Get advertiser's wallet balance
      const { data: profile, error: profileError } = await supabase
        .from('advertiser_profiles')
        .select('id, wallet_balance')
        .eq('user_id', ad.advertiser_id)
        .single()

      if (profileError || !profile) {
        // Pause ad campaign if profile is missing
        await supabase.from('ads').update({ status: 'paused', is_active: false }).eq('id', ad_id)
        return NextResponse.json({ success: true, charged: false, reason: 'profile_missing', paused: true })
      }

      const balance = profile.wallet_balance ?? 0
      if (balance < ad.cpv_bid) {
        // Insufficient balance, pause the campaign
        await supabase.from('ads').update({ status: 'paused', is_active: false }).eq('id', ad_id)
        return NextResponse.json({ success: true, charged: false, reason: 'insufficient_balance', paused: true })
      }

      // Deduct from wallet
      const newBalance = balance - ad.cpv_bid
      const { error: deductError } = await supabase
        .from('advertiser_profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', profile.id)

      if (deductError) {
        return NextResponse.json({ error: 'Failed to deduct wallet balance', details: deductError.message }, { status: 500 })
      }

      // Log transaction
      const { error: txError } = await supabase
        .from('ad_wallet_transactions')
        .insert({
          advertiser_id: profile.id,
          ad_id,
          session_id: session_id || null,
          amount: ad.cpv_bid,
          type: 'debit',
          status: 'completed'
        })

      if (txError) {
        console.error('Failed to log ad wallet transaction:', txError.message)
      }

      // Update impressions count in ads table
      await supabase
        .from('ads')
        .update({ impressions_count: (ad.impressions_count || 0) + 1 })
        .eq('id', ad_id)

      // If new balance is zero or below, pause the campaign
      if (newBalance <= 0) {
        await supabase.from('ads').update({ status: 'paused', is_active: false }).eq('id', ad_id)
      }
    }

    // 5. Log event in analytics
    const { error: analyticsError } = await supabase
      .from('ad_analytics')
      .insert({
        ad_id,
        merchant_id: merchantId,
        session_id: session_id || null,
        event_type
      })

    if (analyticsError) {
      console.error('Failed to insert ad analytics:', analyticsError.message)
      return NextResponse.json({ error: 'Failed to insert ad analytics', details: analyticsError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

