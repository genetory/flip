"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ShareNetwork, Copy as CopyIcon, ArrowClockwise, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  localizeVisa,
  localizeStatus,
  localizePriority,
  localizeBlocker,
  localizeText
} from "../../lib/visa-i18n";
import { VisaEventFooter } from "../site/VisaEventFooter";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// ---------------------------------------------------------------------------
// /events/visa/result/[slug] — 진단 결과 + 회원가입 퍼널 + viral share.
// 흐름: result → form → done (saju 패턴) + 결과 카드 우상단 / 하단에 share.
// ---------------------------------------------------------------------------

type Fit = "high" | "medium" | "low";

// Phase 1 신규 — visa-rules.ts 의 VisaStatus 와 동일. 백엔드가 emit, 프론트
// 가 5단계 그룹핑에 사용.
type VisaStatus =
  | "available_now"
  | "after_job_offer"
  | "after_graduation"
  | "needs_preparation"
  | "not_likely";

type EligibleVisa = {
  code: string;
  name: string;            // Korean fallback
  fit: Fit;
  status?: VisaStatus;     // legacy 레코드는 status 없음 → 그룹핑 시 needs_preparation 로 fallback
  conditions: string[];
  notes?: string;
  blockers?: string[];
};

type Roadmap = {
  steps: string[];
  priorityKey?: string | null;
};

type NextStepEntry = { qKey: string; aKey: string };

type Result = {
  id: string;
  name: string | null;
  nationality: string;
  currentVisa: string | null;
  educationLevel: string;
  majorCategory: string | null;
  koreanLevel: string;
  workYears: number;
  targetRole: string | null;
  eligibleVisas: EligibleVisa[];
  // Phase 1 — 백엔드가 wrapper payload 로 함께 emit. legacy 결과 페이지 호환
  // 위해 모두 optional.
  roadmap?: Roadmap | null;
  nextSteps?: NextStepEntry[];
  shareSlug: string;
  locale: string;
  createdAt: string;
};

type Position = {
  id: string;
  title: string;
  preferredJobRole: string | null;
  partnerOrganization: { id: string; name: string } | null;
};

type Copy = {
  pill: string;
  ownerSubtitle: (name: string) => string;
  visaCountTitle: (n: number) => string;
  disclaimer: string;
  hikoreaSuffix: string;
  positionsTitle: string;
  positionsEmpty: string;
  // Phase 1 — 새 섹션 헤더 / 라벨
  roadmapTitle: string;
  roadmapSubtitle: string;
  priorityLabel: string;
  nextStepsTitle: string;
  nextStepsSubtitle: string;
  blockersHeading: string;
  // 가입 유도 (비회원에게만 표시)
  signupHeading: string;
  signupSub: string;
  naverBtn: string;
  kakaoBtn: string;
  googleBtn: string;
  emailBtn: string;
  // 회원에게는 이력서 코칭으로 자연스럽게 보내는 CTA.
  signedInHeading: string;
  signedInSub: string;
  signedInCta: string;
  // funnel
  funnelOpenCta: string;
  funnelTitle: string;
  funnelIntro: string;
  funnelNameLabel: string;
  funnelNamePlaceholder: string;
  funnelContactLabel: string;
  funnelContactPlaceholderEmail: string;
  funnelContactPlaceholderPhone: string;
  funnelChannelEmail: string;
  funnelChannelPhone: string;
  funnelJoinDateLabel: string;
  funnelJoinDatePlaceholder: string;
  funnelGradDateLabel: string;
  funnelGradDatePlaceholder: string;
  funnelRoleLabel: string;
  funnelRolePlaceholder: string;
  funnelConsentLabel: string;
  funnelSubmit: string;
  funnelSubmitting: string;
  funnelErrContact: string;
  funnelErrConsent: string;
  funnelErrRetry: string;
  doneTitle: string;
  doneBody: string;
  signupCta: string;
  // share
  shareTitle: string;
  shareText: string;
  shareBtn: string;
  copyBtn: string;
  copyDone: string;
  retryBtn: string;
  loading: string;
  notFound: string;
  fitHigh: string;
  fitMedium: string;
  fitLow: string;
  partnerCompanyFallback: string;
};

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    pill: "Aply × 비자 체크",
    ownerSubtitle: (name) => `${name}님의 진단`,
    visaCountTitle: (n) => `가능한 비자 ${n}개`,
    disclaimer: "본 진단은 일반적인 비자 가이드일 뿐 법률 자문이 아닙니다. 정확한 발급 가능성은 ",
    hikoreaSuffix: " 또는 출입국·외국인청에 확인하세요.",
    positionsTitle: "최근 채용 공고",
    positionsEmpty: "매칭되는 공고가 없어요. 가입하면 새 공고가 올라올 때 자동으로 알려드립니다.",
    roadmapTitle: "내 비자 로드맵",
    roadmapSubtitle: "현재 상태에서 가야 할 경로를 한눈에",
    priorityLabel: "우선순위",
    nextStepsTitle: "이런 게 자주 궁금해요",
    nextStepsSubtitle: "현재 비자/상황에 맞춰 자주 묻는 질문",
    blockersHeading: "필요한 것",
    signupHeading: "로그인하고 취업 확률 높이기",
    signupSub: "이력서 AI 코칭 + 맞춤 비자 후원 회사 추천으로\n한국 취업 가능성을 한 단계 끌어올리세요.",
    naverBtn: "네이버로 시작하기",
    kakaoBtn: "카카오로 시작하기",
    googleBtn: "구글로 시작하기",
    emailBtn: "이메일로 가입하기",
    signedInHeading: "이력서 코칭으로 취업 확률 높이기",
    signedInSub: "AI 코치가 이력서 점수·개선 액션·맞춤 포지션까지 한 번에 알려줘요.",
    signedInCta: "내 이력서 코칭 보러가기 →",
    funnelOpenCta: "Aply 가입하고 비자 후원 가능한 회사 추천받기 →",
    funnelTitle: "추가 정보 입력하고 맞춤 추천 받기",
    funnelIntro: "Aply 운영팀이 회원님에게 맞는 회사를 직접 매칭해 드려요. (1분)",
    funnelNameLabel: "이름",
    funnelNamePlaceholder: "홍길동",
    funnelContactLabel: "연락 방법",
    funnelContactPlaceholderEmail: "you@example.com",
    funnelContactPlaceholderPhone: "010-1234-5678",
    funnelChannelEmail: "이메일",
    funnelChannelPhone: "전화",
    funnelJoinDateLabel: "희망 입사 시기 (선택)",
    funnelJoinDatePlaceholder: "예: 2025-09",
    funnelGradDateLabel: "졸업 (예정) 시기 (선택)",
    funnelGradDatePlaceholder: "예: 2025-02",
    funnelRoleLabel: "희망 직무 (선택)",
    funnelRolePlaceholder: "예: 소프트웨어 엔지니어",
    funnelConsentLabel: "Aply 가 입력 정보를 활용해 비자·채용 추천을 보내는 것에 동의합니다.",
    funnelSubmit: "추천 신청하기",
    funnelSubmitting: "전송 중...",
    funnelErrContact: "연락처를 입력해 주세요.",
    funnelErrConsent: "추천을 받으려면 동의가 필요합니다.",
    funnelErrRetry: "잠시 후 다시 시도해 주세요.",
    doneTitle: "신청이 완료됐어요",
    doneBody: "곧 운영팀이 맞춤 공고를 정리해 보내드립니다. Aply 회원이 되면 알림과 이력서 코칭도 함께 받을 수 있어요.",
    signupCta: "Aply 회원가입하기 →",
    shareTitle: "내 한국 비자 진단 결과",
    shareText: "Aply 에서 한국 취업 비자 가능성을 진단해봤어요. 너도 확인해봐!",
    shareBtn: "공유하기",
    copyBtn: "결과 링크 복사",
    copyDone: "복사됨!",
    retryBtn: "다시 진단",
    loading: "진단 결과를 불러오는 중...",
    notFound: "결과를 찾을 수 없습니다.",
    fitHigh: "가능성 높음",
    fitMedium: "가능성 있음",
    fitLow: "조건 확인 필요",
    partnerCompanyFallback: "파트너 기업"
  },
  en: {
    pill: "Aply × Visa check",
    ownerSubtitle: (name) => `${name}'s result`,
    visaCountTitle: (n) => `${n} possible visa${n > 1 ? "s" : ""}`,
    disclaimer: "This is informational only — not legal advice. For accurate eligibility, see ",
    hikoreaSuffix: " or your local immigration office.",
    positionsTitle: "Recent jobs",
    positionsEmpty: "No matches right now. Sign up and we'll notify you when new ones open.",
    roadmapTitle: "Your visa roadmap",
    roadmapSubtitle: "The path forward, given your situation",
    priorityLabel: "Priority",
    nextStepsTitle: "Common questions for your case",
    nextStepsSubtitle: "Based on your current visa & situation",
    blockersHeading: "What you'll need",
    signupHeading: "Sign in to boost your hiring odds",
    signupSub: "Resume AI coaching + matched visa-sponsoring companies\nto push your Korea-job chances higher.",
    naverBtn: "Continue with Naver",
    kakaoBtn: "Continue with Kakao",
    googleBtn: "Continue with Google",
    emailBtn: "Sign up with email",
    signedInHeading: "Boost your odds with resume coaching",
    signedInSub: "Your AI coach surfaces your score, action items, and matching positions in one place.",
    signedInCta: "Open my resume coach →",
    funnelOpenCta: "Sign up on Aply for visa-sponsoring companies →",
    funnelTitle: "Tell us a bit more for personalized picks",
    funnelIntro: "Aply's team will hand-match companies to your profile. (1 minute)",
    funnelNameLabel: "Name",
    funnelNamePlaceholder: "Your name",
    funnelContactLabel: "Contact",
    funnelContactPlaceholderEmail: "you@example.com",
    funnelContactPlaceholderPhone: "+82 10-1234-5678",
    funnelChannelEmail: "Email",
    funnelChannelPhone: "Phone",
    funnelJoinDateLabel: "Target join date (optional)",
    funnelJoinDatePlaceholder: "e.g. 2025-09",
    funnelGradDateLabel: "Graduation date (optional)",
    funnelGradDatePlaceholder: "e.g. 2025-02",
    funnelRoleLabel: "Target role (optional)",
    funnelRolePlaceholder: "e.g. Software engineer",
    funnelConsentLabel: "I agree to receive visa/job recommendations from Aply based on what I shared.",
    funnelSubmit: "Submit",
    funnelSubmitting: "Sending...",
    funnelErrContact: "Please enter your contact.",
    funnelErrConsent: "Please consent to receive recommendations.",
    funnelErrRetry: "Something went wrong — please try again.",
    doneTitle: "All set!",
    doneBody: "Our team will follow up shortly with a curated list. Sign up to also get alerts and resume coaching.",
    signupCta: "Sign up on Aply →",
    shareTitle: "My Korean work visa check",
    shareText: "I checked my Korean work visa options on Aply. Try yours too!",
    shareBtn: "Share",
    copyBtn: "Copy result link",
    copyDone: "Copied!",
    retryBtn: "Run again",
    loading: "Loading your result...",
    notFound: "Result not found.",
    fitHigh: "High chance",
    fitMedium: "Possible",
    fitLow: "Check conditions",
    partnerCompanyFallback: "Partner company"
  },
  "zh-CN": {
    pill: "Aply × 签证检查",
    ownerSubtitle: (name) => `${name} 的诊断结果`,
    visaCountTitle: (n) => `${n} 个可申请签证`,
    disclaimer: "本诊断仅为一般指引，非法律咨询。准确签发可能性请查看 ",
    hikoreaSuffix: " 或当地出入境部门。",
    positionsTitle: "最近职位",
    positionsEmpty: "目前无匹配职位。注册后有新职位将自动通知您。",
    roadmapTitle: "我的签证路线图",
    roadmapSubtitle: "根据您的现状，下一步的方向",
    priorityLabel: "优先",
    nextStepsTitle: "这些问题最常见",
    nextStepsSubtitle: "针对您当前签证/情况",
    blockersHeading: "需要准备",
    signupHeading: "登录提升就业概率",
    signupSub: "通过简历 AI 辅导 + 匹配的签证赞助公司，\n大幅提升您在韩国求职的成功率。",
    naverBtn: "使用 Naver 继续",
    kakaoBtn: "使用 Kakao 继续",
    googleBtn: "使用 Google 继续",
    emailBtn: "用邮箱注册",
    signedInHeading: "简历辅导提升就业概率",
    signedInSub: "AI 教练一站式呈现您的简历分数、改进建议和匹配职位。",
    signedInCta: "打开我的简历辅导 →",
    funnelOpenCta: "注册 Aply 获取支持签证赞助的公司 →",
    funnelTitle: "再填一点点，获得专属推荐",
    funnelIntro: "Aply 运营团队将为您手动匹配公司。（1分钟）",
    funnelNameLabel: "姓名",
    funnelNamePlaceholder: "您的姓名",
    funnelContactLabel: "联系方式",
    funnelContactPlaceholderEmail: "you@example.com",
    funnelContactPlaceholderPhone: "+82 10-1234-5678",
    funnelChannelEmail: "邮箱",
    funnelChannelPhone: "电话",
    funnelJoinDateLabel: "希望入职时间（可选）",
    funnelJoinDatePlaceholder: "如: 2025-09",
    funnelGradDateLabel: "毕业时间（可选）",
    funnelGradDatePlaceholder: "如: 2025-02",
    funnelRoleLabel: "目标职位（可选）",
    funnelRolePlaceholder: "如: 软件工程师",
    funnelConsentLabel: "我同意 Aply 根据所填信息发送签证/职位推荐。",
    funnelSubmit: "提交",
    funnelSubmitting: "发送中...",
    funnelErrContact: "请填写联系方式。",
    funnelErrConsent: "请同意接收推荐。",
    funnelErrRetry: "出错了，请稍后重试。",
    doneTitle: "已完成！",
    doneBody: "我们的团队稍后会发送精选职位。注册后还能收到通知和简历辅导。",
    signupCta: "注册 Aply →",
    shareTitle: "我的韩国工作签证检查结果",
    shareText: "我在 Aply 上检查了我的韩国工作签证可能性，你也来试试！",
    shareBtn: "分享",
    copyBtn: "复制结果链接",
    copyDone: "已复制！",
    retryBtn: "重新诊断",
    loading: "正在加载诊断结果...",
    notFound: "找不到结果。",
    fitHigh: "高可能性",
    fitMedium: "有可能",
    fitLow: "需确认条件",
    partnerCompanyFallback: "合作企业"
  },
  vi: {
    pill: "Aply × Kiểm tra visa",
    ownerSubtitle: (name) => `Kết quả của ${name}`,
    visaCountTitle: (n) => `${n} loại visa khả thi`,
    disclaimer: "Đây là hướng dẫn tham khảo, không phải tư vấn pháp lý. Để biết khả năng cấp chính xác, xem ",
    hikoreaSuffix: " hoặc văn phòng xuất nhập cảnh địa phương.",
    positionsTitle: "Việc làm gần đây",
    positionsEmpty: "Chưa có việc phù hợp. Đăng ký để được thông báo khi có việc mới.",
    roadmapTitle: "Lộ trình visa của bạn",
    roadmapSubtitle: "Hướng đi tiếp theo dựa trên tình hình của bạn",
    priorityLabel: "Ưu tiên",
    nextStepsTitle: "Câu hỏi thường gặp cho bạn",
    nextStepsSubtitle: "Dựa trên visa & tình huống hiện tại",
    blockersHeading: "Cần chuẩn bị",
    signupHeading: "Đăng nhập để tăng cơ hội việc làm",
    signupSub: "Tư vấn AI hồ sơ + đề xuất công ty bảo trợ visa\nđể tăng cơ hội việc làm tại Hàn Quốc.",
    naverBtn: "Tiếp tục với Naver",
    kakaoBtn: "Tiếp tục với Kakao",
    googleBtn: "Tiếp tục với Google",
    emailBtn: "Đăng ký bằng email",
    signedInHeading: "Tăng cơ hội với tư vấn hồ sơ",
    signedInSub: "Huấn luyện viên AI hiển thị điểm hồ sơ, hành động cải thiện và vị trí phù hợp trong một nơi.",
    signedInCta: "Mở tư vấn hồ sơ của tôi →",
    funnelOpenCta: "Đăng ký Aply để xem công ty bảo trợ visa →",
    funnelTitle: "Thêm một chút thông tin để nhận đề xuất riêng",
    funnelIntro: "Đội Aply sẽ tự tay ghép bạn với công ty phù hợp. (1 phút)",
    funnelNameLabel: "Tên",
    funnelNamePlaceholder: "Tên của bạn",
    funnelContactLabel: "Liên hệ",
    funnelContactPlaceholderEmail: "you@example.com",
    funnelContactPlaceholderPhone: "+84 9xxx",
    funnelChannelEmail: "Email",
    funnelChannelPhone: "Điện thoại",
    funnelJoinDateLabel: "Thời gian mong muốn vào làm (tùy chọn)",
    funnelJoinDatePlaceholder: "Vd: 2025-09",
    funnelGradDateLabel: "Thời gian tốt nghiệp (tùy chọn)",
    funnelGradDatePlaceholder: "Vd: 2025-02",
    funnelRoleLabel: "Vị trí mong muốn (tùy chọn)",
    funnelRolePlaceholder: "Vd: Kỹ sư phần mềm",
    funnelConsentLabel: "Tôi đồng ý cho Aply gửi đề xuất visa/việc làm dựa trên thông tin tôi cung cấp.",
    funnelSubmit: "Gửi",
    funnelSubmitting: "Đang gửi...",
    funnelErrContact: "Vui lòng nhập liên hệ.",
    funnelErrConsent: "Hãy đồng ý để nhận đề xuất.",
    funnelErrRetry: "Có lỗi xảy ra, vui lòng thử lại.",
    doneTitle: "Đã gửi!",
    doneBody: "Đội ngũ Aply sẽ liên hệ với danh sách phù hợp. Đăng ký để nhận thông báo và tư vấn hồ sơ.",
    signupCta: "Đăng ký Aply →",
    shareTitle: "Kết quả kiểm tra visa Hàn Quốc của tôi",
    shareText: "Tôi đã kiểm tra khả năng visa làm việc Hàn Quốc trên Aply. Bạn cũng thử nhé!",
    shareBtn: "Chia sẻ",
    copyBtn: "Sao chép link",
    copyDone: "Đã sao chép!",
    retryBtn: "Kiểm tra lại",
    loading: "Đang tải kết quả...",
    notFound: "Không tìm thấy kết quả.",
    fitHigh: "Khả năng cao",
    fitMedium: "Có thể",
    fitLow: "Cần xác nhận điều kiện",
    partnerCompanyFallback: "Doanh nghiệp đối tác"
  },
  ja: {
    pill: "Aply × ビザ診断",
    ownerSubtitle: (name) => `${name}さんの診断`,
    visaCountTitle: (n) => `取得可能なビザ ${n}件`,
    disclaimer: "本診断は一般的なガイドであり、法律相談ではありません。正確な発給可能性は ",
    hikoreaSuffix: " または出入国・外国人庁にご確認ください。",
    positionsTitle: "最新の求人",
    positionsEmpty: "現在マッチする求人はありません。登録すると新着求人を自動でお知らせします。",
    roadmapTitle: "あなたのビザ・ロードマップ",
    roadmapSubtitle: "現在の状況からの進路を一目で",
    priorityLabel: "優先",
    nextStepsTitle: "よくある疑問",
    nextStepsSubtitle: "現在のビザ/状況に合わせて",
    blockersHeading: "準備するもの",
    signupHeading: "ログインして就職確率を上げる",
    signupSub: "履歴書AIコーチング + ビザ支援会社のマッチングで\n韓国就職の成功率を高めましょう。",
    naverBtn: "Naver で始める",
    kakaoBtn: "Kakao で始める",
    googleBtn: "Google で始める",
    emailBtn: "メールで登録",
    signedInHeading: "履歴書コーチングで就職確率を上げる",
    signedInSub: "AIコーチが履歴書スコア・改善アクション・マッチするポジションを一画面でご案内します。",
    signedInCta: "私の履歴書コーチを開く →",
    funnelOpenCta: "Aplyに登録してビザ支援可能な会社の推薦を受ける →",
    funnelTitle: "少し追加情報を入れて、カスタム推薦を受け取る",
    funnelIntro: "Aply運営チームがあなたに合う会社を直接マッチングします。（1分）",
    funnelNameLabel: "名前",
    funnelNamePlaceholder: "お名前",
    funnelContactLabel: "連絡方法",
    funnelContactPlaceholderEmail: "you@example.com",
    funnelContactPlaceholderPhone: "+81 90...",
    funnelChannelEmail: "メール",
    funnelChannelPhone: "電話",
    funnelJoinDateLabel: "希望入社時期（任意）",
    funnelJoinDatePlaceholder: "例: 2025-09",
    funnelGradDateLabel: "卒業時期（任意）",
    funnelGradDatePlaceholder: "例: 2025-02",
    funnelRoleLabel: "希望職種（任意）",
    funnelRolePlaceholder: "例: ソフトウェアエンジニア",
    funnelConsentLabel: "入力情報を基にビザ・求人推薦を受け取ることに同意します。",
    funnelSubmit: "送信",
    funnelSubmitting: "送信中...",
    funnelErrContact: "連絡先を入力してください。",
    funnelErrConsent: "推薦を受け取るには同意が必要です。",
    funnelErrRetry: "しばらくしてから再度お試しください。",
    doneTitle: "送信完了！",
    doneBody: "運営チームが厳選した求人をお送りします。会員登録するとアラートと履歴書コーチングも受け取れます。",
    signupCta: "Aplyに登録 →",
    shareTitle: "私の韓国就労ビザ診断結果",
    shareText: "Aplyで韓国就労ビザの可能性を診断しました。あなたも試してみて！",
    shareBtn: "シェア",
    copyBtn: "結果リンクをコピー",
    copyDone: "コピー済み！",
    retryBtn: "再診断",
    loading: "診断結果を読み込み中...",
    notFound: "結果が見つかりません。",
    fitHigh: "可能性高い",
    fitMedium: "可能性あり",
    fitLow: "条件確認必要",
    partnerCompanyFallback: "パートナー企業"
  },
  id: {
    pill: "Aply × Cek visa",
    ownerSubtitle: (name) => `Hasil ${name}`,
    visaCountTitle: (n) => `${n} opsi visa`,
    disclaimer: "Hanya panduan umum, bukan nasihat hukum. Untuk kelayakan akurat lihat ",
    hikoreaSuffix: " atau kantor imigrasi setempat.",
    positionsTitle: "Lowongan terbaru",
    positionsEmpty: "Belum ada yang cocok. Daftar dan kami akan beri tahu saat ada baru.",
    roadmapTitle: "Peta jalan visa Anda",
    roadmapSubtitle: "Arah selanjutnya berdasarkan situasi Anda",
    priorityLabel: "Prioritas",
    nextStepsTitle: "Pertanyaan yang sering muncul",
    nextStepsSubtitle: "Berdasarkan visa & situasi saat ini",
    blockersHeading: "Perlu disiapkan",
    signupHeading: "Masuk untuk tingkatkan peluang kerja",
    signupSub: "Bimbingan AI resume + rekomendasi perusahaan pendukung visa\nuntuk meningkatkan peluang kerja di Korea.",
    naverBtn: "Lanjutkan dengan Naver",
    kakaoBtn: "Lanjutkan dengan Kakao",
    googleBtn: "Lanjutkan dengan Google",
    emailBtn: "Daftar dengan email",
    signedInHeading: "Tingkatkan peluang dengan bimbingan resume",
    signedInSub: "Pelatih AI menunjukkan skor resume, tindakan perbaikan, dan posisi yang cocok dalam satu tempat.",
    signedInCta: "Buka bimbingan resume saya →",
    funnelOpenCta: "Daftar di Aply untuk perusahaan pendukung visa →",
    funnelTitle: "Lengkapi sedikit info untuk rekomendasi pribadi",
    funnelIntro: "Tim Aply akan mencocokkan perusahaan dengan profil Anda. (1 menit)",
    funnelNameLabel: "Nama",
    funnelNamePlaceholder: "Nama Anda",
    funnelContactLabel: "Kontak",
    funnelContactPlaceholderEmail: "you@example.com",
    funnelContactPlaceholderPhone: "+62 812 xxx",
    funnelChannelEmail: "Email",
    funnelChannelPhone: "Telepon",
    funnelJoinDateLabel: "Target waktu masuk kerja (opsional)",
    funnelJoinDatePlaceholder: "Cth: 2025-09",
    funnelGradDateLabel: "Waktu lulus (opsional)",
    funnelGradDatePlaceholder: "Cth: 2025-02",
    funnelRoleLabel: "Posisi yang dituju (opsional)",
    funnelRolePlaceholder: "Cth: Software engineer",
    funnelConsentLabel: "Saya setuju Aply mengirim rekomendasi visa/pekerjaan berdasarkan info yang saya berikan.",
    funnelSubmit: "Kirim",
    funnelSubmitting: "Mengirim...",
    funnelErrContact: "Mohon isi kontak.",
    funnelErrConsent: "Mohon setuju untuk menerima rekomendasi.",
    funnelErrRetry: "Terjadi kesalahan, silakan coba lagi.",
    doneTitle: "Selesai!",
    doneBody: "Tim kami akan mengirim daftar terkurasi. Daftar untuk dapatkan notifikasi dan coaching resume.",
    signupCta: "Daftar di Aply →",
    shareTitle: "Hasil cek visa kerja Korea saya",
    shareText: "Saya cek opsi visa kerja Korea di Aply. Coba kamu juga!",
    shareBtn: "Bagikan",
    copyBtn: "Salin link hasil",
    copyDone: "Tersalin!",
    retryBtn: "Cek lagi",
    loading: "Memuat hasil...",
    notFound: "Hasil tidak ditemukan.",
    fitHigh: "Peluang tinggi",
    fitMedium: "Mungkin",
    fitLow: "Periksa syarat",
    partnerCompanyFallback: "Perusahaan mitra"
  }
};

const FIT_CLS: Record<Fit, string> = {
  high: "border-emerald-300 bg-emerald-50 text-emerald-700",
  medium: "border-amber-300 bg-amber-50 text-amber-700",
  low: "border-zinc-300 bg-zinc-50 text-zinc-600"
};

// 상태별 그룹 헤더 pill 색상. 색은 의미 순서에 맞춰 — 가능 → 노란/주황 →
// 회색(어려움) 으로 자연스럽게 디그레이드.
const STATUS_PILL_CLS: Record<VisaStatus, string> = {
  available_now:     "border-emerald-300 bg-emerald-50 text-emerald-700",
  after_job_offer:   "border-sky-300 bg-sky-50 text-sky-700",
  after_graduation:  "border-violet-300 bg-violet-50 text-violet-700",
  needs_preparation: "border-amber-300 bg-amber-50 text-amber-700",
  not_likely:        "border-zinc-300 bg-zinc-50 text-zinc-600"
};

export function VisaResultPage({ slug }: { slug: string }) {
  const { locale } = useLanguage();
  const { isAuthenticated, isReady } = useAuthSession();
  const t = COPY[locale] ?? COPY.ko;
  const apiBase = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  // OAuth/이메일 가입 완료 후 결과 페이지로 다시 돌아오게 함 — 비회원에게
  // 가렸던 화이트 딤 그라데이션이 즉시 풀려 전체 결과가 노출되는 보상 UX.
  // 가입 직후의 가치 체감 → 자연스럽게 페이지 하단의 "이력서 코칭 보러가기"
  // CTA 로 이어지는 funnel.
  const nextParam = encodeURIComponent(`/events/visa/result/${slug}`);
  const [result, setResult] = useState<Result | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`${apiBase}/visa/result/${encodeURIComponent(slug)}`, { cache: "no-store" });
        if (!response.ok) throw new Error(t.notFound);
        const payload = (await response.json()) as { ok?: boolean; result?: Result; positions?: Position[] };
        if (cancelled) return;
        if (!payload.ok || !payload.result) throw new Error(t.notFound);
        setResult(payload.result);
        setPositions(payload.positions ?? []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t.notFound);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, slug]);

  async function share() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/events/visa/result/${slug}`;
    const navAny = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (typeof navAny.share === "function") {
      try {
        await navAny.share({ title: t.shareTitle, text: t.shareText, url });
        return;
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }

  const FIT_LABEL: Record<Fit, string> = {
    high: t.fitHigh,
    medium: t.fitMedium,
    low: t.fitLow
  };

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      {/* 모바일 폭(480px)으로 고정 + GNB(Header)/Footer 없음 — VisaLandingPage
          와 동일한 몰입형 모바일 웹 톤. 데스크탑에서도 폰 가로폭으로 보임. */}
      <main className="mx-auto min-h-screen w-full max-w-[480px] px-4 py-6 sm:py-8">
        <div className="space-y-6">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">{t.loading}</p>
          ) : error ? (
            <p className="text-center text-sm text-destructive">{error}</p>
          ) : result ? (
            <>
              <section className="rounded-3xl bg-gradient-to-br from-primary/10 via-white to-white p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{t.pill}</p>
                {result.name ? (
                  <p className="mt-2 text-sm text-muted-foreground">{t.ownerSubtitle(result.name)}</p>
                ) : null}
                <p className="mt-3 font-display text-[28px] leading-tight font-black tracking-tight">
                  {t.visaCountTitle(result.eligibleVisas.length)}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {result.nationality} · {result.educationLevel.replace("_", " ")} · {result.koreanLevel}
                </p>
              </section>

              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                ⚠️ {t.disclaimer}
                <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                  HiKorea
                </a>
                {t.hikoreaSuffix}
              </section>

              {/* Phase 1 — 비자 로드맵. 현재 비자(또는 한국 밖) → 다음 비자 →
                  장기 체류. text-arrow 체인으로 컴팩트하게. */}
              {result.roadmap && result.roadmap.steps.length > 0 ? (
                <section className="rounded-2xl bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-display text-base font-bold tracking-tight">{t.roadmapTitle}</h2>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{t.roadmapSubtitle}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {result.roadmap.steps.map((code, i) => (
                      <span key={`${code}-${i}`} className="inline-flex items-center gap-1.5">
                        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-[12px] font-bold text-primary">
                          {code}
                        </span>
                        {i < (result.roadmap?.steps.length ?? 0) - 1 ? (
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" weight="bold" />
                        ) : null}
                      </span>
                    ))}
                  </div>
                  {(() => {
                    const priority = localizePriority(locale, result.roadmap?.priorityKey ?? null);
                    return priority ? (
                      <p className="mt-4 rounded-xl bg-primary/5 px-4 py-3 text-[13px] font-semibold text-primary">
                        <span className="text-[10px] uppercase tracking-wider opacity-70">{t.priorityLabel}</span>
                        <br />
                        {priority}
                      </p>
                    ) : null;
                  })()}
                </section>
              ) : null}

              {/* Phase 1 + viral gate — 비자 status 그룹 + nextSteps + positions
                  + CTA 를 한 IIFE 로 묶고 인증 상태에 따라 분기.
                  • 비회원: 첫 status 그룹만 보여주고 → 회원가입 CTA → 나머지는
                    화이트 딤 그라데이션 + blur 로 가려 viral 신호 + 가입 동기
                    제공. (saju 패턴 변형)
                  • 회원: 전부 그대로 노출 + 마지막에 이력서 코칭 CTA.
                  • 인증 로딩: 첫 그룹 + 빈 placeholder (layout shift 방지). */}
              {(() => {
                const groups: VisaStatus[] = [
                  "available_now",
                  "after_job_offer",
                  "after_graduation",
                  "needs_preparation",
                  "not_likely"
                ];
                const byStatus = new Map<VisaStatus, EligibleVisa[]>();
                for (const v of result.eligibleVisas) {
                  const s = (v.status ?? "needs_preparation") as VisaStatus;
                  if (!byStatus.has(s)) byStatus.set(s, []);
                  byStatus.get(s)!.push(v);
                }
                const visaGroups = groups
                  .map((s) => ({ status: s, visas: byStatus.get(s) ?? [] }))
                  .filter((g) => g.visas.length > 0);

                // 단일 비자 status 그룹의 JSX. (function 이 아니라 helper 변수로
                // 내려놓아 IIFE 내부에서 깔끔하게 호출.)
                const renderGroup = (g: { status: VisaStatus; visas: EligibleVisa[] }) => {
                  const status = localizeStatus(locale, g.status);
                  return (
                    <section key={g.status} className="space-y-3">
                      <header className="px-1">
                        <p className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold ${STATUS_PILL_CLS[g.status]}`}>
                          {status.label}
                        </p>
                        <p className="mt-1.5 text-[12px] text-muted-foreground">{status.helper}</p>
                      </header>
                      {g.visas.map((v) => {
                        const localized = localizeVisa(locale, v.code, { koreanLevel: result.koreanLevel });
                        const name = localized?.name ?? v.name;
                        const conditions = localized?.conditions ?? v.conditions;
                        const notes = localized?.notes ?? v.notes;
                        return (
                          <article key={v.code} className="rounded-2xl bg-white p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="font-display text-xl font-bold tracking-tight">
                                {v.code} <span className="text-sm font-semibold text-muted-foreground">· {name}</span>
                              </p>
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${FIT_CLS[v.fit]}`}>
                                {FIT_LABEL[v.fit]}
                              </span>
                            </div>
                            {v.blockers && v.blockers.length > 0 ? (
                              <div className="mt-3 rounded-xl border border-border/40 bg-muted/20 p-3">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  {t.blockersHeading}
                                </p>
                                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                                  {v.blockers.map((b) => (
                                    <li key={b} className="inline-flex items-center rounded-full border border-border/60 bg-white px-2.5 py-1 text-[11px] font-semibold text-foreground/80">
                                      {localizeBlocker(locale, b)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                            <ul className="mt-3 space-y-1.5 text-sm text-foreground">
                              {conditions.map((c, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                            {notes ? (
                              <p className="mt-3 rounded-lg bg-muted/30 px-3 py-2 text-[12px] text-muted-foreground">
                                💡 {notes}
                              </p>
                            ) : null}
                          </article>
                        );
                      })}
                    </section>
                  );
                };

                const nextStepsBlock =
                  result.nextSteps && result.nextSteps.length > 0 ? (
                    <section key="next-steps" className="rounded-2xl bg-white p-5">
                      <div>
                        <h2 className="font-display text-base font-bold tracking-tight">{t.nextStepsTitle}</h2>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">{t.nextStepsSubtitle}</p>
                      </div>
                      <div className="mt-3 space-y-3">
                        {result.nextSteps.map((step, i) => (
                          <div key={i} className="rounded-xl border border-border/40 bg-muted/20 p-4">
                            <p className="text-[13px] font-bold text-foreground">Q. {localizeText(locale, step.qKey)}</p>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{localizeText(locale, step.aKey)}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ) : null;

                const positionsBlock = (
                  <section key="positions" className="rounded-2xl bg-white p-5">
                    <h2 className="text-sm font-semibold text-muted-foreground">{t.positionsTitle}</h2>
                    {positions.length === 0 ? (
                      <p className="mt-3 text-sm text-muted-foreground">{t.positionsEmpty}</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {positions.map((p) => (
                          <Link key={p.id} href={`/talent/jobs/${p.id}`} className="block rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition hover:border-primary/40 hover:bg-primary/5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              {p.partnerOrganization?.name ?? t.partnerCompanyFallback}
                            </p>
                            <p className="mt-0.5 text-sm font-semibold text-foreground">{p.title}</p>
                          </Link>
                        ))}
                      </div>
                    )}
                  </section>
                );

                const signupCTA = (
                  <section className="rounded-3xl border border-border/40 bg-white p-6 text-center">
                    <h2 className="font-display text-lg font-bold tracking-tight">{t.signupHeading}</h2>
                    <p className="mt-2 whitespace-pre-line text-[12.5px] leading-relaxed text-muted-foreground">
                      {t.signupSub}
                    </p>
                    <div className="mt-5 flex w-full flex-col gap-2">
                      <a href={`${API_BASE}/auth/naver/start?next=${nextParam}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] text-[14px] font-semibold text-white transition active:bg-[#02b551]">
                        <span aria-hidden className="text-base font-black">N</span>
                        {t.naverBtn}
                      </a>
                      <a href={`${API_BASE}/auth/kakao/start?next=${nextParam}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[14px] font-semibold text-[#191919] transition active:bg-[#f5dd00]">
                        <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.86 5.36 4.66 6.78L5.5 21.5c-.1.34.27.62.57.43L10.5 19c.5.05 1 .08 1.5.08 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
                        </svg>
                        {t.kakaoBtn}
                      </a>
                      <a href={`${API_BASE}/auth/google/start?next=${nextParam}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/60 bg-white text-[14px] font-semibold text-[#191919] transition active:bg-muted/40">
                        <svg aria-hidden className="h-4 w-4" viewBox="0 0 48 48">
                          <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                          <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                          <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                          <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                        </svg>
                        {t.googleBtn}
                      </a>
                      <Link href={`/signup?next=${nextParam}&fromVisa=${encodeURIComponent(slug)}`} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-muted/40 text-[14px] font-semibold text-foreground transition active:bg-muted/60">
                        {t.emailBtn}
                      </Link>
                    </div>
                  </section>
                );

                const signedInCTA = (
                  <section className="rounded-3xl border border-border/40 bg-white p-6 text-center">
                    <h2 className="font-display text-lg font-bold tracking-tight">{t.signedInHeading}</h2>
                    <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">{t.signedInSub}</p>
                    <Link href="/resume" className="mt-5 flex h-12 w-full items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-semibold transition active:bg-primary/90">
                      {t.signedInCta}
                    </Link>
                  </section>
                );

                const firstGroup = visaGroups[0];
                const restGroups = visaGroups.slice(1);

                if (!isReady) {
                  return (
                    <>
                      {firstGroup ? renderGroup(firstGroup) : null}
                      <section className="rounded-3xl border border-border/40 bg-white p-6 h-[280px]" aria-hidden />
                    </>
                  );
                }

                if (isAuthenticated) {
                  return (
                    <>
                      {visaGroups.map(renderGroup)}
                      {nextStepsBlock}
                      {positionsBlock}
                      {signedInCTA}
                    </>
                  );
                }

                // 비회원 — 첫 그룹 노출 → 가입 CTA → 나머지는 화이트 딤 그라데
                // 이션 + blur 로 미리보기. CSS mask 로 18% 까지 또렷이 → 55% 에서
                // 사라지며 자연스럽게 white-out. pointer-events-none 으로 클릭 차단.
                return (
                  <>
                    {firstGroup ? renderGroup(firstGroup) : null}
                    {signupCTA}
                    {(restGroups.length > 0 || nextStepsBlock || positions.length > 0) ? (
                      <div
                        aria-hidden
                        className="pointer-events-none select-none space-y-6 [filter:blur(3px)] opacity-70"
                        style={{
                          maskImage:
                            "linear-gradient(to bottom, black 0%, black 18%, transparent 55%)",
                          WebkitMaskImage:
                            "linear-gradient(to bottom, black 0%, black 18%, transparent 55%)"
                        }}
                      >
                        {restGroups.map(renderGroup)}
                        {nextStepsBlock}
                        {positionsBlock}
                      </div>
                    ) : null}
                  </>
                );
              })()}

              {/* Share actions */}
              <section className="rounded-2xl bg-white p-5">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-white text-xs font-semibold"
                  >
                    <ShareNetwork className="h-3.5 w-3.5" weight="bold" />
                    {t.shareBtn}
                  </button>
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-white text-xs font-semibold"
                  >
                    <CopyIcon className="h-3.5 w-3.5" weight="bold" />
                    {copied ? t.copyDone : t.copyBtn}
                  </button>
                  <Link
                    href="/events/visa"
                    className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-white text-xs font-semibold"
                  >
                    <ArrowClockwise className="h-3.5 w-3.5" weight="bold" />
                    {t.retryBtn}
                  </Link>
                </div>
              </section>
            </>
          ) : null}

          {/* 결과 데이터 유무와 관계없이 푸터 노출 — 정책/법인 정보는 항상 접근
              가능하게. (loading/error/result 모든 분기 바깥) */}
          <VisaEventFooter locale={locale} />
        </div>
      </main>
    </div>
  );
}
