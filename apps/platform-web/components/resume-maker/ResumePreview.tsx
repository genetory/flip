"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { ResumeContent } from "../../lib/member-profile-client";
import { RESUME_VISA_OPTIONS, type ResumeDesignSettings, type ResumeTemplateId } from "../../lib/resume-maker-types";

// A4 = 210×297mm. 96dpi 기준 794×1123px 로 고정 렌더하고, 컨테이너 폭에 맞춰
// transform scale 로 축소한다. 페이지 수는 실제 콘텐츠 높이 / 1123 으로 추정.
const A4_W = 794;
const A4_H = 1123;

type SectionKey =
  | "summary"
  | "selfIntro"
  | "careers"
  | "activities"
  | "education"
  | "certifications"
  | "skills"
  | "languages"
  | "links";

const TEMPLATE_ORDER: Record<ResumeTemplateId, SectionKey[]> = {
  basic: ["summary", "selfIntro", "careers", "activities", "education", "certifications", "skills", "languages", "links"],
  newgrad: ["education", "summary", "selfIntro", "activities", "careers", "certifications", "skills", "languages", "links"],
  project: ["summary", "activities", "careers", "education", "certifications", "skills", "languages", "links"]
};

function period(start?: string, end?: string): string {
  if (!start && !end) return "";
  return `${start ?? ""}${start || end ? " ~ " : ""}${end || (start ? "현재" : "")}`.trim();
}

function nonEmpty(v?: string | null): v is string {
  return Boolean(v && v.trim());
}

// A4 시트 본문 — 화면 미리보기(스케일)와 인쇄(PDF)에서 동일하게 재사용.
// 섹션 라벨 — 국문/영문. lang="en" 이면 영문 이력서로 라벨을 바꾼다(값/장문은 번역된
// content 를 받아서 렌더). key 는 SectionKey 와 일치한다.
const SECTION_LABELS: Record<"ko" | "en", Record<SectionKey, string>> = {
  ko: {
    summary: "요약",
    selfIntro: "자기소개",
    careers: "경력",
    activities: "활동 · 프로젝트",
    education: "학력",
    certifications: "자격 · 수상",
    skills: "스킬",
    languages: "어학",
    links: "링크"
  },
  en: {
    summary: "Summary",
    selfIntro: "About Me",
    careers: "Experience",
    activities: "Activities & Projects",
    education: "Education",
    certifications: "Certifications & Awards",
    skills: "Skills",
    languages: "Languages",
    links: "Links"
  }
};

export function ResumeSheet({
  content,
  design,
  highlightSection,
  innerRef,
  lang = "ko"
}: {
  content: ResumeContent;
  design: ResumeDesignSettings;
  highlightSection?: SectionKey | null;
  innerRef?: React.Ref<HTMLDivElement>;
  lang?: "ko" | "en";
}) {
  const accent = design.accentColor || "#0B46E8";
  const baseFont = 13.5 * design.fontScale;
  const order = TEMPLATE_ORDER[design.templateId] ?? TEMPLATE_ORDER.basic;
  const layout = design.layout ?? "modern";
  const labels = SECTION_LABELS[lang];
  const name = content.basicName || (lang === "en" ? "Name" : "이름");
  const visaLabel = content.basicVisa
    ? `${lang === "en" ? "Visa" : "비자"} ${RESUME_VISA_OPTIONS.find((o) => o.value === content.basicVisa)?.label ?? content.basicVisa}`
    : "";
  const contactItems = [content.basicPhone, content.basicEmail, content.basicResidence, visaLabel].filter(nonEmpty);
  const contactLine = contactItems.join("  ·  ");
  // renderSection 이 호출 직전에 설정 — sectionTitle 이 본문/사이드바 스타일을 구분.
  let titleVariant: "main" | "side" = "main";

  function sectionTitle(_label: string, key: SectionKey) {
    const label = labels[key] ?? _label;
    const active = highlightSection === key;
    const ring = active ? "rounded bg-amber-50 ring-1 ring-amber-200" : "";
    if (titleVariant === "side") {
      return (
        <h4 className={`mb-2 text-[11px] font-extrabold uppercase tracking-wide ${ring}`} style={{ color: accent }}>
          {label}
        </h4>
      );
    }
    // 섹션 제목 마커 — 디자인 설정에서 선택.
    const marker = design.titleMarker ?? "diamond";
    if (marker === "bar") {
      return (
        <h3 className={`mb-2 border-l-[3px] pl-2 text-[13px] font-bold tracking-tight text-slate-900 ${ring}`} style={{ borderColor: accent }}>
          {label}
        </h3>
      );
    }
    if (marker === "underline") {
      return (
        <h3 className={`mb-2 border-b pb-1 text-[13px] font-bold tracking-tight ${ring}`} style={{ color: accent, borderColor: accent }}>
          {label}
        </h3>
      );
    }
    if (marker === "none") {
      return <h3 className={`mb-2 text-[13px] font-bold tracking-tight text-slate-900 ${ring}`}>{label}</h3>;
    }
    if (marker === "dot") {
      return (
        <h3 className={`mb-2 flex items-center gap-1.5 text-[13px] font-bold tracking-tight text-slate-900 ${ring}`}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: accent }} aria-hidden />
          {label}
        </h3>
      );
    }
    // diamond (기본) — 포인트 마름모
    return (
      <h3 className={`mb-2 flex items-center gap-1.5 text-[13px] font-bold tracking-tight text-slate-900 ${ring}`}>
        <span className="inline-block h-2 w-2 rotate-45 rounded-[1.5px]" style={{ background: accent }} aria-hidden />
        {label}
      </h3>
    );
  }

  function renderSection(key: SectionKey, variant: "main" | "side" = "main") {
    titleVariant = variant;
    if (key === "summary") {
      if (!nonEmpty(content.summary) && !nonEmpty(content.desiredJobRole)) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("요약", key)}
          {nonEmpty(content.desiredJobRole) ? <p className="font-semibold text-slate-800">{content.desiredJobRole}</p> : null}
          {nonEmpty(content.summary) ? <p className="text-slate-700">{content.summary}</p> : null}
        </section>
      );
    }
    if (key === "selfIntro") {
      if (!nonEmpty(content.selfIntroduction)) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("자기소개", key)}
          <p className="whitespace-pre-line text-slate-700">{content.selfIntroduction}</p>
        </section>
      );
    }
    if (key === "careers") {
      const items = (content.careers ?? []).filter((c) => nonEmpty(c.position) || nonEmpty(c.companyName));
      if (items.length === 0) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("경력", key)}
          <div className="space-y-2.5">
            {items.map((c, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-800">
                    {c.position}
                    {nonEmpty(c.companyName) ? <span className="font-normal text-slate-500"> · {c.companyName}</span> : null}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">{period(c.startDate, c.endDate)}</span>
                </div>
                {nonEmpty(c.description) ? <p className="mt-0.5 whitespace-pre-line text-slate-700">{c.description}</p> : null}
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (key === "activities") {
      const items = (content.activities ?? []).filter((a) => nonEmpty(a.title));
      if (items.length === 0) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("활동 · 프로젝트", key)}
          <div className="space-y-2.5">
            {items.map((a, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-semibold text-slate-800">
                    {a.title}
                    {nonEmpty(a.organization) ? <span className="font-normal text-slate-500"> · {a.organization}</span> : null}
                  </p>
                  <span className="shrink-0 text-[11px] text-slate-400">{period(a.startDate, a.endDate)}</span>
                </div>
                {nonEmpty(a.description) ? <p className="mt-0.5 whitespace-pre-line text-slate-700">{a.description}</p> : null}
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (key === "education") {
      // 최신이 위로 — 진행 중(졸업월 비움)을 가장 위, 그다음 졸업월·입학월 내림차순.
      const recency = (e: { startDate?: string | null; endDate?: string | null }) =>
        `${(e.endDate ?? "").trim() || "9999-99"}|${(e.startDate ?? "").trim() || "0000-00"}`;
      const items = (content.educations ?? [])
        .filter((e) => nonEmpty(e.schoolName))
        .slice()
        .sort((a, b) => recency(b).localeCompare(recency(a)));
      if (items.length === 0) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("학력", key)}
          <div className="space-y-1.5">
            {items.map((e, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2">
                <p className="text-slate-800">
                  {e.schoolName}
                  {nonEmpty(e.major) ? <span className="text-slate-500"> · {e.major}</span> : null}
                </p>
                <span className="shrink-0 text-[11px] text-slate-400">{period(e.startDate ?? undefined, e.endDate ?? undefined)}</span>
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (key === "certifications") {
      const items = (content.certifications ?? []).filter((c) => nonEmpty(c.name));
      if (items.length === 0) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("자격 · 수상", key)}
          <div className="space-y-1">
            {items.map((c, i) => {
              const meta = [c.issuer, c.date].filter(nonEmpty).join(" · ");
              return (
                <div key={i} className="flex items-baseline justify-between gap-2">
                  <p className="text-slate-800">{c.name}</p>
                  {meta ? <span className="shrink-0 text-[11px] text-slate-400">{meta}</span> : null}
                </div>
              );
            })}
          </div>
        </section>
      );
    }
    if (key === "skills") {
      const items = (content.skills ?? []).filter(nonEmpty);
      if (items.length === 0) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("스킬", key)}
          <p className="text-slate-700">{items.join("  ·  ")}</p>
        </section>
      );
    }
    if (key === "languages") {
      const items = (content.languages ?? []).filter((l) => nonEmpty(l.language));
      if (items.length === 0) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("어학", key)}
          <div className="space-y-1">
            {items.map((l, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2">
                <p className="text-slate-800">{l.language}</p>
                {nonEmpty(l.level) ? <span className="shrink-0 text-[11px] text-slate-400">{l.level}</span> : null}
              </div>
            ))}
          </div>
        </section>
      );
    }
    if (key === "links") {
      const items = (content.links ?? []).filter((l) => nonEmpty(l.url));
      if (items.length === 0) return null;
      return (
        <section key={key} style={{ marginTop: design.sectionGap }}>
          {sectionTitle("링크", key)}
          <div className="space-y-1">
            {items.map((l, i) => (
              <div key={i} className="flex items-baseline justify-between gap-2">
                <p className="text-slate-800">{nonEmpty(l.label) ? l.label : l.url}</p>
                <span className="shrink-0 truncate text-[11px] text-slate-400" style={{ maxWidth: "55%" }}>
                  {l.url}
                </span>
              </div>
            ))}
          </div>
        </section>
      );
    }
    return null;
  }

  const hasPhoto = design.showPhoto && nonEmpty(content.basicPhotoUrl);
  const photo = hasPhoto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={content.basicPhotoUrl ?? ""} alt="" className="h-[154px] w-[121px] shrink-0 rounded-sm object-cover" />
  ) : null;
  // 사진이 있으면 이름·연락처를 세로 가운데, 없으면 상단 정렬.
  const headerAlign = hasPhoto ? "items-center" : "items-start";

  // 2단 사이드바 — 좌측엔 보조 정보(스킬·어학·자격·링크), 우측엔 본문.
  const SIDE_KEYS: SectionKey[] = ["skills", "languages", "certifications", "links"];
  const sideKeys = order.filter((k) => SIDE_KEYS.includes(k));
  const mainKeys = order.filter((k) => !SIDE_KEYS.includes(k));

  return (
    <div
      ref={innerRef}
      className="resume-sheet bg-white text-slate-800 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-8px_rgba(0,0,0,0.12)]"
      style={{ width: A4_W, minHeight: A4_H, padding: "48px 52px", fontSize: baseFont, lineHeight: design.lineHeight }}
    >
      {layout === "band" ? (
        <>
          <header
            className={`flex ${headerAlign} gap-4`}
            style={{ background: accent, color: "white", margin: "-48px -52px 0", padding: "30px 52px" }}
          >
            {photo}
            <div>
              <h1 className="text-[24px] font-black tracking-tight text-white">{name}</h1>
              {nonEmpty(contactLine) ? <p className="mt-1 text-[11.5px] text-white/85">{contactLine}</p> : null}
            </div>
          </header>
          <div style={{ marginTop: 4 }}>{order.map((key) => renderSection(key, "main"))}</div>
        </>
      ) : layout === "sidebar" || layout === "sidebar-right" ? (
        (() => {
          const aside = (
            <aside
              key="aside"
              className="w-[34%] shrink-0 space-y-4 rounded-lg bg-slate-50 p-4"
              style={{ fontSize: baseFont * 0.86, lineHeight: 1.45 }}
            >
              {contactItems.length ? (
                <div>
                  <h4 className="mb-2 text-[11px] font-extrabold uppercase tracking-wide" style={{ color: accent }}>
                    연락처
                  </h4>
                  <div className="space-y-0.5 text-slate-700">
                    {contactItems.map((it, i) => (
                      <p key={i} className="break-all">
                        {it}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
              {sideKeys.map((key) => renderSection(key, "side"))}
            </aside>
          );
          const main = (
            <div key="main" className="min-w-0 flex-1">
              {mainKeys.map((key) => renderSection(key, "main"))}
            </div>
          );
          return (
            <>
              <header className={`flex ${headerAlign} gap-4 border-b-2 pb-3`} style={{ borderColor: accent }}>
                {photo}
                <h1 className="text-[24px] font-black tracking-tight text-slate-900">{name}</h1>
              </header>
              <div className="mt-3 flex gap-5">{layout === "sidebar-right" ? [main, aside] : [aside, main]}</div>
            </>
          );
        })()
      ) : layout === "centered" ? (
        <>
          <header className="border-b-2 pb-4 text-center" style={{ borderColor: accent }}>
            {photo ? <div className="mb-3 flex justify-center">{photo}</div> : null}
            <h1 className="text-[26px] font-black tracking-tight text-slate-900">{name}</h1>
            {nonEmpty(contactLine) ? <p className="mt-1.5 text-[11.5px] text-slate-500">{contactLine}</p> : null}
          </header>
          <div style={{ marginTop: 4 }}>{order.map((key) => renderSection(key, "main"))}</div>
        </>
      ) : (
        <>
          <header className={`flex ${headerAlign} gap-4 border-b-2 pb-3`} style={{ borderColor: accent }}>
            {photo}
            <div>
              <h1 className="text-[24px] font-black tracking-tight text-slate-900">{name}</h1>
              {nonEmpty(contactLine) ? <p className="mt-1 text-[11.5px] text-slate-500">{contactLine}</p> : null}
            </div>
          </header>
          {order.map((key) => renderSection(key, "main"))}
        </>
      )}
    </div>
  );
}

export function ResumePreview({
  content,
  design,
  highlightSection
}: {
  content: ResumeContent;
  design: ResumeDesignSettings;
  highlightSection?: SectionKey | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pages, setPages] = useState(1);

  // 컨테이너 폭에 맞춰 스케일
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const sync = () => {
      const w = el.clientWidth;
      setScale(Math.min(1, w / A4_W));
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 콘텐츠 높이 → 페이지 수
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const h = el.scrollHeight;
    setPages(Math.max(1, Math.ceil(h / A4_H)));
  });

  return (
    <div>
      {/* 페이지 정보 / 경고 */}
      <div className="mb-2 flex items-center justify-between text-[12px] text-muted-foreground">
        <span>A4 · {pages}페이지</span>
        {pages > 1 ? (
          <span className="inline-flex items-center gap-1 text-amber-700">
            <WarningCircle className="h-3.5 w-3.5" weight="fill" aria-hidden />
            현재 내용이 {pages}페이지입니다. 일부 문장을 줄이면 1페이지로 정리할 수 있어요.
          </span>
        ) : null}
      </div>

      <div ref={wrapRef} className="w-full" style={{ height: A4_H * scale * pages + (pages - 1) * 8 * scale }}>
        <div style={{ position: "relative", width: A4_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <ResumeSheet innerRef={sheetRef} content={content} design={design} highlightSection={highlightSection} />

          {/* 페이지 경계선 */}
          {Array.from({ length: pages - 1 }).map((_, i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-rose-300"
              style={{ position: "absolute", top: A4_H * (i + 1) }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
