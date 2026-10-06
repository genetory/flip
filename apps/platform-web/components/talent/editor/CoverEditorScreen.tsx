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
import { addCoverItem, generateCoverDoc, saveCoverDoc, useCoverDoc, type CoverDoc, type CoverItem, useCoverHistory } from "../../../lib/talent/cover-doc";
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
import { generateCoverLetter, polishSelfIntro, reviewCover, importCoverLetter } from "../../../lib/resume-maker-client";
import { importedCoverToItems } from "../../../lib/talent/import-to-renewal";
import { ImportFromFile } from "./ImportFromFile";
import { RecentChanges, type ChangePoint } from "./RecentChanges";
import { diffCoverDocs } from "../../../lib/talent/doc-diff";
import { restoreCoverVersion } from "../../../lib/talent/renewal-docs-store";
import { AiPolish } from "./AiPolish";
import { ClicheHints } from "../career/ClicheHints";
import { coverIssueQuotes, scanCover, type CoverScan, type CoverScanIssue } from "../../../lib/talent/cover-scan";
import { ModularCoverPages } from "./ModularCoverPages";
import { EditorTopBar, Field, FullMessage, SavedPanel, Section, TINT_BTN, ToolButton, useAiReview, useDocVersionStore, useHiddenIssues, useRevealOnChange } from "./editor-shared";

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
  // 파일에서 가져오기 되돌리기용 스냅샷. 훅이라 조기 반환(저장본 보기)보다 위에 있어야 한다.
  const [importUndo, setImportUndo] = useState<CoverDoc | null>(null);
  const coverHistory = useCoverHistory();

  // 편집 중 구성 — 앱·기존 화면에서 새로 쓴 단락이 빠지지 않게 원래 문항에 넣어 보여준다.
  const layout: ResolvedCover | null = useMemo(() => {
    if (!working) return null;
    return autoPlaceCover(resolveCoverLayout(working.layout, doc), doc);
  }, [working, doc]);

  // 전체 점검(규칙만, AI 호출 없음) — 본문 표시·문항 배지·최종 점검 목록이 같은 결과를 쓴다.
  // 예전엔 세 곳이 각자 buildScan 을 돌려서 같은 계산을 매 렌더마다 반복했다.
  // 아래 조기 반환(저장본 보기)보다 위에 있어야 한다 — 훅은 렌더마다 같은 순서로 불려야 하니까.
  const scan = useMemo(() => (layout ? buildScan(doc, layout, (id) => doc.items.find((i) => i.id === id)?.text ?? "") : null), [doc, layout]);

  // AI 점검 — 버튼을 눌렀을 때만 돈다. 점검 단위는 문항이라 '문항 id → 지금 답변' 으로 본다.
  const answers = useMemo(() => {
    const textOfId = (id: string) => doc.items.find((i) => i.id === id)?.text ?? "";
    return new Map((layout?.questions ?? []).map((q) => [q.id, answerText(q.blocks.map(textOfId))]));
  }, [doc, layout]);
  const review = useAiReview("cover", answers);
  // 치워 둔 지적 — 목록에서도 본문 형광펜에서도 빠진다(남은 할 일만 보이게).
  const hiddenIssues = useHiddenIssues("cover");

  // 가져온 에피소드는 뒤에 더하기만 한다. 문항에 꽂는 건 사용자가 고른다 —
  // 자동으로 넣으면 어느 문항이 바뀌었는지 모른 채 본문이 달라진다.
  // 되돌릴 수 있는 지점 — 각 지점 이후 무엇이 달라졌는지 함께 보여 준다.
  const changePoints: ChangePoint[] = coverHistory.map((v) => ({ savedAt: v.savedAt, label: v.label, change: diffCoverDocs(v.doc, doc) }));

  const applyCoverImport = (items: CoverItem[]) => {
    setImportUndo(doc);
    saveCoverDoc({ ...doc, items: [...doc.items, ...items] }, { label: "파일에서 가져오기", force: true });
  };

  // 답변이 빈 문항은 보내지 않는다 — AI 가 '비어 있다'고 지적하면 규칙 점검('아직 작성 안 됨')과
  // 같은 말이 두 번 나온다. 프롬프트로 금지해도 넘어와서, 입력에서 빼는 쪽으로 막는다.
  const reviewable = (layout?.questions ?? []).filter((q) => (answers.get(q.id) ?? "").trim());
  const runReview = () =>
    void review.run(() =>
      reviewCover({
        company: doc.companyName?.trim() || undefined,
        jobText: doc.jobText?.trim() || undefined,
        questions: reviewable.map((q) => ({ id: q.id, prompt: q.prompt, limit: q.limit, text: answers.get(q.id) ?? "" }))
      })
    );

  // 본문에 칠할 것 — 문항 id → 형광펜으로 칠할 구절. 규칙과 AI 를 합친다.
  const flaggedQuestions = useMemo(() => {
    const m = new Map<string, string[]>();
    const add = (id: string, quotes: string[]) => m.set(id, [...(m.get(id) ?? []), ...quotes.filter(Boolean)]);
    for (const [id, issues] of scan?.byQuestion ?? []) {
      const live = issues.filter((x) => !hiddenIssues.hidden.has(coverIssueKey(id, x)));
      if (live.length) add(id, live.flatMap(coverIssueQuotes));
    }
    for (const f of review.findings) {
      if (hiddenIssues.hidden.has(`ai:${f.id}:${f.issue}`)) continue;
      add(f.id, f.quote ? [f.quote] : []);
    }
    return m;
  }, [scan, review.findings, hiddenIssues.hidden]);

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
          review={review}
          onRunReview={runReview}
          hiddenIssues={hiddenIssues}
          changePoints={changePoints}
          reviewableCount={reviewable.length}
          onLayout={commitLayout}
          onActiveQ={setActiveQ}
          onSelect={setSelectedId}
          onText={setText}
          onDoc={saveCoverDoc}
          onImport={applyCoverImport}
          importUndo={importUndo ? () => { saveCoverDoc(importUndo); setImportUndo(null); } : null}
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
    <aside className="no-print flex w-[300px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-[#E5E8EB] bg-white px-4 py-6 [&>*]:shrink-0" aria-label={t("에피소드", "Episodes", "经历", "Đoạn kể", "エピソード", "Episode")}>
      <div className="shrink-0 px-1.5">
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
      {/* shrink-0 필수 — 이 패널은 flex 열이면서 스크롤된다. 직계 자식은 기본값(flex-shrink:1)이라
          에피소드가 늘어 내용이 넘치면 h-10 이 무시되고 버튼이 찌그러진다(실제로 14px 까지 줄었다). */}
      <button type="button" onClick={onNew} className={`flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold leading-none ${TINT_BTN}`}>
        <Plus size={14} weight="bold" className="shrink-0" />
        <span>{t("새 에피소드 쓰기", "Write a new episode", "写新经历", "Viết đoạn mới", "新しいエピソードを書く", "Tulis episode baru")}</span>
      </button>
      {doc.items.length === 0 ? (
        <p className="shrink-0 px-1 text-[12px] text-[#8B95A1]">{t("아직 에피소드가 없어요.", "No episodes yet.", "还没有经历。", "Chưa có đoạn kể.", "まだエピソードがありません。", "Belum ada episode.")}</p>
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
  review: ReturnType<typeof useAiReview>;
  onRunReview: () => void;
  hiddenIssues: ReturnType<typeof useHiddenIssues>;
  changePoints: ChangePoint[];
  /** AI 에 보낼 수 있는(답변이 있는) 문항 수 — 0 이면 버튼을 막는다. */
  reviewableCount: number;
  onLayout: (next: ResolvedCover) => void;
  onActiveQ: (q: number) => void;
  onSelect: (id: string | null) => void;
  onText: (id: string, v: string) => void;
  onDoc: (next: CoverDoc, opts?: { label?: string; force?: boolean }) => void;
  onImport: (items: CoverItem[]) => void;
  importUndo: (() => void) | null;
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
  // 문항·에피소드를 바꾸면 그 편집 영역으로 굴려 준다 — 위쪽 전체 도구에 가려지지 않게.
  const reveal = useRevealOnChange<HTMLDivElement>(`${q}:${id ?? ""}`);

  // 문서 전체에 거는 도구(다듬기·점검)는 무엇을 고르고 있든 **맨 위에** 늘 보인다 —
  // aside 헬퍼에 두어 아래 분기 전부가 갖게 한다. 고칠 곳을 찾는 도구가 무엇을 고르느냐에
  // 따라 없어지거나 자리를 옮기면 안 된다.
  //
  // 한 번 아래로 내렸던 적이 있다. 위에 두니 '새 에피소드 쓰기'를 눌렀을 때 쓸 칸이 화면 밖으로
  // 밀렸기 때문인데, 그건 자리 문제가 아니라 **고른 곳으로 데려다 주지 않은** 문제였다.
  // 지금은 고른 입력란으로 스크롤해 주므로(scrollToSelf) 맨 위에 둬도 된다.
  const aside = (children: ReactNode) => (
    <aside className="no-print flex w-[340px] shrink-0 flex-col gap-7 overflow-y-auto border-l border-[#E5E8EB] bg-white px-5 py-6 [&>*]:shrink-0" aria-label={t("속성", "Properties", "属性", "Thuộc tính", "プロパティ", "Properti")}>
      <RecentChanges t={t} points={props.changePoints} onRestore={(at) => void restoreCoverVersion(at)} />

      <ImportFromFile
        t={t}
        title={t("파일에서 가져오기", "Import from a file", "从文件导入", "Nhập từ tệp", "ファイルから取り込む", "Impor dari berkas")}
        hint={t(
          "기존 자기소개서 PDF 를 올리면 문항별 답변을 에피소드로 넣어 드려요. 어느 문항에 쓸지는 직접 고르면 돼요.",
          "Upload an existing cover letter PDF and each answer becomes an episode. You choose which question to use it for.",
          "上传现有自我介绍 PDF，各题答案会成为经历。放入哪个题目由你决定。",
          "Tải lên PDF thư giới thiệu cũ, mỗi câu trả lời thành một đoạn kể. Bạn chọn dùng cho câu nào.",
          "既存の自己紹介書PDFを上げると設問ごとの回答をエピソードとして入れます。どの設問に使うかは自分で選べます。",
          "Unggah PDF surat lamaran lama, tiap jawaban jadi episode. Kamu pilih untuk pertanyaan mana."
        )}
        parse={async (input) => importedCoverToItems((await importCoverLetter(input)).items)}
        summarize={(items) => (items.length ? [{ label: t("에피소드", "Episodes", "经历", "Đoạn kể", "エピソード", "Episode"), count: items.length }] : [])}
        onApply={props.onImport}
        onUndo={props.importUndo}
      />

      <BulkTidySection t={t} doc={doc} onDoc={props.onDoc} />
      <FinalCheckSection
        t={t}
        layout={layout}
        scan={props.scan}
        review={props.review}
        onRunReview={props.onRunReview}
        hiddenIssues={props.hiddenIssues}
        reviewableCount={props.reviewableCount}
        textOf={props.textOf}
        onGoQuestion={(n, episodeId) => {
          props.onActiveQ(n);
          props.onSelect(episodeId ?? null);
        }}
      />
      {children}
    </aside>
  );
  const qLabel = t(`문항 ${q + 1}`, `Question ${q + 1}`, `题目 ${q + 1}`, `Câu ${q + 1}`, `設問 ${q + 1}`, `Pertanyaan ${q + 1}`);

  // ── 에피소드를 고른 때 — 에피소드만 보여 주고, 위에서 문항으로 돌아간다 ──
  if (id && item) {
    const para = props.textOf(id);
    return aside(
      <>
        <div ref={reveal} className="scroll-mt-6">
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
          <Field
            key={`t-${id}`}
            label={t(`본문 · ${charCount(para.trim()).toLocaleString()}자`, `Text · ${charCount(para.trim()).toLocaleString()} chars`)}
            value={para}
            multiline
            rows={9}
            // 빈 에피소드 = 방금 '새 에피소드 쓰기'로 만든 것 → 커서를 여기 둔다.
            autoFocus={!para.trim()}
            placeholder={t(
              "언제, 무엇을, 어떻게 했고 무엇이 달라졌는지 순서대로 적어 보세요.",
              "Write what you did, how, and what changed — in that order.",
              "按时间、做了什么、怎么做、带来什么变化的顺序写。",
              "Viết theo thứ tự: khi nào, làm gì, làm thế nào, kết quả ra sao.",
              "いつ・何を・どのように行い、何が変わったかを順に書いてみてください。",
              "Tulis berurutan: kapan, apa, bagaimana, dan apa yang berubah."
            )}
            onChange={(v) => props.onText(id, v)}
          />
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
      <div ref={reveal} className="scroll-mt-6">
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

/**
 * 에피소드 일괄 다듬기 — 이력서의 '정리'에 해당한다.
 *
 * 다만 하는 일이 다르다. 이력서는 대화체를 '…함' 명사형으로 **바꾸는** 기계적 변환이지만,
 * 자소서는 존댓말 산문이 정답이라 문체를 바꾸면 안 된다. 그래서 style="natural" —
 * 어색한 표현과 맞춤법·띄어쓰기만 고치고 길이와 내용은 그대로 둔다.
 *
 * 글을 한꺼번에 건드리는 작업이라 되돌리기를 같이 둔다(이력서 쪽과 같은 약속).
 */
function BulkTidySection({ t, doc, onDoc }: { t: PlatformT; doc: CoverDoc; onDoc: (next: CoverDoc, opts?: { label?: string; force?: boolean }) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState<CoverDoc["items"] | null>(null);
  const targets = doc.items.filter((it) => (it.text ?? "").trim().length > 0).slice(0, 20);
  if (targets.length === 0) return null;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // 에피소드마다 한 번씩 부른다 — 자소서 다듬기는 문단 단위 배치 엔드포인트가 없다.
      // 20개로 자른 건 분당 호출 상한 때문이다(한 번에 그 이상을 다듬을 일도 드물다).
      const results = await Promise.all(
        targets.map(async (it) => {
          try {
            return [it.id, await polishSelfIntro({ text: it.text.trim(), style: "natural" })] as const;
          } catch {
            return [it.id, null] as const; // 한 개가 실패해도 나머지는 살린다
          }
        })
      );
      const byId = new Map(results);
      let changed = 0;
      const items = doc.items.map((it) => {
        const next = byId.get(it.id);
        if (typeof next !== "string" || !next.trim() || next === it.text) return it;
        changed += 1;
        return { ...it, text: next };
      });
      if (changed > 0) {
        setPrev(doc.items);
        onDoc({ ...doc, items }, { label: "문장 다듬기", force: true });
      }
      toast.success(
        changed > 0
          ? `${changed}${t("개 에피소드를 다듬었어요", " episodes polished", " 段已润色", " đoạn đã chỉnh", "件を整えました", " episode dirapikan")}`
          : t("바꿀 내용이 없었어요", "Nothing to change", "没有需要修改的", "Không có gì để đổi", "変更点はありません", "Tidak ada perubahan")
      );
    } catch (err) {
      // 429·5xx 는 aiPost 가 전역 토스트로 안내한다.
      console.error("[cover-editor/bulk-tidy] failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={t("문장 다듬기", "Tidy up sentences", "润色句子", "Chỉnh câu văn", "文章を整える", "Rapikan kalimat")}>
      <p className="text-[11.5px] leading-[1.6] text-[#8B95A1]">
        {t(
          "어색한 표현과 맞춤법만 한 번에 고쳐요. 길이·내용·문체는 그대로 두고, 없는 사실은 추가하지 않아요.",
          "Fixes awkward wording and typos at once. Length, content and tone stay as they are; no facts are invented.",
          "一次性修正生硬表达和错别字。长度、内容、语气保持不变，不添加不存在的事实。",
          "Sửa cách diễn đạt gượng và lỗi chính tả cùng lúc. Độ dài, nội dung, giọng văn giữ nguyên; không thêm điều không có.",
          "不自然な表現と誤字だけを一括で直します。長さ・内容・文体はそのまま、事実は追加しません。",
          "Memperbaiki ungkapan janggal dan salah ketik sekaligus. Panjang, isi, dan nada tetap; tanpa menambah fakta."
        )}
      </p>
      <button type="button" onClick={() => void run()} disabled={busy} className={`${TINT_BTN} h-9 w-full rounded-[10px] text-[13px] font-semibold leading-none`}>
        {busy
          ? t("다듬는 중…", "Polishing…", "润色中…", "Đang chỉnh…", "整えています…", "Merapikan…")
          : `${t("다듬기", "Tidy up", "润色", "Chỉnh", "整える", "Rapikan")} ${targets.length}`}
      </button>
      {prev ? (
        <button
          type="button"
          onClick={() => {
            onDoc({ ...doc, items: prev });
            setPrev(null);
          }}
          className="h-9 w-full rounded-[10px] bg-white text-[12.5px] font-semibold text-[#4E5968] ring-1 ring-[#E5E8EB] transition hover:text-[#F04452]"
        >
          {t("되돌리기", "Undo", "撤销", "Hoàn tác", "元に戻す", "Batalkan")}
        </button>
      ) : null}
    </Section>
  );
}

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
    layout.questions.map((q) => ({ id: q.id, prompt: q.prompt, limit: q.limit, text: answerText(q.blocks.map(textOf)), blocks: q.blocks })),
    doc.keywords ?? [],
    charCount
  );
}

/** 지적 1건의 키 — 치워 둔 것을 알아보는 데 쓴다. 내용이 들어가야 답변을 고쳐 다른
 *  지적이 나왔을 때 키가 달라져 다시 보인다. */
function coverIssueKey(id: string, issue: CoverScanIssue): string {
  const detail =
    issue.kind === "cliche" ? issue.phrases.join(",") : issue.kind === "overlap" ? issue.shared.join(",") : issue.kind === "over" ? String(issue.length) : "";
  return `rule:${id}:${issue.kind}:${detail}`;
}

/**
 * 문제 1건을 사람이 읽는 두 줄로 — 무엇이 걸렸는지(what)와 왜·어떻게(why).
 * 지적만 던지면 고치는 방향을 모른다. 이유가 있어야 납득하고 고친다.
 */
function issueText(issue: CoverScanIssue, t: PlatformT): { what: string; why: string } {
  switch (issue.kind) {
    case "empty":
      return {
        what: t("아직 작성 안 됨", "Not written yet", "尚未填写", "Chưa viết", "未記入", "Belum ditulis"),
        why: t(
          "빈 문항이 있으면 제출할 수 없어요. 완성하려 하지 말고 떠오르는 대로 몇 줄만 먼저 채워 두면 다듬기 쉬워요.",
          "An unanswered question blocks submission. Jot a few rough lines first — polishing is the easy part.",
          "有空题目就无法提交。先随意写几行，之后再润色会容易得多。",
          "Câu hỏi để trống thì không nộp được. Cứ viết vài dòng thô trước, chỉnh sửa sau sẽ dễ hơn.",
          "未記入の設問があると提出できません。完成させようとせず、まず数行だけ書いておくと直しやすいです。",
          "Pertanyaan kosong membuat tidak bisa dikirim. Tulis beberapa baris kasar dulu, memolesnya lebih mudah."
        )
      };
    case "over":
      return {
        what: `${issue.length}/${issue.limit} ${t("자 초과", "over limit", "超出", "vượt", "字超過", "lewat")}`,
        why: t(
          "글자 수를 넘으면 제출 자체가 막혀요. 설명하는 문장부터 덜어 내면 사례는 그대로 남아요.",
          "Going over the limit blocks submission. Cut explanatory sentences first — the examples survive.",
          "超出字数将无法提交。先删减说明性句子，事例可以保留。",
          "Vượt giới hạn sẽ không nộp được. Cắt câu giải thích trước, phần ví dụ vẫn giữ nguyên.",
          "文字数を超えると提出できません。説明の文から削ると、事例はそのまま残ります。",
          "Melebihi batas membuat tidak bisa dikirim. Pangkas kalimat penjelasan dulu, contohnya tetap."
        )
      };
    case "cliche":
      return {
        what: `${t("다시 볼 표현", "Phrases to revisit", "可再斟酌", "Cụm nên xem lại", "見直したい表現", "Frasa ditinjau")} ${issue.phrases
          .slice(0, 2)
          .map((x) => `「${x}」`)
          .join(" ")}`,
        why: t(
          "누구나 쓰는 표현이라 읽는 사람 기억에 남지 않아요. 그 말을 뒷받침하는 사례 한 줄로 바꾸면 훨씬 세게 읽혀요.",
          "Everyone writes these, so they don't stick. Swap in one concrete example that backs the claim.",
          "人人都这么写，留不下印象。换成一句能佐证的具体事例会有力得多。",
          "Ai cũng viết vậy nên không đọng lại. Thay bằng một ví dụ cụ thể chứng minh điều đó.",
          "誰もが書く表現なので印象に残りません。その主張を裏づける事例一行に替えると強く読まれます。",
          "Semua menulis begitu, jadi tak berkesan. Ganti dengan satu contoh konkret yang mendukungnya."
        )
      };
    case "overlap":
      return {
        what: `${t("내용 중복", "Overlaps with", "内容重复", "Trùng nội dung", "内容が重複", "Tumpang tindih")} 「${issue.withQuestion.slice(0, 14)}」${
          issue.shared.length ? ` (${issue.shared.slice(0, 2).join(", ")})` : ""
        }`,
        why: t(
          "같은 경험을 두 문항에 쓰면 쓸 이야기가 없어 보여요. 한쪽은 다른 경험으로 바꾸거나 같은 경험이라도 다른 면을 써 주세요.",
          "The same story in two answers reads as if you have little to show. Swap one, or show a different side of it.",
          "同一经历写在两题会显得素材不足。换成其他经历，或写出同一经历的不同侧面。",
          "Cùng trải nghiệm ở hai câu trông như thiếu nội dung. Đổi một câu, hoặc nói về khía cạnh khác.",
          "同じ経験を二つの設問に書くと書くことがないように見えます。片方を別の経験にするか、別の側面を書いてください。",
          "Pengalaman sama di dua jawaban terlihat minim materi. Ganti salah satu, atau tunjukkan sisi lain."
        )
      };
  }
}

function FinalCheckSection({
  t,
  layout,
  scan,
  review,
  onRunReview,
  hiddenIssues,
  reviewableCount,
  textOf,
  onGoQuestion
}: {
  t: PlatformT;
  layout: ResolvedCover;
  scan: CoverScan;
  review: ReturnType<typeof useAiReview>;
  onRunReview: () => void;
  hiddenIssues: ReturnType<typeof useHiddenIssues>;
  reviewableCount: number;
  textOf: (id: string) => string;
  /** 문제가 있는 문항(과 아는 경우 그 에피소드)으로 바로 이동 — 사용자가 찾아다니지 않게. */
  onGoQuestion: (q: number, episodeId?: string | null) => void;
}) {
  // 예전에는 이 안에서 검사를 직접 다시 구현했고 그 과정에서 '문항 간 내용 중복'이 빠져 있었다.
  // 지금은 화면 위쪽에서 cover-scan 으로 한 번 계산해 내려받는다 — 본문 표시·배지·이 목록이 같은 근거를 쓴다.
  // 줄마다 어느 문항인지 들고 다닌다 — 눌러서 그 문항으로 바로 갈 수 있게.
  const lines: { what: string; why: string; q: number | null; key: string }[] = [];
  for (const [i, question] of layout.questions.entries()) {
    const issues = scan.byQuestion.get(question.id);
    if (!issues?.length) continue;
    const label = `${i + 1}. ${question.prompt.slice(0, 18)}`;
    for (const issue of issues) {
      const key = coverIssueKey(question.id, issue);
      if (hiddenIssues.hidden.has(key)) continue;
      const { what, why } = issueText(issue, t);
      lines.push({ what: `${label} — ${what}`, why, q: i, key });
    }
  }
  for (const k of scan.missingKeywords) {
    if (hiddenIssues.hidden.has(`kw:${k}`)) continue;
    lines.push({
      key: `kw:${k}`,
      // '「…」가 본문에' 처럼 조사를 붙이면 외래어에서 틀린다("Python가"). 다른 줄과 같은 '— ' 형식으로 쓴다.
      what: `${t("소재", "Point", "素材", "Nội dung", "要素", "Poin")} 「${k}」 — ${t("본문에 없어요", "missing from the text", "正文中未出现", "chưa có trong bài", "本文にありません", "belum ada di teks")}`,
      why: t(
        "직접 '반드시 넣을 소재'로 적어 둔 거예요. 가장 어울리는 문항에 한 문장으로 녹여 주세요.",
        "You marked this as a must-include point. Work it into the answer where it fits best.",
        "这是你标记的必写素材。请融入最合适的题目中。",
        "Bạn đã đánh dấu đây là nội dung bắt buộc. Hãy lồng vào câu phù hợp nhất.",
        "自分で「必ず入れる要素」に入れたものです。いちばん合う設問に一文で織り込んでください。",
        "Anda menandainya sebagai poin wajib. Masukkan ke pertanyaan yang paling cocok."
      ),
      q: null
    });
  }
  // AI 지적은 아래에 모은다 — 규칙 결과(바로 고칠 수 있는 것)를 먼저 보게.
  //
  // 점검 단위는 문항이지만 고치는 단위는 에피소드다. 문항까지만 데려다 주면 긴 답변 중
  // 어디를 고칠지는 사용자가 다시 찾아야 한다. 인용 구절이 어느 에피소드에 있는지 찾아
  // 그 에피소드까지 열어 준다(못 찾으면 예전처럼 문항까지만).
  const qIndexOf = new Map(layout.questions.map((q, i) => [q.id, i]));
  const aiLines = review.findings
    .filter((f) => qIndexOf.has(f.id) && !hiddenIssues.hidden.has(`ai:${f.id}:${f.issue}`))
    .map((f) => {
      const qi = qIndexOf.get(f.id) as number;
      const blocks = layout.questions[qi]?.blocks ?? [];
      const episodeId = f.quote ? blocks.find((bid) => textOf(bid).includes(f.quote)) ?? null : null;
      return { q: qi, issue: f.issue, fix: f.fix, episodeId, key: `ai:${f.id}:${f.issue}` };
    });

  // 한 줄 = 무엇이 걸렸나 + 왜·어떻게 + 치우기(×). × 는 마우스를 올렸을 때만 보인다.
  const row = (rk: string, hideKey: string, what: string, why: string, go: (() => void) | null) => (
    <li key={rk} className="group/row break-anywhere text-[11.5px] leading-[1.6] text-[#4E5968]">
      <div className="flex items-start gap-1">
        {go ? (
          <button type="button" onClick={go} className="min-w-0 flex-1 text-left underline-offset-2 transition hover:text-[#0B46E8] hover:underline">
            • {what}
          </button>
        ) : (
          <span className="min-w-0 flex-1">• {what}</span>
        )}
        <button
          type="button"
          onClick={() => hiddenIssues.hide(hideKey)}
          aria-label={t("이 지적 치우기", "Dismiss", "收起该提示", "Bỏ qua", "この指摘を片づける", "Sembunyikan")}
          title={t("안 고치기로 했다면 치워 두세요. 내용을 고치면 다시 보여요.", "Dismiss if you won't act on it. It returns if you edit the text.", "若不打算修改可收起。修改内容后会再次出现。", "Bỏ qua nếu không sửa. Sẽ hiện lại khi bạn sửa nội dung.", "直さないなら片づけてください。内容を直すと再び表示されます。", "Sembunyikan jika tidak akan diubah. Muncul lagi bila teks diubah.")}
          className="mt-[1px] shrink-0 rounded px-1 text-[12px] leading-none text-[#C4CAD2] opacity-0 transition group-hover/row:opacity-100 hover:text-[#8B95A1]"
        >
          ×
        </button>
      </div>
      {why ? <p className="mt-0.5 pl-2.5 text-[11px] leading-[1.6] text-[#8B95A1]">{why}</p> : null}
    </li>
  );

  return (
    <Section title={`${t("제출 전 최종 점검", "Final check", "提交前检查", "Kiểm tra cuối", "提出前チェック", "Cek akhir")} · ${scan.filledPercent}%`}>
      {lines.length === 0 && aiLines.length === 0 ? (
        <p className="text-[12px] text-[#00854A]">
          {review.ran
            ? t("확인할 항목이 없어요.", "Nothing to fix.", "没有待修项。", "Không có gì cần sửa.", "修正点はありません。", "Tidak ada perbaikan.")
            : t("규칙으로 걸리는 건 없어요. 아래에서 AI 점검도 해 보세요.", "Nothing caught by the rules. Try the AI check below.", "规则未发现问题。可试试下方 AI 检查。", "Quy tắc không phát hiện gì. Thử kiểm tra AI bên dưới.", "ルールでの指摘はありません。下のAIチェックもどうぞ。", "Aturan tidak menemukan apa pun. Coba cek AI di bawah.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {lines.map((line, i) => row(`r${i}`, line.key, line.what, line.why, line.q === null ? null : () => onGoQuestion(line.q as number)))}
          {aiLines.map((f, i) =>
            row(`a${i}`, f.key, `${t("AI", "AI")} · ${f.q + 1}. ${layout.questions[f.q]?.prompt.slice(0, 14)} — ${f.issue}`, f.fix, () => onGoQuestion(f.q, f.episodeId))
          )}
        </ul>
      )}

      <button
        type="button"
        onClick={onRunReview}
        // 보낼 답변이 하나도 없으면 누르지 못하게 — 결과가 0건일 수밖에 없는 호출이 된다.
        disabled={review.running || reviewableCount === 0}
        className={`flex h-9 w-full items-center justify-center rounded-[10px] text-[12.5px] font-bold leading-none ${TINT_BTN}`}
      >
        {review.running
          ? t("점검 중…", "Checking…", "检查中…", "Đang kiểm tra…", "チェック中…", "Memeriksa…")
          : review.ran
            ? t("AI로 다시 점검", "Check with AI again", "再用 AI 检查", "Kiểm tra lại bằng AI", "AIで再チェック", "Cek ulang dengan AI")
            : t("AI로 더 점검하기", "Check with AI", "用 AI 检查", "Kiểm tra bằng AI", "AIでチェック", "Cek dengan AI")}
      </button>
      {review.error ? <p className="text-[11.5px] leading-relaxed text-[#F04452]">{review.error}</p> : null}
      {hiddenIssues.hiddenCount > 0 ? (
        <button type="button" onClick={hiddenIssues.showAll} className="self-start text-[11px] text-[#8B95A1] underline-offset-2 hover:text-[#4E5968] hover:underline">
          {t(`치워 둔 ${hiddenIssues.hiddenCount}개 다시 보기`, `Show ${hiddenIssues.hiddenCount} dismissed`, `显示已收起的 ${hiddenIssues.hiddenCount} 条`, `Xem lại ${hiddenIssues.hiddenCount} mục đã bỏ`, `片づけた ${hiddenIssues.hiddenCount} 件を表示`, `Tampilkan ${hiddenIssues.hiddenCount} yang disembunyikan`)}
        </button>
      ) : null}
      <p className="text-[11px] leading-relaxed text-[#B0B8C1]">
        {t(
          "AI 점검은 눌렀을 때만 돌아요. 답변을 고치면 그 문항의 지적은 사라져요.",
          "The AI check runs only when you press it. Edit an answer and its note clears.",
          "AI 检查仅在点击时运行。修改答案后该条提示会消失。",
          "Kiểm tra AI chỉ chạy khi bạn bấm. Sửa câu trả lời thì ghi chú sẽ mất.",
          "AIチェックは押したときだけ動きます。回答を直すとその指摘は消えます。",
          "Cek AI hanya jalan saat ditekan. Ubah jawabannya, catatannya hilang."
        )}
      </p>
    </Section>
  );
}
