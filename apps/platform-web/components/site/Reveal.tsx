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

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setVisible(true);
        if (once) observer.unobserve(node);
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
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

