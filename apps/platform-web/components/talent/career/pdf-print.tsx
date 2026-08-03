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

// A4 문서 하단 브랜드 바닥글(로고 + 슬로건). flex-col A4 페이지의 마지막 자식으로 두면
// mt-auto 로 페이지 맨 아래에 붙는다. 미리보기·PDF 공통 노출.
export function PdfBrandFooter() {
  return (
    <footer className="mt-auto flex items-center justify-between gap-3 border-t border-[#E5E8EB] pt-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/img_logo.webp" alt="APLY" className="h-[14px] w-auto opacity-80" />
      <p className="text-[10px] tracking-[-0.01em] text-[#B0B8C1]">첫 이력서부터 첫 지원까지</p>
    </footer>
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
