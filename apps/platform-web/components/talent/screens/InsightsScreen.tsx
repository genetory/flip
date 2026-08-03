"use client";

// 취업 가이드 — 직무 인사이트 · 취업 노하우 · 외국인 비자 · 취업 팁(교육형 콘텐츠 허브).
import { useEffect, useState } from "react";
import { CaretRight, X } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TPageHeader } from "../ui/primitives";
import { GuideModal } from "./HomeScreen";
import { roleInsights, jobHunting, jobVisas } from "../../../lib/talent/insights-content";
import { homeTips, type CareerGuide } from "../../../lib/talent/home-content";
import { VISA_DETAILS, type VisaStructuredLine } from "../../../lib/visa-details";

export function InsightsScreen() {
  const [active, setActive] = useState<CareerGuide | null>(null);
  const [visa, setVisa] = useState<string | null>(null);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-8">
        <TPageHeader title="취업 가이드" description="직무 이야기부터 취업 노하우·비자까지, 취업 준비에 도움되는 정보를 모았어요." />

        <CardRow
          title="직무, 이런 일을 해요"
          desc="관심 직무가 실제로 무슨 일을 하는지 살펴봐요."
          items={roleInsights}
          onOpen={setActive}
        />

        <CardRow
          title="취업 노하우"
          desc="첫 취업에서 자주 막히는 지점을 풀어드려요."
          items={jobHunting}
          onOpen={setActive}
        />

        {/* 외국인 비자 안내 */}
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">외국인을 위한 비자 안내</h2>
            <p className="mt-1 text-[13px] text-[#8B95A1]">구직·취업에 관련된 비자를 쉽게 정리했어요.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {jobVisas.map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() => setVisa(v.code)}
                className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-4 text-left transition hover:border-[#D7DCE3] hover:shadow-[0_4px_16px_rgba(11,18,39,0.05)]"
              >
                <span className="flex h-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F8FF] px-3 text-[13px] font-black text-[#0B46E8]">{v.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-[#191F28]">{v.label}</p>
                  <p className="truncate text-[12.5px] text-[#8B95A1]">{v.desc}</p>
                </div>
                <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
              </button>
            ))}
          </div>
          <p className="text-[12px] leading-relaxed text-[#B0B8C1]">비자 요건은 개인 상황·정책에 따라 달라질 수 있어요. 정확한 내용은 하이코리아·출입국사무소에서 확인하세요.</p>
        </section>

        {/* 취업 팁 — 짧은 한 줄 팁 */}
        <section className="flex flex-col gap-3">
          <div>
            <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">알아두면 좋은 취업 팁</h2>
            <p className="mt-1 text-[13px] text-[#8B95A1]">가볍게 읽고 바로 써먹는 한 줄 팁이에요.</p>
          </div>
          <div className="flex flex-col gap-2.5">
            {homeTips.map((t) => (
              <div key={t.title} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                <p className="text-[14px] font-bold text-[#191F28]">{t.title}</p>
                <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {active ? <GuideModal guide={active} onClose={() => setActive(null)} /> : null}
      {visa ? <VisaModal code={visa} onClose={() => setVisa(null)} /> : null}
    </TalentAppShell>
  );
}

// 비자 상세 팝업 — VISA_DETAILS(공식 안내)의 한국어 구조화 내용을 그대로 보여준다.
function VisaLines({ lines }: { lines: VisaStructuredLine[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((l, i) =>
        l.kind === "heading" ? (
          <p key={i} className="mt-1.5 text-[13.5px] font-bold text-[#191F28]" style={{ paddingLeft: l.depth * 12 }}>{l.text}</p>
        ) : (
          <p key={i} className="flex gap-1.5 break-keep text-[13px] leading-[1.7] text-[#4E5968]" style={{ paddingLeft: l.depth * 12 }}>
            <span className="shrink-0 text-[#B0B8C1]">•</span>
            <span>{l.text}</span>
          </p>
        )
      )}
    </div>
  );
}

function VisaModal({ code, onClose }: { code: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const detail = VISA_DETAILS[code];
  if (!detail) return null;
  // 배지에 이미 코드가 있으니 제목의 코드 접두어는 제거.
  const rawTitle = detail.titleKo?.trim() || `${code} 비자`;
  const title = (rawTitle.startsWith(code) ? rawTitle.slice(code.length).trim() : rawTitle) || `${code} 비자`;
  const sections: { heading: string; lines: VisaStructuredLine[] }[] = [
    { heading: "안내", lines: detail.descriptionKo ?? [] },
    { heading: "대상", lines: detail.candidatesKo ?? [] },
    { heading: "요건", lines: detail.requirementsKo ?? [] }
  ].filter((s) => s.lines.length > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[82vh] w-full max-w-[460px] flex-col overflow-hidden rounded-3xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 border-b border-[#F2F4F6] px-7 pb-5 pt-7">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F8FF] px-3 text-[13px] font-black text-[#0B46E8]">{code}</span>
            <h2 className="min-w-0 truncate text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose} className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="flex flex-col gap-5">
            {sections.map((s) => (
              <div key={s.heading}>
                <p className="text-[12px] font-bold text-[#8B95A1]">{s.heading}</p>
                <div className="mt-1.5">
                  <VisaLines lines={s.lines} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-[#B0B8C1]">개인 상황·정책에 따라 달라질 수 있어요. 정확한 내용은 하이코리아·출입국사무소에서 확인하세요.</p>
        </div>
      </div>
    </div>
  );
}

function CardRow({ title, desc, items, onOpen }: { title: string; desc: string; items: CareerGuide[]; onOpen: (g: CareerGuide) => void }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">{desc}</p>
      </div>
      <div className="-mx-4 overflow-x-auto md:mx-0">
        <div className="flex gap-3 pb-1 pl-4 md:pl-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((g) => (
            <button
              key={g.title}
              type="button"
              onClick={() => onOpen(g)}
              className="flex w-[220px] shrink-0 flex-col rounded-2xl border border-[#EEF1F5] bg-white p-5 text-left transition hover:border-[#D7DCE3] hover:shadow-[0_4px_16px_rgba(11,18,39,0.05)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[22px]" aria-hidden>{g.emoji}</span>
              <p className="mt-4 min-h-[40px] whitespace-pre-line break-keep text-[14.5px] font-bold leading-snug text-[#191F28]">{g.title}</p>
              <p className="mt-1.5 line-clamp-2 min-h-[40px] break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{g.desc}</p>
              <span className="mt-3 inline-flex items-center gap-0.5 text-[12.5px] font-bold text-[#0B46E8]">자세히 <CaretRight className="h-3.5 w-3.5" /></span>
            </button>
          ))}
          <span aria-hidden className="-ml-3 w-4 shrink-0 md:hidden" />
        </div>
      </div>
    </section>
  );
}
