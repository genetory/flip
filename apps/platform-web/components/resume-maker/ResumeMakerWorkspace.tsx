"use client";

import { type ReactNode } from "react";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeBackBar } from "./ResumeBackBar";
import { ResumeToolPreview } from "./ResumeToolPreview";
import type { ResumeContent } from "../../lib/member-profile-client";
import type { ResumeDesignSettings } from "../../lib/resume-maker-types";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

// resume-maker 공용 작업 레이아웃 — 좌 콘텐츠 / 우 이력서 미리보기(편집·공고맞춤·모의면접과 동일 컬럼).
// nav(섹션 레일)를 주면 3컬럼(좌 섹션 / 중 작업 / 우 미리보기), 없으면 2컬럼.
// 우측 미리보기는 ResumeToolPreview 로 통일(데스크탑 작은 미리보기 + 미리보기·PDF, 모바일 하단 버튼).

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
  const picker = useToolPickerCopy();

  return (
    <ResumeMakerShell right={right}>
      {back ? <ResumeBackBar backHref={back.href} backLabel={back.label} title={back.title} /> : null}
      <div
        className={`mx-auto grid max-w-6xl gap-0 ${
          nav ? "lg:grid-cols-[200px_minmax(0,1fr)_360px]" : "lg:grid-cols-[minmax(0,1fr)_360px]"
        }`}
      >
        {/* 섹션 레일 (3컬럼일 때만) — 데스크탑 세로, 모바일은 상단 가로 */}
        {nav ? (
          <div className="min-w-0 border-b border-border/60 px-4 pt-6 sm:px-5 lg:border-b-0 lg:border-r lg:py-6 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
            {nav}
          </div>
        ) : null}
        {/* 콘텐츠 */}
        <div className="min-w-0 border-r border-border/60 px-4 py-6 sm:px-5 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">{children}</div>
        {/* 우측: 이력서 미리보기 — 다른 화면과 동일한 컬럼 */}
        <ResumeToolPreview
          content={content}
          design={design}
          previewLabel={picker.preview}
          pdfHref={previewHref}
          pdfLabel={previewHref ? picker.previewPdf : undefined}
        />
      </div>
    </ResumeMakerShell>
  );
}
