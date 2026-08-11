"use client";

// 자기소개서 — 문항별 직접 편집 + AI로 다듬기/초안. 옆에 A4 미리보기(전체 보기 링크).
// 1개 문서. 기본 정보 미등록 시 게이트. mock 저장 + /api/cover-assist.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, Eye, ArrowSquareOut, Trash, PaperPlaneTilt, CaretDown } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { ProfileGate } from "../career/ProfileGate";
import { ProfileCard } from "../career/ProfileCard";
import { PhotoToggleRow } from "../career/PhotoToggleRow";
import { CoverA4Preview } from "../career/CoverA4";
import { TLoading } from "../ui/primitives";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useBasicInfo, isBasicInfoComplete, type BasicInfo } from "../../../lib/talent/basic-info";
import { useResumeDoc, useRenewalDocsStatus } from "../../../lib/talent/resume-doc";
import { SECTION_META } from "../../../lib/talent/career-chat";
import { useCoverDoc, saveCoverDoc, generateCoverDoc, addCoverItem, coverQuestionEmoji, COVER_QUESTIONS, type CoverDoc } from "../../../lib/talent/cover-doc";
import { coverAssist, coverChat } from "../../../lib/talent/cover-assist-client";
import { ensureFeedEntry } from "../../../lib/talent/career-feed";

export function CoverBuilderScreen() {
  const basicInfo = useBasicInfo();
  const resume = useResumeDoc();
  const stored = useCoverDoc();
  const status = useRenewalDocsStatus();
  const [doc, setDoc] = useState<CoverDoc | null>(stored);
  const ready = isBasicInfoComplete(basicInfo);

  // 문서가 없으면 바로 시작 — 문항 문서를 자동 생성하고 편집 화면으로.
  // 단, 서버 로드가 끝나기 전에는 "문서 없음"으로 단정하지 않는다(조기 생성 방지).
  useEffect(() => {
    if (!ready || doc) return;
    if (status !== "loaded") return;
    if (stored) {
      setDoc(stored);
      return;
    }
    const d = generateCoverDoc();
    saveCoverDoc(d);
    setDoc(d);
  }, [ready, stored, doc, status]);

  const resumeText = useMemo(
    () => (resume?.items ?? []).map((i) => `- [${SECTION_META[i.section].label}] ${i.text}`).join("\n"),
    [resume]
  );

  function update(next: CoverDoc) {
    setDoc(next);
    saveCoverDoc(next);
  }

  const showEditor = ready && doc;

  return (
    <TalentAppShell wide>
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">자기소개서</h1>
            {showEditor ? (
              <Link
                href={talentAppRoutes.coverPreview}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 lg:hidden"
              >
                <Eye className="h-4 w-4" /> 미리보기
              </Link>
            ) : null}
          </div>
        </div>

        {!ready ? <ProfileGate /> : doc ? <Editor doc={doc} basicInfo={basicInfo} resumeText={resumeText} onChange={update} /> : <TLoading />}
      </div>
    </TalentAppShell>
  );
}

function Editor({ doc, basicInfo, resumeText, onChange }: { doc: CoverDoc; basicInfo: BasicInfo; resumeText: string; onChange: (d: CoverDoc) => void }) {
  function setText(id: string, text: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  }
  function remove(id: string) {
    onChange({ ...doc, items: doc.items.filter((it) => it.id !== id) });
  }
  function logCover(id: string, question: string, text: string) {
    ensureFeedEntry(`cover:${id}`, text.trim(), "experience", { emoji: "📝", label: `자기소개서 · ${question}`, href: talentAppRoutes.cover });
  }
  // 대화로 선택 문항에 새 항목 추가.
  function add(question: string, text: string) {
    const t = text.trim();
    if (!t) return;
    const { doc: next, id } = addCoverItem(doc, question, t);
    onChange(next);
    logCover(id, question, t);
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-5">
        <ProfileCard info={basicInfo} showPhoto={doc.showPhoto === true} />

        {basicInfo.photoUrl ? (
          <PhotoToggleRow label="자기소개서에 프로필 사진 표시" on={doc.showPhoto === true} onChange={(v) => onChange({ ...doc, showPhoto: v })} />
        ) : null}

        <ChatPanel name={basicInfo.realName} resumeText={resumeText} onAdd={add} />

        {COVER_QUESTIONS.map((q) => {
          const items = doc.items.filter((it) => it.question === q);
          if (items.length === 0) return null;
          return (
            <CollapsibleSection key={q} emoji={coverQuestionEmoji(q)} label={q} count={items.length}>
              {items.map((it) => (
                <ItemRow
                  key={it.id}
                  text={it.text}
                  question={q}
                  name={basicInfo.realName}
                  resumeText={resumeText}
                  onChange={(v) => setText(it.id, v)}
                  onRemove={() => remove(it.id)}
                />
              ))}
            </CollapsibleSection>
          );
        })}
      </div>

      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <div className="mb-2 flex items-center justify-end">
          <Link href={talentAppRoutes.coverPreview} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0B46E8] hover:underline">
            전체 보기 <ArrowSquareOut className="h-3.5 w-3.5" />
          </Link>
        </div>
        <CoverA4Preview doc={doc} info={basicInfo} />
      </aside>
    </div>
  );
}

// 접을 수 있는 섹션(문항) — 길어지면 헤더를 눌러 닫아둔다.
function CollapsibleSection({ emoji, label, count, children }: { emoji: string; label: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="flex flex-col gap-2.5 border-t border-[#EEF1F5] pt-5">
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

interface ChatMsg {
  id: number;
  role: "user" | "ai";
  text: string;
}

function ChatPanel({ name, resumeText, onAdd }: { name: string; resumeText: string; onAdd: (question: string, text: string) => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [value, setValue] = useState("");
  const [choice, setChoice] = useState(0);
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
    const question = COVER_QUESTIONS[choice] ?? COVER_QUESTIONS[0];
    setValue("");
    setMessages((m) => [...m, { id: ++seq.current, role: "user", text: t }]);
    setPending(true);
    const text = await coverChat({ note: t, question, name, resumeText });
    onAdd(question, text);
    setMessages((m) => [...m, { id: ++seq.current, role: "ai", text: `${coverQuestionEmoji(question)} '${question}'에 항목을 추가했어요. 미리보기에서 확인해보세요.` }]);
    setPending(false);
  }

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white">
      <div className="flex items-center gap-1.5 px-4 pt-3">
        <Sparkle className="h-[16px] w-[16px] text-[#0B46E8]" weight="fill" />
        <p className="text-[13.5px] font-bold text-[#191F28]">AI로 편집</p>
        <span className="text-[12px] text-[#8B95A1]">— 적으면 알맞은 문항에 반영돼요</span>
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

      {/* 문항 선택 */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-3">
        {COVER_QUESTIONS.map((q, i) => (
          <ChipButton key={q} label={`${coverQuestionEmoji(q)} ${q}`} active={choice === i} onClick={() => setChoice(i)} />
        ))}
      </div>

      <div className="p-3">
        <div className="flex items-end gap-2 rounded-xl bg-[#F5F6F8] p-2.5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder="예) 카페 알바에서 배운 책임감을 지원 동기에 녹여줘"
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

function ChipButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${active ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E5E8EB]"}`}
    >
      {label}
    </button>
  );
}

function ItemRow({
  text,
  question,
  name,
  resumeText,
  onChange,
  onRemove
}: {
  text: string;
  question: string;
  name: string;
  resumeText: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}) {
  const [busy, setBusy] = useState(false);

  const value = text ?? "";

  async function refine() {
    if (busy || !value.trim()) return;
    setBusy(true);
    const result = await coverAssist("refine", { question, answer: value, name, resumeText });
    if (result) onChange(result);
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="min-h-[96px] w-full resize-y break-keep rounded-lg bg-[#F5F6F8] px-3.5 py-3 text-[14px] leading-[1.8] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
      />
      <div className="mt-2.5 flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={refine}
          disabled={busy || !value.trim()}
          className="inline-flex items-center gap-1 rounded-lg bg-[#EDF1FD] px-2.5 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC] disabled:opacity-40"
        >
          <Sparkle className="h-3.5 w-3.5" weight="fill" /> {busy ? "다듬는 중…" : "AI로 다듬기"}
        </button>
        <button type="button" onClick={onRemove} aria-label="삭제" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]">
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
