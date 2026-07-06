"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { recommendJobs, STUDENT } from "../../../lib/launch/data";
import { Card, Pill, SectionTitle } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";

// Week 1 — 전공·관심 정보로 추천을 재정렬하고, 추천에서 고르거나 직무를 직접
// 추가해 관심 직무를 최대 3개 선택한다. 선택·입력은 저장돼 다시 와도 유지된다.
// (추천·저장은 지금은 로컬 목업. 이후 프로필 분석/서버 저장 연동)
const MAX_PICK = 3;
const KEY_SEL = "career-launch:selected-jobs";
const KEY_KW = "career-launch:jobs-keyword";

export default function LaunchJobsPage() {
  const { user } = useAuthSession();
  const displayName = user?.name?.trim() || user?.email || STUDENT.name;

  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState("");
  const [saved, setSaved] = useState(false);

  // 저장된 선택·키워드 복원(다시 와도 유지).
  useEffect(() => {
    try {
      const s = window.localStorage.getItem(KEY_SEL);
      if (s) setSelected(JSON.parse(s));
      const k = window.localStorage.getItem(KEY_KW);
      if (k) setKeyword(k);
    } catch {
      // 복원 실패 시 빈 상태로 시작
    }
  }, []);

  const recs = recommendJobs(keyword);
  const full = selected.length >= MAX_PICK;

  const toggle = (role: string) => {
    setSaved(false);
    setSelected((prev) => (prev.includes(role) ? prev.filter((x) => x !== role) : prev.length >= MAX_PICK ? prev : [...prev, role]));
  };

  const addCustom = () => {
    const r = custom.trim();
    if (!r) return;
    setSaved(false);
    setSelected((prev) => (prev.includes(r) || prev.length >= MAX_PICK ? prev : [...prev, r]));
    setCustom("");
  };

  const save = () => {
    try {
      window.localStorage.setItem(KEY_SEL, JSON.stringify(selected));
      window.localStorage.setItem(KEY_KW, keyword);
    } catch {
      // 저장 불가 시 화면 상태는 유지
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
              {displayName}님께 어울리는 직무예요
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4E5968] md:text-[14px]">
              전공·관심 분야를 입력하면 그에 맞게 추천해드려요. 추천에서 고르거나 <b className="text-[#0B46E8]">직무를 직접 추가</b>해
              최대 {MAX_PICK}개를 정해봐요.
            </p>
          </div>

          {/* 내 정보 입력 */}
          <div className="mt-7">
            <SectionTitle sub="전공·관심 분야를 입력하면 추천이 바뀌어요">내 정보로 맞춤 추천</SectionTitle>
            <Card className="md:!p-5">
              <label className="block text-[12.5px] font-semibold text-[#4E5968]">
                전공 · 관심 분야
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="예: 경영학, 마케팅, IT, 무역"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
                />
              </label>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {["경영학", "마케팅", "IT", "무역", "디자인"].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKeyword(k)}
                    className="rounded-full bg-[#F2F4F6] px-3 py-1.5 text-[12px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]"
                  >
                    {k}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* 직접 추가 */}
          <div className="mt-6">
            <SectionTitle sub="원하는 직무가 추천에 없어도 직접 넣을 수 있어요">직무 직접 추가</SectionTitle>
            <Card className="flex gap-2 md:!p-4">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="예: UX 디자이너"
                className="h-11 flex-1 rounded-xl border border-[#E5E8EB] bg-white px-3.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] transition focus:border-[#0B46E8] focus:outline-none"
              />
              <button
                type="button"
                onClick={addCustom}
                disabled={!custom.trim() || full}
                className={`shrink-0 rounded-xl px-4 text-[13.5px] font-bold transition ${
                  custom.trim() && !full ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                }`}
              >
                추가
              </button>
            </Card>
          </div>

          {/* 선택한 직무 */}
          {selected.length > 0 ? (
            <div className="mt-6">
              <SectionTitle>선택한 직무 ({selected.length}/{MAX_PICK})</SectionTitle>
              <div className="flex flex-wrap gap-2">
                {selected.map((role) => (
                  <span
                    key={role}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] py-1.5 pl-3.5 pr-2 text-[13px] font-bold text-[#0B46E8]"
                  >
                    {role}
                    <button
                      type="button"
                      onClick={() => toggle(role)}
                      aria-label={`${role} 선택 해제`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[#0B46E8]/70 transition hover:bg-[#0B46E8]/10 hover:text-[#0B46E8]"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* 추천 목록 */}
          <div className="mt-7">
            <SectionTitle sub={keyword.trim() ? `'${keyword.trim()}'에 맞춰 정렬했어요` : "매칭이 높은 순서로 보여드려요"}>
              추천 직무
            </SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recs.map((job) => {
                const isSel = selected.includes(job.role);
                const disabled = !isSel && full;
                return (
                  <Card
                    key={job.id}
                    onClick={disabled ? undefined : () => toggle(job.role)}
                    className={`flex flex-col md:!p-5 ${isSel ? "!border-[#0B46E8] ring-1 ring-[#0B46E8]/30" : disabled ? "opacity-55" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 text-[11px] font-black ${
                            isSel ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#C9CDD2] text-transparent"
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
              <span className="text-[#0B46E8]">✓ {selected.length}개 직무를 선정했어요</span>
            ) : (
              <>
                <span className="font-black text-[#0B46E8]">{selected.length}</span>
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
              disabled={selected.length === 0}
              onClick={save}
              className={`rounded-xl px-5 py-2.5 text-[13.5px] font-bold transition ${
                selected.length > 0 ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
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
