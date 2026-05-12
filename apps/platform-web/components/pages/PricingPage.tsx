"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";

export function PricingPage() {
  const { locale } = useLanguage();
  const t = (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? (zh ?? en) : locale === "vi" ? (vi ?? en) : locale === "ja" ? (ja ?? en) : locale === "id" ? (id ?? en) : en;
  const refundCardRef = useRef<HTMLElement | null>(null);
  const [isRefundCardVisible, setIsRefundCardVisible] = useState(false);
  const priceSuffixClassName = "text-sm font-semibold md:text-base";

  const copy = {
    title: t(
      "내 상황에 맞춰 선택하는 이용 플랜",
      "Service plans tailored to your situation",
      "为你量身定制的服务套餐",
      "Gói dịch vụ phù hợp với tình huống của bạn"
    ),
    description: t(
      "Aply는 시작부터 확장까지, 현재 상황에 맞게 부담 없이 선택할 수 있는 플랜을 제공합니다.",
      "From getting started to scaling, Aply provides plans you can choose with confidence based on your current situation.",
      "从入门到扩展,Aply 提供可以根据当前情况轻松选择的套餐。",
      "Từ khởi đầu đến mở rộng, Aply cung cấp các gói phù hợp với hoàn cảnh hiện tại của bạn."
    ),
    note: t(
      "정확한 비용은 포지션 수, 운영 범위, 지원 형태에 따라 달라질 수 있어요.",
      "Final pricing may vary depending on the number of positions, operating scope, and support format.",
      "最终费用可能因职位数量、运营范围和支持形式而有所不同。",
      "Chi phí cuối cùng có thể thay đổi tùy theo số lượng vị trí, phạm vi vận hành và hình thức hỗ trợ."
    ),
    refundCard: {
      title: t("탈락 시 100% 환불", "100% Refund if Not Accepted", "未通过 100% 退款", "Hoàn 100% nếu không được chọn", "不合格時は100％返金", "Pengembalian 100% jika tidak diterima"),
      subtitle: t("부담 없이 도전하세요", "Apply with confidence", "无负担参与", "Hãy ứng tuyển một cách tự tin", "気軽に挑戦してください", "Ajukan dengan percaya diri"),
      description: t(
        "결제 후 서류 제출과 면접 심사를 진행합니다. 심사에 통과한 분만 프로그램에 참여하며, 탈락 시 결제 금액은 100% 전액 환불됩니다.",
        "After payment, you will proceed with document submission and interview screening. Only candidates who pass the review join the program, and those not accepted receive a full 100% refund.",
        "付款后将进行材料提交和面试审核。仅通过审核的人员可参与项目,未通过者将获得 100% 全额退款。",
        "Sau khi thanh toán, bạn sẽ nộp hồ sơ và phỏng vấn. Chỉ ứng viên vượt qua kỳ thẩm định mới được tham gia chương trình, người không được chọn sẽ được hoàn 100% chi phí."
      ),
      processSteps: [
        { label: t("결제 완료", "Payment complete", "完成付款", "Hoàn tất thanh toán", "決済完了", "Pembayaran selesai"), imageSrc: "/img_process_0.webp" },
        { label: t("프로필 제출", "Profile submission", "提交资料", "Nộp hồ sơ", "プロフィール提出", "Pengajuan profil"), imageSrc: "/img_process_1.webp" },
        { label: t("심사 진행", "Screening", "审核进行中", "Đang thẩm định", "審査中", "Penilaian"), imageSrc: "/img_process_2.webp" },
        { label: t("프로그램 참여", "Program participation", "参与项目", "Tham gia chương trình", "プログラム参加", "Mengikuti program"), imageSrc: "/img_process_3.webp" }
      ]
    },
    housing: {
      titleTop: t("집 구하기 걱정 없이,", "Focus on your career,", "无需为找房烦恼,", "Đừng lo chuyện tìm nhà,", "住まい探しの心配なく、", "Tanpa khawatir mencari tempat tinggal,"),
      titleBottom: t("커리어에만 집중하세요.", "not on finding housing.", "只需专注于职业发展。", "hãy tập trung vào sự nghiệp.", "キャリアだけに集中してください。", "fokuslah pada karier Anda."),
      description: t(
        "Career Bridge 참가자에게만 제공되는 프리미엄 주거 옵션",
        "Premium housing options available exclusively for Career Bridge participants",
        "仅 Career Bridge 参与者可享的高端住宿选择",
        "Lựa chọn nhà ở cao cấp dành riêng cho thành viên Career Bridge"
      ),
      note: t(
        "💡 주거 옵션은 프로그램 참가의 필수 조건이 아닙니다. 숙소가 필요하신 분만 별도로 신청하실 수 있습니다.",
        "💡 Housing is not required to participate in the program. You may apply separately only if accommodation is needed.",
        "💡 住宿不是参与项目的必要条件,如需住宿可单独申请。",
        "💡 Nhà ở không bắt buộc khi tham gia chương trình. Chỉ những ai cần chỗ ở mới đăng ký riêng."
      ),
      privateRoom: {
        name: t("Private Room (1인실)", "Private Room (Single)", "Private Room (单人间)", "Private Room (Phòng đơn)", "Private Room（個室）", "Private Room (Kamar tunggal)"),
        location: t(
          "📍 서울 내 위치, 교통 편리",
          "📍 Located in Seoul with convenient transportation",
          "📍 位于首尔,交通便利",
          "📍 Tại Seoul, giao thông thuận tiện"
        ),
        summary: t(
          "나만의 편안한 휴식 공간",
          "Your own private and comfortable living space",
          "属于你自己的舒适私人空间",
          "Không gian riêng tư và thoải mái của bạn"
        ),
        price: t(
          "₩700,000~2,000,000 월 (1인당)",
          "₩700,000~2,000,000 per month (per person)",
          "₩700,000~2,000,000 每月 (每人)",
          "₩700,000~2,000,000 mỗi tháng (mỗi người)"
        )
      },
      sharedRoom: {
        name: t("Shared Room (2인실)", "Shared Room (Double)", "Shared Room (双人间)", "Shared Room (Phòng đôi)", "Shared Room（2人部屋）", "Shared Room (Kamar ganda)"),
        location: t(
          "📍 서울 내 위치, 교통 편리",
          "📍 Located in Seoul with convenient transportation",
          "📍 位于首尔,交通便利",
          "📍 Tại Seoul, giao thông thuận tiện"
        ),
        summary: t(
          "합리적인 비용과 네트워킹",
          "A cost-effective option with built-in networking opportunities",
          "经济实惠并有社交机会",
          "Tiết kiệm chi phí và có cơ hội kết nối"
        ),
        price: t(
          "₩400,000~1,100,000 월 (1인당)",
          "₩400,000~1,100,000 per month (per person)",
          "₩400,000~1,100,000 每月 (每人)",
          "₩400,000~1,100,000 mỗi tháng (mỗi người)"
        )
      },
      disclaimer: t(
        "※ 제휴된 숙소의 예약 현황에 따라 실제 배정되는 숙소는 상이할 수 있습니다.",
        "※ Actual accommodation assignments may vary depending on availability at partnered properties.",
        "※ 实际分配的住宿可能因合作住宿的预订情况而有所不同。",
        "※ Nhà ở thực tế được phân bổ có thể khác nhau tùy theo tình trạng đặt phòng tại các cơ sở liên kết."
      )
    }
  };

  const renderHousingPrice = (price: string) => {
    if (price.includes(" 월 (1인당)")) {
      const [main] = price.split(" 월 (1인당)");
      return (
        <>
          <span className={priceSuffixClassName}>월 (1인당)</span>
          <div className="mt-1 flex items-end gap-1">
            <span className="whitespace-nowrap font-display text-2xl font-bold tracking-tight md:text-3xl">{main}</span>
            <span className={priceSuffixClassName}>KRW</span>
          </div>
        </>
      );
    }

    if (price.includes(" per month (per person)")) {
      const [main] = price.split(" per month (per person)");
      return (
        <>
          <span className={priceSuffixClassName}>per month (per person)</span>
          <div className="mt-1 flex items-end gap-1">
            <span className="whitespace-nowrap font-display text-2xl font-bold tracking-tight md:text-3xl">{main}</span>
            <span className={priceSuffixClassName}>KRW</span>
          </div>
        </>
      );
    }

    const parts = price.split("/");
    if (parts.length < 2) {
      return <span>{price}</span>;
    }
    const main = parts[0]?.trim() ?? price;
    const suffix = parts[1]?.trim() ?? "";
    return (
      <>
        {main}
        {suffix ? <span className={`ml-1 ${priceSuffixClassName}`}>{suffix}</span> : null}
      </>
    );
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
              <h1 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-black md:text-5xl`}>{copy.title}</h1>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{copy.description}</p>
            </div>

            <div className="mx-auto mt-10 w-full max-w-4xl space-y-10">
              <div className="w-full">
                <Image
                  src="/img_workperience_hero.webp"
                  alt={t("일경험 소개 이미지", "Work experience hero image", "工作经验介绍图片", "Hình ảnh giới thiệu trải nghiệm công việc", "就労体験紹介イメージ", "Gambar pengantar pengalaman kerja")}
                  width={1600}
                  height={900}
                  className="h-[220px] w-full object-contain md:h-[280px]"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
              </div>
              <div className="grid w-full gap-3 md:grid-cols-2 md:items-stretch">
                  <article className="flex h-full w-full flex-col rounded-2xl bg-white p-5 text-[#111111] shadow-card md:p-6">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#B7FF5A] px-2.5 py-1 text-[11px] font-semibold text-black">
                      {t("진행중", "In Progress", "进行中", "Đang triển khai", "進行中", "Berlangsung")}
                    </span>
                    <h4 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] md:text-2xl`}>{t("해외 대학 출신 일경험", "Work Experience for Overseas Graduates", "海外大学毕业生工作经验", "Trải nghiệm việc làm cho cử nhân từ nước ngoài", "海外大学出身者向けの就労体験", "Pengalaman Kerja untuk Lulusan Universitas Luar Negeri")}</h4>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{t("해외 대학 출신을 위한 한국 기업 일경험", "Korean-company work experience for overseas graduates", "面向海外大学毕业生的韩国企业工作体验", "Trải nghiệm làm việc tại doanh nghiệp Hàn Quốc dành cho cử nhân nước ngoài", "海外大学出身者向けの韓国企業就労体験", "Pengalaman kerja di perusahaan Korea untuk lulusan luar negeri")}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground md:text-sm">
                      {t(
                        "한국 기업의 업무 방식과 직무 문화를 짧은 기간 경험할 수 있는 교육 목적 프로그램입니다. 한국 취업을 바로 보장하는 과정이 아니라, 한국 기업과 산업을 먼저 이해하고 향후 취업 가능성을 탐색하는 데 적합합니다.",
                        "An education-focused program to experience Korean work style and job culture over a short period. It does not guarantee employment and helps participants explore future career possibilities.",
                        "这是一个以教育为目的的项目,可在短期内体验韩国企业的工作方式和职务文化。本项目并不直接保证韩国就业,适合先了解韩国企业和行业,再探索未来就业可能性的人士。",
                        "Đây là chương trình mang tính giáo dục, giúp bạn trải nghiệm phong cách làm việc và văn hóa công sở Hàn Quốc trong thời gian ngắn. Chương trình không đảm bảo việc làm mà giúp bạn tìm hiểu doanh nghiệp Hàn Quốc và khám phá cơ hội việc làm trong tương lai."
                      )}
                    </p>
                    <div className="mt-4 overflow-x-auto rounded-xl bg-white/92">
                      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                        <tbody>
                          <tr className="border-b border-border/60"><th className="w-24 bg-muted/30 px-3 py-2 font-semibold">{t("대상", "Target", "对象", "Đối tượng", "対象", "Sasaran")}</th><td className="px-3 py-2">{t("해외 대학 출신", "Overseas university graduates", "海外大学毕业生", "Cử nhân từ đại học nước ngoài", "海外大学出身者", "Lulusan universitas luar negeri")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("목적", "Purpose", "目的", "Mục đích", "目的", "Tujuan")}</th><td className="px-3 py-2">{t("한국 기업 일경험 및 직무 이해", "Korean-company work experience and role understanding", "韩国企业工作经验及岗位理解", "Trải nghiệm làm việc và hiểu biết về vị trí tại doanh nghiệp Hàn Quốc", "韓国企業の就労体験および職務理解", "Pengalaman kerja dan pemahaman peran di perusahaan Korea")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("급여", "Salary", "薪资", "Lương", "給与", "Gaji")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("참여비", "Applicant fee", "参与费", "Phí tham gia", "参加費", "Biaya partisipasi")}</th><td className="px-3 py-2">2,000,000원</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기업 수수료", "Company fee", "企业费用", "Phí doanh nghiệp", "企業手数料", "Biaya perusahaan")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("수료증", "Certificate", "结业证书", "Chứng chỉ", "修了証", "Sertifikat")}</th><td className="px-3 py-2">{t("발급", "Provided", "提供", "Cấp", "発行", "Diberikan")}</td></tr>
                          <tr><th className="bg-muted/30 px-3 py-2 font-semibold">{t("전환 가능성", "Conversion", "转正可能性", "Khả năng chuyển đổi", "正社員転換の可能性", "Kemungkinan konversi")}</th><td className="px-3 py-2">{t("전환 가능, 보장하지 않음", "Possible, not guaranteed", "可转正，不保证", "Có thể chuyển đổi, không đảm bảo", "転換は可能、保証なし", "Mungkin, tidak dijamin")}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{t("제공 내용", "What is provided", "提供内容", "Nội dung được cung cấp", "提供内容", "Yang disediakan")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("직무 교육 제공 (플리퍼스)", "Job orientation/training (Flipers)", "职务培训提供 (Flipers)", "Đào tạo nghiệp vụ (Flipers)", "職務教育の提供（Flipers）", "Pelatihan jabatan (Flipers)")}</li>
                        <li>{t("수료증 발급 (플리퍼스)", "Completion certificate (Flipers)", "结业证书发放 (Flipers)", "Cấp chứng chỉ hoàn thành (Flipers)", "修了証の発行（Flipers）", "Penerbitan sertifikat (Flipers)")}</li>
                        <li>{t("정기 면담, 과제, 피드백 (기업 협조 기반)", "Periodic check-ins, tasks, and feedback (company-supported)", "定期面谈、任务、反馈（基于企业配合）", "Gặp mặt định kỳ, nhiệm vụ, phản hồi (dựa trên hỗ trợ doanh nghiệp)", "定期面談、課題、フィードバック（企業協力に基づく）", "Pertemuan rutin, tugas, dan umpan balik (didukung perusahaan)")}</li>
                        <li>{t("추천서 제공은 기업 희망 시 자율 진행", "Recommendation letter only if the company chooses to provide it", "推荐信由企业自主决定是否提供", "Thư giới thiệu được cung cấp tùy doanh nghiệp", "推薦状の提供は企業の希望により任意で実施", "Surat rekomendasi diberikan hanya jika perusahaan memilih untuk memberikannya")}</li>
                      </ul>
                    </div>
                    <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                      {t(
                        "채용이나 전환이 보장되는 과정은 아니며, 한국 기업과 직무를 경험하기 위한 교육형 프로그램입니다.",
                        "This is an educational experience track and does not guarantee hiring or conversion.",
                        "本项目不保证录用或转正,而是体验韩国企业及职务的教育型项目。",
                        "Đây là chương trình giáo dục trải nghiệm, không đảm bảo tuyển dụng hay chuyển đổi thành nhân viên chính thức."
                      )}
                    </p>
                  </article>
                  <article className="h-full w-full rounded-2xl bg-white p-5 text-[#111111] shadow-card md:p-6">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#B7FF5A] px-2.5 py-1 text-[11px] font-semibold text-black">
                      {t("진행중", "In Progress", "进行中", "Đang triển khai", "進行中", "Berlangsung")}
                    </span>
                    <h4 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] md:text-2xl`}>{t("국내 대학 재학생 및 졸업생 일경험", "Work Experience for Korean-University Students/Graduates", "韩国大学在读生及毕业生的工作体验", "Trải nghiệm việc làm cho sinh viên và cựu sinh viên đại học Hàn Quốc", "韓国国内大学の在学生・卒業生向け就労体験", "Pengalaman Kerja untuk Mahasiswa/Lulusan Universitas Korea")}</h4>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{t("국내 대학 유학생을 위한 실무 일경험", "Practical work experience for international students in Korean universities", "面向韩国大学留学生的实务工作体验", "Trải nghiệm làm việc thực tế dành cho du học sinh tại các trường đại học Hàn Quốc", "韓国の大学に在籍する留学生のための実務就労体験", "Pengalaman kerja praktis untuk mahasiswa internasional di universitas Korea")}</p>
                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground md:text-sm">
                      {t(
                        "국내 대학 재학생 및 졸업생이 한국 기업의 직무 환경을 경험해볼 수 있는 교육형 프로그램입니다. 학교 연계나 학점 인정이 필요한 경우, 필요한 서류 작업을 함께 조율할 수 있습니다.",
                        "An education-focused track for students and graduates in Korean universities to experience Korean-company job environments, with school-linked documentation support when needed.",
                        "面向韩国大学在读及毕业生的教育型项目,可体验韩国企业的工作环境;如需校方对接或学分认定,可协调相关文件。",
                        "Chương trình giáo dục dành cho sinh viên và cựu sinh viên các trường đại học Hàn Quốc trải nghiệm môi trường làm việc tại doanh nghiệp Hàn Quốc; có thể phối hợp giấy tờ liên kết với nhà trường khi cần."
                      )}
                    </p>
                    <div className="mt-4 overflow-x-auto rounded-xl bg-white/96 text-[#1f2342]">
                      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                        <tbody>
                          <tr className="border-b border-border/60"><th className="w-24 bg-muted/30 px-3 py-2 font-semibold">{t("대상", "Target", "对象", "Đối tượng", "対象", "Sasaran")}</th><td className="px-3 py-2">{t("국내 대학 재학생 및 졸업생", "Students/graduates of Korean universities", "韩国大学在读生及毕业生", "Sinh viên và cựu sinh viên đại học Hàn Quốc", "韓国国内大学の在学生・卒業生", "Mahasiswa/lulusan universitas Korea")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("목적", "Purpose", "目的", "Mục đích", "目的", "Tujuan")}</th><td className="px-3 py-2">{t("한국 기업 일경험 및 직무 이해", "Korean-company work experience and role understanding", "韩国企业工作经验及岗位理解", "Trải nghiệm làm việc và hiểu biết về vị trí tại doanh nghiệp Hàn Quốc", "韓国企業の就労体験および職務理解", "Pengalaman kerja dan pemahaman peran di perusahaan Korea")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("급여", "Salary", "薪资", "Lương", "給与", "Gaji")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("참여비", "Applicant fee", "参与费", "Phí tham gia", "参加費", "Biaya partisipasi")}</th><td className="px-3 py-2">700,000원</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기업 수수료", "Company fee", "企业费用", "Phí doanh nghiệp", "企業手数料", "Biaya perusahaan")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("수료증", "Certificate", "结业证书", "Chứng chỉ", "修了証", "Sertifikat")}</th><td className="px-3 py-2">{t("발급", "Provided", "提供", "Cấp", "発行", "Diberikan")}</td></tr>
                          <tr><th className="bg-muted/30 px-3 py-2 font-semibold">{t("학교 연계", "School linkage", "校方对接", "Liên kết với nhà trường", "学校連携", "Tautan ke sekolah")}</th><td className="px-3 py-2">{t("평가서/서류 작성 조율 가능", "Evaluation/report documents can be coordinated", "可协调评估书/文件", "Có thể phối hợp giấy đánh giá/hồ sơ", "評価書／書類作成の調整可能", "Dokumen evaluasi/laporan dapat dikoordinasikan")}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{t("제공 내용", "What is provided", "提供内容", "Nội dung được cung cấp", "提供内容", "Yang disediakan")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("직무 교육 제공 (플리퍼스)", "Job orientation/training (Flipers)", "职务培训提供 (Flipers)", "Đào tạo nghiệp vụ (Flipers)", "職務教育の提供（Flipers）", "Pelatihan jabatan (Flipers)")}</li>
                        <li>{t("수료증 발급 (플리퍼스)", "Completion certificate (Flipers)", "结业证书发放 (Flipers)", "Cấp chứng chỉ hoàn thành (Flipers)", "修了証の発行（Flipers）", "Penerbitan sertifikat (Flipers)")}</li>
                        <li>{t("학교 연계 시 평가서/학점 서류 요청 조율", "School-linked evaluation/credit documents can be coordinated", "校方对接时可协调评估书/学分文件", "Có thể phối hợp giấy đánh giá/học phần khi liên kết với trường", "学校連携時の評価書／単位書類のリクエスト調整", "Permintaan dokumen evaluasi/kredit dapat dikoordinasikan saat ditautkan ke sekolah")}</li>
                        <li>{t("기업 수수료 없음, 기업은 운영 협조 항목만 선택 참여", "No company fee; companies participate through selected cooperation items only", "无企业费用，企业仅选择性参与运营配合", "Không thu phí doanh nghiệp, doanh nghiệp chỉ tham gia các hạng mục hợp tác đã chọn", "企業手数料なし、企業は運営協力項目のみ選択参加", "Tanpa biaya perusahaan; perusahaan hanya berpartisipasi pada item kerja sama tertentu")}</li>
                      </ul>
                    </div>
                    <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
                      {t(
                        "전환 가능성은 있으나 정식 채용이나 추천서 제공은 보장되지 않습니다. 기업 협조 항목(정기 면담, 과제, 피드백 등)은 기업 상황에 맞춰 조정 가능합니다.",
                        "Conversion and recommendation letters are possible but not guaranteed. Company cooperation items (check-ins, tasks, feedback) are adjustable by company circumstances.",
                        "存在转正可能,但不保证正式录用或提供推荐信。企业协助项目(定期面谈、任务、反馈等)可根据企业情况调整。",
                        "Có khả năng chuyển đổi nhưng không đảm bảo tuyển dụng chính thức hoặc cấp thư giới thiệu. Các hạng mục hợp tác của doanh nghiệp (gặp mặt định kỳ, nhiệm vụ, phản hồi) có thể điều chỉnh theo tình hình doanh nghiệp."
                      )}
                    </p>
                  </article>
                </div>

              <article className="w-full rounded-2xl bg-white p-6 text-[#111111] shadow-card">
                <div className="flex items-center justify-between gap-3">
                  <h3 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] text-slate-900 md:text-2xl`}>
                    {t("인턴십 · 계약직 · 정규직", "Internship · Contract · Regular", "实习 · 合同 · 正职", "Thực tập · Hợp đồng · Chính thức", "インターンシップ · 契約職 · 正社員", "Magang · Kontrak · Tetap")}
                  </h3>
                  <span className="rounded-full bg-[#0B46E8] px-3 py-1 text-xs font-semibold text-white">
                    {t("계획중", "Planned", "计划中", "Đang lên kế hoạch", "計画中", "Direncanakan")}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground md:text-base">
                  {t(
                    "인턴십, 계약직(파트타임/풀타임), 정규직 트랙은\n향후 서비스 고도화 단계에서 순차적으로 제공될 예정입니다.\n기업과 지원자 모두에게 더 실질적인 연결이 되도록 완성도를 높여가고 있습니다.",
                    "Internship, Contract (part-time/full-time), and Regular tracks\nwill be introduced step by step as the service evolves.\nWe are continuously improving the experience to create more practical outcomes for both companies and candidates.",
                    "实习、合同制(兼职/全职)、正式员工三种轨道将\n在服务升级阶段陆续推出。\n我们持续完善体验,让企业与求职者建立更实质的连接。",
                    "Các tuyến thực tập, hợp đồng (bán thời gian/toàn thời gian) và nhân viên chính thức\nsẽ được giới thiệu dần trong các giai đoạn nâng cấp dịch vụ.\nChúng tôi không ngừng hoàn thiện để tạo kết nối thực chất hơn cho cả doanh nghiệp và ứng viên."
                  )}
                </p>
              </article>
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
              <h2 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] text-black md:text-5xl`}>
                {copy.housing.titleTop}
                <br />
                {copy.housing.titleBottom}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
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
                    <div className="mt-4 text-2xl font-bold text-foreground md:text-3xl">{renderHousingPrice(copy.housing.privateRoom.price)}</div>
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
                    <div className="mt-4 text-2xl font-bold text-foreground md:text-3xl">{renderHousingPrice(copy.housing.sharedRoom.price)}</div>
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
