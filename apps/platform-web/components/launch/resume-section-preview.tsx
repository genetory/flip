"use client";

import type { ResumeData, ResumeExperience, ResumeSection } from "../../lib/launch/resume-data";
import { useLaunchT } from "../../lib/launch/i18n";

// 수집 채팅에서 지금까지 모은 내용을 '이력서에 이렇게 담겨요' 형태로 정리해 보여준다.
// focus 섹션이 있으면 그 섹션만, 없으면 채워진 섹션 전부를 컴팩트하게 렌더.
export function ResumeSectionPreview({ data, focus }: { data: ResumeData; focus?: ResumeSection }) {
  const t = useLaunchT();
  const b = data.basic ?? {};
  const exps = data.experiences ?? [];
  const work = exps.filter((x) => x.kind !== "other");
  const other = exps.filter((x) => x.kind === "other");
  const show = (s: ResumeSection) => !focus || focus === s;

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-[#0B46E8]">{title}</p>
      <div className="mt-1">{children}</div>
    </div>
  );

  const expItems = (items: ResumeExperience[]) => (
    <ul className="space-y-1.5">
      {items.map((x, i) => (
        <li key={i}>
          <p className="text-[12.5px] font-bold text-[#191F28]">
            {[x.title, x.org].filter(Boolean).join(" · ")}
            {x.period ? <span className="font-normal text-[#8B95A1]"> ({x.period})</span> : null}
          </p>
          {x.bullets?.length ? (
            <ul className="mt-0.5 space-y-0.5">
              {x.bullets.filter(Boolean).map((bl, bi) => (
                <li key={bi} className="flex gap-1.5 break-keep text-[12px] leading-relaxed text-[#4E5968]">
                  <span className="text-[#0B46E8]">•</span>
                  {bl}
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );

  const blocks: React.ReactNode[] = [];

  if (show("basic") && (b.name || b.email || b.phone || b.summary)) {
    blocks.push(
      <div key="basic">
        {b.name ? <p className="text-[16px] font-black leading-tight text-[#0B1227]">{b.name}</p> : null}
        {b.email || b.phone ? <p className="mt-0.5 text-[12px] text-[#8B95A1]">{[b.email, b.phone].filter(Boolean).join("   ·   ")}</p> : null}
        {b.summary ? <p className="mt-1.5 break-keep text-[12.5px] italic leading-relaxed text-[#4E5968]">“{b.summary}”</p> : null}
      </div>
    );
  }
  if (show("edu") && (data.educations?.length ?? 0) > 0) {
    blocks.push(
      <Section key="edu" title={t("학력", "Education", "教育", "Học vấn", "学歴", "Pendidikan")}>
        <ul className="space-y-0.5">
          {data.educations!.map((e, i) => (
            <li key={i} className="break-keep text-[12.5px] text-[#333D4B]">
              {[e.school, e.major, e.degree].filter(Boolean).join(" · ")}
              {e.period ? <span className="text-[#B0B8C1]"> ({e.period})</span> : null}
            </li>
          ))}
        </ul>
      </Section>
    );
  }
  if (show("exp") && work.length > 0) {
    blocks.push(
      <Section key="exp" title={t("경력", "Experience", "经历", "Kinh nghiệm", "職歴", "Pengalaman")}>
        {expItems(work)}
      </Section>
    );
  }
  if (show("expOther") && other.length > 0) {
    blocks.push(
      <Section key="expOther" title={t("활동·프로젝트", "Activities & projects", "活动·项目", "Hoạt động·Dự án", "活動·プロジェクト", "Aktivitas·Proyek")}>
        {expItems(other)}
      </Section>
    );
  }
  if (show("skill") && (data.skills?.length ?? 0) > 0) {
    blocks.push(
      <Section key="skill" title={t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keterampilan")}>
        <div className="flex flex-wrap gap-1">
          {data.skills!.filter(Boolean).map((s, i) => (
            <span key={i} className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11.5px] font-semibold text-[#0B46E8]">{s}</span>
          ))}
        </div>
      </Section>
    );
  }
  if (show("lang") && (data.languages?.length ?? 0) > 0) {
    blocks.push(
      <Section key="lang" title={t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}>
        <p className="text-[12.5px] text-[#333D4B]">{data.languages!.map((l) => [l.language, l.level].filter(Boolean).join(" ")).join("   ·   ")}</p>
      </Section>
    );
  }

  if (!blocks.length) return null;

  return (
    <div className="mt-3 rounded-2xl border border-[#E5E8EB] bg-white p-4 shadow-[0_1px_2px_rgba(17,24,39,0.04)]">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-[13px]">📄</span>
        <p className="text-[12.5px] font-bold text-[#191F28]">{t("이력서에 이렇게 담겨요", "Here's how it'll appear on your resume", "简历中将这样呈现", "Sẽ xuất hiện trên CV như thế này", "履歴書にはこう載ります", "Beginilah tampil di resume")}</p>
      </div>
      <div className="max-h-[34vh] space-y-3 overflow-y-auto pr-1">{blocks}</div>
    </div>
  );
}
