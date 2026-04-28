"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useLanguage } from "../i18n/LanguageProvider";

type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: { label: string; href: string; variant: "dark" | "outline" };
  highlighted?: boolean;
};

export function PricingPage() {
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const refundCardRef = useRef<HTMLElement | null>(null);
  const [isRefundCardVisible, setIsRefundCardVisible] = useState(false);

  const plans: PricingPlan[] = isKo
    ? [
        {
          name: "Starter",
          price: "무료",
          description: "플랫폼을 가볍게 시작하고 기본 흐름을 확인할 수 있는 플랜",
          features: [
            "포지션 탐색 및 저장",
            "매칭 가능성 확인",
            "기본 프로필/지원 관리"
          ],
          cta: { label: "무료로 시작", href: "/signup", variant: "outline" }
        },
        {
          name: "한국 내 대학 출신",
          price: "₩700,000 KRW",
          description: "국내 대학교 재학/졸업생",
          features: [
            "인턴십 기간: 6주 ~ 16주 선택"
          ],
          cta: { label: "도입 상담 신청", href: "/signup", variant: "dark" },
          highlighted: true
        },
        {
          name: "한국 외 대학 출신",
          price: "₩2,000,000 KRW",
          description: "해외 대학교 재학/졸업생",
          features: [
            "인턴십 기간: 6주 ~ 16주 선택"
          ],
          cta: { label: "맞춤 견적 문의", href: "/signup", variant: "outline" }
        }
      ]
    : [
        {
          name: "Starter",
          price: "Free",
          description: "A starter plan to explore the platform and experience the core workflow",
          features: [
            "Explore and save positions",
            "Check match potential",
            "Basic profile and application management"
          ],
          cta: { label: "Start for free", href: "/signup", variant: "outline" }
        },
        {
          name: "Graduates of Korean Universities",
          price: "₩700,000 KRW",
          description: "Current students or graduates of universities in Korea",
          features: [
            "Internship period: choose from 6 to 16 weeks"
          ],
          cta: { label: "Book a consultation", href: "/signup", variant: "dark" },
          highlighted: true
        },
        {
          name: "Graduates of Non-Korean Universities",
          price: "₩2,000,000 KRW",
          description: "Current students or graduates of universities outside Korea",
          features: [
            "Internship period: choose from 6 to 16 weeks"
          ],
          cta: { label: "Request a custom quote", href: "/signup", variant: "outline" }
        }
      ];

  const copy = {
    title: isKo ? "채용 운영 단계에 맞는 비용 플랜" : "Pricing plans for each hiring stage",
    description: isKo
      ? "플립은 시작부터 확장까지, 팀 상황에 맞춰 유연하게 운영할 수 있도록 플랜을 제공합니다."
      : "Flip offers flexible plans that help your team scale hiring operations smoothly from day one.",
    note: isKo
      ? "정확한 비용은 포지션 수, 운영 범위, 지원 형태에 따라 달라질 수 있어요."
      : "Final pricing can vary by number of positions, scope, and support needs.",
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
            price: "₩2,800,000 / Month"
          },
          sharedRoom: {
            name: "Shared Room (2인실)",
            location: "📍 서울 내 위치, 교통 편리",
            summary: "합리적인 비용과 네트워킹",
            price: "₩1,900,000 / Month"
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
            price: "₩2,800,000 / Month"
          },
          sharedRoom: {
            name: "Shared Room (Double)",
            location: "📍 Located in Seoul with convenient transportation",
            summary: "A cost-effective option with built-in networking opportunities",
            price: "₩1,900,000 / Month"
          },
          disclaimer: "※ Actual accommodation assignments may vary depending on availability at partnered properties."
        }
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
              <h1 className="font-display text-3xl font-bold tracking-tight text-black">{copy.title}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{copy.description}</p>
            </div>

            <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">
              {plans.map((plan) => {
                const match = plan.price.match(/^(.*)\s(KRW)$/);
                const priceMain = match ? match[1] : plan.price;
                const priceSuffix = match ? match[2] : null;
                return (
                <article
                  key={plan.name}
                  className={`flex h-full flex-col rounded-2xl border bg-card p-6 shadow-card ${
                    plan.highlighted ? "border-primary/35 ring-1 ring-primary/25" : "border-border"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{plan.name}</p>
                  <p className="mt-3 font-display text-2xl font-bold tracking-tight md:text-3xl">
                    {priceMain}
                    {priceSuffix ? <span className="ml-1 text-sm font-semibold md:text-base">{priceSuffix}</span> : null}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

                  <ul className="mt-6 space-y-2 text-sm text-foreground">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button variant={plan.cta.variant} asChild className="w-full">
                      <Link href={plan.cta.href}>{plan.cta.label}</Link>
                    </Button>
                  </div>
                </article>
                );
              })}
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
              <h2 className="font-display text-2xl font-bold tracking-tight text-black md:text-3xl">
                {copy.housing.titleTop}
                <br />
                {copy.housing.titleBottom}
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground md:text-sm">
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
                    <p className="mt-4 text-xl font-bold text-primary">{copy.housing.privateRoom.price}</p>
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
                    <p className="mt-4 text-xl font-bold text-primary">{copy.housing.sharedRoom.price}</p>
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
