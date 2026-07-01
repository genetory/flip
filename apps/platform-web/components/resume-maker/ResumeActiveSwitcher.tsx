"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CaretDown, Check, FilePlus, FileText, ListBullets } from "@phosphor-icons/react/dist/ssr";
import { getMyResumes, type Resume } from "../../lib/member-profile-client";
import { deriveBuilderState } from "../../lib/resume-maker-client";
import { computeResumeProgress } from "../../lib/resume-maker-progress";
import { setActiveResumeId } from "../../lib/resume-maker-active";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";

// 화면 전환 시 깜빡임 방지용 제목 캐시(id→title). 모듈 스코프라 SPA 내비게이션 동안 유지된다.
// 각 페이지가 제목을 비동기로 다시 불러오는 사이, 이전에 알던 제목을 바로 보여 준다.
const TITLE_CACHE = new Map<string, string>();

// 헤더 '현재 이력서' 전환기 — 편집·공고 맞춤·모의 면접이 공유하는 현재 이력서를 보여주고,
// 드롭다운에서 다른 이력서로 바꾸면 '같은 도구'를 새 이력서로 다시 연다(경로의 id만 교체).
export function ResumeActiveSwitcher({ currentTitle }: { currentTitle: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const t = useToolPickerCopy();
  const [open, setOpen] = useState(false);
  const [resumes, setResumes] = useState<Resume[] | null>(null);
  const currentId = pathname.match(/^\/resume-maker\/([^/]+)/)?.[1] ?? null;

  // 알게 된 제목은 캐시에 저장해 다음 화면 전환 때 즉시 보여 준다(깜빡임 방지).
  useEffect(() => {
    if (currentId && currentTitle) TITLE_CACHE.set(currentId, currentTitle);
  }, [currentId, currentTitle]);
  // 현재 제목이 아직 안 들어왔으면 캐시값으로 대체, 그것도 없을 때만 '제목 없음'.
  const displayTitle = currentTitle || (currentId ? TITLE_CACHE.get(currentId) : "") || t.untitled;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && resumes === null) {
      void (async () => {
        try {
          const drafts = (await getMyResumes()).slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
          drafts.forEach((r) => TITLE_CACHE.set(r.id, r.title)); // 목록 로드 시 제목 캐시 채우기
          setResumes(drafts);
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
      {/* 트리거 — '현재 이력서' 흰 pill + 명확한 '변경' 어포던스 */}
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex max-w-[60vw] items-center gap-2 rounded-full border border-[#F2F4F6] bg-white px-2.5 py-1.5 shadow-card transition hover:border-[#0B46E8]/30"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD]">
          <FileText className="h-3.5 w-3.5 text-[#0B46E8]" weight="fill" aria-hidden />
        </span>
        <span className="truncate text-[13px] font-bold text-[#191F28]">{displayTitle}</span>
        <span className="ml-0.5 inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-bold text-[#0B46E8]">
          {t.change}
          <CaretDown className={`h-3 w-3 transition ${open ? "rotate-180" : ""}`} weight="bold" aria-hidden />
        </span>
      </button>

      {open ? (
        <>
          <button type="button" aria-hidden className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#F2F4F6] bg-white shadow-elevated">
            <div className="border-b border-[#F2F4F6] px-4 py-3">
              <p className="text-[13px] font-bold text-[#191F28]">{t.switchResume}</p>
            </div>
            <ul className="max-h-72 overflow-y-auto p-1.5">
              {resumes === null ? (
                <li className="px-3 py-6 text-center text-[12.5px] text-[#8B95A1]">···</li>
              ) : (
                resumes.map((r) => {
                  const isCur = r.id === currentId;
                  const pct = computeResumeProgress(r.content, deriveBuilderState(r)).percent;
                  const ini = (r.title || t.untitled).trim().charAt(0).toUpperCase();
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => switchTo(r.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                          isCur ? "bg-[#EDF1FD]" : "hover:bg-[#F2F4F6]"
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[13px] font-bold text-[#0B46E8]">
                          {ini}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-bold text-[#191F28]">{r.title || t.untitled}</span>
                          <span className="mt-0.5 block text-[11.5px] text-[#8B95A1]">
                            {t.completion} {pct}%
                          </span>
                        </span>
                        {isCur ? <Check className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="bold" aria-hidden /> : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="border-t border-[#F2F4F6] p-1.5">
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/resume-maker"); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold text-[#4E5968] transition hover:bg-[#F2F4F6]"
              >
                <ListBullets className="h-4 w-4 shrink-0" weight="bold" aria-hidden /> {t.resumeList}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/resume-maker?new=1"); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
              >
                <FilePlus className="h-4 w-4 shrink-0" weight="bold" aria-hidden /> {t.newResume}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
