"use client";

import Link from "next/link";
import { X } from "@phosphor-icons/react";
import { talentRoutes, useTalentNav, useTalentBrandCta, useTalentLanding } from "../../lib/talent/landing-content";
import { talentAppRoutes } from "../../lib/talent/app-nav";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { TalentButton } from "./TalentButton";
import { useLockBodyScroll } from "../../lib/talent/useLockBodyScroll";
import { usePlatformT } from "../../lib/i18n";

// 모바일 내비 패널 — 햄버거로 열림. 메인 메뉴 + (비로그인)로그인·무료로 시작하기 / (로그인)내 홈으로 + (보조) Partner 링크.

export function TalentMobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAuthenticated } = useAuthSession();
  const isTalentUser = isAuthenticated && (user?.role === "STUDENT" || user?.role === "OPERATOR");
  const t = usePlatformT();
  const talentNav = useTalentNav();
  const brandCta = useTalentBrandCta();
  const { footer } = useTalentLanding();
  useLockBodyScroll(open);
  if (!open) return null;
  return (
    <div className="lg:hidden">
      {/* 배경 딤 */}
      <button type="button" aria-label={t("메뉴 닫기", "Close menu", "关闭菜单", "Đóng menu", "メニューを閉じる", "Tutup menu")} onClick={onClose} className="fixed inset-0 top-14 z-40 bg-black/20" />
      <nav aria-label={t("모바일 메뉴", "Mobile menu", "移动菜单", "Menu di động", "モバイルメニュー", "Menu seluler")} className="fixed inset-x-0 top-14 z-50 border-b border-[#EEF1F5] bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#8B95A1]">{t("메뉴", "Menu", "菜单", "Menu", "メニュー", "Menu")}</span>
          <button type="button" aria-label={t("메뉴 닫기", "Close menu", "关闭菜单", "Đóng menu", "メニューを閉じる", "Tutup menu")} onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul className="flex flex-col">
          {talentNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={onClose} className="block rounded-lg px-2 py-3 text-[15px] font-semibold text-[#191F28] transition hover:bg-[#F6F8FB]">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-col gap-2">
          {isTalentUser ? (
            <TalentButton href={talentAppRoutes.career} variant="primary" size="md" fullWidth aria-label={t("내 커리어", "My Career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier Saya")}>
              {t("내 커리어", "My Career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier Saya")}
            </TalentButton>
          ) : (
            <TalentButton href={talentRoutes.login} variant="primary" size="md" fullWidth aria-label={brandCta.login}>
              {brandCta.login}
            </TalentButton>
          )}
        </div>
        <Link href={footer.partnerLink.href} onClick={onClose} className="mt-4 block text-center text-[12.5px] text-[#8B95A1] underline hover:text-[#4E5968]">
          {footer.partnerLink.label}
        </Link>
      </nav>
    </div>
  );
}
