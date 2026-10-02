"use client";

// 공통 랜딩(로그인 전) — 외국인 구직자를 1순위로 두고, 기업 진입은 보조 줄로 둔다.
// hero 문구는 메인 metadata(app/page.tsx)와 같은 메시지를 쓴다 — 예전에는 검색 title 은
// "외국인을 위한 채용 플랫폼" 인데 화면 h1 은 "구직자와 기업을 잇는" 이라 서로 어긋났다.
// 토스 스타일 진입 모션: 로드 시 부드러운 페이드+슬라이드업(expo-out, 스태거).
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkle, Globe, IdentificationCard, type Icon } from "@phosphor-icons/react";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { AplyFooter } from "../AplyFooter";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { usePlatformT, type PlatformT } from "../../lib/i18n";
import { LandingSections, type LandingJob } from "./LandingSections";
import { trackGrowthLandingView } from "../../lib/analytics";
import { useLanguage } from "../i18n/LanguageProvider";

/** hero primary CTA 목적지. 무료 진단 도구(/tools/visa-job-fit)가 나오면 여기만 바꾼다. */
const PRIMARY_CTA_HREF = "/tools/visa-job-fit";

// 진입 애니메이션 래퍼 — 마운트 시 한 번 리빌(단일 화면이라 전부 초기 노출).
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      style={{
        transitionProperty: "transform, opacity",
        transitionDuration: "620ms",
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        transform: shown ? "translateY(0)" : "translateY(18px)",
        opacity: shown ? 1 : 0
      }}
      className={className}
    >
      {children}
    </div>
  );
}

const cards = (t: PlatformT): { icon: ReactNode; tag: string; title: string; desc: string; cta: string; href: string }[] => [
  {
    icon: <Image src="/images/img_talent_card.webp" alt="" width={208} height={208} className="h-24 w-24 rounded-2xl object-cover shadow-[0_6px_18px_rgba(11,70,232,0.14)]" />,
    tag: t("구직자", "Job seeker", "求职者", "Người tìm việc", "求職者", "Pencari kerja"),
    title: t("첫 이력서부터 첫 지원까지", "From first resume to first application", "从第一份简历到第一次投递", "Từ hồ sơ đến ứng tuyển đầu tiên", "初めての履歴書から初応募まで", "Dari resume hingga lamaran pertama"),
    desc: t(
      "경험을 정리해 이력서·자기소개서를 만들고,\n나에게 맞는 공고를 찾아 지원해요.",
      "Organize your experience into a resume and cover letter,\nthen find and apply to jobs that fit.",
      "整理经历制作简历和自我介绍，\n找到适合的职位并投递。",
      "Sắp xếp kinh nghiệm thành hồ sơ và thư giới thiệu,\nrồi tìm và ứng tuyển việc phù hợp.",
      "経験を整理して履歴書・自己紹介書を作り、\n自分に合う求人を探して応募します。",
      "Susun pengalaman jadi resume dan surat lamaran,\nlalu cari dan lamar lowongan yang cocok."
    ),
    cta: t("취업 준비 시작하기", "Start job prep", "开始求职准备", "Bắt đầu chuẩn bị", "就活を始める", "Mulai persiapan kerja"),
    href: "/talent"
  },
  {
    icon: <Image src="/images/img_partner_card.webp" alt="" width={208} height={208} className="h-24 w-24 rounded-2xl object-cover shadow-[0_6px_18px_rgba(11,70,232,0.14)]" />,
    tag: t("파트너", "Partner", "合作伙伴", "Đối tác", "パートナー", "Partner"),
    title: t("좋은 인재를 만나는 채용", "Hiring that meets great talent", "遇见优秀人才的招聘", "Tuyển dụng gặp nhân tài", "優秀な人材と出会う採用", "Rekrutmen bertemu talenta hebat"),
    desc: t(
      "공고를 올리고 지원자를 관리하고,\n면접 제안까지 한 곳에서 진행해요.",
      "Post jobs, manage applicants,\nand send interview offers — all in one place.",
      "发布职位、管理应聘者，\n面试邀约都在一处完成。",
      "Đăng tin, quản lý ứng viên,\nvà mời phỏng vấn — tất cả ở một nơi.",
      "求人を掲載し応募者を管理し、\n面接提案まで一箇所で進めます。",
      "Pasang lowongan, kelola pelamar,\ndan kirim undangan wawancara di satu tempat."
    ),
    cta: t("채용 시작하기", "Start hiring", "开始招聘", "Bắt đầu tuyển dụng", "採用を始める", "Mulai merekrut"),
    href: "/partner"
  }
];

const chips = (t: PlatformT): { icon: Icon; label: string }[] => [
  { icon: Globe, label: t("외국인 지원 OK", "Foreigners welcome", "欢迎外籍", "Chào đón người nước ngoài", "外国人歓迎", "Terbuka untuk WNA") },
  { icon: Sparkle, label: t("AI 서류 코칭", "AI doc coaching", "AI 文书辅导", "Cố vấn hồ sơ AI", "AI書類コーチング", "Bimbingan dokumen AI") },
  { icon: IdentificationCard, label: t("비자별 공고", "Jobs by visa", "按签证分类", "Việc theo visa", "ビザ別求人", "Lowongan per visa") }
];

/** 서버(app/page.tsx)에서 실제 공고·비자 코드를 받아 내려온다. 비어 있으면 해당 섹션을 생략한다. */
export function CommonLanding({ jobs = [], visaCodes = [] }: { jobs?: LandingJob[]; visaCodes?: string[] }) {
  const router = useRouter();
  const t = usePlatformT();
  const { user, isReady, isAuthenticated } = useAuthSession();

  const { locale } = useLanguage();
  // 랜딩 진입 1회 계측 — 개인정보는 보내지 않는다(로케일·로그인 여부만).
  const viewSent = useRef(false);
  useEffect(() => {
    if (!isReady || viewSent.current) return;
    viewSent.current = true;
    trackGrowthLandingView({ locale, loggedIn: isAuthenticated });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  // 이미 로그인한 사용자는 역할별 앱으로.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    router.replace(user?.role === "PARTNER" ? "/partner" : "/talent/home");
  }, [isReady, isAuthenticated, user?.role, router]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-white text-[#191F28]">
      {/* 화면 전체 배경 — 상단 그라데이션 + 부유 블롭. 헤더까지 덮어 GNB가 배경과 이어짐 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-3/5 bg-gradient-to-b from-[#F4F7FF] via-[#FAFBFF] to-white" />
        <div className="landing-blob-a absolute -top-28 left-[10%] h-[380px] w-[380px] rounded-full bg-[#0B46E8]/[0.08] blur-[100px]" />
        <div className="landing-blob-b absolute -bottom-32 right-[8%] h-[440px] w-[440px] rounded-full bg-[#5B86F5]/[0.10] blur-[120px]" />
      </div>

      {/* 상단 GNB — 로고 + 언어선택 이모지 버튼만. 배경은 투명(메인 그라데이션과 이어짐) */}
      <header className="sticky top-0 z-40 bg-transparent">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" aria-label={t("APLY 홈", "APLY home", "APLY 主页", "Trang chủ APLY", "APLYホーム", "Beranda APLY")} className="flex items-center">
            <Image src="/img_logo.webp" alt="APLY" width={72} height={24} className="h-5 w-auto" priority />
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      {/* 본문 — 화면 중앙에 인사 + 진입 카드 2개 */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-5 py-10">
        <div className="relative w-full max-w-4xl">
          <div className="text-center">
            <Reveal delay={60}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E4EDFB] bg-white/70 px-3.5 py-1.5 text-[12px] font-bold text-[#0B46E8] shadow-[0_1px_8px_rgba(11,70,232,0.06)]">
                <Sparkle className="h-3.5 w-3.5" weight="fill" /> {t("처음이라도 괜찮아요, APLY", "New here? APLY's got you", "第一次也没关系，APLY", "Lần đầu cũng ổn, có APLY", "初めてでも大丈夫、APLY", "Baru pun tak apa, ada APLY")}
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mx-auto mt-6 max-w-[680px] break-keep text-[31px] font-black leading-[1.16] tracking-[-0.035em] text-[#0B1227] md:text-[46px]">
                {t("한국에서 일하고 싶은", "Want to work in Korea?", "想在韩国工作", "Muốn làm việc ở Hàn Quốc", "韓国で働きたい", "Ingin bekerja di Korea")}<br />
                <span className="bg-gradient-to-r from-[#0B46E8] to-[#5B86F5] bg-clip-text text-transparent">
                  {t("외국인을 위한 취업 플랫폼", "The job platform for internationals", "为外国人打造的求职平台", "Nền tảng việc làm cho người nước ngoài", "外国人のための就職プラットフォーム", "Platform kerja untuk WNA")}
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mx-auto mt-5 max-w-[540px] break-keep text-[15px] leading-relaxed text-[#8B95A1] md:text-[16px]">
                {t(
                  "비자에 맞는 채용공고를 찾고, 한국식 이력서와 면접까지 한 곳에서 준비하세요.",
                  "Find jobs that fit your visa, and prepare a Korean-style resume and interview — all in one place.",
                  "找到符合签证条件的职位，并在一处准备韩式简历与面试。",
                  "Tìm việc phù hợp visa và chuẩn bị CV, phỏng vấn kiểu Hàn ở một nơi.",
                  "ビザに合う求人を探し、韓国式の履歴書と面接までここで準備しましょう。",
                  "Temukan lowongan sesuai visa dan siapkan resume serta wawancara ala Korea di satu tempat."
                )}
              </p>
            </Reveal>
            {/* primary CTA 는 하나만 강조 — 보조 CTA 는 텍스트 링크 수준으로 둔다. */}
            <Reveal delay={220}>
              <div className="mt-7 flex flex-col items-center gap-3">
                <Link
                  href={PRIMARY_CTA_HREF}
                  className="inline-flex h-13 items-center justify-center rounded-2xl bg-[#0B46E8] px-7 text-[15px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(11,70,232,0.5)] transition hover:bg-[#0A3ECB]"
                  style={{ height: 52 }}
                >
                  {t("내 비자로 지원 가능한 공고 찾기", "Find jobs my visa allows", "查找我的签证可投递的职位", "Tìm việc visa của tôi được phép", "自分のビザで応募できる求人を探す", "Cari lowongan yang visa saya izinkan")}
                </Link>
                <Link href="/talent/jobs" className="text-[13.5px] font-bold text-[#4E5968] underline underline-offset-2 transition hover:text-[#0B46E8]">
                  {t("전체 채용공고 보기", "See all jobs", "查看全部职位", "Xem tất cả việc làm", "すべての求人を見る", "Lihat semua lowongan")}
                </Link>
              </div>
            </Reveal>
          </div>


          <Reveal delay={440}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
              {chips(t).map((c) => {
                const CIcon = c.icon;
                return (
                  <span key={c.label} className="inline-flex items-center gap-1.5 rounded-full border border-[#EEF1F5] bg-white/70 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#4E5968] shadow-[0_1px_6px_rgba(11,18,39,0.04)] backdrop-blur-sm">
                    <CIcon className="h-3.5 w-3.5 text-[#0B46E8]" weight="fill" /> {c.label}
                  </span>
                );
              })}
            </div>
          </Reveal>


          {/* 구직자·파트너 진입 카드 — 원래 메인의 형태. 요청으로 복원했다. */}
          <div className="mt-11 grid gap-4 md:grid-cols-2">
            {cards(t).map((c, i) => (
              <Reveal key={c.tag} delay={240 + i * 90}>
                <AudienceCard {...c} />
              </Reveal>
            ))}
          </div>
          {/* 본문 섹션 — 실제 공고 · 비자 가이드 · 준비 도구 · Career Launch · 신뢰 기준 · CTA */}
          <LandingSections jobs={jobs} visaCodes={visaCodes} />
        </div>
      </main>

      <AplyFooter />
    </div>
  );
}

function AudienceCard({ icon, tag, title, desc, cta, href }: { icon: ReactNode; tag: string; title: string; desc: string; cta: string; href: string }) {
  return (
    <Link href={href} className="group flex h-full flex-col rounded-3xl border border-[#EEF1F5] bg-[#FAFBFC] p-7 transition duration-300 hover:-translate-y-0.5 hover:border-[#0B46E8]/30 hover:bg-[#F5F8FF] hover:shadow-[0_12px_32px_rgba(11,70,232,0.1)]">
      <span className="inline-flex">{icon}</span>
      <p className="mt-5 text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{tag}</p>
      <h2 className="mt-1.5 break-keep text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[#8B95A1]">{desc}</p>
      <span className="mt-6 inline-flex items-center gap-1 text-[13.5px] font-bold text-[#0B46E8]">
        {cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" weight="bold" />
      </span>
    </Link>
  );
}
