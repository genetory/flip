"use client";

// 나의 경험 — 목록 + 단계형 추가 흐름(유형 선택 → 질문 → mock 요약 → 저장).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, ArrowLeft, Sparkle, PencilSimple } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TCard, TChip, TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { getTalentRepository } from "../../../lib/talent/repository";
import { experienceQuestions, experienceTypeLabels, experienceTypeOptions } from "../../../lib/talent/labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import type { Experience, ExperienceQuestionKey, ExperienceType } from "../../../lib/talent/types";

export function ExperiencesScreen() {
  const { snapshot, status, reload } = useTalentSnapshot();
  const [added, setAdded] = useState<Experience[]>([]);
  const [adding, setAdding] = useState(false);

  const experiences = [...(snapshot?.experiences ?? []), ...added];

  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-3">
            <TPageHeader title="나의 경험" description="해본 일을 정리하면 이력서와 자기소개서의 재료가 돼요." />
            <TalentButton onClick={() => setAdding(true)} variant="primary" size="md" aria-label="경험 추가">
              <Plus className="h-4 w-4" weight="bold" /> 경험 추가
            </TalentButton>
          </div>

          {experiences.length === 0 ? (
            <TEmpty
              icon="🗂️"
              title="아직 정리한 경험이 없어요"
              description="아르바이트, 프로젝트, 동아리처럼 작은 경험부터 시작해도 좋아요."
              action={<TalentButton onClick={() => setAdding(true)} variant="soft" size="md">첫 경험 정리하기</TalentButton>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {experiences.map((exp) => (
                <TCard key={exp.id} className="p-5">
                  <div className="flex items-center gap-2">
                    <TChip tone="blue">{experienceTypeLabels[exp.type]}</TChip>
                    {exp.period ? <span className="text-[12.5px] text-[#8B95A1]">{exp.period}</span> : null}
                    <span className="ml-auto">
                      <TChip tone={exp.summary ? "lime" : "gray"}>{exp.summary ? "정리 완료" : "작성 중"}</TChip>
                    </span>
                  </div>
                  <p className="mt-2.5 text-[15px] font-bold text-[#191F28]">{exp.title}</p>
                  {exp.summary ? (
                    <p className="mt-2 flex items-start gap-1.5 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
                      <Sparkle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B46E8]" weight="fill" />
                      {exp.summary}
                    </p>
                  ) : (
                    <p className="mt-2 text-[13px] text-[#B0B8C1]">아직 정리되지 않았어요 · 질문에 답하면 취업 언어로 다듬어드려요.</p>
                  )}
                  {exp.skills?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {exp.skills.map((s) => (
                        <span key={s} className="rounded-lg bg-[#F2F4F6] px-2 py-0.5 text-[11.5px] font-medium text-[#4E5968]">{s}</span>
                      ))}
                    </div>
                  ) : null}
                </TCard>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {adding ? (
        <AddExperienceFlow
          onClose={() => setAdding(false)}
          onSaved={(exp) => {
            setAdded((prev) => [...prev, exp]);
            setAdding(false);
          }}
        />
      ) : null}
    </CareerLayout>
  );
}

/* 단계형 경험 추가 흐름 (오버레이) */
function AddExperienceFlow({ onClose, onSaved }: { onClose: () => void; onSaved: (exp: Experience) => void }) {
  const toast = useTalentPopup();
  const router = useRouter();
  // step: -1 유형선택, 0..7 질문(8개), 8 검토
  const [step, setStep] = useState(-1);
  const [type, setType] = useState<ExperienceType | null>(null);
  const [answers, setAnswers] = useState<Partial<Record<ExperienceQuestionKey, string>>>({});
  const [draft, setDraft] = useState<Experience | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [summaryText, setSummaryText] = useState("");

  const q = step >= 0 && step < experienceQuestions.length ? experienceQuestions[step] : null;
  const isReview = step === experienceQuestions.length;

  async function goReview() {
    if (!type) return;
    setSaving(true);
    const title = answers.what?.slice(0, 24) || experienceTypeLabels[type];
    const result = await getTalentRepository().draftExperience({ type, title, answers });
    setDraft(result);
    setSummaryText(result.summary ?? "");
    setSaving(false);
    setStep(experienceQuestions.length);
  }

  function finish(useInResume: boolean) {
    if (!draft) return;
    onSaved({ ...draft, summary: summaryText.trim() || draft.summary });
    toast.success(useInResume ? "경험을 이력서에 사용할 수 있어요" : "경험을 저장했어요");
    if (useInResume) router.push(talentAppRoutes.resumes);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="sticky top-0 border-b border-[#EEF1F5] bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          {step > -1 ? (
            <button type="button" aria-label="이전" onClick={() => setStep((s) => s - 1)} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <span className="w-8" />
          )}
          <p className="flex-1 text-center text-[14px] font-bold text-[#191F28]">경험 정리하기</p>
          <button type="button" aria-label="닫기" onClick={onClose} className="rounded-lg p-1.5 text-[#8B95A1] hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 overflow-y-auto px-5 py-8">
        {step === -1 ? (
          <div>
            <h2 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">어떤 경험인가요?</h2>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {experienceTypeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setType(opt.value);
                    setStep(0);
                  }}
                  className="rounded-2xl border border-[#E5E8EB] bg-white px-3 py-4 text-[13.5px] font-semibold text-[#191F28] transition hover:border-[#0B46E8] hover:bg-[#F5F8FF]"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {q ? (
          <div>
            <p className="text-[13px] font-bold text-[#0B46E8]">{step + 1} / {experienceQuestions.length}</p>
            <h2 className="mt-2 text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{q.label}</h2>
            <textarea
              value={answers[q.key] ?? ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.key]: e.target.value }))}
              placeholder={q.placeholder}
              rows={5}
              className="mt-5 w-full resize-none rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#191F28] outline-none transition focus:border-[#0B46E8] focus:ring-2 focus:ring-[#EDF1FD]"
            />
            <div className="mt-6 flex flex-col gap-2">
              {step < experienceQuestions.length - 1 ? (
                <TalentButton onClick={() => setStep((s) => s + 1)} variant="primary" size="lg" fullWidth aria-label="다음">
                  다음
                </TalentButton>
              ) : (
                <TalentButton onClick={goReview} disabled={saving} variant="primary" size="lg" fullWidth aria-label="정리 결과 보기">
                  {saving ? "정리하는 중…" : "정리 결과 보기"}
                </TalentButton>
              )}
              <button type="button" onClick={() => (step < experienceQuestions.length - 1 ? setStep((s) => s + 1) : goReview())} className="py-2 text-[13.5px] font-semibold text-[#8B95A1] hover:text-[#4E5968]">
                건너뛰기
              </button>
            </div>
          </div>
        ) : null}

        {isReview && draft ? (
          <div>
            <div className="flex items-center gap-2">
              <Sparkle className="h-5 w-5 text-[#0B46E8]" weight="fill" />
              <h2 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{draft.title} 경험이 정리됐어요</h2>
            </div>

            {/* 핵심 역할 */}
            {draft.keyRole ? (
              <div className="mt-6">
                <p className="text-[12.5px] font-bold text-[#8B95A1]">핵심 역할</p>
                <p className="mt-1.5 text-[15px] font-bold text-[#191F28]">{draft.keyRole}</p>
              </div>
            ) : null}

            {/* 활용할 수 있는 역량 */}
            {draft.skills?.length ? (
              <div className="mt-5">
                <p className="text-[12.5px] font-bold text-[#8B95A1]">활용할 수 있는 역량</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {draft.skills.map((s) => (
                    <TChip key={s} tone="lime">{s}</TChip>
                  ))}
                </div>
              </div>
            ) : null}

            {/* 이력서 문장 */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-bold text-[#8B95A1]">이력서 문장</p>
                {!editing ? (
                  <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#0B46E8]">
                    <PencilSimple className="h-3.5 w-3.5" /> 문장 수정하기
                  </button>
                ) : null}
              </div>
              {editing ? (
                <textarea
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-[#0B46E8] bg-white px-4 py-3.5 text-[14.5px] leading-relaxed text-[#191F28] outline-none ring-2 ring-[#EDF1FD]"
                />
              ) : (
                <div className="mt-2 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] px-4 py-3.5">
                  <p className="break-keep text-[14.5px] font-medium leading-relaxed text-[#191F28]">{summaryText || draft.summary}</p>
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-col gap-2">
              <TalentButton onClick={() => finish(true)} variant="primary" size="lg" fullWidth aria-label="이력서에 사용하기">
                이력서에 사용하기
              </TalentButton>
              <TalentButton onClick={() => finish(false)} variant="secondary" size="lg" fullWidth aria-label="저장만 하기">
                저장만 하기
              </TalentButton>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
