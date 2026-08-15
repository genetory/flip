"use client";

// Career Launch 완주 여부 — 4주 전 스텝 완료면 true. 프로필 인증 뱃지·테두리에 사용.
// 미등록 학생은 progress 조회가 막혀 false 로 떨어진다(정상).
import { useEffect, useState } from "react";
import { WEEKS } from "./data";
import { fetchProgress } from "./progress-client";
import { fetchResumeData } from "./resume-data";
import { fetchCoverData } from "./cover-data";
import { weekDoneCount } from "./step-status";

export function useCareerLaunchCompleted(): boolean {
  const [completed, setCompleted] = useState(false);
  useEffect(() => {
    let alive = true;
    void Promise.allSettled([fetchProgress(), fetchResumeData(), fetchCoverData()]).then((r) => {
      if (!alive) return;
      if (r[0].status !== "fulfilled") return; // 미등록/오류 → false 유지
      const data = {
        progress: r[0].value,
        resume: (r[1].status === "fulfilled" ? r[1].value.data : {}) as never,
        cover: (r[2].status === "fulfilled" ? r[2].value.data : {}) as never
      };
      const total = WEEKS.reduce((n, w) => n + w.steps.length, 0);
      const done = WEEKS.reduce((n, w) => n + weekDoneCount(w.steps, data), 0);
      setCompleted(total > 0 && done >= total);
    });
    return () => { alive = false; };
  }, []);
  return completed;
}
