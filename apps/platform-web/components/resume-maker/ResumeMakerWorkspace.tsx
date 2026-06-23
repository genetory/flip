"use client";

import { type ReactNode, useState } from "react";
import Link from "next/link";
import { Eye, X } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeBackBar } from "./ResumeBackBar";
import { ResumePreview } from "./ResumePreview";
import { Button } from "../ui/button";
import type { ResumeContent } from "../../lib/member-profile-client";
import type { ResumeDesignSettings } from "../../lib/resume-maker-types";
import { useWorkspaceCopy } from "../../lib/resume-maker-i18n/workspace";

// resume-maker 공용 작업 레이아웃 — 좌 콘텐츠 / 우 실시간 미리보기.
// nav(섹션 레일)를 주면 3컬럼(좌 섹션 / 중 작업 / 우 미리보기), 없으면 2컬럼.
// 데스크탑은 우측에 미리보기, 모바일은 하단 버튼→팝업.

export function ResumeMakerWorkspace({
  right,
  content,
  design,
  previewHref,
  nav,
  back,
  children
}: {
  right?: ReactNode;
  content: ResumeContent | null;
  design: ResumeDesignSettings;
  previewHref?: string;
  // 섹션 리스트(세로 레일). 주어지면 3컬럼으로 그린다.
  nav?: ReactNode;
  // GNB 아래 뒤로가기 바(상위 화면으로).
  back?: { href: string; label: string; title?: string };
  children: ReactNode;
}) {
  const t = useWorkspaceCopy();
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewBody = content ? (
    <ResumePreview content={content} design={design} />
  ) : (
    <p className="mt-10 text-center text-[13px] text-muted-foreground">{t.previewPlaceholder}</p>
  );

  return (
    <ResumeMakerShell right={right}>
      {back ? <ResumeBackBar backHref={back.href} backLabel={back.label} title={back.title} /> : null}
      <div
        className={`mx-auto grid max-w-6xl gap-0 ${
          nav
            ? "lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.2fr)]"
            : "lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]"
        }`}
      >
        {/* 섹션 레일 (3컬럼일 때만) — 데스크탑 세로, 모바일은 상단 가로 */}
        {nav ? (
          <div className="min-w-0 border-b border-border/60 px-5 pt-6 lg:border-b-0 lg:border-r lg:py-6 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
            {nav}
          </div>
        ) : null}
        {/* 콘텐츠 */}
        <div className="min-w-0 border-r border-border/60 px-5 py-6 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">{children}</div>
        {/* 우측: 실시간 미리보기 (데스크탑) */}
        <div className="hidden bg-muted/30 px-5 py-6 lg:block lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
          {previewHref ? (
            <div className="mb-4 flex items-center justify-end">
              <Link
                href={previewHref}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-[#0B46E8] shadow-card transition hover:bg-primary/5"
              >
                <Eye className="h-4 w-4" weight="bold" aria-hidden /> {t.previewPdf}
              </Link>
            </div>
          ) : null}
          {previewBody}
        </div>
      </div>

      {/* 모바일: 하단 미리보기 버튼 + 시트 */}
      <div className="sticky bottom-0 z-30 border-t border-border bg-background/95 px-5 py-3 backdrop-blur lg:hidden">
        <Button variant="outline" size="lg" className="w-full" onClick={() => setPreviewOpen(true)}>
          <Eye weight="bold" /> {t.previewResume}
        </Button>
      </div>
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-[14px] font-bold text-[#0B1227]">{t.preview}</span>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label={t.close} className="rounded-lg p-1.5 hover:bg-muted">
              <X className="h-5 w-5" weight="bold" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-muted/30 p-4">{previewBody}</div>
        </div>
      ) : null}
    </ResumeMakerShell>
  );
}
