"use client";

// 내 커리어 — 취업 준비 로드맵 히어로 + 이력서/자기소개서 + 커리어 기록.
import Link from "next/link";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { ProfileGate } from "../career/ProfileGate";
import { FeedCard } from "../career/FeedCard";
import { CareerFunnelCards } from "../career/CareerFunnelCards";
import { TLoading, TError, TPageHeader } from "../ui/primitives";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { useCareerFeed, removeFeedEntry } from "../../../lib/talent/career-feed";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { useCareerHistorySync } from "../../../lib/talent/useCareerHistorySync";
import type { TalentSnapshot } from "../../../lib/talent/types";

export function CareerHomeScreen() {
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
  const feed = useCareerFeed();
  const basicInfo = useBasicInfo();
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const ready = isBasicInfoComplete(basicInfo);

  // 이미 입력된 이력서/자소서 항목도 커리어 기록으로 백필(멱등, refId 중복 방지).
  useCareerHistorySync();

  // 기본 정보가 등록되지 않으면 무조건 그것부터.
  if (!ready) {
    return (
      <div className="flex flex-col gap-8">
        <TPageHeader title="내 커리어" description="이력서·자기소개서에 쓸 기본 정보부터 등록해요." />
        <ProfileGate />
      </div>
    );
  }

  const hasResume = resume !== null;
  const hasCover = cover !== null;
  const rp = resumeCompleteness(resume);
  const cp = coverCompleteness(cover);
  const applied = snapshot.applications.length > 0;

  const steps: RoadmapStep[] = [
    { label: "기본정보", done: true },
    { label: "이력서", done: rp >= 100 },
    { label: "자기소개서", done: cp >= 100 },
    { label: "첫 지원", done: applied }
  ];
  const currentIndex = steps.findIndex((s) => !s.done); // -1 = 전부 완료
  const copy = heroCopy(currentIndex, hasResume, hasCover);

  return (
    <div className="flex flex-col gap-8">
      <TPageHeader title="내 커리어" />

      {/* 취업 준비 로드맵 히어로 */}
      <section className="rounded-3xl bg-[#EDF1FD] p-7">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">취업 준비 로드맵</p>
        <Roadmap steps={steps} currentIndex={currentIndex} />
        <h2 className="mt-6 break-keep text-[19px] font-black leading-[1.35] tracking-[-0.02em] text-[#0B1227]">{copy.headline}</h2>
        <Link
          href={copy.href}
          className="mt-4 inline-flex h-[46px] items-center gap-1.5 rounded-2xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
        >
          {copy.cta} <ArrowRight className="h-4 w-4" weight="bold" />
        </Link>
      </section>

      {/* 이력서 · 자기소개서 */}
      <section className="flex flex-col gap-4">
        <SectionHead title="지원 서류를 만들어요" desc="AI 챗으로 편하게 채우고, 미리보기로 확인해요." />
        <CareerFunnelCards showPreview />
      </section>

      {/* 커리어 기록 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-3">
          <SectionHead title="내 커리어가 이렇게 쌓이고 있어요" desc="이력서·자기소개서에 남긴 내용이 자동으로 기록돼요." />
          {feed.length ? <span className="shrink-0 text-[12.5px] font-semibold text-[#8B95A1]">{feed.length}개</span> : null}
        </div>
        {feed.length ? (
          <div className="flex flex-col gap-2.5">
            {/* 최신 5개만 노출 */}
            {feed.slice(0, 5).map((e) => (
              <FeedCard key={e.id} entry={e} onDelete={removeFeedEntry} />
            ))}
          </div>
        ) : (
          <EmptyFeed />
        )}
      </section>
    </div>
  );
}

interface RoadmapStep {
  label: string;
  done: boolean;
}

function Roadmap({ steps, currentIndex }: { steps: RoadmapStep[]; currentIndex: number }) {
  return (
    <div className="mt-5 flex items-start">
      {steps.map((s, i) => {
        const state = s.done ? "done" : i === currentIndex ? "current" : "todo";
        return (
          <div key={s.label} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span className={`h-[3px] flex-1 rounded-full ${i === 0 ? "opacity-0" : steps[i - 1].done ? "bg-[#0B46E8]" : "bg-[#CDD8F0]"}`} />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-black ${
                  state === "done"
                    ? "bg-[#0B46E8] text-white"
                    : state === "current"
                      ? "border-[2.5px] border-[#0B46E8] bg-white text-[#0B46E8]"
                      : "bg-white text-[#B0B8C1]"
                }`}
              >
                {s.done ? <Check className="h-4 w-4" weight="bold" /> : i + 1}
              </span>
              <span className={`h-[3px] flex-1 rounded-full ${i === steps.length - 1 ? "opacity-0" : s.done ? "bg-[#0B46E8]" : "bg-[#CDD8F0]"}`} />
            </div>
            <span className={`mt-2 text-[11.5px] ${state === "todo" ? "text-[#8B95A1]" : "font-bold text-[#0B1227]"}`}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// 현재 단계에 맞는 히어로 문구·CTA.
function heroCopy(currentIndex: number, hasResume: boolean, hasCover: boolean): { headline: string; cta: string; href: string } {
  if (currentIndex === -1) {
    return { headline: "취업 준비 완주! 계속 도전해봐요.", cta: "포지션 탐색하기", href: talentAppRoutes.jobs };
  }
  if (currentIndex <= 1) {
    return {
      headline: hasResume ? "이력서를 마저 완성해볼까요?" : "이제 이력서를 만들 차례예요.",
      cta: hasResume ? "이력서 이어서 쓰기" : "이력서 만들기",
      href: talentAppRoutes.resume
    };
  }
  if (currentIndex === 2) {
    return {
      headline: "이력서까지 왔어요! 자기소개서만 더 하면 지원 준비 끝.",
      cta: hasCover ? "자기소개서 이어서 쓰기" : "자기소개서 만들기",
      href: talentAppRoutes.cover
    };
  }
  return { headline: "서류가 준비됐어요! 이제 지원해봐요.", cta: "포지션 탐색하기", href: talentAppRoutes.jobs };
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{desc}</p>
    </div>
  );
}

function EmptyFeed() {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px]" aria-hidden>📝</span>
      <p className="mt-3 text-[14px] font-bold text-[#191F28]">아직 남긴 기록이 없어요</p>
      <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">위에서 이력서나 자기소개서를 만들면 자동으로 여기에 쌓여요.</p>
    </div>
  );
}
