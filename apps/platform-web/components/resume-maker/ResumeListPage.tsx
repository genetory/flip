"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch, FileText, MagicWand, Plus, Trash, UploadSimple, X } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { Button } from "../ui/button";
import { AiTicketCost } from "./AiTicketCost";
import { useToast } from "../toast/ToastProvider";
import { deleteMyResume, getMyResumes, type Resume } from "../../lib/member-profile-client";
import { createDraftResume, createResumeFromImport, getBuilderState, importResume, isResumeMakerDraft } from "../../lib/resume-maker-client";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { useLandingCopy } from "../../lib/resume-maker-i18n/landing";

const inputCls =
  "h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:bg-white focus:outline-none";

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

// 이력서 목록 — 자기소개서 목록(CoverLetterListPage)과 동일한 UI/UX.
export function ResumeListPage() {
  const router = useRouter();
  const toast = useToast();
  const t = useLandingCopy();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<Resume[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const all = await getMyResumes();
        if (!alive) return;
        setList(all.filter(isResumeMakerDraft).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)));
      } catch {
        /* 목록 로드 실패는 치명적이지 않음 */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("new") === "1") setCreateOpen(true);
    if (q.get("import") === "1") setImportOpen(true);
  }, []);

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    try {
      const draft = await createDraftResume(newName.trim() || t.newResumeFallbackTitle);
      window.dispatchEvent(new Event("aply:resumes-changed"));
      router.push(`/resume-maker/${draft.id}/onboarding`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.startFailed);
      setCreating(false);
    }
  }

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(typeof r.result === "string" ? r.result : "");
      r.onerror = () => reject(new Error("read failed"));
      r.readAsDataURL(file);
    });
  }
  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (f && f.size > 12 * 1024 * 1024) {
      toast.error(t.fileTooLarge);
      return;
    }
    setImportFile(f);
  }
  async function handleImport() {
    if (!importFile || importing) return;
    setImporting(true);
    try {
      const imported = await importResume({ pdfBase64: await readFileAsDataUrl(importFile) });
      const nowIso = new Date().toISOString();
      const title = imported.basicName ? t.importedResumeTitle(imported.basicName) : t.importedResumeFallback;
      const draft = await createResumeFromImport(title, imported, nowIso);
      window.dispatchEvent(new Event("aply:resumes-changed"));
      router.push(`/resume-maker/${draft.id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.importFailed);
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    setConfirmDelete(null);
    try {
      await deleteMyResume(id);
      setList((prev) => prev.filter((x) => x.id !== id));
      window.dispatchEvent(new Event("aply:resumes-changed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.deleteFailed);
    }
  }

  return (
    <ResumeMakerShell>
      <section className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-white">
        {/* 히어로 — 홈과 동일한 ui/ux(타이틀·서브타이틀만 이력서에 맞춤) */}
        <div className="container max-w-xl px-4 py-9 sm:px-5 md:py-11">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img_resume.webp" alt="" className="mx-auto mb-5 h-auto w-full max-w-[260px]" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">
              <MagicWand className="h-3.5 w-3.5" weight="fill" aria-hidden /> {t.heroBadge}
            </span>
            <h1 className="mt-3.5 text-[23px] font-black leading-[1.22] tracking-[-0.03em] text-[#191F28] md:text-[28px]">
              {t.heroTitleLine1}
              <br />
              {t.heroTitleLine2}
            </h1>
            <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-[#8B95A1] md:text-[15px]">{t.heroSubtitle}</p>
          </div>
        </div>

        {/* 본문 — 회색 영역 */}
        <div className="flex-1 bg-[#F7F9FB]">
          <div className="container max-w-xl px-4 py-8 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="default" size="lg" className="w-full" onClick={() => setCreateOpen(true)}>
                <Plus weight="bold" /> {t.newResumeCta}
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setImportOpen((v) => !v)}>
                <UploadSimple weight="bold" /> {t.editExistingCta}
              </Button>
            </div>

            {/* 기존 이력서 가져오기 — PDF 업로드 → AI 구조화 */}
            {importOpen ? (
              <div className="mt-3 rounded-2xl border border-[#0B46E8]/20 bg-white p-5 shadow-card">
                <p className="text-[14px] font-bold text-[#191F28]">{t.importTitle}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#8B95A1]">{t.importDesc}</p>
                {importFile ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F2F4F6] px-3 py-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{importFile.name}</span>
                    <button type="button" onClick={() => setImportFile(null)} aria-label={t.removeFile} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted">
                      <X weight="bold" className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#0B46E8]/40 px-4 py-4 text-[13px] font-semibold text-[#0B46E8] transition hover:bg-[#EDF1FD]">
                    <UploadSimple weight="bold" className="h-4 w-4" /> {t.uploadPdf}
                    <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPickFile} />
                  </label>
                )}
                <Button variant="default" size="lg" className="mt-4 w-full" disabled={!importFile || importing} onClick={() => void handleImport()}>
                  {importing ? <CircleNotch className="animate-spin" weight="bold" /> : <MagicWand weight="fill" />}
                  {importing ? t.importReading : t.importAi}
                  {!importing ? <AiTicketCost feature="import_resume" tone="plain" /> : null}
                </Button>
                <p className="mt-2 text-[11.5px] text-[#8B95A1]">{t.importDisclaimer}</p>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <CircleNotch className="h-5 w-5 animate-spin" weight="bold" aria-hidden />
              </div>
            ) : list.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white px-6 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF1FD]">
                  <FileText className="h-6 w-6 text-[#0B46E8]" weight="fill" aria-hidden />
                </div>
                <p className="mt-3 text-[16px] font-bold text-[#191F28]">{t.emptyResumeTitle}</p>
                <p className="mx-auto mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-[#8B95A1]">{t.emptyResumeDesc}</p>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]">
                <ul className="space-y-1">
                  {list.map((r) => {
                    const pct = computeResumeProgress(r.content, getBuilderState(r)).percent;
                    return (
                      <li key={r.id} className="flex items-center rounded-2xl transition hover:bg-[#F2F4F6] active:bg-[#F2F4F6]">
                        <button
                          type="button"
                          onClick={() => router.push(`/resume-maker/${r.id}/edit`)}
                          className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[16.5px] font-bold text-[#191F28]">{r.title || t.untitledResume}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#8B95A1]">
                              <span className="font-semibold text-[#4E5968]">{t.completion} {pct}%</span>
                              <span>· {formatDateTime(r.updatedAt)}</span>
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(r.id)}
                          aria-label={t.deleteResume}
                          className="mr-1 flex shrink-0 items-center justify-center rounded-full p-2.5 text-[#C9CDD2] transition hover:bg-rose-50 hover:text-rose-500"
                        >
                          <Trash className="h-[18px] w-[18px]" weight="bold" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 생성 모달 */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => !creating && setCreateOpen(false)}>
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <p className="text-[17px] font-bold text-[#191F28]">{t.newResumeCta}</p>
            <div className="mt-4">
              <label className="block text-[12px] font-medium text-foreground/80">{t.nameLabel}</label>
              <input
                className={`${inputCls} mt-1`}
                placeholder={t.newNamePlaceholder}
                value={newName}
                maxLength={120}
                autoFocus
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreate();
                }}
              />
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" size="lg" className="flex-1" disabled={creating} onClick={() => setCreateOpen(false)}>
                {t.cancel}
              </Button>
              <Button variant="default" size="lg" className="flex-1" disabled={creating} onClick={() => void handleCreate()}>
                {creating ? <CircleNotch className="animate-spin" weight="bold" /> : <Plus weight="bold" />}
                {t.createBtn}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 삭제 확인 */}
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <p className="text-[15px] font-bold text-[#191F28]">{t.deleteConfirmTitle}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t.deleteConfirmDesc}</p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" size="lg" className="flex-1" onClick={() => setConfirmDelete(null)}>
                {t.cancel}
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={() => void handleDelete(confirmDelete)}>
                {t.delete}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ResumeMakerShell>
  );
}
