"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretRight, FilePlus, MagicWand, PencilSimpleLine, CircleNotch, Plus, Trash, UploadSimple, FilePdf, X } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { deleteMyResume, getMyResumes, type Resume } from "../../lib/member-profile-client";
import { getActiveResumeId, setActiveResumeId } from "../../lib/resume-maker-active";
import { AiTicketCost } from "./AiTicketCost";
import { FileImportPanel } from "./FileImportPanel";
import { builderContinuePath, createDraftResume, createResumeFromImport, getBuilderState, importCoverLetter, importResume, isResumeMakerDraft } from "../../lib/resume-maker-client";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { trackResumeBuilderStarted, trackResumeBuilderViewed } from "../../lib/analytics";
import { useLandingCopy } from "../../lib/resume-maker-i18n/landing";
import { createCoverLetter, deleteCoverLetter, getMyCoverLetters, updateCoverLetter, type CoverLetter } from "../../lib/cover-letter-client";
import { useCoverLetterCopy } from "../../lib/resume-maker-i18n/cover-letter";

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

// hero: 공고 맞춤·모의 면접에서 이 화면을 쓸 때 히어로 문구를 그 도구에 맞게 덮어쓴다.
// pick: '선택 모드' — 카드를 누르면 편집기 대신 그 도구로 진입(현재 이력서로 지정).
export function ResumeMakerLandingPage({
  hero,
  pick,
  resumesOnly
}: {
  hero?: { badge: string; title: string; subtitle: string };
  pick?: { tool: "tailor" | "interview"; cta: string };
  resumesOnly?: boolean; // 이력서 탭 — 자기소개서 섹션을 숨기고 이력서만 보여준다.
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const t = useLandingCopy();
  const cl = useCoverLetterCopy();
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [creating, setCreating] = useState(false);
  const [newOpen, setNewOpen] = useState(searchParams.get("new") === "1");
  const [newName, setNewName] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [drafts, setDrafts] = useState<Resume[]>([]);
  // 홈 상단 여정이 가리키는 이력서(목록에서 누르면 전환). 초기값은 마지막 활성 이력서.
  const [focusedId, setFocusedId] = useState<string | null>(() => (typeof window !== "undefined" ? getActiveResumeId() : null));
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteClId, setConfirmDeleteClId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [clImportOpen, setClImportOpen] = useState(false);
  const [clImportFile, setClImportFile] = useState<File | null>(null);
  const [clImporting, setClImporting] = useState(false);

  function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error(t.fileReadError));
      reader.readAsDataURL(file);
    });
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 12 * 1024 * 1024) {
      toast.error(t.fileTooLarge);
      e.target.value = "";
      return;
    }
    setImportFile(file);
  }

  async function handleImport() {
    if (importing) return;
    if (!importFile) {
      toast.error(t.importNeedInput);
      return;
    }
    setImporting(true);
    try {
      const imported = await importResume({ pdfBase64: await readFileAsDataUrl(importFile) });
      const nowIso = new Date().toISOString();
      const title = newName.trim() || (imported.basicName ? t.importedResumeTitle(imported.basicName) : t.importedResumeFallback);
      const draft = await createResumeFromImport(title, imported, nowIso);
      trackResumeBuilderStarted("import");
      window.dispatchEvent(new Event("aply:resumes-changed"));
      router.push(`/resume-maker/${draft.id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.importFailed);
      setImporting(false);
    }
  }

  function onPickClFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    e.target.value = "";
    if (file && file.size > 12 * 1024 * 1024) {
      toast.error(cl.importFailed);
      return;
    }
    setClImportFile(file);
  }

  async function handleClImport() {
    if (clImporting || !clImportFile) return;
    setClImporting(true);
    try {
      const imp = await importCoverLetter({ pdfBase64: await readFileAsDataUrl(clImportFile) });
      const title = imp.company?.trim() || clImportFile.name.replace(/\.pdf$/i, "").slice(0, 120) || cl.untitled;
      const created = await createCoverLetter({ title, company: imp.company || undefined });
      // 분해된 문항이 있으면 그대로, 없으면 빈 채로(편집기에서 표준 문항 자동 시드).
      const items = imp.items.map((it) => ({ id: crypto.randomUUID(), prompt: it.prompt, answer: it.answer }));
      await updateCoverLetter(created.id, { items });
      router.push(`/resume-maker/cover-letters/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cl.importFailed);
      setClImporting(false);
    }
  }

  async function handleDelete() {
    if (!confirmDeleteId || deleting) return;
    setDeleting(true);
    try {
      await deleteMyResume(confirmDeleteId);
      setDrafts((prev) => prev.filter((d) => d.id !== confirmDeleteId));
      setConfirmDeleteId(null);
      window.dispatchEvent(new Event("aply:resumes-changed")); // GNB 메뉴 잠금/해제 갱신
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.deleteFailed);
    } finally {
      setDeleting(false);
    }
  }

  useEffect(() => {
    trackResumeBuilderViewed();
    let alive = true;
    void (async () => {
      try {
        const list = await getMyResumes();
        if (!alive) return;
        const drafted = list
          .filter(isResumeMakerDraft)
          .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
        setDrafts(drafted);
      } catch {
        // 목록 로드 실패는 치명적이지 않음 — 새로 만들기는 여전히 가능.
      } finally {
        if (alive) setLoadingResumes(false);
      }
      // 자기소개서 목록(작성 중 섹션용) — 실패해도 무시.
      try {
        const cls = await getMyCoverLetters();
        if (alive) setCoverLetters(cls);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function handleDeleteCl() {
    if (!confirmDeleteClId) return;
    const id = confirmDeleteClId;
    setConfirmDeleteClId(null);
    try {
      await deleteCoverLetter(id);
      setCoverLetters((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : cl.deleteFailed);
    }
  }

  async function startNew(mode: "chat" | "form") {
    if (creating) return;
    setCreating(true);
    try {
      const title = newName.trim() || t.newResumeFallbackTitle;
      const draft = await createDraftResume(title);
      trackResumeBuilderStarted("new");
      window.dispatchEvent(new Event("aply:resumes-changed"));
      router.push(mode === "chat" ? `/resume-maker/${draft.id}/edit` : `/resume-maker/${draft.id}/onboarding`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.startFailed);
      setCreating(false);
    }
  }

  // 이력서가 없을 때만 대문에 만들기 CTA·특징을 펼친다(있으면 부제까지만 컴팩트하게).
  const noResumes = !loadingResumes && drafts.length === 0;

  return (
    <ResumeMakerShell>
      <section className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-white">
        {/* 히어로 — 흰 배경 */}
        <div className="container max-w-xl px-4 py-9 sm:px-5 md:py-11">
        <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img_resume_maker.webp" alt="" className="mx-auto mb-5 h-auto w-full max-w-[260px]" />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">
              <MagicWand className="h-3.5 w-3.5" weight="fill" aria-hidden />
              {t.homeBadge}
            </span>
            <h1 className="mt-3.5 text-[23px] font-black leading-[1.22] tracking-[-0.03em] text-[#191F28] md:text-[28px]">
              {t.homeTitleLine1}
              <br />
              {t.homeTitleLine2}
            </h1>
            <p className="mx-auto mt-2.5 max-w-sm text-[14px] leading-relaxed text-[#8B95A1] md:text-[15px]">{t.homeSubtitle}</p>

            {noResumes ? (
            <>
            <div className="mt-7 flex flex-col items-center gap-5">
              <Button
                variant="default"
                size="xl"
                className="w-full max-w-xs shadow-[0_10px_28px_-8px_rgba(11,70,232,0.45)]"
                onClick={() => { setNewOpen(true); setImportOpen(false); }}
                disabled={creating}
              >
                <FilePlus weight="bold" /> {t.newResumeCta}
              </Button>
              <button
                type="button"
                onClick={() => { setImportOpen((v) => !v); setNewOpen(false); }}
                className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0B46E8] transition hover:text-[#0B1227]"
              >
                <UploadSimple weight="bold" className="h-4 w-4" /> {t.importCta}
              </button>
            </div>

            <ul className="mx-auto mt-8 flex max-w-sm flex-col gap-2.5 text-left">
              {t.heroBullets.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-[13.5px] text-[#4E5968]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden /> {b}
                </li>
              ))}
            </ul>
            </>
            ) : null}
          </div>
        </div>
        {/* 카드 영역 — 회색 배경으로 히어로와 구분 */}
        {(loadingResumes || drafts.length > 0 || (!resumesOnly && coverLetters.length > 0) || newOpen || importOpen || clImportOpen) ? (
        <div className="flex-1 bg-[#F7F9FB]">
        <div className="container flex max-w-xl flex-col gap-12 px-4 py-8 sm:px-5">
        {/* 새 이력서 — 이름 입력 */}
        {newOpen ? (
          <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="text-[14px] font-bold text-[#0B1227]">{t.newNameTitle}</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">{t.newNameDesc}</p>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void startNew("chat");
              }}
              placeholder={t.newNamePlaceholder}
              maxLength={120}
              autoFocus
              className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] focus:border-[#0B46E8] focus:outline-none"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button variant="hero" size="lg" className="flex-1" onClick={() => void startNew("chat")} disabled={creating}>
                {creating ? <CircleNotch className="animate-spin" weight="bold" /> : <MagicWand weight="fill" />}
                {t.startSimple}
              </Button>
              <Button variant="outline" size="lg" className="flex-1" onClick={() => void startNew("form")} disabled={creating}>
                <PencilSimpleLine weight="bold" />
                {t.buildDetailed}
              </Button>
            </div>
            <p className="mt-4 text-[12px] text-muted-foreground">{t.startSimpleHint}</p>
          </div>
        ) : null}


        {/* 작성 중인 이력서 — 이어서 작성 (홈에선 맨 위, order-1) */}
        {loadingResumes ? (
          <p className="mx-auto inline-flex w-full items-center justify-center gap-2 text-[13px] text-muted-foreground">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.loading}
          </p>
        ) : drafts.length > 0 ? (
          <div>
            {/* 헤더 — 카드 밖 섹션 라벨 + 액션 */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1.5">
              <span className="text-[20px] font-bold tracking-[-0.01em] text-[#191F28]">{t.draftsTitle}</span>
              <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setNewOpen(true); setImportOpen(false); }}
                    disabled={creating}
                    className="inline-flex items-center gap-1 rounded-full bg-[#0B46E8] px-3 py-1.5 text-[12.5px] font-bold text-white transition active:scale-95 disabled:opacity-60"
                  >
                    <Plus weight="bold" className="h-3.5 w-3.5" /> {t.newResumeCta}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setImportOpen((v) => !v); setNewOpen(false); }}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:text-[#0B46E8] active:scale-95"
                  >
                    <UploadSimple weight="bold" className="h-3.5 w-3.5" /> {t.editExistingCta}
                  </button>
                </div>
            </div>
            <div className="rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]">
              <ul className="space-y-1">
                {drafts.map((d) => {
                  const dpct = computeResumeProgress(d.content, getBuilderState(d)).percent;
                  return (
                  <li key={d.id} className="flex items-center rounded-2xl transition hover:bg-[#F2F4F6] active:bg-[#F2F4F6]">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveResumeId(d.id);
                        if (pick) router.push(`/resume-maker/${d.id}/${pick.tool}`);
                        else router.push(builderContinuePath(d.id, d));
                      }}
                      className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16.5px] font-bold text-[#191F28]">{d.title || t.untitledResume}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#8B95A1]">
                          <span className="font-semibold text-[#4E5968]">{t.completion} {dpct}%</span>
                          <span>· {formatDateTime(d.updatedAt)}</span>
                        </span>
                      </span>
                    </button>
                    {!pick ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(d.id)}
                        aria-label={t.deleteResume}
                        className="mr-1 flex shrink-0 items-center justify-center rounded-full p-2.5 text-[#C9CDD2] transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash className="h-[18px] w-[18px]" weight="bold" />
                      </button>
                    ) : (
                      <CaretRight weight="bold" className="mr-2 h-4 w-4 shrink-0 text-[#C9CDD2]" />
                    )}
                  </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}

        {/* 기존 이력서 가져오기 — 이력서 섹션 아래로 펼쳐지는 PDF 업로드 패널 */}
        {importOpen ? (
          <FileImportPanel
            title={t.importTitle}
            desc={t.importDesc}
            uploadLabel={t.uploadPdf}
            uploadHint={t.uploadPdfHint}
            runLabel={t.importAi}
            readingLabel={t.importReading}
            disclaimer={t.importDisclaimer}
            removeLabel={t.removeFile}
            cancelLabel={t.cancel}
            feature="import_resume"
            file={importFile}
            busy={importing}
            onPick={onPickFile}
            onRemove={() => setImportFile(null)}
            onRun={() => void handleImport()}
            onCancel={() => { setImportOpen(false); setImportFile(null); }}
          />
        ) : null}

        {/* 나의 자기소개서 — 이력서 목록과 동일한 카드 리스트(이력서 탭에선 숨김) */}
        {!resumesOnly && coverLetters.length > 0 ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1.5">
              <span className="text-[20px] font-bold tracking-[-0.01em] text-[#191F28]">{cl.draftsTitle}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push("/resume-maker/cover-letters?new=1")}
                  className="inline-flex items-center gap-1 rounded-full bg-[#0B46E8] px-3 py-1.5 text-[12.5px] font-bold text-white transition active:scale-95"
                >
                  <Plus weight="bold" className="h-3.5 w-3.5" /> {cl.newCta}
                </button>
                <button
                  type="button"
                  onClick={() => { setClImportOpen((v) => !v); setClImportFile(null); }}
                  className="inline-flex items-center gap-1 rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12.5px] font-bold text-[#4E5968] transition hover:text-[#0B46E8] active:scale-95"
                >
                  <UploadSimple weight="bold" className="h-3.5 w-3.5" /> {cl.importCta}
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]">
              <ul className="space-y-1">
                {coverLetters.map((x) => {
                  const done = x.items.filter((it) => it.answer.trim()).length;
                  return (
                    <li key={x.id} className="flex items-center rounded-2xl transition hover:bg-[#F2F4F6] active:bg-[#F2F4F6]">
                      <button
                        type="button"
                        onClick={() => router.push(`/resume-maker/cover-letters/${x.id}`)}
                        className="flex flex-1 items-center gap-3 px-3 py-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16.5px] font-bold text-[#191F28]">{x.title || cl.untitled}</span>
                          <span className="mt-0.5 flex items-center gap-1.5 text-[13px] text-[#8B95A1]">
                            <span className="font-semibold text-[#4E5968]">{cl.answeredCount(done, x.items.length)}</span>
                            <span>· {formatDateTime(x.updatedAt)}</span>
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteClId(x.id)}
                        aria-label={cl.remove}
                        className="mr-1 flex shrink-0 items-center justify-center rounded-full p-2.5 text-[#C9CDD2] transition hover:bg-rose-50 hover:text-rose-500"
                      >
                        <Trash className="h-[18px] w-[18px]" weight="bold" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ) : null}

        {/* 기존 자기소개서 가져오기 — 자소서 섹션 아래로 펼쳐지는 PDF 업로드 패널 */}
        {clImportOpen ? (
          <FileImportPanel
            title={cl.importTitle}
            desc={cl.importDesc}
            uploadLabel={cl.importPick}
            runLabel={cl.importRun}
            readingLabel={cl.importReading}
            disclaimer={cl.importDisclaimer}
            removeLabel={cl.removeFile}
            cancelLabel={cl.cancel}
            feature="import_cover_letter"
            file={clImportFile}
            busy={clImporting}
            onPick={onPickClFile}
            onRemove={() => setClImportFile(null)}
            onRun={() => void handleClImport()}
            onCancel={() => { setClImportOpen(false); setClImportFile(null); }}
          />
        ) : null}
        </div>
        </div>
        ) : null}

        {/* 삭제 확인 팝업 */}
        {confirmDeleteId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => (deleting ? null : setConfirmDeleteId(null))}>
            <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
              <p className="text-[15px] font-bold text-[#0B1227]">{t.deleteConfirmTitle}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{t.deleteConfirmDesc}</p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
                  {t.cancel}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => void handleDelete()} disabled={deleting}>
                  {deleting ? <CircleNotch className="animate-spin" weight="bold" /> : null}
                  {t.delete}
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {/* 자기소개서 삭제 확인 */}
        {confirmDeleteClId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => setConfirmDeleteClId(null)}>
            <div className="w-full max-w-xs rounded-2xl bg-card p-5 text-center shadow-elevated" onClick={(e) => e.stopPropagation()}>
              <p className="text-[15px] font-bold text-[#191F28]">{cl.deleteConfirm}</p>
              <div className="mt-5 flex gap-2">
                <Button variant="ghost" size="lg" className="flex-1" onClick={() => setConfirmDeleteClId(null)}>
                  {cl.cancel}
                </Button>
                <Button variant="destructive" size="lg" className="flex-1" onClick={() => void handleDeleteCl()}>
                  {cl.remove}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </ResumeMakerShell>
  );
}
