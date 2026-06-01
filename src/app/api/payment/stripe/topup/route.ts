import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(request: Request) {
  try {
    const { amount } = await request.json()

    // Validate amount bounds
    if (!amount || typeof amount !== 'number' || !isFinite(amount) || amount < 10 || amount > 10000) {
      return NextResponse.json({ error: 'Minimum top-up is RM 10 and maximum is RM 10,000.' }, { status: 400 })
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get advertiser profile
    const { data: profile, error: profileError } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Advertiser profile not found' }, { status: 404 })
    }

    const advertiser_id = profile.id

    // Create a pending transaction in ad_wallet_transactions
    const { data: transaction, error: txError } = await supabase
      .from('ad_wallet_transactions')
      .insert({
        advertiser_id,
        amount,
        type: 'topup',
        status: 'pending'
      })
      .select('id')
      .single()

    if (txError || !transaction) {
      console.error('Error creating pending transaction:', txError)
      return NextResponse.json({ error: txError?.message || 'Failed to create transaction' }, { status: 500 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({ error: 'Stripe is not configured on the server.' }, { status: 500 })
    }

    const stripe = new Stripe(stripeSecretKey)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beepme.pro'

    // Create a Stripe Checkout Session for a one-off payment
    // Omitting payment_method_types to enable dynamic payment methods (TNG, FPX, Cards, GrabPay)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'myr',
            product_data: {
              name: 'Beepme Ad Wallet Top-up',
              description: `Top-up of RM${amount} for advertiser credit.`,
            },
            unit_amount: amount * 100, // Stripe expects cents/sen
          },
          quantity: 1,
        },
      ],
      customer_email: user.email || undefined,
      client_reference_id: transaction.id, // Reference to transaction table ID
      metadata: {
        type: 'topup',
        transactionId: transaction.id,
        advertiserId: advertiser_id,
        amount: amount.toString(),
      },
      success_url: `${baseUrl}/ads-manager?success=3`,
      cancel_url: `${baseUrl}/ads-manager?status=cancelled`,
    })

    if (session.url) {
      // Update transaction with session ID as reference
      await supabase
        .from('ad_wallet_transactions')
        .update({ reference_id: session.id })
        .eq('id', transaction.id)

      return NextResponse.json({ url: session.url })
    }

    return NextResponse.json({ error: 'Failed to create Stripe checkout session' }, { status: 400 })

  } catch (error: any) {
    console.error('Stripe Top-up Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
