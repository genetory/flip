"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CaretDown, Check, FilePlus, FileText, ListBullets } from "@phosphor-icons/react/dist/ssr";
import { getMyResumes, type Resume } from "../../lib/member-profile-client";
import { isResumeMakerDraft } from "../../lib/resume-maker-client";
import { setActiveResumeId } from "../../lib/resume-maker-active";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

// 헤더 '현재 이력서' 전환기 — 편집·공고 맞춤·모의 면접이 공유하는 현재 이력서를 보여주고,
// 드롭다운에서 다른 이력서로 바꾸면 '같은 도구'를 새 이력서로 다시 연다(경로의 id만 교체).
export function ResumeActiveSwitcher({ currentTitle }: { currentTitle: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const t = useToolPickerCopy();
  const [open, setOpen] = useState(false);
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const currentId = pathname.match(/^\/resume-maker\/([^/]+)/)?.[1] ?? null;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && resumes === null) {
      void (async () => {
        try {
          const list = await getMyResumes();
          setResumes(list.filter(isResumeMakerDraft).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)));
        } catch {
          setResumes([]);
        }
      })();
    }
  }

  function switchTo(id: string) {
    setOpen(false);
    if (id === currentId) return;
    setActiveResumeId(id);
    // 같은 '도구'(편집·경험·공고 맞춤·모의 면접)를 새 이력서로 다시 연다. 깊은 하위
    // id(예: 경험 id)는 다른 이력서에 없으므로 상위 도구 경로까지만 가져간다.
    const sub = pathname.match(/^\/resume-maker\/[^/]+\/(edit|experiences|tailor|interview)/)?.[1] ?? "edit";
    router.push(`/resume-maker/${id}/${sub}`);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex max-w-[60vw] items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] text-muted-foreground transition hover:bg-muted"
      >
        <FileText className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="bold" aria-hidden />
        <span className="truncate font-semibold text-foreground">{currentTitle || t.untitled}</span>
        <CaretDown className="h-3.5 w-3.5 shrink-0" weight="bold" aria-hidden />
      </button>

      {open ? (
        <>
          <button type="button" aria-hidden className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-50 mt-1 w-64 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
            <ul className="max-h-64 overflow-y-auto py-1">
              {resumes === null ? (
                <li className="px-3 py-2 text-[12.5px] text-muted-foreground">···</li>
              ) : (
                resumes.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => switchTo(r.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] transition hover:bg-muted"
                    >
                      {r.id === currentId ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-[#0B46E8]" weight="bold" aria-hidden />
                      ) : (
                        <span className="h-3.5 w-3.5 shrink-0" />
                      )}
                      <span className="truncate font-medium text-foreground">{r.title || t.untitled}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="border-t border-border/60">
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/resume-maker"); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-muted-foreground transition hover:bg-muted"
              >
                <ListBullets className="h-3.5 w-3.5" weight="bold" aria-hidden /> {t.resumeList}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/resume-maker?new=1"); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] font-medium text-[#0B46E8] transition hover:bg-muted"
              >
                <FilePlus className="h-3.5 w-3.5" weight="bold" aria-hidden /> {t.newResume}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
