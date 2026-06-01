import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 })
    }

    // Initialize Stripe client
    const stripe = new Stripe(stripeSecretKey)

    // Hardcoded plan settings
    const amount = 39 // RM39.00
    const planName = 'Premium'
    const successUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://beepme.pro'}/dashboard?status=success`
    const cancelUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://beepme.pro'}/dashboard?status=cancelled`

    // Create a Checkout Session for a monthly subscription
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: {
              name: `Beepme ${planName} Plan`,
              description: 'Access to custom branding, logo upload, custom themes, and ad-free waiting screens.',
            },
            unit_amount: amount * 100, // Stripe expects cents/sen
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      customer_email: user.email || undefined,
      client_reference_id: user.id, // Store Supabase user ID here to match in webhook
      metadata: {
        userId: user.id,
        planType: 'pro',
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    })

    if (session.url) {
      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Failed to create Stripe checkout session' }, { status: 400 })

  } catch (error: any) {
    console.error('Stripe Checkout Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
