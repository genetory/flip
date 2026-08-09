"use client";

// Talent 온보딩 — 한 번에 하나의 질문만. 끝나면 결과가 아니라 첫 작업으로 연결한다.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { markOnboardingSeen } from "../../../lib/talent/onboarding-state";
import { X, ArrowLeft, Check } from "@phosphor-icons/react";
import { TalentGuard } from "../app/TalentGuard";
import { TProgressBar } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { onboardingGoals, onboardingSteps } from "../../../lib/talent/labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import type { OnboardingGoal } from "../../../lib/talent/types";

// 목표별 첫 작업 연결.
const goalDestination: Record<OnboardingGoal, { href: string; label: string }> = {
  explore: { href: talentAppRoutes.career, label: "커리어 여정 시작하기" },
  resume: { href: talentAppRoutes.resumes, label: "첫 이력서 만들기" },
  cover: { href: talentAppRoutes.coverLetters, label: "자기소개서 시작하기" },
  jobs: { href: talentAppRoutes.jobs, label: "맞는 공고 찾아보기" },
  interview: { href: talentAppRoutes.interviews, label: "면접 준비 시작하기" }
};

export function OnboardingScreen() {
  return (
    <TalentGuard>
      <OnboardingFlow />
    </TalentGuard>
  );
}

function OnboardingFlow() {
  const router = useRouter();
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);
  const [step, setStep] = useState(0); // 0 = 목표 질문, 1..N = 최소 질문, N+1 = 완료
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const totalSteps = onboardingSteps.length + 1; // 목표 + 최소 질문
  const isGoalStep = step === 0;
  const isDone = step > onboardingSteps.length;
  const currentQuestion = !isGoalStep && !isDone ? onboardingSteps[step - 1] : null;
  const progress = useMemo(() => Math.round((Math.min(step, totalSteps) / totalSteps) * 100), [step, totalSteps]);

  const dest = goal ? goalDestination[goal] : goalDestination.explore;

  // 완료 화면에 도달하면 온보딩을 봤다고 계정에 기록(웰컴 카드 다시 안 뜸).
  useEffect(() => {
    if (isDone) markOnboardingSeen();
  }, [isDone]);

  function next() {
    setStep((s) => s + 1);
  }
  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 상단: 진행도 + 나가기 */}
      <header className="sticky top-0 z-10 border-b border-[#EEF1F5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          {step > 0 && !isDone ? (
            <button type="button" aria-label="이전" onClick={back} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="w-8" />
          )}
          <div className="flex-1">
            <TProgressBar value={isDone ? 100 : progress} />
          </div>
          <button
            type="button"
            aria-label="나가기"
            onClick={() => router.push(talentAppRoutes.home)}
            className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10">
        {isGoalStep ? (
          <Question
            title="지금 취업 준비에서 가장 필요한 것은 무엇인가요?"
            options={onboardingGoals.map((g) => g.label)}
            selected={goal ? onboardingGoals.find((g) => g.value === goal)?.label ?? null : null}
            onSelect={(label) => {
              const found = onboardingGoals.find((g) => g.label === label);
              if (found) setGoal(found.value);
            }}
            onNext={goal ? next : undefined}
          />
        ) : null}

        {currentQuestion ? (
          <Question
            key={currentQuestion.key}
            title={currentQuestion.question}
            helper={currentQuestion.helper}
            options={currentQuestion.options}
            selected={answers[currentQuestion.key] ?? null}
            onSelect={(label) => setAnswers((a) => ({ ...a, [currentQuestion.key]: label }))}
            onNext={answers[currentQuestion.key] ? next : undefined}
            onSkip={currentQuestion.allowSkip ? next : undefined}
          />
        ) : null}

        {isDone ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAFFD1]">
              <Check className="h-8 w-8 text-[#3A6B00]" weight="bold" />
            </span>
            <h1 className="mt-6 text-[24px] font-black tracking-[-0.02em] text-[#0B1227]">준비됐어요!</h1>
            <p className="mt-3 break-keep text-[15px] leading-relaxed text-[#4E5968]">
              이제 첫 작업을 시작해볼까요?
              <br />답변을 바탕으로 딱 맞는 단계로 안내할게요.
            </p>
            <div className="mt-8 w-full max-w-xs">
              <TalentButton href={dest.href} variant="primary" size="lg" fullWidth aria-label={dest.label}>
                {dest.label}
              </TalentButton>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Question({
  title,
  helper,
  options,
  selected,
  onSelect,
  onNext,
  onSkip
}: {
  title: string;
  helper?: string;
  options: string[];
  selected: string | null;
  onSelect: (label: string) => void;
  onNext?: () => void;
  onSkip?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="text-[22px] font-black leading-[1.35] tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{title}</h1>
      {helper ? <p className="mt-2 text-[14px] text-[#8B95A1]">{helper}</p> : null}

      <div className="mt-8 flex flex-col gap-2.5">
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelect(opt)}
              aria-pressed={active}
              className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left text-[15px] font-semibold transition ${
                active ? "border-[#0B46E8] bg-[#F5F8FF] text-[#0B46E8]" : "border-[#E5E8EB] bg-white text-[#191F28] hover:border-[#D7DCE3]"
              }`}
            >
              {opt}
              {active ? <Check className="h-5 w-5" weight="bold" /> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <TalentButton onClick={onNext} disabled={!onNext} variant="primary" size="lg" fullWidth aria-label="다음">
          다음
        </TalentButton>
        {onSkip ? (
          <button type="button" onClick={onSkip} className="py-2 text-[13.5px] font-semibold text-[#8B95A1] hover:text-[#4E5968]">
            건너뛰기
          </button>
        ) : null}
      </div>
    </div>
  );
}
