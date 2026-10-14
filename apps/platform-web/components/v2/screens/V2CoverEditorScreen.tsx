"use client";

// v2 자기소개서 편집기 — 기존 CoverEditorScreen(전체 화면 3단 편집기)과 같은 데이터·동작을 v2 한 단 화면으로.
//
// 저장 구조는 그대로다.
//   에피소드 내용 → talent 문서(saveCoverDoc) — 앱·기존 화면이 읽는 원본
//   문항·조합     → 편집 중 행(/members/me/doc-versions, snapshot = null) — useDocVersionStore
// '새 버전으로 저장'은 그 순간의 문항·답변을 읽기 전용 저장본으로 남긴다(회사별 제출본).
//
// 화면 순서: 버전 칩 → 문항 카드(누르면 문항 시트) → 제출 전 점검 → 에피소드 모음 → 지원 공고·소재 → 다듬기·가져오기 → A4.
// 편집 패널은 오른쪽 고정 대신 아래에서 올라오는 시트(V2CoverEditorSheets)로 연다.
import Link from "next/link";
import { useMemo, useState } from "react";
import { V2Shell } from "../V2Shell";
import { Actions, Band, Button, Chip, Empty, Masthead, MastheadSkeleton, Page, PageSkeleton, Section, SectionSkeleton, TextLink } from "../ui";
import { useToast } from "../../toast/ToastProvider";
import { PDF_PRINT_AREA, PrintStyles } from "../../talent/career/pdf-print";
import { ImportFromFile } from "../../talent/editor/ImportFromFile";
import { RecentChanges, type ChangePoint } from "../../talent/editor/RecentChanges";
import { ModularCoverPages } from "../../talent/editor/ModularCoverPages";
import { useAiReview, useDocVersionStore, useDropEmptyItems, useEditorOpenedMetric, useFirstContentMetric, useHiddenIssues, type SaveState } from "../../talent/editor/editor-shared";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { trackEditor } from "../../../lib/analytics";
import { useRenewalDocsStatus } from "../../../lib/talent/resume-doc";
import { useBasicInfo, type BasicInfo } from "../../../lib/talent/basic-info";
import { addCoverItem, generateCoverDoc, saveCoverDoc, useCoverDoc, useCoverHistory, type CoverDoc, type CoverItem } from "../../../lib/talent/cover-doc";
import type { CoverLayout, CoverSnapshot, DocVersion } from "../../../lib/talent/doc-versions";
import { addBlock, answerText, autoPlaceCover, charCount, resolveCoverLayout, setBlocks, toStoredCover, addQuestion, type ResolvedCover } from "../../../lib/talent/cover-layout";
import { coverIssueQuotes } from "../../../lib/talent/cover-scan";
import { importCoverLetter, reviewCover } from "../../../lib/resume-maker-client";
import { importedCoverToItems } from "../../../lib/talent/import-to-renewal";
import { diffCoverDocs } from "../../../lib/talent/doc-diff";
import { restoreCoverVersion } from "../../../lib/talent/renewal-docs-store";
import { V2CoverBulkTidy, V2CoverCharGauge, V2CoverDocContext, V2CoverFinalCheck, V2CoverLock, V2CoverSaveSheet, buildCoverScan, coverIssueKey } from "./V2CoverEditorParts";
import { V2CoverEpisodeSheet, V2CoverQuestionSheet } from "./V2CoverEditorSheets";

const R = {
  career: "/v2/career",
  resume: "/v2/resume",
  preview: "/v2/cover/preview"
} as const;

export function V2CoverEditorScreen() {
  return (
    <V2Shell requireAuth>
      <EditorGate />
    </V2Shell>
  );
}

function EditorGate() {
  const t = usePlatformT();
  const doc = useCoverDoc();
  const status = useRenewalDocsStatus();
  // 아직 자소서가 없으면 먼저 '새로 만들기 / 써 둔 자소서로 만들기'를 고르게 한다.
  // 새로 만들기는 빈 문서로 시작하고 첫 에피소드를 쓰는 순간 계정에 저장된다.
  // 가져오기를 적용하면 그 순간 문서가 저장돼 doc 이 생기므로 자연히 편집기로 넘어간다.
  const empty = useMemo(() => generateCoverDoc(), []);
  const [startNew, setStartNew] = useState(false);
  useEditorOpenedMetric("cover", status === "loaded", !!doc);

  if (status !== "loaded") return <PageSkeleton />;
  if (!doc && !startNew) return <StartChooser t={t} empty={empty} onNew={() => setStartNew(true)} />;
  return <Editor doc={doc ?? empty} />;
}

// ── 시작 고르기 ─────────────────────────────────────

function StartChooser({ t, empty, onNew }: { t: PlatformT; empty: CoverDoc; onNew: () => void }) {
  const [importing, setImporting] = useState(false);
  const option = (active: boolean) => `flex w-full items-start gap-4 rounded-3xl p-5 text-left transition ${active ? "bg-[color:var(--v2-accent-weak)]" : "bg-[color:var(--v2-band)] hover:bg-[color:var(--v2-line)]"}`;
  return (
    <Page>
      <Masthead
        eyebrow={<Link href={R.career} className="hover:text-[color:var(--v2-ink-3)]">‹ {t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier")}</Link>}
        title={t("자기소개서를 어떻게 시작할까요?", "How do you want to start your cover letter?", "要如何开始写自我介绍？", "Bạn muốn bắt đầu thư giới thiệu thế nào?", "自己紹介書をどう始めますか？", "Mau mulai surat lamaran dari mana?")}
        lede={t("어느 쪽으로 시작해도 나중에 얼마든지 고칠 수 있어요.", "Either way, you can edit everything later.", "无论选哪种，之后都可以随时修改。", "Chọn cách nào cũng có thể sửa sau.", "どちらで始めても、あとで自由に直せます。", "Pilih yang mana pun, nanti tetap bisa diubah.")}
      />
      <div className="flex flex-col gap-3 px-5">
        <button
          type="button"
          onClick={() => {
            trackEditor("editor_start_selected", { doc: "cover", method: "new" });
            onNew();
          }}
          className={option(false)}
        >
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[22px]">✏️</span>
          <span className="min-w-0">
            <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{t("새로 만들기", "Start from scratch", "从头开始", "Tạo mới", "新しく作る", "Buat baru")}</span>
            <span className="mt-1 block text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{t("문항을 고르고 답변을 처음부터 써요.", "Pick the questions and write your answers from the start.", "选择题目，从头开始写答案。", "Chọn câu hỏi và viết câu trả lời từ đầu.", "設問を選び、回答を最初から書きます。", "Pilih pertanyaan dan tulis jawaban dari awal.")}</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!importing) trackEditor("editor_start_selected", { doc: "cover", method: "import" });
            setImporting(true);
          }}
          aria-expanded={importing}
          className={option(importing)}
        >
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[22px]">📄</span>
          <span className="min-w-0">
            <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{t("써 둔 자기소개서로 만들기", "Use a cover letter I already have", "用已有的自我介绍制作", "Dùng thư giới thiệu có sẵn", "手持ちの自己紹介書から作る", "Pakai surat lamaran yang sudah ada")}</span>
            <span className="mt-1 block text-[15px] leading-[1.6] text-[color:var(--v2-muted)]">{t("PDF를 올리거나 내용을 붙여넣으면 답변을 에피소드로 나눠 채워 드려요.", "Upload a PDF or paste the text and we'll split your answers into episodes.", "上传 PDF 或粘贴内容，我们会把答案拆分成经历填好。", "Tải PDF hoặc dán nội dung, câu trả lời sẽ được chia thành các đoạn kể.", "PDFを上げるか本文を貼り付けると、回答をエピソードに分けて入れます。", "Unggah PDF atau tempel teks, jawaban dibagi jadi episode.")}</span>
          </span>
        </button>
        {importing ? (
          <div className="rounded-3xl bg-[color:var(--v2-fill)] p-5">
            <ImportFromFile
              t={t}
              title={t("자기소개서 가져오기", "Import your cover letter", "导入自我介绍", "Nhập thư giới thiệu", "自己紹介書を取り込む", "Impor surat lamaran")}
              hint={t("PDF를 올리거나 내용을 붙여넣어 주세요. 답변은 에피소드로 들어가고, 어느 문항에 쓸지는 직접 고르면 돼요.", "Upload a PDF or paste the text. Answers become episodes, and you choose which question each one goes to.", "请上传 PDF 或粘贴内容。答案会成为经历，放入哪个题目由你决定。", "Tải PDF hoặc dán nội dung. Câu trả lời thành đoạn kể, bạn chọn dùng cho câu nào.", "PDFを上げるか本文を貼り付けてください。回答はエピソードになり、どの設問に使うかは自分で選べます。", "Unggah PDF atau tempel teks. Jawaban jadi episode, kamu pilih untuk pertanyaan mana.")}
              parse={async (input) => importedCoverToItems((await importCoverLetter(input)).items)}
              summarize={(items) => (items.length ? [{ label: t("에피소드", "Episodes", "经历", "Đoạn kể", "エピソード", "Episode"), count: items.length }] : [])}
              onApply={(items) => {
                trackEditor("editor_import_applied", { doc: "cover", where: "start", count: items.length });
                saveCoverDoc({ ...empty, items }, { label: "파일에서 가져오기", force: true });
              }}
            />
          </div>
        ) : null}
      </div>
    </Page>
  );
}

// ── 편집기 ───────────────────────────────────────────

/** 열려 있는 시트 — 문항 하나, 또는 에피소드 하나(문항에서 열었으면 그 문항 번호). */
type Open = { kind: "question"; q: number } | { kind: "episode"; id: string; q: number | null } | { kind: "save" } | null;

function Editor({ doc }: { doc: CoverDoc }) {
  const t = usePlatformT();
  const toast = useToast();
  const info = useBasicInfo();
  const store = useDocVersionStore<CoverLayout, CoverSnapshot>("cover", t);
  const { working, current } = store;
  const [open, setOpen] = useState<Open>(null);
  // 파일에서 가져오기 되돌리기용. 훅이라 조기 반환(저장본 보기)보다 위에 있어야 한다.
  const [importUndo, setImportUndo] = useState<CoverDoc | null>(null);
  const selectedId = open?.kind === "episode" ? open.id : null;
  useFirstContentMetric("cover", doc.items.some((it) => it.text.trim()));
  // 내용 없이 남은 에피소드는 손을 뗐을 때 지운다('새로 쓰기'만 눌러 두고 떠난 빈 칸).
  useDropEmptyItems({
    items: doc.items,
    isEmpty: (it) => !it.text.trim(),
    selectedId,
    sheetOpen: open?.kind === "question" || open?.kind === "episode",
    drop: (ids) => saveCoverDoc({ ...doc, items: doc.items.filter((it) => !ids.includes(it.id)) }),
    deselect: () => setOpen(null)
  });
  const coverHistory = useCoverHistory();

  // 편집 중 구성 — 앱·기존 화면에서 새로 쓴 단락이 빠지지 않게 원래 문항에 넣어 보여 준다.
  const layout: ResolvedCover | null = useMemo(() => (working ? autoPlaceCover(resolveCoverLayout(working.layout, doc), doc) : null), [working, doc]);
  // 전체 점검(규칙만, AI 호출 없음) — 카드 배지·A4 형광펜·최종 점검이 같은 결과를 쓴다.
  const scan = useMemo(() => (layout ? buildCoverScan(doc, layout, (id) => doc.items.find((i) => i.id === id)?.text ?? "") : null), [doc, layout]);
  // AI 점검 — 버튼을 눌렀을 때만. 점검 단위는 문항이라 '문항 id → 지금 답변'.
  const answers = useMemo(() => {
    const textOfId = (id: string) => doc.items.find((i) => i.id === id)?.text ?? "";
    return new Map((layout?.questions ?? []).map((q) => [q.id, answerText(q.blocks.map(textOfId))]));
  }, [doc, layout]);
  const review = useAiReview("cover", answers);
  const hiddenIssues = useHiddenIssues("cover");
  // A4 에 칠할 것 — 문항 id → 형광펜 구절(규칙 + AI).
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
    return (
      <Page>
        <MastheadSkeleton action={false} />
        <SectionSkeleton rows={3} thumb={false} />
        <SectionSkeleton rows={2} thumb={false} />
      </Page>
    );
  }

  const copyAnswer = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("답변을 복사했어요", "Answer copied", "已复制答案", "Đã sao chép câu trả lời", "回答をコピーしました", "Jawaban disalin"));
    } catch {
      toast.error(t("복사하지 못했어요", "Couldn't copy", "无法复制", "Không sao chép được", "コピーできませんでした", "Gagal menyalin"));
    }
  };
  const printPdf = () => {
    trackEditor("editor_pdf_download", { doc: "cover", source: "editor" });
    window.print();
  };

  const head = (
    <EditorHead
      t={t}
      working={working}
      saved={store.saved}
      current={current}
      saveState={store.saveState}
      onPick={(id) => {
        store.setCurrentId(id);
        setOpen(null);
      }}
      onSaveNew={() => setOpen({ kind: "save" })}
      onPdf={printPdf}
    />
  );
  const saveSheet =
    open?.kind === "save" ? <V2CoverSaveSheet t={t} onClose={() => setOpen(null)} onSave={(name) => store.saveAsNew(name, toStoredCover(layout), { cover: doc, basicInfo: info })} /> : null;

  // ── 저장본 보기(읽기 전용) — 문항별 답변 복사는 된다 ──
  if (current.snapshot) {
    const snapDoc = current.snapshot.cover;
    const snapInfo = current.snapshot.basicInfo ?? info;
    const snapLayout = resolveCoverLayout(current.layout, snapDoc);
    const snapText = (id: string) => snapDoc.items.find((i) => i.id === id)?.text ?? "";
    return (
      <Page>
        <PrintStyles />
        {head}
        <SavedView t={t} version={current} layout={snapLayout} textOf={snapText} onCopy={(text) => void copyAnswer(text)} onRename={(name) => store.renameSaved(current.id, name)} onDelete={() => void store.removeSaved(current.id)} />
        <A4Section t={t} doc={snapDoc} info={snapInfo} layout={snapLayout} />
        <PrintCopy doc={snapDoc} info={snapInfo} layout={snapLayout} />
      </Page>
    );
  }

  const commitLayout = (next: ResolvedCover) => store.setWorkingLayout(toStoredCover(next));
  const textOf = (id: string) => doc.items.find((i) => i.id === id)?.text ?? "";
  const setText = (id: string, text: string) => saveCoverDoc({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, text } : it)) });
  // 문서 단위 AI 재료(지원 공고·필수 소재) — 자소서 전체에 적용된다.
  const setDocMeta = (patch: Partial<CoverDoc>) => saveCoverDoc({ ...doc, ...patch });
  // 새 에피소드 — 문항에서 쓰면 그 문항 끝에 넣고, 모음에서 쓰면 어느 문항에도 넣지 않는다(넣을 문항은 시트에서 고른다).
  const newEpisode = (q: number | null) => {
    const prompt = q != null ? (layout.questions[q]?.prompt ?? "") : "";
    const { doc: next, id } = addCoverItem(doc, prompt, "");
    saveCoverDoc(next);
    if (q != null && layout.questions[q]) commitLayout(addBlock(resolveCoverLayout(toStoredCover(layout), next), next, q, id));
    setOpen({ kind: "episode", id, q });
  };
  const deleteEpisode = (id: string) => {
    if (!window.confirm(t("이 에피소드를 삭제할까요? 이미 저장한 버전에는 그대로 남아요.", "Delete this episode? Saved versions keep it.", "要删除此经历吗？已保存的版本仍会保留。", "Xóa đoạn này? Các bản đã lưu vẫn giữ.", "このエピソードを削除しますか？保存済みのバージョンには残ります。", "Hapus episode ini? Versi tersimpan tetap menyimpannya."))) return;
    saveCoverDoc({ ...doc, items: doc.items.filter((it) => it.id !== id) });
    setOpen(null);
  };
  // 문항 AI 다듬기 결과 — 다듬은 답변을 새 에피소드로 만들어 이 문항의 답으로 바꾼다(원래 에피소드는 모음에 남는다).
  const applyPolishedAnswer = (qi: number, text: string) => {
    const prompt = layout.questions[qi]?.prompt ?? "";
    const { doc: next, id } = addCoverItem(doc, prompt, text);
    saveCoverDoc(next);
    commitLayout(setBlocks(resolveCoverLayout(toStoredCover(layout), next), next, qi, [id]));
  };
  const applyCoverImport = (items: CoverItem[]) => {
    trackEditor("editor_import_applied", { doc: "cover", where: "panel", count: items.length });
    setImportUndo(doc);
    saveCoverDoc({ ...doc, items: [...doc.items, ...items] }, { label: "파일에서 가져오기", force: true });
  };
  // 답변이 빈 문항은 AI 에 보내지 않는다 — 규칙 점검('아직 작성 안 됨')과 같은 말이 두 번 나온다.
  const reviewable = layout.questions.filter((q) => (answers.get(q.id) ?? "").trim());
  const runReview = () =>
    void review.run(() =>
      reviewCover({
        company: doc.companyName?.trim() || undefined,
        jobText: doc.jobText?.trim() || undefined,
        questions: reviewable.map((q) => ({ id: q.id, prompt: q.prompt, limit: q.limit, text: answers.get(q.id) ?? "" }))
      })
    );
  const addNewQuestion = () => {
    commitLayout(addQuestion(layout, doc, t("새 문항", "New question", "新题目", "Câu hỏi mới", "新しい設問", "Pertanyaan baru")));
    setOpen({ kind: "question", q: layout.questions.length });
  };
  const changePoints: ChangePoint[] = coverHistory.map((v) => ({ savedAt: v.savedAt, label: v.label, change: diffCoverDocs(v.doc, doc) }));
  const unplaced = new Set(layout.unplaced);

  return (
    <Page>
      <PrintStyles />
      {head}

      {/* 문항 — 카드 하나가 문항 하나. 누르면 답변·에피소드·설정을 고치는 시트가 열린다. */}
      <Section title={t("문항", "Questions", "题目", "Câu hỏi", "設問", "Pertanyaan")} aside={<TextLink onClick={addNewQuestion}>+ {t("문항 추가", "Add", "添加", "Thêm", "追加", "Tambah")}</TextLink>}>
        {layout.questions.length === 0 ? (
          <Empty>{t("문항을 추가하고 에피소드를 넣으면 자기소개서가 돼요.", "Add questions and episodes to build your cover letter.", "添加题目并放入经历即可组成自我介绍。", "Thêm câu hỏi và đoạn kể để tạo thư giới thiệu.", "設問を追加してエピソードを入れると自己紹介書になります。", "Tambah pertanyaan dan episode untuk menyusun surat lamaran.")}</Empty>
        ) : (
          <ul className="flex flex-col gap-3">
            {layout.questions.map((question, i) => {
              const answer = answerText(question.blocks.map(textOf));
              const issues = (scan.byQuestion.get(question.id) ?? []).filter((x) => !hiddenIssues.hidden.has(coverIssueKey(question.id, x)));
              return (
                <li key={question.id}>
                  <button type="button" onClick={() => setOpen({ kind: "question", q: i })} className="block w-full rounded-3xl bg-[color:var(--v2-band)] p-5 text-left transition hover:bg-[color:var(--v2-line)]">
                    <span className="flex items-center gap-2">
                      <span className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{t(`문항 ${i + 1}`, `Question ${i + 1}`, `题目 ${i + 1}`, `Câu ${i + 1}`, `設問 ${i + 1}`, `Pertanyaan ${i + 1}`)}</span>
                      {issues.length ? (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-bold text-[color:var(--v2-attention)]">
                          {t(`확인 ${issues.length}`, `${issues.length} to check`, `待查 ${issues.length}`, `${issues.length} cần xem`, `確認 ${issues.length}`, `${issues.length} dicek`)}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[17px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{question.prompt || t("(문항 없음)", "(no prompt)", "（无题目）", "(chưa có câu hỏi)", "（設問なし）", "(tanpa pertanyaan)")}</span>
                    <span className={`mt-2 line-clamp-3 whitespace-pre-line text-[15px] leading-[1.6] ${answer ? "text-[color:var(--v2-ink-3)]" : "text-[color:var(--v2-faint)]"}`}>
                      {answer || t("눌러서 에피소드를 넣어 답변을 만들어요.", "Tap to add episodes and build the answer.", "点击放入经历来组成答案。", "Chạm để thêm đoạn kể và tạo câu trả lời.", "押してエピソードを入れ、回答を作ります。", "Ketuk untuk menambah episode dan menyusun jawaban.")}
                    </span>
                    <span className="mt-3 block">
                      <V2CoverCharGauge t={t} count={charCount(answer)} limit={question.limit} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={`${t("제출 전 점검", "Final check", "提交前检查", "Kiểm tra cuối", "提出前チェック", "Cek akhir")} · ${scan.filledPercent}%`}>
        <V2CoverFinalCheck
          t={t}
          layout={layout}
          scan={scan}
          review={review}
          onRunReview={runReview}
          hiddenIssues={hiddenIssues}
          reviewableCount={reviewable.length}
          textOf={textOf}
          onGo={(q, episodeId) => setOpen(episodeId ? { kind: "episode", id: episodeId, q } : { kind: "question", q })}
        />
      </Section>

      {/* 에피소드 모음 — 경험 이야기 한 단락이 하나의 모듈. 문항에 넣어 답변을 조립한다. */}
      <Section title={t("에피소드", "Episodes", "经历", "Đoạn kể", "エピソード", "Episode")} aside={<TextLink onClick={() => newEpisode(null)}>+ {t("새로 쓰기", "New", "新建", "Viết mới", "新規", "Baru")}</TextLink>}>
        <p className="-mt-1 mb-3 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
          {t("경험 이야기 한 단락이 하나의 에피소드예요. 같은 에피소드를 여러 문항에 써도 돼요.", "Each story paragraph is one episode. You can reuse an episode across questions.", "每段经历故事是一个经历模块，可在多个题目中重复使用。", "Mỗi đoạn kể là một mô-đun. Có thể dùng lại ở nhiều câu hỏi.", "経験の一段落が一つのエピソードです。同じエピソードを複数の設問に使えます。", "Setiap paragraf cerita adalah satu episode. Boleh dipakai di beberapa pertanyaan.")}
        </p>
        {doc.items.length === 0 ? (
          <Empty>{t("아직 에피소드가 없어요.", "No episodes yet.", "还没有经历。", "Chưa có đoạn kể.", "まだエピソードがありません。", "Belum ada episode.")}</Empty>
        ) : (
          <ul className="flex flex-col gap-2">
            {doc.items.map((it) => {
              const usedIn = layout.questions.map((x, i) => (x.blocks.includes(it.id) ? i + 1 : 0)).filter(Boolean);
              const isNew = !usedIn.length && unplaced.has(it.id);
              const usage = usedIn.length
                ? t(`문항 ${usedIn.join("·")}에 사용`, `Used in Q${usedIn.join(", Q")}`, `用于题目 ${usedIn.join("·")}`, `Dùng ở câu ${usedIn.join(", ")}`, `設問 ${usedIn.join("·")} で使用`, `Dipakai di P${usedIn.join(", P")}`)
                : isNew
                  ? t("새 에피소드 · 문항에 넣어 주세요", "New · add it to a question", "新经历 · 请放入题目", "Mới · hãy thêm vào câu hỏi", "新規 · 設問に入れてください", "Baru · masukkan ke pertanyaan")
                  : t("안 씀", "Not used", "未使用", "Chưa dùng", "未使用", "Tidak dipakai");
              return (
                <li key={it.id}>
                  <button type="button" onClick={() => setOpen({ kind: "episode", id: it.id, q: null })} className="block w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3.5 text-left transition hover:bg-[color:var(--v2-band)]">
                    <span className="line-clamp-3 text-[15px] leading-[1.6] text-[color:var(--v2-ink-2)]">{it.text.trim() || t("(내용 없음)", "(empty)", "（无内容）", "(trống)", "（内容なし）", "(kosong)")}</span>
                    <span className={`mt-1.5 block text-[13px] ${isNew ? "font-semibold text-[color:var(--v2-attention)]" : "text-[color:var(--v2-faint)]"}`}>{usage}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={t("지원 공고 · 소재", "Posting & points", "目标招聘·素材", "Tin tuyển & ý chính", "応募求人・要素", "Lowongan & poin")}>
        <V2CoverDocContext t={t} doc={doc} onDocMeta={setDocMeta} />
      </Section>

      <Section title={t("다듬기 · 가져오기", "Polish & import", "润色·导入", "Chỉnh & nhập", "整える・取り込む", "Rapikan & impor")}>
        <div className="flex flex-col gap-4">
          <V2CoverBulkTidy t={t} doc={doc} onDoc={saveCoverDoc} />
          <div className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
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
              onApply={applyCoverImport}
              onUndo={
                importUndo
                  ? () => {
                      saveCoverDoc(importUndo);
                      setImportUndo(null);
                    }
                  : null
              }
            />
          </div>
          {changePoints.length ? (
            <div className="rounded-2xl bg-[color:var(--v2-fill)] p-4 empty:hidden">
              <RecentChanges t={t} points={changePoints} onRestore={(at) => void restoreCoverVersion(at)} />
            </div>
          ) : null}
        </div>
      </Section>

      <A4Section
        t={t}
        doc={doc}
        info={info}
        layout={layout}
        interaction={{
          activeQ: open?.kind === "question" ? open.q : open?.kind === "episode" && open.q != null ? open.q : -1,
          selectedId,
          flaggedQuestions,
          onActivate: (qi) => setOpen({ kind: "question", q: qi }),
          onSelect: (qi, id) => setOpen({ kind: "episode", id, q: qi })
        }}
      />

      <PrintCopy doc={doc} info={info} layout={layout} />

      {open?.kind === "question" ? (
        <V2CoverQuestionSheet
          t={t}
          doc={doc}
          layout={layout}
          q={Math.min(open.q, Math.max(layout.questions.length - 1, 0))}
          scan={scan}
          textOf={textOf}
          onLayout={commitLayout}
          onQ={(q) => setOpen(q == null ? null : { kind: "question", q })}
          onOpenEpisode={(id) => setOpen({ kind: "episode", id, q: open.q })}
          onNewEpisode={() => newEpisode(open.q)}
          onCopy={(text) => void copyAnswer(text)}
          onPolishedAnswer={(text) => applyPolishedAnswer(open.q, text)}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {open?.kind === "episode" ? (
        <V2CoverEpisodeSheet
          t={t}
          doc={doc}
          layout={layout}
          id={open.id}
          q={open.q}
          textOf={textOf}
          onLayout={commitLayout}
          onQ={(q) => setOpen({ kind: "episode", id: open.id, q })}
          onText={setText}
          onDelete={deleteEpisode}
          onBack={open.q != null ? () => setOpen({ kind: "question", q: open.q as number }) : null}
          onClose={() => setOpen(null)}
        />
      ) : null}
      {saveSheet}
    </Page>
  );
}

// ── 머리말 · 버전 ─────────────────────────────────────

function EditorHead({
  t,
  working,
  saved,
  current,
  saveState,
  onPick,
  onSaveNew,
  onPdf
}: {
  t: PlatformT;
  working: DocVersion<CoverLayout, CoverSnapshot>;
  saved: DocVersion<CoverLayout, CoverSnapshot>[];
  current: DocVersion<CoverLayout, CoverSnapshot>;
  saveState: SaveState;
  onPick: (id: string) => void;
  onSaveNew: () => void;
  onPdf: () => void;
}) {
  const editing = current.snapshot === null;
  const saveLabel =
    saveState === "saving"
      ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…")
      : saveState === "error"
        ? t("저장 실패 · 다시 시도해 주세요", "Save failed · try again", "保存失败，请重试", "Lưu thất bại · thử lại", "保存に失敗しました", "Gagal menyimpan")
        : saveState === "saved"
          ? t("자동 저장됨", "Auto-saved", "已自动保存", "Đã tự lưu", "自動保存済み", "Tersimpan otomatis")
          : "";
  return (
    <div className="no-print">
      <Masthead
        eyebrow={<Link href={R.career} className="hover:text-[color:var(--v2-ink-3)]">‹ {t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier")}</Link>}
        title={t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}
        lede={t("경험 이야기(에피소드)를 문항에 넣어 답변을 만들어요. 쓰는 대로 저장돼요.", "Put your stories (episodes) into questions to build answers. Saved as you type.", "把经历故事放入题目组成答案，边写边保存。", "Đưa đoạn kể vào câu hỏi để tạo câu trả lời. Tự lưu khi gõ.", "経験（エピソード）を設問に入れて回答を作ります。書くたびに保存されます。", "Masukkan cerita (episode) ke pertanyaan untuk menyusun jawaban. Tersimpan otomatis.")}
        action={
          <Actions>
            <Button size="sm" variant="secondary" onClick={onSaveNew} disabled={!editing}>
              {t("새 버전으로 저장", "Save version", "另存新版本", "Lưu bản mới", "新バージョン保存", "Simpan versi")}
            </Button>
            <Button size="sm" variant="neutral" href={R.preview}>
              {t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}
            </Button>
            <Button size="sm" variant="neutral" onClick={onPdf}>
              PDF
            </Button>
            <Button size="sm" variant="neutral" href={R.resume}>
              {t("이력서", "Resume", "简历", "CV", "履歴書", "CV")}
            </Button>
          </Actions>
        }
      />
      {/* 버전 — 편집 중 하나와 읽기 전용 저장본들. 가로로 넘긴다. */}
      <div className="-mt-3 px-5 pb-6">
        <nav aria-label={t("버전", "Versions", "版本", "Phiên bản", "バージョン", "Versi")} className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip active={current.id === working.id} onClick={() => onPick(working.id)}>
            {t("편집 중", "Editing", "编辑中", "Đang sửa", "編集中", "Diedit")}
          </Chip>
          {saved.map((v) => (
            <Chip key={v.id} active={current.id === v.id} onClick={() => onPick(v.id)}>
              <span className="inline-flex max-w-[180px] items-center gap-1.5">
                <V2CoverLock />
                <span className="truncate">{v.name}</span>
              </span>
            </Chip>
          ))}
        </nav>
        {/* 자동 저장 상태 — 한 줄 자리를 미리 잡아 두어 글자가 바뀌어도 아래가 흔들리지 않게 */}
        <p className={`mt-2 h-5 text-[13px] ${saveState === "error" ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-faint)]"}`} aria-live="polite">
          {editing ? saveLabel : t("저장본은 고칠 수 없어요 · 답변 복사는 돼요", "Saved versions are read-only · you can copy answers", "保存版本不可修改 · 可复制答案", "Bản đã lưu chỉ đọc · vẫn sao chép được", "保存版は編集不可 · 回答コピーは可能", "Versi tersimpan hanya baca · bisa salin jawaban")}
        </p>
      </div>
    </div>
  );
}

// ── 저장본 ──────────────────────────────────────────

function SavedView({
  t,
  version,
  layout,
  textOf,
  onCopy,
  onRename,
  onDelete
}: {
  t: PlatformT;
  version: DocVersion<CoverLayout, CoverSnapshot>;
  layout: Pick<ResolvedCover, "questions">;
  textOf: (id: string) => string;
  onCopy: (text: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  return (
    <>
      <Section title={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{t("이름", "Name", "名称", "Tên", "名前", "Nama")}</span>
          <input
            key={version.id}
            defaultValue={version.name}
            maxLength={60}
            onChange={(e) => e.target.value.trim() && onRename(e.target.value.trim())}
            className="h-12 w-full rounded-2xl bg-[color:var(--v2-fill)] px-4 text-[16px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition focus:bg-white focus:ring-2"
          />
        </label>
        <p className="mt-2 text-[14px] text-[color:var(--v2-faint)]">
          {t("저장한 때", "Saved", "保存时间", "Đã lưu lúc", "保存日時", "Disimpan")} · {new Date(version.createdAt).toLocaleString()}
        </p>
        <p className="mt-3 flex items-start gap-2 rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
          <V2CoverLock className="mt-[3px] h-3.5 w-3.5" />
          {t(
            "저장한 순간 그대로 보관돼요. 지원할 때 이 저장본을 골라 쓸 수 있어요. 고치려면 '편집 중'에서 수정한 뒤 새 버전으로 저장해 주세요.",
            "Kept exactly as saved, and you can pick it when applying. To change it, edit under 'Editing' and save a new version.",
            "按保存时原样保留，投递时可选用。如需修改，请在「编辑中」修改后另存为新版本。",
            "Giữ nguyên như lúc lưu và có thể chọn khi ứng tuyển. Muốn đổi, hãy sửa ở 'Đang sửa' rồi lưu bản mới.",
            "保存時のまま保管され、応募時に選べます。変更するには「編集中」で修正して新バージョンで保存してください。",
            "Disimpan persis seperti saat disimpan dan bisa dipilih saat melamar. Untuk mengubah, edit di 'Diedit' lalu simpan versi baru."
          )}
        </p>
      </Section>
      <Section title={t("문항별 답변", "Answers", "各题答案", "Câu trả lời", "設問別の回答", "Jawaban")}>
        <ul className="flex flex-col gap-3">
          {layout.questions.map((question, i) => {
            const text = answerText(question.blocks.map(textOf));
            return (
              <li key={question.id} className="rounded-3xl bg-[color:var(--v2-band)] p-5">
                <p className="text-[14px] font-semibold text-[color:var(--v2-muted)]">{t(`문항 ${i + 1}`, `Question ${i + 1}`, `题目 ${i + 1}`, `Câu ${i + 1}`, `設問 ${i + 1}`, `Pertanyaan ${i + 1}`)}</p>
                <p className="mt-1 text-[17px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{question.prompt}</p>
                <p className="mt-2 line-clamp-4 whitespace-pre-line text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{text || "—"}</p>
                <div className="mt-3">
                  <V2CoverCharGauge t={t} count={charCount(text)} limit={question.limit} />
                </div>
                <div className="mt-3">
                  <Button size="sm" variant="white" onClick={() => onCopy(text)} disabled={!text}>
                    {t("답변 복사", "Copy answer", "复制答案", "Sao chép", "回答をコピー", "Salin jawaban")}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-5">
          <Button full variant="neutral" onClick={onDelete}>
            <span className="text-[color:var(--v2-attention)]">{t("저장본 삭제", "Delete saved version", "删除保存版本", "Xóa bản đã lưu", "保存版を削除", "Hapus versi tersimpan")}</span>
          </Button>
        </div>
      </Section>
    </>
  );
}

// ── A4 ────────────────────────────────────────────

/** A4 로 보기 — 실제 PDF 와 같은 페이지 나눔. 편집 중엔 문항·문단을 눌러 바로 시트를 연다. */
function A4Section({ t, doc, info, layout, interaction }: { t: PlatformT; doc: CoverDoc; info: BasicInfo; layout: Pick<ResolvedCover, "questions">; interaction?: Parameters<typeof ModularCoverPages>[0]["interaction"] }) {
  return (
    <>
      <Band />
      <section className="no-print px-5 pb-7 pt-8 md:pb-9 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("A4로 보기", "A4 view", "A4 查看", "Xem A4", "A4で見る", "Tampilan A4")}</h2>
          <TextLink href={R.preview}>{t("크게 보기", "Full view", "放大查看", "Xem lớn", "大きく見る", "Lihat besar")} ›</TextLink>
        </div>
        <div className="mt-3 overflow-hidden rounded-3xl bg-[color:var(--v2-band)] p-3 md:p-5">
          <ModularCoverPages doc={doc} info={info} layout={layout} interaction={interaction} />
        </div>
      </section>
    </>
  );
}

/** PDF 저장용 사본 — 편집 표시 없이 같은 A4 로. 화면 밖에 두되 폭은 유지해 페이지 나눔을 미리 잰다. */
function PrintCopy({ doc, info, layout }: { doc: CoverDoc; info: BasicInfo; layout: Pick<ResolvedCover, "questions"> }) {
  return (
    <div aria-hidden className={`pointer-events-none fixed -left-[99999px] top-0 w-[794px] print:left-0 ${PDF_PRINT_AREA}`}>
      <ModularCoverPages doc={doc} info={info} layout={layout} />
    </div>
  );
}
