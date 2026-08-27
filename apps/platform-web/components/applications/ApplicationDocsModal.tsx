"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { CoverLetterSheet } from "../resume-maker/CoverLetterToolPreview";
import { ResumeA4Preview } from "../talent/career/ResumeA4";
import type { ResumeContent } from "../../lib/member-profile-client";
import { isRenewalContent } from "../../lib/talent/renewal-to-resume-content";
import { resumeContentToRenewalDoc } from "../../lib/talent/resume-content-to-doc";
import { EMPTY_RESUME_DOC, type ResumeDoc } from "../../lib/talent/resume-doc";
import { EMPTY_BASIC_INFO, type BasicInfo } from "../../lib/talent/basic-info";
import { usePlatformT } from "../../lib/i18n";

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
  // 리뉴얼(내 커리어) 스냅샷은 content.renewalResume 형태(ResumeContent 아님)로 올 수 있어
  // 느슨하게 받고, 렌더 직전에 형태를 판별한다.
  resumeContent: ResumeContent | Record<string, unknown> | null;
  coverLetter: CoverLetterSnapshot | null;
  initialTab: "resume" | "cover";
  onClose: () => void;
}) {
  const t = usePlatformT();
  const hasResume = Boolean(resumeContent);
  const rawResume = (resumeContent ?? null) as Record<string, unknown> | null;
  const isRenewalResume = Boolean(rawResume && isRenewalContent(rawResume));
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
                {t("이력서", "Resume", "简历", "Sơ yếu lý lịch", "履歴書", "Resume")}
              </button>
            ) : null}
            {hasCover ? (
              <button
                type="button"
                onClick={() => setTab("cover")}
                className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition ${tab === "cover" ? "bg-[#0B46E8] text-white" : "text-[#4E5968]"}`}
              >
                {t("자기소개서", "Cover Letter", "自我介绍信", "Thư giới thiệu bản thân", "自己紹介書", "Surat Lamaran")}
              </button>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white p-2 text-[#4E5968] shadow transition hover:text-[#191F28]" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}>
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>

        {/* 이력서: resume-maker 미리보기(/resume-maker/[id]/preview)와 동일한 뷰로 렌더.
            운영자는 STUDENT 셸 게이트를 피하려 embedded 로 본문만 렌더. */}
        {tab === "resume" && resumeContent ? (
          // 모든 이력서를 talent/partner 와 동일한 ResumeA4 로 렌더. 리뉴얼은 renewalResume 를,
          // Career Launch·구형(ResumeContent)은 ResumeDoc 로 변환해 같은 뷰로 통일.
          <div className="overflow-hidden rounded-lg bg-white">
            <div className="mx-auto w-full max-w-[794px] p-4">
              {isRenewalResume ? (
                <ResumeA4Preview
                  doc={(rawResume!.renewalResume as ResumeDoc | undefined) ?? EMPTY_RESUME_DOC}
                  info={(rawResume!.renewalBasicInfo as BasicInfo | undefined) ?? EMPTY_BASIC_INFO}
                />
              ) : (
                (() => {
                  const { doc, info } = resumeContentToRenewalDoc(resumeContent as ResumeContent);
                  return <ResumeA4Preview doc={doc} info={info} />;
                })()
              )}
            </div>
          </div>
        ) : null}
        {/* 자기소개서: 기존 시트로 렌더(zoom 축소) */}
        {tab === "cover" && coverLetter ? (
          <div ref={boxRef} className="overflow-hidden rounded-lg bg-[#F2F4F6] p-2">
            <div style={{ zoom: scale } as React.CSSProperties}>
              <CoverLetterSheet
                items={(coverLetter.items ?? []).map((it) => ({ id: it.id ?? "", prompt: it.prompt ?? "", answer: it.answer ?? "" }))}
                title={t("자기소개서", "Cover Letter", "自我介绍信", "Thư giới thiệu bản thân", "自己紹介書", "Surat Lamaran")}
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
