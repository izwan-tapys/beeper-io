import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role for backend updates to bypass RLS if needed
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const status = formData.get('status')
    const billCode = formData.get('billcode')
    const userId = formData.get('order_id') // External reference we passed earlier

    if (status === '1' && userId) {
      // Payment Successful
      // Update merchant subscription in DB
      
      // Calculate expiry date (30 days from now)
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)

      const { error } = await supabaseAdmin
        .from('merchants')
        .update({
          plan_type: 'pro',
          subscription_status: 'active',
          expiry_date: expiryDate.toISOString()
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error updating subscription:', error)
        return new Response('Database Error', { status: 500 })
      }

      return new Response('OK', { status: 200 })
    }

    return new Response('OK', { status: 200 }) // Still return OK to ToyyibPay
  } catch (error) {
    console.error('Callback Error:', error)
    return new Response('Error', { status: 500 })
  }
}
