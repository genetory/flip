"use client";

import { useState } from "react";
import { ArrowsOut, X } from "@phosphor-icons/react/dist/ssr";
import { ResumePreview } from "./ResumePreview";
import { Button } from "../ui/button";
import type { ResumeContent } from "../../lib/member-profile-client";
import type { ResumeDesignSettings } from "../../lib/resume-maker-types";

// 도구 페이지(공고 맞춤·모의 면접)의 우측 이력서 미리보기.
// 데스크탑은 우측 작은 미리보기 + '크게 보기', 모바일은 하단 버튼 → 둘 다 전체화면 모달로 확대.
// 2컬럼 그리드의 2번째 자식으로 두면 됨(모바일 버튼은 lg:hidden, 모달은 fixed 라 그리드에 영향 없음).
export function ResumeToolPreview({
  content,
  design,
  expandLabel,
  previewLabel
}: {
  content: ResumeContent | null;
  design: ResumeDesignSettings;
  expandLabel: string;
  previewLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const body = content ? <ResumePreview content={content} design={design} /> : null;
  return (
    <>
      {/* 데스크탑 — 우측 작은 미리보기(독립 스크롤) */}
      <aside className="hidden border-l border-border/60 bg-muted/30 px-5 py-6 lg:block lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[12px] font-bold text-muted-foreground">{previewLabel}</span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-semibold text-[#0B46E8] shadow-card transition hover:bg-primary/5"
            >
              <ArrowsOut weight="bold" className="h-3.5 w-3.5" /> {expandLabel}
            </button>
          </div>
          {body}
        </div>
      </aside>

      {/* 모바일 — 하단 미리보기 버튼 */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-5 py-3 backdrop-blur lg:hidden">
        <Button variant="outline" size="lg" className="w-full" onClick={() => setOpen(true)}>
          {previewLabel}
        </Button>
      </div>

      {/* 크게 보기 모달 */}
      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-[14px] font-bold text-[#0B1227]">{previewLabel}</span>
            <button type="button" onClick={() => setOpen(false)} aria-label={previewLabel} className="rounded-lg p-1.5 hover:bg-muted">
              <X className="h-5 w-5" weight="bold" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-muted/30 p-4">
            <div className="mx-auto max-w-3xl">{body}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
