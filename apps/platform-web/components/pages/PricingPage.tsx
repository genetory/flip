"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { paperlogy } from "../../lib/fonts";

export function PricingPage() {
  const { locale } = useLanguage();
  const { user } = useAuthSession();
  const isPartner = user?.role === "PARTNER";
  const t = (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) =>
    locale === "ko" ? ko : locale === "zh-CN" ? (zh ?? en) : locale === "vi" ? (vi ?? en) : locale === "ja" ? (ja ?? en) : locale === "id" ? (id ?? en) : en;
  const refundCardRef = useRef<HTMLElement | null>(null);
  const [isRefundCardVisible, setIsRefundCardVisible] = useState(false);
  const [audienceTab, setAudienceTab] = useState<"student" | "business">("student");
  const priceSuffixClassName = "text-sm font-semibold md:text-base";

  const copy = {
    title: t(
      "내 상황에 맞춰 선택하는 이용 플랜",
      "Service plans tailored to your situation",
      "为你量身定制的服务套餐",
      "Gói dịch vụ phù hợp với tình huống của bạn",
      "自分の状況に合わせて選べる利用プラン",
      "Paket layanan yang disesuaikan dengan situasi Anda"
    ),
    description: t(
      "Aply는 시작부터 확장까지, 현재 상황에 맞게 부담 없이 선택할 수 있는 플랜을 제공합니다.",
      "From getting started to scaling, Aply provides plans you can choose with confidence based on your current situation.",
      "从入门到扩展,Aply 提供可以根据当前情况轻松选择的套餐。",
      "Từ khởi đầu đến mở rộng, Aply cung cấp các gói phù hợp với hoàn cảnh hiện tại của bạn.",
      "Aplyは、始めから拡大まで、現在の状況に合わせて気軽に選べるプランを提供します。",
      "Dari memulai hingga berkembang, Aply menyediakan paket yang dapat Anda pilih dengan yakin sesuai situasi Anda saat ini."
    ),
    note: t(
      "정확한 비용은 포지션 수, 운영 범위, 지원 형태에 따라 달라질 수 있어요.",
      "Final pricing may vary depending on the number of positions, operating scope, and support format.",
      "最终费用可能因职位数量、运营范围和支持形式而有所不同。",
      "Chi phí cuối cùng có thể thay đổi tùy theo số lượng vị trí, phạm vi vận hành và hình thức hỗ trợ.",
      "正確な費用は、ポジション数、運営範囲、支援形態によって異なる場合があります。",
      "Biaya akhir dapat bervariasi tergantung jumlah posisi, cakupan operasional, dan bentuk dukungan."
    ),
    refundCard: {
      title: t("탈락 시 100% 환불", "100% Refund if Not Accepted", "未通过 100% 退款", "Hoàn 100% nếu không được chọn", "不合格時は100％返金", "Pengembalian 100% jika tidak diterima"),
      subtitle: t("부담 없이 도전하세요", "Apply with confidence", "无负担参与", "Hãy ứng tuyển một cách tự tin", "気軽に挑戦してください", "Ajukan dengan percaya diri"),
      description: t(
        "결제 후 서류 제출과 면접 심사를 진행합니다. 심사에 통과한 분만 프로그램에 참여하며, 탈락 시 결제 금액은 100% 전액 환불됩니다.",
        "After payment, you will proceed with document submission and interview screening. Only candidates who pass the review join the program, and those not accepted receive a full 100% refund.",
        "付款后将进行材料提交和面试审核。仅通过审核的人员可参与项目,未通过者将获得 100% 全额退款。",
        "Sau khi thanh toán, bạn sẽ nộp hồ sơ và phỏng vấn. Chỉ ứng viên vượt qua kỳ thẩm định mới được tham gia chương trình, người không được chọn sẽ được hoàn 100% chi phí.",
        "決済後に書類提出と面接審査を行います。審査に通過した方のみプログラムに参加でき、不合格の場合は決済金額を100％全額返金いたします。",
        "Setelah pembayaran, Anda akan melanjutkan pengajuan dokumen dan seleksi wawancara. Hanya kandidat yang lolos seleksi yang mengikuti program, dan yang tidak diterima menerima pengembalian penuh 100%."
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
        "Aply 참가자에게만 제공되는 프리미엄 주거 옵션",
        "Premium housing options available exclusively for Aply participants",
        "仅 Aply 参与者可享的高端住宿选择",
        "Lựa chọn nhà ở cao cấp dành riêng cho thành viên Aply",
        "Aply参加者だけに提供されるプレミアム住居オプション",
        "Pilihan tempat tinggal premium yang tersedia khusus untuk peserta Aply"
      ),
      note: t(
        "💡 주거 옵션은 프로그램 참가의 필수 조건이 아닙니다. 숙소가 필요하신 분만 별도로 신청하실 수 있습니다.",
        "💡 Housing is not required to participate in the program. You may apply separately only if accommodation is needed.",
        "💡 住宿不是参与项目的必要条件,如需住宿可单独申请。",
        "💡 Nhà ở không bắt buộc khi tham gia chương trình. Chỉ những ai cần chỗ ở mới đăng ký riêng.",
        "💡 住居オプションはプログラム参加の必須条件ではありません。宿泊が必要な方のみ別途お申し込みいただけます。",
        "💡 Tempat tinggal bukan syarat wajib untuk mengikuti program. Anda dapat mendaftar terpisah hanya jika membutuhkan akomodasi."
      ),
      privateRoom: {
        name: t("Private Room (1인실)", "Private Room (Single)", "Private Room (单人间)", "Private Room (Phòng đơn)", "Private Room（個室）", "Private Room (Kamar tunggal)"),
        location: t(
          "📍 서울 내 위치, 교통 편리",
          "📍 Located in Seoul with convenient transportation",
          "📍 位于首尔,交通便利",
          "📍 Tại Seoul, giao thông thuận tiện",
          "📍 ソウル市内に位置、交通便利",
          "📍 Berlokasi di Seoul dengan transportasi yang nyaman"
        ),
        summary: t(
          "나만의 편안한 휴식 공간",
          "Your own private and comfortable living space",
          "属于你自己的舒适私人空间",
          "Không gian riêng tư và thoải mái của bạn",
          "自分だけの快適な休息空間",
          "Ruang hunian pribadi dan nyaman milik Anda sendiri"
        ),
        price: t(
          "₩700,000~2,000,000 월 (1인당)",
          "₩700,000~2,000,000 per month (per person)",
          "₩700,000~2,000,000 每月 (每人)",
          "₩700,000~2,000,000 mỗi tháng (mỗi người)",
          "₩700,000~2,000,000 月額（1人あたり）",
          "₩700.000~2.000.000 per bulan (per orang)"
        )
      },
      sharedRoom: {
        name: t("Shared Room (2인실)", "Shared Room (Double)", "Shared Room (双人间)", "Shared Room (Phòng đôi)", "Shared Room（2人部屋）", "Shared Room (Kamar ganda)"),
        location: t(
          "📍 서울 내 위치, 교통 편리",
          "📍 Located in Seoul with convenient transportation",
          "📍 位于首尔,交通便利",
          "📍 Tại Seoul, giao thông thuận tiện",
          "📍 ソウル市内に位置、交通便利",
          "📍 Berlokasi di Seoul dengan transportasi yang nyaman"
        ),
        summary: t(
          "합리적인 비용과 네트워킹",
          "A cost-effective option with built-in networking opportunities",
          "经济实惠并有社交机会",
          "Tiết kiệm chi phí và có cơ hội kết nối",
          "手頃な費用とネットワーキング",
          "Hemat biaya dengan peluang membangun jaringan"
        ),
        price: t(
          "₩400,000~1,100,000 월 (1인당)",
          "₩400,000~1,100,000 per month (per person)",
          "₩400,000~1,100,000 每月 (每人)",
          "₩400,000~1,100,000 mỗi tháng (mỗi người)",
          "₩400,000~1,100,000 月額（1人あたり）",
          "₩400.000~1.100.000 per bulan (per orang)"
        )
      },
      disclaimer: t(
        "※ 제휴된 숙소의 예약 현황에 따라 실제 배정되는 숙소는 상이할 수 있습니다.",
        "※ Actual accommodation assignments may vary depending on availability at partnered properties.",
        "※ 实际分配的住宿可能因合作住宿的预订情况而有所不同。",
        "※ Nhà ở thực tế được phân bổ có thể khác nhau tùy theo tình trạng đặt phòng tại các cơ sở liên kết.",
        "※ 提携宿泊施設の予約状況により、実際に割り当てられる宿泊施設は異なる場合があります。",
        "※ Akomodasi yang benar-benar dialokasikan dapat berbeda tergantung ketersediaan di properti mitra."
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
              <div className="space-y-4">
                <div className="inline-flex rounded-full bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setAudienceTab("student")}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      audienceTab === "student" ? "bg-[#0B46E8] text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t("학생용", "For students", "学生用", "Dành cho sinh viên", "学生向け", "Untuk pelajar")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isPartner) {
                        alert(t(
                          "기업 회원으로 로그인하시면 기업용 안내를 확인하실 수 있습니다.",
                          "Please sign in as a partner (business) member to view business pricing.",
                          "请使用企业会员账号登录以查看企业版方案。",
                          "Vui lòng đăng nhập bằng tài khoản doanh nghiệp để xem gói dành cho doanh nghiệp.",
                          "企業会員でログインすると、企業向けのご案内をご確認いただけます。",
                          "Silakan masuk sebagai mitra (perusahaan) untuk melihat informasi untuk perusahaan."
                        ));
                        return;
                      }
                      setAudienceTab("business");
                    }}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                      audienceTab === "business"
                        ? "bg-[#0B46E8] text-white shadow-sm"
                        : isPartner
                          ? "text-muted-foreground hover:text-foreground"
                          : "text-muted-foreground/60"
                    }`}
                    aria-disabled={!isPartner}
                  >
                    {t("기업용", "For businesses", "企业用", "Dành cho doanh nghiệp", "企業向け", "Untuk perusahaan")}
                    {!isPartner ? (
                      <span className="ml-1.5 text-[10px]" aria-hidden>🔒</span>
                    ) : null}
                  </button>
                </div>

                {audienceTab === "student" ? (
                <div className="grid w-full gap-3 md:grid-cols-2 md:items-stretch">
                  <article className="flex h-full w-full flex-col rounded-2xl bg-white p-5 text-[#111111] shadow-card md:p-6">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#B7FF5A] px-2.5 py-1 text-[11px] font-semibold text-black">
                      {t("진행중", "In Progress", "进行中", "Đang triển khai", "進行中", "Berlangsung")}
                    </span>
                    <h4 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] md:text-2xl`}>Starter Track</h4>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{t("단기 체험 중심의 일경험 트랙", "Short-term work experience track", "以短期体验为主的工作经验轨道", "Tuyến trải nghiệm làm việc ngắn hạn", "短期体験中心の就労体験トラック", "Trek pengalaman kerja jangka pendek")}</p>
                    <div className="mt-4 overflow-x-auto rounded-xl bg-white/92">
                      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                        <tbody>
                          <tr className="border-b border-border/60"><th className="w-32 bg-muted/30 px-3 py-2 font-semibold">{t("대상", "Target", "对象", "Đối tượng", "対象", "Sasaran")}</th><td className="px-3 py-2">{t("관광비자(C-3), 교환학생(D-2-6) 비자 소지자", "Tourist (C-3), Exchange student (D-2-6) visa holders", "持有旅游签证(C-3)、交换学生(D-2-6)签证者", "Người có visa du lịch (C-3), trao đổi sinh viên (D-2-6)", "観光ビザ(C-3)、交換留学(D-2-6)ビザ保持者", "Pemegang visa wisata (C-3), pertukaran pelajar (D-2-6)")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kewarganegaraan")}</th><td className="px-3 py-2">{t("무관", "Any", "不限", "Không giới hạn", "問わず", "Bebas")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}</th><td className="px-3 py-2">{t("모국어 및 영어", "Native + English", "母语及英语", "Tiếng mẹ đẻ và tiếng Anh", "母国語＋英語", "Bahasa ibu + Inggris")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</th><td className="px-3 py-2">{t("국내/해외 4년제 대학 재학생 및 졸업생", "Korean/overseas 4-year university students or graduates", "国内/海外四年制大学在读生及毕业生", "Sinh viên/cựu sinh viên đại học 4 năm trong và ngoài nước", "国内・海外の4年制大学の在学生および卒業生", "Mahasiswa/lulusan universitas 4 tahun di Korea/luar negeri")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기간", "Duration", "期间", "Thời gian", "期間", "Durasi")}</th><td className="px-3 py-2">{t("3주 ~ 16주", "3–16 weeks", "3周~16周", "3–16 tuần", "3週間〜16週間", "3–16 minggu")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("목적", "Purpose", "目的", "Mục đích", "目的", "Tujuan")}</th><td className="px-3 py-2">{t("교육 목적", "Education", "教育目的", "Mục đích giáo dục", "教育目的", "Pendidikan")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("급여", "Salary", "薪资", "Lương", "給与", "Gaji")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("참여비", "Applicant fee", "参与费", "Phí tham gia", "参加費", "Biaya partisipasi")}</th><td className="px-3 py-2">{t("2,000,000원", "₩2,000,000", "2,000,000韩元", "2.000.000 KRW", "2,000,000ウォン", "₩2.000.000")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기업 수수료", "Company fee", "企业费用", "Phí doanh nghiệp", "企業手数料", "Biaya perusahaan")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr><th className="bg-muted/30 px-3 py-2 font-semibold">{t("채용 전환", "Conversion", "转正可能性", "Chuyển đổi tuyển dụng", "採用転換", "Konversi rekrut")}</th><td className="px-3 py-2">{t("가능 (보장 X)", "Possible (not guaranteed)", "可转正（不保证）", "Có thể (không đảm bảo)", "可能（保証なし）", "Mungkin (tidak dijamin)")}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{t("기업 제공 항목", "Provided by the company", "企业提供项目", "Doanh nghiệp cung cấp", "企業提供項目", "Disediakan oleh perusahaan")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("담당자 정기 면담", "Mentor check-ins", "负责人定期面谈", "Họp định kỳ với phụ trách", "担当者の定期面談", "Pertemuan rutin dengan PIC")}</li>
                        <li>{t("업무일지 — 미제공", "Work journal — not provided", "工作日志 — 不提供", "Nhật ký công việc — không cung cấp", "業務日誌 — 提供なし", "Jurnal kerja — tidak disediakan")}</li>
                        <li>{t("추천서 — 미제공", "Recommendation letter — not provided", "推荐信 — 不提供", "Thư giới thiệu — không cung cấp", "推薦状 — 提供なし", "Surat rekomendasi — tidak disediakan")}</li>
                      </ul>
                      <p className="mt-3 text-sm font-semibold">{t("플리퍼스 제공 항목", "Provided by Flipers", "Flipers提供项目", "Flipers cung cấp", "Flipers提供項目", "Disediakan oleh Flipers")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("직무 교육", "Job training", "职务培训", "Đào tạo nghiệp vụ", "職務教育", "Pelatihan jabatan")}</li>
                        <li>{t("수료증 — 미발급", "Certificate — not issued", "结业证书 — 不发放", "Chứng chỉ — không cấp", "修了証 — 発行なし", "Sertifikat — tidak diberikan")}</li>
                      </ul>
                    </div>
                  </article>
                  <article className="h-full w-full rounded-2xl bg-white p-5 text-[#111111] shadow-card md:p-6">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#B7FF5A] px-2.5 py-1 text-[11px] font-semibold text-black">
                      {t("진행중", "In Progress", "进行中", "Đang triển khai", "進行中", "Berlangsung")}
                    </span>
                    <h4 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] md:text-2xl`}>Pro Track</h4>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{t("채용 전환을 염두에 둔 심화 일경험 트랙", "Advanced track aimed at conversion to hiring", "面向正职转换的深度工作体验轨道", "Tuyến nâng cao hướng đến chuyển đổi tuyển dụng", "正社員転換を見据えた深化型就労体験トラック", "Trek lanjutan dengan target konversi rekrut")}</p>
                    <div className="mt-4 overflow-x-auto rounded-xl bg-white/96 text-[#1f2342]">
                      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                        <tbody>
                          <tr className="border-b border-border/60"><th className="w-32 bg-muted/30 px-3 py-2 font-semibold">{t("대상", "Target", "对象", "Đối tượng", "対象", "Sasaran")}</th><td className="px-3 py-2">{t("D-2, D-10, F-4, F-6 비자 소지자", "D-2, D-10, F-4, F-6 visa holders", "持有D-2、D-10、F-4、F-6签证者", "Người có visa D-2, D-10, F-4, F-6", "D-2、D-10、F-4、F-6ビザ保持者", "Pemegang visa D-2, D-10, F-4, F-6")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kewarganegaraan")}</th><td className="px-3 py-2">{t("무관", "Any", "不限", "Không giới hạn", "問わず", "Bebas")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}</th><td className="px-3 py-2">{t("한국어 가능자 많음", "Many Korean speakers", "韩语能力者较多", "Nhiều người biết tiếng Hàn", "韓国語可能者が多い", "Banyak yang bisa Bahasa Korea")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</th><td className="px-3 py-2">{t("국내/해외 4년제 대학 재학생 및 졸업생", "Korean/overseas 4-year university students or graduates", "国内/海外四年制大学在读生及毕业生", "Sinh viên/cựu sinh viên đại học 4 năm trong và ngoài nước", "国内・海外の4年制大学の在学生および卒業生", "Mahasiswa/lulusan universitas 4 tahun di Korea/luar negeri")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기간", "Duration", "期间", "Thời gian", "期間", "Durasi")}</th><td className="px-3 py-2">{t("4주 ~ 8주 (최소 6주 권장)", "4–8 weeks (6+ weeks recommended)", "4周~8周（建议至少6周）", "4–8 tuần (khuyến nghị tối thiểu 6 tuần)", "4週間〜8週間（最低6週間推奨）", "4–8 minggu (disarankan minimal 6 minggu)")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("목적", "Purpose", "目的", "Mục đích", "目的", "Tujuan")}</th><td className="px-3 py-2">{t("교육 목적", "Education", "教育目的", "Mục đích giáo dục", "教育目的", "Pendidikan")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("급여", "Salary", "薪资", "Lương", "給与", "Gaji")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("참여비", "Applicant fee", "参与费", "Phí tham gia", "参加費", "Biaya partisipasi")}</th><td className="px-3 py-2">{t("300,000원 (70% 할인 프로모션)", "₩300,000 (70% off promotion)", "300,000韩元（7折促销）", "300.000 KRW (giảm 70%)", "300,000ウォン（70％割引プロモ）", "₩300.000 (promo diskon 70%)")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기업 수수료", "Company fee", "企业费用", "Phí doanh nghiệp", "企業手数料", "Biaya perusahaan")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr><th className="bg-muted/30 px-3 py-2 font-semibold">{t("채용 전환", "Conversion", "转正可能性", "Chuyển đổi tuyển dụng", "採用転換", "Konversi rekrut")}</th><td className="px-3 py-2">{t("가능 (보장 X) · 전환 여부 확인 필수", "Possible (not guaranteed) · confirm before signing", "可转正（不保证）· 须确认转正意向", "Có thể (không đảm bảo) · cần xác nhận trước", "可能（保証なし）・転換可否の事前確認必須", "Mungkin (tidak dijamin) · konfirmasi terlebih dahulu")}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{t("기업 제공 항목", "Provided by the company", "企业提供项目", "Doanh nghiệp cung cấp", "企業提供項目", "Disediakan oleh perusahaan")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("담당자 정기 면담", "Mentor check-ins", "负责人定期面谈", "Họp định kỳ với phụ trách", "担当者の定期面談", "Pertemuan rutin dengan PIC")}</li>
                        <li>{t("업무일지 제공", "Work journal provided", "提供工作日志", "Cung cấp nhật ký công việc", "業務日誌の提供", "Jurnal kerja disediakan")}</li>
                        <li>{t("추천서는 평가에 따라 자율 제공 (보장 X)", "Recommendation letter at company's discretion (not guaranteed)", "推荐信由企业根据评估自主提供（不保证）", "Thư giới thiệu tùy theo đánh giá (không đảm bảo)", "推薦状は評価に応じて任意提供（保証なし）", "Surat rekomendasi sesuai penilaian (tidak dijamin)")}</li>
                      </ul>
                      <p className="mt-3 text-sm font-semibold">{t("플리퍼스 제공 항목", "Provided by Flipers", "Flipers提供项目", "Flipers cung cấp", "Flipers提供項目", "Disediakan oleh Flipers")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("직무 교육", "Job training", "职务培训", "Đào tạo nghiệp vụ", "職務教育", "Pelatihan jabatan")}</li>
                        <li>{t("수료증 발급", "Certificate issued", "结业证书发放", "Cấp chứng chỉ", "修了証の発行", "Penerbitan sertifikat")}</li>
                      </ul>
                    </div>
                  </article>
                </div>
                ) : (
                <div className="grid w-full gap-3 md:grid-cols-2 md:items-stretch">
                  <article className="flex h-full w-full flex-col rounded-2xl bg-white p-5 text-[#111111] shadow-card md:p-6">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#B7FF5A] px-2.5 py-1 text-[11px] font-semibold text-black">
                      {t("진행중", "In Progress", "进行中", "Đang triển khai", "進行中", "Berlangsung")}
                    </span>
                    <h4 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] md:text-2xl`}>Starter Track</h4>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{t("기업이 부담 없이 해외 인재를 만나보는 단기 트랙", "Short-term track for companies to meet overseas talent risk-free", "企业可零负担接触海外人才的短期轨道", "Tuyến ngắn hạn để doanh nghiệp gặp gỡ nhân tài quốc tế", "企業が負担なく海外人材と出会える短期トラック", "Trek singkat untuk bertemu talenta global tanpa beban")}</p>
                    <div className="mt-4 overflow-x-auto rounded-xl bg-white/92">
                      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                        <tbody>
                          <tr className="border-b border-border/60"><th className="w-32 bg-muted/30 px-3 py-2 font-semibold">{t("대상", "Target", "对象", "Đối tượng", "対象", "Sasaran")}</th><td className="px-3 py-2">{t("관광비자(C-3), 교환학생(D-2-6) 비자 소지자", "Tourist (C-3), Exchange student (D-2-6) visa holders", "持有旅游签证(C-3)、交换学生(D-2-6)签证者", "Người có visa du lịch (C-3), trao đổi sinh viên (D-2-6)", "観光ビザ(C-3)、交換留学(D-2-6)ビザ保持者", "Pemegang visa wisata (C-3), pertukaran pelajar (D-2-6)")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kewarganegaraan")}</th><td className="px-3 py-2">{t("무관", "Any", "不限", "Không giới hạn", "問わず", "Bebas")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}</th><td className="px-3 py-2">{t("모국어 및 영어", "Native + English", "母语及英语", "Tiếng mẹ đẻ và tiếng Anh", "母国語＋英語", "Bahasa ibu + Inggris")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</th><td className="px-3 py-2">{t("국내/해외 4년제 대학 재학생 및 졸업생", "Korean/overseas 4-year university students or graduates", "国内/海外四年制大学在读生及毕业生", "Sinh viên/cựu sinh viên đại học 4 năm trong và ngoài nước", "国内・海外の4年制大学の在学生および卒業生", "Mahasiswa/lulusan universitas 4 tahun di Korea/luar negeri")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기간", "Duration", "期间", "Thời gian", "期間", "Durasi")}</th><td className="px-3 py-2">{t("3주 ~ 16주", "3–16 weeks", "3周~16周", "3–16 tuần", "3週間〜16週間", "3–16 minggu")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("목적", "Purpose", "目的", "Mục đích", "目的", "Tujuan")}</th><td className="px-3 py-2">{t("교육 목적", "Education", "教育目的", "Mục đích giáo dục", "教育目的", "Pendidikan")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("급여", "Salary", "薪资", "Lương", "給与", "Gaji")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("지원자 참여비", "Applicant fee", "参与费", "Phí tham gia", "参加費", "Biaya partisipasi")}</th><td className="px-3 py-2">{t("2,000,000원", "₩2,000,000", "2,000,000韩元", "2.000.000 KRW", "2,000,000ウォン", "₩2.000.000")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기업 수수료", "Company fee", "企业费用", "Phí doanh nghiệp", "企業手数料", "Biaya perusahaan")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr><th className="bg-muted/30 px-3 py-2 font-semibold">{t("채용 전환", "Conversion", "转正可能性", "Chuyển đổi tuyển dụng", "採用転換", "Konversi rekrut")}</th><td className="px-3 py-2">{t("가능 (보장 X)", "Possible (not guaranteed)", "可转正（不保证）", "Có thể (không đảm bảo)", "可能（保証なし）", "Mungkin (tidak dijamin)")}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{t("기업 제공 항목", "Provided by the company", "企业提供项目", "Doanh nghiệp cung cấp", "企業提供項目", "Disediakan oleh perusahaan")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("담당자 정기 면담", "Mentor check-ins", "负责人定期面谈", "Họp định kỳ với phụ trách", "担当者の定期面談", "Pertemuan rutin dengan PIC")}</li>
                        <li>{t("업무일지 — 미제공", "Work journal — not provided", "工作日志 — 不提供", "Nhật ký công việc — không cung cấp", "業務日誌 — 提供なし", "Jurnal kerja — tidak disediakan")}</li>
                        <li>{t("추천서 — 미제공", "Recommendation letter — not provided", "推荐信 — 不提供", "Thư giới thiệu — không cung cấp", "推薦状 — 提供なし", "Surat rekomendasi — tidak disediakan")}</li>
                      </ul>
                      <p className="mt-3 text-sm font-semibold">{t("플리퍼스 제공 항목", "Provided by Flipers", "Flipers提供项目", "Flipers cung cấp", "Flipers提供項目", "Disediakan oleh Flipers")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("직무 교육", "Job training", "职务培训", "Đào tạo nghiệp vụ", "職務教育", "Pelatihan jabatan")}</li>
                        <li>{t("수료증 — 미발급", "Certificate — not issued", "结业证书 — 不发放", "Chứng chỉ — không cấp", "修了証 — 発行なし", "Sertifikat — tidak diberikan")}</li>
                      </ul>
                    </div>
                  </article>
                  <article className="h-full w-full rounded-2xl bg-white p-5 text-[#111111] shadow-card md:p-6">
                    <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[#B7FF5A] px-2.5 py-1 text-[11px] font-semibold text-black">
                      {t("진행중", "In Progress", "进行中", "Đang triển khai", "進行中", "Berlangsung")}
                    </span>
                    <h4 className={`${paperlogy.className} text-xl font-black tracking-[-0.02em] md:text-2xl`}>Pro Track</h4>
                    <p className="mt-1 text-sm font-medium text-foreground/90">{t("채용 전환을 염두에 둔 심화 일경험 트랙", "Advanced track aimed at conversion to hiring", "面向正职转换的深度工作体验轨道", "Tuyến nâng cao hướng đến chuyển đổi tuyển dụng", "正社員転換を見据えた深化型就労体験トラック", "Trek lanjutan dengan target konversi rekrut")}</p>
                    <div className="mt-4 overflow-x-auto rounded-xl bg-white/96 text-[#1f2342]">
                      <table className="w-full min-w-[320px] border-collapse text-left text-sm">
                        <tbody>
                          <tr className="border-b border-border/60"><th className="w-32 bg-muted/30 px-3 py-2 font-semibold">{t("대상", "Target", "对象", "Đối tượng", "対象", "Sasaran")}</th><td className="px-3 py-2">{t("D-2, D-10, F-4, F-6 비자 소지자", "D-2, D-10, F-4, F-6 visa holders", "持有D-2、D-10、F-4、F-6签证者", "Người có visa D-2, D-10, F-4, F-6", "D-2、D-10、F-4、F-6ビザ保持者", "Pemegang visa D-2, D-10, F-4, F-6")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kewarganegaraan")}</th><td className="px-3 py-2">{t("무관", "Any", "不限", "Không giới hạn", "問わず", "Bebas")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}</th><td className="px-3 py-2">{t("한국어 가능자 많음", "Many Korean speakers", "韩语能力者较多", "Nhiều người biết tiếng Hàn", "韓国語可能者が多い", "Banyak yang bisa Bahasa Korea")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</th><td className="px-3 py-2">{t("국내/해외 4년제 대학 재학생 및 졸업생", "Korean/overseas 4-year university students or graduates", "国内/海外四年制大学在读生及毕业生", "Sinh viên/cựu sinh viên đại học 4 năm trong và ngoài nước", "国内・海外の4年制大学の在学生および卒業生", "Mahasiswa/lulusan universitas 4 tahun di Korea/luar negeri")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기간", "Duration", "期间", "Thời gian", "期間", "Durasi")}</th><td className="px-3 py-2">{t("4주 ~ 8주 (비자 문제로 단기 진행)", "4–8 weeks (visa-constrained)", "4周~8周（受签证限制）", "4–8 tuần (giới hạn visa)", "4週間〜8週間（ビザの都合で短期）", "4–8 minggu (terkendala visa)")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("목적", "Purpose", "目的", "Mục đích", "目的", "Tujuan")}</th><td className="px-3 py-2">{t("교육 목적", "Education", "教育目的", "Mục đích giáo dục", "教育目的", "Pendidikan")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("급여", "Salary", "薪资", "Lương", "給与", "Gaji")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("지원자 참여비", "Applicant fee", "参与费", "Phí tham gia", "参加費", "Biaya partisipasi")}</th><td className="px-3 py-2">{t("300,000원 (70% 할인 프로모션)", "₩300,000 (70% off promotion)", "300,000韩元（7折促销）", "300.000 KRW (giảm 70%)", "300,000ウォン（70％割引プロモ）", "₩300.000 (promo diskon 70%)")}</td></tr>
                          <tr className="border-b border-border/60"><th className="bg-muted/30 px-3 py-2 font-semibold">{t("기업 수수료", "Company fee", "企业费用", "Phí doanh nghiệp", "企業手数料", "Biaya perusahaan")}</th><td className="px-3 py-2">{t("없음", "None", "无", "Không", "なし", "Tidak ada")}</td></tr>
                          <tr><th className="bg-muted/30 px-3 py-2 font-semibold">{t("채용 전환", "Conversion", "转正可能性", "Chuyển đổi tuyển dụng", "採用転換", "Konversi rekrut")}</th><td className="px-3 py-2">{t("가능 (보장 X) · 전환 여부 확인 필수", "Possible (not guaranteed) · confirm before signing", "可转正（不保证）· 须确认转正意向", "Có thể (không đảm bảo) · cần xác nhận trước", "可能（保証なし）・転換可否の事前確認必須", "Mungkin (tidak dijamin) · konfirmasi terlebih dahulu")}</td></tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold">{t("기업 제공 항목", "Provided by the company", "企业提供项目", "Doanh nghiệp cung cấp", "企業提供項目", "Disediakan oleh perusahaan")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("담당자 정기 면담", "Mentor check-ins", "负责人定期面谈", "Họp định kỳ với phụ trách", "担当者の定期面談", "Pertemuan rutin dengan PIC")}</li>
                        <li>{t("업무일지 제공", "Work journal provided", "提供工作日志", "Cung cấp nhật ký công việc", "業務日誌の提供", "Jurnal kerja disediakan")}</li>
                        <li>{t("추천서는 평가에 따라 자율 제공 (보장 X)", "Recommendation letter at company's discretion (not guaranteed)", "推荐信由企业根据评估自主提供（不保证）", "Thư giới thiệu tùy theo đánh giá (không đảm bảo)", "推薦状は評価に応じて任意提供（保証なし）", "Surat rekomendasi sesuai penilaian (tidak dijamin)")}</li>
                      </ul>
                      <p className="mt-3 text-sm font-semibold">{t("플리퍼스 제공 항목", "Provided by Flipers", "Flipers提供项目", "Flipers cung cấp", "Flipers提供項目", "Disediakan oleh Flipers")}</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                        <li>{t("직무 교육", "Job training", "职务培训", "Đào tạo nghiệp vụ", "職務教育", "Pelatihan jabatan")}</li>
                        <li>{t("수료증 발급", "Certificate issued", "结业证书发放", "Cấp chứng chỉ", "修了証の発行", "Penerbitan sertifikat")}</li>
                      </ul>
                    </div>
                  </article>
                </div>
                )}
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
                    "Các tuyến thực tập, hợp đồng (bán thời gian/toàn thời gian) và nhân viên chính thức\nsẽ được giới thiệu dần trong các giai đoạn nâng cấp dịch vụ.\nChúng tôi không ngừng hoàn thiện để tạo kết nối thực chất hơn cho cả doanh nghiệp và ứng viên.",
                    "インターンシップ、契約職(パートタイム/フルタイム)、正社員トラックは\n今後のサービス高度化の段階で順次提供される予定です。\n企業と応募者の双方にとってより実質的なつながりとなるよう、完成度を高めています。",
                    "Trek magang, kontrak (paruh waktu/penuh waktu), dan karyawan tetap\nakan diperkenalkan secara bertahap seiring peningkatan layanan.\nKami terus menyempurnakan pengalaman agar tercipta koneksi yang lebih nyata bagi perusahaan maupun kandidat."
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
                      alt={copy.housing.privateRoom.name}
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
                      alt={copy.housing.sharedRoom.name}
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
