"use client";

// 파트너용 지원자 자기소개서 미리보기 — 탤런트 자소서 프리뷰(CoverA4Preview)와 동일한 UI.
import { useEffect, useState } from "react";
import { PartnerAppShell } from "../PartnerAppShell";
import { usePlatformT } from "../../../lib/i18n";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { CoverA4Preview } from "../../talent/career/CoverA4";
import { EMPTY_BASIC_INFO, type BasicInfo } from "../../../lib/talent/basic-info";
import type { CoverDoc } from "../../../lib/talent/cover-doc";
import { getMyPartnerApplicantById, type PartnerApplicantDetail } from "../../../lib/member-profile-client";

export function PartnerCoverPreviewScreen({ applicantId }: { applicantId: string }) {
  const t = usePlatformT();
  const [app, setApp] = useState<PartnerApplicantDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getMyPartnerApplicantById(applicantId)
      .then((d) => {
        setApp(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const doc = (app?.coverDoc ?? null) as CoverDoc | null;
  const info = (app?.resumeBasicInfo as BasicInfo | null) ?? EMPTY_BASIC_INFO;

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-3" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && app ? (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`${app.name} 님의 자기소개서`, `${app.name}'s cover letter`, `${app.name} 的求职信`, `Thư xin việc của ${app.name}`, `${app.name} さんの志望動機書`, `Surat lamaran ${app.name}`)}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t(`${app.positionTitle} 지원`, `Applied for ${app.positionTitle}`, `应聘 ${app.positionTitle}`, `Ứng tuyển ${app.positionTitle}`, `${app.positionTitle} に応募`, `Melamar ${app.positionTitle}`)}</p>
          </div>

          {doc && (doc.items?.length ?? 0) > 0 ? (
            <div className="mx-auto w-full max-w-[794px]">
              <CoverA4Preview doc={doc} info={info} />
            </div>
          ) : app.coverLetterShareSlug ? (
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-6 text-center">
              <p className="text-[15px] font-bold text-[#191F28]">{t("이 지원자는 예전 형식의 자기소개서를 사용해요", "This applicant uses an older cover letter format", "该申请者使用旧版求职信格式", "Ứng viên này dùng định dạng thư xin việc cũ", "この応募者は旧形式の志望動機書を使用しています", "Pelamar ini menggunakan format surat lamaran lama")}</p>
              <p className="mt-1 text-[13px] text-[#8B95A1]">{t("공유 페이지에서 자기소개서를 확인할 수 있어요.", "You can view the cover letter on the shared page.", "可在共享页面查看求职信。", "Bạn có thể xem thư xin việc trên trang chia sẻ.", "共有ページで志望動機書を確認できます。", "Anda bisa melihat surat lamaran di halaman berbagi.")}</p>
              <a href={`/cover-letter/share/${app.coverLetterShareSlug}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
                {t("자기소개서 열기 ↗", "Open cover letter ↗", "打开求职信 ↗", "Mở thư xin việc ↗", "志望動機書を開く ↗", "Buka surat lamaran ↗")}
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
              <p className="text-[15px] font-bold text-[#191F28]">{t("제출된 자기소개서가 없어요", "No cover letter submitted", "未提交求职信", "Chưa nộp thư xin việc", "提出された志望動機書がありません", "Belum ada surat lamaran")}</p>
            </div>
          )}
        </div>
      ) : null}
    </PartnerAppShell>
  );
}
