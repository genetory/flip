"use client";

// 면접 준비 — 예상 질문과 답변 정리(연습). 이력서/지원이 준비되면 질문을 제공한다.
import { useState } from "react";
import { CaretDown, ChatsCircle } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TCard, TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import type { TalentSnapshot } from "../../../lib/talent/types";

// 스냅샷을 바탕으로 예상 질문을 구성(mock).
function buildQuestions(s: TalentSnapshot): string[] {
  const base = [
    "간단하게 자기소개를 해주세요.",
    "이 직무에 지원한 이유는 무엇인가요?",
    "본인의 가장 큰 강점은 무엇인가요?"
  ];
  const fromExp = s.experiences[0]
    ? `${s.experiences[0].title} 경험에서 가장 어려웠던 점과 해결 방법을 알려주세요.`
    : null;
  const fromRole = s.profile.interests[0] ? `${s.profile.interests[0]} 직무에서 가장 중요한 역량은 무엇이라고 생각하나요?` : null;
  return [...base, fromExp, fromRole, "입사 후 이루고 싶은 목표가 있나요?"].filter(Boolean) as string[];
}

export function InterviewsScreen() {
  const { snapshot, status, reload } = useTalentSnapshot();
  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot ? <Content snapshot={snapshot} /> : null}
    </CareerLayout>
  );
}

function Content({ snapshot }: { snapshot: TalentSnapshot }) {
  const ready = snapshot.resumes.length > 0 || snapshot.applications.some((a) => a.status !== "interested");
  const questions = buildQuestions(snapshot);
  return (
    <div className="flex flex-col gap-5">
      <TPageHeader title="면접 준비" description="예상 질문에 미리 답을 정리해두면 면접이 한결 편해져요." />

      {!ready ? (
        <TEmpty
          icon="💬"
          title="면접 준비는 조금 뒤에 시작해요"
          description="이력서를 완성하고 공고에 지원하면 맞춤 예상 질문을 준비해드려요."
          action={<TalentButton href={talentAppRoutes.resumes} variant="soft" size="md">먼저 이력서 만들기</TalentButton>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((q, i) => (
            <QuestionItem key={q} index={i + 1} question={q} />
          ))}
        </div>
      )}
    </div>
  );
}

function QuestionItem({ index, question }: { index: number; question: string }) {
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState("");
  return (
    <TCard className="overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex w-full items-center gap-3 px-5 py-4 text-left">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">{index}</span>
        <span className="min-w-0 flex-1 break-keep text-[14.5px] font-semibold text-[#191F28]">{question}</span>
        <CaretDown className={`h-4 w-4 shrink-0 text-[#B0B8C1] transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="border-t border-[#F2F4F6] px-5 py-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="핵심 경험을 예시로 답변을 정리해보세요."
            rows={4}
            className="w-full resize-none rounded-xl border border-[#E5E8EB] bg-[#FAFBFC] px-3.5 py-3 text-[14px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:bg-white"
          />
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#8B95A1]">
            <ChatsCircle className="h-3.5 w-3.5" />
            경험 → 행동 → 결과 순으로 답하면 좋아요.
          </div>
        </div>
      ) : null}
    </TCard>
  );
}
