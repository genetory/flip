"use client";

import Link from "next/link";
import Image from "next/image";
import { FileText, FileCheck2, BookOpen, ExternalLink } from "lucide-react";
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

  const documentItems: ResourceItem[] = [
    {
      title: t("기본 제출 서류 가이드", "Required document guide"),
      description: t("지원 전 준비해야 할 기본 서류를 정리해드립니다.", "See which baseline documents you should prepare before applying."),
      href: "/resources/documents"
    },
    {
      title: t("서류 작성 예시", "Sample document formats"),
      description: t("실제 작성 흐름을 참고할 수 있는 예시 템플릿입니다.", "Reference practical examples for formatting and content flow."),
      href: "/resources/documents"
    }
  ];

  const resumeItems: ResourceItem[] = [
    {
      title: t("국문 이력서 양식", "Korean resume template"),
      description: t("한국 채용 환경에 맞춘 기본 이력서 양식입니다.", "A baseline resume format tailored to Korean hiring practices."),
      href: "/resources/resume"
    },
    {
      title: t("영문 이력서 양식", "English resume template"),
      description: t("글로벌 포지션 지원을 위한 영문 이력서 양식입니다.", "A clean English resume format for global opportunities."),
      href: "/resources/resume"
    },
    {
      title: t("직무별 작성 팁", "Role-based resume tips"),
      description: t("마케팅/운영/개발 등 직무별 강조 포인트를 확인해보세요.", "Review emphasis points by role such as marketing, ops, and engineering."),
      href: "/resources/resume"
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
                {t("비자 · 서류 · 이력서 자료실", "Visa · Documents · Resume Resources")}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
                {t(
                  "한국 비자 정보, 제출 서류, 이력서 양식을 한 곳에서 확인해보세요.",
                  "Find Korean visa information, required documents, and resume templates in one place."
                )}
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl bg-white/5">
                <Image
                  src="/img_resource_hero.webp"
                  alt={t("자료실 히어로 이미지", "Resources hero image")}
                  width={1920}
                  height={640}
                  className="h-auto w-full object-cover"
                  priority
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
              <Section
                icon={<FileCheck2 className="h-5 w-5" />}
                title={t("기타 서류 안내", "Additional Document Guidance")}
                description={t("지원 과정에서 자주 필요한 서류 중심 안내", "Guidance for commonly required documents during application")}
                items={documentItems}
              />
              <Section
                icon={<FileText className="h-5 w-5" />}
                title={t("이력서 양식", "Resume Templates")}
                description={t("국문/영문 이력서 양식과 작성 참고 자료", "Korean/English resume formats and writing references")}
                items={resumeItems}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
