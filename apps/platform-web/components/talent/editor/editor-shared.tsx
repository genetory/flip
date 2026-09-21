"use client";

// 모듈형 에디터(이력서·자기소개서) 공통 — 편집 중 구성·저장본 관리와 상단 바·저장본 패널·입력 조각.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, FloppyDisk, LockSimple, Trash } from "@phosphor-icons/react";
import { useToast } from "../../toast/ToastProvider";
import type { PlatformT } from "../../../lib/i18n";
import {
  createSavedVersion,
  deleteDocVersion,
  listDocVersions,
  updateDocVersion,
  type DocVersion,
  type DocVersionKind
} from "../../../lib/talent/doc-versions";

export type SaveState = "idle" | "saving" | "saved" | "error";
type Patch<L> = { name?: string; layout?: L };

const SAVE_DELAY = 600;

/**
 * 편집 중 구성(working)과 저장본(saved). 편집 중 구성·저장본 이름 변경은 화면에 바로 반영하고
 * SAVE_DELAY 뒤 서버에 보낸다(행별로 묶어서). 화면을 떠날 때 남은 저장을 보낸다.
 */
export function useDocVersionStore<L, S>(kind: DocVersionKind, t: PlatformT) {
  const toast = useToast();
  const [versions, setVersions] = useState<DocVersion<L, S>[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<string, Patch<L>>>({});

  useEffect(() => {
    let alive = true;
    listDocVersions<L, S>(kind)
      .then(({ items }) => {
        if (!alive) return;
        setVersions(items);
        setCurrentId(items.find((v) => v.snapshot === null)?.id ?? null);
      })
      .catch(() => alive && toast.error(t("버전을 불러오지 못했어요.", "Couldn't load versions.", "无法加载版本。", "Không tải được phiên bản.", "バージョンを読み込めませんでした。", "Gagal memuat versi.")));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const flush = useCallback(async (id: string) => {
    const patch = pending.current[id];
    if (!patch) return;
    delete pending.current[id];
    clearTimeout(timers.current[id]);
    setSaveState("saving");
    try {
      await updateDocVersion<L, S>(id, patch);
      setSaveState(Object.keys(pending.current).length ? "saving" : "saved");
    } catch {
      setSaveState("error");
    }
  }, []);

  useEffect(() => {
    const flushAll = () => Object.keys(pending.current).forEach((id) => void flush(id));
    window.addEventListener("beforeunload", flushAll);
    return () => {
      window.removeEventListener("beforeunload", flushAll);
      flushAll();
    };
  }, [flush]);

  const patchVersion = useCallback(
    (id: string, patch: Patch<L>) => {
      setVersions((vs) => vs?.map((v) => (v.id === id ? { ...v, ...patch } : v)) ?? vs);
      pending.current[id] = { ...pending.current[id], ...patch };
      clearTimeout(timers.current[id]);
      setSaveState("saving");
      timers.current[id] = setTimeout(() => void flush(id), SAVE_DELAY);
    },
    [flush]
  );

  const working = versions?.find((v) => v.snapshot === null) ?? null;
  const saved = versions?.filter((v) => v.snapshot !== null) ?? [];
  const current = versions?.find((v) => v.id === currentId) ?? working;

  /** 편집 중 구성 바꾸기. */
  const setWorkingLayout = (layout: L) => working && patchVersion(working.id, { layout });

  /** 새 버전으로 저장 — 지금 화면 그대로(내용 + 구성)를 읽기 전용 저장본으로. 편집 화면에 그대로 머문다. */
  const saveAsNew = async (name: string, layout: L, snapshot: S) => {
    try {
      if (working) await flush(working.id);
      const created = await createSavedVersion<L, S>({ kind, name, layout, snapshot });
      setVersions((vs) => (vs ? [...vs.filter((v) => v.snapshot === null), created, ...vs.filter((v) => v.snapshot !== null)] : vs));
      toast.success(t(`'${name}'(으)로 저장했어요`, `Saved as '${name}'`, `已保存为「${name}」`, `Đã lưu thành '${name}'`, `「${name}」として保存しました`, `Disimpan sebagai '${name}'`));
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
      return false;
    }
  };

  const renameSaved = (id: string, name: string) => patchVersion(id, { name });

  const removeSaved = async (id: string) => {
    if (!window.confirm(t("이 저장본을 삭제할까요? 되돌릴 수 없어요.", "Delete this saved version? This can't be undone.", "删除此保存版本？无法恢复。", "Xóa bản đã lưu này? Không thể hoàn tác.", "この保存版を削除しますか？元に戻せません。", "Hapus versi tersimpan ini? Tidak bisa dibatalkan."))) return;
    try {
      delete pending.current[id];
      clearTimeout(timers.current[id]);
      await deleteDocVersion(id);
      setVersions((vs) => vs?.filter((v) => v.id !== id) ?? vs);
      setCurrentId(working?.id ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return { versions, working, saved, current, setCurrentId, saveState, setWorkingLayout, saveAsNew, renameSaved, removeSaved };
}

// ── 화면 조각 ────────────────────────────────────────────────

export function FullMessage({ text, action }: { text: string; action?: { href: string; label: string } }) {
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

export const EDITOR_ROUTES = {
  resume: "/talent/career/resume/editor",
  cover: "/talent/career/cover/editor"
} as const;

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
        ? t("저장 실패 — 다시 시도해 주세요", "Save failed — try again", "保存失败，请重试", "Lưu thất bại — thử lại", "保存に失敗しました", "Gagal menyimpan")
        : saveState === "saved"
          ? t("저장됨", "Saved", "已保存", "Đã lưu", "保存済み", "Tersimpan")
          : "";
  const tab = (key: "resume" | "cover", label: string) =>
    key === active ? (
      <span aria-current="page" className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[14px] font-bold text-white">
        {label}
      </span>
    ) : (
      <Link href={EDITOR_ROUTES[key]} className="rounded-lg px-3 py-1.5 text-[14px] font-semibold text-[#4E5968] hover:bg-[#F2F4F6]">
        {label}
      </Link>
    );
  const chip = (v: DocVersion<L, S>, label: ReactNode) => (
    <button
      key={v.id}
      type="button"
      onClick={() => onPick(v.id)}
      aria-pressed={v.id === current.id}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold ${
        v.id === current.id ? "border-[#0B46E8] bg-[#EDF1FD] text-[#0B46E8]" : "border-[#E5E8EB] bg-white text-[#4E5968] hover:bg-[#F7F8FA]"
      }`}
    >
      {label}
    </button>
  );
  return (
    <header className="no-print flex h-16 shrink-0 items-center gap-4 border-b border-[#E5E8EB] bg-white px-5">
      <Link href={exitHref} aria-label={t("나가기", "Exit", "退出", "Thoát", "終了", "Keluar")} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#4E5968] hover:bg-[#F2F4F6]">
        <ArrowLeft size={18} weight="bold" />
      </Link>
      <nav aria-label={t("문서", "Document", "文档", "Tài liệu", "文書", "Dokumen")} className="flex items-center gap-1">
        {tab("resume", t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume"))}
        {tab("cover", t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran"))}
      </nav>
      <div className="mx-2 h-6 w-px bg-[#E5E8EB]" />
      <nav aria-label={t("버전", "Versions", "版本", "Phiên bản", "バージョン", "Versi")} className="flex min-w-0 items-center gap-1.5 overflow-x-auto">
        {chip(working, t("편집 중", "Editing", "编辑中", "Đang sửa", "編集中", "Sedang diedit"))}
        {saved.map((v) =>
          chip(
            v,
            <>
              <LockSimple size={12} weight="bold" aria-hidden />
              {v.name}
            </>
          )
        )}
      </nav>
      <SaveNewButton t={t} onSave={onSaveNew} disabled={current.snapshot !== null} />
      <div className="flex-1" />
      {right}
      <span className="w-[120px] text-right text-[12px] text-[#8B95A1]" aria-live="polite">
        {current.snapshot === null ? saveLabel : ""}
      </span>
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
        className="flex items-center gap-1 rounded-lg border border-dashed border-[#C4CAD2] px-3 py-1.5 text-[13px] font-semibold text-[#4E5968] hover:bg-[#F7F8FA] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <FloppyDisk size={14} weight="bold" />
        {t("새 버전으로 저장", "Save as new version", "另存为新版本", "Lưu thành phiên bản mới", "新しいバージョンとして保存", "Simpan sebagai versi baru")}
      </button>
      {open ? (
        <>
          <button type="button" aria-hidden tabIndex={-1} onClick={() => setOpen(false)} className="fixed inset-0 z-10 cursor-default" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
            className="absolute left-0 top-[calc(100%+6px)] z-20 flex w-[300px] flex-col gap-2.5 rounded-xl border border-[#E5E8EB] bg-white p-3.5 shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
          >
            <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#6B7684]">
              {t("저장본 이름", "Name", "名称", "Tên", "名前", "Nama")}
              <input
                ref={inputRef}
                value={name}
                maxLength={60}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("예: OO전자 지원용", "e.g. For Company A", "例：投递 A 公司", "VD: Nộp công ty A", "例：A社応募用", "mis. Untuk Perusahaan A")}
                className="h-10 rounded-lg border border-[#E5E8EB] bg-[#F7F8FA] px-3 text-[14px] text-[#191F28] outline-none focus:border-[#0B46E8]"
              />
            </label>
            <p className="text-[11.5px] leading-relaxed text-[#6B7684]">
              {t("지금 모습 그대로 저장돼요. 저장본은 고칠 수 없고, 지원할 때 골라 쓸 수 있어요.", "Saved exactly as it looks now. Saved versions can't be edited and can be picked when applying.", "按当前样子保存。保存版本不可修改，投递时可选用。", "Lưu đúng như hiện tại. Bản đã lưu không sửa được và có thể chọn khi ứng tuyển.", "今の状態のまま保存されます。保存版は編集できず、応募時に選べます。", "Disimpan persis seperti sekarang. Tidak bisa diubah dan bisa dipilih saat melamar.")}
            </p>
            <button type="submit" disabled={!name.trim() || busy} className="h-10 rounded-lg bg-[#0B46E8] text-[13px] font-bold text-white hover:bg-[#0A3ECB] disabled:opacity-50">
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
    <aside className="no-print flex w-[336px] shrink-0 flex-col gap-6 overflow-y-auto border-l border-[#E5E8EB] bg-white p-5" aria-label={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
      <Section title={t("저장본", "Saved version", "保存版本", "Bản đã lưu", "保存版", "Versi tersimpan")}>
        <label className="flex flex-col gap-1.5 text-[12px] font-semibold text-[#6B7684]">
          {t("이름", "Name", "名称", "Tên", "名前", "Nama")}
          <input
            key={version.id}
            defaultValue={version.name}
            maxLength={60}
            onChange={(e) => e.target.value.trim() && onRename(e.target.value.trim())}
            className="h-10 rounded-lg border border-[#E5E8EB] bg-[#F7F8FA] px-3 text-[14px] text-[#191F28] outline-none focus:border-[#0B46E8]"
          />
        </label>
        <p className="text-[12px] text-[#6B7684]">
          {t("저장한 때", "Saved", "保存时间", "Đã lưu lúc", "保存日時", "Disimpan")} · {saved.toLocaleString()}
        </p>
        <p className="flex items-start gap-1.5 rounded-lg bg-[#F7F8FA] px-3 py-2.5 text-[12px] leading-relaxed text-[#6B7684]">
          <LockSimple size={13} weight="bold" className="mt-[2px] shrink-0" />
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
        <button type="button" onClick={onDelete} className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#F04452] hover:underline">
          <Trash size={14} weight="bold" />
          {t("저장본 삭제", "Delete saved version", "删除保存版本", "Xóa bản đã lưu", "保存版を削除", "Hapus versi tersimpan")}
        </button>
      </Section>
    </aside>
  );
}

export function Section({ title, children, divider }: { title: string; children: ReactNode; divider?: boolean }) {
  return (
    <section className={`flex flex-col gap-2.5 ${divider ? "border-t border-[#F2F4F6] pt-5" : ""}`}>
      <h3 className="text-[13px] font-bold">{title}</h3>
      {children}
    </section>
  );
}

export function ToolButton({ icon, label, onClick, disabled }: { icon: ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
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
export function Field({
  label,
  value,
  onChange,
  onBlurValue,
  multiline,
  rows = 6,
  placeholder,
  type
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  onBlurValue?: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
  type?: "text" | "number";
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
      {multiline ? (
        <textarea {...common} rows={rows} className={`${common.className} resize-y py-2.5 leading-relaxed`} />
      ) : (
        <input {...common} type={type ?? "text"} className={`${common.className} h-10`} />
      )}
    </label>
  );
}
