"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Export as ShareIcon,
  Lock,
  MoonStars,
  Sparkle,
  Star
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { type PlatformLocale } from "../../lib/auth-messages";
import { fetchSajuResult, type SajuResultPayload } from "../../lib/saju-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Display-only translation for the Korean job-role taxonomy. The
// underlying values stay Korean (saved in Position.preferredJobRole and
// used as the canonical key for matching), but we localize the chip
// labels so non-Korean readers see something they can parse.
const JOB_ROLE_TRANSLATIONS: Partial<Record<PlatformLocale, Record<string, string>>> = {
  en: {
    "개발": "Engineering",
    "디자인": "Design",
    "기획·전략": "Planning & Strategy",
    "마케팅·광고": "Marketing & Advertising",
    "영업": "Sales",
    "고객서비스·리테일": "Customer Service & Retail",
    "경영·비즈니스": "Business & Operations",
    "미디어": "Media",
    "교육": "Education",
    "법률·법집행기관": "Legal",
    "금융": "Finance",
    "의료·제약": "Healthcare & Pharma",
    "건설·생산": "Construction & Manufacturing",
    "연구·R&D": "Research & R&D",
    "HR·인사": "HR",
    "통·번역": "Interpretation & Translation",
    "IT 운영·관리": "IT Operations"
  },
  "zh-CN": {
    "개발": "开发",
    "디자인": "设计",
    "기획·전략": "策划与战略",
    "마케팅·광고": "市场营销与广告",
    "영업": "销售",
    "고객서비스·리테일": "客户服务与零售",
    "경영·비즈니스": "经营与商务",
    "미디어": "媒体",
    "교육": "教育",
    "법률·법집행기관": "法律",
    "금융": "金融",
    "의료·제약": "医疗与制药",
    "건설·생산": "建设与生产",
    "연구·R&D": "研究与研发",
    "HR·인사": "人力资源",
    "통·번역": "口译与翻译",
    "IT 운영·관리": "IT 运营"
  },
  vi: {
    "개발": "Phát triển",
    "디자인": "Thiết kế",
    "기획·전략": "Lập kế hoạch & Chiến lược",
    "마케팅·광고": "Marketing & Quảng cáo",
    "영업": "Kinh doanh",
    "고객서비스·리테일": "Dịch vụ khách hàng & Bán lẻ",
    "경영·비즈니스": "Quản trị & Kinh doanh",
    "미디어": "Truyền thông",
    "교육": "Giáo dục",
    "법률·법집행기관": "Pháp lý",
    "금융": "Tài chính",
    "의료·제약": "Y tế & Dược phẩm",
    "건설·생산": "Xây dựng & Sản xuất",
    "연구·R&D": "Nghiên cứu & R&D",
    "HR·인사": "Nhân sự",
    "통·번역": "Phiên dịch",
    "IT 운영·관리": "Vận hành IT"
  },
  ja: {
    "개발": "開発",
    "디자인": "デザイン",
    "기획·전략": "企画・戦略",
    "마케팅·광고": "マーケティング・広告",
    "영업": "営業",
    "고객서비스·리테일": "カスタマーサービス・小売",
    "경영·비즈니스": "経営・ビジネス",
    "미디어": "メディア",
    "교육": "教育",
    "법률·법집행기관": "法務",
    "금융": "金融",
    "의료·제약": "医療・製薬",
    "건설·생산": "建設・生産",
    "연구·R&D": "研究・R&D",
    "HR·인사": "人事",
    "통·번역": "通訳・翻訳",
    "IT 운영·관리": "IT運用"
  },
  id: {
    "개발": "Engineering",
    "디자인": "Desain",
    "기획·전략": "Perencanaan & Strategi",
    "마케팅·광고": "Pemasaran & Iklan",
    "영업": "Sales",
    "고객서비스·리테일": "Layanan Pelanggan & Ritel",
    "경영·비즈니스": "Manajemen & Bisnis",
    "미디어": "Media",
    "교육": "Pendidikan",
    "법률·법집행기관": "Hukum",
    "금융": "Keuangan",
    "의료·제약": "Kesehatan & Farmasi",
    "건설·생산": "Konstruksi & Produksi",
    "연구·R&D": "Riset & R&D",
    "HR·인사": "HR",
    "통·번역": "Penerjemahan",
    "IT 운영·관리": "Operasi IT"
  }
};

function translateRole(role: string, locale: PlatformLocale): string {
  if (locale === "ko") return role;
  return JOB_ROLE_TRANSLATIONS[locale]?.[role] ?? role;
}

type Copy = {
  pillSuffix: string;
  pillFallback: string;
  titleA: string;
  titleHighlight: string;
  titleB: string;
  retry: string;
  loading: string;
  errFetch: string;
  shareTitleSuffix: string;
  shareTitleFallback: string;
  shareTextFallback: string;
  gateText: string;
  naverBtn: string;
  kakaoBtn: string;
  googleBtn: string;
  emailBtn: string;
  elementBalanceHeading: string;
  dayMasterHeading: string;
  strengthsHeading: string;
  specificRolesHeading: string;
  roleReasoningsHeading: string;
  workEnvHeading: string;
  cautionHeading: string;
  industriesHeading: string;
  rolesToAvoidHeading: string;
  growthPatternHeading: string;
  mottoHeading: string;
  positionsHeading: string;
  woodLabel: string;
  fireLabel: string;
  earthLabel: string;
  metalLabel: string;
  waterLabel: string;
  morePositionsBtn: string;
  linkCopied: string;
  shareBtn: string;
  countSuffix: string;
  countUnit: string;
  numberLocale: string;
};

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    pillSuffix: "님의 오행 사주 풀이",
    pillFallback: "오행 사주 풀이",
    titleA: "",
    titleHighlight: "이런 일",
    titleB: "이\n당신과 잘 통할 것 같아요",
    retry: "다시 풀어보기",
    loading: "결과를 불러오는 중...",
    errFetch: "결과를 불러오지 못했습니다.",
    shareTitleSuffix: "님의 사주가 말하는 미래 직업은?",
    shareTitleFallback: "나의 사주가 말하는 미래 직업은?",
    shareTextFallback: "Aply의 오행 사주로 나에게 맞는 직업을 추천받아보세요.",
    gateText: "결과 전체와 어울리는 채용 공고를 보려면\n간단한 회원가입이 필요합니다.",
    naverBtn: "네이버로 결과보기",
    kakaoBtn: "카카오로 결과보기",
    googleBtn: "구글로 결과보기",
    emailBtn: "이메일로 결과보기",
    elementBalanceHeading: "나의 오행 분포",
    dayMasterHeading: "나의 일주",
    strengthsHeading: "당신의 강점",
    specificRolesHeading: "구체적으로 어울리는 직무",
    roleReasoningsHeading: "이 직무가 잘 맞는 이유",
    workEnvHeading: "잘 맞는 업무 환경",
    cautionHeading: "한 가지 조언",
    industriesHeading: "어울리는 산업 분야",
    rolesToAvoidHeading: "피하면 좋은 업무 스타일",
    growthPatternHeading: "커리어 성장 패턴",
    mottoHeading: "나만의 한 마디",
    positionsHeading: "지금 지원할 수 있는 어울리는 공고",
    woodLabel: "목(木)",
    fireLabel: "화(火)",
    earthLabel: "토(土)",
    metalLabel: "금(金)",
    waterLabel: "수(水)",
    morePositionsBtn: "내 사주에 맞는 공고 더 보기",
    linkCopied: "링크가 복사되었어요",
    shareBtn: "친구에게 공유하기",
    countSuffix: "명이 이벤트에 참여했어요",
    countUnit: "지금까지",
    numberLocale: "ko-KR"
  },
  en: {
    pillSuffix: "'s Five-Element reading",
    pillFallback: "Five-Element reading",
    titleA: "",
    titleHighlight: "This kind of work",
    titleB: "\nmight just click with you",
    retry: "Try again",
    loading: "Loading your result...",
    errFetch: "Couldn't load the result.",
    shareTitleSuffix: "'s future job — see what Saju says",
    shareTitleFallback: "What does my Saju say my future job is?",
    shareTextFallback: "Get an Aply Five-Element Saju career reading.",
    gateText: "Sign up to see the full reading and\nmatching job openings.",
    naverBtn: "Continue with Naver",
    kakaoBtn: "Continue with Kakao",
    googleBtn: "Continue with Google",
    emailBtn: "Continue with email",
    elementBalanceHeading: "Your Five-Element balance",
    dayMasterHeading: "Your day-master",
    strengthsHeading: "Your strengths",
    specificRolesHeading: "Roles that fit you",
    roleReasoningsHeading: "Why these roles work",
    workEnvHeading: "Work environments that suit you",
    cautionHeading: "A gentle note",
    industriesHeading: "Industries that suit you",
    rolesToAvoidHeading: "Work styles to avoid",
    growthPatternHeading: "Your career growth pattern",
    mottoHeading: "Your motto",
    positionsHeading: "Open jobs that match your reading",
    woodLabel: "Wood",
    fireLabel: "Fire",
    earthLabel: "Earth",
    metalLabel: "Metal",
    waterLabel: "Water",
    morePositionsBtn: "See more matching jobs",
    linkCopied: "Link copied",
    shareBtn: "Share with friends",
    countSuffix: "people have joined the event",
    countUnit: "So far",
    numberLocale: "en-US"
  },
  "zh-CN": {
    pillSuffix: "的五行八字解读",
    pillFallback: "五行八字解读",
    titleA: "",
    titleHighlight: "这样的工作",
    titleB: "\n似乎会和你很合拍",
    retry: "重新解读",
    loading: "正在载入结果...",
    errFetch: "无法载入结果。",
    shareTitleSuffix: "的未来职业 — 看八字怎么说",
    shareTitleFallback: "我的八字诉说未来职业是?",
    shareTextFallback: "Aply 五行八字职业匹配，立即查看。",
    gateText: "查看完整解读和匹配的招聘岗位\n请先简单注册。",
    naverBtn: "使用 Naver 继续",
    kakaoBtn: "使用 Kakao 继续",
    googleBtn: "使用 Google 继续",
    emailBtn: "使用邮箱继续",
    elementBalanceHeading: "你的五行分布",
    dayMasterHeading: "你的日主",
    strengthsHeading: "你的优势",
    specificRolesHeading: "适合你的具体职业",
    roleReasoningsHeading: "为什么这些职业合适",
    workEnvHeading: "适合你的工作环境",
    cautionHeading: "一个建议",
    industriesHeading: "适合你的行业",
    rolesToAvoidHeading: "建议避免的工作风格",
    growthPatternHeading: "你的职业成长轨迹",
    mottoHeading: "你的座右铭",
    positionsHeading: "可以申请的匹配岗位",
    woodLabel: "木",
    fireLabel: "火",
    earthLabel: "土",
    metalLabel: "金",
    waterLabel: "水",
    morePositionsBtn: "查看更多匹配岗位",
    linkCopied: "链接已复制",
    shareBtn: "分享给朋友",
    countSuffix: "人已参与活动",
    countUnit: "目前已有",
    numberLocale: "zh-CN"
  },
  vi: {
    pillSuffix: " — Tử vi Ngũ Hành",
    pillFallback: "Tử vi Ngũ Hành",
    titleA: "",
    titleHighlight: "Công việc kiểu này",
    titleB: "\ncó vẻ rất hợp với bạn",
    retry: "Xem lại",
    loading: "Đang tải kết quả...",
    errFetch: "Không thể tải kết quả.",
    shareTitleSuffix: " — công việc tương lai theo tử vi",
    shareTitleFallback: "Tử vi nói công việc tương lai của tôi là?",
    shareTextFallback: "Khám phá công việc qua Aply Ngũ Hành Tử Vi.",
    gateText: "Để xem toàn bộ kết quả và việc làm phù hợp\nvui lòng đăng ký nhanh.",
    naverBtn: "Tiếp tục với Naver",
    kakaoBtn: "Tiếp tục với Kakao",
    googleBtn: "Tiếp tục với Google",
    emailBtn: "Tiếp tục với email",
    elementBalanceHeading: "Cân bằng Ngũ Hành của bạn",
    dayMasterHeading: "Chủ nhật (Day-master)",
    strengthsHeading: "Điểm mạnh của bạn",
    specificRolesHeading: "Vị trí cụ thể phù hợp",
    roleReasoningsHeading: "Vì sao những vị trí này hợp",
    workEnvHeading: "Môi trường làm việc phù hợp",
    cautionHeading: "Lời khuyên nhỏ",
    industriesHeading: "Ngành nghề phù hợp",
    rolesToAvoidHeading: "Phong cách công việc nên tránh",
    growthPatternHeading: "Mô hình phát triển sự nghiệp",
    mottoHeading: "Phương châm của bạn",
    positionsHeading: "Việc làm đang tuyển phù hợp",
    woodLabel: "Mộc",
    fireLabel: "Hỏa",
    earthLabel: "Thổ",
    metalLabel: "Kim",
    waterLabel: "Thủy",
    morePositionsBtn: "Xem thêm việc làm phù hợp",
    linkCopied: "Đã sao chép liên kết",
    shareBtn: "Chia sẻ với bạn bè",
    countSuffix: "người đã tham gia sự kiện",
    countUnit: "Đến nay",
    numberLocale: "vi-VN"
  },
  ja: {
    pillSuffix: "さんの五行四柱推命",
    pillFallback: "五行四柱推命",
    titleA: "",
    titleHighlight: "こんな仕事",
    titleB: "が\nあなたとぴったり合いそう",
    retry: "もう一度見る",
    loading: "結果を読み込み中...",
    errFetch: "結果を読み込めませんでした。",
    shareTitleSuffix: "さんの未来の仕事 — 四柱推命の答え",
    shareTitleFallback: "私の四柱推命が告げる未来の仕事は?",
    shareTextFallback: "Aply の五行四柱推命であなたに合う仕事を診断。",
    gateText: "結果全文とマッチする求人を見るには\n簡単な会員登録が必要です。",
    naverBtn: "Naver で続ける",
    kakaoBtn: "Kakao で続ける",
    googleBtn: "Google で続ける",
    emailBtn: "メールで続ける",
    elementBalanceHeading: "あなたの五行バランス",
    dayMasterHeading: "あなたの日主",
    strengthsHeading: "あなたの強み",
    specificRolesHeading: "具体的に合いそうな職種",
    roleReasoningsHeading: "なぜこの職種が合うのか",
    workEnvHeading: "合う仕事環境",
    cautionHeading: "ひとつのアドバイス",
    industriesHeading: "合いそうな業界",
    rolesToAvoidHeading: "避けたい仕事スタイル",
    growthPatternHeading: "キャリアの成長パターン",
    mottoHeading: "あなたのモットー",
    positionsHeading: "今応募できる相性のいい求人",
    woodLabel: "木",
    fireLabel: "火",
    earthLabel: "土",
    metalLabel: "金",
    waterLabel: "水",
    morePositionsBtn: "私の四柱推命に合う求人をもっと見る",
    linkCopied: "リンクをコピーしました",
    shareBtn: "友達にシェア",
    countSuffix: "人がイベントに参加しました",
    countUnit: "これまでに",
    numberLocale: "ja-JP"
  },
  id: {
    pillSuffix: " — Pembacaan Saju Lima Unsur",
    pillFallback: "Pembacaan Saju Lima Unsur",
    titleA: "",
    titleHighlight: "Pekerjaan seperti ini",
    titleB: "\nsepertinya cocok untukmu",
    retry: "Coba lagi",
    loading: "Memuat hasil...",
    errFetch: "Tidak dapat memuat hasil.",
    shareTitleSuffix: " — pekerjaan masa depan menurut Saju",
    shareTitleFallback: "Saju saya berkata pekerjaan masa depan saya?",
    shareTextFallback: "Dapatkan pembacaan karier Saju Lima Unsur dari Aply.",
    gateText: "Untuk melihat hasil penuh dan lowongan yang cocok\ndaftar singkat dulu.",
    naverBtn: "Lanjutkan dengan Naver",
    kakaoBtn: "Lanjutkan dengan Kakao",
    googleBtn: "Lanjutkan dengan Google",
    emailBtn: "Lanjutkan dengan email",
    elementBalanceHeading: "Keseimbangan Lima Unsurmu",
    dayMasterHeading: "Day-master",
    strengthsHeading: "Kekuatanmu",
    specificRolesHeading: "Peran spesifik yang cocok",
    roleReasoningsHeading: "Mengapa peran ini cocok",
    workEnvHeading: "Lingkungan kerja yang cocok",
    cautionHeading: "Satu saran",
    industriesHeading: "Industri yang cocok",
    rolesToAvoidHeading: "Gaya kerja yang sebaiknya dihindari",
    growthPatternHeading: "Pola pertumbuhan karier",
    mottoHeading: "Mottomu",
    positionsHeading: "Lowongan terbuka yang cocok",
    woodLabel: "Kayu",
    fireLabel: "Api",
    earthLabel: "Tanah",
    metalLabel: "Logam",
    waterLabel: "Air",
    morePositionsBtn: "Lihat lebih banyak lowongan yang cocok",
    linkCopied: "Tautan disalin",
    shareBtn: "Bagikan ke teman",
    countSuffix: "orang telah ikut acara ini",
    countUnit: "Sejauh ini",
    numberLocale: "id-ID"
  }
};

export function SajuResultPage({ slug }: { slug: string }) {
  const { user } = useAuthSession();
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [payload, setPayload] = useState<SajuResultPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await fetchSajuResult(slug, locale);
        if (!cancelled) setPayload(result);
      } catch (error) {
        if (!cancelled) setErrorMessage(error instanceof Error ? error.message : copy.errFetch);
      }
    })();
    return () => {
      cancelled = true;
    };
    // re-fetch when user logs in mid-session so we claim the prediction,
    // or when they switch the page language (triggers server-side translate)
  }, [slug, user?.id, locale, copy.errFetch]);

  const interpretation = payload?.prediction.interpretation ?? "";
  const recommendedRoleNames = payload?.prediction.recommendedRoleNames ?? [];
  const details = payload?.prediction.details ?? null;
  const positions = payload?.positions ?? [];
  const name = payload?.prediction.name ?? "";

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    const shareTitle = name ? `${name}${copy.shareTitleSuffix}` : copy.shareTitleFallback;
    const shareText = interpretation
      ? interpretation.slice(0, 110) + (interpretation.length > 110 ? "..." : "")
      : copy.shareTextFallback;
    // Web Share API first — opens the native sheet on mobile (KakaoTalk,
    // SMS, etc. all show up). Fall back to clipboard copy elsewhere.
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b2a] text-white">
      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col bg-gradient-to-b from-[#0b0b2a] via-[#1a1340] to-[#0b0b2a]">
        <main className="relative flex flex-1 flex-col overflow-hidden">
          <Link
            href="/events/saju"
            aria-label="Back"
            className="absolute left-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/80 backdrop-blur-sm transition active:bg-white/10 active:text-white"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" />
          </Link>
          <section className="relative px-5 pt-10 pb-5 text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-3 py-1 text-[11px] font-medium text-yellow-100">
              <MoonStars weight="fill" className="h-3 w-3" />
              {name ? `${name}${copy.pillSuffix}` : copy.pillFallback}
            </div>
            <h1 className="whitespace-pre-line text-[22px] font-bold leading-tight">
              {copy.titleA}
              <span className="bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
                {copy.titleHighlight}
              </span>
              {copy.titleB}
            </h1>
          </section>

          {errorMessage ? (
            <section className="px-5 pb-16">
              <div className="rounded-2xl border border-red-400/40 bg-red-400/10 p-5 text-center text-red-200">
                <p className="text-[14px] font-medium">{errorMessage}</p>
                <Link
                  href="/events/saju"
                  className="mt-3 inline-flex items-center gap-2 text-[13px] text-yellow-200 underline-offset-4 active:underline"
                >
                  {copy.retry}
                </Link>
              </div>
            </section>
          ) : !payload ? (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0b0b2a]/80 backdrop-blur-md"
              aria-live="polite"
              role="status"
            >
              <div className="relative flex flex-col items-center gap-5 px-8 text-center">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-12 -z-10 rounded-full bg-purple-500/20 blur-3xl"
                />
                <div className="relative h-20 w-20">
                  <div className="absolute inset-0 animate-spin-slow">
                    <Sparkle weight="fill" className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 text-yellow-200" />
                    <Sparkle weight="fill" className="absolute top-1/2 -right-1 h-2.5 w-2.5 -translate-y-1/2 text-yellow-100/80" />
                    <Sparkle weight="fill" className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 text-yellow-200/70" />
                    <Sparkle weight="fill" className="absolute top-1/2 -left-1 h-2.5 w-2.5 -translate-y-1/2 text-yellow-100/60" />
                  </div>
                  <div className="absolute inset-3 flex items-center justify-center">
                    <MoonStars weight="fill" className="h-12 w-12 text-yellow-200 animate-pulse" />
                  </div>
                </div>
                <p className="text-[15px] font-medium text-white">{copy.loading}</p>
              </div>
              <style jsx global>{`
                @keyframes spin-slow {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                  animation: spin-slow 4s linear infinite;
                }
              `}</style>
            </div>
          ) : (
            <>
              <section className="relative px-5">
                <div className="relative overflow-hidden rounded-3xl bg-white/[0.04] p-5">
                  {!isAuthenticated ? (
                    <div className="pointer-events-none relative max-h-[120px] overflow-hidden">
                      <div className="select-none blur-sm" aria-hidden>
                        <p className="text-[14px] leading-[1.75] whitespace-pre-wrap text-white/90">
                          {interpretation}
                        </p>
                      </div>
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-[#1a1340]" />
                    </div>
                  ) : (
                    <>
                      <div className="text-white/90">
                        <p className="text-[14px] leading-[1.75] whitespace-pre-wrap">
                          {interpretation}
                        </p>
                      </div>
                      <div className="mt-5 flex flex-wrap gap-1.5">
                        {recommendedRoleNames.map((role) => (
                          <span
                            key={role}
                            className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-2.5 py-1 text-[11px] font-medium text-yellow-100"
                          >
                            <Star weight="fill" className="mr-1 inline h-2.5 w-2.5" />
                            {translateRole(role, locale)}
                          </span>
                        ))}
                      </div>
                    </>
                  )}

                  {!isAuthenticated ? (
                    <div className="mt-4 flex flex-col items-center gap-4 text-center">
                      <Lock className="h-7 w-7 text-yellow-200" />
                      <p className="whitespace-pre-line text-[13px] text-white/85">{copy.gateText}</p>
                      <div className="flex w-full flex-col gap-2">
                        <a
                          href={`${API_BASE}/auth/naver/start?next=${encodeURIComponent(`/events/saju/result/${slug}`)}`}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] text-[14px] font-semibold text-white transition active:bg-[#02b551]"
                        >
                          <span aria-hidden className="text-base font-black">N</span>
                          {copy.naverBtn}
                        </a>
                        <a
                          href={`${API_BASE}/auth/kakao/start?next=${encodeURIComponent(`/events/saju/result/${slug}`)}`}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[14px] font-semibold text-[#191919] transition active:bg-[#f5dd00]"
                        >
                          <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78L5.5 21.5c-.1.34.27.62.57.43L10.5 19c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                          </svg>
                          {copy.kakaoBtn}
                        </a>
                        <a
                          href={`${API_BASE}/auth/google/start?next=${encodeURIComponent(`/events/saju/result/${slug}`)}`}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[14px] font-semibold text-[#191919] transition active:bg-white/90"
                        >
                          <svg aria-hidden className="h-4 w-4" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                          </svg>
                          {copy.googleBtn}
                        </a>
                        <Link
                          href={`/signup?next=${encodeURIComponent(`/events/saju/result/${slug}`)}`}
                          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-[14px] font-semibold text-white transition active:bg-white/15"
                        >
                          {copy.emailBtn}
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>

              {isAuthenticated && details?.elementBalance ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.elementBalanceHeading}</h2>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <div className="space-y-3">
                      {([
                        { key: "wood", label: copy.woodLabel, color: "#86efac" },
                        { key: "fire", label: copy.fireLabel, color: "#fca5a5" },
                        { key: "earth", label: copy.earthLabel, color: "#fcd34d" },
                        { key: "metal", label: copy.metalLabel, color: "#e5e7eb" },
                        { key: "water", label: copy.waterLabel, color: "#93c5fd" }
                      ] as const).map((el) => {
                        const value = details.elementBalance![el.key];
                        return (
                          <div key={el.key} className="flex items-center gap-3">
                            <span className="w-12 flex-shrink-0 text-[12px] font-medium text-white/80">
                              {el.label}
                            </span>
                            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${value}%`, backgroundColor: el.color }}
                              />
                            </div>
                            <span className="w-9 flex-shrink-0 text-right text-[12px] tabular-nums text-white/60">
                              {value}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {details.dayMaster ? (
                      <div className="mt-5 border-t border-white/10 pt-4">
                        <div className="text-[11px] font-medium text-white/55">{copy.dayMasterHeading}</div>
                        <div className="mt-1 text-[14px] font-semibold text-yellow-100">{details.dayMaster}</div>
                      </div>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.motto ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.mottoHeading}</h2>
                  <div className="rounded-2xl bg-gradient-to-br from-yellow-300/15 to-amber-300/[0.06] p-5 text-center">
                    <p className="text-[15px] font-medium leading-[1.5] text-yellow-100">&ldquo;{details.motto}&rdquo;</p>
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.strengths && details.strengths.length > 0 ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.strengthsHeading}</h2>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <ul className="space-y-2.5">
                      {details.strengths.map((s, i) => (
                        <li key={i} className="flex gap-2 text-[13px] leading-[1.6] text-white/85">
                          <Star weight="fill" className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-yellow-200" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.roleReasonings && details.roleReasonings.length > 0 ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.roleReasoningsHeading}</h2>
                  <div className="space-y-3">
                    {details.roleReasonings.map((r) => (
                      <div key={r.role} className="rounded-2xl bg-white/[0.04] p-5">
                        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-yellow-300/30 bg-yellow-300/10 px-2.5 py-1 text-[11px] font-medium text-yellow-100">
                          <Star weight="fill" className="h-2.5 w-2.5" />
                          {translateRole(r.role, locale)}
                        </div>
                        <p className="text-[13px] leading-[1.7] text-white/85">{r.reason}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.workEnvironment && details.workEnvironment.length > 0 ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.workEnvHeading}</h2>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <ul className="space-y-2.5">
                      {details.workEnvironment.map((s, i) => (
                        <li key={i} className="flex gap-2 text-[13px] leading-[1.6] text-white/85">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-200/80" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.cautionAdvice ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.cautionHeading}</h2>
                  <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/[0.06] p-5">
                    <p className="text-[13px] leading-[1.7] text-yellow-100/90">{details.cautionAdvice}</p>
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.recommendedIndustries && details.recommendedIndustries.length > 0 ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.industriesHeading}</h2>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <div className="flex flex-wrap gap-2">
                      {details.recommendedIndustries.map((industry) => (
                        <span
                          key={industry}
                          className="rounded-full bg-yellow-300/10 px-3 py-1.5 text-[12px] font-medium text-yellow-100"
                        >
                          {industry}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.rolesToAvoid && details.rolesToAvoid.length > 0 ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.rolesToAvoidHeading}</h2>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <ul className="space-y-2.5">
                      {details.rolesToAvoid.map((s, i) => (
                        <li key={i} className="flex gap-2 text-[13px] leading-[1.6] text-white/70">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/30" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.growthPattern ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.growthPatternHeading}</h2>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <p className="text-[13px] leading-[1.7] text-white/85">{details.growthPattern}</p>
                  </div>
                </section>
              ) : null}

              {isAuthenticated && positions.length > 0 ? (
                <section className="px-5 pt-8">
                  <h2 className="mb-3 text-[15px] font-semibold text-white">{copy.positionsHeading}</h2>
                  <div className="space-y-2.5">
                    {positions.map((position) => {
                      const thumb =
                        position.thumbnailImages?.[0] ??
                        position.partnerOrganization?.companyLogoImageData ??
                        null;
                      return (
                        <div
                          key={position.id}
                          className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3"
                        >
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06]">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Star weight="fill" className="h-5 w-5 text-yellow-200/60" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium text-white">
                              {position.title}
                            </div>
                            <div className="mt-0.5 truncate text-[11px] text-white/55">
                              {[
                                position.partnerOrganization?.name,
                                position.preferredJobRole,
                                position.workLocation
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {details?.specificRoles && details.specificRoles.length > 0 ? (
                    <a
                      href={`/positions?search=${encodeURIComponent(details.specificRoles.join(" "))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-400 text-[14px] font-semibold text-[#1a1340] shadow-[0_8px_24px_-12px_rgba(250,204,21,0.6)] transition active:from-yellow-200 active:to-amber-300"
                    >
                      {copy.morePositionsBtn}
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  ) : null}
                </section>
              ) : null}

              {isAuthenticated ? (
                <section className="mt-8 px-5 pb-12">
                  <div className="relative mx-auto mb-4 aspect-[3/2] w-[78%] max-w-[360px]">
                    <Image
                      src="/img_saju_event_result.webp"
                      alt=""
                      fill
                      sizes="(max-width: 480px) 78vw, 360px"
                      className="object-contain"
                    />
                  </div>
                  <Button
                    onClick={handleShare}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] text-[13px] font-medium text-white transition active:bg-white/[0.07]"
                  >
                    <ShareIcon weight="bold" className="h-4 w-4" />
                    {copyState === "copied" ? copy.linkCopied : copy.shareBtn}
                  </Button>
                  {payload.totalPredictions > 0 ? (
                    <p className="mt-4 text-center text-[14px] text-white/70">
                      {copy.countUnit}{" "}
                      <span className="font-bold text-yellow-200">
                        {payload.totalPredictions.toLocaleString(copy.numberLocale)}
                      </span>
                      {copy.countSuffix.startsWith(" ") ? "" : " "}
                      {copy.countSuffix}
                    </p>
                  ) : null}
                </section>
              ) : null}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
