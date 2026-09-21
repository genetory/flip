"use client";

// 모듈형 이력서 에디터(전체 화면) — 경력 한 건·자격증 한 건을 모듈로 두고, 버전(용도)마다
// 칸·순서·포함 여부를 따로 구성한다.
//
// 저장은 두 갈래다.
//   모듈 내용  → talent 문서(saveResumeDoc / saveBasicInfo) — 앱·매칭·기업 화면이 읽는 원본, 모든 버전 공유
//   구성·수정본 → 버전(/members/me/doc-versions) — 이 버전에만 해당
// '이 버전에서만 따로 고치기'를 누른 모듈은 overrides 에 문구를 두고, 원본은 건드리지 않는다.
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowsLeftRight, EyeSlash, Plus, Trash } from "@phosphor-icons/react";
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
  type ResumeDoc
} from "../../../lib/talent/resume-doc";
import {
  FIXED_MODULES,
  isFixedModule,
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
import { EditorTopBar, Field, ForkBanner, FullMessage, Section, ToolButton, VersionPanel, useDocVersionStore } from "./editor-shared";

type Version = DocVersion<ResumeLayout>;

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

// ── 에디터 ───────────────────────────────────────────────────

function Editor({ doc, info }: { doc: ResumeDoc; info: BasicInfo }) {
  const t = usePlatformT();
  const store = useDocVersionStore<ResumeLayout>("resume", t);
  const { versions, current: version, patchVersion } = store;
  const [selectedId, setSelectedId] = useState<string | null>(FIXED_MODULES.basic);
  const [dragId, setDragId] = useState<string | null>(null);
  const [hover, setHover] = useState<DropSlot | null>(null);

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
      <EditorTopBar
        t={t}
        active="resume"
        exitHref="/talent/career/resume"
        versions={versions}
        current={version}
        onPick={(id) => {
          store.setCurrentId(id);
          setSelectedId(FIXED_MODULES.basic);
        }}
        onCreate={store.createVersion}
        saveState={store.saveState}
        right={
          <>
            <TemplateSwitch t={t} template={layout.template} onTemplate={(tpl) => commitLayout(setTemplate(layout, tpl, doc))} />
            <PdfDownloadButton />
          </>
        }
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
          onPrimary={store.makePrimary}
          onDeleteVersion={store.removeVersion}
        />
      </div>
    </div>
  );
}

// ── 상단 바: 템플릿 ──────────────────────────────────────────

function TemplateSwitch({ t, template, onTemplate }: { t: PlatformT; template: ResumeLayout["template"]; onTemplate: (tpl: ResumeLayout["template"]) => void }) {
  return (

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

      <VersionPanel
        t={t}
        version={version}
        primaryNote={t("대표 버전이에요. 인재 검색과 추천에 이 구성이 쓰여요.", "This is your primary version, used for talent search.", "这是代表版本，用于人才搜索与推荐。", "Đây là bản chính, dùng cho tìm kiếm nhân tài.", "代表バージョンです。人材検索と推薦に使われます。", "Ini versi utama, dipakai untuk pencarian talenta.")}
        onRename={props.onRename}
        onPrimary={props.onPrimary}
        onDelete={props.onDeleteVersion}
      />
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
      <ForkBanner t={t} forked={forked} onFork={() => props.onFork(id)} onUnfork={() => props.onUnfork(id)} />
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
