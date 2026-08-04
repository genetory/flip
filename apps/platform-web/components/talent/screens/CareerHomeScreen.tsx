"use client";

// 내 커리어 — 오늘의 한 걸음 히어로 + 이력서/자기소개서 + 커리어 기록.
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
import { useDailyStep, markStepDoneToday } from "../../../lib/talent/daily-step";
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
  const mission = todaysMission(hasResume, rp, hasCover, cp, applied);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
      <TPageHeader title="내 커리어" />

      {/* 오늘의 한 걸음 히어로 */}
      <DailyStepHero mission={mission} />
      </div>

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

interface Mission {
  text: string;
  cta: string;
  href: string;
}

// 현재 상태에 맞는 오늘의 미션(작은 한 걸음) 하나.
function todaysMission(hasResume: boolean, rp: number, hasCover: boolean, cp: number, applied: boolean): Mission {
  if (!hasResume) return { text: "오늘은 이력서를 만들어볼까요?", cta: "이력서 만들기", href: talentAppRoutes.resume };
  if (rp < 100) return { text: "이력서에 경험 한 줄을 더 채워봐요.", cta: "이력서 이어서 쓰기", href: talentAppRoutes.resume };
  if (!hasCover) return { text: "자기소개서 지원 동기를 써볼까요?", cta: "자기소개서 만들기", href: talentAppRoutes.cover };
  if (cp < 100) return { text: "자기소개서 한 문항을 더 채워봐요.", cta: "자기소개서 이어서 쓰기", href: talentAppRoutes.cover };
  if (!applied) return { text: "마음에 드는 공고 하나를 저장해봐요.", cta: "포지션 탐색하기", href: talentAppRoutes.jobs };
  return { text: "오늘도 새 공고를 둘러볼까요?", cta: "포지션 탐색하기", href: talentAppRoutes.jobs };
}

function DailyStepHero({ mission }: { mission: Mission }) {
  const { streak, doneToday } = useDailyStep();
  return (
    <section className="rounded-3xl bg-[#0B1227] p-7 text-white">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#8CA8FF]">오늘의 한 걸음</p>
        {streak > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-bold text-white">🔥 {streak}일 연속</span>
        ) : null}
      </div>

      {doneToday ? (
        <>
          <h2 className="mt-3 break-keep text-[20px] font-black leading-[1.35] tracking-[-0.02em]">오늘의 한 걸음, 완료! 👏</h2>
          <p className="mt-2 break-keep text-[14px] leading-relaxed text-white/65">내일 또 한 걸음 이어가면 연속 기록이 쌓여요.</p>
        </>
      ) : (
        <>
          <h2 className="mt-3 break-keep text-[20px] font-black leading-[1.35] tracking-[-0.02em]">{mission.text}</h2>
          <Link
            href={mission.href}
            onClick={markStepDoneToday}
            className="mt-5 inline-flex h-[46px] items-center gap-1.5 rounded-2xl bg-white px-5 text-[14px] font-bold text-[#0B1227] transition hover:bg-[#F2F4F6]"
          >
            {mission.cta} <ArrowRight className="h-4 w-4" weight="bold" />
          </Link>
        </>
      )}
    </section>
  );
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
