"use client";

import { FileText } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { ResourceSubPageLayout } from "./ResourceSubPageLayout";

export function ResumeResourcesPage() {
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const t = (ko: string, en: string) => (isKo ? ko : en);

  const templates = [
    {
      name: t("국문 이력서 기본형", "Korean Resume - Basic"),
      desc: t("국내 기업 지원에 맞춘 표준 레이아웃", "Standard layout for Korean-company applications")
    },
    {
      name: t("영문 이력서 기본형", "English Resume - Basic"),
      desc: t("해외·글로벌 포지션 지원용 레이아웃", "A clean format for global opportunities")
    },
    {
      name: t("직무 강조형 이력서", "Role-focused Resume"),
      desc: t("경험보다 역량 강조가 필요한 직무에 적합", "Great when role-fit and skills should stand out")
    }
  ];

  return (
    <ResourceSubPageLayout
      titleKo="이력서 양식"
      titleEn="Resume Templates"
      descKo="국문/영문 이력서 양식과 작성 포인트를 빠르게 확인해보세요."
      descEn="Quickly review Korean/English resume formats and key writing points."
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("추천 양식", "Recommended Formats")}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {templates.map((item) => (
            <article key={item.name} className="rounded-2xl bg-slate-50 p-4">
              <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#0B46E8]">
                <FileText className="h-4 w-4" />
              </div>
              <p className="mt-3 text-sm font-extrabold text-[#111111] md:text-base">{item.name}</p>
              <p className="mt-1 text-xs text-slate-600 md:text-sm">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("작성 팁", "Writing Tips")}</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-700 md:text-base">
          <li>• {t("지원 직무와 직접 연결되는 경험을 상단에 배치하세요.", "Put role-relevant experience near the top.")}</li>
          <li>• {t("성과는 가능하면 숫자로 표현하세요.", "Use measurable outcomes whenever possible.")}</li>
          <li>• {t("한 페이지 내 핵심 정보가 빠르게 보이도록 구성하세요.", "Keep key information quickly scannable on one page.")}</li>
        </ul>
      </section>
    </ResourceSubPageLayout>
  );
}
