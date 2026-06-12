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

    // Fetch all merchants ordered by newest first
    const { data: merchants, error: merchantsError } = await service
      .from('merchants')
      .select('*')
      .order('created_at', { ascending: false })

    if (merchantsError) {
      console.error('Merchants fetch error:', merchantsError)
      return NextResponse.json({ error: merchantsError.message }, { status: 500 })
    }

    // Aggregate total & today counts
    const { count: totalMerchants } = await service
      .from('merchants')
      .select('*', { count: 'exact', head: true })

    const { count: totalSessions } = await service
      .from('sessions')
      .select('*', { count: 'exact', head: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count: ordersToday } = await service
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .gt('created_at', today.toISOString())

    // Enrich merchants with daily & monthly session count
    const firstOfMonth = new Date()
    firstOfMonth.setDate(1)
    firstOfMonth.setHours(0, 0, 0, 0)

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const enriched = await Promise.all(
      (merchants || []).map(async (m) => {
        const { count: monthlyCount } = await service
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', m.id)
          .gt('created_at', firstOfMonth.toISOString())

        const { count: todayCount } = await service
          .from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('merchant_id', m.id)
          .gt('created_at', startOfToday.toISOString())

        return { 
          ...m, 
          monthly_count: monthlyCount || 0,
          today_count: todayCount || 0
        }
      })
    )

    const estimatedRevenue = (merchants || []).reduce((acc, m) => {
      if (m.plan_type === 'basic') return acc + 30
      if (m.plan_type === 'pro') return acc + 49
      return acc
    }, 0)

    return NextResponse.json({
      merchants: enriched,
      stats: {
        totalMerchants: totalMerchants || 0,
        totalOrders: totalSessions || 0,
        ordersToday: ordersToday || 0,
        estimatedRevenue,
      }
    })
  } catch (error: any) {
    console.error('Admin merchants API error:', error)
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
      .from('merchants')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ merchant: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
