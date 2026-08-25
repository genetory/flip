"use client";

import { useState } from "react";
import { CircleNotch, Sparkle, Trash } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { AiTicketCost } from "./AiTicketCost";
import { useToast } from "../toast/ToastProvider";
import { useEditorCopy } from "../../lib/resume-maker-i18n/editor";
import { usePolishStyleLabel } from "../../lib/resume-maker-i18n/labels";
import { generateCoverLetter, POLISH_STYLES, type PolishStyle } from "../../lib/resume-maker-client";
import type { ResumeCoverLetterItem } from "../../lib/member-profile-client";

// 자기소개서 문항 1개 편집기 — 3컬럼 편집기의 가운데(선택된 문항)에서 사용.
// 문항(prompt) + 답변(answer) + 초안 작성 + AI 다듬기(소재·형식·다듬기) + 결과 미리보기.
export type CoverLetterContext = {
  desiredJobRole?: string;
  jobCategories?: string[];
  summary?: string;
  selfIntroduction?: string;
  experiences?: { type?: string; title?: string; org?: string; period?: string; summary?: string; bullets?: string[] }[];
  education?: { school?: string; major?: string; status?: string }[];
  skills?: string[];
  languages?: { language?: string; level?: string }[];
};

const CL_TARGET_OPTIONS = [500, 800, 1000];

export function CoverLetterItemEditor({
  item,
  index,
  onChange,
  onRemove,
  company,
  resumeContext,
  promptEditable = true,
  removable = true
}: {
  item: ResumeCoverLetterItem;
  index: number;
  onChange: (patch: Partial<ResumeCoverLetterItem>) => void;
  onRemove: () => void;
  company: string;
  resumeContext: CoverLetterContext;
  promptEditable?: boolean; // 표준 문항은 제목 고정
  removable?: boolean; // 표준 문항은 삭제 불가
}) {
  const t = useEditorCopy();
  const toast = useToast();
  const polishLabel = usePolishStyleLabel();
  const [busy, setBusy] = useState<"draft" | "polish" | null>(null);
  const [target, setTarget] = useState(800);
  const [kwInput, setKwInput] = useState("");
  const [selStyle, setSelStyle] = useState<PolishStyle>("natural");
  const [preview, setPreview] = useState<string | null>(null);

  const keywords = () => kwInput.split("\n").map((s) => s.trim()).filter(Boolean).slice(0, 10);
  const kwPlaceholder = t.clStandardPrompts.find((p) => p.prompt === item.prompt.trim())?.example ?? t.clKeywordPlaceholder;
  // 답변 플레이스홀더도 문항(카테고리)별 예시로 — 표준 문항이면 해당 예시, 아니면 기본 안내.
  const answerPlaceholder = t.clStandardPrompts.find((p) => p.prompt === item.prompt.trim())?.example ?? t.clAnswerPlaceholder;
  const chars = item.answer.trim().length;

  async function run(mode: "draft" | "polish") {
    if (!item.prompt.trim()) {
      toast.info(t.clNeedPrompt);
      return;
    }
    const kw = keywords();
    let effMode = mode;
    if (mode === "polish" && item.answer.trim().length < 10) {
      if (kw.length) effMode = "draft";
      else {
        toast.info(t.clWriteForPolish);
        return;
      }
    }
    setBusy(mode);
    try {
      const text = await generateCoverLetter({
        mode: effMode,
        style: selStyle,
        prompt: item.prompt.trim(),
        current: item.answer.trim() || undefined,
        keywords: kw.length ? kw : undefined,
        targetChars: target,
        companyName: company.trim() || undefined,
        ...resumeContext
      });
      setPreview(text);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t.clDraftFailed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      {/* 문항 — 표준은 고정 제목, 직접 추가는 편집 가능 + 삭제 */}
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[11px] font-bold text-[#0B46E8]">{index + 1}</span>
        {promptEditable ? (
          <input
            className="min-w-0 flex-1 rounded-lg border border-transparent bg-[#F2F4F6] px-3 py-2 text-[14px] font-semibold text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:bg-white focus:outline-none"
            placeholder={t.clPromptPlaceholder}
            value={item.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
          />
        ) : (
          <p className="min-w-0 flex-1 truncate px-1 text-[15px] font-bold text-[#191F28]">{item.prompt}</p>
        )}
        {removable ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={t.clRemove}
            className="shrink-0 rounded-lg p-1.5 text-[#8B95A1] transition hover:bg-destructive/5 hover:text-destructive"
          >
            <Trash weight="bold" className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {/* 답변 */}
      <textarea
        className="mt-2.5 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-[#0B46E8] focus:outline-none"
        rows={10}
        placeholder={answerPlaceholder}
        value={item.answer}
        onChange={(e) => onChange({ answer: e.target.value })}
      />

      {/* AI 결과 미리보기 — 적용 전 검토(변경하기/취소) */}
      {preview != null ? (
        <div className="mt-2.5 rounded-2xl border border-[#0B46E8]/30 bg-[#EDF1FD]/60 p-4">
          <p className="text-[12px] font-bold text-[#0B46E8]">{t.clPreviewTitle}</p>
          <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">{preview}</p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                onChange({ answer: preview ?? "" });
                setPreview(null);
              }}
            >
              {t.clApply}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
              {t.clCancel}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11.5px] font-medium tabular-nums text-[#8B95A1]">{t.clCharCount(chars, target)}</span>
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[11.5px] text-[#8B95A1]">{t.clTargetLabel}</span>
          {CL_TARGET_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTarget(n)}
              className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition ${
                target === n ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E8EBF0]"
              }`}
            >
              {n}
              {t.clCharUnit}
            </button>
          ))}
        </div>
      </div>

      {/* 초안 작성 */}
      <div className="mt-2.5">
        <Button size="sm" disabled={busy !== null} onClick={() => void run("draft")}>
          {busy === "draft" ? <CircleNotch className="animate-spin" weight="bold" /> : <Sparkle weight="fill" />}
          {busy === "draft" ? t.clGenerating : t.clDraft}
          {busy === "draft" ? null : <AiTicketCost feature="cover_letter" />}
        </Button>
      </div>

      {/* AI로 다듬기: ①소재 입력 ②형식 선택 ③다듬기 버튼 */}
      <div className="mt-3 rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6] p-5">
        <p className="mb-3 text-[12px] font-semibold text-[#4E5968]">{t.polishWithAi}</p>
        <div className="mb-3">
          <textarea
            className="w-full rounded-lg border border-[#E5E8EB] bg-white px-2.5 py-2 text-[12.5px] leading-relaxed text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
            rows={2}
            placeholder={kwPlaceholder}
            value={kwInput}
            onChange={(e) => setKwInput(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {POLISH_STYLES.map((s) => {
            const active = selStyle === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setSelStyle(s.value)}
                className={`rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition ${
                  active ? "border-[#0B46E8] bg-[#EDF1FD] text-[#0B46E8]" : "border-border bg-white text-foreground/80 hover:border-[#0B46E8]/40"
                }`}
              >
                {polishLabel(s.value)}
              </button>
            );
          })}
          <Button size="sm" variant="outline" className="ml-auto" disabled={busy !== null} onClick={() => void run("polish")}>
            {busy === "polish" ? <CircleNotch className="animate-spin" weight="bold" /> : <Sparkle weight="fill" />}
            {busy === "polish" ? t.clGenerating : t.clPolish}
            {busy === "polish" ? null : <AiTicketCost feature="cover_letter" tone="muted" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
