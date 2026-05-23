import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { ad_id, session_id, event_type } = await request.json()

    if (!ad_id || !event_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc('track_ad_event', {
      p_ad_id: ad_id,
      p_session_id: session_id || null,
      p_event_type: event_type,
    })

    if (error) {
      console.error('Error tracking ad event:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
