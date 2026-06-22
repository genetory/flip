"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarBlank, CaretDown, CaretRight, CheckSquare, CircleNotch, ListChecks, PencilSimple, Plus, Sparkle, Square, Trash } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { ResumeMakerWorkspace } from "./ResumeMakerWorkspace";
import { ResumeSectionNav } from "./ResumeSectionNav";
import { useResumeMakerAutosave } from "./useResumeMakerAutosave";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
import type { ResumeContent } from "../../lib/member-profile-client";
import {
  getBuilderState,
  getDraftResume,
  POLISH_STYLES,
  polishExperienceText,
  polishStyleLabel,
  suggestExperienceTasks,
  suggestExperienceTitle,
  type PolishStyle
} from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { ResumeCompletionConfetti } from "./ResumeCompletionConfetti";
import {
  DEFAULT_DESIGN,
  EXPERIENCE_STATUS_META,
  EXPERIENCE_TYPES,
  experienceTypeLabel,
  type BuilderExperience,
  type ExperienceType,
  type ResumeBuilderState
} from "../../lib/resume-maker-types";
import { trackExperienceCreated } from "../../lib/analytics";

const STATUS_TONE_CLS: Record<string, string> = {
  neutral: "bg-muted text-muted-foreground",
  warn: "bg-amber-100 text-amber-800",
  info: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700"
};

const RAW_PLACEHOLDER = "카페에서 1년 동안 일했고 주문, 음료 제조, 신규 직원 교육을 했어요.";

function periodText(exp: BuilderExperience): string {
  if (!exp.startDate && !exp.endDate) return "";
  return `${exp.startDate ?? "?"} ~ ${exp.endDate || "진행 중"}`;
}

type FormState = { type: ExperienceType; title: string; org: string; startDate: string; endDate: string; rawInput: string; confirmedTasks: string[] };
const EMPTY_FORM: FormState = { type: "career", title: "", org: "", startDate: "", endDate: "", rawInput: "", confirmedTasks: [] };

export function ResumeExperiencesPage({ resumeId }: { resumeId: string }) {
  const router = useRouter();
  const toast = useToast();
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
  const [taskChecked, setTaskChecked] = useState<string[]>([]);
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

  function update(next: ResumeBuilderState) {
    setBuilder(next);
    schedule(next);
  }

  function resetTaskSuggestions() {
    setTaskSuggestions(null);
    setTaskChecked([]);
    setTaskLoading(false);
  }

  // 추가·수정 모두 대화로 통일 — 폼 대신 AI가 한 칸씩 물어본다.
  function openAdd() {
    router.push(`/resume-maker/${resumeId}/chat?section=experiences`);
  }

  function openEdit(exp: BuilderExperience) {
    router.push(`/resume-maker/${resumeId}/chat?section=experiences&expId=${encodeURIComponent(exp.id)}`);
  }

  // ① 한 줄 → 추론 → 체크: 역할 정보만으로 흔한 업무 후보를 받아 체크리스트로 보여준다.
  async function loadTaskSuggestions() {
    if (!form.title.trim() && !form.org.trim() && !form.rawInput.trim()) {
      toast.info("경험명이나 한 일을 한 줄만 적어 주세요. 어떤 일을 했는지 추천해 드릴게요.");
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
      setTaskChecked([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "추천 항목을 만들지 못했어요.");
    } finally {
      setTaskLoading(false);
    }
  }

  function toggleTask(task: string) {
    setTaskChecked((prev) => (prev.includes(task) ? prev.filter((t) => t !== task) : [...prev, task]));
  }

  // 체크한 항목을 한 일(rawInput)에 줄 단위로 더하고 confirmedTasks 에 기록.
  function applyCheckedTasks() {
    if (taskChecked.length === 0) {
      toast.info("추가할 항목을 먼저 체크해 주세요.");
      return;
    }
    setForm((f) => {
      const base = f.rawInput.trim();
      const addition = taskChecked.join("\n");
      return {
        ...f,
        rawInput: base ? `${base}\n${addition}` : addition,
        confirmedTasks: Array.from(new Set([...f.confirmedTasks, ...taskChecked]))
      };
    });
    toast.success(`${taskChecked.length}개 항목을 더했어요.`);
    // 남은 후보는 계속 고를 수 있게 목록에서 적용분만 제거.
    setTaskSuggestions((prev) => (prev ? prev.filter((t) => !taskChecked.includes(t)) : prev));
    setTaskChecked([]);
  }

  // 한 일(내용) AI 다듬기 — 자기소개와 동일하게 형식(style)을 골라 시도.
  async function polishRaw(style: PolishStyle) {
    if (!form.rawInput.trim()) {
      toast.info("먼저 ‘한 일’을 적어 주세요. 내용을 보고 다듬어 드릴게요.");
      return;
    }
    setPolishingStyle(style);
    try {
      const result = await polishExperienceText({ text: form.rawInput.trim(), style, type: form.type });
      setPolishedRaw({ style, text: result });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "내용을 다듬지 못했어요.");
    } finally {
      setPolishingStyle(null);
    }
  }

  // 경험명 AI 추천 — 한 일(내용)을 보고 짧은 제목을 지어 폼에 채운다.
  async function suggestTitle() {
    if (!form.rawInput.trim()) {
      toast.info("먼저 ‘한 일’을 적어 주세요. 내용을 보고 지어드릴게요.");
      return;
    }
    setTitling(true);
    try {
      const t = await suggestExperienceTitle({ rawInput: form.rawInput.trim(), type: form.type });
      if (t) setForm((f) => ({ ...f, title: t }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "경험명을 추천하지 못했어요.");
    } finally {
      setTitling(false);
    }
  }

  async function submitForm() {
    if (!builder || submitting) return;
    if (!form.rawInput.trim()) {
      toast.info("이 경험에서 한 일을 한두 문장으로 적어 주세요.");
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
      nextExperiences = builder.experiences.map((e) =>
        e.id === editingId
          ? {
              ...e,
              type: form.type,
              title,
              org: form.org.trim() || undefined,
              startDate: form.startDate || undefined,
              endDate: form.endDate || undefined,
              rawInput: form.rawInput.trim(),
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
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> 불러오는 중...
          </span>
        </div>
      </ResumeMakerShell>
    );
  }

  const experiences = builder.experiences;
  const readyCount = experiences.filter((e) => e.status === "ready").length;
  const typesPresent = EXPERIENCE_TYPES.filter((t) => experiences.some((e) => e.type === t.value));
  const visibleExperiences = filterType === "all" ? experiences : experiences.filter((e) => e.type === filterType);
  const categoryTabs: { value: ExperienceType | "all"; label: string; count: number }[] = [
    { value: "all", label: "전체", count: experiences.length },
    ...typesPresent.map((t) => ({ value: t.value, label: t.label, count: experiences.filter((e) => e.type === t.value).length }))
  ];
  const design = builder.design ?? DEFAULT_DESIGN;
  const previewContent = compileResumeContent(builder, baseContent);
  const progress = computeResumeProgress(previewContent, builder);

  return (
    <ResumeMakerWorkspace
      title={title}
      right={<AutoSaveIndicator status={status} onRetry={() => void flush()} />}
      content={previewContent}
      design={design}
      previewHref={`/resume-maker/${resumeId}/preview`}
    >
      <div>
        <ResumeCompletionConfetti percent={progress.percent} />
        <ResumeSectionNav
          resumeId={resumeId}
          active="experiences"
          progress={{ percent: progress.percent, level: progress.level }}
          done={progress.done}
        />
        {!formOpen ? (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>경험</h2>
            <p className="mt-2 text-[14px] text-muted-foreground">
              등록된 경험 <span className="font-bold text-foreground">{experiences.length}</span>개 · 이력서 사용 가능{" "}
              <span className="font-bold text-emerald-600">{readyCount}</span>개
            </p>
          </div>
          <Button variant="default" size="sm" className="mt-1 shrink-0" onClick={openAdd}>
            <Plus weight="bold" /> 추가
          </Button>
        </div>
        ) : null}

        {!formOpen ? (
          <Link
            href={`/resume-maker/${resumeId}/chat?section=experiences`}
            className="mb-5 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-[13px] font-semibold text-[#0B46E8] transition hover:bg-primary/10"
          >
            <Sparkle weight="fill" className="h-4 w-4" />
            경험을 AI와 대화하며 채우기
            <CaretRight weight="bold" className="ml-auto h-4 w-4" />
          </Link>
        ) : null}

        {/* 빠른 추가/수정 폼 */}
        {formOpen ? (
          <div className="mt-2">
            <h3 className="text-[15px] font-bold text-[#0B1227]">{editingId ? "경험 수정" : "새 경험 추가"}</h3>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              편하게 적어주세요. AI가 이력서에 필요한 내용을 추가로 질문할게요.
            </p>
            {/* 유형 — 드롭다운 (phosphor 화살표) */}
            <label className="mt-4 block text-[12.5px] font-medium text-foreground/80">
              어떤 경험인가요?
              <div className="relative mt-1">
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ExperienceType }))}
                  className="h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-9 text-[14px] focus:border-primary focus:outline-none"
                >
                  {EXPERIENCE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
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
            <div className="mt-3">
              <span className="text-[12.5px] font-medium text-foreground/80">이 경험에서 한 일</span>
              <textarea
                value={form.rawInput}
                onChange={(e) => setForm((f) => ({ ...f, rawInput: e.target.value }))}
                placeholder={RAW_PLACEHOLDER}
                rows={3}
                maxLength={1000}
                className="mt-1 w-full rounded-xl border border-border bg-white px-3 py-2.5 text-[14px] leading-relaxed focus:border-primary focus:outline-none"
              />

              {/* AI 다듬기 — 메인: 한 문장 적고 다듬어 채택/다시 */}
              <div className="mt-2">
                <p className="mb-1.5 text-[12px] text-muted-foreground">한 문장만 적어도 돼요. AI가 다듬어 드릴게요 — 형식을 골라보세요</p>
                <div className="flex flex-wrap gap-1.5">
                  {POLISH_STYLES.map((s) => {
                    const loading = polishingStyle === s.value;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        disabled={polishingStyle !== null}
                        onClick={() => void polishRaw(s.value)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition disabled:opacity-60 ${
                          loading ? "border-primary bg-primary/10 text-[#0B46E8]" : "border-border bg-card text-foreground/80 hover:border-primary/40"
                        }`}
                      >
                        {loading ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <Sparkle className="h-3.5 w-3.5" weight="bold" />}
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {polishedRaw !== null ? (
                <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                  <p className="text-[12px] font-semibold text-[#0B46E8]">AI가 다듬은 내용 · {polishStyleLabel(polishedRaw.style)}</p>
                  <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">{polishedRaw.text}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        setForm((f) => ({ ...f, rawInput: polishedRaw.text }));
                        setPolishedRaw(null);
                        toast.success("다듬은 내용으로 채택했어요.");
                      }}
                    >
                      이 내용으로 채택
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={polishingStyle !== null}
                      onClick={() => void polishRaw(polishedRaw.style)}
                    >
                      {polishingStyle === polishedRaw.style ? (
                        <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" />
                      ) : (
                        <Sparkle className="h-3.5 w-3.5" weight="bold" />
                      )}
                      다시 다듬기
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setPolishedRaw(null)}>
                      닫기
                    </Button>
                  </div>
                  <p className="mt-2 text-[11.5px] text-muted-foreground">마음에 들 때까지 ‘다시 다듬기’로 다른 버전을 받거나, 위에서 다른 형식도 시도해 보세요.</p>
                </div>
              ) : null}

              {/* ① 추천 칩 — 보조: 뭘 적을지 막막할 때만 */}
              <div className="mt-3">
                <button
                  type="button"
                  disabled={taskLoading}
                  onClick={() => void loadTaskSuggestions()}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground transition hover:text-[#0B46E8] disabled:opacity-60"
                >
                  {taskLoading ? <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" /> : <ListChecks className="h-4 w-4" weight="bold" />}
                  {taskSuggestions ? "다시 추천받기" : "뭘 적을지 막막하면 — AI가 할 일 후보 추천"}
                </button>
                {taskSuggestions && taskSuggestions.length === 0 ? (
                  <p className="mt-2 text-[12.5px] text-muted-foreground">더 추천할 항목이 없어요. 위 칸에 직접 적어도 좋아요.</p>
                ) : taskSuggestions ? (
                  <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                    <p className="text-[12px] font-semibold text-[#0B46E8]">해당되는 것만 체크하세요 — 체크한 내용이 ‘한 일’에 채워져요</p>
                    <div className="mt-2 flex flex-col gap-1">
                      {taskSuggestions.map((task) => {
                        const checked = taskChecked.includes(task);
                        return (
                          <button
                            key={task}
                            type="button"
                            onClick={() => toggleTask(task)}
                            className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] leading-relaxed transition ${
                              checked ? "bg-primary/10 text-foreground" : "text-foreground/80 hover:bg-white"
                            }`}
                          >
                            {checked ? (
                              <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" aria-hidden />
                            ) : (
                              <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" weight="regular" aria-hidden />
                            )}
                            {task}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2.5 flex items-center gap-2">
                      <Button size="sm" className="h-9" disabled={taskChecked.length === 0} onClick={applyCheckedTasks}>
                        선택한 {taskChecked.length > 0 ? `${taskChecked.length}개 ` : ""}항목 추가
                      </Button>
                      <button type="button" onClick={resetTaskSuggestions} className="text-[12px] text-muted-foreground transition hover:text-foreground">
                        닫기
                      </button>
                    </div>
                    <p className="mt-2 text-[11.5px] text-muted-foreground">맞는 게 없으면 닫고 위 ‘한 일’ 칸에 직접 적어도 돼요.</p>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 경험명 — 선택, 한 일 기반 AI 추천 */}
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-foreground/80">
                  경험명 <span className="font-normal text-muted-foreground">(선택)</span>
                </span>
                <button
                  type="button"
                  disabled={titling || !form.rawInput.trim()}
                  onClick={() => void suggestTitle()}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-[#0B46E8] transition hover:underline disabled:opacity-40"
                >
                  {titling ? <CircleNotch className="h-3 w-3 animate-spin" weight="bold" /> : <Sparkle className="h-3 w-3" weight="fill" />}
                  AI 추천
                </button>
              </div>
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="비워두면 ‘한 일’을 보고 AI가 지어줘요"
                maxLength={120}
                className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] focus:border-primary focus:outline-none"
              />
            </div>

            {/* 기간 — 언제 했는지 (중요) */}
            <div className="mt-3">
              <p className="text-[12.5px] font-medium text-foreground/80">
                기간 <span className="font-normal text-muted-foreground">· 언제 했나요?</span>
              </p>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  type="month"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  aria-label="시작 월"
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] focus:border-primary focus:outline-none"
                />
                <input
                  type="month"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  aria-label="종료 월 (진행 중이면 비워두세요)"
                  className="h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] focus:border-primary focus:outline-none"
                />
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">진행 중이면 종료는 비워두세요.</p>
            </div>

            {/* 세부 정보 — 선택, 접이식 (조직) */}
            <button
              type="button"
              onClick={() => setDetailsOpen((v) => !v)}
              className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
            >
              세부 정보 (선택)
              <CaretDown className={`h-3.5 w-3.5 transition ${detailsOpen ? "rotate-180" : ""}`} weight="bold" aria-hidden />
            </button>
            {detailsOpen ? (
              <label className="mt-2 block text-[12.5px] font-medium text-foreground/80">
                조직 또는 프로젝트명
                <input
                  value={form.org}
                  onChange={(e) => setForm((f) => ({ ...f, org: e.target.value }))}
                  placeholder="예: 스타벅스 OO점"
                  maxLength={120}
                  className="mt-1 h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] focus:border-primary focus:outline-none"
                />
              </label>
            ) : null}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>
                취소
              </Button>
              <Button variant="default" size="sm" disabled={submitting} onClick={() => void submitForm()}>
                {submitting ? <CircleNotch className="animate-spin" weight="bold" /> : null}
                {editingId ? "저장" : "추가하고 질문받기"}
              </Button>
            </div>
          </div>
        ) : null}

        {/* 리스트 / 빈 상태 — 폼(추가·수정) 열림 시 숨기고 폼만 노출 */}
        {!formOpen ? (
          experiences.length === 0 ? (
          !formOpen ? (
            <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
              <Sparkle className="mx-auto h-7 w-7 text-[#0B46E8]" weight="fill" aria-hidden />
              <p className="mt-3 text-[15px] font-bold text-[#0B1227]">첫 경험을 추가해 볼까요?</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                아르바이트, 학교 프로젝트, 동아리 등 무엇이든 좋아요.
                <br />
                짧게 적으면 AI가 이어서 질문할게요.
              </p>
              <Button variant="default" size="lg" className="mt-5" onClick={openAdd}>
                <Plus weight="bold" /> 추가
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
                      active ? "border-primary text-[#0B1227]" : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                    <span className={`ml-1 text-[11px] ${active ? "text-[#0B46E8]" : "text-muted-foreground/60"}`}>{tab.count}</span>
                  </button>
                );
              })}
            </div>

            {visibleExperiences.length === 0 ? (
              <p className="mt-8 text-center text-[13.5px] text-muted-foreground">이 카테고리에 경험이 없어요.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {visibleExperiences.map((exp) => {
              const meta = EXPERIENCE_STATUS_META[exp.status];
              return (
                <li key={exp.id}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => openEdit(exp)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openEdit(exp);
                    }}
                    className="group w-full cursor-pointer rounded-xl border border-border bg-card p-3.5 text-left transition hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                            {experienceTypeLabel(exp.type)}
                          </span>
                          <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE_CLS[meta.tone]}`}>{meta.label}</span>
                        </div>
                        <p className="mt-2 truncate text-[15px] font-bold text-[#0B1227]">{exp.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px]">
                          {periodText(exp) ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
                              <CalendarBlank className="h-3.5 w-3.5 text-[#0B46E8]" weight="bold" aria-hidden />
                              {periodText(exp)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                              <CalendarBlank className="h-3.5 w-3.5" weight="bold" aria-hidden />
                              기간 미입력 — 이력서에 포함되지 않아요
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
                              <span key={tag} className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-[#0B46E8]">
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
                          aria-label="경험 수정"
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
                          aria-label="경험 삭제"
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
                          router.push(`/resume-maker/${resumeId}/chat?section=experiences&expId=${exp.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-[13px] font-semibold text-[#0B46E8] transition hover:bg-primary/10"
                      >
                        <Sparkle className="h-4 w-4" weight="fill" aria-hidden />
                        AI와 대화로 채우기
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
              <p className="text-[15px] font-bold text-[#0B1227]">경험을 삭제할까요?</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">이 경험과 작성한 답변·문장이 함께 삭제돼요.</p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteExpId(null)}>
                  취소
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteExp}>
                  삭제
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </ResumeMakerWorkspace>
  );
}
