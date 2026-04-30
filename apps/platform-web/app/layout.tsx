import "./globals.css";
import type { Metadata } from "next";
import { AuthSessionProvider } from "../components/auth/AuthSessionProvider";
import { LanguageProvider } from "../components/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Aply - 글로벌 인재와 파트너를 연결하는 커리어 플랫폼",
  description: "Apply your next move.",
  manifest: "/site.webmanifest",
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
    <html lang="ko">
      <body>
        <LanguageProvider>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
