"use client";

// 모듈형 자기소개서 에디터(전체 화면) — 경험 이야기 한 단락(에피소드)을 모듈로 두고,
// 문항·글자 수 제한과 문항별 에피소드 조합을 구성한다.
//
// 이력서 에디터와 같이, 편집하는 자기소개서는 하나다.
//   에피소드 내용 → talent 문서(saveCoverDoc) — 앱·기존 화면이 읽는 원본
//   문항·조합     → 편집 중 행(/members/me/doc-versions, snapshot = null)
// '새 버전으로 저장'은 그 순간의 문항·답변을 읽기 전용 저장본으로 남긴다(회사별 제출본).
import { useMemo, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Copy, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
import { TalentGuard } from "../app/TalentGuard";
import { useToast } from "../../toast/ToastProvider";
import { PDF_PRINT_AREA, PdfDownloadButton, PrintStyles } from "../career/pdf-print";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useRenewalDocsStatus } from "../../../lib/talent/resume-doc";
import { addCoverItem, generateCoverDoc, saveCoverDoc, useCoverDoc, type CoverDoc, type CoverItem } from "../../../lib/talent/cover-doc";
import type { CoverLayout, CoverSnapshot } from "../../../lib/talent/doc-versions";
import {
  addBlock,
  addQuestion,
  answerText,
  autoPlaceCover,
  charCount,
  moveBlockToQuestion,
  moveQuestion,
  nudgeBlock,
  removeBlock,
  removeQuestion,
  resolveCoverLayout,
  toStoredCover,
  updateQuestion,
  type ResolvedCover
} from "../../../lib/talent/cover-layout";
import { polishSelfIntro } from "../../../lib/resume-maker-client";
import { AiPolish } from "./AiPolish";
import { EditorTopBar, Field, FullMessage, SavedPanel, Section, ToolButton, useDocVersionStore } from "./editor-shared";


export function CoverEditorScreen() {
  return (
    <TalentGuard>
      <EditorGate />
    </TalentGuard>
  );
}

function EditorGate() {
  const t = usePlatformT();
  const doc = useCoverDoc();
  const status = useRenewalDocsStatus();
  // 아직 자소서가 없으면 빈 문서로 시작한다 — 첫 에피소드를 쓰는 순간 계정에 저장된다.
  const empty = useMemo(() => generateCoverDoc(), []);

  if (status !== "loaded") return <FullMessage text={t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")} />;
  return <Editor doc={doc ?? empty} />;
}

// ── 에디터 ───────────────────────────────────────────────────

function Editor({ doc }: { doc: CoverDoc }) {
  const t = usePlatformT();
  const toast = useToast();
  const store = useDocVersionStore<CoverLayout, CoverSnapshot>("cover", t);
  const { working, current } = store;
  // 지금 보고 있는 문항과 고른 에피소드. 한 문항 안엔 같은 에피소드가 한 번만 있어 (문항, 에피소드)로 블록이 정해진다.
  const [activeQ, setActiveQ] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // 편집 중 구성 — 앱·기존 화면에서 새로 쓴 단락이 빠지지 않게 원래 문항에 넣어 보여준다.
  const layout: ResolvedCover | null = useMemo(() => {
    if (!working) return null;
    return autoPlaceCover(resolveCoverLayout(working.layout, doc), doc);
  }, [working, doc]);

  if (!working || !current || !layout) {
    return <FullMessage text={t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")} />;
  }

  const copyAnswer = async (question: ResolvedCover["questions"][number], textOf: (id: string) => string) => {
    try {
      await navigator.clipboard.writeText(answerText(question.blocks.map(textOf)));
      toast.success(t("답변을 복사했어요", "Answer copied", "已复制答案", "Đã sao chép câu trả lời", "回答をコピーしました", "Jawaban disalin"));
    } catch {
      toast.error(t("복사하지 못했어요", "Couldn't copy", "无法复制", "Không sao chép được", "コピーできませんでした", "Gagal menyalin"));
    }
  };

  const topBar = (
    <EditorTopBar
      t={t}
      active="cover"
      exitHref="/talent/career/cover"
      working={working}
      saved={store.saved}
      current={current}
      onPick={(id) => {
        store.setCurrentId(id);
        setActiveQ(0);
        setSelectedId(null);
      }}
      onSaveNew={(name) => store.saveAsNew(name, toStoredCover(layout), { cover: doc })}
      saveState={store.saveState}
      right={<PdfDownloadButton />}
    />
  );

  // ── 저장본 보기(읽기 전용) — 문항별 답변 복사는 된다 ──
  if (current.snapshot) {
    const snapDoc = current.snapshot.cover;
    const snapLayout = resolveCoverLayout(current.layout, snapDoc);
    const snapText = (id: string) => snapDoc.items.find((i) => i.id === id)?.text ?? "";
    return (
      <div className="flex h-screen flex-col bg-[#EEF0F3] text-[#191F28] print:block print:h-auto print:bg-white">
        <PrintStyles />
        {topBar}
        <div className="flex min-h-0 flex-1 print:block">
          <main className="min-w-0 flex-1 overflow-auto px-8 py-8 print:overflow-visible print:p-0" aria-label={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
            <div className={`mx-auto flex max-w-[794px] flex-col gap-4 ${PDF_PRINT_AREA}`}>
              {snapLayout.questions.map((question, i) => (
                <QuestionCard key={question.id} t={t} no={i + 1} question={question} textOf={snapText} onCopy={() => void copyAnswer(question, snapText)} />
              ))}
            </div>
          </main>
          <SavedPanel t={t} version={current} onRename={(name) => store.renameSaved(current.id, name)} onDelete={() => void store.removeSaved(current.id)} />
        </div>
      </div>
    );
  }

  const q = Math.min(activeQ, Math.max(layout.questions.length - 1, 0));
  const commitLayout = (next: ResolvedCover) => store.setWorkingLayout(toStoredCover(next));
  const textOf = (id: string) => doc.items.find((i) => i.id === id)?.text ?? "";

  // ── 에피소드 내용(talent 문서 — 앱·기존 화면이 읽는 원본) ──
  const setText = (id: string, text: string) => saveCoverDoc({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  const newEpisode = () => {
    const prompt = layout.questions[q]?.prompt ?? "";
    const { doc: next, id } = addCoverItem(doc, prompt, "");
    saveCoverDoc(next);
    if (layout.questions[q]) commitLayout(addBlock(resolveCoverLayout(toStoredCover(layout), next), next, q, id));
    setSelectedId(id);
  };
  const deleteEpisode = (id: string) => {
    if (!window.confirm(t("이 에피소드를 삭제할까요? 이미 저장한 버전에는 그대로 남아요.", "Delete this episode? Saved versions keep it.", "要删除此经历吗？已保存的版本仍会保留。", "Xóa đoạn này? Các bản đã lưu vẫn giữ.", "このエピソードを削除しますか？保存済みのバージョンには残ります。", "Hapus episode ini? Versi tersimpan tetap menyimpannya."))) return;
    saveCoverDoc({ ...doc, items: doc.items.filter((it) => it.id !== id) });
    setSelectedId(null);
  };

  return (
    <div className="flex h-screen flex-col bg-[#EEF0F3] text-[#191F28] print:block print:h-auto print:bg-white">
      <PrintStyles />
      {topBar}
      <div className="flex min-h-0 flex-1 print:block">
        <EpisodeLibrary
          t={t}
          doc={doc}
          layout={layout}
          activeQ={q}
          selectedId={selectedId}
          textOf={textOf}
          onSelect={setSelectedId}
          onInsert={(id) => {
            commitLayout(addBlock(layout, doc, q, id));
            setSelectedId(id);
          }}
          onNew={newEpisode}
        />
        <main className="min-w-0 flex-1 overflow-auto px-8 py-8 print:overflow-visible print:p-0" aria-label={t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}>
          <div className={`mx-auto flex max-w-[794px] flex-col gap-4 ${PDF_PRINT_AREA}`}>
            {layout.questions.map((question, i) => (
              <QuestionCard
                key={question.id}
                t={t}
                no={i + 1}
                question={question}
                textOf={textOf}
                edit={{
                  active: i === q,
                  selectedId: i === q ? selectedId : null,
                  onActivate: () => setActiveQ(i),
                  onSelectBlock: (id) => {
                    setActiveQ(i);
                    setSelectedId(id);
                  }
                }}
                onCopy={() => void copyAnswer(question, textOf)}
              />
            ))}
            {layout.questions.length === 0 ? (
              <p className="rounded-2xl bg-white px-6 py-10 text-center text-[14px] text-[#6B7684]">
                {t("문항이 없어요. 지원하는 회사의 문항을 추가해 보세요.", "No questions yet. Add the company's questions.", "还没有题目，请添加公司的题目。", "Chưa có câu hỏi. Hãy thêm câu hỏi của công ty.", "設問がありません。企業の設問を追加してください。", "Belum ada pertanyaan. Tambahkan pertanyaan perusahaan.")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => {
                commitLayout(addQuestion(layout, doc, t("새 문항", "New question", "新题目", "Câu hỏi mới", "新しい設問", "Pertanyaan baru")));
                setActiveQ(layout.questions.length);
                setSelectedId(null);
              }}
              className="no-print flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-dashed border-[#C4CAD2] text-[14px] font-semibold text-[#4E5968] hover:bg-white"
            >
              <Plus size={15} weight="bold" />
              {t("문항 추가", "Add question", "添加题目", "Thêm câu hỏi", "設問を追加", "Tambah pertanyaan")}
            </button>
          </div>
        </main>
        <Inspector
          t={t}
          doc={doc}
          layout={layout}
          q={q}
          selectedId={selectedId}
          textOf={textOf}
          onLayout={commitLayout}
          onActiveQ={setActiveQ}
          onSelect={setSelectedId}
          onText={setText}
          onDeleteEpisode={deleteEpisode}
        />
      </div>
    </div>
  );
}

// ── 왼쪽: 에피소드 모음 ──────────────────────────────────────

function EpisodeLibrary({
  t,
  doc,
  layout,
  activeQ,
  selectedId,
  textOf,
  onSelect,
  onInsert,
  onNew
}: {
  t: PlatformT;
  doc: CoverDoc;
  layout: ResolvedCover;
  activeQ: number;
  selectedId: string | null;
  textOf: (id: string) => string;
  onSelect: (id: string) => void;
  onInsert: (id: string) => void;
  onNew: () => void;
}) {
  const active = layout.questions[activeQ];
  const unplaced = new Set(layout.unplaced);
  return (
    <aside className="no-print flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#E5E8EB] bg-white px-4 py-5" aria-label={t("에피소드", "Episodes", "经历", "Đoạn kể", "エピソード", "Episode")}>
      <div className="px-1">
        <p className="text-[15px] font-bold">{t("에피소드 모듈", "Episode modules", "经历模块", "Mô-đun đoạn kể", "エピソードモジュール", "Modul episode")}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#6B7684]">
          {t(
            "경험 이야기 한 단락이 모듈이에요. 선택한 문항에 넣고, 문항마다 조합을 바꿔요.",
            "Each story paragraph is a module. Put it into the selected question and mix them per question.",
            "每段经历故事都是一个模块。放入所选题目，并按题目组合。",
            "Mỗi đoạn kể là một mô-đun. Đưa vào câu hỏi đang chọn và kết hợp theo từng câu.",
            "経験の一段落がモジュールです。選んだ設問に入れ、設問ごとに組み合わせを変えます。",
            "Setiap paragraf cerita adalah modul. Masukkan ke pertanyaan terpilih dan kombinasikan per pertanyaan."
          )}
        </p>
      </div>
      <button type="button" onClick={onNew} className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#C4CAD2] text-[13px] font-semibold text-[#4E5968] hover:bg-[#F7F8FA]">
        <Plus size={14} weight="bold" />
        {t("새 에피소드 쓰기", "Write a new episode", "写新经历", "Viết đoạn mới", "新しいエピソードを書く", "Tulis episode baru")}
      </button>
      {doc.items.length === 0 ? (
        <p className="px-1 text-[12px] text-[#8B95A1]">{t("아직 에피소드가 없어요.", "No episodes yet.", "还没有经历。", "Chưa có đoạn kể.", "まだエピソードがありません。", "Belum ada episode.")}</p>
      ) : null}
      <ul className="flex flex-col gap-2">
        {doc.items.map((it) => {
          const usedIn = layout.questions.map((x, i) => (x.blocks.includes(it.id) ? i + 1 : 0)).filter(Boolean);
          const inActive = !!active?.blocks.includes(it.id);
          const usage = usedIn.length
            ? t(`문항 ${usedIn.join("·")}에 사용`, `Used in Q${usedIn.join(", Q")}`, `用于题目 ${usedIn.join("·")}`, `Dùng ở câu ${usedIn.join(", ")}`, `設問 ${usedIn.join("·")} で使用`, `Dipakai di P${usedIn.join(", P")}`)
            : unplaced.has(it.id)
              ? t("새 에피소드", "New", "新经历", "Mới", "新規", "Baru")
              : t("안 씀", "Not used", "未使用", "Chưa dùng", "未使用", "Tidak dipakai");
          return (
            <li key={it.id}>
              <div
                className={`flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 ${selectedId === it.id ? "border-[#0B46E8] bg-[#F5F8FF]" : "border-[#E5E8EB] bg-white"}`}
              >
                <button type="button" onClick={() => onSelect(it.id)} className="flex flex-col gap-1 text-left">
                  {it.question ? <span className="text-[11px] font-semibold text-[#0B46E8]">{it.question}</span> : null}
                  <span className="line-clamp-3 text-[12.5px] leading-relaxed text-[#333D4B]">{textOf(it.id).trim() || t("(내용 없음)", "(empty)")}</span>
                </button>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] ${usedIn.length ? "text-[#6B7684]" : unplaced.has(it.id) ? "font-bold text-[#B25E09]" : "text-[#8B95A1]"}`}>{usage}</span>
                  {active ? (
                    <button
                      type="button"
                      onClick={() => onInsert(it.id)}
                      disabled={inActive}
                      className="shrink-0 rounded-md px-2 py-1 text-[11.5px] font-bold text-[#0B46E8] hover:bg-[#EDF1FD] disabled:text-[#B0B8C1] disabled:hover:bg-transparent"
                    >
                      {inActive
                        ? t(`문항 ${activeQ + 1}에 있음`, `In Q${activeQ + 1}`, `已在题目 ${activeQ + 1}`, `Đã ở câu ${activeQ + 1}`, `設問 ${activeQ + 1} にあり`, `Ada di P${activeQ + 1}`)
                        : t(`문항 ${activeQ + 1}에 넣기`, `Add to Q${activeQ + 1}`, `放入题目 ${activeQ + 1}`, `Thêm vào câu ${activeQ + 1}`, `設問 ${activeQ + 1} に入れる`, `Masukkan ke P${activeQ + 1}`)}
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}

// ── 가운데: 문항 카드 ────────────────────────────────────────

/** 문항 카드. edit 가 없으면(저장본) 읽기 전용 — 고르기·강조 없이 보여 주고 답변 복사만 된다. */
function QuestionCard({
  t,
  no,
  question,
  textOf,
  edit,
  onCopy
}: {
  t: PlatformT;
  no: number;
  question: ResolvedCover["questions"][number];
  textOf: (id: string) => string;
  edit?: { active: boolean; selectedId: string | null; onActivate: () => void; onSelectBlock: (id: string) => void };
  onCopy: () => void;
}) {
  const count = charCount(answerText(question.blocks.map(textOf)));
  const active = !!edit?.active;
  const selectedId = edit?.selectedId ?? null;
  return (
    <section
      onClick={edit?.onActivate}
      aria-label={t(`문항 ${no}`, `Question ${no}`, `题目 ${no}`, `Câu ${no}`, `設問 ${no}`, `Pertanyaan ${no}`)}
      className={`break-inside-avoid rounded-2xl bg-white px-7 py-6 print:rounded-none print:px-0 ${active ? "ring-2 ring-[#0B46E8] print:ring-0" : "ring-1 ring-[#E5E8EB] print:ring-0"}`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#191F28] text-[12px] font-bold text-white">{no}</span>
        <h2 className="min-w-0 flex-1 text-[15.5px] font-bold leading-snug">{question.prompt || t("(문항 없음)", "(no prompt)")}</h2>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCopy();
          }}
          aria-label={t(`문항 ${no} 답변 복사`, `Copy answer ${no}`)}
          title={t("답변 복사 — 지원서에 붙여 넣기", "Copy answer to paste into an application", "复制答案", "Sao chép câu trả lời", "回答をコピー", "Salin jawaban")}
          className="no-print flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#8B95A1] hover:bg-[#F2F4F6] hover:text-[#191F28]"
        >
          <Copy size={16} weight="bold" />
        </button>
      </div>
      <CharGauge t={t} count={count} limit={question.limit} />
      <div className="mt-4 flex flex-col gap-2">
        {question.blocks.map((id) => {
          const body = textOf(id).trim() || <span className="text-[#B0B8C1]">{t("(내용 없음)", "(empty)")}</span>;
          return edit ? (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                edit.onSelectBlock(id);
              }}
              className={`whitespace-pre-wrap rounded-lg px-3 py-2 text-left text-[14px] leading-[1.75] text-[#333D4B] print:px-0 ${
                selectedId === id ? "bg-[#EDF1FD] outline outline-2 outline-[#0B46E8] print:bg-transparent print:outline-0" : "hover:bg-[#F7F8FA]"
              }`}
            >
              {body}
            </button>
          ) : (
            <p key={id} className="whitespace-pre-wrap px-3 py-2 text-[14px] leading-[1.75] text-[#333D4B] print:px-0">
              {body}
            </p>
          );
        })}
        {edit && question.blocks.length === 0 ? (
          <p className="no-print rounded-lg border border-dashed border-[#D1D6DB] px-3 py-5 text-center text-[13px] text-[#8B95A1]">
            {t("왼쪽에서 에피소드를 골라 이 문항에 넣어 보세요", "Pick an episode on the left to add it here", "从左侧选择经历放入此题目", "Chọn một đoạn kể bên trái để thêm vào đây", "左からエピソードを選んでこの設問に入れてください", "Pilih episode di kiri untuk ditambahkan")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function CharGauge({ t, count, limit }: { t: PlatformT; count: number; limit: number | null }) {
  if (!limit) {
    return <p className="no-print mt-3 pl-9 text-[12px] text-[#8B95A1]">{t(`${count.toLocaleString()}자`, `${count.toLocaleString()} chars`, `${count.toLocaleString()} 字`, `${count.toLocaleString()} ký tự`, `${count.toLocaleString()} 字`, `${count.toLocaleString()} karakter`)}</p>;
  }
  const ratio = count / limit;
  const color = ratio > 1 ? "#F04452" : ratio >= 0.9 ? "#F59F00" : "#0B46E8";
  return (
    <div className="no-print mt-3 flex items-center gap-3 pl-9">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]" role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={count}>
        <div className="h-full rounded-full transition-[width]" style={{ width: `${Math.min(ratio, 1) * 100}%`, background: color }} />
      </div>
      <span className="shrink-0 text-[12px] font-semibold tabular-nums" style={{ color: ratio > 1 ? color : "#6B7684" }}>
        {count.toLocaleString()} / {limit.toLocaleString()}
        {t("자", " chars", " 字", " ký tự", " 字", " karakter")}
        {ratio > 1 ? ` · ${t(`${(count - limit).toLocaleString()}자 초과`, `${(count - limit).toLocaleString()} over`, `超出 ${(count - limit).toLocaleString()}`, `vượt ${(count - limit).toLocaleString()}`, `${(count - limit).toLocaleString()} 字超過`, `lebih ${(count - limit).toLocaleString()}`)}` : ""}
      </span>
    </div>
  );
}

// ── 오른쪽: 문항·에피소드·버전 ───────────────────────────────

function Inspector(props: {
  t: PlatformT;
  doc: CoverDoc;
  layout: ResolvedCover;
  q: number;
  selectedId: string | null;
  textOf: (id: string) => string;
  onLayout: (next: ResolvedCover) => void;
  onActiveQ: (q: number) => void;
  onSelect: (id: string | null) => void;
  onText: (id: string, v: string) => void;
  onDeleteEpisode: (id: string) => void;
}) {
  const { t, doc, layout, q, selectedId: id } = props;
  const question = layout.questions[q];
  const item: CoverItem | undefined = id ? doc.items.find((i) => i.id === id) : undefined;
  const index = question && id ? question.blocks.indexOf(id) : -1;
  const n = layout.questions.length;

  return (
    <aside className="no-print flex w-[336px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-[#E5E8EB] bg-white p-5" aria-label={t("속성", "Properties", "属性", "Thuộc tính", "プロパティ", "Properti")}>
      {question ? (
        <Section title={t(`선택한 문항 ${q + 1}`, `Question ${q + 1}`, `所选题目 ${q + 1}`, `Câu hỏi ${q + 1}`, `選択した設問 ${q + 1}`, `Pertanyaan ${q + 1}`)}>
          <Field key={`p-${question.id}`} label={t("문항", "Prompt", "题目", "Câu hỏi", "設問", "Pertanyaan")} value={question.prompt} multiline rows={3} onChange={(v) => props.onLayout(updateQuestion(layout, q, { prompt: v }))} />
          <Field
            key={`l-${question.id}`}
            label={t("글자 수 제한 (공백 포함)", "Character limit (incl. spaces)", "字数限制（含空格）", "Giới hạn ký tự (gồm khoảng trắng)", "文字数制限（空白含む）", "Batas karakter (termasuk spasi)")}
            type="number"
            value={question.limit == null ? "" : String(question.limit)}
            placeholder={t("제한 없음", "No limit", "无限制", "Không giới hạn", "制限なし", "Tanpa batas")}
            onBlurValue={(v) => {
              const num = Math.floor(Number(v));
              const limit = v.trim() && Number.isFinite(num) && num > 0 ? Math.min(num, 20000) : null;
              if (limit !== question.limit) props.onLayout(updateQuestion(layout, q, { limit }));
            }}
          />
          <div className="grid grid-cols-3 gap-2">
            <ToolButton
              icon={<ArrowUp size={14} weight="bold" />}
              label={t("위로", "Up", "上移", "Lên", "上へ", "Naik")}
              disabled={q === 0}
              onClick={() => {
                props.onLayout(moveQuestion(layout, q, -1));
                props.onActiveQ(q - 1);
              }}
            />
            <ToolButton
              icon={<ArrowDown size={14} weight="bold" />}
              label={t("아래로", "Down", "下移", "Xuống", "下へ", "Turun")}
              disabled={q >= n - 1}
              onClick={() => {
                props.onLayout(moveQuestion(layout, q, 1));
                props.onActiveQ(q + 1);
              }}
            />
            <ToolButton
              icon={<Trash size={14} weight="bold" />}
              label={t("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
              onClick={() => {
                if (!window.confirm(t("이 문항을 삭제할까요? 에피소드는 지워지지 않아요.", "Delete this question? Episodes stay.", "删除此题目？经历不会被删除。", "Xóa câu hỏi này? Đoạn kể vẫn giữ.", "この設問を削除しますか？エピソードは残ります。", "Hapus pertanyaan ini? Episode tetap ada."))) return;
                props.onLayout(removeQuestion(layout, doc, q));
                props.onActiveQ(Math.max(q - 1, 0));
                props.onSelect(null);
              }}
            />
          </div>
          <p className="text-[12px] leading-relaxed text-[#6B7684]">
            {t("회사 문항에 맞춰 고친 뒤 '새 버전으로 저장'하면 그 회사용 저장본이 돼요.", "Match the company's questions, then 'Save as new version' to keep a copy for that company.", "按公司题目修改后“另存为新版本”，即成为该公司专用版本。", "Chỉnh theo câu hỏi của công ty rồi 'Lưu thành phiên bản mới' để có bản cho công ty đó.", "企業の設問に合わせて直し「新しいバージョンとして保存」すると、その企業用の保存版になります。", "Sesuaikan dengan pertanyaan perusahaan lalu 'Simpan sebagai versi baru' untuk salinan perusahaan itu.")}
          </p>
        </Section>
      ) : null}

      {id && item ? (
        <Section title={t("선택한 에피소드", "Selected episode", "所选经历", "Đoạn kể đã chọn", "選択したエピソード", "Episode terpilih")} divider={!!question}>
          {index >= 0 ? (
            <div className="grid grid-cols-2 gap-2">
              <ToolButton icon={<ArrowUp size={14} weight="bold" />} label={t("위로", "Up", "上移", "Lên", "上へ", "Naik")} disabled={index === 0} onClick={() => props.onLayout(nudgeBlock(layout, q, index, -1).layout)} />
              <ToolButton icon={<ArrowDown size={14} weight="bold" />} label={t("아래로", "Down", "下移", "Xuống", "下へ", "Turun")} disabled={index >= question.blocks.length - 1} onClick={() => props.onLayout(nudgeBlock(layout, q, index, 1).layout)} />
              <ToolButton
                icon={<ArrowLeft size={14} weight="bold" />}
                label={t("앞 문항으로", "To previous", "移到上一题", "Sang câu trước", "前の設問へ", "Ke sebelumnya")}
                disabled={q === 0}
                onClick={() => {
                  const r = moveBlockToQuestion(layout, doc, q, index, q - 1);
                  props.onLayout(r.layout);
                  props.onActiveQ(r.q);
                }}
              />
              <ToolButton
                icon={<ArrowRight size={14} weight="bold" />}
                label={t("다음 문항으로", "To next", "移到下一题", "Sang câu sau", "次の設問へ", "Ke berikutnya")}
                disabled={q >= n - 1}
                onClick={() => {
                  const r = moveBlockToQuestion(layout, doc, q, index, q + 1);
                  props.onLayout(r.layout);
                  props.onActiveQ(r.q);
                }}
              />
              <div className="col-span-2">
                <ToolButton icon={<EyeSlash size={14} weight="bold" />} label={t("이 문항에서 빼기", "Remove from this question", "从此题目移除", "Bỏ khỏi câu này", "この設問から外す", "Keluarkan dari pertanyaan ini")} onClick={() => props.onLayout(removeBlock(layout, doc, q, index))} />
              </div>
            </div>
          ) : question ? (
            <button type="button" onClick={() => props.onLayout(addBlock(layout, doc, q, id))} className="h-10 w-full rounded-lg bg-[#0B46E8] text-[13px] font-bold text-white hover:bg-[#0A3ECB]">
              {t(`문항 ${q + 1}에 넣기`, `Add to Q${q + 1}`, `放入题目 ${q + 1}`, `Thêm vào câu ${q + 1}`, `設問 ${q + 1} に入れる`, `Masukkan ke P${q + 1}`)}
            </button>
          ) : null}
          <Field key={`t-${id}`} label={t("본문", "Text", "正文", "Nội dung", "本文", "Isi")} value={props.textOf(id)} multiline rows={9} onChange={(v) => props.onText(id, v)} />
          <AiPolish key={`ai-${id}`} t={t} text={props.textOf(id)} polish={(src, style) => polishSelfIntro({ text: src, style })} onApply={(v) => props.onText(id, v)} />
          <p className="text-right text-[12px] text-[#8B95A1]">
            {t(`이 단락 ${charCount(props.textOf(id).trim()).toLocaleString()}자`, `${charCount(props.textOf(id).trim()).toLocaleString()} chars`)}
          </p>
          <button type="button" onClick={() => props.onDeleteEpisode(id)} className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#F04452] hover:underline">
            <Trash size={14} weight="bold" />
            {t("에피소드 삭제", "Delete episode", "删除经历", "Xóa đoạn kể", "エピソードを削除", "Hapus episode")}
          </button>
        </Section>
      ) : !question ? (
        <p className="text-[13px] text-[#6B7684]">{t("문항을 추가하거나 에피소드를 골라 주세요.", "Add a question or pick an episode.", "请添加题目或选择经历。", "Thêm câu hỏi hoặc chọn một đoạn kể.", "設問を追加するかエピソードを選んでください。", "Tambah pertanyaan atau pilih episode.")}</p>
      ) : null}

    </aside>
  );
}
