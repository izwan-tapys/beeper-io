import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { advertiser_id, amount, email, name, phone } = await request.json()

    if (!advertiser_id || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

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

    if (!secretKey || !categoryCode) {
      console.warn('ToyyibPay credentials not found. Simulating success for testing.')
      // Simulate success for local testing
      return NextResponse.json({ 
        url: `/admin?payment=success&billcode=simulated_${transaction.id}`,
        billCode: `simulated_${transaction.id}`
      })
    }

    // Convert RM to cents
    const amountInCents = Math.round(amount * 100)
    
    // Get base URL for return/callback
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const host = request.headers.get('host') || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`

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
