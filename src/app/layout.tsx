import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beeper — Virtual Pager for F&B",
  description: "Replace physical pagers with a frictionless, web-based real-time notification system for your restaurant.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
