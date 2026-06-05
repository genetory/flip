"use client";

import { HelpCircle, Star, X, ExternalLink as ExternalLinkIcon } from "lucide-react";
import type { PlatformLocale } from "../../lib/auth-messages";

// "Aply CIP" 직접등록 포지션을 표시하는 라임색 배지 버튼.
// - 리스트 카드(PositionRow / PositionGridCard)와 포지션 상세 페이지에서 공유 사용.
// - 클릭 시 상위에서 전달한 onClick 콜백을 통해 CipInfoModal 을 띄움.
// - 카드 영역 전체가 Link 인 경우가 많아 preventDefault + stopPropagation 으로
//   라우팅 가로채기를 막음. z-20 으로 카드 오버레이 위에 노출.
//
// 크기 옵션:
//   size="sm" — 카드 안 작은 칩 (10px text)
//   size="md" — 디테일 페이지 헤더 (12px text)
export function AplyCipBadgeButton({
  onClick,
  size = "sm",
  className = ""
}: {
  onClick: () => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeCls =
    size === "md"
      ? "px-3 py-1 text-[12px]"
      : "px-2 py-0.5 text-[10px]";
  const iconSize = size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";
  return (
    <button
      type="button"
      aria-label="Aply CIP info"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`relative z-20 inline-flex items-center gap-1 rounded-full bg-[#b7ff5a] font-bold text-[#111111] transition hover:bg-[#a3eb43] ${sizeCls} ${className}`}
    >
      <Star className={`${iconSize} fill-current`} />
      Aply CIP
      <HelpCircle className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
    </button>
  );
}

// "Aply CIP" 배지를 누르면 뜨는 안내 모달.
// 6개 로케일(ko/en/zh-CN/vi/ja/id) 모두 번역 — 알 수 없는 로케일은 영어로 폴백.
// "자세한 내용 확인" 버튼은 /pricing 페이지(브랜드명 Customized Support)로 새 탭 이동.
const CIP_COPY: Record<PlatformLocale, {
  title: string;
  body: string;
  benefitsTitle: string;
  benefit1: string;
  benefit2: string;
  cta: string;
  close: string;
}> = {
  ko: {
    title: "CIP란?",
    body:
      "CIP(Career Immersion Program)는 Aply가 운영하는 외국인 맞춤 체험형 교육 프로그램입니다. 실무 경험이 적거나 없지만 한국에서의 커리어를 꿈꾸는 외국인 대학생 및 사회초년생들을 지원합니다. 한국 기업 문화를 배운 뒤, 실제 기업 현장에 투입되어 실무를 경험하며 커리어의 기반을 다질 수 있습니다.",
    benefitsTitle: "💡 프로그램 참여 혜택",
    benefit1: "공식 수료증 발급",
    benefit2: "우수자 대상 추천서 및 채용 전환 기회 부여",
    cta: "기간, 비용 등 자세한 내용 확인하기",
    close: "닫기"
  },
  en: {
    title: "What is CIP?",
    body:
      "The CIP (Career Immersion Program), operated by Aply, is a customized, hands-on training program designed for international talent. We support international university students and early-career professionals who aspire to build a career in South Korea, even with little to no prior work experience. Participants first learn about Korean corporate culture, then gain practical experience at companies across various industries to build a solid foundation for their careers.",
    benefitsTitle: "💡 Program Benefits",
    benefit1: "Official Certificate of Completion",
    benefit2: "Letters of recommendation and full-time employment opportunities for top performers",
    cta: "Learn more about the schedule, fees, and details",
    close: "Close"
  },
  "zh-CN": {
    title: "什么是 CIP？",
    body:
      "CIP（Career Immersion Program / 职业沉浸式项目）是 Aply 为外国人量身打造的实习体验式培训项目。我们为实务经验较少或没有经验，但希望在韩国发展职业的外籍大学生及职场新人提供支持。参与者将先学习韩国企业文化，然后进入真实企业现场积累实务经验，为职业生涯打下扎实基础。",
    benefitsTitle: "💡 项目参与福利",
    benefit1: "颁发正式结业证书",
    benefit2: "优秀学员可获推荐信及正式录用机会",
    cta: "查看时长、费用等详细信息",
    close: "关闭"
  },
  vi: {
    title: "CIP là gì?",
    body:
      "CIP (Career Immersion Program) là chương trình đào tạo trải nghiệm thực tế dành riêng cho người nước ngoài, do Aply vận hành. Chúng tôi hỗ trợ sinh viên đại học và người mới bắt đầu sự nghiệp đến từ nước ngoài, những người mong muốn xây dựng sự nghiệp tại Hàn Quốc dù có ít hoặc chưa có kinh nghiệm làm việc. Người tham gia sẽ học về văn hóa doanh nghiệp Hàn Quốc trước, sau đó được tham gia vào môi trường doanh nghiệp thực tế để tích lũy kinh nghiệm và đặt nền móng vững chắc cho sự nghiệp của mình.",
    benefitsTitle: "💡 Quyền lợi khi tham gia chương trình",
    benefit1: "Cấp giấy chứng nhận hoàn thành chính thức",
    benefit2: "Thư giới thiệu và cơ hội chuyển sang vị trí chính thức cho những người xuất sắc",
    cta: "Xem thêm về thời gian, chi phí và chi tiết",
    close: "Đóng"
  },
  ja: {
    title: "CIPとは？",
    body:
      "CIP（Career Immersion Program）は、Aplyが運営する外国人向けの体験型実務研修プログラムです。実務経験が少ない、または未経験ながら韓国でのキャリアを目指す外国人大学生や社会人初心者を支援します。まず韓国の企業文化を学び、その後実際の企業現場で実務を経験することで、キャリアの基盤を築くことができます。",
    benefitsTitle: "💡 プログラム参加メリット",
    benefit1: "公式修了証の発行",
    benefit2: "優秀者に推薦状および正規雇用転換の機会を付与",
    cta: "期間・費用などの詳細を見る",
    close: "閉じる"
  },
  id: {
    title: "Apa itu CIP?",
    body:
      "CIP (Career Immersion Program) adalah program pelatihan berbasis pengalaman yang dirancang khusus untuk talenta internasional, dijalankan oleh Aply. Kami mendukung mahasiswa internasional dan profesional pemula yang bercita-cita membangun karier di Korea Selatan, bahkan dengan sedikit atau tanpa pengalaman kerja sebelumnya. Peserta akan terlebih dahulu mempelajari budaya perusahaan Korea, kemudian mendapatkan pengalaman praktis di berbagai perusahaan untuk membangun fondasi karier yang kuat.",
    benefitsTitle: "💡 Manfaat Program",
    benefit1: "Sertifikat Penyelesaian Resmi",
    benefit2: "Surat rekomendasi dan kesempatan transisi ke pekerjaan tetap untuk peserta terbaik",
    cta: "Pelajari lebih lanjut tentang jadwal, biaya, dan detail",
    close: "Tutup"
  }
};

export function CipInfoModal({ locale, onClose }: { locale: PlatformLocale; onClose: () => void }) {
  const copy = CIP_COPY[locale] ?? CIP_COPY.en;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-elevated"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={copy.close}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="font-display text-lg font-bold tracking-tight">{copy.title}</h2>

        <p className="mt-3 text-[13.5px] leading-relaxed text-foreground/85">{copy.body}</p>

        <div className="mt-5 rounded-xl bg-muted/40 p-4">
          <p className="text-[13px] font-semibold text-foreground">{copy.benefitsTitle}</p>
          <ul className="mt-2 space-y-1 text-[13px] text-foreground/85">
            <li className="flex gap-2">
              <span className="mt-1.5 inline-block h-1 w-1 flex-none rounded-full bg-foreground/60" />
              <span>{copy.benefit1}</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 inline-block h-1 w-1 flex-none rounded-full bg-foreground/60" />
              <span>{copy.benefit2}</span>
            </li>
          </ul>
        </div>

        <a
          href="/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-[13.5px] font-semibold text-background hover:opacity-90"
        >
          {copy.cta}
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
