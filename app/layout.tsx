import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DM_Serif_Display } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getTenantConfig } from "@/lib/services/tenant.service";
import { TopbarWrapper } from "@/components/layout/topbar-wrapper";
import { FooterWrapper } from "@/components/layout/footer-wrapper";
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

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantConfig();
  return {
    title: tenant.brandName,
    description: tenant.description || tenant.tagline || "",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenantConfig();

  const themeVars = {
    "--primary": tenant.colorPrimary,
    "--primary-foreground": tenant.colorPrimaryForeground,
    "--accent": tenant.colorAccent,
    "--background": tenant.colorBackground,
    "--foreground": tenant.colorForeground,
    "--border": tenant.colorBorder,
    "--input": tenant.colorBorder,
    "--ring": tenant.colorPrimary,
    "--color-sand": tenant.colorSand,
    "--color-success": tenant.colorSuccess,
    "--chart-1": tenant.colorPrimary,
    "--sidebar-primary": tenant.colorPrimary,
    "--sidebar-ring": tenant.colorPrimary,
  } as React.CSSProperties;

  return (
    <html lang="da" style={themeVars}>
      <body
        className={`${inter.variable} ${dmSerif.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <TopbarWrapper />
        <main className="min-h-screen">
          {children}
        </main>
        <FooterWrapper />
        <Toaster />
      </body>
    </html>
  );
}
