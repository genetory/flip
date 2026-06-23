"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Buildings, CheckCircle, CircleNotch, FilePlus, ShieldCheck, Stethoscope } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeDiagnosisResult } from "./ResumeDiagnosisResult";
import { ResumePreview } from "./ResumePreview";
import { AplyProfileCard } from "./AplyProfileCard";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
import {
  fetchCareerReadinessReport,
  getMyResumes,
  getResumeCoach,
  type Resume,
  type ResumeCoachData,
  type ResumeContent
} from "../../lib/member-profile-client";
import { getBuilderState, getDraftResume, saveResumeContent } from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { DEFAULT_DESIGN, type ResumeDesignSettings } from "../../lib/resume-maker-types";
import { trackResumeDiagnosed } from "../../lib/analytics";
import { useDiagnosisCopy } from "../../lib/resume-maker-i18n/diagnosis";

// AI 진단 상단 메뉴의 진입점. 이력서를 고르면 AI가 곧바로 자동 진단하고, 결과 옆에
// 이력서 미리보기를 함께 보여준다(편집기와 동일한 2단 레이아웃). 이력서가 하나면
// 선택 단계를 건너뛴다. 화면 톤은 '이력서 만들기' 랜딩과 맞춘다.

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

export function ResumeDiagnosisEntryPage() {
  const router = useRouter();
  const toast = useToast();
  const t = useDiagnosisCopy();
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selected, setSelected] = useState<Resume | null>(null);
  const [coach, setCoach] = useState<ResumeCoachData | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<ResumeContent | null>(null);
  const [previewDesign, setPreviewDesign] = useState<ResumeDesignSettings>(DEFAULT_DESIGN);
  const [completeness, setCompleteness] = useState<number | null>(null);
  const [recommendedRoles, setRecommendedRoles] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  async function runDiagnosis(resume: Resume) {
    setSelected(resume);
    setCoach(null);
    setPreviewContent(null);
    setCompleteness(null);
    setRecommendedRoles([]);
    setConsent(false);
    setJustRegistered(false);
    setCoachLoading(true);
    // 미리보기 + APLY Profile용 전체 이력서 로드 (진단과 병렬, 실패해도 진단은 계속).
    void (async () => {
      try {
        const full = await getDraftResume(resume.id);
        const builder = getBuilderState(full);
        const compiled = compileResumeContent(builder, full.content);
        setPreviewContent(compiled);
        setPreviewDesign(builder.design ?? DEFAULT_DESIGN);
        setCompleteness(computeResumeProgress(compiled, builder).percent);
      } catch {
        // 미리보기 로드 실패는 무시.
      }
    })();
    // 추천 직무 — 회원 단위 career-readiness 리포트(있으면 카드에 표시).
    void (async () => {
      try {
        const report = await fetchCareerReadinessReport("ko");
        setRecommendedRoles(report.recommendedRoles ?? []);
      } catch {
        // 추천 직무 로드 실패는 무시.
      }
    })();
    try {
      const data = await getResumeCoach(resume.id);
      setCoach(data);
      trackResumeDiagnosed(data.score.level);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.diagnosisLoadFailed);
    } finally {
      setCoachLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await getMyResumes();
        if (!alive) return;
        const sorted = [...list].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        setResumes(sorted);
        // 이력서가 하나뿐이면 선택을 건너뛰고 바로 자동 진단.
        if (sorted.length === 1) void runDiagnosis(sorted[0]);
      } catch {
        // 목록 로드 실패는 치명적이지 않음 — 비어 있는 상태로 안내.
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 기업 추천 후보로 등록 — 동의 후 이력서 content 에 동의 플래그를 저장한다.
  // (운영자/인재풀 연동은 백엔드가 이 플래그를 읽어 처리)
  async function registerToPool() {
    if (!selected || !previewContent || !consent || registering) return;
    setRegistering(true);
    try {
      await saveResumeContent(selected.id, { ...previewContent, poolOptIn: { consentedAt: new Date().toISOString() } });
      setJustRegistered(true);
      toast.success(t.registerSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.registerFailed);
    } finally {
      setRegistering(false);
    }
  }

  // 진단 액션 클릭 → 해당 이력서의 편집 섹션으로 이동 (에디터 onGoto 와 동일 매핑).
  function gotoSection(targetSection: string) {
    if (!selected) return;
    if (["careers", "activities", "experiences", "experience"].includes(targetSection)) {
      router.push(`/resume-maker/${selected.id}/experiences`);
      return;
    }
    const sectionMap: Record<string, string> = {
      basics: "basic",
      basic: "basic",
      summary: "intro",
      selfIntroduction: "intro",
      selfIntro: "intro",
      intro: "intro",
      education: "education",
      educations: "education",
      certifications: "awards",
      certification: "awards",
      awards: "awards",
      skills: "skills",
      languages: "languages",
      links: "links"
    };
    router.push(`/resume-maker/${selected.id}/edit?section=${sectionMap[targetSection] ?? "basic"}`);
  }

  // 진단 결과 화면 — 좌: 진단 결과 / 우: APLY Profile + 이력서 미리보기 (편집기와 동일한 2단).
  if (selected) {
    const profileCard = previewContent ? (
      <div className="mb-4">
        <p className="mb-2 text-[13px] font-bold text-[#0B1227]">{t.profileForCompanyTitle}</p>
        <AplyProfileCard content={previewContent} coach={coach} recommendedRoles={recommendedRoles} completeness={completeness ?? undefined} />
      </div>
    ) : null;
    const previewBlock = previewContent ? (
      <ResumePreview content={previewContent} design={previewDesign} />
    ) : (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <span className="inline-flex items-center gap-2 text-sm">
          <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.previewLoading}
        </span>
      </div>
    );
    return (
      <ResumeMakerShell>
        <div className="mx-auto grid max-w-6xl gap-0 px-0 lg:grid-cols-[minmax(0,44%)_minmax(0,56%)]">
          {/* 왼쪽: 진단 결과 */}
          <div className="min-w-0 border-r border-border/60 px-5 py-8 lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setSelected(null);
                setCoach(null);
                setPreviewContent(null);
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> {t.diagnoseAnother}
            </button>
            <div className="mt-4 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-[#0B46E8]" weight="fill" aria-hidden />
              <h1 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] text-[#0B1227] md:text-2xl`}>{t.diagnosisResultTitle}</h1>
            </div>
            <ResumeDiagnosisResult coach={coach} loading={coachLoading} onReload={() => void runDiagnosis(selected)} onGoto={gotoSection} />

            {/* 기업 추천 후보 등록 — funnel의 마지막 단계 (동의 → content 플래그 저장) */}
            {justRegistered || previewContent?.poolOptIn ? (
              <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" weight="fill" aria-hidden />
                <div>
                  <p className="text-[14px] font-bold text-emerald-900">{t.registeredTitle}</p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-emerald-800">
                    {t.registeredDesc}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-4">
                <div className="flex items-center gap-2">
                  <Buildings className="h-5 w-5 text-[#0B46E8]" weight="fill" aria-hidden />
                  <p className="text-[14px] font-bold text-[#0B1227]">{t.registerCardTitle}</p>
                </div>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {t.registerCardDesc}
                </p>
                <label className="mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-foreground/80">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-[#0B46E8] focus:ring-[#0B46E8]"
                  />
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-muted-foreground" weight="bold" aria-hidden />
                    {t.consentLabel}
                  </span>
                </label>
                <Button variant="hero" size="lg" className="mt-3 w-full" disabled={!consent || registering || !previewContent} onClick={() => void registerToPool()}>
                  {registering ? <CircleNotch className="animate-spin" weight="bold" /> : <Buildings weight="bold" />}
                  {t.registerButton}
                </Button>
              </div>
            )}
          </div>

          {/* 오른쪽: APLY Profile + 이력서 미리보기 (데스크탑) */}
          <div className="hidden bg-muted/30 px-5 py-8 lg:block lg:max-h-[calc(100vh-56px)] lg:overflow-y-auto">
            {profileCard}
            {previewBlock}
          </div>
        </div>

        {/* 모바일: APLY Profile + 미리보기를 결과 아래에 */}
        <div className="border-t border-border bg-muted/30 px-5 py-6 lg:hidden">
          {profileCard}
          <p className="mb-3 text-[13px] font-bold text-[#0B1227]">{t.previewHeading}</p>
          {previewBlock}
        </div>
      </ResumeMakerShell>
    );
  }

  return (
    <ResumeMakerShell>
      <section className="container max-w-3xl px-5 py-16 md:py-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[12px] font-bold text-[#0B46E8]">
            <Stethoscope className="h-3.5 w-3.5" weight="fill" aria-hidden />
            {t.badge}
          </span>
          <h1 className={`${paperlogy.className} mt-5 text-3xl font-black leading-[1.2] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
            {t.heroTitleLine1}
            <br />
            {t.heroTitleLine2}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground md:text-base">
            {t.heroDesc}
          </p>
          <ul className="mx-auto mt-8 flex max-w-md flex-col gap-2 text-left">
            {t.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[13.5px] text-muted-foreground">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#0B46E8]" weight="bold" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* 진단할 이력서 선택 — '이력서 만들기'의 작성 중 목록과 동일한 카드 톤 */}
        {loading ? (
          <p className="mx-auto mt-12 inline-flex w-full items-center justify-center gap-2 text-[13px] text-muted-foreground">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.loading}
          </p>
        ) : resumes.length > 0 ? (
          <div className="mx-auto mt-12 max-w-xl">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#0B1227]">
              <Stethoscope className="h-4 w-4 text-[#0B46E8]" weight="bold" aria-hidden />
              {t.selectPrompt}
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {resumes.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => void runDiagnosis(r)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-card transition hover:border-primary/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-foreground">{r.title || t.untitledResume}</span>
                      <span className="text-[12px] text-muted-foreground">{t.lastEdited(formatDateTime(r.updatedAt))}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-[#0B46E8]">
                      {t.diagnoseAction} <ArrowRight className="h-3.5 w-3.5" weight="bold" aria-hidden />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-xl rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
            <Stethoscope className="mx-auto h-7 w-7 text-[#0B46E8]" weight="fill" aria-hidden />
            <p className="mt-3 text-[15px] font-bold text-[#0B1227]">{t.emptyTitle}</p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">{t.emptyDesc}</p>
            <Button variant="hero" size="lg" className="mt-4" onClick={() => router.push("/resume-maker")}>
              <FilePlus weight="bold" />
              {t.goCreateResume}
            </Button>
          </div>
        )}
      </section>
    </ResumeMakerShell>
  );
}
