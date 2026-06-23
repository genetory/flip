"use client";

import Link from "next/link";

import { useStepNavCopy } from "../../lib/resume-maker-i18n/step-nav";

// resume-maker 단계 내비 — 시작/경험/편집/미리보기를 자유롭게 오갈 수 있게.
// 모든 단계는 빌더 상태(content.builder)를 공유하므로 어느 순서로 들러도 안전.

export type ResumeMakerStep = "onboarding" | "experiences" | "edit" | "preview";

const STEPS: { key: ResumeMakerStep; suffix: string }[] = [
  { key: "onboarding", suffix: "onboarding" },
  { key: "experiences", suffix: "experiences" },
  { key: "edit", suffix: "edit" },
  { key: "preview", suffix: "preview" }
];

export function ResumeMakerStepNav({ resumeId, active }: { resumeId: string; active: ResumeMakerStep }) {
  const t = useStepNavCopy();
  return (
    <div className="bg-background/95 backdrop-blur">
      <div className="container flex max-w-5xl gap-1 overflow-x-auto px-5 py-3.5">
        {STEPS.map((s, i) => {
          const isActive = s.key === active;
          return (
            <Link
              key={s.key}
              href={`/resume-maker/${resumeId}/${s.suffix}`}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                isActive ? "bg-primary/10 text-[#0B46E8]" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className={`text-[11px] ${isActive ? "text-[#0B46E8]" : "text-muted-foreground/60"}`}>{i + 1}</span>
              {t[s.key]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
