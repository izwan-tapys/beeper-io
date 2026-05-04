import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beepme — Virtual Pager for F&B",
  description: "Replace physical pagers with a frictionless, web-based real-time notification system for your restaurant.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Beepme",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#0a0b0f" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
