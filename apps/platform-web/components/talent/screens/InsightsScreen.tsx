"use client";

// 취업 소식 — 직무 인사이트 · 취업 노하우 · 취업 팁(교육형 콘텐츠 허브).
import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TPageHeader } from "../ui/primitives";
import { GuideModal } from "./HomeScreen";
import { roleInsights, jobHunting } from "../../../lib/talent/insights-content";
import { homeTips, type CareerGuide } from "../../../lib/talent/home-content";

export function InsightsScreen() {
  const [active, setActive] = useState<CareerGuide | null>(null);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-8">
        <TPageHeader title="취업 소식" description="직무 이야기부터 취업 노하우까지, 취업 준비에 도움되는 정보를 모았어요." />

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
    </TalentAppShell>
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
