import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZomatoPulse — Restaurant Analytics Dashboard",
  description: "Enterprise-grade analytics dashboard for 32 Zomato restaurants. Track sales, customer funnel, and marketing metrics with daily, weekly, and monthly views.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
