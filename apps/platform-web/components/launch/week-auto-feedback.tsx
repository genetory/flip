"use client";

import { useEffect, useState } from "react";
import { fetchWeekFeedback } from "../../lib/launch/feedback-client";
import { Card, Pill } from "./ui";
import { RichText } from "./rich-text";
import { useLaunchT } from "../../lib/launch/i18n";

// 1~3주차 자동 코치 피드백 — 그 주차 결과물을 근거로 AI가 자동 생성하고,
// 결과물이 바뀌면 다음 방문 때 갱신된다(백엔드에서 입력 해시로 캐시).
export function WeekAutoFeedback({ week }: { week: number }) {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "none" | "done" | "error">("loading");
  const [text, setText] = useState("");

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const fb = await fetchWeekFeedback(week);
        if (!alive) return;
        if (fb && fb.trim()) {
          setText(fb);
          setState("done");
        } else {
          setState("none");
        }
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [week]);

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-[#4E5968]">{t("피드백", "Feedback", "反馈", "Phản hồi", "フィードバック", "Umpan balik")}</span>
        {state === "loading" ? (
          <Pill tone="grey">{t("생성 중…", "Generating…", "生成中…", "Đang tạo…", "生成中…", "Sedang membuat…")}</Pill>
        ) : state === "done" ? (
          <Pill tone="green">{t("피드백 도착", "Feedback ready", "反馈已到", "Đã có phản hồi", "フィードバック到着", "Umpan balik siap")}</Pill>
        ) : (
          <Pill tone="grey">{t("대기 중", "Waiting", "等待中", "Đang chờ", "待機中", "Menunggu")}</Pill>
        )}
      </div>
      {state === "loading" ? (
        <p className="mt-3 text-[13px] text-[#8B95A1]">{t("이번 주 결과물을 살펴보고 있어요…", "Looking over this week's work…", "正在查看本周的成果…", "Đang xem lại kết quả tuần này…", "今週の成果を確認しています…", "Sedang meninjau hasil minggu ini…")}</p>
      ) : state === "done" ? (
        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#F6F8FB] p-3.5 text-[13.5px] leading-relaxed text-[#333D4B]"><RichText text={text} /></p>
      ) : state === "none" ? (
        <p className="mt-3 text-[13px] leading-relaxed text-[#8B95A1]">{t("이번 주 활동을 시작하면 코치가 자동으로 피드백을 드려요.", "Once you start this week's activities, your coach will automatically give you feedback.", "开始本周的活动后，教练会自动给你反馈。", "Khi bạn bắt đầu hoạt động tuần này, huấn luyện viên sẽ tự động gửi phản hồi.", "今週のアクティビティを始めると、コーチが自動でフィードバックをお届けします。", "Setelah Anda memulai aktivitas minggu ini, pelatih akan otomatis memberi umpan balik.")}</p>
      ) : (
        <p className="mt-3 text-[13px] text-[#8B95A1]">{t("피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load the feedback. Please try again in a moment.", "无法加载反馈。请稍后再试。", "Không thể tải phản hồi. Vui lòng thử lại sau giây lát.", "フィードバックを読み込めませんでした。少し後にもう一度お試しください。", "Tidak dapat memuat umpan balik. Silakan coba lagi sebentar lagi.")}</p>
      )}
    </Card>
  );
}
