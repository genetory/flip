"use client";

import { CheckCircle as CheckCircle2 } from "@phosphor-icons/react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { ResourceSubPageLayout } from "./ResourceSubPageLayout";

export function DocumentsResourcesPage() {
  const { locale } = useLanguage();
  const t = (ko: string, en: string, zh: string, vi: string, ja?: string, id?: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? (ja ?? en) : locale === "id" ? (id ?? en) : en;

  const docs = [
    {
      title: t("신분/학력 기본 서류", "Identity & academic basics", "身份/学历基础材料", "Hồ sơ cơ bản về danh tính/học vấn", "身分・学歴の基本書類", "Dokumen dasar identitas & akademik"),
      items: [
        t("여권 사본", "Passport copy", "护照复印件", "Bản sao hộ chiếu", "パスポートのコピー", "Salinan paspor"),
        t("재학/졸업 증명서", "Enrollment or graduation certificate", "在学/毕业证明", "Giấy xác nhận đang học/tốt nghiệp", "在学・卒業証明書", "Surat keterangan terdaftar atau ijazah"),
        t("성적 증명서", "Transcript", "成绩单", "Bảng điểm", "成績証明書", "Transkrip nilai")
      ]
    },
    {
      title: t("지원용 추가 서류", "Application supporting docs", "申请补充材料", "Hồ sơ bổ sung khi ứng tuyển", "応募用の追加書類", "Dokumen pendukung pengajuan"),
      items: [
        t("자기소개서 또는 동기서", "Statement of purpose / motivation", "自我介绍/动机信", "Thư giới thiệu hoặc thư động lực", "自己紹介書または志望動機書", "Surat pernyataan diri atau motivasi"),
        t("포트폴리오(해당 직무)", "Portfolio (role-dependent)", "作品集（按岗位）", "Portfolio (tùy vị trí)", "ポートフォリオ（職務に応じて）", "Portofolio (sesuai posisi)"),
        t("자격증·수료증(선택)", "Certificates (optional)", "资格证/结业证（可选）", "Chứng chỉ (tùy chọn)", "資格証・修了証（任意）", "Sertifikat kompetensi atau penyelesaian (opsional)")
      ]
    }
  ];

  return (
    <ResourceSubPageLayout
      titleKo="기타 서류 안내"
      titleEn="Additional Document Guidance"
      titleZh="其他材料指南"
      titleVi="Hướng dẫn hồ sơ bổ sung"
      titleJa="その他の書類案内"
      titleId="Panduan Dokumen Tambahan"
      descKo="지원 과정에서 자주 요구되는 서류를 항목별로 정리했습니다."
      descEn="A practical breakdown of documents commonly requested during applications."
      descZh="按项目整理了申请过程中常被要求的材料。"
      descVi="Tổng hợp theo từng hạng mục các giấy tờ thường được yêu cầu trong quá trình ứng tuyển."
      descJa="応募過程でよく求められる書類を項目別に整理しました。"
      descId="Rincian praktis dokumen yang umum diminta selama proses pelamaran."
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("서류 카테고리", "Document Categories", "材料分类", "Danh mục hồ sơ", "書類カテゴリー", "Kategori Dokumen")}</h2>
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
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("제출 전 확인", "Before Submission", "提交前检查", "Kiểm tra trước khi nộp", "提出前のチェック", "Periksa Sebelum Pengajuan")}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
          {t(
            "서류의 발급일, 영문명 표기 일치 여부, 스캔 품질(PDF 가독성)까지 마지막으로 점검하면 반려 가능성을 줄일 수 있어요.",
            "A final check on issue dates, name consistency, and scan readability can reduce rejection risk.",
            "最后检查材料签发日期、英文姓名一致性和扫描清晰度（PDF可读性），可降低被退回的风险。",
            "Kiểm tra lần cuối ngày cấp giấy tờ, tính nhất quán tên tiếng Anh và độ rõ file scan (PDF) sẽ giúp giảm rủi ro bị từ chối.",
            "書類の発行日、英文氏名の表記一致、スキャン品質（PDFの読みやすさ）を最後に確認することで、差し戻しのリスクを減らすことができます。",
            "Memeriksa kembali tanggal penerbitan dokumen, konsistensi nama dalam huruf Latin, dan kualitas hasil pindai (keterbacaan PDF) sebelum pengajuan dapat mengurangi risiko penolakan."
          )}
        </p>
      </section>
    </ResourceSubPageLayout>
  );
}
