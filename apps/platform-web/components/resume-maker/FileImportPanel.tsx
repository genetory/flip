"use client";

import type { ChangeEvent } from "react";
import { CircleNotch, FilePdf, MagicWand, UploadSimple, X } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { AiTicketCost } from "./AiTicketCost";

// 이력서·자기소개서 공용 PDF 업로드 임포트 패널. 각 섹션 아래에 인라인으로 펼쳐지고
// 우측 상단 X 로 취소(닫기). 모든 문구는 props 로 받아 하드코딩 한국어를 두지 않는다.
export function FileImportPanel({
  title,
  desc,
  uploadLabel,
  uploadHint,
  runLabel,
  readingLabel,
  disclaimer,
  removeLabel,
  cancelLabel,
  feature,
  file,
  busy,
  onPick,
  onRemove,
  onRun,
  onCancel
}: {
  title: string;
  desc: string;
  uploadLabel: string;
  uploadHint?: string;
  runLabel: string;
  readingLabel: string;
  disclaimer: string;
  removeLabel: string;
  cancelLabel: string;
  feature: string;
  file: File | null;
  busy: boolean;
  onPick: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  onRun: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-[#0B1227]">{title}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{desc}</p>
        </div>
        <button type="button" onClick={onCancel} aria-label={cancelLabel} className="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground">
          <X weight="bold" className="h-4 w-4" />
        </button>
      </div>

      {file ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#0B46E8]/40 bg-[#EDF1FD]/60 px-4 py-3">
          <span className="flex min-w-0 items-center gap-2">
            <FilePdf weight="fill" className="h-5 w-5 shrink-0 text-[#0B46E8]" />
            <span className="truncate text-[13.5px] font-medium text-foreground">{file.name}</span>
          </span>
          <button type="button" onClick={onRemove} aria-label={removeLabel} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted">
            <X weight="bold" className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center transition hover:border-[#0B46E8]/50 hover:bg-[#EDF1FD]">
          <UploadSimple weight="bold" className="h-6 w-6 text-[#0B46E8]" />
          <span className="text-[13.5px] font-semibold text-foreground">{uploadLabel}</span>
          {uploadHint ? <span className="text-[12px] text-muted-foreground">{uploadHint}</span> : null}
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPick} />
        </label>
      )}

      <Button variant="hero" size="lg" className="mt-4 w-full" onClick={onRun} disabled={busy || !file}>
        {busy ? <CircleNotch className="animate-spin" weight="bold" /> : <MagicWand weight="fill" />}
        {busy ? readingLabel : runLabel}
        {!busy ? <AiTicketCost feature={feature} tone="plain" /> : null}
      </Button>
      <p className="mt-3 text-[12px] text-muted-foreground">{disclaimer}</p>
    </div>
  );
}
