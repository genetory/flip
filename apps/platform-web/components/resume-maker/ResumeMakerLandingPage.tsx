"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CaretRight, FilePlus, MagicWand, PencilSimpleLine, CircleNotch, Plus, Trash, UploadSimple, FilePdf, X } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
import { deleteMyResume, getMyResumes, type Resume } from "../../lib/member-profile-client";
import { getActiveResumeId, setActiveResumeId } from "../../lib/resume-maker-active";
import { AiTicketCost } from "./AiTicketCost";
import { ResumeMakerJourney } from "./ResumeMakerJourney";
import { builderContinuePath, createDraftResume, createResumeFromImport, getBuilderState, importResume, isResumeMakerDraft } from "../../lib/resume-maker-client";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { trackResumeBuilderStarted, trackResumeBuilderViewed } from "../../lib/analytics";
import { useLandingCopy } from "../../lib/resume-maker-i18n/landing";

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
  pick
}: {
  hero?: { badge: string; title: string; subtitle: string };
  pick?: { tool: "tailor" | "interview"; cta: string };
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const t = useLandingCopy();
  const [creating, setCreating] = useState(false);
  const [newOpen, setNewOpen] = useState(searchParams.get("new") === "1");
  const [newName, setNewName] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [drafts, setDrafts] = useState<Resume[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);

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
    const hasFile = Boolean(importFile);
    const pastedOk = importText.trim().replace(/\s+/g, "").length >= 20;
    if (!hasFile && !pastedOk) {
      toast.error(t.importNeedInput);
      return;
    }
    setImporting(true);
    try {
      const input = hasFile ? { pdfBase64: await readFileAsDataUrl(importFile as File) } : { text: importText.trim() };
      const imported = await importResume(input);
      const nowIso = new Date().toISOString();
      const title = newName.trim() || (imported.basicName ? t.importedResumeTitle(imported.basicName) : t.importedResumeFallback);
      const draft = await createResumeFromImport(title, imported, nowIso);
      trackResumeBuilderStarted("import");
      router.push(`/resume-maker/${draft.id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.importFailed);
      setImporting(false);
    }
  }

  async function handleDelete() {
    if (!confirmDeleteId || deleting) return;
    setDeleting(true);
    try {
      await deleteMyResume(confirmDeleteId);
      setDrafts((prev) => prev.filter((d) => d.id !== confirmDeleteId));
      setConfirmDeleteId(null);
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
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function startNew(mode: "chat" | "form") {
    if (creating) return;
    setCreating(true);
    try {
      const title = newName.trim() || t.newResumeFallbackTitle;
      const draft = await createDraftResume(title);
      trackResumeBuilderStarted("new");
      router.push(mode === "chat" ? `/resume-maker/${draft.id}/edit` : `/resume-maker/${draft.id}/onboarding`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.startFailed);
      setCreating(false);
    }
  }

  // 게임화 홈 — 이력서가 1개 이상이고, 도구 선택(pick)/히어로 오버라이드가 아닐 때만.
  const journeyResume =
    drafts.find((d) => d.id === getActiveResumeId()) ?? drafts.find((d) => d.isPrimary) ?? drafts[0] ?? null;
  const journeyProgress = journeyResume ? computeResumeProgress(journeyResume.content, getBuilderState(journeyResume)) : null;
  const showJourney = !hero && !pick && drafts.length > 0;

  return (
    <ResumeMakerShell>
      <section className={showJourney ? "min-h-[calc(100vh-3.5rem)] bg-white" : ""}>
        <div className={`container px-4 sm:px-5 ${showJourney ? "max-w-xl py-6" : "max-w-3xl py-16 md:py-24"}`}>
        {showJourney ? (
          <>
            <ResumeMakerJourney
              activeId={journeyResume?.id ?? null}
              percent={journeyProgress?.percent ?? 0}
              levelLabel={journeyProgress?.level.label ?? ""}
              levelEmoji={journeyProgress?.level.emoji ?? ""}
              done={journeyProgress?.done ?? {}}
            />
          </>
        ) : (
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] px-3 py-1 text-[12px] font-bold text-[#0B46E8]">
            <MagicWand className="h-3.5 w-3.5" weight="fill" aria-hidden />
            {hero?.badge ?? t.heroBadge}
          </span>
          <h1 className={`${paperlogy.className} mt-5 text-3xl font-black leading-[1.2] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
            {hero ? (
              <span className="whitespace-pre-line">{hero.title}</span>
            ) : (
              <>
                {t.heroTitleLine1}
                <br />
                {t.heroTitleLine2}
              </>
            )}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground md:text-base">
            {hero?.subtitle ?? t.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-col items-center gap-7">
            <Button variant="hero" size="xl" onClick={() => { setNewOpen(true); setImportOpen(false); }} disabled={creating}>
              <FilePlus weight="bold" />
              {t.newResumeCta}
            </Button>
            <button
              type="button"
              onClick={() => { setImportOpen((v) => !v); setNewOpen(false); }}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0B46E8] transition hover:text-[#0B1227]"
            >
              <UploadSimple weight="bold" className="h-4 w-4" />
              {t.importCta}
            </button>
          </div>
          <ul className="mx-auto mt-8 flex max-w-md flex-col gap-2 text-left">
            {t.heroBullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[13.5px] text-muted-foreground">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#0B46E8]" weight="bold" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>
        )}

        {/* 새 이력서 — 이름 입력 */}
        {newOpen ? (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card">
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

        {/* 기존 이력서 가져오기 — PDF 업로드 또는 내용 붙여넣기 → AI 구조화 */}
        {importOpen ? (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="text-[14px] font-bold text-[#0B1227]">{t.importTitle}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              {t.importDesc}
            </p>

            {/* PDF 업로드 */}
            {importFile ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#0B46E8]/40 bg-[#EDF1FD]/60 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2">
                  <FilePdf weight="fill" className="h-5 w-5 shrink-0 text-[#0B46E8]" />
                  <span className="truncate text-[13.5px] font-medium text-foreground">{importFile.name}</span>
                </span>
                <button type="button" onClick={() => setImportFile(null)} aria-label={t.removeFile} className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted">
                  <X weight="bold" className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center transition hover:border-[#0B46E8]/50 hover:bg-[#EDF1FD]">
                <UploadSimple weight="bold" className="h-6 w-6 text-[#0B46E8]" />
                <span className="text-[13.5px] font-semibold text-foreground">{t.uploadPdf}</span>
                <span className="text-[12px] text-muted-foreground">{t.uploadPdfHint}</span>
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPickFile} />
              </label>
            )}

            <div className="my-4 flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {t.orPaste}
              <span className="h-px flex-1 bg-border" />
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={t.pastePlaceholder}
              rows={5}
              disabled={Boolean(importFile)}
              className="w-full resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-[#0B46E8] focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/40"
            />

            <Button variant="hero" size="lg" className="mt-3 w-full" onClick={() => void handleImport()} disabled={importing}>
              {importing ? <CircleNotch className="animate-spin" weight="bold" /> : <MagicWand weight="fill" />}
              {importing ? t.importReading : t.importAi}
              {!importing ? <AiTicketCost feature="import_resume" tone="plain" /> : null}
            </Button>
            <p className="mt-3 text-[12px] text-muted-foreground">{t.importDisclaimer}</p>
          </div>
        ) : null}

        {/* 작성 중인 이력서 — 이어서 작성 */}
        {loadingResumes ? (
          <p className="mx-auto mt-12 inline-flex w-full items-center justify-center gap-2 text-[13px] text-muted-foreground">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.loading}
          </p>
        ) : drafts.length > 0 ? (
          <div className={`mt-3 ${showJourney ? "" : "mx-auto max-w-xl"}`}>
            <div className="rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]">
              <div className="flex items-center justify-between gap-2 px-3 pb-1.5 pt-2.5">
                <span className="text-[15px] font-bold text-[#191F28]">{t.draftsTitle}</span>
                {showJourney ? (
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
                      aria-label={t.importTitle}
                      title={t.importTitle}
                      className="inline-flex items-center justify-center rounded-full bg-[#F2F4F6] p-2 text-[#4E5968] transition hover:text-[#0B46E8]"
                    >
                      <UploadSimple weight="bold" className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
              <ul>
                {drafts.map((d) => (
                  <li key={d.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (pick) {
                          setActiveResumeId(d.id);
                          router.push(`/resume-maker/${d.id}/${pick.tool}`);
                        } else {
                          router.push(builderContinuePath(d.id, d));
                        }
                      }}
                      className="flex flex-1 items-center gap-3 rounded-2xl px-3 py-3 text-left transition active:bg-[#F2F4F6]"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#EDF1FD] text-[15px] font-bold text-[#0B46E8]">
                        {(d.title || "?").trim().charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-bold text-[#191F28]">{d.title || t.untitledResume}</span>
                        <span className="text-[13px] text-[#8B95A1]">{t.lastEdited} · {formatDateTime(d.updatedAt)}</span>
                      </span>
                      <CaretRight weight="bold" className="h-4 w-4 shrink-0 text-[#C9CDD2]" />
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
                    ) : null}
                  </li>
                ))}
              </ul>
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
        </div>
      </section>
    </ResumeMakerShell>
  );
}
