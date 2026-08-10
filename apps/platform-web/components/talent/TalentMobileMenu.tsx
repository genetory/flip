"use client";

import Link from "next/link";
import { X } from "@phosphor-icons/react";
import { talentNav, talentBrand, talentRoutes, footerContent } from "../../lib/talent/landing-content";
import { talentAppRoutes } from "../../lib/talent/app-nav";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { TalentButton } from "./TalentButton";
import { useLockBodyScroll } from "../../lib/talent/useLockBodyScroll";

// 모바일 내비 패널 — 햄버거로 열림. 메인 메뉴 + (비로그인)로그인·무료로 시작하기 / (로그인)내 홈으로 + (보조) Partner 링크.

export function TalentMobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, isAuthenticated } = useAuthSession();
  const isTalentUser = isAuthenticated && (user?.role === "STUDENT" || user?.role === "OPERATOR");
  useLockBodyScroll(open);
  if (!open) return null;
  return (
    <div className="lg:hidden">
      {/* 배경 딤 */}
      <button type="button" aria-label="메뉴 닫기" onClick={onClose} className="fixed inset-0 top-14 z-40 bg-black/20" />
      <nav aria-label="모바일 메뉴" className="fixed inset-x-0 top-14 z-50 border-b border-[#EEF1F5] bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-bold text-[#8B95A1]">메뉴</span>
          <button type="button" aria-label="메뉴 닫기" onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
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
            <TalentButton href={talentAppRoutes.career} variant="primary" size="md" fullWidth aria-label="내 커리어">
              내 커리어
            </TalentButton>
          ) : (
            <TalentButton href={talentRoutes.login} variant="primary" size="md" fullWidth aria-label={talentBrand.cta.login}>
              {talentBrand.cta.login}
            </TalentButton>
          )}
        </div>
        <Link href={footerContent.partnerLink.href} onClick={onClose} className="mt-4 block text-center text-[12.5px] text-[#8B95A1] underline hover:text-[#4E5968]">
          {footerContent.partnerLink.label}
        </Link>
      </nav>
    </div>
  );
}
