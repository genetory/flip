"use client";

// 파트너 내 프로필 — 파트너도 사용자. 개인 계정 요약 + 회사 프로필 바로가기 + 계정 + 로그아웃.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CaretRight, SealCheck, SignOut, Buildings } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { TCard } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { getMyPartnerOrganization, type MyPartnerOrganization } from "../../../lib/member-profile-client";

function SectionHeader({ title }: { title: string }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</p>;
}

function Item({ label, href, external }: { label: string; href: string; external?: boolean }) {
  const inner = (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="flex-1 text-[14.5px] text-[#191F28]">{label}</span>
      <CaretRight className="h-4 w-4 text-[#C4CAD2]" />
    </div>
  );
  return external ? (
    <a href={href} className="block transition hover:bg-[#F6F8FB]">{inner}</a>
  ) : (
    <Link href={href} className="block transition hover:bg-[#F6F8FB]">{inner}</Link>
  );
}

export function PartnerSettingsScreen() {
  const { user, logout, getAccountUrl } = useAuthSession();
  const name = user?.realName || user?.name || "파트너";
  const emailVerified = Boolean(user?.emailVerified);
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);

  useEffect(() => {
    void getMyPartnerOrganization()
      .then(setOrg)
      .catch(() => {});
  }, []);

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-8">
        {/* 기본 정보 */}
        <section>
          <SectionHeader title="내 프로필" />
          <div className="rounded-3xl bg-[#F5F8FF] p-6">
            <div className="flex items-center gap-4">
              {user?.profileImageUrl ? (
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(11,70,232,0.12)]">
                  <Image src={user.profileImageUrl} alt="" fill sizes="64px" className="object-cover" unoptimized />
                </span>
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-[24px] font-black text-[#0B46E8] shadow-[0_4px_16px_rgba(11,70,232,0.12)]">
                  {name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{name}</p>
                  {emailVerified ? (
                    <SealCheck className="h-[18px] w-[18px] shrink-0 text-[#0B46E8]" weight="fill" aria-label="이메일 인증됨" />
                  ) : (
                    <span className="shrink-0 rounded-md bg-[#FFF3E6] px-1.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">인증 안됨</span>
                  )}
                </div>
                {user?.email ? <p className="mt-0.5 truncate text-[13px] text-[#8B95A1]">{user.email}</p> : null}
              </div>
            </div>
          </div>
        </section>

        {/* 회사 */}
        <section>
          <SectionHeader title="회사" />
          <Link href={partnerRoutes.company} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-5 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
            {org?.companyLogoImageData ? (
              <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-[#F2F4F6]">
                <Image src={org.companyLogoImageData} alt="" fill sizes="44px" className="object-cover" unoptimized />
              </span>
            ) : (
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Buildings className="h-5 w-5" weight="fill" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-bold text-[#191F28]">{org?.name || "회사 프로필"}</p>
              <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">지원자에게 보이는 우리 회사 정보를 관리해요.</p>
            </div>
            <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
          </Link>
        </section>

        {/* 계정 */}
        <section>
          <SectionHeader title="계정" />
          <TCard className="divide-y divide-[#F2F4F6]">
            <Item label="계정 정보 관리" href={getAccountUrl()} external />
            <Item label="개인정보처리방침" href="/legal/privacy" />
            <Item label="이용약관" href="/legal/terms" />
          </TCard>
        </section>

        <button
          type="button"
          onClick={() => void logout()}
          className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white py-4 text-[14px] font-semibold text-[#F04452] transition hover:bg-[#FFF5F5]"
        >
          <SignOut className="h-[18px] w-[18px]" /> 로그아웃
        </button>
      </div>
    </PartnerAppShell>
  );
}
