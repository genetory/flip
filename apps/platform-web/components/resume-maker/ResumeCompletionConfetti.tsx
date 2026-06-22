"use client";

import { useEffect, useRef, useState } from "react";

// 이력서 완성도가 100%에 처음 도달하는 순간 한 번 터지는 가벼운 컨페티.
// 외부 라이브러리 없이 DOM + CSS 키프레임으로 구현. 모션 최소화 설정은 존중.

const COLORS = ["#0B46E8", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];

type Piece = { left: number; delay: number; dur: number; color: string; w: number; h: number; rotate: number };

function makePieces(): Piece[] {
  return Array.from({ length: 90 }).map((_, i) => {
    const w = 6 + Math.random() * 7;
    return {
      left: Math.random() * 100,
      delay: Math.random() * 0.35,
      dur: 1.8 + Math.random() * 1.4,
      color: COLORS[i % COLORS.length],
      w,
      h: w * (0.5 + Math.random() * 0.5),
      rotate: Math.random() * 360
    };
  });
}

function ConfettiOverlay() {
  const [pieces] = useState(makePieces);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-6%",
            width: p.w,
            height: p.h,
            background: p.color,
            borderRadius: 1,
            transform: `rotate(${p.rotate}deg)`,
            animation: `rm-confetti-fall ${p.dur}s ${p.delay}s cubic-bezier(0.2,0.6,0.4,1) forwards`
          }}
        />
      ))}
      <style>{`@keyframes rm-confetti-fall { 0% { opacity: 1; } 100% { transform: translateY(112vh) rotate(900deg); opacity: 0.15; } }`}</style>
    </div>
  );
}

export function ResumeCompletionConfetti({ percent }: { percent: number }) {
  const prev = useRef(percent);
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const crossed = percent >= 100 && prev.current < 100;
    prev.current = percent;
    if (!crossed) return;
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    setActive(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(false), 2800);
  }, [percent]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return active ? <ConfettiOverlay /> : null;
}
