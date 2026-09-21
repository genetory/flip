"use client";

// AI로 다듬기 — 바로 덮어쓰지 않고 원래 글과 다듬은 글을 나란히 보여 준 뒤 사용자가 고른다.
// 다듬기 자체(어떤 API·스타일)는 부르는 쪽이 polish 로 넘긴다(경력=polish-experience, 자기소개·자소서=polish-intro).
// 포인트는 쓰지 않는다(무료) — 서버는 분당·일일 이용 한도만 두고, 걸리면 그 안내 문구를 그대로 보여 준다.
import { useEffect, useRef, useState } from "react";
import { Sparkle } from "@phosphor-icons/react";
import { useToast } from "../../toast/ToastProvider";
import type { PlatformT } from "../../../lib/i18n";
import type { PolishStyle } from "../../../lib/resume-maker-client";
import { charCount } from "../../../lib/talent/cover-layout";

type Result = { style: PolishStyle; original: string; polished: string };

function styles(t: PlatformT): { style: PolishStyle; label: string; hint: string }[] {
  return [
    { style: "concise", label: t("간결하게", "Concise", "简洁", "Ngắn gọn", "簡潔に", "Ringkas"), hint: t("핵심만 짧게", "Keep only the essentials", "只留核心", "Chỉ giữ ý chính", "要点だけ短く", "Inti saja") },
    { style: "expand", label: t("구체적으로", "Detailed", "具体", "Chi tiết", "具体的に", "Rinci"), hint: t("맥락·역할을 풍부하게", "Add context & detail", "补充背景与角色", "Thêm bối cảnh, vai trò", "文脈・役割を補足", "Tambah konteks & peran") },
    { style: "professional", label: t("정중하게", "Professional", "正式", "Trang trọng", "丁寧に", "Formal"), hint: t("격식 있는 전문가 톤", "Formal, professional tone", "专业正式语气", "Giọng chuyên nghiệp", "丁寧な文体", "Nada profesional") }
  ];
}

/** 부르는 쪽에서 모듈이 바뀌면 key 로 새로 그려 비교 결과가 다른 모듈에 남지 않게 한다. */
export function AiPolish({
  t,
  title,
  text,
  polish,
  onApply
}: {
  t: PlatformT;
  /** 기본 'AI로 다듬기'. */
  title?: string;
  text: string;
  polish: (text: string, style: PolishStyle) => Promise<string>;
  onApply: (text: string) => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState<PolishStyle | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const compareRef = useRef<HTMLDivElement | null>(null);
  const choices = styles(t);
  // 비교가 속성 패널 아래로 열려 안 보일 수 있어, 결과가 오면 그 자리로 스크롤한다.
  useEffect(() => {
    if (result) compareRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [result]);
  // 비교 중이면 원래 글(요청 당시)을 기준으로 다시 다듬는다 — 다듬은 글을 또 다듬지 않게.
  const source = (result?.original ?? text).trim();

  const run = async (style: PolishStyle) => {
    if (busy || !source) return;
    setBusy(style);
    try {
      const polished = await polish(source, style);
      setResult({ style, original: source, polished });
    } catch (err) {
      // 이용 한도 안내처럼 사람이 읽을 문구면 그대로, 'ai unavailable' 같은 내부 메시지면 일반 안내로.
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        /[가-힣]/.test(msg)
          ? msg
          : t("AI로 다듬지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't polish with AI. Please try again shortly.", "AI 润色失败，请稍后再试。", "Không thể chỉnh bằng AI. Vui lòng thử lại sau.", "AIで整えられませんでした。しばらくしてから再度お試しください。", "Gagal memoles dengan AI. Coba lagi nanti.")
      );
    } finally {
      setBusy(null);
    }
  };

  const label = (s: PolishStyle) => choices.find((c) => c.style === s)?.label ?? "";

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-[#E5E8EB] p-3" data-ai-polish>
      <div className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#0B46E8]">
        <Sparkle size={14} weight="fill" />
        {result ? t("다른 스타일로 다시 다듬기", "Try another style", "换一种风格", "Thử phong cách khác", "別のスタイルで整える", "Coba gaya lain") : title ?? t("AI로 다듬기", "Polish with AI", "用 AI 润色", "Chỉnh bằng AI", "AIで整える", "Poles dengan AI")}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {choices.map((c) => (
          <button
            key={c.style}
            type="button"
            title={c.hint}
            onClick={() => void run(c.style)}
            disabled={!!busy || !source}
            aria-pressed={result?.style === c.style}
            className={`h-9 rounded-lg border text-[12px] font-semibold disabled:cursor-default disabled:opacity-50 ${
              result?.style === c.style ? "border-[#0B46E8] bg-[#EDF1FD] text-[#0B46E8]" : "border-[#E5E8EB] bg-white text-[#333D4B] hover:bg-[#F7F8FA]"
            }`}
          >
            {busy === c.style ? t("다듬는 중…", "Polishing…", "润色中…", "Đang chỉnh…", "整えています…", "Memoles…") : c.label}
          </button>
        ))}
      </div>
      {!source ? <p className="text-[11.5px] text-[#8B95A1]">{t("내용을 먼저 적어 주세요.", "Write something first.", "请先填写内容。", "Hãy viết nội dung trước.", "先に内容を書いてください。", "Tulis isi terlebih dahulu.")}</p> : null}

      {result ? (
        <div ref={compareRef} className="flex flex-col gap-2" aria-live="polite">
          <Compare title={t("원래 글", "Original", "原文", "Bản gốc", "元の文", "Asli")} text={result.original} t={t} />
          <Compare title={`${t("다듬은 글", "Polished", "润色后", "Đã chỉnh", "整えた文", "Hasil poles")} · ${label(result.style)}`} text={result.polished} t={t} highlight />
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setResult(null)} className="h-10 rounded-lg border border-[#E5E8EB] bg-white text-[13px] font-semibold text-[#4E5968] hover:bg-[#F7F8FA]">
              {t("원래 글 유지", "Keep original", "保留原文", "Giữ bản gốc", "元の文のまま", "Pakai asli")}
            </button>
            <button
              type="button"
              onClick={() => {
                onApply(result.polished);
                setResult(null);
                toast.success(t("다듬은 글로 바꿨어요", "Replaced with polished text", "已替换为润色后的文字", "Đã thay bằng bản đã chỉnh", "整えた文に置き換えました", "Diganti dengan hasil poles"));
              }}
              className="h-10 rounded-lg bg-[#0B46E8] text-[13px] font-bold text-white hover:bg-[#0A3ECB]"
            >
              {t("다듬은 글 쓰기", "Use polished", "使用润色后", "Dùng bản đã chỉnh", "整えた文を使う", "Pakai hasil poles")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Compare({ t, title, text, highlight }: { t: PlatformT; title: string; text: string; highlight?: boolean }) {
  return (
    <section className={`rounded-lg px-3 py-2.5 ${highlight ? "bg-[#EDF1FD]" : "bg-[#F7F8FA]"}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className={`text-[11.5px] font-bold ${highlight ? "text-[#0B46E8]" : "text-[#6B7684]"}`}>{title}</span>
        <span className="text-[11px] tabular-nums text-[#8B95A1]">{t(`${charCount(text).toLocaleString()}자`, `${charCount(text).toLocaleString()} chars`)}</span>
      </div>
      <p className="max-h-[220px] overflow-y-auto whitespace-pre-wrap text-[12.5px] leading-relaxed text-[#333D4B]">{text}</p>
    </section>
  );
}
