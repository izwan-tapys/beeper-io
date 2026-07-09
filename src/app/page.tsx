import LandingPageClient from './page-client'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Beepme — Virtual Pager for F&B & Restaurants in Malaysia",
  description: "Replace expensive physical pagers with a free, contactless QR-code virtual pager system for restaurants and food courts in Malaysia. No hardware needed.",
  keywords: [
    "virtual pager Malaysia",
    "QR waiter pager",
    "F&B queue system",
    "restaurant notification system Malaysia",
    "digital pager system",
    "Beepme",
    "sistem giliran restoran",
    "web-based pager",
    "loyverse integration Malaysia",
    "sistem panggilan makanan QR"
  ],
  alternates: {
    canonical: "https://beepme.pro",
  },
  openGraph: {
    title: "Beepme — Virtual Pager for F&B & Restaurants in Malaysia",
    description: "Replace expensive physical pagers with a free, contactless QR-code virtual pager system. No hardware needed.",
    url: "https://beepme.pro",
    siteName: "Beepme",
    images: [
      {
        url: "https://beepme.pro/mockup.png",
        width: 1200,
        height: 630,
        alt: "Beepme Virtual Pager Interface Mockup",
      },
    ],
    locale: "en_MY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Beepme — Virtual Pager for F&B & Restaurants in Malaysia",
    description: "Replace expensive physical pagers with a free, contactless QR-code virtual pager system.",
    images: ["https://beepme.pro/mockup.png"],
  },
}

export default function Page() {
  return <LandingPageClient />
}
