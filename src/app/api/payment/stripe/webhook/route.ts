import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[Stripe Webhook] Keys are not configured.')
    return new Response('Webhook Configuration Error', { status: 500 })
  }

  const stripe = new Stripe(stripeSecretKey)
  
  // Create Supabase Admin client to bypass RLS for webhook updates
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event: Stripe.Event

  try {
    if (!sig) {
      throw new Error('No stripe-signature header')
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {
    console.log(`[Stripe Webhook] Received event type: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.client_reference_id || session.metadata?.userId
        const subscriptionId = session.subscription as string

        if (!userId) {
          console.warn('[Stripe Webhook] No userId found in checkout session client_reference_id or metadata.')
          break
        }

        if (!subscriptionId) {
          console.warn('[Stripe Webhook] No subscription ID found for checkout session.')
          break
        }

        // Retrieve subscription details to get actual expiry (current_period_end)
        const subscription: any = await stripe.subscriptions.retrieve(subscriptionId)
        
        let expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30) // Default fallback: 30 days from now
        
        if (subscription && subscription.current_period_end) {
          expiryDate = new Date(subscription.current_period_end * 1000)
        } else {
          console.warn('[Stripe Webhook] current_period_end not found on subscription object, using fallback:', JSON.stringify(subscription))
        }

        const { error } = await supabaseAdmin
          .from('merchants')
          .update({
            plan_type: 'pro',
            subscription_status: 'active',
            expiry_date: expiryDate.toISOString(),
            last_bill_code: subscriptionId, // Using Stripe Subscription ID as reference
          })
          .eq('user_id', userId)

        if (error) {
          console.error('[Stripe Webhook] DB update error during checkout.session.completed:', error)
          return new Response('Database Error', { status: 500 })
        }

        console.log(`[Stripe Webhook] ✅ Merchant ${userId} upgraded to Premium, subscription ${subscriptionId}, expires ${expiryDate.toISOString()}`)
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any
        const subscriptionId = subscription.id
        
        let expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 30) // Default fallback: 30 days from now
        
        if (subscription && subscription.current_period_end) {
          expiryDate = new Date(subscription.current_period_end * 1000)
        } else {
          console.warn('[Stripe Webhook] current_period_end not found on subscription object, using fallback:', JSON.stringify(subscription))
        }
        
        // Map status from Stripe to our subscription status
        let status = 'inactive'
        if (subscription.status === 'active') {
          status = 'active'
        } else if (subscription.status === 'trialing') {
          status = 'active'
        } else if (subscription.status === 'past_due') {
          status = 'past_due'
        }

        // Find merchant by subscription ID (last_bill_code)
        const { data: merchant, error: fetchError } = await supabaseAdmin
          .from('merchants')
          .select('user_id')
          .eq('last_bill_code', subscriptionId)
          .single()

        if (fetchError || !merchant) {
          console.log(`[Stripe Webhook] Subscription update: No merchant found with subscription ID ${subscriptionId}`)
          break
        }

        const { error: updateError } = await supabaseAdmin
          .from('merchants')
          .update({
            subscription_status: status,
            expiry_date: expiryDate.toISOString(),
          })
          .eq('user_id', merchant.user_id)

        if (updateError) {
          console.error('[Stripe Webhook] DB update error during subscription update:', updateError)
          return new Response('Database Error', { status: 500 })
        }

        console.log(`[Stripe Webhook] ✅ Merchant ${merchant.user_id} subscription updated, status ${status}, expires ${expiryDate.toISOString()}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any
        const subscriptionId = subscription.id

        // Find merchant by subscription ID
        const { data: merchant, error: fetchError } = await supabaseAdmin
          .from('merchants')
          .select('user_id')
          .eq('last_bill_code', subscriptionId)
          .single()

        if (fetchError || !merchant) {
          console.log(`[Stripe Webhook] Subscription cancellation: No merchant found with subscription ID ${subscriptionId}`)
          break
        }

        // Revert merchant to free plan
        const { error: updateError } = await supabaseAdmin
          .from('merchants')
          .update({
            plan_type: 'free',
            subscription_status: 'inactive',
            expiry_date: null,
          })
          .eq('user_id', merchant.user_id)

        if (updateError) {
          console.error('[Stripe Webhook] DB update error during subscription deletion:', updateError)
          return new Response('Database Error', { status: 500 })
        }

        console.log(`[Stripe Webhook] ❌ Merchant ${merchant.user_id} subscription cancelled. Reverted to Free plan.`)
        break
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return new Response('OK', { status: 200 })
  } catch (error: any) {
    console.error('[Stripe Webhook] Unhandled error inside webhook handler:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
