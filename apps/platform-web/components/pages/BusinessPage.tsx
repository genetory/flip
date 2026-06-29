"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Briefcase,
  ChartLineUp,
  CheckCircle,
  FileText,
  GraduationCap,
  Lightning,
  Scales,
  ShieldCheck,
  Translate,
  Trophy,
  UsersThree
} from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Reveal } from "../site/Reveal";
import { Button } from "../ui/button";
import { useLanguage } from "../i18n/LanguageProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import { paperlogy } from "../../lib/fonts";

// ---------------------------------------------------------------------------
// /business — "aply, for Business" 기업 대상 랜딩 페이지.
// 기본(홈) 페이지와 동일한 디자인 시스템: 표준 Header/Footer, font-sans 본문 +
// paperlogy/font-display 헤딩, deep-navy(#0B1227) 제목 · blue(#0B46E8) 액센트,
// Button + Reveal. 6개 로케일 다국어(ko/en/zh-CN/vi/ja/id).
// 고유명사(브랜드·학교·기술 태그·요금 영문명·프로세스 코드·eyebrow)는 로케일
// 불변 상수로 분리하고, 산문만 COPY 사전에서 번역.
// ---------------------------------------------------------------------------

const SIGNUP_PATH = "/signup";
const CONTACT_EMAIL = "info@flip-ers.com";
const SITE_URL = "www.aply.global";

type Copy = {
  heroEyebrow: string;
  heroTitleA: string;
  heroTitleHighlight: string;
  heroTitleB: string;
  heroSub: string;
  heroChips: string[];
  ctaPrimary: string;
  ctaSecondary: string;
  trustSub: string;
  trustMoreUniv: string;
  trustMoreInst: string;
  trustMoreCorp: string;
  problemTitle: string;
  problemSub: string;
  painPoints: { title: string; desc: string }[];
  problemLink: string;
  verifyTitle: string;
  statLabels: string[];
  verifySteps: { title: string; rate: string }[];
  verifyFoot: string;
  talentTitleA: string;
  talentTitleB: string;
  talentSub: string;
  talents: { country: string; role: string }[];
  talentLink: string;
  beforeTitleA: string;
  beforeTitleB: string;
  beforeItems: { title: string; desc: string }[];
  afterTitleA: string;
  afterTitleB: string;
  afterItems: { title: string; desc: string; badge: string }[];
  pricingTitle: string;
  pricingSub: string;
  processSteps: { title: string; note?: string }[];
  pricingTiers: { tier: string; price: string; desc: string }[];
  rematchNote: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
  finalTitle: string;
  finalSub: string;
  finalCta: string;
};

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    heroEyebrow: "For Companies · 글로벌 인재 채용 솔루션",
    heroTitleA: "검증된 글로벌 인재,",
    heroTitleHighlight: "비용 & 채용 리스크 없이",
    heroTitleB: "만나보세요",
    heroSub: "서류 · AI 면접 · 사전 교육 · 5주의 스코어링을 통과한 인재만 추천합니다. 비자 · 행정 · 법무까지 Aply가 운영합니다.",
    heroChips: ["검증된 인재", "안전한 계약", "합리적 비용"],
    ctaPrimary: "무료로 포지션 등록하기",
    ctaSecondary: "인재 풀 살펴보기",
    trustSub: "대학 · 기관 · 기업이 aply와 함께하고 있습니다.",
    trustMoreUniv: "외 13개",
    trustMoreInst: "외 다수",
    trustMoreCorp: "and more…",
    problemTitle: "외국인 채용, 무엇이 어려운가",
    problemSub: "한국 기업 인사 담당자가 가장 자주 직면하는 4가지 문제입니다.",
    painPoints: [
      { title: "검증 리스크", desc: "지원자 정보와 경력의 진위를 확인하기 어렵고, 잘못된 채용은 곧 비용으로 돌아옵니다." },
      { title: "행정 · 법무 리스크", desc: "비자 · 4대보험 · 노무 · 체류자격 변경 등 복잡한 행정·법무 부담이 큽니다." },
      { title: "문화 적응 리스크", desc: "언어 · 문화 · 근태 차이로 인한 소통 문제와 조기 이탈 가능성이 있습니다." },
      { title: "HR 리소스 소진", desc: "검증 · 행정 · 비자 처리에 인사팀의 리소스가 과도하게 소모됩니다." }
    ],
    problemLink: "Aply가 이 모든 단계를 대행합니다",
    verifyTitle: "말로만 약속하지 않아요. 숫자로 보여드려요.",
    statLabels: ["확보 인재", "누적 매칭", "기업 만족도", "재참여 의향", "평균 응답"],
    verifySteps: [
      { title: "서류 검증", rate: "통과율 70%" },
      { title: "AI 사전 면접", rate: "통과율 50%" },
      { title: "사전 교육", rate: "통과율 60%" },
      { title: "5주 스코어링", rate: "실전 검증" }
    ],
    verifyFoot: "전체 등록 인재의 상위 38%만 기업에 추천됩니다.",
    talentTitleA: "이런 글로벌 인재들이",
    talentTitleB: "기다리고 있습니다",
    talentSub: "사전 검증된 글로벌 인재 풀 — 1,500+ 등록 · 50+ 국가 · TOPIK 4급+ 80% · 학·석·박사 65%",
    talents: [
      { country: "베트남", role: "IT 개발자" },
      { country: "중국", role: "마케터" },
      { country: "미국", role: "영업" },
      { country: "프랑스", role: "디자이너" }
    ],
    talentLink: "마음에 드는 인재가 있다면 → 포지션 등록",
    beforeTitleA: "이런 건,",
    beforeTitleB: "신경 쓰지 마세요",
    beforeItems: [
      { title: "광고 · 소싱", desc: "채용 공고 게시, 소싱, 1차 스크리닝까지 Aply가 대신합니다." },
      { title: "실무 검증", desc: "서류 · AI 면접 · 사전 교육 · 스코어링을 통과한 인재만 받습니다." },
      { title: "비자 · 노무 · 법무", desc: "체류자격 · 4대보험 · 근로계약 등 행정 전 과정을 대행합니다." },
      { title: "조기 퇴사 리스크", desc: "사전 교육과 정착 지원으로 조기 이탈을 최소화합니다." }
    ],
    afterTitleA: "대신,",
    afterTitleB: "이런 걸 얻습니다",
    afterItems: [
      { title: "리스크 없는 시범 검증", desc: "실전 배치 전 검증으로 채용 실패 비용을 제거합니다.", badge: "무료 시작" },
      { title: "HR 리소스 절감", desc: "소싱 · 검증 · 행정을 Aply가 대행합니다.", badge: "-80% 공수" },
      { title: "검증된 인재만 추천", desc: "전체 등록 인재의 상위 38%만 추천합니다.", badge: "38% 추천율" },
      { title: "정착률 보장", desc: "Re-match로 정착까지 책임집니다.", badge: "Re-match 보장" }
    ],
    pricingTitle: "프로세스 · 요금",
    pricingSub: "단계별 의사결정, 명확한 비용 구조",
    processSteps: [
      { title: "포지션 등록" },
      { title: "후보 추천", note: "48h 내" },
      { title: "기업 면접" },
      { title: "실전 배치 시작" },
      { title: "성과 검증" },
      { title: "정규 전환" }
    ],
    pricingTiers: [
      { tier: "등록형", price: "무료", desc: "포지션 등록 · 인재 열람" },
      { tier: "면접형", price: "5%", desc: "면접 진행 후 검증" },
      { tier: "채용형", price: "10%", desc: "계약 채용 전환 시" },
      { tier: "정규직", price: "15%", desc: "정규직 전환 시" }
    ],
    rematchNote: "Re-match Guarantee — 조기 3주 내 이탈 문제 시 추가 비용 없이 재매칭해 드립니다.",
    faqTitle: "자주 묻는 질문",
    faqs: [
      { q: "비용이 드나요?", a: "포지션 등록과 인재 열람은 무료입니다. 채용 전환 시에만 단계별 수수료(5~15%)가 발생합니다." },
      { q: "인재 검증은 어떻게 하나요?", a: "서류 · AI 사전 면접 · 사전 교육 · 5주 스코어링의 4단계를 거쳐 상위 인재만 추천합니다." },
      { q: "비자 · 행정은 어디까지 지원되나요?", a: "체류자격 변경 · 4대보험 · 근로계약 등 채용 행정 전 과정을 aply가 대행합니다." },
      { q: "어떤 직군에 적합한가요?", a: "개발 · 마케팅 · 영업 · 디자인 등 다양한 직군의 검증된 글로벌 인재를 보유하고 있습니다." },
      { q: "정착 보장은 있나요?", a: "조기 3주 내 이탈 시 추가 비용 없이 재매칭하는 Re-match Guarantee를 제공합니다." }
    ],
    finalTitle: "검증된 글로벌 인재, 지금 만나보세요",
    finalSub: "무료 컨설팅으로 귀사에 맞는 채용 모델을 설계합니다. 포지션 등록은 무료, 채용 전환 시에만 비용이 발생합니다.",
    finalCta: "기업 회원가입 · 포지션 무료 등록하기"
  },
  en: {
    heroEyebrow: "For Companies · Global Talent Hiring Solution",
    heroTitleA: "Meet verified global talent,",
    heroTitleHighlight: "with no cost & no hiring risk",
    heroTitleB: "",
    heroSub: "We recommend only talent who has passed document review · AI interview · pre-training · 5-week scoring. aply handles everything from visa · administration · legal.",
    heroChips: ["Verified Talent", "Secure Contracts", "Reasonable Cost"],
    ctaPrimary: "Post a Position for Free",
    ctaSecondary: "Explore the Talent Pool",
    trustSub: "Universities · institutions · companies are partnering with aply.",
    trustMoreUniv: "+13 more",
    trustMoreInst: "and many more",
    trustMoreCorp: "and more…",
    problemTitle: "What makes hiring foreign talent so hard",
    problemSub: "The 4 challenges Korean HR teams face most often.",
    painPoints: [
      { title: "Verification Risk", desc: "It is hard to confirm whether applicant information and experience are genuine, and a bad hire quickly turns into a cost." },
      { title: "Administrative · Legal Risk", desc: "Visas · social insurance · labor law · status-of-stay changes create a heavy administrative and legal burden." },
      { title: "Cultural Adaptation Risk", desc: "Differences in language · culture · work habits can cause communication issues and early turnover." },
      { title: "HR Resource Drain", desc: "Verification · administration · visa processing consume excessive HR team resources." }
    ],
    problemLink: "Aply handles every one of these steps for you",
    verifyTitle: "We don't just promise. We prove it with numbers.",
    statLabels: ["Talent Secured", "Total Matches", "Client Satisfaction", "Intent to Reuse", "Avg. Response"],
    verifySteps: [
      { title: "Document Review", rate: "70% Pass Rate" },
      { title: "AI Pre-Interview", rate: "50% Pass Rate" },
      { title: "Pre-Training", rate: "60% Pass Rate" },
      { title: "5-Week Scoring", rate: "Real-World Proof" }
    ],
    verifyFoot: "Only the top 38% of all registered talent is recommended to companies.",
    talentTitleA: "Global talent like this",
    talentTitleB: "is waiting for you",
    talentSub: "A pre-verified global talent pool — 1,500+ registered · 50+ countries · TOPIK Level 4+ 80% · Bachelor's/Master's/PhD 65%",
    talents: [
      { country: "Vietnam", role: "IT Developer" },
      { country: "China", role: "Marketer" },
      { country: "USA", role: "Sales" },
      { country: "France", role: "Designer" }
    ],
    talentLink: "Found someone you like? → Post a Position",
    beforeTitleA: "Things like this,",
    beforeTitleB: "leave them to us",
    beforeItems: [
      { title: "Advertising · Sourcing", desc: "Aply handles job posting, sourcing, and first-round screening for you." },
      { title: "Practical Verification", desc: "We only accept talent who has passed document review · AI interview · pre-training · scoring." },
      { title: "Visa · Labor · Legal", desc: "We handle the entire administrative process — status of stay · social insurance · employment contracts." },
      { title: "Early Turnover Risk", desc: "Pre-training and settlement support minimize early departures." }
    ],
    afterTitleA: "Instead,",
    afterTitleB: "here is what you gain",
    afterItems: [
      { title: "Risk-Free Trial Verification", desc: "Verification before real deployment eliminates the cost of a failed hire.", badge: "Free Start" },
      { title: "Reduced HR Workload", desc: "Aply handles sourcing · verification · administration.", badge: "-80% Effort" },
      { title: "Only Verified Talent", desc: "Only the top 38% of all registered talent is recommended.", badge: "38% Referral Rate" },
      { title: "Retention Guaranteed", desc: "With Re-match, we stand behind successful settlement.", badge: "Re-match Guarantee" }
    ],
    pricingTitle: "Process · Pricing",
    pricingSub: "Step-by-step decisions, a clear cost structure",
    processSteps: [
      { title: "Post a Position" },
      { title: "Candidate Referral", note: "Within 48h" },
      { title: "Company Interview" },
      { title: "Real Deployment Begins" },
      { title: "Performance Review" },
      { title: "Convert to Full-Time" }
    ],
    pricingTiers: [
      { tier: "Listing", price: "Free", desc: "Post positions · browse talent" },
      { tier: "Interview", price: "5%", desc: "Verify after interviewing" },
      { tier: "Hire", price: "10%", desc: "On contract hire conversion" },
      { tier: "Full-Time", price: "15%", desc: "On full-time conversion" }
    ],
    rematchNote: "Re-match Guarantee — if a hire leaves within the first 3 weeks, we re-match at no additional cost.",
    faqTitle: "Frequently Asked Questions",
    faqs: [
      { q: "Is there a cost?", a: "Posting positions and browsing talent are free. A step-by-step fee (5–15%) applies only upon hire conversion." },
      { q: "How is talent verified?", a: "Talent passes 4 stages — document review · AI pre-interview · pre-training · 5-week scoring — and only the top tier is recommended." },
      { q: "How far does visa · administration support go?", a: "Aply handles the entire hiring administration — status-of-stay changes · social insurance · employment contracts." },
      { q: "Which roles is it suited for?", a: "We have verified global talent across many fields — development · marketing · sales · design." },
      { q: "Is there a settlement guarantee?", a: "We offer the Re-match Guarantee: if a hire leaves within the first 3 weeks, we re-match at no additional cost." }
    ],
    finalTitle: "Meet verified global talent, right now",
    finalSub: "We design a hiring model that fits your company through a free consultation. Posting positions is free; costs apply only upon hire conversion.",
    finalCta: "Sign Up · Post a Position for Free"
  },
  "zh-CN": {
    heroEyebrow: "For Companies · 全球人才招聘解决方案",
    heroTitleA: "结识经过验证的全球人才,",
    heroTitleHighlight: "无成本 & 无招聘风险",
    heroTitleB: "",
    heroSub: "我们只推荐通过简历审核 · AI 面试 · 岗前培训 · 5 周评分的人才。从签证 · 行政 · 法务，全部由 Aply 负责运营。",
    heroChips: ["经过验证的人才", "安全的合约", "合理的成本"],
    ctaPrimary: "免费发布职位",
    ctaSecondary: "浏览人才库",
    trustSub: "高校 · 机构 · 企业正在与 Aply 携手合作。",
    trustMoreUniv: "等 13 家",
    trustMoreInst: "等多家",
    trustMoreCorp: "and more…",
    problemTitle: "招聘外籍人才，难在哪里",
    problemSub: "韩国企业 HR 最常面临的 4 大难题。",
    painPoints: [
      { title: "验证风险", desc: "难以确认申请者信息与履历的真实性，一次错误的招聘很快就会转化为成本。" },
      { title: "行政 · 法务风险", desc: "签证 · 四大保险 · 劳务 · 居留资格变更等复杂的行政与法务负担沉重。" },
      { title: "文化适应风险", desc: "语言 · 文化 · 出勤习惯的差异可能引发沟通问题及提前离职。" },
      { title: "HR 资源消耗", desc: "验证 · 行政 · 签证处理过度消耗 HR 团队的资源。" }
    ],
    problemLink: "Aply 为您代办这全部环节",
    verifyTitle: "我们不止于口头承诺，而是用数字证明。",
    statLabels: ["储备人才", "累计匹配", "企业满意度", "再次合作意愿", "平均响应"],
    verifySteps: [
      { title: "简历审核", rate: "通过率 70%" },
      { title: "AI 预面试", rate: "通过率 50%" },
      { title: "岗前培训", rate: "通过率 60%" },
      { title: "5 周评分", rate: "实战验证" }
    ],
    verifyFoot: "仅全部注册人才中排名前 38% 的人才才会被推荐给企业。",
    talentTitleA: "这样的全球人才",
    talentTitleB: "正在等待您",
    talentSub: "经过预先验证的全球人才库 —— 1,500+ 注册 · 50+ 国家 · TOPIK 4 级以上 80% · 本/硕/博 65%",
    talents: [
      { country: "越南", role: "IT 开发" },
      { country: "中国", role: "市场营销" },
      { country: "美国", role: "销售" },
      { country: "法国", role: "设计师" }
    ],
    talentLink: "遇到心仪的人才？→ 发布职位",
    beforeTitleA: "这些事，",
    beforeTitleB: "您无需操心",
    beforeItems: [
      { title: "广告 · 寻源", desc: "招聘公告发布、寻源、初筛，全部由 Aply 代办。" },
      { title: "实务验证", desc: "我们只接收通过简历 · AI 面试 · 岗前培训 · 评分的人才。" },
      { title: "签证 · 劳务 · 法务", desc: "居留资格 · 四大保险 · 劳动合同等行政全流程代办。" },
      { title: "提前离职风险", desc: "通过岗前培训与落地支持，将提前离职降至最低。" }
    ],
    afterTitleA: "取而代之，",
    afterTitleB: "您将获得这些",
    afterItems: [
      { title: "零风险试用验证", desc: "正式上岗前先行验证，消除招聘失败的成本。", badge: "免费开始" },
      { title: "节省 HR 资源", desc: "寻源 · 验证 · 行政均由 Aply 代办。", badge: "-80% 工作量" },
      { title: "只推荐经过验证的人才", desc: "仅推荐全部注册人才中排名前 38% 的人才。", badge: "38% 推荐率" },
      { title: "落地率保障", desc: "通过 Re-match，为成功落地负责到底。", badge: "Re-match 保障" }
    ],
    pricingTitle: "流程 · 费用",
    pricingSub: "分阶段决策，清晰的费用结构",
    processSteps: [
      { title: "发布职位" },
      { title: "候选人推荐", note: "48h 内" },
      { title: "企业面试" },
      { title: "正式上岗" },
      { title: "成果验证" },
      { title: "转为正式" }
    ],
    pricingTiers: [
      { tier: "发布型", price: "免费", desc: "发布职位 · 查阅人才" },
      { tier: "面试型", price: "5%", desc: "面试后验证" },
      { tier: "招聘型", price: "10%", desc: "合约招聘转化时" },
      { tier: "正式员工", price: "15%", desc: "转为正式员工时" }
    ],
    rematchNote: "Re-match Guarantee —— 若在入职 3 周内出现离职问题，我们将免费重新匹配。",
    faqTitle: "常见问题",
    faqs: [
      { q: "需要费用吗？", a: "发布职位与查阅人才均免费。仅在招聘转化时才会产生分阶段手续费（5~15%）。" },
      { q: "如何进行人才验证？", a: "经过简历 · AI 预面试 · 岗前培训 · 5 周评分的 4 个阶段，只推荐顶尖人才。" },
      { q: "签证 · 行政支持到什么程度？", a: "居留资格变更 · 四大保险 · 劳动合同等招聘行政全流程，均由 aply 代办。" },
      { q: "适合哪些岗位？", a: "我们拥有开发 · 市场 · 销售 · 设计等多种岗位经过验证的全球人才。" },
      { q: "有落地保障吗？", a: "我们提供 Re-match Guarantee：若在入职 3 周内离职，将免费重新匹配。" }
    ],
    finalTitle: "经过验证的全球人才，现在就来结识",
    finalSub: "通过免费咨询，为贵公司量身设计招聘模式。发布职位免费，仅在招聘转化时产生费用。",
    finalCta: "企业注册 · 免费发布职位"
  },
  vi: {
    heroEyebrow: "For Companies · Giải pháp tuyển dụng nhân tài toàn cầu",
    heroTitleA: "Gặp gỡ nhân tài toàn cầu đã được xác minh,",
    heroTitleHighlight: "không chi phí & không rủi ro tuyển dụng",
    heroTitleB: "",
    heroSub: "Chúng tôi chỉ giới thiệu những nhân tài đã vượt qua hồ sơ · phỏng vấn AI · đào tạo trước · 5 tuần chấm điểm. Từ visa · hành chính · pháp lý đều do Aply vận hành.",
    heroChips: ["Nhân tài đã xác minh", "Hợp đồng an toàn", "Chi phí hợp lý"],
    ctaPrimary: "Đăng vị trí miễn phí",
    ctaSecondary: "Khám phá nguồn nhân tài",
    trustSub: "Các trường đại học · tổ chức · doanh nghiệp đang đồng hành cùng Aply.",
    trustMoreUniv: "và 13 đơn vị khác",
    trustMoreInst: "và nhiều đơn vị khác",
    trustMoreCorp: "and more…",
    problemTitle: "Tuyển dụng người nước ngoài, điều gì khó khăn",
    problemSub: "4 vấn đề mà bộ phận nhân sự của doanh nghiệp Hàn Quốc thường gặp nhất.",
    painPoints: [
      { title: "Rủi ro xác minh", desc: "Khó kiểm chứng tính xác thực của thông tin và kinh nghiệm ứng viên, một quyết định tuyển dụng sai sẽ nhanh chóng trở thành chi phí." },
      { title: "Rủi ro hành chính · pháp lý", desc: "Visa · 4 loại bảo hiểm · lao động · thay đổi tư cách lưu trú và các gánh nặng hành chính, pháp lý phức tạp khác là rất lớn." },
      { title: "Rủi ro thích nghi văn hóa", desc: "Khác biệt về ngôn ngữ · văn hóa · thói quen làm việc có thể gây vấn đề giao tiếp và nghỉ việc sớm." },
      { title: "Cạn kiệt nguồn lực HR", desc: "Việc xác minh · hành chính · xử lý visa tiêu tốn quá mức nguồn lực của đội ngũ nhân sự." }
    ],
    problemLink: "Aply thay bạn xử lý toàn bộ các bước này",
    verifyTitle: "Chúng tôi không chỉ hứa suông. Chúng tôi chứng minh bằng con số.",
    statLabels: ["Nhân tài sẵn có", "Tổng số kết nối", "Hài lòng của DN", "Ý định hợp tác lại", "Phản hồi TB"],
    verifySteps: [
      { title: "Xác minh hồ sơ", rate: "Tỷ lệ đạt 70%" },
      { title: "Phỏng vấn AI", rate: "Tỷ lệ đạt 50%" },
      { title: "Đào tạo trước", rate: "Tỷ lệ đạt 60%" },
      { title: "Chấm điểm 5 tuần", rate: "Kiểm chứng thực tế" }
    ],
    verifyFoot: "Chỉ 38% nhân tài hàng đầu trong toàn bộ đăng ký được giới thiệu cho doanh nghiệp.",
    talentTitleA: "Những nhân tài toàn cầu như thế này",
    talentTitleB: "đang chờ đợi bạn",
    talentSub: "Nguồn nhân tài toàn cầu đã xác minh trước — 1,500+ đăng ký · 50+ quốc gia · TOPIK cấp 4+ 80% · Cử nhân/Thạc sĩ/Tiến sĩ 65%",
    talents: [
      { country: "Việt Nam", role: "Lập trình viên IT" },
      { country: "Trung Quốc", role: "Marketer" },
      { country: "Hoa Kỳ", role: "Kinh doanh" },
      { country: "Pháp", role: "Nhà thiết kế" }
    ],
    talentLink: "Có nhân tài ưng ý? → Đăng vị trí",
    beforeTitleA: "Những việc này,",
    beforeTitleB: "bạn đừng bận tâm",
    beforeItems: [
      { title: "Quảng cáo · tìm nguồn", desc: "Aply thay bạn đăng tin tuyển dụng, tìm nguồn và sàng lọc vòng đầu." },
      { title: "Xác minh thực tế", desc: "Chúng tôi chỉ nhận nhân tài đã vượt qua hồ sơ · phỏng vấn AI · đào tạo trước · chấm điểm." },
      { title: "Visa · lao động · pháp lý", desc: "Chúng tôi xử lý toàn bộ quy trình hành chính như tư cách lưu trú · 4 loại bảo hiểm · hợp đồng lao động." },
      { title: "Rủi ro nghỉ việc sớm", desc: "Đào tạo trước và hỗ trợ hòa nhập giúp giảm thiểu tối đa việc nghỉ việc sớm." }
    ],
    afterTitleA: "Thay vào đó,",
    afterTitleB: "bạn nhận được những điều này",
    afterItems: [
      { title: "Kiểm chứng thử không rủi ro", desc: "Xác minh trước khi bố trí thực tế giúp loại bỏ chi phí tuyển dụng thất bại.", badge: "Bắt đầu miễn phí" },
      { title: "Tiết kiệm nguồn lực HR", desc: "Aply thay bạn xử lý tìm nguồn · xác minh · hành chính.", badge: "-80% công sức" },
      { title: "Chỉ giới thiệu nhân tài đã xác minh", desc: "Chỉ giới thiệu 38% nhân tài hàng đầu trong toàn bộ đăng ký.", badge: "Tỷ lệ giới thiệu 38%" },
      { title: "Đảm bảo tỷ lệ hòa nhập", desc: "Với Re-match, chúng tôi đảm bảo đến khi hòa nhập thành công.", badge: "Đảm bảo Re-match" }
    ],
    pricingTitle: "Quy trình · Phí",
    pricingSub: "Quyết định theo từng bước, cơ cấu chi phí rõ ràng",
    processSteps: [
      { title: "Đăng vị trí" },
      { title: "Giới thiệu ứng viên", note: "Trong 48h" },
      { title: "Doanh nghiệp phỏng vấn" },
      { title: "Bắt đầu bố trí thực tế" },
      { title: "Đánh giá hiệu suất" },
      { title: "Chuyển sang chính thức" }
    ],
    pricingTiers: [
      { tier: "Đăng tin", price: "Miễn phí", desc: "Đăng vị trí · xem hồ sơ nhân tài" },
      { tier: "Phỏng vấn", price: "5%", desc: "Xác minh sau khi phỏng vấn" },
      { tier: "Tuyển dụng", price: "10%", desc: "Khi chuyển sang tuyển dụng theo hợp đồng" },
      { tier: "Chính thức", price: "15%", desc: "Khi chuyển sang nhân viên chính thức" }
    ],
    rematchNote: "Re-match Guarantee — Nếu có vấn đề nghỉ việc trong 3 tuần đầu, chúng tôi sẽ kết nối lại mà không tính thêm phí.",
    faqTitle: "Câu hỏi thường gặp",
    faqs: [
      { q: "Có mất phí không?", a: "Đăng vị trí và xem hồ sơ nhân tài đều miễn phí. Phí theo từng bước (5~15%) chỉ phát sinh khi chuyển sang tuyển dụng." },
      { q: "Nhân tài được xác minh như thế nào?", a: "Trải qua 4 bước hồ sơ · phỏng vấn AI · đào tạo trước · chấm điểm 5 tuần, chỉ những nhân tài hàng đầu được giới thiệu." },
      { q: "Hỗ trợ visa · hành chính đến đâu?", a: "Aply thay bạn xử lý toàn bộ quy trình hành chính tuyển dụng như thay đổi tư cách lưu trú · 4 loại bảo hiểm · hợp đồng lao động." },
      { q: "Phù hợp với nhóm ngành nào?", a: "Chúng tôi sở hữu nhân tài toàn cầu đã xác minh ở nhiều nhóm ngành như phát triển · marketing · kinh doanh · thiết kế." },
      { q: "Có đảm bảo hòa nhập không?", a: "Chúng tôi cung cấp Re-match Guarantee: nếu nghỉ việc trong 3 tuần đầu, chúng tôi kết nối lại mà không tính thêm phí." }
    ],
    finalTitle: "Nhân tài toàn cầu đã xác minh, gặp gỡ ngay hôm nay",
    finalSub: "Qua tư vấn miễn phí, chúng tôi thiết kế mô hình tuyển dụng phù hợp với công ty bạn. Đăng vị trí miễn phí, chi phí chỉ phát sinh khi chuyển sang tuyển dụng.",
    finalCta: "Đăng ký doanh nghiệp · Đăng vị trí miễn phí"
  },
  ja: {
    heroEyebrow: "For Companies · グローバル人材採用ソリューション",
    heroTitleA: "検証済みのグローバル人材を、",
    heroTitleHighlight: "コスト & 採用リスクなしで",
    heroTitleB: "出会いましょう",
    heroSub: "書類 · AI面接 · 事前研修 · 5週間のスコアリングを通過した人材のみをご紹介します。ビザ · 行政 · 法務まで Aply が運営します。",
    heroChips: ["検証済み人材", "安全な契約", "合理的なコスト"],
    ctaPrimary: "無料でポジションを登録する",
    ctaSecondary: "人材プールを見る",
    trustSub: "大学 · 機関 · 企業が Aply とともに歩んでいます。",
    trustMoreUniv: "他13校",
    trustMoreInst: "他多数",
    trustMoreCorp: "and more…",
    problemTitle: "外国人採用、何が難しいのか",
    problemSub: "韓国企業の人事担当者が最も頻繁に直面する4つの課題です。",
    painPoints: [
      { title: "検証リスク", desc: "応募者情報や経歴の真偽を確認しづらく、誤った採用はすぐにコストとなって返ってきます。" },
      { title: "行政 · 法務リスク", desc: "ビザ · 社会保険 · 労務 · 在留資格変更など、複雑な行政・法務の負担が大きくなります。" },
      { title: "文化適応リスク", desc: "言語 · 文化 · 勤怠の違いによるコミュニケーション問題や早期離職の可能性があります。" },
      { title: "HRリソースの消耗", desc: "検証 · 行政 · ビザ処理に人事チームのリソースが過度に消費されます。" }
    ],
    problemLink: "Aply がこれらすべての段階を代行します",
    verifyTitle: "口先だけの約束はしません。数字でお見せします。",
    statLabels: ["確保人材", "累計マッチング", "企業満足度", "再利用意向", "平均応答"],
    verifySteps: [
      { title: "書類検証", rate: "通過率70%" },
      { title: "AI事前面接", rate: "通過率50%" },
      { title: "事前研修", rate: "通過率60%" },
      { title: "5週間スコアリング", rate: "実地検証" }
    ],
    verifyFoot: "登録人材全体のうち上位38%のみが企業にご紹介されます。",
    talentTitleA: "こんなグローバル人材が",
    talentTitleB: "お待ちしています",
    talentSub: "事前検証済みのグローバル人材プール — 1,500+ 登録 · 50+ カ国 · TOPIK 4級以上 80% · 学・修・博 65%",
    talents: [
      { country: "ベトナム", role: "IT開発者" },
      { country: "中国", role: "マーケター" },
      { country: "アメリカ", role: "営業" },
      { country: "フランス", role: "デザイナー" }
    ],
    talentLink: "気になる人材がいれば → ポジション登録",
    beforeTitleA: "こうしたことは、",
    beforeTitleB: "気にしないでください",
    beforeItems: [
      { title: "広告 · ソーシング", desc: "求人掲載、ソーシング、一次スクリーニングまで Aply が代行します。" },
      { title: "実務検証", desc: "書類 · AI面接 · 事前研修 · スコアリングを通過した人材のみを受け入れます。" },
      { title: "ビザ · 労務 · 法務", desc: "在留資格 · 社会保険 · 労働契約など、行政の全工程を代行します。" },
      { title: "早期退職リスク", desc: "事前研修と定着支援で早期離職を最小限に抑えます。" }
    ],
    afterTitleA: "その代わりに、",
    afterTitleB: "こうしたものが手に入ります",
    afterItems: [
      { title: "リスクのない試行検証", desc: "実地配置前の検証で採用失敗のコストをなくします。", badge: "無料スタート" },
      { title: "HRリソースの削減", desc: "ソーシング · 検証 · 行政を Aply が代行します。", badge: "-80% 工数" },
      { title: "検証済み人材のみ紹介", desc: "登録人材全体のうち上位38%のみをご紹介します。", badge: "38% 紹介率" },
      { title: "定着率を保証", desc: "Re-match で定着まで責任を持ちます。", badge: "Re-match 保証" }
    ],
    pricingTitle: "プロセス · 料金",
    pricingSub: "段階ごとの意思決定、明確なコスト構造",
    processSteps: [
      { title: "ポジション登録" },
      { title: "候補者紹介", note: "48h以内" },
      { title: "企業面接" },
      { title: "実地配置開始" },
      { title: "成果検証" },
      { title: "正規転換" }
    ],
    pricingTiers: [
      { tier: "登録型", price: "無料", desc: "ポジション登録 · 人材閲覧" },
      { tier: "面接型", price: "5%", desc: "面接実施後に検証" },
      { tier: "採用型", price: "10%", desc: "契約採用への転換時" },
      { tier: "正社員", price: "15%", desc: "正社員への転換時" }
    ],
    rematchNote: "Re-match Guarantee — 入社3週間以内の早期離職トラブル時には、追加費用なしで再マッチングいたします。",
    faqTitle: "よくある質問",
    faqs: [
      { q: "費用はかかりますか？", a: "ポジション登録と人材閲覧は無料です。採用への転換時のみ段階別の手数料（5〜15%）が発生します。" },
      { q: "人材検証はどのように行いますか？", a: "書類 · AI事前面接 · 事前研修 · 5週間スコアリングの4段階を経て、上位人材のみをご紹介します。" },
      { q: "ビザ · 行政はどこまで支援されますか？", a: "在留資格変更 · 社会保険 · 労働契約など、採用行政の全工程を Aply が代行します。" },
      { q: "どの職種に適していますか？", a: "開発 · マーケティング · 営業 · デザインなど、さまざまな職種の検証済みグローバル人材を擁しています。" },
      { q: "定着保証はありますか？", a: "入社3週間以内の離職時に追加費用なしで再マッチングする Re-match Guarantee を提供します。" }
    ],
    finalTitle: "検証済みのグローバル人材に、今すぐ出会いましょう",
    finalSub: "無料コンサルティングで御社に合った採用モデルを設計します。ポジション登録は無料、採用への転換時のみ費用が発生します。",
    finalCta: "企業会員登録 · ポジション無料登録"
  },
  id: {
    heroEyebrow: "For Companies · Solusi Rekrutmen Talenta Global",
    heroTitleA: "Temui talenta global terverifikasi,",
    heroTitleHighlight: "tanpa biaya & tanpa risiko rekrutmen",
    heroTitleB: "",
    heroSub: "Kami hanya merekomendasikan talenta yang lolos seleksi dokumen · wawancara AI · pelatihan awal · scoring 5 minggu. Mulai dari visa · administrasi · hukum, semuanya dikelola oleh Aply.",
    heroChips: ["Talenta Terverifikasi", "Kontrak Aman", "Biaya Wajar"],
    ctaPrimary: "Pasang Posisi Gratis",
    ctaSecondary: "Jelajahi Kumpulan Talenta",
    trustSub: "Universitas · institusi · perusahaan telah bermitra dengan Aply.",
    trustMoreUniv: "& 13 lainnya",
    trustMoreInst: "& banyak lainnya",
    trustMoreCorp: "and more…",
    problemTitle: "Merekrut tenaga kerja asing, apa yang sulit",
    problemSub: "4 tantangan yang paling sering dihadapi tim HR perusahaan Korea.",
    painPoints: [
      { title: "Risiko Verifikasi", desc: "Sulit memastikan keaslian informasi dan pengalaman pelamar, dan rekrutmen yang salah akan cepat berubah menjadi biaya." },
      { title: "Risiko Administrasi · Hukum", desc: "Visa · 4 jenis asuransi · ketenagakerjaan · perubahan status tinggal menciptakan beban administrasi dan hukum yang besar." },
      { title: "Risiko Adaptasi Budaya", desc: "Perbedaan bahasa · budaya · kebiasaan kerja dapat menimbulkan masalah komunikasi dan pengunduran diri dini." },
      { title: "Sumber Daya HR Terkuras", desc: "Verifikasi · administrasi · pengurusan visa menguras sumber daya tim HR secara berlebihan." }
    ],
    problemLink: "Aply menangani seluruh tahapan ini untuk Anda",
    verifyTitle: "Kami tidak sekadar berjanji. Kami buktikan dengan angka.",
    statLabels: ["Talenta Tersedia", "Total Pencocokan", "Kepuasan Perusahaan", "Niat Bermitra Lagi", "Respons Rata-rata"],
    verifySteps: [
      { title: "Verifikasi Dokumen", rate: "Tingkat Lolos 70%" },
      { title: "Pra-Wawancara AI", rate: "Tingkat Lolos 50%" },
      { title: "Pelatihan Awal", rate: "Tingkat Lolos 60%" },
      { title: "Scoring 5 Minggu", rate: "Uji Lapangan" }
    ],
    verifyFoot: "Hanya 38% talenta teratas dari seluruh pendaftar yang direkomendasikan ke perusahaan.",
    talentTitleA: "Talenta global seperti ini",
    talentTitleB: "sedang menanti Anda",
    talentSub: "Kumpulan talenta global terverifikasi — 1.500+ terdaftar · 50+ negara · TOPIK Level 4+ 80% · S1/S2/S3 65%",
    talents: [
      { country: "Vietnam", role: "Developer IT" },
      { country: "Tiongkok", role: "Marketer" },
      { country: "Amerika Serikat", role: "Sales" },
      { country: "Prancis", role: "Desainer" }
    ],
    talentLink: "Ada talenta yang Anda sukai? → Pasang Posisi",
    beforeTitleA: "Hal-hal seperti ini,",
    beforeTitleB: "tak perlu Anda pikirkan",
    beforeItems: [
      { title: "Iklan · Sourcing", desc: "Aply menangani pemasangan lowongan, sourcing, hingga penyaringan tahap pertama untuk Anda." },
      { title: "Verifikasi Praktik", desc: "Kami hanya menerima talenta yang lolos dokumen · wawancara AI · pelatihan awal · scoring." },
      { title: "Visa · Ketenagakerjaan · Hukum", desc: "Kami menangani seluruh proses administrasi seperti status tinggal · 4 jenis asuransi · kontrak kerja." },
      { title: "Risiko Resign Dini", desc: "Pelatihan awal dan dukungan adaptasi meminimalkan pengunduran diri dini." }
    ],
    afterTitleA: "Sebaliknya,",
    afterTitleB: "inilah yang Anda dapatkan",
    afterItems: [
      { title: "Uji Coba Tanpa Risiko", desc: "Verifikasi sebelum penempatan nyata menghilangkan biaya rekrutmen yang gagal.", badge: "Mulai Gratis" },
      { title: "Hemat Sumber Daya HR", desc: "Aply menangani sourcing · verifikasi · administrasi.", badge: "-80% Upaya" },
      { title: "Hanya Talenta Terverifikasi", desc: "Hanya 38% talenta teratas dari seluruh pendaftar yang direkomendasikan.", badge: "Tingkat Rekomendasi 38%" },
      { title: "Jaminan Tingkat Adaptasi", desc: "Dengan Re-match, kami bertanggung jawab hingga adaptasi berhasil.", badge: "Jaminan Re-match" }
    ],
    pricingTitle: "Proses · Biaya",
    pricingSub: "Keputusan bertahap, struktur biaya yang jelas",
    processSteps: [
      { title: "Pasang Posisi" },
      { title: "Rekomendasi Kandidat", note: "Dalam 48h" },
      { title: "Wawancara Perusahaan" },
      { title: "Mulai Penempatan Nyata" },
      { title: "Verifikasi Kinerja" },
      { title: "Konversi Tetap" }
    ],
    pricingTiers: [
      { tier: "Pendaftaran", price: "Gratis", desc: "Pasang posisi · lihat talenta" },
      { tier: "Wawancara", price: "5%", desc: "Verifikasi setelah wawancara" },
      { tier: "Rekrutmen", price: "10%", desc: "Saat konversi rekrutmen kontrak" },
      { tier: "Karyawan Tetap", price: "15%", desc: "Saat konversi karyawan tetap" }
    ],
    rematchNote: "Re-match Guarantee — Jika terjadi pengunduran diri dalam 3 minggu pertama, kami mencocokkan ulang tanpa biaya tambahan.",
    faqTitle: "Pertanyaan yang Sering Diajukan",
    faqs: [
      { q: "Apakah ada biaya?", a: "Memasang posisi dan melihat talenta gratis. Biaya bertahap (5~15%) hanya berlaku saat konversi rekrutmen." },
      { q: "Bagaimana talenta diverifikasi?", a: "Melalui 4 tahap dokumen · pra-wawancara AI · pelatihan awal · scoring 5 minggu, hanya talenta teratas yang direkomendasikan." },
      { q: "Sejauh mana dukungan visa · administrasi?", a: "Aply menangani seluruh proses administrasi rekrutmen seperti perubahan status tinggal · 4 jenis asuransi · kontrak kerja." },
      { q: "Cocok untuk bidang apa saja?", a: "Kami memiliki talenta global terverifikasi di berbagai bidang seperti pengembangan · marketing · sales · desain." },
      { q: "Apakah ada jaminan adaptasi?", a: "Kami menyediakan Re-match Guarantee: jika resign dalam 3 minggu pertama, kami mencocokkan ulang tanpa biaya tambahan." }
    ],
    finalTitle: "Temui talenta global terverifikasi, sekarang juga",
    finalSub: "Melalui konsultasi gratis, kami merancang model rekrutmen yang sesuai untuk perusahaan Anda. Memasang posisi gratis, biaya hanya berlaku saat konversi rekrutmen.",
    finalCta: "Daftar Perusahaan · Pasang Posisi Gratis"
  }
};
      
// ── 로케일 불변 상수(고유명사·코드·아이콘) ──
const EYEBROWS = {
  problem: "Pain Points",
  verify: "Proven Results",
  talent: "Talent Pool",
  before: "Before",
  after: "After",
  pricing: "Process & Pricing"
};
const TRUST_TITLE = "Trusted and selected by";
const TRUST_GROUPS: { label: string; items: string[]; more: "univ" | "inst" | "corp" }[] = [
  {
    label: "UNIVERSITIES",
    items: ["Utah Asia Campus", "BHKUS University", "SUNY Korea", "Dongguk Univ", "Hanyang Univ", "Korea Univ", "Woosong Univ", "Chung-Ang (CAU)"],
    more: "univ"
  },
  {
    label: "INSTITUTIONS",
    items: ["Seoul Global Center", "Seoul Campus Town", "KEAD", "National·Private School Assoc."],
    more: "inst"
  },
  {
    label: "CORPORATES",
    items: ["wanted", "codeit", "Grab JOOB", "fastcampus", "OPENKNOWL", "incruit", "hanpass", "myrealtrip", "kowork", "YBM"],
    more: "corp"
  }
];
const PAIN_ICONS = [ShieldCheck, Scales, Translate, UsersThree];
const STAT_VALUES = ["150+", "350+", "4.8", "95%", "48h"];
const VERIFY_ICONS = [FileText, ShieldCheck, GraduationCap, ChartLineUp];
const TALENT_META = [
  { flag: "🇻🇳", school: "Korea Univ · Computer Science", tags: "Python · React · AWS" },
  { flag: "🇨🇳", school: "Hanyang Univ · Business · TOPIK 5", tags: "Performance · Content Marketing" },
  { flag: "🇺🇸", school: "SUNY Korea · Business", tags: "B2B Sales · Salesforce" },
  { flag: "🇫🇷", school: "Chung-Ang Univ · Visual Design", tags: "Figma · UI · UX" }
];
const AFTER_ICONS = [ShieldCheck, Lightning, Trophy, CheckCircle];
const PROCESS_CODES = ["Day 0", "Day 1–3", "Day 7", "Week 2", "Wk 4–16", "Ongoing"];
const PRICING_EN = ["Experiential", "Verification", "Contract", "Full Time"];

const HEADING_CLS = `${paperlogy.className} text-3xl font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-4xl`;
const EYEBROW_CLS = "mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500";

function SectionHead({
  eyebrow,
  title,
  sub,
  subClassName = "max-w-xl"
}: {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  subClassName?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow ? <p className={EYEBROW_CLS}>{eyebrow}</p> : null}
      <h2 className={HEADING_CLS}>{title}</h2>
      {sub ? <p className={`mx-auto mt-4 ${subClassName} text-[15px] leading-relaxed text-muted-foreground md:text-base`}>{sub}</p> : null}
    </Reveal>
  );
}

export function BusinessPage() {
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuthSession();
  const t = COPY[locale] ?? COPY.ko;
  const trustMore = { univ: t.trustMoreUniv, inst: t.trustMoreInst, corp: t.trustMoreCorp };
  // 인재풀 소개 문장은 길어서 em dash 기준 2줄로 분리(잘림 방지). "—"/"——" 모두 처리.
  const [talentLead, talentStats] = t.talentSub.split(/\s*—+\s*/);
  // 포지션 등록 CTA — 로그인 상태면 등록 페이지로 바로, 비로그인이면 가입으로.
  // /positions/create 는 자체적으로 비로그인/비파트너 게이트를 처리한다.
  const postPositionHref = isAuthenticated ? "/positions/create" : SIGNUP_PATH;

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
      <Header variant="business" />
      <main>
        {/* ── 히어로 ── */}
        <section className="bg-[#F3F7FF] py-16 md:py-24">
          <div className="container grid max-w-[1200px] items-center gap-12 md:grid-cols-2">
            <Reveal y="sm">
              <p className={EYEBROW_CLS}>{t.heroEyebrow}</p>
              <h1 className={`${paperlogy.className} text-4xl font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
                {t.heroTitleA}
                <br />
                <span className="text-[#0B46E8]">{t.heroTitleHighlight}</span>
                {t.heroTitleB ? ` ${t.heroTitleB}` : null}
              </h1>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted-foreground md:text-base">{t.heroSub}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {t.heroChips.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-semibold text-foreground/80">
                    <CheckCircle className="h-4 w-4 text-[#0B46E8]" weight="fill" />
                    {c}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button variant="hero" size="xl" asChild>
                  <Link href={postPositionHref}>
                    {t.ctaPrimary}
                    <ArrowRight weight="bold" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="#talent">{t.ctaSecondary}</Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delayMs={120} y="sm">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-border bg-card shadow-elevated">
                <Image src="/img_for_business.webp" alt="Aply for Business" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── 신뢰(도입 사례) ── */}
        <section id="trust" className="scroll-mt-16 bg-white py-16 md:py-20">
          <div className="container max-w-[1200px]">
            <SectionHead title={TRUST_TITLE} sub={t.trustSub} />
            <div className="mx-auto mt-12 max-w-4xl space-y-8">
              {TRUST_GROUPS.map((g, gi) => (
                <Reveal key={g.label} delayMs={gi * 80} y="sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{g.label}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {g.items.map((it) => (
                      <span key={it} className="rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-[13px] font-medium text-muted-foreground">
                        {it}
                      </span>
                    ))}
                    <span className="rounded-xl border border-border bg-muted/40 px-3.5 py-2 text-[13px] font-medium text-muted-foreground/70">
                      {trustMore[g.more]}
                    </span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 문제 제기(서비스) ── */}
        <section id="problem" className="scroll-mt-16 bg-[#F3F7FF] py-16 md:py-20">
          <div className="container max-w-[1200px]">
            <SectionHead eyebrow={EYEBROWS.problem} title={t.problemTitle} sub={t.problemSub} />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {t.painPoints.map((p, i) => {
                const Icon = PAIN_ICONS[i];
                return (
                  <Reveal key={p.title} delayMs={i * 80} y="sm" className="h-full">
                    <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-card">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-foreground/70">
                        <Icon className="h-6 w-6" weight="bold" />
                      </div>
                      <p className="mt-4 text-base font-bold text-[#0B1227]">{p.title}</p>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">{p.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <Reveal className="mt-10 text-center">
              <a href="#verify" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B46E8] hover:underline">
                {t.problemLink}
                <ArrowRight className="h-4 w-4" weight="bold" />
              </a>
            </Reveal>
          </div>
        </section>

        {/* ── 검증 ── */}
        <section id="verify" className="scroll-mt-16 bg-white py-16 md:py-20">
          <div className="container max-w-[1200px]">
            <SectionHead eyebrow={EYEBROWS.verify} title={t.verifyTitle} />
            <Reveal delayMs={90} y="sm">
              <ul className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-5 sm:gap-4">
                {STAT_VALUES.map((v, i) => (
                  <li key={t.statLabels[i]} className="text-center">
                    <p className="font-display text-4xl font-black leading-none tracking-[-0.04em] text-[#0B46E8] md:text-5xl">{v}</p>
                    <p className="mt-2 text-[13px] font-semibold text-slate-600">{t.statLabels[i]}</p>
                  </li>
                ))}
              </ul>
            </Reveal>
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {t.verifySteps.map((v, i) => {
                const Icon = VERIFY_ICONS[i];
                return (
                  <Reveal key={v.title} delayMs={i * 80} y="sm" className="h-full">
                    <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-card">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Step {i + 1}</span>
                      <div className="mt-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-[#0B46E8]">
                        <Icon className="h-6 w-6" weight="bold" />
                      </div>
                      <p className="mt-3 text-base font-bold text-[#0B1227]">{v.title}</p>
                      <p className="mt-1.5 inline-flex rounded-md bg-muted px-2 py-0.5 text-[12px] font-semibold text-muted-foreground">{v.rate}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <Reveal className="mt-8 text-center">
              <p className="text-sm font-medium text-muted-foreground">{t.verifyFoot}</p>
            </Reveal>
          </div>
        </section>

        {/* ── 인재풀 ── */}
        <section id="talent" className="scroll-mt-16 bg-[#F3F7FF] py-16 md:py-20">
          <div className="container max-w-[1200px]">
            <SectionHead
              eyebrow={EYEBROWS.talent}
              title={
                <>
                  {t.talentTitleA}
                  <br />
                  {t.talentTitleB}
                </>
              }
              sub={
                talentStats ? (
                  <>
                    {talentLead}
                    <br />
                    {talentStats}
                  </>
                ) : (
                  t.talentSub
                )
              }
              subClassName="max-w-2xl"
            />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {t.talents.map((talent, i) => {
                const meta = TALENT_META[i];
                return (
                  <Reveal key={talent.country + talent.role} delayMs={i * 80} y="sm" className="h-full">
                    <div className="h-full rounded-3xl border border-border bg-card p-6 shadow-card">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl leading-none" aria-hidden>
                          {meta.flag}
                        </span>
                        <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-bold text-[#0B46E8]">{talent.role}</span>
                      </div>
                      <p className="mt-4 text-base font-bold text-[#0B1227]">
                        {talent.country} · {talent.role}
                      </p>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{meta.school}</p>
                      <p className="mt-2 text-[12.5px] font-medium text-foreground/70">{meta.tags}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
            <Reveal className="mt-10 text-center">
              <Link href={postPositionHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B46E8] hover:underline">
                {t.talentLink}
                <ArrowRight className="h-4 w-4" weight="bold" />
              </Link>
            </Reveal>
          </div>
        </section>

        {/* ── BEFORE / AFTER ── */}
        <section className="bg-white py-16 md:py-20">
          <div className="container grid max-w-[1200px] gap-12 lg:grid-cols-2">
            <div>
              <Reveal y="sm">
                <p className={EYEBROW_CLS}>{EYEBROWS.before}</p>
                <h2 className={HEADING_CLS}>
                  {t.beforeTitleA}
                  <br />
                  {t.beforeTitleB}
                </h2>
              </Reveal>
              <ul className="mt-8 space-y-3">
                {t.beforeItems.map((b, i) => (
                  <Reveal key={b.title} delayMs={i * 70} y="sm">
                    <li className="flex gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-card">
                      <CheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-[#0B46E8]" weight="fill" />
                      <div>
                        <p className="text-[15px] font-bold text-[#0B1227]">{b.title}</p>
                        <p className="mt-0.5 text-[13.5px] leading-relaxed text-muted-foreground">{b.desc}</p>
                      </div>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </div>
            <div>
              <Reveal y="sm">
                <p className={`${EYEBROW_CLS} text-[#0B46E8]`}>{EYEBROWS.after}</p>
                <h2 className={HEADING_CLS}>
                  {t.afterTitleA}
                  <br />
                  {t.afterTitleB}
                </h2>
              </Reveal>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {t.afterItems.map((a, i) => {
                  const Icon = AFTER_ICONS[i];
                  return (
                    <Reveal key={a.title} delayMs={i * 70} y="sm" className="h-full">
                      <div className="h-full rounded-2xl border border-border bg-card p-5 shadow-card">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-[#0B46E8]">
                          <Icon className="h-6 w-6" weight="bold" />
                        </div>
                        <p className="mt-3 text-[15px] font-bold text-[#0B1227]">{a.title}</p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{a.desc}</p>
                        <span className="mt-3 inline-flex rounded-md bg-accent/10 px-2.5 py-1 text-[12px] font-bold text-[#0B46E8]">{a.badge}</span>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── 프로세스 · 요금 ── */}
        <section id="pricing" className="scroll-mt-16 bg-[#F3F7FF] py-16 md:py-20">
          <div className="container max-w-[1200px]">
            <SectionHead eyebrow={EYEBROWS.pricing} title={t.pricingTitle} sub={t.pricingSub} />
            <Reveal delayMs={90} y="sm">
              <ol className="mt-12 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {t.processSteps.map((p, i) => (
                  <li key={PROCESS_CODES[i]} className="rounded-2xl border border-border bg-card p-4 text-center shadow-card">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-accent-foreground">{i + 1}</span>
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{PROCESS_CODES[i]}</p>
                    <p className="mt-0.5 text-[13.5px] font-bold text-[#0B1227]">{p.title}</p>
                    {p.note ? <p className="text-[11.5px] text-slate-400">{p.note}</p> : null}
                  </li>
                ))}
              </ol>
            </Reveal>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {t.pricingTiers.map((tier, i) => (
                <Reveal key={PRICING_EN[i]} delayMs={i * 80} y="sm" className="h-full">
                  <div className="h-full rounded-3xl border border-border bg-card p-6 text-center shadow-card">
                    <p className="text-[13px] font-bold text-[#0B1227]">{tier.tier}</p>
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{PRICING_EN[i]}</p>
                    <p className="font-display mt-4 text-4xl font-black tracking-[-0.04em] text-[#0B46E8]">{tier.price}</p>
                    <p className="mt-2 text-[12.5px] text-muted-foreground">{tier.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-6">
              <p className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 text-center text-[13.5px] font-semibold text-foreground/80 shadow-card">
                <Trophy className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" />
                {t.rematchNote}
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="scroll-mt-16 bg-white py-16 md:py-20">
          <div className="container max-w-3xl">
            <SectionHead title={t.faqTitle} />
            <div className="mt-10 space-y-3">
              {t.faqs.map((f, i) => (
                <Reveal key={f.q} delayMs={i * 60} y="sm">
                  <details className="group rounded-2xl border border-border bg-card p-5 shadow-card [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <span className="text-[15px] font-bold text-[#0B1227]">{f.q}</span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-90" weight="bold" />
                    </summary>
                    <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">{f.a}</p>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── 최종 CTA(다크) ── */}
        <section id="cta" className="bg-[#F3F7FF] py-20">
          <div className="container max-w-[1200px]">
            <Reveal className="relative overflow-hidden rounded-3xl bg-gradient-dark p-10 text-center text-background md:p-16" y="sm">
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
              <div className="relative">
                <h2 className={`${paperlogy.className} text-3xl font-black tracking-[-0.03em] md:text-5xl`}>{t.finalTitle}</h2>
                <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-relaxed text-background/70 md:text-base">{t.finalSub}</p>
                <Button variant="hero" size="xl" className="mt-8" asChild>
                  <Link href={postPositionHref}>
                    <Briefcase weight="bold" />
                    {t.finalCta}
                    <ArrowRight weight="bold" />
                  </Link>
                </Button>
                <p className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[13px] text-background/50">
                  <span>{CONTACT_EMAIL}</span>
                  <span aria-hidden>·</span>
                  <span>{SITE_URL}</span>
                </p>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
