import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'izwan.tapys@gmail.com'

export async function GET() {
  try {
    // 1. Verify caller is the admin using their session (anon client + cookies)
    const authClient = await createClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Use service role client — bypasses ALL RLS policies
    const service = createServiceClient()

    // Fetch all advertiser profiles ordered by newest first
    const { data: profiles, error: profilesError } = await service
      .from('advertiser_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Advertisers fetch error:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Fetch auth users to map emails
    let usersMap: Record<string, string> = {}
    try {
      const { data: { users }, error: usersError } = await service.auth.admin.listUsers()
      if (!usersError && users) {
        users.forEach((u) => {
          if (u.email) {
            usersMap[u.id] = u.email
          }
        })
      }
    } catch (usersErr) {
      console.error('Failed to list auth users:', usersErr)
    }

    // Enrich profiles with email
    const enriched = (profiles || []).map((p) => ({
      ...p,
      email: usersMap[p.user_id] || 'N/A'
    }))

    return NextResponse.json({ advertisers: enriched })
  } catch (error: any) {
    console.error('Admin advertisers API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    // Auth check
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, updates } = await request.json()
    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from('advertiser_profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ advertiser: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
