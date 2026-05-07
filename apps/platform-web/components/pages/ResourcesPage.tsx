"use client";

import Link from "next/link";
import Image from "next/image";
import { FileCheck2, BookOpen, ExternalLink } from "lucide-react";
import { Sparkle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";

type ResourceItem = {
  title: string;
  description: string;
  href: string;
};

export function ResourcesPage() {
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const t = (ko: string, en: string) => (isKo ? ko : en);

  const visaItems: ResourceItem[] = [
    {
      title: t("대표 비자 유형 한눈에 보기", "Korea visa types at a glance"),
      description: t("유학/취업/인턴 관련 비자 정보를 빠르게 확인할 수 있어요.", "Quickly check visa options for study, work, and internships."),
      href: "/resources/visa"
    },
    {
      title: t("비자 코드별 상세 가이드", "Detailed guide by visa code"),
      description: t("신청 대상, 체류기간, 필요서류를 코드별로 자세히 확인해보세요.", "Review eligibility, stay period, and required documents by visa code."),
      href: "/resources/visa"
    }
  ];

  const documentRoadmap = [
    {
      title: t("1단계: 입국 및 초기 정착", "Step 1: Entry & Initial Settlement"),
      subtitle: t("가장 시급한 필수 서류", "Most urgent essential documents"),
      description: t(
        "한국 도착 후 신분증을 만들고 집을 구하는 데 필요한 최우선 서식입니다.",
        "Top-priority forms used right after arrival for ID issuance and housing."
      ),
      items: [
        {
          title: t("통합신청서(신고서)", "Application Form (Report Form)"),
          usage: t("외국인등록증 최초 발급, 체류기간 연장, 비자 변경 등 출입국사무소 핵심 업무 공통 서식", "Core all-purpose immigration form for ARC issuance, extension, and visa change"),
          linkLabel: t("하이코리아 민원서식", "HiKorea forms"),
          link: "https://www.hikorea.go.kr/board/BoardApplicationListR.pt"
        },
        {
          title: t("주택임대차표준계약서 (영문 병기)", "Standard Housing Lease Agreement"),
          usage: t("원룸·오피스텔 계약 시 사용. 영문 병기 서식 활용 시 계약 리스크 완화", "Used for housing contracts; bilingual format helps reduce contract risk"),
          linkLabel: t("법무부 주택임대차표준계약서", "MOJ standard lease form"),
          link: "https://www.moj.go.kr/moj/315/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbW9qJTJGMTE4JTJGNjA0MTkyJTJGYXJ0Y2xWaWV3LmRvJTNGcGFzc3dvcmQlM0QlMjZyZ3NCZ25kZVN0ciUzRCUyNmJic0NsU2VxJTNEJTI2cmdzRW5kZGVTdHIlM0QlMjZpc1ZpZXdNaW5lJTNEZmFsc2UlMjZwYWdlJTNEMSUyNmJic09wZW5XcmRTZXElM0QlMjZzcmNoQ29sdW1uJTNEJTI2c3JjaFdyZCUzRCUyNg%3D%3D"
        },
        {
          title: t("거주/숙소 제공 확인서", "Confirmation of Residence/Accommodation"),
          usage: t("기숙사·지인 집 거주 등 본인 명의 임대차가 아닐 때 체류지 증빙용", "Proof of residence when lease is not under your own name"),
          linkLabel: t("하이코리아 민원서식", "HiKorea forms"),
          link: "https://www.hikorea.go.kr/board/BoardApplicationListR.pt"
        }
      ]
    },
    {
      title: t("2단계: 근로 및 일상생활 유지", "Step 2: Work & Daily Administration"),
      subtitle: t("자주 쓰는 실생활 서류", "Frequently used practical forms"),
      description: t(
        "한국에서 일하고 이사하며 행정 업무를 볼 때 빈번히 필요한 서류입니다.",
        "Frequently used forms for work, moving, and day-to-day administration."
      ),
      items: [
        {
          title: t("표준근로계약서", "Standard Labor Contract"),
          usage: t("취업 시 사업주와 체결. 고용노동부 다국어 버전 활용 가능", "Employment contract with multilingual versions provided"),
          linkLabel: t("고용24 근로계약서 검색", "Work24 labor contract search"),
          link: "https://www.work24.go.kr/cm/c/b/1100/selectBbttList.do?currentPageNo=1&recordCountPerPage=10&sortTycd=1&searchTxt=%EA%B7%BC%EB%A1%9C%EA%B3%84%EC%95%BD%EC%84%9C&searchTycd=1"
        },
        {
          title: t("인턴 계약서", "Intern Contract"),
          usage: t("양식은 근로계약서와 유사하나 문서 제목은 반드시 ‘인턴 계약서’ 명시", "Format is similar to labor contract, but title must clearly state intern contract")
        },
        {
          title: t("체류지 변경 신고", "Report of Change of Residence"),
          usage: t("이사 시 필수. 이사 후 14일 이내 미신고 시 범칙금(최대 100만원) 가능", "Required after moving; delayed report (over 14 days) may incur penalty"),
          linkLabel: t("하이코리아 민원서식", "HiKorea forms"),
          link: "https://www.hikorea.go.kr/board/BoardApplicationListR.pt"
        },
        {
          title: t("외국인등록 사실증명 발급 신청", "Certificate of Alien Registration"),
          usage: t("은행·대출·관공서 제출용 신분/주소 증명", "Official identity/address proof for banking and administration"),
          linkLabel: t("법령별표서식(출입국관리법 시행규칙 서식138의2)", "Law form reference (Form 138-2)"),
          link: "https://www.law.go.kr/%EB%B2%95%EB%A0%B9%EB%B3%84%ED%91%9C%EC%84%9C%EC%8B%9D/"
        },
        {
          title: t("위임장", "Power of Attorney"),
          usage: t("지인/행정사를 통한 대리 민원 처리 시 필요", "Needed when appointing an agent for civil processing"),
          linkLabel: t("하이코리아 민원서식", "HiKorea forms"),
          link: "https://www.hikorea.go.kr/board/BoardApplicationListR.pt"
        }
      ]
    },
    {
      title: t("3단계: 세무 및 연례/특수 행정", "Step 3: Tax & Annual/Special Administration"),
      subtitle: t("연 1회 또는 특정 상황", "Annual or special situations"),
      description: t(
        "정기 신고 또는 특정 요건에서만 필요한 서류입니다.",
        "Forms needed for annual filings or specific conditions."
      ),
      items: [
        {
          title: t("외국인 근로자 소득공제 신고서", "Income Deduction Form for Foreign Workers"),
          usage: t("연말정산 시 사용. 국세청 영문 페이지에서 연도별 가이드 확인", "Used for year-end tax settlement with annual guides"),
          linkLabel: t("국세청 영문 안내", "NTS English guide"),
          link: "https://www.nts.go.kr/english/cm/cntnts/cntntsView.do?mi=10791&cntntsId=8664"
        },
        {
          title: t("건강보험 피부양자 자격취득 신고서", "Health Insurance Dependent Registration"),
          usage: t("가족을 피부양자로 등록할 때 필요", "Required when registering family dependents"),
          linkLabel: t("법령별표서식(국민건강보험법 시행규칙 서식1)", "Law form reference (NHIS Form 1)"),
          link: "https://www.law.go.kr/%EB%B2%95%EB%A0%B9%EB%B3%84%ED%91%9C%EC%84%9C%EC%8B%9D/"
        },
        {
          title: t("외국면허 교환발급 신청서", "Exchange of Foreign Driver's License"),
          usage: t("본국 면허를 한국 면허로 교환할 때 사용", "Used to exchange foreign license for a Korean license"),
          linkLabel: t("도로교통공단 안내", "Road Traffic Authority guide"),
          link: "https://www.safedriving.or.kr/diGuide/selectDiGuide05.do?menuCd=MN-PO-1213"
        }
      ]
    }
  ];

  const Section = ({
    icon,
    title,
    description,
    items
  }: {
    icon: ReactNode;
    title: string;
    description: string;
    items: ResourceItem[];
  }) => (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#EAF2FF]" />
      <div className="mb-5 flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1227] text-white">
          {icon}
        </div>
        <div>
          <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227]`}>{title}</h2>
          <p className="mt-1 text-sm text-slate-600 md:text-base">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-slate-200">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group flex items-center justify-between gap-3 rounded-xl py-4 transition hover:bg-slate-50"
          >
            <div>
              <p className="text-sm font-semibold text-[#111111] md:text-base">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500 md:text-sm">{item.description}</p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#111111]" />
          </Link>
        ))}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans text-foreground antialiased">
      <Header />
      <main className="flex-1 pb-16 pt-12 md:pt-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <section className="relative overflow-hidden rounded-3xl bg-[#0B1227] px-6 py-8 text-white md:px-8 md:py-10">
              <div className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full bg-[#1E3A8A]/50 blur-2xl" />
              <div className="pointer-events-none absolute -left-16 bottom-0 h-32 w-32 rounded-full bg-[#B7FF5A]/25 blur-2xl" />
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                <Sparkle className="h-3.5 w-3.5" weight="fill" />
                {t("준비에 필요한 핵심 자료", "Essential resources for preparation")}
              </div>
              <h1 className={`${paperlogy.className} mt-4 text-3xl font-black tracking-[-0.03em] md:text-5xl`}>
                {t("비자 · 정착 서류 자료실", "Visa · Settlement Document Resources")}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
                {t(
                  "한국 비자 정보와 정착·근로·행정에 필요한 핵심 서류를 한 곳에서 확인해보세요.",
                  "Find Korean visa information and essential documents for settlement, work, and administration in one place."
                )}
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl bg-white/5">
                <Image
                  src="/img_resource_hero.webp"
                  alt={t("자료실 히어로 이미지", "Resources hero image")}
                  width={1920}
                  height={640}
                  preload
                  fetchPriority="high"
                  quality={70}
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="h-auto w-full object-cover"
                />
              </div>
            </section>

            <div className="mt-8 grid gap-4 md:gap-5">
              <Section
                icon={<BookOpen className="h-5 w-5" />}
                title={t("한국 비자 정보", "Korean Visa Information")}
                description={t("비자 준비 전에 꼭 확인하면 좋은 핵심 정보", "Core information worth checking before visa preparation")}
                items={visaItems}
              />
              <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#EAF2FF]" />
                <div className="mb-5 flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B1227] text-white">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227]`}>
                      {t("외국인 정착·근로 서류 로드맵", "Foreign Resident Document Roadmap")}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 md:text-base">
                      {t("입국부터 근로·세무까지 단계별로 자주 쓰는 핵심 서식을 정리했습니다.", "A staged checklist of key forms from entry to work and tax.")}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {documentRoadmap.map((stage) => (
                    <article key={stage.title} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-extrabold text-[#111111] md:text-lg">{stage.title}</p>
                        <span className="inline-flex items-center rounded-full bg-[#EAF2FF] px-2 py-0.5 text-xs font-semibold text-[#0B46E8]">{stage.subtitle}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{stage.description}</p>
                      <div className="mt-3 space-y-2">
                        {stage.items.map((item) => (
                          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="text-sm font-bold text-[#111111]">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-600">{item.usage}</p>
                            {item.link ? (
                              <a
                                href={item.link}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0B46E8] underline underline-offset-2"
                              >
                                {item.linkLabel ?? t("바로가기", "Open link")}
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
