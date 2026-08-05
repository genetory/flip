"use client";

// 파트너 지원자 — 실서버 지원자 목록. 상태 탭 + 리스트.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TLoading, TError } from "../../talent/ui/primitives";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { PARTNER_APPLICANT_STATUS, PARTNER_RECOMMENDATION } from "../../../lib/partner/labels";
import { getMyPartnerApplicants, type PartnerApplicantListItem, type PartnerApplicantStatus } from "../../../lib/member-profile-client";

type Tab = "all" | PartnerApplicantStatus;

const TABS: { key: Tab; label: string; match: (s: PartnerApplicantStatus) => boolean }[] = [
  { key: "all", label: "전체", match: () => true },
  { key: "APPLIED", label: "신규", match: (s) => s === "APPLIED" },
  { key: "REVIEWING", label: "검토 중", match: (s) => s === "REVIEWING" },
  { key: "INTERVIEW", label: "면접", match: (s) => s === "INTERVIEW" },
  { key: "ACCEPTED", label: "합격", match: (s) => s === "ACCEPTED" || s === "OFFERED" },
  { key: "REJECTED", label: "불합격", match: (s) => s === "REJECTED" }
];

export function PartnerApplicantsScreen() {
  const [items, setItems] = useState<PartnerApplicantListItem[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tab, setTab] = useState<Tab>("all");

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

  const counts = useMemo(() => {
    const a = items ?? [];
    const c = {} as Record<Tab, number>;
    for (const t of TABS) c[t.key] = a.filter((x) => t.match(x.status)).length;
    return c;
  }, [items]);

  const active = TABS.find((t) => t.key === tab) ?? TABS[0];
  const list = (items ?? []).filter((a) => active.match(a.status));

  return (
    <PartnerAppShell>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">지원자</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">우리 공고에 지원한 인재를 확인하고 관리해요.</p>
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
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>🧑‍💼</span>
                <p className="mt-3 text-[15px] font-bold text-[#191F28]">해당 상태의 지원자가 없어요</p>
              </div>
            ) : (
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {list.map((a, i) => (
                  <ApplicantRow key={a.id} a={a} last={i === list.length - 1} />
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </PartnerAppShell>
  );
}

function ApplicantRow({ a, last }: { a: PartnerApplicantListItem; last: boolean }) {
  const s = PARTNER_APPLICANT_STATUS[a.status];
  const rec = PARTNER_RECOMMENDATION[a.recommendation];
  const sub = [a.school, a.major].filter(Boolean).join(" · ");
  return (
    <Link href={`${partnerRoutes.applicants}/${a.id}`} className={`flex items-center gap-3.5 px-4 py-4 transition hover:bg-[#F6F8FB] ${last ? "" : "border-b border-[#F2F4F6]"}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[16px] font-black text-[#0B46E8]">{a.name.slice(0, 1)}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[14.5px] font-bold text-[#191F28]">{a.name}</p>
          <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${s.cls}`}>{s.label}</span>
          {a.recommendation === "HIGH" ? <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${rec.cls}`}>{rec.label}</span> : null}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{a.positionTitle}</p>
        {sub ? <p className="truncate text-[12px] text-[#B0B8C1]">{sub}{a.nationality ? ` · ${a.nationality}` : ""}</p> : null}
      </div>
      <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
    </Link>
  );
}
