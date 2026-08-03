"use client";

// 이력서 — 목록 + 생성 흐름(경험 선택 → 직무 → 역량 → 초안 생성(mock) → 수정 → 디자인 → 결과).
// 실제 AI 생성 전이라 UI/상태 구조를 먼저 구현하고 mock 결과를 사용한다.
import { useState } from "react";
import { Plus, X, ArrowLeft, ArrowRight, FileText, CheckCircle, Sparkle } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { ProfileGate } from "../career/ProfileGate";
import { TCard, TChip, TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { resumeFlowSteps, resumeStatusLabels } from "../../../lib/talent/labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { beforeAfterSection } from "../../../lib/talent/landing-content";
import type { Resume, ResumeStatus, TalentSnapshot } from "../../../lib/talent/types";

const statusTone: Record<ResumeStatus, "gray" | "blue" | "lime"> = {
  none: "gray",
  draft: "blue",
  improving: "blue",
  ready: "lime"
};

export function ResumesScreen() {
  const { snapshot, status, reload } = useTalentSnapshot();
  const ready = isBasicInfoComplete(useBasicInfo());
  const [flowOpen, setFlowOpen] = useState(false);

  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot && !ready ? <ProfileGate /> : null}

      {status === "ready" && snapshot && ready ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <TPageHeader title="이력서" description="정리한 경험으로 나의 이력서 한 부를 완성해요." />
            {snapshot.resumes.length === 0 ? (
              <TalentButton onClick={() => setFlowOpen(true)} variant="primary" size="md" aria-label="이력서 만들기">
                <Plus className="h-4 w-4" weight="bold" /> 이력서 만들기
              </TalentButton>
            ) : null}
          </div>

          {/* 경험 → 이력서 문장 변환(차별점) 미리보기 */}
          <TCard className="border-[#DCE7FB] bg-[#F5F8FF] p-6">
            <div className="flex items-center gap-1.5">
              <Sparkle className="h-4 w-4 text-[#0B46E8]" weight="fill" />
              <h2 className="text-[14.5px] font-bold text-[#0B1227]">경험만 있으면, 문장은 APLY가</h2>
            </div>
            <div className="mt-4 grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                <p className="text-[11.5px] font-bold text-[#8B95A1]">{beforeAfterSection.beforeLabel}</p>
                <p className="mt-2 whitespace-pre-line break-keep text-[13px] leading-relaxed text-[#8B95A1]">{beforeAfterSection.before}</p>
              </div>
              <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-2xl bg-[#0B46E8] text-white sm:h-9 sm:w-9" aria-hidden>
                <ArrowRight className="h-4 w-4" weight="bold" />
              </div>
              <div className="rounded-2xl border border-[#0B46E8]/15 bg-white p-4">
                <p className="text-[11.5px] font-bold text-[#0B46E8]">{beforeAfterSection.afterLabel}</p>
                <p className="mt-2 whitespace-pre-line break-keep text-[13px] font-medium leading-relaxed text-[#191F28]">{beforeAfterSection.after}</p>
              </div>
            </div>
          </TCard>

          {snapshot.resumes.length === 0 ? (
            <TEmpty
              icon="📄"
              title="아직 이력서가 없어요"
              description="질문에 답하다 보면 첫 이력서 한 부가 완성돼요. 약 3분이면 충분해요."
              action={
                <TalentButton onClick={() => setFlowOpen(true)} variant="soft" size="md" aria-label="첫 이력서 만들기">
                  첫 이력서 만들기
                </TalentButton>
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {snapshot.resumes.map((r) => (
                <ResumeRow key={r.id} resume={r} />
              ))}
            </div>
          )}
        </div>
      ) : null}

      {flowOpen && snapshot ? <ResumeFlow snapshot={snapshot} onClose={() => setFlowOpen(false)} /> : null}
    </CareerLayout>
  );
}

function ResumeRow({ resume }: { resume: Resume }) {
  return (
    <TCard className="flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD]">
        <FileText className="h-5 w-5 text-[#0B46E8]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-[#191F28]">{resume.title}</p>
        <p className="mt-1 text-[12.5px] text-[#8B95A1]">{resume.targetRole ? `${resume.targetRole} · ` : ""}수정 {resume.updatedAt}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <TChip tone={statusTone[resume.status]}>{resumeStatusLabels[resume.status]}</TChip>
        <TalentButton href={`${talentAppRoutes.resumes}/${resume.id}`} variant="secondary" size="md" aria-label="이어서 다듬기">이어서 다듬기</TalentButton>
      </div>
    </TCard>
  );
}

/* 생성 흐름 오버레이 */
function ResumeFlow({ snapshot, onClose }: { snapshot: TalentSnapshot; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [selectedExp, setSelectedExp] = useState<string[]>(snapshot.experiences.map((e) => e.id));
  const [role, setRole] = useState(snapshot.profile.interests[0] ?? "");
  const [skills, setSkills] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const skillPool = snapshot.profile.skills ?? [];

  function toggle<T>(list: T[], value: T): T[] {
    return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  }

  function generate() {
    setGenerating(true);
    // mock: 실제 생성 대신 지연 후 완료 처리.
    window.setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setStep(4);
    }, 1200);
  }

  const canNext =
    (step === 0 && selectedExp.length > 0) ||
    (step === 1 && role.trim().length > 0) ||
    step === 2;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="sticky top-0 border-b border-[#EEF1F5] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {step > 0 && !generating ? (
            <button type="button" aria-label="이전" onClick={() => setStep((s) => Math.max(0, s - 1))} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="w-8" />
          )}
          <p className="flex-1 text-center text-[13.5px] font-bold text-[#191F28]">
            {resumeFlowSteps[Math.min(step, resumeFlowSteps.length - 1)]}
          </p>
          <button type="button" aria-label="닫기" onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-auto mt-2 flex max-w-xl gap-1">
          {resumeFlowSteps.map((_, i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[#0B46E8]" : "bg-[#EEF1F5]"}`} />
          ))}
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 py-8">
        {generating ? (
          <TLoading label="이력서 초안을 만들고 있어요…" />
        ) : (
          <>
            {step === 0 ? (
              <StepBlock title="어떤 경험을 사용할까요?" desc="이력서에 담을 경험을 선택해주세요.">
                <div className="flex flex-col gap-2.5">
                  {snapshot.experiences.map((e) => {
                    const on = selectedExp.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => setSelectedExp((l) => toggle(l, e.id))}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${on ? "border-[#0B46E8] bg-[#F5F8FF]" : "border-[#E5E8EB] bg-white"}`}
                      >
                        <span className={`flex h-5 w-5 items-center justify-center rounded-md ${on ? "bg-[#0B46E8] text-white" : "border-2 border-[#D7DCE3]"}`}>{on ? "✓" : ""}</span>
                        <span className="text-[14px] font-semibold text-[#191F28]">{e.title}</span>
                      </button>
                    );
                  })}
                  {snapshot.experiences.length === 0 ? <p className="text-[13.5px] text-[#B0B8C1]">먼저 경험을 정리해주세요.</p> : null}
                </div>
              </StepBlock>
            ) : null}

            {step === 1 ? (
              <StepBlock title="어떤 직무에 지원하나요?" desc="지원 직무에 맞춰 이력서를 다듬어드려요.">
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="예) 콘텐츠 마케팅"
                  className="w-full rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3.5 text-[15px] text-[#191F28] outline-none focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
                />
              </StepBlock>
            ) : null}

            {step === 2 ? (
              <StepBlock title="강조하고 싶은 역량이 있나요?" desc="선택은 자유예요. 없으면 바로 넘어가도 좋아요.">
                <div className="flex flex-wrap gap-2">
                  {(skillPool.length ? skillPool : ["문제 해결", "소통", "성실함"]).map((s) => {
                    const on = skills.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSkills((l) => toggle(l, s))}
                        className={`rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition ${on ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968]"}`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </StepBlock>
            ) : null}

            {step === 3 ? (
              <StepBlock title="이제 초안을 만들어볼까요?" desc="선택한 경험과 직무로 첫 이력서 초안을 만들어드려요.">
                <TalentButton onClick={generate} variant="primary" size="lg" fullWidth aria-label="이력서 초안 생성">
                  이력서 초안 생성하기
                </TalentButton>
              </StepBlock>
            ) : null}

            {step === 4 && generated ? (
              <div className="flex flex-col items-center text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAFFD1]">
                  <CheckCircle className="h-8 w-8 text-[#3A6B00]" weight="fill" />
                </span>
                <h2 className="mt-5 text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{resumeStatusLabels.draft}</h2>
                <p className="mt-2 text-[14px] text-[#4E5968]">{role || "지원 직무"} 이력서 초안이 준비됐어요.</p>
                <TCard className="mt-6 w-full p-5 text-left">
                  <p className="text-[13px] font-bold text-[#8B95A1]">미리보기</p>
                  <p className="mt-2 text-[15px] font-bold text-[#191F28]">{snapshot.greetingName} · {role || "지원 직무"}</p>
                  <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
                    {snapshot.experiences[0]?.summary ?? "선택한 경험을 바탕으로 정리된 이력서 초안이에요."}
                  </p>
                </TCard>
                <div className="mt-6 w-full">
                  <TalentButton onClick={onClose} variant="primary" size="lg" fullWidth aria-label="이력서 저장하고 닫기">
                    저장하고 계속하기
                  </TalentButton>
                </div>
              </div>
            ) : null}
          </>
        )}
      </main>

      {!generating && step < 4 ? (
        <footer className="border-t border-[#EEF1F5] bg-white px-5 py-4">
          <div className="mx-auto max-w-xl">
            {step < 3 ? (
              <TalentButton onClick={() => setStep((s) => s + 1)} disabled={!canNext} variant="primary" size="lg" fullWidth aria-label="다음">
                다음
              </TalentButton>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}

function StepBlock({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      {desc ? <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#4E5968]">{desc}</p> : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}
