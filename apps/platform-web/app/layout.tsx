import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthSessionProvider } from "../components/auth/AuthSessionProvider";
import { LanguageProvider } from "../components/i18n/LanguageProvider";
import { SidebarAds } from "../components/ads/SidebarAds";
import { resolveLocaleFromAcceptLanguage } from "../lib/auth-messages";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "https://staging.aply.global" : "https://aply.global");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Aply — The career platform connecting global talent with Korean partners",
  description: "Apply your next move. Connect with Korean companies hiring international talent.",
  manifest: "/site.webmanifest",
  other: {
    google: "notranslate"
  },
  alternates: {
    canonical: "/",
    languages: {
      ko: "/",
      en: "/",
      "zh-CN": "/",
      vi: "/",
      ja: "/",
      id: "/"
    }
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" }
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const initialLocale = resolveLocaleFromAcceptLanguage(requestHeaders.get("accept-language"));
  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        {adsenseClientId ? (
          <Script
            id="adsense-loader"
            async
            strategy="beforeInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body suppressHydrationWarning>
        <LanguageProvider initialLocale={initialLocale}>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </LanguageProvider>
        <SidebarAds />
      </body>
      {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
    </html>
  );
}
