"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, CircleNotch, FileText, MagicWand, Plus, Trash, UploadSimple, X } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { Button } from "../ui/button";
import { AiTicketCost } from "./AiTicketCost";
import { useToast } from "../toast/ToastProvider";
import { getMyResumes } from "../../lib/member-profile-client";
import { importCoverLetter } from "../../lib/resume-maker-client";
import { createCoverLetter, deleteCoverLetter, getMyCoverLetters, updateCoverLetter, type CoverLetter } from "../../lib/cover-letter-client";
import { useCoverLetterCopy } from "../../lib/resume-maker-i18n/cover-letter";
import { useEditorCopy } from "../../lib/resume-maker-i18n/editor";

const inputCls =
  "h-11 w-full rounded-xl border border-transparent bg-[#F2F4F6] px-3.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:bg-white focus:outline-none";

function answered(cl: CoverLetter): number {
  return cl.items.filter((it) => it.answer.trim()).length;
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function CoverLetterListPage() {
  const router = useRouter();
  const toast = useToast();
  const c = useCoverLetterCopy();
  const t = useEditorCopy();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<CoverLetter[]>([]);
  const [resumes, setResumes] = useState<{ id: string; title: string }[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newResumeId, setNewResumeId] = useState("");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [cls, allResumes] = await Promise.all([getMyCoverLetters(), getMyResumes().catch(() => [])]);
        if (!alive) return;
        setList(cls);
        setResumes(allResumes.map((r) => ({ id: r.id, title: r.title })));
      } catch (err) {
        if (!alive) return;
        toast.error(err instanceof Error ? err.message : c.loadFailed);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ?new=1 이면 생성 모달, ?import=1 이면 임포트 패널을 연다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search);
    if (q.get("new") === "1") setCreateOpen(true);
    if (q.get("import") === "1") setImportOpen(true);
  }, []);

  async function handleCreate() {
    const title = newName.trim();
    if (!title) {
      toast.info(c.nameRequired);
      return;
    }
    setCreating(true);
    try {
      const created = await createCoverLetter({ title, resumeId: newResumeId || undefined });
      // 표준 문항 5종을 기본 항목으로 채워 둔다(빈 답변 — 문서엔 안 뜨지만 섹션으로 보임).
      const stdItems = t.clStandardPrompts.map((p) => ({ id: crypto.randomUUID(), prompt: p.prompt, answer: "" }));
      await updateCoverLetter(created.id, { items: stdItems }).catch(() => {});
      router.push(`/resume-maker/cover-letters/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : c.createFailed);
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
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      toast.error(c.importFailed);
      return;
    }
    if (f.size > 12 * 1024 * 1024) {
      toast.error(c.importFailed);
      return;
    }
    setImportFile(f);
  }
  async function handleImport() {
    if (!importFile) return;
    setImporting(true);
    try {
      const pdfBase64 = await readFileAsDataUrl(importFile);
      const imp = await importCoverLetter({ pdfBase64 });
      const title = imp.company?.trim() || importFile.name.replace(/\.pdf$/i, "").slice(0, 120) || c.untitled;
      const created = await createCoverLetter({ title, company: imp.company || undefined });
      const items = imp.items.length
        ? imp.items.map((it) => ({ id: crypto.randomUUID(), prompt: it.prompt, answer: it.answer }))
        : t.clStandardPrompts.map((p) => ({ id: crypto.randomUUID(), prompt: p.prompt, answer: "" }));
      await updateCoverLetter(created.id, { items });
      router.push(`/resume-maker/cover-letters/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : c.importFailed);
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    setConfirmDelete(null);
    try {
      await deleteCoverLetter(id);
      setList((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : c.deleteFailed);
    }
  }

  return (
    <ResumeMakerShell>
      <section className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-white">
        {/* 히어로 — 홈과 동일한 ui/ux(타이틀·서브타이틀만 자기소개서에 맞춤) */}
        <div className="container max-w-xl px-4 py-9 sm:px-5 md:py-11">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img_coverletter.webp" alt="" className="mx-auto mb-5 h-auto w-full max-w-[260px]" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">
              <MagicWand className="h-3.5 w-3.5" weight="fill" aria-hidden /> {c.heroBadge}
            </span>
            <h1 className="mt-3.5 whitespace-pre-line text-[23px] font-black leading-[1.22] tracking-[-0.03em] text-[#191F28] md:text-[28px]">{c.heroTitle}</h1>
            <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-[#8B95A1] md:text-[15px]">{c.heroSubtitle}</p>
          </div>
        </div>

        {/* 본문 — 회색 영역 */}
        <div className="flex-1 bg-[#F7F9FB]">
          <div className="container max-w-xl px-4 py-8 sm:px-5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="default" size="lg" className="w-full" onClick={() => setCreateOpen(true)}>
                <Plus weight="bold" /> {c.newCta}
              </Button>
              <Button variant="outline" size="lg" className="w-full" onClick={() => setImportOpen((v) => !v)}>
                <UploadSimple weight="bold" /> {c.importCta}
              </Button>
            </div>

            {/* 기존 자기소개서 가져오기 — PDF 업로드 → AI 분해 */}
            {importOpen ? (
              <div className="mt-3 rounded-2xl border border-[#0B46E8]/20 bg-white p-5 shadow-card">
                <p className="text-[14px] font-bold text-[#191F28]">{c.importTitle}</p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#8B95A1]">{c.importDesc}</p>
                {importFile ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F2F4F6] px-3 py-2.5">
                    <FileText className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-foreground">{importFile.name}</span>
                    <button type="button" onClick={() => setImportFile(null)} aria-label={c.removeFile} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted">
                      <X weight="bold" className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#0B46E8]/40 px-4 py-4 text-[13px] font-semibold text-[#0B46E8] transition hover:bg-[#EDF1FD]">
                    <UploadSimple weight="bold" className="h-4 w-4" /> {c.importPick}
                    <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPickFile} />
                  </label>
                )}
                <Button variant="default" size="lg" className="mt-4 w-full" disabled={!importFile || importing} onClick={() => void handleImport()}>
                  {importing ? <CircleNotch className="animate-spin" weight="bold" /> : <MagicWand weight="fill" />}
                  {importing ? c.importReading : c.importRun}
                  {!importing ? <AiTicketCost feature="import_cover_letter" tone="plain" /> : null}
                </Button>
                <p className="mt-2 text-[11.5px] text-[#8B95A1]">{c.importDisclaimer}</p>
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
                <p className="mt-3 text-[16px] font-bold text-[#191F28]">{c.emptyTitle}</p>
                <p className="mx-auto mt-1.5 max-w-xs text-[13.5px] leading-relaxed text-[#8B95A1]">{c.emptyDesc}</p>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]">
                <ul className="space-y-1">
                  {list.map((cl) => {
                    const done = answered(cl);
                    return (
                      <li key={cl.id} className="flex items-center rounded-2xl transition hover:bg-[#F2F4F6] active:bg-[#F2F4F6]">
                        <button
                          type="button"
                          onClick={() => router.push(`/resume-maker/cover-letters/${cl.id}`)}
                          className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[16.5px] font-bold text-[#191F28]">{cl.title || c.untitled}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#8B95A1]">
                              <span className="font-semibold text-[#4E5968]">{c.answeredCount(done, cl.items.length)}</span>
                              <span>· {formatDateTime(cl.updatedAt)}</span>
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(cl.id)}
                          aria-label={c.remove}
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
            <p className="text-[17px] font-bold text-[#191F28]">{c.createTitle}</p>
            <div className="mt-4">
              <label className="block text-[12px] font-medium text-foreground/80">{c.nameLabel}</label>
              <input
                className={`${inputCls} mt-1`}
                placeholder={c.namePlaceholder}
                value={newName}
                maxLength={120}
                autoFocus
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreate();
                }}
              />
            </div>
            <div className="mt-3">
              <label className="block text-[12px] font-medium text-foreground/80">{c.linkResumeLabel}</label>
              <div className="relative mt-1">
                <select className={`${inputCls} appearance-none pr-9`} value={newResumeId} onChange={(e) => setNewResumeId(e.target.value)} aria-label={c.linkResumeLabel}>
                  <option value="">{c.linkResumeNone}</option>
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
                <CaretDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" weight="bold" aria-hidden />
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#8B95A1]">{c.linkResumeHint}</p>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" size="lg" className="flex-1" disabled={creating} onClick={() => setCreateOpen(false)}>
                {c.cancel}
              </Button>
              <Button variant="default" size="lg" className="flex-1" disabled={creating} onClick={() => void handleCreate()}>
                {creating ? <CircleNotch className="animate-spin" weight="bold" /> : <Plus weight="bold" />}
                {c.create}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* 삭제 확인 */}
      {confirmDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <p className="text-[15px] font-bold text-[#191F28]">{c.deleteConfirm}</p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" size="lg" className="flex-1" onClick={() => setConfirmDelete(null)}>
                {c.cancel}
              </Button>
              <Button variant="destructive" size="lg" className="flex-1" onClick={() => void handleDelete(confirmDelete)}>
                {c.remove}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ResumeMakerShell>
  );
}
