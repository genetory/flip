"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, CircleNotch } from "@phosphor-icons/react";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { ResumeRender } from "./resume-render";
import { CoverRender } from "./cover-render";
import { SectionTitle, Card } from "./ui";
import { DocCard } from "./DeliverablesScreen";
import { useLaunchT } from "../../lib/launch/i18n";

// 주차 페이지 우측 컬럼 — 대화로 만드는 이력서(2주차~)와 자기소개서(3주차~)를 항상 미리보기.
export function WeekDocs({ week }: { week: number }) {
  const t = useLaunchT();
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  // 이력서·자소서를 함께 기다리지 않고 각각 도착하는 대로 표시(체감 속도 개선).
  const [resumeReady, setResumeReady] = useState(false);
  const [coverReady, setCoverReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetchResumeData()
      .then((r) => { if (alive) { setResume(r.data ?? {}); setResumeReady(true); } })
      .catch(() => { if (alive) setResumeReady(true); });
    void fetchCoverData()
      .then((c) => { if (alive) { setCover(c.data ?? {}); setCoverReady(true); } })
      .catch(() => { if (alive) setCoverReady(true); });
    return () => {
      alive = false;
    };
  }, []);

  // 2주차: 이력서 · 3주차: 자기소개서 · 4주차: 이력서 + 자기소개서. (1주차는 노출 안 함)
  const showResume = week === 2 || week >= 4;
  const showCover = week >= 3;
  const both = showResume && showCover; // 4주차 — 결과물 페이지 지원서류와 동일하게 2컬럼

  // 4주차: '지원 서류' 한 섹션 아래 이력서·자기소개서를 2컬럼 DocCard 로(결과물 페이지와 동일).
  if (both) {
    return (
      <div>
        <SectionTitle sub={t("대화·편집으로 완성한 지원 서류", "Your application documents", "通过对话与编辑完成的申请文件", "Hồ sơ ứng tuyển bạn đã hoàn thành", "対話・編集で仕上げた応募書類", "Dokumen lamaran yang kamu selesaikan")}>{t("지원 서류", "Application documents", "申请文件", "Hồ sơ ứng tuyển", "応募書類", "Dokumen lamaran")}</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <DocCard
            title={t("내 이력서", "My resume", "我的简历", "CV của tôi", "私の履歴書", "Resume saya")}
            ready={resumeReady && hasResumeContent(resume)}
            loading={!resumeReady}
            editHref="/career-launch/resume-collect"
            fullHref="/career-launch/resume-preview"
            emptyLabel={t("2주차에서 작성해요", "Build it in Week 2", "在第2周撰写", "Viết ở Tuần 2", "Week 2で作成", "Susun di Minggu 2")}
            t={t}
          >
            <ResumeRender data={resume} />
          </DocCard>
          <DocCard
            title={t("내 자기소개서", "My cover letter", "我的自我介绍书", "Thư giới thiệu của tôi", "私の自己紹介書", "Surat lamaran saya")}
            ready={coverReady && hasCoverContent(cover)}
            loading={!coverReady}
            editHref="/career-launch/cover-collect"
            fullHref="/career-launch/cover-preview"
            emptyLabel={t("3주차에서 작성해요", "Write it in Week 3", "在第3周撰写", "Viết ở Tuần 3", "Week 3で作成", "Tulis di Minggu 3")}
            t={t}
          >
            <CoverRender data={cover} />
          </DocCard>
        </div>
      </div>
    );
  }

  return (
    <>
      {showResume ? (
      <div>
        <SectionTitle>{t("내 이력서", "My resume", "我的简历", "CV của tôi", "私の履歴書", "Resume saya")}</SectionTitle>
        {!resumeReady ? (
          <Card className="!p-4"><span className="inline-flex items-center gap-2 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</span></Card>
        ) : hasResumeContent(resume) ? (
          <DocThumb href="/career-launch/resume-preview" moreLabel={t("크게보기", "View larger", "放大查看", "Xem lớn hơn", "大きく見る", "Lihat lebih besar")}>
            <ResumeRender data={resume} />
          </DocThumb>
        ) : (
          <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("아직 이력서를 만들지 않았어요. 대화로 채워보세요.", "You haven't made a resume yet. Fill it in through conversation.", "你还没有制作简历。通过对话来填写吧。", "Bạn chưa tạo CV. Hãy điền vào qua trò chuyện.", "まだ履歴書を作成していません。会話で埋めてみましょう。", "Anda belum membuat resume. Isi melalui percakapan.")}</Card>
        )}
      </div>
      ) : null}

      {showCover ? (
        <div>
          <SectionTitle>{t("내 자기소개서", "My cover letter", "我的自我介绍书", "Thư giới thiệu bản thân của tôi", "私の自己紹介書", "Surat lamaran saya")}</SectionTitle>
          {!coverReady ? (
            <Card className="!p-4"><span className="inline-flex items-center gap-2 text-[13px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</span></Card>
          ) : hasCoverContent(cover) ? (
            <DocThumb href="/career-launch/cover-preview" moreLabel={t("크게보기", "View larger", "放大查看", "Xem lớn hơn", "大きく見る", "Lihat lebih besar")}>
              <CoverRender data={cover} />
            </DocThumb>
          ) : (
            <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("아직 자기소개서를 만들지 않았어요. 대화로 채워보세요.", "You haven't made a cover letter yet. Fill it in through conversation.", "你还没有制作自我介绍书。通过对话来填写吧。", "Bạn chưa tạo thư giới thiệu bản thân. Hãy điền vào qua trò chuyện.", "まだ自己紹介書を作成していません。会話で埋めてみましょう。", "Anda belum membuat surat lamaran. Isi melalui percakapan.")}</Card>
          )}
        </div>
      ) : null}
    </>
  );
}

// 결과물 축소 미리보기 — 작은 비율(썸네일)로 보여주고, 하단 페이드 위 '크게보기'로 전체 확인.
function DocThumb({ children, href, moreLabel }: { children: ReactNode; href: string; moreLabel: string }) {
  return (
    <div className="mt-1 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
      <div className="relative mx-auto w-full max-w-[340px]">
        <div className="relative aspect-[210/297] overflow-hidden rounded-lg border border-[#E5E8EB] bg-white shadow-[0_2px_14px_rgba(11,18,39,0.06)]">
          {children}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent" />
        </div>
        <Link
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-x-0 bottom-3 mx-auto flex w-max items-center gap-1 rounded-full border border-[#E5E8EB] bg-white px-4 py-2 text-[12.5px] font-bold text-[#191F28] shadow-[0_2px_10px_rgba(11,18,39,0.12)] transition hover:bg-[#F6F8FB]"
        >
          {moreLabel} <ArrowUpRight className="h-3.5 w-3.5" weight="bold" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
