"use client";

import { Ticket } from "@phosphor-icons/react/dist/ssr";

// 버튼 안에 "이 동작은 티켓 1개 소모"를 표시하는 작은 칩(파란 버튼 위 흰 반투명).
export function AiTicketCost() {
  return (
    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-bold leading-none">
      <Ticket weight="fill" className="h-3 w-3" aria-hidden />1
    </span>
  );
}
