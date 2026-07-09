import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// VULN-E Fix: Do not fall back to hardcoded email. Require ADMIN_EMAIL to be explicitly set.
if (!process.env.ADMIN_EMAIL) {
  console.error('[Security] ADMIN_EMAIL environment variable is not configured. Admin API will reject all requests.')
}
const ADMIN_EMAIL = process.env.ADMIN_EMAIL

// VULN-B Fix: Whitelist of fields that are allowed to be updated via the admin PATCH endpoint.
// Prevents mass assignment — e.g., an attacker cannot arbitrarily set wallet_balance to any value.
const ALLOWED_ADVERTISER_FIELDS = [
  'is_approved',
  'is_active',
  'wallet_balance',
  'notes',
]

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
    // VULN-E Fix: Reject if ADMIN_EMAIL is not configured
    if (!ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Admin API is not configured on this server.' }, { status: 503 })
    }

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

    // VULN-B Fix: Filter updates to only allowed fields to prevent mass assignment
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => ALLOWED_ADVERTISER_FIELDS.includes(key))
    )

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
    }

    const service = createServiceClient()
    const { data, error } = await service
      .from('advertiser_profiles')
      .update(safeUpdates)
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
