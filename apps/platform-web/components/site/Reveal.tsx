"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../../lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  y?: "sm" | "md" | "lg";
  once?: boolean;
};

export const Reveal = ({ children, className, delayMs = 0, y = "md", once = true }: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const showIfInViewport = () => {
      const rect = node.getBoundingClientRect();
      const viewH = window.innerHeight || document.documentElement.clientHeight;
      const viewW = window.innerWidth || document.documentElement.clientWidth;
      const intersects = rect.bottom > 0 && rect.right > 0 && rect.top < viewH && rect.left < viewW;
      if (intersects) setVisible(true);
    };

    // First paint timing can miss initial observer notifications on some devices/browsers.
    showIfInViewport();
    const rafId = window.requestAnimationFrame(showIfInViewport);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting || entry.intersectionRatio > 0) {
          setVisible(true);
          if (once) observer.unobserve(node);
          return;
        }

        if (!once) setVisible(false);
      },
      { threshold: 0.01, rootMargin: "0px 0px -4% 0px" }
    );

    observer.observe(node);
    return () => {
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [once]);

  const fromY = y === "sm" ? "translate-y-2" : y === "lg" ? "translate-y-8" : "translate-y-5";

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transform-none motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : `${fromY} opacity-0`,
        className
      )}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
};
