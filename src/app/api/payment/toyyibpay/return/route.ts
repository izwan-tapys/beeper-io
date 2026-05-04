import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status_id')
  const billCode = searchParams.get('billcode')

  // Status 1 = Success, 2 = Pending, 3 = Fail
  if (status === '1') {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://beeper-io.vercel.app'}/dashboard?payment=success`)
  } else {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://beeper-io.vercel.app'}/dashboard?payment=failed`)
  }
}
