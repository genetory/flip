"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Circle,
  CircleNotch,
  PencilSimple,
  Sparkle,
  WarningCircle
} from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { AiTicketCost } from "./AiTicketCost";
import { ResumeMakerWorkspace } from "./ResumeMakerWorkspace";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { useResumeMakerAutosave } from "./useResumeMakerAutosave";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { postDraftResumeText, type ResumeContent } from "../../lib/member-profile-client";
import {
  generateExperienceBullets,
  generateExperienceInterview,
  getBuilderState,
  getDraftResume,
  type ExperienceContextInput
} from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import {
  DEFAULT_DESIGN,
  experienceTypeLabel,
  type BuilderExperience,
  type InterviewAnswerValue,
  type InterviewQuestion,
  type ResumeBuilderState
} from "../../lib/resume-maker-types";
import {
  trackExperienceInterviewCompleted,
  trackExperienceInterviewStarted,
  trackResumeSentenceAccepted,
  trackResumeSentenceGenerated
} from "../../lib/analytics";
import { useInterviewCopy } from "../../lib/resume-maker-i18n/interview";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

type InterviewCopy = ReturnType<typeof useInterviewCopy>;

type Phase = "loading" | "preparing" | "interview" | "generating" | "review" | "missing";

function generatingPhrases(t: InterviewCopy): string[] {
  return [t.generatingPhrase1, t.generatingPhrase2, t.generatingPhrase3];
}

function toneButtons(t: InterviewCopy): { label: string; hints: string }[] {
  return [
    { label: t.toneSimplerLabel, hints: t.toneSimplerHints },
    { label: t.toneProfessionalLabel, hints: t.toneProfessionalHints },
    { label: t.toneResultsLabel, hints: t.toneResultsHints },
    { label: t.toneShorterLabel, hints: t.toneShorterHints },
    { label: t.toneSpecificLabel, hints: t.toneSpecificHints }
  ];
}

function periodText(exp: BuilderExperience, t: InterviewCopy): string {
  if (!exp.startDate && !exp.endDate) return "";
  return `${exp.startDate ?? "?"} ~ ${exp.endDate || t.inProgress}`;
}

function toContext(exp: BuilderExperience, t: InterviewCopy): ExperienceContextInput {
  return {
    type: experienceTypeLabel(exp.type),
    title: exp.title,
    org: exp.org,
    period: periodText(exp, t) || undefined,
    rawInput: exp.rawInput
  };
}

function answerToText(answer: InterviewAnswerValue | undefined, t: InterviewCopy): string | null {
  if (!answer) return null;
  if (answer.kind === "text") return answer.value.trim() || null;
  if (answer.kind === "choices") return answer.value.length ? answer.value.join(", ") : null;
  if (answer.kind === "unknown") return t.notSureExactly;
  return null; // skipped → 생성 입력에서 제외
}

type BulletUi = {
  id: string;
  text: string;
  before?: string;
  evidenceLevel: "confirmed" | "inferred";
  needsReview: boolean;
  approved: boolean;
  editing: boolean;
  busy: boolean;
};

export function ResumeExperienceInterviewPage({ resumeId, experienceId }: { resumeId: string; experienceId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useInterviewCopy();
  const pickerCopy = useToolPickerCopy();
  const [phase, setPhase] = useState<Phase>("loading");
  const [baseContent, setBaseContent] = useState<ResumeContent>({});
  const [title, setTitle] = useState("");
  const [builder, setBuilder] = useState<ResumeBuilderState | null>(null);
  const [qIndex, setQIndex] = useState(0);
  const [bullets, setBullets] = useState<BulletUi[]>([]);
  const [genPhrase, setGenPhrase] = useState(0);

  const { status, schedule, flush } = useResumeMakerAutosave(resumeId, baseContent);

  const exp = useMemo(
    () => builder?.experiences.find((e) => e.id === experienceId) ?? null,
    [builder, experienceId]
  );

  // builder 최신값 미러 — patchExp 를 동기적으로 계산하기 위함(업데이터 내부에서
  // setState 를 호출하는 안티패턴 회피 + 호출부에서 next 를 즉시 사용 가능).
  const builderRef = useRef<ResumeBuilderState | null>(null);
  useEffect(() => {
    builderRef.current = builder;
  }, [builder]);

  // 경험 갱신 헬퍼 — builder 내 해당 경험만 patch + 자동저장.
  const patchExp = useCallback(
    (mutate: (e: BuilderExperience) => BuilderExperience): ResumeBuilderState | null => {
      const prev = builderRef.current;
      if (!prev) return null;
      const next: ResumeBuilderState = {
        ...prev,
        experiences: prev.experiences.map((e) => (e.id === experienceId ? mutate(e) : e))
      };
      builderRef.current = next;
      setBuilder(next);
      schedule(next);
      return next;
    },
    [experienceId, schedule]
  );

  const fetchQuestions = useCallback(
    async (current: BuilderExperience) => {
      setPhase("preparing");
      try {
        const { coachNote, questions } = await generateExperienceInterview({
          experience: toContext(current, t),
          jobCategories: builder?.onboarding.jobCategories
        });
        patchExp((e) => ({
          ...e,
          status: "needs_questions",
          interview: { coachNote, questions, answers: e.interview?.answers ?? {} },
          updatedAt: new Date().toISOString()
        }));
        trackExperienceInterviewStarted();
        setQIndex(0);
        setPhase("interview");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t.questionsLoadError);
        setPhase("interview"); // 빈 상태에서 재시도 버튼 노출
      }
    },
    [builder?.onboarding.jobCategories, patchExp, toast, t]
  );

  // 최초 로드
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
        setBaseContent(resume.content);
        setTitle(resume.title);
        const state = getBuilderState(resume);
        setBuilder(state);
        const found = state.experiences.find((e) => e.id === experienceId);
        if (!found) {
          setPhase("missing");
          return;
        }
        if (found.generation && !(found.approvedBullets && found.approvedBullets.length)) {
          setBullets(toBulletUi(found));
          setPhase("review");
        } else if (found.interview?.questions?.length) {
          setPhase("interview");
        } else {
          void fetchQuestions(found);
        }
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : t.resumeLoadError);
        router.replace(`/resume-maker/${resumeId}/experiences`);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, experienceId]);

  // 생성 중 진행 문구 순환
  useEffect(() => {
    if (phase !== "generating") return;
    const timer = setInterval(() => setGenPhrase((p) => (p + 1) % 3), 1500);
    return () => clearInterval(timer);
  }, [phase]);

  function toBulletUi(e: BuilderExperience): BulletUi[] {
    const approvedTexts = new Set((e.approvedBullets ?? []).map((b) => b.text));
    return (e.generation?.resumeBullets ?? []).map((b, i) => ({
      id: `b${i}`,
      text: b.text,
      evidenceLevel: b.evidenceLevel,
      needsReview: b.needsReview,
      approved: approvedTexts.has(b.text) || (e.approvedBullets ?? []).length === 0,
      editing: false,
      busy: false
    }));
  }

  function setAnswer(qid: string, value: InterviewAnswerValue) {
    patchExp((e) => ({
      ...e,
      interview: e.interview
        ? { ...e.interview, answers: { ...e.interview.answers, [qid]: value } }
        : { questions: [], answers: { [qid]: value } },
      updatedAt: new Date().toISOString()
    }));
  }

  async function runGeneration(current: BuilderExperience) {
    const questions = current.interview?.questions ?? [];
    const answers = current.interview?.answers ?? {};
    const qa = questions
      .map((q) => {
        const text = answerToText(answers[q.id], t);
        return text ? { question: q.prompt, answer: text } : null;
      })
      .filter((x): x is { question: string; answer: string } => x !== null);
    if (qa.length === 0) {
      toast.info(t.answerAtLeastOne);
      return;
    }
    setPhase("generating");
    setGenPhrase(0);
    trackExperienceInterviewCompleted();
    try {
      const gen = await generateExperienceBullets({
        experience: toContext(current, t),
        jobCategories: builder?.onboarding.jobCategories,
        qa
      });
      const generatedAt = new Date().toISOString();
      const nextState = patchExp((e) => ({
        ...e,
        status: "generated",
        generation: { ...gen, generatedAt },
        updatedAt: generatedAt
      }));
      const updatedExp = nextState?.experiences.find((e) => e.id === experienceId);
      if (updatedExp) setBullets(toBulletUi(updatedExp));
      trackResumeSentenceGenerated(gen.resumeBullets.length);
      setPhase("review");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.sentenceGenerateError);
      setPhase("interview");
    }
  }

  async function rewriteBullet(bulletId: string, hints: string) {
    const target = bullets.find((b) => b.id === bulletId);
    if (!target || target.busy) return;
    setBullets((prev) => prev.map((b) => (b.id === bulletId ? { ...b, busy: true } : b)));
    try {
      const result = await postDraftResumeText({
        fieldType: "career",
        currentText: target.text,
        mode: "improve",
        hints
      });
      setBullets((prev) =>
        prev.map((b) => (b.id === bulletId ? { ...b, before: b.text, text: result.text, busy: false } : b))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.sentenceRewriteError);
      setBullets((prev) => prev.map((b) => (b.id === bulletId ? { ...b, busy: false } : b)));
    }
  }

  function mergeFollowUps() {
    if (!exp?.generation?.followUpQuestions?.length) return;
    const follow = exp.generation.followUpQuestions;
    patchExp((e) => {
      const existing = e.interview?.questions ?? [];
      const merged = [...existing, ...follow.map((q, i) => ({ ...q, id: `f${existing.length + i + 1}` }))];
      return {
        ...e,
        status: "needs_questions",
        interview: { coachNote: e.interview?.coachNote, questions: merged, answers: e.interview?.answers ?? {} },
        updatedAt: new Date().toISOString()
      };
    });
    setQIndex((exp.interview?.questions ?? []).length);
    setPhase("interview");
  }

  async function saveApproved() {
    const approved = bullets.filter((b) => b.approved && b.text.trim());
    if (approved.length === 0) {
      toast.info(t.selectAtLeastOne);
      return;
    }
    patchExp((e) => ({
      ...e,
      status: "ready",
      approvedBullets: approved.map((b) => ({ id: crypto.randomUUID(), text: b.text.trim() })),
      approvedSkills: e.generation?.skills ?? [],
      updatedAt: new Date().toISOString()
    }));
    trackResumeSentenceAccepted();
    try {
      await flush();
    } catch {
      /* flush 내부에서 상태 처리 */
    }
    toast.success(t.savedApproved);
    router.push(`/resume-maker/${resumeId}/experiences`);
  }

  const rightSlot = <AutoSaveIndicator status={status} onRetry={() => void flush()} />;

  if (phase === "loading" || !builder) {
    return <CenterState shell>{spinner(t.loading)}</CenterState>;
  }
  if (phase === "missing" || !exp) {
    return (
      <ResumeMakerShell right={rightSlot}>
        <section className="container max-w-2xl px-5 py-14 text-center">
          <p className="text-[14px] text-muted-foreground">{t.experienceNotFound}</p>
          <Button variant="outline" size="lg" className="mt-5" onClick={() => router.push(`/resume-maker/${resumeId}/experiences`)}>
            {t.backToList}
          </Button>
        </section>
      </ResumeMakerShell>
    );
  }

  const design = builder.design ?? DEFAULT_DESIGN;
  const previewContent = compileResumeContent(builder, baseContent);

  return (
    <ResumeMakerWorkspace
      right={rightSlot}
      back={{ href: `/resume-maker/${resumeId}/experiences`, label: pickerCopy.back, title }}
      content={previewContent}
      design={design}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/resume-maker/${resumeId}/experiences`)}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> {t.experienceListBack}
          </button>
          <span className="truncate text-[13px] font-semibold text-[#191F28]">{exp.title}</span>
        </div>

        {phase === "preparing" ? <div className="py-16">{spinner(t.preparingQuestions)}</div> : null}

        {phase === "interview" ? (
          <InterviewView
            t={t}
            exp={exp}
            qIndex={qIndex}
            setQIndex={setQIndex}
            onAnswer={setAnswer}
            onGenerate={() => void runGeneration(exp)}
            onRetryQuestions={() => void fetchQuestions(exp)}
          />
        ) : null}

        {phase === "generating" ? (
          <div className="py-16 text-center">
            <Sparkle className="mx-auto h-8 w-8 animate-pulse text-[#0B46E8]" weight="fill" aria-hidden />
            <p className="mt-4 text-[15px] font-semibold text-[#191F28]">{generatingPhrases(t)[genPhrase]}</p>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">{t.generatingNote}</p>
          </div>
        ) : null}

        {phase === "review" ? (
          <ReviewView
            t={t}
            exp={exp}
            bullets={bullets}
            setBullets={setBullets}
            onTone={rewriteBullet}
            onMergeFollowUps={mergeFollowUps}
            onSave={() => void saveApproved()}
            saving={status === "saving"}
          />
        ) : null}
      </div>
    </ResumeMakerWorkspace>
  );
}

// ---- 작은 헬퍼/하위 뷰들 ----

function spinner(label: string) {
  return (
    <div className="flex items-center justify-center text-muted-foreground">
      <span className="inline-flex items-center gap-2 text-sm">
        <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {label}
      </span>
    </div>
  );
}

function CenterState({ children, shell }: { children: React.ReactNode; shell?: boolean }) {
  const body = <div className="flex min-h-[60vh] items-center justify-center">{children}</div>;
  return shell ? <ResumeMakerShell>{body}</ResumeMakerShell> : body;
}

function InterviewView({
  t,
  exp,
  qIndex,
  setQIndex,
  onAnswer,
  onGenerate,
  onRetryQuestions
}: {
  t: InterviewCopy;
  exp: BuilderExperience;
  qIndex: number;
  setQIndex: (n: number) => void;
  onAnswer: (qid: string, value: InterviewAnswerValue) => void;
  onGenerate: () => void;
  onRetryQuestions: () => void;
}) {
  const questions = exp.interview?.questions ?? [];
  const answers = exp.interview?.answers ?? {};

  if (questions.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[14px] text-muted-foreground">{t.questionsLoadFailed}</p>
        <Button variant="outline" size="lg" className="mt-4" onClick={onRetryQuestions}>
          {t.retry}
          <AiTicketCost feature="experience_interview" tone="muted" />
        </Button>
      </div>
    );
  }

  const idx = Math.min(qIndex, questions.length - 1);
  const q = questions[idx];
  const isLast = idx === questions.length - 1;
  const answeredCount = questions.filter((qq) => answers[qq.id] !== undefined).length;

  return (
    <div className="mt-6">
      {/* 진행률 */}
      <div className="flex items-center justify-between text-[12px] font-semibold text-muted-foreground">
        <span>{t.questionProgress(idx + 1, questions.length)}</span>
        <span>{t.answeredCount(answeredCount)}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
        <div className="h-full rounded-full bg-[#0B46E8] transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      {exp.interview?.coachNote && idx === 0 ? (
        <p className="mt-5 rounded-xl bg-[#EDF1FD] px-4 py-2.5 text-[13px] leading-relaxed text-[#4E5968]">{exp.interview.coachNote}</p>
      ) : null}

      {/* 큰 질문 카드 */}
      <div className="mt-5 rounded-2xl border border-[#F2F4F6] bg-white p-6 shadow-card">
        <h2 className="text-xl font-bold leading-snug tracking-[-0.01em] text-[#191F28] md:text-2xl">{q.prompt}</h2>
        {q.helper ? <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{q.helper}</p> : null}
        <div className="mt-5">
          <AnswerInput t={t} question={q} answer={answers[q.id]} onChange={(v) => onAnswer(q.id, v)} />
        </div>
        {/* 반드시 제공: 모름 / 기억 안 남 / 건너뛰기 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { key: "unknown", label: t.answerUnknown, v: { kind: "unknown" } as InterviewAnswerValue },
            { key: "notRemember", label: t.answerNotRemember, v: { kind: "unknown" } as InterviewAnswerValue },
            { key: "skip", label: t.answerSkip, v: { kind: "skipped" } as InterviewAnswerValue }
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => {
                onAnswer(q.id, opt.v);
                if (!isLast) setQIndex(idx + 1);
              }}
              className="rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-medium text-[#4E5968] transition hover:bg-[#E8EBF0]"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 내비게이션 */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" size="lg" onClick={() => setQIndex(Math.max(0, idx - 1))} disabled={idx === 0} className={idx === 0 ? "invisible" : ""}>
          <ArrowLeft weight="bold" /> {t.previous}
        </Button>
        {!isLast ? (
          <Button variant="default" size="lg" onClick={() => setQIndex(idx + 1)}>
            {t.next} <ArrowRight weight="bold" />
          </Button>
        ) : (
          <Button variant="hero" size="lg" onClick={onGenerate}>
            <Sparkle weight="bold" /> {t.makeSentences}
            <AiTicketCost feature="experience_bullets" tone="plain" />
          </Button>
        )}
      </div>
      <p className="mt-3 text-center text-[12px] text-muted-foreground">{t.numberHint}</p>
    </div>
  );
}

function AnswerInput({
  t,
  question,
  answer,
  onChange
}: {
  t: InterviewCopy;
  question: InterviewQuestion;
  answer: InterviewAnswerValue | undefined;
  onChange: (v: InterviewAnswerValue) => void;
}) {
  const textValue = answer?.kind === "text" ? answer.value : "";
  const choiceValue = answer?.kind === "choices" ? answer.value : [];
  const inputCls = "w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 py-2.5 text-[14px] focus:border-[#0B46E8] focus:bg-white focus:outline-none";

  if (question.type === "long_text") {
    return (
      <textarea
        value={textValue}
        onChange={(e) => onChange({ kind: "text", value: e.target.value })}
        rows={4}
        maxLength={2000}
        placeholder={t.longTextPlaceholder}
        className={`${inputCls} leading-relaxed`}
      />
    );
  }
  if (question.type === "short_text" || question.type === "number") {
    return (
      <input
        value={textValue}
        inputMode={question.type === "number" ? "numeric" : "text"}
        onChange={(e) => onChange({ kind: "text", value: e.target.value })}
        maxLength={400}
        placeholder={question.type === "number" ? t.numberPlaceholder : t.shortTextPlaceholder}
        className={inputCls}
      />
    );
  }
  // single/multi/select_with_custom — 옵션 칩
  const options = question.options ?? [];
  const multi = question.type === "multi_select";
  function toggle(opt: string) {
    if (multi) {
      const set = new Set(choiceValue);
      if (set.has(opt)) set.delete(opt);
      else set.add(opt);
      onChange({ kind: "choices", value: Array.from(set) });
    } else {
      onChange({ kind: "choices", value: [opt] });
    }
  }
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = choiceValue.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`rounded-full border px-3.5 py-2 text-[13.5px] font-medium transition ${
                selected ? "border-[#0B46E8] bg-[#EDF1FD] text-[#0B46E8]" : "border-[#F2F4F6] bg-white text-[#4E5968] hover:border-[#0B46E8]/30"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {question.type === "select_with_custom" ? (
        <input
          value={answer?.kind === "text" ? answer.value : ""}
          onChange={(e) => onChange({ kind: "text", value: e.target.value })}
          placeholder={t.customInputPlaceholder}
          maxLength={400}
          className={`${inputCls} mt-2`}
        />
      ) : null}
    </div>
  );
}

function ReviewView({
  t,
  exp,
  bullets,
  setBullets,
  onTone,
  onMergeFollowUps,
  onSave,
  saving
}: {
  t: InterviewCopy;
  exp: BuilderExperience;
  bullets: BulletUi[];
  setBullets: React.Dispatch<React.SetStateAction<BulletUi[]>>;
  onTone: (bulletId: string, hints: string) => void;
  onMergeFollowUps: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const gen = exp.generation;
  const approvedCount = bullets.filter((b) => b.approved).length;

  return (
    <div className="mt-6">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#191F28] md:text-[26px]">{t.reviewTitle}</h2>
      <p className="mt-2 text-[13.5px] text-muted-foreground">{t.reviewDesc}</p>

      {/* 원래 입력 */}
      {exp.rawInput ? (
        <div className="mt-5 rounded-xl bg-[#F2F4F6] p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t.rawInputLabel}</p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/75">{exp.rawInput}</p>
        </div>
      ) : null}

      {gen?.warnings && gen.warnings.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {gen.warnings.map((w, i) => (
            <li key={i} className="flex items-start gap-2 rounded-lg bg-amber-50/70 px-3 py-2 text-[12.5px] leading-relaxed text-amber-900">
              <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" weight="fill" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      ) : null}

      {/* 문장 카드들 */}
      <div className="mt-5 space-y-3">
        {bullets.map((b) => (
          <div key={b.id} className={`rounded-2xl border p-4 shadow-card transition ${b.approved ? "border-[#0B46E8]/40 bg-[#EDF1FD]/50" : "border-[#F2F4F6] bg-white"}`}>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setBullets((prev) => prev.map((x) => (x.id === b.id ? { ...x, approved: !x.approved } : x)))}
                aria-label={b.approved ? t.approveUnuse : t.approveUse}
                className="mt-0.5 shrink-0"
              >
                {b.approved ? (
                  <CheckCircle className="h-5 w-5 text-[#0B46E8]" weight="fill" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/50" weight="bold" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                {b.editing ? (
                  <textarea
                    value={b.text}
                    onChange={(e) => setBullets((prev) => prev.map((x) => (x.id === b.id ? { ...x, text: e.target.value } : x)))}
                    rows={3}
                    maxLength={400}
                    className="w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 py-2.5 text-[14px] leading-relaxed focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                  />
                ) : (
                  <p className="text-[14px] leading-relaxed text-[#191F28]">{b.text}</p>
                )}
                {b.before && b.before !== b.text ? (
                  <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold">{t.changedBefore}</span> · {b.before}
                  </p>
                ) : null}
                {b.evidenceLevel === "inferred" || b.needsReview ? (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    {t.needsReviewBadge}
                  </span>
                ) : null}
                {/* 톤/수정 버튼 */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {toneButtons(t).map((tone) => (
                    <button
                      key={tone.label}
                      type="button"
                      disabled={b.busy}
                      onClick={() => onTone(b.id, tone.hints)}
                      className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-medium text-[#4E5968] transition hover:bg-[#E8EBF0] hover:text-[#191F28] disabled:opacity-50"
                    >
                      {tone.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBullets((prev) => prev.map((x) => (x.id === b.id ? { ...x, editing: !x.editing } : x)))}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-medium text-[#4E5968] transition hover:bg-[#E8EBF0] hover:text-[#191F28]"
                  >
                    <PencilSimple className="h-3 w-3" weight="bold" aria-hidden /> {b.editing ? t.editDone : t.editManual}
                  </button>
                  {b.busy ? <CircleNotch className="h-4 w-4 animate-spin text-muted-foreground" weight="bold" aria-hidden /> : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 스킬 */}
      {gen?.skills && gen.skills.length > 0 ? (
        <div className="mt-5">
          <p className="text-[12px] font-bold text-muted-foreground">{t.extractedSkills}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {gen.skills.map((s) => (
              <span key={s} className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-medium text-[#0B46E8]">{s}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* 추가 질문 / 저장 */}
      <div className="mt-8 flex flex-col gap-3">
        {gen?.followUpQuestions && gen.followUpQuestions.length > 0 ? (
          <Button variant="outline" size="lg" onClick={onMergeFollowUps}>
            {t.askAgain(gen.followUpQuestions.length)}
          </Button>
        ) : null}
        <Button variant="hero" size="xl" onClick={onSave} disabled={saving || approvedCount === 0}>
          {saving ? <CircleNotch className="animate-spin" weight="bold" /> : <CheckCircle weight="bold" />}
          {t.saveSelected(approvedCount)}
        </Button>
      </div>
    </div>
  );
}
