"use client";

// 이력서 상세 — 완성도 코칭 + 경험→문장 Before/After + 템플릿 선택 + 미리보기 + 내보내기(mock).
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkle, FilePdf, LinkSimple, Lightbulb } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TCard, TChip, TProgressBar, TLoading, TError, TEmpty } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { buildResumePreview, resumeTemplates } from "../../../lib/talent/resume-preview";
import { resumeStatusLabels } from "../../../lib/talent/labels";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useTalentPopup } from "../feedback/TalentPopupProvider";
import type { TalentSnapshot } from "../../../lib/talent/types";

export function ResumeDetailScreen({ resumeId }: { resumeId: string }) {
  const { snapshot, status, reload } = useTalentSnapshot();
  return (
    <CareerLayout>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={reload} /> : null}
      {status === "ready" && snapshot ? <Content snapshot={snapshot} resumeId={resumeId} /> : null}
    </CareerLayout>
  );
}

function Content({ snapshot, resumeId }: { snapshot: TalentSnapshot; resumeId: string }) {
  const toast = useTalentPopup();
  const resume = snapshot.resumes.find((r) => r.id === resumeId) ?? snapshot.resumes[0];
  const [templateKey, setTemplateKey] = useState(resumeTemplates[0].key);
  const preview = useMemo(() => buildResumePreview(snapshot, resume?.targetRole), [snapshot, resume?.targetRole]);
  const template = resumeTemplates.find((t) => t.key === templateKey) ?? resumeTemplates[0];

  if (!resume) {
    return (
      <TEmpty
        icon="📄"
        title="이력서를 찾을 수 없어요"
        description="먼저 경험을 정리하고 첫 이력서를 만들어보세요."
        action={<TalentButton href={talentAppRoutes.resumes} variant="primary" size="md">이력서 목록으로</TalentButton>}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{resume.title}</h1>
          <TChip tone={resume.status === "ready" ? "lime" : "blue"}>{resumeStatusLabels[resume.status]}</TChip>
        </div>
        {resume.targetRole ? <p className="mt-1 text-[14px] text-[#4E5968]">{resume.targetRole} 지원용</p> : null}
      </div>

      {/* 완성도 코칭 — 점수 아닌 단계 + 힌트 */}
      <TCard className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-bold text-[#191F28]">완성도 체크</h2>
          <span className="text-[13px] font-bold text-[#0B46E8]">{preview.filledCount}/{preview.totalCount}</span>
        </div>
        <TProgressBar value={(preview.filledCount / preview.totalCount) * 100} />
        <ul className="mt-4 flex flex-col gap-3">
          {preview.coaching.map((c) => (
            <li key={c.key} className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-2xl ${c.done ? "bg-[#B7FF5A]" : "border-2 border-[#E5E8EB] bg-white"}`}>
                {c.done ? <Check className="h-3 w-3 text-[#1F3D00]" weight="bold" /> : null}
              </span>
              <div>
                <p className={`text-[14px] ${c.done ? "text-[#8B95A1] line-through" : "font-semibold text-[#191F28]"}`}>{c.label}</p>
                {!c.done && c.hint ? (
                  <p className="mt-1 flex items-start gap-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0B46E8]" weight="fill" />
                    {c.hint}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </TCard>

      {/* 템플릿 선택 */}
      <div>
        <p className="mb-2.5 text-[13px] font-bold text-[#8B95A1]">템플릿</p>
        <div className="flex gap-2">
          {resumeTemplates.map((t) => {
            const on = t.key === templateKey;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTemplateKey(t.key)}
                aria-pressed={on}
                className={`flex-1 rounded-2xl border p-3 text-left transition ${on ? "border-[#0B46E8] bg-[#F5F8FF]" : "border-[#EEF1F5] bg-white hover:border-[#D7DCE3]"}`}
              >
                <span className="block h-1.5 w-6 rounded-full" style={{ backgroundColor: t.accent }} />
                <p className="mt-2 text-[13.5px] font-bold text-[#191F28]">{t.label}</p>
                <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 미리보기 */}
      <TCard className="overflow-hidden">
        <div className="border-b-2 px-6 py-5" style={{ borderColor: template.accent }}>
          <p className="text-[20px] font-black tracking-[-0.02em]" style={{ color: template.accent }}>{preview.name}</p>
          {preview.targetRole ? <p className="mt-1 text-[13.5px] font-semibold text-[#4E5968]">{preview.targetRole} 지원</p> : null}
          {preview.headline ? <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">{preview.headline}</p> : null}
        </div>
        <div className="px-6 py-5">
          <p className="text-[12.5px] font-bold uppercase tracking-wide text-[#8B95A1]">경험</p>
          <ul className="mt-3 flex flex-col gap-4">
            {preview.items.map((it) => (
              <li key={it.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[14.5px] font-bold text-[#191F28]">{it.title}</p>
                  {it.period ? <span className="shrink-0 text-[12px] text-[#8B95A1]">{it.period}</span> : null}
                </div>
                <p className="mt-1.5 flex items-start gap-1.5 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: template.accent }} />
                  {it.after}
                </p>
              </li>
            ))}
            {preview.items.length === 0 ? <p className="text-[13px] text-[#B0B8C1]">정리한 경험이 여기에 이력서 문장으로 들어가요.</p> : null}
          </ul>
        </div>
      </TCard>

      {/* 경험 → 문장 Before/After (차별점) */}
      {preview.items.length ? (
        <TCard className="border-[#DCE7FB] bg-[#F5F8FF] p-6">
          <div className="flex items-center gap-1.5">
            <Sparkle className="h-4 w-4 text-[#0B46E8]" weight="fill" />
            <h2 className="text-[15px] font-bold text-[#0B1227]">경험을 이력서 문장으로 바꿨어요</h2>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {preview.items.slice(0, 2).map((it) => (
              <div key={it.id} className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
                <p className="text-[12px] font-bold text-[#8B95A1]">이렇게 말했다면</p>
                <p className="mt-1 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{it.before}</p>
                <div className="my-2.5 flex items-center gap-1.5 text-[#0B46E8]">
                  <ArrowRight className="h-3.5 w-3.5" weight="bold" />
                  <span className="text-[11.5px] font-bold">이렇게 정리해드려요</span>
                </div>
                <p className="break-keep text-[13.5px] font-medium leading-relaxed text-[#191F28]">{it.after}</p>
              </div>
            ))}
          </div>
        </TCard>
      ) : null}

      {/* 내보내기 (mock) */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <TalentButton onClick={() => toast.info("PDF 내보내기는 곧 지원돼요")} variant="primary" size="lg" aria-label="PDF로 저장">
          <FilePdf className="h-4 w-4" /> PDF로 저장
        </TalentButton>
        <TalentButton onClick={() => toast.success("공유 링크를 복사했어요")} variant="secondary" size="lg" aria-label="공유 링크 만들기">
          <LinkSimple className="h-4 w-4" /> 공유 링크 만들기
        </TalentButton>
      </div>

      {/* 직무별 버전 */}
      <TCard className="flex items-center gap-3 p-5">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-[#191F28]">다른 직무로도 만들 수 있어요</p>
          <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">같은 경험으로 지원 직무에 맞춰 강조점이 다른 이력서를 만들어요.</p>
        </div>
        <Link href={talentAppRoutes.resumes} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-2 text-[13px] font-semibold text-[#4E5968] hover:bg-[#E5E8EB]">
          새 버전
        </Link>
      </TCard>
    </div>
  );
}
