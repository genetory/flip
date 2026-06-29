import "./globals.css";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { AuthSessionProvider } from "../components/auth/AuthSessionProvider";
import { LanguageProvider } from "../components/i18n/LanguageProvider";
import { SidebarAds } from "../components/ads/SidebarAds";
import { ConsentInit } from "../components/consent/ConsentInit";
import { CookieConsentBanner } from "../components/consent/CookieConsentBanner";
import { ErrorReporter } from "../components/errors/ErrorReporter";
import { ToastProvider } from "../components/toast/ToastProvider";
import { resolveLocaleFromAcceptLanguage } from "../lib/auth-messages";
import { ADS_ENABLED } from "../lib/ads-config";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
const gtmId = process.env.NEXT_PUBLIC_GTM_ID?.trim() || "GTM-K5B974S4";
// Gated by ADS_ENABLED so no AdSense loader is emitted while the domain is
// under content review (see lib/ads-config.ts).
const adsenseClientId = ADS_ENABLED ? process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() || "" : "";
const kakaoJsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() || "";
const googleSiteVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || "";
const naverSiteVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION?.trim() || "";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NEXT_PUBLIC_API_URL?.includes("staging") ? "https://staging.aply.global" : "https://aply.global");

const siteTitle = "Aply — The career platform connecting global talent with Korean partners";
const siteDescription = "Apply your next move. Connect with Korean companies hiring international talent.";

// 모바일(특히 iOS Safari) 에서 올바른 device-width 스케일을 보장. 사용자 줌은
// 접근성을 위해 막지 않는다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

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
  verification: {
    ...(googleSiteVerification ? { google: googleSiteVerification } : {}),
    ...(naverSiteVerification
      ? { other: { "naver-site-verification": naverSiteVerification } }
      : {})
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
        url: "/img_meta_home.webp",
        width: 1200,
        height: 630,
        alt: "Aply — The career platform connecting global talent with Korean partners"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/img_meta_home.webp"]
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

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Aply",
    alternateName: ["Aply Global", "어플라이"],
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/positions?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Aply",
    url: siteUrl,
    logo: `${siteUrl}/img_logo.webp`,
    description: siteDescription
  }
];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const requestHeaders = await headers();
  const initialLocale = resolveLocaleFromAcceptLanguage(requestHeaders.get("accept-language"));
  return (
    <html lang={initialLocale} suppressHydrationWarning>
      <head>
        {/* 모바일 브라우저 자동 번역(구글 번역 등)이 DOM 텍스트 노드를 바꿔치기하면
            React 가 그 노드를 제거/삽입하려다 "removeChild: not a child" 로 크래시한다.
            노드가 실제 자식이 아니면 안전하게 무시하도록 가드(잘 알려진 표준 패치).
            하이드레이션보다 먼저 실행되도록 head 최상단 inline script 로 둔다. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){if(typeof Node!=="function"||!Node.prototype)return;var rc=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c&&c.parentNode!==this){return c;}return rc.apply(this,arguments);};var ib=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,r){if(r&&r.parentNode!==this){return n;}return ib.apply(this,arguments);};})();'
          }}
        />
        {/* Must run BEFORE any GA / AdSense script so consent defaults
            (denied for ads + analytics) are set on the very first beacon. */}
        <ConsentInit />
        {/* One <script> per JSON-LD object (not a single array) so consumers
            that read parsed["@context"] don't choke on an array root. */}
        {siteJsonLd.map((entry, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(entry) }}
          />
        ))}
        {adsenseClientId ? (
          <Script
            id="adsense-loader"
            async
            strategy="beforeInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
            crossOrigin="anonymous"
          />
        ) : null}
        {kakaoJsKey ? (
          <>
            <Script
              id="kakao-sdk"
              src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
              integrity="sha384-DKYJZ8NLiK8MN4/C5P2dtSmLQ4KwPaoqAfyA/DfmEc1VDxu4yyC7wy6K1Hs90nka"
              crossOrigin="anonymous"
              strategy="afterInteractive"
            />
            <Script id="kakao-sdk-init" strategy="afterInteractive">
              {`if (window.Kakao && !window.Kakao.isInitialized()) { window.Kakao.init('${kakaoJsKey}'); }`}
            </Script>
          </>
        ) : null}
      </head>
      <body suppressHydrationWarning>
        {/* Google Tag Manager (noscript fallback) */}
        {gtmId ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        ) : null}
        <LanguageProvider initialLocale={initialLocale}>
          <ToastProvider>
            <AuthSessionProvider>{children}</AuthSessionProvider>
            <CookieConsentBanner />
          </ToastProvider>
        </LanguageProvider>
        <SidebarAds />
        <ErrorReporter />
      </body>
      {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
      {gaMeasurementId ? <GoogleAnalytics gaId={gaMeasurementId} /> : null}
    </html>
  );
}
