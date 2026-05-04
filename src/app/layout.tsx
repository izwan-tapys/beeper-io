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
  themeColor: "#020203",
};

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
        {children}
      </body>
    </html>
  );
}
