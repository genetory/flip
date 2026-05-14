import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AuthSessionProvider } from "../components/auth/AuthSessionProvider";
import { LanguageProvider } from "../components/i18n/LanguageProvider";
import { SidebarAds } from "../components/ads/SidebarAds";
import { ConsentInit } from "../components/consent/ConsentInit";
import { CookieConsentBanner } from "../components/consent/CookieConsentBanner";
import { ErrorReporter } from "../components/errors/ErrorReporter";
import { ToastProvider } from "../components/toast/ToastProvider";
import { resolveLocaleFromAcceptLanguage } from "../lib/auth-messages";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "https://staging.aply.global" : "https://aply.global");

const siteTitle = "Aply — The career platform connecting global talent with Korean partners";
const siteDescription = "Apply your next move. Connect with Korean companies hiring international talent.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Aply"
  },
  description: siteDescription,
  applicationName: "Aply",
  manifest: "/site.webmanifest",
  other: {
    google: "notranslate"
  },
  // Single canonical URL. The previous per-locale alternates all pointed to
  // "/" which is what triggered Google Search Console's "hreflang return tag"
  // warnings — until we ship real per-locale URLs we keep one canonical.
  alternates: {
    canonical: "/"
  },
  openGraph: {
    type: "website",
    siteName: "Aply",
    title: siteTitle,
    description: siteDescription,
    url: "/",
    locale: "en_US",
    images: [
      {
        url: "/img_home_hero.webp",
        width: 1200,
        height: 630,
        alt: "Aply"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/img_home_hero.webp"]
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
        {/* Must run BEFORE any GA / AdSense script so consent defaults
            (denied for ads + analytics) are set on the very first beacon. */}
        <ConsentInit />
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
          <ToastProvider>
            <AuthSessionProvider>{children}</AuthSessionProvider>
            <CookieConsentBanner />
          </ToastProvider>
        </LanguageProvider>
        <SidebarAds />
        <ErrorReporter />
      </body>
      {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
    </html>
  );
}
