"use client";

// 관심 직무 카드 — 두 형태.
//  - variant="link"(홈): 카드 전체 탭 → 선택 팝업.
//  - variant="edit"(계정설정·프로필): 카드에서 바로 수정(칩 인라인 삭제 + 추가 버튼).
import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { JobInterestModal } from "./JobInterestModal";

export function JobInterestCard({ variant = "link" }: { variant?: "link" | "edit" }) {
  const interests = useJobInterests();
  const [open, setOpen] = useState(false);
  const has = interests.length > 0;

  if (variant === "edit") {
    return (
      <>
        <section className="overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
          {/* 헤더 밴드 — 아이콘 + 타이틀/서브 + 편집 */}
          <div className="flex items-center justify-between gap-3 border-b border-[#EAF0FE] bg-[#F5F8FF] px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[18px] shadow-[0_2px_10px_rgba(11,70,232,0.1)]" aria-hidden>🎯</span>
              <div className="min-w-0">
                <h2 className="truncate text-[15px] font-black tracking-[-0.02em] text-[#0B1227]">나의 관심 직무</h2>
                <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{has ? `${interests.length}개 선택됨 · 맞춤 공고의 기준` : "맞춤 공고 추천의 기준이 돼요"}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-lg bg-[#EDF1FD] px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#E0E9FC]"
            >
              {has ? "편집" : "선택"}
            </button>
          </div>

          {/* 본문 — 칩 또는 빈 상태 CTA */}
          <div className="p-5">
            {has ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((r) => (
                  <span key={r} className="rounded-full border border-[#DCE6FB] bg-[#EDF1FD] px-3.5 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">{r}</span>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#C7D6F7] bg-[#FAFBFF] py-4 text-[13.5px] font-bold text-[#0B46E8] transition hover:bg-[#F0F5FF]"
              >
                관심 직무 고르기 <CaretRight className="h-4 w-4" weight="bold" />
              </button>
            )}
          </div>
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
