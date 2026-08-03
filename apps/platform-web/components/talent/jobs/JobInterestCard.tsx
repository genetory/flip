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
        <section className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">나의 관심 직무</h2>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-2 text-[13px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]"
            >
              {has ? "직무 편집" : "직무 선택"}
            </button>
          </div>
          {has ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {interests.map((r) => (
                <span key={r} className="rounded-full bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">{r}</span>
              ))}
            </div>
          ) : (
            <p className="mt-2 break-keep text-[13px] text-[#8B95A1]">관심 직무를 고르면 나에게 맞는 공고를 추천해드려요.</p>
          )}
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
