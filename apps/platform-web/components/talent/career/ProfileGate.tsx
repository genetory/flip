"use client";

// 기본 정보 미등록 게이트 — 실명·이메일·연락처·주소가 없으면 이력서·자기소개서로 진행할 수 없다.
import Link from "next/link";
import { Check, ArrowRight, IdentificationCard } from "@phosphor-icons/react";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { basicInfoChecklist, useBasicInfo } from "../../../lib/talent/basic-info";

export function ProfileGate() {
  const info = useBasicInfo();
  const items = basicInfoChecklist(info);

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#EEF1F5] bg-white shadow-[0_10px_30px_-12px_rgba(11,18,39,0.12)]">
      <div className="p-6 md:p-7">
        <div className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD]">
            <IdentificationCard className="h-6 w-6 text-[#0B46E8]" weight="fill" />
          </span>
          <div className="min-w-0">
            <p className="text-[12.5px] font-bold text-[#8B95A1]">시작하기 전에</p>
            <h2 className="mt-0.5 text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">기본 정보를 등록해주세요</h2>
          </div>
        </div>

        <p className="mt-4 break-keep text-[13.5px] leading-[1.65] text-[#4E5968]">
          실명·이메일·연락처·주소는 이력서와 자기소개서에 그대로 쓰여요. 한 번만 등록하면 이후엔 자동으로 반영돼요.
        </p>

        {/* 체크리스트 */}
        <ul className="mt-5 divide-y divide-[#F4F6F8]">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-3 py-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-2xl transition ${
                  it.done ? "bg-[#0B46E8] text-white" : "border border-[#E1E6EC] bg-white text-transparent"
                }`}
              >
                <Check className="h-3.5 w-3.5" weight="bold" />
              </span>
              <span className={`text-[14px] font-semibold ${it.done ? "text-[#B0B8C1] line-through" : "text-[#191F28]"}`}>{it.label}</span>
              {it.optional ? <span className="ml-auto text-[11.5px] font-medium text-[#B0B8C1]">선택</span> : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-[#F4F6F8] p-4">
        <Link
          href={talentAppRoutes.profile}
          className="flex h-[48px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB]"
        >
          기본 정보 등록하기 <ArrowRight className="h-4 w-4" weight="bold" />
        </Link>
      </div>
    </section>
  );
}
