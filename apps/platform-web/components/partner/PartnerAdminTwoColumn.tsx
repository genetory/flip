"use client";

import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export function PartnerAdminTwoColumn({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("mx-auto w-full max-w-4xl rounded-2xl bg-muted/30 p-4 md:p-6", className)}>{children}</section>
  );
}
