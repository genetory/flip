"use client";

import { useState } from "react";
import { fetchFinalFeedback } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { RichText } from "./rich-text";

// 완주 최종 피드백 — 이력서·자기소개서·면접 종합. 기본은 접힌 상태이고, '열기'를 눌러야
// 처음 불러온다(그때 1회 생성 후 저장·재사용 → 안 여는 학생은 토큰도 안 씀).
export function FinalFeedbackCard() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "done" | "none" | "error">("idle");
  const [text, setText] = useState("");
  const [stale, setStale] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const ensureLoaded = async () => {
    if (state === "done" || state === "loading") return;
    setState("loading");
    try {
      const fb = await fetchFinalFeedback();
      if (fb.text && fb.text.trim()) {
        setText(fb.text);
        setStale(fb.stale);
        setState("done");
      } else {
        setState("none");
      }
    } catch {
      setState("error");
    }
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) void ensureLoaded();
  };

  const regenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
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

  return (
    <Card className="!border-[#0B46E8] !bg-white !p-0">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between gap-2 px-4 py-3.5 text-left md:px-5">
        <div className="flex items-center gap-2">
          <span className="text-[16px]">🏆</span>
          <div>
            <p className="text-[13.5px] font-black text-[#0B1227]">최종 피드백</p>
            {!open ? <p className="mt-0.5 text-[11.5px] text-[#8B95A1]">4주 결과물을 종합한 코치 피드백 · 열어서 확인하기</p> : null}
          </div>
        </div>
        <span className="shrink-0 text-[12px] font-bold text-[#0B46E8]">{open ? "닫기 ▲" : "열기 ▼"}</span>
      </button>

      {open ? (
        <div className="border-t border-[#EEF1F5] px-4 pb-4 pt-3 md:px-5">
          {state === "done" && stale ? (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <p className="text-[12px] font-semibold text-[#B7791F]">결과물이 바뀌었어요. 최신 내용으로 다시 받을 수 있어요.</p>
              <button
                type="button"
                onClick={regenerate}
                disabled={regenerating}
                className="shrink-0 rounded-lg border border-[#3A6B00]/25 bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#3A6B00] transition hover:bg-[#EAFFD1] disabled:opacity-50"
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
          ) : state === "none" ? (
            <p className="text-[13px] text-[#8B95A1]">아직 종합할 결과물이 부족해요. 이력서·자기소개서를 마저 채워 주세요.</p>
          ) : (
            <p className="text-[13px] text-[#8B95A1]">피드백을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}
