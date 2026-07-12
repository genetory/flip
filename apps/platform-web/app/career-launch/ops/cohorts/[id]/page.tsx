"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchCohort, enrollStudent, unenrollStudent, deleteCohort, type OpsCohortDetail } from "../../../../../lib/launch/enrollment-client";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../../components/launch/ui";

// 운영자 기수 상세 — 초대코드 확인 + 학생 등록(이메일)/해제.
export default function LaunchOpsCohortDetailPage() {
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");

  const [cohort, setCohort] = useState<OpsCohortDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState("");

  const load = async () => {
    try {
      setCohort(await fetchCohort(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (id) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || adding) return;
    setAdding(true);
    setAddErr("");
    try {
      await enrollStudent(id, email.trim());
      setEmail("");
      await load();
    } catch (e) {
      setAddErr(e instanceof Error ? e.message : "등록에 실패했어요.");
    } finally {
      setAdding(false);
    }
  };

  const remove = async (studentUserId: string) => {
    setCohort((prev) => (prev ? { ...prev, students: prev.students.filter((s) => s.studentUserId !== studentUserId) } : prev));
    try {
      await unenrollStudent(id, studentUserId);
    } catch {
      void load();
    }
  };

  const removeCohort = async () => {
    if (!confirm("이 기수를 삭제할까요? 등록 정보도 함께 삭제됩니다.")) return;
    try {
      await deleteCohort(id);
      window.location.href = "/career-launch/ops/cohorts";
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    }
  };

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <Link href="/career-launch/ops/cohorts" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">← 기수 관리</Link>

        {loading ? (
          <Card className="mt-4 !p-6 text-center text-[13px] text-[#8B95A1]">불러오는 중…</Card>
        ) : !cohort ? (
          <Card className="mt-4 !p-6 text-center text-[14px] text-[#8B95A1]">{error || "기수를 찾을 수 없어요."}</Card>
        ) : (
          <>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">{cohort.university} · {cohort.name}</h1>
                {cohort.status === "active" ? <Pill tone="green">진행 중</Pill> : <Pill tone="grey">종료</Pill>}
              </div>
              <button type="button" onClick={removeCohort} className="text-[12.5px] font-semibold text-[#E5484D] transition hover:underline">기수 삭제</button>
            </div>
            <p className="mt-1.5 text-[13.5px] text-[#4E5968]">
              초대코드 <span className="font-black tracking-[0.1em] text-[#0B46E8]">{cohort.inviteCode}</span>
              <span className="ml-2 text-[12.5px] text-[#8B95A1]">— 학생이 이 코드로 자가등록할 수 있어요</span>
            </p>

            <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_1.4fr] lg:gap-8">
              {/* 학생 등록 */}
              <div>
                <SectionTitle sub="가입된 회원의 이메일로 바로 등록해요">학생 등록</SectionTitle>
                <Card className="md:!p-6">
                  <form onSubmit={add} className="space-y-2">
                    <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="학생 이메일" className="w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[14px] focus:border-[#0B46E8] focus:outline-none" />
                    {addErr ? <p className="text-[12.5px] text-[#E5484D]">{addErr}</p> : null}
                    <button type="submit" disabled={!email.trim() || adding} className={`w-full rounded-xl py-2.5 text-[13.5px] font-bold transition ${email.trim() && !adding ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"}`}>
                      {adding ? "등록 중…" : "등록하기"}
                    </button>
                  </form>
                </Card>
              </div>

              {/* 등록 학생 목록 */}
              <div>
                <SectionTitle>등록 학생 <span className="text-[#0B46E8]">{cohort.students.length}명</span></SectionTitle>
                {cohort.students.length === 0 ? (
                  <Card className="!p-6 text-center text-[13px] text-[#8B95A1]">아직 등록된 학생이 없어요.</Card>
                ) : (
                  <div className="space-y-2">
                    {cohort.students.map((s) => (
                      <Card key={s.studentUserId} className="flex items-center justify-between !p-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold text-[#191F28]">{s.name ?? s.email}</p>
                          <p className="truncate text-[12.5px] text-[#8B95A1]">{s.email}</p>
                        </div>
                        <button type="button" onClick={() => remove(s.studentUserId)} className="shrink-0 rounded-lg border border-[#D7DCE3] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#8B95A1] transition hover:border-[#E5484D]/40 hover:text-[#E5484D]">
                          해제
                        </button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </LaunchContainer>
    </main>
  );
}
