"use client";

// 작성 히스토리(전체) — 이력서·자기소개서에 남긴 커리어 기록 전체 목록.
import { CareerLayout } from "../career/CareerLayout";
import { FeedCard } from "../career/FeedCard";
import { useCareerFeed, removeFeedEntry } from "../../../lib/talent/career-feed";

export function CareerHistoryScreen() {
  const feed = useCareerFeed();
  return (
    <CareerLayout>
      <div className="flex flex-col gap-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">작성 히스토리</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">이력서·자기소개서에 남긴 내용이 순서대로 쌓여요.</p>
          </div>
          {feed.length ? <span className="shrink-0 text-[12.5px] font-semibold text-[#8B95A1]">{feed.length}개</span> : null}
        </div>

        {feed.length ? (
          <div className="flex flex-col gap-2.5">
            {feed.map((e) => (
              <FeedCard key={e.id} entry={e} onDelete={removeFeedEntry} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>📝</span>
            <p className="mt-3 text-[15px] font-bold text-[#191F28]">아직 남긴 기록이 없어요</p>
            <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">이력서나 자기소개서를 만들면 자동으로 여기에 쌓여요.</p>
          </div>
        )}
      </div>
    </CareerLayout>
  );
}
