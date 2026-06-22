"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleNotch, DownloadSimple } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeSheet } from "./ResumePreview";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import type { ResumeContent } from "../../lib/member-profile-client";
import { buildEnglishResumeContent, getBuilderState, getDraftResume } from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { DEFAULT_DESIGN, JOB_CATEGORIES, type ResumeDesignSettings } from "../../lib/resume-maker-types";
import { trackResumeBuilderCompleted, trackResumePdfDownloaded } from "../../lib/analytics";

function sanitizeFilePart(v: string): string {
  return v.replace(/[\\/:*?"<>|\s]+/g, "").slice(0, 40);
}

export function ResumeBuilderPreviewPage({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [design, setDesign] = useState<ResumeDesignSettings>(DEFAULT_DESIGN);
  const [jobLabel, setJobLabel] = useState("");
  const [lang, setLang] = useState<"ko" | "en">("ko");
  const [enContent, setEnContent] = useState<ResumeContent | null>(null);
  const [enLoading, setEnLoading] = useState(false);

  // 영문 보기 — 처음 누를 때만 장문 필드를 영문으로 번역해 캐시한다.
  async function showLang(next: "ko" | "en") {
    setLang(next);
    if (next === "en" && !enContent && content) {
      setEnLoading(true);
      try {
        setEnContent(await buildEnglishResumeContent(content));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "영문 변환에 실패했어요.");
        setLang("ko");
      } finally {
        setEnLoading(false);
      }
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
        setJobLabel(JOB_CATEGORIES.find((j) => j.value === firstJob)?.label ?? "");
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : "이력서를 불러오지 못했어요.");
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
    const name = sanitizeFilePart(content?.basicName || "이력서");
    const job = sanitizeFilePart(content?.desiredJobRole || jobLabel || "");
    return [name, job, "이력서"].filter(Boolean).join("_");
  }, [content?.basicName, content?.desiredJobRole, jobLabel]);

  function downloadPdf() {
    if (typeof window === "undefined") return;
    const prev = document.title;
    document.title = fileName; // 인쇄 대화상자 기본 파일명 유도
    try {
      window.print();
      trackResumePdfDownloaded(design.templateId);
      trackResumeBuilderCompleted();
    } catch {
      toast.error("PDF 생성에 실패했어요. 다시 시도해 주세요.");
    } finally {
      window.setTimeout(() => {
        document.title = prev;
      }, 1000);
    }
  }

  return (
    <ResumeMakerShell
      right={
        <button
          type="button"
          onClick={() => router.push(`/resume-maker/${resumeId}/edit`)}
          className="rm-print-hide inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> 편집
        </button>
      }
      title={title}
    >
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
          .rm-print-root { position: absolute; left: 0; top: 0; width: 100%; }
          .rm-print-root .resume-sheet { width: 100% !important; min-height: auto !important; box-shadow: none !important; }
          .rm-print-only { display: flex !important; position: fixed; left: 0; right: 0; bottom: 7mm; }
          .rm-print-hide { display: none !important; }
        }
      `}</style>

      {loading || !content ? (
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> 불러오는 중...
          </span>
        </div>
      ) : (
        <section className="px-5 py-8">
          <div className="rm-print-hide mx-auto mb-5 flex max-w-[794px] flex-wrap items-center justify-between gap-3">
            {/* 국문 / English 토글 — 영문은 첫 전환 시 AI 번역 */}
            <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5">
              <button
                type="button"
                onClick={() => void showLang("ko")}
                className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${lang === "ko" ? "bg-primary/10 text-[#0B46E8]" : "text-muted-foreground hover:text-foreground"}`}
              >
                국문
              </button>
              <button
                type="button"
                onClick={() => void showLang("en")}
                disabled={enLoading}
                className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition disabled:opacity-60 ${lang === "en" ? "bg-primary/10 text-[#0B46E8]" : "text-muted-foreground hover:text-foreground"}`}
              >
                {enLoading ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : null}
                English
              </button>
            </div>
            <Button variant="hero" size="lg" onClick={downloadPdf}>
              <DownloadSimple weight="bold" /> PDF 다운로드
            </Button>
          </div>
          <div className="overflow-x-auto">
            <div className="rm-print-root mx-auto" style={{ width: 794 }}>
              <ResumeSheet content={lang === "en" ? enContent ?? content : content} design={design} lang={lang} />
              {/* 인쇄 전용 하단 — 페이지 제일 하단 고정, Aply 로고 + 슬로건 (작게) */}
              <div className="rm-print-only items-center justify-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/img_logo.webp" alt="Aply" className="h-3 w-auto opacity-70" />
                <span className="text-[9.5px] tracking-wide text-slate-400">AI로 만드는 이력서 · aply.global</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </ResumeMakerShell>
  );
}
