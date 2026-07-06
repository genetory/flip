"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { CoverLetterSheet } from "../resume-maker/CoverLetterToolPreview";
import { SharedResumePage } from "../pages/SharedResumePage";
import type { ResumeContent, SharedResume } from "../../lib/member-profile-client";

const A4_W = 794;

// 스냅샷 JSON 은 필드가 느슨할 수 있어 optional 로 받고 렌더 직전 정규화한다.
type CoverLetterSnapshot = { title?: string; company?: string | null; items?: Array<{ id?: string; prompt?: string; answer?: string }> };

// 파트너/운영 지원자 상세에서 제출본 스냅샷(이력서·자소서)을 읽기 전용으로 보여주는 모달.
// resume-maker 와 동일한 시트 컴포넌트로 렌더 → 제출 당시 모습 그대로.
export function ApplicationDocsModal({
  resumeContent,
  coverLetter,
  initialTab,
  onClose
}: {
  resumeContent: ResumeContent | null;
  coverLetter: CoverLetterSnapshot | null;
  initialTab: "resume" | "cover";
  onClose: () => void;
}) {
  const hasResume = Boolean(resumeContent);
  const hasCover = Boolean(coverLetter && (coverLetter.items ?? []).some((it) => it?.answer?.trim()));
  const [tab, setTab] = useState<"resume" | "cover">(initialTab === "cover" && hasCover ? "cover" : hasResume ? "resume" : "cover");

  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.9);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const sync = () => setScale(Math.min(1, (el.clientWidth - 4) / A4_W));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [tab]);

  // 제출 스냅샷을 공유뷰(resume-maker /resume/share)와 동일하게 렌더하기 위해
  // 최소 SharedResume 형태로 감싼다. 운영자 시점이므로 연락처까지 노출.
  const sharedResume: SharedResume | null = resumeContent
    ? ({ content: resumeContent, viewerScope: "operator" } as unknown as SharedResume)
    : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4" onClick={onClose}>
      <div className="my-4 w-full max-w-[840px]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-2 flex items-center justify-between">
          <div className="inline-flex items-center gap-1 rounded-full bg-white p-1 shadow">
            {hasResume ? (
              <button
                type="button"
                onClick={() => setTab("resume")}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${tab === "resume" ? "bg-[#0B46E8] text-white" : "text-[#4E5968]"}`}
              >
                이력서
              </button>
            ) : null}
            {hasCover ? (
              <button
                type="button"
                onClick={() => setTab("cover")}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${tab === "cover" ? "bg-[#0B46E8] text-white" : "text-[#4E5968]"}`}
              >
                자기소개서
              </button>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white p-2 text-[#4E5968] shadow transition hover:text-[#191F28]" aria-label="닫기">
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>

        {/* 이력서: 공유 페이지(resume-maker)와 동일한 뷰로 렌더 */}
        {tab === "resume" && sharedResume ? (
          <div className="overflow-hidden rounded-lg bg-white">
            <SharedResumePage slug="" preloaded={sharedResume} />
          </div>
        ) : null}
        {/* 자기소개서: 기존 시트로 렌더(zoom 축소) */}
        {tab === "cover" && coverLetter ? (
          <div ref={boxRef} className="overflow-hidden rounded-lg bg-[#F2F4F6] p-2">
            <div style={{ zoom: scale } as React.CSSProperties}>
              <CoverLetterSheet
                items={(coverLetter.items ?? []).map((it) => ({ id: it.id ?? "", prompt: it.prompt ?? "", answer: it.answer ?? "" }))}
                title="자기소개서"
                companyName={coverLetter.company?.trim() || undefined}
                emptyLabel=""
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
