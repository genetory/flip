"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarBlank, CaretDown, CaretRight, CircleNotch, PencilSimple, Plus, Sparkle, Trash } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { AiChipButton } from "./AiChipButton";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { ResumeMakerWorkspace } from "./ResumeMakerWorkspace";
import { ResumeSectionNav } from "./ResumeSectionNav";
import { useResumeMakerAutosave } from "./useResumeMakerAutosave";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import type { ResumeContent } from "../../lib/member-profile-client";
import {
  getBuilderState,
  getDraftResume,
  POLISH_STYLES,
  polishExperienceText,
  suggestExperienceTasks,
  suggestExperienceTitle,
  type PolishStyle
} from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { ResumeCompletionConfetti } from "./ResumeCompletionConfetti";
import {
  DEFAULT_DESIGN,
  EXPERIENCE_TYPES,
  type ApprovedBullet,
  type BuilderExperience,
  type ExperienceType,
  type ResumeBuilderState
} from "../../lib/resume-maker-types";
import { trackExperienceCreated } from "../../lib/analytics";
import { useExperiencesCopy } from "../../lib/resume-maker-i18n/experiences";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";
import { useExperienceTypeLabel, usePolishStyleLabel } from "../../lib/resume-maker-i18n/labels";

function periodText(exp: BuilderExperience, inProgressLabel: string): string {
  if (!exp.startDate && !exp.endDate) return "";
  return `${exp.startDate ?? "?"} ~ ${exp.endDate || inProgressLabel}`;
}

type FormState = { type: ExperienceType; title: string; org: string; role: string; rank: string; startDate: string; endDate: string; rawInput: string; confirmedTasks: string[] };
const EMPTY_FORM: FormState = { type: "career", title: "", org: "", role: "", rank: "", startDate: "", endDate: "", rawInput: "", confirmedTasks: [] };

// 폼 입력을 이력서 문장(approvedBullets)으로 변환 — 한 줄에 하나.
function draftBulletsFrom(rawInput: string, existing?: ApprovedBullet[]): ApprovedBullet[] | undefined {
  const lines = rawInput.split("\n").map((s) => s.trim()).filter(Boolean);
  if (!lines.length) return existing;
  return lines.map((text, i) => ({ id: existing?.[i]?.id ?? `draft-${i}`, text }));
}

// 미리보기 전용: 폼을 여는 동안 입력 중인 값을 경험 목록에 임시로 반영한다.
// 실제 저장(builder/자동저장)은 건드리지 않으므로 '취소'하면 그대로 사라진다.
function mergeFormDraft(experiences: BuilderExperience[], form: FormState, editingId: string | null, newExperienceFallback: string): BuilderExperience[] {
  const hasBullets = form.rawInput.split("\n").some((s) => s.trim());
  if (editingId) {
    return experiences.map((e) =>
      e.id === editingId
        ? {
            ...e,
            type: form.type,
            title: form.title.trim() || e.title,
            org: form.org.trim() || undefined,
            role: form.role.trim() || undefined,
            rank: form.rank.trim() || undefined,
            startDate: form.startDate || undefined,
            endDate: form.endDate || undefined,
            rawInput: form.rawInput.trim(),
            approvedBullets: draftBulletsFrom(form.rawInput, e.approvedBullets),
            status: hasBullets ? "ready" : e.status
          }
        : e
    );
  }
  // 새 경험 — 아직 적은 게 없으면 미리보기에 넣지 않는다.
  if (!form.rawInput.trim() && !form.title.trim()) return experiences;
  const draft: BuilderExperience = {
    id: "__draft_new__",
    type: form.type,
    title: form.title.trim() || form.rawInput.trim().slice(0, 16) || newExperienceFallback,
    org: form.org.trim() || undefined,
    role: form.role.trim() || undefined,
    rank: form.rank.trim() || undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
    rawInput: form.rawInput.trim(),
    approvedBullets: draftBulletsFrom(form.rawInput),
    status: hasBullets ? "ready" : "collecting",
    createdAt: "",
    updatedAt: ""
  };
  return [...experiences, draft];
}

export function ResumeExperiencesPage({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const toast = useToast();
  const t = useExperiencesCopy();
  const pickerCopy = useToolPickerCopy();
  const expTypeLabel = useExperienceTypeLabel();
  const polishLabel = usePolishStyleLabel();
  const [loading, setLoading] = useState(true);
  const [baseContent, setBaseContent] = useState<ResumeContent>({});
  const [builder, setBuilder] = useState<ResumeBuilderState | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [titling, setTitling] = useState(false);
  const [polishingStyle, setPolishingStyle] = useState<PolishStyle | null>(null);
  const [polishedRaw, setPolishedRaw] = useState<{ style: PolishStyle; text: string } | null>(null);
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskSuggestions, setTaskSuggestions] = useState<string[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [confirmDeleteExpId, setConfirmDeleteExpId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ExperienceType | "all">("all");

  function deleteExp() {
    if (!builder || !confirmDeleteExpId) return;
    update({ ...builder, experiences: builder.experiences.filter((e) => e.id !== confirmDeleteExpId) });
    setConfirmDeleteExpId(null);
  }

  const { status, schedule, flush } = useResumeMakerAutosave(resumeId, baseContent);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
        setBaseContent(resume.content);
        setTitle(resume.title);
        setBuilder(getBuilderState(resume));
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

  function update(next: ResumeBuilderState) {
    setBuilder(next);
    schedule(next);
  }


  // 추가·수정 모두 대화로 통일 — 폼 대신 AI가 한 칸씩 물어본다.
  function openAdd() {
    router.push(`/resume-maker/${resumeId}/chat?section=experiences`);
  }

  // 연필 → 폼으로 직접 수정. 이력서에 나오는 실제 문장(approvedBullets)을 한 줄에 하나씩
  // 보여줘서 그대로 고칠 수 있게 한다. 생성 문장이 없으면 rawInput 을 채운다.
  function openEdit(exp: BuilderExperience) {
    const lines = exp.approvedBullets?.length ? exp.approvedBullets.map((b) => b.text) : [exp.rawInput ?? ""];
    setForm({
      type: exp.type,
      title: exp.title ?? "",
      org: exp.org ?? "",
      role: exp.role ?? "",
      rank: exp.rank ?? "",
      startDate: exp.startDate ?? "",
      endDate: exp.endDate ?? "",
      rawInput: lines.filter(Boolean).join("\n"),
      confirmedTasks: exp.confirmedTasks ?? []
    });
    setEditingId(exp.id);
    setFormOpen(true);
    setPolishedRaw(null);
    setTaskSuggestions(null);
  }

  // 대화로 수정(AI 인터뷰) — 폼이 아닌 채팅으로.
  function openEditChat(exp: BuilderExperience) {
    router.push(`/resume-maker/${resumeId}/chat?section=experiences&expId=${encodeURIComponent(exp.id)}`);
  }

  // ① 한 줄 → 추론 → 체크: 역할 정보만으로 흔한 업무 후보를 받아 체크리스트로 보여준다.
  async function loadTaskSuggestions() {
    if (!form.title.trim() && !form.org.trim() && !form.rawInput.trim()) {
      toast.info(t.taskHintEmpty);
      return;
    }
    setTaskLoading(true);
    try {
      const { tasks } = await suggestExperienceTasks({
        type: form.type,
        title: form.title.trim() || undefined,
        org: form.org.trim() || undefined,
        rawInput: form.rawInput.trim() || undefined
      });
      // 이미 확정/입력된 항목은 빼고 새 후보만.
      const already = new Set([...form.confirmedTasks, ...form.rawInput.split("\n")].map((s) => s.trim()));
      const fresh = tasks.filter((t) => !already.has(t.trim()));
      setTaskSuggestions(fresh.length > 0 ? fresh : tasks);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.taskCreateFailed);
    } finally {
      setTaskLoading(false);
    }
  }

  // 추천 항목을 탭하면 ‘한 일’에 한 줄로 더하고 목록에서 뺀다.
  function addTask(task: string) {
    setForm((f) => {
      const base = f.rawInput.trim();
      return {
        ...f,
        rawInput: base ? `${base}\n${task}` : task,
        confirmedTasks: Array.from(new Set([...f.confirmedTasks, task]))
      };
    });
    setTaskSuggestions((prev) => (prev ? prev.filter((t) => t !== task) : prev));
  }

  // 한 일(내용) AI 다듬기 — 자기소개와 동일하게 형식(style)을 골라 시도.
  async function polishRaw(style: PolishStyle) {
    if (!form.rawInput.trim()) {
      toast.info(t.polishHintEmpty);
      return;
    }
    setPolishingStyle(style);
    try {
      const result = await polishExperienceText({ text: form.rawInput.trim(), style, type: form.type });
      setPolishedRaw({ style, text: result });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.polishFailed);
    } finally {
      setPolishingStyle(null);
    }
  }

  // 경험명 AI 추천 — 한 일(내용)을 보고 짧은 제목을 지어 폼에 채운다.
  async function suggestTitle() {
    if (!form.rawInput.trim()) {
      toast.info(t.titleHintEmpty);
      return;
    }
    setTitling(true);
    try {
      const suggested = await suggestExperienceTitle({ rawInput: form.rawInput.trim(), type: form.type });
      if (suggested) setForm((f) => ({ ...f, title: suggested }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.titleSuggestFailed);
    } finally {
      setTitling(false);
    }
  }

  async function submitForm() {
    if (!builder || submitting) return;
    if (!form.rawInput.trim()) {
      toast.info(t.submitHintEmpty);
      return;
    }
    // 경험명이 비면 한 일을 보고 AI가 지어준다(실패 시 앞부분으로 폴백).
    let title = form.title.trim();
    if (!title) {
      setSubmitting(true);
      try {
        title = await suggestExperienceTitle({ rawInput: form.rawInput.trim(), type: form.type });
      } catch {
        /* 폴백 사용 */
      }
      if (!title) title = form.rawInput.trim().slice(0, 16);
    }
    const now = new Date().toISOString();
    let nextExperiences: BuilderExperience[];
    let createdId: string | null = null;
    if (editingId) {
      // 폼의 "한 일" 텍스트(한 줄에 한 문장)를 이력서 문장(approvedBullets)으로 반영.
      const bulletLines = form.rawInput.split("\n").map((s) => s.trim()).filter(Boolean);
      nextExperiences = builder.experiences.map((e) =>
        e.id === editingId
          ? {
              ...e,
              type: form.type,
              title,
              org: form.org.trim() || undefined,
              role: form.role.trim() || undefined,
              rank: form.rank.trim() || undefined,
              startDate: form.startDate || undefined,
              endDate: form.endDate || undefined,
              rawInput: form.rawInput.trim(),
              approvedBullets: bulletLines.length
                ? bulletLines.map((text, i) => ({ id: e.approvedBullets?.[i]?.id ?? crypto.randomUUID(), text }))
                : e.approvedBullets,
              status: bulletLines.length ? "ready" : e.status,
              confirmedTasks: form.confirmedTasks.length ? form.confirmedTasks : undefined,
              updatedAt: now
            }
          : e
      );
    } else {
      const created: BuilderExperience = {
        id: crypto.randomUUID(),
        type: form.type,
        title,
        org: form.org.trim() || undefined,
        role: form.role.trim() || undefined,
        rank: form.rank.trim() || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        rawInput: form.rawInput.trim(),
        confirmedTasks: form.confirmedTasks.length ? form.confirmedTasks : undefined,
        status: "collecting",
        createdAt: now,
        updatedAt: now
      };
      nextExperiences = [...builder.experiences, created];
      createdId = created.id;
      trackExperienceCreated(form.type);
    }
    update({ ...builder, experiences: nextExperiences });
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSubmitting(false);
    // 새 경험은 곧바로 AI 인터뷰로. 인터뷰 페이지가 저장된 경험을 읽으므로 먼저 flush.
    if (createdId) {
      try {
        await flush();
      } catch {
        /* flush 내부에서 상태 처리 */
      }
      router.push(`/resume-maker/${resumeId}/experiences/${createdId}`);
    }
  }

  if (loading || !builder) {
    return (
      <ResumeMakerShell>
        <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
          <span className="inline-flex items-center gap-2 text-sm">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.loadingText}
          </span>
        </div>
      </ResumeMakerShell>
    );
  }

  const experiences = builder.experiences;
  const typesPresent = EXPERIENCE_TYPES.filter((t) => experiences.some((e) => e.type === t.value));
  const visibleExperiences = filterType === "all" ? experiences : experiences.filter((e) => e.type === filterType);
  const categoryTabs: { value: ExperienceType | "all"; label: string; count: number }[] = [
    { value: "all", label: t.allTab, count: experiences.length },
    ...typesPresent.map((et) => ({ value: et.value, label: expTypeLabel(et.value), count: experiences.filter((e) => e.type === et.value).length }))
  ];
  const design = builder.design ?? DEFAULT_DESIGN;
  // 폼을 여는 동안에는 입력값을 미리보기에 실시간 반영. 단, 저장 전까지 실제 상태는 그대로.
  const previewBuilder: ResumeBuilderState = formOpen
    ? { ...builder, experiences: mergeFormDraft(builder.experiences, form, editingId, t.newExperienceFallback) }
    : builder;
  const previewContent = compileResumeContent(previewBuilder, baseContent);
  const progress = computeResumeProgress(previewContent, builder);

  return (
    <ResumeMakerWorkspace
      right={<AutoSaveIndicator status={status} onRetry={() => void flush()} />}
      back={{ href: "/resume-maker", label: pickerCopy.back, title }}
      content={previewContent}
      design={design}
      previewHref={`/resume-maker/${resumeId}/preview`}
      nav={
        <ResumeSectionNav
          resumeId={resumeId}
          active="experiences"
          progress={{ percent: progress.percent, level: progress.level }}
          done={progress.done}
          orientation="rail"
        />
      }
    >
      <div>
        <ResumeCompletionConfetti percent={progress.percent} />
        {!formOpen ? (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#191F28] md:text-[26px]">{t.heading}</h2>
            <p className="mt-2 text-[14px] text-[#8B95A1]">
              {t.registeredCount(experiences.length)}
            </p>
          </div>
          <Button variant="default" size="sm" className="mt-1 shrink-0" onClick={openAdd}>
            <Plus weight="bold" /> {t.add}
          </Button>
        </div>
        ) : null}

        {!formOpen ? (
          <Link
            href={`/resume-maker/${resumeId}/chat?section=experiences`}
            className="mb-5 flex items-center gap-2.5 rounded-2xl bg-[#EDF1FD] px-4 py-3.5 text-[13.5px] font-bold text-[#0B46E8] transition hover:bg-[#E2EAFC]"
          >
            <Sparkle weight="fill" className="h-4 w-4" />
            {t.fillWithAi}
            <CaretRight weight="bold" className="ml-auto h-4 w-4" />
          </Link>
        ) : null}

        {/* 빠른 추가/수정 폼 */}
        {formOpen ? (
          <div className="mt-2">
            <h3 className="text-[15px] font-bold text-[#0B1227]">{editingId ? t.editHeading : t.newHeading}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {t.formIntro}
            </p>
            {/* 유형 — 드롭다운 (phosphor 화살표) */}
            <label className="mt-6 block text-[12.5px] font-medium text-foreground/80">
              {t.whatExperienceLabel}
              <div className="relative mt-1">
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ExperienceType }))}
                  className="h-11 w-full appearance-none rounded-xl border border-transparent bg-[#F2F4F6] px-3 pr-9 text-[14px] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                >
                  {EXPERIENCE_TYPES.map((et) => (
                    <option key={et.value} value={et.value}>
                      {expTypeLabel(et.value)}
                    </option>
                  ))}
                </select>
                <CaretDown
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  weight="bold"
                  aria-hidden
                />
              </div>
            </label>

            {/* 한 일 — 핵심 입력 + AI 다듬기(형식 선택) */}
            <div className="mt-6">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12.5px] font-medium text-foreground/80">
                  {editingId ? t.resumeSentenceLabel : t.whatDidYouDoLabel}
                </span>
                <AiChipButton loading={taskLoading} onClick={() => void loadTaskSuggestions()} feature="experience_tasks">
                  {taskSuggestions ? t.suggestAgain : t.suggestTasks}
                </AiChipButton>
              </div>
              <textarea
                value={form.rawInput}
                onChange={(e) => setForm((f) => ({ ...f, rawInput: e.target.value }))}
                placeholder={t.rawPlaceholderByType?.[form.type] ?? t.rawPlaceholder}
                rows={3}
                maxLength={1000}
                className="mt-1 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 py-2.5 text-[14px] leading-relaxed focus:border-[#0B46E8] focus:bg-white focus:outline-none"
              />

              {/* AI 다듬기 — 메인: 한 문장 적고 다듬어 채택/다시 */}
              <div className="mt-2">
                <p className="mb-1.5 text-[12px] text-muted-foreground">{t.polishIntro}</p>
                <div className="flex flex-wrap gap-1.5">
                  {POLISH_STYLES.map((s) => (
                    <AiChipButton
                      key={s.value}
                      loading={polishingStyle === s.value}
                      disabled={polishingStyle !== null}
                      onClick={() => void polishRaw(s.value)}
                      feature="polish_experience"
                    >
                      {polishLabel(s.value)}
                    </AiChipButton>
                  ))}
                </div>
              </div>
              {polishedRaw !== null ? (
                <div className="mt-2 rounded-xl border border-[#0B46E8]/30 bg-[#EDF1FD]/60 p-3">
                  <p className="text-[12px] font-semibold text-[#0B46E8]">{t.aiPolishedLabel(polishLabel(polishedRaw.style))}</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">{polishedRaw.text}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setForm((f) => ({ ...f, rawInput: polishedRaw.text }));
                        setPolishedRaw(null);
                        toast.success(t.adoptToast);
                      }}
                    >
                      {t.adoptPolished}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPolishedRaw(null)}>
                      {t.close}
                    </Button>
                  </div>
                  <p className="mt-2 text-[11.5px] text-muted-foreground">{t.tryOtherStyle}</p>
                </div>
              ) : null}

              {/* 추천된 할 일 — 칩을 탭하면 ‘한 일’에 한 줄로 추가 */}
              {taskSuggestions && taskSuggestions.length === 0 ? (
                <p className="mt-2 text-[12px] text-muted-foreground">{t.noMoreSuggestions}</p>
              ) : taskSuggestions && taskSuggestions.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {taskSuggestions.map((task) => (
                    <button
                      key={task}
                      type="button"
                      onClick={() => addTask(task)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#0B46E8]/40 bg-[#EDF1FD]/60 px-3 py-1 text-[12.5px] font-medium text-[#0B46E8] transition hover:bg-[#E2EAFC]"
                    >
                      <Plus className="h-3 w-3" weight="bold" /> {task}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {/* 경험명 — 선택, 한 일 기반 AI 추천 */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-foreground/80">
                  {t.experienceNameLabel} <span className="font-normal text-muted-foreground">{t.optional}</span>
                </span>
                <AiChipButton
                  loading={titling}
                  disabled={titling || !form.rawInput.trim()}
                  onClick={() => void suggestTitle()}
                  feature="experience_title"
                >
                  {t.aiSuggest}
                </AiChipButton>
              </div>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder={t.experienceNamePlaceholder}
                maxLength={120}
                className="mt-1 h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 text-[14px] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
              />
            </div>

            {/* 기간 — 언제 했는지 (중요) */}
            <div className="mt-6">
              <p className="text-[12.5px] font-medium text-foreground/80">
                {t.periodLabel} <span className="font-normal text-muted-foreground">{t.periodWhen}</span>
              </p>
              <div className="mt-1 grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
                <input
                  type="month"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  aria-label={t.startMonthAria}
                  className="h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 text-[14px] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                />
                <input
                  type="month"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  aria-label={t.endMonthAria}
                  className="h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 text-[14px] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">{t.periodHint}</p>
            </div>

            {/* 세부 정보 — 선택, 접이식 (조직) */}
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
            >
              {t.detailsLabel}
              <CaretDown className={`h-3.5 w-3.5 transition ${detailsOpen ? "rotate-180" : ""}`} weight="bold" aria-hidden />
            </button>
            {detailsOpen ? (
              <div className="mt-2 space-y-4">
                <label className="block text-[12.5px] font-medium text-foreground/80">
                  {t.orgLabel}
                  <input
                    value={form.org}
                    onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
                    placeholder={t.orgPlaceholder}
                    maxLength={120}
                    className="mt-1 h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 text-[14px] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                  />
                </label>
                <div className="grid grid-cols-1 gap-x-3 gap-y-4 sm:grid-cols-2">
                  <label className="block text-[12.5px] font-medium text-foreground/80">
                    {t.roleLabel}
                    <input
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      placeholder={t.rolePlaceholder}
                      maxLength={60}
                      className="mt-1 h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 text-[14px] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                    />
                  </label>
                  <label className="block text-[12.5px] font-medium text-foreground/80">
                    {t.rankLabel}
                    <input
                      value={form.rank}
                      onChange={(e) => setForm((f) => ({ ...f, rank: e.target.value }))}
                      placeholder={t.rankPlaceholder}
                      maxLength={40}
                      className="mt-1 h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3 text-[14px] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                    />
                  </label>
                </div>
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // 저장 안 하고 닫기 — 드래프트를 버리고 미리보기를 원래대로 되돌린다.
                  setFormOpen(false);
                  setEditingId(null);
                  setForm(EMPTY_FORM);
                  setPolishedRaw(null);
                  setTaskSuggestions(null);
                }}
              >
                {t.cancel}
              </Button>
              <Button variant="default" size="sm" disabled={submitting} onClick={() => void submitForm()}>
                {submitting ? <CircleNotch className="animate-spin" weight="bold" /> : null}
                {editingId ? t.save : t.addAndGetQuestions}
              </Button>
            </div>
          </div>
        ) : null}

        {/* 리스트 / 빈 상태 — 폼(추가·수정) 열림 시 숨기고 폼만 노출 */}
        {!formOpen ? (
          experiences.length === 0 ? (
          !formOpen ? (
            <div className="mt-10 rounded-2xl bg-[#F2F4F6] px-6 py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1FD]">
                <Sparkle className="h-6 w-6 text-[#0B46E8]" weight="fill" aria-hidden />
              </div>
              <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t.emptyTitle}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#8B95A1]">
                {t.emptyDescLine1}
                <br />
                {t.emptyDescLine2}
              </p>
              <Button variant="default" size="lg" className="mt-5" onClick={openAdd}>
                <Plus weight="bold" /> {t.add}
              </Button>
            </div>
          ) : null
        ) : (
          <>
            {/* 카테고리 탭 (가진 유형만) */}
            <div className="mt-6 flex gap-1 overflow-x-auto border-b border-border/60">
              {categoryTabs.map((tab) => {
                const active = filterType === tab.value;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setFilterType(tab.value)}
                    className={`shrink-0 border-b-2 px-3 py-2 text-[13px] font-semibold transition ${
                      active ? "border-[#0B46E8] text-[#191F28]" : "border-transparent text-[#8B95A1] hover:text-[#191F28]"
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1 text-[11px] ${active ? "text-[#0B46E8]" : "text-muted-foreground/60"}`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            {visibleExperiences.length === 0 ? (
              <p className="mt-8 text-center text-[13.5px] text-muted-foreground">{t.noExperienceInCategory}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {visibleExperiences.map((exp) => {
              return (
                <li key={exp.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openEdit(exp)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openEdit(exp);
                    }}
                    className="group w-full cursor-pointer rounded-2xl border border-[#F2F4F6] bg-white p-4 text-left transition hover:border-[#0B46E8]/30 hover:shadow-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                            {expTypeLabel(exp.type)}
                          </span>
                        </div>
                        <p className="mt-2 truncate text-[15px] font-bold text-[#0B1227]">{exp.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px]">
                          {periodText(exp, t.inProgress) ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
                              <CalendarBlank className="h-3.5 w-3.5 text-[#0B46E8]" weight="bold" aria-hidden />
                              {periodText(exp, t.inProgress)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                              <CalendarBlank className="h-3.5 w-3.5" weight="bold" aria-hidden />
                              {t.periodMissing}
                            </span>
                          )}
                          {exp.org ? <span className="text-muted-foreground">· {exp.org}</span> : null}
                        </div>
                        {exp.rawInput ? (
                          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-foreground/75">{exp.rawInput}</p>
                        ) : null}
                        {exp.roleTags && exp.roleTags.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {exp.roleTags.map((tag) => (
                              <span key={tag} className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-medium text-[#0B46E8]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(exp);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          aria-label={t.editAria}
                        >
                          <PencilSimple className="h-4 w-4" weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteExpId(exp.id);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-destructive/5 hover:text-destructive"
                          aria-label={t.deleteAria}
                        >
                          <Trash className="h-4 w-4" weight="bold" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditChat(exp);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#EDF1FD] px-4 py-2.5 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#E2EAFC]"
                      >
                        <Sparkle className="h-4 w-4" weight="fill" aria-hidden />
                        {t.fillWithAiChat}
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" weight="bold" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
              </ul>
            )}
          </>
          )
        ) : null}

        {/* 경험 삭제 확인 팝업 */}
        {confirmDeleteExpId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => setConfirmDeleteExpId(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
              <p className="text-[15px] font-bold text-[#0B1227]">{t.deleteConfirmTitle}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t.deleteConfirmDesc}</p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteExpId(null)}>
                  {t.cancel}
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteExp}>
                  {t.delete}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ResumeMakerWorkspace>
  );
}
