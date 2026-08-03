"use client";

// 지원 상세 — 진행 단계 관리(공고 분석 → 맞춤 이력서 → 자기소개서 → 제출 전 확인 → 지원 완료 → 면접).
// 외부 지원 공고면 외부 지원/완료 표시 버튼을 제공한다.
import { useEffect, useState } from "react";
import { ArrowSquareOut, Check } from "@phosphor-icons/react";
import { TalentBackButton } from "../TalentBackButton";
import { TalentAppShell } from "../app/TalentAppShell";
import { TCard, TChip, TError, TLoading, TStepDot } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { getTalentRepository } from "../../../lib/talent/repository";
import { applicationStatusLabels } from "../../../lib/talent/labels";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import type { Application, Job, StepState } from "../../../lib/talent/types";

export function ApplicationDetailScreen({ appId }: { appId: string }) {
  const toast = useTalentPopup();
  const { snapshot, status, reload } = useTalentSnapshot();
  const [app, setApp] = useState<Application | null>(null);
  const [job, setJob] = useState<Job | null>(null);

  const found = snapshot?.applications.find((a) => a.id === appId) ?? null;

  // 스냅샷에서 찾은 지원을 로컬 상태로 복제(단계 토글을 mock 으로 반영).
  useEffect(() => {
    if (found && (!app || app.id !== found.id)) setApp(found);
  }, [found, app]);

  useEffect(() => {
    if (found) void getTalentRepository().getJob(found.jobId).then(setJob);
  }, [found]);

  function toggleStep(index: number) {
    setApp((prev) => {
      if (!prev) return prev;
      const steps = prev.steps.map((s, i) => {
        if (i !== index) return s;
        const nextState: StepState = s.state === "done" ? "todo" : "done";
        return { ...s, state: nextState };
      });
      return { ...prev, steps };
    });
  }

  return (
    <TalentAppShell maxWidth="4xl">
      <TalentBackButton className="mb-4" />

      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && !found ? <p className="py-20 text-center text-[14px] text-[#8B95A1]">지원 정보를 찾을 수 없어요.</p> : null}

      {status === "ready" && app ? (
        <div className="flex flex-col gap-4">
          <TCard className="p-6">
            <TChip tone={app.status === "applied" || app.status === "interview" ? "lime" : "blue"}>{applicationStatusLabels[app.status]}</TChip>
            <h1 className="mt-3 text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{app.jobTitle}</h1>
            <p className="mt-1 text-[14px] font-semibold text-[#4E5968]">{app.company}</p>
          </TCard>

          {/* 진행 단계 */}
          <TCard className="p-6">
            <h2 className="mb-4 text-[15px] font-bold text-[#191F28]">지원 준비 단계</h2>
            <ol className="flex flex-col gap-1">
              {app.steps.map((s, i) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => toggleStep(i)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#F6F8FB]"
                  >
                    <TStepDot state={s.state} />
                    <span className={`flex-1 text-[14.5px] ${s.state === "done" ? "text-[#8B95A1] line-through" : s.state === "doing" ? "font-semibold text-[#191F28]" : "text-[#191F28]"}`}>
                      {s.label}
                    </span>
                    {s.state === "doing" ? <TChip tone="blue">진행 중</TChip> : null}
                  </button>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[12.5px] text-[#B0B8C1]">단계를 눌러 완료 상태를 바꿀 수 있어요.</p>
          </TCard>

          {/* 외부 지원 안내 */}
          {job?.external && job.externalUrl ? (
            <TCard className="p-6">
              <h2 className="text-[15px] font-bold text-[#191F28]">외부 지원 공고</h2>
              <p className="mt-1.5 text-[13.5px] text-[#8B95A1]">이 공고는 외부 사이트에서 지원해요. 지원 후 완료로 표시해 두면 관리하기 편해요.</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <TalentButton href={job.externalUrl} external variant="primary" size="lg" aria-label="외부 사이트에서 지원하기">
                  외부 사이트에서 지원하기 <ArrowSquareOut className="h-4 w-4" />
                </TalentButton>
                <TalentButton
                  onClick={() => {
                    setApp((prev) => (prev ? { ...prev, status: "applied" } : prev));
                    toast.success("지원 완료로 표시했어요");
                  }}
                  variant="secondary"
                  size="lg"
                  aria-label="지원 완료로 표시하기"
                >
                  <Check className="h-4 w-4" weight="bold" /> 지원 완료로 표시하기
                </TalentButton>
              </div>
            </TCard>
          ) : null}
        </div>
      ) : null}
    </TalentAppShell>
  );
}
