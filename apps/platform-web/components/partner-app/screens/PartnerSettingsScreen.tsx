"use client";

// 파트너 내 프로필 — 탤런트 설정과 동일한 결의 프로필 허브.
// 기본 정보(히어로) + 채용 현황(스탯) + 회사 + 알림 + 계정 + 로그아웃.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CaretRight, SealCheck, SignOut, PencilSimple, Buildings } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { TCard } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import {
  getMyPartnerOrganization,
  getMyPartnerPositions,
  getMyPartnerApplicants,
  type MyPartnerOrganization,
  type PartnerPosition,
  type PartnerApplicantListItem
} from "../../../lib/member-profile-client";

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-[#0B46E8]" : "bg-[#D7DCE3]"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</p>;
}

// 스탯 카드 — 라벨 + 큰 갯수. 누르면 관련 목록으로. (탤런트 설정과 동일)
function StatCard({ title, count, href }: { title: string; count: number; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-[#EEF1F5] bg-white px-5 py-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-normal text-[#8B95A1]">{title}</p>
        <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
      </div>
      <p className="mt-0.5 text-[24px] font-black tracking-[-0.02em] text-[#191F28]">{count}</p>
    </Link>
  );
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
  const [pushOn, setPushOn] = useState(true);
  const [emailOn, setEmailOn] = useState(true);
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [positions, setPositions] = useState<PartnerPosition[]>([]);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);

  const name = user?.realName || user?.name || "파트너";
  const emailVerified = Boolean(user?.emailVerified);

  useEffect(() => {
    void getMyPartnerOrganization().then(setOrg).catch(() => {});
    void getMyPartnerPositions().then(setPositions).catch(() => {});
    void getMyPartnerApplicants().then(setApplicants).catch(() => {});
  }, []);

  const openCount = positions.filter((p) => p.status === "OPEN").length;
  const appliedCount = applicants.filter((a) => a.status === "APPLIED").length;
  const interviewCount = applicants.filter((a) => a.status === "INTERVIEW").length;

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-12">
        {/* 기본 정보 */}
        <section>
          <SectionHeader title="기본 정보" />
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
              <a
                href={getAccountUrl()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] shadow-[0_2px_10px_rgba(11,18,39,0.06)] transition hover:text-[#0B46E8]"
              >
                <PencilSimple className="h-4 w-4" /> 계정 관리
              </a>
            </div>
          </div>
        </section>

        {/* 채용 현황 — 프로필 카드 바로 아래(탤런트 '내 활동'과 동일 위치) */}
        <section>
          <SectionHeader title="채용 현황" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="게시 중 공고" count={openCount} href={partnerRoutes.positions} />
            <StatCard title="전체 지원자" count={applicants.length} href={partnerRoutes.applicants} />
            <StatCard title="신규 지원자" count={appliedCount} href={partnerRoutes.applicants} />
            <StatCard title="면접 진행" count={interviewCount} href={partnerRoutes.applicants} />
          </div>
        </section>

        {/* 회사 — 회사 프로필(탤런트 '내 커리어'와 동일 위치) */}
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

        {/* 알림 */}
        <section>
          <SectionHeader title="알림" />
          <TCard className="divide-y divide-[#F2F4F6]">
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">지원자 알림</span>
              <Toggle on={pushOn} onChange={setPushOn} label="지원자 알림" />
            </div>
            <div className="flex items-center gap-3 px-5 py-4">
              <span className="flex-1 text-[14.5px] text-[#191F28]">이메일 소식 받기</span>
              <Toggle on={emailOn} onChange={setEmailOn} label="이메일 소식 받기" />
            </div>
          </TCard>
          <Link href={partnerRoutes.notifications} className="mt-3 flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]">
            알림함 열기 <CaretRight className="h-4 w-4" weight="bold" />
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
