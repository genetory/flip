"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { Eye, X } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumePreview } from "./ResumePreview";
import { Button } from "../ui/button";
import type { ResumeContent } from "../../lib/member-profile-client";
import type { ResumeDesignSettings } from "../../lib/resume-maker-types";

// resume-maker 공용 작업 레이아웃 — 좌측은 단계별 콘텐츠, 우측엔 항상 실시간
// 미리보기. 데스크탑 2단 / 모바일 단일 + 하단 '미리보기' 시트.

export function ResumeMakerWorkspace({
  title,
  right,
  content,
  design,
  previewHref,
  children
}: {
  title?: string;
  right?: ReactNode;
  content: ResumeContent | null;
  design: ResumeDesignSettings;
  previewHref?: string;
  children: ReactNode;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <ResumeMakerShell title={title} right={right}>
      <div className="mx-auto grid max-w-6xl lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
        {/* 좌측: 단계 콘텐츠 */}
        <div className="px-5 py-6 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
          <div className="mx-auto max-w-2xl">{children}</div>
        </div>
        {/* 우측: 항상 미리보기 (데스크탑) */}
        <div className="hidden border-l border-border/60 bg-muted/30 px-5 py-6 lg:block lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
          {previewHref ? (
            <div className="mb-4 flex items-center justify-end">
              <Link
                href={previewHref}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0B46E8] shadow-card transition hover:bg-primary/5"
              >
                <Eye className="h-4 w-4" weight="bold" aria-hidden /> 미리보기·PDF
              </Link>
            </div>
          ) : null}
          {content ? (
            <ResumePreview content={content} design={design} />
          ) : (
            <p className="mt-10 text-center text-[13px] text-muted-foreground">미리보기가 여기에 표시돼요.</p>
          )}
        </div>
      </div>

      {/* 모바일: 하단 미리보기 버튼 + 시트 */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-5 py-3 backdrop-blur lg:hidden">
        <Button variant="outline" size="lg" className="w-full" onClick={() => setPreviewOpen(true)}>
          <Eye weight="bold" /> 이력서 미리보기
        </Button>
      </div>
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-[14px] font-bold text-[#0B1227]">미리보기</span>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label="닫기" className="rounded-lg p-1.5 hover:bg-muted">
              <X className="h-5 w-5" weight="bold" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
            {content ? <ResumePreview content={content} design={design} /> : null}
          </div>
        </div>
      ) : null}
    </ResumeMakerShell>
  );
}
