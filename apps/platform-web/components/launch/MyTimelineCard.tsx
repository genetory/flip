"use client";

// 내 여정 — 본인 TalentEvent(진단→이력서→면접→지원→인터뷰→채용)를 타임라인으로.
// 프로덕션에 쌓이는 행동 원장을 학생 스스로 성장 기록으로 확인한다.
import { useEffect, useState } from "react";
import { fetchMyTimeline, type TimelineEvent } from "../../lib/launch/progress-client";
import { useLaunchT } from "../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;

function eventMeta(type: string, t: LaunchT): { emoji: string; label: string; accent: boolean } {
  switch (type) {
    case "career_diagnosis_completed":
      return { emoji: "🎯", label: t("취업 진단 완료", "Job-readiness diagnosis", "求职诊断完成", "Hoàn tất chẩn đoán", "就職診断完了", "Diagnosis selesai"), accent: false };
    case "resume_created":
      return { emoji: "📄", label: t("이력서 생성", "Resume created", "简历已生成", "Đã tạo CV", "履歴書作成", "Resume dibuat"), accent: false };
    case "resume_updated":
      return { emoji: "✏️", label: t("이력서 수정", "Resume updated", "简历已更新", "Cập nhật CV", "履歴書更新", "Resume diperbarui"), accent: false };
    case "mock_interview_completed":
      return { emoji: "🎤", label: t("모의면접 완료", "Mock interview done", "模拟面试完成", "Xong phỏng vấn thử", "模擬面接完了", "Simulasi selesai"), accent: false };
    case "talent_verified":
      return { emoji: "✅", label: t("Verified 인재 달성", "Became Verified talent", "成为已验证人才", "Trở thành Verified", "Verified達成", "Jadi Verified"), accent: true };
    case "position_applied":
      return { emoji: "📮", label: t("공고 지원", "Applied to a job", "已投递职位", "Đã ứng tuyển", "求人に応募", "Melamar lowongan"), accent: false };
    case "interview_invited":
      return { emoji: "💼", label: t("기업이 인터뷰를 제안", "A company invited you", "企业发出面试邀约", "Được mời phỏng vấn", "企業から面接オファー", "Diundang wawancara"), accent: true };
    case "interview_accepted":
      return { emoji: "🤝", label: t("인터뷰 수락", "Accepted an interview", "已接受面试", "Đã nhận phỏng vấn", "面接を承認", "Menerima wawancara"), accent: false };
    case "interview_scheduled":
      return { emoji: "📅", label: t("인터뷰 일정 확정", "Interview scheduled", "面试已排期", "Đã hẹn phỏng vấn", "面接予定確定", "Wawancara terjadwal"), accent: false };
    case "interview_completed":
      return { emoji: "✔️", label: t("인터뷰 완료", "Interview completed", "面试完成", "Xong phỏng vấn", "面接完了", "Wawancara selesai"), accent: false };
    case "hired":
      return { emoji: "🎉", label: t("채용 성공", "Hired!", "成功入职", "Đã được tuyển", "採用成功", "Direkrut!"), accent: true };
    case "career_launch_completed":
      return { emoji: "🏁", label: t("프로그램 완주", "Program completed", "完成项目", "Hoàn thành chương trình", "プログラム完走", "Program selesai"), accent: true };
    default:
      return { emoji: "•", label: type, accent: false };
  }
}

export function MyTimelineCard({ limit }: { limit?: number } = {}) {
  const t = useLaunchT();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void fetchMyTimeline().then((e) => {
      if (alive) {
        setEvents(e);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading || events.length === 0) return null;

  return (
    <section>
      <h2 className="mb-1 text-[19px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[22px]">{t("내 여정", "My journey", "我的旅程", "Hành trình của tôi", "私の歩み", "Perjalananku")}</h2>
      <p className="mb-4 text-[13px] text-[#8B95A1]">{t("진단부터 인터뷰·채용까지, 내가 만든 발자취예요.", "Every step you've taken — from diagnosis to interviews and hires.", "从诊断到面试、录用的每一步足迹。", "Từng bước bạn đã đi — từ chẩn đoán đến phỏng vấn, tuyển dụng.", "診断から面接・採用まで、あなたの足跡です。", "Setiap langkahmu — dari diagnosis hingga wawancara dan rekrutmen.")}</p>
      <ol className="relative ml-1 border-l-2 border-[#EEF1F5]">
        {(limit ? events.slice(0, limit) : events).map((e, i) => {
          const m = eventMeta(e.type, t);
          return (
            <li key={i} className="relative mb-4 pl-6 last:mb-0">
              <span
                className={`absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full text-[12px] ring-2 ring-white ${m.accent ? "bg-[#E7F8EF]" : "bg-[#F2F4F6]"}`}
                aria-hidden
              >
                {m.emoji}
              </span>
              <p className={`text-[13.5px] font-bold ${m.accent ? "text-[#0A9B59]" : "text-[#191F28]"}`}>{m.label}</p>
              <p className="mt-0.5 text-[11.5px] text-[#B0B8C1]">{e.at.slice(0, 10)}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
