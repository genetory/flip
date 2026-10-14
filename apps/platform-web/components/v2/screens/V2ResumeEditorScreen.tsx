"use client";

// v2 이력서 편집 — 기존 모듈형 에디터(ResumeEditorScreen)와 같은 데이터·동작을 v2 모양으로.
//
// 편집하는 이력서는 하나다(기존과 같다).
//   모듈 내용 → talent 문서(saveResumeDoc / saveBasicInfo) — 앱·매칭·인재 검색이 읽는 원본
//   구성      → 편집 중 행(/members/me/doc-versions, snapshot = null)
// '새 버전으로 저장'은 그 순간의 내용·구성을 읽기 전용 저장본으로 남긴다(지원할 때 고른다).
//
// 화면 짜임(v2)
//  - 위: 제목·자동 저장 상태·[PDF 저장]·[미리보기], 그 아래 버전 칩 줄과 [새 버전으로 저장].
//  - 넓은 화면: 왼쪽 A4 미리보기(누르면 그 모듈 편집·끌어서 순서 바꾸기) + 오른쪽 패널(항목·점검·도구 탭).
//  - 좁은 화면: 같은 탭에 '미리보기'를 더하고, 모듈 편집은 아래에서 올라오는 시트로.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { V2Shell } from "../V2Shell";
import { Sheet } from "../sheets";
import { Button, Chip, Page, PageSkeleton, Spinner, TextLink } from "../ui";
import { V2Card, V2Check, V2Field, V2PdfButton, V2_INPUT_CLS, useIsWide } from "./V2ResumeParts";
import { PDF_PRINT_AREA, PrintStyles } from "../../talent/career/pdf-print";
import { ModularResumePages, type DropSlot, type EditorInteraction } from "../../talent/editor/ModularResumePages";
import { ImportFromFile, resumeImportSummary } from "../../talent/editor/ImportFromFile";
import { RecentChanges, type ChangePoint } from "../../talent/editor/RecentChanges";
import { AiPolish } from "../../talent/editor/AiPolish";
import { useAiReview, useDocVersionStore, useDropEmptyItems, useEditorOpenedMetric, useFirstContentMetric, useHiddenIssues } from "../../talent/editor/editor-shared";
import { useToast } from "../../toast/ToastProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import type { CareerSection } from "../../../lib/talent/career-chat";
import { sectionLabelOf } from "../../../lib/talent/career-labels";
import { saveBasicInfo, useBasicInfo, type BasicInfo } from "../../../lib/talent/basic-info";
import { addResumeItem, displayMonth, generateResumeDoc, normalizeMonth, saveResumeDoc, useRenewalDocsStatus, useResumeDoc, useResumeHistory, type ResumeDoc } from "../../../lib/talent/resume-doc";
import { FIXED_MODULES, isFixedModule, type DocVersion, type ResumeLayout, type ResumeSnapshot } from "../../../lib/talent/doc-versions";
import { hideModule, locate, moveModuleTo, moveToOtherColumn, nudgeModule, placeAllUnplaced, placeModule, resolveLayout, setTemplate, toStoredLayout, type ResolvedLayout } from "../../../lib/talent/resume-layout";
import { resumeIssueQuotes, scanResume, type ResumeScan, type ResumeScanIssue } from "../../../lib/talent/resume-scan";
import { polishExperienceText, polishSelfIntro, polishResumeItems, reviewResume, importResume } from "../../../lib/resume-maker-client";
import { importedResumeToPreview, type ImportPreview } from "../../../lib/talent/import-to-renewal";
import { trackEditor } from "../../../lib/analytics";
import { diffResumeDocs, isEmptyChange } from "../../../lib/talent/doc-diff";
import { restoreResumeVersion } from "../../../lib/talent/renewal-docs-store";

// 항목 목록·새 항목 추가에 쓰는 섹션 순서(기존 편집 화면과 같다).
const SECTIONS: CareerSection[] = ["experience", "project", "certificate", "language", "skill", "activity", "award", "education"];

const ROUTES = { career: "/v2/career", preview: "/v2/resume/preview", cover: "/v2/cover" } as const;

type ItemPatch = Partial<{ text: string; company: string; startDate: string; endDate: string; section: CareerSection }>;
type DocPatchOpts = { label?: string; force?: boolean };
type Tab = "items" | "check" | "tools" | "preview";

export function V2ResumeEditorScreen() {
  return (
    <V2Shell requireAuth>
      <EditorGate />
    </V2Shell>
  );
}

function EditorGate() {
  const t = usePlatformT();
  const doc = useResumeDoc();
  const status = useRenewalDocsStatus();
  const info = useBasicInfo();

  // 이력서가 없으면 먼저 '새로 만들기 / 써 둔 이력서로 만들기'를 고르게 한다(기존 StartChooser 와 같은 갈래).
  // 새로 만들기는 빈 문서로 편집을 시작하고, 첫 편집이 saveResumeDoc 을 타면서 계정에 저장된다.
  // 가져오기를 적용하면 그 순간 문서가 저장돼 doc 이 생기므로 자연히 에디터로 넘어간다.
  const empty = useMemo(() => generateResumeDoc([]), []);
  const [startNew, setStartNew] = useState(false);
  useEditorOpenedMetric("resume", status === "loaded", !!doc);

  if (status !== "loaded") return <PageSkeleton />;
  if (!doc && !startNew) {
    return (
      <StartChooser
        t={t}
        onNew={() => setStartNew(true)}
        onApply={(p) => {
          trackEditor("editor_import_applied", { doc: "resume", where: "start", count: p.items.length });
          saveResumeDoc({ ...empty, items: p.items, targetRole: p.targetRole, summary: p.summary, links: p.links }, { label: "파일에서 가져오기", force: true });
        }}
      />
    );
  }
  return <Editor doc={doc ?? empty} info={info} />;
}

// ── 시작 고르기 ─────────────────────────────────────────────

function StartChooser({ t, onNew, onApply }: { t: PlatformT; onNew: () => void; onApply: (p: ImportPreview) => void }) {
  const [importing, setImporting] = useState(false);
  const option = (active: boolean) =>
    `flex w-full items-start gap-4 rounded-3xl p-5 text-left transition ${active ? "bg-[color:var(--v2-accent-weak)]" : "bg-[color:var(--v2-band)] hover:bg-[color:var(--v2-line)]"}`;
  return (
    <Page>
      <header className="px-5 pb-6 pt-8 md:pt-12">
        <p className="text-[15px] font-semibold text-[color:var(--v2-muted)]">{t("내 이력서", "My resume", "我的简历", "CV của tôi", "履歴書", "CV saya")}</p>
        <h1 className="mt-1.5 text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">
          {t("이력서를 어떻게 시작할까요?", "How do you want to start your resume?", "要如何开始写简历？", "Bạn muốn bắt đầu CV thế nào?", "履歴書をどう始めますか？", "Mau mulai CV dari mana?")}
        </h1>
        <p className="mt-2.5 text-[17px] leading-[1.6] text-[color:var(--v2-ink-3)]">
          {t("어느 쪽으로 시작해도 나중에 얼마든지 고칠 수 있어요.", "Either way, you can edit everything later.", "无论选哪种，之后都可以随时修改。", "Chọn cách nào cũng có thể sửa sau.", "どちらで始めても、あとで自由に直せます。", "Pilih yang mana pun, nanti tetap bisa diubah.")}
        </p>
      </header>
      <div className="flex flex-col gap-3 px-5">
        <button
          type="button"
          onClick={() => {
            trackEditor("editor_start_selected", { doc: "resume", method: "new" });
            onNew();
          }}
          className={option(false)}
        >
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[22px]">✍️</span>
          <span className="min-w-0">
            <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{t("새로 만들기", "Start from scratch", "从头开始", "Tạo mới", "新しく作る", "Buat baru")}</span>
            <span className="mt-1 block text-[15px] leading-[1.55] text-[color:var(--v2-muted)]">
              {t("빈 이력서에서 경력·학력·자격을 하나씩 채워요.", "Fill in your experience, education, and skills one by one.", "在空白简历上逐项填写经历、学历和资格。", "Điền từng mục kinh nghiệm, học vấn, chứng chỉ.", "白紙の履歴書に職歴・学歴・資格を一つずつ入力します。", "Isi pengalaman, pendidikan, dan keahlian satu per satu.")}
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (!importing) trackEditor("editor_start_selected", { doc: "resume", method: "import" });
            setImporting(true);
          }}
          aria-expanded={importing}
          className={option(importing)}
        >
          <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[22px]">📄</span>
          <span className="min-w-0">
            <span className="block text-[17px] font-bold text-[color:var(--v2-ink)]">{t("써 둔 이력서로 만들기", "Use a resume I already have", "用已有的简历制作", "Dùng CV có sẵn", "手持ちの履歴書から作る", "Pakai CV yang sudah ada")}</span>
            <span className="mt-1 block text-[15px] leading-[1.55] text-[color:var(--v2-muted)]">
              {t("PDF를 올리거나 내용을 붙여넣으면 항목별로 정리해서 채워 드려요.", "Upload a PDF or paste the text and we'll sort it into sections for you.", "上传 PDF 或粘贴内容，我们会按条目整理填好。", "Tải PDF hoặc dán nội dung, chúng tôi sẽ sắp xếp theo từng mục.", "PDFを上げるか本文を貼り付けると、項目ごとに整理して入れます。", "Unggah PDF atau tempel teks, akan dirapikan per bagian.")}
            </span>
          </span>
        </button>
        {importing ? (
          <LegacyBlock>
            <ImportFromFile
              t={t}
              title={t("이력서 가져오기", "Import your resume", "导入简历", "Nhập CV", "履歴書を取り込む", "Impor CV")}
              hint={t("PDF를 올리거나 내용을 붙여넣어 주세요. 가져온 뒤 바로 고칠 수 있어요.", "Upload a PDF or paste the text. You can edit it right after.", "请上传 PDF 或粘贴内容。导入后可立即修改。", "Tải PDF hoặc dán nội dung. Có thể sửa ngay sau đó.", "PDFを上げるか本文を貼り付けてください。取り込んだ後すぐ直せます。", "Unggah PDF atau tempel teks. Bisa langsung diedit.")}
              parse={async (input) => importedResumeToPreview(await importResume(input))}
              summarize={(p) => resumeImportSummary(t, p.countsBySection)}
              onApply={onApply}
            />
          </LegacyBlock>
        ) : null}
      </div>
    </Page>
  );
}

/** 기존 에디터 조각(가져오기·최근 변경)을 v2 회색 카드에 담는다 — 안쪽 제목·글자를 v2 크기로 맞춘다. */
function LegacyBlock({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-[color:var(--v2-fill)] p-5 [&_h3]:text-[17px] [&_h3]:tracking-[-0.01em] [&_h3]:text-[color:var(--v2-ink)]">{children}</div>;
}

// ── 에디터 ───────────────────────────────────────────────────

function Editor({ doc, info }: { doc: ResumeDoc; info: BasicInfo }) {
  const t = usePlatformT();
  const wide = useIsWide();
  const store = useDocVersionStore<ResumeLayout, ResumeSnapshot>("resume", t);
  const { working, current } = store;
  const [selectedId, setSelectedId] = useState<string | null>(FIXED_MODULES.basic);
  // 모듈 편집이 열려 있는지 — 넓은 화면은 옆 패널, 좁은 화면은 시트.
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<Tab>("items");
  const [dragId, setDragId] = useState<string | null>(null);
  const [hover, setHover] = useState<DropSlot | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  // 가져오기 되돌리기용 스냅샷. **훅이라 아래 조기 반환(불러오는 중)보다 위에 있어야 한다**(기존 에디터와 같은 이유).
  const [importUndo, setImportUndo] = useState<ResumeDoc | null>(null);
  useFirstContentMetric("resume", doc.items.some((it) => [it.text, it.company, it.startDate, it.endDate].some((v) => v?.trim())));
  useDropEmptyItems({
    items: doc.items,
    isEmpty: (it) => ![it.text, it.company, it.startDate, it.endDate].some((v) => v?.trim()),
    selectedId,
    sheetOpen: editing,
    drop: (ids) => saveResumeDoc({ ...doc, items: doc.items.filter((it) => !ids.includes(it.id)) }),
    deselect: () => setSelectedId(null)
  });
  const history = useResumeHistory();

  // 지금 문서에 맞춘 편집 중 구성 — 앱·기존 화면에서 새로 생긴 모듈도 빠지지 않게 자연스러운 자리에 넣어 보여 준다.
  const layout: ResolvedLayout | null = useMemo(() => {
    if (!working) return null;
    return placeAllUnplaced(resolveLayout(working.layout, doc), doc);
  }, [working, doc]);
  const commitLayout = (next: ResolvedLayout) => store.setWorkingLayout(toStoredLayout(next));

  // 전체 점검(규칙만, AI 호출 없음) — 이력서에서 빼 둔 모듈은 제출물에 없으니 점검하지 않는다.
  const placedIds = useMemo(() => new Set(layout ? layout.cols.flat() : []), [layout]);
  const scan = useMemo(() => scanResume(doc.items.filter((it) => placedIds.has(it.id))), [doc.items, placedIds]);

  // AI 점검 — 버튼을 눌렀을 때만 돈다. 규칙 점검과 같은 표시 체계에 얹는다.
  const texts = useMemo(() => new Map(doc.items.map((it) => [it.id, it.text ?? ""])), [doc.items]);
  const review = useAiReview("resume", texts);
  const hiddenIssues = useHiddenIssues("resume");
  const runReview = () =>
    void review.run(() =>
      reviewResume({
        targetRole: doc.targetRole?.trim() || undefined,
        summary: doc.summary?.trim() || undefined,
        // 이력서에 들어간 항목 중 내용이 있는 것만 — 빈 항목을 보내면 규칙 점검과 같은 말이 두 번 나온다.
        items: doc.items
          .filter((it) => placedIds.has(it.id) && (it.text ?? "").trim())
          .map((it) => ({
            id: it.id,
            section: sectionLabelOf(t, it.section),
            company: (it.company ?? "").trim() || undefined,
            period: [it.startDate, it.endDate].filter(Boolean).join(" ~ ") || undefined,
            text: it.text ?? ""
          }))
      })
    );

  // 본문에 칠할 것 — 항목 id → 형광펜 구절. 규칙과 AI 를 합친다.
  const flagged = useMemo(() => {
    const m = new Map<string, string[]>();
    const add = (id: string, quotes: string[]) => m.set(id, [...(m.get(id) ?? []), ...quotes.filter(Boolean)]);
    for (const [id, issues] of scan.byItem) {
      const live = issues.filter((x) => !hiddenIssues.hidden.has(issueKey(id, x)));
      if (live.length) add(id, live.flatMap(resumeIssueQuotes));
    }
    for (const f of review.findings) {
      if (hiddenIssues.hidden.has(`ai:${f.id}:${f.issue}`)) continue;
      add(f.id, f.quote ? [f.quote] : []);
    }
    return m;
  }, [scan, review.findings, hiddenIssues.hidden]);

  const openModule = (id: string) => {
    setSelectedId(id);
    setEditing(true);
  };

  // 드래그 앤 드롭·누르면 편집 — 페이지 위에서.
  const interaction: EditorInteraction | undefined = layout
    ? {
        selectedId: editing ? selectedId : null,
        flagged,
        dragId,
        hover,
        onSelect: openModule,
        onDragStart: (id) => {
          setDragId(id);
          setSelectedId(id);
        },
        onHover: (slot) => setHover((h) => (h && h.col === slot.col && h.index === slot.index ? h : slot)),
        onDrop: () => {
          if (dragId && hover) commitLayout(moveModuleTo(layout, dragId, hover.col, hover.index));
          setDragId(null);
          setHover(null);
        },
        onDragEnd: () => {
          setDragId(null);
          setHover(null);
        }
      }
    : undefined;

  if (!working || !current || !layout) return <PageSkeleton />;

  const head = (
    <EditorHead
      t={t}
      working={working}
      saved={store.saved}
      current={current}
      saveState={store.saveState}
      onPick={(id) => {
        store.setCurrentId(id);
        setSelectedId(FIXED_MODULES.basic);
        setEditing(false);
      }}
      onSaveNew={() => setSaveOpen(true)}
      template={current.snapshot ? null : layout.template}
      onTemplate={(tpl) => commitLayout(setTemplate(layout, tpl, doc))}
    />
  );
  const saveSheet = saveOpen ? (
    <SaveNewSheet
      t={t}
      onClose={() => setSaveOpen(false)}
      // 지금 화면 그대로 — 편집 중 구성(자동 배치 포함)과 내용을 함께 저장본으로.
      onSave={(name) => store.saveAsNew(name, toStoredLayout(layout), { resume: doc, basicInfo: info })}
    />
  ) : null;

  // ── 저장본 보기(읽기 전용) ──
  if (current.snapshot) {
    const snap = current.snapshot;
    const savedLayout = resolveLayout(current.layout, snap.resume);
    return (
      <main className="mx-auto w-full max-w-[1080px] pb-24">
        <PrintStyles />
        {head}
        <div className="px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
          <div className="mb-5 lg:order-2 lg:mb-0">
            <SavedPanel t={t} version={current} onRename={(name) => store.renameSaved(current.id, name)} onDelete={() => void store.removeSaved(current.id)} />
          </div>
          <PaperBox label={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
            <ModularResumePages doc={snap.resume} info={snap.basicInfo} layout={savedLayout} />
          </PaperBox>
        </div>
        <PrintCopy doc={snap.resume} info={snap.basicInfo} layout={savedLayout} />
        {saveSheet}
      </main>
    );
  }

  // ── 모듈 내용(talent 문서 — 앱·인재 검색이 읽는 원본) ──
  const updateItem = (id: string, patch: ItemPatch) => saveResumeDoc({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const addItem = (section: CareerSection) => {
    const { doc: next, id } = addResumeItem(doc, section, "");
    saveResumeDoc(next);
    commitLayout(placeModule(layout, next, id));
    openModule(id);
  };
  const deleteItem = (id: string) => {
    if (!window.confirm(t("이 항목을 삭제할까요? 이미 저장한 버전에는 그대로 남아요.", "Delete this item? Saved versions keep it.", "要删除此条目吗？已保存的版本仍会保留。", "Xóa mục này? Các bản đã lưu vẫn giữ.", "この項目を削除しますか？保存済みのバージョンには残ります。", "Hapus item ini? Versi tersimpan tetap menyimpannya."))) return;
    saveResumeDoc({ ...doc, items: doc.items.filter((it) => it.id !== id) });
    setSelectedId(null);
    setEditing(false);
  };
  const placed = new Set(layout.cols.flat());
  const toggle = (id: string) => commitLayout(placed.has(id) ? hideModule(layout, id) : placeModule(layout, doc, id));

  // 되돌릴 수 있는 지점 — 각 지점 **이후** 무엇이 달라졌는지 계산해 함께 보여 준다.
  const changePoints: ChangePoint[] = history.map((v) => ({ savedAt: v.savedAt, label: v.label, change: diffResumeDocs(v.doc, doc) }));

  const applyImport = (p: ImportPreview) => {
    trackEditor("editor_import_applied", { doc: "resume", where: "panel", count: p.items.length });
    setImportUndo(doc);
    saveResumeDoc(
      {
        ...doc,
        items: [...doc.items, ...p.items],
        // 희망 직무·자기소개·링크는 비어 있을 때만 채운다 — 이미 쓴 글을 덮으면 안 된다.
        targetRole: doc.targetRole?.trim() ? doc.targetRole : p.targetRole,
        summary: (doc.summary ?? "").trim() ? doc.summary : p.summary,
        links: (doc.links ?? []).length ? doc.links : p.links
      },
      { label: "파일에서 가져오기", force: true }
    );
  };

  // 점검 목록에서 누르면 그 항목을 열고, 넓은 화면이면 미리보기의 그 자리로 굴린다.
  // 편집 영역 안에서만 찾는다 — 인쇄 사본(PrintCopy)에도 같은 data-module 이 있다.
  const goItem = (id: string) => {
    openModule(id);
    document.querySelector(`[data-v2-resume-paper] [data-module="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const editorProps: ModuleEditorProps = {
    t,
    doc,
    info,
    layout,
    id: selectedId ?? FIXED_MODULES.basic,
    placed: placed.has(selectedId ?? ""),
    onItem: updateItem,
    onDoc: (patch, opts) => saveResumeDoc({ ...doc, ...patch }, opts),
    onBasic: (patch) => saveBasicInfo({ ...info, ...patch }),
    onLayout: commitLayout,
    onDelete: deleteItem
  };
  const panelTab: Exclude<Tab, "preview"> = tab === "preview" ? "items" : tab;
  const checkCount = scan.flaggedCount;

  const tabs: [Tab, string][] = [
    ["items", t("항목", "Items", "条目", "Mục", "項目", "Item")],
    ["check", `${t("점검", "Check", "检查", "Kiểm tra", "チェック", "Cek")}${checkCount ? ` ${checkCount}` : ""}`],
    ["tools", t("도구", "Tools", "工具", "Công cụ", "ツール", "Alat")],
    ["preview", t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")]
  ];

  return (
    <main className="mx-auto w-full max-w-[1080px] pb-24">
      <PrintStyles />
      {head}

      {/* 탭 — 좁은 화면은 넷(미리보기 포함), 넓은 화면은 미리보기가 늘 왼쪽에 있어 셋. */}
      <div className="no-print -mt-1 mb-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {tabs.map(([key, label]) => (
          <Chip key={key} active={tab === key} onClick={() => setTab(key)}>
            {label}
          </Chip>
        ))}
      </div>

      <div className="px-5 lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-8">
        <div className={`${tab === "preview" ? "block" : "hidden"} lg:block`}>
          <PaperBox label={t("이력서", "Resume", "简历", "CV", "履歴書", "CV")} hint>
            <ModularResumePages doc={doc} info={info} layout={layout} interaction={interaction} />
          </PaperBox>
        </div>

        <aside
          className={`no-print ${tab === "preview" ? "hidden" : "block"} lg:sticky lg:top-24 lg:block lg:max-h-[calc(100vh-112px)] lg:overflow-y-auto lg:pb-4 lg:[scrollbar-width:thin]`}
          aria-label={t("편집 도구", "Editing tools", "编辑工具", "Công cụ sửa", "編集ツール", "Alat edit")}
        >
          {wide && editing && selectedId ? (
            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <TextLink onClick={() => setEditing(false)}>← {t("목록으로", "Back to list", "返回列表", "Về danh sách", "一覧へ", "Ke daftar")}</TextLink>
              </div>
              <ModuleHeading t={t} id={selectedId} doc={doc} info={info} />
              <div className="mt-5">
                <ModuleEditor key={selectedId} {...editorProps} />
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5 hidden gap-2 lg:flex">
                {tabs.slice(0, 3).map(([key, label]) => (
                  <Chip key={key} active={panelTab === key} onClick={() => setTab(key)}>
                    {label}
                  </Chip>
                ))}
              </div>
              {panelTab === "items" ? <ItemsPanel t={t} doc={doc} placed={placed} selectedId={editing ? selectedId : null} onOpen={openModule} onToggle={toggle} onAdd={addItem} /> : null}
              {panelTab === "check" ? <CheckPanel t={t} doc={doc} scan={scan} onGoItem={goItem} review={review} onRunReview={runReview} hiddenIssues={hiddenIssues} /> : null}
              {panelTab === "tools" ? (
                <div className="flex flex-col gap-4">
                  <BulkPolishCard t={t} doc={doc} onDoc={(patch, opts) => saveResumeDoc({ ...doc, ...patch }, opts)} />
                  <LegacyBlock>
                    <ImportFromFile
                      t={t}
                      title={t("파일에서 가져오기", "Import from a file", "从文件导入", "Nhập từ tệp", "ファイルから取り込む", "Impor dari berkas")}
                      hint={t(
                        "기존 이력서 PDF 를 올리면 항목으로 정리해서 넣어 드려요. 지금 쓴 내용은 지우지 않아요.",
                        "Upload an existing resume PDF and we'll turn it into items. Nothing you've written is removed.",
                        "上传现有简历 PDF，我们会整理成条目。已写内容不会被删除。",
                        "Tải lên PDF hồ sơ cũ, chúng tôi sẽ sắp thành các mục. Nội dung hiện có không bị xóa.",
                        "既存の履歴書PDFを上げると項目に整理して入れます。今の内容は消しません。",
                        "Unggah PDF resume lama, akan dirapikan jadi item. Isi yang ada tidak dihapus."
                      )}
                      parse={async (input) => importedResumeToPreview(await importResume(input))}
                      summarize={(p) => resumeImportSummary(t, p.countsBySection)}
                      onApply={applyImport}
                      onUndo={
                        importUndo
                          ? () => {
                              saveResumeDoc(importUndo);
                              setImportUndo(null);
                            }
                          : null
                      }
                    />
                  </LegacyBlock>
                  {changePoints.some((p) => !isEmptyChange(p.change)) ? (
                    <LegacyBlock>
                      <RecentChanges t={t} points={changePoints} onRestore={(at) => void restoreResumeVersion(at)} />
                    </LegacyBlock>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </aside>
      </div>

      {/* 좁은 화면 — 모듈 편집은 아래에서 올라오는 시트로. */}
      {!wide && editing && selectedId ? (
        <Sheet tall title={moduleTitle(t, selectedId, doc, info)} subtitle={moduleKindLabel(t, selectedId, doc.items.find((i) => i.id === selectedId)?.section)} onClose={() => setEditing(false)}>
          <ModuleEditor key={selectedId} {...editorProps} />
        </Sheet>
      ) : null}
      {saveSheet}
      <PrintCopy doc={doc} info={info} layout={layout} />
    </main>
  );
}

/** A4 미리보기를 담는 연회색 판. data-v2-resume-paper 로 점검 목록에서 모듈을 찾는다. */
function PaperBox({ label, hint, children }: { label: string; hint?: boolean; children: React.ReactNode }) {
  const t = usePlatformT();
  return (
    <section data-v2-resume-paper aria-label={label} className="no-print rounded-3xl bg-[color:var(--v2-band)] p-3 md:p-6">
      {hint ? (
        <p className="mb-3 px-1 text-[13px] leading-[1.5] text-[color:var(--v2-muted)]">
          {t("모듈을 누르면 고칠 수 있어요. PC 에선 끌어서 순서를 바꿔요.", "Tap a module to edit. On desktop, drag to reorder.", "点击模块即可修改。电脑上可拖动排序。", "Nhấn mô-đun để sửa. Trên máy tính, kéo để đổi thứ tự.", "モジュールを押すと編集できます。PCではドラッグで並べ替え。", "Ketuk modul untuk mengedit. Di PC, seret untuk mengurutkan.")}
        </p>
      ) : null}
      <div className="mx-auto max-w-[794px]">{children}</div>
    </section>
  );
}

/**
 * PDF 저장용 사본 — 편집 표시 없이 기존 미리보기 PDF 와 같은 A4 모양으로 인쇄한다.
 * 화면에선 밖에 두되 폭(794)은 유지해야 인쇄 전에 페이지 나눔이 계산돼 있다.
 */
function PrintCopy({ doc, info, layout }: { doc: ResumeDoc; info: BasicInfo; layout: ResolvedLayout }) {
  return (
    <div aria-hidden className={`pointer-events-none fixed -left-[99999px] top-0 w-[794px] print:left-0 ${PDF_PRINT_AREA}`}>
      <ModularResumePages doc={doc} info={info} layout={layout} />
    </div>
  );
}

// ── 머리: 제목·저장 상태·버전 ─────────────────────────────────

function EditorHead({
  t,
  working,
  saved,
  current,
  saveState,
  onPick,
  onSaveNew,
  template,
  onTemplate
}: {
  t: PlatformT;
  working: DocVersion<ResumeLayout, ResumeSnapshot>;
  saved: DocVersion<ResumeLayout, ResumeSnapshot>[];
  current: DocVersion<ResumeLayout, ResumeSnapshot>;
  saveState: "idle" | "saving" | "saved" | "error";
  onPick: (id: string) => void;
  onSaveNew: () => void;
  /** null 이면 저장본 보기 — 템플릿을 바꿀 수 없다. */
  template: ResumeLayout["template"] | null;
  onTemplate: (tpl: ResumeLayout["template"]) => void;
}) {
  const router = useRouter();
  const editingNow = current.snapshot === null;
  const saveLabel =
    saveState === "saving"
      ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…")
      : saveState === "error"
        ? t("저장하지 못했어요 · 다시 해 주세요", "Save failed · try again", "保存失败，请重试", "Lưu thất bại · thử lại", "保存に失敗しました", "Gagal menyimpan")
        : saveState === "saved"
          ? t("자동 저장됨", "Auto-saved", "已自动保存", "Đã tự lưu", "自動保存済み", "Tersimpan otomatis")
          : t("고치면 자동으로 저장돼요", "Changes save automatically", "修改会自动保存", "Tự động lưu khi sửa", "編集は自動保存されます", "Perubahan tersimpan otomatis");
  const versionChip = (v: DocVersion<ResumeLayout, ResumeSnapshot>, label: React.ReactNode) => (
    <button
      key={v.id}
      type="button"
      onClick={() => onPick(v.id)}
      aria-pressed={v.id === current.id}
      className={`inline-flex h-9 max-w-[200px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-semibold transition ${v.id === current.id ? "bg-[color:var(--v2-ink)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-line)]"}`}
    >
      {label}
    </button>
  );
  return (
    <div className="no-print">
      <header className="px-5 pb-5 pt-8 md:pt-12">
        <div className="flex items-center gap-2">
          {/* 문서 전환 — 이력서 / 자기소개서 */}
          <span className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t("이력서", "Resume", "简历", "CV", "履歴書", "CV")}</span>
          <span aria-hidden className="text-[color:var(--v2-line)]">|</span>
          <button type="button" onClick={() => router.push(ROUTES.cover)} className="text-[15px] font-semibold text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink-3)]">
            {t("자기소개서", "Cover letter", "自我介绍", "Thư xin việc", "自己PR", "Surat lamaran")}
          </button>
        </div>
        <h1 className="mt-1.5 text-[26px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[30px]">
          {editingNow ? t("이력서 편집", "Edit resume", "编辑简历", "Sửa CV", "履歴書を編集", "Edit CV") : current.name}
        </h1>
        <p className={`mt-1.5 flex items-center gap-1.5 text-[14px] ${saveState === "error" ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-faint)]"}`} aria-live="polite">
          {editingNow ? (
            <>
              {saveState === "saving" ? <Spinner className="h-3.5 w-3.5" /> : null}
              {saveLabel}
            </>
          ) : (
            t("저장본은 고칠 수 없어요", "Saved versions are read-only", "保存版本不可修改", "Bản đã lưu chỉ để xem", "保存版は編集できません", "Versi tersimpan hanya baca")
          )}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <V2PdfButton />
          <Button variant="neutral" href={ROUTES.preview}>
            {t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}
          </Button>
        </div>
      </header>

      {/* 버전 — 편집 중 + 저장본. 고르면 그 버전을 본다. */}
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-3 px-5">
        <nav aria-label={t("버전", "Versions", "版本", "Phiên bản", "バージョン", "Versi")} className="-mx-5 flex min-w-0 flex-1 basis-full gap-2 overflow-x-auto px-5 [scrollbar-width:none] md:basis-auto [&::-webkit-scrollbar]:hidden">
          {versionChip(working, t("편집 중", "Editing", "编辑中", "Đang sửa", "編集中", "Diedit"))}
          {saved.map((v) =>
            versionChip(
              v,
              <>
                <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <span className="truncate">{v.name}</span>
              </>
            )
          )}
        </nav>
        <div className="flex items-center gap-2">
          {template ? (
            <div role="group" aria-label={t("템플릿", "Template", "模板", "Mẫu", "テンプレート", "Templat")} className="flex items-center rounded-xl bg-[color:var(--v2-band)] p-1">
              {(["two", "one"] as const).map((tpl) => (
                <button
                  key={tpl}
                  type="button"
                  onClick={() => onTemplate(tpl)}
                  aria-pressed={template === tpl}
                  className={`h-7 rounded-lg px-3 text-[13px] font-semibold transition ${template === tpl ? "bg-white text-[color:var(--v2-ink)] shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-[color:var(--v2-muted)]"}`}
                >
                  {tpl === "two" ? t("2단", "2 col", "双栏", "2 cột", "2段", "2 kol") : t("1단", "1 col", "单栏", "1 cột", "1段", "1 kol")}
                </button>
              ))}
            </div>
          ) : null}
          <Button size="sm" variant="secondary" onClick={onSaveNew} disabled={!editingNow}>
            + {t("새 버전 저장", "Save version", "存为新版", "Lưu bản mới", "新版を保存", "Simpan versi")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** [새 버전 저장] — 이름을 받아 지금 모습 그대로 저장본으로. */
function SaveNewSheet({ t, onClose, onSave }: { t: PlatformT; onClose: () => void; onSave: (name: string) => Promise<boolean> }) {
  const d = new Date();
  const [name, setName] = useState(() => t(`${d.getMonth() + 1}월 ${d.getDate()}일 저장본`, `Saved ${d.getMonth() + 1}/${d.getDate()}`, `${d.getMonth() + 1}月${d.getDate()}日保存`, `Bản lưu ${d.getDate()}/${d.getMonth() + 1}`, `${d.getMonth() + 1}月${d.getDate()}日の保存版`, `Simpanan ${d.getDate()}/${d.getMonth() + 1}`));
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    const ok = await onSave(n);
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <Sheet
      title={t("새 버전으로 저장", "Save as new version", "另存为新版本", "Lưu thành phiên bản mới", "新しいバージョンとして保存", "Simpan sebagai versi baru")}
      onClose={onClose}
      footer={
        <Button full onClick={() => void submit()} disabled={!name.trim() || busy}>
          {busy ? t("저장하는 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장하기", "Save", "保存", "Lưu", "保存する", "Simpan")}
        </Button>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{t("저장본 이름", "Name", "名称", "Tên", "名前", "Nama")}</span>
          <input
            autoFocus
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("예: OO전자 지원용", "e.g. For Company A", "例：投递 A 公司", "VD: Nộp công ty A", "例：A社応募用", "mis. Untuk Perusahaan A")}
            className={`${V2_INPUT_CLS} h-12`}
          />
        </label>
        <p className="mt-3 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
          {t("지금 모습 그대로 저장돼요. 저장본은 고칠 수 없고, 지원할 때 골라 쓸 수 있어요.", "Saved exactly as it looks now. Saved versions can't be edited and can be picked when applying.", "按当前样子保存。保存版本不可修改，投递时可选用。", "Lưu đúng như hiện tại. Bản đã lưu không sửa được và có thể chọn khi ứng tuyển.", "今の状態のまま保存されます。保存版は編集できず、応募時に選べます。", "Disimpan persis seperti sekarang. Tidak bisa diubah dan bisa dipilih saat melamar.")}
        </p>
      </form>
    </Sheet>
  );
}

/** 저장본 보기 — 이름·저장 시각·삭제. 내용은 고칠 수 없다. */
function SavedPanel({ t, version, onRename, onDelete }: { t: PlatformT; version: DocVersion<ResumeLayout, ResumeSnapshot>; onRename: (name: string) => void; onDelete: () => void }) {
  const saved = new Date(version.createdAt);
  return (
    <V2Card title={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
      <label className="block">
        <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{t("이름", "Name", "名称", "Tên", "名前", "Nama")}</span>
        <input key={version.id} defaultValue={version.name} maxLength={60} onChange={(e) => e.target.value.trim() && onRename(e.target.value.trim())} className={`${V2_INPUT_CLS} h-12 bg-white`} />
      </label>
      <p className="mt-3 text-[14px] text-[color:var(--v2-muted)]">
        {t("저장한 때", "Saved", "保存时间", "Đã lưu lúc", "保存日時", "Disimpan")} · {saved.toLocaleString()}
      </p>
      <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">
        {t(
          "저장한 순간 그대로 보관돼요. 고칠 수 없고, 지원할 때 이 저장본을 골라 쓸 수 있어요. 고치려면 '편집 중'에서 수정한 뒤 새 버전으로 저장해 주세요.",
          "Kept exactly as saved. It can't be edited, and you can pick it when applying. To change it, edit under 'Editing' and save a new version.",
          "按保存时原样保留，不可修改，投递时可选用。如需修改，请在「编辑中」修改后另存为新版本。",
          "Giữ nguyên như lúc lưu, không sửa được và có thể chọn khi ứng tuyển. Muốn đổi, hãy sửa ở 'Đang sửa' rồi lưu phiên bản mới.",
          "保存時のまま保管され、編集できません。応募時に選べます。変更するには「編集中」で修正して新しいバージョンとして保存してください。",
          "Disimpan persis seperti saat disimpan, tidak bisa diubah, dan bisa dipilih saat melamar. Untuk mengubah, edit di 'Sedang diedit' lalu simpan versi baru."
        )}
      </p>
      <button type="button" onClick={onDelete} className="mt-4 h-11 w-full rounded-xl text-[15px] font-semibold text-[color:var(--v2-attention)] transition hover:bg-white">
        {t("저장본 삭제", "Delete version", "删除保存版本", "Xóa bản đã lưu", "保存版を削除", "Hapus versi")}
      </button>
    </V2Card>
  );
}

// ── 항목 목록 ─────────────────────────────────────────────────

/** 고정 모듈 세 개 — 목록과 시트 제목이 같은 이름을 쓴다. */
function fixedList(t: PlatformT): { id: string; label: string }[] {
  return [
    { id: FIXED_MODULES.basic, label: t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar") },
    { id: FIXED_MODULES.summary, label: t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang") },
    { id: FIXED_MODULES.links, label: t("링크·포트폴리오", "Links", "链接", "Liên kết", "リンク", "Tautan") }
  ];
}

/** 목록에 쓰는 한 줄 이름. */
function itemLabel(t: PlatformT, i: ResumeDoc["items"][number]): string {
  return (i.company?.trim() || i.text.trim() || t("(내용 없음)", "(empty)", "(无内容)", "(trống)", "(内容なし)", "(kosong)")).split("\n")[0];
}

function ItemsPanel({
  t,
  doc,
  placed,
  selectedId,
  onOpen,
  onToggle,
  onAdd
}: {
  t: PlatformT;
  doc: ResumeDoc;
  placed: Set<string>;
  selectedId: string | null;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  onAdd: (section: CareerSection) => void;
}) {
  const row = (id: string, label: string) => {
    const on = placed.has(id);
    return (
      <li key={id} className={`-mx-2 flex items-center gap-3 rounded-2xl px-2 transition ${selectedId === id ? "bg-[color:var(--v2-accent-weak)]" : ""}`}>
        <V2Check on={on} onClick={() => onToggle(id)} label={on ? t(`이력서에서 빼기: ${label}`, `Remove from resume: ${label}`, `从简历移除：${label}`, `Bỏ khỏi CV: ${label}`, `履歴書から外す：${label}`, `Keluarkan: ${label}`) : t(`이력서에 넣기: ${label}`, `Add to resume: ${label}`, `加入简历：${label}`, `Thêm vào CV: ${label}`, `履歴書に入れる：${label}`, `Masukkan: ${label}`)} />
        <button type="button" onClick={() => onOpen(id)} className="flex min-w-0 flex-1 items-center gap-2 py-3 text-left">
          <span className={`min-w-0 flex-1 truncate text-[16px] ${on ? "font-semibold text-[color:var(--v2-ink)]" : "font-medium text-[color:var(--v2-faint)]"}`}>{label}</span>
          <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" className="shrink-0 text-[color:var(--v2-faint)]">
            <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </li>
    );
  };
  return (
    <div>
      <p className="mb-4 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
        {t("체크한 항목만 이력서에 들어가요. 누르면 내용을 고칠 수 있어요.", "Only checked items go into the resume. Tap one to edit.", "只有勾选的条目会放入简历。点击即可修改。", "Chỉ mục được chọn mới vào CV. Nhấn để sửa.", "チェックした項目だけが履歴書に入ります。押すと編集できます。", "Hanya item yang dicentang masuk CV. Ketuk untuk mengedit.")}
      </p>
      <h3 className="text-[15px] font-bold text-[color:var(--v2-ink-3)]">{t("기본", "Basics", "基本", "Cơ bản", "基本", "Dasar")}</h3>
      <ul className="mt-1">{fixedList(t).map((f) => row(f.id, f.label))}</ul>
      {SECTIONS.map((section) => {
        const items = doc.items.filter((i) => i.section === section);
        const label = sectionLabelOf(t, section);
        return (
          <div key={section} className="mt-5 border-t border-[color:var(--v2-band)] pt-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="min-w-0 truncate text-[15px] font-bold text-[color:var(--v2-ink-3)]">
                {label}
                {items.length ? <span className="ml-1.5 font-semibold text-[color:var(--v2-faint)]">{items.filter((i) => placed.has(i.id)).length}/{items.length}</span> : null}
              </h3>
              <button
                type="button"
                onClick={() => onAdd(section)}
                aria-label={t(`${label} 추가`, `Add ${label}`, `添加${label}`, `Thêm ${label}`, `${label}を追加`, `Tambah ${label}`)}
                className="inline-flex h-8 shrink-0 items-center rounded-lg px-2.5 text-[14px] font-semibold text-[color:var(--v2-accent)] transition hover:bg-[color:var(--v2-accent-weak)]"
              >
                + {t("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
              </button>
            </div>
            {items.length ? <ul className="mt-1">{items.map((i) => row(i.id, itemLabel(t, i)))}</ul> : null}
          </div>
        );
      })}
    </div>
  );
}

// ── 모듈 편집 ─────────────────────────────────────────────────

type ModuleEditorProps = {
  t: PlatformT;
  doc: ResumeDoc;
  info: BasicInfo;
  layout: ResolvedLayout;
  id: string;
  placed: boolean;
  onItem: (id: string, patch: ItemPatch) => void;
  onDoc: (patch: Partial<ResumeDoc>, opts?: DocPatchOpts) => void;
  onBasic: (patch: Partial<BasicInfo>) => void;
  onLayout: (next: ResolvedLayout) => void;
  onDelete: (id: string) => void;
};

function ModuleHeading({ t, id, doc, info }: { t: PlatformT; id: string; doc: ResumeDoc; info: BasicInfo }) {
  return (
    <div>
      <span className="inline-flex h-7 items-center rounded-full bg-[color:var(--v2-accent-weak)] px-3 text-[13px] font-bold text-[color:var(--v2-accent)]">{moduleKindLabel(t, id, doc.items.find((i) => i.id === id)?.section)}</span>
      <p className="mt-2 break-words text-[22px] font-bold leading-[1.35] tracking-[-0.02em] text-[color:var(--v2-ink)]">{moduleTitle(t, id, doc, info)}</p>
    </div>
  );
}

function ModuleEditor(props: ModuleEditorProps) {
  const { t, id, layout, doc } = props;
  const item = doc.items.find((i) => i.id === id);
  const at = locate(layout, id);
  const colLen = at ? layout.cols[at.col].length : 0;
  return (
    <div className="flex flex-col gap-6">
      <ContentFields {...props} item={item} />

      <div>
        <h3 className="mb-2.5 text-[15px] font-bold text-[color:var(--v2-ink-3)]">{t("배치", "Placement", "位置", "Vị trí", "配置", "Penempatan")}</h3>
        {props.placed ? (
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="neutral" disabled={!at || at.index === 0} onClick={() => props.onLayout(nudgeModule(layout, id, -1))}>
              ↑ {t("위로", "Up", "上移", "Lên", "上へ", "Naik")}
            </Button>
            <Button size="sm" variant="neutral" disabled={!at || at.index >= colLen - 1} onClick={() => props.onLayout(nudgeModule(layout, id, 1))}>
              ↓ {t("아래로", "Down", "下移", "Xuống", "下へ", "Turun")}
            </Button>
            <Button size="sm" variant="neutral" disabled={layout.cols.length < 2} onClick={() => props.onLayout(moveToOtherColumn(layout, id))}>
              ⇄ {at?.col === 0 ? t("오른쪽 칸", "Right col", "右栏", "Cột phải", "右の段", "Kolom kanan") : t("왼쪽 칸", "Left col", "左栏", "Cột trái", "左の段", "Kolom kiri")}
            </Button>
            <Button size="sm" variant="neutral" onClick={() => props.onLayout(hideModule(layout, id))}>
              {t("이력서에서 빼기", "Remove", "移除", "Bỏ ra", "外す", "Keluarkan")}
            </Button>
          </div>
        ) : (
          <Button size="sm" full onClick={() => props.onLayout(placeModule(layout, doc, id))}>
            {t("이력서에 넣기", "Add to resume", "加入简历", "Thêm vào CV", "履歴書に入れる", "Masukkan ke CV")}
          </Button>
        )}
      </div>

      {item ? (
        <button type="button" onClick={() => props.onDelete(item.id)} className="h-11 w-full rounded-xl text-[15px] font-semibold text-[color:var(--v2-attention)] transition hover:bg-[#fff0f1]">
          {t("항목 삭제", "Delete item", "删除条目", "Xóa mục", "項目を削除", "Hapus item")}
        </button>
      ) : null}
    </div>
  );
}

function ContentFields(props: ModuleEditorProps & { item: ResumeDoc["items"][number] | undefined }) {
  const { t, id, item, doc, info } = props;

  if (id === FIXED_MODULES.basic) {
    return (
      <div className="flex flex-col gap-4">
        <V2Field label={t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")} value={info.realName} onChange={(v) => props.onBasic({ realName: v })} />
        <V2Field label={t("희망 직무", "Target role", "期望职位", "Vị trí mong muốn", "希望職種", "Posisi diinginkan")} value={doc.targetRole} onChange={(v) => props.onDoc({ targetRole: v })} />
        <V2Field label={t("이메일", "Email", "邮箱", "Email", "メール", "Email")} value={info.email} inputMode="email" onChange={(v) => props.onBasic({ email: v })} />
        <V2Field label={t("연락처", "Phone", "电话", "Điện thoại", "電話", "Telepon")} value={info.phone} inputMode="tel" onChange={(v) => props.onBasic({ phone: v })} />
        <V2Field label={t("주소", "Address", "地址", "Địa chỉ", "住所", "Alamat")} value={info.address} onChange={(v) => props.onBasic({ address: v })} />
        <p className="text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
          {t("기본 정보는 자기소개서·앱과 함께 쓰여요.", "Basic info is shared with your cover letter and the app.", "基本信息与自我介绍、App 共用。", "Thông tin cơ bản dùng chung với thư giới thiệu và ứng dụng.", "基本情報は自己PR・アプリと共通です。", "Info dasar dipakai bersama surat lamaran dan aplikasi.")}
        </p>
      </div>
    );
  }
  if (id === FIXED_MODULES.links) {
    const links = doc.links ?? [];
    const update = (i: number, patch: Partial<{ label: string; url: string }>) => props.onDoc({ links: links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
    return (
      <div className="flex flex-col gap-3">
        {links.length === 0 ? (
          <p className="text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
            {t("깃허브·노션·포트폴리오 주소를 넣어 보세요.", "Add your GitHub, Notion, or portfolio link.", "添加 GitHub、Notion 或作品集链接。", "Thêm GitHub, Notion hoặc portfolio.", "GitHub・Notion・ポートフォリオのURLを追加。", "Tambahkan GitHub, Notion, atau portofolio.")}
          </p>
        ) : null}
        {links.map((l, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-2xl bg-[color:var(--v2-band)] p-4 [&_input]:bg-white">
            <V2Field label={t("이름", "Label", "名称", "Nhãn", "名称", "Label")} value={l.label} onChange={(v) => update(i, { label: v })} />
            <V2Field label={t("주소", "URL", "网址", "Đường dẫn", "URL", "URL")} value={l.url} inputMode="url" onChange={(v) => update(i, { url: v })} />
            <Button size="sm" variant="white" onClick={() => props.onDoc({ links: links.filter((_, idx) => idx !== i) })}>
              {t("삭제", "Remove", "删除", "Xóa", "削除", "Hapus")}
            </Button>
          </div>
        ))}
        <Button size="sm" variant="secondary" full onClick={() => props.onDoc({ links: [...links, { label: "", url: "" }] })}>
          + {t("링크 추가", "Add link", "添加链接", "Thêm liên kết", "リンクを追加", "Tambah tautan")}
        </Button>
      </div>
    );
  }

  const isSummary = id === FIXED_MODULES.summary;
  const text = isSummary ? (doc.summary ?? "") : (item?.text ?? "");
  const setText = (v: string) => (isSummary ? props.onDoc({ summary: v }) : props.onItem(id, { text: v }));

  return (
    <div className="flex flex-col gap-4">
      {item ? (
        <>
          <label className="block">
            <span className="mb-1.5 block text-[14px] font-semibold text-[color:var(--v2-ink-3)]">{t("섹션", "Section", "分区", "Mục", "セクション", "Bagian")}</span>
            <select value={item.section} onChange={(e) => props.onItem(item.id, { section: e.target.value as CareerSection })} className={`${V2_INPUT_CLS} h-12`}>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {sectionLabelOf(t, s)}
                </option>
              ))}
            </select>
          </label>
          <V2Field label={t("소속", "Organization", "单位", "Đơn vị", "所属", "Organisasi")} value={item.company ?? ""} onChange={(v) => props.onItem(id, { company: v })} />
        </>
      ) : null}
      <V2Field label={isSummary ? t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang") : t("내용", "Details", "内容", "Nội dung", "内容", "Isi")} value={text} onChange={setText} multiline />
      <AiPolish
        key={id}
        t={t}
        text={text}
        polish={(src, style) => (isSummary ? polishSelfIntro({ text: src, style, desiredJobRole: doc.targetRole || undefined }) : polishExperienceText({ text: src, style, type: item?.section }))}
        onApply={setText}
      />
      {item ? (
        <div className="grid grid-cols-2 gap-2">
          <V2Field label={t("시작", "Start", "开始", "Bắt đầu", "開始", "Mulai")} value={displayMonth(item.startDate ?? "")} placeholder="2023.03" onBlurValue={(v) => props.onItem(item.id, { startDate: normalizeMonth(v) })} />
          <V2Field label={t("종료", "End", "结束", "Kết thúc", "終了", "Selesai")} value={displayMonth(item.endDate ?? "")} placeholder={t("현재", "Present", "至今", "Hiện tại", "現在", "Sekarang")} onBlurValue={(v) => props.onItem(item.id, { endDate: normalizeMonth(v) })} />
        </div>
      ) : null}
    </div>
  );
}

function moduleKindLabel(t: PlatformT, id: string, section: CareerSection | undefined): string {
  if (id === FIXED_MODULES.basic) return t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar");
  if (id === FIXED_MODULES.summary) return t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang");
  if (id === FIXED_MODULES.links) return t("링크·포트폴리오", "Links", "链接", "Liên kết", "リンク", "Tautan");
  return section ? sectionLabelOf(t, section) : "";
}

function moduleTitle(t: PlatformT, id: string, doc: ResumeDoc, info: BasicInfo): string {
  if (isFixedModule(id)) {
    if (id === FIXED_MODULES.basic) return info.realName || t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama");
    return moduleKindLabel(t, id, undefined);
  }
  const it = doc.items.find((i) => i.id === id);
  return (it?.company?.trim() || it?.text.trim() || t("(내용 없음)", "(empty)", "(无内容)", "(trống)", "(内容なし)", "(kosong)")).split("\n")[0];
}

// ── 전체 점검 ─────────────────────────────────────────────────

/** 지적 1건의 키 — 치워 둔 것을 알아보는 데 쓴다(기존 에디터와 같은 키라 치운 목록이 두 화면에서 같다). */
function issueKey(id: string, issue: ResumeScanIssue): string {
  return `rule:${id}:${issue.kind}:${"sample" in issue ? issue.sample : "shared" in issue ? issue.shared.join(",") : ""}`;
}

/** 문제 1건을 사람이 읽는 두 줄로 — 무엇이 걸렸는지(what)와 왜·어떻게(why). */
function resumeIssueText(issue: ResumeScanIssue, t: PlatformT): { what: string; why: string } {
  switch (issue.kind) {
    case "empty":
      return {
        what: t("내용이 비어 있어요", "Empty", "内容为空", "Đang để trống", "内容が空です", "Masih kosong"),
        why: t(
          "빈 줄이 남아 있으면 준비가 덜 된 인상을 줘요. 한 일과 결과를 한 줄로 적거나, 이력서에서 빼 주세요.",
          "An empty line looks unfinished. Add one line on what you did and the result, or remove it.",
          "留白会显得准备不足。写一行你做了什么和结果，或将其移除。",
          "Dòng trống trông như chưa hoàn thiện. Thêm một dòng về việc bạn làm và kết quả, hoặc bỏ đi.",
          "空欄は準備不足に見えます。やったことと結果を一行で書くか、履歴書から外してください。",
          "Baris kosong terlihat belum siap. Tulis satu baris tentang yang Anda kerjakan dan hasilnya, atau hapus."
        )
      };
    case "noPeriod":
      return {
        what: t("기간이 없어요", "No dates", "缺少起止时间", "Chưa có thời gian", "期間がありません", "Belum ada periode"),
        why: t(
          "언제 한 일인지 모르면 경력으로 세기 어려워요. 시작·종료 월만 넣어도 충분해요.",
          "Without dates it's hard to count as experience. Start and end month is enough.",
          "没有时间就难以计入经历。写明起止年月即可。",
          "Không có thời gian thì khó tính là kinh nghiệm. Chỉ cần tháng bắt đầu và kết thúc.",
          "いつのことか分からないと経歴として数えにくいです。開始・終了の年月だけで十分です。",
          "Tanpa tanggal sulit dihitung sebagai pengalaman. Cukup bulan mulai dan selesai."
        )
      };
    case "spoken":
      return {
        what: `${t("대화체 문장", "Conversational", "口语化表达", "Văn nói", "話し言葉", "Gaya bicara")} 「${issue.sample}」`,
        why: t(
          "이력서는 '…함 / …개선' 같은 명사형으로 끝내요. 말하듯 쓴 문장은 혼자 튀어 보여요.",
          "Resumes end in noun form. A spoken-style sentence stands out from the rest.",
          "简历多用名词结尾。口语化的句子会显得突兀。",
          "Hồ sơ thường kết thúc dạng danh từ. Câu văn nói sẽ lạc lõng.",
          "履歴書は体言止めが基本です。話し言葉の文は浮いて見えます。",
          "Resume diakhiri bentuk nomina. Kalimat gaya bicara terlihat menonjol."
        )
      };
    case "overlap":
      return {
        what: `${t("다른 항목과 겹쳐요", "Overlaps", "与其他条目重复", "Trùng mục khác", "他の項目と重複", "Tumpang tindih")} 「${issue.withText}」`,
        why: t(
          "같은 경험이 두 번 나오면 쓸 이야기가 없어 보여요. 하나는 다른 경험으로 바꾸거나 관점을 달리해 주세요.",
          "The same story twice reads as if you have little to show. Swap one or change the angle.",
          "同一经历出现两次会显得素材不足。换成其他经历或改变切入点。",
          "Cùng một trải nghiệm hai lần trông như thiếu nội dung. Đổi một cái hoặc đổi góc nhìn.",
          "同じ経験が二度出ると書くことがないように見えます。片方を別の経験にするか切り口を変えてください。",
          "Pengalaman sama dua kali terlihat minim materi. Ganti salah satu atau ubah sudut pandang."
        )
      };
  }
}

/** 전체 점검 — 규칙 점검은 늘 켜져 있고, AI 점검은 버튼을 눌렀을 때만 돈다(기존과 같다). 누르면 그 항목으로 간다. */
function CheckPanel({
  t,
  doc,
  scan,
  onGoItem,
  review,
  onRunReview,
  hiddenIssues
}: {
  t: PlatformT;
  doc: ResumeDoc;
  scan: ResumeScan;
  onGoItem: (id: string) => void;
  review: ReturnType<typeof useAiReview>;
  onRunReview: () => void;
  hiddenIssues: ReturnType<typeof useHiddenIssues>;
}) {
  // 문서 순서대로 — 위에서 아래로 훑으며 고칠 수 있게.
  const byId = new Map(doc.items.map((it) => [it.id, it]));
  const labelOf = (id: string) => {
    const it = byId.get(id);
    if (!it) return "";
    return ((it.company ?? "").trim() || (it.text ?? "").trim()).slice(0, 14) || sectionLabelOf(t, it.section);
  };
  const lines: { id: string; what: string; why: string; key: string }[] = [];
  for (const it of doc.items) {
    for (const issue of scan.byItem.get(it.id) ?? []) {
      const key = issueKey(it.id, issue);
      if (hiddenIssues.hidden.has(key)) continue;
      const { what, why } = resumeIssueText(issue, t);
      lines.push({ id: it.id, what: `${labelOf(it.id)} — ${what}`, why, key });
    }
  }
  // AI 지적은 아래에 — 규칙 결과(즉시 고칠 수 있는 것)를 먼저 보게.
  const aiLines = review.findings
    .filter((f) => byId.has(f.id))
    .map((f) => ({ ...f, key: `ai:${f.id}:${f.issue}` }))
    .filter((f) => !hiddenIssues.hidden.has(f.key));
  const total = lines.length + aiLines.length;

  const row = (rk: string, hideKey: string, id: string, what: string, why: string) => (
    <li key={rk} className="rounded-2xl bg-[color:var(--v2-fill)] p-4">
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => onGoItem(id)} className="min-w-0 flex-1 break-words text-left text-[15px] font-semibold leading-[1.5] text-[color:var(--v2-ink-2)] transition hover:text-[color:var(--v2-accent)]">
          {what}
        </button>
        <button
          type="button"
          onClick={() => hiddenIssues.hide(hideKey)}
          aria-label={t("이 지적 치우기", "Dismiss", "收起该提示", "Bỏ qua", "この指摘を片づける", "Sembunyikan")}
          title={t("안 고치기로 했다면 치워 두세요. 내용을 고치면 다시 보여요.", "Dismiss if you won't act on it. It returns if you edit the text.", "若不打算修改可收起。修改内容后会再次出现。", "Bỏ qua nếu không sửa. Sẽ hiện lại khi bạn sửa nội dung.", "直さないなら片づけてください。内容を直すと再び表示されます。", "Sembunyikan jika tidak akan diubah. Muncul lagi bila teks diubah.")}
          className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[18px] leading-none text-[color:var(--v2-faint)] transition hover:bg-[color:var(--v2-band)]"
        >
          ×
        </button>
      </div>
      {why ? <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{why}</p> : null}
    </li>
  );

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-2">
        <h3 className="text-[19px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("전체 점검", "Full check", "整体检查", "Kiểm tra toàn bộ", "全体チェック", "Cek menyeluruh")}</h3>
        {total ? <span className="text-[17px] font-bold text-[color:var(--v2-attention)]">{total}</span> : null}
      </div>
      {total === 0 ? (
        <p className="rounded-2xl bg-[#e8f8f1] px-4 py-3.5 text-[15px] font-semibold leading-[1.55] text-[color:var(--v2-good)]">
          {review.ran
            ? t("확인할 항목이 없어요.", "Nothing to fix.", "没有待修项。", "Không có gì cần sửa.", "修正点はありません。", "Tidak ada perbaikan.")
            : t("규칙으로 걸리는 건 없어요. 아래에서 AI 점검도 해 보세요.", "Nothing caught by the rules. Try the AI check below.", "规则未发现问题。可试试下方 AI 检查。", "Quy tắc không phát hiện gì. Thử kiểm tra AI bên dưới.", "ルールでの指摘はありません。下のAIチェックもどうぞ。", "Aturan tidak menemukan apa pun. Coba cek AI di bawah.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {lines.map((line, i) => row(`r${i}`, line.key, line.id, line.what, line.why))}
          {aiLines.map((f, i) => row(`a${i}`, f.key, f.id, `AI · ${labelOf(f.id)} — ${f.issue}`, f.fix))}
        </ul>
      )}

      <div className="mt-4">
        {/* 내용이 있는 항목이 하나도 없으면 누르지 못하게 — 기존과 같은 이유. */}
        <Button variant="secondary" full onClick={onRunReview} disabled={review.running || !doc.items.some((it) => (it.text ?? "").trim())}>
          {review.running ? (
            <>
              <Spinner /> {t("점검 중…", "Checking…", "检查中…", "Đang kiểm tra…", "チェック中…", "Memeriksa…")}
            </>
          ) : review.ran ? (
            t("AI로 다시 점검", "Check again with AI", "再用 AI 检查", "Kiểm tra lại bằng AI", "AIで再チェック", "Cek ulang dengan AI")
          ) : (
            t("AI로 더 점검하기", "Check with AI", "用 AI 检查", "Kiểm tra bằng AI", "AIでチェック", "Cek dengan AI")
          )}
        </Button>
      </div>
      {review.error ? <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--v2-attention)]">{review.error}</p> : null}
      {hiddenIssues.hiddenCount > 0 ? (
        <div className="mt-3">
          <TextLink onClick={hiddenIssues.showAll}>
            {t(`치워 둔 ${hiddenIssues.hiddenCount}개 다시 보기`, `Show ${hiddenIssues.hiddenCount} dismissed`, `显示已收起的 ${hiddenIssues.hiddenCount} 条`, `Xem lại ${hiddenIssues.hiddenCount} mục đã bỏ`, `片づけた ${hiddenIssues.hiddenCount} 件を表示`, `Tampilkan ${hiddenIssues.hiddenCount} yang disembunyikan`)}
          </TextLink>
        </div>
      ) : null}
      <p className="mt-3 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
        {t(
          "AI 점검은 눌렀을 때만 돌아요. 내용을 고치면 그 항목의 지적은 사라져요.",
          "The AI check runs only when you press it. Edit an item and its note clears.",
          "AI 检查仅在点击时运行。修改内容后该条提示会消失。",
          "Kiểm tra AI chỉ chạy khi bạn bấm. Sửa nội dung thì ghi chú sẽ mất.",
          "AIチェックは押したときだけ動きます。内容を直すとその指摘は消えます。",
          "Cek AI hanya jalan saat ditekan. Ubah isinya, catatannya hilang."
        )}
      </p>
    </div>
  );
}

// ── 이력서 문장으로 정리(일괄) ─────────────────────────────────

/** 전체 항목 일괄 정리 — 대화체 기록을 이력서 개조식으로 한 번에 바꾼다(기존과 같은 배치 엔드포인트, 최대 40항목).
 *  문서 전체를 갈아치우므로 직전 항목을 들고 있다가 되돌릴 수 있게 한다. */
function BulkPolishCard({ t, doc, onDoc }: { t: PlatformT; doc: ResumeDoc; onDoc: (patch: Partial<ResumeDoc>, opts?: DocPatchOpts) => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [prev, setPrev] = useState<ResumeDoc["items"] | null>(null);
  const targets = doc.items.filter((it) => (it.text ?? "").trim().length > 0).slice(0, 40);
  if (targets.length === 0) return null;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const texts = await polishResumeItems(
        targets.map((it) => ({
          section: sectionLabelOf(t, it.section),
          org: it.company?.trim() || undefined,
          period: [it.startDate ?? "", it.endDate ?? ""].map((v) => v.trim()).filter(Boolean).join(" ~ ") || undefined,
          text: (it.text ?? "").trim()
        }))
      );
      const byId = new Map(targets.map((it, i) => [it.id, texts[i]]));
      let changed = 0;
      const items = doc.items.map((it) => {
        const next = byId.get(it.id);
        if (typeof next !== "string" || next === it.text) return it;
        changed += 1;
        return { ...it, text: next };
      });
      if (changed > 0) {
        setPrev(doc.items);
        onDoc({ items }, { label: "이력서 문장으로 정리", force: true });
      }
      toast.success(
        changed > 0
          ? `${changed}${t("개 항목을 정리했어요", " items polished", " 项已整理", " mục đã chỉnh", "件を整えました", " item dirapikan")}`
          : t("바꿀 내용이 없었어요", "Nothing to change", "没有需要修改的", "Không có gì để đổi", "変更点はありません", "Tidak ada perubahan")
      );
    } catch (err) {
      // 429·5xx 는 aiPost 가 전역 토스트로 안내한다.
      console.error("[v2-resume-editor/bulk-polish] failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <V2Card title={t("이력서 문장으로 정리", "Polish into resume style", "整理为简历体", "Chỉnh theo văn phong CV", "履歴書体に整える", "Rapikan gaya CV")}>
      <p className="text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
        {t("대화체 기록을 ‘~함/~완료’ 형태로 한 번에 바꿔요. 없는 사실은 더하지 않아요.", "Rewrites your notes in resume style at once. No facts are invented.", "一次性改写为简历体，不会添加不存在的事实。", "Viết lại toàn bộ theo văn phong CV, không thêm điều không có.", "話し言葉を一括で履歴書体に直します。事実は追加しません。", "Menulis ulang sekaligus ke gaya CV, tanpa menambah fakta.")}
      </p>
      <div className="mt-4 flex flex-col gap-2">
        <Button variant="secondary" full onClick={() => void run()} disabled={busy}>
          {busy ? (
            <>
              <Spinner /> {t("정리 중…", "Polishing…", "整理中…", "Đang chỉnh…", "整えています…", "Merapikan…")}
            </>
          ) : (
            `${t("정리하기", "Polish", "整理", "Chỉnh", "整える", "Rapikan")} · ${targets.length}`
          )}
        </Button>
        {prev ? (
          <Button
            variant="white"
            full
            onClick={() => {
              onDoc({ items: prev });
              setPrev(null);
            }}
          >
            {t("되돌리기", "Undo", "撤销", "Hoàn tác", "元に戻す", "Batalkan")}
          </Button>
        ) : null}
      </div>
    </V2Card>
  );
}
