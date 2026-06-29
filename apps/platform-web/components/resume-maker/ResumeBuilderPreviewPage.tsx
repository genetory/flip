"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleNotch, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeSheet } from "./ResumePreview";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import type { ResumeContent } from "../../lib/member-profile-client";
import { buildTranslatedResumeContent, getBuilderState, getDraftResume } from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { DEFAULT_DESIGN, type ResumeDesignSettings } from "../../lib/resume-maker-types";
import { useJobCategoryLabel } from "../../lib/resume-maker-i18n/options";
import { trackResumeBuilderCompleted, trackResumePdfDownloaded } from "../../lib/analytics";
import { useBuilderPreviewCopy } from "../../lib/resume-maker-i18n/builder-preview";
import { useLanguage } from "../i18n/LanguageProvider";

function sanitizeFilePart(v: string): string {
  return v.replace(/[\\/:*?"<>|\s]+/g, "").slice(0, 40);
}

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
  const [scaledH, setScaledH] = useState<number | null>(null);
  useEffect(() => {
    const compute = () => {
      const avail = outerRef.current?.clientWidth;
      const natH = sheetRef.current?.offsetHeight; // transform 영향 없는 자연 높이
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
        const builder = getBuilderState(resume);
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
      {/* 인쇄 전용 스타일 — 시트만 출력. @page margin 0 으로 브라우저 기본
          머리글/바닥글(날짜·제목·URL)을 제거하고, 여백은 시트 자체 패딩으로. */}
      <style>{`
        .rm-print-only { display: none; }
        @media print {
          @page { size: A4; margin: 0; }
          body { background: #ffffff; }
          body * { visibility: hidden; }
          .rm-print-root, .rm-print-root * { visibility: visible; }
          /* 인쇄 시 브라우저가 배경/포인트색을 지우지 않도록 — 섹션 마커(마름모·점),
             세로바·밑줄·헤더 밴드 등 포인트 컬러를 그대로 출력. */
          .rm-print-root, .rm-print-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* 화면용 fit-to-width 축소는 인쇄 시 무효화(원본 크기로 출력) */
          .rm-print-root { position: absolute; left: 0; top: 0; width: 100%; transform: none !important; transform-origin: top left !important; }
          .rm-fit-box { width: auto !important; height: auto !important; }
          .rm-print-root .resume-sheet { width: 100% !important; min-height: auto !important; box-shadow: none !important; }
          .rm-print-only { display: flex !important; position: fixed; left: 0; right: 0; bottom: 7mm; }
          .rm-print-hide { display: none !important; }
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
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.loading}
          </span>
        </div>
      ) : (
        <section className="min-h-[calc(100vh-3.5rem)] overflow-hidden bg-[#F2F4F6] px-4 py-8 sm:px-5">
          {/* 가용 폭 측정 컨테이너(데스크탑은 794로 상한) */}
          <div ref={outerRef} className="mx-auto w-full max-w-[794px]">
            {/* 축소된 시트의 실제 크기를 차지하는 박스(인쇄 시 무효화) */}
            <div className="rm-fit-box mx-auto" style={{ width: 794 * scale, height: scaledH ?? undefined }}>
              <div
                ref={sheetRef}
                className="rm-print-root origin-top-left"
                style={{ width: 794, transform: `scale(${scale})` }}
              >
                <ResumeSheet
                  content={view === "ko" ? koContent ?? content : view === "en" ? enContent ?? content : content}
                  design={design}
                  lang={view === "en" ? "en" : "ko"}
                />
                {/* 인쇄 전용 하단 — 페이지 제일 하단 고정, Aply 로고 + 슬로건 (작게) */}
                <div className="rm-print-only items-center justify-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img_logo.webp" alt="Aply" className="h-3 w-auto opacity-70" />
                  <span className="text-[9.5px] tracking-wide text-slate-400">{t.slogan}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </ResumeMakerShell>
  );
}
