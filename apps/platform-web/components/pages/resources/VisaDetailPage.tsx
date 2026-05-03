"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { ResourceSubPageLayout } from "./ResourceSubPageLayout";
import { getFlatVisaItems } from "./VisaResourcesPage";
import { paperlogy } from "../../../lib/fonts";
import { VISA_DETAILS, type VisaStructuredLine } from "../../../lib/visa-details";

type Props = {
  code: string;
};

export function VisaDetailPage({ code }: Props) {
  const { locale } = useLanguage();
  const isKo = locale === "ko";
  const t = (ko: string, en: string) => (isKo ? ko : en);

  const normalizedCode = decodeURIComponent(code).toUpperCase();
  const visa = getFlatVisaItems().find((item) => item.code.toUpperCase() === normalizedCode);
  const crawled = VISA_DETAILS[normalizedCode];
  const descriptionLines = isKo
    ? (crawled?.descriptionKo ?? crawled?.description ?? [])
    : ((crawled?.descriptionEn?.length ? crawled.descriptionEn : crawled?.descriptionKo) ?? crawled?.description ?? []);
  const candidateLines = isKo
    ? (crawled?.candidatesKo ?? crawled?.candidates ?? [])
    : ((crawled?.candidatesEn?.length ? crawled.candidatesEn : crawled?.candidatesKo) ?? crawled?.candidates ?? []);
  const requirementLines = isKo
    ? (crawled?.requirementsKo ?? crawled?.requirements ?? [])
    : ((crawled?.requirementsEn?.length ? crawled.requirementsEn : crawled?.requirementsKo) ?? crawled?.requirements ?? []);

  const renderStructured = (lines: VisaStructuredLine[]) => (
    <div className="mt-2 space-y-1.5 text-sm text-slate-700 md:text-base">
      {lines.map((line, idx) =>
        line.kind === "heading" ? (
          <p
            key={`h-${idx}-${line.text}`}
            className={`mt-3.5 font-semibold leading-relaxed text-[#0B1227] ${
              line.depth === 1
                ? "ml-8 border-l-2 border-slate-300 pl-3.5"
                : line.depth >= 2
                  ? "ml-12 border-l-2 border-slate-200 pl-3.5 text-[#1f2937]"
                  : ""
            }`}
          >
            {line.text}
          </p>
        ) : (
          <p
            key={`b-${idx}-${line.text}`}
            className={`leading-7 ${
              line.depth === 1
                ? "ml-10 text-slate-600"
                : line.depth >= 2
                  ? "ml-14 text-slate-600"
                  : ""
            }`}
          >
            {line.text}
          </p>
        )
      )}
    </div>
  );

  if (!visa) {
    return (
      <ResourceSubPageLayout
        titleKo="비자 상세"
        titleEn="Visa Detail"
        descKo="요청하신 비자 정보를 찾지 못했어요."
        descEn="We couldn't find the requested visa information."
        hideHero
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">{t("해당 코드가 목록에 없어요.", "This code is not in the list.")}</p>
          <Link href="/resources/visa" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0B46E8] hover:underline">
            <ChevronLeft className="h-4 w-4" />
            {t("비자 목록으로 돌아가기", "Back to visa list")}
          </Link>
        </section>
      </ResourceSubPageLayout>
    );
  }

  return (
    <ResourceSubPageLayout
      titleKo={`${visa.code} 비자 상세`}
      titleEn={`${visa.code} Visa Detail`}
      descKo="내부에 저장된 비자 상세 정보를 코드별로 정리해 보여드려요."
      descEn="We show visa details from internally stored static data."
      hideHero
      backHref="/resources/visa"
      backKo="비자 목록으로"
      backEn="Back to visa list"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <div>
          <p className={`${paperlogy.className} text-3xl font-black tracking-[-0.02em] md:text-4xl ${visa.accentClass}`}>
            {visa.code} ({isKo ? visa.labelKo : visa.labelEn})
          </p>
          <p className="mt-2 text-sm text-slate-700 md:text-base">
            <span className="font-semibold">{t("신청대상", "Applicants")}:</span> {isKo ? visa.applicantKo : visa.applicantEn}
          </p>
          <p className="mt-1 text-sm text-slate-700 md:text-base">
            <span className="font-semibold">{t("체류기간", "Stay period")}:</span> {isKo ? visa.durationKo : visa.durationEn}
          </p>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="space-y-5">
            <p className="text-base font-black text-[#0B1227] md:text-lg">
              {(isKo ? crawled?.titleKo : crawled?.titleEn) ?? `${visa.code} ${isKo ? `${visa.labelKo} 비자 안내` : `${visa.labelEn} Visa Guide`}`}
            </p>

            <section className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("한눈에 보기", "Quick Overview")}</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700 md:text-base">
                <li>
                  <span className="font-semibold">{t("이 비자는 이런 분께 맞아요", "Best for")}:</span>{" "}
                  {isKo ? visa.applicantKo : visa.applicantEn}
                </li>
                <li>
                  <span className="font-semibold">{t("보통 체류기간", "Typical stay")}:</span>{" "}
                  {isKo ? visa.durationKo : visa.durationEn}
                </li>
                <li>
                  <span className="font-semibold">{t("준비 포인트", "What to prepare")}:</span>{" "}
                  {t(
                    "여권, 신청서, 사진은 기본이고 자격별 추가 서류를 꼭 확인해 주세요.",
                    "Passport, application form, and photo are basic. Check additional documents by visa type."
                  )}
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("상세 설명", "Detailed Description")}</h3>
              {descriptionLines.length
                ? renderStructured(descriptionLines)
                : (
                  <div className="mt-2 space-y-1 text-sm text-slate-700 md:text-base">
                    <p>
                      {isKo ? visa.applicantKo : visa.applicantEn}
                    </p>
                    <p>
                      {t("체류기간 기준", "Stay period reference")}: {isKo ? visa.durationKo : visa.durationEn}
                    </p>
                  </div>
                )}
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("누가 신청할 수 있나요?", "Who can apply?")}</h3>
              {candidateLines.length
                ? renderStructured(candidateLines)
                : (
                  <div className="mt-2 space-y-1 text-sm text-slate-700 md:text-base">
                    <p>
                      {isKo ? visa.applicantKo : visa.applicantEn}
                    </p>
                  </div>
                )}
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("준비해야 할 서류", "Required Documents")}</h3>
              {requirementLines.length
                ? renderStructured(requirementLines)
                : (
                  <div className="mt-2 space-y-1 text-sm text-slate-700 md:text-base">
                    <p>
                      {t("여권", "Passport")}
                    </p>
                    <p>
                      {t("비자 신청서", "Visa application form")}
                    </p>
                    <p>
                      {t("사진", "ID photo")}
                    </p>
                    <p>
                      {t("추가 증빙서류(자격별 상이)", "Additional supporting documents (varies by status)")}
                    </p>
                  </div>
                )}
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("주의할 점", "What to watch out for")}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">
                <li>{t("같은 코드라도 국적, 학력, 경력, 체류이력에 따라 심사 결과가 달라질 수 있어요.", "Even with the same visa code, outcomes can differ by nationality, education, career, and stay history.")}</li>
                <li>{t("서류 발급일·번역·공증 요건은 제출 직전에 다시 확인해 주세요.", "Please re-check document issue dates, translation, and notarization requirements right before submission.")}</li>
                <li>{t("체류기간과 취업 가능 범위는 허가 내용 기준으로 최종 확정돼요.", "Stay period and work scope are finalized by the actual permit details.")}</li>
              </ul>
            </section>
          </div>
        </div>
      </section>
    </ResourceSubPageLayout>
  );
}
