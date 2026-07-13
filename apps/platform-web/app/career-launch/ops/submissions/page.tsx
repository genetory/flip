"use client";

import { useState } from "react";
import { OPS_SUBMISSIONS, type MissionStatus } from "../../../../lib/launch/data";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../components/launch/ui";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 11. 운영자 제출물 관리 페이지
export default function LaunchOpsSubmissionsPage() {
  const t = useLaunchT();
  const STATUS_META: Record<MissionStatus, { t: string; tone: "grey" | "blue" | "green" }> = {
    todo: { t: t("미제출", "Not submitted", "未提交", "Chưa nộp", "未提出", "Belum dikirim"), tone: "grey" },
    submitted: { t: t("검토 대기", "Pending review", "待审核", "Chờ duyệt", "レビュー待ち", "Menunggu peninjauan"), tone: "blue" },
    reviewed: { t: t("피드백 완료", "Feedback done", "已反馈", "Đã phản hồi", "フィードバック完了", "Umpan balik selesai"), tone: "green" }
  };
  const [subs, setSubs] = useState(OPS_SUBMISSIONS);
  const pending = subs.filter((s) => s.status === "submitted").length;

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <div className="grid grid-cols-2 gap-2.5">
          <Card className="!p-4 text-center">
            <p className="text-[22px] font-black text-[#0B46E8]">{subs.length}</p>
            <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{t("전체 제출물", "All submissions", "全部提交", "Tất cả bài nộp", "全提出物", "Semua kiriman")}</p>
          </Card>
          <Card className="!p-4 text-center">
            <p className="text-[22px] font-black text-amber-600">{pending}</p>
            <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{t("검토 대기", "Pending review", "待审核", "Chờ duyệt", "レビュー待ち", "Menunggu peninjauan")}</p>
          </Card>
        </div>

        <div className="mt-7">
          <SectionTitle sub={t("제출된 과제를 검토하고 피드백을 완료 처리하세요", "Review submitted assignments and mark feedback as done", "审核已提交的作业并完成反馈", "Duyệt bài đã nộp và đánh dấu đã phản hồi", "提出された課題を確認し、フィードバックを完了処理してください", "Tinjau tugas yang dikirim dan tandai umpan balik selesai")}>{t("제출물 목록", "Submission list", "提交列表", "Danh sách bài nộp", "提出物一覧", "Daftar kiriman")}</SectionTitle>
          <div className="space-y-2.5">
            {subs.map((s) => (
              <Card key={s.id} className="!p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Pill tone="grey">W{s.week}</Pill>
                      <p className="truncate text-[14px] font-bold text-[#191F28]">{s.student}</p>
                    </div>
                    <p className="mt-1 truncate text-[13px] text-[#4E5968]">{s.title}</p>
                    <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">{t("제출", "Submitted", "提交", "Đã nộp", "提出", "Dikirim")} {s.submittedAt}</p>
                  </div>
                  <Pill tone={STATUS_META[s.status].tone}>{STATUS_META[s.status].t}</Pill>
                </div>
                {s.status === "submitted" ? (
                  <button
                    type="button"
                    onClick={() => setSubs((prev) => prev.map((x) => (x.id === s.id ? { ...x, status: "reviewed" } : x)))}
                    className="mt-3 w-full rounded-xl bg-[#0B46E8] py-2.5 text-[13px] font-bold text-white"
                  >
                    {t("피드백 완료 처리", "Mark feedback as done", "标记为已反馈", "Đánh dấu đã phản hồi", "フィードバック完了にする", "Tandai umpan balik selesai")}
                  </button>
                ) : null}
              </Card>
            ))}
          </div>
        </div>
      </LaunchContainer>
    </main>
  );
}
