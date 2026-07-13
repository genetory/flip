"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchOpsStudents, type OpsStudent } from "../../../../lib/launch/ops-client";
import { Card, LaunchContainer, ProgressBar, SectionTitle } from "../../../../components/launch/ui";

// 운영자 리포트 — 학생 진행 데이터(실데이터)로 기수별 집계.
export default function LaunchOpsReportPage() {
  const [students, setStudents] = useState<OpsStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("all");

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

  const cohorts = useMemo(() => {
    const map = new Map<string, { id: string; university: string; name: string }>();
    for (const s of students) if (s.cohort) map.set(s.cohort.id, s.cohort);
    return [...map.values()].sort((a, b) => `${a.university}${a.name}`.localeCompare(`${b.university}${b.name}`));
  }, [students]);

  const filtered = useMemo(() => {
    if (filter === "all") return students;
    if (filter === "none") return students.filter((s) => !s.cohort);
    return students.filter((s) => s.cohort?.id === filter);
  }, [students, filter]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const diag = filtered.filter((s) => s.diagnosisPercent !== null);
    const jobs = filtered.filter((s) => s.selectedJobs > 0).length;
    const mats = filtered.filter((s) => s.materials > 0).length;
    const resume = filtered.filter((s) => s.hasResume).length;
    const cover = filtered.filter((s) => s.coverItems > 0).length;
    const interviewAny = filtered.filter((s) => s.interviewPracticed > 0).length;
    const interviewAll = filtered.filter((s) => s.interviewPracticed >= 3).length;
    const avgDiag = diag.length ? Math.round(diag.reduce((n, s) => n + (s.diagnosisPercent ?? 0), 0) / diag.length) : 0;
    const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
    return { total, diag: diag.length, jobs, mats, resume, cover, interviewAny, interviewAll, avgDiag, pct };
  }, [filtered]);

  const funnel = [
    { label: "이용 시작", value: stats.total },
    { label: "진단", value: stats.diag },
    { label: "직무 선정", value: stats.jobs },
    { label: "직무 정리", value: stats.mats },
    { label: "이력서", value: stats.resume },
    { label: "자기소개서", value: stats.cover },
    { label: "모의면접", value: stats.interviewAny }
  ];
  const maxFunnel = Math.max(1, funnel[0].value);

  const downloadCsv = () => {
    const head = ["이름", "이메일", "기수", "진단(%)", "직무", "직무정리", "이력서", "자소서문항", "면접라운드", "완료스텝"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map((s) =>
      [
        s.name ?? "",
        s.email,
        s.cohort ? `${s.cohort.university} ${s.cohort.name}` : "미등록",
        s.diagnosisPercent ?? "",
        s.selectedJobs,
        s.materials,
        s.hasResume ? "O" : "",
        s.coverItems,
        `${s.interviewPracticed}/3`,
        s.doneSteps
      ].map(esc).join(",")
    );
    const csv = "﻿" + [head.map(esc).join(","), ...rows].join("\n"); // BOM(엑셀 한글)
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const label = filter === "all" ? "전체" : filter === "none" ? "미등록" : cohorts.find((c) => c.id === filter)?.name ?? "기수";
    a.href = url;
    a.download = `career-launch_${label}_학생현황.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">결과 리포트</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">Career Launch 실사용 데이터로 집계한 지표예요.</p>
          </div>
          {!loading && filtered.length > 0 ? (
            <button
              type="button"
              onClick={downloadCsv}
              className="inline-flex flex-none items-center gap-1.5 rounded-xl border border-[#0B46E8]/25 bg-white px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"
            >
              CSV 내보내기 ↓
            </button>
          ) : null}
        </div>

        {!loading && cohorts.length > 0 ? (
          <div className="mb-5 flex flex-wrap gap-1.5">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>전체</Chip>
            {cohorts.map((c) => (
              <Chip key={c.id} active={filter === c.id} onClick={() => setFilter(c.id)}>{c.university} · {c.name}</Chip>
            ))}
            {students.some((s) => !s.cohort) ? <Chip active={filter === "none"} onClick={() => setFilter("none")}>미등록</Chip> : null}
          </div>
        ) : null}

        {loading ? (
          <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">불러오는 중…</Card>
        ) : error ? (
          <Card className="!p-6 text-center text-[14px] text-red-600">{error}</Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {[
                { k: "학생", v: `${stats.total}명`, tone: "text-[#0B46E8]" },
                { k: "완주(면접 3라운드)", v: `${stats.interviewAll}명`, tone: "text-emerald-600" },
                { k: "이력서·자소서", v: `${stats.resume}·${stats.cover}명`, tone: "text-[#0B46E8]" },
                { k: "평균 준비도", v: `${stats.avgDiag}%`, tone: "text-[#3A6B00]" }
              ].map((s) => (
                <Card key={s.k} className="!p-4">
                  <p className={`text-[22px] font-black ${s.tone}`}>{s.v}</p>
                  <p className="mt-0.5 text-[12px] text-[#8B95A1]">{s.k}</p>
                </Card>
              ))}
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
              <div>
                <SectionTitle>단계별 완료율</SectionTitle>
                <Card className="space-y-4">
                  <Metric label="진단" value={stats.pct(stats.diag)} />
                  <Metric label="직무 선정" value={stats.pct(stats.jobs)} />
                  <Metric label="직무 정리" value={stats.pct(stats.mats)} />
                  <Metric label="이력서" value={stats.pct(stats.resume)} />
                  <Metric label="자기소개서" value={stats.pct(stats.cover)} />
                  <Metric label="모의면접(1라운드+)" value={stats.pct(stats.interviewAny)} />
                  <Metric label="완주(3라운드)" value={stats.pct(stats.interviewAll)} />
                </Card>
              </div>

              <div>
                <SectionTitle sub="이용 → 진단 → 직무 → 이력서 → 자소서 → 면접">참여 퍼널</SectionTitle>
                <Card className="space-y-3">
                  {funnel.map((f) => (
                    <div key={f.label}>
                      <div className="mb-1 flex items-center justify-between text-[12.5px]">
                        <span className="font-semibold text-[#4E5968]">{f.label}</span>
                        <span className="font-bold text-[#191F28]">{f.value}명</span>
                      </div>
                      <div className="h-7 w-full overflow-hidden rounded-lg bg-[#F2F4F6]">
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

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-[12.5px] font-bold transition ${active ? "bg-[#0B46E8] text-white" : "bg-[#F2F4F6] text-[#4E5968] hover:bg-[#E9ECF0]"}`}
    >
      {children}
    </button>
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
