"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ChatCircleDots, CircleNotch, Copy as CopyIcon, Lightbulb, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { ResumeBackBar } from "./ResumeBackBar";
import { ResumeToolPreview } from "./ResumeToolPreview";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
import type { ResumeContent } from "../../lib/member-profile-client";
import {
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
import { useInterviewPrepCopy } from "../../lib/resume-maker-i18n/interview-prep";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

function scoreColor(s: number): string {
  if (s >= 75) return "#16a34a";
  if (s >= 50) return "#0B46E8";
  if (s >= 30) return "#d97706";
  return "#dc2626";
}

export function ResumeInterviewPage({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useInterviewPrepCopy();
  const picker = useToolPickerCopy();
  const [loading, setLoading] = useState(true);
  const [resumeTitle, setResumeTitle] = useState("");
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [design, setDesign] = useState<ResumeDesignSettings>(DEFAULT_DESIGN);
  // 1단계 — 준비(직무/JD)
  const [jobRole, setJobRole] = useState("");
  const [jobText, setJobText] = useState("");
  const [generating, setGenerating] = useState(false);
  // 2단계 — 예상 질문 리스트
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  // 3단계 — 연습(선택 질문). null 이면 리스트.
  const [selected, setSelected] = useState<number | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

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
      setSelected(null);
      setAnswer("");
      setFeedback(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.failedQuestions);
    } finally {
      setGenerating(false);
    }
  }

  function pick(i: number) {
    setSelected(i);
    setAnswer("");
    setFeedback(null);
  }

  function backToList() {
    setSelected(null);
    setAnswer("");
    setFeedback(null);
  }

  async function evaluate() {
    if (!content || selected === null || evaluating) return;
    if (!answer.trim()) {
      toast.info(t.needAnswer);
      return;
    }
    setEvaluating(true);
    try {
      const f = await getInterviewFeedback({
        question: questions[selected].question,
        answer: answer.trim(),
        resumeText: resumeToPlainText(content),
        desiredJobRole: jobRole.trim() || undefined
      });
      setFeedback(f);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.evalFailed);
    } finally {
      setEvaluating(false);
    }
  }

  function copyText(text: string) {
    void navigator.clipboard?.writeText(text).then(() => toast.success(t.copiedToast)).catch(() => {});
  }

  const current = selected !== null ? questions[selected] : null;
  const catLabel = (c: string) =>
    c === "intro" ? t.catIntro : c === "experience" ? t.catExperience : c === "competency" ? t.catCompetency : c === "weakness" ? t.catWeakness : t.catOther;
  // 카테고리(섹션)별로 묶되, 같은 카테고리는 등장 순서대로 한 그룹으로 모은다.
  const catOrder: string[] = [];
  const byCat = new Map<string, { q: InterviewQuestionItem; idx: number }[]>();
  questions.forEach((q, idx) => {
    if (!byCat.has(q.category)) {
      byCat.set(q.category, []);
      catOrder.push(q.category);
    }
    byCat.get(q.category)!.push({ q, idx });
  });
  const groups = catOrder.map((c) => ({ cat: c, items: byCat.get(c)! }));

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
                <label className="mt-6 block text-[12.5px] font-medium text-foreground/80">
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
                    onChange={(e) => setJobText(e.target.value)}
                    placeholder={t.jobPlaceholder}
                    rows={5}
                    maxLength={6000}
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
                  />
                </label>
                <Button variant="default" size="lg" className="mt-3 w-full" disabled={generating} onClick={() => void generate()}>
                  {generating ? <CircleNotch className="animate-spin" weight="bold" /> : <Sparkle weight="fill" />}
                  {generating ? t.generating : t.generate}
                </Button>
              </>
            ) : current === null ? (
              /* 2단계 — 예상 질문 리스트 */
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-[#0B1227]">{t.listTitle}</p>
                  <button type="button" onClick={() => setQuestions([])} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-[#0B46E8] transition hover:underline">
                    <Sparkle weight="fill" className="h-3.5 w-3.5" /> {t.regenerate}
                  </button>
                </div>
                <div className="mt-4 space-y-5">
                  {groups.map((g) => (
                    <div key={g.cat}>
                      <p className="text-[11.5px] font-bold uppercase tracking-wide text-[#0B46E8]">{catLabel(g.cat)}</p>
                      <ul className="mt-2 space-y-2">
                        {g.items.map(({ q, idx }) => (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() => pick(idx)}
                              className="group w-full rounded-xl border border-border bg-card p-4 text-left shadow-card transition hover:border-primary/40"
                            >
                              <p className="text-[14.5px] font-bold leading-relaxed text-[#0B1227]">{q.question}</p>
                              {q.intent ? (
                                <p className="mt-1.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
                                  <Lightbulb weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                                  <span><span className="font-semibold">{t.intentLabel}:</span> {q.intent}</span>
                                </p>
                              ) : null}
                              <span className="mt-2.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0B46E8]">
                                {t.practiceThis} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" weight="bold" aria-hidden />
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* 3단계 — 연습(선택 질문) */
              <div className="mt-6">
                <button type="button" onClick={backToList} className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> {t.backToList}
                </button>
                <div className="mt-2 rounded-2xl border border-border bg-card p-5 shadow-card">
                  {current.category ? (
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-[#0B46E8]">{catLabel(current.category)}</span>
                  ) : null}
                  <p className="mt-1.5 text-[16px] font-bold leading-relaxed text-[#0B1227]">{current.question}</p>
                  {current.intent ? (
                    <p className="mt-2 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
                      <Lightbulb weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden />
                      <span><span className="font-semibold">{t.intentLabel}:</span> {current.intent}</span>
                    </p>
                  ) : null}
                </div>

                <label className="mt-4 block text-[12.5px] font-medium text-foreground/80">
                  {t.answerLabel}
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={t.answerPlaceholder}
                    rows={5}
                    maxLength={4000}
                    className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
                  />
                </label>

                {!feedback ? (
                  <Button variant="default" size="lg" className="mt-3 w-full" disabled={evaluating} onClick={() => void evaluate()}>
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

                    <Button variant="outline" size="lg" className="w-full" onClick={backToList}>
                      <ArrowLeft weight="bold" /> {t.backToList}
                    </Button>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>
          <ResumeToolPreview content={content} design={design} expandLabel={picker.expand} previewLabel={picker.preview} />
        </div>
      )}
    </ResumeMakerShell>
  );
}
