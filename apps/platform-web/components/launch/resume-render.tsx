"use client";

import type { ResumeData } from "../../lib/launch/resume-data";
import type { ResumeContent } from "../../lib/member-profile-client";
import { ResumePreview } from "../resume-maker/ResumePreview";
import { DEFAULT_DESIGN } from "../../lib/resume-maker-types";

// Career Launch 이력서 데이터를 resume-maker(이력서 만들기)와 동일한 형식으로 렌더링.
// Career Launch 데이터(basic/educations/experiences/skills/languages)를 resume-maker
// 의 ResumeContent 로 매핑한 뒤, 실제 미리보기 컴포넌트(ResumePreview)로 그린다.

// "2020.03~2024.02", "2019-2023" 같은 기간 문자열을 시작/종료로 분리.
function splitPeriod(p?: string | null): { start?: string; end?: string } {
  if (!p) return {};
  const parts = p
    .split(/\s*(?:[~–—]|\s-\s|부터|\bto\b)\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length >= 2) return { start: parts[0], end: parts.slice(1).join(" ") };
  // 구분자 없는 단일 토큰(예: "6개월") — 종료를 같게 둬 'A ~ A'가 아니라 그대로 노출.
  return { start: parts[0], end: parts[0] };
}

function toResumeContent(data: ResumeData): ResumeContent {
  const b = data.basic ?? {};
  return {
    basicName: b.name ?? null,
    basicEmail: b.email ?? null,
    basicPhone: b.phone ?? null,
    summary: b.summary ?? null,
    educations: (data.educations ?? []).map((e) => {
      const { start, end } = splitPeriod(e.period);
      return {
        schoolName: e.school ?? undefined,
        major: [e.major, e.degree].filter(Boolean).join(" · ") || undefined,
        startDate: start,
        endDate: end
      };
    }),
    careers: (data.experiences ?? []).map((x) => {
      const { start, end } = splitPeriod(x.period);
      const bullets = (x.bullets ?? []).filter(Boolean);
      return {
        position: x.title ?? undefined,
        companyName: x.org ?? undefined,
        description: bullets.length ? bullets.map((t) => `• ${t}`).join("\n") : undefined,
        startDate: start,
        endDate: end
      };
    }),
    skills: (data.skills ?? []).filter(Boolean),
    languages: (data.languages ?? []).map((l) => ({ language: l.language ?? undefined, level: l.level ?? undefined }))
  };
}

// maxWidth: 미리보기 최대 폭(px). ResumePreview 는 컨테이너 폭에 맞춰 스케일되므로,
// 좁은 사이드바·패널에서는 작은 값을 줘서 컴팩트하게 보여준다. 미지정 시 컨테이너 폭.
export function ResumeRender({ data, maxWidth }: { data: ResumeData; maxWidth?: number }) {
  return (
    <div style={maxWidth ? { maxWidth } : undefined}>
      <ResumePreview content={toResumeContent(data)} design={DEFAULT_DESIGN} />
    </div>
  );
}
