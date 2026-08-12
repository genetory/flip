import Link from "next/link";
import {
  heroContent,
  heroPreview,
  concernSection,
  outcomeSection,
  stepSection,
  beforeAfterSection,
  resultPreviewSection,
  jobsCtaSection,
  finalCtaSection
} from "../../lib/talent/landing-content";
import { Reveal } from "../site/Reveal";
import { TalentButton } from "./TalentButton";
import { TalentSectionHeader } from "./TalentSectionHeader";
import { TalentHeader } from "./TalentHeader";
import { AplyFooter } from "../AplyFooter";
import { usePlatformT } from "../../lib/i18n";

// Talent 랜딩(= 홈) — 공개. 로그인/역할 가드 없음.
// 디자인: toss.im 계열. 거대한 타이포 + 넉넉한 여백 + 한 섹션 한 메시지 + 솔리드 블루 풀블리드.
// 애니메이션: 스크롤 진입 시 fade + 상승(Reveal), 카드마다 시차. motion-reduce 는 자동 비활성.

const stateStyle: Record<"done" | "doing" | "todo", { dot: string; text: string }> = {
  done: { dot: "bg-[#B7FF5A]", text: "text-[#191F28]" },
  doing: { dot: "bg-[#0B46E8]", text: "text-[#191F28] font-semibold" },
  todo: { dot: "bg-[#E5E8EB]", text: "text-[#B0B8C1]" }
};

export function TalentLandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TalentHeader />
      <main className="flex-1">
        <Hero />
        <ConcernSection />
        <OutcomeSection />
        <StepSection />
        <BeforeAfterSection />
        <ResultPreviewSection />
        <JobsSection />
        <FinalCta />
      </main>
      <AplyFooter />
    </div>
  );
}

/* 1. 히어로 — 중앙 정렬, 거대한 타이포 */
function Hero() {
  const t = usePlatformT();
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-3xl px-5 pb-4 pt-14 text-center md:pt-20">
        <Reveal>
          <span className="inline-flex items-center rounded-full bg-[#F2F4F6] px-4 py-2 text-[13.5px] font-bold text-[#4E5968]">
            {t("첫 취업을 준비하는 나를 위한 서비스", "A service for your first job search", "为你的第一份工作而生的服务", "Dịch vụ cho lần xin việc đầu tiên", "初めての就活のためのサービス", "Layanan untuk pencarian kerja pertama Anda")}
          </span>
        </Reveal>
        <Reveal delayMs={80}>
          <h1 className="mt-8 text-[34px] font-black leading-[1.12] tracking-[-0.04em] text-[#0B1227] md:text-[52px]">
            {heroContent.titleLines.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
          </h1>
        </Reveal>
        <Reveal delayMs={160}>
          <p className="mx-auto mt-7 max-w-lg whitespace-pre-line break-keep text-[17px] leading-[1.6] text-[#4E5968] md:text-[20px]">
            {heroContent.description}
          </p>
        </Reveal>
        <Reveal delayMs={240}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <TalentButton href={heroContent.primaryCta.href} variant="primary" size="lg" aria-label={heroContent.primaryCta.label}>
              {heroContent.primaryCta.label}
            </TalentButton>
          </div>
          <p className="mt-5 text-[14px] text-[#8B95A1]">{heroContent.subInfo}</p>
        </Reveal>
      </div>

      {/* 큰 중앙 미리보기 카드 */}
      <div className="mx-auto w-full max-w-md px-5 pb-12 pt-8 md:pb-16">
        <Reveal delayMs={200} y="lg">
          <ProgressPreview />
        </Reveal>
      </div>
    </section>
  );
}

function ProgressPreview() {
  const t = usePlatformT();
  return (
    <div className="rounded-3xl border border-[#EEF1F5] bg-white p-6 shadow-[0_10px_32px_rgba(11,18,39,0.07)]">
      <div className="flex items-center justify-between">
        <p className="text-[14px] font-semibold text-[#4E5968]">{heroPreview.greeting}</p>
        <span className="text-[14px] font-bold text-[#0B46E8]">{heroPreview.progress}%</span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#F2F4F6]">
        <div className="h-full rounded-full bg-[#0B46E8]" style={{ width: `${heroPreview.progress}%` }} />
      </div>
      <ul className="mt-5 flex flex-col gap-3.5">
        {heroPreview.steps.map((s) => {
          const st = stateStyle[s.state];
          return (
            <li key={s.label} className="flex items-center gap-3.5">
              <span className={`h-3 w-3 rounded-full ${st.dot}`} />
              <span className={`text-[15px] ${st.text}`}>{s.label}</span>
              {s.state === "doing" ? <span className="ml-auto text-[12.5px] font-bold text-[#0B46E8]">{t("진행 중", "In progress", "进行中", "Đang làm", "進行中", "Berlangsung")}</span> : null}
              {s.state === "done" ? <span className="ml-auto text-[12.5px] font-bold text-[#3A6B00]">{t("완료", "Done", "完成", "Hoàn tất", "完了", "Selesai")}</span> : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* 2. 학생의 고민 */
function ConcernSection() {
  return (
    <section className="bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title={concernSection.title} />
        </Reveal>
        <div className="mx-auto mt-9 grid max-w-3xl grid-cols-1 gap-3.5 sm:grid-cols-2">
          {concernSection.cards.map((c, i) => (
            <Reveal key={c} delayMs={i * 80}>
              <div className="h-full rounded-2xl border border-[#EEF1F5] bg-white px-7 py-6 text-[16px] leading-relaxed text-[#4E5968]">“{c}”</div>
            </Reveal>
          ))}
        </div>
        <Reveal delayMs={120}>
          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="whitespace-pre-line break-keep text-[24px] font-black leading-[1.4] tracking-[-0.03em] text-[#0B1227] md:text-[34px]">
              {concernSection.solutionTitle}
            </p>
            <p className="mx-auto mt-6 max-w-xl whitespace-pre-line break-keep text-[16px] leading-[1.7] text-[#4E5968] md:text-[18px]">
              {concernSection.solutionDesc}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 3. 완성할 수 있는 것 */
function OutcomeSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title={outcomeSection.title} />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {outcomeSection.cards.map((card, i) => (
            <Reveal key={card.title} delayMs={(i % 3) * 90}>
              <div className="h-full rounded-3xl border border-[#EEF1F5] bg-white p-6">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[28px]" aria-hidden>
                  {card.icon}
                </span>
                <p className="mt-6 text-[19px] font-bold text-[#191F28]">{card.title}</p>
                <p className="mt-2.5 break-keep text-[15px] leading-[1.6] text-[#4E5968]">{card.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 4. 이용 방법 */
function StepSection() {
  return (
    <section className="bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title={stepSection.title} />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
          {stepSection.steps.map((s, i) => (
            <Reveal key={s.no} delayMs={i * 90}>
              <div className="h-full rounded-3xl border border-[#EEF1F5] bg-white p-6">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B46E8] text-[18px] font-black text-white">
                  {s.no}
                </span>
                <p className="mt-6 text-[19px] font-bold text-[#191F28]">{s.title}</p>
                <p className="mt-2.5 break-keep text-[15px] leading-[1.6] text-[#4E5968]">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* 5. 경험 변환 Before / After — 핵심 차별점 */
function BeforeAfterSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-4xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader eyebrow={beforeAfterSection.eyebrow} title={beforeAfterSection.title} />
        </Reveal>
        <div className="mt-10 grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
          <Reveal>
            <div className="rounded-3xl border border-[#EEF1F5] bg-[#FAFBFC] p-6">
              <p className="text-[13.5px] font-bold text-[#8B95A1]">{beforeAfterSection.beforeLabel}</p>
              <p className="mt-4 whitespace-pre-line break-keep text-[16px] leading-[1.7] text-[#8B95A1]">{beforeAfterSection.before}</p>
            </div>
          </Reveal>
          <Reveal delayMs={120}>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0B46E8] text-[20px] font-black text-white md:h-14 md:w-14" aria-hidden>
              →
            </div>
          </Reveal>
          <Reveal delayMs={220}>
            <div className="rounded-3xl border border-[#0B46E8]/15 bg-white p-8 shadow-[0_8px_30px_rgba(11,70,232,0.08)]">
              <p className="text-[13.5px] font-bold text-[#0B46E8]">{beforeAfterSection.afterLabel}</p>
              <p className="mt-4 whitespace-pre-line break-keep text-[16px] font-medium leading-[1.7] text-[#191F28]">{beforeAfterSection.after}</p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* 6. 결과 미리보기 */
function ResultPreviewSection() {
  return (
    <section className="bg-[#FAFBFC]">
      <div className="mx-auto w-full max-w-3xl px-5 py-14 md:py-20">
        <Reveal>
          <TalentSectionHeader title={resultPreviewSection.title} />
        </Reveal>
        <Reveal delayMs={100}>
          <div className="mt-14 divide-y divide-[#F2F4F6] overflow-hidden rounded-3xl border border-[#EEF1F5] bg-white">
            {resultPreviewSection.items.map((item) => (
              <div key={item.label} className="flex items-center gap-4 px-7 py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[20px]" aria-hidden>{item.icon}</span>
                <span className="text-[16px] text-[#4E5968]">{item.label}</span>
                <span className="ml-auto text-[17px] font-bold text-[#191F28]">{item.value}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 7. 공고 */
function JobsSection() {
  return <SplitCta data={jobsCtaSection} tone="blue" />;
}
function SplitCta({ data, tone }: { data: { message: string; desc: string; cta: { label: string; href: string } }; tone: "blue" | "lime" }) {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-5xl px-5 py-8 md:py-10">
        <Reveal y="lg">
          <div className="flex flex-col items-start gap-8 rounded-[32px] border border-[#EEF1F5] bg-[#FAFBFC] px-6 py-9 md:flex-row md:items-center md:justify-between md:px-12">
            <div>
              <p className="text-[24px] font-black tracking-[-0.03em] text-[#0B1227] md:text-[30px]">{data.message}</p>
              <p className="mt-4 whitespace-pre-line break-keep text-[16px] leading-[1.7] text-[#4E5968] md:text-[17px]">{data.desc}</p>
            </div>
            <TalentButton href={data.cta.href} variant={tone === "lime" ? "lime" : "primary"} size="lg" aria-label={data.cta.label}>
              {data.cta.label}
            </TalentButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* 9. 마지막 CTA — 솔리드 블루 풀블리드 */
function FinalCta() {
  return (
    <section className="bg-[#0B46E8]">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 text-center md:py-24">
        <Reveal y="lg">
          <p className="whitespace-pre-line text-[30px] font-black leading-[1.25] tracking-[-0.035em] text-white md:text-[46px]">
            {finalCtaSection.message}
          </p>
          <p className="mx-auto mt-6 max-w-md break-keep text-[16px] leading-[1.65] text-white/75 md:text-[18px]">{finalCtaSection.desc}</p>
          <div className="mt-10 flex justify-center">
            <Link
              href={finalCtaSection.cta.href}
              aria-label={finalCtaSection.cta.label}
              className="inline-flex h-[56px] items-center justify-center rounded-xl bg-white px-8 text-[16px] font-bold text-[#0B46E8] transition hover:bg-[#F2F4F6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B46E8]"
            >
              {finalCtaSection.cta.label}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
