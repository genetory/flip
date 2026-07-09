"use client";

import type { ResumeData } from "../../lib/launch/resume-data";

// 대화로 쌓은 이력서 데이터를 실제 이력서 형태로 렌더링(읽기 전용).
// 빈 섹션은 자연스럽게 생략한다.
export function ResumeRender({ data }: { data: ResumeData }) {
  const b = data.basic ?? {};
  const educations = (data.educations ?? []).filter((e) => e.school || e.major || e.degree || e.period || e.note);
  const experiences = (data.experiences ?? []).filter((x) => x.title || x.org || x.period || (x.bullets && x.bullets.length));
  const skills = (data.skills ?? []).filter(Boolean);
  const languages = (data.languages ?? []).filter((l) => l.language || l.level);

  return (
    <div className="rounded-2xl border border-[#E5E8EB] bg-white p-6 md:p-8">
      {/* 헤더 — 기본정보 */}
      <header className="border-b border-[#EEF1F5] pb-5">
        <h1 className="text-[24px] font-black tracking-[-0.01em] text-[#0B1227] md:text-[28px]">{b.name || "이름 미입력"}</h1>
        {b.summary ? <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#4E5968]">{b.summary}</p> : null}
        {(b.email || b.phone) ? (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#8B95A1]">
            {b.email ? <span>✉ {b.email}</span> : null}
            {b.phone ? <span>☎ {b.phone}</span> : null}
          </div>
        ) : null}
      </header>

      {experiences.length > 0 ? (
        <Section title="경력 · 경험">
          {experiences.map((x, i) => (
            <div key={i} className="mb-4 last:mb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                <p className="text-[15px] font-bold text-[#191F28]">
                  {x.title || "역할"}
                  {x.org ? <span className="font-semibold text-[#4E5968]"> · {x.org}</span> : null}
                </p>
                {x.period ? <span className="text-[12.5px] text-[#8B95A1]">{x.period}</span> : null}
              </div>
              {x.bullets && x.bullets.length ? (
                <ul className="mt-1.5 space-y-1">
                  {x.bullets.map((bl, bi) => (
                    <li key={bi} className="flex gap-1.5 break-keep text-[13.5px] leading-relaxed text-[#333D4B]">
                      <span className="text-[#0B46E8]">•</span>
                      {bl}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
        </Section>
      ) : null}

      {educations.length > 0 ? (
        <Section title="학력">
          {educations.map((e, i) => (
            <div key={i} className="mb-3 flex flex-wrap items-baseline justify-between gap-x-2 last:mb-0">
              <p className="text-[14px] font-bold text-[#191F28]">
                {e.school || "학교"}
                {e.major ? <span className="font-semibold text-[#4E5968]"> · {e.major}</span> : null}
                {e.degree ? <span className="text-[#8B95A1]"> ({e.degree})</span> : null}
                {e.note ? <span className="block text-[12.5px] font-normal text-[#8B95A1]">{e.note}</span> : null}
              </p>
              {e.period ? <span className="text-[12.5px] text-[#8B95A1]">{e.period}</span> : null}
            </div>
          ))}
        </Section>
      ) : null}

      {skills.length > 0 ? (
        <Section title="스킬">
          <div className="flex flex-wrap gap-1.5">
            {skills.map((s, i) => (
              <span key={i} className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[12.5px] font-semibold text-[#0B46E8]">{s}</span>
            ))}
          </div>
        </Section>
      ) : null}

      {languages.length > 0 ? (
        <Section title="어학">
          <ul className="space-y-1">
            {languages.map((l, i) => (
              <li key={i} className="text-[13.5px] text-[#333D4B]">
                <span className="font-semibold text-[#191F28]">{l.language || "언어"}</span>
                {l.level ? <span className="text-[#8B95A1]"> — {l.level}</span> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-3 text-[12.5px] font-black uppercase tracking-wide text-[#0B46E8]">{title}</h2>
      {children}
    </section>
  );
}
