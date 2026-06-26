"use client";

// 첫 방문 코치마크 투어 — 다음 할 일 → 진행도 → 여정을 말풍선으로 한 바퀴 안내.
// 대상 요소는 data-tour 속성으로 찾는다. localStorage 로 1회만 노출.
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useDashboardCopy } from "../../lib/resume-maker-i18n/dashboard";

const SEEN_KEY = "resume_maker_tour_v1";

export function ResumeMakerCoachTour() {
  const t = useDashboardCopy();
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const steps = [
    { sel: '[data-tour="next"]', title: t.tourTitle1, desc: t.tourDesc1 },
    { sel: '[data-tour="progress"]', title: t.tourTitle2, desc: t.tourDesc2 },
    { sel: '[data-tour="journey"]', title: t.tourTitle3, desc: t.tourDesc3 }
  ];

  // 첫 방문이면 잠시 후 시작.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY)) return;
    const id = window.setTimeout(() => setStep(0), 650);
    return () => window.clearTimeout(id);
  }, []);

  // 단계 대상 측정 + 화면 안으로 스크롤. 스크롤/리사이즈 시 재측정.
  useEffect(() => {
    if (step === null) return;
    const el = document.querySelector(steps[step].sel) as HTMLElement | null;
    if (!el) {
      finish();
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const measure = () => setRect(el.getBoundingClientRect());
    const id = window.setTimeout(measure, 360);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  function finish() {
    if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, "1");
    setStep(null);
    setRect(null);
  }
  function advance() {
    if (step === null) return;
    if (step >= steps.length - 1) finish();
    else {
      setRect(null);
      setStep(step + 1);
    }
  }

  if (step === null || !rect || typeof document === "undefined") return null;

  const pad = 8;
  const top = rect.top - pad;
  const left = rect.left - pad;
  const width = rect.width + pad * 2;
  const height = rect.height + pad * 2;

  const tipW = 300;
  const tipLeft = Math.max(16, Math.min(rect.left, window.innerWidth - tipW - 16));
  const placeBelow = window.innerHeight - rect.bottom > 210;
  const isLast = step >= steps.length - 1;

  return createPortal(
    <div className="fixed inset-0 z-[80]">
      {/* 스포트라이트 컷아웃 */}
      <div
        className="pointer-events-none absolute rounded-[18px] transition-all duration-300 ease-out"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: "0 0 0 9999px rgba(2,6,23,0.66)",
          border: "2px solid rgba(255,255,255,0.9)"
        }}
      />
      {/* 말풍선 */}
      <div
        className="pointer-events-auto absolute w-[300px] max-w-[calc(100vw-32px)] rounded-2xl bg-white p-4 shadow-elevated"
        style={{ left: tipLeft, ...(placeBelow ? { top: rect.bottom + 14 } : { bottom: window.innerHeight - rect.top + 14 }), animation: "rm-tip 0.25s ease-out both" }}
      >
        <p className="text-[14.5px] font-extrabold text-[#0B1227]">{steps[step].title}</p>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{steps[step].desc}</p>
        <div className="mt-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-4 bg-[#0B46E8]" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={finish} className="text-[12.5px] font-semibold text-muted-foreground hover:text-foreground">
              {t.tourSkip}
            </button>
            <button
              type="button"
              onClick={advance}
              className="rounded-full bg-[#0B46E8] px-3.5 py-1.5 text-[12.5px] font-bold text-white transition active:scale-95"
            >
              {isLast ? t.tourDone : t.tourNext}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes rm-tip { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }`}</style>
    </div>,
    document.body
  );
}
