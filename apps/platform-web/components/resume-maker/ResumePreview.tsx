"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { WarningCircle } from "@phosphor-icons/react/dist/ssr";
import type { ResumeContent } from "../../lib/member-profile-client";
import { RESUME_SECTION_KEYS, RESUME_VISA_OPTIONS, TEMPLATE_SECTION_ORDER, type ResumeDesignSettings, type ResumeSectionKey } from "../../lib/resume-maker-types";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";

// A4 = 210×297mm. 96dpi 기준 794×1123px 로 고정 렌더하고, 컨테이너 폭에 맞춰
// transform scale 로 축소한다. 페이지 수는 실제 콘텐츠 높이 / 1123 으로 추정.
const A4_W = 794;
const A4_H = 1123;

type SectionKey = ResumeSectionKey;

// 섹션 렌더 순서 — 사용자가 정한 sectionOrder 우선, 없으면 템플릿 순서.
// 빠진 키가 있으면 끝에 보충해 모든 섹션이 누락 없이 후보가 되도록 한다.
function resolveOrder(design: ResumeDesignSettings): SectionKey[] {
  const base = design.sectionOrder?.length ? design.sectionOrder : TEMPLATE_SECTION_ORDER[design.templateId] ?? TEMPLATE_SECTION_ORDER.basic;
  return [...base, ...RESUME_SECTION_KEYS.filter((k) => !base.includes(k))];
}

function period(start?: string, end?: string, present = "현재"): string {
  if (!start && !end) return "";
  return `${start ?? ""}${start || end ? " ~ " : ""}${end || (start ? present : "")}`.trim();
}

function nonEmpty(v?: string | null): v is string {
  return Boolean(v && v.trim());
}

// A4 시트 본문 — 화면 미리보기(스케일)와 인쇄(PDF)에서 동일하게 재사용.
// 섹션 라벨 — 국문/영문. lang="en" 이면 영문 이력서로 라벨을 바꾼다(값/장문은 번역된
// content 를 받아서 렌더). key 는 SectionKey 와 일치한다.
const SECTION_LABELS: Record<PlatformLocale, Record<SectionKey, string>> = {
  ko: { summary: "요약", selfIntro: "자기소개", careers: "경력", activities: "활동 · 프로젝트", education: "학력", certifications: "자격 · 수상", skills: "스킬", languages: "어학", links: "링크" },
  en: { summary: "Summary", selfIntro: "About Me", careers: "Experience", activities: "Activities & Projects", education: "Education", certifications: "Certifications & Awards", skills: "Skills", languages: "Languages", links: "Links" },
  "zh-CN": { summary: "摘要", selfIntro: "自我介绍", careers: "工作经历", activities: "活动与项目", education: "学历", certifications: "资格与获奖", skills: "技能", languages: "语言", links: "链接" },
  vi: { summary: "Tóm tắt", selfIntro: "Giới thiệu", careers: "Kinh nghiệm", activities: "Hoạt động & Dự án", education: "Học vấn", certifications: "Chứng chỉ & Giải thưởng", skills: "Kỹ năng", languages: "Ngoại ngữ", links: "Liên kết" },
  ja: { summary: "要約", selfIntro: "自己紹介", careers: "職務経歴", activities: "活動・プロジェクト", education: "学歴", certifications: "資格・受賞", skills: "スキル", languages: "語学", links: "リンク" },
  id: { summary: "Ringkasan", selfIntro: "Tentang Saya", careers: "Pengalaman", activities: "Aktivitas & Proyek", education: "Pendidikan", certifications: "Sertifikat & Penghargaan", skills: "Keterampilan", languages: "Bahasa", links: "Tautan" }
};

// 미리보기 크롬(이름 자리표시·비자 접두어·기간 '현재'·페이지 안내) — 6개 언어.
const CHROME: Record<PlatformLocale, { name: string; visa: string; present: string; a4: (n: number) => string; pageWarn: (n: number) => string }> = {
  ko: { name: "이름", visa: "비자", present: "현재", a4: (n) => `A4 · ${n}페이지`, pageWarn: (n) => `현재 내용이 ${n}페이지입니다. 일부 문장을 줄이면 1페이지로 정리할 수 있어요.` },
  en: { name: "Name", visa: "Visa", present: "Present", a4: (n) => `A4 · ${n} page${n > 1 ? "s" : ""}`, pageWarn: (n) => `Your content is ${n} pages. Trimming some lines can fit it on 1 page.` },
  "zh-CN": { name: "姓名", visa: "签证", present: "至今", a4: (n) => `A4 · ${n}页`, pageWarn: (n) => `当前内容有 ${n} 页。精简部分语句可整理为 1 页。` },
  vi: { name: "Tên", visa: "Visa", present: "Hiện tại", a4: (n) => `A4 · ${n} trang`, pageWarn: (n) => `Nội dung hiện dài ${n} trang. Rút gọn một số câu có thể gói gọn trong 1 trang.` },
  ja: { name: "氏名", visa: "ビザ", present: "現在", a4: (n) => `A4 · ${n}ページ`, pageWarn: (n) => `現在の内容は${n}ページです。一部の文を減らすと1ページにまとめられます。` },
  id: { name: "Nama", visa: "Visa", present: "Sekarang", a4: (n) => `A4 · ${n} halaman`, pageWarn: (n) => `Konten Anda ${n} halaman. Memangkas beberapa kalimat bisa memuatnya dalam 1 halaman.` }
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
  lang?: PlatformLocale;
}) {
  const accent = design.accentColor || "#0B46E8";
  const baseFont = 13.5 * design.fontScale;
  const order = resolveOrder(design);
  const layout = design.layout ?? "modern";
  const labels = SECTION_LABELS[lang] ?? SECTION_LABELS.en;
  const chrome = CHROME[lang] ?? CHROME.en;
  const name = content.basicName || chrome.name;
  const visaLabel = content.basicVisa
    ? `${chrome.visa} ${RESUME_VISA_OPTIONS.find((o) => o.value === content.basicVisa)?.label ?? content.basicVisa}`
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
                  <span className="shrink-0 text-[11px] text-slate-400">{period(c.startDate, c.endDate, chrome.present)}</span>
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
                  <span className="shrink-0 text-[11px] text-slate-400">{period(a.startDate, a.endDate, chrome.present)}</span>
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
                <span className="shrink-0 text-[11px] text-slate-400">{period(e.startDate ?? undefined, e.endDate ?? undefined, chrome.present)}</span>
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
                <p className="min-w-0 break-all text-slate-800">{nonEmpty(l.label) ? l.label : l.url}</p>
                {nonEmpty(l.label) ? (
                  <span className="shrink-0 truncate text-[11px] text-slate-400" style={{ maxWidth: "55%" }}>
                    {l.url}
                  </span>
                ) : null}
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

// 블록(헤더·섹션) 경계에서 페이지를 나눈다. 한 블록이 현재 페이지에 다 안 들어가면
// 통째로 다음 페이지로 밀어(앞 페이지 아래는 여백), 블록이 중간에서 잘리지 않게 한다.
// 반환: 각 페이지 시작 y(px, 원본 스케일 기준) 배열 + 전체 높이.
export function computePageBreaks(root: HTMLElement, pageH: number): { starts: number[]; total: number } {
  const total = root.scrollHeight;
  const rootTop = root.getBoundingClientRect().top;
  // 헤더·섹션을 블록으로 본다(중첩 섹션 없음). 세로 위치(top) 기준 정렬해 2단
  // 레이아웃에서도 위→아래 순으로 페이지를 나눈다.
  const blocks = Array.from(root.querySelectorAll<HTMLElement>("header, section"))
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top - rootTop, bottom: r.top - rootTop + r.height };
    })
    .sort((a, b) => a.top - b.top);
  const starts = [0];
  let pageTop = 0;
  for (const b of blocks) {
    // 현재 페이지(pageTop~pageTop+pageH)에 이 블록의 끝이 안 들어가면 다음 페이지로.
    if (b.bottom - pageTop > pageH && b.top > pageTop + 1) {
      pageTop = b.top;
      starts.push(pageTop);
    }
  }
  return { starts, total };
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
  const { locale } = useLanguage();
  const chrome = CHROME[locale] ?? CHROME.en;
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [starts, setStarts] = useState<number[]>([0]);
  const [contentH, setContentH] = useState(A4_H);
  const pages = starts.length;

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

  // 콘텐츠 → 블록 경계 페이지 분할. 값이 같으면 참조를 유지해 무한 리렌더를 막는다.
  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const { starts: s, total } = computePageBreaks(el, A4_H);
    setStarts((prev) => (prev.length === s.length && prev.every((v, i) => v === s[i]) ? prev : s));
    setContentH(total);
  });

  return (
    <div>
      {/* 페이지 정보 / 경고 */}
      <div className="mb-2 flex items-center justify-between text-[12px] text-muted-foreground">
        <span>{chrome.a4(pages)}</span>
        {pages > 1 ? (
          <span className="inline-flex items-center gap-1 text-amber-700">
            <WarningCircle className="h-3.5 w-3.5" weight="fill" aria-hidden />
            {chrome.pageWarn(pages)}
          </span>
        ) : null}
      </div>

      {/* 높이 측정·블록 위치 계산용 숨김 시트 */}
      <div aria-hidden className="pointer-events-none absolute -left-[99999px] top-0" style={{ width: A4_W, visibility: "hidden" }}>
        <ResumeSheet innerRef={sheetRef} content={content} design={design} highlightSection={highlightSection} lang={locale} />
      </div>

      {/* 페이지가 넘어가면 실제 A4 페이지처럼 분리해서 보여준다(각 카드가 한 페이지). */}
      <div ref={wrapRef} className="w-full space-y-2">
        {starts.map((startPx, i) => {
          const endPx = i < starts.length - 1 ? starts[i + 1] : contentH;
          const windowH = endPx - startPx;
          return (
            <div
              key={i}
              className="relative overflow-hidden bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06),0_8px_24px_-8px_rgba(0,0,0,0.12)]"
              style={{ width: A4_W * scale, height: A4_H * scale }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -(startPx * scale),
                  width: A4_W,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left"
                }}
              >
                <ResumeSheet content={content} design={design} highlightSection={highlightSection} lang={locale} />
              </div>
              {/* 다음 블록이 밀려 생긴 아래 여백을 흰색으로 덮어 잘린 블록이 안 보이게 */}
              {windowH < A4_H ? (
                <div className="absolute left-0 right-0 bg-white" style={{ top: windowH * scale, bottom: 0 }} />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
