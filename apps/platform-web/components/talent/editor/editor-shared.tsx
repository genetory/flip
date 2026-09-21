"use client";

// 모듈형 에디터(이력서·자기소개서) 공통 — 버전 저장 훅과 상단 바·버전 패널·입력 조각.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Plus, Star, Trash } from "@phosphor-icons/react";
import { useToast } from "../../toast/ToastProvider";
import type { PlatformT } from "../../../lib/i18n";
import {
  createDocVersion,
  deleteDocVersion,
  listDocVersions,
  setPrimaryDocVersion,
  updateDocVersion,
  type DocVersion,
  type DocVersionKind
} from "../../../lib/talent/doc-versions";

export type SaveState = "idle" | "saving" | "saved" | "error";
type Patch<L> = Partial<Pick<DocVersion<L>, "name" | "layout" | "overrides">>;

const SAVE_DELAY = 600;

/**
 * 버전 목록과 저장. 변경은 화면에 바로 반영하고 SAVE_DELAY 뒤 서버에 보낸다(버전별로 묶어서).
 * 화면을 떠날 때 남은 저장을 보낸다.
 */
export function useDocVersionStore<L>(kind: DocVersionKind, t: PlatformT) {
  const toast = useToast();
  const [versions, setVersions] = useState<DocVersion<L>[] | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const pending = useRef<Record<string, Patch<L>>>({});

  useEffect(() => {
    let alive = true;
    listDocVersions<L>(kind)
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
  }, [kind]);

  const flush = useCallback(async (id: string) => {
    const patch = pending.current[id];
    if (!patch) return;
    delete pending.current[id];
    clearTimeout(timers.current[id]);
    setSaveState("saving");
    try {
      await updateDocVersion<L>(id, patch);
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

  const current = versions?.find((v) => v.id === currentId) ?? null;

  const createVersion = async () => {
    if (!versions || !current) return;
    try {
      await flush(current.id);
      const n = versions.length + 1;
      const created = await createDocVersion<L>({
        kind,
        name: t(`새 버전 ${n}`, `New version ${n}`, `新版本 ${n}`, `Phiên bản mới ${n}`, `新しいバージョン ${n}`, `Versi baru ${n}`),
        copyFrom: current.id
      });
      setVersions([...versions, created]);
      setCurrentId(created.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const makePrimary = async () => {
    if (!versions || !current) return;
    try {
      await flush(current.id);
      await setPrimaryDocVersion(current.id);
      setVersions(versions.map((v) => ({ ...v, isPrimary: v.id === current.id })));
      toast.success(t("대표 버전으로 정했어요", "Set as primary", "已设为代表版本", "Đã đặt làm bản chính", "代表バージョンにしました", "Dijadikan versi utama"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  const removeVersion = async () => {
    if (!versions || !current || current.isPrimary) return;
    if (!window.confirm(t("이 버전을 삭제할까요? 모듈 내용은 지워지지 않아요.", "Delete this version? Module content stays.", "删除此版本？模块内容不会被删除。", "Xóa phiên bản này? Nội dung mô-đun vẫn giữ.", "このバージョンを削除しますか？モジュールの内容は残ります。", "Hapus versi ini? Isi modul tetap ada."))) return;
    try {
      delete pending.current[current.id];
      await deleteDocVersion(current.id);
      const rest = versions.filter((v) => v.id !== current.id);
      setVersions(rest);
      setCurrentId((rest.find((v) => v.isPrimary) ?? rest[0])?.id ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    }
  };

  return { versions, current, setCurrentId, saveState, patchVersion, createVersion, makePrimary, removeVersion };
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

export function EditorTopBar<L>({
  t,
  active,
  exitHref,
  versions,
  current,
  onPick,
  onCreate,
  saveState,
  right
}: {
  t: PlatformT;
  active: "resume" | "cover";
  exitHref: string;
  versions: DocVersion<L>[];
  current: DocVersion<L>;
  onPick: (id: string) => void;
  onCreate: () => void;
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
      {right}
      <span className="w-[120px] text-right text-[12px] text-[#8B95A1]" aria-live="polite">
        {saveLabel}
      </span>
    </header>
  );
}

export function VersionPanel<L>({
  t,
  version,
  primaryNote,
  onRename,
  onPrimary,
  onDelete
}: {
  t: PlatformT;
  version: DocVersion<L>;
  primaryNote: string;
  onRename: (name: string) => void;
  onPrimary: () => void;
  onDelete: () => void;
}) {
  return (
    <Section title={t("이 버전", "This version", "此版本", "Phiên bản này", "このバージョン", "Versi ini")} divider>
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
      {version.isPrimary ? (
        <p className="rounded-lg bg-[#EDF1FD] px-3 py-2.5 text-[12px] leading-relaxed text-[#0B46E8]">{primaryNote}</p>
      ) : (
        <div className="flex gap-2">
          <button type="button" onClick={onPrimary} className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0B46E8] text-[13px] font-bold text-white hover:bg-[#0A3ECB]">
            <Star size={14} weight="fill" />
            {t("대표로 지정", "Make primary", "设为代表", "Đặt làm chính", "代表に指定", "Jadikan utama")}
          </button>
          <button type="button" onClick={onDelete} aria-label={t("버전 삭제", "Delete version", "删除版本", "Xóa phiên bản", "バージョン削除", "Hapus versi")} className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E8EB] text-[#8B95A1] hover:text-[#F04452]">
            <Trash size={15} weight="bold" />
          </button>
        </div>
      )}
    </Section>
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

/** 공유 문구 ↔ 이 버전용 문구 안내와 전환 버튼. */
export function ForkBanner({ t, forked, onFork, onUnfork }: { t: PlatformT; forked: boolean; onFork: () => void; onUnfork: () => void }) {
  return forked ? (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-[#FFF6E5] px-3 py-2.5 text-[12px] leading-relaxed text-[#B25E09]">
      <span>{t("이 버전에서만 쓰는 문구예요. 원본과 다른 버전에는 영향이 없어요.", "Wording for this version only; the original and other versions are unaffected.", "此文字仅用于此版本，不影响原文和其他版本。", "Văn bản chỉ cho bản này; bản gốc và bản khác không đổi.", "このバージョン専用の文言です。原本や他のバージョンには影響しません。", "Teks khusus versi ini; asli dan versi lain tidak berubah.")}</span>
      <button type="button" onClick={onUnfork} className="shrink-0 font-bold underline">
        {t("원래대로", "Revert", "恢复原文", "Khôi phục", "元に戻す", "Kembalikan")}
      </button>
    </div>
  ) : (
    <div className="flex items-start justify-between gap-2 rounded-lg bg-[#F7F8FA] px-3 py-2.5 text-[12px] leading-relaxed text-[#6B7684]">
      <span>{t("모든 버전에 함께 반영돼요.", "Changes apply to every version.", "修改会同步到所有版本。", "Thay đổi áp dụng cho mọi phiên bản.", "すべてのバージョンに反映されます。", "Berlaku di semua versi.")}</span>
      <button type="button" onClick={onFork} className="shrink-0 font-bold text-[#0B46E8] underline">
        {t("이 버전에서만 따로 고치기", "Edit for this version only", "仅在此版本修改", "Chỉ sửa ở bản này", "このバージョンだけ編集", "Ubah khusus versi ini")}
      </button>
    </div>
  );
}
