"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchOpsStudents, type OpsStudent } from "../../../../lib/launch/ops-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";

// 운영자 학생 관리 — Career Launch 를 이용한 학생 목록(실데이터). 클릭 시 상세로 이동.
export default function LaunchOpsStudentsPage() {
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const list = await fetchOpsStudents();
        if (alive) setStudents(list);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const withResume = students.filter((s) => s.hasResume).length;

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-[640px] pt-6">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { k: "이용 학생", v: students.length },
            { k: "이력서 작성", v: withResume },
            { k: "진단 완료", v: students.filter((s) => s.diagnosisPercent !== null).length }
          ].map((s) => (
            <Card key={s.k} className="!p-4 text-center">
              <p className="text-[22px] font-black text-[#0B46E8]">{s.v}</p>
              <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{s.k}</p>
            </Card>
          ))}
        </div>

        <div className="mt-7">
          <SectionTitle sub="진행 상태·이력서를 보고 피드백을 남길 수 있어요">학생 목록</SectionTitle>
          {loading ? (
            <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">불러오는 중…</Card>
          ) : error ? (
            <Card className="!p-6 text-center text-[14px] text-red-600">{error}</Card>
          ) : students.length === 0 ? (
            <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">아직 Career Launch 를 이용한 학생이 없어요.</Card>
          ) : (
            <div className="space-y-2.5">
              {students.map((st) => (
                <Link key={st.userId} href={`/career-launch/ops/students/${st.userId}`} className="block">
                  <Card className="!p-4 transition hover:border-[#0B46E8]/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[13px] font-black text-[#0B46E8]">
                          {(st.name ?? st.email).charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#191F28]">{st.name ?? "이름 미설정"}</p>
                          <p className="truncate text-[12px] text-[#8B95A1]">{st.email}</p>
                        </div>
                      </div>
                      <span className="flex flex-none items-center gap-1.5">
                        {st.diagnosisPercent !== null ? <Pill tone="blue">진단 {st.diagnosisPercent}%</Pill> : null}
                        {st.hasResume ? <Pill tone="green">이력서</Pill> : null}
                      </span>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-[#8B95A1]">
                      <span>직무 {st.selectedJobs}개</span>
                      <span>직무정보 {st.materials}개</span>
                      <span>완료 스텝 {st.doneSteps}개</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </LaunchContainer>
    </main>
  );
}
