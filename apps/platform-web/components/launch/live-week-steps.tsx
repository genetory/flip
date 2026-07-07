"use client";

import { useState } from "react";
import Link from "next/link";
import { type Step } from "../../lib/launch/data";

export type DiagResult = { percent: number; level: string } | null;

// 대시보드용 스텝 목록 — 스텝을 강제로 이어붙이지 않고, 각 스텝을 완료하면
// 그 결과(진단 준비도 / 선정 직무)를 여기서 바로 보여준다. 사용자는 결과를
// 확인하고 원하는 다음 스텝을 고른다.
export function LiveWeekSteps({
  steps,
  diag,
  jobs,
  materials,
  doneIds,
  onReset
}: {
  steps: Step[];
  diag: DiagResult;
  jobs: string[];
  materials: number;
  doneIds: string[];
  onReset: (id: string) => void;
}) {
  // 결과로 완료되지 않는 일반 스텝은 수동 체크.
  const [manual, setManual] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(steps.map((s) => [s.id, Boolean(s.done)]))
  );

  const resultStep = (id: string) => id === "w1s1" || id === "w1s2" || id === "w1s3";
  const isDone = (s: Step) => {
    if (s.id === "w1s1") return Boolean(diag);
    if (s.id === "w1s2") return jobs.length > 0;
    if (s.id === "w1s3") return materials > 0;
    if (doneIds.includes(s.id)) return true; // 학습 카드 등 완료 체크형 스텝
    return Boolean(manual[s.id]);
  };

  const pickedRoles = jobs; // 저장 형식이 직무명(role) 배열

  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = isDone(s);
        const last = i === steps.length - 1;
        const toggleable = !resultStep(s.id);
        return (
          <li key={s.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!toggleable}
                onClick={toggleable ? () => setManual((p) => ({ ...p, [s.id]: !p[s.id] })) : undefined}
                aria-label={toggleable ? (done ? "완료 취소" : "완료로 표시") : undefined}
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-black shadow-sm transition ${
                  done ? "bg-[#0B46E8] text-white" : "border-2 border-[#D7DCE3] bg-white text-[#4E5968]"
                } ${toggleable ? "hover:border-[#0B46E8] hover:text-[#0B46E8]" : "cursor-default"}`}
              >
                {done ? "✓" : i + 1}
              </button>
              {!last ? <span className="mt-1.5 w-[2px] flex-1 rounded bg-[#E5E8EB]" /> : null}
            </div>

            <div className={`min-w-0 flex-1 ${last ? "pb-0.5" : "pb-7"}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={`text-[15.5px] font-bold leading-snug tracking-[-0.01em] md:text-[16px] ${done ? "text-[#8B95A1]" : "text-[#191F28]"}`}>
                  {s.title}
                </p>
                {!done && s.minutes ? (
                  <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#8B95A1]">⏱ 약 {s.minutes}분</span>
                ) : null}
              </div>
              <p className={`mt-1.5 text-[13.5px] leading-[1.7] ${done ? "text-[#B0B8C1]" : "text-[#4E5968]"}`}>{s.desc}</p>

              {/* 진단 결과 */}
              {s.id === "w1s1" && diag ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 text-[13.5px] font-bold text-[#191F28]">
                      취업 준비도 <span className="text-[#0B46E8]">{diag.percent}%</span>
                      {diag.level ? <span className="font-medium text-[#4E5968]"> · {diag.level}</span> : null}
                    </p>
                    <span className="flex shrink-0 items-center gap-2">
                      <Link href="/career-launch/diagnosis" className="text-[12.5px] font-bold text-[#0B46E8] underline">
                        다시 보기
                      </Link>
                      <button type="button" onClick={() => onReset(s.id)} className="text-[12.5px] font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">
                        삭제
                      </button>
                    </span>
                  </div>
                </div>
              ) : s.id === "w1s2" && jobs.length > 0 ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="min-w-0 text-[13.5px] font-bold text-[#191F28]">
                      선정한 직무 <span className="text-[#0B46E8]">{jobs.length}개</span> · {pickedRoles.join(" · ")}
                    </p>
                    <span className="flex shrink-0 items-center gap-2">
                      <Link href="/career-launch/jobs?restart=1" className="text-[12.5px] font-bold text-[#0B46E8] underline">
                        다시 선정
                      </Link>
                      <button type="button" onClick={() => onReset(s.id)} className="text-[12.5px] font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">
                        삭제
                      </button>
                    </span>
                  </div>
                </div>
              ) : s.id === "w1s3" && materials > 0 ? (
                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-[#191F28]">
                      이력서 재료 <span className="text-[#0B46E8]">{materials}개</span> 정리 완료
                    </p>
                    <span className="flex shrink-0 items-center gap-2">
                      <Link href="/career-launch/materials" className="text-[12.5px] font-bold text-[#0B46E8] underline">
                        다시 정리
                      </Link>
                      <button type="button" onClick={() => onReset(s.id)} className="text-[12.5px] font-semibold text-[#8B95A1] underline hover:text-[#4E5968]">
                        삭제
                      </button>
                    </span>
                  </div>
                </div>
              ) : done ? (
                // 완료된 학습·일반 스텝 — 완료 표시 + 삭제(초기화)
                <div className="mt-2 flex items-center gap-2 text-[12.5px]">
                  <span className="font-bold text-emerald-600">✓ 완료</span>
                  <button
                    type="button"
                    onClick={() => {
                      onReset(s.id);
                      setManual((m) => ({ ...m, [s.id]: false }));
                    }}
                    className="font-semibold text-[#8B95A1] underline hover:text-[#4E5968]"
                  >
                    삭제
                  </button>
                </div>
              ) : s.action ? (
                <Link
                  href={s.action.href}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#0B46E8] px-3.5 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]"
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
