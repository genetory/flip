"use client";

// 소셜 로그인 버튼 — 기존 로그인과 동일한 백엔드 시작 엔드포인트를 사용(로직 동일).
import { useLanguage } from "../../i18n/LanguageProvider";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function TalentSocialButtons() {
  const { locale } = useLanguage();
  const t = (ko: string, en: string, zh: string, vi: string, ja: string, id: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;

  return (
    <div className="space-y-2.5">
      <a
        href={`${API}/auth/naver/start`}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] text-[15px] font-bold text-white transition hover:bg-[#02b551]"
      >
        <span aria-hidden className="font-black">N</span>
        {t("네이버로 계속하기", "Continue with Naver", "使用 Naver 继续", "Tiếp tục với Naver", "Naverで続ける", "Lanjut dengan Naver")}
      </a>
      <a
        href={`${API}/auth/kakao/start`}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[15px] font-bold text-[#191919] transition hover:bg-[#f5dd00]"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78L5.5 21.5c-.1.34.27.62.57.43L10.5 19c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
        </svg>
        {t("카카오로 계속하기", "Continue with Kakao", "使用 Kakao 继续", "Tiếp tục với Kakao", "Kakaoで続ける", "Lanjut dengan Kakao")}
      </a>
      <a
        href={`${API}/auth/google/start`}
        className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl border border-[#E5E8EB] bg-white text-[15px] font-bold text-[#191F28] transition hover:bg-[#F6F8FB]"
      >
        <svg aria-hidden className="h-4 w-4" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
        </svg>
        {t("구글로 계속하기", "Continue with Google", "使用 Google 继续", "Tiếp tục với Google", "Googleで続ける", "Lanjut dengan Google")}
      </a>
    </div>
  );
}

export function TalentOrDivider() {
  const { locale } = useLanguage();
  const label = locale === "ko" ? "또는" : locale === "zh-CN" ? "或" : locale === "vi" ? "hoặc" : locale === "ja" ? "または" : locale === "id" ? "atau" : "or";
  return (
    <div className="my-6 flex items-center gap-3">
      <span className="h-px flex-1 bg-[#EEF1F5]" />
      <span className="text-[12.5px] text-[#B0B8C1]">{label}</span>
      <span className="h-px flex-1 bg-[#EEF1F5]" />
    </div>
  );
}
