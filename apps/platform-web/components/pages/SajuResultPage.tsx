"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Export as ShareIcon,
  LockSimple,
  MoonStars,
  Sparkle,
  Star,
  WarningCircle
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { type PlatformLocale } from "../../lib/auth-messages";
import { translateRole } from "../../lib/saju-taxonomy";
import {
  fetchSajuResult,
  isSajuOwned,
  submitSajuLead,
  type SajuLeadRecommendation,
  type SajuLeadRequest,
  type SajuResultPayload
} from "../../lib/saju-client";
import { SajuCareerForm } from "./SajuCareerForm";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ImprovementCode = "RESUME" | "KOREAN" | "VISA" | "CONTACT" | "PORTFOLIO" | "ENGLISH";
type RecStatus = "UNVERIFIED" | "NEEDS_WORK" | "RECOMMENDABLE";

type Copy = {
  pillSuffix: string;
  pillFallback: string;
  titleA: string;
  titleHighlight: string;
  titleB: string;
  retry: string;
  loading: string;
  errFetch: string;
  careerTypeHeading: string;
  interpretationHeading: string;
  elementBalanceHeading: string;
  dayMasterHeading: string;
  strengthsHeading: string;
  roleCategoriesHeading: string;
  specificRolesHeading: string;
  roleReasoningsHeading: string;
  workEnvHeading: string;
  cautionHeading: string;
  rolesToAvoidHeading: string;
  growthPatternHeading: string;
  successFactorsHeading: string;
  mottoHeading: string;
  positionsHeading: string;
  woodLabel: string;
  fireLabel: string;
  earthLabel: string;
  metalLabel: string;
  waterLabel: string;
  morePositionsBtn: string;
  // funnel
  ctaCheckFit: string;
  ctaCheckFitSub: string;
  unlockTitle: string;
  recHeading: string;
  recRolesHeading: string;
  recImprovementsHeading: string;
  recStatusHeading: string;
  statusLabels: Record<RecStatus, string>;
  statusDescs: Record<RecStatus, string>;
  improvementLabels: Record<ImprovementCode, string>;
  saveHeading: string;
  saveSub: string;
  naverBtn: string;
  kakaoBtn: string;
  googleBtn: string;
  emailBtn: string;
  resumeBoostHeading: string;
  resumeBoostSub: string;
  resumeBoostBtn: string;
  linkCopied: string;
  shareBtn: string;
  tryItBtn: string;
  countSuffix: string;
  countUnit: string;
  numberLocale: string;
};

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    pillSuffix: "님의 커리어 타입 풀이",
    pillFallback: "커리어 타입 풀이",
    titleA: "",
    titleHighlight: "이런 일",
    titleB: "이\n당신과 잘 통할 것 같아요",
    retry: "다시 풀어보기",
    loading: "결과를 불러오는 중...",
    errFetch: "결과를 불러오지 못했습니다.",
    careerTypeHeading: "나의 커리어 타입",
    interpretationHeading: "사주가 말하는 나의 성향",
    elementBalanceHeading: "나의 오행 분포",
    dayMasterHeading: "나의 일주",
    strengthsHeading: "당신의 강점",
    roleCategoriesHeading: "추천 직무 카테고리",
    specificRolesHeading: "구체적으로 어울리는 직무",
    roleReasoningsHeading: "이 직무가 잘 맞는 이유",
    workEnvHeading: "잘 맞는 업무 환경",
    cautionHeading: "주의하면 좋은 점",
    rolesToAvoidHeading: "피하면 좋은 업무 스타일",
    growthPatternHeading: "커리어 성장 패턴",
    successFactorsHeading: "더 채우면 좋을 것",
    mottoHeading: "오늘의 커리어 한 줄",
    positionsHeading: "지금 지원할 수 있는 어울리는 공고",
    woodLabel: "목(木)",
    fireLabel: "화(火)",
    earthLabel: "토(土)",
    metalLabel: "금(金)",
    waterLabel: "수(水)",
    morePositionsBtn: "내 사주에 맞는 공고 더 보기",
    ctaCheckFit: "정보 입력하고 전체 결과 보기",
    ctaCheckFitSub: "국적·전공·비자·언어만 입력하면 1분 만에, 가입 없이 바로 확인할 수 있어요.",
    unlockTitle: "입력하면 이 결과들이 열려요",
    recHeading: "내 이력 기반 추천 가능성",
    recRolesHeading: "추천 가능 직무",
    recImprovementsHeading: "보완하면 좋은 점",
    recStatusHeading: "Aply 추천 가능 상태",
    statusLabels: { UNVERIFIED: "미검증", NEEDS_WORK: "보완 필요", RECOMMENDABLE: "추천 가능" },
    statusDescs: {
      UNVERIFIED: "조금 더 정보를 채우면 추천 가능성을 확인할 수 있어요.",
      NEEDS_WORK: "몇 가지만 보완하면 기업 추천에 가까워져요.",
      RECOMMENDABLE: "기업에 추천 가능한 조건을 갖췄어요!"
    },
    improvementLabels: {
      RESUME: "이력서 작성·업로드",
      KOREAN: "한국어 역량 보완",
      VISA: "취업 가능 비자 확인",
      CONTACT: "연락처 확보",
      PORTFOLIO: "포트폴리오 준비",
      ENGLISH: "영어 역량 보완"
    },
    saveHeading: "결과 저장하고 포지션 추천받기",
    saveSub: "Aply 프로필을 만들면 결과가 저장되고\n나에게 맞는 포지션 추천을 받을 수 있어요.",
    naverBtn: "네이버로 시작하기",
    kakaoBtn: "카카오로 시작하기",
    googleBtn: "구글로 시작하기",
    emailBtn: "이메일로 시작하기",
    resumeBoostHeading: "이력서 추가하고 추천 가능성 높이기",
    resumeBoostSub: "이력서와 가능 근무 시간을 추가하면 기업 추천 가능성이 더 높아져요.",
    resumeBoostBtn: "이력서 만들기",
    linkCopied: "링크가 복사되었어요",
    shareBtn: "친구에게 공유하기",
    tryItBtn: "나도 해보기",
    countSuffix: "명이 이벤트에 참여했어요",
    countUnit: "지금까지",
    numberLocale: "ko-KR"
  },
  en: {
    pillSuffix: "'s career-type reading",
    pillFallback: "Career-type reading",
    titleA: "",
    titleHighlight: "This kind of work",
    titleB: "\nmight just click with you",
    retry: "Try again",
    loading: "Loading your result...",
    errFetch: "Couldn't load the result.",
    careerTypeHeading: "Your career type",
    interpretationHeading: "What your Saju says about you",
    elementBalanceHeading: "Your Five-Element balance",
    dayMasterHeading: "Your day-master",
    strengthsHeading: "Your strengths",
    roleCategoriesHeading: "Recommended role categories",
    specificRolesHeading: "Roles that fit you",
    roleReasoningsHeading: "Why these roles work",
    workEnvHeading: "Work environments that suit you",
    cautionHeading: "A gentle note",
    rolesToAvoidHeading: "Work styles to avoid",
    growthPatternHeading: "Your career growth pattern",
    successFactorsHeading: "What to build next",
    mottoHeading: "Your career line of the day",
    positionsHeading: "Open jobs that match your reading",
    woodLabel: "Wood",
    fireLabel: "Fire",
    earthLabel: "Earth",
    metalLabel: "Metal",
    waterLabel: "Water",
    morePositionsBtn: "See more matching jobs",
    ctaCheckFit: "Enter your info to see the full result",
    ctaCheckFitSub: "Just your nationality, major, visa & language — takes a minute, no signup needed.",
    unlockTitle: "Enter your info to unlock:",
    recHeading: "Your fit based on your background",
    recRolesHeading: "Recommendable roles",
    recImprovementsHeading: "What to improve",
    recStatusHeading: "Aply recommendation status",
    statusLabels: { UNVERIFIED: "Unverified", NEEDS_WORK: "Needs work", RECOMMENDABLE: "Recommendable" },
    statusDescs: {
      UNVERIFIED: "Add a bit more info to check your recommendation potential.",
      NEEDS_WORK: "Just a few things to improve before employer referrals.",
      RECOMMENDABLE: "You meet the bar to be recommended to companies!"
    },
    improvementLabels: {
      RESUME: "Write / upload a resume",
      KOREAN: "Improve Korean",
      VISA: "Confirm a work-eligible visa",
      CONTACT: "Add a contact",
      PORTFOLIO: "Prepare a portfolio",
      ENGLISH: "Improve English"
    },
    saveHeading: "Save your result & get job recommendations",
    saveSub: "Create an Aply profile to save your result\nand get positions matched to you.",
    naverBtn: "Continue with Naver",
    kakaoBtn: "Continue with Kakao",
    googleBtn: "Continue with Google",
    emailBtn: "Continue with email",
    resumeBoostHeading: "Add a resume to boost your chances",
    resumeBoostSub: "Adding a resume and your availability raises your chance of being recommended.",
    resumeBoostBtn: "Create a resume",
    linkCopied: "Link copied",
    shareBtn: "Share with friends",
    tryItBtn: "Try it myself",
    countSuffix: "people have joined the event",
    countUnit: "So far",
    numberLocale: "en-US"
  },
  "zh-CN": {
    pillSuffix: "的职业类型解读",
    pillFallback: "职业类型解读",
    titleA: "",
    titleHighlight: "这样的工作",
    titleB: "\n似乎会和你很合拍",
    retry: "重新解读",
    loading: "正在载入结果...",
    errFetch: "无法载入结果。",
    careerTypeHeading: "我的职业类型",
    interpretationHeading: "八字描述的我的特质",
    elementBalanceHeading: "你的五行分布",
    dayMasterHeading: "你的日主",
    strengthsHeading: "你的优势",
    roleCategoriesHeading: "推荐职业类别",
    specificRolesHeading: "适合你的具体职业",
    roleReasoningsHeading: "为什么这些职业合适",
    workEnvHeading: "适合你的工作环境",
    cautionHeading: "需要注意的点",
    rolesToAvoidHeading: "建议避免的工作风格",
    growthPatternHeading: "你的职业成长轨迹",
    successFactorsHeading: "值得补足的能力",
    mottoHeading: "今日职业一句话",
    positionsHeading: "可以申请的匹配岗位",
    woodLabel: "木",
    fireLabel: "火",
    earthLabel: "土",
    metalLabel: "金",
    waterLabel: "水",
    morePositionsBtn: "查看更多匹配岗位",
    ctaCheckFit: "输入信息查看完整结果",
    ctaCheckFitSub: "只需国籍·专业·签证·语言，1分钟即可完成，无需注册。",
    unlockTitle: "输入信息即可解锁：",
    recHeading: "基于背景的推荐可能性",
    recRolesHeading: "可推荐职位",
    recImprovementsHeading: "值得改善的点",
    recStatusHeading: "Aply 推荐状态",
    statusLabels: { UNVERIFIED: "未验证", NEEDS_WORK: "需补充", RECOMMENDABLE: "可推荐" },
    statusDescs: {
      UNVERIFIED: "再补充一些信息即可查看推荐可能性。",
      NEEDS_WORK: "再完善几项就更接近企业推荐了。",
      RECOMMENDABLE: "你已满足被推荐给企业的条件！"
    },
    improvementLabels: {
      RESUME: "撰写/上传简历",
      KOREAN: "提升韩语能力",
      VISA: "确认可工作签证",
      CONTACT: "补充联系方式",
      PORTFOLIO: "准备作品集",
      ENGLISH: "提升英语能力"
    },
    saveHeading: "保存结果并获取岗位推荐",
    saveSub: "创建 Aply 档案即可保存结果，\n并获得为你匹配的岗位推荐。",
    naverBtn: "使用 Naver 继续",
    kakaoBtn: "使用 Kakao 继续",
    googleBtn: "使用 Google 继续",
    emailBtn: "使用邮箱继续",
    resumeBoostHeading: "添加简历提高推荐可能性",
    resumeBoostSub: "添加简历和可工作时间会提高被推荐的可能性。",
    resumeBoostBtn: "创建简历",
    linkCopied: "链接已复制",
    shareBtn: "分享给朋友",
    tryItBtn: "我也来试试",
    countSuffix: "人已参与活动",
    countUnit: "目前已有",
    numberLocale: "zh-CN"
  },
  vi: {
    pillSuffix: " — Kiểu sự nghiệp",
    pillFallback: "Kiểu sự nghiệp",
    titleA: "",
    titleHighlight: "Công việc kiểu này",
    titleB: "\ncó vẻ rất hợp với bạn",
    retry: "Xem lại",
    loading: "Đang tải kết quả...",
    errFetch: "Không thể tải kết quả.",
    careerTypeHeading: "Kiểu sự nghiệp của tôi",
    interpretationHeading: "Tử vi nói gì về bạn",
    elementBalanceHeading: "Cân bằng Ngũ Hành của bạn",
    dayMasterHeading: "Chủ nhật (Day-master)",
    strengthsHeading: "Điểm mạnh của bạn",
    roleCategoriesHeading: "Nhóm nghề gợi ý",
    specificRolesHeading: "Vị trí cụ thể phù hợp",
    roleReasoningsHeading: "Vì sao những vị trí này hợp",
    workEnvHeading: "Môi trường làm việc phù hợp",
    cautionHeading: "Điều nên lưu ý",
    rolesToAvoidHeading: "Phong cách công việc nên tránh",
    growthPatternHeading: "Mô hình phát triển sự nghiệp",
    successFactorsHeading: "Điều nên bồi đắp thêm",
    mottoHeading: "Câu nói sự nghiệp hôm nay",
    positionsHeading: "Việc làm đang tuyển phù hợp",
    woodLabel: "Mộc",
    fireLabel: "Hỏa",
    earthLabel: "Thổ",
    metalLabel: "Kim",
    waterLabel: "Thủy",
    morePositionsBtn: "Xem thêm việc làm phù hợp",
    ctaCheckFit: "Nhập thông tin để xem kết quả đầy đủ",
    ctaCheckFitSub: "Chỉ cần quốc tịch, chuyên ngành, visa & ngôn ngữ — mất 1 phút, không cần đăng ký.",
    unlockTitle: "Nhập thông tin để mở khóa:",
    recHeading: "Khả năng giới thiệu dựa trên hồ sơ",
    recRolesHeading: "Vị trí có thể giới thiệu",
    recImprovementsHeading: "Điều nên cải thiện",
    recStatusHeading: "Trạng thái giới thiệu Aply",
    statusLabels: { UNVERIFIED: "Chưa xác minh", NEEDS_WORK: "Cần bổ sung", RECOMMENDABLE: "Có thể giới thiệu" },
    statusDescs: {
      UNVERIFIED: "Bổ sung thêm thông tin để xem khả năng giới thiệu.",
      NEEDS_WORK: "Chỉ cần cải thiện vài điểm là gần hơn với giới thiệu cho doanh nghiệp.",
      RECOMMENDABLE: "Bạn đã đủ điều kiện để được giới thiệu cho doanh nghiệp!"
    },
    improvementLabels: {
      RESUME: "Viết / tải lên CV",
      KOREAN: "Cải thiện tiếng Hàn",
      VISA: "Xác nhận visa được làm việc",
      CONTACT: "Bổ sung liên hệ",
      PORTFOLIO: "Chuẩn bị portfolio",
      ENGLISH: "Cải thiện tiếng Anh"
    },
    saveHeading: "Lưu kết quả & nhận gợi ý việc làm",
    saveSub: "Tạo hồ sơ Aply để lưu kết quả\nvà nhận các vị trí phù hợp với bạn.",
    naverBtn: "Tiếp tục với Naver",
    kakaoBtn: "Tiếp tục với Kakao",
    googleBtn: "Tiếp tục với Google",
    emailBtn: "Tiếp tục với email",
    resumeBoostHeading: "Thêm CV để tăng cơ hội",
    resumeBoostSub: "Thêm CV và thời gian làm việc sẽ tăng khả năng được giới thiệu.",
    resumeBoostBtn: "Tạo CV",
    linkCopied: "Đã sao chép liên kết",
    shareBtn: "Chia sẻ với bạn bè",
    tryItBtn: "Tôi cũng thử",
    countSuffix: "người đã tham gia sự kiện",
    countUnit: "Đến nay",
    numberLocale: "vi-VN"
  },
  ja: {
    pillSuffix: "さんのキャリアタイプ",
    pillFallback: "キャリアタイプ",
    titleA: "",
    titleHighlight: "こんな仕事",
    titleB: "が\nあなたとぴったり合いそう",
    retry: "もう一度見る",
    loading: "結果を読み込み中...",
    errFetch: "結果を読み込めませんでした。",
    careerTypeHeading: "私のキャリアタイプ",
    interpretationHeading: "四柱推命が語るあなたの傾向",
    elementBalanceHeading: "あなたの五行バランス",
    dayMasterHeading: "あなたの日主",
    strengthsHeading: "あなたの強み",
    roleCategoriesHeading: "おすすめ職種カテゴリー",
    specificRolesHeading: "具体的に合いそうな職種",
    roleReasoningsHeading: "なぜこの職種が合うのか",
    workEnvHeading: "合う仕事環境",
    cautionHeading: "気をつけたい点",
    rolesToAvoidHeading: "避けたい仕事スタイル",
    growthPatternHeading: "キャリアの成長パターン",
    successFactorsHeading: "さらに補うと良いこと",
    mottoHeading: "今日のキャリア一言",
    positionsHeading: "今応募できる相性のいい求人",
    woodLabel: "木",
    fireLabel: "火",
    earthLabel: "土",
    metalLabel: "金",
    waterLabel: "水",
    morePositionsBtn: "私に合う求人をもっと見る",
    ctaCheckFit: "情報を入力して全結果を見る",
    ctaCheckFitSub: "国籍・専攻・ビザ・言語だけ。1分で完了、登録不要です。",
    unlockTitle: "入力するとこの結果が開きます",
    recHeading: "経歴に基づく推薦可能性",
    recRolesHeading: "推薦可能な職種",
    recImprovementsHeading: "補うと良い点",
    recStatusHeading: "Aply 推薦ステータス",
    statusLabels: { UNVERIFIED: "未検証", NEEDS_WORK: "要補完", RECOMMENDABLE: "推薦可能" },
    statusDescs: {
      UNVERIFIED: "もう少し情報を入れると推薦可能性を確認できます。",
      NEEDS_WORK: "いくつか補うと企業推薦に近づきます。",
      RECOMMENDABLE: "企業に推薦できる条件を満たしています！"
    },
    improvementLabels: {
      RESUME: "履歴書の作成・アップロード",
      KOREAN: "韓国語力の強化",
      VISA: "就労可能ビザの確認",
      CONTACT: "連絡先の登録",
      PORTFOLIO: "ポートフォリオの準備",
      ENGLISH: "英語力の強化"
    },
    saveHeading: "結果を保存して求人推薦を受ける",
    saveSub: "Aplyプロフィールを作ると結果が保存され、\nあなたに合う求人の推薦を受けられます。",
    naverBtn: "Naver で始める",
    kakaoBtn: "Kakao で始める",
    googleBtn: "Google で始める",
    emailBtn: "メールで始める",
    resumeBoostHeading: "履歴書を追加して推薦可能性を高める",
    resumeBoostSub: "履歴書と勤務可能時間を追加すると企業推薦の可能性が高まります。",
    resumeBoostBtn: "履歴書を作る",
    linkCopied: "リンクをコピーしました",
    shareBtn: "友達にシェア",
    tryItBtn: "私もやってみる",
    countSuffix: "人がイベントに参加しました",
    countUnit: "これまでに",
    numberLocale: "ja-JP"
  },
  id: {
    pillSuffix: " — Tipe karier",
    pillFallback: "Tipe karier",
    titleA: "",
    titleHighlight: "Pekerjaan seperti ini",
    titleB: "\nsepertinya cocok untukmu",
    retry: "Coba lagi",
    loading: "Memuat hasil...",
    errFetch: "Tidak dapat memuat hasil.",
    careerTypeHeading: "Tipe karier saya",
    interpretationHeading: "Apa kata Saju tentang kamu",
    elementBalanceHeading: "Keseimbangan Lima Unsurmu",
    dayMasterHeading: "Day-master",
    strengthsHeading: "Kekuatanmu",
    roleCategoriesHeading: "Kategori peran yang disarankan",
    specificRolesHeading: "Peran spesifik yang cocok",
    roleReasoningsHeading: "Mengapa peran ini cocok",
    workEnvHeading: "Lingkungan kerja yang cocok",
    cautionHeading: "Hal yang perlu diperhatikan",
    rolesToAvoidHeading: "Gaya kerja yang sebaiknya dihindari",
    growthPatternHeading: "Pola pertumbuhan karier",
    successFactorsHeading: "Hal yang sebaiknya dikembangkan",
    mottoHeading: "Kalimat karier hari ini",
    positionsHeading: "Lowongan terbuka yang cocok",
    woodLabel: "Kayu",
    fireLabel: "Api",
    earthLabel: "Tanah",
    metalLabel: "Logam",
    waterLabel: "Air",
    morePositionsBtn: "Lihat lebih banyak lowongan yang cocok",
    ctaCheckFit: "Isi info untuk lihat hasil lengkap",
    ctaCheckFitSub: "Cukup kewarganegaraan, jurusan, visa & bahasa — 1 menit, tanpa daftar.",
    unlockTitle: "Isi info untuk membuka:",
    recHeading: "Peluang rekomendasi berdasarkan latar belakang",
    recRolesHeading: "Peran yang bisa direkomendasikan",
    recImprovementsHeading: "Yang perlu ditingkatkan",
    recStatusHeading: "Status rekomendasi Aply",
    statusLabels: { UNVERIFIED: "Belum terverifikasi", NEEDS_WORK: "Perlu dilengkapi", RECOMMENDABLE: "Bisa direkomendasikan" },
    statusDescs: {
      UNVERIFIED: "Tambahkan sedikit info untuk melihat peluang rekomendasi.",
      NEEDS_WORK: "Tinggal beberapa hal sebelum bisa direkomendasikan ke perusahaan.",
      RECOMMENDABLE: "Kamu memenuhi syarat untuk direkomendasikan ke perusahaan!"
    },
    improvementLabels: {
      RESUME: "Buat / unggah CV",
      KOREAN: "Tingkatkan bahasa Korea",
      VISA: "Pastikan visa yang boleh bekerja",
      CONTACT: "Tambahkan kontak",
      PORTFOLIO: "Siapkan portofolio",
      ENGLISH: "Tingkatkan bahasa Inggris"
    },
    saveHeading: "Simpan hasil & dapatkan rekomendasi lowongan",
    saveSub: "Buat profil Aply untuk menyimpan hasil\ndan mendapatkan lowongan yang cocok.",
    naverBtn: "Lanjutkan dengan Naver",
    kakaoBtn: "Lanjutkan dengan Kakao",
    googleBtn: "Lanjutkan dengan Google",
    emailBtn: "Lanjutkan dengan email",
    resumeBoostHeading: "Tambah CV untuk meningkatkan peluang",
    resumeBoostSub: "Menambahkan CV dan ketersediaan kerja meningkatkan peluang direkomendasikan.",
    resumeBoostBtn: "Buat CV",
    linkCopied: "Tautan disalin",
    shareBtn: "Bagikan ke teman",
    tryItBtn: "Saya juga mau coba",
    countSuffix: "orang telah ikut acara ini",
    countUnit: "Sejauh ini",
    numberLocale: "id-ID"
  }
};

const STATUS_STYLES: Record<RecStatus, { bg: string; text: string; icon: "warn" | "check" | "info" }> = {
  UNVERIFIED: { bg: "bg-white/[0.06]", text: "text-white/70", icon: "info" },
  NEEDS_WORK: { bg: "bg-amber-300/[0.08] border border-amber-300/25", text: "text-amber-100", icon: "warn" },
  RECOMMENDABLE: { bg: "bg-lime-300/[0.1] border border-lime-300/30", text: "text-lime-100", icon: "check" }
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-[15px] font-semibold text-white">{children}</h2>;
}

export function SajuResultPage({ slug }: { slug: string }) {
  const router = useRouter();
  const { user } = useAuthSession();
  const { locale } = useLanguage();
  const copy = COPY[locale];
  const [payload, setPayload] = useState<SajuResultPayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [isOwner, setIsOwner] = useState(false);
  // Funnel: result (1차) → form (커리어 입력) → done (추천 Preview).
  const [funnel, setFunnel] = useState<"result" | "form" | "done">("result");
  const [recommendation, setRecommendation] = useState<SajuLeadRecommendation | null>(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const isAuthenticated = Boolean(user);

  useEffect(() => {
    setIsOwner(isSajuOwned(slug));
  }, [slug]);

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
  }, [slug, user?.id, locale, copy.errFetch]);

  const interpretation = payload?.prediction.interpretation ?? "";
  const recommendedRoleNames = payload?.prediction.recommendedRoleNames ?? [];
  const details = payload?.prediction.details ?? null;
  const positions = payload?.positions ?? [];
  const name = payload?.prediction.name ?? "";
  // Free teaser stops at the element balance. The rest of the reading
  // (strengths, role categories, work environment, caution) unlocks only
  // after the visitor provides their career info — or once they're signed in.
  const revealMore = Boolean(recommendation) || isAuthenticated;

  async function handleLeadSubmit(data: SajuLeadRequest) {
    setLeadSubmitting(true);
    setLeadError(null);
    try {
      const { recommendation: rec } = await submitSajuLead(data);
      setRecommendation(rec);
      setFunnel("done");
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      // Keep the form open and show why it failed (timeout / server error).
      setLeadError(err instanceof Error ? err.message : copy.errFetch);
      setFunnel("form");
    } finally {
      setLeadSubmitting(false);
    }
  }

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      return;
    }
    setCopyState("copied");
    setTimeout(() => setCopyState("idle"), 1500);
  }

  const nextParam = encodeURIComponent(`/events/saju/result/${slug}`);

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
                <div aria-hidden className="pointer-events-none absolute -inset-12 -z-10 rounded-full bg-purple-500/20 blur-3xl" />
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
                .animate-spin-slow { animation: spin-slow 4s linear infinite; }
              `}</style>
            </div>
          ) : (
            <>
              {/* ===== 1차 결과: 가입 없이 공개 ===== */}
              {details?.careerType && (details.careerType.label || details.careerType.tagline) ? (
                <section className="px-5">
                  <div className="rounded-3xl bg-gradient-to-br from-yellow-300/20 to-amber-300/[0.06] p-5 text-center">
                    <div className="text-[11px] font-medium uppercase tracking-wide text-yellow-200/70">
                      {copy.careerTypeHeading}
                    </div>
                    {details.careerType.label ? (
                      <div className="mt-1.5 text-[24px] font-bold text-yellow-100">{details.careerType.label}</div>
                    ) : null}
                    {details.careerType.tagline ? (
                      <p className="mt-2 text-[13px] leading-relaxed text-white/80">{details.careerType.tagline}</p>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {interpretation ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.interpretationHeading}</SectionHeading>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <p className="whitespace-pre-wrap text-[14px] leading-[1.75] text-white/90">{interpretation}</p>
                  </div>
                </section>
              ) : null}

              {details?.elementBalance ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.elementBalanceHeading}</SectionHeading>
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
                            <span className="w-12 flex-shrink-0 text-[12px] font-medium text-white/80">{el.label}</span>
                            <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: el.color }} />
                            </div>
                            <span className="w-9 flex-shrink-0 text-right text-[12px] tabular-nums text-white/60">{value}%</span>
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

              {revealMore && details?.strengths && details.strengths.length > 0 ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.strengthsHeading}</SectionHeading>
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

              {revealMore && recommendedRoleNames.length > 0 ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.roleCategoriesHeading}</SectionHeading>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <div className="flex flex-wrap gap-1.5">
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
                  </div>
                </section>
              ) : null}

              {revealMore && details?.workEnvironment && details.workEnvironment.length > 0 ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.workEnvHeading}</SectionHeading>
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

              {revealMore && details?.cautionAdvice ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.cautionHeading}</SectionHeading>
                  <div className="rounded-2xl border border-yellow-300/20 bg-yellow-300/[0.06] p-5">
                    <p className="text-[13px] leading-[1.7] text-yellow-100/90">{details.cautionAdvice}</p>
                  </div>
                </section>
              ) : null}

              {/* ===== 커리어 추천 퍼널 (비회원) ===== */}
              {!isAuthenticated && funnel === "result" && !recommendation ? (
                <section className="px-5 pt-10">
                  <div className="rounded-3xl border border-yellow-300/25 bg-white/[0.04] p-6">
                    <div className="mb-3 text-center text-[15px] font-bold text-yellow-100">{copy.unlockTitle}</div>
                    <ul className="space-y-2">
                      {[copy.strengthsHeading, copy.roleCategoriesHeading, copy.workEnvHeading, copy.recHeading].map(
                        (item) => (
                          <li
                            key={item}
                            className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-white/55"
                          >
                            <LockSimple weight="fill" className="h-4 w-4 flex-shrink-0 text-yellow-200/70" />
                            <span>{item}</span>
                          </li>
                        )
                      )}
                    </ul>
                    <p className="mt-4 text-center text-[12px] leading-relaxed text-white/55">{copy.ctaCheckFitSub}</p>
                    <Button
                      onClick={() => setFunnel("form")}
                      className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-400 py-3.5 text-[15px] font-semibold text-[#1a1340] shadow-[0_8px_24px_-12px_rgba(250,204,21,0.6)] transition active:from-yellow-200 active:to-amber-300"
                    >
                      {copy.ctaCheckFit}
                      <ArrowRight weight="bold" className="h-4 w-4" />
                    </Button>
                  </div>
                </section>
              ) : null}

              {!isAuthenticated && funnel === "form" ? (
                <div className="pt-8">
                  <SajuCareerForm
                    locale={locale}
                    shareSlug={slug}
                    submitting={leadSubmitting}
                    submitError={leadError}
                    onSubmit={handleLeadSubmit}
                    onBack={() => setFunnel("result")}
                  />
                </div>
              ) : null}

              {/* ===== 2차 결과: 추천 가능성 Preview ===== */}
              {recommendation ? (
                <section className="px-5 pt-10">
                  <SectionHeading>{copy.recHeading}</SectionHeading>
                  <div className="space-y-3">
                    {recommendation.recommendedRoles.length > 0 ? (
                      <div className="rounded-2xl bg-white/[0.04] p-5">
                        <div className="mb-2.5 text-[12px] font-medium text-white/55">{copy.recRolesHeading}</div>
                        <div className="flex flex-wrap gap-1.5">
                          {recommendation.recommendedRoles.map((role) => (
                            <span
                              key={role}
                              className="rounded-full border border-lime-300/30 bg-lime-300/10 px-2.5 py-1 text-[12px] font-medium text-lime-100"
                            >
                              {translateRole(role, locale)}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {recommendation.improvements.length > 0 ? (
                      <div className="rounded-2xl bg-white/[0.04] p-5">
                        <div className="mb-2.5 text-[12px] font-medium text-white/55">{copy.recImprovementsHeading}</div>
                        <ul className="space-y-2">
                          {recommendation.improvements.map((code) => (
                            <li key={code} className="flex items-center gap-2 text-[13px] text-white/85">
                              <WarningCircle weight="fill" className="h-4 w-4 flex-shrink-0 text-amber-300/80" />
                              <span>{copy.improvementLabels[code as ImprovementCode] ?? code}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    {(() => {
                      const st = (recommendation.status as RecStatus) ?? "UNVERIFIED";
                      const style = STATUS_STYLES[st];
                      return (
                        <div className={`rounded-2xl p-5 ${style.bg}`}>
                          <div className="text-[12px] font-medium text-white/55">{copy.recStatusHeading}</div>
                          <div className="mt-2 flex items-center gap-2">
                            {style.icon === "check" ? (
                              <CheckCircle weight="fill" className="h-5 w-5 text-lime-300" />
                            ) : style.icon === "warn" ? (
                              <WarningCircle weight="fill" className="h-5 w-5 text-amber-300" />
                            ) : (
                              <Sparkle weight="fill" className="h-5 w-5 text-white/50" />
                            )}
                            <span className={`text-[16px] font-bold ${style.text}`}>{copy.statusLabels[st]}</span>
                          </div>
                          <p className="mt-2 text-[12.5px] leading-relaxed text-white/65">{copy.statusDescs[st]}</p>
                        </div>
                      );
                    })()}
                  </div>
                </section>
              ) : null}

              {/* ===== 가입 유도 (비회원, 커리어 정보 입력 후) ===== */}
              {!isAuthenticated && recommendation ? (
                <section className="px-5 pt-10">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
                    <h2 className="text-[16px] font-bold text-white">{copy.saveHeading}</h2>
                    <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-white/65">{copy.saveSub}</p>
                    <div className="mt-5 flex w-full flex-col gap-2">
                      <a
                        href={`${API_BASE}/auth/naver/start?next=${nextParam}`}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] text-[14px] font-semibold text-white transition active:bg-[#02b551]"
                      >
                        <span aria-hidden className="text-base font-black">N</span>
                        {copy.naverBtn}
                      </a>
                      <a
                        href={`${API_BASE}/auth/kakao/start?next=${nextParam}`}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[14px] font-semibold text-[#191919] transition active:bg-[#f5dd00]"
                      >
                        <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78L5.5 21.5c-.1.34.27.62.57.43L10.5 19c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                        </svg>
                        {copy.kakaoBtn}
                      </a>
                      <a
                        href={`${API_BASE}/auth/google/start?next=${nextParam}`}
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
                        href={`/signup?next=${nextParam}`}
                        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-[14px] font-semibold text-white transition active:bg-white/15"
                      >
                        {copy.emailBtn}
                      </Link>
                    </div>
                  </div>
                </section>
              ) : null}

              {/* ===== 회원 전용 심화 + 포지션 ===== */}
              {isAuthenticated && details?.roleReasonings && details.roleReasonings.length > 0 ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.roleReasoningsHeading}</SectionHeading>
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

              {isAuthenticated && details?.rolesToAvoid && details.rolesToAvoid.length > 0 ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.rolesToAvoidHeading}</SectionHeading>
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
                  <SectionHeading>{copy.growthPatternHeading}</SectionHeading>
                  <div className="rounded-2xl bg-white/[0.04] p-5">
                    <p className="text-[13px] leading-[1.7] text-white/85">{details.growthPattern}</p>
                  </div>
                </section>
              ) : null}

              {isAuthenticated && details?.successFactors && details.successFactors.length > 0 ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.successFactorsHeading}</SectionHeading>
                  <div className="space-y-2.5">
                    {details.successFactors.map((factor, i) => (
                      <div key={i} className="rounded-2xl bg-white/[0.04] p-4">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-yellow-300/20 text-[12px] font-semibold text-yellow-100">
                            {i + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-semibold text-yellow-100">{factor.title}</div>
                            <p className="mt-1 text-[12.5px] leading-[1.65] text-white/75">{factor.detail}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {isAuthenticated && positions.length > 0 ? (
                <section className="px-5 pt-8">
                  <SectionHeading>{copy.positionsHeading}</SectionHeading>
                  <div className="space-y-2.5">
                    {positions.map((position) => {
                      const thumb =
                        position.thumbnailImages?.[0] ?? position.partnerOrganization?.companyLogoImageData ?? null;
                      return (
                        <div key={position.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] px-3 py-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.06]">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={thumb} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <Star weight="fill" className="h-5 w-5 text-yellow-200/60" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium text-white">{position.title}</div>
                            <div className="mt-0.5 truncate text-[11px] text-white/55">
                              {[position.partnerOrganization?.name, position.preferredJobRole, position.workLocation]
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

              {/* 이력서 보강 유도 (회원) */}
              {isAuthenticated ? (
                <section className="px-5 pt-8">
                  <div className="rounded-2xl border border-lime-300/25 bg-lime-300/[0.06] p-5">
                    <h3 className="text-[14px] font-semibold text-lime-100">{copy.resumeBoostHeading}</h3>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/70">{copy.resumeBoostSub}</p>
                    <Button
                      onClick={() => router.push("/resume")}
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-[13px] font-medium text-white transition active:bg-white/15"
                    >
                      {copy.resumeBoostBtn}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </section>
              ) : null}

              {/* 공유 / 나도 해보기 + 카운트 */}
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
                {isOwner ? (
                  <Button
                    onClick={handleShare}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.04] text-[13px] font-medium text-white transition active:bg-white/[0.07]"
                  >
                    <ShareIcon weight="bold" className="h-4 w-4" />
                    {copyState === "copied" ? copy.linkCopied : copy.shareBtn}
                  </Button>
                ) : (
                  <Button
                    onClick={() => router.push("/events/saju")}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-300 to-amber-400 text-[14px] font-semibold text-[#1a1340] shadow-[0_8px_24px_-12px_rgba(250,204,21,0.6)] transition active:from-yellow-200 active:to-amber-300"
                  >
                    <Sparkle weight="fill" className="h-4 w-4" />
                    {copy.tryItBtn}
                  </Button>
                )}
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
            </>
          )}
        </main>
      </div>
    </div>
  );
}
