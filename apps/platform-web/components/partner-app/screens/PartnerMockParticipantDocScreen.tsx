"use client";

// 파트너 — 모의 면접 참여자의 이력서/자기소개서 미리보기(지원자 프리뷰와 동일 UI).
import { useEffect, useState } from "react";
import { PartnerAppShell } from "../PartnerAppShell";
import { TalentBackButton } from "../../talent/TalentBackButton";
import { TLoading, TError } from "../../talent/ui/primitives";
import { ResumeA4Preview } from "../../talent/career/ResumeA4";
import { CoverA4Preview } from "../../talent/career/CoverA4";
import { EMPTY_BASIC_INFO, type BasicInfo } from "../../../lib/talent/basic-info";
import type { ResumeDoc } from "../../../lib/talent/resume-doc";
import type { CoverDoc } from "../../../lib/talent/cover-doc";
import { getMockInterviewParticipantDetail, type MockInterviewParticipantDetail } from "../../../lib/member-profile-client";
import { usePlatformT } from "../../../lib/i18n";

export function PartnerMockParticipantDocScreen({ positionId, userId, kind }: { positionId: string; userId: string; kind: "resume" | "cover" }) {
  const t = usePlatformT();
  const [m, setM] = useState<MockInterviewParticipantDetail | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getMockInterviewParticipantDetail(positionId, userId)
      .then((d) => {
        setM(d);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positionId, userId]);

  const info = (m?.resumeBasicInfo as BasicInfo | null) ?? EMPTY_BASIC_INFO;
  const resumeDoc = (m?.resumeDoc ?? null) as ResumeDoc | null;
  const coverDoc = (m?.coverDoc ?? null) as CoverDoc | null;
  const label = kind === "resume" ? t("이력서", "Resume", "简历", "Sơ yếu lý lịch", "履歴書", "Resume") : t("자기소개서", "Cover letter", "求职信", "Thư xin việc", "志望動機書", "Surat lamaran");

  return (
    <PartnerAppShell>
      <TalentBackButton className="mb-3" fallback={`/partner/positions/${positionId}/mock/${encodeURIComponent(userId)}`} />
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" && m ? (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t(`${m.name} 님의 ${label}`, `${m.name}'s ${label}`, `${m.name} 的${label}`, `${label} của ${m.name}`, `${m.name} さんの${label}`, `${label} ${m.name}`)}</h1>
            <p className="mt-1 text-[13.5px] text-[#8B95A1]">{m.positionTitle} · {t("모의 면접 참여자", "Mock interview participant", "模拟面试参与者", "Người tham gia phỏng vấn thử", "模擬面接参加者", "Peserta wawancara simulasi")}</p>
          </div>

          {kind === "resume" ? (
            resumeDoc ? (
              <div className="mx-auto w-full max-w-[794px]"><ResumeA4Preview doc={resumeDoc} info={info} /></div>
            ) : m.resumeShareSlug ? (
              <OldFormat slug={`/resume/share/${m.resumeShareSlug}?view=preview`} label={label} />
            ) : (
              <Empty label={label} />
            )
          ) : coverDoc && (coverDoc.items?.length ?? 0) > 0 ? (
            <div className="mx-auto w-full max-w-[794px]"><CoverA4Preview doc={coverDoc} info={info} /></div>
          ) : m.coverLetterShareSlug ? (
            <OldFormat slug={`/cover-letter/share/${m.coverLetterShareSlug}`} label={label} />
          ) : (
            <Empty label={label} />
          )}
        </div>
      ) : null}
    </PartnerAppShell>
  );
}

function OldFormat({ slug, label }: { slug: string; label: string }) {
  const t = usePlatformT();
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-6 text-center">
      <p className="text-[15px] font-bold text-[#191F28]">{t(`예전 형식의 ${label}를 사용해요`, `Uses old-format ${label}`, `使用旧格式的${label}`, `Dùng ${label} định dạng cũ`, `旧形式の${label}を使用しています`, `Menggunakan ${label} format lama`)}</p>
      <p className="mt-1 text-[13px] text-[#8B95A1]">{t("공유 페이지에서 확인할 수 있어요.", "You can view it on the share page.", "可在分享页面查看。", "Bạn có thể xem trên trang chia sẻ.", "共有ページで確認できます。", "Bisa dilihat di halaman berbagi.")}</p>
      <a href={slug} target="_blank" rel="noreferrer" className="mt-4 inline-flex h-[44px] items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
        {t(`${label} 열기 ↗`, `Open ${label} ↗`, `打开${label} ↗`, `Mở ${label} ↗`, `${label}を開く ↗`, `Buka ${label} ↗`)}
      </a>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  const t = usePlatformT();
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
      <p className="text-[15px] font-bold text-[#191F28]">{t(`제출된 ${label}가 없어요`, `No ${label} submitted`, `未提交${label}`, `Chưa nộp ${label}`, `提出された${label}はありません`, `Belum ada ${label}`)}</p>
    </div>
  );
}
