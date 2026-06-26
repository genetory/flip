"use client";

// 게임화 홈(토스 톤) — 다음 할 일 + 진행도 + 3단계 여정. 모두 실데이터.
// 회색 배경 위 흰 카드, 토스블루 단색 포인트, 큰 굵은 타이포, 깔끔한 리스트 행.
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CaretRight,
  ChatCircleDots,
  CheckCircle,
  LockSimple,
  Sparkle,
  Star,
  Target
} from "@phosphor-icons/react/dist/ssr";
import { useAiUsage } from "../../lib/resume-maker-ai-usage";
import { useDashboardCopy } from "../../lib/resume-maker-i18n/dashboard";
import { ResumeCompletionConfetti } from "./ResumeCompletionConfetti";
import { ResumeMakerCoachTour } from "./ResumeMakerCoachTour";

const BLUE = "#0B46E8";
const INK = "#191F28";
const SUB = "#8B95A1";

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

function Ring({ percent, size = 96 }: { percent: number; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, percent)) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDF0F3" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={BLUE}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </svg>
  );
}

// 단계 해금 기준(이력서 완성도 %).
const TAILOR_UNLOCK = 60;
const INTERVIEW_UNLOCK = 80;
const SECTION_ORDER = ["basic", "intro", "experiences", "education", "languages", "skills", "awards", "links"] as const;

export function ResumeMakerJourney({
  activeId,
  percent,
  levelLabel,
  levelEmoji,
  done
}: {
  activeId: string | null;
  percent: number;
  levelLabel: string;
  levelEmoji: string;
  done: Partial<Record<string, boolean>>;
}) {
  const t = useDashboardCopy();
  const { remaining } = useAiUsage();
  const shown = useCountUp(percent);
  const shownTickets = useCountUp(remaining ?? 0);

  const editHref = activeId ? `/resume-maker/${activeId}/edit` : "/resume-maker";
  const tailorHref = activeId ? `/resume-maker/${activeId}/tailor` : "/resume-maker/tailor";
  const interviewHref = activeId ? `/resume-maker/${activeId}/interview` : "/resume-maker/interview";
  const sectionHref = (k: string) =>
    !activeId ? "/resume-maker" : k === "experiences" ? `/resume-maker/${activeId}/experiences` : `/resume-maker/${activeId}/edit?section=${k}`;

  const firstIncomplete = SECTION_ORDER.find((k) => !done[k]) ?? null;
  const tailorLocked = percent < TAILOR_UNLOCK;
  const interviewLocked = percent < INTERVIEW_UNLOCK;

  const next =
    percent >= 100
      ? { text: t.actTailor, sub: t.msgDone, href: tailorHref }
      : firstIncomplete
        ? { text: t.fillSection(t.sec[firstIncomplete]), sub: percent >= 80 ? t.msgAlmost : t.msgKeep, href: sectionHref(firstIncomplete) }
        : { text: t.actContinue, sub: t.msgAlmost, href: editHref };

  return (
    <div className="space-y-3">
      <ResumeCompletionConfetti percent={percent} />
      <ResumeMakerCoachTour />

      {/* 인사 */}
      <div className="px-1 pb-1" style={{ animation: "rm-rise 0.45s both" }}>
        <p className="text-[14px] font-medium" style={{ color: SUB }}>{t.greetingSub}</p>
        <h1 className="mt-0.5 text-[24px] font-bold tracking-[-0.01em]" style={{ color: INK }}>{t.title}</h1>
      </div>

      {/* 다음 할 일 — 토스블루 단색 카드 */}
      <div data-tour="next" className="rounded-3xl p-6 text-white shadow-[0_10px_28px_-8px_rgba(11,70,232,0.45)]" style={{ background: BLUE, animation: "rm-rise 0.5s 0.05s both" }}>
        <p className="text-[13px] font-bold text-white/75">{t.nextTodo}</p>
        <p className="mt-2 text-[22px] font-bold leading-[1.32]">{next.text}</p>
        <p className="mt-1.5 text-[14px] text-white/75">{next.sub}</p>
        <Link
          href={next.href}
          className="mt-5 flex items-center justify-center gap-1 rounded-2xl bg-white py-3.5 text-[15px] font-bold transition active:scale-[0.99]"
          style={{ color: BLUE }}
        >
          {t.goNow} <ArrowRight weight="bold" className="h-4 w-4" />
        </Link>
      </div>

      {/* 진행도 — 링 + 티켓 */}
      <div data-tour="progress" className="rounded-3xl border border-[#F2F4F6] bg-white p-5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]" style={{ animation: "rm-rise 0.5s 0.1s both" }}>
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <Ring percent={shown} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[22px] font-bold tabular-nums" style={{ color: INK }}>{shown}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold" style={{ color: SUB }}>{t.completeness}</p>
            <p className="mt-0.5 text-[18px] font-bold" style={{ color: INK }}>
              {levelEmoji} {levelLabel}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-[#F2F4F6] pt-4">
          <span className="inline-flex items-center gap-1.5 text-[14px] font-medium" style={{ color: "#4E5968" }}>
            <Sparkle weight="fill" className="h-4 w-4" style={{ color: BLUE }} /> {t.tickets}
          </span>
          <span className="text-[16px] font-bold tabular-nums" style={{ color: INK }}>{remaining === null ? "—" : shownTickets.toLocaleString()}</span>
        </div>
      </div>

      {/* 여정 — 리스트 행 */}
      <div data-tour="journey" className="rounded-3xl border border-[#F2F4F6] bg-white p-2.5 shadow-[0_2px_12px_rgba(17,24,39,0.05)]" style={{ animation: "rm-rise 0.5s 0.15s both" }}>
        <p className="px-3 pb-1 pt-2.5 text-[15px] font-bold" style={{ color: INK }}>{t.journeyTitle}</p>
        <JourneyRow
          href={editHref}
          step={1}
          state={percent >= 80 ? "done" : "active"}
          icon={<Star weight="fill" className="h-[18px] w-[18px]" />}
          title={t.s1Title}
          desc={percent >= 100 ? t.s1Done : t.s1Pct(percent)}
          recommendLabel={t.recommendNow}
        />
        <JourneyRow
          href={tailorHref}
          step={2}
          state={tailorLocked ? "locked" : percent >= 80 ? "active" : "upcoming"}
          icon={<Target weight="fill" className="h-[18px] w-[18px]" />}
          title={t.s2Title}
          desc={t.s2Desc}
          cost={2}
          recommendLabel={t.recommendNow}
          lockHint={t.lockHint(TAILOR_UNLOCK)}
        />
        <JourneyRow
          href={interviewHref}
          step={3}
          state={interviewLocked ? "locked" : "upcoming"}
          icon={<ChatCircleDots weight="fill" className="h-[18px] w-[18px]" />}
          title={t.s3Title}
          desc={t.s3Desc}
          cost={3}
          recommendLabel={t.recommendNow}
          lockHint={t.lockHint(INTERVIEW_UNLOCK)}
        />
      </div>

      <style>{`@keyframes rm-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

function JourneyRow({
  href,
  step,
  state,
  icon,
  title,
  desc,
  cost,
  recommendLabel,
  lockHint
}: {
  href: string;
  step: number;
  state: "done" | "active" | "upcoming" | "locked";
  icon: React.ReactNode;
  title: string;
  desc: string;
  cost?: number;
  recommendLabel: string;
  lockHint?: string;
}) {
  const isActive = state === "active";
  const isDone = state === "done";
  const isLocked = state === "locked";

  const content = (
    <div className={`flex items-center gap-3.5 rounded-2xl px-3 py-3 transition ${isLocked ? "" : "active:bg-[#F2F4F6]"}`}>
      {/* 아이콘 타일 + 단계 뱃지 */}
      <div className="relative shrink-0">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full"
          style={isLocked ? { background: "#F2F4F6", color: "#C9CDD2" } : { background: "#EDF1FD", color: BLUE }}
        >
          {icon}
        </div>
        <span
          className="absolute -bottom-1 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white"
          style={
            isDone
              ? { background: "#15C47E", color: "#fff" }
              : isActive
                ? { background: BLUE, color: "#fff" }
                : { background: "#E5E8EB", color: SUB }
          }
        >
          {isDone ? <CheckCircle weight="fill" className="h-3 w-3" /> : isLocked ? <LockSimple weight="bold" className="h-2.5 w-2.5" /> : step}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[15px] font-bold" style={{ color: isLocked ? SUB : INK }}>{title}</span>
          {isActive ? (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: BLUE }}>{recommendLabel}</span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[13px]" style={{ color: SUB }}>{isLocked ? lockHint : desc}</p>
      </div>

      {isLocked ? (
        <LockSimple weight="bold" className="h-4 w-4 shrink-0" style={{ color: "#C9CDD2" }} />
      ) : (
        <div className="flex shrink-0 items-center gap-1.5">
          {cost ? (
            <span className="inline-flex items-center gap-0.5 text-[12px] font-bold" style={{ color: BLUE }}>
              <Sparkle weight="fill" className="h-3 w-3" />
              {cost}
            </span>
          ) : null}
          <CaretRight weight="bold" className="h-4 w-4" style={{ color: "#C9CDD2" }} />
        </div>
      )}
    </div>
  );

  if (isLocked) return <div className="cursor-not-allowed">{content}</div>;
  return <Link href={href}>{content}</Link>;
}
