"use client";

import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { ResourceSubPageLayout } from "./ResourceSubPageLayout";

export function DocumentsResourcesPage() {
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const t = (ko: string, en: string) => (isKo ? ko : en);

  const docs = [
    {
      title: t("신분/학력 기본 서류", "Identity & academic basics"),
      items: [
        t("여권 사본", "Passport copy"),
        t("재학/졸업 증명서", "Enrollment or graduation certificate"),
        t("성적 증명서", "Transcript")
      ]
    },
    {
      title: t("지원용 추가 서류", "Application supporting docs"),
      items: [
        t("자기소개서 또는 동기서", "Statement of purpose / motivation"),
        t("포트폴리오(해당 직무)", "Portfolio (role-dependent)"),
        t("자격증·수료증(선택)", "Certificates (optional)")
      ]
    }
  ];

  return (
    <ResourceSubPageLayout
      titleKo="기타 서류 안내"
      titleEn="Additional Document Guidance"
      descKo="지원 과정에서 자주 요구되는 서류를 항목별로 정리했습니다."
      descEn="A practical breakdown of documents commonly requested during applications."
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("서류 카테고리", "Document Categories")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {docs.map((group) => (
            <article key={group.title} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-base font-extrabold text-[#111111]">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0B46E8]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("제출 전 확인", "Before Submission")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
          {t(
            "서류의 발급일, 영문명 표기 일치 여부, 스캔 품질(PDF 가독성)까지 마지막으로 점검하면 반려 가능성을 줄일 수 있어요.",
            "A final check on issue dates, name consistency, and scan readability can reduce rejection risk."
          )}
        </p>
      </section>
    </ResourceSubPageLayout>
  );
}
