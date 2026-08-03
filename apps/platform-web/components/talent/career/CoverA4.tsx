"use client";

// 자기소개서 A4 미리보기 — 실제 문서 형태(문항 + 답변)를 고정 A4로 렌더하고 축소.
import { useEffect, useRef, useState } from "react";
import { COVER_QUESTIONS, type CoverDoc } from "../../../lib/talent/cover-doc";
import type { BasicInfo } from "../../../lib/talent/basic-info";
import { PdfBrandFooter } from "./pdf-print";

const PAGE_W = 794;
const PAGE_H = 1123;

export function CoverA4Preview({ doc, info, maxWidth }: { doc: CoverDoc; info: BasicInfo; maxWidth?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const target = maxWidth ? Math.min(w, maxWidth) : w;
  const scale = target > 0 ? target / PAGE_W : 0;

  return (
    <div ref={ref} className="w-full">
      <div
        className="mx-auto overflow-hidden rounded-[8px] border border-[#E5E8EB] bg-white shadow-[0_8px_28px_rgba(11,18,39,0.10)]"
        style={{ width: target || undefined, height: scale ? PAGE_H * scale : undefined }}
      >
        {scale ? (
          <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <CoverA4Page doc={doc} info={info} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CoverA4Page({ doc, info }: { doc: CoverDoc; info: BasicInfo }) {
  const contact = [info.email, info.phone, info.address].filter(Boolean);
  return (
    <div className="flex h-full w-full flex-col bg-white px-[56px] py-[52px] text-[#191F28]">
      {/* 헤더 — 이력서와 동일 */}
      <header className="flex items-start gap-6 border-b border-[#E5E8EB] pb-6">
        {info.photoUrl && doc.showPhoto === true ? (
          <span className="h-[104px] w-[84px] shrink-0 overflow-hidden rounded-[6px] border border-[#E5E8EB] bg-[#F2F4F6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.photoUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[32px] font-black leading-tight tracking-[-0.02em] text-[#0B1227]">{info.realName || "이름"}</p>
          <div className="mt-4 flex flex-col gap-1 text-[13px] leading-relaxed text-[#4E5968]">
            {contact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-7">
        {doc.items.length === 0 ? (
          <p className="text-[13.5px] text-[#B0B8C1]">문항에 답을 채우면 여기에 자기소개서로 정리돼요.</p>
        ) : null}
        {COVER_QUESTIONS.map((q) => {
          const items = doc.items.filter((it) => it.question === q);
          if (items.length === 0) return null;
          return (
            <section key={q}>
              <h2 className="border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{q}</h2>
              <div className="mt-3 flex flex-col gap-2.5">
                {items.map((it) => (
                  <p key={it.id} className="whitespace-pre-line break-keep text-[13.5px] leading-[1.9] text-[#333D4B]">{it.text}</p>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <PdfBrandFooter />
    </div>
  );
}
