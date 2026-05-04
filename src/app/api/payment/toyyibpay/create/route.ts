import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, planName } = await request.json()

    // ToyyibPay API Details
    const userSecretKey = process.env.TOYYIBPAY_USER_SECRET_KEY
    const categoryCode = process.env.TOYYIBPAY_CATEGORY_CODE
    
    if (!userSecretKey || !categoryCode) {
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 500 })
    }

    // Prepare Bill Data
    const formData = new URLSearchParams()
    formData.append('userSecretKey', userSecretKey)
    formData.append('categoryCode', categoryCode)
    formData.append('billName', `Beeper ${planName} Subscription`)
    formData.append('billDescription', `Subscription for merchant ${user.email}`)
    formData.append('billPriceSetting', '1')
    formData.append('billPayorInfo', '1')
    formData.append('billAmount', (amount * 100).toString()) // Convert to cents
    formData.append('billReturnUrl', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://beeper-io.vercel.app'}/api/payment/toyyibpay/return`)
    formData.append('billCallbackUrl', `${process.env.NEXT_PUBLIC_SITE_URL || 'https://beeper-io.vercel.app'}/api/payment/toyyibpay/callback`)
    formData.append('billExternalReferenceNo', user.id) // Use user ID as reference
    formData.append('billTo', user.email || '')
    formData.append('billSmsTo', '')
    formData.append('billEmail', user.email || '')
    formData.append('billPhone', '')
    formData.append('billPaymentChannel', '0') // 0 for FPX
    formData.append('billChargeToCustomer', '1') // RM1.00 charged to customer

    const response = await fetch('https://toyyibpay.com/index.php/api/createBill', {
      method: 'POST',
      body: formData
    })

    const result = await response.json()

    if (result && result[0] && result[0].BillCode) {
      const billCode = result[0].BillCode
      return NextResponse.json({ url: `https://toyyibpay.com/${billCode}` })
    }

    return NextResponse.json({ error: 'Failed to create bill', detail: result }, { status: 400 })

  } catch (error: any) {
    console.error('ToyyibPay Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
