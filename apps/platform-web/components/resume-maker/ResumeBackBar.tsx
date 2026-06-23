import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { ResumeActiveSwitcher } from "./ResumeActiveSwitcher";

// GNB 아래 바 — 좌측 '뒤로'(이력서 목록), 우측 '현재 이력서 ▾' 전환기.
// 세 도구가 현재 이력서를 공유하므로, 여기서 다른 이력서로 바로 바꿀 수 있다.
// 하단 디바이더(border) 없이 배경만.
export function ResumeBackBar({ backHref, backLabel, title }: { backHref: string; backLabel: string; title?: string }) {
  return (
    <div className="bg-background/95 backdrop-blur lg:sticky lg:top-14 lg:z-30">
      <div className="container flex max-w-6xl items-center justify-between gap-3 px-5 py-2.5">
        <Link href={backHref} className="inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" weight="bold" aria-hidden /> {backLabel}
        </Link>
        <ResumeActiveSwitcher currentTitle={title ?? ""} />
      </div>
    </div>
  );
}
