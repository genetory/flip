"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export const CoverSection = () => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const frameRef = useRef<number | null>(null);
  const tickingRef = useRef(false);

  useEffect(() => {
    const update = () => {
      const node = sectionRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const raw = (vh - rect.top) / (vh + rect.height);
      const clamped = Math.min(1, Math.max(0, raw));
      setProgress(clamped);
      tickingRef.current = false;
    };

    const requestTick = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    return () => {
      window.removeEventListener("scroll", requestTick);
      window.removeEventListener("resize", requestTick);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const imageOffset = (progress - 0.5) * 36;
  const contentOffset = (0.5 - progress) * 22;

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden">
      <div style={{ transform: `translate3d(0, ${imageOffset}px, 0)` }}>
        <Image
          src="/img_hero_white.webp"
          alt="Aply hero cover"
          width={1659}
          height={1079}
          priority
          className="h-auto w-full"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center px-4 text-center" style={{ transform: `translate3d(0, ${contentOffset}px, 0)` }}>
        <div className="animate-fade-up will-change-transform">
          <Image
            src="/aply-logo-20260428.webp"
            alt="Aply logo"
            width={320}
            height={90}
            className="h-auto w-[25vw] min-w-[94px] max-w-[280px]"
            priority
          />
          <p className="-mt-[0.6vw] text-[clamp(0.65rem,1.1vw,1.3rem)] font-semibold uppercase tracking-[0.08em] text-[#0B46E8] drop-shadow-sm">
            APPLY YOUR NEXT MOVE.
          </p>
        </div>
      </div>
    </section>
  );
};
