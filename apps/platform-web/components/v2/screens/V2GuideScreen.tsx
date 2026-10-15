"use client";

// v2 취업 가이드 — 읽고 싶게: 맨 위 추천 글(큰 색 카드) · 분류 칩(전체·직무·지원 노하우·면접·비자) ·
// 나에게 맞는 글(관심 직무로, 없으면 처음 시작용) · 분류마다 옆으로 넘기는 색 카드(읽는 시간·항목 수·읽음) ·
// 비자 경로 그림(D-2 → D-10 → E-7) · 넘겨 보는 한 줄 팁. 글은 v2 읽기 화면(/v2/guide/[slug])으로 연다. 게스트도 본다.
// 외국인(국적 또는 한국어가 아닌 화면 언어)이면 비자를 위로 올린다. 읽음 표시는 이 브라우저에만 기억.
import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { V2Shell } from "../V2Shell";
import { Chip, Masthead, Page, Row, Section } from "../ui";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { jobVisas } from "../../../lib/talent/insights-content";
import { homeTips } from "../../../lib/talent/home-content";
import { VISA_DETAILS } from "../../../lib/visa-details";
import { kstDay } from "../../../lib/talent/interview-daily";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { isForeignNationality } from "../../../lib/nationality";
import { GUIDE_TONE, guideCatLabel, personalGuides, v2Guides, type GuideCat, type V2Guide } from "../../../lib/talent/v2-guides";

type Filter = "all" | GuideCat | "visa";
const CATS: GuideCat[] = ["jobs", "apply", "interview"];

// 읽음 표시 — 저장값(문자열)을 그대로 스냅샷으로 써서 서버·첫 렌더는 '없음'으로 맞춘다.
const READ_KEY = "aply.v2.guide.read";
const subscribeRead = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};
const readSnapshot = () => {
  try {
    return window.localStorage.getItem(READ_KEY) ?? "[]";
  } catch {
    return "[]";
  }
};

export function V2GuideScreen() {
  return (
    <V2Shell>
      <Guide />
    </V2Shell>
  );
}

function Guide() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { user } = useAuthSession();
  const interests = useJobInterests();
  const [filter, setFilter] = useState<Filter>("all");
  const guides = v2Guides(t);
  const [today] = useState(() => kstDay());
  const readRaw = useSyncExternalStore(subscribeRead, readSnapshot, () => "[]");
  const read = useMemo(() => {
    try {
      const v = JSON.parse(readRaw);
      return new Set<string>(Array.isArray(v) ? v : []);
    } catch {
      return new Set<string>();
    }
  }, [readRaw]);
  const foreigner = isForeignNationality(user?.nationality) === true || locale !== "ko";
  // 추천 글 — 날마다 하나씩 돌아가며(같은 날엔 같은 글).
  const featured = guides[[...today].reduce((h, c) => h + c.charCodeAt(0), 0) % guides.length];
  const mine = personalGuides(guides, interests);
  const filters: [Filter, string][] = [
    ["all", t("전체", "All", "全部", "Tất cả", "すべて", "Semua")],
    ...CATS.map((c) => [c, guideCatLabel(t, c)] as [Filter, string]),
    ["visa", t("비자", "Visa", "签证", "Visa", "ビザ", "Visa")]
  ];
  const readCount = guides.filter((g) => read.has(g.slug)).length;

  return (
    <Page>
      {/* 머리말 + 그림 — 휴대폰은 아래 가운데, 넓은 화면은 오른쪽 */}
      <div className="relative">
        <div className="md:pr-[230px]">
          <Masthead
            eyebrow={t("취업 가이드", "Career guide", "求职指南", "Hướng dẫn", "就活ガイド", "Panduan karier")}
            title={t("첫 취업, 이것부터 알아 두세요", "Your first job: start here", "第一次求职，先了解这些", "Việc làm đầu tiên: bắt đầu từ đây", "はじめての就職、まずはこれを", "Kerja pertama: mulai dari sini")}
            lede={
              readCount
                ? t(`글 ${guides.length}개 중 ${readCount}개를 읽었어요.`, `You've read ${readCount} of ${guides.length}.`, `${guides.length} 篇中已读 ${readCount} 篇。`, `Đã đọc ${readCount}/${guides.length} bài.`, `${guides.length}本中${readCount}本読みました。`, `Sudah baca ${readCount} dari ${guides.length}.`)
                : t(`직무·지원 노하우·면접·비자까지 글 ${guides.length}개를 정리했어요.`, `${guides.length} reads on roles, applying, interviews and visas.`, `整理了职位、求职技巧、面试、签证等 ${guides.length} 篇文章。`, `${guides.length} bài về nghề, ứng tuyển, phỏng vấn và visa.`, `職種・応募のコツ・面接・ビザまで${guides.length}本をまとめました。`, `${guides.length} bacaan tentang peran, melamar, wawancara, visa.`)
            }
          />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- 취업 가이드 그림(흰 바탕 → 곱하기 합성) */}
        <img src="/img_guide_0.webp" alt="" aria-hidden className="mx-auto -mt-4 mb-4 h-[170px] w-[170px] object-contain mix-blend-multiply md:absolute md:right-5 md:top-4 md:m-0 md:h-[200px] md:w-[200px]" style={{ maskImage: "radial-gradient(closest-side, #000 74%, transparent 100%)", WebkitMaskImage: "radial-gradient(closest-side, #000 74%, transparent 100%)" }} />
      </div>

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
            <Link href={`/talent/insights/${featured.slug}`} className={`block rounded-3xl p-6 transition hover:-translate-y-0.5 ${GUIDE_TONE[featured.cat].bg}`}>
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
                <span className="text-[13px] font-semibold text-[color:var(--v2-muted)]">{read.has(featured.slug) ? `✓ ${t("읽음", "Read", "已读", "Đã đọc", "既読", "Dibaca")}` : readLabel(t, featured)}</span>
                <span className="inline-flex h-9 items-center rounded-lg bg-white px-3.5 text-[14px] font-semibold text-[color:var(--v2-ink)]">{t("읽어 보기", "Read", "阅读", "Đọc", "読む", "Baca")} ›</span>
              </span>
            </Link>
          </div>

          {/* 나에게 맞는 글 */}
          <Section title={mine.personal ? t("나에게 맞는 글", "Picked for you", "为你推荐", "Dành cho bạn", "あなたへのおすすめ", "Untukmu") : t("처음이라면 이 글부터", "New here? Start with these", "第一次？从这些开始", "Mới bắt đầu? Đọc trước", "はじめてならこれから", "Baru? Mulai dari ini")}>
            <Carousel t={t} items={mine.items} read={read} />
          </Section>

          {foreigner ? <VisaSection t={t} /> : null}

          {CATS.map((c) => {
            const list = guides.filter((g) => g.cat === c);
            const n = list.filter((g) => read.has(g.slug)).length;
            return (
              <Section
                key={c}
                title={guideCatLabel(t, c)}
                aside={
                  <span className="flex items-center gap-3">
                    {n ? <span className="text-[13px] font-semibold text-[color:var(--v2-good)]">{t(`${list.length}개 중 ${n}개 읽음`, `${n}/${list.length} read`, `已读 ${n}/${list.length}`, `Đã đọc ${n}/${list.length}`, `${n}/${list.length} 既読`, `${n}/${list.length} dibaca`)}</span> : null}
                    <button type="button" onClick={() => setFilter(c)} className="text-[14px] font-semibold text-[color:var(--v2-muted)] hover:text-[color:var(--v2-ink-3)]">
                      {t("모두 보기", "See all", "全部", "Xem tất cả", "すべて", "Semua")}
                    </button>
                  </span>
                }
              >
                <Carousel t={t} items={list} read={read} />
              </Section>
            );
          })}
          {!foreigner ? <VisaSection t={t} /> : null}
          <TipsSection t={t} />
        </>
      ) : filter === "visa" ? (
        <VisaSection t={t} band={false} />
      ) : (
        <div className="grid grid-cols-1 gap-3 px-5 pb-8 min-[400px]:grid-cols-2">
          {guides
            .filter((g) => g.cat === filter)
            .map((g) => (
              <GuideCard key={g.slug} t={t} g={g} read={read.has(g.slug)} />
            ))}
        </div>
      )}
    </Page>
  );
}

function readLabel(t: PlatformT, g: V2Guide): string {
  return t(`${g.minutes}분이면 읽어요 · ${g.guide.body.length}개 항목`, `${g.minutes} min read · ${g.guide.body.length} parts`, `${g.minutes} 分钟读完 · ${g.guide.body.length} 部分`, `${g.minutes} phút · ${g.guide.body.length} phần`, `${g.minutes}分で読めます · ${g.guide.body.length}項目`, `${g.minutes} menit · ${g.guide.body.length} bagian`);
}

function Carousel({ t, items, read }: { t: PlatformT; items: V2Guide[]; read: Set<string> }) {
  return (
    <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
      {items.map((g) => (
        <GuideCard key={g.slug} t={t} g={g} read={read.has(g.slug)} className="w-[220px] shrink-0 snap-start md:w-[240px]" />
      ))}
    </div>
  );
}

/** 글 카드 — 분류 색 바탕 · 이모지 · 제목(두 줄까지) · 한 줄 설명 · 읽는 시간(읽었으면 '읽음'). */
function GuideCard({ t, g, read, className = "" }: { t: PlatformT; g: V2Guide; read: boolean; className?: string }) {
  const tone = GUIDE_TONE[g.cat];
  return (
    <Link href={`/talent/insights/${g.slug}`} className={`flex min-h-[200px] flex-col rounded-3xl p-5 transition hover:-translate-y-0.5 ${tone.bg} ${read ? "opacity-80" : ""} ${className}`}>
      <span className="flex items-start justify-between gap-2">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[22px]" aria-hidden>
          {g.guide.emoji}
        </span>
        {read ? <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[color:var(--v2-good)]">✓ {t("읽음", "Read", "已读", "Đã đọc", "既読", "Dibaca")}</span> : null}
      </span>
      <span className="mt-4 line-clamp-2 whitespace-pre-line text-[17px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{g.guide.title}</span>
      <span className="mt-1.5 line-clamp-2 text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{g.guide.desc}</span>
      <span className={`mt-auto pt-4 text-[12px] font-semibold ${tone.ink}`}>{t(`${g.minutes}분 · ${g.guide.body.length}개 항목`, `${g.minutes} min · ${g.guide.body.length} parts`, `${g.minutes} 分钟 · ${g.guide.body.length} 部分`, `${g.minutes} phút · ${g.guide.body.length} phần`, `${g.minutes}分 · ${g.guide.body.length}項目`, `${g.minutes} mnt · ${g.guide.body.length} bagian`)}</span>
    </Link>
  );
}

/** 비자 — 유학생이 가장 흔히 가는 길(D-2 → D-10 → E-7)을 선으로 잇고, 나머지 취업 가능 비자는 목록으로. */
function VisaSection({ t, band = true }: { t: PlatformT; band?: boolean }) {
  const visas = jobVisas(t);
  const path = ["D-2", "D-10", "E-7"].map((c) => visas.find((v) => v.code === c)).filter((v): v is (typeof visas)[number] => !!v);
  const stepNote = [
    t("한국 대학에서 공부하는 동안", "While studying in Korea", "在韩国读书期间", "Khi đang học", "韓国の大学在学中", "Saat kuliah"),
    t("졸업하고 일자리를 찾는 동안", "After graduating, while job hunting", "毕业后求职期间", "Sau tốt nghiệp, đang tìm việc", "卒業後、仕事探しの間", "Setelah lulus, mencari kerja"),
    t("전문 분야 회사에 취업하면", "Once hired in a professional field", "在专业领域就业后", "Khi được tuyển vào ngành chuyên môn", "専門分野で就職すると", "Saat diterima di bidang profesional")
  ];
  const others = visas.filter((v) => !["D-2", "D-10", "E-7"].includes(v.code));
  return (
    <Section band={band} title={t("외국인을 위한 비자", "Visas for foreigners", "外国人签证", "Visa cho người nước ngoài", "外国人のためのビザ", "Visa untuk WNA")}>
      <p className="pb-3 text-[14px] text-[color:var(--v2-muted)]">{t("유학생이 가장 많이 가는 길이에요.", "The most common path for international students.", "留学生最常走的路线。", "Con đường phổ biến nhất của du học sinh.", "留学生がいちばん多く進む道です。", "Jalur paling umum bagi pelajar internasional.")}</p>
      <ol className="relative rounded-3xl bg-[#e6f7f4] p-5">
        {path.map((v, i) => {
          const body = (
            <>
              <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#0f766e] shadow-[0_0_0_4px_#e6f7f4]">{v.code}</span>
              <span className="min-w-0 flex-1 pt-0.5">
                <span className="block text-[12px] font-semibold text-[#0f766e]">{stepNote[i]}</span>
                <span className="mt-0.5 block text-[16px] font-bold text-[color:var(--v2-ink)]">{v.label}</span>
                <span className="mt-0.5 block text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{v.desc}</span>
              </span>
              {VISA_DETAILS[v.code] ? (
                <span className="shrink-0 pt-3 text-[18px] text-[#0f766e]/60" aria-hidden>
                  ›
                </span>
              ) : null}
            </>
          );
          return (
            <li key={v.code} className="relative pb-5 last:pb-0">
              {/* 다음 단계로 잇는 선 */}
              {i < path.length - 1 ? <span className="absolute bottom-0 left-[21px] top-11 w-0.5 bg-[#0f766e]/25" aria-hidden /> : null}
              {VISA_DETAILS[v.code] ? (
                <Link href={`/talent/visa/${v.code}`} className="flex items-start gap-3 rounded-2xl transition hover:opacity-80">
                  {body}
                </Link>
              ) : (
                <div className="flex items-start gap-3">{body}</div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="pb-1 pt-6 text-[14px] font-bold text-[color:var(--v2-ink-3)]">{t("그 밖에 취업할 수 있는 비자", "Other visas that allow work", "其他可就业的签证", "Các visa khác được làm việc", "そのほか就労できるビザ", "Visa lain yang boleh bekerja")}</p>
      {others.map((v) => (
        <Row key={v.code} href={VISA_DETAILS[v.code] ? `/talent/visa/${v.code}` : undefined} lead={<span className="text-[13px] font-bold">{v.code}</span>} title={v.label} meta={v.desc} />
      ))}
      <p className="pb-2 pt-3 text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
        {t("비자 조건은 바뀔 수 있어요. 정확한 내용은 하이코리아·출입국사무소에서 확인하세요.", "Visa rules can change. Check HiKorea or the Immigration Office for details.", "签证条件可能变化，请在 HiKorea 或出入境事务所确认。", "Điều kiện visa có thể thay đổi. Hãy kiểm tra tại HiKorea hoặc Sở Xuất nhập cảnh.", "ビザの条件は変わることがあります。ハイコリア・出入国事務所でご確認ください。", "Aturan visa bisa berubah. Cek di HiKorea atau Kantor Imigrasi.")}
      </p>
    </Section>
  );
}

/** 한 줄 팁 — 옆으로 넘겨 보는 카드(한 장에 하나). */
const TIP_TONES = ["bg-[#edf1fd]", "bg-[#f3eeff]", "bg-[#e8f8f1]", "bg-[#fff4e8]", "bg-[#fff0f3]", "bg-[#e6f7f4]"];
function TipsSection({ t }: { t: PlatformT }) {
  const tips = homeTips(t);
  return (
    <Section title={t("한 줄 팁", "Quick tips", "一句话贴士", "Mẹo nhanh", "ひとことヒント", "Tips singkat")} aside={<span className="text-[13px] text-[color:var(--v2-muted)]">{t("옆으로 넘겨 보세요", "Swipe →", "左右滑动", "Vuốt →", "横にスワイプ", "Geser →")}</span>}>
      <div className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {tips.map((tip, i) => (
          <div key={tip.title} className={`flex min-h-[180px] w-[78%] max-w-[320px] shrink-0 snap-start flex-col rounded-3xl p-6 ${TIP_TONES[i % TIP_TONES.length]}`}>
            <span className="text-[13px] font-bold tabular-nums text-[color:var(--v2-muted)]">
              {i + 1} / {tips.length}
            </span>
            <p className="mt-3 text-[19px] font-bold leading-[1.45] text-[color:var(--v2-ink)]">{tip.title}</p>
            <p className="mt-2 text-[15px] leading-[1.65] text-[color:var(--v2-ink-3)]">{tip.desc}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
