"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOpsStudents, type OpsStudent } from "../../../../lib/launch/ops-client";
import { Card, LaunchContainer, ProgressBar, SectionTitle } from "../../../../components/launch/ui";

// 운영자 리포트 — 학생 진행 데이터(실데이터)로 집계.
export default function LaunchOpsReportPage() {
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

  const stats = useMemo(() => {
    const total = students.length;
    const diagDone = students.filter((s) => s.diagnosisPercent !== null);
    const jobsDone = students.filter((s) => s.selectedJobs > 0).length;
    const resumeDone = students.filter((s) => s.hasResume).length;
    const avgDiag = diagDone.length ? Math.round(diagDone.reduce((n, s) => n + (s.diagnosisPercent ?? 0), 0) / diagDone.length) : 0;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return { total, diagCount: diagDone.length, jobsDone, resumeDone, avgDiag, pctDiag: pct(diagDone.length), pctJobs: pct(jobsDone), pctResume: pct(resumeDone) };
  }, [students]);

  const funnel = [
    { label: "이용 시작", value: stats.total },
    { label: "진단 완료", value: stats.diagCount },
    { label: "직무 선정", value: stats.jobsDone },
    { label: "이력서 작성", value: stats.resumeDone }
  ];
  const maxFunnel = Math.max(1, funnel[0].value);

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-6">
          <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">결과 리포트</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">Career Launch 실사용 데이터로 집계한 지표예요.</p>
        </div>

        {loading ? (
          <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">불러오는 중…</Card>
        ) : error ? (
          <Card className="!p-6 text-center text-[14px] text-red-600">{error}</Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { k: "이용 학생", v: `${stats.total}명`, tone: "text-[#0B46E8]" },
                { k: "진단 완료", v: `${stats.diagCount}명`, tone: "text-[#0B46E8]" },
                { k: "이력서 작성", v: `${stats.resumeDone}명`, tone: "text-emerald-600" },
                { k: "평균 준비도", v: `${stats.avgDiag}%`, tone: "text-[#3A6B00]" }
              ].map((s) => (
                <Card key={s.k} className="!p-4">
                  <p className={`text-[24px] font-black ${s.tone}`}>{s.v}</p>
                  <p className="mt-0.5 text-[12px] text-[#8B95A1]">{s.k}</p>
                </Card>
              ))}
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-2 lg:gap-8 lg:items-start">
            <div>
              <SectionTitle>단계별 완료율</SectionTitle>
              <Card className="space-y-5">
                <Metric label="진단 완료율" value={stats.pctDiag} />
                <Metric label="직무 선정율" value={stats.pctJobs} />
                <Metric label="이력서 작성률" value={stats.pctResume} />
              </Card>
            </div>

            <div>
              <SectionTitle sub="이용 → 진단 → 직무 → 이력서">참여 퍼널</SectionTitle>
              <Card className="space-y-3.5">
                {funnel.map((f) => (
                  <div key={f.label}>
                    <div className="mb-1 flex items-center justify-between text-[12.5px]">
                      <span className="font-semibold text-[#4E5968]">{f.label}</span>
                      <span className="font-bold text-[#191F28]">{f.value}명</span>
                    </div>
                    <div className="h-8 w-full overflow-hidden rounded-lg bg-[#F2F4F6]">
                      <div
                        className="flex h-full items-center justify-end rounded-lg pr-2 text-[11px] font-bold text-white"
                        style={{ width: `${Math.max(12, (f.value / maxFunnel) * 100)}%`, background: "#0B46E8" }}
                      >
                        {Math.round((f.value / maxFunnel) * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
            </div>
          </>
        )}
      </LaunchContainer>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className="font-semibold text-[#4E5968]">{label}</span>
        <span className="font-black text-[#0B46E8]">{value}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}
