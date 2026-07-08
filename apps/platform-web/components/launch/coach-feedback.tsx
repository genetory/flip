"use client";

import { useEffect, useState } from "react";
import { fetchMyFeedback, markMyFeedbackRead, type CareerFeedback } from "../../lib/launch/feedback-client";
import { SectionTitle, Card } from "./ui";

const DOC_LABEL: Record<string, string> = { resume: "이력서", cover_letter: "자기소개서", general: "전체" };

// 학생 대시보드용 '코치 피드백' 섹션. 운영진이 남긴 제출물 피드백을 최신순으로 보여주고,
// 열람하면 읽음 처리한다. 피드백이 없으면 안내 문구만 노출.
export function CoachFeedback() {
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
      <SectionTitle sub="운영 코치가 이력서·자기소개서를 보고 남긴 피드백이에요">
        코치 피드백
        {unread > 0 ? <span className="ml-1.5 align-middle text-[11px] font-black text-[#0B46E8]">NEW {unread}</span> : null}
      </SectionTitle>
      <div className="space-y-3">
        {items.map((f) => {
          const author = f.author?.name?.trim() || f.author?.realName?.trim() || "운영 코치";
          const date = f.createdAt?.slice(0, 10) ?? "";
          return (
            <Card key={f.id} className={`!p-4 ${!f.readAt ? "!border-[#0B46E8]/40 ring-1 ring-[#0B46E8]/10" : ""}`}>
              <div className="flex flex-wrap items-center gap-1.5">
                {f.week ? <span className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-bold text-[#0B46E8]">Week {f.week}</span> : null}
                <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#4E5968]">{DOC_LABEL[f.docType] ?? "전체"}</span>
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
