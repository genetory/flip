"use client";

import { useEffect, useState } from "react";
import { fetchMyFeedback, markMyFeedbackRead, type CareerFeedback } from "../../lib/launch/feedback-client";
import { SectionTitle, Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

// 학생 대시보드용 '코치 피드백' 섹션. 운영진이 남긴 제출물 피드백을 최신순으로 보여주고,
// 열람하면 읽음 처리한다. 피드백이 없으면 안내 문구만 노출.
export function CoachFeedback() {
  const t = useLaunchT();
  const docLabel: Record<string, string> = {
    resume: t("이력서", "Resume", "简历", "Sơ yếu lý lịch", "履歴書", "Resume"),
    cover_letter: t("자기소개서", "Cover letter", "自我介绍信", "Thư giới thiệu bản thân", "自己紹介書", "Surat lamaran"),
    general: t("전체", "General", "全部", "Tổng quát", "全体", "Umum")
  };
  const [items, setItems] = useState<CareerFeedback[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { items: list, unreadCount } = await fetchMyFeedback();
        if (!alive) return;
        setItems(list);
        setUnread(unreadCount);
        if (unreadCount > 0) {
          try {
            await markMyFeedbackRead();
          } catch {
            // 읽음 처리 실패는 무시(다음 방문에 재시도)
          }
        }
      } catch {
        // 조회 실패 시 섹션은 비워둔다
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (loading || items.length === 0) return null; // 피드백 없으면 섹션 숨김

  return (
    <div>
      <SectionTitle
        sub={t(
          "운영 코치가 이력서·자기소개서를 보고 남긴 피드백이에요",
          "Feedback left by your coach after reviewing your resume and cover letter.",
          "这是运营教练查看您的简历和自我介绍信后留下的反馈。",
          "Đây là phản hồi của huấn luyện viên sau khi xem sơ yếu lý lịch và thư giới thiệu của bạn.",
          "運営コーチが履歴書・自己紹介書を見て残したフィードバックです。",
          "Umpan balik dari coach setelah meninjau resume dan surat lamaran Anda."
        )}
      >
        {t("코치 피드백", "Coach feedback", "教练反馈", "Phản hồi của huấn luyện viên", "コーチのフィードバック", "Umpan balik coach")}
        {unread > 0 ? <span className="ml-1.5 align-middle text-[11px] font-black text-[#0B46E8]">NEW {unread}</span> : null}
      </SectionTitle>
      <div className="space-y-3">
        {items.map((f) => {
          const author = f.author?.name?.trim() || f.author?.realName?.trim() || t("운영 코치", "Coach", "运营教练", "Huấn luyện viên", "運営コーチ", "Coach");
          const date = f.createdAt?.slice(0, 10) ?? "";
          return (
            <Card key={f.id} className={`!p-4 ${!f.readAt ? "!border-[#0B46E8]/40 ring-1 ring-[#0B46E8]/10" : ""}`}>
              <div className="flex flex-wrap items-center gap-1.5">
                {f.week ? <span className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-bold text-[#0B46E8]">Week {f.week}</span> : null}
                <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#4E5968]">{docLabel[f.docType] ?? docLabel.general}</span>
                <span className="ml-auto text-[11.5px] text-[#8B95A1]">{author} · {date}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap break-keep text-[13.5px] leading-relaxed text-[#191F28]">{f.body}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
