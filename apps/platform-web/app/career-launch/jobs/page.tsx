"use client";

import { useState } from "react";
import Link from "next/link";
import { RECOMMENDED_JOBS, STUDENT } from "../../../lib/launch/data";
import { Card, Pill, SectionTitle } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

// Week 1 — 프로그램 안에서 AI가 추천한 직무를 보고, 관심 직무를 최대 3개 선택한다.
// (추천·선택 저장은 지금은 로컬 목업. 이후 프로필 분석/서버 저장 연동)
const MAX_PICK = 3;
const STORAGE_KEY = "career-launch:selected-jobs";

export default function LaunchJobsPage() {
  const [picked, setPicked] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const toggle = (id: string) => {
    setSaved(false);
    setPicked((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PICK) return prev; // 3개 초과 방지
      return [...prev, id];
    });
  };

  const savePick = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(picked));
    } catch {
      // localStorage 불가 시 무시(선택 상태는 화면에 유지)
    }
    setSaved(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-28">
        <div className="mx-auto w-full max-w-6xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← 대시보드
          </Link>

          {/* 헤더 */}
          <div className="mt-3 rounded-2xl border border-[#CFE0FF] bg-[#EDF1FD] p-5 md:p-6">
            <div className="flex items-center gap-2">
              <span className="text-[18px]">🪄</span>
              <p className="text-[12.5px] font-bold text-[#0B46E8]">AI 직무 추천</p>
            </div>
            <h1 className="mt-1.5 text-[20px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[24px]">
              {STUDENT.name}님께 어울리는 직무예요
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968] md:text-[14px]">
              전공·관심사·강점을 바탕으로 추천했어요. 마음이 가는 <b className="text-[#0B46E8]">직무를 최대 {MAX_PICK}개</b> 골라
              이번 주 방향을 정해봐요.
            </p>
          </div>

          {/* 추천 목록 */}
          <div className="mt-7">
            <SectionTitle sub="카드를 눌러 관심 직무를 선택해요">추천 직무</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {RECOMMENDED_JOBS.map((job) => {
                const selected = picked.includes(job.id);
                const disabled = !selected && picked.length >= MAX_PICK;
                return (
                  <Card
                    key={job.id}
                    onClick={disabled ? undefined : () => toggle(job.id)}
                    className={`flex flex-col md:!p-5 ${
                      selected ? "!border-[#0B46E8] ring-1 ring-[#0B46E8]/30" : disabled ? "opacity-55" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 text-[11px] font-black ${
                            selected ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#C9CDD2] text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                        <p className="text-[15.5px] font-bold text-[#191F28]">{job.role}</p>
                      </div>
                      <Pill tone="blue">매칭 {job.match}%</Pill>
                    </div>
                    <p className="mt-2 text-[13px] leading-relaxed text-[#4E5968]">{job.reason}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {job.skills.map((s) => (
                        <span key={s} className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[11.5px] font-semibold text-[#4E5968]">
                          {s}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/positions?query=${encodeURIComponent(job.query)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#F2F4F6] py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]"
                    >
                      이 직무 공고 보기 →
                    </Link>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* 하단 고정 — 선정 요약 + 완료 */}
      <div className="sticky bottom-0 z-30 border-t border-[#EEF1F5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
          <p className="text-[13px] font-semibold text-[#4E5968]">
            {saved ? (
              <span className="text-[#0B46E8]">✓ {picked.length}개 직무를 선정했어요</span>
            ) : (
              <>
                <span className="font-black text-[#0B46E8]">{picked.length}</span>
                <span className="text-[#8B95A1]"> / {MAX_PICK} 선택</span>
              </>
            )}
          </p>
          {saved ? (
            <Link
              href="/career-launch/dashboard"
              className="rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
            >
              대시보드에서 확인하기 →
            </Link>
          ) : (
            <button
              type="button"
              disabled={picked.length === 0}
              onClick={savePick}
              className={`rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition ${
                picked.length > 0 ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
              }`}
            >
              선정 완료
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
