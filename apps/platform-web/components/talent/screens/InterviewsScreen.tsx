"use client";

// 모의 면접 — 내가 연습한 공고별 모의 면접 기록. 회사가 준비한 모의 면접을 풀면 여기 쌓인다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkle, CaretRight } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMyMockInterviews, type MockInterviewRecord } from "../../../lib/member-profile-client";

export function InterviewsScreen() {
  const [items, setItems] = useState<MockInterviewRecord[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getMyMockInterviews()
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <CareerLayout>
      <div className="flex flex-col gap-5">
        <TPageHeader title="모의 면접" description="회사가 준비한 모의 면접을 풀고 AI 피드백을 받아보세요. 연습한 공고가 여기 쌓여요." />

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          (items?.length ?? 0) === 0 ? (
            <TEmpty
              icon="🎤"
              title="아직 연습한 모의 면접이 없어요"
              description="공고 상세에서 '이 회사 모의 면접 미리 풀기'로 시작해보세요."
              action={<TalentButton href={talentAppRoutes.jobs} variant="soft" size="md">공고 둘러보기</TalentButton>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {items!.map((m) => (
                <Link key={m.positionId} href={`/talent/jobs/${m.positionId}`} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Sparkle className="h-5 w-5" weight="fill" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold text-[#191F28]">{m.positionTitle}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">
                      {m.companyName ? `${m.companyName} · ` : ""}답변 {m.answeredCount}개{m.bestScore != null ? ` · 최고 ${m.bestScore}점` : ""} · {formatRelativeTime(new Date(m.lastPracticedAt).getTime())}
                    </p>
                  </div>
                  <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
                </Link>
              ))}
            </div>
          )
        ) : null}
      </div>
    </CareerLayout>
  );
}
