"use client";

// 자기소개서 — 기본 / 공고 맞춤 두 유형. 빈 편집기 대신 질문에 답하는 흐름을 먼저 제공한다.
import { useState } from "react";
import { Plus, X, ArrowLeft, PenNib, CheckCircle } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { ProfileGate } from "../career/ProfileGate";
import { TCard, TChip, TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { tailoredCoverQuestions } from "../../../lib/talent/labels";
import type { CoverLetter, CoverLetterType, TalentSnapshot } from "../../../lib/talent/types";

const basicQuestions = [
  "나를 한 문장으로 소개한다면?",
  "가장 자신 있는 강점은 무엇인가요?",
  "앞으로 어떤 일을 하고 싶나요?"
];

export function CoverLettersScreen() {
  const { snapshot, status, reload } = useTalentSnapshot();
  const ready = isBasicInfoComplete(useBasicInfo());
  const [choosing, setChoosing] = useState(false);
  const [flowType, setFlowType] = useState<CoverLetterType | null>(null);

  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot && !ready ? <ProfileGate /> : null}

      {status === "ready" && snapshot && ready ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <TPageHeader title="자기소개서" description="질문에 답하다 보면 막막한 자기소개서도 하나씩 채워져요." />
            {snapshot.coverLetters.length === 0 ? (
              <TalentButton onClick={() => setChoosing(true)} variant="primary" size="md" aria-label="자기소개서 시작">
                <Plus className="h-4 w-4" weight="bold" /> 새로 쓰기
              </TalentButton>
            ) : null}
          </div>

          {snapshot.coverLetters.length === 0 ? (
            <TEmpty
              icon="📝"
              title="아직 자기소개서가 없어요"
              description="기본 자기소개서부터 시작하거나, 지원할 공고에 맞춰 작성할 수 있어요."
              action={<TalentButton onClick={() => setChoosing(true)} variant="soft" size="md">자기소개서 시작하기</TalentButton>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {snapshot.coverLetters.map((c) => (
                <CoverRow key={c.id} cover={c} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {choosing ? (
        <TypeChooser
          onClose={() => setChoosing(false)}
          onPick={(t) => {
            setChoosing(false);
            setFlowType(t);
          }}
        />
      ) : null}

      {flowType && snapshot ? (
        <CoverFlow type={flowType} snapshot={snapshot} onClose={() => setFlowType(null)} />
      ) : null}
    </CareerLayout>
  );
}

function CoverRow({ cover }: { cover: CoverLetter }) {
  return (
    <TCard className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD]">
        <PenNib className="h-5 w-5 text-[#0B46E8]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-[#191F28]">{cover.title}</p>
        <p className="mt-1 text-[12.5px] text-[#8B95A1]">{cover.type === "tailored" ? "공고 맞춤" : "기본"} · 수정 {cover.updatedAt}</p>
      </div>
      <TChip tone={cover.status === "ready" ? "lime" : "blue"}>{cover.status === "ready" ? "완성" : "작성 중"}</TChip>
    </TCard>
  );
}

function TypeChooser({ onClose, onPick }: { onClose: () => void; onPick: (t: CoverLetterType) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-black text-[#0B1227]">어떤 자기소개서를 쓸까요?</h2>
          <button type="button" aria-label="닫기" onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex flex-col gap-2.5">
          <button type="button" onClick={() => onPick("basic")} className="rounded-2xl border border-[#E5E8EB] bg-white p-4 text-left transition hover:border-[#0B46E8]">
            <p className="text-[15px] font-bold text-[#191F28]">기본 자기소개서</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">나를 소개하는 기본 문장을 먼저 만들어요.</p>
          </button>
          <button type="button" onClick={() => onPick("tailored")} className="rounded-2xl border border-[#E5E8EB] bg-white p-4 text-left transition hover:border-[#0B46E8]">
            <p className="text-[15px] font-bold text-[#191F28]">공고 맞춤 자기소개서</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">지원할 공고에 맞춰 문항별로 작성해요.</p>
          </button>
        </div>
      </div>
    </div>
  );
}

function CoverFlow({ type, snapshot, onClose }: { type: CoverLetterType; snapshot: TalentSnapshot; onClose: () => void }) {
  const questions = type === "tailored" ? tailoredCoverQuestions : basicQuestions;
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(questions.map(() => ""));
  const [done, setDone] = useState(false);

  const isLast = step === questions.length - 1;

  function setAnswer(v: string) {
    setAnswers((a) => a.map((x, i) => (i === step ? v : x)));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="sticky top-0 border-b border-[#EEF1F5] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {step > 0 && !done ? (
            <button type="button" aria-label="이전" onClick={() => setStep((s) => s - 1)} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="w-8" />
          )}
          <p className="flex-1 text-center text-[13.5px] font-bold text-[#191F28]">{type === "tailored" ? "공고 맞춤 자기소개서" : "기본 자기소개서"}</p>
          <button type="button" aria-label="닫기" onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 py-8">
        {done ? (
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAFFD1]">
              <CheckCircle className="h-8 w-8 text-[#3A6B00]" weight="fill" />
            </span>
            <h2 className="mt-5 text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">초안이 완성됐어요</h2>
            <p className="mt-2 text-[14px] text-[#4E5968]">답변을 바탕으로 자기소개서 초안을 만들었어요. 이어서 다듬을 수 있어요.</p>
            <TCard className="mt-6 w-full p-5 text-left">
              {questions.map((qq, i) => (
                <div key={qq} className="border-b border-[#F2F4F6] py-3 last:border-0">
                  <p className="text-[12.5px] font-bold text-[#8B95A1]">{qq}</p>
                  <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-[#191F28]">{answers[i] || "…"}</p>
                </div>
              ))}
            </TCard>
            <div className="mt-6 w-full">
              <TalentButton onClick={onClose} variant="primary" size="lg" fullWidth aria-label="저장하고 닫기">저장하고 계속하기</TalentButton>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-[13px] font-bold text-[#0B46E8]">{step + 1} / {questions.length}</p>
            <h2 className="mt-2 break-keep text-[20px] font-black leading-[1.35] tracking-[-0.02em] text-[#0B1227]">{questions[step]}</h2>
            {type === "tailored" && step === 0 ? (
              <p className="mt-2 text-[13.5px] text-[#8B95A1]">지원할 공고를 떠올리며 답해보세요. {snapshot.applications[0]?.company ?? ""}</p>
            ) : null}
            <textarea
              value={answers[step]}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="편하게 적어주세요. 문장이 어색해도 괜찮아요."
              rows={7}
              className="mt-5 w-full resize-none rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
            />
          </div>
        )}
      </main>

      {!done ? (
        <footer className="border-t border-[#EEF1F5] bg-white px-5 py-4">
          <div className="mx-auto max-w-xl">
            <TalentButton
              onClick={() => (isLast ? setDone(true) : setStep((s) => s + 1))}
              variant="primary"
              size="lg"
              fullWidth
              aria-label={isLast ? "초안 만들기" : "다음"}
            >
              {isLast ? "초안 만들기" : "다음"}
            </TalentButton>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
