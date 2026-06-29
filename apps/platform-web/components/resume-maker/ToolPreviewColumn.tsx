"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye } from "@phosphor-icons/react/dist/ssr";
import { ResumePreview } from "./ResumePreview";
import { CoverLetterSheet } from "./CoverLetterToolPreview";
import { Button } from "../ui/button";
import type { ResumeContent } from "../../lib/member-profile-client";
import type { ResumeDesignSettings } from "../../lib/resume-maker-types";
import type { CoverLetter } from "../../lib/cover-letter-client";
import { useShellCopy } from "../../lib/resume-maker-i18n/shell";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";
import { useEditorCopy } from "../../lib/resume-maker-i18n/editor";

// 공고 맞춤·모의 면접의 우측 미리보기 컬럼 — 이력서 A4 + (선택 시) 자기소개서 A4 를
// 상단 토글로 전환해 보여준다. 자소서가 없으면 이력서 미리보기만(기존과 동일).
const A4_W = 794;
const A4_H = 1123;

export function ToolPreviewColumn({
  resumeContent,
  design,
  resumePdfHref,
  coverLetter
}: {
  resumeContent: ResumeContent | null;
  design: ResumeDesignSettings;
  resumePdfHref: string;
  coverLetter: CoverLetter | null;
}) {
  const shell = useShellCopy();
  const picker = useToolPickerCopy();
  const t = useEditorCopy();
  const [tab, setTab] = useState<"resume" | "cover">("resume");
  // 자소서를 함께 선택했으면 토글 노출(답변이 비어 있어도 보이게 — 빈 시트로 표시).
  const hasCover = Boolean(coverLetter);
  const showCover = hasCover && tab === "cover";
  const coverPdfHref = coverLetter ? `/resume-maker/cover-letters/${coverLetter.id}/preview` : "";
  const pdfHref = showCover ? coverPdfHref : resumePdfHref;

  // 자기소개서 시트 — 컨테이너 폭에 맞춰 scale(이력서 미리보기와 동일).
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pages, setPages] = useState(1);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const sync = () => setScale(Math.min(1, el.clientWidth / A4_W));
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [showCover]);
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    setPages(Math.max(1, Math.ceil(el.scrollHeight / A4_H)));
  });

  return (
    <>
      <aside className="hidden border-l border-border/60 bg-muted/30 px-5 py-6 lg:block lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
        <div className="mb-2 flex items-center justify-between gap-2 text-[12px]">
          {hasCover ? (
            <div className="inline-flex items-center rounded-full bg-[#F2F4F6] p-0.5">
              <button
                type="button"
                onClick={() => setTab("resume")}
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition ${tab === "resume" ? "bg-white text-[#0B46E8] shadow-sm" : "text-[#8B95A1]"}`}
              >
                {shell.toolResumeMaker}
              </button>
              <button
                type="button"
                onClick={() => setTab("cover")}
                className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition ${tab === "cover" ? "bg-white text-[#0B46E8] shadow-sm" : "text-[#8B95A1]"}`}
              >
                {shell.toolCoverLetter}
              </button>
            </div>
          ) : (
            <span className="font-bold text-muted-foreground">{picker.preview}</span>
          )}
          <Link
            href={pdfHref}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#0B46E8] shadow-card transition hover:bg-[#EDF1FD]"
          >
            <Eye weight="bold" className="h-3.5 w-3.5" /> {picker.previewPdf}
          </Link>
        </div>

        {showCover && coverLetter ? (
          <>
          <div className="mb-2 text-[12px] text-muted-foreground">{t.clA4Label(pages)}</div>
          <div ref={wrapRef} className="w-full" style={{ height: A4_H * scale * pages + (pages - 1) * 8 * scale }}>
            <div style={{ position: "relative", width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <CoverLetterSheet
                innerRef={sheetRef}
                items={coverLetter.items}
                title={t.hdrCoverLetterTitle}
                companyName={coverLetter.company?.trim() || undefined}
                emptyLabel={t.clEmpty}
              />
            </div>
          </div>
          </>
        ) : resumeContent ? (
          <ResumePreview content={resumeContent} design={design} />
        ) : null}
      </aside>

      {/* 모바일 — 하단 PDF 버튼(현재 탭 문서로) */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur lg:hidden">
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href={pdfHref}>
            <Eye weight="bold" /> {picker.previewPdf}
          </Link>
        </Button>
      </div>
    </>
  );
}
