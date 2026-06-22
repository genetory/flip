"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ClockCounterClockwise, FilePlus, MagicWand, PencilSimpleLine, CircleNotch, Trash, UploadSimple, FilePdf, X } from "@phosphor-icons/react/dist/ssr";
import { ResumeMakerShell } from "./ResumeMakerShell";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { paperlogy } from "../../lib/fonts";
import { deleteMyResume, getMyResumes, type Resume } from "../../lib/member-profile-client";
import { builderContinuePath, createDraftResume, createResumeFromImport, importResume, isResumeMakerDraft } from "../../lib/resume-maker-client";
import { trackResumeBuilderStarted, trackResumeBuilderViewed } from "../../lib/analytics";

const HERO_BULLETS = [
  "경험이 없어도 질문으로 찾아드려요",
  "10분 안에 첫 이력서 초안을 만들 수 있어요",
  "완성한 이력서는 PDF로 다운로드할 수 있어요"
];

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

export function ResumeMakerLandingPage() {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
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
      reader.onerror = () => reject(new Error("파일을 읽지 못했어요."));
      reader.readAsDataURL(file);
    });
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 12 * 1024 * 1024) {
      toast.error("파일이 너무 커요. 12MB 이하 PDF를 올려주세요.");
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
      toast.error("PDF 파일을 올리거나 이력서 내용을 붙여넣어 주세요.");
      return;
    }
    setImporting(true);
    try {
      const input = hasFile ? { pdfBase64: await readFileAsDataUrl(importFile as File) } : { text: importText.trim() };
      const imported = await importResume(input);
      const nowIso = new Date().toISOString();
      const title = newName.trim() || (imported.basicName ? `${imported.basicName} 이력서` : "가져온 이력서");
      const draft = await createResumeFromImport(title, imported, nowIso);
      trackResumeBuilderStarted("import");
      router.push(`/resume-maker/${draft.id}/edit`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "이력서를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
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
      toast.error(err instanceof Error ? err.message : "삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
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
      const title = newName.trim() || "내 이력서";
      const draft = await createDraftResume(title);
      trackResumeBuilderStarted("new");
      router.push(mode === "chat" ? `/resume-maker/${draft.id}/chat?section=basic` : `/resume-maker/${draft.id}/onboarding`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "이력서를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setCreating(false);
    }
  }

  return (
    <ResumeMakerShell>
      <section className="container max-w-3xl px-5 py-16 md:py-24">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-[12px] font-bold text-[#0B46E8]">
            <MagicWand className="h-3.5 w-3.5" weight="fill" aria-hidden />
            AI 이력서 만들기
          </span>
          <h1 className={`${paperlogy.className} mt-5 text-3xl font-black leading-[1.2] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
            이력서를 쓰지 말고,
            <br />
            질문에 답하세요.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground md:text-base">
            AI가 내 경험을 찾아 지원 가능한 이력서로 만들어드립니다.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button variant="hero" size="xl" onClick={() => { setNewOpen(true); setImportOpen(false); }} disabled={creating}>
              <FilePlus weight="bold" />
              새 이력서 만들기
            </Button>
            <button
              type="button"
              onClick={() => { setImportOpen((v) => !v); setNewOpen(false); }}
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0B46E8] transition hover:text-[#0B1227]"
            >
              <UploadSimple weight="bold" className="h-4 w-4" />
              이미 만든 이력서가 있나요? 파일로 가져오기
            </button>
          </div>
          <ul className="mx-auto mt-8 flex max-w-md flex-col gap-2 text-left">
            {HERO_BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[13.5px] text-muted-foreground">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#0B46E8]" weight="bold" aria-hidden />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* 새 이력서 — 이름 입력 */}
        {newOpen ? (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="text-[14px] font-bold text-[#0B1227]">이력서 이름을 정해주세요</p>
            <p className="mt-1 text-[12.5px] text-muted-foreground">나중에 ‘작성 중인 이력서’ 목록에서 구분하기 쉬워요.</p>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void startNew("chat");
              }}
              placeholder="예: 마케팅 신입 이력서"
              maxLength={120}
              autoFocus
              className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-[14px] focus:border-primary focus:outline-none"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button variant="hero" size="lg" className="flex-1" onClick={() => void startNew("chat")} disabled={creating}>
                {creating ? <CircleNotch className="animate-spin" weight="bold" /> : <MagicWand weight="fill" />}
                AI와 대화로 시작
              </Button>
              <Button variant="outline" size="lg" className="flex-1" onClick={() => void startNew("form")} disabled={creating}>
                <PencilSimpleLine weight="bold" />
                직접 폼으로 시작
              </Button>
            </div>
            <p className="mt-4 text-[12px] text-muted-foreground">막막하면 ‘대화로 시작’ — AI가 하나씩 물어보고 채워드려요.</p>
          </div>
        ) : null}

        {/* 기존 이력서 가져오기 — PDF 업로드 또는 내용 붙여넣기 → AI 구조화 */}
        {importOpen ? (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-border bg-card p-5 shadow-card">
            <p className="text-[14px] font-bold text-[#0B1227]">기존 이력서 가져오기</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              PDF를 올리거나 내용을 붙여넣으면 AI가 읽어서 자동으로 채워드려요. 가져온 뒤 편집 화면에서 다듬을 수 있어요.
            </p>

            {/* PDF 업로드 */}
            {importFile ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-primary/40 bg-primary/5 px-4 py-3">
                <span className="flex min-w-0 items-center gap-2">
                  <FilePdf weight="fill" className="h-5 w-5 shrink-0 text-[#0B46E8]" />
                  <span className="truncate text-[13.5px] font-medium text-foreground">{importFile.name}</span>
                </span>
                <button type="button" onClick={() => setImportFile(null)} aria-label="파일 제거" className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted">
                  <X weight="bold" className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center transition hover:border-primary/50 hover:bg-primary/5">
                <UploadSimple weight="bold" className="h-6 w-6 text-[#0B46E8]" />
                <span className="text-[13.5px] font-semibold text-foreground">PDF 파일 올리기</span>
                <span className="text-[12px] text-muted-foreground">텍스트가 들어 있는 PDF만 가능해요 (스캔본 제외)</span>
                <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onPickFile} />
              </label>
            )}

            <div className="my-4 flex items-center gap-3 text-[12px] text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              또는 내용 붙여넣기
              <span className="h-px flex-1 bg-border" />
            </div>

            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="이력서 내용을 붙여넣어 주세요. (이름·연락처·경력·학력·자기소개 등)"
              rows={5}
              disabled={Boolean(importFile)}
              className="w-full resize-y rounded-xl border border-border bg-white px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:bg-muted/40"
            />

            <Button variant="hero" size="lg" className="mt-3 w-full" onClick={() => void handleImport()} disabled={importing}>
              {importing ? <CircleNotch className="animate-spin" weight="bold" /> : <MagicWand weight="fill" />}
              {importing ? "내용을 읽는 중..." : "AI로 가져오기"}
            </Button>
            <p className="mt-3 text-[12px] text-muted-foreground">정확하지 않을 수 있어요 — 가져온 뒤 꼭 확인하고 다듬어 주세요.</p>
          </div>
        ) : null}

        {/* 작성 중인 이력서 — 이어서 작성 */}
        {loadingResumes ? (
          <p className="mx-auto mt-12 inline-flex w-full items-center justify-center gap-2 text-[13px] text-muted-foreground">
            <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> 불러오는 중...
          </p>
        ) : drafts.length > 0 ? (
          <div className="mx-auto mt-12 max-w-xl">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-[#0B1227]">
              <ClockCounterClockwise className="h-4 w-4 text-[#0B46E8]" weight="bold" aria-hidden />
              작성 중인 이력서
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {drafts.map((d) => (
                <li key={d.id} className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(builderContinuePath(d.id, d))}
                    className="flex flex-1 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left shadow-card transition hover:border-primary/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold text-foreground">{d.title || "제목 없는 이력서"}</span>
                      <span className="text-[12px] text-muted-foreground">마지막 수정 · {formatDateTime(d.updatedAt)}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-[#0B46E8]">
                      이어서 작성 <ArrowRight className="h-3.5 w-3.5" weight="bold" aria-hidden />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(d.id)}
                    aria-label="이력서 삭제"
                    className="flex shrink-0 items-center justify-center rounded-xl border border-border bg-card px-6 text-destructive transition hover:border-destructive/40 hover:bg-destructive/5"
                  >
                    <Trash className="h-[18px] w-[18px]" weight="bold" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* 삭제 확인 팝업 */}
        {confirmDeleteId ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5" onClick={() => (deleting ? null : setConfirmDeleteId(null))}>
            <div className="w-full max-w-sm rounded-2xl bg-card p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
              <p className="text-[15px] font-bold text-[#0B1227]">이력서를 삭제할까요?</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">삭제하면 작성 중인 내용을 되돌릴 수 없어요.</p>
              <div className="mt-5 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteId(null)} disabled={deleting}>
                  취소
                </Button>
                <Button variant="destructive" size="sm" onClick={() => void handleDelete()} disabled={deleting}>
                  {deleting ? <CircleNotch className="animate-spin" weight="bold" /> : null}
                  삭제
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </ResumeMakerShell>
  );
}
