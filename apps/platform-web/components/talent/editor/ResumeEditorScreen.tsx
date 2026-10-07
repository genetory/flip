"use client";

// 모듈형 이력서 에디터(전체 화면) — 경력 한 건·자격증 한 건을 모듈로 두고 칸·순서·포함 여부를 구성한다.
//
// 편집하는 이력서는 하나다.
//   모듈 내용 → talent 문서(saveResumeDoc / saveBasicInfo) — 앱·매칭·인재 검색이 읽는 원본
//   구성      → 편집 중 행(/members/me/doc-versions, snapshot = null)
// '새 버전으로 저장'은 그 순간의 내용·구성을 읽기 전용 저장본으로 남긴다(지원할 때 고른다).
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowsLeftRight, CaretLeft, CaretRight, CursorClick, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
import { TalentGuard } from "../app/TalentGuard";
import { PDF_PRINT_AREA, PdfDownloadButton, PrintStyles } from "../career/pdf-print";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import type { CareerSection } from "../../../lib/talent/career-chat";
import { sectionLabelOf } from "../../../lib/talent/career-labels";
import { saveBasicInfo, useBasicInfo, type BasicInfo } from "../../../lib/talent/basic-info";
import {
  addResumeItem,
  displayMonth,
  normalizeMonth,
  saveResumeDoc,
  useRenewalDocsStatus,
  useResumeDoc,
  type ResumeDoc,
  generateResumeDoc,
  useResumeHistory
} from "../../../lib/talent/resume-doc";
import { FIXED_MODULES, isFixedModule, type ResumeLayout, type ResumeSnapshot } from "../../../lib/talent/doc-versions";
import {
  hideModule,
  locate,
  moveModuleTo,
  moveToOtherColumn,
  nudgeModule,
  placeAllUnplaced,
  placeModule,
  resolveLayout,
  setTemplate,
  toStoredLayout,
  type ResolvedLayout
} from "../../../lib/talent/resume-layout";
import { ModularResumePages, type DropSlot, type EditorInteraction } from "./ModularResumePages";
import { resumeIssueQuotes, scanResume, type ResumeScan, type ResumeScanIssue } from "../../../lib/talent/resume-scan";
import { polishExperienceText, polishSelfIntro, polishResumeItems, reviewResume, importResume } from "../../../lib/resume-maker-client";
import { importedResumeToPreview, type ImportPreview } from "../../../lib/talent/import-to-renewal";
import { ImportFromFile, resumeImportSummary } from "./ImportFromFile";
import { RecentChanges, type ChangePoint } from "./RecentChanges";
import { diffResumeDocs } from "../../../lib/talent/doc-diff";
import { restoreResumeVersion } from "../../../lib/talent/renewal-docs-store";
import { useToast } from "../../toast/ToastProvider";
import { AiPolish } from "./AiPolish";
import { EditorTopBar, Field, FullMessage, INPUT_CLS, SavedPanel, Section, SHEET_CLS, sheetStyle, ToolButton, useAiReview, useKeyboardInset, useDocVersionStore, useHiddenIssues, useRevealOnChange, TINT_BTN } from "./editor-shared";


// 왼쪽 목록·새 항목 추가에 쓰는 섹션 순서(기존 편집 화면과 같다).
const SECTIONS: CareerSection[] = ["experience", "project", "certificate", "language", "skill", "activity", "award", "education"];

export function ResumeEditorScreen() {
  return (
    <TalentGuard>
      <EditorGate />
    </TalentGuard>
  );
}

function EditorGate() {
  const t = usePlatformT();
  const doc = useResumeDoc();
  const status = useRenewalDocsStatus();
  const info = useBasicInfo();

  // 이력서가 없어도 빈 문서로 바로 편집을 시작한다(자소서 에디터와 동일).
  // 예전에는 구 화면으로 보냈는데, 그 경로가 사라지면 '눌러도 반응 없음'이 된다.
  // 첫 편집이 saveResumeDoc 을 타면서 계정에 저장된다.
  const empty = useMemo(() => generateResumeDoc([]), []);

  if (status !== "loaded") return <FullMessage text={t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")} />;
  return <Editor doc={doc ?? empty} info={info} />;
}

// ── 에디터 ───────────────────────────────────────────────────

function Editor({ doc, info }: { doc: ResumeDoc; info: BasicInfo }) {
  const t = usePlatformT();
  const store = useDocVersionStore<ResumeLayout, ResumeSnapshot>("resume", t);
  const { working, current } = store;
  const [selectedId, setSelectedId] = useState<string | null>(FIXED_MODULES.basic);
  const [dragId, setDragId] = useState<string | null>(null);
  // 가져오기 되돌리기용 스냅샷. **훅이라 아래 조기 반환(불러오는 중)보다 위에 있어야 한다.**
  // 아래에 뒀더니 로딩이 끝나는 순간 훅 개수가 달라져 화면이 통째로 깨졌다.
  const [importUndo, setImportUndo] = useState<ResumeDoc | null>(null);
  // 모바일에서 열려 있는 시트. 데스크톱에서는 쓰이지 않는다(패널이 늘 보인다).
  // 'props' 는 항목을 고르면 함께 열린다 — 고르자마자 편집할 수 있게.
  const [sheet, setSheet] = useState<"none" | "modules" | "props">("none");
  // 시트를 무엇 때문에 열었는지. 값이 바뀔 때마다 패널이 그 자리로 스크롤한다 —
  // 모바일에서 '고치기' 를 눌렀는데 맨 위 도구만 보이면 쓸 수가 없다.
  const [focus, setFocus] = useState<string | null>(null);
  const history = useResumeHistory();
  const [hover, setHover] = useState<DropSlot | null>(null);

  // 지금 문서에 맞춘 편집 중 구성 — 앱·기존 화면에서 새로 생긴 모듈도 빠지지 않게 자연스러운 자리에 넣어 보여준다.
  const layout: ResolvedLayout | null = useMemo(() => {
    if (!working) return null;
    return placeAllUnplaced(resolveLayout(working.layout, doc), doc);
  }, [working, doc]);

  const commitLayout = (next: ResolvedLayout) => store.setWorkingLayout(toStoredLayout(next));

  // 전체 점검(규칙만, AI 호출 없음) — 본문의 옅은 표시와 오른쪽 목록이 같은 결과를 쓴다.
  // 이력서에서 빼 둔 모듈은 제출물에 없으니 점검하지 않는다 — 고칠 필요 없는 걸 지적하지 않게.
  const placedIds = useMemo(() => new Set(layout ? layout.cols.flat() : []), [layout]);
  const scan = useMemo(() => scanResume(doc.items.filter((it) => placedIds.has(it.id))), [doc.items, placedIds]);

  // AI 점검 — 버튼을 눌렀을 때만 돈다. 규칙 점검과 같은 표시 체계에 얹는다.
  const texts = useMemo(() => new Map(doc.items.map((it) => [it.id, it.text ?? ""])), [doc.items]);
  const review = useAiReview("resume", texts);
  // 치워 둔 지적 — 목록에서도 본문 형광펜에서도 빠진다(남은 할 일만 보이게).
  const hiddenIssues = useHiddenIssues("resume");
  const runReview = () =>
    void review.run(() =>
      reviewResume({
        targetRole: doc.targetRole?.trim() || undefined,
        summary: doc.summary?.trim() || undefined,
        // 이력서에 들어간 항목만, 그리고 내용이 있는 것만 보낸다.
        // 빈 항목을 보내면 AI 가 '비어 있다'고 지적해 규칙 점검과 같은 말이 두 번 나온다
        // (프롬프트로 금지해도 넘어온다 — 아예 안 보내는 게 확실하다).
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

  // 본문에 칠할 것 — 항목 id → 형광펜으로 칠할 구절. 규칙과 AI 를 합친다.
  // 구절이 하나도 없으면 빈 배열로 둔다('기간이 없다'처럼 빠진 것은 칠할 글자가 없어 전체를 옅게).
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

  // ── 드래그 앤 드롭 ──
  const interaction: EditorInteraction | undefined = layout
    ? {
        selectedId,
        flagged,
        dragId,
        hover,
        onSelect: (id) => {
          setSelectedId(id);
          setSheet("props");
          setFocus(`item:${id}:${Date.now()}`);
        },
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

  if (!working || !current || !layout) {
    return <FullMessage text={t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")} />;
  }

  const topBar = (right: React.ReactNode) => (
    <EditorTopBar
      t={t}
      active="resume"
      exitHref="/talent/career"
      working={working}
      saved={store.saved}
      current={current}
      onPick={(id) => {
        store.setCurrentId(id);
        setSelectedId(FIXED_MODULES.basic);
      }}
      // 지금 화면 그대로 — 편집 중 구성(자동 배치 포함)과 내용을 함께 저장본으로.
      onSaveNew={(name) => store.saveAsNew(name, toStoredLayout(layout), { resume: doc, basicInfo: info })}
      saveState={store.saveState}
      right={right}
    />
  );

  // ── 저장본 보기(읽기 전용) ──
  if (current.snapshot) {
    const snap = current.snapshot;
    const savedLayout = resolveLayout(current.layout, snap.resume);
    return (
      <div className="flex h-screen flex-col bg-[#EEF0F3] text-[#191F28] print:block print:h-auto print:bg-white">
        <PrintStyles />
        {topBar(<PdfDownloadButton />)}
        <div className="flex min-h-0 flex-1 print:block">
          <main className="min-w-0 flex-1 overflow-auto px-8 py-8 print:hidden" aria-label={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
            <div className="mx-auto max-w-[794px]">
              <ModularResumePages doc={snap.resume} info={snap.basicInfo} layout={savedLayout} />
            </div>
          </main>
          <SavedPanel t={t} version={current} onRename={(name) => store.renameSaved(current.id, name)} onDelete={() => void store.removeSaved(current.id)} />
        </div>
        <PrintCopy doc={snap.resume} info={snap.basicInfo} layout={savedLayout} />
      </div>
    );
  }

  // ── 모듈 내용(talent 문서 — 앱·인재 검색이 읽는 원본) ──
  const updateItem = (id: string, patch: Partial<{ text: string; company: string; startDate: string; endDate: string; section: CareerSection }>) =>
    saveResumeDoc({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const addItem = (section: CareerSection) => {
    const { doc: next, id } = addResumeItem(doc, section, "");
    saveResumeDoc(next);
    commitLayout(placeModule(layout, next, id));
    setSelectedId(id);
  };
  const deleteItem = (id: string) => {
    if (!window.confirm(t("이 항목을 삭제할까요? 이미 저장한 버전에는 그대로 남아요.", "Delete this item? Saved versions keep it.", "要删除此条目吗？已保存的版本仍会保留。", "Xóa mục này? Các bản đã lưu vẫn giữ.", "この項目を削除しますか？保存済みのバージョンには残ります。", "Hapus item ini? Versi tersimpan tetap menyimpannya."))) return;
    saveResumeDoc({ ...doc, items: doc.items.filter((it) => it.id !== id) });
    setSelectedId(null);
  };

  const placed = new Set(layout.cols.flat());

  // 되돌릴 수 있는 지점 — 각 지점 **이후** 무엇이 달라졌는지 계산해 함께 보여 준다.
  const changePoints: ChangePoint[] = history.map((v) => ({ savedAt: v.savedAt, label: v.label, change: diffResumeDocs(v.doc, doc) }));

  const applyImport = (p: ImportPreview) => {
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
      // 글이 한 번에 크게 늘어나는 작업 — 직전에 타이핑이 있었어도 되돌릴 지점을 남긴다.
      { label: "파일에서 가져오기", force: true }
    );
    // 새로 들어온 항목은 아직 '이력서에 넣기' 전 상태다 — 자동 배치는 레이아웃이 알아서 한다.
  };
  // 점검 목록에서 누르면 그 항목을 고르고, 화면 밖이면 보이는 곳까지 굴린다.
  // 편집 영역 안에서만 찾는다 — 인쇄 사본(PrintCopy)에도 같은 data-module 이 있다.
  const goItem = (id: string) => {
    setSelectedId(id);
    setSheet("props");
    setFocus(`item:${id}:${Date.now()}`);
    document.querySelector(`main [data-module="${CSS.escape(id)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  return (
    <div className="flex h-screen flex-col bg-[#EEF0F3] text-[#191F28] print:block print:h-auto print:bg-white">
      <PrintStyles />
      {topBar(
        <>
          <TemplateSwitch t={t} template={layout.template} onTemplate={(tpl) => commitLayout(setTemplate(layout, tpl, doc))} />
          <PdfDownloadButton />
        </>
      )}
      <div className="flex min-h-0 flex-1 print:block">
        <ModuleList
          open={sheet === "modules"}
          onClose={() => setSheet("none")}
          t={t}
          doc={doc}
          placed={placed}
          selectedId={selectedId}
          onSelect={goItem}
          onToggle={(id) => commitLayout(placed.has(id) ? hideModule(layout, id) : placeModule(layout, doc, id))}
          onAdd={addItem}
        />
        <main className="min-w-0 flex-1 overflow-auto px-4 py-5 print:hidden lg:px-8 lg:py-8" aria-label={t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}>
          {/* 모바일 조작부 — 데스크톱에는 패널이 늘 보이므로 숨긴다.
              평소 화면에 더해지는 건 이 두 버튼뿐이고, 편집 패널은 탭했을 때만 올라온다. */}
          <div className="mx-auto mb-4 flex max-w-[794px] gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setSheet("modules")}
              className={`${TINT_BTN} h-11 flex-1 rounded-[12px] text-[13.5px] font-bold leading-none`}
            >
              {t("항목 추가·구성", "Items & layout", "条目·结构", "Mục & bố cục", "項目・構成", "Item & tata letak")}
            </button>
            <button
              type="button"
              onClick={() => {
                setSheet("props");
                setFocus(`check:${Date.now()}`);
              }}
              className="h-11 flex-1 rounded-[12px] bg-white text-[13.5px] font-bold leading-none text-[#4E5968] ring-1 ring-[#E5E8EB]"
            >
              {t(`전체 점검${scan.flaggedCount ? ` ${scan.flaggedCount}` : ""}`, `Check${scan.flaggedCount ? ` ${scan.flaggedCount}` : ""}`, `检查${scan.flaggedCount ? ` ${scan.flaggedCount}` : ""}`, `Kiểm tra${scan.flaggedCount ? ` ${scan.flaggedCount}` : ""}`, `チェック${scan.flaggedCount ? ` ${scan.flaggedCount}` : ""}`, `Cek${scan.flaggedCount ? ` ${scan.flaggedCount}` : ""}`)}
            </button>
          </div>
          <div className="mx-auto max-w-[794px]">
            <ModularResumePages doc={doc} info={info} layout={layout} interaction={interaction} />
          </div>
        </main>

        {/* 시트 뒤 어둡게 — 바깥을 누르면 닫힌다. 데스크톱에는 없다. */}
        {sheet !== "none" ? (
          <button
            type="button"
            aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
            onClick={() => setSheet("none")}
            className="fixed inset-0 z-30 bg-[#0B1227]/30 lg:hidden"
          />
        ) : null}
        <Inspector
          open={sheet === "props"}
          focus={focus}
          onClose={() => setSheet("none")}
          onBrowse={() => setSheet("modules")}
          t={t}
          doc={doc}
          info={info}
          layout={layout}
          selectedId={selectedId}
          placed={placed.has(selectedId ?? "")}
          onItem={updateItem}
          onDoc={(patch, opts) => saveResumeDoc({ ...doc, ...patch }, opts)}
          onBasic={(patch) => saveBasicInfo({ ...info, ...patch })}
          onLayout={commitLayout}
          onDelete={deleteItem}
          scan={scan}
          onGoItem={goItem}
          review={review}
          onRunReview={runReview}
          hiddenIssues={hiddenIssues}
          changePoints={changePoints}
          onImport={applyImport}
          importUndo={importUndo ? () => { saveResumeDoc(importUndo); setImportUndo(null); } : null}
        />
      </div>
      <PrintCopy doc={doc} info={info} layout={layout} />
    </div>
  );
}

/**
 * PDF 다운받기용 사본 — 편집 여백·선택 표시 없이, 기존 미리보기 PDF 와 같은 A4 모양으로 인쇄한다.
 * 화면에선 밖에 두되 폭(794)은 유지해야 인쇄 전에 페이지 나눔이 계산돼 있다.
 */
function PrintCopy({ doc, info, layout }: { doc: ResumeDoc; info: BasicInfo; layout: ResolvedLayout }) {
  return (
    <div aria-hidden className={`pointer-events-none fixed -left-[99999px] top-0 w-[794px] print:left-0 ${PDF_PRINT_AREA}`}>
      <ModularResumePages doc={doc} info={info} layout={layout} />
    </div>
  );
}

// ── 상단 바: 템플릿 ──────────────────────────────────────────

function TemplateSwitch({ t, template, onTemplate }: { t: PlatformT; template: ResumeLayout["template"]; onTemplate: (tpl: ResumeLayout["template"]) => void }) {
  return (
    <div role="group" aria-label={t("템플릿", "Template", "模板", "Mẫu", "テンプレート", "Templat")} className="flex items-center rounded-[10px] bg-[#F2F4F6] p-[3px]">
      {(["two", "one"] as const).map((tpl) => (
        <button
          key={tpl}
          type="button"
          onClick={() => onTemplate(tpl)}
          aria-pressed={template === tpl}
          className={`flex h-[30px] items-center rounded-[8px] px-3 text-[13px] font-semibold leading-none transition ${template === tpl ? "bg-white text-[#191F28] shadow-[0_1px_3px_rgba(0,0,0,0.08)]" : "text-[#6B7684] hover:text-[#191F28]"}`}
        >
          {tpl === "two" ? t("2단", "2 columns", "双栏", "2 cột", "2段", "2 kolom") : t("1단", "1 column", "单栏", "1 cột", "1段", "1 kolom")}
        </button>
      ))}
    </div>
  );
}

// ── 왼쪽: 모듈 목록 ──────────────────────────────────────────

function ModuleList({
  open,
  onClose,
  t,
  doc,
  placed,
  selectedId,
  onSelect,
  onToggle,
  onAdd
}: {
  /** 모바일 시트가 열려 있는지. 데스크톱(lg)에서는 항상 보이므로 영향 없다. */
  open: boolean;
  onClose: () => void;
  t: PlatformT;
  doc: ResumeDoc;
  placed: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAdd: (section: CareerSection) => void;
}) {
  const kb = useKeyboardInset();
  const fixed: { id: string; label: string }[] = [
    { id: FIXED_MODULES.basic, label: t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar") },
    { id: FIXED_MODULES.summary, label: t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang") },
    { id: FIXED_MODULES.links, label: t("링크·포트폴리오", "Links", "链接", "Liên kết", "リンク", "Tautan") }
  ];
  const row = (id: string, label: string) => {
    const on = placed.has(id);
    return (
      <li key={id} className={`flex items-center gap-3 rounded-[10px] px-2.5 transition lg:gap-2.5 lg:py-[7px] ${selectedId === id ? "bg-[#EDF1FD]" : "hover:bg-[#F7F8FA]"}`}>
        <button
          type="button"
          onClick={() => onToggle(id)}
          aria-pressed={on}
          aria-label={on ? t(`이력서에서 빼기: ${label}`, `Remove from resume: ${label}`) : t(`이력서에 넣기: ${label}`, `Add to resume: ${label}`)}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] transition lg:h-[18px] lg:w-[18px] lg:rounded-[6px] ${on ? "bg-[#0B46E8]" : "bg-[#E5E8EB] hover:bg-[#D1D6DB]"}`}
        >
          {on ? (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => onSelect(id)}
          className={`line-clamp-2 min-w-0 flex-1 py-3 text-left text-[14px] leading-snug lg:truncate lg:py-0 lg:text-[13px] ${selectedId === id ? "font-semibold text-[#0B46E8]" : on ? "font-medium text-[#191F28]" : "text-[#B0B8C1]"}`}
        >
          {label}
        </button>
        {/* 눌러서 고칠 수 있다는 표시 — 데스크톱에는 오른쪽 패널이 늘 보여서 필요 없다. */}
        <CaretRight size={14} weight="bold" className="shrink-0 text-[#C4CAD2] lg:hidden" aria-hidden />
      </li>
    );
  };
  return (
    <aside
      style={sheetStyle(kb)}
      className={`no-print ${open ? "flex" : "hidden"} lg:flex ${SHEET_CLS} w-full flex-col gap-6 overflow-y-auto border-[#E5E8EB] bg-white px-4 py-6 [&>*]:shrink-0 lg:w-[288px] lg:shrink-0 lg:border-r`}
      aria-label={t("모듈", "Modules", "模块", "Mô-đun", "モジュール", "Modul")}
    >
      {/* 모바일 시트 손잡이·닫기 — 데스크톱에는 없다. */}
      <div className="-mt-2 flex items-center justify-between lg:hidden">
        <span className="h-1 w-10 rounded-full bg-[#E5E8EB]" aria-hidden />
        <button type="button" onClick={onClose} className="rounded-full px-2 py-1 text-[12.5px] font-semibold text-[#6B7684]">
          {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
        </button>
      </div>

      <div className="px-2.5">
        {/* '모듈' 은 편집기 용어다 — 모바일에서는 무엇의 목록인지 바로 알 수 있게 쓴다. */}
        <p className="text-[16px] font-bold tracking-[-0.01em]">
          <span className="lg:hidden">{t("이력서 항목", "Resume items", "简历条目", "Mục hồ sơ", "履歴書の項目", "Item resume")}</span>
          <span className="hidden lg:inline">{t("모듈", "Modules", "模块", "Mô-đun", "モジュール", "Modul")}</span>
        </p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8B95A1]">
          <span className="lg:hidden">
            {t(
              "왼쪽 네모를 누르면 이력서에 넣고 빼요. 이름을 누르면 바로 고칠 수 있어요.",
              "Tap the box to add or remove it. Tap the name to edit it.",
              "点方框可加入或移除，点名称可直接修改。",
              "Chạm ô vuông để thêm/bỏ, chạm tên để sửa.",
              "四角を押すと出し入れ、名前を押すとすぐ編集できます。",
              "Ketuk kotak untuk menambah/menghapus, ketuk nama untuk mengubah."
            )}
          </span>
          <span className="hidden lg:inline">
            {t(
              "체크한 항목만 이력서에 들어가요. 페이지에서 끌어 순서를 바꿀 수 있어요.",
              "Only checked items go into the resume. Drag on the page to reorder.",
              "只有勾选的条目会放入简历。可在页面上拖动调整顺序。",
              "Chỉ các mục được chọn mới vào hồ sơ. Kéo trên trang để đổi thứ tự.",
              "チェックした項目だけが履歴書に入ります。ページ上でドラッグして並べ替えできます。",
              "Hanya item yang dicentang masuk ke resume. Seret di halaman untuk mengurutkan."
            )}
          </span>
        </p>
      </div>
      <ul className="flex flex-col gap-0.5">{fixed.map((f) => row(f.id, f.label))}</ul>
      {SECTIONS.map((section) => {
        const items = doc.items.filter((i) => i.section === section);
        return (
          <div key={section}>
            <div className="flex items-center justify-between px-2.5 pb-1.5">
              <span className="text-[12px] font-semibold text-[#8B95A1]">
                {sectionLabelOf(t, section)}
                {items.length ? <span className="ml-1.5 font-medium text-[#B0B8C1]">{items.filter((i) => placed.has(i.id)).length}/{items.length}</span> : null}
              </span>
              <button type="button" onClick={() => onAdd(section)} aria-label={t(`${sectionLabelOf(t, section)} 추가`, `Add ${sectionLabelOf(t, section)}`)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#8B95A1] transition hover:bg-[#EDF1FD] hover:text-[#0B46E8]">
                <Plus size={14} weight="bold" />
              </button>
            </div>
            {items.length ? (
              <ul className="flex flex-col gap-0.5">{items.map((i) => row(i.id, (i.company?.trim() || i.text.trim() || t("(내용 없음)", "(empty)")).split("\n")[0]))}</ul>
            ) : null}
          </div>
        );
      })}
    </aside>
  );
}

// ── 오른쪽: 선택한 모듈·버전 ─────────────────────────────────

function Inspector(props: {
  t: PlatformT;
  doc: ResumeDoc;
  info: BasicInfo;
  layout: ResolvedLayout;
  selectedId: string | null;
  placed: boolean;
  onItem: (id: string, patch: Partial<{ text: string; company: string; startDate: string; endDate: string; section: CareerSection }>) => void;
  onDoc: (patch: Partial<ResumeDoc>, opts?: { label?: string; force?: boolean }) => void;
  onBasic: (patch: Partial<BasicInfo>) => void;
  onLayout: (next: ResolvedLayout) => void;
  onDelete: (id: string) => void;
  scan: ResumeScan;
  /** 문제가 있는 항목으로 바로 이동 — 목록만 보고 사용자가 카드를 찾아다니지 않게. */
  onGoItem: (id: string) => void;
  review: ReturnType<typeof useAiReview>;
  onRunReview: () => void;
  hiddenIssues: ReturnType<typeof useHiddenIssues>;
  changePoints: ChangePoint[];
  onImport: (p: ImportPreview) => void;
  importUndo: (() => void) | null;
  /** 모바일 시트가 열려 있는지. 데스크톱(lg)에서는 항상 보인다. */
  open: boolean;
  /** 시트를 연 이유 — "item:<id>:<n>" 이면 그 항목 입력란으로, "check:<n>" 이면 점검 목록으로 스크롤한다. */
  focus: string | null;
  onClose: () => void;
  /** 모바일에서 항목 목록 시트로 건너가기. 데스크톱에서는 쓰이지 않는다(왼쪽에 늘 있다). */
  onBrowse: () => void;
}) {
  const { t, doc, info, layout, selectedId: id } = props;
  const item = id ? doc.items.find((i) => i.id === id) : undefined;
  const at = id ? locate(layout, id) : null;
  const colLen = at ? layout.cols[at.col].length : 0;
  const kb = useKeyboardInset();
  // 모듈을 고르면 그 편집 영역으로 굴려 준다 — 위쪽 전체 도구에 가려지지 않게.
  // 항목을 고르면 그 편집 영역으로, '전체 점검' 으로 열었으면 점검 목록으로 데려다 준다.
  const reveal = useRevealOnChange<HTMLDivElement>(props.focus?.startsWith("item:") ? props.focus : id);
  const revealCheck = useRevealOnChange<HTMLDivElement>(props.focus?.startsWith("check:") ? props.focus : null);
  // 모바일에서 항목을 고치려고 연 시트인지 — 그때는 문서 전체 도구를 접는다.
  const itemFocused = !!id && !!props.focus?.startsWith("item:");

  return (
    <aside
      style={sheetStyle(kb)}
      className={`no-print ${props.open ? "flex" : "hidden"} lg:flex ${SHEET_CLS} w-full flex-col gap-7 overflow-y-auto border-[#E5E8EB] bg-white px-5 py-6 [&>*]:shrink-0 lg:w-[340px] lg:shrink-0 lg:border-l`}
      aria-label={t("속성", "Properties", "属性", "Thuộc tính", "プロパティ", "Properti")}
    >
      {/* 모바일 시트 머리 — 손잡이·다른 항목으로 건너가기·닫기. 데스크톱에는 없다. */}
      <div className="sticky top-0 z-10 order-first -mt-2 flex items-center justify-between gap-2 bg-white pb-1.5 lg:order-none lg:hidden">
        {itemFocused ? (
          <button type="button" onClick={props.onBrowse} className="-ml-1.5 flex items-center gap-1 rounded-full px-1.5 py-1 text-[12.5px] font-bold leading-none text-[#4E5968]">
            <CaretLeft size={13} weight="bold" className="shrink-0" />
            {t("다른 항목", "Other items", "其他条目", "Mục khác", "他の項目", "Item lain")}
          </button>
        ) : (
          <span className="h-1 w-10 rounded-full bg-[#E5E8EB]" aria-hidden />
        )}
        <button type="button" onClick={props.onClose} className="rounded-full px-2 py-1 text-[12.5px] font-semibold text-[#6B7684]">
          {t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
        </button>
      </div>

      {/* 문서 전체에 거는 작업 — 데스크톱에서는 모듈 선택과 무관하게 늘 맨 위에 보인다.
          모바일에서 '고치기' 로 연 시트에서는 숨긴다(항목 편집만 보이게). '전체 점검' 으로 열면 보인다.
          display:contents 를 쓰지 않는 이유: 패널의 [&>*]:shrink-0 가 안쪽 자식에 닿지 않아
          스크롤 열에서 버튼 높이가 눌린다. 같은 gap 의 flex 열로 감싸 데스크톱 간격을 유지한다. */}
      <div className={`flex shrink-0 flex-col gap-7 [&>*]:shrink-0 ${itemFocused ? "hidden lg:flex" : ""}`}>
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
        onApply={props.onImport}
        onUndo={props.importUndo}
      />

      <RecentChanges t={t} points={props.changePoints} onRestore={(at) => void restoreResumeVersion(at)} />

      <BulkPolishSection t={t} doc={doc} onDoc={props.onDoc} />
      <div ref={revealCheck} className="scroll-mt-6">
        <ResumeCheckSection t={t} doc={doc} scan={props.scan} onGoItem={props.onGoItem} review={props.review} onRunReview={props.onRunReview} hiddenIssues={props.hiddenIssues} />
      </div>
      </div>

      {id ? (
        <>
          <div ref={reveal} className="order-1 scroll-mt-6 lg:order-none">
            <span className="inline-flex h-6 items-center rounded-full bg-[#EDF1FD] px-2.5 text-[11.5px] font-bold leading-none text-[#0B46E8]">{moduleKindLabel(t, id, item?.section)}</span>
            <p className="mt-2 text-[18px] font-bold leading-snug tracking-[-0.01em]">{moduleTitle(t, id, doc, info)}</p>
          </div>

          <Section title={t("배치", "Placement", "位置", "Vị trí", "配置", "Penempatan")} className="order-3 lg:order-none">
            {props.placed ? (
              <div className="grid grid-cols-2 gap-2">
                <ToolButton icon={<ArrowUp size={14} weight="bold" />} label={t("위로", "Up", "上移", "Lên", "上へ", "Naik")} disabled={!at || at.index === 0} onClick={() => id && props.onLayout(nudgeModule(layout, id, -1))} />
                <ToolButton icon={<ArrowDown size={14} weight="bold" />} label={t("아래로", "Down", "下移", "Xuống", "下へ", "Turun")} disabled={!at || at.index >= colLen - 1} onClick={() => id && props.onLayout(nudgeModule(layout, id, 1))} />
                <ToolButton
                  icon={<ArrowsLeftRight size={14} weight="bold" />}
                  label={at?.col === 0 ? t("오른쪽 칸으로", "To right column", "移到右栏", "Sang cột phải", "右の段へ", "Ke kolom kanan") : t("왼쪽 칸으로", "To left column", "移到左栏", "Sang cột trái", "左の段へ", "Ke kolom kiri")}
                  disabled={layout.cols.length < 2}
                  onClick={() => id && props.onLayout(moveToOtherColumn(layout, id))}
                />
                <ToolButton icon={<EyeSlash size={14} weight="bold" />} label={t("이력서에서 빼기", "Remove", "从简历移除", "Bỏ khỏi hồ sơ", "履歴書から外す", "Keluarkan")} onClick={() => id && props.onLayout(hideModule(layout, id))} />
              </div>
            ) : (
              <button type="button" onClick={() => id && props.onLayout(placeModule(layout, doc, id))} className="flex h-10 w-full items-center justify-center rounded-[10px] bg-[#0B46E8] text-[13px] font-bold leading-none text-white transition hover:bg-[#0A3ECB]">
                {t("이력서에 넣기", "Add to resume", "加入简历", "Thêm vào hồ sơ", "履歴書に入れる", "Tambahkan ke resume")}
              </button>
            )}
            <p className="text-[12px] leading-relaxed text-[#8B95A1]">
              {t("페이지에서 끌어 옮겨도 돼요.", "You can also drag it on the page.", "也可以在页面上拖动。", "Bạn cũng có thể kéo trên trang.", "ページ上でドラッグしても移動できます。", "Bisa juga diseret di halaman.")}
            </p>
          </Section>

          <ContentEditor {...props} id={id} item={item} className="order-2 lg:order-none" />

          {item ? (
            <button type="button" onClick={() => props.onDelete(item.id)} className="order-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold leading-none text-[#F04452] transition hover:bg-[#FFF0F1] lg:order-none">
              <Trash size={15} weight="bold" className="shrink-0" />
              <span>{t("항목 삭제", "Delete item", "删除条目", "Xóa mục", "項目を削除", "Hapus item")}</span>
            </button>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-[#F7F8FA] px-5 py-10 text-center">
          <CursorClick size={26} weight="duotone" className="text-[#B0B8C1]" />
          <p className="text-[13px] leading-relaxed text-[#8B95A1]">{t("페이지나 왼쪽 목록에서 모듈을 골라 주세요.", "Pick a module on the page or in the list.", "请在页面或列表中选择模块。", "Chọn một mô-đun trên trang hoặc danh sách.", "ページかリストからモジュールを選んでください。", "Pilih modul di halaman atau daftar.")}</p>
        </div>
      )}


    </aside>
  );
}

function ContentEditor(props: Parameters<typeof Inspector>[0] & { id: string; item: ResumeDoc["items"][number] | undefined; className?: string }) {
  const { t, id, item, doc, info } = props;
  const cls = props.className;

  if (id === FIXED_MODULES.basic) {
    return (
      <Section title={t("내용", "Content", "内容", "Nội dung", "内容", "Isi")} className={cls}>
        <Field label={t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")} value={info.realName} onChange={(v) => props.onBasic({ realName: v })} />
        <Field label={t("희망 직무", "Target role", "期望职位", "Vị trí mong muốn", "希望職種", "Posisi yang diinginkan")} value={doc.targetRole} onChange={(v) => props.onDoc({ targetRole: v })} />
        <Field label={t("이메일", "Email", "邮箱", "Email", "メール", "Email")} value={info.email} onChange={(v) => props.onBasic({ email: v })} />
        <Field label={t("연락처", "Phone", "电话", "Điện thoại", "電話", "Telepon")} value={info.phone} onChange={(v) => props.onBasic({ phone: v })} />
        <Field label={t("주소", "Address", "地址", "Địa chỉ", "住所", "Alamat")} value={info.address} onChange={(v) => props.onBasic({ address: v })} />
        <SharedNote t={t} />
      </Section>
    );
  }
  if (id === FIXED_MODULES.links) {
    // 링크·포트폴리오를 여기서 바로 고친다 — 예전에는 구 이력서 화면으로 보냈다.
    const links = doc.links ?? [];
    const update = (i: number, patch: Partial<{ label: string; url: string }>) =>
      props.onDoc({ links: links.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) });
    return (
      <Section title={t("링크·포트폴리오", "Links & portfolio", "链接·作品集", "Liên kết & hồ sơ", "リンク・ポートフォリオ", "Tautan & portofolio")} className={cls}>
        {links.length === 0 ? (
          <p className="text-[12px] leading-relaxed text-[#8B95A1]">
            {t("깃허브·노션·포트폴리오 주소를 넣어 보세요.", "Add your GitHub, Notion, or portfolio link.", "添加 GitHub、Notion 或作品集链接。", "Thêm GitHub, Notion hoặc portfolio.", "GitHub・Notion・ポートフォリオのURLを追加。", "Tambahkan GitHub, Notion, atau portofolio.")}
          </p>
        ) : null}
        {links.map((l, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-[10px] bg-[#F7F8FA] p-2.5">
            <Field label={t("이름", "Label", "名称", "Nhãn", "名称", "Label")} value={l.label} onChange={(v) => update(i, { label: v })} />
            <Field label={t("주소", "URL", "网址", "Đường dẫn", "URL", "URL")} value={l.url} onChange={(v) => update(i, { url: v })} />
            <button
              type="button"
              onClick={() => props.onDoc({ links: links.filter((_, idx) => idx !== i) })}
              className="h-8 rounded-[10px] bg-white text-[12px] font-semibold text-[#8B95A1] ring-1 ring-[#E5E8EB] transition hover:text-[#F04452]"
            >
              {t("삭제", "Remove", "删除", "Xóa", "削除", "Hapus")}
            </button>
          </div>
        ))}
        <button type="button" onClick={() => props.onDoc({ links: [...links, { label: "", url: "" }] })} className={`${TINT_BTN} h-9 w-full rounded-[10px] text-[13px] font-semibold leading-none`}>
          {t("링크 추가", "Add link", "添加链接", "Thêm liên kết", "リンクを追加", "Tambah tautan")}
        </button>
      </Section>
    );
  }

  const isSummary = id === FIXED_MODULES.summary;
  const text = isSummary ? doc.summary ?? "" : item?.text ?? "";
  const company = item?.company ?? "";
  const setText = (v: string) => (isSummary ? props.onDoc({ summary: v }) : props.onItem(id, { text: v }));
  const setCompany = (v: string) => props.onItem(id, { company: v });

  return (
    <Section title={t("내용", "Content", "内容", "Nội dung", "内容", "Isi")} className={cls}>
      {item ? (
        <>
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#6B7684]">
            {t("섹션", "Section", "分区", "Mục", "セクション", "Bagian")}
            <select
              value={item.section}
              onChange={(e) => props.onItem(item.id, { section: e.target.value as CareerSection })}
              className={`h-10 ${INPUT_CLS}`}
            >
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  {sectionLabelOf(t, s)}
                </option>
              ))}
            </select>
          </label>
          <Field label={t("소속", "Organization", "单位", "Đơn vị", "所属", "Organisasi")} value={company} onChange={setCompany} />
        </>
      ) : null}
      <Field label={isSummary ? t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang") : t("내용", "Details", "内容", "Nội dung", "内容", "Isi")} value={text} onChange={setText} multiline />
      <AiPolish
        key={id}
        t={t}
        text={text}
        polish={(src, style) => (isSummary ? polishSelfIntro({ text: src, style, desiredJobRole: doc.targetRole || undefined }) : polishExperienceText({ text: src, style, type: item?.section }))}
        onApply={setText}
      />
      {item ? (
        <div className="grid grid-cols-2 gap-2">
          <Field label={t("시작", "Start", "开始", "Bắt đầu", "開始", "Mulai")} value={displayMonth(item.startDate ?? "")} placeholder="2023.03" onBlurValue={(v) => props.onItem(item.id, { startDate: normalizeMonth(v) })} />
          <Field label={t("종료", "End", "结束", "Kết thúc", "終了", "Selesai")} value={displayMonth(item.endDate ?? "")} placeholder={t("현재", "Present", "至今", "Hiện tại", "現在", "Sekarang")} onBlurValue={(v) => props.onItem(item.id, { endDate: normalizeMonth(v) })} />
        </div>
      ) : null}
    </Section>
  );
}

// ── 조각 ─────────────────────────────────────────────────────

/** 지적 1건의 키 — 치워 둔 것을 알아보는 데 쓴다. 종류와 내용을 같이 넣어야,
 *  글을 고쳐 다른 지적이 나왔을 때 키가 달라져 다시 보인다. */
function issueKey(id: string, issue: ResumeScanIssue): string {
  return `rule:${id}:${issue.kind}:${"sample" in issue ? issue.sample : "shared" in issue ? issue.shared.join(",") : ""}`;
}

/**
 * 문제 1건을 사람이 읽는 두 줄로 — 무엇이 걸렸는지(what)와 왜·어떻게(why).
 * "기간이 없어요"만 보면 고치라는 건지 알아도 왜 중요한지는 모른다. 지적은 이유가 있어야
 * 납득하고 고친다. 표시 문구는 화면에서 만든다(스캔은 숫자·이름만 준다).
 */
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

/** 전체 점검 — 고쳐 볼 만한 곳을 한 곳에 모으고, 누르면 그 항목으로 간다.
 *  본문의 형광펜과 같은 결과를 쓴다.
 *
 *  두 층이다: 규칙 점검은 늘 켜져 있고(즉시·무료), AI 점검은 버튼을 눌렀을 때만 돈다.
 *  AI 는 규칙이 못 잡는 것(근거 없는 주장·역할 불분명·과장)만 보도록 서버에서 막아 둬서
 *  두 목록이 같은 말을 반복하지 않는다. */
function ResumeCheckSection({
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
  // 문서 순서대로 — 사용자가 위에서 아래로 훑으며 고칠 수 있게.
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
  // AI 지적은 아래에 모은다 — 규칙 결과(즉시 고칠 수 있는 것)를 먼저 보게.
  const aiLines = review.findings
    .filter((f) => byId.has(f.id))
    .map((f) => ({ ...f, key: `ai:${f.id}:${f.issue}` }))
    .filter((f) => !hiddenIssues.hidden.has(f.key));

  // 한 줄 = 무엇이 걸렸나(누르면 그 항목으로) + 왜·어떻게(회색 보조 줄) + 치우기(×).
  // × 는 마우스를 올렸을 때만 보인다 — 늘 떠 있으면 '지우기'처럼 보여서 누르기 겁난다.
  const row = (rk: string, hideKey: string, id: string, what: string, why: string) => (
    <li key={rk} className="group/row break-anywhere rounded-[10px] bg-[#F7F8FA] p-3 text-[13px] leading-[1.6] text-[#4E5968] lg:rounded-none lg:bg-transparent lg:p-0 lg:text-[11.5px]">
      <div className="flex items-start gap-1">
        <button type="button" onClick={() => onGoItem(id)} className="flex min-w-0 flex-1 items-start gap-1 text-left underline-offset-2 transition hover:text-[#0B46E8] hover:underline">
          <span className="min-w-0 flex-1">• {what}</span>
          <CaretRight size={13} weight="bold" className="mt-[3px] shrink-0 text-[#B0B8C1] lg:hidden" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => hiddenIssues.hide(hideKey)}
          aria-label={t("이 지적 치우기", "Dismiss", "收起该提示", "Bỏ qua", "この指摘を片づける", "Sembunyikan")}
          title={t("안 고치기로 했다면 치워 두세요. 내용을 고치면 다시 보여요.", "Dismiss if you won't act on it. It returns if you edit the text.", "若不打算修改可收起。修改内容后会再次出现。", "Bỏ qua nếu không sửa. Sẽ hiện lại khi bạn sửa nội dung.", "直さないなら片づけてください。内容を直すと再び表示されます。", "Sembunyikan jika tidak akan diubah. Muncul lagi bila teks diubah.")}
          className="-mr-1 -mt-1 shrink-0 rounded px-2 py-1 text-[15px] leading-none text-[#B0B8C1] transition hover:text-[#8B95A1] lg:mr-0 lg:mt-[1px] lg:px-1 lg:py-0 lg:text-[12px] lg:text-[#C4CAD2] lg:opacity-0 lg:group-hover/row:opacity-100"
        >
          ×
        </button>
      </div>
      {why ? <p className="mt-1 pl-2.5 text-[12.5px] leading-[1.6] text-[#8B95A1] lg:mt-0.5 lg:text-[11px]">{why}</p> : null}
    </li>
  );

  return (
    <Section title={`${t("전체 점검", "Full check", "整体检查", "Kiểm tra toàn bộ", "全体チェック", "Cek menyeluruh")}${lines.length + aiLines.length ? ` · ${lines.length + aiLines.length}` : ""}`}>
      {lines.length === 0 && aiLines.length === 0 ? (
        <p className="text-[12px] text-[#00854A]">
          {review.ran
            ? t("확인할 항목이 없어요.", "Nothing to fix.", "没有待修项。", "Không có gì cần sửa.", "修正点はありません。", "Tidak ada perbaikan.")
            : t("규칙으로 걸리는 건 없어요. 아래에서 AI 점검도 해 보세요.", "Nothing caught by the rules. Try the AI check below.", "规则未发现问题。可试试下方 AI 检查。", "Quy tắc không phát hiện gì. Thử kiểm tra AI bên dưới.", "ルールでの指摘はありません。下のAIチェックもどうぞ。", "Aturan tidak menemukan apa pun. Coba cek AI di bawah.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-2 lg:gap-1.5">
          {lines.map((line, i) => row(`r${i}`, line.key, line.id, line.what, line.why))}
          {aiLines.map((f, i) => row(`a${i}`, f.key, f.id, `${t("AI", "AI")} · ${labelOf(f.id)} — ${f.issue}`, f.fix))}
        </ul>
      )}

      <button
        type="button"
        onClick={onRunReview}
        // 내용이 있는 항목이 하나도 없으면 누르지 못하게 — 자소서 쪽과 같은 이유.
        disabled={review.running || !doc.items.some((it) => (it.text ?? "").trim())}
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
          "AI 점검은 눌렀을 때만 돌아요. 내용을 고치면 그 항목의 지적은 사라져요.",
          "The AI check runs only when you press it. Edit an item and its note clears.",
          "AI 检查仅在点击时运行。修改内容后该条提示会消失。",
          "Kiểm tra AI chỉ chạy khi bạn bấm. Sửa nội dung thì ghi chú sẽ mất.",
          "AIチェックは押したときだけ動きます。内容を直すとその指摘は消えます。",
          "Cek AI hanya jalan saat ditekan. Ubah isinya, catatannya hilang."
        )}
      </p>
    </Section>
  );
}

function SharedNote({ t }: { t: PlatformT }) {
  return (
    <p className="text-[12px] leading-relaxed text-[#6B7684]">
      {t("기본 정보는 자기소개서·앱과 함께 쓰여요.", "Basic info is shared with your cover letter and the app.", "基本信息与自我介绍、App 共用。", "Thông tin cơ bản dùng chung với thư giới thiệu và ứng dụng.", "基本情報は自己紹介書・アプリと共通です。", "Info dasar dipakai bersama surat lamaran dan aplikasi.")}
    </p>
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
  return (it?.company?.trim() || it?.text.trim() || t("(내용 없음)", "(empty)")).split("\n")[0];
}

/** 전체 항목 일괄 정리 — 대화체로 적어둔 기록을 이력서 개조식으로 한 번에 바꾼다.
 *  항목마다 다듬기를 부르면 항목 수가 그대로 분당 호출 상한(20회)을 먹으므로,
 *  배치 엔드포인트(polish-resume-items)로 한 호출에 최대 40항목을 처리한다.
 *  문서 전체를 갈아치우므로 직전 문서를 들고 있다가 되돌릴 수 있게 한다. */
function BulkPolishSection({ t, doc, onDoc }: { t: PlatformT; doc: ResumeDoc; onDoc: (patch: Partial<ResumeDoc>, opts?: { label?: string; force?: boolean }) => void }) {
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
      console.error("[resume-editor/bulk-polish] failed", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Section title={t("이력서 문장으로 정리", "Polish into resume style", "整理为简历体", "Chỉnh theo văn phong CV", "履歴書体に整える", "Rapikan gaya CV")}>
      <p className="text-[11.5px] leading-[1.6] text-[#8B95A1]">
        {t(
          "대화체 기록을 ‘~함/~완료’ 형태로 한 번에 바꿉니다. 없는 사실은 추가하지 않아요.",
          "Rewrites your notes in resume style at once. No facts are invented.",
          "一次性改写为简历体，不会添加不存在的事实。",
          "Viết lại toàn bộ theo văn phong CV, không thêm điều không có.",
          "話し言葉を一括で履歴書体に直します。事実は追加しません。",
          "Menulis ulang sekaligus ke gaya CV, tanpa menambah fakta."
        )}
      </p>
      <button type="button" onClick={() => void run()} disabled={busy} className={`${TINT_BTN} h-9 w-full rounded-[10px] text-[13px] font-semibold leading-none`}>
        {busy
          ? t("정리 중…", "Polishing…", "整理中…", "Đang chỉnh…", "整えています…", "Merapikan…")
          : `${t("정리", "Polish", "整理", "Chỉnh", "整える", "Rapikan")} ${targets.length}`}
      </button>
      {prev ? (
        <button
          type="button"
          onClick={() => { onDoc({ items: prev }); setPrev(null); }}
          className="h-9 w-full rounded-[10px] bg-white text-[12.5px] font-semibold text-[#4E5968] ring-1 ring-[#E5E8EB] transition hover:text-[#F04452]"
        >
          {t("되돌리기", "Undo", "撤销", "Hoàn tác", "元に戻す", "Batalkan")}
        </button>
      ) : null}
    </Section>
  );
}
