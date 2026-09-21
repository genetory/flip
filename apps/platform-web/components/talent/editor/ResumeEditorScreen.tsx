"use client";

// 모듈형 이력서 에디터(전체 화면) — 경력 한 건·자격증 한 건을 모듈로 두고, 버전(용도)마다
// 칸·순서·포함 여부를 따로 구성한다.
//
// 저장은 두 갈래다.
//   모듈 내용  → talent 문서(saveResumeDoc / saveBasicInfo) — 앱·매칭·기업 화면이 읽는 원본, 모든 버전 공유
//   구성·수정본 → 버전(/members/me/doc-versions) — 이 버전에만 해당
// '이 버전에서만 따로 고치기'를 누른 모듈은 overrides 에 문구를 두고, 원본은 건드리지 않는다.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowDown, ArrowUp, ArrowsLeftRight, EyeSlash, Plus, Star, Trash } from "@phosphor-icons/react";
import { TalentGuard } from "../app/TalentGuard";
import { useToast } from "../../toast/ToastProvider";
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
  type ResumeDoc
} from "../../../lib/talent/resume-doc";
import {
  FIXED_MODULES,
  createDocVersion,
  deleteDocVersion,
  isFixedModule,
  listDocVersions,
  setPrimaryDocVersion,
  updateDocVersion,
  type DocVersion,
  type Overrides,
  type ResumeLayout
} from "../../../lib/talent/doc-versions";
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

type Version = DocVersion<ResumeLayout>;
type SaveState = "idle" | "saving" | "saved" | "error";

// 왼쪽 목록·새 항목 추가에 쓰는 섹션 순서(기존 편집 화면과 같다).
const SECTIONS: CareerSection[] = ["experience", "project", "certificate", "language", "skill", "activity", "award", "education"];
const SAVE_DELAY = 600;

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

  if (status !== "loaded") return <FullMessage text={t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")} />;
  if (!doc) {
    return (
      <FullMessage
        text={t("아직 이력서가 없어요. 먼저 이력서를 만들어 주세요.", "No resume yet. Create one first.", "还没有简历，请先创建。", "Chưa có hồ sơ. Hãy tạo trước.", "まだ履歴書がありません。先に作成してください。", "Belum ada resume. Buat dulu.")}
        action={{ href: "/talent/career/resume", label: t("이력서 만들기", "Create resume", "创建简历", "Tạo hồ sơ", "履歴書を作る", "Buat resume") }}
      />
    );
  }
  return <Editor doc={doc} info={info} />;
}

function FullMessage({ text, action }: { text: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F2F4F6] px-6 text-center">
      <p className="text-[15px] text-[#4E5968]">{text}</p>
      {action ? (
        <Link href={action.href} className="rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[14px] font-bold text-white hover:bg-[#0A3ECB]">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

// ── 에디터 ───────────────────────────────────────────────────

function Editor({ doc, info }: { doc: ResumeDoc; info: BasicInfo }) {
  const t = usePlatformT();
  const toast = useToast();
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(FIXED_MODULES.basic);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hover, setHover] = useState<DropSlot | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<string, Partial<Pick<Version, "name" | "layout" | "overrides">>>>({});

  useEffect(() => {
    let alive = true;
    listDocVersions<ResumeLayout>("resume")
      .then(({ items }) => {
        if (!alive) return;
        setVersions(items);
        setCurrentId((items.find((v) => v.isPrimary) ?? items[0])?.id ?? null);
      })
      .catch(() => alive && toast.error(t("버전을 불러오지 못했어요.", "Couldn't load versions.", "无法加载版本。", "Không tải được phiên bản.", "バージョンを読み込めませんでした。", "Gagal memuat versi.")));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 나가기 전에 남은 저장을 보낸다.
  useEffect(() => {
    const flushAll = () => Object.keys(pending.current).forEach((id) => void flush(id));
    window.addEventListener("beforeunload", flushAll);
    return () => {
      window.removeEventListener("beforeunload", flushAll);
      flushAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flush = useCallback(async (id: string) => {
    const patch = pending.current[id];
    if (!patch) return;
    delete pending.current[id];
    clearTimeout(timers.current[id]);
    setSaveState("saving");
    try {
      await updateDocVersion<ResumeLayout>(id, patch);
      setSaveState(Object.keys(pending.current).length ? "saving" : "saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  /** 이 버전의 변경을 화면에 바로 반영하고, 잠시 뒤 서버에 저장한다. */
  const patchVersion = useCallback(
    (id: string, patch: Partial<Pick<Version, "name" | "layout" | "overrides">>) => {
      setVersions((vs) => vs?.map((v) => (v.id === id ? { ...v, ...patch } : v)) ?? vs);
      pending.current[id] = { ...pending.current[id], ...patch };
      clearTimeout(timers.current[id]);
      setSaveState("saving");
      timers.current[id] = setTimeout(() => void flush(id), SAVE_DELAY);
    },
    [flush]
  );

  const version = versions?.find((v) => v.id === currentId) ?? null;

  // 지금 문서에 맞춘 구성. 대표 버전은 새로 생긴 모듈이 빠지지 않게 자연스러운 자리에 넣어 보여준다.
  const layout: ResolvedLayout | null = useMemo(() => {
    if (!version) return null;
    const resolved = resolveLayout(version.layout, doc);
    return version.isPrimary ? placeAllUnplaced(resolved, doc) : resolved;
  }, [version, doc]);
  const overrides: Overrides = version?.overrides ?? {};

  const commitLayout = (next: ResolvedLayout) => version && patchVersion(version.id, { layout: toStoredLayout(next) });
  const commitOverrides = (next: Overrides) => version && patchVersion(version.id, { overrides: next });

  // ── 드래그 앤 드롭 ──
  const interaction: EditorInteraction | undefined = layout
    ? {
        selectedId,
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

  if (!versions || !version || !layout) {
    return <FullMessage text={t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")} />;
  }

  // ── 버전 ──
  const createVersion = async () => {
    try {
      const n = versions.length + 1;
      const created = await createDocVersion<ResumeLayout>({
        kind: "resume",
        name: t(`새 버전 ${n}`, `New version ${n}`, `新版本 ${n}`, `Phiên bản mới ${n}`, `新しいバージョン ${n}`, `Versi baru ${n}`),
        copyFrom: version.id
      });
      setVersions([...versions, created]);
      setCurrentId(created.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };
  const makePrimary = async () => {
    try {
      await flush(version.id);
      await setPrimaryDocVersion(version.id);
      setVersions(versions.map((v) => ({ ...v, isPrimary: v.id === version.id })));
      toast.success(t("대표 버전으로 정했어요", "Set as primary", "已设为代表版本", "Đã đặt làm bản chính", "代表バージョンにしました", "Dijadikan versi utama"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };
  const removeVersion = async () => {
    if (version.isPrimary) return;
    if (!window.confirm(t("이 버전을 삭제할까요? 모듈 내용은 지워지지 않아요.", "Delete this version? Module content stays.", "删除此版本？模块内容不会被删除。", "Xóa phiên bản này? Nội dung mô-đun vẫn giữ.", "このバージョンを削除しますか？モジュールの内容は残ります。", "Hapus versi ini? Isi modul tetap ada."))) return;
    try {
      delete pending.current[version.id];
      await deleteDocVersion(version.id);
      const rest = versions.filter((v) => v.id !== version.id);
      setVersions(rest);
      setCurrentId((rest.find((v) => v.isPrimary) ?? rest[0])?.id ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  // ── 모듈 내용(모든 버전 공유) ──
  const updateItem = (id: string, patch: Partial<{ text: string; company: string; startDate: string; endDate: string; section: CareerSection }>) =>
    saveResumeDoc({ ...doc, items: doc.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const addItem = (section: CareerSection) => {
    const { doc: next, id } = addResumeItem(doc, section, "");
    saveResumeDoc(next);
    commitLayout(placeModule(layout, next, id));
    setSelectedId(id);
  };
  const deleteItem = (id: string) => {
    if (!window.confirm(t("이 항목을 모든 버전에서 삭제할까요?", "Delete this item from every version?", "要从所有版本中删除此条目吗？", "Xóa mục này khỏi mọi phiên bản?", "この項目をすべてのバージョンから削除しますか？", "Hapus item ini dari semua versi?"))) return;
    saveResumeDoc({ ...doc, items: doc.items.filter((it) => it.id !== id) });
    const nextOv = { ...overrides };
    delete nextOv[id];
    commitOverrides(nextOv);
    setSelectedId(null);
  };

  // ── 이 버전에서만 따로 고치기 ──
  const fork = (id: string) => {
    const item = doc.items.find((i) => i.id === id);
    const base: Record<string, string> =
      id === FIXED_MODULES.summary ? { text: doc.summary ?? "" } : { text: item?.text ?? "", company: item?.company ?? "" };
    commitOverrides({ ...overrides, [id]: base });
  };
  const unfork = (id: string) => {
    const next = { ...overrides };
    delete next[id];
    commitOverrides(next);
  };
  const setOverride = (id: string, field: string, value: string) => commitOverrides({ ...overrides, [id]: { ...overrides[id], [field]: value } });

  const placed = new Set(layout.cols.flat());
  const hiddenSet = new Set(layout.hidden);

  return (
    <div className="flex h-screen flex-col bg-[#EEF0F3] text-[#191F28] print:block print:h-auto print:bg-white">
      <PrintStyles />
      <TopBar
        t={t}
        versions={versions}
        current={version}
        onPick={(id) => {
          setCurrentId(id);
          setSelectedId(FIXED_MODULES.basic);
        }}
        onCreate={createVersion}
        template={layout.template}
        onTemplate={(tpl) => commitLayout(setTemplate(layout, tpl, doc))}
        saveState={saveState}
      />
      <div className="flex min-h-0 flex-1 print:block">
        <ModuleList
          t={t}
          doc={doc}
          placed={placed}
          hidden={hiddenSet}
          unplaced={new Set(layout.unplaced)}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggle={(id) => commitLayout(placed.has(id) ? hideModule(layout, id) : placeModule(layout, doc, id))}
          onAdd={addItem}
        />
        <main className="min-w-0 flex-1 overflow-auto px-8 py-8 print:overflow-visible print:p-0" aria-label={t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}>
          <div className={`mx-auto max-w-[794px] ${PDF_PRINT_AREA}`}>
            <ModularResumePages doc={doc} info={info} layout={layout} overrides={overrides} interaction={interaction} />
          </div>
        </main>
        <Inspector
          t={t}
          doc={doc}
          info={info}
          layout={layout}
          overrides={overrides}
          selectedId={selectedId}
          placed={placed.has(selectedId ?? "")}
          version={version}
          onItem={updateItem}
          onDoc={(patch) => saveResumeDoc({ ...doc, ...patch })}
          onBasic={(patch) => saveBasicInfo({ ...info, ...patch })}
          onOverride={setOverride}
          onFork={fork}
          onUnfork={unfork}
          onLayout={commitLayout}
          onDelete={deleteItem}
          onRename={(name) => patchVersion(version.id, { name })}
          onPrimary={makePrimary}
          onDeleteVersion={removeVersion}
        />
      </div>
    </div>
  );
}

// ── 상단 바 ──────────────────────────────────────────────────

function TopBar({
  t,
  versions,
  current,
  onPick,
  onCreate,
  template,
  onTemplate,
  saveState
}: {
  t: PlatformT;
  versions: Version[];
  current: Version;
  onPick: (id: string) => void;
  onCreate: () => void;
  template: ResumeLayout["template"];
  onTemplate: (tpl: ResumeLayout["template"]) => void;
  saveState: SaveState;
}) {
  const saveLabel =
    saveState === "saving"
      ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…")
      : saveState === "error"
        ? t("저장 실패 — 다시 시도해 주세요", "Save failed — try again", "保存失败，请重试", "Lưu thất bại — thử lại", "保存に失敗しました", "Gagal menyimpan")
        : saveState === "saved"
          ? t("저장됨", "Saved", "已保存", "Đã lưu", "保存済み", "Tersimpan")
          : "";
  return (
    <header className="no-print flex h-16 shrink-0 items-center gap-4 border-b border-[#E5E8EB] bg-white px-5">
      <Link href="/talent/career/resume" aria-label={t("나가기", "Exit", "退出", "Thoát", "終了", "Keluar")} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4E5968] hover:bg-[#F2F4F6]">
        <ArrowLeft size={18} weight="bold" />
      </Link>
      <nav aria-label={t("문서", "Document", "文档", "Tài liệu", "文書", "Dokumen")} className="flex items-center gap-1">
        <span aria-current="page" className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[14px] font-bold text-white">
          {t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}
        </span>
        <span className="rounded-lg px-3 py-1.5 text-[14px] font-semibold text-[#B0B8C1]" title={t("곧 제공돼요", "Coming soon", "即将推出", "Sắp có", "近日公開", "Segera hadir")}>
          {t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}
        </span>
      </nav>
      <div className="mx-2 h-6 w-px bg-[#E5E8EB]" />
      <nav aria-label={t("버전", "Versions", "版本", "Phiên bản", "バージョン", "Versi")} className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
        {versions.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onPick(v.id)}
            aria-pressed={v.id === current.id}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${
              v.id === current.id ? "border-[#0B46E8] bg-[#EDF1FD] text-[#0B46E8]" : "border-[#E5E8EB] bg-white text-[#4E5968] hover:bg-[#F7F8FA]"
            }`}
          >
            {v.name}
            {v.isPrimary ? <span className="rounded bg-[#DDE7FC] px-1.5 text-[11px] font-bold text-[#0B46E8]">{t("대표", "Primary", "代表", "Chính", "代表", "Utama")}</span> : null}
          </button>
        ))}
        <button type="button" onClick={onCreate} className="flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-[#C4CAD2] px-3 py-1.5 text-[13px] font-semibold text-[#4E5968] hover:bg-[#F7F8FA]">
          <Plus size={14} weight="bold" />
          {t("새 버전으로 저장", "Save as new version", "另存为新版本", "Lưu thành phiên bản mới", "新しいバージョンとして保存", "Simpan sebagai versi baru")}
        </button>
      </nav>
      <div className="flex-1" />
      <div role="group" aria-label={t("템플릿", "Template", "模板", "Mẫu", "テンプレート", "Templat")} className="flex rounded-lg bg-[#F2F4F6] p-[3px]">
        {(["two", "one"] as const).map((tpl) => (
          <button
            key={tpl}
            type="button"
            onClick={() => onTemplate(tpl)}
            aria-pressed={template === tpl}
            className={`rounded-md px-3 py-1 text-[12px] font-semibold ${template === tpl ? "bg-white text-[#191F28] shadow-sm" : "text-[#6B7684]"}`}
          >
            {tpl === "two" ? t("2단", "2 columns", "双栏", "2 cột", "2段", "2 kolom") : t("1단", "1 column", "单栏", "1 cột", "1段", "1 kolom")}
          </button>
        ))}
      </div>
      <span className="w-[120px] text-right text-[12px] text-[#8B95A1]" aria-live="polite">
        {saveLabel}
      </span>
      <PdfDownloadButton />
    </header>
  );
}

// ── 왼쪽: 모듈 목록 ──────────────────────────────────────────

function ModuleList({
  t,
  doc,
  placed,
  hidden,
  unplaced,
  selectedId,
  onSelect,
  onToggle,
  onAdd
}: {
  t: PlatformT;
  doc: ResumeDoc;
  placed: Set<string>;
  hidden: Set<string>;
  unplaced: Set<string>;
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
    const isUnplaced = unplaced.has(id);
    return (
      <li key={id} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${selectedId === id ? "bg-[#EDF1FD]" : ""}`}>
        <button
          type="button"
          onClick={() => onToggle(id)}
          aria-pressed={on}
          aria-label={on ? t(`이 버전에서 빼기: ${label}`, `Remove from this version: ${label}`) : t(`이 버전에 넣기: ${label}`, `Add to this version: ${label}`)}
          className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] ${on ? "bg-[#0B46E8]" : "border-[1.5px] border-[#C4CAD2] bg-white"}`}
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
          className={`min-w-0 flex-1 truncate text-left text-[13px] ${on ? "font-medium text-[#191F28]" : hidden.has(id) ? "text-[#8B95A1] line-through" : "text-[#8B95A1]"}`}
        >
          {label}
        </button>
        {isUnplaced ? <span className="shrink-0 rounded bg-[#FFF6E5] px-1.5 text-[10px] font-bold text-[#B25E09]">{t("새 항목", "New", "新", "Mới", "新規", "Baru")}</span> : null}
      </li>
    );
  };
  return (
    <aside className="no-print flex w-[288px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-[#E5E8EB] bg-white px-4 py-5" aria-label={t("모듈", "Modules", "模块", "Mô-đun", "モジュール", "Modul")}>
      <div className="px-2">
        <p className="text-[15px] font-bold">{t("모듈", "Modules", "模块", "Mô-đun", "モジュール", "Modul")}</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#6B7684]">
          {t(
            "항목 하나하나가 모듈이에요. 체크를 끄면 이 버전에서만 빠지고, 페이지에서 끌어 옮길 수 있어요.",
            "Each item is a module. Uncheck to leave it out of this version only; drag it on the page to move.",
            "每个条目都是一个模块。取消勾选只会在此版本中移除，可在页面上拖动。",
            "Mỗi mục là một mô-đun. Bỏ chọn để chỉ loại khỏi phiên bản này; kéo trên trang để di chuyển.",
            "各項目がモジュールです。チェックを外すとこのバージョンだけから外れ、ページ上でドラッグして移動できます。",
            "Setiap item adalah modul. Hapus centang untuk mengeluarkan dari versi ini saja; seret di halaman untuk memindah."
          )}
        </p>
      </div>
      <ul className="flex flex-col gap-0.5">{fixed.map((f) => row(f.id, f.label))}</ul>
      {SECTIONS.map((section) => {
        const items = doc.items.filter((i) => i.section === section);
        return (
          <div key={section}>
            <div className="flex items-center justify-between px-2 pb-1">
              <span className="text-[12px] font-semibold text-[#6B7684]">{sectionLabelOf(t, section)}</span>
              <button type="button" onClick={() => onAdd(section)} aria-label={t(`${sectionLabelOf(t, section)} 추가`, `Add ${sectionLabelOf(t, section)}`)} className="flex h-6 w-6 items-center justify-center rounded-md text-[#8B95A1] hover:bg-[#F2F4F6] hover:text-[#0B46E8]">
                <Plus size={13} weight="bold" />
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
  overrides: Overrides;
  selectedId: string | null;
  placed: boolean;
  version: Version;
  onItem: (id: string, patch: Partial<{ text: string; company: string; startDate: string; endDate: string; section: CareerSection }>) => void;
  onDoc: (patch: Partial<ResumeDoc>) => void;
  onBasic: (patch: Partial<BasicInfo>) => void;
  onOverride: (id: string, field: string, value: string) => void;
  onFork: (id: string) => void;
  onUnfork: (id: string) => void;
  onLayout: (next: ResolvedLayout) => void;
  onDelete: (id: string) => void;
  onRename: (name: string) => void;
  onPrimary: () => void;
  onDeleteVersion: () => void;
}) {
  const { t, doc, info, layout, overrides, selectedId: id, version } = props;
  const item = id ? doc.items.find((i) => i.id === id) : undefined;
  const at = id ? locate(layout, id) : null;
  const colLen = at ? layout.cols[at.col].length : 0;

  return (
    <aside className="no-print flex w-[336px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-[#E5E8EB] bg-white p-5" aria-label={t("속성", "Properties", "属性", "Thuộc tính", "プロパティ", "Properti")}>
      {id ? (
        <>
          <div>
            <p className="text-[12px] font-semibold text-[#0B46E8]">{moduleKindLabel(t, id, item?.section)}</p>
            <p className="mt-1 text-[17px] font-bold">{moduleTitle(t, id, doc, info)}</p>
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
                <ToolButton icon={<EyeSlash size={14} weight="bold" />} label={t("이 버전에서 빼기", "Remove here", "从此版本移除", "Bỏ khỏi bản này", "このバージョンから外す", "Keluarkan di sini")} onClick={() => id && props.onLayout(hideModule(layout, id))} />
              </div>
            ) : (
              <button type="button" onClick={() => id && props.onLayout(placeModule(layout, doc, id))} className="h-10 w-full rounded-lg bg-[#0B46E8] text-[13px] font-bold text-white hover:bg-[#0A3ECB]">
                {t("이 버전에 넣기", "Add to this version", "加入此版本", "Thêm vào bản này", "このバージョンに入れる", "Tambahkan ke versi ini")}
              </button>
            )}
            <p className="text-[12px] leading-relaxed text-[#6B7684]">
              {t("배치와 포함 여부는 버전마다 따로 저장돼요.", "Placement is saved per version.", "位置按版本分别保存。", "Vị trí được lưu theo từng phiên bản.", "配置はバージョンごとに保存されます。", "Penempatan disimpan per versi.")}
            </p>
          </Section>

          <ContentEditor {...props} id={id} item={item} />

          {item ? (
            <button type="button" onClick={() => props.onDelete(item.id)} className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#F04452] hover:underline">
              <Trash size={14} weight="bold" />
              {t("항목 삭제(모든 버전)", "Delete item (all versions)", "删除条目（所有版本）", "Xóa mục (mọi phiên bản)", "項目を削除（全バージョン）", "Hapus item (semua versi)")}
            </button>
          ) : null}
        </>
      ) : (
        <p className="text-[13px] text-[#6B7684]">{t("페이지나 왼쪽 목록에서 모듈을 골라 주세요.", "Pick a module on the page or in the list.", "请在页面或列表中选择模块。", "Chọn một mô-đun trên trang hoặc danh sách.", "ページかリストからモジュールを選んでください。", "Pilih modul di halaman atau daftar.")}</p>
      )}

      <Section title={t("이 버전", "This version", "此版本", "Phiên bản này", "このバージョン", "Versi ini")} divider>
        <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#6B7684]">
          {t("이름", "Name", "名称", "Tên", "名前", "Nama")}
          <input
            key={version.id}
            defaultValue={version.name}
            maxLength={60}
            onChange={(e) => e.target.value.trim() && props.onRename(e.target.value.trim())}
            className="h-10 rounded-lg border border-[#E5E8EB] bg-[#F7F8FA] px-3 text-[14px] text-[#191F28] outline-none focus:border-[#0B46E8]"
          />
        </label>
        {version.isPrimary ? (
          <p className="rounded-lg bg-[#EDF1FD] px-3 py-2.5 text-[12px] leading-relaxed text-[#0B46E8]">
            {t("대표 버전이에요. 인재 검색과 추천에 이 구성이 쓰여요.", "This is your primary version, used for talent search.", "这是代表版本，用于人才搜索与推荐。", "Đây là bản chính, dùng cho tìm kiếm nhân tài.", "代表バージョンです。人材検索と推薦に使われます。", "Ini versi utama, dipakai untuk pencarian talenta.")}
          </p>
        ) : (
          <div className="flex gap-2">
            <button type="button" onClick={props.onPrimary} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0B46E8] text-[13px] font-bold text-white hover:bg-[#0A3ECB]">
              <Star size={14} weight="fill" />
              {t("대표로 지정", "Make primary", "设为代表", "Đặt làm chính", "代表に指定", "Jadikan utama")}
            </button>
            <button type="button" onClick={props.onDeleteVersion} aria-label={t("버전 삭제", "Delete version", "删除版本", "Xóa phiên bản", "バージョン削除", "Hapus versi")} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E8EB] text-[#8B95A1] hover:text-[#F04452]">
              <Trash size={15} weight="bold" />
            </button>
          </div>
        )}
      </Section>
    </aside>
  );
}

function ContentEditor(props: Parameters<typeof Inspector>[0] & { id: string; item: ResumeDoc["items"][number] | undefined }) {
  const { t, id, item, doc, info, overrides } = props;
  const forked = !!overrides[id];

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
    return (
      <Section title={t("내용", "Content", "内容", "Nội dung", "内容", "Isi")}>
        <p className="text-[12px] leading-relaxed text-[#6B7684]">
          {t("링크는 기존 이력서 화면에서 고칠 수 있어요.", "Edit links on the resume page.", "请在简历页面编辑链接。", "Sửa liên kết ở trang hồ sơ.", "リンクは履歴書画面で編集できます。", "Ubah tautan di halaman resume.")}{" "}
          <Link href="/talent/career/resume" className="font-semibold text-[#0B46E8] underline">
            {t("이력서 화면으로", "Go to resume", "前往简历", "Đến hồ sơ", "履歴書へ", "Ke resume")}
          </Link>
        </p>
      </Section>
    );
  }

  const isSummary = id === FIXED_MODULES.summary;
  const text = forked ? overrides[id].text ?? "" : isSummary ? doc.summary ?? "" : item?.text ?? "";
  const company = forked ? overrides[id].company ?? "" : item?.company ?? "";
  const setText = (v: string) => (forked ? props.onOverride(id, "text", v) : isSummary ? props.onDoc({ summary: v }) : props.onItem(id, { text: v }));
  const setCompany = (v: string) => (forked ? props.onOverride(id, "company", v) : props.onItem(id, { company: v }));

  return (
    <Section title={t("내용", "Content", "内容", "Nội dung", "内容", "Isi")}>
      {forked ? (
        <div className="flex items-start justify-between gap-2 rounded-lg bg-[#FFF6E5] px-3 py-2.5 text-[12px] leading-relaxed text-[#B25E09]">
          <span>{t("이 버전에서만 쓰는 문구예요. 원본과 다른 버전에는 영향이 없어요.", "Wording for this version only; the original and other versions are unaffected.", "此文字仅用于此版本，不影响原文和其他版本。", "Văn bản chỉ cho bản này; bản gốc và bản khác không đổi.", "このバージョン専用の文言です。原本や他のバージョンには影響しません。", "Teks khusus versi ini; asli dan versi lain tidak berubah.")}</span>
          <button type="button" onClick={() => props.onUnfork(id)} className="shrink-0 font-bold underline">
            {t("원래대로", "Revert", "恢复原文", "Khôi phục", "元に戻す", "Kembalikan")}
          </button>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 rounded-lg bg-[#F7F8FA] px-3 py-2.5 text-[12px] leading-relaxed text-[#6B7684]">
          <span>{t("모든 버전에 함께 반영돼요.", "Changes apply to every version.", "修改会同步到所有版本。", "Thay đổi áp dụng cho mọi phiên bản.", "すべてのバージョンに反映されます。", "Berlaku di semua versi.")}</span>
          <button type="button" onClick={() => props.onFork(id)} className="shrink-0 font-bold text-[#0B46E8] underline">
            {t("이 버전에서만 따로 고치기", "Edit for this version only", "仅在此版本修改", "Chỉ sửa ở bản này", "このバージョンだけ編集", "Ubah khusus versi ini")}
          </button>
        </div>
      )}
      {item ? (
        <>
          <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#6B7684]">
            {t("섹션", "Section", "分区", "Mục", "セクション", "Bagian")}
            <select
              value={item.section}
              onChange={(e) => props.onItem(item.id, { section: e.target.value as CareerSection })}
              className="h-10 rounded-lg border border-[#E5E8EB] bg-[#F7F8FA] px-3 text-[14px] text-[#191F28] outline-none focus:border-[#0B46E8]"
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

function Section({ title, children, divider }: { title: string; children: React.ReactNode; divider?: boolean }) {
  return (
    <section className={`flex flex-col gap-2.5 ${divider ? "border-t border-[#F2F4F6] pt-5" : ""}`}>
      <h3 className="text-[13px] font-bold">{title}</h3>
      {children}
    </section>
  );
}

function ToolButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#E5E8EB] bg-white px-2 text-[12.5px] font-semibold text-[#191F28] hover:bg-[#F7F8FA] disabled:cursor-default disabled:text-[#C4CAD2] disabled:hover:bg-white"
    >
      {icon}
      <span className="truncate">{label}</span>
    </button>
  );
}

/**
 * 입력칸. onChange 는 칠 때마다(내용 저장은 talent 저장소가 debounce 한다),
 * onBlurValue 는 포커스를 벗어날 때 한 번(날짜처럼 입력 중엔 정규화하면 안 되는 값).
 */
function Field({
  label,
  value,
  onChange,
  onBlurValue,
  multiline,
  placeholder
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onBlurValue?: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const common = {
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(e.target.value);
      onChange?.(e.target.value);
    },
    onBlur: () => onBlurValue?.(draft),
    className: "rounded-lg border border-[#E5E8EB] bg-[#F7F8FA] px-3 text-[14px] text-[#191F28] outline-none focus:border-[#0B46E8]"
  };
  return (
    <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#6B7684]">
      {label}
      {multiline ? <textarea {...common} rows={6} className={`${common.className} resize-y py-2.5 leading-relaxed`} /> : <input {...common} className={`${common.className} h-10`} />}
    </label>
  );
}

function SharedNote({ t }: { t: PlatformT }) {
  return (
    <p className="text-[12px] leading-relaxed text-[#6B7684]">
      {t("기본 정보는 모든 버전에 함께 쓰여요.", "Basic info is shared by every version.", "基本信息在所有版本中共享。", "Thông tin cơ bản dùng chung cho mọi bản.", "基本情報はすべてのバージョンで共通です。", "Info dasar dipakai bersama semua versi.")}
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
