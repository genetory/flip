"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Star, X } from "@phosphor-icons/react";
import { getMyResumes, type Resume } from "../../lib/member-profile-client";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";

// 지원 확정 모달 — 학생이 어떤 이력서로 지원할지 고른 뒤 지원한다.
// 이력서가 없으면 만들기로 유도한다.
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
  onConfirm: (resumeId: string) => void;
  submitting?: boolean;
}) {
  const { locale } = useLanguage();
  const tr = (ko: string, en: string, zh: string, vi: string, ja: string, id: string) =>
    (({ ko, en, "zh-CN": zh, vi, ja, id }) as Record<PlatformLocale, string>)[locale] ?? en;

  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResumes(null);
    setSelectedId(null);
    setLoadError(false);
    void (async () => {
      try {
        const list = await getMyResumes();
        const sorted = [...list].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
        setResumes(sorted);
        setSelectedId(sorted.find((r) => r.isPrimary)?.id ?? sorted[0]?.id ?? null);
      } catch {
        setLoadError(true);
        setResumes([]);
      }
    })();
  }, [open]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(11,18,39,0.55)] p-5"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[460px] max-h-[88vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-[0_24px_48px_rgba(11,18,39,0.25)]"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-[#0B1227]">{tr("이력서 선택", "Choose a resume", "选择简历", "Chọn hồ sơ", "履歴書を選択", "Pilih resume")}</h2>
            <p className="mt-1 truncate text-[13px] text-[#6b7280]">
              {positionTitle
                ? tr(`'${positionTitle}'에 지원`, `Apply to '${positionTitle}'`, `申请 '${positionTitle}'`, `Ứng tuyển '${positionTitle}'`, `'${positionTitle}' に応募`, `Lamar '${positionTitle}'`)
                : tr("이 이력서로 지원합니다", "Apply with this resume", "以此简历申请", "Ứng tuyển bằng hồ sơ này", "この履歴書で応募", "Lamar dengan resume ini")}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-[#8b95a1] transition hover:bg-[#f2f4f6] hover:text-[#191f28]">
            <X className="h-4 w-4" />
          </button>
        </header>

        {resumes === null ? (
          <div className="py-10 text-center text-sm text-[#8b95a1]">{tr("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
        ) : resumes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#f9fafb] px-5 py-10 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-[#0B46E8]/50" aria-hidden />
            <p className="text-sm text-[#4e5968]">{tr("아직 이력서가 없어요. 먼저 이력서를 만들어 주세요.", "You don't have a resume yet. Create one first.", "还没有简历，请先创建。", "Bạn chưa có hồ sơ. Hãy tạo trước.", "まだ履歴書がありません。まず作成してください。", "Belum ada resume. Buat dulu ya.")}</p>
            <Link href="/resume-maker" className="mt-4 inline-flex items-center rounded-full bg-[#0B46E8] px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-[#0A3FCF]">
              {tr("이력서 만들기", "Create resume", "创建简历", "Tạo hồ sơ", "履歴書を作る", "Buat resume")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {resumes.map((r) => {
              const active = selectedId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedId(r.id)}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${active ? "border-[#0B46E8] bg-[#0B46E8]/[0.05]" : "border-[#e5e7eb] hover:border-[#cbd5e1]"}`}
                >
                  <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${active ? "bg-[#0B46E8] text-white" : "bg-[#eef1f5] text-[#0B46E8]"}`}>
                    <FileText className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[15px] font-semibold text-[#191f28]">{r.title}</span>
                      {r.isPrimary ? (
                        <span className="inline-flex flex-none items-center gap-0.5 rounded-full bg-[#b7ff5a] px-1.5 py-0.5 text-[10px] font-bold text-[#111]">
                          <Star className="h-2.5 w-2.5" weight="fill" />
                          {tr("대표", "Primary", "代表", "Đại diện", "代表", "Utama")}
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <span className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border ${active ? "border-[#0B46E8] bg-[#0B46E8]" : "border-[#cbd5e1]"}`}>
                    {active ? <span className="h-2 w-2 rounded-full bg-white" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {loadError ? <p className="mt-3 text-xs text-[#dc2626]">{tr("이력서를 불러오지 못했어요.", "Couldn't load resumes.", "无法加载简历。", "Không tải được hồ sơ.", "履歴書を読み込めませんでした。", "Gagal memuat resume.")}</p> : null}

        {resumes && resumes.length > 0 ? (
          <footer className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#0B1227] transition hover:bg-[#f9fafb]">
              {tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
            </button>
            <button
              type="button"
              onClick={() => selectedId && onConfirm(selectedId)}
              disabled={submitting || !selectedId}
              className="rounded-lg bg-[#0B46E8] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#0A3FCF] disabled:opacity-60"
            >
              {submitting ? tr("지원 중…", "Applying…", "申请中…", "Đang ứng tuyển…", "応募中…", "Melamar…") : tr("이 이력서로 지원", "Apply with this resume", "以此简历申请", "Ứng tuyển bằng hồ sơ này", "この履歴書で応募", "Lamar dengan ini")}
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
