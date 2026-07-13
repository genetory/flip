"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { ResumeRender } from "./resume-render";
import { CoverRender } from "./cover-render";
import { SectionTitle, Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

// 주차 페이지 우측 컬럼 — 대화로 만드는 이력서(2주차~)와 자기소개서(3주차~)를 항상 미리보기.
export function WeekDocs({ week }: { week: number }) {
  const t = useLaunchT();
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [r, c] = await Promise.all([fetchResumeData().catch(() => ({ data: {} })), fetchCoverData().catch(() => ({ data: {} }))]);
        if (!alive) return;
        setResume(r.data ?? {});
        setCover(c.data ?? {});
      } catch {
        // 무시
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 2주차: 이력서 · 3주차: 자기소개서 · 4주차: 이력서 + 자기소개서. (1주차는 노출 안 함)
  const showResume = week === 2 || week >= 4;
  const showCover = week >= 3;

  return (
    <>
      {showResume ? (
      <div>
        <div className="flex items-center justify-between">
          <SectionTitle>{t("내 이력서", "My resume", "我的简历", "CV của tôi", "私の履歴書", "Resume saya")}</SectionTitle>
          {hasResumeContent(resume) ? (
            <Link href="/career-launch/resume-preview" target="_blank" rel="noopener noreferrer" className="-mt-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">
              {t("크게보기", "View larger", "放大查看", "Xem lớn hơn", "大きく見る", "Lihat lebih besar")} ↗
            </Link>
          ) : null}
        </div>
        {!ready ? (
          <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
        ) : hasResumeContent(resume) ? (
          <ResumeRender data={resume} />
        ) : (
          <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("아직 이력서를 만들지 않았어요. 대화로 채워보세요.", "You haven't made a resume yet. Fill it in through conversation.", "你还没有制作简历。通过对话来填写吧。", "Bạn chưa tạo CV. Hãy điền vào qua trò chuyện.", "まだ履歴書を作成していません。会話で埋めてみましょう。", "Anda belum membuat resume. Isi melalui percakapan.")}</Card>
        )}
      </div>
      ) : null}

      {showCover ? (
        <div>
          <div className="flex items-center justify-between">
            <SectionTitle>{t("내 자기소개서", "My cover letter", "我的自我介绍书", "Thư giới thiệu bản thân của tôi", "私の自己紹介書", "Surat lamaran saya")}</SectionTitle>
            {hasCoverContent(cover) ? (
              <Link href="/career-launch/cover-preview" target="_blank" rel="noopener noreferrer" className="-mt-2 text-[12.5px] font-bold text-[#0B46E8] transition hover:underline">
                {t("크게보기", "View larger", "放大查看", "Xem lớn hơn", "大きく見る", "Lihat lebih besar")} ↗
              </Link>
            ) : null}
          </div>
          {!ready ? (
            <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</Card>
          ) : hasCoverContent(cover) ? (
            <CoverRender data={cover} />
          ) : (
            <Card className="!p-4 text-[13px] text-[#8B95A1]">{t("아직 자기소개서를 만들지 않았어요. 대화로 채워보세요.", "You haven't made a cover letter yet. Fill it in through conversation.", "你还没有制作自我介绍书。通过对话来填写吧。", "Bạn chưa tạo thư giới thiệu bản thân. Hãy điền vào qua trò chuyện.", "まだ自己紹介書を作成していません。会話で埋めてみましょう。", "Anda belum membuat surat lamaran. Isi melalui percakapan.")}</Card>
          )}
        </div>
      ) : null}
    </>
  );
}
