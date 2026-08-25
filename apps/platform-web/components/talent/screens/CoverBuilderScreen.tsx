"use client";

// 자기소개서 — 문항별 직접 편집 + AI로 다듬기/초안. 옆에 A4 미리보기(전체 보기 링크).
// 1개 문서. 기본 정보 미등록 시 게이트. mock 저장 + /api/cover-assist.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Sparkle, Eye, ArrowSquareOut, Trash, PaperPlaneTilt, CaretDown, Plus } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { ProfileGate } from "../career/ProfileGate";
import { ProfileCard } from "../career/ProfileCard";
import { ResumePhotoRow } from "../career/ResumePhotoRow";
import { CoverA4Preview } from "../career/CoverA4";
import { TLoading } from "../ui/primitives";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useBasicInfo, isBasicInfoComplete, type BasicInfo } from "../../../lib/talent/basic-info";
import { useResumeDoc, useRenewalDocsStatus } from "../../../lib/talent/resume-doc";
import { SECTION_META } from "../../../lib/talent/career-chat";
import { useCoverDoc, saveCoverDoc, generateCoverDoc, addCoverItem, coverQuestionEmoji, coverQuestions, type CoverDoc } from "../../../lib/talent/cover-doc";
import { coverQuestionLabelOf } from "../../../lib/talent/career-labels";
import { coverChat } from "../../../lib/talent/cover-assist-client";
import { polishSelfIntro, getAiUsage, AiQuotaError, type PolishStyle, type AiUsage } from "../../../lib/resume-maker-client";
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

        {!ready ? <ProfileGate /> : doc ? <Editor doc={doc} basicInfo={basicInfo} resumeText={resumeText} onChange={update} /> : <TLoading />}
      </div>
    </TalentAppShell>
  );
}

function Editor({ doc, basicInfo, resumeText, onChange }: { doc: CoverDoc; basicInfo: BasicInfo; resumeText: string; onChange: (d: CoverDoc) => void }) {
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
    onChange({ ...doc, questions: nextQuestions, items });
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
    onChange({ ...doc, questions: questions.filter((_, i) => i !== idx), items: doc.items.filter((it) => it.question !== q) });
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-6">
      <div className="flex flex-col gap-5">
        {/* 상단 기본정보 카드에는 사진 미표시 — 사진은 문서(미리보기)에만. */}
        <ProfileCard info={basicInfo} showPhoto={false} />

        <ResumePhotoRow label={t("자기소개서 사진","Cover letter photo","求职信照片","Ảnh thư xin việc","自己PR写真","Foto surat lamaran")} on={doc.showPhoto === true} onChange={(v) => onChange({ ...doc, showPhoto: v })} />

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
            >
              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[#E5E8EB] bg-[#FAFBFC] px-4 py-5 text-center text-[13px] text-[#B0B8C1]">{t("‘직접 추가’로 답변을 직접 작성하거나, 위 AI 대화로 추가하세요.","Use ‘Add’ to write an answer, or add via the AI chat above.","用“直接添加”手动填写，或通过上方 AI 对话添加。","Dùng ‘Thêm’ để tự viết, hoặc thêm qua AI phía trên.","「直接追加」で自分で書くか、上のAI対話で追加してください。","Gunakan ‘Tambah’ untuk menulis, atau via chat AI di atas.")}</p>
              ) : null}
              {items.map((it) => (
                <ItemRow
                  key={it.id}
                  text={it.text}
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
function CollapsibleSection({ emoji, title, count, children, defaultOpen = true, onAdd, addLabel, onRename, onRemoveSection, removeLabel }: { emoji: string; title: string; count: number; children: React.ReactNode; defaultOpen?: boolean; onAdd?: () => void; addLabel?: string; onRename?: (v: string) => void; onRemoveSection?: () => void; removeLabel?: string }) {
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
  onChange,
  onRemove,
  onQuota
}: {
  text: string;
  onChange: (v: string) => void;
  onRemove: () => void;
  onQuota: () => void;
}) {
  const t = usePlatformT();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // AI 다듬기 스타일 3종 — 각 1P 소모. concise=간결 · expand=구체 · professional=정중.
  const polishChoices: { style: PolishStyle; label: string; hint: string }[] = [
    { style: "concise", label: t("간결하게","Concise","简洁","Ngắn gọn","簡潔に","Ringkas"), hint: t("핵심만 짧게","Keep only the essentials","只留核心","Chỉ giữ ý chính","要点だけ短く","Inti saja") },
    { style: "expand", label: t("구체적으로","Detailed","具体","Chi tiết","具体的に","Rinci"), hint: t("맥락·경험을 풍부하게","Add context & detail","补充背景与经历","Thêm bối cảnh, trải nghiệm","文脈・経験を補足","Tambah konteks & pengalaman") },
    { style: "professional", label: t("정중하게","Professional","正式","Trang trọng","丁寧に","Formal"), hint: t("격식 있는 전문가 톤","Formal, professional tone","专业正式语气","Giọng chuyên nghiệp","丁寧な文体","Nada profesional") }
  ];

  const value = text ?? "";

  async function refine(style: PolishStyle) {
    if (busy || !value.trim()) return;
    setMenuOpen(false);
    setBusy(true);
    try {
      const polished = await polishSelfIntro({ text: value.trim(), style });
      if (polished) onChange(polished);
      if (typeof window !== "undefined") window.dispatchEvent(new Event("aply:ai-usage-changed"));
    } catch (err) {
      if (err instanceof AiQuotaError) onQuota();
      else console.error("[cover/polish] failed", err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-3.5">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="min-h-[116px] w-full resize-y break-keep rounded-lg bg-[#F5F6F8] px-3.5 py-3 text-[14px] leading-[1.8] text-[#191F28] outline-none placeholder:text-[#B0B8C1]"
      />
      <div className="mt-2.5 flex items-center justify-end gap-1.5">
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
                    <span className="mt-0.5 shrink-0 rounded-md bg-[#EDF1FD] px-1.5 py-0.5 text-[10px] font-bold text-[#0B46E8]">1P</span>
                  </button>
                ))}
                <p className="border-t border-[#F2F4F6] px-3 pb-1 pt-1.5 text-[10.5px] text-[#B0B8C1]">{t("다듬기당 AI 1P 소모","1 AI point per polish","每次润色消耗 1P","1P AI mỗi lần","1回につきAI 1P","1P AI per poles")}</p>
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
