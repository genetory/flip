// 전 페이지 공용 푸터 — 브랜드 + 약관/문의 링크 + 회사 법적 정보(사업자등록번호 등).
// 모든 리뉴얼 화면(랜딩·앱·로그인/가입)에서 동일하게 사용한다.
import Link from "next/link";
import Image from "next/image";
import { FooterContactButton } from "./FooterContactButton";

export function AplyFooter() {
  return (
    <footer className="border-t border-[#EEF1F5] bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Image src="/img_logo.webp" alt="APLY" width={72} height={24} className="h-5 w-auto" />
            <p className="mt-2.5 text-[13px] text-[#8B95A1]">구직자와 기업을 잇는 첫 취업 플랫폼</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-semibold text-[#8B95A1]">
            <Link href="/legal/terms" className="transition hover:text-[#4E5968]">이용약관</Link>
            <Link href="/legal/privacy" className="transition hover:text-[#4E5968]">개인정보처리방침</Link>
            <FooterContactButton />
          </nav>
        </div>
        {/* 회사 법적 정보 */}
        <div className="mt-7 space-y-1 text-[12px] leading-relaxed text-[#B0B8C1]">
          <p>주식회사 플리퍼스 · 대표 김남구 · 개인정보책임관리자 김남구</p>
          <p>사업자등록번호 657-81-02986 · 서울특별시 중구 다동 140 10층</p>
          <p>문의 info@flip-ers.com</p>
          <p className="pt-2">© 2026 APLY. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
