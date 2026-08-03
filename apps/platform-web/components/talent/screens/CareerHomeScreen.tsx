"use client";

// 내 커리어 — 커리어 정리 허브. 다음 할 일 히어로 + 이력서/자기소개서 + 커리어 기록.
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
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
  void snapshot;
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

  const name = basicInfo.realName?.trim() || "";
  const hero = nextStep(resume !== null, cover !== null, resumeCompleteness(resume), coverCompleteness(cover));

  return (
    <div className="flex flex-col gap-8">
      <TPageHeader title="내 커리어" />

      {/* 다음 할 일 히어로 */}
      <section className="rounded-3xl bg-[#EDF1FD] p-7">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">MY CAREER</p>
        <h2 className="mt-2 break-keep text-[22px] font-black leading-[1.3] tracking-[-0.02em] text-[#0B1227]">
          {name ? `${name}님, ` : ""}{hero.headline}
        </h2>
        <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#4E5968]">{hero.sub}</p>
        <Link
          href={hero.href}
          className="mt-5 inline-flex h-[46px] items-center gap-1.5 rounded-2xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]"
        >
          {hero.cta} <ArrowRight className="h-4 w-4" weight="bold" />
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

// 완성도로 다음 할 일(히어로 메시지)을 결정.
function nextStep(hasResume: boolean, hasCover: boolean, resumePct: number, coverPct: number): { headline: string; sub: string; cta: string; href: string } {
  if (!hasResume && !hasCover) {
    return { headline: "취업 준비, 첫걸음을 떼볼까요?", sub: "이력서부터 만들면 흩어진 경험이 하나로 정리돼요.", cta: "이력서 만들기", href: talentAppRoutes.resume };
  }
  if (resumePct >= 100 && coverPct >= 100) {
    return { headline: "서류가 준비됐어요!", sub: "이제 마음에 드는 곳에 지원해봐요.", cta: "포지션 탐색하기", href: talentAppRoutes.jobs };
  }
  // 진행 중 → 완성도가 낮은(또는 아직 없는) 쪽을 다음 단계로.
  const resumeNext = resumePct <= coverPct;
  return {
    headline: "조금만 더 하면 완성이에요",
    sub: resumeNext ? "이력서를 마저 채워볼까요?" : "자기소개서를 마저 채워볼까요?",
    cta: resumeNext ? "이력서 이어서 쓰기" : "자기소개서 이어서 쓰기",
    href: resumeNext ? talentAppRoutes.resume : talentAppRoutes.cover
  };
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
