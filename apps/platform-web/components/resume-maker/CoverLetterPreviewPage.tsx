"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleNotch, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { CoverLetterSheet } from "./CoverLetterToolPreview";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import type { ResumeCoverLetterItem } from "../../lib/member-profile-client";
import { getCoverLetter } from "../../lib/cover-letter-client";
import { useEditorCopy } from "../../lib/resume-maker-i18n/editor";
import { useBuilderPreviewCopy } from "../../lib/resume-maker-i18n/builder-preview";

function sanitizeFilePart(v: string): string {
  return v.replace(/[\\/:*?"<>|\s]+/g, "").slice(0, 40);
}

// 자소서 PDF 미리보기 — 이력서 PDF 화면(ResumeBuilderPreviewPage)과 동일한 구조.
// A4 시트를 가용 폭에 맞춰 축소하고, 인쇄 시엔 원본 크기로 출력(브라우저 PDF 저장).
export function CoverLetterPreviewPage({ coverLetterId }: { coverLetterId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useEditorCopy();
  const pv = useBuilderPreviewCopy();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ResumeCoverLetterItem[]>([]);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");

  // 모바일 fit-to-width — 고정 794px A4 시트를 가용 폭에 맞춰 축소(인쇄 시엔 원본 유지).
  const outerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [scaledH, setScaledH] = useState<number | null>(null);
  useEffect(() => {
    const compute = () => {
      const avail = outerRef.current?.clientWidth;
      const natH = sheetRef.current?.offsetHeight;
      if (!avail || !natH) return;
      const s = Math.min(1, avail / 794);
      setScale(s);
      setScaledH(natH * s);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (outerRef.current) ro.observe(outerRef.current);
    if (sheetRef.current) ro.observe(sheetRef.current);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [items, loading]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const cl = await getCoverLetter(coverLetterId);
        if (!alive) return;
        setItems(cl.items);
        setCompany(cl.company ?? "");
        setName(cl.title ?? "");
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : pv.loadFailed);
        router.replace("/resume-maker/cover-letters");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverLetterId]);

  const fileName = useMemo(() => [sanitizeFilePart(name), sanitizeFilePart(t.hdrCoverLetterTitle)].filter(Boolean).join("_"), [name, t.hdrCoverLetterTitle]);

  function downloadPdf() {
    if (typeof window === "undefined") return;
    const prev = document.title;
    document.title = fileName;
    try {
      window.print();
    } catch {
      toast.error(pv.pdfFailed);
    } finally {
      window.setTimeout(() => {
        document.title = prev;
      }, 1000);
    }
  }

  return (
    <ResumeMakerShell>
      {/* 인쇄 전용 스타일 — 자소서 시트(.cl-sheet)만 출력. 이력서 PDF 화면과 동일 규칙. */}
      <style>{`
        .rm-print-only { display: none; }
        @media print {
          @page { size: A4; margin: 0; }
          body { background: #ffffff; }
          body * { visibility: hidden; }
          .rm-print-root, .rm-print-root * { visibility: visible; }
          .rm-print-root, .rm-print-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .rm-print-root { position: absolute; left: 0; top: 0; width: 100%; transform: none !important; transform-origin: top left !important; }
          .rm-fit-box { width: auto !important; height: auto !important; }
          /* 인쇄 영역(프린터 여백)으로 한 줄이 다음 장으로 넘치는 것 방지 — 여백 축소로 헤드룸 확보 */
          .rm-print-root .cl-sheet { width: 100% !important; min-height: auto !important; box-shadow: none !important; padding: 40px 52px 32px !important; }
          .rm-print-only { display: flex !important; position: fixed; left: 0; right: 0; bottom: 7mm; }
          .rm-print-hide { display: none !important; }
        }
      `}</style>

      {/* GNB 아래 서브 네비게이션 — 편집으로 돌아가기 + PDF */}
      <div className="rm-print-hide bg-background/95 backdrop-blur lg:sticky lg:top-14 lg:z-30">
        <div className="container flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> {pv.back}
          </button>
          {!loading ? (
            <Button variant="hero" size="sm" onClick={downloadPdf}>
              <DownloadSimple weight="bold" /> PDF
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {pv.loading}
          </span>
        </div>
      ) : (
        <section className="min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F2F4F6] px-4 py-8 sm:px-5">
          <div ref={outerRef} className="mx-auto w-full max-w-[794px]">
            <div className="rm-fit-box mx-auto" style={{ width: 794 * scale, height: scaledH ?? undefined }}>
              <div ref={sheetRef} className="rm-print-root origin-top-left" style={{ width: 794, transform: `scale(${scale})` }}>
                <CoverLetterSheet items={items} title={t.hdrCoverLetterTitle} companyName={company.trim() || undefined} emptyLabel={t.clEmpty} />
                {/* 인쇄 전용 하단 — Aply 로고 + 슬로건 */}
                <div className="rm-print-only items-center justify-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img_logo.webp" alt="Aply" className="h-3 w-auto opacity-70" />
                  <span className="text-[9.5px] tracking-wide text-slate-400">{pv.slogan}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </ResumeMakerShell>
  );
}
