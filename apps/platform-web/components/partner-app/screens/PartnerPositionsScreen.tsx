"use client";

// 파트너 공고 관리 — 요약 + 검색 + 정렬 + 상태 탭 + 공고별 지원자 수 카드.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MagnifyingGlass, X, Users, Briefcase, ImageSquare } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import { getMyPartnerPositions, getMyPartnerApplicants, type PartnerPosition, type PartnerApplicantListItem } from "../../../lib/member-profile-client";

const EMPLOYMENT_LABEL: Record<PartnerPosition["employmentType"], string> = {
  FULL_TIME: "정규직",
  INTERN: "인턴",
  PART_TIME: "파트타임",
  UNPAID_INTERN: "무급 인턴"
};

type Tab = "all" | "OPEN" | "DRAFT" | "CLOSED";
type Sort = "latest" | "applicants";

const TABS: { key: Tab; label: string; match: (p: PartnerPosition) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "OPEN", label: "게시 중", match: (p) => p.status === "OPEN" },
  { key: "DRAFT", label: "작성 중", match: (p) => p.status === "DRAFT" || p.status === "PENDING_REVIEW" },
  { key: "CLOSED", label: "마감", match: (p) => p.status === "CLOSED" || p.status === "PAUSED" || p.status === "REJECTED" }
];

export function PartnerPositionsScreen() {
  const searchParams = useSearchParams();
  const initTab = searchParams.get("tab");
  const [items, setItems] = useState<PartnerPosition[] | null>(null);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.key === initTab) ? (initTab as Tab) : "all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("latest");

  function load() {
    setStatus("loading");
    Promise.all([getMyPartnerPositions(), getMyPartnerApplicants().catch(() => [])])
      .then(([list, apps]) => {
        setItems(list);
        setApplicants(apps);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  const all = useMemo(() => items ?? [], [items]);

  // 공고별 지원자 수.
  const applicantCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of applicants) m.set(a.positionId, (m.get(a.positionId) ?? 0) + 1);
    return m;
  }, [applicants]);

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.key] = all.filter(t.match).length;
    return c;
  }, [all]);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const q = query.trim().toLowerCase();

  const list = useMemo(() => {
    const filtered = all
      .filter(active.match)
      .filter((p) => {
        if (!q) return true;
        return [p.title, p.preferredJobRole, p.workLocation].some((v) => (v ?? "").toLowerCase().includes(q));
      });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "applicants") {
        const d = (applicantCount.get(b.id) ?? 0) - (applicantCount.get(a.id) ?? 0);
        if (d !== 0) return d;
      }
      return (b.createdAt ?? "").localeCompare(a.createdAt ?? "");
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, tab, q, sort, applicantCount]);

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">공고 관리</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">채용 공고를 올리고 상태·지원 현황을 관리해요.</p>
          </div>
          <Link href={partnerRoutes.positionNew} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-3.5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
            <Plus className="h-4 w-4" weight="bold" /> 새 공고
          </Link>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
            {/* 검색 */}
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#B0B8C1]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="공고명·직무·근무지 검색"
                className="w-full rounded-2xl border border-[#EEF1F5] bg-white py-3 pl-11 pr-10 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="검색어 지우기" className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#B0B8C1] transition hover:bg-[#F2F4F6]">
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {/* 상태 탭 */}
            <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {TABS.map((t) => {
                const on = tab === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    aria-current={on ? "page" : undefined}
                    className={`relative shrink-0 pb-1.5 text-[15px] font-bold transition ${on ? "text-[#191F28]" : "text-[#B0B8C1] hover:text-[#8B95A1]"}`}
                  >
                    {t.label} ({counts[t.key]})
                    {on ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
                  </button>
                );
              })}
            </div>

            {/* 정렬 */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1 rounded-full bg-[#F2F4F6] p-0.5">
                {([["latest", "최신순"], ["applicants", "지원 많은순"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSort(key)}
                    className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition ${sort === key ? "bg-white text-[#191F28] shadow-[0_1px_4px_rgba(11,18,39,0.08)]" : "text-[#8B95A1]"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 리스트 */}
            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>📋</span>
                <p className="mt-3 text-[15px] font-bold text-[#191F28]">{q ? "검색 결과가 없어요" : "공고가 없어요"}</p>
                {!q ? <p className="mt-1 text-[13px] text-[#8B95A1]">첫 채용 공고를 올려보세요.</p> : null}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {list.map((p) => (
                  <PositionCard key={p.id} p={p} applicants={applicantCount.get(p.id) ?? 0} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function PositionCard({ p, applicants }: { p: PartnerPosition; applicants: number }) {
  const router = useRouter();
  const s = PARTNER_POSITION_STATUS[p.status];
  const meta = [EMPLOYMENT_LABEL[p.employmentType], p.workType, p.workLocation].filter(Boolean).join(" · ");
  const thumb = Array.isArray(p.thumbnailImages) ? p.thumbnailImages[0] : undefined;
  return (
    <Link href={`${partnerRoutes.positions}/${p.id}`} className="flex gap-4 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      {/* 썸네일 — 없어도 뷰 표시 */}
      <span className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EEF1F5] bg-[#F2F4F6]">
        {thumb ? (
          <Image src={thumb} alt="" fill sizes="76px" className="object-cover" unoptimized />
        ) : (
          <ImageSquare className="h-7 w-7 text-[#C4CAD2]" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
          <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{new Date(p.createdAt).toLocaleDateString("ko-KR")} 작성</span>
        </div>
        <p className="mt-2 truncate text-[15.5px] font-bold text-[#191F28]">{p.title || "제목 없는 공고"}</p>
        {meta ? <p className="mt-1 truncate text-[12.5px] text-[#8B95A1]">{meta}</p> : null}
        <div className="mt-3 flex items-center gap-4 border-t border-[#F5F6F8] pt-3">
          <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Briefcase className="h-4 w-4 text-[#B0B8C1]" /> 채용 {p.hiringCount ?? "-"}명</span>
          {/* 지원자 수 — 클릭 시 해당 공고 지원자 목록으로(카드 링크와 분리) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`${partnerRoutes.applicants}?position=${encodeURIComponent(p.id)}`);
            }}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
          >
            <Users className="h-4 w-4" weight="fill" /> 지원 {applicants}명
          </button>
        </div>
      </div>
    </Link>
  );
}
