"use client";

// 모듈형 이력서 에디터(전체 화면) — 경력 한 건·자격증 한 건을 모듈로 두고 칸·순서·포함 여부를 구성한다.
//
// 편집하는 이력서는 하나다.
//   모듈 내용 → talent 문서(saveResumeDoc / saveBasicInfo) — 앱·매칭·인재 검색이 읽는 원본
//   구성      → 편집 중 행(/members/me/doc-versions, snapshot = null)
// '새 버전으로 저장'은 그 순간의 내용·구성을 읽기 전용 저장본으로 남긴다(지원할 때 고른다).
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowsLeftRight, CursorClick, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
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
  generateResumeDoc
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
import { scanResume, type ResumeScan, type ResumeScanIssue } from "../../../lib/talent/resume-scan";
import { polishExperienceText, polishSelfIntro, polishResumeItems } from "../../../lib/resume-maker-client";
import { useToast } from "../../toast/ToastProvider";
import { AiPolish } from "./AiPolish";
import { EditorTopBar, Field, FullMessage, INPUT_CLS, SavedPanel, Section, ToolButton, useDocVersionStore, TINT_BTN } from "./editor-shared";


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
  const flagged = useMemo(() => new Set(scan.byItem.keys()), [scan]);

  // ── 드래그 앤 드롭 ──
  const interaction: EditorInteraction | undefined = layout
    ? {
        selectedId,
        flagged,
        dragId,
        hover,
        onSelect: setSelectedId,
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
  // 점검 목록에서 누르면 그 항목을 고르고, 화면 밖이면 보이는 곳까지 굴린다.
  // 편집 영역 안에서만 찾는다 — 인쇄 사본(PrintCopy)에도 같은 data-module 이 있다.
  const goItem = (id: string) => {
    setSelectedId(id);
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
          t={t}
          doc={doc}
          placed={placed}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggle={(id) => commitLayout(placed.has(id) ? hideModule(layout, id) : placeModule(layout, doc, id))}
          onAdd={addItem}
        />
        <main className="min-w-0 flex-1 overflow-auto px-8 py-8 print:hidden" aria-label={t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}>
          <div className="mx-auto max-w-[794px]">
            <ModularResumePages doc={doc} info={info} layout={layout} interaction={interaction} />
          </div>
        </main>
        <Inspector
          t={t}
          doc={doc}
          info={info}
          layout={layout}
          selectedId={selectedId}
          placed={placed.has(selectedId ?? "")}
          onItem={updateItem}
          onDoc={(patch) => saveResumeDoc({ ...doc, ...patch })}
          onBasic={(patch) => saveBasicInfo({ ...info, ...patch })}
          onLayout={commitLayout}
          onDelete={deleteItem}
          scan={scan}
          onGoItem={goItem}
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
  t,
  doc,
  placed,
  selectedId,
  onSelect,
  onToggle,
  onAdd
}: {
  t: PlatformT;
  doc: ResumeDoc;
  placed: Set<string>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAdd: (section: CareerSection) => void;
}) {
  const fixed: { id: string; label: string }[] = [
    { id: FIXED_MODULES.basic, label: t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar") },
    { id: FIXED_MODULES.summary, label: t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang") },
    { id: FIXED_MODULES.links, label: t("링크·포트폴리오", "Links", "链接", "Liên kết", "リンク", "Tautan") }
  ];
  const row = (id: string, label: string) => {
    const on = placed.has(id);
    return (
      <li key={id} className={`flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] transition ${selectedId === id ? "bg-[#EDF1FD]" : "hover:bg-[#F7F8FA]"}`}>
        <button
          type="button"
          onClick={() => onToggle(id)}
          aria-pressed={on}
          aria-label={on ? t(`이력서에서 빼기: ${label}`, `Remove from resume: ${label}`) : t(`이력서에 넣기: ${label}`, `Add to resume: ${label}`)}
          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] transition ${on ? "bg-[#0B46E8]" : "bg-[#E5E8EB] hover:bg-[#D1D6DB]"}`}
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
          className={`min-w-0 flex-1 truncate text-left text-[13px] ${selectedId === id ? "font-semibold text-[#0B46E8]" : on ? "font-medium text-[#191F28]" : "text-[#B0B8C1]"}`}
        >
          {label}
        </button>
      </li>
    );
  };
  return (
    <aside className="no-print flex w-[288px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-[#E5E8EB] bg-white px-4 py-6" aria-label={t("모듈", "Modules", "模块", "Mô-đun", "モジュール", "Modul")}>
      <div className="px-2.5">
        <p className="text-[16px] font-bold tracking-[-0.01em]">{t("모듈", "Modules", "模块", "Mô-đun", "モジュール", "Modul")}</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8B95A1]">
          {t(
            "체크한 항목만 이력서에 들어가요. 페이지에서 끌어 순서를 바꿀 수 있어요.",
            "Only checked items go into the resume. Drag on the page to reorder.",
            "只有勾选的条目会放入简历。可在页面上拖动调整顺序。",
            "Chỉ các mục được chọn mới vào hồ sơ. Kéo trên trang để đổi thứ tự.",
            "チェックした項目だけが履歴書に入ります。ページ上でドラッグして並べ替えできます。",
            "Hanya item yang dicentang masuk ke resume. Seret di halaman untuk mengurutkan."
          )}
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
  onDoc: (patch: Partial<ResumeDoc>) => void;
  onBasic: (patch: Partial<BasicInfo>) => void;
  onLayout: (next: ResolvedLayout) => void;
  onDelete: (id: string) => void;
  scan: ResumeScan;
  /** 문제가 있는 항목으로 바로 이동 — 목록만 보고 사용자가 카드를 찾아다니지 않게. */
  onGoItem: (id: string) => void;
}) {
  const { t, doc, info, layout, selectedId: id } = props;
  const item = id ? doc.items.find((i) => i.id === id) : undefined;
  const at = id ? locate(layout, id) : null;
  const colLen = at ? layout.cols[at.col].length : 0;

  return (
    <aside className="no-print flex w-[340px] shrink-0 flex-col gap-7 overflow-y-auto border-l border-[#E5E8EB] bg-white px-5 py-6" aria-label={t("속성", "Properties", "属性", "Thuộc tính", "プロパティ", "Properti")}>
      {/* 모듈 선택과 무관하게 항상 보인다 — 문서 전체에 거는 작업이다. */}
      <BulkPolishSection t={t} doc={doc} onDoc={props.onDoc} />

      <ResumeCheckSection t={t} doc={doc} scan={props.scan} onGoItem={props.onGoItem} />

      {id ? (
        <>
          <div>
            <span className="inline-flex h-6 items-center rounded-full bg-[#EDF1FD] px-2.5 text-[11.5px] font-bold leading-none text-[#0B46E8]">{moduleKindLabel(t, id, item?.section)}</span>
            <p className="mt-2 text-[18px] font-bold leading-snug tracking-[-0.01em]">{moduleTitle(t, id, doc, info)}</p>
          </div>

          <Section title={t("배치", "Placement", "位置", "Vị trí", "配置", "Penempatan")}>
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

          <ContentEditor {...props} id={id} item={item} />

          {item ? (
            <button type="button" onClick={() => props.onDelete(item.id)} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] text-[13px] font-semibold leading-none text-[#F04452] transition hover:bg-[#FFF0F1]">
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

function ContentEditor(props: Parameters<typeof Inspector>[0] & { id: string; item: ResumeDoc["items"][number] | undefined }) {
  const { t, id, item, doc, info } = props;

  if (id === FIXED_MODULES.basic) {
    return (
      <Section title={t("내용", "Content", "内容", "Nội dung", "内容", "Isi")}>
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
      <Section title={t("링크·포트폴리오", "Links & portfolio", "链接·作品集", "Liên kết & hồ sơ", "リンク・ポートフォリオ", "Tautan & portofolio")}>
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
    <Section title={t("내용", "Content", "内容", "Nội dung", "内容", "Isi")}>
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

/** 문제 1건을 사람이 읽는 한 줄로. 표시 문구는 화면에서 만든다(스캔은 숫자·이름만 준다). */
function resumeIssueText(issue: ResumeScanIssue, t: PlatformT): string {
  switch (issue.kind) {
    case "empty":
      return t("내용이 비어 있어요", "Empty", "内容为空", "Đang để trống", "内容が空です", "Masih kosong");
    case "noNumber":
      return t("성과 수치가 없어요", "No numbers", "缺少量化成果", "Chưa có số liệu", "成果の数値がありません", "Belum ada angka");
    case "noPeriod":
      return t("기간이 없어요", "No dates", "缺少起止时间", "Chưa có thời gian", "期間がありません", "Belum ada periode");
    case "tooShort":
      return `${issue.length}${t("자, 너무 짧아요", " chars, too short", "字，太短", " ký tự, quá ngắn", "字・短すぎます", " krt, terlalu pendek")}`;
    case "spoken":
      return `${t("대화체 문장", "Conversational", "口语化表达", "Văn nói", "話し言葉", "Gaya bicara")} 「${issue.sample}」`;
    case "overlap":
      return `${t("내용 중복", "Overlaps", "内容重复", "Trùng nội dung", "内容の重複", "Tumpang tindih")} 「${issue.withText}」`;
  }
}

/** 전체 점검 — 규칙으로 잡은 '고쳐 볼 만한 곳'을 한 곳에 모으고, 누르면 그 항목으로 간다.
 *  본문의 옅은 표시(EditOverlay flagged)와 같은 결과를 쓴다. */
function ResumeCheckSection({ t, doc, scan, onGoItem }: { t: PlatformT; doc: ResumeDoc; scan: ResumeScan; onGoItem: (id: string) => void }) {
  // 문서 순서대로 — 사용자가 위에서 아래로 훑으며 고칠 수 있게.
  const lines: { id: string; text: string }[] = [];
  for (const it of doc.items) {
    const issues = scan.byItem.get(it.id);
    if (!issues?.length) continue;
    const label = ((it.company ?? "").trim() || (it.text ?? "").trim()).slice(0, 14) || sectionLabelOf(t, it.section);
    for (const issue of issues) lines.push({ id: it.id, text: `${label} — ${resumeIssueText(issue, t)}` });
  }

  return (
    <Section title={`${t("전체 점검", "Full check", "整体检查", "Kiểm tra toàn bộ", "全体チェック", "Cek menyeluruh")}${scan.flaggedCount ? ` · ${scan.flaggedCount}` : ""}`}>
      {lines.length === 0 ? (
        <p className="text-[12px] text-[#00854A]">
          {t("확인할 항목이 없어요.", "Nothing to fix.", "没有待修项。", "Không có gì cần sửa.", "修正点はありません。", "Tidak ada perbaikan.")}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {lines.map((line, i) => (
            <li key={i} className="break-anywhere text-[11.5px] leading-[1.6] text-[#4E5968]">
              <button
                type="button"
                onClick={() => onGoItem(line.id)}
                className="w-full text-left underline-offset-2 transition hover:text-[#0B46E8] hover:underline"
              >
                • {line.text}
              </button>
            </li>
          ))}
        </ul>
      )}
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
function BulkPolishSection({ t, doc, onDoc }: { t: PlatformT; doc: ResumeDoc; onDoc: (patch: Partial<ResumeDoc>) => void }) {
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
        onDoc({ items });
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
