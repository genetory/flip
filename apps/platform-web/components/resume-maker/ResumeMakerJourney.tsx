"use client";

// 게임화 홈(토스 톤) — 진행도 + '나의 커리어 퀘스트'(현재 이력서에서 채울 것들). 모두 실데이터.
// 회색 배경 위 흰 카드, aply 블루 단색 포인트, 큰 굵은 타이포.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretRight, ChatCircleDots, CheckCircle, Circle, Target } from "@phosphor-icons/react/dist/ssr";
import { useDashboardCopy } from "../../lib/resume-maker-i18n/dashboard";
import { ResumeCompletionConfetti } from "./ResumeCompletionConfetti";

const BLUE = "#0B46E8";
const INK = "#191F28";
const SUB = "#8B95A1";
const GREEN = "#15C47E";

// 0 → target 으로 부드럽게 증가하는 숫자(카운트업). easeOutCubic.
function useCountUp(target: number, durationMs = 900): number {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf = 0;
    let startTs = 0;
    const tick = (now: number) => {
      if (!startTs) startTs = now;
      const p = Math.min(1, (now - startTs) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return val;
}

// 퀘스트 = 이력서 섹션. 비어 있는 첫 섹션을 '지금 추천'으로 강조한다.
const SECTION_ORDER = ["basic", "intro", "experiences", "education", "languages", "skills", "awards", "links"] as const;

export function ResumeMakerJourney({
  activeId,
  resumeTitle,
  percent,
  levelLabel,
  levelEmoji,
  done
}: {
  activeId: string | null;
  resumeTitle: string;
  percent: number;
  levelLabel: string;
  levelEmoji: string;
  done: Partial<Record<string, boolean>>;
}) {
  const t = useDashboardCopy();
  const shown = useCountUp(percent);

  const sectionHref = (k: string) =>
    !activeId ? "/resume-maker" : k === "experiences" ? `/resume-maker/${activeId}/experiences` : `/resume-maker/${activeId}/edit?section=${k}`;
  const tailorHref = activeId ? `/resume-maker/${activeId}/tailor` : "/resume-maker/tailor";
  const interviewHref = activeId ? `/resume-maker/${activeId}/interview` : "/resume-maker/interview";

  const firstIncomplete = SECTION_ORDER.find((k) => !done[k]) ?? null;
  const doneCount = SECTION_ORDER.filter((k) => done[k]).length;
  const total = SECTION_ORDER.length;

  return (
    <div className="space-y-7">
      <ResumeCompletionConfetti percent={percent} />

      {/* 공고 맞춤 / 모의 면접 — 이력서로 도전하기(2컬럼 진입 카드) */}
      <div className="grid grid-cols-2 gap-3" style={{ animation: "rm-rise 0.5s 0.05s both" }}>
        {[
          { href: tailorHref, icon: <Target weight="fill" className="h-5 w-5" />, title: t.s2Title, desc: t.s2Desc },
          { href: interviewHref, icon: <ChatCircleDots weight="fill" className="h-5 w-5" />, title: t.s3Title, desc: t.s3Desc }
        ].map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="flex flex-col rounded-3xl border border-[#F2F4F6] bg-white p-4 shadow-[0_2px_12px_rgba(17,24,39,0.05)] transition active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "#EDF1FD", color: BLUE }}>
              {c.icon}
            </span>
            <span className="mt-3 text-[15px] font-bold" style={{ color: INK }}>{c.title}</span>
            <span className="mt-1 text-[12px] leading-relaxed" style={{ color: SUB }}>{c.desc}</span>
          </Link>
        ))}
      </div>

      {/* 진행도 — 가로 1자 프로그레스 바 */}
      <div className="rounded-3xl border border-[#F2F4F6] bg-white p-5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]" style={{ animation: "rm-rise 0.5s 0.05s both" }}>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[16px] font-bold" style={{ color: INK }}>{resumeTitle || t.completeness}</p>
            <p className="mt-0.5 text-[13px] font-medium" style={{ color: SUB }}>
              {t.completeness} · {levelEmoji} {levelLabel}
            </p>
          </div>
          <span className="shrink-0 text-[26px] font-bold leading-none tabular-nums" style={{ color: BLUE }}>{shown}%</span>
        </div>
        <div className="mt-3.5 h-2.5 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
          <div
            className="h-full rounded-full"
            style={{ width: `${shown}%`, background: BLUE, transition: "width 0.4s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </div>
      </div>

      {/* 나의 커리어 퀘스트 — 현재 이력서에서 채울 것들(섹션 체크리스트) */}
      <div style={{ animation: "rm-rise 0.5s 0.1s both" }}>
        {/* 타이틀 — '작성 중인 이력서'와 동일한 카드 밖 섹션 라벨(20px) */}
        <div className="mb-4 flex items-center justify-between gap-2 px-1">
          <span className="whitespace-nowrap text-[20px] font-bold tracking-[-0.01em]" style={{ color: INK }}>{t.questTitle}</span>
          <span className="shrink-0 text-[13px] font-bold tabular-nums" style={{ color: SUB }}>
            {doneCount}/{total} {t.questDone}
          </span>
        </div>
        <div className="rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]">
        <ul>
          {SECTION_ORDER.map((k) => {
            const isDone = Boolean(done[k]);
            const isNext = !isDone && k === firstIncomplete;
            return (
              <li key={k}>
                <Link href={sectionHref(k)} className="flex items-center gap-3 rounded-2xl px-3 py-3 transition active:bg-[#F2F4F6]">
                  {isDone ? (
                    <CheckCircle weight="fill" className="h-6 w-6 shrink-0" style={{ color: GREEN }} aria-hidden />
                  ) : (
                    <Circle weight="regular" className="h-6 w-6 shrink-0" style={{ color: "#C9CDD2" }} aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[15px] font-medium" style={{ color: isDone ? SUB : INK }}>
                    {t.sec[k]}
                  </span>
                  {isNext ? (
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold text-white" style={{ background: BLUE }}>
                      {t.recommendNow}
                    </span>
                  ) : null}
                  {isDone ? (
                    <span className="shrink-0 text-[12px] font-bold" style={{ color: GREEN }}>{t.questDone}</span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[13px] font-bold" style={{ color: BLUE }}>
                      {t.questFill}
                      <CaretRight weight="bold" className="h-3.5 w-3.5" />
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        </div>
      </div>

      <style>{`@keyframes rm-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
