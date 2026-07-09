"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchResumeData, hasResumeContent } from "../../lib/launch/resume-data";
import { SectionTitle, Card } from "./ui";

// 대시보드 '내 이력서' 카드 — 저장된 데이터 유무에 따라 시작하기/이어하기로 안내.
export function ResumeCard() {
  const [has, setHas] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { data } = await fetchResumeData();
        if (alive) setHas(hasResumeContent(data));
      } catch {
        if (alive) setHas(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const started = has === true;

  return (
    <div>
      <SectionTitle>내 이력서</SectionTitle>
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[20px]">📄</span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#191F28]">대화로 만드는 이력서</p>
            <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">
              {started ? "이어서 대화하면 이력서가 더 채워져요" : "AI와 대화하면 이력서가 자동으로 쌓여요"}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Link
            href="/career-launch/resume-collect"
            className="flex items-center justify-center rounded-lg bg-[#0B46E8] px-3 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]"
          >
            {started ? "이어하기" : "시작하기"}
          </Link>
        </div>
      </Card>
    </div>
  );
}
