"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCohorts, createCohort, updateCohort, type OpsCohort } from "../../../../lib/launch/enrollment-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";

// 운영자 기수 관리 — 대학·기수 단위로 생성/관리. 등록된 학생만 프로그램에 접근한다.
export default function LaunchOpsCohortsPage() {
  const [cohorts, setCohorts] = useState<OpsCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [university, setUniversity] = useState("");
  const [name, setName] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      setCohorts(await fetchCohorts());
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!university.trim() || !name.trim() || creating) return;
    setCreating(true);
    setError("");
    try {
      await createCohort({
        university: university.trim(),
        name: name.trim(),
        startsAt: starts ? new Date(starts).toISOString() : undefined,
        endsAt: ends ? new Date(ends).toISOString() : undefined
      });
      setUniversity("");
      setName("");
      setStarts("");
      setEnds("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "생성에 실패했어요.");
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (c: OpsCohort) => {
    const next = c.status === "active" ? "ended" : "active";
    setCohorts((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
    try {
      await updateCohort(c.id, { status: next });
    } catch {
      void load();
    }
  };

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="mb-6">
          <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">기수 관리</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">대학·기수 단위로 운영해요. 등록된 학생만 Career Launch에 접근할 수 있어요.</p>
        </div>

        {/* 기수 생성 */}
        <Card className="mb-7 md:!p-6">
          <SectionTitle sub="대학명과 기수를 입력하면 초대코드가 자동 발급돼요">새 기수 만들기</SectionTitle>
          <form onSubmit={submit} className="grid gap-2.5 sm:grid-cols-2">
            <input value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="대학명 (예: 고려대학교)" className="rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] focus:border-[#0B46E8] focus:outline-none" />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="기수 (예: 2기)" className="rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] focus:border-[#0B46E8] focus:outline-none" />
            <label className="flex items-center gap-2 text-[12.5px] text-[#8B95A1]">시작<input type="date" value={starts} onChange={(e) => setStarts(e.target.value)} className="flex-1 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2.5 text-[13px] focus:border-[#0B46E8] focus:outline-none" /></label>
            <label className="flex items-center gap-2 text-[12.5px] text-[#8B95A1]">종료<input type="date" value={ends} onChange={(e) => setEnds(e.target.value)} className="flex-1 rounded-xl border border-[#E5E8EB] bg-white px-3 py-2.5 text-[13px] focus:border-[#0B46E8] focus:outline-none" /></label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={!university.trim() || !name.trim() || creating} className={`rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition ${university.trim() && name.trim() && !creating ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}>
                {creating ? "만드는 중…" : "기수 만들기"}
              </button>
            </div>
          </form>
        </Card>

        <SectionTitle sub="카드를 누르면 상세·학생 등록으로 이동해요">기수 목록</SectionTitle>
        {error ? <p className="mb-3 text-[13px] text-[#E5484D]">{error}</p> : null}
        {loading ? (
          <Card className="!p-6 text-center text-[13px] text-[#8B95A1]">불러오는 중…</Card>
        ) : cohorts.length === 0 ? (
          <Card className="!p-6 text-center text-[14px] text-[#8B95A1]">아직 기수가 없어요. 위에서 새 기수를 만들어 주세요.</Card>
        ) : (
          <div className="space-y-2.5">
            {cohorts.map((c) => (
              <Card key={c.id} className="!p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={`/career-launch/ops/cohorts/${c.id}`} className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15px] font-black text-[#0B1227]">{c.university} · {c.name}</p>
                      {c.status === "active" ? <Pill tone="green">진행 중</Pill> : <Pill tone="grey">종료</Pill>}
                    </div>
                    <p className="mt-1 text-[12.5px] text-[#8B95A1]">
                      초대코드 <span className="font-bold tracking-[0.08em] text-[#0B46E8]">{c.inviteCode}</span> · 등록 {c.enrolledCount}명
                    </p>
                  </Link>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleStatus(c)} className="rounded-lg border border-[#D7DCE3] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#4E5968] transition hover:border-[#0B46E8]/40">
                      {c.status === "active" ? "종료로 전환" : "다시 진행"}
                    </button>
                    <Link href={`/career-launch/ops/cohorts/${c.id}`} className="rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">관리 →</Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </LaunchContainer>
    </main>
  );
}
