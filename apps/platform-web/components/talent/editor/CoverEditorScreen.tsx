"use client";

// 모듈형 자기소개서 에디터(전체 화면) — 경험 이야기 한 단락(에피소드)을 모듈로 두고,
// 문항·글자 수 제한과 문항별 에피소드 조합을 구성한다.
//
// 이력서 에디터와 같이, 편집하는 자기소개서는 하나다.
//   에피소드 내용 → talent 문서(saveCoverDoc) — 앱·기존 화면이 읽는 원본
//   문항·조합     → 편집 중 행(/members/me/doc-versions, snapshot = null)
// '새 버전으로 저장'은 그 순간의 문항·답변을 읽기 전용 저장본으로 남긴다(회사별 제출본).
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, CaretLeft, Copy, CursorClick, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
import { TalentGuard } from "../app/TalentGuard";
import { useToast } from "../../toast/ToastProvider";
import { PDF_PRINT_AREA, PdfDownloadButton, PrintStyles } from "../career/pdf-print";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useRenewalDocsStatus } from "../../../lib/talent/resume-doc";
import { useBasicInfo, type BasicInfo } from "../../../lib/talent/basic-info";
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
  setBlocks,
  toStoredCover,
  updateQuestion,
  type ResolvedCover
} from "../../../lib/talent/cover-layout";
import { generateCoverLetter, polishSelfIntro } from "../../../lib/resume-maker-client";
import { AiPolish } from "./AiPolish";
import { ClicheHints } from "../career/ClicheHints";
import { scanCover, type CoverScan, type CoverScanIssue } from "../../../lib/talent/cover-scan";
import { ModularCoverPages } from "./ModularCoverPages";
import { EditorTopBar, Field, FullMessage, SavedPanel, Section, TINT_BTN, ToolButton, useDocVersionStore } from "./editor-shared";

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
  const info = useBasicInfo();
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

  // 전체 점검(규칙만, AI 호출 없음) — 본문 표시·문항 배지·최종 점검 목록이 같은 결과를 쓴다.
  // 예전엔 세 곳이 각자 buildScan 을 돌려서 같은 계산을 매 렌더마다 반복했다.
  // 아래 조기 반환(저장본 보기)보다 위에 있어야 한다 — 훅은 렌더마다 같은 순서로 불려야 하니까.
  const scan = useMemo(() => (layout ? buildScan(doc, layout, (id) => doc.items.find((i) => i.id === id)?.text ?? "") : null), [doc, layout]);
  const flaggedQuestions = useMemo(() => new Set(scan ? scan.byQuestion.keys() : []), [scan]);

  if (!working || !current || !layout || !scan) {
    return <FullMessage text={t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")} />;
  }

  const copyAnswer = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("답변을 복사했어요", "Answer copied", "已复制答案", "Đã sao chép câu trả lời", "回答をコピーしました", "Jawaban disalin"));
    } catch {
      toast.error(t("복사하지 못했어요", "Couldn't copy", "无法复制", "Không sao chép được", "コピーできませんでした", "Gagal menyalin"));
    }
  };

  const topBar = (
    <EditorTopBar
      t={t}
      active="cover"
      exitHref="/talent/career"
      working={working}
      saved={store.saved}
      current={current}
      onPick={(id) => {
        store.setCurrentId(id);
        setActiveQ(0);
        setSelectedId(null);
      }}
      onSaveNew={(name) => store.saveAsNew(name, toStoredCover(layout), { cover: doc, basicInfo: info })}
      saveState={store.saveState}
      right={<PdfDownloadButton />}
    />
  );

  // ── 저장본 보기(읽기 전용) — 문항별 답변 복사는 된다 ──
  if (current.snapshot) {
    const snapDoc = current.snapshot.cover;
    const snapInfo = current.snapshot.basicInfo ?? info;
    const snapLayout = resolveCoverLayout(current.layout, snapDoc);
    const snapText = (id: string) => snapDoc.items.find((i) => i.id === id)?.text ?? "";
    return (
      <div className="flex h-screen flex-col bg-[#EEF0F3] text-[#191F28] print:block print:h-auto print:bg-white">
        <PrintStyles />
        {topBar}
        <div className="flex min-h-0 flex-1 print:block">
          <main className="min-w-0 flex-1 overflow-auto px-8 py-8 print:hidden" aria-label={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
            <div className="mx-auto max-w-[794px]">
              <ModularCoverPages doc={snapDoc} info={snapInfo} layout={snapLayout} />
            </div>
          </main>
          <SavedPanel t={t} version={current} onRename={(name) => store.renameSaved(current.id, name)} onDelete={() => void store.removeSaved(current.id)}>
            <AnswerList t={t} layout={snapLayout} textOf={snapText} onCopy={(text) => void copyAnswer(text)} />
          </SavedPanel>
        </div>
        <PrintCopy doc={snapDoc} info={snapInfo} layout={snapLayout} />
      </div>
    );
  }

  const q = Math.min(activeQ, Math.max(layout.questions.length - 1, 0));
  const commitLayout = (next: ResolvedCover) => store.setWorkingLayout(toStoredCover(next));
  const textOf = (id: string) => doc.items.find((i) => i.id === id)?.text ?? "";

  // ── 에피소드 내용(talent 문서 — 앱·기존 화면이 읽는 원본) ──
  const setText = (id: string, text: string) => saveCoverDoc({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  // 문서 단위 AI 재료(지원 공고·필수 소재) — 문항별이 아니라 자소서 전체에 적용된다.
  const setDocMeta = (patch: Partial<CoverDoc>) => saveCoverDoc({ ...doc, ...patch });
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
  // 문항 AI 다듬기 결과 — 다듬은 답변을 새 에피소드로 만들어 이 문항의 답으로 바꾼다(원래 에피소드는 모음에 남는다).
  const applyPolishedAnswer = (qi: number, text: string) => {
    const prompt = layout.questions[qi]?.prompt ?? "";
    const { doc: next, id } = addCoverItem(doc, prompt, text);
    saveCoverDoc(next);
    commitLayout(setBlocks(resolveCoverLayout(toStoredCover(layout), next), next, qi, [id]));
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
        <main className="min-w-0 flex-1 overflow-auto px-8 py-8 print:hidden" aria-label={t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}>
          <div className="mx-auto flex max-w-[794px] flex-col gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  commitLayout(addQuestion(layout, doc, t("새 문항", "New question", "新题目", "Câu hỏi mới", "新しい設問", "Pertanyaan baru")));
                  setActiveQ(layout.questions.length);
                  setSelectedId(null);
                }}
                className="flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-semibold leading-none text-[#333D4B] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:bg-[#F7F8FA]"
              >
                <Plus size={14} weight="bold" className="shrink-0" />
                <span>{t("문항 추가", "Add question", "添加题目", "Thêm câu hỏi", "設問を追加", "Tambah pertanyaan")}</span>
              </button>
            </div>
            <ModularCoverPages
              doc={doc}
              info={info}
              layout={layout}
              interaction={{
                activeQ: q,
                selectedId,
                flaggedQuestions,
                onActivate: (qi) => {
                  setActiveQ(qi);
                  setSelectedId(null);
                },
                onSelect: (qi, id) => {
                  setActiveQ(qi);
                  setSelectedId(id);
                }
              }}
            />
          </div>
        </main>
        <Inspector
          t={t}
          doc={doc}
          layout={layout}
          q={q}
          selectedId={selectedId}
          textOf={textOf}
          scan={scan}
          onLayout={commitLayout}
          onActiveQ={setActiveQ}
          onSelect={setSelectedId}
          onText={setText}
          onDeleteEpisode={deleteEpisode}
          onCopy={(text) => void copyAnswer(text)}
          onPolishedAnswer={applyPolishedAnswer}
          onDocMeta={setDocMeta}
        />
      </div>
      <PrintCopy doc={doc} info={info} layout={layout} />
    </div>
  );
}

/** PDF 다운받기용 사본 — 편집 표시 없이 같은 A4 로. 화면 밖에 두되 폭은 유지해 페이지 나눔을 미리 잰다. */
function PrintCopy({ doc, info, layout }: { doc: CoverDoc; info: BasicInfo; layout: Pick<ResolvedCover, "questions"> }) {
  return (
    <div aria-hidden className={`pointer-events-none fixed -left-[99999px] top-0 w-[794px] print:left-0 ${PDF_PRINT_AREA}`}>
      <ModularCoverPages doc={doc} info={info} layout={layout} />
    </div>
  );
}

/** 저장본 — 문항별 글자 수와 답변 복사(회사 지원서에 붙여 넣기). */
function AnswerList({ t, layout, textOf, onCopy }: { t: PlatformT; layout: Pick<ResolvedCover, "questions">; textOf: (id: string) => string; onCopy: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      {layout.questions.map((question, i) => {
        const text = answerText(question.blocks.map(textOf));
        return (
          <div key={question.id} className="flex flex-col gap-2 rounded-2xl bg-[#F7F8FA] px-3.5 py-3">
            <div className="flex items-start gap-2">
              <span className="min-w-0 flex-1 text-[12.5px] font-semibold leading-snug">
                {i + 1}. {question.prompt}
              </span>
              <button
                type="button"
                onClick={() => onCopy(text)}
                aria-label={t(`문항 ${i + 1} 답변 복사`, `Copy answer ${i + 1}`)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#8B95A1] transition hover:bg-white hover:text-[#191F28]"
              >
                <Copy size={14} weight="bold" />
              </button>
            </div>
            <CharGauge t={t} count={charCount(text)} limit={question.limit} />
          </div>
        );
      })}
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
    <aside className="no-print flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#E5E8EB] bg-white px-4 py-6" aria-label={t("에피소드", "Episodes", "经历", "Đoạn kể", "エピソード", "Episode")}>
      <div className="px-1.5">
        <p className="text-[16px] font-bold tracking-[-0.01em]">{t("에피소드", "Episodes", "经历", "Đoạn kể", "エピソード", "Episode")}</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8B95A1]">
          {t(
            "경험 이야기 한 단락이 하나의 모듈이에요. 고른 문항에 넣어 답변을 조립해요.",
            "Each story paragraph is a module. Put it into the selected question and mix them per question.",
            "每段经历故事都是一个模块。放入所选题目，并按题目组合。",
            "Mỗi đoạn kể là một mô-đun. Đưa vào câu hỏi đang chọn và kết hợp theo từng câu.",
            "経験の一段落がモジュールです。選んだ設問に入れ、設問ごとに組み合わせを変えます。",
            "Setiap paragraf cerita adalah modul. Masukkan ke pertanyaan terpilih dan kombinasikan per pertanyaan."
          )}
        </p>
      </div>
      <button type="button" onClick={onNew} className={`flex h-10 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold leading-none ${TINT_BTN}`}>
        <Plus size={14} weight="bold" className="shrink-0" />
        <span>{t("새 에피소드 쓰기", "Write a new episode", "写新经历", "Viết đoạn mới", "新しいエピソードを書く", "Tulis episode baru")}</span>
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
                className={`flex flex-col gap-2 rounded-2xl px-3.5 py-3 transition ${selectedId === it.id ? "bg-[#EDF1FD]" : "bg-[#F7F8FA] hover:bg-[#F2F4F6]"}`}
              >
                <button type="button" onClick={() => onSelect(it.id)} className="flex flex-col gap-1 text-left">
                  {it.question ? <span className="text-[11px] font-semibold text-[#0B46E8]">{it.question}</span> : null}
                  <span className="line-clamp-3 text-[13px] leading-relaxed text-[#333D4B]">{textOf(it.id).trim() || t("(내용 없음)", "(empty)")}</span>
                </button>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11.5px] leading-none ${usedIn.length ? "text-[#6B7684]" : unplaced.has(it.id) ? "font-bold text-[#B25E09]" : "text-[#B0B8C1]"}`}>{usage}</span>
                  {active ? (
                    <button
                      type="button"
                      onClick={() => onInsert(it.id)}
                      disabled={inActive}
                      className="flex h-7 shrink-0 items-center rounded-full bg-white px-2.5 text-[11.5px] font-bold leading-none text-[#0B46E8] transition hover:bg-[#E1E9FC] disabled:cursor-default disabled:bg-transparent disabled:text-[#B0B8C1]"
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

function CharGauge({ t, count, limit }: { t: PlatformT; count: number; limit: number | null }) {
  if (!limit) {
    return <p className="text-[12px] text-[#8B95A1]">{t(`${count.toLocaleString()}자`, `${count.toLocaleString()} chars`, `${count.toLocaleString()} 字`, `${count.toLocaleString()} ký tự`, `${count.toLocaleString()} 字`, `${count.toLocaleString()} karakter`)}</p>;
  }
  const ratio = count / limit;
  const color = ratio > 1 ? "#F04452" : ratio >= 0.9 ? "#F59F00" : "#0B46E8";
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E5E8EB]" role="meter" aria-valuemin={0} aria-valuemax={limit} aria-valuenow={count}>
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
  scan: CoverScan;
  onLayout: (next: ResolvedCover) => void;
  onActiveQ: (q: number) => void;
  onSelect: (id: string | null) => void;
  onText: (id: string, v: string) => void;
  onDeleteEpisode: (id: string) => void;
  onCopy: (text: string) => void;
  onPolishedAnswer: (q: number, text: string) => void;
  onDocMeta: (patch: Partial<CoverDoc>) => void;
}) {
  const { t, doc, layout, q, selectedId: id } = props;
  const question = layout.questions[q];
  const item: CoverItem | undefined = id ? doc.items.find((i) => i.id === id) : undefined;
  const index = question && id ? question.blocks.indexOf(id) : -1;
  const n = layout.questions.length;
  const answer = question ? answerText(question.blocks.map(props.textOf)) : "";
  // 규칙 스캔(AI 호출 없음) — 지금 보고 있는 문항에 문제가 있으면 칩 옆에 개수를 띄운다.
  const questionIssues = question ? props.scan.byQuestion.get(question.id) ?? [] : [];

  const aside = (children: ReactNode) => (
    <aside className="no-print flex w-[340px] shrink-0 flex-col gap-7 overflow-y-auto border-l border-[#E5E8EB] bg-white px-5 py-6" aria-label={t("속성", "Properties", "属性", "Thuộc tính", "プロパティ", "Properti")}>
      {children}
    </aside>
  );
  const qLabel = t(`문항 ${q + 1}`, `Question ${q + 1}`, `题目 ${q + 1}`, `Câu ${q + 1}`, `設問 ${q + 1}`, `Pertanyaan ${q + 1}`);

  // ── 에피소드를 고른 때 — 에피소드만 보여 주고, 위에서 문항으로 돌아간다 ──
  if (id && item) {
    const para = props.textOf(id);
    return aside(
      <>
        <div>
          {question ? (
            <button type="button" onClick={() => props.onSelect(null)} className="-ml-1.5 mb-2 flex h-7 items-center gap-1 rounded-lg px-1.5 text-[12.5px] font-semibold leading-none text-[#6B7684] transition hover:bg-[#F2F4F6] hover:text-[#191F28]">
              <CaretLeft size={13} weight="bold" className="shrink-0" />
              <span className="max-w-[240px] truncate">
                {qLabel} · {question.prompt}
              </span>
            </button>
          ) : null}
          <span className="inline-flex h-6 items-center rounded-full bg-[#EDF1FD] px-2.5 text-[11.5px] font-bold leading-none text-[#0B46E8]">{t("에피소드", "Episode", "经历", "Đoạn kể", "エピソード", "Episode")}</span>
          <p className="mt-2 line-clamp-2 text-[16px] font-bold leading-snug tracking-[-0.01em]">{para.trim().split("\n")[0] || t("(내용 없음)", "(empty)")}</p>
        </div>

        {question ? (
          <Section title={t("배치", "Placement", "位置", "Vị trí", "配置", "Penempatan")}>
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
            ) : (
              <button type="button" onClick={() => props.onLayout(addBlock(layout, doc, q, id))} className="flex h-10 w-full items-center justify-center rounded-[10px] bg-[#0B46E8] text-[13px] font-bold leading-none text-white transition hover:bg-[#0A3ECB]">
                {t(`문항 ${q + 1}에 넣기`, `Add to Q${q + 1}`, `放入题目 ${q + 1}`, `Thêm vào câu ${q + 1}`, `設問 ${q + 1} に入れる`, `Masukkan ke P${q + 1}`)}
              </button>
            )}
          </Section>
        ) : null}

        <Section title={t("내용", "Content", "内容", "Nội dung", "内容", "Isi")}>
          <Field key={`t-${id}`} label={t(`본문 · ${charCount(para.trim()).toLocaleString()}자`, `Text · ${charCount(para.trim()).toLocaleString()} chars`)} value={para} multiline rows={9} onChange={(v) => props.onText(id, v)} />
          <AiPolish key={`ai-${id}`} t={t} text={para} polish={(src, style) => polishSelfIntro({ text: src, style })} onApply={(v) => props.onText(id, v)} />
        </Section>

        <button type="button" onClick={() => props.onDeleteEpisode(id)} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold leading-none text-[#F04452] transition hover:bg-[#FFF0F1]">
          <Trash size={15} weight="bold" className="shrink-0" />
          <span>{t("에피소드 삭제", "Delete episode", "删除经历", "Xóa đoạn kể", "エピソードを削除", "Hapus episode")}</span>
        </button>
      </>
    );
  }

  if (!question) {
    return aside(
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#F7F8FA] px-5 py-10 text-center">
        <CursorClick size={26} weight="duotone" className="text-[#B0B8C1]" />
        <p className="text-[13px] leading-relaxed text-[#8B95A1]">{t("문항을 추가하거나 에피소드를 골라 주세요.", "Add a question or pick an episode.", "请添加题目或选择经历。", "Thêm câu hỏi hoặc chọn một đoạn kể.", "設問を追加するかエピソードを選んでください。", "Tambah pertanyaan atau pilih episode.")}</p>
      </div>
    );
  }

  // ── 문항을 고른 때 — 답변(글자 수·복사·AI 다듬기) → 문항 설정 → 순서 ──
  return aside(
    <>
      <div>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-flex h-6 items-center rounded-full bg-[#EDF1FD] px-2.5 text-[11.5px] font-bold leading-none text-[#0B46E8]">{qLabel}</span>
          {/* 이 문항에서 규칙 스캔이 잡은 문제 수 — 아래 최종 점검과 같은 계산을 쓴다. */}
          {questionIssues.length > 0 ? (
            <span
              title={questionIssues.map((x) => issueText(x, t)).join(" · ")}
              className="inline-flex h-6 items-center rounded-full bg-[#FFF3E0] px-2.5 text-[11.5px] font-bold leading-none text-[#C77700]"
            >
              {t(`확인 ${questionIssues.length}`, `${questionIssues.length} to check`, `待查 ${questionIssues.length}`, `${questionIssues.length} cần xem`, `確認 ${questionIssues.length}`, `${questionIssues.length} dicek`)}
            </span>
          ) : null}
        </span>
        <p className="mt-2 line-clamp-3 text-[16px] font-bold leading-snug tracking-[-0.01em]">{question.prompt || t("(문항 없음)", "(no prompt)")}</p>
      </div>

      <Section title={t("답변", "Answer", "答案", "Câu trả lời", "回答", "Jawaban")}>
        <div className="flex flex-col gap-2.5 rounded-2xl bg-[#F7F8FA] p-3.5">
          <CharGauge t={t} count={charCount(answer)} limit={question.limit} />
          {/* 사용자가 직접 쓴 문장에도 AI와 같은 기준(프롬프트 금지 표현)을 보여 준다. */}
          <ClicheHints text={answer} />
          <button type="button" onClick={() => props.onCopy(answer)} disabled={!answer} className="flex h-9 w-full items-center justify-center gap-1.5 rounded-[10px] bg-white text-[12.5px] font-semibold leading-none text-[#333D4B] transition hover:bg-[#E8EBEE] disabled:cursor-default disabled:text-[#C4CAD2] disabled:hover:bg-white">
            <Copy size={14} weight="bold" className="shrink-0" />
            <span>{t("답변 복사 — 지원서에 붙여 넣기", "Copy answer to paste into an application", "复制答案", "Sao chép câu trả lời", "回答をコピー", "Salin jawaban")}</span>
          </button>
        </div>
        {/* 문항 단위 다듬기 — 문항·글자 수 제한에 맞춰 답변 전체를 다듬는다. 고르면 새 에피소드가 이 문항의 답이 된다. */}
        <AiPolish
          key={`qa-${question.id}`}
          t={t}
          title={t("문항 답변 AI로 다듬기", "Polish this answer with AI", "用 AI 润色此题答案", "Chỉnh câu trả lời bằng AI", "この回答をAIで整える", "Poles jawaban dengan AI")}
          text={answer}
          // 지원 공고·필수 소재를 함께 넘긴다 — 프롬프트의 '공고 1:1 연결'과
          // '반드시 반영할 소재(누락 시 실패)' 규칙이 이때 켜진다.
          polish={(src, style) =>
            generateCoverLetter({
              mode: "polish",
              style,
              prompt: question.prompt,
              current: src,
              targetChars: question.limit ?? undefined,
              companyName: doc.companyName?.trim() || undefined,
              jobText: doc.jobText?.trim() || undefined,
              keywords: (doc.keywords ?? []).map((k) => k.trim()).filter(Boolean).slice(0, 10)
            })
          }
          onApply={(v) => props.onPolishedAnswer(q, v)}
        />
      </Section>

      <DocContextSection t={t} doc={doc} onDocMeta={props.onDocMeta} />

      <FinalCheckSection
        t={t}
        layout={layout}
        scan={props.scan}
        onGoQuestion={(n) => {
          props.onSelect(null);
          props.onActiveQ(n);
        }}
      />

      <Section title={t("문항 설정", "Question settings", "题目设置", "Cài đặt câu hỏi", "設問の設定", "Pengaturan pertanyaan")}>
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
        <p className="text-[12px] leading-relaxed text-[#8B95A1]">
          {t("회사 문항에 맞춰 고친 뒤 '새 버전으로 저장'하면 그 회사용 저장본이 돼요.", "Match the company's questions, then 'Save as new version' to keep a copy for that company.", "按公司题目修改后“另存为新版本”，即成为该公司专用版本。", "Chỉnh theo câu hỏi của công ty rồi 'Lưu thành phiên bản mới' để có bản cho công ty đó.", "企業の設問に合わせて直し「新しいバージョンとして保存」すると、その企業用の保存版になります。", "Sesuaikan dengan pertanyaan perusahaan lalu 'Simpan sebagai versi baru' untuk salinan perusahaan itu.")}
        </p>
      </Section>
    </>
  );
}

/** 지원 공고 · 필수 소재 — 문서 전체에 적용되는 AI 재료.
 *  공고를 넣으면 프롬프트의 '목표 공고 반영'·'공고 1:1 연결' 규칙이 켜지고,
 *  소재는 '하나라도 빠지면 실패한 답변'으로 최우선 처리된다(백엔드 buildCoverLetterMessages).
 *  문항별 설정이 아니라 자소서 전체에 걸리므로 문항 설정과 분리해 둔다. */
const JOB_TEXT_MAX = 4000;
const KEYWORDS_MAX = 10;

function DocContextSection({ t, doc, onDocMeta }: { t: PlatformT; doc: CoverDoc; onDocMeta: (patch: Partial<CoverDoc>) => void }) {
  const [draft, setDraft] = useState("");
  const list = doc.keywords ?? [];
  const jd = doc.jobText ?? "";
  const addKeyword = () => {
    const v = draft.trim().slice(0, 40);
    if (!v || list.length >= KEYWORDS_MAX || list.includes(v)) { setDraft(""); return; }
    onDocMeta({ keywords: [...list, v] });
    setDraft("");
  };

  return (
    <Section title={t("지원 공고 · 소재", "Target posting & points", "目标招聘·素材", "Tin tuyển & nội dung", "応募求人・要素", "Lowongan & poin")}>
      <p className="text-[11.5px] leading-[1.6] text-[#8B95A1]">
        {t(
          "자소서 전체에 적용돼요. 공고를 넣으면 AI가 그 회사 요구에 내 경험을 연결하고, 소재는 빠짐없이 녹여 씁니다.",
          "Applies to the whole document. With a posting, the AI ties your experience to it; every point gets woven in.",
          "适用于整篇。填入招聘后，AI 会对应要求；素材会全部融入。",
          "Áp dụng toàn bài. Có tin tuyển, AI sẽ nối kinh nghiệm; mọi nội dung đều được đưa vào.",
          "全体に適用。求人を入れると要件に経験を結び付け、要素は必ず織り込みます。",
          "Berlaku untuk seluruh dokumen. Dengan lowongan, AI menautkan pengalaman; semua poin dimasukkan."
        )}
      </p>
      <Field
        label={t("회사명", "Company", "公司名", "Tên công ty", "会社名", "Perusahaan")}
        value={doc.companyName ?? ""}
        onChange={(v) => onDocMeta({ companyName: v.slice(0, 120) })}
      />
      <Field
        label={`${t("공고 내용", "Job posting", "招聘内容", "Nội dung tin", "求人内容", "Isi lowongan")} (${jd.length}/${JOB_TEXT_MAX})`}
        value={jd}
        multiline
        rows={4}
        onChange={(v) => onDocMeta({ jobText: v.slice(0, JOB_TEXT_MAX) })}
      />
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold text-[#333D4B]">
          {t("반드시 넣을 소재", "Must-include points", "必写素材", "Nội dung bắt buộc", "必ず入れる要素", "Poin wajib")} {list.length}/{KEYWORDS_MAX}
        </span>
        {list.length ? (
          <div className="flex flex-wrap gap-1.5">
            {list.map((k) => (
              <span key={k} className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] py-1 pl-2.5 pr-1.5 text-[11.5px] font-bold text-[#0B46E8]">
                <span className="break-anywhere">{k}</span>
                <button
                  type="button"
                  onClick={() => onDocMeta({ keywords: list.filter((x) => x !== k) })}
                  aria-label={`${k} ${t("삭제", "Remove", "删除", "Xóa", "削除", "Hapus")}`}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[#0B46E8]/60 transition hover:bg-white hover:text-[#F04452]"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
        {list.length < KEYWORDS_MAX ? (
          <div className="flex gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
              placeholder={t("예: 교환학생 경험", "e.g. exchange program", "例：交换生经历", "VD: du học trao đổi", "例：交換留学", "mis. pertukaran")}
              aria-label={t("소재 추가", "Add a point", "添加素材", "Thêm nội dung", "要素を追加", "Tambah poin")}
              className="min-w-0 flex-1 rounded-[10px] border border-[#E5E8EB] bg-white px-3 py-2 text-[12.5px] text-[#191F28] outline-none focus:border-[#0B46E8]"
            />
            <button type="button" onClick={addKeyword} disabled={!draft.trim()} className={`${TINT_BTN} shrink-0 rounded-[10px] px-3 text-[12.5px] font-semibold leading-none`}>
              {t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
            </button>
          </div>
        ) : null}
      </div>
    </Section>
  );
}

/** 제출 전 최종 점검 — 미작성 문항 / 글자 수 초과·미달 / 상투어 / 필수 소재 누락을 한 곳에.
 *  문항 간 중복은 넣지 않는다 — 이 에디터는 같은 에피소드를 여러 문항에 **의도적으로** 재사용하는
 *  구조라, 텍스트 유사도로 잡으면 정상 사용을 오탐한다. */
/** 문항별 본문을 스캔 입력 형태로 — 목록·배지·최종 점검이 같은 계산을 쓴다. */
function buildScan(doc: CoverDoc, layout: ResolvedCover, textOf: (id: string) => string): CoverScan {
  return scanCover(
    layout.questions.map((q) => ({ id: q.id, prompt: q.prompt, limit: q.limit, text: answerText(q.blocks.map(textOf)) })),
    doc.keywords ?? [],
    charCount
  );
}

/** 문제 1건을 사람이 읽는 한 줄로. 표시 문구는 화면에서 만든다(스캔은 숫자·이름만 준다). */
function issueText(issue: CoverScanIssue, t: PlatformT): string {
  switch (issue.kind) {
    case "empty":
      return t("아직 작성 안 됨", "Not written yet", "尚未填写", "Chưa viết", "未記入", "Belum ditulis");
    case "over":
      return `${issue.length}/${issue.limit} ${t("자 초과", "over limit", "超出", "vượt", "字超過", "lewat")}`;
    case "under":
      return `${issue.length}/${issue.limit} ${t("자, 분량 부족", "chars, too short", "字，偏短", "ký tự, hơi ngắn", "字・少なめ", "krt, terlalu pendek")}`;
    case "cliche":
      return `${t("다시 볼 표현", "Phrases to revisit", "可再斟酌", "Cụm nên xem lại", "見直したい表現", "Frasa ditinjau")} ${issue.phrases
        .slice(0, 2)
        .map((x) => `「${x}」`)
        .join(" ")}`;
    case "overlap":
      return `${t("내용 중복", "Overlaps with", "内容重复", "Trùng nội dung", "内容が重複", "Tumpang tindih")} 「${issue.withQuestion.slice(0, 14)}」${
        issue.shared.length ? ` (${issue.shared.slice(0, 2).join(", ")})` : ""
      }`;
  }
}

function FinalCheckSection({
  t,
  layout,
  scan,
  onGoQuestion
}: {
  t: PlatformT;
  layout: ResolvedCover;
  scan: CoverScan;
  /** 문제가 있는 문항으로 바로 이동 — 목록만 보고 사용자가 카드를 찾아다니지 않게. */
  onGoQuestion: (q: number) => void;
}) {
  // 예전에는 이 안에서 검사를 직접 다시 구현했고 그 과정에서 '문항 간 내용 중복'이 빠져 있었다.
  // 지금은 화면 위쪽에서 cover-scan 으로 한 번 계산해 내려받는다 — 본문 표시·배지·이 목록이 같은 근거를 쓴다.
  // 줄마다 어느 문항인지 들고 다닌다 — 눌러서 그 문항으로 바로 갈 수 있게.
  const lines: { text: string; q: number | null }[] = [];
  for (const [i, question] of layout.questions.entries()) {
    const issues = scan.byQuestion.get(question.id);
    if (!issues?.length) continue;
    const label = `${i + 1}. ${question.prompt.slice(0, 18)}`;
    for (const issue of issues) lines.push({ text: `${label} — ${issueText(issue, t)}`, q: i });
  }
  for (const k of scan.missingKeywords) {
    lines.push({
      text: `${t("소재", "Point", "素材", "Nội dung", "要素", "Poin")} 「${k}」 ${t("가 본문에 없어요", "is missing", "未出现", "chưa có", "が本文にありません", "belum ada")}`,
      q: null
    });
  }

  return (
    <Section title={`${t("제출 전 최종 점검", "Final check", "提交前检查", "Kiểm tra cuối", "提出前チェック", "Cek akhir")} · ${scan.filledPercent}%`}>
      {lines.length === 0 ? (
        <p className="text-[12px] text-[#00854A]">
          {t("확인할 항목이 없어요.", "Nothing to fix.", "没有待修项。", "Không có gì cần sửa.", "修正点はありません。", "Tidak ada perbaikan.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <li key={i} className="break-anywhere text-[11.5px] leading-[1.6] text-[#4E5968]">
              {line.q === null ? (
                <span>• {line.text}</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onGoQuestion(line.q as number)}
                  className="w-full text-left underline-offset-2 transition hover:text-[#0B46E8] hover:underline"
                >
                  • {line.text}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
