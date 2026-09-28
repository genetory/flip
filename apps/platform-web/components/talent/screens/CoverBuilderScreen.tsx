"use client";

// 자기소개서 — 문항별 직접 편집 + AI 초안/다듬기. 옆에 A4 미리보기(전체 보기 링크).
// 1개 문서. 기본 정보 미등록 시 게이트.
//
// AI는 자소서 전용 엔진(/members/me/ai/cover-letter)을 쓴다. 이 엔진은 지원 공고(JD)·반드시
// 넣을 소재·목표 글자 수·이력서 구조화 컨텍스트를 받아 한국형 자소서 규칙(STAR·두괄식·상투어
// 금지·수치 날조 금지)으로 생성한다. 예전엔 이력서 '자기소개 다듬기'(polish-intro)를 불러서
// 자소서 규칙이 전혀 적용되지 않았다.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, Eye, ArrowSquareOut, Trash, PaperPlaneTilt, CaretDown, Plus, Buildings, Tag, X } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { ProfileGate } from "../career/ProfileGate";
import { ProfileCard } from "../career/ProfileCard";
import { ResumePhotoRow } from "../career/ResumePhotoRow";
import { CoverA4Preview } from "../career/CoverA4";
import { AiRevisionBar } from "../career/AiRevisionBar";
import { TLoading } from "../ui/primitives";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useBasicInfo, isBasicInfoComplete, type BasicInfo } from "../../../lib/talent/basic-info";
import { useResumeDoc, useRenewalDocsStatus } from "../../../lib/talent/resume-doc";
import { SECTION_META } from "../../../lib/talent/career-chat";
import { useCoverDoc, saveCoverDoc, generateCoverDoc, addCoverItem, coverQuestionEmoji, coverQuestions, type CoverDoc } from "../../../lib/talent/cover-doc";
import { coverQuestionLabelOf } from "../../../lib/talent/career-labels";
import { coverChat } from "../../../lib/talent/cover-assist-client";
import { generateCoverLetter, getAiUsage, AiQuotaError, type PolishStyle, type AiUsage } from "../../../lib/resume-maker-client";
import { buildCoverAiResumeContext, type CoverAiResumeContext } from "../../../lib/talent/cover-ai-context";
import type { ResumeDoc } from "../../../lib/talent/resume-doc";
import { AiTicketStatusModal } from "../../resume-maker/AiTicketStatusModal";
import { ensureFeedEntry } from "../../../lib/talent/career-feed";
import { usePlatformT } from "../../../lib/i18n";

export function CoverBuilderScreen() {
  const t = usePlatformT();
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
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("자기소개서","Cover letter","求职信","Thư xin việc","自己PR","Surat lamaran")}</h1>
            {showEditor ? (
              <Link
                href={talentAppRoutes.coverPreview}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 lg:hidden"
              >
                <Eye className="h-4 w-4" /> {t("미리보기","Preview","预览","Xem trước","プレビュー","Pratinjau")}
              </Link>
            ) : null}
          </div>
        </div>

        {!ready ? <ProfileGate /> : doc ? <Editor doc={doc} basicInfo={basicInfo} resumeText={resumeText} resume={resume} onChange={update} /> : <TLoading />}
      </div>
    </TalentAppShell>
  );
}

function Editor({ doc, basicInfo, resumeText, resume, onChange }: { doc: CoverDoc; basicInfo: BasicInfo; resumeText: string; resume: ResumeDoc | null; onChange: (d: CoverDoc) => void }) {
  const t = usePlatformT();
  // 포인트 부족(402) 시 충전 모달.
  const [chargeOpen, setChargeOpen] = useState(false);
  const [usage, setUsage] = useState<AiUsage | null>(null);
  async function openCharge() {
    try { setUsage(await getAiUsage()); } catch { /* ignore */ }
    setChargeOpen(true);
  }
  function setText(id: string, text: string) {
    onChange({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  }
  function remove(id: string) {
    onChange({ ...doc, items: doc.items.filter((it) => it.id !== id) });
  }
  function logCover(id: string, question: string, text: string) {
    ensureFeedEntry(`cover:${id}`, text.trim(), "experience", { emoji: "📝", label: `${t("자기소개서","Cover letter","求职信","Thư xin việc","自己PR","Surat lamaran")} · ${coverQuestionLabelOf(t, question)}`, href: talentAppRoutes.cover });
  }
  // 대화로 선택 문항에 새 항목 추가.
  function add(question: string, text: string) {
    const t = text.trim();
    if (!t) return;
    const { doc: next, id } = addCoverItem(doc, question, t);
    onChange(next);
    logCover(id, question, t);
  }
  // AI 없이 해당 문항에 빈 항목을 바로 추가(직접 작성용).
  function addBlank(question: string) {
    const { doc: next } = addCoverItem(doc, question, "");
    onChange(next);
  }

  const questions = coverQuestions(doc);
  // 문항 이름 변경 — 목록과 그 문항에 속한 항목까지 같이 바꿔 링크 유지.
  function renameQuestion(idx: number, next: string) {
    const prev = questions[idx];
    if (prev === next) return;
    const nextQuestions = questions.map((q, i) => (i === idx ? next : q));
    const items = doc.items.map((it) => (it.question === prev ? { ...it, question: next } : it));
    // 목표 글자 수는 문항명을 키로 쓰므로 rename 시 같이 옮긴다(안 하면 설정이 조용히 사라진다).
    let targetChars = doc.targetChars;
    if (targetChars && prev in targetChars) {
      const { [prev]: moved, ...rest } = targetChars;
      targetChars = { ...rest, [next]: moved };
    }
    onChange({ ...doc, questions: nextQuestions, items, targetChars });
  }
  // 새 문항 추가 — 이름 중복 피해 기본 이름 부여(사용자가 바로 수정 가능).
  function addQuestion() {
    const base = t("새 문항","New section","新问题","Mục mới","新しい設問","Bagian baru");
    let name = base;
    let n = 2;
    while (questions.includes(name)) name = `${base} ${n++}`;
    onChange({ ...doc, questions: [...questions, name] });
  }
  // 문항 삭제 — 목록에서 제거하고 그 문항의 항목도 함께 삭제.
  function removeQuestion(idx: number) {
    const q = questions[idx];
    const { [q]: _dropped, ...targetChars } = doc.targetChars ?? {};
    onChange({
      ...doc,
      questions: questions.filter((_, i) => i !== idx),
      items: doc.items.filter((it) => it.question !== q),
      targetChars
    });
  }

  // 이력서를 엔진이 기대하는 구조(경험/학력/스킬/어학)로 접어둔다 — 프롬프트 1번 규칙이
  // "제공된 정보 밖의 사실 금지"라서, 이 컨텍스트가 곧 AI가 쓸 수 있는 재료의 전부다.
  const aiResume = useMemo<CoverAiResumeContext>(() => buildCoverAiResumeContext(resume), [resume]);
  // 문서 단위 AI 입력(공고·소재)을 한 곳에 모아 ItemRow 로 내린다.
  const aiShared = useMemo(
    () => ({
      companyName: doc.companyName?.trim() || undefined,
      jobText: doc.jobText?.trim() || undefined,
      keywords: (doc.keywords ?? []).map((k) => k.trim()).filter(Boolean).slice(0, 10)
    }),
    [doc.companyName, doc.jobText, doc.keywords]
  );
  // 문항별 AI 초안 — 이력서·공고·소재·목표 글자 수를 모두 넘겨 처음부터 쓴다(1P 소모).
  const [draftingQ, setDraftingQ] = useState<string | null>(null);
  async function aiDraft(question: string) {
    if (draftingQ) return;
    setDraftingQ(question);
    try {
      const text = await generateCoverLetter({
        mode: "draft",
        prompt: question,
        targetChars: doc.targetChars?.[question],
        ...aiShared,
        ...aiResume
      });
      const { doc: next, id } = addCoverItem(doc, question, text);
      onChange(next);
      logCover(id, question, text);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
    } catch (err) {
      if (err instanceof AiQuotaError) void openCharge();
      else console.error("[cover/draft] failed", err);
    } finally {
      setDraftingQ(null);
    }
  }
  function setTargetChars(question: string, value: number | null) {
    const next = { ...(doc.targetChars ?? {}) };
    if (value == null) delete next[question];
    else next[question] = value;
    onChange({ ...doc, targetChars: next });
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-5">
        {/* 상단 기본정보 카드에는 사진 미표시 — 사진은 문서(미리보기)에만. */}
        <ProfileCard info={basicInfo} showPhoto={false} />

        <ResumePhotoRow label={t("자기소개서 사진","Cover letter photo","求职信照片","Ảnh thư xin việc","自己PR写真","Foto surat lamaran")} on={doc.showPhoto === true} onChange={(v) => onChange({ ...doc, showPhoto: v })} />

        {/* 지원 공고·소재 — AI 초안/다듬기의 그라운딩 소스. 비워두면 이력서만 근거로 쓴다. */}
        <JobTargetCard doc={doc} onChange={onChange} />
        <KeywordsCard doc={doc} onChange={onChange} />

        <ChatPanel name={basicInfo.realName} resumeText={resumeText} questions={questions} onAdd={add} />

        {questions.map((q, idx) => {
          const items = doc.items.filter((it) => it.question === q);
          return (
            <CollapsibleSection
              key={idx}
              emoji={coverQuestionEmoji(q)}
              title={q}
              count={items.length}
              defaultOpen={items.length > 0}
              addLabel={t("직접 추가","Add","直接添加","Thêm","直接追加","Tambah")}
              onAdd={() => addBlank(q)}
              onRename={(v) => renameQuestion(idx, v)}
              onRemoveSection={() => removeQuestion(idx)}
              removeLabel={t("문항 삭제","Delete section","删除问题","Xóa mục","設問を削除","Hapus bagian")}
              onAiDraft={() => void aiDraft(q)}
              aiDraftLabel={t("AI 초안","AI draft","AI 草稿","Nháp AI","AI下書き","Draf AI")}
              aiBusy={draftingQ === q}
            >
              <TargetCharsRow value={doc.targetChars?.[q] ?? null} onChange={(v) => setTargetChars(q, v)} />
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#E5E8EB] bg-[#FAFBFC] px-4 py-5 text-center text-[13px] text-[#B0B8C1]">{t("‘직접 추가’로 답변을 직접 작성하거나, 위 AI 대화로 추가하세요.","Use ‘Add’ to write an answer, or add via the AI chat above.","用“直接添加”手动填写，或通过上方 AI 对话添加。","Dùng ‘Thêm’ để tự viết, hoặc thêm qua AI phía trên.","「直接追加」で自分で書くか、上のAI対話で追加してください。","Gunakan ‘Tambah’ untuk menulis, atau via chat AI di atas.")}</p>
              ) : null}
              {items.map((it) => (
                <ItemRow
                  key={it.id}
                  text={it.text}
                  question={q}
                  targetChars={doc.targetChars?.[q] ?? null}
                  shared={aiShared}
                  aiResume={aiResume}
                  onChange={(v) => setText(it.id, v)}
                  onRemove={() => remove(it.id)}
                  onQuota={openCharge}
                />
              ))}
            </CollapsibleSection>
          );
        })}

        {/* 문항 추가 — 나만의 자기소개서 문항을 새로 만든다. */}
        <button
          type="button"
          onClick={addQuestion}
          className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#CBD5E7] bg-[#FAFBFF] px-4 py-3.5 text-[13.5px] font-bold text-[#0B46E8] transition hover:border-[#0B46E8]/50 hover:bg-[#F2F6FF]"
        >
          <Plus className="h-4 w-4" weight="bold" /> {t("문항 추가","Add a section","添加问题","Thêm mục","設問を追加","Tambah bagian")}
        </button>
      </div>

      <aside className="hidden lg:sticky lg:top-24 lg:block">
        <div className="mb-2 flex items-center justify-end">
          <Link href={talentAppRoutes.coverPreview} className="inline-flex items-center gap-1 text-[12px] font-bold text-[#0B46E8] hover:underline">
            {t("전체 보기","View full","查看全部","Xem đầy đủ","全体を見る","Lihat penuh")} <ArrowSquareOut className="h-3.5 w-3.5" />
          </Link>
        </div>
        <CoverA4Preview doc={doc} info={basicInfo} />
      </aside>

      {chargeOpen && usage ? (
        <AiTicketStatusModal remaining={usage.remaining} resetAt={usage.resetAt || null} dailyGrant={usage.dailyGrant} onClose={() => setChargeOpen(false)} />
      ) : null}
    </div>
  );
}

// 접을 수 있는 섹션(문항) — 타이틀은 직접 편집 가능, '직접 추가'·'문항 삭제'·화살표.
function CollapsibleSection({ emoji, title, count, children, defaultOpen = true, onAdd, addLabel, onRename, onRemoveSection, removeLabel, onAiDraft, aiDraftLabel, aiBusy = false }: { emoji: string; title: string; count: number; children: React.ReactNode; defaultOpen?: boolean; onAdd?: () => void; addLabel?: string; onRename?: (v: string) => void; onRemoveSection?: () => void; removeLabel?: string; onAiDraft?: () => void; aiDraftLabel?: string; aiBusy?: boolean }) {
  const t = usePlatformT();
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="flex flex-col gap-2.5 border-t border-[#EEF1F5] pt-5">
      <div className="flex w-full items-center gap-1.5">
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={title} className="shrink-0 text-[18px] leading-none">
          <span aria-hidden>{emoji}</span>
        </button>
        {onRename ? (
          <input
            value={title}
            onChange={(e) => onRename(e.target.value)}
            aria-label={t("문항 이름","Section title","问题名称","Tên mục","設問名","Judul bagian")}
            placeholder={t("문항 이름","Section title","问题名称","Tên mục","設問名","Judul bagian")}
            className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-[18px] font-black tracking-[-0.02em] text-[#0B1227] outline-none transition hover:border-[#E5E8EB] focus:border-[#0B46E8]/40 focus:bg-white placeholder:font-bold placeholder:text-[#C4CAD2]"
          />
        ) : (
          <h2 className="flex-1 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
        )}
        <span className="shrink-0 text-[13px] font-bold text-[#B0B8C1]">{count}</span>
        {onAiDraft ? (
          <button
            type="button"
            onClick={() => { onAiDraft(); setOpen(true); }}
            disabled={aiBusy}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#0B46E8] px-2.5 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50"
          >
            <Sparkle className="h-3.5 w-3.5" weight="fill" />
            {aiBusy ? t("쓰는 중…","Writing…","撰写中…","Đang viết…","作成中…","Menulis…") : aiDraftLabel}
          </button>
        ) : null}
        {onAdd ? (
          <button
            type="button"
            onClick={() => { onAdd(); setOpen(true); }}
            className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#EDF1FD] px-2.5 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC]"
          >
            <Plus className="h-3.5 w-3.5" weight="bold" /> {addLabel}
          </button>
        ) : null}
        {onRemoveSection ? (
          <button
            type="button"
            onClick={onRemoveSection}
            aria-label={removeLabel}
            title={removeLabel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#C4CAD2] transition hover:bg-[#FDECEE] hover:text-[#F04452]"
          >
            <Trash className="h-4 w-4" />
          </button>
        ) : null}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={title} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#C4CAD2] transition hover:bg-[#F2F4F6]">
          <CaretDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} weight="bold" />
        </button>
      </div>
      {open ? <div className="flex flex-col gap-2.5">{children}</div> : null}
    </section>
  );
}

interface ChatMsg {
  id: number;
  role: "user" | "ai";
  text: string;
}

function ChatPanel({ name, resumeText, questions, onAdd }: { name: string; resumeText: string; questions: string[]; onAdd: (question: string, text: string) => void }) {
  const t = usePlatformT();
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
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    const question = questions[choice] ?? questions[0];
    setValue("");
    setMessages((m) => [...m, { id: ++seq.current, role: "user", text: trimmed }]);
    setPending(true);
    const text = await coverChat({ note: trimmed, question, name, resumeText });
    onAdd(question, text);
    const qLabel = coverQuestionLabelOf(t, question);
    setMessages((m) => [...m, { id: ++seq.current, role: "ai", text: `${coverQuestionEmoji(question)} ${t(`'${qLabel}'에 항목을 추가했어요. 미리보기에서 확인해보세요.`, `Added an item to '${qLabel}'. Check it in the preview.`, `已向「${qLabel}」添加条目。请在预览中查看。`, `Đã thêm mục vào '${qLabel}'. Xem trong bản xem trước.`, `「${qLabel}」に項目を追加しました。プレビューで確認してください。`, `Menambahkan item ke '${qLabel}'. Cek di pratinjau.`)}` }]);
    setPending(false);
  }

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white">
      <div className="flex items-center gap-1.5 px-4 pt-3">
        <Sparkle className="h-[16px] w-[16px] text-[#0B46E8]" weight="fill" />
        <p className="text-[13.5px] font-bold text-[#191F28]">{t("AI로 편집","Edit with AI","用 AI 编辑","Sửa bằng AI","AIで編集","Edit dengan AI")}</p>
        <span className="text-[12px] text-[#8B95A1]">{t("— 적으면 알맞은 문항에 반영돼요","— write and it goes to the right question","— 输入后会反映到相应问题","— viết vào sẽ vào đúng câu hỏi","— 書けば適切な設問に反映されます","— tulis, masuk ke pertanyaan yang tepat")}</span>
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
              <p className="rounded-2xl rounded-tl-md border border-[#EEF1F5] bg-[#F5F8FF] px-3.5 py-2 text-[13.5px] text-[#8B95A1]">{t("AI가 정리 중…","AI is organizing…","AI 正在整理…","AI đang sắp xếp…","AIが整理中…","AI sedang menyusun…")}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* 문항 선택 */}
      <div className="flex flex-wrap gap-1.5 px-3 pt-3">
        {questions.map((q, i) => (
          <ChipButton key={i} label={`${coverQuestionEmoji(q)} ${coverQuestionLabelOf(t, q)}`} active={choice === i} onClick={() => setChoice(i)} />
        ))}
      </div>

      <div className="p-3">
        <div className="flex items-end gap-2 rounded-xl bg-[#F5F6F8] p-2.5">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={4}
            placeholder={t("예) 카페 알바에서 배운 책임감을 지원 동기에 녹여줘","e.g. Weave the responsibility I learned at a cafe job into my motivation","例）把在咖啡店打工学到的责任感融入应聘动机","VD) Lồng tinh thần trách nhiệm học được khi làm quán cà phê vào động cơ ứng tuyển","例）カフェバイトで学んだ責任感を志望動機に盛り込んで","Cth) Masukkan rasa tanggung jawab dari kerja kafe ke motivasi")}
            className="min-h-[112px] flex-1 resize-y bg-transparent px-3 py-2.5 text-[14px] leading-relaxed text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
          />
          <button
            type="button"
            onClick={send}
            disabled={!value.trim() || pending}
            aria-label={t("보내기","Send","发送","Gửi","送信","Kirim")}
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
  targetChars,
  shared,
  aiResume,
  onChange,
  onRemove,
  onQuota
}: {
  text: string;
  question: string;
  targetChars: number | null;
  shared: { companyName?: string; jobText?: string; keywords: string[] };
  aiResume: CoverAiResumeContext;
  onChange: (v: string) => void;
  onRemove: () => void;
  onQuota: () => void;
}) {
  const t = usePlatformT();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // AI 직전 원문 — 다듬기가 원문을 덮어쓰므로 되돌릴 수 있게 들고 있는다.
  // 사용자가 직접 타이핑을 시작하면 되돌릴 기준이 낡으므로 비운다(아래 textarea onChange).
  const [prevText, setPrevText] = useState<string | null>(null);
  // AI 다듬기 스타일 — 백엔드 POLISH_STYLE_GUIDE 6종을 전부 노출한다(각 1P 소모).
  // 자소서에서는 impact(강점 부각)·achievement(성과 중심)가 오히려 자주 필요하다.
  const polishChoices: { style: PolishStyle; label: string; hint: string }[] = [
    { style: "natural", label: t("자연스럽게","Natural","自然","Tự nhiên","自然に","Natural"), hint: t("어색한 문장만 다듬기","Smooth out awkward lines","只顺一下语句","Chỉ làm mượt câu","不自然な文だけ整える","Perhalus kalimat") },
    { style: "concise", label: t("간결하게","Concise","简洁","Ngắn gọn","簡潔に","Ringkas"), hint: t("핵심만 짧게","Keep only the essentials","只留核心","Chỉ giữ ý chính","要点だけ短く","Inti saja") },
    { style: "expand", label: t("구체적으로","Detailed","具体","Chi tiết","具体的に","Rinci"), hint: t("맥락·경험을 풍부하게","Add context & detail","补充背景与经历","Thêm bối cảnh, trải nghiệm","文脈・経験を補足","Tambah konteks & pengalaman") },
    { style: "impact", label: t("강점 부각","Impact","突出优势","Nổi bật","強みを前面に","Tonjolkan"), hint: t("자신감 있는 톤으로","Confident tone","自信的语气","Giọng tự tin","自信のある文体","Nada percaya diri") },
    { style: "achievement", label: t("성과 중심","Achievement","成果导向","Theo thành tích","成果中心","Fokus hasil"), hint: t("한 일과 결과를 앞으로","Lead with what you did & got","把做过的事和结果前置","Đưa việc làm & kết quả lên","やった事と結果を前に","Aksi & hasil di depan") },
    { style: "professional", label: t("정중하게","Professional","正式","Trang trọng","丁寧に","Formal"), hint: t("격식 있는 전문가 톤","Formal, professional tone","专业正式语气","Giọng chuyên nghiệp","丁寧な文体","Nada profesional") }
  ];

  const value = text ?? "";

  // 다듬기도 자소서 엔진으로 — 문항(prompt)·공고·소재·목표 글자 수·이력서를 함께 넘겨야
  // '문항 의도에 맞게', '공고와 1:1로', '소재 누락 없이' 규칙이 작동한다.
  async function refine(style: PolishStyle) {
    if (busy || !value.trim()) return;
    setMenuOpen(false);
    setBusy(true);
    try {
      const polished = await generateCoverLetter({
        mode: "polish",
        style,
        prompt: question,
        current: value.trim(),
        targetChars: targetChars ?? undefined,
        ...shared,
        ...aiResume
      });
      if (polished) {
        setPrevText(value);
        onChange(polished);
      }
      if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
    } catch (err) {
      if (err instanceof AiQuotaError) onQuota();
      else console.error("[cover/polish] failed", err);
    } finally {
      setBusy(false);
    }
  }

  // 글자 수 — 자소서는 글자 수 제한이 곧 제출 조건이라 상시 노출한다.
  // 색 기준은 백엔드 지시와 맞춘다(최소 target, 상한 target*1.2).
  const len = value.length;
  const over = targetChars != null ? Math.round(targetChars * 1.2) : null;
  const tone =
    targetChars == null
      ? "text-[#B0B8C1]"
      : len < targetChars
        ? "text-[#C79A00]"
        : over != null && len > over
          ? "text-[#F04452]"
          : "text-[#00A05B]";
  const ratio = targetChars != null && targetChars > 0 ? Math.min(1, len / targetChars) : 0;
  const barTone = targetChars == null ? "bg-[#E5E8EB]" : len < targetChars ? "bg-[#F5C400]" : over != null && len > over ? "bg-[#F04452]" : "bg-[#00C473]";

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <textarea
        value={value}
        onChange={(e) => { if (prevText !== null) setPrevText(null); onChange(e.target.value); }}
        rows={4}
        className="min-h-[116px] w-full resize-y break-keep rounded-lg bg-[#F5F6F8] px-3.5 py-3 text-[14px] leading-[1.8] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
      />
      {prevText !== null && prevText !== value ? (
        <AiRevisionBar
          before={prevText}
          after={value}
          onUndo={() => { onChange(prevText); setPrevText(null); }}
          onAccept={() => setPrevText(null)}
        />
      ) : null}
      <div className="mt-2 flex items-center gap-2">
        {targetChars != null ? (
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]" aria-hidden>
            <div className={`h-full rounded-full transition-all ${barTone}`} style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
        ) : (
          <div className="flex-1" />
        )}
        <span className={`shrink-0 text-[11.5px] font-bold tabular-nums ${tone}`}>
          {targetChars != null ? `${len} / ${targetChars}${t("자","","字","ký tự","字","krt")}` : `${len}${t("자","","字","ký tự","字","krt")}`}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => { if (!busy && value.trim()) setMenuOpen((v) => !v); }}
            disabled={busy || !value.trim()}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="inline-flex items-center gap-1 rounded-lg bg-[#EDF1FD] px-2.5 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC] disabled:opacity-40"
          >
            <Sparkle className="h-3.5 w-3.5" weight="fill" /> {busy ? t("다듬는 중…","Polishing…","润色中…","Đang chỉnh…","整えています…","Memoles…") : t("AI로 다듬기","Polish with AI","用 AI 润色","Chỉnh bằng AI","AIで整える","Poles dengan AI")}
            {!busy ? <CaretDown className={`h-3 w-3 transition-transform ${menuOpen ? "rotate-180" : ""}`} weight="bold" /> : null}
          </button>
          {menuOpen ? (
            <>
              <button type="button" aria-hidden tabIndex={-1} onClick={() => setMenuOpen(false)} className="fixed inset-0 z-10 cursor-default" />
              <div role="menu" className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-xl border border-[#E5E8EB] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.10)]">
                {polishChoices.map((c) => (
                  <button
                    key={c.style}
                    type="button"
                    role="menuitem"
                    onClick={() => refine(c.style)}
                    className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left transition hover:bg-[#F6F8FB]"
                  >
                    <span className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#0B1227]">{c.label}</span>
                      <span className="text-[11px] text-[#8B95A1]">{c.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}
        </div>
        <button type="button" onClick={onRemove} aria-label={t("삭제","Delete","删除","Xóa","削除","Hapus")} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#F04452]">
          <Trash className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── 지원 공고(JD) — 있으면 프롬프트의 '공고 1:1 연결' 규칙이 켜지고, 없으면 이력서만 근거로 쓴다.
// 백엔드가 jobText 를 4000자로 자르므로 입력도 같은 상한을 둔다.
const JOB_TEXT_MAX = 4000;

function JobTargetCard({ doc, onChange }: { doc: CoverDoc; onChange: (d: CoverDoc) => void }) {
  const t = usePlatformT();
  const has = Boolean(doc.companyName?.trim() || doc.jobText?.trim());
  const [open, setOpen] = useState(has);
  const jd = doc.jobText ?? "";
  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2 text-left">
        <Buildings className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" />
        <span className="flex-1 text-[13.5px] font-bold text-[#0B1227]">
          {t("지원 공고","Target job posting","目标招聘","Tin tuyển dụng","応募求人","Lowongan target")}
        </span>
        <span className="shrink-0 text-[11.5px] font-bold text-[#8B95A1]">
          {has
            ? (doc.companyName?.trim() || t("공고 입력됨","Added","已填写","Đã nhập","入力済み","Terisi"))
            : t("선택","Optional","可选","Tùy chọn","任意","Opsional")}
        </span>
        <CaretDown className={`h-4 w-4 shrink-0 text-[#C4CAD2] transition-transform ${open ? "rotate-180" : ""}`} weight="bold" />
      </button>
      {open ? (
        <div className="mt-3 flex flex-col gap-2.5">
          <p className="text-[12px] leading-[1.6] text-[#8B95A1]">
            {t(
              "공고를 넣으면 AI가 그 회사가 요구하는 역량에 내 경험을 직접 연결해 씁니다.",
              "With a posting, the AI ties your experience to what that company asks for.",
              "填入招聘后，AI 会把你的经历与该公司要求直接对应。",
              "Có tin tuyển dụng, AI sẽ nối kinh nghiệm của bạn với yêu cầu công ty.",
              "求人を入れると、AIが企業の要件にあなたの経験を結び付けます。",
              "Dengan lowongan, AI menghubungkan pengalaman Anda dengan syarat perusahaan."
            )}
          </p>
          <input
            value={doc.companyName ?? ""}
            onChange={(e) => onChange({ ...doc, companyName: e.target.value.slice(0, 120) })}
            placeholder={t("회사명","Company","公司名","Tên công ty","会社名","Nama perusahaan")}
            aria-label={t("회사명","Company","公司名","Tên công ty","会社名","Nama perusahaan")}
            className="w-full rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[13.5px] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
          />
          <textarea
            value={jd}
            onChange={(e) => onChange({ ...doc, jobText: e.target.value.slice(0, JOB_TEXT_MAX) })}
            rows={4}
            placeholder={t("공고 내용을 붙여넣어 주세요","Paste the job posting","粘贴招聘内容","Dán nội dung tin","求人内容を貼り付け","Tempel isi lowongan")}
            aria-label={t("공고 내용","Job posting","招聘内容","Nội dung tin","求人内容","Isi lowongan")}
            className="min-h-[96px] w-full resize-y break-anywhere rounded-lg bg-[#F5F6F8] px-3.5 py-3 text-[13px] leading-[1.7] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] tabular-nums text-[#B0B8C1]">{jd.length} / {JOB_TEXT_MAX}</span>
            {has ? (
              <button
                type="button"
                onClick={() => onChange({ ...doc, companyName: "", jobText: "" })}
                className="text-[11.5px] font-bold text-[#8B95A1] transition hover:text-[#F04452]"
              >
                {t("지우기","Clear","清除","Xóa","クリア","Hapus")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

// ── 반드시 넣을 소재 — 프롬프트에서 "하나라도 빠지면 실패한 답변"으로 처리되는 최우선 입력.
// 이력서에 없는 개인 사연(예: "아빠가 삼성전자 출신")도 사실로 간주해 이야기로 녹여준다.
const KEYWORDS_MAX = 10;

function KeywordsCard({ doc, onChange }: { doc: CoverDoc; onChange: (d: CoverDoc) => void }) {
  const t = usePlatformT();
  const list = doc.keywords ?? [];
  const [draft, setDraft] = useState("");
  function commit() {
    const v = draft.trim().slice(0, 40);
    if (!v || list.length >= KEYWORDS_MAX || list.includes(v)) { setDraft(""); return; }
    onChange({ ...doc, keywords: [...list, v] });
    setDraft("");
  }
  return (
    <section className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" />
        <span className="flex-1 text-[13.5px] font-bold text-[#0B1227]">
          {t("반드시 넣을 소재","Must-include points","必写素材","Nội dung bắt buộc","必ず入れる要素","Poin wajib")}
        </span>
        <span className="shrink-0 text-[11px] tabular-nums text-[#B0B8C1]">{list.length}/{KEYWORDS_MAX}</span>
      </div>
      <p className="mt-1.5 text-[12px] leading-[1.6] text-[#8B95A1]">
        {t(
          "이력서에 없는 내 이야기도 적어주세요. AI가 빠뜨리지 않고 녹여 씁니다.",
          "Add your own stories too — the AI weaves every one in.",
          "也可写简历里没有的经历，AI 会全部融入。",
          "Thêm câu chuyện riêng — AI sẽ đưa vào hết.",
          "履歴書にない話も書いてください。AIが必ず織り込みます。",
          "Tambahkan cerita Anda — AI memasukkan semuanya."
        )}
      </p>
      {list.length ? (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {list.map((k) => (
            <span key={k} className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] py-1 pl-2.5 pr-1.5 text-[12px] font-bold text-[#0B46E8]">
              <span className="break-anywhere">{k}</span>
              <button
                type="button"
                onClick={() => onChange({ ...doc, keywords: list.filter((x) => x !== k) })}
                aria-label={`${k} ${t("삭제","Remove","删除","Xóa","削除","Hapus")}`}
                className="flex h-4 w-4 items-center justify-center rounded-full text-[#0B46E8]/60 transition hover:bg-white hover:text-[#F04452]"
              >
                <X className="h-3 w-3" weight="bold" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
      {list.length < KEYWORDS_MAX ? (
        <div className="mt-2.5 flex gap-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
            placeholder={t("예: 교환학생 경험","e.g. exchange program","例：交换生经历","VD: du học trao đổi","例：交換留学","mis. program pertukaran")}
            aria-label={t("소재 추가","Add a point","添加素材","Thêm nội dung","要素を追加","Tambah poin")}
            className="min-w-0 flex-1 rounded-lg bg-[#F5F6F8] px-3.5 py-2.5 text-[13.5px] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
          />
          <button
            type="button"
            onClick={commit}
            disabled={!draft.trim()}
            className="shrink-0 rounded-lg bg-[#EDF1FD] px-3 py-2.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC] disabled:opacity-40"
          >
            {t("추가","Add","添加","Thêm","追加","Tambah")}
          </button>
        </div>
      ) : null}
    </section>
  );
}

// ── 문항별 목표 글자 수 — 기업 자소서는 글자 수 제한이 제출 조건이라 문항마다 따로 잡는다.
// '자유'면 프롬프트에 길이 지시를 넣지 않는다(백엔드 targetChars 미전송).
const TARGET_CHOICES = [500, 700, 800, 1000, 1500];

function TargetCharsRow({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const t = usePlatformT();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-[11.5px] font-bold text-[#8B95A1]">
        {t("목표 글자 수","Target length","目标字数","Độ dài mục tiêu","目標文字数","Target panjang")}
      </span>
      <button
        type="button"
        onClick={() => onChange(null)}
        aria-pressed={value == null}
        className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold transition ${value == null ? "bg-[#0B1227] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E8EBED]"}`}
      >
        {t("자유","Any","不限","Tự do","自由","Bebas")}
      </button>
      {TARGET_CHOICES.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-pressed={value === n}
          className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold tabular-nums transition ${value === n ? "bg-[#0B1227] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E8EBED]"}`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
