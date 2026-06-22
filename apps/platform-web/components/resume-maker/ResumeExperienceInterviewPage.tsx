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
import { ResumeMakerWorkspace } from "./ResumeMakerWorkspace";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { useResumeMakerAutosave } from "./useResumeMakerAutosave";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
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

type Phase = "loading" | "preparing" | "interview" | "generating" | "review" | "missing";

const GENERATING_PHRASES = [
  "답변에서 핵심 경험을 찾고 있어요.",
  "이력서에 적합한 문장으로 정리하고 있어요.",
  "과장된 표현이 없는지 확인하고 있어요."
];

const TONE_BUTTONS: { label: string; hints: string }[] = [
  { label: "더 담백하게", hints: "더 담백하고 간결하게, 과장 없이" },
  { label: "더 전문적으로", hints: "더 전문적인 어조로" },
  { label: "성과 중심으로", hints: "성과와 결과 중심으로 (없는 수치는 만들지 말 것)" },
  { label: "더 짧게", hints: "한 문장으로 더 짧게" },
  { label: "더 구체적으로", hints: "행동과 역할을 더 구체적으로 (없는 사실 추가 금지)" }
];

function periodText(exp: BuilderExperience): string {
  if (!exp.startDate && !exp.endDate) return "";
  return `${exp.startDate ?? "?"} ~ ${exp.endDate || "진행 중"}`;
}

function toContext(exp: BuilderExperience): ExperienceContextInput {
  return {
    type: experienceTypeLabel(exp.type),
    title: exp.title,
    org: exp.org,
    period: periodText(exp) || undefined,
    rawInput: exp.rawInput
  };
}

function answerToText(answer: InterviewAnswerValue | undefined): string | null {
  if (!answer) return null;
  if (answer.kind === "text") return answer.value.trim() || null;
  if (answer.kind === "choices") return answer.value.length ? answer.value.join(", ") : null;
  if (answer.kind === "unknown") return "정확히 기억나지 않음";
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
          experience: toContext(current),
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
        toast.error(err instanceof Error ? err.message : "질문을 불러오지 못했어요.");
        setPhase("interview"); // 빈 상태에서 재시도 버튼 노출
      }
    },
    [builder?.onboarding.jobCategories, patchExp, toast]
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
        toast.error(err instanceof Error ? err.message : "이력서를 불러오지 못했어요.");
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
    const t = setInterval(() => setGenPhrase((p) => (p + 1) % GENERATING_PHRASES.length), 1500);
    return () => clearInterval(t);
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
        const text = answerToText(answers[q.id]);
        return text ? { question: q.prompt, answer: text } : null;
      })
      .filter((x): x is { question: string; answer: string } => x !== null);
    if (qa.length === 0) {
      toast.info("최소 한 가지 질문에는 답해 주세요. 모르면 '잘 모르겠어요'도 괜찮아요.");
      return;
    }
    setPhase("generating");
    setGenPhrase(0);
    trackExperienceInterviewCompleted();
    try {
      const gen = await generateExperienceBullets({
        experience: toContext(current),
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
      toast.error(err instanceof Error ? err.message : "문장을 만들지 못했어요.");
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
      toast.error(err instanceof Error ? err.message : "문장을 다시 쓰지 못했어요.");
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
      toast.info("이력서에 사용할 문장을 한 개 이상 선택해 주세요.");
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
    toast.success("승인한 문장을 경험에 저장했어요.");
    router.push(`/resume-maker/${resumeId}/experiences`);
  }

  const rightSlot = <AutoSaveIndicator status={status} onRetry={() => void flush()} />;

  if (phase === "loading" || !builder) {
    return <CenterState shell>{spinner("불러오는 중...")}</CenterState>;
  }
  if (phase === "missing" || !exp) {
    return (
      <ResumeMakerShell right={rightSlot}>
        <section className="container max-w-2xl px-5 py-14 text-center">
          <p className="text-[14px] text-muted-foreground">경험을 찾을 수 없어요.</p>
          <Button variant="outline" size="lg" className="mt-5" onClick={() => router.push(`/resume-maker/${resumeId}/experiences`)}>
            경험 목록으로
          </Button>
        </section>
      </ResumeMakerShell>
    );
  }

  const design = builder.design ?? DEFAULT_DESIGN;
  const previewContent = compileResumeContent(builder, baseContent);

  return (
    <ResumeMakerWorkspace title={title} right={rightSlot} content={previewContent} design={design}>
      <div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.push(`/resume-maker/${resumeId}/experiences`)}
            className="inline-flex items-center gap-1 text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> 경험 목록
          </button>
          <span className="truncate text-[13px] font-semibold text-[#0B1227]">{exp.title}</span>
        </div>

        {phase === "preparing" ? <div className="py-16">{spinner("질문을 준비하고 있어요...")}</div> : null}

        {phase === "interview" ? (
          <InterviewView
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
            <p className="mt-4 text-[15px] font-semibold text-[#0B1227]">{GENERATING_PHRASES[genPhrase]}</p>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">말하지 않은 내용은 추가하지 않을게요.</p>
          </div>
        ) : null}

        {phase === "review" ? (
          <ReviewView
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
  exp,
  qIndex,
  setQIndex,
  onAnswer,
  onGenerate,
  onRetryQuestions
}: {
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
        <p className="text-[14px] text-muted-foreground">질문을 불러오지 못했어요.</p>
        <Button variant="outline" size="lg" className="mt-4" onClick={onRetryQuestions}>
          다시 시도
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
        <span>질문 {idx + 1} / {questions.length}</span>
        <span>{answeredCount}개 답변함</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
      </div>

      {exp.interview?.coachNote && idx === 0 ? (
        <p className="mt-5 rounded-xl bg-primary/5 px-4 py-2.5 text-[13px] leading-relaxed text-foreground/80">{exp.interview.coachNote}</p>
      ) : null}

      {/* 큰 질문 카드 */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className={`${paperlogy.className} text-xl font-black leading-snug tracking-[-0.01em] text-[#0B1227] md:text-2xl`}>{q.prompt}</h2>
        {q.helper ? <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{q.helper}</p> : null}
        <div className="mt-5">
          <AnswerInput question={q} answer={answers[q.id]} onChange={(v) => onAnswer(q.id, v)} />
        </div>
        {/* 반드시 제공: 모름 / 기억 안 남 / 건너뛰기 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { label: "잘 모르겠어요", v: { kind: "unknown" } as InterviewAnswerValue },
            { label: "기억나지 않아요", v: { kind: "unknown" } as InterviewAnswerValue },
            { label: "건너뛰기", v: { kind: "skipped" } as InterviewAnswerValue }
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => {
                onAnswer(q.id, opt.v);
                if (!isLast) setQIndex(idx + 1);
              }}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 내비게이션 */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="ghost" size="lg" onClick={() => setQIndex(Math.max(0, idx - 1))} disabled={idx === 0} className={idx === 0 ? "invisible" : ""}>
          <ArrowLeft weight="bold" /> 이전
        </Button>
        {!isLast ? (
          <Button variant="default" size="lg" onClick={() => setQIndex(idx + 1)}>
            다음 <ArrowRight weight="bold" />
          </Button>
        ) : (
          <Button variant="hero" size="lg" onClick={onGenerate}>
            <Sparkle weight="bold" /> 이력서 문장 만들기
          </Button>
        )}
      </div>
      <p className="mt-3 text-center text-[12px] text-muted-foreground">정확한 숫자를 모르면 넘어가도 괜찮아요.</p>
    </div>
  );
}

function AnswerInput({
  question,
  answer,
  onChange
}: {
  question: InterviewQuestion;
  answer: InterviewAnswerValue | undefined;
  onChange: (v: InterviewAnswerValue) => void;
}) {
  const textValue = answer?.kind === "text" ? answer.value : "";
  const choiceValue = answer?.kind === "choices" ? answer.value : [];
  const inputCls = "w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] focus:border-primary focus:outline-none";

  if (question.type === "long_text") {
    return (
      <textarea
        value={textValue}
        onChange={(e) => onChange({ kind: "text", value: e.target.value })}
        rows={4}
        maxLength={2000}
        placeholder="편하게 적어주세요."
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
        placeholder={question.type === "number" ? "숫자 (모르면 넘어가도 돼요)" : "편하게 적어주세요."}
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
                selected ? "border-primary bg-primary/10 text-[#0B46E8]" : "border-border bg-card text-foreground/80 hover:border-primary/40"
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
          placeholder="직접 입력"
          maxLength={400}
          className={`${inputCls} mt-2`}
        />
      ) : null}
    </div>
  );
}

function ReviewView({
  exp,
  bullets,
  setBullets,
  onTone,
  onMergeFollowUps,
  onSave,
  saving
}: {
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
      <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>AI가 정리한 문장</h2>
      <p className="mt-2 text-[13.5px] text-muted-foreground">사용할 문장을 선택하고 필요하면 다듬어 주세요. 승인한 문장만 이력서에 반영돼요.</p>

      {/* 원래 입력 */}
      {exp.rawInput ? (
        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">원래 입력</p>
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
          <div key={b.id} className={`rounded-2xl border p-4 shadow-card transition ${b.approved ? "border-primary/50 bg-primary/[0.03]" : "border-border bg-card"}`}>
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setBullets((prev) => prev.map((x) => (x.id === b.id ? { ...x, approved: !x.approved } : x)))}
                aria-label={b.approved ? "사용 해제" : "이 문장 사용"}
                className="mt-0.5 shrink-0"
              >
                {b.approved ? (
                  <CheckCircle className="h-5 w-5 text-primary" weight="fill" />
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
                    className="w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
                  />
                ) : (
                  <p className="text-[14px] leading-relaxed text-[#0B1227]">{b.text}</p>
                )}
                {b.before && b.before !== b.text ? (
                  <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
                    <span className="font-semibold">변경 전</span> · {b.before}
                  </p>
                ) : null}
                {b.evidenceLevel === "inferred" || b.needsReview ? (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    확인 필요
                  </span>
                ) : null}
                {/* 톤/수정 버튼 */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {TONE_BUTTONS.map((t) => (
                    <button
                      key={t.label}
                      type="button"
                      disabled={b.busy}
                      onClick={() => onTone(b.id, t.hints)}
                      className="rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                    >
                      {t.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setBullets((prev) => prev.map((x) => (x.id === b.id ? { ...x, editing: !x.editing } : x)))}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11.5px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    <PencilSimple className="h-3 w-3" weight="bold" aria-hidden /> {b.editing ? "완료" : "직접 수정"}
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
          <p className="text-[12px] font-bold text-muted-foreground">추출된 스킬</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {gen.skills.map((s) => (
              <span key={s} className="rounded-full bg-accent/10 px-2.5 py-1 text-[12px] font-medium text-[#0B46E8]">{s}</span>
            ))}
          </div>
        </div>
      ) : null}

      {/* 추가 질문 / 저장 */}
      <div className="mt-8 flex flex-col gap-3">
        {gen?.followUpQuestions && gen.followUpQuestions.length > 0 ? (
          <Button variant="outline" size="lg" onClick={onMergeFollowUps}>
            더 정확하게 — 다시 질문받기 ({gen.followUpQuestions.length})
          </Button>
        ) : null}
        <Button variant="hero" size="xl" onClick={onSave} disabled={saving || approvedCount === 0}>
          {saving ? <CircleNotch className="animate-spin" weight="bold" /> : <CheckCircle weight="bold" />}
          선택한 문장 저장 ({approvedCount})
        </Button>
      </div>
    </div>
  );
}
