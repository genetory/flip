"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSectionNavCopy } from "../../lib/resume-maker-i18n/section-nav";
import { useProgressLevelLabel } from "../../lib/resume-maker-i18n/labels";

// resume-maker 통합 워크스페이스의 섹션 메뉴 — 기본 정보·자기소개·경험·진단·디자인을
// 같은 레벨 카테고리로 오간다. 경험은 별도 화면(/experiences), 나머지는 /edit?section=.
// 모든 섹션에서 우측 미리보기는 동일하게 유지된다.

export type ResumeSection =
  | "all"
  | "basic"
  | "intro"
  | "education"
  | "experiences"
  | "awards"
  | "skills"
  | "languages"
  | "links"
  | "diagnosis"
  | "tailor"
  | "interview"
  | "design";

const SECTIONS: { key: ResumeSection; labelKey: "basic" | "intro" | "experiences" | "education" | "awards" | "skills" | "languages" | "links" | "diagnosis" | "tailor" | "interview" | "design"; href: (id: string) => string }[] = [
  { key: "basic", labelKey: "basic", href: (id) => `/resume-maker/${id}/edit?section=basic` },
  { key: "intro", labelKey: "intro", href: (id) => `/resume-maker/${id}/edit?section=intro` },
  { key: "experiences", labelKey: "experiences", href: (id) => `/resume-maker/${id}/experiences` },
  { key: "education", labelKey: "education", href: (id) => `/resume-maker/${id}/edit?section=education` },
  { key: "awards", labelKey: "awards", href: (id) => `/resume-maker/${id}/edit?section=awards` },
  { key: "skills", labelKey: "skills", href: (id) => `/resume-maker/${id}/edit?section=skills` },
  { key: "languages", labelKey: "languages", href: (id) => `/resume-maker/${id}/edit?section=languages` },
  { key: "links", labelKey: "links", href: (id) => `/resume-maker/${id}/edit?section=links` },
  { key: "diagnosis", labelKey: "diagnosis", href: (id) => `/resume-maker/${id}/edit?section=diagnosis` },
  { key: "design", labelKey: "design", href: (id) => `/resume-maker/${id}/edit?section=design` }
];

export function ResumeSectionNav({
  resumeId,
  active,
  progress,
  done,
  orientation = "horizontal"
}: {
  resumeId: string;
  active: ResumeSection;
  progress?: { percent: number; level: { key: "seed" | "growing" | "strong" | "done"; label: string; emoji: string } };
  done?: Partial<Record<ResumeSection, boolean>>;
  // "horizontal" = 가로 바(기본). "rail" = 데스크탑 세로 리스트, 모바일은 가로로 접힘.
  orientation?: "horizontal" | "rail";
}) {
  const t = useSectionNavCopy();
  const levelLabel = useProgressLevelLabel();
  const navRef = useRef<HTMLDivElement>(null);
  const rail = orientation === "rail";

  // 활성 탭을 가로 스크롤 가운데로 (컨테이너만 스크롤, 페이지 세로 스크롤은 그대로).
  // rail 모드의 데스크탑(세로)에서는 스크롤이 없으므로 사실상 무동작.
  useEffect(() => {
    const c = navRef.current;
    if (!c) return;
    const el = c.querySelector<HTMLElement>('[data-active="true"]');
    if (!el) return;
    const cRect = c.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const delta = elRect.left + elRect.width / 2 - (cRect.left + cRect.width / 2);
    c.scrollTo({ left: c.scrollLeft + delta, behavior: "smooth" });
  }, [active]);

  return (
    <div>
      {progress ? (
        <div className="mb-3">
          {rail ? (
            // 좁은 레일 — 줄을 나눠 글자가 잘리지 않게.
            <>
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[12px] font-bold text-[#191F28]">{t.completion}</span>
                <span className="text-[13px] font-bold text-[#0B46E8]">{progress.percent}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
                <div className="h-full rounded-full bg-[#0B46E8] transition-[width] duration-500" style={{ width: `${progress.percent}%` }} />
              </div>
              <p className="mt-1.5 truncate text-[11px] text-[#8B95A1]">
                {progress.level.emoji} {levelLabel(progress.level.key)}
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-bold text-[#191F28]">
                  {progress.level.emoji} {t.resumeCompletion} · {levelLabel(progress.level.key)}
                </span>
                <span className="font-semibold text-[#0B46E8]">{progress.percent}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
                <div className="h-full rounded-full bg-[#0B46E8] transition-[width] duration-500" style={{ width: `${progress.percent}%` }} />
              </div>
            </>
          )}
        </div>
      ) : null}
      <div
        ref={navRef}
        className={
          rail
            ? "mb-5 flex items-center gap-1 overflow-x-auto border-b border-[#F2F4F6] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:mb-0 lg:flex-col lg:items-stretch lg:gap-0.5 lg:overflow-visible lg:border-b-0 lg:pb-0"
            : "mb-5 flex items-center gap-1 overflow-x-auto border-b border-[#F2F4F6] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        }
      >
        {SECTIONS.map((s) => {
          const isActive = s.key === active;
          const isDone = done?.[s.key];
          return (
            <Link
              key={s.key}
              data-active={isActive ? "true" : undefined}
              href={s.href(resumeId)}
              className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-4 text-[13.5px] font-semibold transition ${
                rail ? "lg:h-auto lg:min-h-[2.25rem] lg:w-full lg:justify-start lg:whitespace-normal lg:rounded-xl lg:px-3 lg:py-1.5 lg:text-[13px] lg:leading-tight" : ""
              } ${isActive ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F2F4F6] hover:text-[#191F28]"}`}
            >
              {t[s.labelKey]}
              {isDone ? <span className="h-1.5 w-1.5 rounded-full bg-[#15C47E]" aria-label={t.done} /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
