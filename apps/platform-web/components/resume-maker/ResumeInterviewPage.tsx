"use client";

import { useEffect, useState } from "react";
import { ArrowCounterClockwise, ArrowLeft, ArrowRight, ChatCircleDots, CheckCircle, CircleNotch, Copy as CopyIcon, Lightbulb, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeToolPickerPage } from "./ResumeToolPickerPage";
import { ResumeBackBar } from "./ResumeBackBar";
import { ResumeToolPreview } from "./ResumeToolPreview";
import { PositionPagination } from "./PositionPagination";
import { AiQuotaModal } from "./AiQuotaModal";
import { AiTicketCost } from "./AiTicketCost";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { PositionRow, mapPublicPositionToCard } from "../pages/PositionsPage";
import { paperlogy } from "../../lib/fonts";
import { type PublicPositionListItem, type ResumeContent } from "../../lib/member-profile-client";
import {
  AiQuotaError,
  generateInterviewQuestions,
  getBuilderState,
  getDraftResume,
  getInterviewFeedback,
  resumeToPlainText,
  type InterviewFeedback,
  type InterviewQuestionItem
} from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { DEFAULT_DESIGN, type ResumeDesignSettings } from "../../lib/resume-maker-types";
import { positionToJobText } from "../../lib/resume-maker-position-jd";
import { usePositionPager } from "../../lib/resume-maker-positions-pager";
import { useAiUsage } from "../../lib/resume-maker-ai-usage";
import { useInterviewPrepCopy } from "../../lib/resume-maker-i18n/interview-prep";
import { useTailorCopy } from "../../lib/resume-maker-i18n/tailor";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

function scoreColor(s: number): string {
  if (s >= 75) return "#16a34a";
  if (s >= 50) return "#0B46E8";
  if (s >= 30) return "#d97706";
  return "#dc2626";
}

export function ResumeInterviewPage({ resumeId }: { resumeId: string }) {
  const toast = useToast();
  const t = useInterviewPrepCopy();
  const tt = useTailorCopy(); // 입력 모드(직접 입력/포지션) 라벨은 공고 맞춤과 공유
  const picker = useToolPickerCopy();
  const { locale } = useLanguage();
  const { resetAt, refresh: refreshUsage } = useAiUsage(); // 공용 AI 티켓(GNB 공유)
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false); // 이력서를 찾지 못하면 '나의 이력서'로 폴백
  const [quotaOpen, setQuotaOpen] = useState(false); // 한도 초과 모달
  const [resumeTitle, setResumeTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [design, setDesign] = useState<ResumeDesignSettings>(DEFAULT_DESIGN);
  // 1단계 — 준비(직무/JD)
  const [jobRole, setJobRole] = useState("");
  const [jobText, setJobText] = useState("");
  const [generating, setGenerating] = useState(false);
  // 입력 모드 — 직접 입력(텍스트) vs Aply 포지션에서 선택
  const [inputMode, setInputMode] = useState<"text" | "position">("text");
  const [selectedPosId, setSelectedPosId] = useState<string | null>(null);
  const pager = usePositionPager((m) => toast.error(m || tt.positionFailed));
  // 2단계 — 생성된 예상 질문(순차 진행)
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [step, setStep] = useState(0); // 현재 질문 인덱스
  const [done, setDone] = useState(false); // 마지막 질문까지 마침
  const [answers, setAnswers] = useState<Record<number, string>>({}); // 질문별 답변
  const [feedbacks, setFeedbacks] = useState<Record<number, InterviewFeedback>>({}); // 질문별 피드백
  const [evaluating, setEvaluating] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
        const b = getBuilderState(resume);
        const compiled = compileResumeContent(b, resume.content);
        setResumeTitle(resume.title);
        setContent(compiled);
        setDesign(b.design ?? DEFAULT_DESIGN);
        setJobRole(compiled.desiredJobRole?.trim() ?? "");
      } catch {
        // 이력서가 없거나(삭제 등) 못 불러오면 에러로 튕기지 않고 '나의 이력서'를 보여준다.
        if (!alive) return;
        setMissing(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId]);

  async function generate() {
    if (!content || generating) return;
    setGenerating(true);
    try {
      const qs = await generateInterviewQuestions({
        resumeText: resumeToPlainText(content),
        jobText: jobText.trim() || undefined,
        desiredJobRole: jobRole.trim() || undefined
      });
      setQuestions(qs);
      setStep(0);
      setDone(false);
      setAnswers({});
      setFeedbacks({});
      refreshUsage();
    } catch (err) {
      if (err instanceof AiQuotaError) {
        refreshUsage();
        setQuotaOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : t.failedQuestions);
      }
    } finally {
      setGenerating(false);
    }
  }

  function selectPosition(p: PublicPositionListItem) {
    setSelectedPosId(p.id);
    setJobText(positionToJobText(p));
  }

  // 같은 질문을 같은 질문으로 다시 연습(답변·피드백 초기화, 질문은 유지).
  function restart() {
    setStep(0);
    setDone(false);
    setAnswers({});
    setFeedbacks({});
  }

  async function evaluate() {
    if (!content || evaluating) return;
    const answer = (answers[step] ?? "").trim();
    if (!answer) {
      toast.info(t.needAnswer);
      return;
    }
    setEvaluating(true);
    try {
      const f = await getInterviewFeedback({
        question: questions[step].question,
        answer,
        resumeText: resumeToPlainText(content),
        desiredJobRole: jobRole.trim() || undefined
      });
      setFeedbacks((prev) => ({ ...prev, [step]: f }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.evalFailed);
    } finally {
      setEvaluating(false);
    }
  }

  function copyText(text: string) {
    void navigator.clipboard?.writeText(text).then(() => toast.success(t.copiedToast)).catch(() => {});
  }

  const catLabel = (c: string) =>
    c === "intro" ? t.catIntro : c === "experience" ? t.catExperience : c === "competency" ? t.catCompetency : c === "weakness" ? t.catWeakness : t.catOther;
  const current = questions[step] ?? null;
  const answer = answers[step] ?? "";
  const feedback = feedbacks[step] ?? null;
  const isLast = step >= questions.length - 1;
  // 완료 화면용 — 평가받은 질문들의 평균 점수.
  const scored = Object.values(feedbacks);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((sum, f) => sum + f.score, 0) / scored.length) : null;

  // 이력서가 없거나(삭제 등) 못 불러오면 모의 면접용 이력서 선택 화면으로.
  if (missing) return <ResumeToolPickerPage tool="interview" />;

  return (
    <ResumeMakerShell>
      <ResumeBackBar backHref="/resume-maker" backLabel={picker.resumeList} title={resumeTitle} />
      {loading ? (
        <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
          <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
        </div>
      ) : (
        <div className="mx-auto grid max-w-6xl gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 px-5 py-6 lg:max-h-[calc(100vh-100px)] lg:overflow-y-auto lg:py-8">
            <div className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2">
              <ChatCircleDots weight="bold" className="h-6 w-6 text-[#0B46E8]" aria-hidden />
              <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>{t.title}</h2>
            </div>
            <p className="mt-2 text-[14px] text-muted-foreground">{t.desc}</p>

            {/* 1단계 — 준비(직무/JD) */}
            {questions.length === 0 ? (
              <>
                {/* 입력 모드 — 직접 입력 vs Aply 포지션 선택 (두꺼운 텍스트 탭) */}
                <div className="mt-6 flex items-center gap-6">
                  {(["text", "position"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setInputMode(m);
                        if (m === "position" && pager.positions === null) pager.search();
                      }}
                      className={`relative -mb-px pb-2.5 text-[16px] font-extrabold tracking-[-0.01em] transition-colors ${
                        inputMode === m ? "text-[#0B1227]" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {m === "text" ? tt.modeText : tt.modePosition}
                      {inputMode === m ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full bg-[#0B46E8]" /> : null}
                    </button>
                  ))}
                </div>

                {inputMode === "text" ? (
                  <>
                  <label className="mt-3 block text-[12.5px] font-medium text-foreground/80">
                    {t.jobRoleLabel}
                    <input
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      placeholder={t.jobRolePlaceholder}
                      maxLength={120}
                      className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="mt-4 block text-[12.5px] font-medium text-foreground/80">
                    {t.jobLabel}
                    <textarea
                      value={jobText}
                      onChange={(e) => {
                        setJobText(e.target.value);
                        setSelectedPosId(null);
                      }}
                      placeholder={t.jobPlaceholder}
                      rows={5}
                      maxLength={6000}
                      className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
                    />
                  </label>
                  </>
                ) : (
                  <div className="mt-3">
                    {/* 검색 — 입력은 다른 필드와 동일, 버튼은 우측 밖으로 */}
                    <div className="flex items-center gap-2">
                      <input
                        value={pager.query}
                        onChange={(e) => pager.setQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            pager.search();
                          }
                        }}
                        placeholder={tt.positionSearchPlaceholder}
                        className="h-11 w-full flex-1 rounded-xl border border-border bg-white px-3 text-[14px] text-slate-800 focus:border-primary focus:outline-none placeholder:text-slate-400"
                      />
                      <Button
                        size="lg"
                        type="button"
                        className="h-11 shrink-0 rounded-xl bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d]"
                        onClick={() => pager.search()}
                      >
                        {tt.searchBtn}
                      </Button>
                    </div>
                    {/* 목록 — 포지션 탐색의 PositionRow 그대로(한 페이지 5개) */}
                    <div className="mt-3 space-y-2">
                      {pager.loading ? (
                        <div className="flex justify-center py-6 text-muted-foreground">
                          <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
                        </div>
                      ) : pager.positions && pager.positions.length > 0 ? (
                        pager.positions.map((p) => (
                          <PositionRow
                            key={p.id}
                            p={mapPublicPositionToCard(p, locale)}
                            isOwnPartnerPosting={false}
                            isStudentUser
                            isApplied={false}
                            isFavorite={false}
                            onToggleFavorite={() => {}}
                            onApply={() => {}}
                            locale={locale}
                            compact
                            onSelect={() => selectPosition(p)}
                            selected={selectedPosId === p.id}
                          />
                        ))
                      ) : (
                        <p className="py-6 text-center text-[13px] text-muted-foreground">{tt.positionEmpty}</p>
                      )}
                    </div>
                    {/* 페이지네이션 — 숫자 페이지(1,2,3…N) */}
                    {!pager.loading ? (
                      <PositionPagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
                    ) : null}
                  </div>
                )}
                <Button
                  variant="default"
                  size="lg"
                  className="mt-3 w-full"
                  disabled={generating || (inputMode === "position" ? !selectedPosId : !jobRole.trim() && !jobText.trim())}
                  onClick={() => void generate()}
                >
                  {generating ? <CircleNotch className="animate-spin" weight="bold" /> : <Sparkle weight="fill" />}
                  {generating ? t.generating : t.generate}
                  {!generating ? <AiTicketCost /> : null}
                </Button>
              </>
            ) : done ? (
              /* 완료 — 요약(평균 점수) */
              <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center shadow-card">
                <CheckCircle weight="fill" className="mx-auto h-10 w-10 text-emerald-500" aria-hidden />
                <p className={`${paperlogy.className} mt-3 text-xl font-black text-[#0B1227]`}>{t.finishTitle}</p>
                <p className="mt-1.5 text-[13.5px] text-muted-foreground">{t.finishDesc}</p>
                {avgScore !== null ? (
                  <div className="mt-4 inline-flex items-baseline gap-1.5 rounded-xl bg-muted/50 px-4 py-2.5">
                    <span className="text-[12.5px] font-bold text-muted-foreground">{t.scoreLabel}</span>
                    <span className="text-2xl font-black" style={{ color: scoreColor(avgScore) }}>{avgScore}</span>
                    <span className="text-[13px] text-muted-foreground">/ 100</span>
                  </div>
                ) : null}
                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button variant="default" size="lg" onClick={restart}>
                    <ArrowCounterClockwise weight="bold" /> {t.restart}
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setQuestions([])}>
                    <Sparkle weight="fill" /> {t.regenerate}
                  </Button>
                </div>
              </div>
            ) : (
              /* 순차 진행 — 한 질문씩 */
              <div className="mt-6">
                {/* 진행 헤더 — 카테고리 · 진행도 · 질문 다시 만들기 */}
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    {current?.category ? (
                      <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-[#0B46E8]">{catLabel(current.category)}</span>
                    ) : null}
                    <span className="text-[12.5px] font-bold text-muted-foreground">{t.questionProgress(step + 1, questions.length)}</span>
                  </span>
                  <button type="button" onClick={() => setQuestions([])} className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-medium text-[#0B46E8] transition hover:underline">
                    <Sparkle weight="fill" className="h-3.5 w-3.5" /> {t.regenerate}
                  </button>
                </div>
                {/* 진행 바 */}
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-[#0B46E8] transition-[width] duration-300"
                    style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                  />
                </div>

                {/* 질문 */}
                <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <p className="text-[16px] font-bold leading-relaxed text-[#0B1227]">{current?.question}</p>
                  {current?.intent ? (
                    <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      <Lightbulb weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                      <span><span className="font-semibold">{t.intentLabel}:</span> {current.intent}</span>
                    </p>
                  ) : null}
                </div>

                {/* 답변 */}
                <label className="mt-4 block text-[12.5px] font-medium text-foreground/80">
                  {t.answerLabel}
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [step]: e.target.value }))}
                    placeholder={t.answerPlaceholder}
                    rows={5}
                    maxLength={4000}
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
                  />
                </label>

                {!feedback ? (
                  <Button variant="default" size="lg" className="mt-3 w-full" disabled={evaluating || !answer.trim()} onClick={() => void evaluate()}>
                    {evaluating ? <CircleNotch className="animate-spin" weight="bold" /> : <Sparkle weight="fill" />}
                    {evaluating ? t.evaluating : t.evaluate}
                  </Button>
                ) : (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
                      <div className="flex items-baseline justify-between">
                        <p className="text-[12px] font-bold text-muted-foreground">{t.scoreLabel}</p>
                        <span className="text-2xl font-black" style={{ color: scoreColor(feedback.score) }}>{feedback.score}<span className="text-[13px] text-muted-foreground"> / 100</span></span>
                      </div>
                      {feedback.strengths.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-[12px] font-bold text-emerald-700">{t.strengthsTitle}</p>
                          <ul className="mt-1 space-y-1">
                            {feedback.strengths.map((s, i) => (
                              <li key={i} className="text-[13px] leading-relaxed text-foreground/80">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {feedback.improvements.length > 0 ? (
                        <div className="mt-3">
                          <p className="text-[12px] font-bold text-amber-700">{t.improvementsTitle}</p>
                          <ul className="mt-1 space-y-1">
                            {feedback.improvements.map((s, i) => (
                              <li key={i} className="text-[13px] leading-relaxed text-foreground/80">• {s}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>

                    {feedback.sampleAnswer ? (
                      <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-[12.5px] font-bold text-[#0B46E8]">{t.sampleTitle}</p>
                          <button type="button" onClick={() => copyText(feedback.sampleAnswer)} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0B46E8] transition hover:underline">
                            <CopyIcon weight="bold" className="h-3.5 w-3.5" /> {t.copy}
                          </button>
                        </div>
                        <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-foreground/90">{feedback.sampleAnswer}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 하단 내비게이션 — 이전 / 다음(또는 완료) */}
                <div className="mt-5 flex items-center justify-between gap-3">
                  <Button variant="ghost" size="lg" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                    <ArrowLeft weight="bold" /> {t.prev}
                  </Button>
                  <Button
                    variant={feedback ? "default" : "outline"}
                    size="lg"
                    onClick={() => (isLast ? setDone(true) : setStep((s) => s + 1))}
                  >
                    {isLast ? t.finish : t.next} <ArrowRight weight="bold" />
                  </Button>
                </div>
              </div>
            )}
            </div>
          </div>
          <ResumeToolPreview content={content} design={design} expandLabel={picker.expand} previewLabel={picker.preview} />
        </div>
      )}
      {quotaOpen ? <AiQuotaModal resetAt={resetAt} onClose={() => setQuotaOpen(false)} /> : null}
    </ResumeMakerShell>
  );
}
