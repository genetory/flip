"use client";

// 파트너 지원자 — 실서버 지원자 목록. 요약 + 검색 + 정렬 + 상태 탭 + 풍부한 카드.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MagnifyingGlass, X, GraduationCap, Globe, Translate, Clock, Briefcase } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_APPLICANT_STATUS, PARTNER_RECOMMENDATION } from "../../../lib/partner/labels";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMyPartnerApplicants, type PartnerApplicantListItem, type PartnerApplicantStatus } from "../../../lib/member-profile-client";

type Tab = "all" | PartnerApplicantStatus;
type Sort = "latest" | "recommended";

const TABS: { key: Tab; label: string; match: (s: PartnerApplicantStatus) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "APPLIED", label: "신규", match: (s) => s === "APPLIED" },
  { key: "REVIEWING", label: "검토 중", match: (s) => s === "REVIEWING" },
  { key: "INTERVIEW", label: "면접", match: (s) => s === "INTERVIEW" },
  { key: "ACCEPTED", label: "합격", match: (s) => s === "ACCEPTED" || s === "OFFERED" },
  { key: "REJECTED", label: "불합격", match: (s) => s === "REJECTED" }
];

const REC_ORDER: Record<PartnerApplicantListItem["recommendation"], number> = { HIGH: 0, NORMAL: 1, CHECK: 2 };

export function PartnerApplicantsScreen() {
  const searchParams = useSearchParams();
  const positionFilter = searchParams.get("position");
  const [items, setItems] = useState<PartnerApplicantListItem[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("latest");

  function load() {
    setStatus("loading");
    getMyPartnerApplicants()
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  const all = useMemo(() => items ?? [], [items]);
  // 공고별 필터(?position=<id>)가 있으면 그 공고 지원자로 범위를 좁힌다.
  const scoped = useMemo(() => (positionFilter ? all.filter((a) => a.positionId === positionFilter) : all), [all, positionFilter]);
  const filterTitle = positionFilter ? scoped[0]?.positionTitle ?? null : null;

  // 상단 요약 — 액션이 필요한 상태 위주.
  const summary = useMemo(
    () => [
      { key: "APPLIED" as const, label: "신규 지원", count: scoped.filter((a) => a.status === "APPLIED").length, cls: "text-[#0B46E8]" },
      { key: "REVIEWING" as const, label: "검토 중", count: scoped.filter((a) => a.status === "REVIEWING").length, cls: "text-[#E8890C]" },
      { key: "INTERVIEW" as const, label: "면접", count: scoped.filter((a) => a.status === "INTERVIEW").length, cls: "text-[#E8890C]" },
      { key: "ACCEPTED" as const, label: "합격", count: scoped.filter((a) => a.status === "ACCEPTED" || a.status === "OFFERED").length, cls: "text-[#12B76A]" }
    ],
    [scoped]
  );

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.key] = scoped.filter((x) => t.match(x.status)).length;
    return c;
  }, [scoped]);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const q = query.trim().toLowerCase();

  const list = useMemo(() => {
    const filtered = scoped
      .filter((a) => active.match(a.status))
      .filter((a) => {
        if (!q) return true;
        return [a.name, a.positionTitle, a.school, a.major, a.nationality].some((v) => (v ?? "").toLowerCase().includes(q));
      });
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "recommended") {
        const r = REC_ORDER[a.recommendation] - REC_ORDER[b.recommendation];
        if (r !== 0) return r;
      }
      return (b.appliedAt ?? "").localeCompare(a.appliedAt ?? "");
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoped, tab, q, sort]);

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">지원자</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">우리 공고에 지원한 인재를 확인하고 관리해요.</p>
        </div>

        {/* 공고별 필터 배너 */}
        {positionFilter ? (
          <div className="flex items-center gap-2.5 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] px-4 py-3">
            <Briefcase className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" />
            <p className="min-w-0 flex-1 truncate text-[13px] text-[#4E5968]">
              <span className="font-bold text-[#191F28]">{filterTitle || "선택한 공고"}</span> 지원자만 보는 중
            </p>
            <Link href={partnerRoutes.applicants} className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]">전체 보기</Link>
          </div>
        ) : null}

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
            {/* 요약 */}
            <div className="grid grid-cols-4 gap-2">
              {summary.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    setTab(s.key);
                    setQuery("");
                  }}
                  className={`rounded-2xl border bg-white px-2 py-3 text-center transition hover:border-[#D7DCE3] ${tab === s.key ? "border-[#0B46E8]" : "border-[#EEF1F5]"}`}
                >
                  <p className={`text-[22px] font-black tracking-[-0.02em] ${s.cls}`}>{s.count}</p>
                  <p className="mt-0.5 text-[11.5px] font-semibold text-[#8B95A1]">{s.label}</p>
                </button>
              ))}
            </div>

            {/* 검색 */}
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#B0B8C1]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름·공고·학교·전공·국적 검색"
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
                {([["latest", "최신순"], ["recommended", "추천순"]] as const).map(([key, label]) => (
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
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🧑‍💼</span>
                <p className="mt-3 text-[15px] font-bold text-[#191F28]">{q ? "검색 결과가 없어요" : "해당 상태의 지원자가 없어요"}</p>
                {q ? <p className="mt-1 text-[13px] text-[#8B95A1]">다른 검색어로 다시 시도해보세요.</p> : null}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {list.map((a) => (
                  <ApplicantCard key={a.id} a={a} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function ApplicantCard({ a }: { a: PartnerApplicantListItem }) {
  const s = PARTNER_APPLICANT_STATUS[a.status];
  const rec = PARTNER_RECOMMENDATION[a.recommendation];
  const edu = [a.school, a.major].filter(Boolean).join(" · ");
  const langs = a.languages?.length ? a.languages.join(", ") : "";
  return (
    <Link href={`${partnerRoutes.applicants}/${encodeURIComponent(a.id)}`} className="rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
      <div className="flex items-start gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[17px] font-black text-[#0B46E8]">{a.name.slice(0, 1)}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-[15px] font-bold text-[#191F28]">{a.name}</p>
            <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
            {a.recommendation === "HIGH" ? <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${rec.cls}`}>{rec.label}</span> : null}
          </div>
          <p className="mt-1 truncate text-[13px] font-semibold text-[#4E5968]">{a.positionTitle}</p>

          <div className="mt-2 flex flex-col gap-1">
            {edu ? (
              <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><GraduationCap className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{edu}</span></span>
            ) : null}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {a.nationality ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Globe className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> {a.nationality}</span> : null}
              {langs ? <span className="flex items-center gap-1.5 text-[12.5px] text-[#8B95A1]"><Translate className="h-4 w-4 shrink-0 text-[#B0B8C1]" /> <span className="truncate">{langs}</span></span> : null}
            </div>
          </div>
        </div>
        {a.appliedAt ? (
          <span className="flex shrink-0 items-center gap-1 text-[11.5px] text-[#B0B8C1]"><Clock className="h-3.5 w-3.5" /> {formatRelativeTime(new Date(a.appliedAt).getTime())}</span>
        ) : null}
      </div>
    </Link>
  );
}
