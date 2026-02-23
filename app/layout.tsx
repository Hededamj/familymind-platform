import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DM_Serif_Display } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Topbar } from "@/components/layout/topbar";
import { Footer } from "@/components/layout/footer";
import { ConsentProvider } from '@/components/consent/consent-provider'
import { AnalyticsScripts } from '@/components/consent/analytics-scripts'
import { CookieBanner } from '@/components/consent/cookie-banner'
import { CookieModal } from '@/components/consent/cookie-modal'
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-serif",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FamilyMind",
  description: "Din strukturerede forældreguide — evidensbaseret viden og praktiske værktøjer til hele familien.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body
        className={`${inter.variable} ${dmSerif.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ConsentProvider>
          <AnalyticsScripts />
          <Topbar />
          <main className="min-h-screen">
            {children}
          </main>
          <Footer />
          <Toaster />
          <CookieBanner />
          <CookieModal />
        </ConsentProvider>
      </body>
    </html>
  );
}
