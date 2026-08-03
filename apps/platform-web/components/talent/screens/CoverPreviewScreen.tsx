"use client";

// 자기소개서 전체 미리보기 — 실제 A4 형태를 크게.
import Link from "next/link";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { CoverA4Preview } from "../career/CoverA4";
import { PrintStyles, PdfDownloadButton, PDF_PRINT_AREA } from "../career/pdf-print";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useCoverDoc } from "../../../lib/talent/cover-doc";
import { useBasicInfo } from "../../../lib/talent/basic-info";

export function CoverPreviewScreen() {
  const doc = useCoverDoc();
  const info = useBasicInfo();

  return (
    <TalentAppShell>
      <PrintStyles />
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">자기소개서 미리보기</h1>
            {doc !== null ? <PdfDownloadButton /> : null}
          </div>
        </div>

        {doc === null ? (
          <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
            <p className="text-[15px] font-bold text-[#191F28]">아직 자기소개서가 없어요</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">먼저 자기소개서를 만들어주세요.</p>
            <Link href={talentAppRoutes.cover} className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
              자기소개서 만들기
            </Link>
          </div>
        ) : (
          <div className={`mx-auto w-full max-w-[794px] ${PDF_PRINT_AREA}`}>
            <CoverA4Preview doc={doc} info={info} />
          </div>
        )}
      </div>
    </TalentAppShell>
  );
}
