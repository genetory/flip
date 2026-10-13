"use client";

// v2 취업 가이드 — 읽고 싶게: 맨 위 추천 글(큰 색 카드) · 분류 칩(전체·직무·지원 노하우·면접·비자) ·
// 분류마다 옆으로 넘기는 색 카드(읽는 시간·항목 수). 글은 v2 읽기 화면(/v2/guide/[slug])으로 연다. 게스트도 본다.
// 글은 기존 콘텐츠(insights-content·home-content)를 그대로 쓴다.
import { useState } from "react";
import Link from "next/link";
import { V2Shell } from "../V2Shell";
import { Chip, Masthead, Page, Row, Section } from "../ui";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { jobVisas } from "../../../lib/talent/insights-content";
import { homeTips } from "../../../lib/talent/home-content";
import { VISA_DETAILS } from "../../../lib/visa-details";
import { kstDay } from "../../../lib/talent/interview-daily";
import { GUIDE_TONE, guideCatLabel, v2Guides, type GuideCat, type V2Guide } from "../../../lib/talent/v2-guides";

type Filter = "all" | GuideCat | "visa";
const CATS: GuideCat[] = ["jobs", "apply", "interview"];

export function V2GuideScreen() {
  return (
    <V2Shell>
      <Guide />
    </V2Shell>
  );
}

function Guide() {
  const t = usePlatformT();
  const [filter, setFilter] = useState<Filter>("all");
  const guides = v2Guides(t);
  const [today] = useState(() => kstDay());
  // 추천 글 — 날마다 하나씩 돌아가며(같은 날엔 같은 글).
  const featured = guides[[...today].reduce((h, c) => h + c.charCodeAt(0), 0) % guides.length];
  const filters: [Filter, string][] = [
    ["all", t("전체", "All", "全部", "Tất cả", "すべて", "Semua")],
    ...CATS.map((c) => [c, guideCatLabel(t, c)] as [Filter, string]),
    ["visa", t("비자", "Visa", "签证", "Visa", "ビザ", "Visa")]
  ];

  return (
    <Page>
      <Masthead
        eyebrow={t("취업 가이드", "Career guide", "求职指南", "Hướng dẫn", "就活ガイド", "Panduan karier")}
        title={t("한국 취업, 이것부터 알아 두세요", "What to know first about working in Korea", "在韩国就业，先了解这些", "Làm việc ở Hàn Quốc, hãy biết điều này trước", "韓国での就職、まずはこれを", "Kerja di Korea, ketahui ini dulu")}
        lede={t(`직무·지원 노하우·면접·비자까지 글 ${guides.length}개를 짧게 정리했어요.`, `${guides.length} short reads on roles, applying, interviews and visas.`, `整理了职位、求职技巧、面试、签证等 ${guides.length} 篇短文。`, `${guides.length} bài ngắn về nghề, ứng tuyển, phỏng vấn và visa.`, `職種・応募のコツ・面接・ビザまで${guides.length}本を短くまとめました。`, `${guides.length} bacaan singkat tentang peran, melamar, wawancara, visa.`)}
      />

      {/* 분류 칩 */}
      <div className="-mt-2 flex gap-2 overflow-x-auto px-5 pb-6 [scrollbar-width:none]">
        {filters.map(([k, label]) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
            {label}
          </Chip>
        ))}
      </div>

      {filter === "all" ? (
        <>
          {/* 추천 글 — 큰 색 카드 */}
          <div className="px-5 pb-8">
            <Link href={`/v2/guide/${featured.slug}`} className={`block rounded-3xl p-6 transition hover:-translate-y-0.5 ${GUIDE_TONE[featured.cat].bg}`}>
              <span className="flex items-center justify-between gap-2">
                <span className={`text-[13px] font-bold ${GUIDE_TONE[featured.cat].ink}`}>
                  {t("오늘의 추천 글", "Today's pick", "今日推荐", "Bài gợi ý hôm nay", "今日のおすすめ", "Pilihan hari ini")} · {guideCatLabel(t, featured.cat)}
                </span>
                <span className="text-[36px] leading-none" aria-hidden>
                  {featured.guide.emoji}
                </span>
              </span>
              <span className="mt-3 block whitespace-pre-line text-[24px] font-bold leading-[1.35] tracking-[-0.02em] text-[color:var(--v2-ink)]">{featured.guide.title}</span>
              <span className="mt-2 block text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{featured.guide.desc}</span>
              <span className="mt-5 flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-[color:var(--v2-muted)]">{readLabel(t, featured)}</span>
                <span className="inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-[14px] font-semibold text-[color:var(--v2-ink)]">{t("읽어 보기", "Read", "阅读", "Đọc", "読む", "Baca")} ›</span>
              </span>
            </Link>
          </div>
          {CATS.map((c) => (
            <Section key={c} title={guideCatLabel(t, c)} aside={<button type="button" onClick={() => setFilter(c)} className="text-[14px] font-semibold text-[color:var(--v2-muted)] hover:text-[color:var(--v2-ink-3)]">{t("모두 보기", "See all", "全部", "Xem tất cả", "すべて", "Semua")}</button>}>
              <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
                {guides
                  .filter((g) => g.cat === c)
                  .map((g) => (
                    <GuideCard key={g.slug} t={t} g={g} className="w-[220px] shrink-0 snap-start md:w-[240px]" />
                  ))}
              </div>
            </Section>
          ))}
          <VisaSection t={t} />
          <TipsSection t={t} />
        </>
      ) : filter === "visa" ? (
        <VisaSection t={t} band={false} />
      ) : (
        <div className="grid grid-cols-1 gap-3 px-5 pb-8 min-[400px]:grid-cols-2">
          {guides
            .filter((g) => g.cat === filter)
            .map((g) => (
              <GuideCard key={g.slug} t={t} g={g} />
            ))}
        </div>
      )}
    </Page>
  );
}

function readLabel(t: PlatformT, g: V2Guide): string {
  return t(`${g.minutes}분이면 읽어요 · ${g.guide.body.length}개 항목`, `${g.minutes} min read · ${g.guide.body.length} parts`, `${g.minutes} 分钟读完 · ${g.guide.body.length} 部分`, `${g.minutes} phút · ${g.guide.body.length} phần`, `${g.minutes}分で読めます · ${g.guide.body.length}項目`, `${g.minutes} menit · ${g.guide.body.length} bagian`);
}

/** 글 카드 — 분류 색 바탕 · 이모지 · 제목(두 줄까지) · 한 줄 설명 · 읽는 시간. */
function GuideCard({ t, g, className = "" }: { t: PlatformT; g: V2Guide; className?: string }) {
  const tone = GUIDE_TONE[g.cat];
  return (
    <Link href={`/v2/guide/${g.slug}`} className={`flex min-h-[200px] flex-col rounded-3xl p-5 transition hover:-translate-y-0.5 ${tone.bg} ${className}`}>
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[22px]" aria-hidden>
        {g.guide.emoji}
      </span>
      <span className="mt-4 line-clamp-2 whitespace-pre-line text-[17px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{g.guide.title}</span>
      <span className="mt-1.5 line-clamp-2 text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{g.guide.desc}</span>
      <span className={`mt-auto pt-4 text-[12px] font-semibold ${tone.ink}`}>{t(`${g.minutes}분 · ${g.guide.body.length}개 항목`, `${g.minutes} min · ${g.guide.body.length} parts`, `${g.minutes} 分钟 · ${g.guide.body.length} 部分`, `${g.minutes} phút · ${g.guide.body.length} phần`, `${g.minutes}分 · ${g.guide.body.length}項目`, `${g.minutes} mnt · ${g.guide.body.length} bagian`)}</span>
    </Link>
  );
}

function VisaSection({ t, band = true }: { t: PlatformT; band?: boolean }) {
  return (
    <Section band={band} title={t("외국인을 위한 비자", "Visas for foreigners", "外国人签证", "Visa cho người nước ngoài", "外国人のためのビザ", "Visa untuk WNA")}>
      {jobVisas(t).map((v) => (
        <Row key={v.code} href={VISA_DETAILS[v.code] ? `/talent/visa/${v.code}` : undefined} lead={<span className="text-[13px] font-bold">{v.code}</span>} title={v.label} meta={v.desc} />
      ))}
      <p className="pb-2 pt-3 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
        {t("비자 조건은 바뀔 수 있어요. 정확한 내용은 하이코리아·출입국사무소에서 확인하세요.", "Visa rules can change. Check HiKorea or the Immigration Office for details.", "签证条件可能变化，请在 HiKorea 或出入境事务所确认。", "Điều kiện visa có thể thay đổi. Hãy kiểm tra tại HiKorea hoặc Sở Xuất nhập cảnh.", "ビザの条件は変わることがあります。ハイコリア・出入国事務所でご確認ください。", "Aturan visa bisa berubah. Cek di HiKorea atau Kantor Imigrasi.")}
      </p>
    </Section>
  );
}

function TipsSection({ t }: { t: PlatformT }) {
  return (
    <Section title={t("한 줄 팁", "Quick tips", "一句话贴士", "Mẹo nhanh", "ひとことヒント", "Tips singkat")}>
      <ul>
        {homeTips(t).map((tip) => (
          <li key={tip.title} className="border-b border-[color:var(--v2-line)] py-4 last:border-b-0">
            <p className="text-[16px] font-semibold leading-[1.5] text-[color:var(--v2-ink)]">{tip.title}</p>
            <p className="mt-1 text-[15px] leading-[1.65] text-[color:var(--v2-muted)]">{tip.desc}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
