"use client";

import { type ComponentProps } from "react";
import Link from "next/link";
import { Eye } from "@phosphor-icons/react/dist/ssr";
import { ResumePreview } from "./ResumePreview";
import { Button } from "../ui/button";
import type { ResumeContent } from "../../lib/member-profile-client";
import type { ResumeDesignSettings } from "../../lib/resume-maker-types";

// 도구 페이지(공고 맞춤·모의 면접) + 이력서 편집의 우측 이력서 미리보기.
// 데스크탑은 우측 작은 미리보기 + '미리보기·PDF' 링크, 모바일은 하단 'PDF' 버튼 → PDF 화면으로 이동.
// 2컬럼 그리드의 마지막 자식으로 두면 됨(모바일 버튼은 lg:hidden, 그리드 컬럼에 영향 없음).
// highlightSection: 편집 화면에서 입력 중인 섹션을 미리보기에서 강조(옵션).
// pdfHref/pdfLabel: 둘 다 주면 PDF 미리보기 화면으로 가는 링크를 노출(옵션).
export function ResumeToolPreview({
  content,
  design,
  previewLabel,
  highlightSection,
  pdfHref,
  pdfLabel
}: {
  content: ResumeContent | null;
  design: ResumeDesignSettings;
  previewLabel: string;
  highlightSection?: ComponentProps<typeof ResumePreview>["highlightSection"];
  pdfHref?: string;
  pdfLabel?: string;
}) {
  const body = content ? <ResumePreview content={content} design={design} highlightSection={highlightSection} /> : null;
  const hasPdf = Boolean(pdfHref && pdfLabel);
  return (
    <>
      {/* 데스크탑 — 우측 작은 미리보기(독립 스크롤) */}
      <aside className="hidden border-l border-border/60 bg-muted/30 px-5 py-6 lg:block lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold text-muted-foreground">{previewLabel}</span>
            {hasPdf ? (
              <Link
                href={pdfHref as string}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#0B46E8] shadow-card transition hover:bg-[#EDF1FD]"
              >
                <Eye weight="bold" className="h-3.5 w-3.5" /> {pdfLabel}
              </Link>
            ) : null}
          </div>
          {body}
        </div>
      </aside>

      {/* 모바일 — 하단 PDF 미리보기 버튼 */}
      {hasPdf ? (
        <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-5 py-3 backdrop-blur lg:hidden">
          <Button asChild variant="outline" size="lg" className="w-full">
            <Link href={pdfHref as string}>
              <Eye weight="bold" /> {pdfLabel}
            </Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}
