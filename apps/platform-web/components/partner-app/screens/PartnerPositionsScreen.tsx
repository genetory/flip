"use client";

// 파트너 공고 관리 — 요약 + 검색 + 정렬 + 상태 탭 + 공고별 지원자 수 카드.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, MagnifyingGlass, X, Users, Briefcase, ImageSquare, MapPin, CalendarBlank, Translate, IdentificationCard, Microphone, Eye } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TListSkeleton, TError } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { getMyPartnerPositions, getMyPartnerApplicants, updateMyPartnerPosition, type PartnerPosition, type PartnerApplicantListItem } from "../../../lib/member-profile-client";

type PositionQuickStatus = "OPEN" | "PAUSED" | "CLOSED";

const EMPLOYMENT_LABEL: Record<PartnerPosition["employmentType"], string> = {
  FULL_TIME: "정규직",
  INTERN: "인턴",
  PART_TIME: "파트타임",
  UNPAID_INTERN: "무급 인턴"
};

const WORKTYPE_LABEL: Record<NonNullable<PartnerPosition["workType"]>, string> = {
  "On-site": "출근",
  Hybrid: "하이브리드",
  Remote: "재택"
};

type Tab = "all" | "OPEN" | "DRAFT" | "CLOSED";
type Sort = "latest" | "applicants";

const TABS: { key: Tab; label: string; match: (p: PartnerPosition) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "OPEN", label: "게시 중", match: (p) => p.status === "OPEN" },
  { key: "DRAFT", label: "작성 중", match: (p) => p.status === "DRAFT" || p.status === "PENDING_REVIEW" },
  { key: "CLOSED", label: "마감", match: (p) => p.status === "CLOSED" || p.status === "REJECTED" }
];

export function PartnerPositionsScreen() {
  const searchParams = useSearchParams();
  const toast = useTalentPopup();
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

  // 공고 카드에서 바로 상태 변경(게시↔일시중지↔마감). 낙관적 반영 후 실패 시 되돌린다.
  function setPositionStatus(id: string, next: PositionQuickStatus) {
    const prev = items?.find((p) => p.id === id)?.status;
    setItems((list) => (list ? list.map((p) => (p.id === id ? { ...p, status: next } : p)) : list));
    updateMyPartnerPosition(id, { status: next })
      .then(() => toast.success(next === "OPEN" ? "공고를 다시 게시했어요" : next === "PAUSED" ? "공고를 일시중지했어요" : "공고를 마감했어요"))
      .catch(() => {
        toast.error("상태 변경에 실패했어요");
        if (prev) setItems((list) => (list ? list.map((p) => (p.id === id ? { ...p, status: prev } : p)) : list));
      });
  }

  const all = useMemo(() => items ?? [], [items]);

  // 공고별 지원자 수.
  const applicantCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of applicants) m.set(a.positionId, (m.get(a.positionId) ?? 0) + 1);
    return m;
  }, [applicants]);

  // 공고별 신규(미열람) 지원자 수 — 카드에서 강조.
  const newApplicantCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of applicants) if (a.status === "APPLIED") m.set(a.positionId, (m.get(a.positionId) ?? 0) + 1);
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

        {status === "loading" ? <TListSkeleton /> : null}
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
                  <PositionCard key={p.id} p={p} applicants={applicantCount.get(p.id) ?? 0} newApplicants={newApplicantCount.get(p.id) ?? 0} mockCount={p.mockInterviewParticipantCount ?? 0} onSetStatus={setPositionStatus} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function fmtDate(d: string | null): string | null {
  if (!d) return null;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return null;
  return `${t.getMonth() + 1}월 ${t.getDate()}일`;
}

function PositionCard({ p, applicants, newApplicants, mockCount, onSetStatus }: { p: PartnerPosition; applicants: number; newApplicants: number; mockCount: number; onSetStatus: (id: string, next: PositionQuickStatus) => void }) {
  const router = useRouter();
  // 이미 승인·게시 이력이 있는 상태(OPEN/PAUSED/CLOSED) 사이의 빠른 전환만 노출(신규 검토는 에디터에서).
  const quickActions: { label: string; next: PositionQuickStatus }[] =
    p.status === "OPEN"
      ? [{ label: "일시중지", next: "PAUSED" }, { label: "마감", next: "CLOSED" }]
      : p.status === "PAUSED"
        ? [{ label: "다시 게시", next: "OPEN" }]
        : p.status === "CLOSED"
          ? [{ label: "다시 게시", next: "OPEN" }]
          : [];
  const s = PARTNER_POSITION_STATUS[p.status];
  const thumb = Array.isArray(p.thumbnailImages) ? p.thumbnailImages[0] : undefined;
  const role = p.preferredJobRole?.trim();
  const start = fmtDate(p.startDate);
  const visas = (p.eligibleVisas ?? []).filter(Boolean);
  const langs = (p.communicationLanguages ?? []).filter(Boolean);

  // 정보 칩 — 있는 것만.
  const chips: { icon: ReactNode; text: string }[] = [];
  chips.push({ icon: <Briefcase className="h-3.5 w-3.5" />, text: [EMPLOYMENT_LABEL[p.employmentType], p.workType ? WORKTYPE_LABEL[p.workType] : null].filter(Boolean).join(" · ") });
  if (p.workLocation) chips.push({ icon: <MapPin className="h-3.5 w-3.5" />, text: p.workLocation });
  if (start) chips.push({ icon: <CalendarBlank className="h-3.5 w-3.5" />, text: `${start} 시작` });
  if (visas.length) chips.push({ icon: <IdentificationCard className="h-3.5 w-3.5" />, text: visas.slice(0, 2).join("·") + (visas.length > 2 ? ` +${visas.length - 2}` : "") });
  if (langs.length) chips.push({ icon: <Translate className="h-3.5 w-3.5" />, text: langs.slice(0, 2).join("·") + (langs.length > 2 ? ` +${langs.length - 2}` : "") });

  return (
    <Link href={`${partnerRoutes.positions}/${p.id}`} className="flex gap-4 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      {/* 썸네일 — 없어도 뷰 표시 */}
      <span className="relative flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EEF1F5] bg-[#F2F4F6]">
        {thumb ? (
          <Image src={thumb} alt="" fill sizes="88px" className="object-cover" unoptimized />
        ) : (
          <ImageSquare className="h-7 w-7 text-[#C4CAD2]" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className={`shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
          {p.mockInterviewIntent || (p.mockInterviewQuestions?.length ?? 0) > 0 ? (
            <span className="shrink-0 whitespace-nowrap rounded-md bg-[#EDF1FD] px-2.5 py-1 text-[11px] font-bold text-[#0B46E8]">🎤 모의 면접</span>
          ) : null}
          <span className="ml-auto shrink-0 whitespace-nowrap text-[11.5px] text-[#B0B8C1]">{new Date(p.createdAt).toLocaleDateString("ko-KR")} 작성</span>
        </div>

        <p className="mt-2 truncate text-[15.5px] font-bold text-[#191F28]">{p.title || "제목 없는 공고"}</p>
        {role ? <p className="mt-0.5 truncate text-[12.5px] font-semibold text-[#0B46E8]">{role}</p> : null}

        {/* 정보 칩 */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-[#F5F7FA] px-2 py-1 text-[12px] font-medium text-[#4E5968]">
              <span className="text-[#8B95A1]">{c.icon}</span>
              <span className="max-w-[160px] truncate">{c.text}</span>
            </span>
          ))}
        </div>

        {/* 현황 지표 */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-[#F5F6F8] pt-3">
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[#4E5968]"><Users className="h-4 w-4 text-[#B0B8C1]" /> 채용 {p.hiringCount ?? "-"}명</span>
          <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Eye className="h-4 w-4 text-[#B0B8C1]" /> 조회 {p.viewCount ?? 0}</span>
          {(p.viewCount ?? 0) > 0 ? <span className="text-[12.5px] text-[#8B95A1]">지원 전환 {Math.round((applicants / (p.viewCount ?? 1)) * 100)}%</span> : null}
          {/* 지원자 수 — 클릭 시 해당 공고 지원자 목록으로(카드 링크와 분리) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              router.push(`${partnerRoutes.applicants}?position=${encodeURIComponent(p.id)}`);
            }}
            className="-mx-2.5 flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
          >
            지원 {applicants}명
            {newApplicants > 0 ? <span className="rounded-full bg-[#F04452] px-1.5 py-px text-[10.5px] font-bold text-white">신규 {newApplicants}</span> : null}
          </button>
          {/* 모의 면접 참여자 수 — 클릭 시 해당 공고 모의 면접 탭으로 */}
          {mockCount > 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`${partnerRoutes.applicants}?position=${encodeURIComponent(p.id)}&tab=mock`);
              }}
              className="-mx-2.5 flex items-center gap-1 rounded-md px-2.5 py-0.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
            >
              <Microphone className="h-4 w-4" weight="fill" /> 모의 {mockCount}명
            </button>
          ) : null}
          {/* 빠른 상태 변경 — 카드 링크와 분리(에디터 안 열고 게시/중지/마감) */}
          {quickActions.length ? (
            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {quickActions.map((a) => (
                <button
                  key={a.next}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSetStatus(p.id, a.next);
                  }}
                  className="rounded-lg border border-[#E5E8EB] bg-white px-2.5 py-1 text-[12px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
                >
                  {a.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
