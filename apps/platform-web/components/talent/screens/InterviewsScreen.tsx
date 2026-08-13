"use client";

// 모의 면접 — 내가 연습한 공고별 모의 면접 기록. 회사가 준비한 모의 면접을 풀면 여기 쌓인다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkle, CaretRight } from "@phosphor-icons/react";
import { CareerLayout } from "../career/CareerLayout";
import { TEmpty, TLoading, TError, TPageHeader } from "../ui/primitives";
import { TalentButton } from "../TalentButton";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMyMockInterviews, type MockInterviewRecord } from "../../../lib/member-profile-client";
import { usePlatformT } from "../../../lib/i18n";

export function InterviewsScreen() {
  const t = usePlatformT();
  const [items, setItems] = useState<MockInterviewRecord[] | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  function load() {
    setStatus("loading");
    getMyMockInterviews()
      .then((list) => {
        setItems(list);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }
  useEffect(() => {
    load();
  }, []);

  return (
    <CareerLayout>
      <div className="flex flex-col gap-5">
        <TPageHeader title={t("모의 면접", "Mock interviews", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")} description={t("회사가 준비한 모의 면접을 풀고 AI 피드백을 받아보세요. 연습한 공고가 여기 쌓여요.", "Take mock interviews prepared by companies and get AI feedback. Your practice sessions collect here.", "参加企业准备的模拟面试并获得 AI 反馈。练习过的职位会汇集在这里。", "Làm bài phỏng vấn thử do công ty chuẩn bị và nhận phản hồi AI. Các buổi luyện tập sẽ tập hợp ở đây.", "会社が用意した模擬面接に挑戦してAIフィードバックを受けましょう。練習した求人がここに集まります。", "Ikuti wawancara simulasi dari perusahaan dan dapatkan umpan balik AI. Sesi latihanmu terkumpul di sini.")} />

        {status === "loading" ? <TLoading /> : null}
        {status === "error" ? <TError onRetry={load} /> : null}

        {status === "ready" ? (
          (items?.length ?? 0) === 0 ? (
            <TEmpty
              icon="🎤"
              title={t("아직 연습한 모의 면접이 없어요", "No mock interviews yet", "还没有练习的模拟面试", "Chưa có phỏng vấn thử nào", "まだ練習した模擬面接がありません", "Belum ada wawancara simulasi")}
              description={t("공고 상세에서 '이 회사 모의 면접 미리 풀기'로 시작해보세요.", "Start from a job's detail page with 'Try this company's mock interview'.", "在职位详情页点击“提前体验该公司模拟面试”开始。", "Bắt đầu từ trang chi tiết tin tuyển dụng với 'Thử phỏng vấn công ty này'.", "求人詳細の「この会社の模擬面接を試す」から始めましょう。", "Mulai dari halaman detail lowongan lewat 'Coba wawancara simulasi perusahaan ini'.")}
              action={<TalentButton href={talentAppRoutes.jobs} variant="soft" size="md">{t("공고 둘러보기", "Browse jobs", "浏览职位", "Xem tin tuyển dụng", "求人を見る", "Lihat lowongan")}</TalentButton>}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {items!.map((m) => (
                <Link key={m.positionId} href={`/talent/jobs/${m.positionId}`} className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[#0B46E8]"><Sparkle className="h-5 w-5" weight="fill" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-bold text-[#191F28]">{m.positionTitle}</p>
                    <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">
                      {m.companyName ? `${m.companyName} · ` : ""}{t("답변", "Answers", "回答", "Câu trả lời", "回答", "Jawaban")} {m.answeredCount}{m.bestScore != null ? ` · ${t("최고", "Best", "最高", "Cao nhất", "最高", "Terbaik")} ${m.bestScore}` : ""} · {formatRelativeTime(new Date(m.lastPracticedAt).getTime(), undefined, t)}
                    </p>
                  </div>
                  <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
                </Link>
              ))}
            </div>
          )
        ) : null}
      </div>
    </CareerLayout>
  );
}
