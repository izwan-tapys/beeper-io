import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Use service role key to bypass RLS for campaign update
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // 1. Get authenticated user
    const supabaseUser = await createServerClient()
    const { data: { user } } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      id,
      title,
      description,
      video_url,
      fallback_image_url,
      link_url,
      cta_text,
      category,
      target_lat,
      target_lng,
      radius_km,
      target_all,
      cpv_bid,
    } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing campaign ID' }, { status: 400 })
    }

    // 2. Fetch the ad to check ownership
    const { data: ad, error: fetchError } = await supabaseAdmin
      .from('ads')
      .select('advertiser_id')
      .eq('id', id)
      .single()

    if (fetchError || !ad) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    // 3. Ensure owner matches
    if (ad.advertiser_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 4. Update the ad fields and force moderation status
    const payload: Record<string, any> = {
      title: title?.trim() || '',
      description: description?.trim() || null,
      video_url: video_url?.trim() || null,
      image_url: fallback_image_url?.trim() || null,
      link_url: link_url?.trim() || null,
      cta_text: cta_text?.trim() || 'Learn More',
      category: category || null,
      cpv_bid: Number(cpv_bid) || 0.05,
      status: 'pending_review',
      is_active: false, // force moderation
    }

    if (target_all) {
      payload.target_latitude = null
      payload.target_longitude = null
      payload.target_radius_km = null
    } else {
      payload.target_latitude = Number(target_lat)
      payload.target_longitude = Number(target_lng)
      payload.target_radius_km = Number(radius_km)
    }

    const { error: updateError } = await supabaseAdmin
      .from('ads')
      .update(payload)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update campaign', details: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
