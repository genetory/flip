"use client";

import { useEffect, useMemo, useState } from "react";
import { Reveal } from "./Reveal";

const stats = [
  { value: "200+", label: "누적 매칭 성공" },
  { value: "100+", label: "파트너 기업 수" },
  { value: "4.5/5.0", label: "학생 만족도" },
  { value: "4.8/5.0", label: "기업 만족도" }
];

export const ProvenResults = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const animatedValues = useMemo(() => {
    const count200 = Math.round(200 * progress);
    const count100 = Math.round(100 * progress);
    const score45 = (4.5 * progress).toFixed(1);
    const score48 = (4.8 * progress).toFixed(1);

    return [`${count200}+`, `${count100}+`, `${score45}/5.0`, `${score48}/5.0`];
  }, [progress]);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container max-w-[1200px]">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">PROVEN RESULTS</p>
          <h2 className="font-display text-3xl font-black tracking-[-0.03em] text-[#0B1227] md:text-5xl">
            말뿐인 약속은 하지 않습니다.
            <br />
            숫자로 증명합니다.
          </h2>
        </Reveal>

        <Reveal delayMs={90} y="sm">
          <div className="grid grid-cols-2 gap-6 md:gap-8">
            {stats.map((item, index) => (
              <div
                key={item.label}
                className="px-2 py-2 text-center transition-transform duration-300 hover:-translate-y-1"
                style={{ transform: `rotate(${index % 2 === 0 ? -2 : 2}deg)` }}
              >
                <p className="font-display text-6xl font-black leading-none tracking-[-0.05em] text-[#0B46E8] md:text-8xl lg:text-9xl">
                  {animatedValues[index]}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-600 md:text-base">{item.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
};
