"use client";

// 파트너 개인 프로필 — 탤런트 프로필(/talent/career/profile)과 동일한 결.
// 계정 기본 정보(이름·이메일·연락처) + 회사 바로가기. 편집은 계정 시스템에서.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SealCheck, PencilSimple, Buildings, CaretRight } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TPageHeader } from "../../talent/ui/primitives";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { getMyPartnerOrganization, type MyPartnerOrganization } from "../../../lib/member-profile-client";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{children}</p>;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span className="w-[72px] shrink-0 text-[13px] text-[#8B95A1]">{label}</span>
      <span className="min-w-0 flex-1 truncate text-[14.5px] text-[#191F28]">{value || "-"}</span>
    </div>
  );
}

export function PartnerProfileScreen() {
  const { user, getAccountUrl } = useAuthSession();
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);

  const name = user?.realName || user?.name || "파트너";
  const emailVerified = Boolean(user?.emailVerified);

  useEffect(() => {
    void getMyPartnerOrganization().then(setOrg).catch(() => {});
  }, []);

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-5" />
      <div className="flex flex-col gap-12">
        <TPageHeader title="프로필" description="내 계정 기본 정보예요. 회사 정보는 회사 프로필에서 관리해요." />

        {/* 기본 정보 */}
        <section>
          <SectionTitle>기본 정보</SectionTitle>
          <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
            <div className="flex items-center gap-4">
              {user?.profileImageUrl ? (
                <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
                  <Image src={user.profileImageUrl} alt="" fill sizes="72px" className="object-cover" unoptimized />
                </span>
              ) : (
                <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[26px] font-black text-[#0B46E8]">{name.slice(0, 1)}</span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-[17px] font-black text-[#0B1227]">{name}</p>
                  {emailVerified ? (
                    <SealCheck className="h-[17px] w-[17px] shrink-0 text-[#0B46E8]" weight="fill" aria-label="이메일 인증됨" />
                  ) : (
                    <span className="shrink-0 rounded-md bg-[#FFF3E6] px-1.5 py-0.5 text-[10.5px] font-bold text-[#E8890C]">인증 안됨</span>
                  )}
                </div>
                {user?.email ? <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{user.email}</p> : null}
              </div>
            </div>

            <div className="mt-4 divide-y divide-[#F2F4F6] border-t border-[#F2F4F6]">
              <InfoRow label="이름" value={name} />
              <InfoRow label="이메일" value={user?.email} />
              <InfoRow label="연락처" value={user?.phoneNumber} />
            </div>

            <a
              href={getAccountUrl()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#F2F4F6] px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] hover:text-[#0B46E8]"
            >
              <PencilSimple className="h-4 w-4" /> 계정에서 정보 수정
            </a>
          </div>
        </section>

        {/* 회사 */}
        <section>
          <SectionTitle>회사</SectionTitle>
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
      </div>
    </PartnerAppShell>
  );
}
