"use client";

// 메인 랜딩의 본문 섹션들 — hero 아래로 이어진다.
// 보이는 요소는 전부 랜딩 <main> 안에 들어가고, 랜딩은 자체 푸터를 갖는다(GNB 화면이 아니다).
import Link from "next/link";
import { ArrowRight, Briefcase, CheckCircle, FileText, IdentificationCard, Microphone, ShieldCheck } from "@phosphor-icons/react";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { trackLandingSectionCta } from "../../lib/analytics";

/** 서버(app/page.tsx)에서 내려주는 공고 요약 — 개인정보 없음, 공개 공고 필드만. */
export type LandingJob = { id: string; title: string; company: string | null; location: string | null };

function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="text-center">
      <h2 className="break-keep text-[22px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[26px]">{title}</h2>
      {sub ? <p className="mx-auto mt-2 max-w-[520px] break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{sub}</p> : null}
    </div>
  );
}

/** 1) 실제 외국인 지원 가능 공고 — 서버에서 읽은 실제 데이터만 보여 준다(없으면 섹션 생략). */
function RealJobs({ t, jobs }: { t: PlatformT; jobs: LandingJob[] }) {
  if (jobs.length === 0) return null;
  return (
    <section className="mt-16">
      <SectionTitle
        title={t("지금 지원할 수 있는 공고", "Jobs open right now")}
        sub={t("외국인 채용이 가능한 공고예요. 비자 조건은 공고마다 확인이 필요해요.", "Roles open to international applicants. Visa conditions vary by posting.")}
      />
      <ul className="mx-auto mt-5 flex max-w-[640px] flex-col gap-2">
        {jobs.map((j) => (
          <li key={j.id}>
            <Link
              href={`/talent/jobs/${j.id}`}
              onClick={() => trackLandingSectionCta("real_jobs")}
              className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white px-4 py-3.5 transition hover:border-[#0B46E8]/30 hover:bg-[#F5F8FF]"
            >
              <Briefcase className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold text-[#0B1227]">{j.title}</span>
                <span className="mt-0.5 block truncate text-[12.5px] text-[#8B95A1]">
                  {[j.company, j.location].filter(Boolean).join(" · ") || t("회사 정보 확인 필요", "Company details to confirm")}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#B0B8C1]" weight="bold" />
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center">
        <Link href="/talent/jobs" onClick={() => trackLandingSectionCta("all_jobs")} className="text-[13.5px] font-bold text-[#0B46E8] hover:underline">
          {t("전체 채용공고 보기", "See all jobs")}
        </Link>
      </div>
    </section>
  );
}

/** 2) 비자별 취업 가이드 — 실제로 발행된 코드만 링크한다. */
function VisaGuides({ t, codes }: { t: PlatformT; codes: string[] }) {
  if (codes.length === 0) return null;
  return (
    <section className="mt-16">
      <SectionTitle
        title={t("비자별 취업 가이드", "Job guides by visa")}
        sub={t("내 체류 자격으로 무엇을 할 수 있는지부터 확인하세요.", "Start with what your visa allows.")}
      />
      <ul className="mx-auto mt-5 flex max-w-[560px] flex-wrap justify-center gap-1.5">
        {codes.map((code) => (
          <li key={code}>
            <Link
              href={`/talent/visa/${encodeURIComponent(code)}`}
              onClick={() => trackLandingSectionCta("visa_guide")}
              className="inline-flex items-center rounded-full border border-[#E5E8EB] bg-white px-3.5 py-1.5 text-[13px] font-bold text-[#333D4B] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
            >
              {code}
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center">
        <Link href="/talent/visa" onClick={() => trackLandingSectionCta("visa_all")} className="text-[13.5px] font-bold text-[#0B46E8] hover:underline">
          {t("비자 안내 전체 보기", "All visa guides")}
        </Link>
      </div>
    </section>
  );
}

/** 3) 한국 취업 준비 도구 */
function Tools({ t }: { t: PlatformT }) {
  const items = [
    {
      icon: FileText,
      title: t("한국식 이력서·자기소개서", "Korean resume & cover letter"),
      desc: t("내 경험을 한국 기업이 보는 형식으로 정리해요.", "Shape your experience into the format Korean employers expect.")
    },
    {
      icon: Microphone,
      title: t("공고 기반 모의면접", "Mock interview from a job post"),
      desc: t("지원할 공고 내용으로 예상 질문을 연습해요.", "Practice questions drawn from the posting you're applying to.")
    },
    {
      icon: IdentificationCard,
      title: t("비자·직무 맞춤 탐색", "Visa-aware job search"),
      desc: t("체류 자격에 맞는 공고부터 좁혀 봐요.", "Narrow down to roles your visa allows.")
    }
  ];
  return (
    <section className="mt-16">
      <SectionTitle title={t("한국 취업 준비, 한 곳에서", "Everything for a Korean job search")} />
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
              <Icon className="h-5 w-5 text-[#0B46E8]" weight="fill" />
              <p className="mt-3 break-keep text-[15px] font-black text-[#0B1227]">{it.title}</p>
              <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{it.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** 4) Career Launch 소개 + 5) 진행 방법 */
function CareerLaunch({ t }: { t: PlatformT }) {
  const weeks = [
    t("1주차 · 강점과 목표 직무 찾기", "Week 1 · Find your strengths and target roles"),
    t("2주차 · 이력서·자기소개서 완성", "Week 2 · Finish your resume and cover letter"),
    t("3주차 · 실전 모의면접", "Week 3 · Real mock interviews"),
    t("4주차 · 약점 보완과 최종 점검", "Week 4 · Fix weak spots and final check")
  ];
  return (
    <section className="mt-16 rounded-3xl border border-[#E7EDFB] bg-[#F5F8FF] p-6 md:p-8">
      <SectionTitle
        title={t("4주 프로그램, Career Launch", "Career Launch — a 4-week program")}
        sub={t("혼자 막막하면 순서대로 따라가요. AI 코치가 매주 과제를 챙기고, 운영진이 직접 질문에 답해요.", "If you don't know where to start, follow the weekly plan. An AI coach guides you and our team answers your questions.")}
      />
      <ol className="mx-auto mt-5 flex max-w-[520px] flex-col gap-2">
        {weeks.map((w) => (
          <li key={w} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-[#333D4B]">
            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" />
            <span className="break-keep">{w}</span>
          </li>
        ))}
      </ol>
      <div className="mt-6 text-center">
        <Link
          href="/career-launch"
          onClick={() => trackLandingSectionCta("career_launch")}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
        >
          {t("Career Launch 알아보기", "Learn about Career Launch")}
        </Link>
      </div>
    </section>
  );
}

/** 6) 신뢰 기준 — 보장하지 않는 것을 분명히 적는다. */
function Trust({ t }: { t: PlatformT }) {
  const items = [
    t("공고의 외국인 지원 가능 여부는 원문과 기업 정보를 근거로 표시해요.", "We label foreign-applicant eligibility based on the original posting and company info."),
    t("비자·체류 요건은 개인 상황과 출입국 판단에 따라 달라져요.", "Visa requirements depend on your situation and immigration review."),
    t("APLY 는 합격이나 비자 발급을 보장하지 않아요.", "Aply does not guarantee a job offer or a visa.")
  ];
  return (
    <section className="mt-16">
      <SectionTitle title={t("우리가 지키는 기준", "What we hold ourselves to")} />
      <ul className="mx-auto mt-5 flex max-w-[560px] flex-col gap-2">
        {items.map((x) => (
          <li key={x} className="flex items-start gap-2 text-[13px] leading-relaxed text-[#4E5968]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#0A9B59]" weight="fill" />
            <span className="break-keep">{x}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** 7) 구직자·기업 CTA — 기업은 같은 비중의 대형 카드가 아니라 보조 줄로 둔다. */
function FinalCta({ t }: { t: PlatformT }) {
  return (
    <section className="mt-16 border-t border-[#EEF1F5] pt-10 text-center">
      <p className="break-keep text-[18px] font-black text-[#0B1227]">{t("지금 내 조건으로 시작해 보세요", "Start with what you have today")}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/talent/signup"
          onClick={() => trackLandingSectionCta("signup")}
          className="inline-flex h-12 items-center justify-center rounded-xl bg-[#0B46E8] px-6 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
        >
          {t("무료로 시작하기", "Get started free")}
        </Link>
      </div>
      <p className="mt-6 text-[13px] text-[#8B95A1]">
        {t("채용 담당자이신가요?", "Hiring?")}{" "}
        <Link href="/partner" onClick={() => trackLandingSectionCta("partner")} className="font-bold text-[#4E5968] underline underline-offset-2 hover:text-[#0B46E8]">
          {t("기업 서비스 보기", "For employers")}
        </Link>
      </p>
    </section>
  );
}

export function LandingSections({ jobs, visaCodes }: { jobs: LandingJob[]; visaCodes: string[] }) {
  const t = usePlatformT();
  return (
    <>
      <RealJobs t={t} jobs={jobs} />
      <VisaGuides t={t} codes={visaCodes} />
      <Tools t={t} />
      <CareerLaunch t={t} />
      <Trust t={t} />
      <FinalCta t={t} />
    </>
  );
}
