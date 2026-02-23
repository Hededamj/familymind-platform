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
import { getSiteSettings } from '@/lib/services/settings.service'
import { unstable_cache } from 'next/cache'
import "./globals.css";

const getCachedAnalyticsSettings = unstable_cache(
  () => getSiteSettings(['ga4_measurement_id', 'meta_pixel_id']),
  ['analytics-settings'],
  { revalidate: 300 }
)

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analytics = await getCachedAnalyticsSettings()

  return (
    <html lang="da">
      <body
        className={`${inter.variable} ${dmSerif.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ConsentProvider>
          <AnalyticsScripts ga4Id={analytics.ga4_measurement_id} metaPixelId={analytics.meta_pixel_id} />
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
