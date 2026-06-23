"use client";

import { CaretRight, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import type { ResumeCoachData } from "../../lib/member-profile-client";
import { useDiagnosisResultCopy } from "../../lib/resume-maker-i18n/diagnosis-result";

// 진단 결과 표시 — 에디터의 진단 탭과 AI 진단 진입 화면이 함께 쓰는 공용 뷰.
// 점수/레벨 강조 + 카테고리별 액션 카드(클릭 시 해당 섹션으로 이동).
const LEVEL_CLS: Record<string, string> = {
  submittable: "bg-emerald-100 text-emerald-800",
  needs_polish: "bg-amber-100 text-amber-800",
  not_submittable: "bg-rose-100 text-rose-800"
};

export function ResumeDiagnosisResult({
  coach,
  loading,
  onReload,
  onGoto
}: {
  coach: ResumeCoachData | null;
  loading: boolean;
  onReload: () => void;
  onGoto: (targetSection: string) => void;
}) {
  const t = useDiagnosisResultCopy();
  if (loading && !coach) {
    return (
      <div className="mt-10 flex items-center justify-center text-muted-foreground">
        <span className="inline-flex items-center gap-2 text-sm">
          <CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t.diagnosing}
        </span>
      </div>
    );
  }
  if (!coach) {
    return (
      <div className="mt-10 text-center">
        <p className="text-[13.5px] text-muted-foreground">{t.loadFailed}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onReload}>
          {t.retry}
        </Button>
      </div>
    );
  }
  const levelCls = LEVEL_CLS[coach.score.level] ?? LEVEL_CLS.needs_polish;
  const levelLabel =
    coach.score.level === "submittable"
      ? t.levelSubmittable
      : coach.score.level === "not_submittable"
        ? t.levelNotSubmittable
        : t.levelNeedsPolish;
  const groups: { key: "required" | "recommended" | "optional"; label: string }[] = [
    { key: "required", label: t.groupRequired },
    { key: "recommended", label: t.groupRecommended },
    { key: "optional", label: t.groupOptional }
  ];
  return (
    <div className="mt-5">
      {/* 상태 메시지 강조 */}
      <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-card">
        <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-bold ${levelCls}`}>{levelLabel}</span>
        <div className="mt-3 flex items-center justify-center gap-6 text-[12px] text-muted-foreground">
          <span>{t.qualityScore(Math.round(coach.score.quality.total))}</span>
          <span>{t.readinessScore(Math.round(coach.score.readiness.total))}</span>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {groups.map((g) => {
          const items = coach.actions.filter((a) => a.category === g.key);
          if (items.length === 0) return null;
          return (
            <div key={g.key}>
              <p className="text-[12px] font-bold text-muted-foreground">{g.label}</p>
              <div className="mt-2 space-y-2">
                {items.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onGoto(a.targetSection)}
                    className="flex w-full items-start justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary/40"
                  >
                    <span>
                      <span className="block text-[13.5px] font-semibold text-[#0B1227]">{a.title}</span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">{a.description}</span>
                    </span>
                    <CaretRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" weight="bold" aria-hidden />
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-center text-[11.5px] text-muted-foreground">{t.disclaimer}</p>
    </div>
  );
}
