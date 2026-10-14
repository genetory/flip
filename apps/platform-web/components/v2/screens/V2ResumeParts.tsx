"use client";

// v2 이력서 화면 공용 조각 — 입력칸·PDF 버튼·넓은 화면 여부·회색 카드.
// 기존 에디터(editor-shared 의 Field·PdfDownloadButton)와 같은 동작을 v2 모양으로 다시 둔다.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { trackEditor } from "../../../lib/analytics";
import { usePlatformT } from "../../../lib/i18n";
import { Button } from "../ui";

/** v2 입력칸 모양 — 연회색 채움, 포커스 땐 흰 바탕 + 파란 링. 모바일 확대를 막으려 16px. */
export const V2_INPUT_CLS =
  "w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2";

/**
 * 입력칸 — 기존 Field 와 같은 규칙. onChange 는 칠 때마다(저장은 talent 저장소가 debounce 한다),
 * onBlurValue 는 포커스를 벗어날 때 한 번(날짜처럼 입력 중엔 정규화하면 안 되는 값).
 */
export function V2Field({
  label,
  value,
  onChange,
  onBlurValue,
  multiline,
  rows = 6,
  placeholder,
  inputMode
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onBlurValue?: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  inputMode?: "text" | "email" | "tel" | "url";
}) {
  const [draft, setDraft] = useState(value);
  // 바깥 값이 바뀌면(다른 모듈·되돌리기) 입력칸도 맞춘다.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 기존 Field 와 같은 동기화 규칙.
  useEffect(() => setDraft(value), [value]);
  const common = {
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(e.target.value);
      onChange?.(e.target.value);
    },
    onBlur: () => onBlurValue?.(draft)
  };
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{label}</span>
      {multiline ? (
        <textarea {...common} rows={rows} className={`${V2_INPUT_CLS} resize-y py-3 leading-[1.65]`} />
      ) : (
        <input {...common} type="text" inputMode={inputMode} className={`${V2_INPUT_CLS} h-12`} />
      )}
    </label>
  );
}

/** PDF 저장 — 기존 PdfDownloadButton 과 같다(계측 + 브라우저 인쇄). 인쇄 격리는 PrintStyles 가 한다. */
export function V2PdfButton({ variant = "primary", size = "md", full }: { variant?: "primary" | "secondary" | "neutral"; size?: "md" | "sm"; full?: boolean }) {
  const t = usePlatformT();
  return (
    <Button
      variant={variant}
      size={size}
      full={full}
      onClick={() => {
        trackEditor("editor_pdf_download", { source: window.location.pathname.endsWith("/preview") ? "preview" : "editor" });
        window.print();
      }}
    >
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19h14" />
      </svg>
      {t("PDF 저장", "Save PDF", "保存 PDF", "Lưu PDF", "PDF保存", "Simpan PDF")}
    </Button>
  );
}

/** 넓은 화면(lg, 1024px~)인지 — 에디터는 넓으면 옆 패널, 좁으면 아래 시트로 편집한다. */
export function useIsWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return wide;
}

/** 회색 카드 — 구획 안의 묶음(점검·정리·가져오기). 테두리 없이 연회색 채움. */
export function V2Card({ title, aside, children, className = "" }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl bg-[color:var(--v2-fill)] p-5 ${className}`}>
      {title || aside ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h3 className="text-[17px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]">{title}</h3> : <span />}
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** 체크 상자 — 이력서에 넣기/빼기. 켜면 파랑. */
export function V2Check({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={label}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition ${on ? "bg-[color:var(--v2-accent)]" : "bg-[color:var(--v2-line)] hover:bg-[#d1d6db]"}`}
    >
      {on ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
      ) : null}
    </button>
  );
}

/** 처음 그릴 때는 가만히, 값이 바뀌면 그 요소를 보이는 곳까지 굴린다(넓은 화면 옆 패널에서 고른 모듈로). */
export function useScrollIntoViewOnChange<T extends HTMLElement>(key: string | null) {
  const ref = useRef<T | null>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!key) return;
    ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [key]);
  return ref;
}
