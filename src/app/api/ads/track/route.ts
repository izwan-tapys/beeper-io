import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { ad_id, session_id, event_type } = await request.json()

    // VULN-010 Fix: Validate event_type against explicit allowlist
    const ALLOWED_EVENT_TYPES = ['impression', 'click', 'complete']
    if (!ad_id || !event_type || !ALLOWED_EVENT_TYPES.includes(event_type)) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // VULN-002 Fix: If session_id is provided, verify it exists in the database
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
