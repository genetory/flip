"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CircleNotch, PaperPlaneRight } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { AutoSaveIndicator } from "./AutoSaveIndicator";
import { useResumeContentAutosave } from "./useResumeMakerAutosave";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import type { CandidateEducationStatus, CandidateEducationType, ResumeContent, ResumeEducationEntry } from "../../lib/member-profile-client";
import { draftSelfIntro, getBuilderState, getDraftResume, polishExperienceText, suggestExperienceTasks, suggestExperienceTitle } from "../../lib/resume-maker-client";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { ResumeCompletionConfetti } from "./ResumeCompletionConfetti";
import { EMPTY_BUILDER_STATE, EXPERIENCE_TYPES, type BuilderExperience, type ExperienceType, type ResumeBuilderState } from "../../lib/resume-maker-types";

// 대화형 작성 — 카테고리(section)별로 그 분야만 대화로 채운다. 폼 대신 AI가
// 한 번에 하나씩 물어보고, 답하면 해당 섹션이 채워진다. 결과는
// content.builder + 표준 필드에 자동저장되어 편집/미리보기와 그대로 이어진다.

type ContentWithBuilder = ResumeContent & { builder: ResumeBuilderState };
type Msg = { id: number; role: "ai" | "user"; text: string };
type ChatSection = "basic" | "intro" | "experiences" | "education" | "awards" | "skills" | "languages" | "links";

let msgSeq = 0;

const SECTION_LABEL: Record<ChatSection, string> = {
  basic: "기본 정보",
  intro: "자기소개",
  experiences: "경험",
  education: "학력",
  awards: "자격 · 수상",
  skills: "스킬",
  languages: "어학",
  links: "링크"
};

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

const NEGATIVE = /없어|없음|끝|그만|아니|no|done/i;
const SKIP = /없어|없음|패스|건너|skip/i;
// 수정 단계에서 '그대로/건너뛰기/모름'을 한 번에 처리.
const KEEP = /그대로|건너|없어|없음|패스|모르|유지|skip/i;

// 선택지(빠른 답변) 버튼으로 받는 phase 들.
const QUICK_REPLIES: Record<string, string[]> = {
  b_foreigner: ["네, 외국인이에요", "아니요"],
  ed_type: ["고등학교", "대학교(학사)", "전문학사", "대학원(석사)", "대학원(박사)", "기타"],
  ed_status: ["재학 중", "졸업", "휴학", "중퇴"]
};
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
  const toast = useToast();
  const { status, schedule, flush } = useResumeContentAutosave(resumeId);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ContentWithBuilder | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [phase, setPhase] = useState<string>("start");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const eduIdxRef = useRef<number | null>(null); // 현재 채우는 학력 항목 index
  const enrichExpId = expId && section === "experiences" ? expId : null; // 특정 경험 보강 모드
  // ① 한 줄 → 다듬기 → 채택/다시(메인) + 추천 칩(보조).
  const [taskOptions, setTaskOptions] = useState<string[]>([]);
  const taskExpIdRef = useRef<string | null>(null); // 지금 작성/수정 중인 경험 id
  const taskReturnRef = useRef<"e_more" | "ex_enrich">("e_more"); // 마친 뒤 돌아갈 흐름
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
        return { lines: ["기본 정보를 채워볼게요. 이름이 어떻게 되세요?"], phase: "b_name" };
      case "intro":
        return {
          lines: ["자기소개를 만들어 볼게요. 지금까지 입력한 경험으로 AI가 초안을 써드릴까요?"],
          phase: "i_offer"
        };
      case "experiences":
        return {
          lines: ["경험을 하나씩 채워볼게요. 어떤 종류의 경험이에요? 아래에서 골라줘요."],
          phase: "ex_type"
        };
      case "education":
        return { lines: ["학력을 채워볼게요. 어느 학교를 다녔어요? (예: OO대학교)"], phase: "ed_school" };
      case "awards":
        return { lines: ["자격증이나 수상 이력이 있어요? 하나씩 적어줘요. (예: 정보처리기사) 없으면 ‘없어요’."], phase: "aw_more" };
      case "skills":
        return { lines: ["다룰 수 있는 기술·툴·역량을 쉼표로 적어줄래요? (예: React, Figma, 데이터 분석)"], phase: "sk_list" };
      case "languages":
        return { lines: ["구사 가능한 언어가 있어요? ‘언어 - 수준’으로 적어줘요. (예: 영어 - 비즈니스) 없으면 ‘없어요’."], phase: "lg_more" };
      case "links":
        return { lines: ["보여주고 싶은 링크가 있어요? 이름과 URL을 적어줘요. (예: 포트폴리오 https://...) 없으면 ‘없어요’."], phase: "ln_more" };
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const resume = await getDraftResume(resumeId);
        if (!alive) return;
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
            { id: msgSeq++, role: "ai", text: `‘${exp?.title || "이 경험"}’을 하나씩 고쳐볼게요. 😊` },
            { id: msgSeq++, role: "ai", text: "종류부터 볼게요. 그대로면 ‘그대로’를 눌러요." }
          ]);
          setPhase("ex_type");
        } else {
          if (sec === "experiences") expModeRef.current = "add";
          const open = openingFor(sec);
          setMessages([
            { id: msgSeq++, role: "ai", text: `${SECTION_LABEL[sec]}를 대화로 채워볼게요. 😊` },
            ...open.lines.map((t) => ({ id: msgSeq++, role: "ai" as const, text: t }))
          ]);
          setPhase(open.phase);
        }
      } catch {
        toast.error("이력서를 불러오지 못했어요.");
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
    say(`${SECTION_LABEL[sec]} 작성이 끝났어요! 🎉 편집에서 더 다듬거나 다른 항목도 채워보세요.`);
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
    say("이력서에 추가됐어요! ✅ 또 다른 경험이 있어요? 종류를 고르거나 ‘그만’을 눌러요.");
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

  function pickType(label: string) {
    meSaid(label);
    if (expModeRef.current === "add") {
      if (label === "✓ 그만할게요") {
        finish();
        return;
      }
      createNewExp((EXPERIENCE_TYPES.find((t) => t.label === label)?.value ?? "etc") as ExperienceType);
    } else {
      const id = taskExpIdRef.current;
      if (label !== "그대로" && id) {
        const val = (EXPERIENCE_TYPES.find((t) => t.label === label)?.value ?? "etc") as ExperienceType;
        mutateExp(id, (e) => ({ ...e, type: val }));
      }
    }
    askOrg();
  }

  function askOrg() {
    const exp = currentExp();
    const cur = exp?.org ?? "";
    say(cur ? `회사·단체명이 지금 ‘${cur}’이에요. 바꾸려면 새로, 그대로면 ‘그대로’.` : "회사·단체명이 어떻게 되세요? (없으면 ‘건너뛰기’)");
    setPhase("ex_org");
  }
  function askTitle() {
    const exp = currentExp();
    const cur = exp?.title ?? "";
    say(cur ? `경험 이름·직책이 ‘${cur}’이에요. 바꾸려면 새로, 그대로면 ‘그대로’.` : "이 경험의 이름이나 직책은요? (예: 카페 바리스타)");
    setPhase("ex_title");
  }
  function askPeriod() {
    const exp = currentExp();
    const cur = exp?.startDate ? `${exp.startDate} ~ ${exp.endDate || "진행 중"}` : "";
    say(cur ? `기간이 ‘${cur}’이에요. 바꾸려면 새로(예: 2023-03 ~ 2024-02), 그대로면 ‘그대로’.` : "언제 했어요? (예: 2023-03 ~ 2024-02) 모르면 ‘건너뛰기’.");
    setPhase("ex_period");
  }
  function askContent() {
    const exp = currentExp();
    if (expModeRef.current === "edit" && (exp?.rawInput ?? "").trim()) {
      say(`마지막! 한 일은 지금 이래요 👇\n“${exp?.rawInput}”\n더 다듬을까요?`);
      setPhase("ex_content");
    } else {
      say("마지막! 여기서 무슨 일을 했는지 한 문장으로 적어줘요. 제가 다듬어 드릴게요.");
      setPhase("ex_content_input");
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
      askTypeLoop();
    }
  }

  function finishEditExp() {
    setPhase("done");
    say("수정했어요! 🎉 편집·미리보기에서 확인해 보세요.");
    void flush();
  }

  function parsePeriod(text: string): { startDate?: string; endDate?: string } {
    const ongoing = /진행|현재|지금|now/i.test(text);
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
      say("이렇게 다듬어봤어요 👇", polished);
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
    meSaid("이걸로 할게요");
    setPolishDraft(null);
    void finishExperienceContent();
  }

  async function retryPolish() {
    if (!polishDraft || busy) return;
    setBusy(true);
    try {
      const again = await polishExperienceText({ text: polishDraft.original, style: "natural", type: "etc" });
      setPolishDraft({ ...polishDraft, polished: again });
      say("다시 다듬어봤어요 👇", again);
    } catch {
      say("앗, 다시 시도하지 못했어요. 잠시 후 다시 눌러주세요.");
    } finally {
      setBusy(false);
    }
  }

  function keepOriginal() {
    if (!polishDraft) return;
    const { expId, original, mode } = polishDraft;
    // replace 모드는 원문이 이미 rawInput 에 있음. append 모드는 원문을 더한다.
    if (mode === "append") mutateExp(expId, (e) => ({ ...e, rawInput: [e.rawInput, original].filter(Boolean).join("\n") }));
    meSaid("직접 쓴 대로 둘게요");
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
      say("먼저 무슨 일을 했는지 한 문장 적어줘요.");
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
      say("이런 일 하셨나요? 해당되는 걸 눌러주세요. (여러 개 가능)");
      setPhase("ex_tasks");
    } catch {
      if (ret === "e_more") {
        say("또 다른 경험이 있어요? 없으면 ‘없어요’.");
        setPhase("e_more");
      } else {
        say("구체적으로 어떤 일을 했어요? 역할·한 일·성과 등 편하게 적어줘요.");
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
    say("그럼 어떤 일을 했는지 직접 적어줘요. 짧게 적어도 제가 다듬어 드릴게요.");
    setPhase("ex_content_input");
  }

  async function handle(answer: string) {
    const text = answer.trim();
    if (!text || busy || !content) return;
    meSaid(text);
    setInput("");

    switch (phase) {
      // ── 기본 정보 ──
      case "b_name":
        apply((c) => ({ ...c, basicName: text }));
        say(`반가워요, ${text}님! 전화번호를 알려줄래요? (없으면 ‘없어요’)`);
        setPhase("b_phone");
        return;
      case "b_phone":
        if (!/없어|없음|패스|건너|skip/i.test(text)) apply((c) => ({ ...c, basicPhone: text }));
        say("이메일 주소도 알려줄래요? (없으면 ‘없어요’)");
        setPhase("b_email");
        return;
      case "b_email":
        if (!/없어|없음|패스|건너|skip/i.test(text)) apply((c) => ({ ...c, basicEmail: text }));
        say("한국 국적이 아닌 외국인이세요?");
        setPhase("b_foreigner");
        return;
      case "b_foreigner": {
        const isForeigner = /외국인|네|응|예|yes|y/i.test(text) && !/아니|no/i.test(text);
        apply((c) => ({ ...c, builder: { ...c.builder, onboarding: { ...c.builder.onboarding, isForeigner } } }));
        say(isForeigner ? "알겠어요! 비자 종류는 편집의 기본 정보에서 선택할 수 있어요." : "네, 알겠어요!");
        say("어떤 일을 하고 싶어요? (예: 백엔드 개발, 마케팅) 아직 모르겠으면 ‘몰라요’.");
        setPhase("b_job");
        return;
      }
      case "b_job":
        if (!/몰라|모르|아직/.test(text))
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
        askContent();
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
        say("구분이 어떻게 되세요?");
        setPhase("ed_type");
        return;
      case "ed_type": {
        const t = EDU_TYPE_MAP[text] ?? "OTHER";
        patchEdu({ educationType: t });
        if (t === "HIGH_SCHOOL") {
          say("상태는 어떻게 되세요?");
          setPhase("ed_status");
        } else {
          say("전공이 어떻게 되세요? (없으면 ‘없어요’)");
          setPhase("ed_major");
        }
        return;
      }
      case "ed_major":
        if (!SKIP.test(text)) patchEdu({ major: text.trim() });
        say("상태는 어떻게 되세요?");
        setPhase("ed_status");
        return;
      case "ed_status": {
        const st = EDU_STATUS_MAP[text] ?? "GRADUATED";
        patchEdu({ status: st, ...(st === "ENROLLED" || st === "LEAVE_OF_ABSENCE" ? { endDate: "" } : {}) });
        say("입학 시기는요? (예: 2020-03, 없으면 ‘없어요’)");
        setPhase("ed_start");
        return;
      }
      case "ed_start": {
        if (!SKIP.test(text)) patchEdu({ startDate: text.trim() });
        const cur = (content.educations ?? [])[eduIdxRef.current ?? -1];
        const enrolled = cur?.status === "ENROLLED" || cur?.status === "LEAVE_OF_ABSENCE";
        if (enrolled) {
          say("학교를 추가했어요! 또 다른 학교가 있으면 학교명을 적어주세요. 없으면 ‘없어요’.");
          setPhase("ed_more");
        } else {
          say("졸업(예정) 시기는요? (예: 2024-02, 없으면 ‘없어요’)");
          setPhase("ed_end");
        }
        return;
      }
      case "ed_end":
        if (!SKIP.test(text)) patchEdu({ endDate: text.trim() });
        say("학교를 추가했어요! 또 다른 학교가 있으면 학교명을 적어주세요. 없으면 ‘없어요’.");
        setPhase("ed_more");
        return;
      case "ed_more":
        if (NEGATIVE.test(text)) {
          finish();
          return;
        }
        startEducation(text);
        say("구분이 어떻게 되세요?");
        setPhase("ed_type");
        return;

      // ── 자격 · 수상 ──
      case "aw_more":
        if (NEGATIVE.test(text)) {
          finish();
          return;
        }
        apply((c) => ({ ...c, certifications: [...(c.certifications ?? []), { name: text.trim() }] }));
        say("추가했어요! 발급처·시기는 편집에서 채울 수 있어요. 또 있어요? 없으면 ‘없어요’.");
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
        say(`${parts.length}개 스킬을 추가했어요!`);
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
        say("추가했어요! 또 다른 언어 있어요? 없으면 ‘없어요’.");
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
        say("추가했어요! 또 있어요? 없으면 ‘없어요’.");
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
      meSaid("직접 쓸게요");
      say("좋아요, 자기소개를 편하게 적어주세요. 제가 그대로 넣어드릴게요.");
      setPhase("i_text");
      return;
    }
    meSaid("네, 만들어 주세요");
    setBusy(true);
    say("좋아요! 경험을 바탕으로 자기소개 초안을 써볼게요…");
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
      say("이렇게 써봤어요 👇", draft);
    } catch (e) {
      say(e instanceof Error ? e.message : "초안 생성에 실패했어요. 직접 작성해 주세요.");
    } finally {
      setBusy(false);
      finish();
    }
  }

  const progress = content ? computeResumeProgress(content, content.builder) : null;
  // 선택지가 있으면 대화창 안에 말풍선으로 띄운다.
  const options: { label: string; onClick: () => void }[] =
    phase === "i_offer"
      ? [
          { label: "네, 만들어 주세요", onClick: () => void offerIntro(true) },
          { label: "직접 쓸게요", onClick: () => void offerIntro(false) }
        ]
      : phase === "ex_content"
        ? [
            { label: "✨ 더 다듬기", onClick: () => startEditContentPolish() },
            { label: "그대로", onClick: () => void finishExperienceContent() }
          ]
        : phase === "ex_type"
          ? expModeRef.current === "edit"
            ? [
                { label: "그대로", onClick: () => pickType("그대로") },
                ...EXPERIENCE_TYPES.map((t) => ({ label: t.label, onClick: () => pickType(t.label) }))
              ]
            : [
                ...EXPERIENCE_TYPES.map((t) => ({ label: t.label, onClick: () => pickType(t.label) })),
                { label: "✓ 그만할게요", onClick: () => pickType("✓ 그만할게요") }
              ]
          : phase === "ex_polish"
        ? [
            { label: "✓ 이걸로 할게요", onClick: () => acceptPolish() },
            { label: "다시 다듬기", onClick: () => void retryPolish() },
            { label: "직접 쓴 대로 둘게요", onClick: () => keepOriginal() },
            { label: "막막해요 · 추천받기", onClick: () => void offerTasksFromPolish() }
          ]
        : phase === "ex_tasks"
          ? [
              ...taskOptions.map((t) => ({ label: `＋ ${t}`, onClick: () => pickTask(t) })),
              { label: "✓ 다 골랐어요", onClick: () => doneTasks() },
              { label: "맞는 게 없어요 · 직접 적기", onClick: () => typeTasksInstead() }
            ]
          : QUICK_REPLIES[phase]
            ? QUICK_REPLIES[phase].map((q) => ({ label: q, onClick: () => void handle(q) }))
            : [];
  const showInput = !loading && phase !== "done" && options.length === 0 && !busy;

  return (
    <ResumeMakerShell title={`대화형 작성 · ${SECTION_LABEL[sec]}`} right={<AutoSaveIndicator status={status} onRetry={() => void flush()} />}>
      <div className="mx-auto flex h-[calc(100vh-56px)] max-w-2xl flex-col px-5">
        {progress ? <ResumeCompletionConfetti percent={progress.percent} /> : null}
        {progress ? (
          <div className="pt-4">
            <div className="flex items-center justify-between text-[12px]">
              <span className="font-bold text-[#0B1227]">
                {progress.level.emoji} 이력서 완성도 · {progress.level.label}
              </span>
              <span className="font-semibold text-[#0B46E8]">{progress.percent}%</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#0B46E8] transition-[width] duration-500" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        ) : null}

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto py-5">
          {loading ? (
            <div className="flex justify-center pt-10 text-muted-foreground">
              <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
            </div>
          ) : null}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                  m.role === "user" ? "bg-[#0B46E8] text-white" : "bg-muted text-foreground"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {busy ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-muted px-4 py-2.5 text-[13px] text-muted-foreground">
                <CircleNotch className="h-3.5 w-3.5 animate-spin" weight="bold" aria-hidden /> 작성 중…
              </div>
            </div>
          ) : null}

          {/* 선택지 — 대화창 안 말풍선 */}
          {!busy && !loading && options.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-2 pt-1">
              {options.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={o.onClick}
                  className="rounded-2xl border border-[#0B46E8]/40 bg-white px-4 py-2.5 text-[14px] font-semibold text-[#0B46E8] transition hover:bg-[#0B46E8]/5 active:scale-[0.98]"
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {phase === "done" || showInput ? (
        <div className="border-t border-border/60 py-4">
          {phase === "done" ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default" size="lg">
                <Link
                  href={
                    sec === "experiences"
                      ? `/resume-maker/${resumeId}/experiences`
                      : `/resume-maker/${resumeId}/edit?section=${SECTION_ROUTE[sec]}`
                  }
                >
                  편집에서 보기 <ArrowRight weight="bold" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={`/resume-maker/${resumeId}/experiences`}>다른 항목 채우기</Link>
              </Button>
            </div>
          ) : (
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
                placeholder="여기에 답을 적어주세요"
                className="h-12 flex-1 rounded-xl border border-border bg-white px-4 text-[14px] focus:border-primary focus:outline-none"
                autoFocus
              />
              <Button type="submit" variant="default" size="lg" disabled={!input.trim() || busy}>
                <PaperPlaneRight weight="fill" />
              </Button>
            </form>
          )}
        </div>
        ) : null}
      </div>
    </ResumeMakerShell>
  );
}
