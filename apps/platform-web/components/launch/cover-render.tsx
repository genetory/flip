"use client";

import type { CoverData } from "../../lib/launch/cover-data";

// 대화로 쌓은 자기소개서 데이터를 문항별로 렌더링(읽기 전용). 빈 문항은 생략.
export function CoverRender({ data }: { data: CoverData }) {
  const items = (data.items ?? []).filter((x) => (x.answer ?? "").trim().length > 0);
  return (
    <div className="rounded-2xl border border-[#E5E8EB] bg-white p-6 md:p-8">
      <header className="border-b border-[#EEF1F5] pb-4">
        <p className="text-[12.5px] font-bold text-[#0B46E8]">자기소개서</p>
        {data.company ? <h1 className="mt-1 text-[18px] font-black tracking-[-0.01em] text-[#0B1227]">{data.company}</h1> : null}
      </header>
      <div className="mt-5 space-y-6">
        {items.map((it, i) => (
          <div key={i}>
            <h2 className="text-[14.5px] font-bold text-[#191F28]">{it.question}</h2>
            <p className="mt-1.5 whitespace-pre-wrap break-keep text-[13.5px] leading-[1.8] text-[#333D4B]">{it.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
