"use client";

import { useState } from "react";
import { OPS_SUBMISSIONS, type MissionStatus } from "../../../../lib/launch/data";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";

// 11. 운영자 제출물 관리 페이지
const STATUS_META: Record<MissionStatus, { t: string; tone: "grey" | "blue" | "green" }> = {
  todo: { t: "미제출", tone: "grey" },
  submitted: { t: "검토 대기", tone: "blue" },
  reviewed: { t: "피드백 완료", tone: "green" }
};

export default function LaunchOpsSubmissionsPage() {
  const [subs, setSubs] = useState(OPS_SUBMISSIONS);
  const pending = subs.filter((s) => s.status === "submitted").length;

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="!p-4 text-center">
            <p className="text-[22px] font-black text-[#0B46E8]">{subs.length}</p>
            <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">전체 제출물</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-[22px] font-black text-amber-600">{pending}</p>
            <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">검토 대기</p>
          </Card>
        </div>

        <div className="mt-7">
          <SectionTitle sub="제출된 과제를 검토하고 피드백을 완료 처리하세요">제출물 목록</SectionTitle>
          <div className="space-y-2.5">
            {subs.map((s) => (
              <Card key={s.id} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Pill tone="grey">W{s.week}</Pill>
                      <p className="truncate text-[14px] font-bold text-[#191F28]">{s.student}</p>
                    </div>
                    <p className="mt-1 truncate text-[13px] text-[#4E5968]">{s.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">제출 {s.submittedAt}</p>
                  </div>
                  <Pill tone={STATUS_META[s.status].tone}>{STATUS_META[s.status].t}</Pill>
                </div>
                {s.status === "submitted" ? (
                  <button
                    type="button"
                    onClick={() => setSubs((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: "reviewed" } : x)))}
                    className="mt-3 w-full rounded-xl bg-[#0B46E8] py-2.5 text-[13px] font-bold text-white"
                  >
                    피드백 완료 처리
                  </button>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      </LaunchContainer>
    </main>
  );
}
