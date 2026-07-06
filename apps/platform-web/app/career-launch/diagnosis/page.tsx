"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, SectionTitle } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

// Week 1 — 취업 준비 상태 자가진단(프로그램 안). 이력서가 없는 시점이라
// 이력서 진단이 아니라, 준비 상태를 점검해 방향을 잡아주는 문항형 진단.
// (지금은 로컬 채점 목업. 이후 실제 진단 로직/저장 연동)

type Choice = { label: string; score: number };
type Question = { id: string; q: string; help: string; choices: Choice[] };

const QUESTIONS: Question[] = [
  {
    id: "direction",
    q: "지원하고 싶은 직무 방향이 정해졌나요?",
    help: "구체적일수록 이력서 준비가 빨라져요.",
    choices: [
      { label: "아직 잘 모르겠어요", score: 0 },
      { label: "대략 생각은 있어요", score: 1 },
      { label: "명확하게 정해졌어요", score: 2 }
    ]
  },
  {
    id: "resume",
    q: "이력서를 준비해본 적 있나요?",
    help: "이번 프로그램에서 함께 완성할 거예요.",
    choices: [
      { label: "아직 없어요", score: 0 },
      { label: "초안 정도는 있어요", score: 1 },
      { label: "완성본이 있어요", score: 2 }
    ]
  },
  {
    id: "korean",
    q: "한국어로 업무 소통이 가능한가요?",
    help: "직무에 따라 필요 수준이 달라요.",
    choices: [
      { label: "기초 수준이에요", score: 0 },
      { label: "일상 대화는 가능해요", score: 1 },
      { label: "업무 소통이 가능해요", score: 2 }
    ]
  },
  {
    id: "experience",
    q: "직무 관련 경험(인턴·프로젝트)이 있나요?",
    help: "이력서에 담을 재료가 돼요.",
    choices: [
      { label: "아직 없어요", score: 0 },
      { label: "1~2개 있어요", score: 1 },
      { label: "3개 이상 있어요", score: 2 }
    ]
  },
  {
    id: "visa",
    q: "한국에서 근무 가능한 비자 상태인가요?",
    help: "취업 비자 전환 계획도 포함해요.",
    choices: [
      { label: "준비가 필요해요", score: 0 },
      { label: "확인 중이에요", score: 1 },
      { label: "근무 가능해요", score: 2 }
    ]
  }
];

const MAX = QUESTIONS.length * 2;

// 낮게 답한 항목별 보완 코멘트.
const TIP: Record<string, string> = {
  direction: "먼저 직무 방향을 좁혀보세요. 다음 단계의 AI 직무 추천이 도움돼요.",
  resume: "2주차에 프로그램 안에서 이력서를 처음부터 함께 만들어요. 걱정 없어요.",
  korean: "직무별 요구 한국어 수준을 확인하고, 부족하면 학습 계획을 세워보세요.",
  experience: "작은 프로젝트·활동도 경험이 돼요. 떠오르는 걸 미리 메모해두세요.",
  visa: "비자 전환 요건을 미리 확인해 두면 지원 단계에서 막히지 않아요."
};

export default function LaunchDiagnosisPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;

  const total = useMemo(() => Object.values(answers).reduce((n, v) => n + v, 0), [answers]);
  const percent = Math.round((total / MAX) * 100);
  const level = percent >= 75 ? "탄탄해요" : percent >= 45 ? "무난해요" : "이제 시작이에요";
  const weakAreas = QUESTIONS.filter((q) => (answers[q.id] ?? 0) <= 1);

  // 결과를 저장해 대시보드에서 확인할 수 있게 한다(스텝을 강제로 잇지 않는다).
  const submit = () => {
    try {
      window.localStorage.setItem("career-launch:diagnosis", JSON.stringify({ percent, level }));
    } catch {
      // 저장 불가 시에도 결과 화면은 보여준다
    }
    setSubmitted(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-2xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← 대시보드
          </Link>

          <div className="mt-3 rounded-2xl border border-[#CFE0FF] bg-[#EDF1FD] p-5 md:p-6">
            <p className="text-[12.5px] font-bold text-[#0B46E8]">취업 준비 상태 자가진단</p>
            <h1 className="mt-1.5 text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">
              지금 내 준비 상태를 점검해봐요
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968]">
              5개 문항에 답하면 준비도와 이번 주에 집중할 방향을 알려드려요.
            </p>
          </div>

          {!submitted ? (
            <>
              <div className="mt-7 space-y-4">
                {QUESTIONS.map((question, i) => (
                  <Card key={question.id} className="md:!p-6">
                    <p className="text-[15px] font-bold text-[#191F28]">
                      <span className="text-[#0B46E8]">Q{i + 1}.</span> {question.q}
                    </p>
                    <p className="mt-1 text-[12.5px] text-[#8B95A1]">{question.help}</p>
                    <div className="mt-3 grid gap-2">
                      {question.choices.map((c) => {
                        const active = answers[question.id] === c.score;
                        return (
                          <button
                            key={c.label}
                            type="button"
                            onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: c.score }))}
                            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-[14px] font-medium transition ${
                              active
                                ? "border-[#0B46E8] bg-[#EDF1FD] text-[#0B46E8]"
                                : "border-[#E5E8EB] bg-white text-[#333D4B] hover:border-[#0B46E8]/40"
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 text-[11px] font-black ${
                                active ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#C9CDD2] text-transparent"
                              }`}
                            >
                              ✓
                            </span>
                            {c.label}
                          </button>
                        );
                      })}
                    </div>
                  </Card>
                ))}
              </div>

              <button
                type="button"
                disabled={!allAnswered}
                onClick={submit}
                className={`mt-6 flex w-full items-center justify-center rounded-xl py-3.5 text-[14.5px] font-bold transition ${
                  allAnswered ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                }`}
              >
                {allAnswered ? "진단 결과 보기" : `${answeredCount}/${QUESTIONS.length} 문항 응답`}
              </button>
            </>
          ) : (
            <>
              {/* 결과 */}
              <div className="mt-7">
                <Card className="text-center md:!p-7">
                  <p className="text-[13px] font-semibold text-[#8B95A1]">나의 취업 준비도</p>
                  <p className="mt-1 text-[44px] font-black leading-none text-[#0B46E8]">
                    {percent}
                    <span className="text-[22px]">%</span>
                  </p>
                  <p className="mt-2 text-[14px] font-bold text-[#191F28]">준비 상태가 {level}</p>
                </Card>
              </div>

              <div className="mt-6">
                <SectionTitle sub="이번 주에 이 부분을 채워두면 좋아요">집중하면 좋은 부분</SectionTitle>
                {weakAreas.length > 0 ? (
                  <div className="space-y-2.5">
                    {weakAreas.map((q) => (
                      <Card key={q.id} className="flex gap-3 !p-4">
                        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[#FFF4E5] text-[14px]">💡</span>
                        <div>
                          <p className="text-[13.5px] font-bold text-[#191F28]">{q.q.replace(/\?$/, "")}</p>
                          <p className="mt-0.5 text-[13px] leading-relaxed text-[#4E5968]">{TIP[q.id]}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="!p-4 text-[13.5px] text-[#4E5968]">
                    준비가 잘 되어 있어요! 바로 직무를 정하고 이력서로 넘어가도 좋아요. 👍
                  </Card>
                )}
              </div>

              <div className="mt-7 flex flex-col gap-2.5">
                <Link
                  href="/career-launch/dashboard"
                  className="flex items-center justify-center rounded-xl bg-[#0B46E8] py-3.5 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  대시보드에서 확인하기 →
                </Link>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="flex items-center justify-center rounded-xl border border-[#D7DCE3] bg-white py-3 text-[13.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40"
                >
                  다시 진단하기
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
