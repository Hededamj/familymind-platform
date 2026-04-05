import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { DM_Serif_Display } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { TopbarWrapper } from "@/components/layout/topbar-wrapper";
import { FooterWrapper } from "@/components/layout/footer-wrapper";
import { ConsentProvider } from '@/components/consent/consent-provider'
import { AnalyticsScripts } from '@/components/consent/analytics-scripts'
import { CookieBanner } from '@/components/consent/cookie-banner'
import { CookieModal } from '@/components/consent/cookie-modal'
import { getSiteSettings } from '@/lib/services/settings.service'
import { getTenantConfig } from '@/lib/services/tenant.service'
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1A1A1A',
}

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantConfig()
  return {
    title: tenant.brandName,
    description: tenant.description || tenant.tagline || '',
    manifest: '/manifest.json',
    icons: {
      apple: '/images/icon-512.png',
    },
    other: {
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'apple-mobile-web-app-title': tenant.brandName,
      'mobile-web-app-capable': 'yes',
    },
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analytics = await getCachedAnalyticsSettings()
  const tenant = await getTenantConfig()

  const themeVars = {
    '--primary': tenant.colorPrimary,
    '--primary-foreground': tenant.colorPrimaryForeground,
    '--accent': tenant.colorAccent,
    '--background': tenant.colorBackground,
    '--foreground': tenant.colorForeground,
    '--border': tenant.colorBorder,
    '--input': tenant.colorBorder,
    '--ring': tenant.colorPrimary,
    '--color-sand': tenant.colorSand,
    '--color-success': tenant.colorSuccess,
    '--chart-1': tenant.colorPrimary,
    '--sidebar-primary': tenant.colorPrimary,
    '--sidebar-ring': tenant.colorPrimary,
  } as React.CSSProperties

  return (
    <html lang="da" style={themeVars}>
      <body
        className={`${inter.variable} ${dmSerif.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ConsentProvider>
          <AnalyticsScripts ga4Id={analytics.ga4_measurement_id} metaPixelId={analytics.meta_pixel_id} />
          <TopbarWrapper />
          <main className="min-h-screen">
            {children}
          </main>
          <FooterWrapper />
          <Toaster />
          <CookieBanner />
          <CookieModal />
        </ConsentProvider>
      </body>
    </html>
  );
}
