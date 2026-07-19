import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#020203",
};

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
  manifest: "/manifest.json",
  alternates: {
    canonical: "https://beepme.pro",
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Beepme",
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
  verification: {
    google: "YAXKSHGrEKiewnsOObaAn6QRfxeMGLGe6gSabICeQ7c",
  },
};

import { LanguageProvider } from "@/contexts/LanguageContext";
import { Analytics } from "@vercel/analytics/next";
import { PageViewTracker } from "@/components/PageViewTracker";
import { Suspense } from "react";
import { ReferralTracker } from "@/components/ReferralTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Suspense fallback={null}>
          <ReferralTracker />
        </Suspense>
        <PageViewTracker />
        <Analytics />
      </body>
    </html>
  );
}
