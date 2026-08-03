"use client";

// 이력서 A4 미리보기 — 실제 이력서 형태를 고정 A4(794×1123, 96dpi) 로 렌더하고
// 담긴 컨테이너 폭에 맞춰 축소(transform scale)해서 보여준다.
import { useEffect, useRef, useState } from "react";
import { SECTION_META, type CareerSection } from "../../../lib/talent/career-chat";
import { displayMonth, type ResumeDoc } from "../../../lib/talent/resume-doc";
import type { BasicInfo } from "../../../lib/talent/basic-info";
import { PdfBrandFooter } from "./pdf-print";

const PAGE_W = 794;
const PAGE_H = 1123;
const SECTION_ORDER: CareerSection[] = ["education", "experience", "project", "certificate", "skill", "award", "activity"];

// 컨테이너 폭에 맞춰 A4 한 장을 축소해서 보여준다.
export function ResumeA4Preview({ doc, info, maxWidth }: { doc: ResumeDoc; info: BasicInfo; maxWidth?: number }) {
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
      <div className="mx-auto overflow-hidden rounded-[8px] border border-[#E5E8EB] bg-white shadow-[0_8px_28px_rgba(11,18,39,0.10)]" style={{ width: target || undefined, height: scale ? PAGE_H * scale : undefined }}>
        {scale ? (
          <div style={{ width: PAGE_W, height: PAGE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            <ResumeA4Page doc={doc} info={info} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// 실제 A4 한 장(고정 픽셀). 축소는 바깥에서.
function ResumeA4Page({ doc, info }: { doc: ResumeDoc; info: BasicInfo }) {
  const contact = [info.email, info.phone, info.address].filter(Boolean);
  return (
    <div className="flex h-full w-full flex-col bg-white px-[56px] py-[52px] text-[#191F28]">
      {/* 헤더 — 프로필 사진(있으면) 맨 왼쪽 */}
      <header className="flex items-start gap-6 border-b border-[#E5E8EB] pb-6">
        {info.photoUrl && doc.showPhoto === true ? (
          <span className="h-[104px] w-[84px] shrink-0 overflow-hidden rounded-[6px] border border-[#E5E8EB] bg-[#F2F4F6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.photoUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[32px] font-black leading-tight tracking-[-0.02em] text-[#0B1227]">{info.realName || "이름"}</p>
          {doc.targetRole ? <p className="mt-1.5 text-[16px] font-bold text-[#0B46E8]">{doc.targetRole} 지원</p> : null}
          <div className="mt-4 flex flex-col gap-1 text-[13px] leading-relaxed text-[#4E5968]">
            {contact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        </div>
      </header>

      {/* 본문 */}
      <div className="mt-8 flex flex-col gap-7">
        {SECTION_ORDER.map((section) => {
          const items = doc.items.filter((it) => it.section === section);
          if (items.length === 0) return null;
          const meta = SECTION_META[section];
          return (
            <section key={section}>
              <h2 className="border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{meta.label}</h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {items.map((it) => {
                  const range = [it.startDate, it.endDate].map((d) => displayMonth(d ?? "")).filter(Boolean).join(" – ");
                  return (
                    <li key={it.id} className="flex items-start gap-3 break-keep text-[13.5px] leading-relaxed text-[#333D4B]">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                      <span className="min-w-0 flex-1">{it.text}</span>
                      {range ? <span className="shrink-0 text-[12px] font-medium text-[#8B95A1]">{range}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {doc.items.length === 0 ? <p className="text-[13.5px] text-[#B0B8C1]">항목을 추가하면 여기에 이력서로 정리돼요.</p> : null}
      </div>

      <PdfBrandFooter />
    </div>
  );
}
