"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CaretDown, Check, FilePlus, FileText, ListBullets } from "@phosphor-icons/react/dist/ssr";
import { getMyCoverLetters, type CoverLetter } from "../../lib/cover-letter-client";
import { useToolPickerCopy } from "../../lib/resume-maker-i18n/tool-picker";
import { useCoverLetterCopy } from "../../lib/resume-maker-i18n/cover-letter";

// 깜빡임 방지용 제목 캐시(id→title). 이력서 전환기와 동일 패턴.
const TITLE_CACHE = new Map<string, string>();

// 헤더 '현재 자기소개서' 전환기 — 이력서 ResumeActiveSwitcher 와 동일한 UI/UX.
// 드롭다운에서 다른 자기소개서로 바꾸면 그 자소서 편집기로 이동한다.
export function CoverLetterActiveSwitcher({ currentTitle }: { currentTitle: string }) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const t = useToolPickerCopy();
  const c = useCoverLetterCopy();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<CoverLetter[] | null>(null);
  const currentId = pathname.match(/^\/resume-maker\/cover-letters\/([^/]+)/)?.[1] ?? null;

  useEffect(() => {
    if (currentId && currentTitle) TITLE_CACHE.set(currentId, currentTitle);
  }, [currentId, currentTitle]);
  const displayTitle = currentTitle || (currentId ? TITLE_CACHE.get(currentId) : "") || c.untitled;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && list === null) {
      void (async () => {
        try {
          const cls = await getMyCoverLetters();
          cls.forEach((x) => TITLE_CACHE.set(x.id, x.title));
          setList(cls);
        } catch {
          setList([]);
        }
      })();
    }
  }

  function switchTo(id: string) {
    setOpen(false);
    if (id === currentId) return;
    router.push(`/resume-maker/cover-letters/${id}`);
  }

  return (
    <div className="relative">
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
              <p className="text-[13px] font-bold text-[#191F28]">{c.switchTitle}</p>
            </div>
            <ul className="max-h-72 overflow-y-auto p-1.5">
              {list === null ? (
                <li className="px-3 py-6 text-center text-[12.5px] text-[#8B95A1]">···</li>
              ) : (
                list.map((x) => {
                  const isCur = x.id === currentId;
                  const done = x.items.filter((it) => it.answer.trim()).length;
                  const ini = (x.title || c.untitled).trim().charAt(0).toUpperCase();
                  return (
                    <li key={x.id}>
                      <button
                        type="button"
                        onClick={() => switchTo(x.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition ${
                          isCur ? "bg-[#EDF1FD]" : "hover:bg-[#F2F4F6]"
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[13px] font-bold text-[#0B46E8]">{ini}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] font-bold text-[#191F28]">{x.title || c.untitled}</span>
                          <span className="mt-0.5 block text-[11.5px] text-[#8B95A1]">{c.answeredCount(done, x.items.length)}</span>
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
                onClick={() => { setOpen(false); router.push("/resume-maker/cover-letters"); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-semibold text-[#4E5968] transition hover:bg-[#F2F4F6]"
              >
                <ListBullets className="h-4 w-4 shrink-0" weight="bold" aria-hidden /> {c.goList}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/resume-maker/cover-letters?new=1"); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
              >
                <FilePlus className="h-4 w-4 shrink-0" weight="bold" aria-hidden /> {c.newCta}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
