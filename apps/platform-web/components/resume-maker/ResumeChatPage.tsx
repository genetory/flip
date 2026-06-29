"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CircleNotch, Eye, PaperPlaneRight, X } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { AiTicketCost } from "./AiTicketCost";
import { ResumePreview } from "./ResumePreview";
import { useResumeContentAutosave } from "./useResumeMakerAutosave";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import type { CandidateEducationStatus, CandidateEducationType, ResumeContent, ResumeEducationEntry } from "../../lib/member-profile-client";
import {
  draftSelfIntro,
  generateExperienceBullets,
  generateExperienceInterview,
  getBuilderState,
  getDraftResume,
  polishExperienceText,
  suggestExperienceTasks,
  suggestExperienceTitle,
  type ExperienceContextInput,
  type QaPair
} from "../../lib/resume-maker-client";
import { compileResumeContent } from "../../lib/resume-maker-compile";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { useChatCopy } from "../../lib/resume-maker-i18n/chat";
import { useExperienceTypeLabel } from "../../lib/resume-maker-i18n/labels";
import { useQuickReplies } from "../../lib/resume-maker-i18n/options";
import { ResumeCompletionConfetti } from "./ResumeCompletionConfetti";
import { DEFAULT_DESIGN, EMPTY_BUILDER_STATE, EXPERIENCE_TYPES, type BuilderExperience, type ExperienceType, type InterviewQuestion, type ResumeBuilderState } from "../../lib/resume-maker-types";

// 대화형 작성 — 카테고리(section)별로 그 분야만 대화로 채운다. 폼 대신 AI가
// 한 번에 하나씩 물어보고, 답하면 해당 섹션이 채워진다. 결과는
// content.builder + 표준 필드에 자동저장되어 편집/미리보기와 그대로 이어진다.

type ContentWithBuilder = ResumeContent & { builder: ResumeBuilderState };
type Msg = { id: number; role: "ai" | "user"; text: string };
type ChatSection = "basic" | "intro" | "experiences" | "education" | "awards" | "skills" | "languages" | "links";

let msgSeq = 0;

const SECTION_ROUTE: Record<ChatSection, string> = {
  basic: "basic",
  intro: "intro",
  experiences: "experiences",
  education: "education",
  awards: "awards",
  skills: "skills",
  languages: "languages",
  links: "links"
};

function normalizeSection(s?: string): ChatSection {
  const known: ChatSection[] = ["basic", "intro", "experiences", "education", "awards", "skills", "languages", "links"];
  return (known.includes(s as ChatSection) ? (s as ChatSection) : "experiences");
}

// 외국인 사용자가 자기 언어로 '없음/건너뛰기/그대로'를 적어도 인식되도록 ko·en 외에
// 6개 언어의 흔한 부정·스킵·유지 표현을 함께 매칭한다.
const NEGATIVE = /없어|없음|끝|그만|아니|no\b|none|done|không|tidak|nggak|いいえ|ない|なし|不是|没有|结束|完了|selesai|xong|hết/i;
const SKIP = /없어|없음|패스|건너|skip|bỏ qua|bo qua|lewati|lewatkan|スキップ|なし|跳过|tidak ada|không có|khong co|无/i;
// 수정 단계에서 '그대로/건너뛰기/모름'을 한 번에 처리.
const KEEP = /그대로|건너|없어|없음|패스|모르|유지|skip|keep|giữ nguyên|giu nguyen|biarkan|tetap|そのまま|保持|原样|bỏ qua|lewati|không biết|tidak tahu|わからない|不知道/i;

// 빠른답변 버튼의 표시 라벨은 useQuickReplies(지역화)에서, 매칭용 정규(한국어) 값은
// 아래 맵의 키와 일치한다. (EDU_TYPE_MAP / EDU_STATUS_MAP 키 = 빠른답변 value)
const EDU_TYPE_MAP: Record<string, CandidateEducationType> = {
  고등학교: "HIGH_SCHOOL",
  "대학교(학사)": "BACHELOR",
  전문학사: "ASSOCIATE",
  "대학원(석사)": "MASTER",
  "대학원(박사)": "DOCTOR",
  기타: "OTHER"
};
const EDU_STATUS_MAP: Record<string, CandidateEducationStatus> = {
  "재학 중": "ENROLLED",
  졸업: "GRADUATED",
  휴학: "LEAVE_OF_ABSENCE",
  중퇴: "DROPPED_OUT"
};

export function ResumeChatPage({ resumeId, section, expId }: { resumeId: string; section?: string; expId?: string }) {
  const sec = normalizeSection(section);
  const t = useChatCopy();
  const expTypeLabel = useExperienceTypeLabel();
  const quickReplies = useQuickReplies();
  const toast = useToast();
  const sectionLabel = (s: ChatSection): string => {
    switch (s) {
      case "basic": return t.sectionBasic;
      case "intro": return t.sectionIntro;
      case "experiences": return t.sectionExperiences;
      case "education": return t.sectionEducation;
      case "awards": return t.sectionAwards;
      case "skills": return t.sectionSkills;
      case "languages": return t.sectionLanguages;
      case "links": return t.sectionLinks;
    }
  };
  const basicQ = (phase: string): string => {
    switch (phase) {
      case "b_name": return t.basicQName;
      case "b_phone": return t.basicQPhone;
      case "b_email": return t.basicQEmail;
      case "b_foreigner": return t.basicQForeigner;
      case "b_job": return t.basicQJob;
      default: return "";
    }
  };
  const { status, schedule, flush } = useResumeContentAutosave(resumeId);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<ContentWithBuilder | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [phase, setPhase] = useState<string>("start");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eduIdxRef = useRef<number | null>(null); // 현재 채우는 학력 항목 index
  const enrichExpId = expId && section === "experiences" ? expId : null; // 특정 경험 보강 모드
  // ① 한 줄 → 다듬기 → 채택/다시(메인) + 추천 칩(보조).
  const [taskOptions, setTaskOptions] = useState<string[]>([]);
  const taskExpIdRef = useRef<string | null>(null); // 지금 작성/수정 중인 경험 id
  const taskReturnRef = useRef<"e_more" | "ex_enrich">("e_more"); // 마친 뒤 돌아갈 흐름
  // AI 인터뷰 — 맞춤 질문으로 경험을 끌어내 답변을 모으고, 그 답으로 문장 생성.
  const interviewQs = useRef<InterviewQuestion[]>([]);
  const interviewIdx = useRef(0);
  const interviewQa = useRef<QaPair[]>([]);
  const expModeRef = useRef<"add" | "edit">("add"); // 경험 추가 / 수정 모드
  // 다듬기 초안 — 채택/다시 대기 중인 상태.
  const [polishDraft, setPolishDraft] = useState<
    { expId: string; original: string; polished: string; mode: "replace" | "append" } | null
  >(null);

  const say = (...texts: string[]) =>
    setMessages((m) => [...m, ...texts.map((t) => ({ id: msgSeq++, role: "ai" as const, text: t }))]);
  const meSaid = (text: string) => setMessages((m) => [...m, { id: msgSeq++, role: "user", text }]);

  // 섹션별 첫 질문 + 시작 phase
  function openingFor(s: ChatSection): { lines: string[]; phase: string } {
    switch (s) {
      case "basic":
        return { lines: [t.openBasic], phase: "b_name" };
      case "intro":
        return {
          lines: [t.openIntro],
          phase: "i_offer"
        };
      case "experiences":
        return {
          lines: [t.openExperiences],
          phase: "ex_type"
        };
      case "education":
        return { lines: [t.openEducation], phase: "ed_school" };
      case "awards":
        return { lines: [t.openAwards], phase: "aw_more" };
      case "skills":
        return { lines: [t.openSkills], phase: "sk_list" };
      case "languages":
        return { lines: [t.openLanguages], phase: "lg_more" };
      case "links":
        return { lines: [t.openLinks], phase: "ln_more" };
    }
  }

  // 기본 정보 — 이미 채워진 항목은 다시 묻지 않고 빈 항목만 묻는다.
  const filled = (v?: string | null) => Boolean(v && String(v).trim());
  const BASIC_ORDER = ["b_name", "b_phone", "b_email", "b_foreigner", "b_job"] as const;
  function basicFilled(c: ContentWithBuilder, phase: string): boolean {
    if (phase === "b_name") return filled(c.basicName);
    if (phase === "b_phone") return filled(c.basicPhone);
    if (phase === "b_email") return filled(c.basicEmail);
    if (phase === "b_foreigner") return c.builder.onboarding.isForeigner !== undefined;
    if (phase === "b_job") return filled(c.desiredJobRole);
    return false;
  }
  function askBasicFrom(c: ContentWithBuilder, fromIndex: number) {
    for (let i = Math.max(0, fromIndex); i < BASIC_ORDER.length; i += 1) {
      if (!basicFilled(c, BASIC_ORDER[i])) {
        say(basicQ(BASIC_ORDER[i]));
        setPhase(BASIC_ORDER[i]);
        return;
      }
    }
    finish();
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
        setTitle(resume.title);
        const builder = getBuilderState(resume);
        const base = (resume.content ?? {}) as ResumeContent;
        const c = { ...base, builder: builder ?? { ...EMPTY_BUILDER_STATE } };
        setContent(c);
        if (enrichExpId) {
          // 수정 모드 — 이력서 순서(유형 → 회사 → 경험명 → 기간 → 한 일)로 차례대로 묻는다.
          const exp = (c.builder.experiences ?? []).find((e) => e.id === enrichExpId);
          expModeRef.current = "edit";
          taskExpIdRef.current = enrichExpId;
          setMessages([
            { id: msgSeq++, role: "ai", text: t.enrichGreeting(exp?.title || t.sectionExperiences) },
            { id: msgSeq++, role: "ai", text: t.enrichTypeIntro }
          ]);
          setPhase("ex_type");
        } else if (sec === "basic") {
          // 이미 채워진 기본 정보는 건너뛰고, 비어 있는 첫 항목부터 묻는다.
          const greeting: Msg = { id: msgSeq++, role: "ai", text: t.basicGreeting };
          let idx = 0;
          for (; idx < BASIC_ORDER.length; idx += 1) if (!basicFilled(c, BASIC_ORDER[idx])) break;
          if (idx < BASIC_ORDER.length) {
            setMessages([greeting, { id: msgSeq++, role: "ai", text: basicQ(BASIC_ORDER[idx]) }]);
            setPhase(BASIC_ORDER[idx]);
          } else {
            setMessages([greeting, { id: msgSeq++, role: "ai", text: t.basicAllFilled }]);
            setPhase("done");
          }
        } else {
          if (sec === "experiences") expModeRef.current = "add";
          const open = openingFor(sec);
          setMessages([
            { id: msgSeq++, role: "ai", text: t.sectionGreeting(sectionLabel(sec)) },
            ...open.lines.map((line) => ({ id: msgSeq++, role: "ai" as const, text: line }))
          ]);
          setPhase(open.phase);
        }
      } catch {
        toast.error(t.loadFailed);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId, sec]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const apply = (updater: (c: ContentWithBuilder) => ContentWithBuilder) => {
    setContent((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      schedule(next);
      return next;
    });
  };

  const finish = () => {
    setPhase("done");
    say(t.sectionFinished(sectionLabel(sec)));
    void flush();
  };

  function startEducation(school: string) {
    const idx = (content?.educations ?? []).length;
    eduIdxRef.current = idx;
    apply((c) => ({ ...c, educations: [...(c.educations ?? []), { schoolName: school.trim(), status: "GRADUATED" }] }));
  }
  function patchEdu(patch: Partial<ResumeEducationEntry>) {
    const idx = eduIdxRef.current;
    if (idx == null) return;
    apply((c) => ({ ...c, educations: (c.educations ?? []).map((e, i) => (i === idx ? { ...e, ...patch } : e)) }));
  }

  // ① 체크한 업무를 해당 경험의 rawInput·confirmedTasks 에 더한다.
  function addTaskToExperience(expId: string, task: string) {
    const now = new Date().toISOString();
    apply((c) => ({
      ...c,
      builder: {
        ...c.builder,
        experiences: (c.builder.experiences ?? []).map((e) =>
          e.id === expId
            ? {
                ...e,
                rawInput: [e.rawInput, task].filter(Boolean).join("\n"),
                confirmedTasks: Array.from(new Set([...(e.confirmedTasks ?? []), task])),
                updatedAt: now
              }
            : e
        )
      }
    }));
  }

  function mutateExp(expId: string, fn: (e: BuilderExperience) => BuilderExperience) {
    const now = new Date().toISOString();
    apply((c) => ({
      ...c,
      builder: {
        ...c.builder,
        experiences: (c.builder.experiences ?? []).map((e) => (e.id === expId ? { ...fn(e), updatedAt: now } : e))
      }
    }));
  }

  function currentExp(): BuilderExperience | undefined {
    const id = taskExpIdRef.current;
    return (content?.builder.experiences ?? []).find((e) => e.id === id);
  }

  // 경험 질문 순서 = 이력서에 나오는 순서: 유형(칩) → 회사·단체 → 경험명 → 기간 → 한 일.
  function askTypeLoop() {
    say(t.expAddedAskMore);
    setPhase("ex_type");
  }

  function createNewExp(type: ExperienceType) {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    apply((c) => ({
      ...c,
      builder: {
        ...c.builder,
        experiences: [
          ...(c.builder.experiences ?? []),
          { id, type, title: "", rawInput: "", status: "collecting" as const, createdAt: now, updatedAt: now }
        ]
      }
    }));
    taskExpIdRef.current = id;
  }

  // value 기반 — 표시 라벨은 지역화되므로 한국어 라벨로 매칭하지 않는다.
  // 유형 칩은 value 를 함께 넘기고, '그만/그대로' 같은 컨트롤 칩은 value 없이 넘긴다.
  function pickType(label: string, value?: ExperienceType) {
    meSaid(label);
    if (expModeRef.current === "add") {
      if (value === undefined) {
        finish();
        return;
      }
      createNewExp(value);
    } else {
      const id = taskExpIdRef.current;
      if (value !== undefined && id) {
        mutateExp(id, (e) => ({ ...e, type: value }));
      }
    }
    askOrg();
  }

  function askOrg() {
    const exp = currentExp();
    const cur = exp?.org ?? "";
    say(cur ? t.askOrgKeep(cur) : t.askOrgNew);
    setPhase("ex_org");
  }
  function askTitle() {
    const exp = currentExp();
    const cur = exp?.title ?? "";
    say(cur ? t.askTitleKeep(cur) : t.askTitleNew);
    setPhase("ex_title");
  }
  function askPeriod() {
    const exp = currentExp();
    const cur = exp?.startDate ? `${exp.startDate} ~ ${exp.endDate || t.periodOngoing}` : "";
    say(cur ? t.askPeriodKeep(cur) : t.askPeriodNew);
    setPhase("ex_period");
  }
  function askContent() {
    const exp = currentExp();
    if (expModeRef.current === "edit" && (exp?.rawInput ?? "").trim()) {
      say(t.askContentEdit(exp?.rawInput ?? ""));
      setPhase("ex_content");
    } else {
      say(t.askContentNew);
      setPhase("ex_content_input");
    }
  }

  // ── AI 인터뷰: 맞춤 질문으로 그때 한 일을 끌어내고, 답변으로 이력서 문장 생성 ──
  function expContext(exp: BuilderExperience): ExperienceContextInput {
    return {
      type: exp.type,
      title: exp.title || exp.org || t.sectionExperiences,
      org: exp.org,
      period: exp.startDate ? `${exp.startDate} ~ ${exp.endDate || t.periodOngoing}` : undefined,
      rawInput: exp.rawInput
    };
  }
  function askInterviewQ() {
    const q = interviewQs.current[interviewIdx.current];
    if (!q) {
      void finishInterview();
      return;
    }
    say(`${q.prompt}${q.optional ? t.interviewOptionalSuffix : ""}${q.helper ? `\n${q.helper}` : ""}`);
    setPhase("ex_interview");
  }
  async function startInterview() {
    const exp = currentExp();
    if (!exp) {
      askTypeLoop();
      return;
    }
    setBusy(true);
    say(t.interviewIntro);
    try {
      const { coachNote, questions } = await generateExperienceInterview({
        experience: expContext(exp),
        jobCategories: content?.builder.onboarding.jobCategories
      });
      interviewQs.current = questions;
      interviewIdx.current = 0;
      interviewQa.current = [];
      if (coachNote) say(coachNote);
      askInterviewQ();
    } catch {
      say(t.interviewFallback);
      setPhase("ex_content_input");
    } finally {
      setBusy(false);
    }
  }
  async function finishInterview() {
    const exp = currentExp();
    if (!exp || interviewQa.current.length === 0) {
      say(t.finishInterviewNoAnswer);
      setPhase("ex_content_input");
      return;
    }
    setBusy(true);
    say(t.generatingBullets);
    try {
      const gen = await generateExperienceBullets({
        experience: expContext(exp),
        jobCategories: content?.builder.onboarding.jobCategories,
        qa: interviewQa.current
      });
      const bullets = (gen.resumeBullets ?? []).map((b) => ({ id: crypto.randomUUID(), text: b.text }));
      const answersText = interviewQa.current.map((q) => q.answer).join("\n");
      mutateExp(exp.id, (e) => ({
        ...e,
        rawInput: [e.rawInput, answersText].filter(Boolean).join("\n"),
        approvedBullets: bullets.length ? bullets : e.approvedBullets,
        approvedSkills: gen.skills?.length ? Array.from(new Set([...(e.approvedSkills ?? []), ...gen.skills])) : e.approvedSkills,
        status: bullets.length ? "ready" : e.status
      }));
      if (gen.skills?.length) {
        apply((c) => {
          const merged = [...(c.skills ?? [])];
          for (const s of gen.skills) if (s && !merged.some((x) => x.toLowerCase() === s.toLowerCase())) merged.push(s);
          return { ...c, skills: merged };
        });
      }
      if (bullets.length) say(t.bulletsHeader, ...bullets.map((b) => `• ${b.text}`));
      else say(t.bulletsNoneSaved);
    } catch {
      say(t.bulletsGenFailed);
      mutateExp(exp.id, (e) => ({ ...e, rawInput: [e.rawInput, interviewQa.current.map((q) => q.answer).join("\n")].filter(Boolean).join("\n") }));
    } finally {
      setBusy(false);
      finish();
    }
  }

  // 한 일까지 마친 뒤 — 제목이 비었으면 내용 기반으로 채우고, 추가는 반복/수정은 종료.
  async function finishExperienceContent() {
    const exp = currentExp();
    if (exp && !exp.title.trim() && (exp.rawInput ?? "").trim()) {
      try {
        const t = await suggestExperienceTitle({ rawInput: exp.rawInput ?? "", type: exp.type });
        mutateExp(exp.id, (e) => ({ ...e, title: t || (e.rawInput ?? "").slice(0, 16) }));
      } catch {
        mutateExp(exp.id, (e) => ({ ...e, title: (e.rawInput ?? "").slice(0, 16) }));
      }
    }
    if (expModeRef.current === "edit") {
      finishEditExp();
    } else {
      finish();
    }
  }

  function finishEditExp() {
    setPhase("done");
    say(t.editExpDone);
    void flush();
  }

  // 완료 화면에서 생성된 문장을 바로 고친다(자동저장).
  function editBullet(bulletId: string, text: string) {
    const exp = currentExp();
    if (!exp) return;
    mutateExp(exp.id, (e) => ({
      ...e,
      approvedBullets: (e.approvedBullets ?? []).map((b) => (b.id === bulletId ? { ...b, text } : b))
    }));
  }

  function parsePeriod(text: string): { startDate?: string; endDate?: string } {
    const ongoing = /진행|현재|지금|now|present|current|ongoing|hiện tại|hien tai|đang|dang|sekarang|masih|現在|継続|现在|至今/i.test(text);
    const tokens = (text.match(/\d{4}(?:[-./]\d{1,2})?/g) ?? []).map((s) => s.replace(/[./]/g, "-"));
    return { startDate: tokens[0], endDate: ongoing ? "" : tokens[1] };
  }

  // ① 메인: 한 문장을 AI가 다듬어 보여주고 채택/다시를 기다린다.
  async function offerPolish(expId: string, original: string, mode: "replace" | "append", ret: "e_more" | "ex_enrich") {
    taskExpIdRef.current = expId;
    taskReturnRef.current = ret;
    setBusy(true);
    try {
      const polished = await polishExperienceText({ text: original, style: "natural", type: "etc" });
      setPolishDraft({ expId, original, polished, mode });
      say(t.polishHeader, polished);
      setPhase("ex_polish");
    } catch {
      // 다듬기 실패 — 원문을 반영하고 계속.
      if (mode === "append") mutateExp(expId, (e) => ({ ...e, rawInput: [e.rawInput, original].filter(Boolean).join("\n") }));
      void finishExperienceContent();
    } finally {
      setBusy(false);
    }
  }

  function acceptPolish() {
    if (!polishDraft) return;
    const { expId, polished, mode } = polishDraft;
    if (mode === "replace") mutateExp(expId, (e) => ({ ...e, rawInput: polished }));
    else mutateExp(expId, (e) => ({ ...e, rawInput: [e.rawInput, polished].filter(Boolean).join("\n") }));
    meSaid(t.acceptPolishSaid);
    setPolishDraft(null);
    void finishExperienceContent();
  }

  function keepOriginal() {
    if (!polishDraft) return;
    const { expId, original, mode } = polishDraft;
    // replace 모드는 원문이 이미 rawInput 에 있음. append 모드는 원문을 더한다.
    if (mode === "append") mutateExp(expId, (e) => ({ ...e, rawInput: [e.rawInput, original].filter(Boolean).join("\n") }));
    meSaid(t.keepOriginalSaid);
    setPolishDraft(null);
    void finishExperienceContent();
  }

  // 보조: 다듬기가 막막할 때 추천 칩으로 전환.
  function offerTasksFromPolish() {
    const d = polishDraft;
    setPolishDraft(null);
    if (!d) return;
    void offerTasks(d.expId, { type: "etc", rawInput: d.original }, taskReturnRef.current);
  }

  // 수정 모드 — 현재 내용을 한 번 더 다듬기.
  function startEditContentPolish() {
    const exp = currentExp();
    if (!exp) {
      void finishExperienceContent();
      return;
    }
    if (!(exp.rawInput ?? "").trim()) {
      say(t.needContentFirst);
      setPhase("ex_content_input");
      return;
    }
    void offerPolish(exp.id, exp.rawInput ?? "", "replace", "e_more");
  }

  // 역할 정보로 업무 후보를 받아 말풍선으로 띄운다(ex_tasks). 막막할 때 보조 경로.
  async function offerTasks(
    expId: string,
    hints: { type?: string; title?: string; org?: string; rawInput?: string },
    ret: "e_more" | "ex_enrich"
  ) {
    taskExpIdRef.current = expId;
    taskReturnRef.current = ret;
    setBusy(true);
    try {
      const { tasks } = await suggestExperienceTasks(hints);
      setTaskOptions(tasks);
      say(t.tasksHeader);
      setPhase("ex_tasks");
    } catch {
      if (ret === "e_more") {
        say(t.tasksFallbackMore);
        setPhase("e_more");
      } else {
        say(t.tasksFallbackEnrich);
        setPhase("ex_enrich");
      }
    } finally {
      setBusy(false);
    }
  }

  function pickTask(task: string) {
    const expId = taskExpIdRef.current;
    if (!expId) return;
    meSaid(task);
    addTaskToExperience(expId, task);
    const remaining = taskOptions.filter((t) => t !== task);
    setTaskOptions(remaining);
    if (remaining.length === 0) doneTasks();
  }

  function doneTasks() {
    setTaskOptions([]);
    void finishExperienceContent();
  }

  // 후보에 맞는 게 없을 때 — 직접 적는 입력으로 전환(현재 경험에 그대로 반영).
  function typeTasksInstead() {
    setTaskOptions([]);
    say(t.typeTasksInstead);
    setPhase("ex_content_input");
  }

  // answer = 화면에 echo 할 표시 텍스트(지역화). matchValue = 로직 매칭용 정규(한국어)
  // 값 — 빠른답변 칩에서만 넘어오고, 자유 입력에서는 text 를 그대로 매칭에 쓴다.
  async function handle(answer: string, matchValue?: string) {
    const text = answer.trim();
    if (!text || busy || !content) return;
    meSaid(text);
    setInput("");
    const key = (matchValue ?? text).trim();

    switch (phase) {
      // ── 기본 정보 ──
      case "b_name": {
        const nc = { ...content, basicName: text };
        apply((c) => ({ ...c, basicName: text }));
        say(t.niceToMeet(text));
        askBasicFrom(nc, 1);
        return;
      }
      case "b_phone": {
        const skip = SKIP.test(text);
        const nc = skip ? content : { ...content, basicPhone: text };
        if (!skip) apply((c) => ({ ...c, basicPhone: text }));
        askBasicFrom(nc, 2);
        return;
      }
      case "b_email": {
        const skip = SKIP.test(text);
        const nc = skip ? content : { ...content, basicEmail: text };
        if (!skip) apply((c) => ({ ...c, basicEmail: text }));
        askBasicFrom(nc, 3);
        return;
      }
      case "b_foreigner": {
        const isForeigner = /외국인|네|응|예|yes|y/i.test(key) && !/아니|no/i.test(key);
        const nc = { ...content, builder: { ...content.builder, onboarding: { ...content.builder.onboarding, isForeigner } } };
        apply((c) => ({ ...c, builder: { ...c.builder, onboarding: { ...c.builder.onboarding, isForeigner } } }));
        say(isForeigner ? t.foreignerYes : t.foreignerNo);
        askBasicFrom(nc, 4);
        return;
      }
      case "b_job":
        if (!/몰라|모르|아직|don'?t know|not sure|undecided|chưa|chua|belum|まだ|未定|还不|不确定/i.test(text))
          apply((c) => ({ ...c, desiredJobRole: text, builder: { ...c.builder, onboarding: { ...c.builder.onboarding, jobCategories: [text] } } }));
        finish();
        return;

      // ── 경험: 이력서 순서 — 유형(칩) → 회사·단체 → 경험명 → 기간 → 한 일 ──
      case "ex_org": {
        const id = taskExpIdRef.current;
        if (id && !KEEP.test(text)) mutateExp(id, (e) => ({ ...e, org: text.trim() }));
        askTitle();
        return;
      }
      case "ex_title": {
        const id = taskExpIdRef.current;
        if (id && !KEEP.test(text)) mutateExp(id, (e) => ({ ...e, title: text.trim() }));
        askPeriod();
        return;
      }
      case "ex_period": {
        const id = taskExpIdRef.current;
        if (id && !KEEP.test(text)) {
          const { startDate, endDate } = parsePeriod(text);
          mutateExp(id, (e) => ({ ...e, startDate, endDate }));
        }
        // 추가 모드: AI 인터뷰로 한 일을 끌어냄 / 수정 모드: 기존 한 일 다듬기
        if (expModeRef.current === "add") void startInterview();
        else askContent();
        return;
      }
      // AI 인터뷰 답변 — 질문마다 답을 모았다가 끝나면 문장 생성.
      case "ex_interview": {
        const q = interviewQs.current[interviewIdx.current];
        if (q) {
          const skip = q.optional && KEEP.test(text);
          if (!skip) interviewQa.current.push({ question: q.prompt, answer: text });
        }
        interviewIdx.current += 1;
        askInterviewQ();
        return;
      }
      case "ex_content_input": {
        const id = taskExpIdRef.current;
        if (!id) {
          finish();
          return;
        }
        mutateExp(id, (e) => ({ ...e, rawInput: text }));
        await offerPolish(id, text, "replace", "e_more");
        return;
      }

      // ── 학력 (구분 → 전공 → 상태 → 입학 → 졸업) ──
      case "ed_school":
        startEducation(text);
        say(t.edAskType);
        setPhase("ed_type");
        return;
      case "ed_type": {
        const eduType = EDU_TYPE_MAP[key] ?? "OTHER";
        patchEdu({ educationType: eduType });
        if (eduType === "HIGH_SCHOOL") {
          say(t.edAskStatus);
          setPhase("ed_status");
        } else {
          say(t.edAskMajor);
          setPhase("ed_major");
        }
        return;
      }
      case "ed_major":
        if (!SKIP.test(text)) patchEdu({ major: text.trim() });
        say(t.edAskStatus);
        setPhase("ed_status");
        return;
      case "ed_status": {
        const st = EDU_STATUS_MAP[key] ?? "GRADUATED";
        patchEdu({ status: st, ...(st === "ENROLLED" || st === "LEAVE_OF_ABSENCE" ? { endDate: "" } : {}) });
        say(t.edAskStart);
        setPhase("ed_start");
        return;
      }
      case "ed_start": {
        if (!SKIP.test(text)) patchEdu({ startDate: text.trim() });
        const cur = (content.educations ?? [])[eduIdxRef.current ?? -1];
        const enrolled = cur?.status === "ENROLLED" || cur?.status === "LEAVE_OF_ABSENCE";
        if (enrolled) {
          say(t.edAddedAskMore);
          setPhase("ed_more");
        } else {
          say(t.edAskEnd);
          setPhase("ed_end");
        }
        return;
      }
      case "ed_end":
        if (!SKIP.test(text)) patchEdu({ endDate: text.trim() });
        say(t.edAddedAskMore);
        setPhase("ed_more");
        return;
      case "ed_more":
        if (NEGATIVE.test(text)) {
          finish();
          return;
        }
        startEducation(text);
        say(t.edAskType);
        setPhase("ed_type");
        return;

      // ── 자격 · 수상 ──
      case "aw_more":
        if (NEGATIVE.test(text)) {
          finish();
          return;
        }
        apply((c) => ({ ...c, certifications: [...(c.certifications ?? []), { name: text.trim() }] }));
        say(t.awAddedAskMore);
        return;

      // ── 스킬 ──
      case "sk_list": {
        const parts = text
          .split(/[,，·\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length === 0) {
          finish();
          return;
        }
        apply((c) => {
          const existing = c.skills ?? [];
          const merged = [...existing];
          for (const p of parts) if (!merged.some((s) => s.toLowerCase() === p.toLowerCase())) merged.push(p);
          return { ...c, skills: merged };
        });
        say(t.skAdded(parts.length));
        finish();
        return;
      }

      // ── 어학 ──
      case "lg_more": {
        if (NEGATIVE.test(text)) {
          finish();
          return;
        }
        const m = text.split(/\s*[-–:]\s*/);
        const language = (m[0] ?? text).trim();
        const level = m[1]?.trim();
        apply((c) => ({ ...c, languages: [...(c.languages ?? []), { language, ...(level ? { level } : {}) }] }));
        say(t.lgAddedAskMore);
        return;
      }

      // ── 링크 ──
      case "ln_more": {
        if (NEGATIVE.test(text)) {
          finish();
          return;
        }
        const urlMatch = text.match(/https?:\/\/\S+/i);
        const url = urlMatch ? urlMatch[0] : text.trim();
        const label = urlMatch ? text.replace(urlMatch[0], "").trim() : "";
        apply((c) => ({ ...c, links: [...(c.links ?? []), { ...(label ? { label } : {}), url }] }));
        say(t.lnAddedAskMore);
        return;
      }

      // ── 자기소개(직접 입력 분기) ──
      case "i_text":
        apply((c) => ({ ...c, selfIntroduction: text }));
        finish();
        return;
    }
  }

  async function offerIntro(yes: boolean) {
    if (!content) return;
    if (!yes) {
      meSaid(t.introWriteSelfSaid);
      say(t.introWriteSelf);
      setPhase("i_text");
      return;
    }
    meSaid(t.introYesSaid);
    setBusy(true);
    say(t.introGenerating);
    try {
      const exps = (content.builder.experiences ?? []).map((e) => ({
        type: e.type,
        title: e.title,
        summary: e.rawInput,
        bullets: (e.approvedBullets ?? []).map((b) => b.text)
      }));
      const draft = await draftSelfIntro({
        desiredJobRole: content.desiredJobRole ?? undefined,
        jobCategories: content.builder.onboarding.jobCategories,
        experiences: exps
      });
      apply((c) => ({ ...c, selfIntroduction: draft }));
      say(t.introHeader, draft);
    } catch (e) {
      say(e instanceof Error ? e.message : t.introGenFailed);
    } finally {
      setBusy(false);
      finish();
    }
  }

  const progress = content ? computeResumeProgress(content, content.builder) : null;
  // 선택지가 있으면 대화창 안에 말풍선으로 띄운다.
  // 경험 작성 중 종류를 잘못 골랐을 때 — 방금 만든 경험을 지우고 종류 선택으로 복귀.
  function repickType() {
    const id = taskExpIdRef.current;
    if (id) {
      apply((c) => ({ ...c, builder: { ...c.builder, experiences: (c.builder.experiences ?? []).filter((e) => e.id !== id) } }));
      taskExpIdRef.current = null;
    }
    setInput("");
    say(t.repickPrompt);
    setPhase("ex_type");
  }

  const options: { label: string; onClick: () => void; kind?: "control"; feature?: string }[] =
    phase === "i_offer"
      ? [
          { label: t.optIntroYes, onClick: () => void offerIntro(true), feature: "draft_intro" },
          { label: t.optIntroSelf, onClick: () => void offerIntro(false), kind: "control" }
        ]
      : phase === "ex_content"
        ? [
            { label: t.optPolishMore, onClick: () => startEditContentPolish(), feature: "polish_experience" },
            { label: t.optKeepAsIs, onClick: () => void finishExperienceContent(), kind: "control" }
          ]
        : phase === "ex_type"
          ? expModeRef.current === "edit"
            ? [
                ...EXPERIENCE_TYPES.map((et) => ({ label: expTypeLabel(et.value), onClick: () => pickType(expTypeLabel(et.value), et.value) })),
                { label: t.optKeepAsIs, onClick: () => pickType(t.optKeepAsIs), kind: "control" as const }
              ]
            : [
                ...EXPERIENCE_TYPES.map((et) => ({ label: expTypeLabel(et.value), onClick: () => pickType(expTypeLabel(et.value), et.value) })),
                { label: t.optStop, onClick: () => pickType(t.optStop), kind: "control" as const }
              ]
          : phase === "ex_polish"
        ? [
            { label: t.optAcceptPolish, onClick: () => acceptPolish() },
            { label: t.optKeepOriginal, onClick: () => keepOriginal(), kind: "control" },
            { label: t.optGetSuggestions, onClick: () => void offerTasksFromPolish(), kind: "control", feature: "experience_tasks" }
          ]
        : phase === "ex_tasks"
          ? [
              ...taskOptions.map((task) => ({ label: t.optTaskPrefix(task), onClick: () => pickTask(task) })),
              { label: t.optDonePicking, onClick: () => doneTasks(), kind: "control" as const },
              { label: t.optNoneTypeMyself, onClick: () => typeTasksInstead(), kind: "control" as const }
            ]
          : quickReplies[phase]
            ? quickReplies[phase].map((r) => ({ label: r.label, onClick: () => void handle(r.label, r.value) }))
            : [];
  const showInput = !loading && phase !== "done" && options.length === 0 && !busy;
  // 경험을 새로 만드는 중(종류 선택 후 회사·이름·기간·한 일 단계)이면 종류 다시 고르기 노출.
  const canRepickType = expModeRef.current === "add" && ["ex_org", "ex_title", "ex_period", "ex_content_input"].includes(phase);

  const previewContent = content ? compileResumeContent(content.builder, content) : null;
  const previewDesign = content?.builder.design ?? DEFAULT_DESIGN;
  const backHref = sec === "experiences" ? `/resume-maker/${resumeId}/experiences` : `/resume-maker/${resumeId}/edit?section=${SECTION_ROUTE[sec]}`;

  return (
    <ResumeMakerShell right={<AutoSaveIndicator status={status} onRetry={() => void flush()} />}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 lg:h-[calc(100vh-56px)] lg:grid-cols-[minmax(0,42%)_minmax(0,58%)]">
        {/* 좌측: 채팅 */}
        <div className="flex h-[calc(100vh-56px)] min-h-0 min-w-0 flex-col border-r border-border/60 lg:h-auto">
          {/* 상단: 폼으로 돌아가기 */}
          <div className="flex h-14 items-center justify-between gap-2 border-b border-border/60 px-4">
            <Link href={backHref} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted-foreground transition hover:text-foreground">
              <ArrowLeft className="h-4 w-4" weight="bold" /> {t.back}
            </Link>
            <span className="truncate text-[14px] font-bold text-[#191F28]">{t.aiChatHeader(sectionLabel(sec))}</span>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="inline-flex shrink-0 items-center gap-1 text-[13px] font-semibold text-[#0B46E8] lg:hidden"
            >
              <Eye className="h-4 w-4" weight="bold" /> {t.preview}
            </button>
            <span className="hidden w-12 shrink-0 lg:block" />
          </div>
          {progress ? <ResumeCompletionConfetti percent={progress.percent} /> : null}

          <div ref={scrollRef} className="mx-auto w-full max-w-2xl flex-1 space-y-3 overflow-y-auto px-5 py-5">
            {loading ? (
              <div className="flex justify-center pt-10 text-muted-foreground">
                <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
              </div>
            ) : null}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                    m.role === "user" ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#191F28]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy ? (
              <div className="flex justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-[#F2F4F6] px-4 py-2.5 text-[13px] text-[#8B95A1]">
                  <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" aria-hidden /> {t.writing}
                </div>
              </div>
            ) : null}

            {/* 선택지 — 파란 칩(선택) vs 회색 칩(그만/건너뛰기 등 제어) 구분 */}
            {!busy && !loading && options.length > 0 ? (
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {options.map((o) =>
                  o.kind === "control" ? (
                    <button
                      key={o.label}
                      type="button"
                      onClick={o.onClick}
                      className="inline-flex items-center rounded-full bg-[#F2F4F6] px-3.5 py-2 text-[13px] font-semibold text-[#4E5968] transition hover:bg-[#E8EBF0] active:scale-[0.98]"
                    >
                      {o.label}
                      {o.feature ? <AiTicketCost feature={o.feature} tone="muted" /> : null}
                    </button>
                  ) : (
                    <button
                      key={o.label}
                      type="button"
                      onClick={o.onClick}
                      className="inline-flex items-center rounded-full bg-[#EDF1FD] px-3.5 py-2 text-[13.5px] font-semibold text-[#0B46E8] transition hover:bg-[#E2EAFC] active:scale-[0.98]"
                    >
                      {o.label}
                      {o.feature ? <AiTicketCost feature={o.feature} tone="muted" /> : null}
                    </button>
                  )
                )}
              </div>
            ) : null}
          </div>

          {phase === "done" || showInput ? (
            <div className="mx-auto w-full max-w-2xl border-t border-border/60 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-5">
              {phase === "done" ? (
                <div className="space-y-3">
                  {sec === "experiences" && (currentExp()?.approvedBullets?.length ?? 0) > 0 ? (
                    <div>
                      <p className="mb-1.5 text-[12.5px] font-semibold text-[#191F28]">{t.generatedBulletsHint}</p>
                      <div className="space-y-2">
                        {(currentExp()?.approvedBullets ?? []).map((b) => (
                          <textarea
                            key={b.id}
                            value={b.text}
                            onChange={(e) => editBullet(b.id, e.target.value)}
                            rows={2}
                            className="w-full resize-none rounded-xl border border-transparent bg-[#F2F4F6] px-3 py-2 text-[13.5px] leading-relaxed text-[#191F28] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="default" size="lg">
                      <Link href={backHref}>
                        {sec === "experiences" ? t.expDoneButton : t.doneButton} <ArrowRight weight="bold" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {canRepickType ? (
                    <button
                      type="button"
                      onClick={repickType}
                      className="mb-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-muted-foreground transition hover:text-foreground"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" weight="bold" /> {t.repickTypeButton}
                    </button>
                  ) : null}
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void handle(input);
                    }}
                  >
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={!showInput}
                    placeholder={t.inputPlaceholder}
                    className="h-12 flex-1 rounded-xl border border-transparent bg-[#F2F4F6] px-4 text-[14px] text-[#191F28] focus:border-[#0B46E8] focus:bg-white focus:outline-none"
                    autoFocus
                  />
                  <Button type="submit" variant="default" size="lg" disabled={!input.trim() || busy}>
                    <PaperPlaneRight weight="fill" />
                  </Button>
                  </form>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* 우측: 실시간 미리보기 (데스크탑) — 모바일은 상단 ‘미리보기’ 버튼→팝업 */}
        <div className="hidden bg-[#F2F4F6] px-5 py-6 lg:block lg:overflow-y-auto">
          {previewContent ? <ResumePreview content={previewContent} design={previewDesign} /> : null}
        </div>
      </div>

      {/* 모바일 미리보기 팝업 */}
      {previewOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <span className="text-[14px] font-bold text-[#191F28]">{t.preview}</span>
            <button type="button" onClick={() => setPreviewOpen(false)} aria-label={t.close} className="rounded-lg p-1.5 hover:bg-muted">
              <X className="h-5 w-5" weight="bold" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#F2F4F6] p-4">
            {previewContent ? <ResumePreview content={previewContent} design={previewDesign} /> : null}
          </div>
        </div>
      ) : null}
    </ResumeMakerShell>
  );
}
