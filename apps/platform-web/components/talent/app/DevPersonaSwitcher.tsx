"use client";

// 개발용 상태 스위처 — 5가지 Talent persona 를 전환해 상태별 화면을 확인한다.
// 프로덕션에서는 렌더하지 않는다(showPersonaSwitcher).
import { useEffect, useState } from "react";
import { Flask, CaretUp } from "@phosphor-icons/react";
import { personaOptions } from "../../../lib/talent/mock/personas";
import { readPersona, writePersona, showPersonaSwitcher } from "../../../lib/talent/persona-state";
import type { TalentPersonaId } from "../../../lib/talent/types";

export function DevPersonaSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<TalentPersonaId>("experiences");

  useEffect(() => {
    setCurrent(readPersona());
    setMounted(true);
  }, []);

  if (!showPersonaSwitcher || !mounted) return null;

  function select(id: TalentPersonaId) {
    writePersona(id);
    // 셸/화면 훅이 모두 새 상태를 읽도록 새로고침(개발 편의).
    window.location.reload();
  }

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6">
      {open ? (
        <div className="mb-2 w-52 overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white p-1.5 shadow-[0_12px_32px_rgba(11,18,39,0.16)]">
          <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#B0B8C1]">DEV · 상태 전환</p>
          {personaOptions.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(p.id)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold transition ${
                current === p.id ? "bg-[#EDF1FD] text-[#0B46E8]" : "text-[#4E5968] hover:bg-[#F6F8FB]"
              }`}
            >
              {p.label}
              {current === p.id ? <span className="text-[11px]">●</span> : null}
            </button>
          ))}
        </div>
      ) : null}
      <button
        type="button"
        aria-label="개발용 상태 전환"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[12px] font-bold text-[#4E5968] shadow-[0_6px_20px_rgba(11,18,39,0.1)]"
      >
        <Flask className="h-4 w-4 text-[#0B46E8]" />
        {personaOptions.find((p) => p.id === current)?.label ?? "상태"}
        <CaretUp className={`h-3 w-3 transition ${open ? "" : "rotate-180"}`} />
      </button>
    </div>
  );
}
