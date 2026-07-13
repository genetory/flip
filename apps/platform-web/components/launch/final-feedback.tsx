"use client";

import { useEffect, useState } from "react";
import { fetchFinalFeedback } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { RichText } from "./rich-text";

// 완주 최종 피드백 — 이력서·자기소개서·면접 결과를 종합한 코치 코멘트(완주 시 대시보드에 표시).
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
    try {
      const fb = await fetchFinalFeedback(true);
      if (fb.text && fb.text.trim()) {
        setText(fb.text);
        setStale(false);
      }
    } catch {
      // 유지
    } finally {
      setRegenerating(false);
    }
  };

  if (state === "none") return null; // 완주 결과물이 없으면 표시하지 않음

  return (
    <Card className="border-[#B7FF5A] bg-[#F6FFE9]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">🏆</span>
          <p className="text-[13.5px] font-black text-[#0B1227]">코치 최종 피드백</p>
        </div>
        {state === "done" && stale ? (
          <button
            type="button"
            onClick={regenerate}
            disabled={regenerating}
            className="shrink-0 rounded-lg border border-[#3A6B00]/25 bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#3A6B00] transition hover:bg-[#EAFFD1] disabled:opacity-50"
          >
            {regenerating ? "받는 중…" : "다시 받기"}
          </button>
        ) : null}
      </div>
      {stale && state === "done" ? (
        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-[12px] font-semibold text-[#B7791F]">
          결과물이 바뀌었어요. ‘다시 받기’를 누르면 최신 내용으로 피드백을 새로 받아요.
        </p>
      ) : null}
      {state === "loading" ? (
        <p className="mt-2 text-[13px] text-[#8B95A1]">4주 결과물(이력서·자기소개서·면접)을 종합해 피드백을 준비하고 있어요…</p>
      ) : state === "done" ? (
        <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[#333D4B]">
          <RichText text={text} />
        </p>
      ) : (
        <p className="mt-2 text-[13px] text-[#8B95A1]">피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      )}
    </Card>
  );
}
