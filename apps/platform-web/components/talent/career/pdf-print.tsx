"use client";

// 이력서/자기소개서 미리보기 → PDF 저장(브라우저 인쇄) 공용.
// 별도 PDF 라이브러리 없이 window.print() + 인쇄 격리 CSS로 A4만 깔끔히 출력한다.
import { DownloadSimple } from "@phosphor-icons/react";

export const PDF_PRINT_AREA = "pdf-print-area";

// 인쇄 시 PDF_PRINT_AREA 영역만 남기고 나머지(앱 셸·헤더 등)는 감춘다.
export function PrintStyles() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          @media print {
            html, body { background: #ffffff !important; }
            body * { visibility: hidden !important; }
            .${PDF_PRINT_AREA}, .${PDF_PRINT_AREA} * { visibility: visible !important; }
            .${PDF_PRINT_AREA} { position: absolute !important; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
            @page { size: A4; margin: 0; }
          }
        `
      }}
    />
  );
}

export function PdfDownloadButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]"
    >
      <DownloadSimple className="h-4 w-4" weight="bold" /> PDF 다운받기
    </button>
  );
}
