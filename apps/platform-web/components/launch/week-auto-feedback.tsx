"use client";

import { useEffect, useState } from "react";
import { fetchWeekFeedback } from "../../lib/launch/feedback-client";
import { Card, Pill } from "./ui";
import { RichText } from "./rich-text";

// 1~3주차 자동 코치 피드백 — 그 주차 결과물을 근거로 AI가 자동 생성하고,
// 결과물이 바뀌면 다음 방문 때 갱신된다(백엔드에서 입력 해시로 캐시).
export function WeekAutoFeedback({ week }: { week: number }) {
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
        <span className="text-[13.5px] font-semibold text-[#4E5968]">피드백</span>
        {state === "loading" ? (
          <Pill tone="grey">생성 중…</Pill>
        ) : state === "done" ? (
          <Pill tone="green">피드백 도착</Pill>
        ) : (
          <Pill tone="grey">대기 중</Pill>
        )}
      </div>
      {state === "loading" ? (
        <p className="mt-3 text-[13px] text-[#8B95A1]">이번 주 결과물을 살펴보고 있어요…</p>
      ) : state === "done" ? (
        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-[#F6F8FB] p-3.5 text-[13.5px] leading-relaxed text-[#333D4B]"><RichText text={text} /></p>
      ) : state === "none" ? (
        <p className="mt-3 text-[13px] leading-relaxed text-[#8B95A1]">이번 주 활동을 시작하면 코치가 자동으로 피드백을 드려요.</p>
      ) : (
        <p className="mt-3 text-[13px] text-[#8B95A1]">피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
    </Card>
  );
}
