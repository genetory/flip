"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleNotch, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeSheet, computePageBreaks } from "./ResumePreview";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import type { ResumeContent } from "../../lib/member-profile-client";
import { buildTranslatedResumeContent, deriveBuilderState, getDraftResume } from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { DEFAULT_DESIGN, type ResumeDesignSettings } from "../../lib/resume-maker-types";
import { useJobCategoryLabel } from "../../lib/resume-maker-i18n/options";
import { trackResumeBuilderCompleted, trackResumePdfDownloaded } from "../../lib/analytics";
import { useBuilderPreviewCopy } from "../../lib/resume-maker-i18n/builder-preview";
import { useLanguage } from "../i18n/LanguageProvider";

function sanitizeFilePart(v: string): string {
  return v.replace(/[\\/:*?"<>|\s]+/g, "").slice(0, 40);
}

// A4 = 794×1123px(96dpi). 콘텐츠가 이 높이를 넘으면 페이지를 나눠 보여준다.
const A4_W_PX = 794;
const A4_H_PX = 1123;
// 각 페이지 위·아래 동일 패딩(px, ≈12.7mm). 콘텐츠 영역 = A4_H - 2*PAGE_PAD.
const PAGE_PAD_PX = 48;
const PAGE_CONTENT_H_PX = A4_H_PX - PAGE_PAD_PX * 2;

export function ResumeBuilderPreviewPage({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useBuilderPreviewCopy();
  const { locale } = useLanguage();
  const jobCategoryLabel = useJobCategoryLabel();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [design, setDesign] = useState<ResumeDesignSettings>(DEFAULT_DESIGN);
  const [jobLabel, setJobLabel] = useState("");
  const [view, setView] = useState<"original" | "ko" | "en">("original");
  const [koContent, setKoContent] = useState<ResumeContent | null>(null);
  const [enContent, setEnContent] = useState<ResumeContent | null>(null);
  const [translating, setTranslating] = useState(false);

  // 모바일 fit-to-width — 고정 794px A4 시트를 가용 폭에 맞춰 축소(인쇄 시엔 원본 유지).
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
      const s = Math.min(1, avail / A4_W_PX);
      setScale(s);
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
    // 시트 내용/번역/디자인이 바뀌면 높이가 달라지므로 재계산.
  }, [content, view, koContent, enContent, design, loading]);

  // 번역 보기 — 처음 누를 때만 장문 필드를 타깃 언어로 번역해 캐시한다.
  // 한국어: 외국어로 쓴 이력서를 한국 기업이 읽도록 / 영어: 영문 이력서.
  async function showView(next: "original" | "ko" | "en") {
    if (!content) return;
    setView(next);
    if (next === "original") return;
    if ((next === "ko" ? koContent : enContent) !== null) return;
    setTranslating(true);
    try {
      const translated = await buildTranslatedResumeContent(content, next);
      if (next === "ko") setKoContent(translated);
      else setEnContent(translated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.translateFailed);
      setView("original");
    } finally {
      setTranslating(false);
    }
  }

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
        const builder = deriveBuilderState(resume);
        setTitle(resume.title);
        setContent(compileResumeContent(builder, resume.content));
        setDesign(builder.design ?? DEFAULT_DESIGN);
        const firstJob = builder.onboarding.jobCategories[0];
        setJobLabel(jobCategoryLabel(firstJob));
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : t.loadFailed);
        router.replace("/resume-maker");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  const fileName = useMemo(() => {
    const name = sanitizeFilePart(content?.basicName || t.resumeFallback);
    const job = sanitizeFilePart(content?.desiredJobRole || jobLabel || "");
    return [name, job, t.resumeFallback].filter(Boolean).join("_");
  }, [content?.basicName, content?.desiredJobRole, jobLabel, t.resumeFallback]);

  function downloadPdf() {
    if (typeof window === "undefined") return;
    const prev = document.title;
    document.title = fileName; // 인쇄 대화상자 기본 파일명 유도
    try {
      window.print();
      trackResumePdfDownloaded(design.templateId);
      trackResumeBuilderCompleted();
    } catch {
      toast.error(t.pdfFailed);
    } finally {
      window.setTimeout(() => {
        document.title = prev;
      }, 1000);
    }
  }

  return (
    <ResumeMakerShell>
      {/* 인쇄 스타일 — @page margin 0 으로 브라우저 기본 머리글/바닥글(날짜·URL·페이지번호)
          제거. 페이지 상하 여백·분할은 아래 rm-print-page(각 A4 한 장)가 직접 담당한다. */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .rm-print-hide { display: none !important; }
          .rm-print-pages { display: block !important; }
          /* 포인트 컬러(마커·밴드 등) 그대로 출력 */
          .rm-print-page, .rm-print-page * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .rm-print-page .resume-sheet { box-shadow: none !important; }
          .rm-print-page { break-after: page; page-break-after: always; }
          .rm-print-page:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>

      {/* GNB 아래 서브 네비게이션 — 편집으로 돌아가기 + 언어 전환 + PDF */}
      <div className="rm-print-hide bg-background/95 backdrop-blur lg:sticky lg:top-14 lg:z-30">
        <div className="container flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> {t.back}
          </button>
          {!loading && content ? (
            <div className="flex flex-wrap items-center gap-2">
              {/* 원문 / 한국어 / English — 첫 전환 시 AI 번역(외국어 원문도 한국어로) */}
              <div className="inline-flex items-center rounded-full bg-[#F2F4F6] p-1">
                {([
                  { v: "original", label: t.viewOriginal },
                  { v: "ko", label: "한국어" },
                  { v: "en", label: "English" }
                ] as const).map((o) => (
                  <button
                    key={o.v}
                    type="button"
                    onClick={() => void showView(o.v)}
                    disabled={translating}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition disabled:opacity-60 ${
                      view === o.v ? "bg-white text-[#0B46E8] shadow-sm" : "text-[#8B95A1] hover:text-[#191F28]"
                    }`}
                  >
                    {translating && view === o.v ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : null}
                    {o.label}
                  </button>
                ))}
              </div>
              <Button variant="hero" size="sm" onClick={downloadPdf}>
                <DownloadSimple weight="bold" /> PDF
              </Button>
            </div>
          ) : null}
        </div>
        {/* 작성 언어 안내 — 한국어 UI 가 아닐 때만. 한국 기업엔 한국어 이력서가 유리 */}
        {!loading && content && locale !== "ko" ? (
          <div className="container max-w-6xl px-5 pb-2">
            <p className="text-[11.5px] leading-relaxed text-muted-foreground">{t.langHint}</p>
          </div>
        ) : null}
      </div>

      {loading || !content ? (
        <div className="rm-print-hide flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.loading}
          </span>
        </div>
      ) : (
        (() => {
          const shown = view === "ko" ? koContent ?? content : view === "en" ? enContent ?? content : content;
          const sheetLang: "ko" | "en" = view === "en" ? "en" : "ko";
          return (
            <>
              {/* 화면 미리보기 — A4 페이지 카드(각 페이지 위·아래 동일 패딩). 인쇄엔 안 나옴 */}
              <section className="rm-print-hide min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F2F4F6] px-4 py-8 sm:px-5">
                <div ref={outerRef} className="mx-auto w-full max-w-[794px]">
                  {/* 높이 측정·블록 위치 계산용 숨김 시트(세로 패딩 없음) */}
                  <div aria-hidden className="pointer-events-none absolute -left-[99999px] top-0" style={{ width: A4_W_PX, visibility: "hidden" }}>
                    <ResumeSheet innerRef={sheetRef} content={shown} design={design} lang={sheetLang} noVerticalPad />
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
                          <div
                            className="absolute left-0 overflow-hidden"
                            style={{ top: PAGE_PAD_PX * scale, width: A4_W_PX * scale, height: windowH * scale }}
                          >
                            <div
                              style={{ position: "absolute", top: -(startPx * scale), width: A4_W_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}
                            >
                              <ResumeSheet content={shown} design={design} lang={sheetLang} noVerticalPad />
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
                      {/* 콘텐츠 — 이 페이지 슬라이스가 상단 패딩 위치에 오도록 이동 */}
                      <div style={{ position: "absolute", left: 0, top: PAGE_PAD_PX - startPx, width: A4_W_PX }}>
                        <ResumeSheet content={shown} design={design} lang={sheetLang} noVerticalPad />
                      </div>
                      {/* 위 패딩(그 위 콘텐츠 가림) */}
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: PAGE_PAD_PX, background: "#fff" }} />
                      {/* 아래 패딩(넘친 블록·다음 페이지 콘텐츠 가림) */}
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, top: PAGE_PAD_PX + windowH, background: "#fff" }} />
                      {/* 하단 슬로건 — 각 페이지 맨 아래(패딩 영역, 콘텐츠엔 영향 없음) */}
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: "5mm", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/img_logo.webp" alt="Aply" style={{ height: 12, width: "auto", opacity: 0.7 }} />
                        <span style={{ fontSize: 9.5, letterSpacing: "0.02em", color: "#94a3b8" }}>{t.slogan}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()
      )}
    </ResumeMakerShell>
  );
}
