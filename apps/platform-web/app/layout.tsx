import "./globals.css";
import type { Metadata } from "next";
import { AuthSessionProvider } from "../components/auth/AuthSessionProvider";
import { LanguageProvider } from "../components/i18n/LanguageProvider";

export const metadata: Metadata = {
  title: "Flip - 글로벌 인재와 파트너를 연결하는 커리어 플랫폼",
  description: "파트너는 검증된 인재를 찾고, 학생은 기회를 준비합니다."
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
