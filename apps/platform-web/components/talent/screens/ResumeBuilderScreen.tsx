"use client";

// 이력서 — 자동 초안(기본 정보 + 커리어 피드) → 직접 편집 + AI로 다듬기 + 대화로 추가.
// 편집 옆에 미리보기 상시 노출(데스크톱), 모바일은 '미리보기' 버튼으로 따로 보기.
// 1개 문서. 초안 생성/다듬기는 mock(규칙 기반), 추후 실제 LLM으로 교체.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, PaperPlaneTilt, Trash, Eye, ArrowSquareOut, CaretDown } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { ProfileGate } from "../career/ProfileGate";
import { ProfileCard } from "../career/ProfileCard";
import { PhotoToggleRow } from "../career/PhotoToggleRow";
import { ResumeA4Preview } from "../career/ResumeA4";
import { TLoading } from "../ui/primitives";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useBasicInfo, isBasicInfoComplete, type BasicInfo } from "../../../lib/talent/basic-info";
import { useCareerFeed, ensureFeedEntry } from "../../../lib/talent/career-feed";
import { classifyCareerNote, SECTION_META, type CareerSection } from "../../../lib/talent/career-chat";
import { careerAssist } from "../../../lib/talent/career-assist-client";
import { useResumeDoc, useRenewalDocsStatus, saveResumeDoc, generateResumeDoc, addResumeItem, refineText, SECTION_HAS_DATE, type ResumeDoc } from "../../../lib/talent/resume-doc";

// 섹션 칩 · 편집 리스트 순서 — 학력은 맨 오른쪽/맨 아래.
const CHIP_ORDER: CareerSection[] = ["experience", "project", "certificate", "skill", "award", "activity", "education"];

export function ResumeBuilderScreen() {
  const basicInfo = useBasicInfo();
  const feed = useCareerFeed();
  const stored = useResumeDoc();
  const status = useRenewalDocsStatus();
  const [doc, setDoc] = useState<ResumeDoc | null>(stored);
  const ready = isBasicInfoComplete(basicInfo);

  // 문서가 없으면 바로 시작 — (커리어 노트로) 초안을 자동 생성하고 편집 화면으로.
  // 단, 서버 로드가 끝나기 전에는 "문서 없음"으로 단정하지 않는다(조기 생성 방지).
  useEffect(() => {
    if (!ready || doc) return;
    if (status !== "loaded") return;
    if (stored) {
      setDoc(stored);
      return;
    }
    const d = generateResumeDoc(feed, "");
    saveResumeDoc(d);
    setDoc(d);
  }, [ready, stored, doc, feed, status]);

  function update(next: ResumeDoc) {
    setDoc(next);
    saveResumeDoc(next);
  }

  const showEditor = ready && doc;

  return (
    <TalentAppShell wide>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">이력서</h1>
            {showEditor ? (
              <Link
                href={talentAppRoutes.resumePreview}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 lg:hidden"
              >
                <Eye className="h-4 w-4" /> 미리보기
              </Link>
            ) : null}
          </div>
        </div>

        {!ready ? <ProfileGate /> : doc ? <Editor doc={doc} basicInfo={basicInfo} onChange={update} /> : <TLoading />}
      </div>
    </TalentAppShell>
  );
}

/* 편집기 + (데스크톱) 미리보기 2단 */
function Editor({ doc, basicInfo, onChange }: { doc: ResumeDoc; basicInfo: BasicInfo; onChange: (d: ResumeDoc) => void }) {
  function setText(id: string, text: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  }
  function setDate(id: string, field: "startDate" | "endDate", value: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, [field]: value } : it)) });
  }
  function refine(id: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text: refineText(it.text) } : it)) });
  }
  function remove(id: string) {
    onChange({ ...doc, items: doc.items.filter((it) => it.id !== id) });
  }
  // 사후 수정 — 잘못 분류된(예: 피드 자동 삽입) 항목의 섹션을 바꾼다.
  function setSection(id: string, section: CareerSection) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, section } : it)) });
  }
  // 경력 — 소속(회사/기관).
  function setCompany(id: string, company: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, company } : it)) });
  }
  function add(text: string, section?: CareerSection, refined?: string, startDate?: string, endDate?: string): string {
    const trimmed = text.trim();
    if (!trimmed) return "";
    const sec = section ?? classifyCareerNote(trimmed);
    const { doc: next, id } = addResumeItem(doc, sec, refined ?? refineText(trimmed), startDate ?? "", endDate ?? "");
    onChange(next);
    return id;
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
      {/* 편집 */}
      <div className="flex flex-col gap-5">
        <ProfileCard info={basicInfo} showPhoto={doc.showPhoto === true} />

        {basicInfo.photoUrl ? (
          <PhotoToggleRow label="이력서에 프로필 사진 표시" on={doc.showPhoto === true} onChange={(v) => onChange({ ...doc, showPhoto: v })} />
        ) : null}

        <ChatPanel onAdd={add} />

        {CHIP_ORDER.map((section) => {
          const items = doc.items.filter((it) => it.section === section);
          if (items.length === 0) return null;
          const meta = SECTION_META[section];
          return (
            <CollapsibleSection key={section} emoji={meta.emoji} label={meta.label} count={items.length}>
              {items.map((it) => (
                <ItemRow
                  key={it.id}
                  text={it.text}
                  section={section}
                  company={it.company ?? ""}
                  startDate={it.startDate ?? ""}
                  endDate={it.endDate ?? ""}
                  showDate={SECTION_HAS_DATE[section]}
                  onChange={(v) => setText(it.id, v)}
                  onCompanyChange={(v) => setCompany(it.id, v)}
                  onSectionChange={(s) => setSection(it.id, s)}
                  onStartChange={(v) => setDate(it.id, "startDate", v)}
                  onEndChange={(v) => setDate(it.id, "endDate", v)}
                  onRefine={() => refine(it.id)}
                  onRemove={() => remove(it.id)}
                />
              ))}
            </CollapsibleSection>
          );
        })}
      </div>

      {/* 데스크톱 미리보기(상시, A4) */}
      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <div className="mb-2 flex items-center justify-end">
          <Link href={talentAppRoutes.resumePreview} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0B46E8] hover:underline">
            전체 보기 <ArrowSquareOut className="h-3.5 w-3.5" />
          </Link>
        </div>
        <ResumeA4Preview doc={doc} info={basicInfo} />
      </aside>
    </div>
  );
}


// 접을 수 있는 섹션 — 길어지면 헤더를 눌러 닫아둔다.
function CollapsibleSection({ emoji, label, count, children }: { emoji: string; label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="flex flex-col gap-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-1.5 text-left">
        <span aria-hidden>{emoji}</span>
        <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{label}</h2>
        <span className="text-[13px] font-bold text-[#B0B8C1]">{count}</span>
        <CaretDown className={`ml-auto h-4 w-4 shrink-0 text-[#C4CAD2] transition-transform ${open ? "rotate-180" : ""}`} weight="bold" />
      </button>
      {open ? <div className="flex flex-col gap-2.5">{children}</div> : null}
    </section>
  );
}

function ItemRow({
  text,
  section,
  company,
  startDate,
  endDate,
  showDate,
  onChange,
  onCompanyChange,
  onSectionChange,
  onStartChange,
  onEndChange,
  onRefine,
  onRemove
}: {
  text: string;
  section: CareerSection;
  company: string;
  startDate: string;
  endDate: string;
  showDate: boolean;
  onChange: (v: string) => void;
  onCompanyChange: (v: string) => void;
  onSectionChange: (s: CareerSection) => void;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onRefine: () => void;
  onRemove: () => void;
}) {
  const isExperience = section === "experience";
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      {isExperience ? (
        <input
          value={company}
          onChange={(e) => onCompanyChange(e.target.value)}
          placeholder="소속 (회사·기관)"
          className="mb-2.5 w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] font-bold text-[#191F28] outline-none placeholder:font-normal placeholder:text-[#B0B8C1]"
        />
      ) : null}
      {showDate ? (
        <div className="mb-2.5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              type="month"
              aria-label="시작 날짜"
              value={startDate}
              onChange={(e) => onStartChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[13px] text-[#4E5968] outline-none [color-scheme:light]"
            />
            <span className="shrink-0 text-[13px] text-[#B0B8C1]">–</span>
            <input
              type="month"
              aria-label="종료 날짜"
              value={endDate === "현재" ? "" : endDate}
              disabled={endDate === "현재"}
              onChange={(e) => onEndChange(e.target.value)}
              className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[13px] text-[#4E5968] outline-none disabled:opacity-50 [color-scheme:light]"
            />
          </div>
          <label className="flex w-fit cursor-pointer items-center gap-1.5 text-[12.5px] font-medium text-[#4E5968]">
            <input
              type="checkbox"
              checked={endDate === "현재"}
              onChange={(e) => onEndChange(e.target.checked ? "현재" : "")}
              className="h-3.5 w-3.5 accent-[#0B46E8]"
            />
            현재 (진행 중)
          </label>
        </div>
      ) : null}
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={isExperience ? "한 일·성과 (선택)" : undefined}
        className="w-full resize-none break-keep rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
      />
      <div className="mt-2 flex items-center justify-between gap-1.5">
        {/* 사후 수정 — 섹션 이동(자동 분류 교정) */}
        <select
          aria-label="섹션 변경"
          value={section}
          onChange={(e) => onSectionChange(e.target.value as CareerSection)}
          className="max-w-[45%] rounded-lg bg-[#F5F6F8] px-2.5 py-1.5 text-[12px] font-semibold text-[#4E5968] outline-none [color-scheme:light]"
        >
          {CHIP_ORDER.map((s) => (
            <option key={s} value={s}>{SECTION_META[s].label}</option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRefine}
            className="inline-flex items-center gap-1 rounded-lg bg-[#EDF1FD] px-2.5 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC]"
          >
            <Sparkle className="h-3.5 w-3.5" weight="fill" /> AI로 다듬기
          </button>
          <button type="button" onClick={onRemove} aria-label="삭제" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]">
            <Trash className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* AI 대화 패널 — 적으면 알맞은 섹션에 반영하고 대화로 알려준다 */
interface ChatMsg {
  id: number;
  role: "user" | "ai";
  text: string;
}

type SectionChoice = CareerSection;

function ChatPanel({ onAdd }: { onAdd: (text: string, section?: CareerSection, refined?: string, startDate?: string, endDate?: string) => string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [value, setValue] = useState("");
  const [choice, setChoice] = useState<SectionChoice>(CHIP_ORDER[0]);
  const [pending, setPending] = useState(false);
  const seq = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending]);

  async function send() {
    const t = value.trim();
    if (!t || pending) return;
    setValue("");
    setMessages((m) => [...m, { id: ++seq.current, role: "user", text: t }]);
    setPending(true);

    const res = await careerAssist(t, choice);

    if (!res.relevant) {
      setMessages((m) => [...m, { id: ++seq.current, role: "ai", text: res.followUp || "이력서에 담을 커리어 내용을 적어주세요." }]);
      setPending(false);
      return;
    }

    const meta = SECTION_META[res.section];
    const id = onAdd(t, res.section, res.refined, res.startDate, res.endDate);
    // 커리어 기록(피드)에도 요약 리스팅.
    ensureFeedEntry(`resume:${id}`, res.refined, res.section, { label: `이력서 · ${meta.label}`, href: talentAppRoutes.resume });
    setMessages((m) => [
      ...m,
      { id: ++seq.current, role: "ai", text: `${meta.emoji} ${meta.label}에 정리했어요. ${res.followUp}`.trim() }
    ]);
    setPending(false);
  }

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white">
      <div className="flex items-center gap-1.5 px-4 pt-3">
        <Sparkle className="h-[16px] w-[16px] text-[#0B46E8]" weight="fill" />
        <p className="text-[13.5px] font-bold text-[#191F28]">AI로 편집</p>
        <span className="text-[12px] text-[#8B95A1]">— 적으면 항목으로 정리돼요</span>
      </div>

      {messages.length || pending ? (
        <div ref={listRef} className="flex max-h-56 flex-col gap-2.5 overflow-y-auto px-4 py-3">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[85%] break-keep rounded-2xl rounded-tr-md bg-[#0B46E8] px-3.5 py-2 text-[13.5px] leading-relaxed text-white">{m.text}</p>
              </div>
            ) : (
              <div key={m.id} className="flex justify-start">
                <p className="max-w-[85%] break-keep rounded-2xl rounded-tl-md border border-[#EEF1F5] bg-[#F5F8FF] px-3.5 py-2 text-[13.5px] leading-relaxed text-[#191F28]">{m.text}</p>
              </div>
            )
          )}
          {pending ? (
            <div className="flex justify-start">
              <p className="rounded-2xl rounded-tl-md border border-[#EEF1F5] bg-[#F5F8FF] px-3.5 py-2 text-[13.5px] text-[#8B95A1]">AI가 정리 중…</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 섹션 선택 */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-3">
        {CHIP_ORDER.map((s) => (
          <SectionChip key={s} label={`${SECTION_META[s].emoji} ${SECTION_META[s].label}`} active={choice === s} onClick={() => setChoice(s)} />
        ))}
      </div>

      <div className="p-3">
        <div className="flex items-end gap-2 rounded-xl bg-[#F5F6F8] p-2.5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter 는 무시(마지막 글자 잘림 방지).
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="예) 데이터 분석 프로젝트 완료 · 토익 900 취득"
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
          />
          <button
            type="button"
            onClick={send}
            disabled={!value.trim() || pending}
            aria-label="보내기"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8] text-white transition enabled:hover:bg-[#0A3ECB] disabled:opacity-40"
          >
            <PaperPlaneTilt className="h-[18px] w-[18px]" weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${
        active ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"
      }`}
    >
      {label}
    </button>
  );
}

