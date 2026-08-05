"use client";

// 파트너 공고 관리 — 실서버 공고 목록. 상태 필터 + 새 공고.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CaretRight, Plus } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_POSITION_STATUS } from "../../../lib/partner/labels";
import { getMyPartnerPositions, type PartnerPosition } from "../../../lib/member-profile-client";

const EMPLOYMENT_LABEL: Record<PartnerPosition["employmentType"], string> = {
  FULL_TIME: "정규직",
  INTERN: "인턴",
  PART_TIME: "파트타임",
  UNPAID_INTERN: "무급 인턴"
};

type Tab = "all" | "OPEN" | "DRAFT" | "CLOSED";
const TABS: { key: Tab; label: string; match: (p: PartnerPosition) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "OPEN", label: "게시 중", match: (p) => p.status === "OPEN" },
  { key: "DRAFT", label: "작성 중", match: (p) => p.status === "DRAFT" || p.status === "PENDING_REVIEW" },
  { key: "CLOSED", label: "마감", match: (p) => p.status === "CLOSED" || p.status === "PAUSED" || p.status === "REJECTED" }
];

export function PartnerPositionsScreen() {
  const [items, setItems] = useState<PartnerPosition[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("all");

  function load() {
    setStatus("loading");
    getMyPartnerPositions()
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const a = items ?? [];
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.key] = a.filter(t.match).length;
    return c;
  }, [items]);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const list = (items ?? []).filter(active.match);

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">공고 관리</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">채용 공고를 올리고 상태를 관리해요.</p>
          </div>
          <Link href={partnerRoutes.positionNew} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-3.5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
            <Plus className="h-4 w-4" weight="bold" /> 새 공고
          </Link>
        </div>

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          <>
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

            {list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>📋</span>
                <p className="mt-3 text-[15px] font-bold text-[#191F28]">공고가 없어요</p>
                <p className="mt-1 text-[13px] text-[#8B95A1]">첫 채용 공고를 올려보세요.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {list.map((p) => (
                  <PositionCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function PositionCard({ p }: { p: PartnerPosition }) {
  const s = PARTNER_POSITION_STATUS[p.status];
  const meta = [EMPLOYMENT_LABEL[p.employmentType], p.workType, p.workLocation].filter(Boolean).join(" · ");
  return (
    <Link href={`${partnerRoutes.positions}/${p.id}`} className="rounded-2xl border border-[#EEF1F5] bg-white p-5 transition hover:border-[#D7DCE3]">
      <div className="flex items-center gap-2">
        <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
        <span className="ml-auto shrink-0 text-[11.5px] text-[#B0B8C1]">{new Date(p.createdAt).toLocaleDateString("ko-KR")} 작성</span>
      </div>
      <p className="mt-2.5 text-[15.5px] font-bold text-[#191F28]">{p.title || "제목 없는 공고"}</p>
      {meta ? <p className="mt-1 text-[12.5px] text-[#8B95A1]">{meta}</p> : null}
      <div className="mt-3 flex items-center justify-between border-t border-[#F5F6F8] pt-3">
        <span className="text-[12.5px] text-[#8B95A1]">채용 {p.hiringCount ?? "-"}명</span>
        <span className="inline-flex items-center gap-0.5 text-[12.5px] font-bold text-[#0B46E8]">관리 <CaretRight className="h-3.5 w-3.5" weight="bold" /></span>
      </div>
    </Link>
  );
}
