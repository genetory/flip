"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { ResumeRender } from "./resume-render";
import { CoverRender } from "./cover-render";
import { SectionTitle, Card } from "./ui";

// 주차 페이지 우측 컬럼 — 대화로 만드는 이력서(2주차~)와 자소서(3주차~)를 항상 미리보기.
export function WeekDocs({ week }: { week: number }) {
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [r, c] = await Promise.all([fetchResumeData().catch(() => ({ data: {} })), fetchCoverData().catch(() => ({ data: {} }))]);
        if (!alive) return;
        setResume(r.data ?? {});
        setCover(c.data ?? {});
      } catch {
        // 무시
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 2주차: 이력서 · 3주차: 자소서 · 4주차: 둘 다.
  const showResume = week === 2 || week >= 4;
  const showCover = week >= 3;

  return (
    <>
      {showResume ? (
      <div>
        <div className="flex items-center justify-between">
          <SectionTitle>내 이력서</SectionTitle>
          <Link href="/career-launch/resume-collect" className="-mt-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">
            {hasResumeContent(resume) ? "이어하기" : "시작하기"} →
          </Link>
        </div>
        {!ready ? (
          <Card className="!p-4 text-[13px] text-[#8B95A1]">불러오는 중…</Card>
        ) : hasResumeContent(resume) ? (
          <ResumeRender data={resume} />
        ) : (
          <Card className="!p-4 text-[13px] text-[#8B95A1]">아직 이력서를 만들지 않았어요. 대화로 채워보세요.</Card>
        )}
      </div>
      ) : null}

      {showCover ? (
        <div>
          <div className="flex items-center justify-between">
            <SectionTitle>내 자소서</SectionTitle>
            <Link href="/career-launch/cover-collect" className="-mt-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">
              {hasCoverContent(cover) ? "이어하기" : "시작하기"} →
            </Link>
          </div>
          {!ready ? (
            <Card className="!p-4 text-[13px] text-[#8B95A1]">불러오는 중…</Card>
          ) : hasCoverContent(cover) ? (
            <CoverRender data={cover} />
          ) : (
            <Card className="!p-4 text-[13px] text-[#8B95A1]">아직 자소서를 만들지 않았어요. 대화로 채워보세요.</Card>
          )}
        </div>
      ) : null}
    </>
  );
}
