"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Step } from "../../lib/launch/data";
import { fetchProgress, patchProgress, type CareerProgress } from "../../lib/launch/progress-client";

// 결과로 완료되는 스텝(수동 체크 불가) — 진단·직무·직무정보. 대시보드와 동일 규칙.
const RESULT_STEP = new Set(["w1s1", "w1s2", "w1s3"]);

// 주차 페이지용 스텝 목록 — 1주차처럼 순차 잠금. 이전 스텝을 완료해야 다음 스텝을
// 시작할 수 있고, 완료 상태는 백엔드(progress)에 저장돼 기기 간 동기화된다.
export function WeekStepper({ steps }: { steps: Step[] }) {
  const [prog, setProg] = useState<CareerProgress>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const p = await fetchProgress();
        if (alive) setProg(p);
      } catch {
        // 조회 실패 시 빈 상태
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 진단·직무·직무정보는 실제 진행 결과로 완료 판정, 그 외는 doneSteps 수동 체크.
  const isDone = (id: string) => {
    if (id === "w1s1") return Boolean(prog.diagnosis && typeof prog.diagnosis.percent === "number");
    if (id === "w1s2") return (prog.selectedJobs?.length ?? 0) > 0;
    if (id === "w1s3") return (prog.materials?.length ?? 0) > 0;
    return (prog.doneSteps ?? []).includes(id);
  };

  const toggle = (id: string) => {
    if (RESULT_STEP.has(id)) return; // 결과 스텝은 수동 체크 불가
    const cur = prog.doneSteps ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setProg((p) => ({ ...p, doneSteps: next }));
    void patchProgress({ doneSteps: next }).catch(() => {
      // 저장 실패해도 화면 상태 유지
    });
  };

  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = isDone(s.id);
        const last = i === steps.length - 1;
        const result = RESULT_STEP.has(s.id);
        // 순차 연계 — 이전 스텝을 모두 완료해야 이 스텝을 시작할 수 있다.
        const locked = ready && !done && !steps.slice(0, i).every((p) => isDone(p.id));
        const toggleable = !result && !locked;
        return (
          <li key={s.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!toggleable}
                onClick={toggleable ? () => toggle(s.id) : undefined}
                aria-label={toggleable ? (done ? "완료 취소" : "완료로 표시") : undefined}
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-black shadow-sm transition ${
                  done
                    ? "bg-[#0B46E8] text-white"
                    : locked
                      ? "cursor-default border-2 border-[#E5E8EB] bg-[#F8FAFC] text-[#C9CDD2]"
                      : "border-2 border-[#D7DCE3] bg-white text-[#4E5968]"
                } ${toggleable ? "hover:border-[#0B46E8] hover:text-[#0B46E8]" : "cursor-default"}`}
              >
                {done ? "✓" : locked ? "🔒" : i + 1}
              </button>
              {!last ? <span className="mt-1.5 w-[2px] flex-1 rounded bg-[#E5E8EB]" /> : null}
            </div>
            <div className={`min-w-0 flex-1 ${last ? "pb-0.5" : "pb-7"}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={`text-[15.5px] font-bold leading-snug tracking-[-0.01em] md:text-[16px] ${done ? "text-[#B0B8C1] line-through" : locked ? "text-[#B0B8C1]" : "text-[#191F28]"}`}>
                  {s.title}
                </p>
                {!done && !locked && s.minutes ? (
                  <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#8B95A1]">⏱ 약 {s.minutes}분</span>
                ) : null}
              </div>
              <p className={`mt-1.5 break-keep text-[13.5px] leading-[1.7] ${done ? "text-[#B0B8C1]" : locked ? "text-[#C9CDD2]" : "text-[#4E5968]"}`}>
                {s.desc
                  .split(/(?<=\.)\s+/)
                  .filter(Boolean)
                  .map((line, li) => (
                    <span key={li} className="block">
                      {line}
                    </span>
                  ))}
              </p>
              {locked ? (
                <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#B0B8C1]">🔒 이전 단계를 완료하면 시작할 수 있어요</p>
              ) : done ? (
                <div className="mt-2 flex items-center gap-2 text-[12.5px]">
                  <span className="font-bold text-emerald-600">✓ 완료</span>
                  {toggleable ? (
                    <button type="button" onClick={() => toggle(s.id)} className="font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">
                      완료 취소
                    </button>
                  ) : s.action ? (
                    <Link href={s.action.href} className="font-semibold text-[#0B46E8] underline">
                      다시 하기
                    </Link>
                  ) : null}
                </div>
              ) : s.action ? (
                <Link
                  href={s.action.href}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#EDF1FD] px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]"
                >
                  {s.action.label} <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
