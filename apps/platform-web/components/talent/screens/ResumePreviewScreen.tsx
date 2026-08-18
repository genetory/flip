"use client";

// 이력서 전체 미리보기 — 실제 A4 형태를 크게 보여주는 페이지.
import Link from "next/link";
import { TalentAppShell } from "../app/TalentAppShell";
import { TalentBackButton } from "../TalentBackButton";
import { ResumeA4Preview } from "../career/ResumeA4";
import { PrintStyles, PdfDownloadButton, PDF_PRINT_AREA } from "../career/pdf-print";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useResumeDoc } from "../../../lib/talent/resume-doc";
import { useBasicInfo } from "../../../lib/talent/basic-info";
import { usePlatformT } from "../../../lib/i18n";

export function ResumePreviewScreen() {
  const t = usePlatformT();
  const doc = useResumeDoc();
  const info = useBasicInfo();

  return (
    <TalentAppShell>
      <PrintStyles />
      <div className="flex flex-col gap-5">
        <div>
          <TalentBackButton className="mb-3" />
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("이력서 미리보기","Resume preview","简历预览","Xem trước CV","履歴書プレビュー","Pratinjau CV")}</h1>
            {doc !== null ? <PdfDownloadButton /> : null}
          </div>
        </div>

        {doc === null ? (
          <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
            <p className="text-[15px] font-bold text-[#191F28]">{t("아직 이력서가 없어요","No resume yet","还没有简历","Chưa có CV","まだ履歴書がありません","Belum ada CV")}</p>
            <p className="mt-1 text-[13px] text-[#8B95A1]">{t("먼저 이력서를 만들어주세요.","Please create a resume first.","请先制作简历。","Hãy tạo CV trước.","まず履歴書を作ってください。","Buat CV dulu ya.")}</p>
            <Link href={talentAppRoutes.resume} className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
              {t("이력서 만들기","Create resume","制作简历","Tạo CV","履歴書を作る","Buat CV")}
            </Link>
          </div>
        ) : (
          <div className={`mx-auto w-full max-w-[794px] ${PDF_PRINT_AREA}`}>
            <ResumeA4Preview doc={doc} info={info} />
          </div>
        )}
      </div>
    </TalentAppShell>
  );
}
