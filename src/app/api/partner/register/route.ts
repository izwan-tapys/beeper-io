import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const {
      email,
      password,
      referralCode,
      bankName,
      bankAccountNo,
      bankAccountName,
      icNumber,
      companyRegNo,
      fullAddress,
    } = await request.json()

    if (!email || !password || !referralCode || !bankName || !bankAccountNo || !bankAccountName || !icNumber) {
      return NextResponse.json({ error: 'Sila isi semua maklumat wajib.' }, { status: 400 })
    }

    const cleanRefCode = referralCode.trim().toUpperCase()

    // Initialize Supabase Admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Check if referral code is already taken
    const { data: existingPartner } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('referral_code', cleanRefCode)
      .maybeSingle()

    if (existingPartner) {
      return NextResponse.json({ error: `Kod rujukan "${cleanRefCode}" telah digunakan. Sila pilih kod lain.` }, { status: 400 })
    }

    // 2. Create the auth user with email confirmed automatically
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (signUpError || !userData?.user) {
      return NextResponse.json({ error: signUpError?.message || 'Gagal mendaftar pengguna.' }, { status: 400 })
    }

    const userId = userData.user.id

    // 3. Insert partner details
    const { error: insertError } = await supabaseAdmin
      .from('partners')
      .insert({
        user_id: userId,
        email: email.trim().toLowerCase(),
        referral_code: cleanRefCode,
        bank_name: bankName,
        bank_account_no: bankAccountNo,
        bank_account_name: bankAccountName,
        ic_number: icNumber,
        company_reg_no: companyRegNo || null,
        full_address: fullAddress || '',
        is_active: false // Awaiting approval
      })

    if (insertError) {
      // Rollback: delete the created auth user
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: `Gagal mencipta profil partner: ${insertError.message}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, userId })
  } catch (error: any) {
    console.error('[Partner Register API] Error:', error)
    return NextResponse.json({ error: 'Ralat pelayan dalaman.' }, { status: 500 })
  }
}
