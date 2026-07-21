"use client";

import Image from "next/image";
import Link from "next/link";
import { CaretRight, Sparkle, IdentificationCard } from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";
import type { PlatformLocale } from "../../lib/auth-messages";

// ---------------------------------------------------------------------------
// /events — Aply 이벤트 진입 허브. 다른 GNB 탭(홈/포지션 탐색 등) 과 동일한
// 사이트 표준 레이아웃 — site Header + Footer + container. 안 본문에서 saju
// /visa 등 viral 캠페인을 카드로 나열. 새 이벤트 추가는 EVENTS 배열에 entry
// 만 추가하면 됨.
// ---------------------------------------------------------------------------

type EventCopy = {
  pill: string;
  title: string;
  description: string;
  // 카드별 "가장 인기" / "신규" 같은 보조 라벨 (없으면 안 표시).
  badge?: string;
};

type EventEntry = {
  key: "saju" | "visa" | "mbti" | "sgc";
  href: string;
  // Phosphor 아이콘(ICON_BY_KEY) 또는 logoSrc 중 하나. logoSrc 가 있으면 이미지가
  // 우선되어 좌측 아이콘 슬롯을 가로형 로고로 대체 (협력/콜라보 카드용).
  logoSrc?: string;
  logoAlt?: string;
  copy: Record<PlatformLocale, EventCopy>;
};

// 이벤트별 좌측 아이콘 — 이모지 대신 Phosphor 아이콘 타일(브랜드 톤 통일).
const ICON_BY_KEY: Partial<Record<EventEntry["key"], Icon>> = {
  saju: Sparkle,
  visa: IdentificationCard
};

// 이벤트 순서 — 신규/협력 프로그램(sgc)을 최상단으로 강조, 그 다음 viral
// (saju), 그 다음 비자. MBTI 는 임시 제외 (별도 공개).
const EVENTS: EventEntry[] = [
  {
    // Seoul Global Center × Aply 협력 6주 일경험 프로그램. 별도 랜딩(/events/sgc)
    // 은 추후 추가 예정 — 현재는 카드만 노출. 신규 협력 프로그램이라
    // "신규" 배지로 우선순위 강조.
    key: "sgc",
    href: "/events/seoul-global-center",
    logoSrc: "/img_sgc_aply.webp",
    logoAlt: "Seoul Global Center × Aply",
    copy: {
      ko: {
        pill: "Seoul Global Center × Aply",
        title: "한국 기업 6주 일경험 프로그램",
        description: "외국인 유학생용 직무 경험 + 기업 적응 교육 + 그룹 코칭 + 실제 기업 매칭.",
        badge: "신규"
      },
      en: {
        pill: "Seoul Global Center × Aply",
        title: "6-Week Korea Work Experience",
        description: "Hands-on internships + onboarding training + group coaching for international students.",
        badge: "New"
      },
      "zh-CN": {
        pill: "Seoul Global Center × Aply",
        title: "6 周韩国企业实习项目",
        description: "面向在韩外国留学生：实战工作经验 + 入职培训 + 分组教练辅导。",
        badge: "新"
      },
      vi: {
        pill: "Seoul Global Center × Aply",
        title: "Chương trình thực tập 6 tuần tại Hàn",
        description: "Du học sinh quốc tế: làm việc thực tế + đào tạo + huấn luyện nhóm với công ty Hàn.",
        badge: "Mới"
      },
      ja: {
        pill: "Seoul Global Center × Aply",
        title: "韓国企業 6 週間就業体験",
        description: "留学生向け：実務経験 + 韓国企業適応研修 + 職務別グループコーチング。",
        badge: "新着"
      },
      id: {
        pill: "Seoul Global Center × Aply",
        title: "Program Magang 6 Minggu di Korea",
        description: "Mahasiswa asing: pengalaman kerja + onboarding + coaching grup di perusahaan Korea.",
        badge: "Baru"
      }
    }
  },
  {
    key: "saju",
    href: "/events/saju",
    copy: {
      ko: {
        pill: "사주 × 직업 적성",
        title: "내 사주가 말하는 미래 직업은?",
        description: "오행 사주 기반으로 어울리는 한국 직무와 매칭 공고를 한 번에.",
        badge: "가장 인기"
      },
      en: {
        pill: "Saju × Career fit",
        title: "What career does my Saju point to?",
        description: "Five-Element Saju → role fit at Korean companies + live job matches.",
        badge: "Most popular"
      },
      "zh-CN": {
        pill: "四柱 × 职业适配",
        title: "我的四柱命理预示什么职业？",
        description: "五行八字解析 + 适合的韩国岗位与匹配公告。",
        badge: "最受欢迎"
      },
      vi: {
        pill: "Tử Vi × Hợp nghề",
        title: "Tứ Trụ nói về nghề nghiệp tương lai của tôi?",
        description: "Phân tích Ngũ Hành + nghề phù hợp tại Hàn Quốc và tin tuyển dụng.",
        badge: "Phổ biến nhất"
      },
      ja: {
        pill: "四柱 × 仕事適性",
        title: "私の四柱が示す未来の仕事は？",
        description: "五行四柱で韓国企業の職務適性と求人を一度にチェック。",
        badge: "一番人気"
      },
      id: {
        pill: "Saju × Karier",
        title: "Karier apa yang ditunjukkan Saju saya?",
        description: "Analisis Lima Elemen + posisi cocok di Korea + lowongan terkait.",
        badge: "Paling populer"
      }
    }
  },
  {
    key: "visa",
    href: "/events/visa",
    copy: {
      ko: {
        pill: "한국 비자 진단",
        title: "내가 받을 수 있는 한국 비자는?",
        description: "국적·학력·한국어만 입력하면 가능한 비자 옵션과 다음 행동을 안내해드려요.",
      },
      en: {
        pill: "Korean visa check",
        title: "Which Korean work visa can I get?",
        description: "Tell us nationality, education and Korean level — see options and next steps.",
      },
      "zh-CN": {
        pill: "韩国签证诊断",
        title: "我可以申请什么韩国签证？",
        description: "填写国籍、学历、韩语水平，即时获得可行签证选项与下一步行动。",
      },
      vi: {
        pill: "Visa Hàn Quốc",
        title: "Visa làm việc Hàn Quốc nào phù hợp tôi?",
        description: "Nhập quốc tịch, học vấn, tiếng Hàn — xem các loại visa khả thi và bước tiếp theo.",
      },
      ja: {
        pill: "韓国ビザ診断",
        title: "私が取得できる韓国ビザは？",
        description: "国籍・学歴・韓国語レベルを入力するだけで取得可能なビザと次の行動を案内。",
      },
      id: {
        pill: "Visa Korea",
        title: "Visa kerja Korea apa yang bisa saya dapat?",
        description: "Masukkan kebangsaan, pendidikan, dan level Korea — lihat opsi & langkah berikutnya.",
      }
    }
  }
];

type HeaderCopy = {
  title: string;
  intro: string;
};

// 포지션 탐색 페이지와 동일하게 — 큰 단일 타이틀 + 짧은 서브타이틀. 강조용
// pill 이나 highlight 단어 구문은 제거하여 시각적 위계를 맞춤. 서브타이틀은
// 개별 이벤트(saju/visa…)를 나열하지 않고 "다양한 진단 이벤트 모음" 식으로
// 포괄적으로 — 새 이벤트가 추가돼도 카피 안 바꿔도 되도록.
const HEADER_COPY: Record<PlatformLocale, HeaderCopy> = {
  ko:    { title: "이벤트",       intro: "Aply 와 함께하는 다양한 이벤트!" },
  en:    { title: "Events",      intro: "All kinds of events with Aply!" },
  "zh-CN": { title: "活动",        intro: "和 Aply 一起，各种各样的活动！" },
  vi:    { title: "Sự kiện",     intro: "Đủ loại sự kiện cùng Aply!" },
  ja:    { title: "イベント",     intro: "Aply と一緒の、さまざまなイベント！" },
  id:    { title: "Acara",       intro: "Beragam acara bersama Aply!" }
};

export function EventsListPage() {
  const { locale } = useLanguage();
  const h = HEADER_COPY[locale] ?? HEADER_COPY.ko;

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="flex-1">
        <section className="container py-12 md:py-16">
          <div className="mx-auto max-w-4xl">
            <header className="mb-8 md:mb-10">
              {/* 포지션 탐색 페이지 H1/subtitle 과 동일한 폰트(paperlogy) + 크기. */}
              <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-black md:text-5xl`}>
                {h.title}
              </h1>
              <p className="mt-2 text-sm font-normal text-slate-600 md:text-base">
                {h.intro}
              </p>
            </header>

            {/* 이벤트 카드 세로 리스트 — 한 폭을 가득 채우는 큰 카드로 stack.
                새 이벤트 추가 시 자동으로 아래로 추가됨. */}
            <div className="flex flex-col gap-4">
              {EVENTS.map((event) => {
                const c = event.copy[locale] ?? event.copy.ko;
                const EventIcon = ICON_BY_KEY[event.key];
                return (
                  <Link
                    key={event.key}
                    href={event.href}
                    className="group block rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(11,18,39,0.04),0_10px_28px_rgba(11,18,39,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(11,18,39,0.05),0_16px_40px_rgba(11,18,39,0.10)] active:translate-y-0"
                  >
                    <article
                      className={`flex gap-4 ${
                        event.logoSrc
                          ? // 가로로 긴 협력 로고 카드 — 좁은 폭(모바일·태블릿)에선
                            // 로고가 가로를 다 먹어 텍스트가 쪼개진다. 카드 너비는
                            // max-w-4xl(896px) 로 캡되므로 좌우 배치가 확실히 편한
                            // lg(1024px↑, 카드 풀폭) 에서만 가로, 그 아래는 전부
                            // 로고-위 세로 스택.
                            "flex-col gap-3 lg:flex-row lg:items-center lg:gap-4"
                          : "items-center"
                      }`}
                    >
                      {/* 좌측 아이콘 슬롯 — 기본은 11×11 정사각 이모지 박스.
                          협력/콜라보 카드는 가로형 로고 이미지(logoSrc)로
                          대체. lg 미만에선 카드 상단에 좌측 정렬로 올라간다. */}
                      {event.logoSrc ? (
                        <div className="relative h-14 w-[240px] shrink-0 sm:h-16 sm:w-[260px] lg:h-20 lg:w-[280px]">
                          <Image
                            src={event.logoSrc}
                            alt={event.logoAlt ?? ""}
                            fill
                            sizes="(min-width: 1024px) 280px, (min-width: 640px) 260px, 240px"
                            className="object-contain object-left"
                            priority={false}
                          />
                        </div>
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8]/[0.07] text-[#0B46E8] transition-colors group-hover:bg-[#0B46E8]/[0.12]">
                          {EventIcon ? <EventIcon className="h-6 w-6" weight="duotone" aria-hidden /> : null}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center rounded-full bg-muted/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foreground/60">
                            {c.pill}
                          </span>
                          {c.badge ? (
                            <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                              {c.badge}
                            </span>
                          ) : null}
                        </div>
                        <h2 className="mt-2 font-display text-lg font-bold leading-normal tracking-tight md:text-xl md:leading-normal">
                          {c.title}
                        </h2>
                        <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-muted-foreground md:text-sm">
                          {c.description}
                        </p>
                      </div>
                      {/* 로고 카드는 lg 미만에서 세로 스택이라 caret 을 숨기고 lg+
                          가로 배치에서만 노출(카드 전체가 탭 영역이라 무관). */}
                      <CaretRight
                        className={`h-4 w-4 shrink-0 self-center text-muted-foreground transition group-hover:text-primary ${
                          event.logoSrc ? "hidden lg:block" : ""
                        }`}
                        weight="bold"
                      />
                    </article>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
