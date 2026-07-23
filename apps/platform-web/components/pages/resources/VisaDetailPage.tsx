"use client";

import Link from "next/link";
import { CaretLeft as ChevronLeft } from "@phosphor-icons/react";
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
  const t = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;
  const pickVisaLabel = (item: NonNullable<ReturnType<typeof getFlatVisaItems>[number]>) =>
    locale === "ko" ? item.labelKo : locale === "zh-CN" ? item.labelZh : locale === "vi" ? item.labelVi : locale === "ja" ? item.labelJa : locale === "id" ? item.labelId : item.labelEn;
  const pickVisaApplicant = (item: NonNullable<ReturnType<typeof getFlatVisaItems>[number]>) =>
    locale === "ko" ? item.applicantKo : locale === "zh-CN" ? item.applicantZh : locale === "vi" ? item.applicantVi : locale === "ja" ? item.applicantJa : locale === "id" ? item.applicantId : item.applicantEn;
  const pickVisaDuration = (item: NonNullable<ReturnType<typeof getFlatVisaItems>[number]>) =>
    locale === "ko" ? item.durationKo : locale === "zh-CN" ? item.durationZh : locale === "vi" ? item.durationVi : locale === "ja" ? item.durationJa : locale === "id" ? item.durationId : item.durationEn;

  const normalizedCode = decodeURIComponent(code).toUpperCase();
  const visa = getFlatVisaItems().find((item) => item.code.toUpperCase() === normalizedCode);
  const crawled = VISA_DETAILS[normalizedCode];
  const pickLines = (
    ko: VisaStructuredLine[] | undefined,
    en: VisaStructuredLine[] | undefined,
    zh: VisaStructuredLine[] | undefined,
    vi: VisaStructuredLine[] | undefined,
    fallback: VisaStructuredLine[] | undefined
  ): VisaStructuredLine[] => {
    if (locale === "ko") return ko?.length ? ko : (fallback ?? []);
    if (locale === "zh-CN") return zh?.length ? zh : (en?.length ? en : (ko ?? fallback ?? []));
    if (locale === "vi") return vi?.length ? vi : (en?.length ? en : (ko ?? fallback ?? []));
    return en?.length ? en : (ko ?? fallback ?? []);
  };
  const descriptionLines = pickLines(
    crawled?.descriptionKo,
    crawled?.descriptionEn,
    crawled?.descriptionZh,
    crawled?.descriptionVi,
    crawled?.description
  );
  const candidateLines = pickLines(
    crawled?.candidatesKo,
    crawled?.candidatesEn,
    crawled?.candidatesZh,
    crawled?.candidatesVi,
    crawled?.candidates
  );
  const requirementLines = pickLines(
    crawled?.requirementsKo,
    crawled?.requirementsEn,
    crawled?.requirementsZh,
    crawled?.requirementsVi,
    crawled?.requirements
  );
  const crawledTitle =
    locale === "ko" ? crawled?.titleKo
    : locale === "zh-CN" ? (crawled?.titleZh ?? crawled?.titleEn)
    : locale === "vi" ? (crawled?.titleVi ?? crawled?.titleEn)
    : locale === "ja" ? crawled?.titleEn
    : locale === "id" ? crawled?.titleEn
    : crawled?.titleEn;

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
        titleZh="签证详情"
        titleVi="Chi tiết visa"
        descKo="요청하신 비자 정보를 찾지 못했어요."
        descEn="We couldn't find the requested visa information."
        descZh="未找到你请求的签证信息。"
        descVi="Không tìm thấy thông tin visa bạn yêu cầu."
        hideHero
      >
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-600">{t("해당 코드가 목록에 없어요.", "This code is not in the list.", "该代码不在列表中。", "Mã này không có trong danh sách.", "該当するコードはリストにありません。", "Kode ini tidak ada dalam daftar.")}</p>
          <Link href="/resources/visa" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#0B46E8] hover:underline">
            <ChevronLeft className="h-4 w-4" />
            {t("비자 목록으로 돌아가기", "Back to visa list", "返回签证列表", "Quay lại danh sách visa", "ビザ一覧へ戻る", "Kembali ke daftar visa")}
          </Link>
        </section>
      </ResourceSubPageLayout>
    );
  }

  return (
    <ResourceSubPageLayout
      titleKo={`${visa.code} 비자 상세`}
      titleEn={`${visa.code} Visa Detail`}
      titleZh={`${visa.code} 签证详情`}
      titleVi={`Chi tiết visa ${visa.code}`}
      descKo="내부에 저장된 비자 상세 정보를 코드별로 정리해 보여드려요."
      descEn="We show visa details from internally stored static data."
      descZh="按代码展示系统内保存的签证详情数据。"
      descVi="Hiển thị thông tin chi tiết visa theo mã từ dữ liệu tĩnh đã lưu trong hệ thống."
      hideHero
      backHref="/resources/visa"
      backKo="비자 목록으로"
      backEn="Back to visa list"
      backZh="返回签证列表"
      backVi="Quay lại danh sách visa"
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <div>
          <p className={`${paperlogy.className} text-3xl font-black tracking-[-0.02em] md:text-4xl ${visa.accentClass}`}>
            {visa.code} ({pickVisaLabel(visa)})
          </p>
          <p className="mt-2 text-sm text-slate-700 md:text-base">
            <span className="font-semibold">{t("신청대상", "Applicants", "申请对象", "Đối tượng nộp hồ sơ", "申請対象", "Sasaran Pengajuan")}:</span> {pickVisaApplicant(visa)}
          </p>
          <p className="mt-1 text-sm text-slate-700 md:text-base">
            <span className="font-semibold">{t("체류기간", "Stay period", "停留期限", "Thời gian lưu trú", "滞在期間", "Periode Tinggal")}:</span> {pickVisaDuration(visa)}
          </p>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="space-y-5">
            <p className="text-base font-black text-[#0B1227] md:text-lg">
              {crawledTitle ?? t(
                `${visa.code} ${visa.labelKo} 비자 안내`,
                `${visa.code} ${visa.labelEn} Visa Guide`,
                `${visa.code} ${visa.labelZh} 签证指南`,
                `Hướng dẫn visa ${visa.code} ${visa.labelVi}`,
                `${visa.code} ${visa.labelJa} ビザ案内`,
                `Panduan Visa ${visa.code} ${visa.labelId}`
              )}
            </p>

            <section className="rounded-2xl bg-slate-50 p-4">
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("한눈에 보기", "Quick Overview", "快速概览", "Tổng quan nhanh", "ひと目で見る", "Sekilas Pandang")}</h3>
              <ul className="mt-2 space-y-1 text-sm text-slate-700 md:text-base">
                <li>
                  <span className="font-semibold">{t("이 비자는 이런 분께 맞아요", "Best for", "适合人群", "Phù hợp với", "このビザはこのような方に向いています", "Cocok untuk")}:</span>{" "}
                  {pickVisaApplicant(visa)}
                </li>
                <li>
                  <span className="font-semibold">{t("보통 체류기간", "Typical stay", "常见停留期限", "Thời gian lưu trú phổ biến", "通常の滞在期間", "Periode Tinggal Umum")}:</span>{" "}
                  {pickVisaDuration(visa)}
                </li>
                <li>
                  <span className="font-semibold">{t("준비 포인트", "What to prepare", "准备要点", "Điểm cần chuẩn bị", "準備のポイント", "Hal yang Perlu Disiapkan")}:</span>{" "}
                  {t(
                    "여권, 신청서, 사진은 기본이고 자격별 추가 서류를 꼭 확인해 주세요.",
                    "Passport, application form, and photo are basic. Check additional documents by visa type.",
                    "护照、申请表和证件照是基础材料，请务必确认各签证类型的附加文件。",
                    "Hộ chiếu, đơn đăng ký và ảnh là giấy tờ cơ bản. Hãy kiểm tra thêm hồ sơ bổ sung theo từng loại visa.",
                    "パスポート、申請書、写真は基本であり、資格別の追加書類を必ずご確認ください。",
                    "Paspor, formulir pengajuan, dan foto adalah dokumen dasar. Pastikan untuk memeriksa dokumen tambahan sesuai jenis visa."
                  )}
                </li>
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("상세 설명", "Detailed Description", "详细说明", "Mô tả chi tiết", "詳細説明", "Penjelasan Detail")}</h3>
              {descriptionLines.length
                ? renderStructured(descriptionLines)
                : (
                  <div className="mt-2 space-y-1 text-sm text-slate-700 md:text-base">
                    <p>
                      {pickVisaApplicant(visa)}
                    </p>
                    <p>
                      {t("체류기간 기준", "Stay period reference", "停留期限参考", "Mốc tham chiếu thời gian lưu trú", "滞在期間の基準", "Acuan Periode Tinggal")}: {pickVisaDuration(visa)}
                    </p>
                  </div>
                )}
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("누가 신청할 수 있나요?", "Who can apply?", "谁可以申请？", "Ai có thể nộp hồ sơ?", "誰が申請できますか？", "Siapa yang dapat mengajukan?")}</h3>
              {candidateLines.length
                ? renderStructured(candidateLines)
                : (
                  <div className="mt-2 space-y-1 text-sm text-slate-700 md:text-base">
                    <p>
                      {pickVisaApplicant(visa)}
                    </p>
                  </div>
                )}
            </section>

            <section>
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("준비해야 할 서류", "Required Documents", "所需材料", "Hồ sơ cần chuẩn bị", "準備すべき書類", "Dokumen yang Diperlukan")}</h3>
              {requirementLines.length
                ? renderStructured(requirementLines)
                : (
                  <div className="mt-2 space-y-1 text-sm text-slate-700 md:text-base">
                    <p>
                      {t("여권", "Passport", "护照", "Hộ chiếu", "パスポート", "Paspor")}
                    </p>
                    <p>
                      {t("비자 신청서", "Visa application form", "签证申请表", "Đơn xin visa", "ビザ申請書", "Formulir Pengajuan Visa")}
                    </p>
                    <p>
                      {t("사진", "ID photo", "证件照", "Ảnh thẻ", "証明写真", "Pas Foto")}
                    </p>
                    <p>
                      {t("추가 증빙서류(자격별 상이)", "Additional supporting documents (varies by status)", "附加证明材料（因资格而异）", "Hồ sơ bổ sung (khác nhau theo từng diện)", "追加の証明書類（資格により異なる）", "Dokumen pendukung tambahan (berbeda menurut status)")}
                    </p>
                  </div>
                )}
            </section>

            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <h3 className="text-sm font-black text-[#0B1227] md:text-base">{t("주의할 점", "What to watch out for", "注意事项", "Lưu ý", "注意点", "Hal yang Perlu Diperhatikan")}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 md:text-base">
                <li>{t("같은 코드라도 국적, 학력, 경력, 체류이력에 따라 심사 결과가 달라질 수 있어요.", "Even with the same visa code, outcomes can differ by nationality, education, career, and stay history.", "即使同一代码，审核结果也可能因国籍、学历、经历和居留记录而不同。", "Dù cùng mã visa, kết quả xét duyệt vẫn có thể khác theo quốc tịch, học vấn, kinh nghiệm và lịch sử cư trú.", "同じコードであっても、国籍・学歴・経歴・滞在歴によって審査結果が異なる場合があります。", "Meski dengan kode yang sama, hasil penilaian dapat berbeda tergantung kewarganegaraan, pendidikan, pengalaman, dan riwayat tinggal.")}</li>
                <li>{t("서류 발급일·번역·공증 요건은 제출 직전에 다시 확인해 주세요.", "Please re-check document issue dates, translation, and notarization requirements right before submission.", "请在提交前再次确认材料签发日期、翻译和公证要求。", "Hãy kiểm tra lại ngày cấp giấy tờ, yêu cầu dịch thuật và công chứng ngay trước khi nộp.", "書類の発行日・翻訳・公証要件は提出直前に再度ご確認ください。", "Mohon periksa kembali tanggal penerbitan dokumen, terjemahan, dan persyaratan legalisasi tepat sebelum pengajuan.")}</li>
                <li>{t("체류기간과 취업 가능 범위는 허가 내용 기준으로 최종 확정돼요.", "Stay period and work scope are finalized by the actual permit details.", "停留期限和可就业范围以最终获批内容为准。", "Thời gian lưu trú và phạm vi được phép làm việc sẽ được chốt theo nội dung cấp phép cuối cùng.", "滞在期間と就労可能範囲は、許可内容に基づいて最終的に確定されます。", "Periode tinggal dan ruang lingkup kerja akan ditetapkan secara final berdasarkan isi izin yang diberikan.")}</li>
              </ul>
            </section>
          </div>
        </div>
      </section>
    </ResourceSubPageLayout>
  );
}
