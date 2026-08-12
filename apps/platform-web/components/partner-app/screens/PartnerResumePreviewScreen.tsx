"use client";

// 파트너용 지원자 이력서 미리보기 — 탤런트 이력서 프리뷰(ResumeA4Preview)와 동일한 UI.
import { useEffect, useState } from "react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { ResumeA4Preview } from "../../talent/career/ResumeA4";
import { EMPTY_BASIC_INFO, type BasicInfo } from "../../../lib/talent/basic-info";
import type { ResumeDoc } from "../../../lib/talent/resume-doc";
import { getMyPartnerApplicantById, type PartnerApplicantDetail } from "../../../lib/member-profile-client";
import { usePlatformT } from "../../../lib/i18n";

export function PartnerResumePreviewScreen({ applicantId }: { applicantId: string }) {
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

  const doc = (app?.resumeDoc ?? null) as ResumeDoc | null;
  const info = (app?.resumeBasicInfo as BasicInfo | null) ?? EMPTY_BASIC_INFO;

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-3" />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && app ? (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`${app.name} 님의 이력서`, `${app.name}'s resume`, `${app.name} 的简历`, `Sơ yếu lý lịch của ${app.name}`, `${app.name} さんの履歴書`, `Resume ${app.name}`)}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t(`${app.positionTitle} 지원`, `Applied to ${app.positionTitle}`, `申请 ${app.positionTitle}`, `Ứng tuyển ${app.positionTitle}`, `${app.positionTitle} に応募`, `Melamar ${app.positionTitle}`)}</p>
          </div>

          {doc ? (
            <div className="mx-auto w-full max-w-[794px]">
              <ResumeA4Preview doc={doc} info={info} />
            </div>
          ) : app.resumeShareSlug ? (
            <div className="rounded-2xl border border-[#EEF1F5] bg-white p-6 text-center">
              <p className="text-[15px] font-bold text-[#191F28]">{t("이 지원자는 예전 형식의 이력서를 사용해요", "This applicant uses an old-format resume", "该申请者使用旧格式简历", "Ứng viên này dùng sơ yếu lý lịch định dạng cũ", "この応募者は旧形式の履歴書を使用しています", "Pelamar ini memakai resume format lama")}</p>
              <p className="mt-1 text-[13px] text-[#8B95A1]">{t("공유 페이지에서 이력서를 확인할 수 있어요.", "You can view the resume on the share page.", "可在分享页面查看简历。", "Bạn có thể xem sơ yếu lý lịch trên trang chia sẻ.", "共有ページで履歴書を確認できます。", "Resume bisa dilihat di halaman berbagi.")}</p>
              <a href={`/resume/share/${app.resumeShareSlug}?view=preview`} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
                {t("이력서 열기 ↗", "Open resume ↗", "打开简历 ↗", "Mở sơ yếu lý lịch ↗", "履歴書を開く ↗", "Buka resume ↗")}
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
              <p className="text-[15px] font-bold text-[#191F28]">{t("제출된 이력서가 없어요", "No resume submitted", "未提交简历", "Chưa nộp sơ yếu lý lịch", "提出された履歴書はありません", "Belum ada resume")}</p>
            </div>
          )}
        </div>
      ) : null}
    </PartnerAppShell>
  );
}
