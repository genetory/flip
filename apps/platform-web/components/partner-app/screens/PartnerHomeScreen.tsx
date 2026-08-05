"use client";

// 파트너 홈 — 대시보드. 공고·지원자 요약 + 최근 지원자 + 빠른 작업.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CaretRight, Plus } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_APPLICANT_STATUS } from "../../../lib/partner/labels";
import {
  getMyPartnerOrganization,
  getMyPartnerPositions,
  getMyPartnerApplicants,
  type MyPartnerOrganization,
  type PartnerPosition,
  type PartnerApplicantListItem
} from "../../../lib/member-profile-client";

export function PartnerHomeScreen() {
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [positions, setPositions] = useState<PartnerPosition[]>([]);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    Promise.all([
      getMyPartnerOrganization().catch(() => null),
      getMyPartnerPositions().catch(() => []),
      getMyPartnerApplicants().catch(() => [])
    ])
      .then(([o, p, a]) => {
        setOrg(o);
        setPositions(p);
        setApplicants(a);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      open: positions.filter((p) => p.status === "OPEN").length,
      total: applicants.length,
      applied: applicants.filter((a) => a.status === "APPLIED").length,
      interview: applicants.filter((a) => a.status === "INTERVIEW").length
    }),
    [positions, applicants]
  );

  const recent = useMemo(
    () => [...applicants].sort((a, b) => (b.appliedAt ?? "").localeCompare(a.appliedAt ?? "")).slice(0, 5),
    [applicants]
  );

  return (
    <PartnerAppShell>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" ? (
        <div className="flex flex-col gap-10">
          {/* 인사 */}
          <div className="rounded-3xl bg-[#F5F8FF] p-7">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#0B46E8]">PARTNER</p>
            <h1 className="mt-2 break-keep text-[24px] font-black leading-[1.2] tracking-[-0.02em] text-[#0B1227]">
              {org?.name ? `${org.name}` : "우리 회사"}, 좋은 인재를 만나요
            </h1>
            <p className="mt-1.5 text-[14px] text-[#8B95A1]">공고를 올리고 지원자를 관리해요.</p>
          </div>

          {/* 요약 스탯 */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard title="진행 중 공고" count={stats.open} href={partnerRoutes.positions} />
            <StatCard title="전체 지원자" count={stats.total} href={partnerRoutes.applicants} />
            <StatCard title="신규 지원" count={stats.applied} href={partnerRoutes.applicants} highlight={stats.applied > 0} />
            <StatCard title="면접 진행" count={stats.interview} href={partnerRoutes.applicants} />
          </div>

          {/* 빠른 작업 */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={partnerRoutes.positionNew} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] px-5 py-3.5 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
              <Plus className="h-4 w-4" weight="bold" /> 새 공고 작성
            </Link>
            <Link href={partnerRoutes.positions} className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#E5E8EB] bg-white px-5 py-3.5 text-[14.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">
              공고 관리
            </Link>
          </div>

          {/* 최근 지원자 */}
          <section className="flex flex-col gap-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">최근 지원자</h2>
                <p className="mt-1 text-[13px] text-[#8B95A1]">새로 지원한 인재를 확인해요.</p>
              </div>
              {applicants.length ? (
                <Link href={partnerRoutes.applicants} className="shrink-0 text-[12.5px] font-bold text-[#0B46E8] transition hover:text-[#0A3ECB]">전체 보기</Link>
              ) : null}
            </div>
            {recent.length ? (
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {recent.map((a, i) => (
                  <ApplicantRow key={a.id} a={a} last={i === recent.length - 1} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🧑‍💼</span>
                <p className="mt-3 text-[15px] font-bold text-[#191F28]">아직 지원자가 없어요</p>
                <p className="mt-1 text-[13px] text-[#8B95A1]">공고를 올리면 지원자가 여기에 모여요.</p>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </PartnerAppShell>
  );
}

function StatCard({ title, count, href, highlight }: { title: string; count: number; href: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`block rounded-2xl border px-5 py-4 transition hover:bg-[#F6F8FB] ${highlight ? "border-[#E4EDFB] bg-[#F5F8FF]" : "border-[#EEF1F5] bg-white hover:border-[#D7DCE3]"}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[12.5px] font-normal text-[#8B95A1]">{title}</p>
        <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
      </div>
      <p className={`mt-0.5 text-[24px] font-black tracking-[-0.02em] ${highlight && count > 0 ? "text-[#0B46E8]" : "text-[#191F28]"}`}>{count}</p>
    </Link>
  );
}

function ApplicantRow({ a, last }: { a: PartnerApplicantListItem; last: boolean }) {
  const s = PARTNER_APPLICANT_STATUS[a.status];
  return (
    <Link href={`${partnerRoutes.applicants}/${a.id}`} className={`flex items-center gap-3 px-4 py-4 transition hover:bg-[#F6F8FB] ${last ? "" : "border-b border-[#F2F4F6]"}`}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[15px] font-black text-[#0B46E8]">{a.name.slice(0, 1)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14.5px] font-bold text-[#191F28]">{a.name}</p>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{a.positionTitle}</p>
      </div>
      <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
    </Link>
  );
}
