import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { amount, email, name, phone } = await request.json()

    // VULN-009 Fix: Validate amount bounds — must be a positive number between RM1 and RM10,000
    if (!amount || typeof amount !== 'number' || !isFinite(amount) || amount < 1 || amount > 10000) {
      return NextResponse.json({ error: 'Invalid amount. Must be between RM1 and RM10,000.' }, { status: 400 })
    }

    // VULN-004 Fix: Derive advertiser_id from the authenticated session — never trust client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up the advertiser profile from the authenticated user
    const { data: profile, error: profileError } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()
    if (profileError || !profile) {
      return NextResponse.json({ error: 'Advertiser profile not found' }, { status: 404 })
    }
    const advertiser_id = profile.id

    // supabase client already created above

    // Create a pending transaction
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

    if (txError) {
      console.error('Error creating pending transaction:', txError)
      return NextResponse.json({ error: txError.message }, { status: 500 })
    }

    // Call ToyyibPay API
    const toyyibpayUrl = process.env.TOYYIBPAY_API_URL || 'https://dev.toyyibpay.com/index.php/api/createBill'
    const secretKey = process.env.TOYYIBPAY_SECRET_KEY
    const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE

    // VULN-012 Fix: Never simulate payment success in production
    if (!secretKey || !categoryCode) {
      const isDev = process.env.NODE_ENV === 'development'
      if (isDev) {
        console.warn('[DEV ONLY] ToyyibPay credentials not found. Simulating success.')
        return NextResponse.json({ 
          url: `/ads-manager?success=3&billcode=simulated_${transaction.id}`,
          billCode: `simulated_${transaction.id}`
        })
      }
      console.error('[ToyyibPay] TOYYIBPAY_SECRET_KEY or TOYYIBPAY_CATEGORY_CODE not configured')
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 503 })
    }

    // Convert RM to cents
    const amountInCents = Math.round(amount * 100)
    
    // VULN-006 Fix: Use server-configured SITE_URL — never trust Host header
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beepme.pro'

    const formData = new URLSearchParams()
    formData.append('userSecretKey', secretKey)
    formData.append('categoryCode', categoryCode)
    formData.append('billName', 'BeepMe Ad Wallet Top-up')
    formData.append('billDescription', `Top-up for advertiser ${advertiser_id}`)
    formData.append('billPriceSetting', '1')
    formData.append('billPayorInfo', '1')
    formData.append('billAmount', amountInCents.toString())
    formData.append('billReturnUrl', `${baseUrl}/ads-manager?success=3`)
    formData.append('billCallbackUrl', `${baseUrl}/api/toyyibpay/callback`)
    formData.append('billExternalReferenceNo', transaction.id)
    formData.append('billTo', name || 'Advertiser')
    formData.append('billEmail', email || 'advertiser@beepme.pro')
    formData.append('billPhone', phone || '0123456789')
    formData.append('billSplitPayment', '0')
    formData.append('billSplitPaymentArgs', '')
    formData.append('billPaymentChannel', '0')
    formData.append('billContentEmail', 'Thank you for topping up your BeepMe Ad Wallet.')
    formData.append('billChargeToCustomer', '1')

    const response = await fetch(toyyibpayUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    })

    const data = await response.json()

    if (!response.ok || !data || data.length === 0) {
      throw new Error('Failed to create ToyyibPay bill')
    }

    const billCode = data[0].BillCode
    const paymentUrl = `${process.env.TOYYIBPAY_API_URL ? process.env.TOYYIBPAY_API_URL.replace('/api/createBill', '') : 'https://dev.toyyibpay.com'}/${billCode}`

    // Update transaction with billCode as reference
    await supabase.from('ad_wallet_transactions').update({ reference_id: billCode }).eq('id', transaction.id)

    return NextResponse.json({ url: paymentUrl, billCode })
  } catch (err: any) {
    console.error('ToyyibPay Create Bill Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
