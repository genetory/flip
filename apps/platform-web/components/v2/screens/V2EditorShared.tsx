"use client";

// v2 이력서·자기소개서 편집기 공통 조각 — 기존 editor-shared 와 **같은 props·동작**을 v2 모양으로.
// 편집기 구조(상단 바·왼쪽 목록·가운데 A4·오른쪽 패널)는 기존 편집기 그대로 두고 모양만 바꾼다.
// 저장·계측·시트 잠금 같은 동작(훅)은 기존 것을 그대로 다시 내보낸다 — 두 벌로 갈라지지 않게.
import Link from "next/link";
import { isLaunchEditor } from "../../../lib/launch-editor-context";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, CheckCircle, CircleNotch, DownloadSimple, FloppyDisk, LockSimple, Trash, WarningCircle } from "@phosphor-icons/react";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { trackEditor } from "../../../lib/analytics";
import type { DocVersion } from "../../../lib/talent/doc-versions";
import type { SaveState } from "../../talent/editor/editor-shared";
import { PointsChip } from "../ai-points";

// 동작(훅·계산)은 기존 그대로.
export {
  sheetStyle,
  useAiReview,
  useDocVersionStore,
  useDropEmptyItems,
  useEditorOpenedMetric,
  useFirstContentMetric,
  useHiddenIssues,
  useRevealOnChange,
  useSheetScrollLock,
  type SaveState
} from "../../talent/editor/editor-shared";

// ── v2 모양 ────────────────────────────────────────────────

/** 입력칸: 연회색 채움, 포커스 땐 흰 바탕 + 파란 링. 글자 크기는 터치 기기에서 globals.css 가 16px 로 올린다. */
export const INPUT_CLS =
  "rounded-2xl bg-[color:var(--v2-fill)] px-3.5 text-[15px] text-[color:var(--v2-ink)] outline-none ring-[color:var(--v2-accent)] transition placeholder:text-[color:var(--v2-faint)] focus:bg-white focus:ring-2";
/** 회색 버튼(neutral). */
export const SOFT_BTN =
  "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-line)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";
/** 연파랑 버튼(secondary) — **색상만**. 글자 크기·굵기·모서리는 쓰는 쪽에서 붙인다. */
export const TINT_BTN =
  "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)] transition hover:opacity-80 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

/** 모바일에서만 시트로 띄운다. lg 이상에서는 옆 패널로 되돌린다(기존과 같은 위치 규칙). */
export const SHEET_CLS =
  "fixed inset-x-0 bottom-0 z-40 h-[90vh] max-h-[90vh] overscroll-contain rounded-t-3xl shadow-[0_-10px_30px_-12px_rgba(11,18,39,0.28)] " +
  "lg:static lg:z-auto lg:h-auto lg:max-h-none lg:rounded-none lg:shadow-none";

export const EDITOR_ROUTES = {
  resume: "/talent/career/resume/editor",
  cover: "/talent/career/cover/editor"
} as const;

export function FullMessage({ text, action }: { text: string; action?: { href: string; label: string } }) {
  return (
    <div className="v2 flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-[16px] text-[color:var(--v2-ink-3)]">{text}</p>
      {action ? (
        <Link href={action.href} className="inline-flex h-12 items-center justify-center rounded-xl bg-[color:var(--v2-accent)] px-5 text-[16px] font-semibold text-white transition hover:opacity-90">
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

/** PDF 다운받기 — 기존 버튼과 같은 동작(계측 + 브라우저 인쇄), v2 주 버튼 모양. */
export function PdfDownloadButton() {
  const t = usePlatformT();
  return (
    <button
      type="button"
      onClick={() => {
        trackEditor("editor_pdf_download", { source: window.location.pathname.endsWith("/preview") ? "preview" : "editor" });
        window.print();
      }}
      className="no-print inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[color:var(--v2-accent)] px-4 text-[14px] font-semibold leading-none text-white transition hover:opacity-90 active:scale-[0.98]"
    >
      <DownloadSimple className="h-4 w-4 shrink-0" weight="bold" />
      <span>{t("PDF 다운받기", "Download PDF", "下载 PDF", "Tải PDF", "PDFダウンロード", "Unduh PDF")}</span>
    </button>
  );
}

export function EditorTopBar<L, S>({
  t,
  active,
  exitHref,
  working,
  saved,
  current,
  onPick,
  onSaveNew,
  saveState,
  right
}: {
  t: PlatformT;
  active: "resume" | "cover";
  exitHref: string;
  working: DocVersion<L, S>;
  saved: DocVersion<L, S>[];
  current: DocVersion<L, S>;
  onPick: (id: string) => void;
  onSaveNew: (name: string) => Promise<boolean>;
  saveState: SaveState;
  right?: ReactNode;
}) {
  const saveLabel =
    saveState === "saving"
      ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…")
      : saveState === "error"
        ? t("저장 실패 · 다시 시도해 주세요", "Save failed · try again", "保存失败，请重试", "Lưu thất bại · thử lại", "保存に失敗しました", "Gagal menyimpan")
        : saveState === "saved"
          ? t("자동 저장됨", "Auto-saved", "已自动保存", "Đã tự lưu", "自動保存済み", "Tersimpan otomatis")
          : "";
  // 문서 전환 — v2 상단 메뉴와 같은 글자 탭(고른 쪽은 굵은 먹색).
  const tab = (key: "resume" | "cover", label: string) =>
    key === active ? (
      <span aria-current="page" className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg bg-white px-3 text-[14px] font-bold leading-none text-[color:var(--v2-ink)] lg:px-3.5 lg:text-[15px]">
        {label}
      </span>
    ) : (
      <Link href={EDITOR_ROUTES[key]} className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[14px] font-semibold leading-none text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-ink-3)] lg:px-3.5 lg:text-[15px]">
        {label}
      </Link>
    );
  // 버전 칩 — v2 칩(고르면 먹색).
  const chip = (v: DocVersion<L, S>, label: ReactNode) => (
    <button
      key={v.id}
      type="button"
      onClick={() => onPick(v.id)}
      aria-pressed={v.id === current.id}
      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold leading-none transition ${
        v.id === current.id ? "bg-[color:var(--v2-ink)] text-white" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)] hover:bg-[color:var(--v2-line)]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <header className="no-print flex h-16 shrink-0 items-center gap-2 overflow-x-auto border-b border-[color:var(--v2-band)] bg-white px-3 lg:h-[72px] lg:gap-4 lg:overflow-visible lg:px-5">
      <Link
        href={exitHref}
        onClick={(e) => {
          // 커리어런치 결과물에서 연 에디터면 결과물로 돌아간다(새로 불러와 고친 내용이 보이게)
          if (isLaunchEditor()) {
            e.preventDefault();
            window.location.href = "/career-launch/deliverables";
          }
        }}
        aria-label={t("나가기", "Exit", "退出", "Thoát", "終了", "Keluar")}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-band)]">
        <ArrowLeft size={20} weight="bold" />
      </Link>
      <nav aria-label={t("문서", "Document", "文档", "Tài liệu", "文書", "Dokumen")} className="flex shrink-0 items-center rounded-xl bg-[color:var(--v2-band)] p-1">
        {tab("resume", t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume"))}
        {tab("cover", t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran"))}
      </nav>
      {/* 모바일은 상단 바가 옆으로 넘어가므로 문서 탭 바로 옆(첫 화면에 보이게) */}
      <span className="shrink-0 lg:hidden">
        <PointsChip />
      </span>
      <div className="mx-1 h-6 w-px shrink-0 bg-[color:var(--v2-band)]" />
      <nav aria-label={t("버전", "Versions", "版本", "Phiên bản", "バージョン", "Versi")} className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
        {chip(working, t("편집 중", "Editing", "编辑中", "Đang sửa", "編集中", "Sedang diedit"))}
        {saved.map((v) =>
          chip(
            v,
            <>
              <LockSimple size={13} weight="bold" aria-hidden className="shrink-0" />
              {v.name}
            </>
          )
        )}
      </nav>
      <SaveNewButton t={t} onSave={onSaveNew} disabled={current.snapshot !== null} />
      {/* 자동 저장 상태 — 자리를 미리 잡아 두어 글자가 바뀌어도 옆 버튼이 흔들리지 않게 */}
      <span className={`flex w-[150px] shrink-0 items-center gap-1 text-[13px] font-medium ${saveState === "error" ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-faint)]"}`} aria-live="polite">
        {current.snapshot === null && saveLabel ? (
          <>
            {saveState === "saved" ? (
              <CheckCircle size={15} weight="fill" className="text-[color:var(--v2-good)]" />
            ) : saveState === "error" ? (
              <WarningCircle size={15} weight="fill" />
            ) : (
              <CircleNotch size={14} weight="bold" className="animate-spin" />
            )}
            {saveLabel}
          </>
        ) : null}
      </span>
      <div className="flex-1" />
      {/* AI 포인트 잔액 — 셸이 없는 전체 화면이라 여기에도(포인트가 켜져 있을 때만). PC 는 오른쪽 끝 */}
      <span className="hidden shrink-0 lg:block">
        <PointsChip />
      </span>
      {right}
    </header>
  );
}

/** [새 버전으로 저장] — 누르면 이름을 받는 작은 칸이 열린다. */
function SaveNewButton({ t, onSave, disabled }: { t: PlatformT; onSave: (name: string) => Promise<boolean>; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const defaultName = () => {
    const d = new Date();
    return t(`${d.getMonth() + 1}월 ${d.getDate()}일 저장본`, `Saved ${d.getMonth() + 1}/${d.getDate()}`, `${d.getMonth() + 1}月${d.getDate()}日保存`, `Bản lưu ${d.getDate()}/${d.getMonth() + 1}`, `${d.getMonth() + 1}月${d.getDate()}日の保存版`, `Simpanan ${d.getDate()}/${d.getMonth() + 1}`);
  };
  useEffect(() => {
    if (open) inputRef.current?.select();
  }, [open]);
  const submit = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    const ok = await onSave(n);
    setBusy(false);
    if (ok) setOpen(false);
  };
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setName(defaultName());
          setOpen((v) => !v);
        }}
        title={disabled ? t("편집 중인 문서에서 저장할 수 있어요", "Switch to the editing document to save", "请在编辑中的文档保存", "Hãy lưu từ tài liệu đang sửa", "編集中の文書から保存できます", "Simpan dari dokumen yang sedang diedit") : undefined}
        className={`flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[14px] font-semibold leading-none ${TINT_BTN}`}
      >
        <FloppyDisk size={15} weight="bold" className="shrink-0" />
        <span>{t("새 버전으로 저장", "Save as new version", "另存为新版本", "Lưu thành phiên bản mới", "新しいバージョンとして保存", "Simpan sebagai versi baru")}</span>
      </button>
      {open ? (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="absolute left-0 top-[calc(100%+8px)] z-20 flex w-[320px] flex-col gap-3.5 rounded-3xl bg-white p-5 shadow-[0_12px_32px_rgba(11,18,39,0.16)]"
          >
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[color:var(--v2-ink-3)]">
              {t("저장본 이름", "Name", "名称", "Tên", "名前", "Nama")}
              <input
                ref={inputRef}
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("예: OO전자 지원용", "e.g. For Company A", "例：投递 A 公司", "VD: Nộp công ty A", "例：A社応募用", "mis. Untuk Perusahaan A")}
                className={`h-12 ${INPUT_CLS}`}
              />
            </label>
            <p className="text-[13px] leading-[1.6] text-[color:var(--v2-muted)]">
              {t("지금 모습 그대로 저장돼요. 저장본은 고칠 수 없고, 지원할 때 골라 쓸 수 있어요.", "Saved exactly as it looks now. Saved versions can't be edited and can be picked when applying.", "按当前样子保存。保存版本不可修改，投递时可选用。", "Lưu đúng như hiện tại. Bản đã lưu không sửa được và có thể chọn khi ứng tuyển.", "今の状態のまま保存されます。保存版は編集できず、応募時に選べます。", "Disimpan persis seperti sekarang. Tidak bisa diubah dan bisa dipilih saat melamar.")}
            </p>
            <button type="submit" disabled={!name.trim() || busy} className="h-12 rounded-xl bg-[color:var(--v2-accent)] text-[16px] font-semibold text-white transition hover:opacity-90 disabled:opacity-40">
              {busy ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}

/** 저장본 보기일 때 오른쪽 패널 — 이름·저장 시각·삭제. 내용은 고칠 수 없다. */
export function SavedPanel<L, S>({
  t,
  version,
  children,
  onRename,
  onDelete
}: {
  t: PlatformT;
  version: DocVersion<L, S>;
  children?: ReactNode;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const saved = new Date(version.createdAt);
  return (
    <aside className="no-print flex w-[336px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-[color:var(--v2-band)] bg-white p-5 [&>*]:shrink-0" aria-label={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
      <Section title={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[color:var(--v2-ink-3)]">
          {t("이름", "Name", "名称", "Tên", "名前", "Nama")}
          <input
            key={version.id}
            defaultValue={version.name}
            maxLength={60}
            onChange={(e) => e.target.value.trim() && onRename(e.target.value.trim())}
            className={`h-11 ${INPUT_CLS}`}
          />
        </label>
        <p className="text-[13px] text-[color:var(--v2-muted)]">
          {t("저장한 때", "Saved", "保存时间", "Đã lưu lúc", "保存日時", "Disimpan")} · {saved.toLocaleString()}
        </p>
        <p className="flex items-start gap-1.5 rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3.5 text-[13px] leading-[1.6] text-[color:var(--v2-muted)]">
          <LockSimple size={14} weight="bold" className="mt-[3px] shrink-0" />
          {t(
            "저장한 순간 그대로 보관돼요. 고칠 수 없고, 지원할 때 이 저장본을 골라 쓸 수 있어요. 고치려면 '편집 중'에서 수정한 뒤 새 버전으로 저장해 주세요.",
            "Kept exactly as saved. It can't be edited, and you can pick it when applying. To change it, edit under 'Editing' and save a new version.",
            "按保存时原样保留，不可修改，投递时可选用。如需修改，请在「编辑中」修改后另存为新版本。",
            "Giữ nguyên như lúc lưu, không sửa được và có thể chọn khi ứng tuyển. Muốn đổi, hãy sửa ở 'Đang sửa' rồi lưu phiên bản mới.",
            "保存時のまま保管され、編集できません。応募時に選べます。変更するには「編集中」で修正して新しいバージョンとして保存してください。",
            "Disimpan persis seperti saat disimpan, tidak bisa diubah, dan bisa dipilih saat melamar. Untuk mengubah, edit di 'Sedang diedit' lalu simpan versi baru."
          )}
        </p>
        {children}
        <button type="button" onClick={onDelete} className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl text-[14px] font-semibold leading-none text-[color:var(--v2-attention)] transition hover:bg-[#FFF0F1]">
          <Trash size={16} weight="bold" className="shrink-0" />
          <span>{t("저장본 삭제", "Delete saved version", "删除保存版本", "Xóa bản đã lưu", "保存版を削除", "Hapus versi tersimpan")}</span>
        </button>
      </Section>
    </aside>
  );
}

/** 좁은 화면에서 '큰 화면이 더 편하다' 고 한 번 알려 주는 알림. 닫으면 다시 뜨지 않는다(기존과 같은 저장 키). */
export function DesktopHintToast({ t, hidden }: { t: PlatformT; hidden?: boolean }) {
  const KEY = "aply.editor.desktopHint.v1";
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 저장소는 마운트 뒤에만 읽을 수 있다(기존과 같은 1회 로드).
      if (window.localStorage.getItem(KEY) !== "off") setShow(true);
    } catch {
      setShow(true);
    }
  }, []);
  if (!show || hidden) return null;
  const close = () => {
    setShow(false);
    try {
      window.localStorage.setItem(KEY, "off");
    } catch {
      // 저장이 막혀 있어도 이번 화면에서는 닫힌다.
    }
  };
  return (
    <div className="no-print sticky top-0 z-20 mb-3 flex justify-center lg:hidden">
      <div role="status" className="flex w-full max-w-[794px] items-start gap-2 rounded-2xl bg-[color:var(--v2-ink)] px-4 py-3.5 text-white shadow-[0_8px_24px_-8px_rgba(11,18,39,0.45)]">
        <p className="min-w-0 flex-1 break-keep text-[13.5px] font-medium leading-[1.55]">
          {t(
            "여기서도 고칠 수 있지만, 이력서·자기소개서는 PC 에서 작업하는 걸 권해요. 문서 전체를 보면서 고칠 수 있어요.",
            "You can edit here, but a desktop is easier for resumes and cover letters — you can see the whole page while you work.",
            "这里也能修改，但简历和自我介绍建议在电脑上编辑，可以边看整页边改。",
            "Bạn vẫn sửa được ở đây, nhưng nên dùng máy tính cho hồ sơ và thư giới thiệu — xem được cả trang khi sửa.",
            "ここでも編集できますが、履歴書・自己紹介書はPCでの作業をおすすめします。ページ全体を見ながら直せます。",
            "Bisa diedit di sini, tapi resume dan surat lamaran lebih mudah di PC — seluruh halaman terlihat saat mengubah."
          )}
        </p>
        <button type="button" onClick={close} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="-mr-1 -mt-0.5 shrink-0 rounded px-2 py-1 text-[16px] leading-none text-white/70 transition hover:text-white">
          ×
        </button>
      </div>
    </div>
  );
}

/** 패널 한 블록 — v2 는 제목을 더 크고 굵게. shrink-0 인 이유는 기존과 같다(스크롤 열에서 버튼 높이가 눌리지 않게). */
export function Section({ title, children, divider, className }: { title: string; children: ReactNode; divider?: boolean; className?: string }) {
  return (
    <section className={`flex shrink-0 flex-col gap-3 ${divider ? "border-t border-[color:var(--v2-band)] pt-6" : ""} ${className ?? ""}`}>
      <h3 className="text-[17px] font-bold tracking-[-0.01em] text-[color:var(--v2-ink)]">{title}</h3>
      {children}
    </section>
  );
}

export function ToolButton({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-xl px-2 text-[14px] font-semibold ${SOFT_BTN}`}>
      <span className="flex shrink-0 items-center">{icon}</span>
      <span className="truncate leading-[1.2]">{label}</span>
    </button>
  );
}

/**
 * 입력칸 — 기존 Field 와 같은 규칙. onChange 는 칠 때마다, onBlurValue 는 포커스를 벗어날 때 한 번.
 * autoFocus 는 방금 만든 빈 칸에만 — 켜면 그 칸이 보이도록 패널을 굴려 준다.
 */
export function Field({
  label,
  value,
  onChange,
  onBlurValue,
  multiline,
  rows = 6,
  placeholder,
  type,
  autoFocus
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onBlurValue?: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  type?: "text" | "number";
  autoFocus?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- 바깥 값이 바뀌면(다른 모듈·되돌리기) 입력칸도 맞춘다(기존 Field 와 같다).
  useEffect(() => setDraft(value), [value]);
  const box = useRef<HTMLLabelElement | null>(null);
  useEffect(() => {
    if (!autoFocus) return;
    box.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [autoFocus]);
  const common = {
    value: draft,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(e.target.value);
      onChange?.(e.target.value);
    },
    onBlur: () => onBlurValue?.(draft),
    autoFocus,
    className: INPUT_CLS
  };
  return (
    <label ref={box} className="flex flex-col gap-1.5 text-[13px] font-semibold text-[color:var(--v2-ink-3)]">
      {label}
      {multiline ? (
        <textarea {...common} rows={rows} className={`${common.className} resize-y py-3 leading-[1.65]`} />
      ) : (
        <input {...common} type={type ?? "text"} className={`${common.className} h-11`} />
      )}
    </label>
  );
}
