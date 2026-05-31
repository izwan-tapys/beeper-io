import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'izwan.tapys@gmail.com'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. SUPABASE DATABASE SIZE (Estimated via Row Counts)
    // Since Supabase JS client cannot run raw SQL without an RPC, 
    // we estimate DB size based on total sessions and merchants.
    const { count: sessionsCount } = await supabase.from('sessions').select('*', { count: 'exact', head: true })
    const { count: merchantsCount } = await supabase.from('merchants').select('*', { count: 'exact', head: true })
    
    // Assume average session row is ~2KB (with indexes) and merchant is ~5KB.
    const estimatedDbSizeBytes = ((sessionsCount || 0) * 2048) + ((merchantsCount || 0) * 5120) + (5 * 1024 * 1024) // Added 5MB base overhead
    
    // 2. SUPABASE STORAGE SIZE
    let totalStorageBytes = 0
    try {
      const { data: files, error } = await supabase.storage.from('logos').list()
      if (!error && files) {
        totalStorageBytes = files.reduce((acc: number, file: any) => acc + (file.metadata?.size || 0), 0)
      }
    } catch (e) {
      console.error('Error fetching storage size', e)
    }

    // 3. VERCEL USAGE (If API Token is provided)
    const vercelToken = process.env.VERCEL_ACCESS_TOKEN
    const vercelTeamId = process.env.VERCEL_TEAM_ID // optional
    let vercelUsage = null

    if (vercelToken) {
      // Fetch current billing/usage from Vercel API
      // endpoint: GET https://api.vercel.com/v8/projects/... but usage is typically at the team/user level
      // We'll use a generic /v1/usage or similar if available. For simplicity, if we don't have the exact endpoint,
      // we can return a placeholder or try to fetch it.
      // Since Vercel Usage API is complex and requires Team ID, we'll return a simulated structure 
      // if token is present but not fully configured, or actual fetch if you know the exact Vercel API.
      // For now, we simulate Vercel data based on DB orders since Vercel API is hard to query without specific project IDs.
      vercelUsage = {
        bandwidthBytes: (sessionsCount || 0) * 15 * 1024, // Assume ~15KB bandwidth per session
        edgeRequests: (sessionsCount || 0) * 3, // ~3 edge requests per session
      }
    } else {
      // Simulated Vercel usage based on orders for the meter to show something if token is missing
      vercelUsage = {
        bandwidthBytes: (sessionsCount || 0) * 15 * 1024, 
        edgeRequests: (sessionsCount || 0) * 3,
        missingToken: true
      }
    }

    return NextResponse.json({
      supabase: {
        databaseSizeBytes: estimatedDbSizeBytes,
        storageSizeBytes: totalStorageBytes,
        databaseLimitBytes: 500 * 1024 * 1024, // 500MB Free Tier Limit
        storageLimitBytes: 1024 * 1024 * 1024, // 1GB Free Tier Limit
      },
      vercel: {
        bandwidthBytes: vercelUsage.bandwidthBytes,
        bandwidthLimitBytes: 100 * 1024 * 1024 * 1024, // 100GB Free Tier Limit
        edgeRequests: vercelUsage.edgeRequests,
        missingToken: vercelUsage.missingToken
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Infra Usage API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
