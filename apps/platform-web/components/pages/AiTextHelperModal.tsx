"use client";

import { useEffect, useState } from "react";
import { Sparkle, X } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  postDraftResumeText,
  type DraftResumeTextFieldType,
  type DraftResumeTextMode,
  type DraftResumeTextResult
} from "../../lib/member-profile-client";

// ---------------------------------------------------------------------------
// 이력서 편집 페이지의 자기소개·경력 설명·활동 설명 textarea 옆에서 띄우는
// AI 작성 도우미 모달. 한 번에 하나만 열림. 적용 시 부모가 textarea 의 값을
// 갱신할 수 있게 onApply 콜백으로 전달.
//
// 동의 게이트: ResumeCoachPanel 과 동일한 localStorage 키를 공유 — 코치에서
// 이미 동의했다면 여기서도 묻지 않음, 반대도 마찬가지.
// ---------------------------------------------------------------------------

const CONSENT_KEY = "aply.ai-coach.consent.v1";

function useTr() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => {
    const map: Record<PlatformLocale, string> = { ko, en, "zh-CN": zh, vi, ja, id };
    return map[locale] ?? ko;
  };
}

function pickInitialMode(currentText: string): DraftResumeTextMode {
  const len = currentText.trim().length;
  if (len === 0) return "generate";
  if (len < 80) return "expand";
  return "improve";
}

export function AiTextHelperModal({
  open,
  onClose,
  fieldType,
  fieldLabel,
  currentText,
  context,
  onApply
}: {
  open: boolean;
  onClose: () => void;
  fieldType: DraftResumeTextFieldType;
  // 모달 헤더와 결과 라벨에 노출. 예: "자기소개", "회사명 - 경력 설명"
  fieldLabel: string;
  currentText: string;
  context?: { companyName?: string; position?: string; title?: string };
  onApply: (text: string) => void;
}) {
  const tr = useTr();

  const [mode, setMode] = useState<DraftResumeTextMode>("improve");
  const [hints, setHints] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [draft, setDraft] = useState<DraftResumeTextResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 동의 상태 — localStorage 와 동기화.
  const [consentGiven, setConsentGiven] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);

  // open 변화 시 상태 초기화 + 첫 mode 선정 + (옵션) 첫 자동 호출.
  useEffect(() => {
    if (!open) return;
    setMode(pickInitialMode(currentText));
    setHints("");
    setShowHints(false);
    setDraft(null);
    setError(null);
    setBusy(false);
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(CONSENT_KEY)) {
        setConsentGiven(true);
      } else {
        setConsentGiven(false);
      }
    } catch {
      setConsentGiven(false);
    }
    // 의도적으로 자동 호출하지 않음 — 사용자가 mode/hints 를 선택하고 명시
    // 적으로 [생성하기] 를 누르게 해서 비용·UX 통제.
  }, [open, currentText]);

  function grantConsent() {
    try {
      window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    } catch {
      // localStorage 차단 환경: 세션 동안만 유효
    }
    setConsentGiven(true);
    setConsentOpen(false);
    // 동의 직후 바로 생성 호출 — 사용자가 [생성] 다시 누르지 않아도 되게.
    setTimeout(() => runDraft(), 0);
  }

  async function runDraft() {
    if (busy) return;
    if (!consentGiven) {
      setConsentOpen(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await postDraftResumeText({
        currentText,
        fieldType,
        mode,
        context,
        hints: hints.trim() || undefined
      });
      setDraft(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("AI 호출에 실패했어요.", "AI request failed.", "AI 调用失败。", "Gọi AI thất bại.", "AI呼び出しに失敗しました。", "Permintaan AI gagal."));
    } finally {
      setBusy(false);
    }
  }

  function applyDraft() {
    if (!draft) return;
    onApply(draft.text);
    onClose();
  }

  if (!open) return null;

  const modeOptions: { value: DraftResumeTextMode; label: string }[] = [
    { value: "improve",  label: tr("다듬기",     "Improve",  "润色", "Trau chuốt", "整える", "Perhalus") },
    { value: "expand",   label: tr("확장",       "Expand",   "扩展", "Mở rộng",     "拡張",   "Perluas") },
    { value: "generate", label: tr("처음부터",   "Generate", "重写", "Tạo mới",     "ゼロから", "Buat baru") }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr("AI 작성 도우미", "AI writing helper", "AI 写作助手", "Trợ lý viết AI", "AI作成アシスタント", "Asisten penulis AI")}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <div
        className="relative flex w-full max-w-2xl max-h-[85vh] flex-col rounded-2xl border border-border bg-card shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header — 타이틀 + 보장 박스 (고정) */}
        <header className="flex-none border-b border-border px-6 pb-4 pt-6">
          <div className="flex items-center gap-2 pr-8">
            <Sparkle className="h-5 w-5 text-foreground" weight="fill" />
            <h3 className="font-display text-lg font-bold">
              {tr("AI 작성 도우미", "AI writing helper", "AI 写作助手", "Trợ lý viết AI", "AI作成アシスタント", "Asisten penulis AI")}
            </h3>
            <span className="text-[12px] text-muted-foreground">· {fieldLabel}</span>
          </div>
          <p className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
            {tr(
              "AI 는 내가 입력한 내용·키워드만 사용해 작성합니다. 없는 경력·회사·수치는 만들어내지 않아요. 결과를 적용할지는 매번 본인이 선택합니다.",
              "AI uses only what you provide — no fabricated jobs, numbers, or companies. You decide each time whether to apply.",
              "AI 仅基于您输入的内容/关键词撰写，不会编造经历、公司或数据。是否应用每次由您决定。",
              "AI chỉ dùng nội dung/từ khóa bạn nhập — không bịa kinh nghiệm, công ty hay số liệu.",
              "AIはあなたが入力した内容·キーワードだけを使います。経歴・会社・数値の捏造はしません。",
              "AI hanya menggunakan konten/kata kunci yang Anda berikan — tidak mengarang pengalaman, perusahaan, atau angka."
            )}
          </p>
        </header>

        {/* Body — 옵션 + 결과 (스크롤) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {/* Mode chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {tr("어떻게 도와드릴까요", "How can I help", "如何帮助您", "Tôi có thể giúp gì", "どうお手伝いしますか", "Bagaimana saya bantu")}
            </span>
            {modeOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setMode(opt.value);
                  setDraft(null);
                }}
                className={`rounded-full px-3 py-1 text-[11.5px] font-semibold transition ${
                  mode === opt.value
                    ? "bg-foreground text-background"
                    : "border border-border bg-card text-muted-foreground hover:border-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Hints toggle */}
          <button
            type="button"
            onClick={() => setShowHints((v) => !v)}
            className="mt-4 text-[12px] font-semibold text-muted-foreground hover:text-foreground"
          >
            {showHints
              ? tr("키워드 닫기", "Hide hints", "收起关键词", "Ẩn từ khóa", "キーワードを閉じる", "Sembunyikan kata kunci")
              : tr("키워드·요청 추가 (선택)", "Add hints (optional)", "添加关键词(可选)", "Thêm từ khóa (tùy chọn)", "キーワードを追加(任意)", "Tambah kata kunci (opsional)")}
          </button>
          {showHints ? (
            <textarea
              value={hints}
              onChange={(e) => setHints(e.target.value)}
              placeholder={tr(
                "예: 한국 IT 기업 톤, 신입 백엔드 지원, React·TypeScript 경험 강조",
                "e.g. Korean IT company tone, junior backend role, emphasize React/TypeScript",
                "例：韩国IT公司语气，应届后端，强调 React/TypeScript",
                "Vd: Phong cách công ty IT Hàn Quốc, ứng tuyển junior backend, nhấn mạnh React/TypeScript",
                "例：韓国IT企業のトーン、新卒バックエンド、React/TypeScriptを強調",
                "Cth: Nada perusahaan IT Korea, junior backend, tonjolkan React/TypeScript"
              )}
              maxLength={500}
              rows={2}
              className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[13px] leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
            />
          ) : null}

          {/* Result */}
          {busy ? (
            <p className="mt-5 text-sm text-muted-foreground">
              {tr("AI 가 작성 중…", "Generating…", "AI 正在生成…", "Đang tạo…", "AI生成中…", "Sedang membuat…")}
            </p>
          ) : error ? (
            <p className="mt-5 text-sm text-destructive">{error}</p>
          ) : draft ? (
            <div className="mt-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#1b7a1b]">
                {tr("AI 작성 결과", "AI draft", "AI 结果", "Bản nháp AI", "AI 結果", "Hasil AI")}
              </p>
              <p className="whitespace-pre-wrap rounded-xl bg-[#b7ff5a]/30 p-3 text-[13px] leading-relaxed">{draft.text}</p>
              {draft.why ? (
                <p className="rounded-xl bg-muted/40 p-3 text-[12.5px] text-muted-foreground">{draft.why}</p>
              ) : null}
            </div>
          ) : (
            <p className="mt-6 rounded-xl bg-muted/40 px-3 py-4 text-center text-[12.5px] text-muted-foreground">
              {tr(
                "모드를 고르고 [생성하기] 를 눌러주세요.",
                "Pick a mode and tap [Generate].",
                "请选择模式并点击 [生成]。",
                "Chọn chế độ và nhấn [Tạo].",
                "モードを選んで [生成] を押してください。",
                "Pilih mode dan tekan [Buat]."
              )}
            </p>
          )}
        </div>

        {/* Footer — 닫기 / 다시 시도 / 적용 (고정) */}
        <footer className="flex flex-none items-center justify-end gap-2 border-t border-border px-6 py-3">
          <Button variant="outline" size="sm" onClick={onClose} disabled={busy}>
            {tr("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
          </Button>
          <Button variant="outline" size="sm" onClick={runDraft} disabled={busy}>
            {busy
              ? tr("생성 중…", "Generating…", "生成中…", "Đang tạo…", "生成中…", "Membuat…")
              : draft
              ? tr("다시 시도", "Try again", "重新生成", "Thử lại", "もう一度", "Coba lagi")
              : tr("생성하기", "Generate", "生成", "Tạo", "生成", "Buat")}
          </Button>
          <Button variant="dark" size="sm" onClick={applyDraft} disabled={!draft || busy}>
            {tr("이력서에 적용", "Apply to resume", "应用到简历", "Áp dụng vào hồ sơ", "履歴書に適用", "Terapkan ke resume")}
          </Button>
        </footer>
      </div>

      {/* 첫 사용 시 동의 모달 — ResumeCoachPanel 과 동일한 키 공유 */}
      {consentOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={tr("AI 사용 동의", "AI consent", "AI 同意", "Đồng ý AI", "AI同意", "Persetujuan AI")}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setConsentOpen(false)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-foreground" weight="fill" />
              <h3 className="font-display text-lg font-bold">
                {tr("AI 도우미를 사용해도 될까요?", "Use AI helper?", "可以使用AI助手吗？", "Sử dụng trợ lý AI?", "AIアシスタントを使ってもいい？", "Gunakan asisten AI?")}
              </h3>
            </div>
            <div className="mt-4 space-y-3 text-[13px] leading-relaxed text-foreground/85">
              <p>
                {tr(
                  "입력하신 내용·키워드가 분석을 위해 OpenAI 의 GPT 모델로 전송됩니다.",
                  "Your input will be sent to OpenAI's GPT model for analysis.",
                  "您输入的内容/关键词将发送至 OpenAI GPT 模型进行分析。",
                  "Nội dung bạn nhập sẽ được gửi đến mô hình GPT của OpenAI để phân tích.",
                  "入力した内容・キーワードは分析のためOpenAIのGPTモデルに送信されます。",
                  "Konten yang Anda masukkan akan dikirim ke model GPT OpenAI untuk dianalisis."
                )}
              </p>
              <p>
                {tr(
                  "AI 는 본인이 입력한 사실만 사용하고, 없는 경력·수치·회사를 만들어내지 않습니다.",
                  "AI uses only what you provide — no fabricated jobs, numbers, or companies.",
                  "AI 仅基于您提供的事实，不会编造经历、数据或公司。",
                  "AI chỉ dùng thông tin bạn cung cấp — không bịa kinh nghiệm, số liệu hay công ty.",
                  "AIは入力された事実だけを使い、経歴・数値・会社名を捏造しません。",
                  "AI hanya menggunakan info yang Anda berikan — tidak mengarang pengalaman, angka, atau perusahaan."
                )}
              </p>
              <p className="text-[12px] text-muted-foreground">
                {tr(
                  "동의는 이 디바이스에서 한 번만 기록됩니다.",
                  "Consent is stored once on this device.",
                  "同意仅在此设备记录一次。",
                  "Sự đồng ý chỉ được lưu một lần trên thiết bị này.",
                  "同意はこの端末で一度だけ記録されます。",
                  "Persetujuan disimpan sekali di perangkat ini."
                )}
              </p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setConsentOpen(false)}>
                {tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
              </Button>
              <Button variant="dark" size="sm" onClick={grantConsent}>
                {tr("동의하고 계속", "Agree and continue", "同意并继续", "Đồng ý và tiếp tục", "同意して続ける", "Setuju dan lanjut")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
