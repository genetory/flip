"use client";

import { FileText } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageProvider";
import { ResourceSubPageLayout } from "./ResourceSubPageLayout";

export function ResumeResourcesPage() {
  const { locale } = useLanguage();
  const t = (ko: string, en: string, zh: string, vi: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : en;

  const templates = [
    {
      name: t("국문 이력서 기본형", "Korean Resume - Basic", "韩文简历基础版", "CV tiếng Hàn - Mẫu cơ bản"),
      desc: t("국내 기업 지원에 맞춘 표준 레이아웃", "Standard layout for Korean-company applications", "适用于韩国企业申请的标准版式", "Bố cục chuẩn cho ứng tuyển doanh nghiệp Hàn Quốc")
    },
    {
      name: t("영문 이력서 기본형", "English Resume - Basic", "英文简历基础版", "CV tiếng Anh - Mẫu cơ bản"),
      desc: t("해외·글로벌 포지션 지원용 레이아웃", "A clean format for global opportunities", "适用于海外/国际岗位申请的版式", "Bố cục phù hợp để ứng tuyển vị trí toàn cầu")
    },
    {
      name: t("직무 강조형 이력서", "Role-focused Resume", "岗位能力重点简历", "CV nhấn mạnh năng lực theo vị trí"),
      desc: t("경험보다 역량 강조가 필요한 직무에 적합", "Great when role-fit and skills should stand out", "适合更强调能力匹配而非经历的岗位", "Phù hợp với vị trí cần nhấn mạnh năng lực hơn kinh nghiệm")
    }
  ];

  return (
    <ResourceSubPageLayout
      titleKo="이력서 양식"
      titleEn="Resume Templates"
      titleZh="简历模板"
      titleVi="Mẫu CV"
      descKo="국문/영문 이력서 양식과 작성 포인트를 빠르게 확인해보세요."
      descEn="Quickly review Korean/English resume formats and key writing points."
      descZh="快速查看韩文/英文简历模板与撰写要点。"
      descVi="Xem nhanh mẫu CV tiếng Hàn/tiếng Anh và các điểm viết quan trọng."
    >
      <section className="rounded-3xl border border-slate-200 bg-white p-6 md:p-7">
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("추천 양식", "Recommended Formats", "推荐模板", "Mẫu đề xuất")}</h2>
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
        <h2 className="text-xl font-extrabold text-[#0B1227] md:text-2xl">{t("작성 팁", "Writing Tips", "撰写技巧", "Mẹo viết hồ sơ")}</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-700 md:text-base">
          <li>• {t("지원 직무와 직접 연결되는 경험을 상단에 배치하세요.", "Put role-relevant experience near the top.", "将与目标岗位直接相关的经历放在上方。", "Đặt kinh nghiệm liên quan trực tiếp đến vị trí ứng tuyển ở phần trên.")}</li>
          <li>• {t("성과는 가능하면 숫자로 표현하세요.", "Use measurable outcomes whenever possible.", "尽量用数字呈现成果。", "Hãy thể hiện thành tích bằng số liệu khi có thể.")}</li>
          <li>• {t("한 페이지 내 핵심 정보가 빠르게 보이도록 구성하세요.", "Keep key information quickly scannable on one page.", "尽量在一页内让核心信息一目了然。", "Sắp xếp để thông tin cốt lõi dễ quét nhanh trong một trang.")}</li>
        </ul>
      </section>
    </ResourceSubPageLayout>
  );
}
