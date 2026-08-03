"use client";

// 이력서·자기소개서 상단 프로필 카드 — 공용. 이름·연락처 + 프로필 편집 버튼(+선택: 사진).
import Link from "next/link";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import type { BasicInfo } from "../../../lib/talent/basic-info";

export function ProfileCard({ info, showPhoto = false }: { info: BasicInfo; showPhoto?: boolean }) {
  const contact = [info.phone, info.address].filter(Boolean).join(" · ");
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <div className="flex items-center gap-4">
        {info.photoUrl && showPhoto ? (
          <span className="h-[92px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-[#E5E8EB] bg-[#F2F4F6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.photoUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[17px] font-black text-[#0B1227]">{info.realName || "이름"}</p>
          <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{info.email}</p>
          {contact ? <p className="truncate text-[12.5px] text-[#8B95A1]">{contact}</p> : null}
        </div>
        <Link href={talentAppRoutes.profile} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3 py-2 text-[13px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]">
          프로필 편집
        </Link>
      </div>
    </div>
  );
}
