"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

// resume-maker 통합 워크스페이스의 섹션 메뉴 — 기본 정보·자기소개·경험·진단·디자인을
// 같은 레벨 카테고리로 오간다. 경험은 별도 화면(/experiences), 나머지는 /edit?section=.
// 모든 섹션에서 우측 미리보기는 동일하게 유지된다.

export type ResumeSection =
  | "basic"
  | "intro"
  | "education"
  | "experiences"
  | "awards"
  | "skills"
  | "languages"
  | "links"
  | "diagnosis"
  | "design";

const SECTIONS: { key: ResumeSection; label: string; href: (id: string) => string }[] = [
  { key: "basic", label: "기본 정보", href: (id) => `/resume-maker/${id}/edit?section=basic` },
  { key: "intro", label: "자기소개", href: (id) => `/resume-maker/${id}/edit?section=intro` },
  { key: "experiences", label: "경험", href: (id) => `/resume-maker/${id}/experiences` },
  { key: "education", label: "학력", href: (id) => `/resume-maker/${id}/edit?section=education` },
  { key: "awards", label: "자격·수상", href: (id) => `/resume-maker/${id}/edit?section=awards` },
  { key: "skills", label: "스킬", href: (id) => `/resume-maker/${id}/edit?section=skills` },
  { key: "languages", label: "어학", href: (id) => `/resume-maker/${id}/edit?section=languages` },
  { key: "links", label: "링크", href: (id) => `/resume-maker/${id}/edit?section=links` },
  { key: "diagnosis", label: "진단", href: (id) => `/resume-maker/${id}/edit?section=diagnosis` },
  { key: "design", label: "디자인", href: (id) => `/resume-maker/${id}/edit?section=design` }
];

export function ResumeSectionNav({
  resumeId,
  active,
  progress,
  done
}: {
  resumeId: string;
  active: ResumeSection;
  progress?: { percent: number; level: { label: string; emoji: string } };
  done?: Partial<Record<ResumeSection, boolean>>;
}) {
  const navRef = useRef<HTMLDivElement>(null);

  // 활성 탭을 가로 스크롤 가운데로 (컨테이너만 스크롤, 페이지 세로 스크롤은 그대로).
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
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-bold text-[#0B1227]">
              {progress.level.emoji} 이력서 완성도 · {progress.level.label}
            </span>
            <span className="font-semibold text-[#0B46E8]">{progress.percent}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[#0B46E8] transition-[width] duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      ) : null}
      <div
        ref={navRef}
        className="mb-5 flex items-center gap-1 overflow-x-auto border-b border-border/60 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {SECTIONS.map((s) => {
          const isActive = s.key === active;
          const isDone = done?.[s.key];
          return (
            <Link
              key={s.key}
              data-active={isActive ? "true" : undefined}
              href={s.href(resumeId)}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                isActive ? "bg-primary/10 text-[#0B46E8]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {s.label}
              {isDone ? <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-label="작성됨" /> : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
