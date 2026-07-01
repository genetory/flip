"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleNotch, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { CoverLetterSheet } from "./CoverLetterToolPreview";
import { computePageBreaks } from "./ResumePreview";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import type { ResumeCoverLetterItem } from "../../lib/member-profile-client";
import { getCoverLetter } from "../../lib/cover-letter-client";
import { useEditorCopy } from "../../lib/resume-maker-i18n/editor";
import { useBuilderPreviewCopy } from "../../lib/resume-maker-i18n/builder-preview";

function sanitizeFilePart(v: string): string {
  return v.replace(/[\\/:*?"<>|\s]+/g, "").slice(0, 40);
}

// A4 = 794×1123px(96dpi). 각 페이지 위·아래 동일 패딩(자소서 시트 원래 세로 패딩 56px).
const A4_W_PX = 794;
const A4_H_PX = 1123;
const PAGE_PAD_PX = 56;
const PAGE_CONTENT_H_PX = A4_H_PX - PAGE_PAD_PX * 2;

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

  // fit-to-width 스케일 + 블록 경계 페이지 분할(이력서 PDF 화면과 동일).
  const outerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [starts, setStarts] = useState<number[]>([0]);
  const [contentH, setContentH] = useState(A4_H_PX);
  useEffect(() => {
    const compute = () => {
      const avail = outerRef.current?.clientWidth;
      const el = sheetRef.current;
      if (!avail || !el || !el.offsetHeight) return;
      setScale(Math.min(1, avail / A4_W_PX));
      const { starts: st, total } = computePageBreaks(el, PAGE_CONTENT_H_PX);
      setStarts((prev) => (prev.length === st.length && prev.every((v, i) => v === st[i]) ? prev : st));
      setContentH(total);
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
      {/* 인쇄 스타일 — 이력서 PDF 와 동일. @page margin 0(브라우저 머리글/바닥글 제거),
          페이지 상하 여백·분할은 아래 rm-print-page(각 A4 한 장)가 직접 담당. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .rm-print-hide { display: none !important; }
          .rm-print-pages { display: block !important; }
          .rm-print-page, .rm-print-page * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .rm-print-page .cl-sheet { box-shadow: none !important; }
          .rm-print-page { break-after: page; page-break-after: always; }
          .rm-print-page:last-child { break-after: auto; page-break-after: auto; }
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
        <div className="rm-print-hide flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {pv.loading}
          </span>
        </div>
      ) : (
        <>
          {/* 화면 미리보기 — A4 페이지 카드(각 페이지 위·아래 동일 패딩). 인쇄엔 안 나옴 */}
          <section className="rm-print-hide min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F2F4F6] px-4 py-8 sm:px-5">
            <div ref={outerRef} className="mx-auto w-full max-w-[794px]">
              {/* 높이 측정·블록 위치 계산용 숨김 시트(세로 패딩 없음) */}
              <div aria-hidden className="pointer-events-none absolute -left-[99999px] top-0" style={{ width: A4_W_PX, visibility: "hidden" }}>
                <CoverLetterSheet innerRef={sheetRef} items={items} title={t.hdrCoverLetterTitle} companyName={company.trim() || undefined} emptyLabel={t.clEmpty} noVerticalPad />
              </div>
              <div className="space-y-3">
                {starts.map((startPx, i) => {
                  const endPx = i < starts.length - 1 ? starts[i + 1] : contentH;
                  const windowH = Math.min(endPx - startPx, PAGE_CONTENT_H_PX);
                  return (
                    <div
                      key={i}
                      className="relative mx-auto overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_10px_30px_-10px_rgba(0,0,0,0.15)]"
                      style={{ width: A4_W_PX * scale, height: A4_H_PX * scale }}
                    >
                      <div className="absolute left-0 overflow-hidden" style={{ top: PAGE_PAD_PX * scale, width: A4_W_PX * scale, height: windowH * scale }}>
                        <div style={{ position: "absolute", top: -(startPx * scale), width: A4_W_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                          <CoverLetterSheet items={items} title={t.hdrCoverLetterTitle} companyName={company.trim() || undefined} emptyLabel={t.clEmpty} noVerticalPad />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 인쇄 전용 — 각 페이지를 개별 A4 한 장으로. 위·아래 동일 패딩 + 하단 슬로건. 화면엔 안 나옴 */}
          <div className="rm-print-pages" style={{ display: "none" }}>
            {starts.map((startPx, i) => {
              const endPx = i < starts.length - 1 ? starts[i + 1] : contentH;
              const windowH = Math.min(endPx - startPx, PAGE_CONTENT_H_PX);
              return (
                <div key={i} className="rm-print-page relative overflow-hidden bg-white" style={{ width: A4_W_PX, height: A4_H_PX }}>
                  <div style={{ position: "absolute", left: 0, top: PAGE_PAD_PX - startPx, width: A4_W_PX }}>
                    <CoverLetterSheet items={items} title={t.hdrCoverLetterTitle} companyName={company.trim() || undefined} emptyLabel={t.clEmpty} noVerticalPad />
                  </div>
                  {/* 위/아래 패딩(콘텐츠 가림) */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: PAGE_PAD_PX, background: "#fff" }} />
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: PAGE_PAD_PX + windowH, background: "#fff" }} />
                  {/* 각 페이지 맨 하단 — Aply 로고 + 슬로건 */}
                  <div style={{ position: "absolute", left: 0, right: 0, bottom: "5mm", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/img_logo.webp" alt="Aply" style={{ height: 12, width: "auto", opacity: 0.7 }} />
                    <span style={{ fontSize: 9.5, letterSpacing: "0.02em", color: "#94a3b8" }}>{pv.slogan}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </ResumeMakerShell>
  );
}
