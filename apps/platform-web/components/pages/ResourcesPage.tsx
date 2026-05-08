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
  const t = (ko: string, en: string, zh: string = en, vi: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : en;

  const visaItems: ResourceItem[] = [
    {
      title: t(
        "대표 비자 유형 한눈에 보기",
        "Korea visa types at a glance",
        "韩国主要签证类型一览",
        "Tổng quan các loại visa Hàn Quốc"
      ),
      description: t(
        "유학/취업/인턴 관련 비자 정보를 빠르게 확인할 수 있어요.",
        "Quickly check visa options for study, work, and internships.",
        "快速查看留学、就业、实习相关签证信息。",
        "Xem nhanh các lựa chọn visa cho du học, việc làm và thực tập."
      ),
      href: "/resources/visa"
    },
    {
      title: t(
        "비자 코드별 상세 가이드",
        "Detailed guide by visa code",
        "按签证代码查看详细指南",
        "Hướng dẫn chi tiết theo mã visa"
      ),
      description: t(
        "신청 대상, 체류기간, 필요서류를 코드별로 자세히 확인해보세요.",
        "Review eligibility, stay period, and required documents by visa code.",
        "按签证代码详细查看申请对象、停留期限和所需材料。",
        "Xem chi tiết đối tượng, thời gian lưu trú và hồ sơ theo từng mã visa."
      ),
      href: "/resources/visa"
    }
  ];

  const documentRoadmap = [
    {
      title: t(
        "1단계: 입국 및 초기 정착",
        "Step 1: Entry & Initial Settlement",
        "第 1 阶段：入境与初步落地",
        "Bước 1: Nhập cảnh và ổn định ban đầu"
      ),
      subtitle: t(
        "가장 시급한 필수 서류",
        "Most urgent essential documents",
        "最紧急的必备材料",
        "Giấy tờ thiết yếu cần ưu tiên nhất"
      ),
      description: t(
        "한국 도착 후 신분증을 만들고 집을 구하는 데 필요한 최우선 서식입니다.",
        "Top-priority forms used right after arrival for ID issuance and housing.",
        "抵达韩国后办理身份证件和找房时最优先使用的表格。",
        "Các biểu mẫu ưu tiên hàng đầu khi đến Hàn Quốc để làm giấy tờ tùy thân và tìm nhà."
      ),
      items: [
        {
          title: t(
            "통합신청서(신고서)",
            "Application Form (Report Form)",
            "综合申请书（申报书）",
            "Đơn đăng ký tổng hợp (Đơn báo cáo)"
          ),
          usage: t(
            "외국인등록증 최초 발급, 체류기간 연장, 비자 변경 등 출입국사무소 핵심 업무 공통 서식",
            "Core all-purpose immigration form for ARC issuance, extension, and visa change",
            "外国人登录证首次发放、停留期限延长、签证变更等出入境业务通用表格",
            "Biểu mẫu chung cho các thủ tục cốt lõi tại sở xuất nhập cảnh: cấp ARC lần đầu, gia hạn lưu trú, đổi visa"
          ),
          linkLabel: t(
            "하이코리아 민원서식",
            "HiKorea forms",
            "HiKorea 民愿表格",
            "Biểu mẫu HiKorea"
          ),
          link: "https://www.hikorea.go.kr/board/BoardApplicationListR.pt"
        },
        {
          title: t(
            "주택임대차표준계약서 (영문 병기)",
            "Standard Housing Lease Agreement",
            "标准住宅租赁合同（含英文）",
            "Hợp đồng cho thuê nhà chuẩn (kèm tiếng Anh)"
          ),
          usage: t(
            "원룸·오피스텔 계약 시 사용. 영문 병기 서식 활용 시 계약 리스크 완화",
            "Used for housing contracts; bilingual format helps reduce contract risk",
            "用于单间公寓、商住公寓合同。使用韩英对照表格可降低合同风险",
            "Dùng khi ký hợp đồng one-room/officetel; bản song ngữ Hàn-Anh giúp giảm rủi ro hợp đồng"
          ),
          linkLabel: t(
            "법무부 주택임대차표준계약서",
            "MOJ standard lease form",
            "法务部标准住宅租赁合同",
            "Mẫu hợp đồng thuê nhà chuẩn của Bộ Tư pháp"
          ),
          link: "https://www.moj.go.kr/moj/315/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGbW9qJTJGMTE4JTJGNjA0MTkyJTJGYXJ0Y2xWaWV3LmRvJTNGcGFzc3dvcmQlM0QlMjZyZ3NCZ25kZVN0ciUzRCUyNmJic0NsU2VxJTNEJTI2cmdzRW5kZGVTdHIlM0QlMjZpc1ZpZXdNaW5lJTNEZmFsc2UlMjZwYWdlJTNEMSUyNmJic09wZW5XcmRTZXElM0QlMjZzcmNoQ29sdW1uJTNEJTI2c3JjaFdyZCUzRCUyNg%3D%3D"
        },
        {
          title: t(
            "거주/숙소 제공 확인서",
            "Confirmation of Residence/Accommodation",
            "居住 / 住所提供确认书",
            "Giấy xác nhận cung cấp chỗ ở / lưu trú"
          ),
          usage: t(
            "기숙사·지인 집 거주 등 본인 명의 임대차가 아닐 때 체류지 증빙용",
            "Proof of residence when lease is not under your own name",
            "在宿舍、亲友家居住等非本人名下租赁时用于证明居住地",
            "Dùng làm chứng minh nơi cư trú khi không thuê dưới tên của bạn (ký túc xá, nhà người quen, v.v.)"
          ),
          linkLabel: t(
            "하이코리아 민원서식",
            "HiKorea forms",
            "HiKorea 民愿表格",
            "Biểu mẫu HiKorea"
          ),
          link: "https://www.hikorea.go.kr/board/BoardApplicationListR.pt"
        }
      ]
    },
    {
      title: t(
        "2단계: 근로 및 일상생활 유지",
        "Step 2: Work & Daily Administration",
        "第 2 阶段：工作与日常生活维持",
        "Bước 2: Công việc và sinh hoạt hằng ngày"
      ),
      subtitle: t(
        "자주 쓰는 실생활 서류",
        "Frequently used practical forms",
        "经常使用的实用材料",
        "Giấy tờ thường dùng trong cuộc sống thực tế"
      ),
      description: t(
        "한국에서 일하고 이사하며 행정 업무를 볼 때 빈번히 필요한 서류입니다.",
        "Frequently used forms for work, moving, and day-to-day administration.",
        "在韩国工作、搬家及处理行政事务时经常需要的材料。",
        "Các giấy tờ thường xuyên cần khi làm việc, chuyển nhà và xử lý thủ tục hành chính tại Hàn Quốc."
      ),
      items: [
        {
          title: t(
            "표준근로계약서",
            "Standard Labor Contract",
            "标准劳动合同",
            "Hợp đồng lao động chuẩn"
          ),
          usage: t(
            "취업 시 사업주와 체결. 고용노동부 다국어 버전 활용 가능",
            "Employment contract with multilingual versions provided",
            "就业时与雇主签订。可使用雇用劳动部提供的多语言版本",
            "Ký với người sử dụng lao động khi đi làm. Có sẵn bản đa ngôn ngữ của Bộ Lao động"
          ),
          linkLabel: t(
            "고용24 근로계약서 검색",
            "Work24 labor contract search",
            "Work24 劳动合同检索",
            "Tìm hợp đồng lao động trên Work24"
          ),
          link: "https://www.work24.go.kr/cm/c/b/1100/selectBbttList.do?currentPageNo=1&recordCountPerPage=10&sortTycd=1&searchTxt=%EA%B7%BC%EB%A1%9C%EA%B3%84%EC%95%BD%EC%84%9C&searchTycd=1"
        },
        {
          title: t(
            "인턴 계약서",
            "Intern Contract",
            "实习合同",
            "Hợp đồng thực tập"
          ),
          usage: t(
            "양식은 근로계약서와 유사하나 문서 제목은 반드시 ‘인턴 계약서’ 명시",
            "Format is similar to labor contract, but title must clearly state intern contract",
            "格式与劳动合同相似，但文件标题必须明确标注「实习合同」",
            "Định dạng tương tự hợp đồng lao động, nhưng tiêu đề phải ghi rõ \"Hợp đồng thực tập\""
          )
        },
        {
          title: t(
            "체류지 변경 신고",
            "Report of Change of Residence",
            "居住地变更申报",
            "Khai báo thay đổi nơi cư trú"
          ),
          usage: t(
            "이사 시 필수. 이사 후 14일 이내 미신고 시 범칙금(최대 100만원) 가능",
            "Required after moving; delayed report (over 14 days) may incur penalty",
            "搬家时必须办理。搬家后 14 天内未申报可能被处罚（最高 100 万韩元）",
            "Bắt buộc khi chuyển nhà. Không khai báo trong vòng 14 ngày có thể bị phạt (tối đa 1.000.000 KRW)"
          ),
          linkLabel: t(
            "하이코리아 민원서식",
            "HiKorea forms",
            "HiKorea 民愿表格",
            "Biểu mẫu HiKorea"
          ),
          link: "https://www.hikorea.go.kr/board/BoardApplicationListR.pt"
        },
        {
          title: t(
            "외국인등록 사실증명 발급 신청",
            "Certificate of Alien Registration",
            "外国人登录事实证明申请",
            "Cấp giấy xác nhận đăng ký người nước ngoài"
          ),
          usage: t(
            "은행·대출·관공서 제출용 신분/주소 증명",
            "Official identity/address proof for banking and administration",
            "用于向银行、贷款机构、政府部门提交的身份 / 地址证明",
            "Giấy chứng minh nhân thân / địa chỉ để nộp cho ngân hàng, vay vốn, cơ quan hành chính"
          ),
          linkLabel: t(
            "법령별표서식(출입국관리법 시행규칙 서식138의2)",
            "Law form reference (Form 138-2)",
            "法规附表格式（出入境管理法施行规则 表格138之2）",
            "Mẫu pháp lý (Quy tắc thi hành Luật Xuất nhập cảnh - Mẫu 138-2)"
          ),
          link: "https://www.law.go.kr/%EB%B2%95%EB%A0%B9%EB%B3%84%ED%91%9C%EC%84%9C%EC%8B%9D/"
        },
        {
          title: t(
            "위임장",
            "Power of Attorney",
            "委托书",
            "Giấy ủy quyền"
          ),
          usage: t(
            "지인/행정사를 통한 대리 민원 처리 시 필요",
            "Needed when appointing an agent for civil processing",
            "通过亲友或行政士代办民愿事务时所需",
            "Cần khi nhờ người thân hoặc chuyên viên hành chính làm thay thủ tục"
          ),
          linkLabel: t(
            "하이코리아 민원서식",
            "HiKorea forms",
            "HiKorea 民愿表格",
            "Biểu mẫu HiKorea"
          ),
          link: "https://www.hikorea.go.kr/board/BoardApplicationListR.pt"
        }
      ]
    },
    {
      title: t(
        "3단계: 세무 및 연례/특수 행정",
        "Step 3: Tax & Annual/Special Administration",
        "第 3 阶段：税务及年度 / 特殊行政",
        "Bước 3: Thuế và thủ tục thường niên / đặc biệt"
      ),
      subtitle: t(
        "연 1회 또는 특정 상황",
        "Annual or special situations",
        "一年一次或特定情况",
        "Hằng năm hoặc tình huống đặc biệt"
      ),
      description: t(
        "정기 신고 또는 특정 요건에서만 필요한 서류입니다.",
        "Forms needed for annual filings or specific conditions.",
        "仅在定期申报或特定情况下需要的材料。",
        "Các giấy tờ chỉ cần khi khai báo định kỳ hoặc trong điều kiện cụ thể."
      ),
      items: [
        {
          title: t(
            "외국인 근로자 소득공제 신고서",
            "Income Deduction Form for Foreign Workers",
            "外国劳动者所得扣除申报书",
            "Đơn khai khấu trừ thu nhập cho người lao động nước ngoài"
          ),
          usage: t(
            "연말정산 시 사용. 국세청 영문 페이지에서 연도별 가이드 확인",
            "Used for year-end tax settlement with annual guides",
            "年终结算时使用。可在国税厅英文页面查看年度指南",
            "Dùng khi quyết toán thuế cuối năm. Xem hướng dẫn theo năm tại trang tiếng Anh của Cục Thuế"
          ),
          linkLabel: t(
            "국세청 영문 안내",
            "NTS English guide",
            "国税厅英文指南",
            "Hướng dẫn tiếng Anh của Cục Thuế NTS"
          ),
          link: "https://www.nts.go.kr/english/cm/cntnts/cntntsView.do?mi=10791&cntntsId=8664"
        },
        {
          title: t(
            "건강보험 피부양자 자격취득 신고서",
            "Health Insurance Dependent Registration",
            "健康保险被抚养人资格取得申报书",
            "Đơn đăng ký người phụ thuộc bảo hiểm y tế"
          ),
          usage: t(
            "가족을 피부양자로 등록할 때 필요",
            "Required when registering family dependents",
            "登记家属为被抚养人时所需",
            "Cần khi đăng ký người thân làm người phụ thuộc"
          ),
          linkLabel: t(
            "법령별표서식(국민건강보험법 시행규칙 서식1)",
            "Law form reference (NHIS Form 1)",
            "法规附表格式（国民健康保险法施行规则 表格1）",
            "Mẫu pháp lý (Quy tắc thi hành Luật Bảo hiểm Y tế Quốc dân - Mẫu 1)"
          ),
          link: "https://www.law.go.kr/%EB%B2%95%EB%A0%B9%EB%B3%84%ED%91%9C%EC%84%9C%EC%8B%9D/"
        },
        {
          title: t(
            "외국면허 교환발급 신청서",
            "Exchange of Foreign Driver's License",
            "外国驾照换发申请书",
            "Đơn đổi giấy phép lái xe nước ngoài"
          ),
          usage: t(
            "본국 면허를 한국 면허로 교환할 때 사용",
            "Used to exchange foreign license for a Korean license",
            "将本国驾照换为韩国驾照时使用",
            "Dùng khi đổi giấy phép lái xe nước ngoài sang Hàn Quốc"
          ),
          linkLabel: t(
            "도로교통공단 안내",
            "Road Traffic Authority guide",
            "道路交通公团指南",
            "Hướng dẫn của Cục An toàn Giao thông Đường bộ"
          ),
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
                {t("준비에 필요한 핵심 자료", "Essential resources for preparation", "准备所需核心资料", "Tài liệu cốt lõi cho quá trình chuẩn bị")}
              </div>
              <h1 className={`${paperlogy.className} mt-4 text-3xl font-black tracking-[-0.03em] md:text-5xl`}>
                {t("비자 · 정착 서류 자료실", "Visa · Settlement Document Resources", "签证 · 落地文件资料库", "Kho tài liệu visa · giấy tờ ổn định cuộc sống")}
              </h1>
              <p className="mt-4 text-sm leading-relaxed text-white/85 md:text-base">
                {t(
                  "한국 비자 정보와 정착·근로·행정에 필요한 핵심 서류를 한 곳에서 확인해보세요.",
                  "Find Korean visa information and essential documents for settlement, work, and administration in one place.",
                  "在这里一站式查看韩国签证信息及落地、工作、行政所需核心文件。",
                  "Xem thông tin visa Hàn Quốc và các giấy tờ cốt lõi cho ổn định, công việc và thủ tục hành chính tại một nơi."
                )}
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl bg-white/5">
                <Image
                  src="/img_resource_hero.webp"
                  alt={t(
                    "자료실 히어로 이미지",
                    "Resources hero image",
                    "资料库主图",
                    "Ảnh banner kho tài liệu"
                  )}
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
                title={t("한국 비자 정보", "Korean Visa Information", "韩国签证信息", "Thông tin visa Hàn Quốc")}
                description={t("비자 준비 전에 꼭 확인하면 좋은 핵심 정보", "Core information worth checking before visa preparation", "签证准备前建议先确认的核心信息", "Thông tin cốt lõi nên kiểm tra trước khi chuẩn bị visa")}
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
                      {t(
                        "외국인 정착·근로 서류 로드맵",
                        "Foreign Resident Document Roadmap",
                        "外国人落地与工作文件路线图",
                        "Lộ trình giấy tờ định cư và làm việc cho người nước ngoài"
                      )}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 md:text-base">
                      {t(
                        "입국부터 근로·세무까지 단계별로 자주 쓰는 핵심 서식을 정리했습니다.",
                        "A staged checklist of key forms from entry to work and tax.",
                        "整理了从入境到工作、税务各阶段常用的核心表格。",
                        "Tổng hợp các biểu mẫu cốt lõi thường dùng theo từng bước, từ nhập cảnh đến công việc và thuế."
                      )}
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
                                {item.linkLabel ?? t("바로가기", "Open link", "立即前往", "Mở liên kết")}
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
