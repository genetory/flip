"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";

export function PricingPage() {
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const refundCardRef = useRef<HTMLElement | null>(null);
  const [isRefundCardVisible, setIsRefundCardVisible] = useState(false);
  const priceSuffixClassName = "text-sm font-semibold md:text-base";

  const copy = {
    title: isKo ? "내 상황에 맞춰 선택하는 이용 플랜" : "Service plans tailored to your situation",
    description: isKo
      ? "Aply는 시작부터 확장까지, 현재 상황에 맞게 부담 없이 선택할 수 있는 플랜을 제공합니다."
      : "From getting started to scaling, Aply provides plans you can choose with confidence based on your current situation.",
    note: isKo
      ? "정확한 비용은 포지션 수, 운영 범위, 지원 형태에 따라 달라질 수 있어요."
      : "Final pricing may vary depending on the number of positions, operating scope, and support format.",
    refundCard: isKo
      ? {
          title: "탈락 시 100% 환불",
          subtitle: "부담 없이 도전하세요",
          description:
            "결제 후 서류 제출과 면접 심사를 진행합니다. 심사에 통과한 분만 프로그램에 참여하며, 탈락 시 결제 금액은 100% 전액 환불됩니다.",
          processSteps: [
            { label: "결제 완료", imageSrc: "/img_process_0.webp" },
            { label: "프로필 제출", imageSrc: "/img_process_1.webp" },
            { label: "심사 진행", imageSrc: "/img_process_2.webp" },
            { label: "프로그램 참여", imageSrc: "/img_process_3.webp" }
          ]
        }
      : {
          title: "100% Refund if Not Accepted",
          subtitle: "Apply with confidence",
          description:
            "After payment, you will proceed with document submission and interview screening. Only candidates who pass the review join the program, and those not accepted receive a full 100% refund.",
          processSteps: [
            { label: "Payment complete", imageSrc: "/img_process_0.webp" },
            { label: "Profile submission", imageSrc: "/img_process_1.webp" },
            { label: "Screening", imageSrc: "/img_process_2.webp" },
            { label: "Program participation", imageSrc: "/img_process_3.webp" }
          ]
        },
    housing: isKo
      ? {
          titleTop: "집 구하기 걱정 없이,",
          titleBottom: "커리어에만 집중하세요.",
          description: "Career Bridge 참가자에게만 제공되는 프리미엄 주거 옵션",
          note: "💡 주거 옵션은 프로그램 참가의 필수 조건이 아닙니다. 숙소가 필요하신 분만 별도로 신청하실 수 있습니다.",
          privateRoom: {
            name: "Private Room (1인실)",
            location: "📍 서울 내 위치, 교통 편리",
            summary: "나만의 편안한 휴식 공간",
            price: "₩700,000~2,000,000 월 (1인당)"
          },
          sharedRoom: {
            name: "Shared Room (2인실)",
            location: "📍 서울 내 위치, 교통 편리",
            summary: "합리적인 비용과 네트워킹",
            price: "₩400,000~1,100,000 월 (1인당)"
          },
          disclaimer: "※ 제휴된 숙소의 예약 현황에 따라 실제 배정되는 숙소는 상이할 수 있습니다."
        }
      : {
          titleTop: "Focus on your career,",
          titleBottom: "not on finding housing.",
          description: "Premium housing options available exclusively for Career Bridge participants",
          note: "💡 Housing is not required to participate in the program. You may apply separately only if accommodation is needed.",
          privateRoom: {
            name: "Private Room (Single)",
            location: "📍 Located in Seoul with convenient transportation",
            summary: "Your own private and comfortable living space",
            price: "₩700,000~2,000,000 per month (per person)"
          },
          sharedRoom: {
            name: "Shared Room (Double)",
            location: "📍 Located in Seoul with convenient transportation",
            summary: "A cost-effective option with built-in networking opportunities",
            price: "₩400,000~1,100,000 per month (per person)"
          },
          disclaimer: "※ Actual accommodation assignments may vary depending on availability at partnered properties."
        }
  };

  const renderHousingPrice = (price: string) => {
    if (price.includes(" 월 (1인당)")) {
      const [main] = price.split(" 월 (1인당)");
      return (
        <>
          <span className={priceSuffixClassName}>월 (1인당)</span>
          <div className="mt-1 flex items-end gap-1">
            <span className="whitespace-nowrap font-display text-2xl font-bold tracking-tight md:text-3xl">{main}</span>
            <span className={priceSuffixClassName}>KRW</span>
          </div>
        </>
      );
    }

    if (price.includes(" per month (per person)")) {
      const [main] = price.split(" per month (per person)");
      return (
        <>
          <span className={priceSuffixClassName}>per month (per person)</span>
          <div className="mt-1 flex items-end gap-1">
            <span className="whitespace-nowrap font-display text-2xl font-bold tracking-tight md:text-3xl">{main}</span>
            <span className={priceSuffixClassName}>KRW</span>
          </div>
        </>
      );
    }

    const parts = price.split("/");
    if (parts.length < 2) {
      return <span>{price}</span>;
    }
    const main = parts[0]?.trim() ?? price;
    const suffix = parts[1]?.trim() ?? "";
    return (
      <>
        {main}
        {suffix ? <span className={`ml-1 ${priceSuffixClassName}`}>{suffix}</span> : null}
      </>
    );
  };

  useEffect(() => {
    const target = refundCardRef.current;
    if (!target || isRefundCardVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        setIsRefundCardVisible(true);
        observer.disconnect();
      },
      { threshold: 0.2 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [isRefundCardVisible]);

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="flex-1">
        <section className="bg-[#F8FAFC] pt-12 pb-16 md:pt-16 md:pb-24">
          <div className="container">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-black md:text-5xl`}>{copy.title}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{copy.description}</p>
            </div>

            <div className="mx-auto mt-10 w-fit max-w-full space-y-10">
              <div className="w-full">
                <Image
                  src="/img_workperience_hero.webp"
                  alt={isKo ? "일경험 소개 이미지" : "Work experience hero image"}
                  width={1600}
                  height={900}
                  className="h-[220px] w-full object-contain md:h-[280px]"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
              </div>
              <div className="grid w-fit max-w-full gap-3 md:grid-cols-2 md:items-stretch">
                  <article className="flex h-full w-fit max-w-[440px] flex-col rounded-2xl bg-white p-6 text-[#111111] shadow-card">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#B7FF5A] px-2.5 py-1 text-[11px] font-semibold text-black">
                      {isKo ? "진행중" : "In Progress"}
                    </span>
                    <h4 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] md:text-2xl`}>{isKo ? "해외 대학 출신 일경험" : "Work Experience for Overseas Graduates"}</h4>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{isKo ? "해외 대학 출신을 위한 한국 기업 일경험" : "Korean-company work experience for overseas graduates"}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground md:text-sm">
                      {isKo
                        ? "한국 기업의 업무 방식과 직무 문화를 짧은 기간 경험할 수 있는 교육 목적 프로그램입니다. 한국 취업을 바로 보장하는 과정이 아니라, 한국 기업과 산업을 먼저 이해하고 향후 취업 가능성을 탐색하는 데 적합합니다."
                        : "An education-focused program to experience Korean work style and job culture over a short period. It does not guarantee employment and helps participants explore future career possibilities."}
                    </p>
                    <div className="mt-4 overflow-x-auto rounded-xl bg-white/92">
                      <table className="w-auto min-w-[360px] border-collapse text-left text-sm">
                        <tbody>
                          <tr className="border-b border-border/60"><th className="w-24 bg-muted/30 px-3 py-2 font-semibold">{isKo ? "대상" : "Target"}</th><td className="px-3 py-2">{isKo ? "해외 대학 출신" : "Overseas university graduates"}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "목적" : "Purpose"}</th><td className="px-3 py-2">{isKo ? "한국 기업 일경험 및 직무 이해" : "Korean-company work experience and role understanding"}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "급여" : "Salary"}</th><td className="px-3 py-2">{isKo ? "없음" : "None"}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "참여비" : "Applicant fee"}</th><td className="px-3 py-2">2,000,000원</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "기업 수수료" : "Company fee"}</th><td className="px-3 py-2">{isKo ? "없음" : "None"}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "수료증" : "Certificate"}</th><td className="px-3 py-2">{isKo ? "발급" : "Provided"}</td></tr>
                          <tr><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "전환 가능성" : "Conversion"}</th><td className="px-3 py-2">{isKo ? "전환 가능, 보장하지 않음" : "Possible, not guaranteed"}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{isKo ? "제공 내용" : "What is provided"}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{isKo ? "직무 교육 제공 (플리퍼스)" : "Job orientation/training (Flipers)"}</li>
                        <li>{isKo ? "수료증 발급 (플리퍼스)" : "Completion certificate (Flipers)"}</li>
                        <li>{isKo ? "정기 면담, 과제, 피드백 (기업 협조 기반)" : "Periodic check-ins, tasks, and feedback (company-supported)"}</li>
                        <li>{isKo ? "추천서 제공은 기업 희망 시 자율 진행" : "Recommendation letter only if the company chooses to provide it"}</li>
                      </ul>
                    </div>
                    <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                      {isKo
                        ? "채용이나 전환이 보장되는 과정은 아니며, 한국 기업과 직무를 경험하기 위한 교육형 프로그램입니다."
                        : "This is an educational experience track and does not guarantee hiring or conversion."}
                    </p>
                  </article>
                  <article className="h-full w-fit max-w-[440px] rounded-2xl bg-white p-6 text-[#111111] shadow-card">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#B7FF5A] px-2.5 py-1 text-[11px] font-semibold text-black">
                      {isKo ? "진행중" : "In Progress"}
                    </span>
                    <h4 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] md:text-2xl`}>{isKo ? "국내 대학 재학생 및 졸업생 일경험" : "Work Experience for Korean-University Students/Graduates"}</h4>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{isKo ? "국내 대학 유학생을 위한 실무 일경험" : "Practical work experience for international students in Korean universities"}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground md:text-sm">
                      {isKo
                        ? "국내 대학 재학생 및 졸업생이 한국 기업의 직무 환경을 경험해볼 수 있는 교육형 프로그램입니다. 학교 연계나 학점 인정이 필요한 경우, 필요한 서류 작업을 함께 조율할 수 있습니다."
                        : "An education-focused track for students and graduates in Korean universities to experience Korean-company job environments, with school-linked documentation support when needed."}
                    </p>
                    <div className="mt-4 overflow-x-auto rounded-xl bg-white/96 text-[#1f2342]">
                      <table className="w-auto min-w-[360px] border-collapse text-left text-sm">
                        <tbody>
                          <tr className="border-b border-border/60"><th className="w-24 bg-muted/30 px-3 py-2 font-semibold">{isKo ? "대상" : "Target"}</th><td className="px-3 py-2">{isKo ? "국내 대학 재학생 및 졸업생" : "Students/graduates of Korean universities"}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "목적" : "Purpose"}</th><td className="px-3 py-2">{isKo ? "한국 기업 일경험 및 직무 이해" : "Korean-company work experience and role understanding"}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "급여" : "Salary"}</th><td className="px-3 py-2">{isKo ? "없음" : "None"}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "참여비" : "Applicant fee"}</th><td className="px-3 py-2">700,000원</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "기업 수수료" : "Company fee"}</th><td className="px-3 py-2">{isKo ? "없음" : "None"}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "수료증" : "Certificate"}</th><td className="px-3 py-2">{isKo ? "발급" : "Provided"}</td></tr>
                          <tr><th className="bg-muted/30 px-3 py-2 font-semibold">{isKo ? "학교 연계" : "School linkage"}</th><td className="px-3 py-2">{isKo ? "평가서/서류 작성 조율 가능" : "Evaluation/report documents can be coordinated"}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{isKo ? "제공 내용" : "What is provided"}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{isKo ? "직무 교육 제공 (플리퍼스)" : "Job orientation/training (Flipers)"}</li>
                        <li>{isKo ? "수료증 발급 (플리퍼스)" : "Completion certificate (Flipers)"}</li>
                        <li>{isKo ? "학교 연계 시 평가서/학점 서류 요청 조율" : "School-linked evaluation/credit documents can be coordinated"}</li>
                        <li>{isKo ? "기업 수수료 없음, 기업은 운영 협조 항목만 선택 참여" : "No company fee; companies participate through selected cooperation items only"}</li>
                      </ul>
                    </div>
                    <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                      {isKo
                        ? "전환 가능성은 있으나 정식 채용이나 추천서 제공은 보장되지 않습니다. 기업 협조 항목(정기 면담, 과제, 피드백 등)은 기업 상황에 맞춰 조정 가능합니다."
                        : "Conversion and recommendation letters are possible but not guaranteed. Company cooperation items (check-ins, tasks, feedback) are adjustable by company circumstances."}
                    </p>
                  </article>
                </div>

              <article className="w-full rounded-2xl bg-white p-6 text-[#111111] shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <h3 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] text-slate-900 md:text-2xl`}>
                    {isKo ? "인턴십 · 계약직 · 정규직" : "Internship · Contract · Regular"}
                  </h3>
                  <span className="rounded-full bg-[#0B46E8] px-3 py-1 text-xs font-semibold text-white">
                    {isKo ? "계획중" : "Planned"}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground md:text-base">
                  {isKo
                    ? "인턴십, 계약직(파트타임/풀타임), 정규직 트랙은\n향후 서비스 고도화 단계에서 순차적으로 제공될 예정입니다.\n기업과 지원자 모두에게 더 실질적인 연결이 되도록 완성도를 높여가고 있습니다."
                    : "Internship, Contract (part-time/full-time), and Regular tracks\nwill be introduced step by step as the service evolves.\nWe are continuously improving the experience to create more practical outcomes for both companies and candidates."}
                </p>
              </article>
            </div>

            <p className="mx-auto mt-6 max-w-4xl text-center text-xs text-muted-foreground md:text-sm">{copy.note}</p>

            <article
              ref={refundCardRef}
              className="mx-auto mt-6 max-w-4xl rounded-2xl bg-card p-6 shadow-card"
            >
              <p className="text-base font-semibold text-foreground md:text-lg">{copy.refundCard.title}</p>
              <p className="mt-1 text-sm font-medium text-primary">{copy.refundCard.subtitle}</p>

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
                {copy.refundCard.processSteps.map((step, index) => (
                  <article
                    key={step.label}
                    className={`process-step-card relative rounded-xl p-3 ${isRefundCardVisible ? "is-visible" : ""}`}
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex justify-center">
                      <Image
                        src={step.imageSrc}
                        alt={step.label}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-md object-cover"
                        sizes="80px"
                      />
                    </div>
                    <p className="mt-2 text-center text-sm font-semibold text-foreground">{step.label}</p>
                    {index < copy.refundCard.processSteps.length - 1 ? (
                      <span
                        aria-hidden
                        className="absolute -right-3 top-[42px] hidden text-muted-foreground md:block"
                      >
                        →
                      </span>
                    ) : null}
                  </article>
                ))}
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted-foreground md:text-sm">{copy.refundCard.description}</p>
            </article>

            <section className="mx-auto mt-16 max-w-4xl md:mt-20">
              <h2 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-black md:text-5xl`}>
                {copy.housing.titleTop}
                <br />
                {copy.housing.titleBottom}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                {copy.housing.description}
                <br />
                {copy.housing.note}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <div className="overflow-hidden bg-muted">
                    <Image
                      src="/img_housing_0.webp"
                      alt="Private Room (1인실)"
                      width={1200}
                      height={800}
                      className="h-[200px] w-full object-cover md:h-[220px]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-4 md:p-5">
                    <p className="text-lg font-bold tracking-tight text-foreground">{copy.housing.privateRoom.name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{copy.housing.privateRoom.location}</p>
                    <p className="mt-1 text-sm text-foreground/90">{copy.housing.privateRoom.summary}</p>
                    <div className="mt-4 text-2xl font-bold text-foreground md:text-3xl">{renderHousingPrice(copy.housing.privateRoom.price)}</div>
                  </div>
                </article>

                <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
                  <div className="overflow-hidden bg-muted">
                    <Image
                      src="/img_housing_1.webp"
                      alt="Shared Room (2인실)"
                      width={1200}
                      height={800}
                      className="h-[200px] w-full object-cover md:h-[220px]"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <div className="p-4 md:p-5">
                    <p className="text-lg font-bold tracking-tight text-foreground">{copy.housing.sharedRoom.name}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{copy.housing.sharedRoom.location}</p>
                    <p className="mt-1 text-sm text-foreground/90">{copy.housing.sharedRoom.summary}</p>
                    <div className="mt-4 text-2xl font-bold text-foreground md:text-3xl">{renderHousingPrice(copy.housing.sharedRoom.price)}</div>
                  </div>
                </article>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {copy.housing.disclaimer}
              </p>
            </section>

          </div>
        </section>

      </main>
      <Footer />

      <style jsx>{`
        .process-step-card {
          opacity: 0;
          transform: translateY(22px);
        }

        .process-step-card.is-visible {
          animation: processCardReveal 680ms ease-out forwards;
        }

        @keyframes processCardReveal {
          0% {
            opacity: 0;
            transform: translateY(22px);
            filter: blur(4px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .process-step-card {
            opacity: 1;
            transform: translateY(0);
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
