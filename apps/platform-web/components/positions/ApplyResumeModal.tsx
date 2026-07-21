"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, NotePencil, Star, X } from "@phosphor-icons/react";
import { getMyResumes, type Resume } from "../../lib/member-profile-client";
import { getMyCoverLetters, type CoverLetter } from "../../lib/cover-letter-client";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";

// 지원 확정 모달 — 지원하려면 이력서와 자기소개서가 모두 있어야 한다.
// 각각 어떤 문서로 지원할지 고르고(대표/최근 기본), 없으면 만들기로 유도한다.
export function ApplyResumeModal({
  open,
  positionTitle,
  onClose,
  onConfirm,
  submitting = false
}: {
  open: boolean;
  positionTitle?: string | null;
  onClose: () => void;
  onConfirm: (resumeId: string, coverLetterId: string) => void;
  submitting?: boolean;
}) {
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string, vi: string, ja: string, id: string) =>
    (({ ko, en, "zh-CN": zh, vi, ja, id }) as Record<PlatformLocale, string>)[locale] ?? en;

  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [covers, setCovers] = useState<CoverLetter[] | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [coverId, setCoverId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResumes(null);
    setCovers(null);
    setResumeId(null);
    setCoverId(null);
    setLoadError(false);
    void (async () => {
      try {
        const [rs, cs] = await Promise.all([getMyResumes(), getMyCoverLetters()]);
        const rsorted = [...rs].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
        setResumes(rsorted);
        setResumeId(rsorted.find((r) => r.isPrimary)?.id ?? rsorted[0]?.id ?? null);
        setCovers(cs);
        setCoverId(cs[0]?.id ?? null);
      } catch {
        setLoadError(true);
        setResumes([]);
        setCovers([]);
      }
    })();
  }, [open]);

  if (!open) return null;

  const loading = resumes === null || covers === null;
  const canApply = !!resumeId && !!coverId && !submitting;

  const emptyBox = (kind: "resume" | "cover") => (
    <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-6 text-center">
      {kind === "resume" ? (
        <FileText className="mx-auto mb-2 h-7 w-7 text-[#0B46E8]/50" aria-hidden />
      ) : (
        <NotePencil className="mx-auto mb-2 h-7 w-7 text-[#0B46E8]/50" aria-hidden />
      )}
      <p className="text-[13px] text-[#4e5968]">
        {kind === "resume"
          ? tr("이력서가 아직 없어요. 먼저 만들어 주세요.", "No resume yet. Create one first.", "还没有简历，请先创建。", "Chưa có hồ sơ. Hãy tạo trước.", "履歴書がありません。まず作成してください。", "Belum ada resume. Buat dulu.")
          : tr("자기소개서가 아직 없어요. 먼저 만들어 주세요.", "No cover letter yet. Create one first.", "还没有自我介绍，请先创建。", "Chưa có thư giới thiệu. Hãy tạo trước.", "自己PRがありません。まず作成してください。", "Belum ada cover letter. Buat dulu.")}
      </p>
      <Link
        href={kind === "resume" ? "/resume-maker" : "/resume-maker/cover-letters"}
        className="mt-3 inline-flex items-center rounded-full bg-[#0B46E8] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0A3FCF]"
      >
        {kind === "resume"
          ? tr("이력서 만들기", "Create resume", "创建简历", "Tạo hồ sơ", "履歴書を作る", "Buat resume")
          : tr("자기소개서 만들기", "Create cover letter", "创建自我介绍", "Tạo thư giới thiệu", "自己PRを作る", "Buat cover letter")}
      </Link>
    </div>
  );

  const docRow = (opts: { id: string; title: string; sub?: string | null; primary?: boolean; kind: "resume" | "cover"; selected: boolean; onSelect: () => void }) => {
    const { id, title, sub, primary, kind, selected, onSelect } = opts;
    const Icon = kind === "resume" ? FileText : NotePencil;
    return (
      <button
        key={id}
        type="button"
        onClick={onSelect}
        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${selected ? "border-[#0B46E8] bg-[#0B46E8]/[0.05]" : "border-[#e5e7eb] hover:border-[#cbd5e1]"}`}
      >
        <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${selected ? "bg-[#0B46E8] text-white" : "bg-[#eef1f5] text-[#0B46E8]"}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold text-[#191f28]">{title}</span>
            {primary ? (
              <span className="inline-flex flex-none items-center gap-0.5 rounded-full bg-[#b7ff5a] px-1.5 py-0.5 text-[10px] font-bold text-[#111]">
                <Star className="h-2.5 w-2.5" weight="fill" />
                {tr("대표", "Primary", "代表", "Đại diện", "代表", "Utama")}
              </span>
            ) : null}
          </span>
          {sub ? <span className="mt-0.5 block truncate text-[12px] text-[#8b95a1]">{sub}</span> : null}
        </span>
        <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${selected ? "border-[#0B46E8] bg-[#0B46E8]" : "border-[#cbd5e1]"}`}>
          {selected ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
        </span>
      </button>
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(11,18,39,0.55)] p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_48px_rgba(11,18,39,0.25)]"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#0B1227]">{tr("지원 서류 선택", "Choose your documents", "选择申请材料", "Chọn hồ sơ ứng tuyển", "応募書類を選択", "Pilih dokumen lamaran")}</h2>
            <p className="mt-1 truncate text-[13px] text-[#6b7280]">
              {positionTitle
                ? tr(`'${positionTitle}'에 지원`, `Apply to '${positionTitle}'`, `申请 '${positionTitle}'`, `Ứng tuyển '${positionTitle}'`, `'${positionTitle}' に応募`, `Lamar '${positionTitle}'`)
                : tr("이력서와 자기소개서로 지원합니다", "Apply with your resume and cover letter", "以简历和自我介绍申请", "Ứng tuyển bằng hồ sơ và thư", "履歴書と自己PRで応募", "Lamar dengan resume dan cover letter")}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#8b95a1] transition hover:bg-[#f2f4f6] hover:text-[#191f28]">
            <X className="h-4 w-4" />
          </button>
        </header>

        {loading ? (
          <div className="py-10 text-center text-sm text-[#8b95a1]">{tr("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* 이력서 */}
            <section>
              <p className="mb-2 text-[13px] font-semibold text-[#4e5968]">{tr("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}</p>
              {resumes && resumes.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {resumes.map((r) => docRow({ id: r.id, title: r.title, primary: r.isPrimary, kind: "resume", selected: resumeId === r.id, onSelect: () => setResumeId(r.id) }))}
                </div>
              ) : (
                emptyBox("resume")
              )}
            </section>

            {/* 자기소개서 */}
            <section>
              <p className="mb-2 text-[13px] font-semibold text-[#4e5968]">{tr("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己PR", "Cover letter")}</p>
              {covers && covers.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {covers.map((c) => docRow({ id: c.id, title: c.title, sub: c.company, kind: "cover", selected: coverId === c.id, onSelect: () => setCoverId(c.id) }))}
                </div>
              ) : (
                emptyBox("cover")
              )}
            </section>
          </div>
        )}

        {loadError ? <p className="mt-3 text-xs text-[#dc2626]">{tr("서류를 불러오지 못했어요.", "Couldn't load documents.", "无法加载材料。", "Không tải được hồ sơ.", "書類を読み込めませんでした。", "Gagal memuat dokumen.")}</p> : null}

        {!loading ? (
          <footer className="mt-6 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0B1227] transition hover:bg-[#f9fafb]">
              {tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
            </button>
            <button
              type="button"
              onClick={() => resumeId && coverId && onConfirm(resumeId, coverId)}
              disabled={!canApply}
              className="rounded-lg bg-[#0B46E8] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#0A3FCF] disabled:opacity-60"
            >
              {submitting ? tr("지원 중…", "Applying…", "申请中…", "Đang ứng tuyển…", "応募中…", "Melamar…") : tr("지원하기", "Apply", "申请", "Ứng tuyển", "応募する", "Lamar")}
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
