"use client";

// 처음 시작하기 = "나를 알아가는" 자기 발견 페이지(공개).
// 한 번에 한 질문 → 관심 직무 → 경험 → 결과(강점·관심 직무·경험) → 다음 행동으로 연결.
import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, ArrowLeft, Check, Sparkle } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { TalentButton } from "./TalentButton";
import { TProgressBar, TChip } from "./ui/primitives";
import {
  discoveryQuestions,
  discoveryJobCards,
  discoveryExperienceItems,
  discoveryCopy
} from "../../lib/talent/discovery-content";

type JobPref = "like" | "maybe" | "no";

export function TalentDiscoveryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthSession();
  const isTalentUser = isAuthenticated && (user?.role === "STUDENT" || user?.role === "OPERATOR");

  const Q = discoveryQuestions.length;
  const TOTAL = Q + 3; // intro + 질문Q + 직무 + 경험 + 결과
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [jobPrefs, setJobPrefs] = useState<Record<string, JobPref>>({});
  const [experiences, setExperiences] = useState<string[]>([]);

  const isIntro = step === 0;
  const isJobs = step === Q + 1;
  const isExp = step === Q + 2;
  const isResult = step === Q + 3;
  const currentQuestion = step >= 1 && step <= Q ? discoveryQuestions[step - 1] : null;

  const strengths = useMemo(() => {
    const tally: Record<string, number> = {};
    for (const q of discoveryQuestions) {
      const idx = answers[q.key];
      if (idx == null) continue;
      for (const s of q.options[idx].strengths) tally[s] = (tally[s] ?? 0) + 1;
    }
    return Object.entries(tally)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s);
  }, [answers]);

  const interests = discoveryJobCards.filter((c) => jobPrefs[c.key] === "like");

  const progress = Math.round((Math.min(step, TOTAL) / TOTAL) * 100);
  const canNextQuestion = currentQuestion ? answers[currentQuestion.key] != null : true;

  function toggleExp(item: string) {
    setExperiences((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* 포커스 헤더 */}
      <header className="sticky top-0 z-10 border-b border-[#EEF1F5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3">
          {step > 0 && !isResult ? (
            <button type="button" aria-label="이전" onClick={() => setStep((s) => Math.max(0, s - 1))} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link href="/talent" aria-label="APLY 홈" className="flex items-center">
              <Image src="/img_logo.webp" alt="APLY" width={64} height={22} className="h-[18px] w-auto" priority />
            </Link>
          )}
          <div className="flex-1">
            <TProgressBar value={isResult ? 100 : progress} />
          </div>
          <button type="button" aria-label="나가기" onClick={() => router.push("/talent")} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 py-10">
        {/* 인트로 */}
        {isIntro ? (
          <div className="flex flex-1 flex-col justify-center text-center">
            <p className="text-[14px] font-bold text-[#0B46E8]">{discoveryCopy.intro.eyebrow}</p>
            <h1 className="mt-4 whitespace-pre-line text-[30px] font-black leading-[1.25] tracking-[-0.03em] text-[#0B1227] md:text-[36px]">
              {discoveryCopy.intro.title}
            </h1>
            <p className="mx-auto mt-5 max-w-sm whitespace-pre-line break-keep text-[16px] leading-[1.65] text-[#4E5968]">
              {discoveryCopy.intro.desc}
            </p>
            <div className="mx-auto mt-10 w-full max-w-xs">
              <TalentButton onClick={() => setStep(1)} variant="primary" size="lg" fullWidth aria-label={discoveryCopy.intro.cta}>
                {discoveryCopy.intro.cta}
              </TalentButton>
            </div>
            <p className="mt-4 text-[13px] text-[#8B95A1]">{discoveryCopy.intro.time}</p>
          </div>
        ) : null}

        {/* 자기 발견 질문 */}
        {currentQuestion ? (
          <div className="flex flex-1 flex-col">
            <p className="text-[13px] font-bold text-[#0B46E8]">{step} / {Q}</p>
            <h2 className="mt-2 break-keep text-[22px] font-black leading-[1.35] tracking-[-0.02em] text-[#0B1227] md:text-[26px]">
              {currentQuestion.question}
            </h2>
            {currentQuestion.helper ? <p className="mt-2 text-[14px] text-[#8B95A1]">{currentQuestion.helper}</p> : null}
            <div className="mt-8 flex flex-col gap-2.5">
              {currentQuestion.options.map((opt, i) => {
                const active = answers[currentQuestion.key] === i;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [currentQuestion.key]: i }))}
                    aria-pressed={active}
                    className={`flex items-center justify-between rounded-2xl border px-5 py-4 text-left text-[15px] font-semibold transition ${
                      active ? "border-[#0B46E8] bg-[#F5F8FF] text-[#0B46E8]" : "border-[#E5E8EB] bg-white text-[#191F28] hover:border-[#D7DCE3]"
                    }`}
                  >
                    {opt.label}
                    {active ? <Check className="h-5 w-5 shrink-0" weight="bold" /> : null}
                  </button>
                );
              })}
            </div>
            <div className="mt-auto pt-8">
              <TalentButton onClick={() => setStep((s) => s + 1)} disabled={!canNextQuestion} variant="primary" size="lg" fullWidth aria-label="다음">
                다음
              </TalentButton>
            </div>
          </div>
        ) : null}

        {/* 관심 직무 카드 */}
        {isJobs ? (
          <div className="flex flex-1 flex-col">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{discoveryCopy.jobStep.title}</h2>
            <p className="mt-2 text-[14px] text-[#8B95A1]">{discoveryCopy.jobStep.helper}</p>
            <div className="mt-7 flex flex-col gap-3">
              {discoveryJobCards.map((card) => {
                const pref = jobPrefs[card.key];
                return (
                  <div key={card.key} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F8FF] text-[20px]" aria-hidden>{card.emoji}</span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-[#191F28]">{card.title}</p>
                        <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{card.fit}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1.5">
                      {(
                        [
                          ["like", discoveryCopy.jobStep.like],
                          ["maybe", discoveryCopy.jobStep.maybe],
                          ["no", discoveryCopy.jobStep.no]
                        ] as [JobPref, string][]
                      ).map(([value, label]) => {
                        const on = pref === value;
                        const tone = value === "like" ? "bg-[#0B46E8] text-white" : value === "no" ? "bg-[#F2F4F6] text-[#8B95A1]" : "bg-[#EDF1FD] text-[#0B46E8]";
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setJobPrefs((p) => ({ ...p, [card.key]: value }))}
                            aria-pressed={on}
                            className={`h-9 rounded-lg text-[12.5px] font-bold transition ${on ? tone : "bg-white text-[#B0B8C1] ring-1 ring-inset ring-[#EEF1F5]"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-auto pt-8">
              <TalentButton onClick={() => setStep((s) => s + 1)} variant="primary" size="lg" fullWidth aria-label="다음">다음</TalentButton>
            </div>
          </div>
        ) : null}

        {/* 경험 체크리스트 */}
        {isExp ? (
          <div className="flex flex-1 flex-col">
            <h2 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{discoveryCopy.expStep.title}</h2>
            <p className="mt-2 break-keep text-[14px] text-[#8B95A1]">{discoveryCopy.expStep.helper}</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {discoveryExperienceItems.map((item) => {
                const on = experiences.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleExp(item)}
                    aria-pressed={on}
                    className={`rounded-full px-4 py-2.5 text-[14px] font-semibold transition ${on ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968]"}`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            <div className="mt-auto pt-8">
              <TalentButton onClick={() => setStep((s) => s + 1)} variant="primary" size="lg" fullWidth aria-label="결과 보기">결과 보기</TalentButton>
            </div>
          </div>
        ) : null}

        {/* 결과 = 나 소개 카드 */}
        {isResult ? (
          <div className="flex flex-1 flex-col">
            <div className="flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-[#0B46E8]" weight="fill" />
              <p className="text-[13px] font-bold text-[#0B46E8]">{discoveryCopy.result.eyebrow}</p>
            </div>
            <h2 className="mt-3 text-[24px] font-black leading-[1.3] tracking-[-0.02em] text-[#0B1227] md:text-[28px]">
              {isTalentUser ? `${user?.realName || user?.name || "당신"}님은 이런 분이에요` : "당신은 이런 분이에요"}
            </h2>

            <div className="mt-6 flex flex-col gap-4">
              <ResultBlock title={discoveryCopy.result.strengthTitle}>
                {strengths.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {strengths.map((s) => (
                      <TChip key={s} tone="lime">{s}</TChip>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13.5px] text-[#8B95A1]">질문에 답하면 강점을 찾아드려요.</p>
                )}
              </ResultBlock>

              <ResultBlock title={discoveryCopy.result.interestTitle}>
                {interests.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {interests.map((c) => (
                      <TChip key={c.key} tone="blue">{c.title}</TChip>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13.5px] text-[#8B95A1]">{discoveryCopy.result.noInterest}</p>
                )}
              </ResultBlock>

              <ResultBlock title={discoveryCopy.result.experienceTitle}>
                {experiences.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {experiences.map((e) => (
                      <TChip key={e}>{e}</TChip>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13.5px] text-[#8B95A1]">{discoveryCopy.result.noExperience}</p>
                )}
              </ResultBlock>
            </div>

            {/* 다음 행동 */}
            <div className="mt-8 flex flex-col gap-2.5">
              {isTalentUser ? (
                <>
                  <TalentButton href="/talent/career/resumes" variant="primary" size="lg" fullWidth aria-label="이 강점으로 첫 이력서 만들기">
                    이 강점으로 첫 이력서 만들기
                  </TalentButton>
                  <TalentButton href="/talent/jobs" variant="secondary" size="lg" fullWidth aria-label="관심 직무 공고 보기">
                    관심 직무 공고 보기
                  </TalentButton>
                </>
              ) : (
                <>
                  <TalentButton href="/talent/signup" variant="primary" size="lg" fullWidth aria-label="가입하고 저장하기">
                    가입하고 저장하기
                  </TalentButton>
                  <TalentButton href="/positions" variant="secondary" size="lg" fullWidth aria-label="채용공고 먼저 둘러보기">
                    채용공고 먼저 둘러보기
                  </TalentButton>
                </>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function ResultBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <p className="mb-2.5 text-[13px] font-bold text-[#8B95A1]">{title}</p>
      {children}
    </div>
  );
}
