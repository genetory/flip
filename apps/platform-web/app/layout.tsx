import "./globals.css";
import type { Metadata } from "next";
import { AuthSessionProvider } from "../components/auth/AuthSessionProvider";
import { LanguageProvider } from "../components/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Aply — The career platform connecting global talent with Korean partners",
  description: "Apply your next move. Connect with Korean companies hiring international talent.",
  manifest: "/site.webmanifest",
  other: {
    google: "notranslate"
  },
  alternates: {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <LanguageProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
