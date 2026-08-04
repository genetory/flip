"use client";

// 관심 직무 카드 — 두 형태.
//  - variant="link"(홈): 카드 전체 탭 → 선택 팝업.
//  - variant="edit"(계정설정·프로필): 카드에서 바로 수정(칩 인라인 삭제 + 추가 버튼).
import { useState } from "react";
import Link from "next/link";
import { CaretRight, Plus, X } from "@phosphor-icons/react";
import { useJobInterests, saveJobInterests } from "../../../lib/talent/job-interest";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { JobInterestModal } from "./JobInterestModal";

export function JobInterestCard({ variant = "link" }: { variant?: "link" | "edit" }) {
  const interests = useJobInterests();
  const [open, setOpen] = useState(false);
  const has = interests.length > 0;

  if (variant === "edit") {
    const remove = (r: string) => saveJobInterests(interests.filter((x) => x !== r));
    return (
      <>
        <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
          {/* 헤더 — 아이콘 + 타이틀/서브 */}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] text-[18px]" aria-hidden>🎯</span>
            <div className="min-w-0">
              <h2 className="truncate text-[16px] font-black tracking-[-0.02em] text-[#0B1227]">나의 관심 직무</h2>
              <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{has ? `${interests.length}개 · 맞춤 공고 추천의 기준` : "고르면 나에게 맞는 공고를 추천해드려요"}</p>
            </div>
          </div>

          {/* 인라인 편집 칩 — 각 칩 ×로 삭제, + 추가로 선택 팝업 */}
          <div className="mt-4 flex flex-wrap gap-2">
            {interests.map((r) => (
              <span key={r} className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] py-1.5 pl-3.5 pr-2 text-[12.5px] font-bold text-[#0B46E8]">
                {r}
                <button
                  type="button"
                  onClick={() => remove(r)}
                  aria-label={`${r} 삭제`}
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[#8AA6EF] transition hover:bg-white/70 hover:text-[#0B46E8]"
                >
                  <X className="h-3 w-3" weight="bold" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#C7D6F7] px-3.5 py-1.5 text-[12.5px] font-bold text-[#0B46E8] transition hover:bg-[#F0F5FF]"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" /> 추가
            </button>
          </div>

          {/* 값 — 관심 직무 맞춤 공고로 연결 */}
          {has ? (
            <Link
              href={talentAppRoutes.jobs}
              className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-[#F6F8FB] px-4 py-3 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#EEF1F5] hover:text-[#0B46E8]"
            >
              관심 직무 맞춤 공고 보기
              <CaretRight className="h-4 w-4 shrink-0" weight="bold" />
            </Link>
          ) : null}
        </section>
        {open ? <JobInterestModal initial={interests} onClose={() => setOpen(false)} /> : null}
      </>
    );
  }

  // link 형태 — 카드 전체 탭 → 팝업
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex w-full items-center gap-3 rounded-2xl px-5 py-5 text-left transition ${
          has ? "border border-[#EEF1F5] bg-white hover:border-[#0B46E8]/40" : "border border-dashed border-[#DCE3F0] bg-[#FAFBFC] hover:border-[#0B46E8]/40"
        }`}
      >
        <div className="min-w-0 flex-1">
          {has ? (
            <>
              <p className="text-[15px] font-bold text-[#191F28]">나의 관심 직무</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {interests.map((r) => (
                  <span key={r} className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{r}</span>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] font-bold text-[#191F28]">관심 직무를 골라주세요</p>
              <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">고르면 나에게 맞는 공고를 추천해드려요.</p>
            </>
          )}
        </div>
        <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
      </button>
      {open ? <JobInterestModal initial={interests} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
