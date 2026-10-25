"use client";

// v2 이력서 화면 공용 조각 — 입력칸 모양·PDF 버튼(미리보기·목록 화면이 쓴다).
// 편집기 조각은 V2EditorShared 에 있다.
import { trackEditor } from "../../../lib/analytics";
import { usePlatformT } from "../../../lib/i18n";
import { Button } from "../ui";

/** v2 입력칸 모양 — 연회색 채움, 포커스 땐 흰 바탕 + 파란 링. 모바일 확대를 막으려 16px. */
export const V2_INPUT_CLS =
  "w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2";

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
