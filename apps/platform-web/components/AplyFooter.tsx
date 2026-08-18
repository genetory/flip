"use client";

// 전 페이지 공용 푸터 — 브랜드 + 약관/문의 링크 + 회사 법적 정보(사업자등록번호 등).
// 모든 리뉴얼 화면(랜딩·앱·로그인/가입)에서 동일하게 사용한다.
import Link from "next/link";
import Image from "next/image";
import { FooterContactButton } from "./FooterContactButton";
import { usePlatformT } from "../lib/i18n";

export function AplyFooter() {
  const t = usePlatformT();
  return (
    <footer className="border-t border-[#EEF1F5] bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-5xl px-5 py-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Image src="/img_logo.webp" alt="APLY" width={72} height={24} className="h-5 w-auto" />
            <p className="mt-2.5 text-[13px] text-[#8B95A1]">{t("구직자와 기업을 잇는 첫 취업 플랫폼", "The first-job platform connecting talent and companies", "连接求职者与企业的首个求职平台", "Nền tảng việc làm đầu tiên kết nối người tìm việc và doanh nghiệp", "求職者と企業をつなぐはじめての就職プラットフォーム", "Platform kerja pertama yang menghubungkan pencari kerja dan perusahaan")}</p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] font-semibold text-[#8B95A1]">
            <Link href="/legal/terms" className="transition hover:text-[#4E5968]">{t("이용약관", "Terms", "使用条款", "Điều khoản", "利用規約", "Ketentuan")}</Link>
            <Link href="/legal/privacy" className="transition hover:text-[#4E5968]">{t("개인정보처리방침", "Privacy Policy", "隐私政策", "Chính sách bảo mật", "プライバシーポリシー", "Kebijakan Privasi")}</Link>
            <FooterContactButton />
          </nav>
        </div>
        {/* 회사 법적 정보 — 등록 상호·주소·번호는 공식 정보라 유지, 라벨만 언어별로 */}
        <div className="mt-7 space-y-1 text-[12px] leading-relaxed text-[#B0B8C1]">
          <p>{t("주식회사 플리퍼스 · 대표 김남구 · 개인정보책임관리자 김남구", "Flippers Inc. · CEO Kim Namgu · Privacy Officer Kim Namgu", "Flippers Inc. · 代表 Kim Namgu · 个人信息负责人 Kim Namgu", "Flippers Inc. · CEO Kim Namgu · Phụ trách bảo mật Kim Namgu", "Flippers株式会社 · 代表 Kim Namgu · 個人情報責任者 Kim Namgu", "Flippers Inc. · CEO Kim Namgu · Petugas Privasi Kim Namgu")}</p>
          <p>{t("사업자등록번호 657-81-02986 · 서울특별시 중구 다동 140 10층", "Business Reg. No. 657-81-02986 · 10F, 140 Da-dong, Jung-gu, Seoul", "营业执照号 657-81-02986 · 首尔特别市中区茶洞140 10层", "MST 657-81-02986 · Tầng 10, 140 Da-dong, Jung-gu, Seoul", "事業者登録番号 657-81-02986 · ソウル特別市中区茶洞140 10階", "No. Registrasi 657-81-02986 · Lt. 10, 140 Da-dong, Jung-gu, Seoul")}</p>
          <p>{t("문의 info@flip-ers.com", "Contact info@flip-ers.com", "咨询 info@flip-ers.com", "Liên hệ info@flip-ers.com", "お問い合わせ info@flip-ers.com", "Kontak info@flip-ers.com")}</p>
          <p className="pt-2">© 2026 APLY. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
