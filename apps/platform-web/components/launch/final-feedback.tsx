"use client";

import { useEffect, useState } from "react";
import { fetchFinalFeedback } from "../../lib/launch/feedback-client";
import { trackCareerFinalFeedback } from "../../lib/analytics";
import { Card } from "./ui";
import { RichText } from "./rich-text";

// 완주 최종 피드백 — 이력서·자기소개서·면접 종합. 프로그램 소개처럼 섹션 카드로 보여준다.
// 생성은 1회 후 저장·재사용(토큰 절약), 결과물이 바뀌면(stale) '다시 받기' 노출.
export function FinalFeedbackCard() {
  const [state, setState] = useState<"loading" | "done" | "none" | "error">("loading");
  const [text, setText] = useState("");
  const [stale, setStale] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const fb = await fetchFinalFeedback();
        if (!alive) return;
        if (fb.text && fb.text.trim()) {
          setText(fb.text);
          setStale(fb.stale);
          setState("done");
          trackCareerFinalFeedback("view");
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
  }, []);

  const regenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    trackCareerFinalFeedback("regenerate");
    try {
      const fb = await fetchFinalFeedback(true);
      if (fb.text && fb.text.trim()) {
        setText(fb.text);
        setStale(false);
        setState("done");
      }
    } catch {
      // 유지
    } finally {
      setRegenerating(false);
    }
  };

  if (state === "none") return null; // 종합할 결과물이 없으면 섹션 숨김

  return (
    <Card className="md:!p-6">
      {state === "done" && stale ? (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
          <p className="text-[12px] font-semibold text-[#B7791F]">결과물이 바뀌었어요. 최신 내용으로 다시 받을 수 있어요.</p>
          <button
            type="button"
            onClick={regenerate}
            disabled={regenerating}
            className="shrink-0 rounded-lg border border-[#0B46E8]/25 bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD] disabled:opacity-50"
          >
            {regenerating ? "받는 중…" : "다시 받기"}
          </button>
        </div>
      ) : null}
      {state === "loading" ? (
        <p className="text-[13px] text-[#8B95A1]">4주 결과물(이력서·자기소개서·면접)을 종합해 피드백을 준비하고 있어요…</p>
      ) : state === "done" ? (
        <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#333D4B]">
          <RichText text={text} />
        </p>
      ) : (
        <p className="text-[13px] text-[#8B95A1]">피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
    </Card>
  );
}
