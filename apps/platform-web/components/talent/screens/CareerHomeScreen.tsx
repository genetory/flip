"use client";

// 내 커리어 홈 — 커리어를 쌓는 허브.
// AI 커리어 노트로 남기면 → 커리어 기록(피드)으로 쌓이고 → 이력서/자기소개서로 정리된다.
import { CareerLayout } from "../career/CareerLayout";
import { ProfileGate } from "../career/ProfileGate";
import { FeedCard } from "../career/FeedCard";
import { CareerFunnelCards } from "../career/CareerFunnelCards";
import { TLoading, TError, TPageHeader } from "../ui/primitives";
import { useTalentSnapshot } from "../../../lib/talent/useTalentData";
import { useCareerFeed, removeFeedEntry } from "../../../lib/talent/career-feed";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
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
  const ready = isBasicInfoComplete(basicInfo);

  // 이미 입력된 이력서/자소서 항목도 커리어 기록으로 백필(멱등, refId 중복 방지).
  useCareerHistorySync();

  // 기본 정보가 등록되지 않으면 무조건 그것부터.
  if (!ready) {
    return (
      <div className="flex flex-col gap-8">
        <TPageHeader title="내 커리어" description="편하게 남기면 이력서·자기소개서로 정리돼요." />
        <ProfileGate />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <TPageHeader title="내 커리어" description="이력서·자기소개서를 만들면서 커리어를 정리해요." />

      {/* 결과물 퍼널 — 이력서 / 자기소개서 (각 1개, 각자 AI 챗으로 입력) */}
      <CareerFunnelCards />

      {/* 커리어 기록 — 남긴 것들이 피드로 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">커리어 기록</h2>
          {feed.length ? <span className="text-[12.5px] font-semibold text-[#8B95A1]">{feed.length}개</span> : null}
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

function EmptyFeed() {
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px]" aria-hidden>📝</span>
      <p className="mt-3 text-[14px] font-bold text-[#191F28]">아직 남긴 기록이 없어요</p>
      <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">위 AI 커리어 노트에서 첫 한 줄을 남겨보세요. 자동으로 여기에 쌓여요.</p>
    </div>
  );
}
