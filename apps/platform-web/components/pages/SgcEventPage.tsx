"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowSquareOut, CalendarBlank, ClipboardText, Coffee, GraduationCap, Users } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  computeSgcRecruitState,
  type SgcRecruitState
} from "../../lib/sgc-event-config";

// ---------------------------------------------------------------------------
// /events/seoul-global-center — Seoul Global Center × Aply 협력 6주 일경험 프로그램
// 디테일 페이지. 다른 이벤트(saju/visa) 와 달리 viral 진단이 아닌 정식 협력
// 프로그램이라 사이트 표준 GNB(Header/Footer) + 큰 hero 로고 + 정보 정리형
// 레이아웃. 신청은 Aply 인하우스 페이지 — /events/seoul-global-center/apply.
// ---------------------------------------------------------------------------

// SGC 6주 일경험 신청은 Aply 인하우스 페이지로 — 회원 + 이력서 기반 지원.
// 구글폼은 사용하지 않음. 비로그인은 apply 페이지가 자체적으로 /login 으로
// 부드럽게 안내, 이력서 없으면 /resume/new/edit 로 안내.
const APPLY_PATH = "/events/seoul-global-center/apply";
// 서울글로벌센터 공식 사이트 — "주최 기관" 카드의 방문 버튼에서 사용.
const SGC_SITE_URL = "https://seoulglobalcenter.startup-plus.kr/";

// 모집 기간 / 마감 판정은 lib/sgc-event-config.ts 의 공용 함수 사용.
// (apply 페이지와 동일한 판정 로직을 쓰기 위해 한 곳에서 관리.)

type Highlight = { iconKey: "edu" | "coach" | "site" | "support"; title: string; desc: string };
type SchedulePhase = { iconKey: "calendar" | "clipboard"; phase: string; period: string; note?: string };
type EmojiLine = { emoji: string; text: string };
type StatItem = { value: string; label: string };

type Copy = {
  pill: string;
  title: string;
  subtitle: string;
  // 모집 D-day badge + Hero CTA
  dDayPrefix: string;        // "모집 마감까지" / "Closes in"
  dDayUnit: string;          // "일" / "days"
  recruitOpening: string;    // "모집 곧 시작 — D-{n}" 같은 임시 라벨 (시작 전)
  recruitClosed: string;     // "모집 마감" / "Applications closed"
  heroCta: string;           // "지원하기" / "Apply now"
  // 한눈에 보는 stats
  stats: StatItem[];
  // 소개 본문 — 2문단 (개요 + 무엇을 얻나)
  aboutHeading: string;
  aboutBody1: string;
  aboutBody2: string;
  // pitch — 이런 분께 추천해요 (3개 emoji 라인)
  pitchHeading: string;
  pitches: EmojiLine[];
  // 강조 포인트
  highlightsHeading: string;
  highlights: Highlight[];
  // 완주자 혜택 (2개 emoji 라인)
  perksHeading: string;
  perks: EmojiLine[];
  // 식비/교통비 지원에 대한 주의 사항 — 임금 아님
  supportNote: string;
  // 모집 카드
  recruitHeading: string;
  recruitPeriodLabel: string;
  recruitPeriodValue: string;
  recruitNote: string;
  applyCta: string;
  // 모집 카드 안에 같이 들어가는 보조 정보
  recruitHeadcountLabel: string;
  recruitHeadcountValue: string;
  eligibilityLabel: string;
  eligibilityItems: string[];
  // 진행 일정 타임라인
  scheduleHeading: string;
  schedule: SchedulePhase[];
  // 참여 시 반드시 알아둬야 할 주의사항 (이미지의 빨간 동그라미 라인들)
  noticeHeading: string;
  noticeItems: string[];
  // 문의처 — 별도 카드. 전화 + 이메일
  inquiryHeading: string;
  inquiryPhoneLabel: string;
  inquiryPhone: string;
  inquiryEmailLabel: string;
  inquiryEmail: string;
  // 면책/주최
  hostNote: string;
  // 주최 기관 안내 카드 — 서울글로벌센터 공식 사이트 링크 포함
  hostOrgHeading: string;
  hostOrgName: string;
  hostOrgDescription: string;
  hostOrgVisit: string;
};

// 모집 기간 / 일정 — 코드 안 한 곳에서만 관리. 영어/중국어 등 라벨만 로케일
// 별로 번역하면 됨. 날짜 자체는 모든 언어 공통 ("6/15" 같은 형식).
const SCHEDULE = {
  recruitPeriod: "~ 6/23 (화) 18:00",
  recruitPeriodEn: "~ Jun 23 (Tue) 18:00",
  interview: "6/24 (수) ~ 6/26 (금)",
  interviewEn: "Jun 24 (Wed) ~ Jun 26 (Fri)",
  preTraining: "6/30 (화) & 7/2 (목)",
  preTrainingEn: "Jun 30 (Tue) & Jul 2 (Thu)",
  matching: "7/4 (토) ~ 7/19 (일)",
  matchingEn: "Jul 4 (Sat) ~ Jul 19 (Sun)",
  internship: "7/20 (월) ~ 8/28 (금)",
  internshipEn: "Jul 20 (Mon) ~ Aug 28 (Fri)",
  closing: "9월 초",
  closingEn: "Early September"
};

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    pill: "Seoul Global Center × Aply",
    title: "한국 기업 6주 일경험 프로그램",
    subtitle: "한국에서 취업을 희망하는 외국인 유학생을 위한 기업 연계 6주 실전 일경험 프로그램입니다.",
    dDayPrefix: "모집 마감까지",
    dDayUnit: "일",
    recruitOpening: "모집 곧 시작",
    recruitClosed: "모집 마감",
    heroCta: "지금 지원하기",
    stats: [
      { value: "6주",  label: "기업 현장 인턴십" },
      { value: "2회", label: "사전 교육 세션" },
      { value: "1:1", label: "완주자 커리어 코칭" },
      { value: "지원", label: "식비 · 교통비" }
    ],
    aboutHeading: "프로그램 소개",
    aboutBody1: "본 프로그램은 한국에서 취업을 희망하는 외국인 유학생들에게 실질적인 직무 경험을 제공하는 기업 연계 6주 일경험 프로그램입니다.",
    aboutBody2: "한국 기업 적응 교육부터 직무별 그룹 코칭, 실제 기업 연계 현장 일경험까지 한국의 기업 문화를 직접 경험하며 직무 역량을 강화할 수 있습니다.",
    pitchHeading: "이런 분께 추천해요",
    pitches: [
      { emoji: "😶‍🌫️", text: "취업 준비가 막막한 외국인 취준생들을 위해." },
      { emoji: "🤔",     text: "한국 회사에서 일하고 싶지만 어디서부터 시작해야 할지 모르겠다면?" },
      { emoji: "💡",     text: "이력서부터 면접, 실무 일경험까지 실전 중심 커리큘럼으로 도와드릴게요!" },
      { emoji: "🗣",     text: "한국 기업에서 직접 6주간 일해보며 직무 경험과 실무 커뮤니케이션 역량을 쌓아보세요!" }
    ],
    highlightsHeading: "참여하면 얻는 것",
    highlights: [
      { iconKey: "edu",     title: "기업 적응 교육",        desc: "한국 기업 문화 · 매너 · 협업 방식 사전 교육." },
      { iconKey: "coach",   title: "직무별 그룹 코칭",      desc: "비슷한 직무를 희망하는 동료들과 함께 그룹 코칭." },
      { iconKey: "site",    title: "기업 현장 일경험",      desc: "실제 한국 기업에서 6주간 출퇴근하며 직무 수행." },
      { iconKey: "support", title: "식비 · 교통비 지원",    desc: "출퇴근 활동에 대한 식비와 교통비를 지원합니다." }
    ],
    perksHeading: "완주자에게 드리는 것",
    perks: [
      { emoji: "👥", text: "1:1 커리어 코칭 + 외국인 취업·채용 박람회 사전 등록 매칭 기회." },
      { emoji: "💼", text: "우수 참여자에게는 추천서 + 추가 채용 연계 기회까지 제공합니다." }
    ],
    supportNote: "＊ 본 프로그램은 '일경험' 프로그램으로, 별도 임금 없이 교통비 및 식사비만 지원됩니다.",
    recruitHeading: "모집 안내",
    recruitPeriodLabel: "모집 기간",
    recruitPeriodValue: SCHEDULE.recruitPeriod,
    recruitNote: "Aply 회원으로 로그인하고 본인 이력서와 함께 지원해 주세요. 운영팀이 상시 확인 후 개별 안내드립니다.",
    applyCta: "지금 지원하기",
    recruitHeadcountLabel: "모집 인원",
    recruitHeadcountValue: "총 6명",
    eligibilityLabel: "신청 자격",
    eligibilityItems: [
      "한국에서 취업을 희망하는 외국인 유학생 (졸업 예정자 우선 선발)",
      "TOPIK 4급 이상",
      "D-2(유학) · D-10(구직) 비자 소지 또는 소지 예정자"
    ],
    noticeHeading: "참여 전 꼭 확인하세요",
    noticeItems: [
      "온라인 인터뷰 및 최종 선발자에게는 개별 연락드립니다.",
      "모든 일정에 반드시 참여 가능한 분만 신청해 주세요.",
      "추후 일정은 변동될 수 있습니다."
    ],
    inquiryHeading: "문의",
    inquiryPhoneLabel: "전화",
    inquiryPhone: "02-362-6754",
    inquiryEmailLabel: "이메일",
    inquiryEmail: "sgc.istudent@gmail.com",
    scheduleHeading: "진행 일정",
    schedule: [
      { iconKey: "calendar",  phase: "온라인 인터뷰",   period: SCHEDULE.interview,   note: "대상자에게 개별 연락" },
      { iconKey: "clipboard", phase: "사전 교육",       period: SCHEDULE.preTraining, note: "2일 모두 참여 필수" },
      { iconKey: "calendar",  phase: "기업 매칭",       period: SCHEDULE.matching,    note: "기업별 사전 과제 여부 상이" },
      { iconKey: "calendar",  phase: "기업 연계 일경험", period: SCHEDULE.internship,  note: "기업 현장 출퇴근 / 식비 · 교통비 지원" },
      { iconKey: "clipboard", phase: "성과 공유회",     period: SCHEDULE.closing,     note: "참여자 개별 연락" }
    ],
    hostNote: "주최: 서울글로벌센터 · 운영: 플리퍼스(Aply)",
    hostOrgHeading: "주최 기관",
    hostOrgName: "서울글로벌센터",
    hostOrgDescription:
      "서울특별시가 운영하는 외국인 종합지원 기관으로, 외국인 주민의 한국 정착·창업·취업을 돕는 다양한 프로그램을 진행하고 있습니다.",
    hostOrgVisit: "서울글로벌센터 공식 사이트 방문"
  },
  en: {
    pill: "Seoul Global Center × Aply",
    title: "6-Week Korea Work Experience Program",
    subtitle: "A 6-week hands-on internship program for international students looking to start their career in Korea.",
    dDayPrefix: "Closes in",
    dDayUnit: "days",
    recruitOpening: "Opens soon",
    recruitClosed: "Applications closed",
    heroCta: "Apply now",
    stats: [
      { value: "6 wk",     label: "On-site internship" },
      { value: "2 ×",     label: "Pre-training sessions" },
      { value: "1:1",      label: "Career coaching for completers" },
      { value: "Covered", label: "Meals & transport" }
    ],
    aboutHeading: "About the program",
    aboutBody1: "This is a 6-week company-linked work-experience program that gives international students in Korea real hands-on job experience.",
    aboutBody2: "From Korean workplace onboarding, role-based group coaching, to on-site work at a partner company — you'll experience Korean business culture firsthand and sharpen your professional skills.",
    pitchHeading: "Who is this for?",
    pitches: [
      { emoji: "😶‍🌫️", text: "International job-seekers who feel lost about how to start." },
      { emoji: "🤔",     text: "Want to work at a Korean company but don't know where to begin?" },
      { emoji: "💡",     text: "From résumé and interviews to real on-site work experience — we'll guide you with a hands-on curriculum." },
      { emoji: "🗣",     text: "Work directly at a Korean company for 6 weeks to build real job experience and workplace communication skills." }
    ],
    highlightsHeading: "What you'll get",
    highlights: [
      { iconKey: "edu",     title: "Korean workplace training", desc: "Pre-training on Korean company culture, manners, and how teams collaborate." },
      { iconKey: "coach",   title: "Group coaching by role",    desc: "Coaching sessions with peers aiming for similar roles." },
      { iconKey: "site",    title: "On-site work experience",   desc: "Commute to a real Korean company for 6 weeks of hands-on work." },
      { iconKey: "support", title: "Meals & commute covered",   desc: "Meal and transportation support throughout the program." }
    ],
    perksHeading: "Benefits for completers",
    perks: [
      { emoji: "👥", text: "1:1 career coaching + priority registration matching at foreign-talent job fairs." },
      { emoji: "💼", text: "Top performers receive a recommendation letter + additional hiring referrals." }
    ],
    supportNote: "＊ This is a work-experience (not salaried) program — only meals and transportation are supported.",
    recruitHeading: "Applications",
    recruitPeriodLabel: "Application period",
    recruitPeriodValue: SCHEDULE.recruitPeriodEn,
    recruitNote: "Sign in to Aply and apply with your own resume. Our team reviews applications on a rolling basis and follows up individually.",
    applyCta: "Apply now",
    recruitHeadcountLabel: "Spots",
    recruitHeadcountValue: "6 in total",
    eligibilityLabel: "Eligibility",
    eligibilityItems: [
      "International students seeking employment in Korea (graduating students prioritized)",
      "TOPIK level 4 or above",
      "D-2 (study) / D-10 (job-seeking) visa holder or about to hold one"
    ],
    noticeHeading: "Before applying",
    noticeItems: [
      "Interview invitations and final results are sent individually.",
      "Apply only if you can commit to every scheduled session.",
      "Dates are subject to change."
    ],
    inquiryHeading: "Contact",
    inquiryPhoneLabel: "Phone",
    inquiryPhone: "02-362-6754",
    inquiryEmailLabel: "Email",
    inquiryEmail: "sgc.istudent@gmail.com",
    scheduleHeading: "Timeline",
    schedule: [
      { iconKey: "calendar",  phase: "Online interview",    period: SCHEDULE.interviewEn,   note: "Shortlisted candidates contacted individually." },
      { iconKey: "clipboard", phase: "Pre-training",        period: SCHEDULE.preTrainingEn, note: "Both days are mandatory." },
      { iconKey: "calendar",  phase: "Company matching",    period: SCHEDULE.matchingEn,    note: "Some companies may assign a pre-task." },
      { iconKey: "calendar",  phase: "On-site work experience", period: SCHEDULE.internshipEn, note: "On-site / meals & transportation covered" },
      { iconKey: "clipboard", phase: "Wrap-up showcase",    period: SCHEDULE.closingEn,     note: "Participants contacted individually." }
    ],
    hostNote: "Host: Seoul Global Center · Operated by: Flippers (Aply)",
    hostOrgHeading: "Hosting organization",
    hostOrgName: "Seoul Global Center",
    hostOrgDescription:
      "Run by the Seoul Metropolitan Government, the Seoul Global Center offers a wide range of programs that help international residents settle, start businesses, and build careers in Korea.",
    hostOrgVisit: "Visit Seoul Global Center's website"
  },
  "zh-CN": {
    pill: "Seoul Global Center × Aply",
    title: "韩国企业 6 周实习项目",
    subtitle: "面向希望在韩就业的外国留学生，提供 6 周企业实战工作经验的合作项目。",
    dDayPrefix: "距离截止",
    dDayUnit: "天",
    recruitOpening: "招募即将开始",
    recruitClosed: "招募已结束",
    heroCta: "立即申请",
    stats: [
      { value: "6 周",  label: "企业现场实习" },
      { value: "2 次",  label: "事前培训" },
      { value: "1 对 1", label: "完成者职业辅导" },
      { value: "全包",  label: "餐费与交通费" }
    ],
    aboutHeading: "项目介绍",
    aboutBody1: "本项目为希望在韩国就业的外国留学生提供实质性的工作经验，是与企业合作的 6 周实习项目。",
    aboutBody2: "从韩国企业适应培训、按职务的分组教练辅导，到实际的企业现场工作经验，亲身体验韩国企业文化并强化职务能力。",
    pitchHeading: "推荐给这样的你",
    pitches: [
      { emoji: "😶‍🌫️", text: "正在为求职准备而迷茫的外国求职者。" },
      { emoji: "🤔",     text: "想进入韩国公司工作，但不知道从哪开始？" },
      { emoji: "💡",     text: "从简历、面试到实战工作经验，实战课程帮你解决。" },
      { emoji: "🗣",     text: "在韩国企业直接工作 6 周，积累职务经验与实务沟通能力。" }
    ],
    highlightsHeading: "你将获得",
    highlights: [
      { iconKey: "edu",     title: "企业适应培训", desc: "事前学习韩国企业文化、礼仪与协作方式。" },
      { iconKey: "coach",   title: "分组教练辅导", desc: "与希望从事相似职务的同伴一起接受小组辅导。" },
      { iconKey: "site",    title: "企业现场实习", desc: "6 周内通勤至实际韩国企业进行实战工作。" },
      { iconKey: "support", title: "餐费 · 交通费支持", desc: "为通勤活动提供餐费与交通费支持。" }
    ],
    perksHeading: "完成者将获得",
    perks: [
      { emoji: "👥", text: "1 对 1 职业辅导 + 外国人就业招聘博览会优先登记机会。" },
      { emoji: "💼", text: "优秀参与者获推荐信 + 额外招聘连接机会。" }
    ],
    supportNote: "＊ 本项目为「就业体验」项目，无另行工资，仅提供餐费与交通费。",
    recruitHeading: "招募信息",
    recruitPeriodLabel: "招募期间",
    recruitPeriodValue: SCHEDULE.recruitPeriod,
    recruitNote: "请登录 Aply 后用您的简历进行申请。运营团队将持续审核并单独联系您。",
    applyCta: "立即申请",
    recruitHeadcountLabel: "招募人数",
    recruitHeadcountValue: "共 6 名",
    eligibilityLabel: "申请资格",
    eligibilityItems: [
      "希望在韩国就业的外国留学生（应届毕业生优先选拔）",
      "TOPIK 4 级以上",
      "D-2（留学）· D-10（求职）签证持有者或预定持有者"
    ],
    noticeHeading: "申请前请确认",
    noticeItems: [
      "面试邀请及最终录取通知将单独发送。",
      "请确认能全程参与所有日程后再申请。",
      "日程之后可能会有变动。"
    ],
    inquiryHeading: "联系方式",
    inquiryPhoneLabel: "电话",
    inquiryPhone: "02-362-6754",
    inquiryEmailLabel: "邮箱",
    inquiryEmail: "sgc.istudent@gmail.com",
    scheduleHeading: "整体日程",
    schedule: [
      { iconKey: "calendar",  phase: "在线面试",     period: SCHEDULE.interview,   note: "对入选者将单独联系" },
      { iconKey: "clipboard", phase: "事前培训",     period: SCHEDULE.preTraining, note: "两天均须参加" },
      { iconKey: "calendar",  phase: "企业匹配",     period: SCHEDULE.matching,    note: "各企业是否布置前置作业不同" },
      { iconKey: "calendar",  phase: "企业现场就业体验", period: SCHEDULE.internship, note: "企业现场通勤 / 餐费 · 交通费支持" },
      { iconKey: "clipboard", phase: "成果分享会",   period: SCHEDULE.closing,     note: "参与者单独联系" }
    ],
    hostNote: "主办：首尔全球中心 · 运营：Flippers (Aply)",
    hostOrgHeading: "主办机构",
    hostOrgName: "首尔全球中心",
    hostOrgDescription:
      "由首尔特别市运营的外国人综合支援机构，为在韩外国居民提供定居、创业与就业的多元化项目。",
    hostOrgVisit: "访问首尔全球中心官方网站"
  },
  vi: {
    pill: "Seoul Global Center × Aply",
    title: "Chương trình thực tập 6 tuần tại doanh nghiệp Hàn",
    subtitle: "Chương trình hợp tác 6 tuần dành cho du học sinh quốc tế mong muốn tìm việc tại Hàn Quốc.",
    dDayPrefix: "Còn lại",
    dDayUnit: "ngày",
    recruitOpening: "Sắp mở đơn",
    recruitClosed: "Đã đóng đơn",
    heroCta: "Đăng ký ngay",
    stats: [
      { value: "6 tuần", label: "Thực tập tại công ty" },
      { value: "2 buổi", label: "Đào tạo trước" },
      { value: "1:1",    label: "Coaching nghề cho người hoàn thành" },
      { value: "Hỗ trợ", label: "Ăn uống & đi lại" }
    ],
    aboutHeading: "Giới thiệu chương trình",
    aboutBody1: "Đây là chương trình hợp tác 6 tuần với doanh nghiệp, mang đến trải nghiệm làm việc thực tế cho du học sinh mong muốn tìm việc tại Hàn Quốc.",
    aboutBody2: "Từ đào tạo thích nghi doanh nghiệp Hàn, huấn luyện nhóm theo từng vị trí, đến trải nghiệm làm việc tại doanh nghiệp đối tác — bạn sẽ trải nghiệm văn hóa doanh nghiệp Hàn và nâng cao năng lực chuyên môn.",
    pitchHeading: "Phù hợp với bạn nếu",
    pitches: [
      { emoji: "😶‍🌫️", text: "Bạn là du học sinh đang loay hoay chuẩn bị xin việc." },
      { emoji: "🤔",     text: "Muốn làm việc tại công ty Hàn nhưng không biết bắt đầu từ đâu?" },
      { emoji: "💡",     text: "Từ CV, phỏng vấn đến trải nghiệm làm việc thực tế — chúng tôi đồng hành cùng bạn bằng chương trình thực chiến." },
      { emoji: "🗣",     text: "Làm việc trực tiếp 6 tuần tại doanh nghiệp Hàn để tích lũy kinh nghiệm nghề nghiệp và kỹ năng giao tiếp công sở." }
    ],
    highlightsHeading: "Bạn sẽ nhận được",
    highlights: [
      { iconKey: "edu",     title: "Đào tạo thích nghi doanh nghiệp", desc: "Học trước về văn hóa, ứng xử, cách làm việc nhóm tại doanh nghiệp Hàn." },
      { iconKey: "coach",   title: "Huấn luyện nhóm theo vị trí",     desc: "Huấn luyện cùng các bạn cùng hướng nghề nghiệp." },
      { iconKey: "site",    title: "Trải nghiệm tại doanh nghiệp",    desc: "Đi làm thực tế tại doanh nghiệp Hàn trong 6 tuần." },
      { iconKey: "support", title: "Hỗ trợ ăn uống · đi lại",        desc: "Hỗ trợ chi phí ăn uống và đi lại trong suốt chương trình." }
    ],
    perksHeading: "Người hoàn thành nhận được",
    perks: [
      { emoji: "👥", text: "Coaching nghề nghiệp 1:1 + ưu tiên đăng ký hội chợ việc làm cho người nước ngoài." },
      { emoji: "💼", text: "Người xuất sắc nhận thư giới thiệu + cơ hội kết nối tuyển dụng thêm." }
    ],
    supportNote: "＊ Đây là chương trình \"trải nghiệm việc làm\", không có lương riêng — chỉ hỗ trợ ăn uống và đi lại.",
    recruitHeading: "Thông tin tuyển sinh",
    recruitPeriodLabel: "Thời gian nhận đơn",
    recruitPeriodValue: SCHEDULE.recruitPeriod,
    recruitNote: "Đăng nhập Aply và ứng tuyển bằng CV của bạn. Đội Aply sẽ kiểm tra liên tục và liên hệ riêng với bạn.",
    applyCta: "Đăng ký ngay",
    recruitHeadcountLabel: "Số lượng tuyển",
    recruitHeadcountValue: "Tổng 6 người",
    eligibilityLabel: "Yêu cầu ứng tuyển",
    eligibilityItems: [
      "Du học sinh quốc tế mong muốn làm việc tại Hàn Quốc (ưu tiên sinh viên sắp tốt nghiệp)",
      "TOPIK cấp 4 trở lên",
      "Đang giữ hoặc sẽ giữ visa D-2 (du học) / D-10 (tìm việc)"
    ],
    noticeHeading: "Trước khi đăng ký",
    noticeItems: [
      "Thông báo phỏng vấn và kết quả cuối cùng sẽ gửi riêng đến từng người.",
      "Vui lòng chỉ đăng ký nếu bạn có thể tham gia toàn bộ lịch trình.",
      "Lịch trình có thể thay đổi sau này."
    ],
    inquiryHeading: "Liên hệ",
    inquiryPhoneLabel: "Điện thoại",
    inquiryPhone: "02-362-6754",
    inquiryEmailLabel: "Email",
    inquiryEmail: "sgc.istudent@gmail.com",
    scheduleHeading: "Lịch trình",
    schedule: [
      { iconKey: "calendar",  phase: "Phỏng vấn trực tuyến", period: SCHEDULE.interview,   note: "Sẽ liên hệ riêng với ứng viên được chọn." },
      { iconKey: "clipboard", phase: "Đào tạo trước",      period: SCHEDULE.preTraining, note: "Bắt buộc tham gia cả 2 ngày." },
      { iconKey: "calendar",  phase: "Ghép nối doanh nghiệp", period: SCHEDULE.matching,  note: "Một số doanh nghiệp có bài tập trước." },
      { iconKey: "calendar",  phase: "Trải nghiệm việc làm", period: SCHEDULE.internship, note: "Đi lại đến công ty / hỗ trợ ăn uống và đi lại" },
      { iconKey: "clipboard", phase: "Buổi tổng kết",      period: SCHEDULE.closing,     note: "Liên hệ riêng với người tham gia." }
    ],
    hostNote: "Tổ chức: Seoul Global Center · Vận hành: Flippers (Aply)",
    hostOrgHeading: "Đơn vị tổ chức",
    hostOrgName: "Seoul Global Center",
    hostOrgDescription:
      "Trung tâm hỗ trợ tổng hợp cho người nước ngoài do thành phố Seoul vận hành, mang đến nhiều chương trình hỗ trợ định cư, khởi nghiệp và việc làm tại Hàn Quốc.",
    hostOrgVisit: "Truy cập website chính thức"
  },
  ja: {
    pill: "Seoul Global Center × Aply",
    title: "韓国企業 6 週間就業体験プログラム",
    subtitle: "韓国での就職を希望する外国人留学生のための、企業連携 6 週間実践就業体験プログラム。",
    dDayPrefix: "締切まで",
    dDayUnit: "日",
    recruitOpening: "まもなく募集開始",
    recruitClosed: "募集終了",
    heroCta: "今すぐ申請",
    stats: [
      { value: "6 週間", label: "企業現場インターンシップ" },
      { value: "2 回",   label: "事前研修" },
      { value: "1:1",    label: "完走者キャリアコーチング" },
      { value: "支援",   label: "食費・交通費" }
    ],
    aboutHeading: "プログラム紹介",
    aboutBody1: "本プログラムは韓国での就職を希望する外国人留学生に、実質的な職務経験を提供する企業連携 6 週間の就業体験プログラムです。",
    aboutBody2: "韓国企業適応研修から職務別グループコーチング、実際の企業連携現場での就業体験まで、韓国の企業文化を直接体験して職務能力を強化できます。",
    pitchHeading: "こんな方におすすめ",
    pitches: [
      { emoji: "😶‍🌫️", text: "就職準備に悩む外国人就活生のために。" },
      { emoji: "🤔",     text: "韓国企業で働きたいけれど、何から始めればよいか分からない方へ。" },
      { emoji: "💡",     text: "履歴書から面接、実務就業体験まで実戦中心のカリキュラムでサポート!" },
      { emoji: "🗣",     text: "韓国企業で直接 6 週間働き、職務経験と実務コミュニケーション力を高めましょう!" }
    ],
    highlightsHeading: "得られるもの",
    highlights: [
      { iconKey: "edu",     title: "企業適応研修",       desc: "韓国企業文化・マナー・協業の仕方を事前に学習。" },
      { iconKey: "coach",   title: "職務別グループコーチング", desc: "同じ職務を目指す仲間と共にコーチング。" },
      { iconKey: "site",    title: "企業現場での就業体験", desc: "実際の韓国企業に 6 週間通勤し職務を遂行。" },
      { iconKey: "support", title: "食費・交通費支援",    desc: "通勤活動に対する食費と交通費を支援します。" }
    ],
    perksHeading: "完走者への特典",
    perks: [
      { emoji: "👥", text: "1:1 キャリアコーチング + 外国人就職フェアの事前登録マッチング機会。" },
      { emoji: "💼", text: "優秀参加者には推薦書 + さらなる採用紹介機会を提供。" }
    ],
    supportNote: "＊ 本プログラムは「就業体験」のため別途賃金はなく、食費と交通費のみ支援します。",
    recruitHeading: "募集案内",
    recruitPeriodLabel: "募集期間",
    recruitPeriodValue: SCHEDULE.recruitPeriod,
    recruitNote: "Aply にログインし、ご自身の履歴書で申請してください。運営チームが随時確認の上、個別にご案内します。",
    applyCta: "今すぐ申請",
    recruitHeadcountLabel: "募集人数",
    recruitHeadcountValue: "合計 6 名",
    eligibilityLabel: "申請資格",
    eligibilityItems: [
      "韓国での就職を希望する外国人留学生（卒業予定者を優先選抜）",
      "TOPIK 4 級以上",
      "D-2（留学）· D-10（求職）ビザ保有者または取得予定者"
    ],
    noticeHeading: "申請前にご確認ください",
    noticeItems: [
      "面接案内および最終選抜は個別にご連絡します。",
      "すべての日程に必ず参加できる方のみご応募ください。",
      "今後、日程は変動する可能性があります。"
    ],
    inquiryHeading: "お問い合わせ",
    inquiryPhoneLabel: "電話",
    inquiryPhone: "02-362-6754",
    inquiryEmailLabel: "メール",
    inquiryEmail: "sgc.istudent@gmail.com",
    scheduleHeading: "進行日程",
    schedule: [
      { iconKey: "calendar",  phase: "オンライン面接",     period: SCHEDULE.interview,   note: "対象者に個別連絡" },
      { iconKey: "clipboard", phase: "事前研修",          period: SCHEDULE.preTraining, note: "2日とも参加必須" },
      { iconKey: "calendar",  phase: "企業マッチング",     period: SCHEDULE.matching,    note: "企業ごとに事前課題の有無が異なる" },
      { iconKey: "calendar",  phase: "企業連携就業体験",   period: SCHEDULE.internship, note: "企業現場への通勤 / 食費・交通費支援" },
      { iconKey: "clipboard", phase: "成果共有会",         period: SCHEDULE.closing,     note: "参加者に個別連絡" }
    ],
    hostNote: "主催：ソウルグローバルセンター · 運営：Flippers (Aply)",
    hostOrgHeading: "主催機関",
    hostOrgName: "ソウルグローバルセンター",
    hostOrgDescription:
      "ソウル特別市が運営する外国人総合支援機関で、外国人住民の韓国定着・起業・就業を支援する多彩なプログラムを提供しています。",
    hostOrgVisit: "公式サイトを訪問"
  },
  id: {
    pill: "Seoul Global Center × Aply",
    title: "Program Magang 6 Minggu di Perusahaan Korea",
    subtitle: "Program magang kolaborasi 6 minggu untuk mahasiswa asing yang ingin bekerja di Korea.",
    dDayPrefix: "Tutup dalam",
    dDayUnit: "hari",
    recruitOpening: "Pendaftaran segera dibuka",
    recruitClosed: "Pendaftaran ditutup",
    heroCta: "Daftar sekarang",
    stats: [
      { value: "6 mgg",  label: "Magang di perusahaan" },
      { value: "2 sesi", label: "Pelatihan awal" },
      { value: "1:1",    label: "Coaching karier untuk penyelesai" },
      { value: "Disediakan", label: "Makan & transportasi" }
    ],
    aboutHeading: "Tentang program",
    aboutBody1: "Program kolaborasi 6 minggu yang memberikan pengalaman kerja nyata kepada mahasiswa asing yang ingin bekerja di Korea.",
    aboutBody2: "Mulai dari pelatihan adaptasi perusahaan Korea, coaching grup berdasarkan posisi, hingga pengalaman kerja langsung di perusahaan mitra — kamu akan merasakan budaya kerja Korea dan memperkuat kemampuan profesional.",
    pitchHeading: "Cocok untukmu jika",
    pitches: [
      { emoji: "😶‍🌫️", text: "Kamu mahasiswa asing yang bingung memulai persiapan kerja." },
      { emoji: "🤔",     text: "Ingin bekerja di perusahaan Korea tapi tidak tahu mulai dari mana?" },
      { emoji: "💡",     text: "Dari CV, wawancara, hingga pengalaman kerja nyata — kami bantu dengan kurikulum berbasis praktik." },
      { emoji: "🗣",     text: "Bekerja langsung 6 minggu di perusahaan Korea untuk membangun pengalaman kerja dan kemampuan komunikasi profesional." }
    ],
    highlightsHeading: "Yang akan kamu dapat",
    highlights: [
      { iconKey: "edu",     title: "Pelatihan adaptasi perusahaan", desc: "Pelatihan awal tentang budaya, etika, dan cara kerja tim Korea." },
      { iconKey: "coach",   title: "Coaching grup per posisi",      desc: "Coaching bersama rekan yang menuju posisi serupa." },
      { iconKey: "site",    title: "Pengalaman kerja langsung",     desc: "Datang ke perusahaan Korea selama 6 minggu untuk bekerja." },
      { iconKey: "support", title: "Tunjangan makan & transportasi", desc: "Tunjangan makan dan transportasi selama program." }
    ],
    perksHeading: "Untuk yang menyelesaikan program",
    perks: [
      { emoji: "👥", text: "Coaching karier 1:1 + pendaftaran prioritas pameran karier untuk pelajar asing." },
      { emoji: "💼", text: "Peserta terbaik mendapat surat rekomendasi + peluang penghubungan kerja lanjutan." }
    ],
    supportNote: "＊ Ini adalah program \"pengalaman kerja\" (bukan bergaji) — hanya tunjangan makan dan transportasi yang disediakan.",
    recruitHeading: "Informasi pendaftaran",
    recruitPeriodLabel: "Periode pendaftaran",
    recruitPeriodValue: SCHEDULE.recruitPeriod,
    recruitNote: "Masuk ke Aply dan daftar dengan resume Anda. Tim kami meninjau pendaftaran secara berkelanjutan dan menghubungi secara individual.",
    applyCta: "Daftar sekarang",
    recruitHeadcountLabel: "Jumlah peserta",
    recruitHeadcountValue: "Total 6 orang",
    eligibilityLabel: "Syarat pendaftaran",
    eligibilityItems: [
      "Mahasiswa asing yang ingin bekerja di Korea (diutamakan yang akan lulus)",
      "TOPIK level 4 atau di atasnya",
      "Pemegang visa D-2 (studi) / D-10 (pencari kerja) atau yang akan memilikinya"
    ],
    noticeHeading: "Sebelum mendaftar",
    noticeItems: [
      "Undangan wawancara dan hasil akhir dikirim secara individu.",
      "Daftarlah hanya jika Anda dapat mengikuti seluruh jadwal.",
      "Jadwal dapat berubah di kemudian hari."
    ],
    inquiryHeading: "Kontak",
    inquiryPhoneLabel: "Telepon",
    inquiryPhone: "02-362-6754",
    inquiryEmailLabel: "Email",
    inquiryEmail: "sgc.istudent@gmail.com",
    scheduleHeading: "Jadwal",
    schedule: [
      { iconKey: "calendar",  phase: "Wawancara online",      period: SCHEDULE.interview,   note: "Kandidat terpilih dihubungi secara pribadi." },
      { iconKey: "clipboard", phase: "Pelatihan awal",        period: SCHEDULE.preTraining, note: "Wajib hadir kedua hari." },
      { iconKey: "calendar",  phase: "Pencocokan perusahaan", period: SCHEDULE.matching,    note: "Sebagian perusahaan memberi tugas awal." },
      { iconKey: "calendar",  phase: "Pengalaman kerja",      period: SCHEDULE.internship, note: "Datang ke perusahaan / tunjangan makan & transport" },
      { iconKey: "clipboard", phase: "Acara berbagi hasil",   period: SCHEDULE.closing,     note: "Peserta dihubungi secara pribadi." }
    ],
    hostNote: "Penyelenggara: Seoul Global Center · Operasional: Flippers (Aply)",
    hostOrgHeading: "Penyelenggara",
    hostOrgName: "Seoul Global Center",
    hostOrgDescription:
      "Pusat dukungan terpadu untuk warga asing yang dikelola Pemerintah Kota Seoul, menyediakan beragam program untuk membantu warga asing menetap, berwirausaha, dan bekerja di Korea.",
    hostOrgVisit: "Kunjungi situs resmi Seoul Global Center"
  }
};

const HIGHLIGHT_ICON: Record<Highlight["iconKey"], React.ComponentType<{ className?: string; weight?: "bold" | "fill" | "regular" }>> = {
  edu:     GraduationCap,
  coach:   Users,
  site:    ClipboardText,
  support: Coffee
};
const SCHEDULE_ICON: Record<SchedulePhase["iconKey"], React.ComponentType<{ className?: string; weight?: "bold" | "fill" | "regular" }>> = {
  calendar:  CalendarBlank,
  clipboard: ClipboardText
};

export function SgcEventPage() {
  const { locale } = useLanguage();
  const t = COPY[locale] ?? COPY.ko;
  // SSR/CSR 시간차로 D-day 값이 hydration mismatch 가 나지 않도록 useState +
  // useEffect 로 클라이언트 마운트 후에만 갱신. 첫 렌더는 "곧 시작" placeholder
  // 로 안전하게.
  const [recruitState, setRecruitState] = useState<SgcRecruitState>({ kind: "before", daysToStart: 0 });
  useEffect(() => { setRecruitState(computeSgcRecruitState()); }, []);

  const dDayBadge = (() => {
    if (recruitState.kind === "closed") {
      return { tone: "muted", text: t.recruitClosed };
    }
    if (recruitState.kind === "before") {
      return { tone: "warm",  text: `${t.recruitOpening} · D-${recruitState.daysToStart}` };
    }
    return { tone: "urgent", text: `${t.dDayPrefix} D-${recruitState.daysToClose}${recruitState.daysToClose === 0 ? "" : ""}` };
  })();
  const dDayClass =
    dDayBadge.tone === "urgent" ? "bg-rose-50 text-rose-700 ring-rose-200" :
    dDayBadge.tone === "warm"   ? "bg-amber-50 text-amber-800 ring-amber-200" :
                                  "bg-muted text-muted-foreground ring-border";

  const isClosed = recruitState.kind === "closed";

  return (
    // pb-[76px] 는 모바일 고정 CTA 바(높이 ≈ 73px) 가 푸터 하단(저작권·약관
    // 줄)을 가리지 않도록 페이지 전체에 주는 클리어런스. 바가 없는 md+ 에서는 0.
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased pb-[76px] md:pb-0">
      <Header />
      <main className="flex-1 pb-12 md:pb-16">
        {/* Hero — 협력 로고 + 큰 타이틀 + D-day 배지 + 지원 CTA 까지 한 카드 안.
            모집 이벤트라는 인상을 즉시 주기 위해 상단에 D-day 와 큰 primary
            버튼을 노출. 정보 페이지 톤이 아닌 viral 모집 톤. */}
        <section className="bg-gradient-to-b from-violet-50/60 via-violet-50/20 to-background">
          <div className="container py-10 md:py-14">
            <div className="mx-auto max-w-4xl">
              <div className="rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-black/5 md:p-12">
                <div className="relative mx-auto h-20 w-full max-w-[360px] md:h-28 md:max-w-[480px]">
                  <Image
                    src="/img_sgc_aply.webp"
                    alt="Seoul Global Center × Aply"
                    fill
                    sizes="(min-width: 768px) 480px, 360px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <p className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground/70">
                    {t.pill}
                  </p>
                  {/* D-day badge — 시간 분기로 톤 변화. 마감 임박은 urgent(빨강),
                      시작 전은 warm(앰버), 마감은 muted(회색). */}
                  <p className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${dDayClass}`}>
                    {dDayBadge.text}
                  </p>
                </div>
                <h1 className={`${paperlogy.className} mt-4 text-3xl font-black leading-tight tracking-[-0.03em] text-black md:text-5xl`}>
                  {t.title}
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 md:text-base">
                  {t.subtitle}
                </p>

                {/* Hero CTA — 큰 primary 버튼. 모집 마감 후엔 비활성. 신청은
                    내부 페이지(APPLY_PATH) 라 Link 로 SPA 라우팅. */}
                {isClosed ? (
                  <span
                    aria-disabled
                    className="mt-6 inline-flex h-12 cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-muted px-7 text-[15px] font-bold text-muted-foreground shadow-sm md:h-14 md:px-9 md:text-base"
                  >
                    {t.recruitClosed}
                  </span>
                ) : (
                  <Link
                    href={APPLY_PATH}
                    className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-7 text-[15px] font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 hover:shadow-md active:scale-[0.98] md:h-14 md:px-9 md:text-base"
                  >
                    {t.heroCta}
                    <ArrowRight className="h-4 w-4 md:h-5 md:w-5" weight="bold" />
                  </Link>
                )}

                {/* Quick stats — Hero 카드 하단에 한눈에 보이는 핵심 숫자 4개.
                    모집 페이지의 "스펙" 영역. */}
                <ul className="mt-7 grid grid-cols-2 gap-2 border-t border-border/40 pt-6 sm:grid-cols-4">
                  {t.stats.map((s, i) => (
                    <li key={i} className="px-2 py-1 text-center">
                      <p className={`${paperlogy.className} text-2xl font-black tracking-tight text-primary md:text-3xl`}>
                        {s.value}
                      </p>
                      <p className="mt-1 text-[12px] leading-tight text-muted-foreground md:text-[12.5px]">
                        {s.label}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* About + highlights 한 섹션으로 묶음 — 정보 페이지의 본문. */}
        <section className="container pb-12 md:pb-16">
          <div className="mx-auto max-w-4xl space-y-12">
            {/* 소개 본문 */}
            <article>
              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t.aboutHeading}
              </h2>
              <div className="mt-4 space-y-3 text-[14.5px] leading-relaxed text-foreground/85 md:text-base">
                <p>{t.aboutBody1}</p>
                <p>{t.aboutBody2}</p>
              </div>
            </article>

            {/* Pitch — 이런 분께 추천해요. 이모지로 톤 톤다운된 안내문에 친근감
                추가. 외국인 유학생이 자기 상황으로 즉시 매핑할 수 있는 라인 3개. */}
            <article>
              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t.pitchHeading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {t.pitches.map((p, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <span aria-hidden className="shrink-0 text-xl leading-none">{p.emoji}</span>
                    <p className="text-[14.5px] leading-relaxed text-foreground md:text-base">
                      {p.text}
                    </p>
                  </li>
                ))}
              </ul>
            </article>

            {/* 강조 포인트 2x2 그리드 */}
            <article>
              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t.highlightsHeading}
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {t.highlights.map((h) => {
                  const Icon = HIGHLIGHT_ICON[h.iconKey];
                  return (
                    <div key={h.title} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <Icon className="h-5 w-5" weight="bold" />
                      </div>
                      <p className="mt-3 text-[15px] font-bold text-foreground">{h.title}</p>
                      <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{h.desc}</p>
                    </div>
                  );
                })}
              </div>
              {/* 식비/교통비 지원이 "임금" 으로 오해되지 않도록 highlights 아래
                  에 작은 안내 라인. 정직성 + 정부 협력 프로그램 톤. */}
              <p className="mt-3 rounded-xl bg-amber-50/60 px-4 py-2.5 text-[12.5px] leading-relaxed text-amber-900">
                {t.supportNote}
              </p>
            </article>

            {/* 완주자 혜택 — 끝까지 따라온 사람이 받을 추가 보상. 1:1 코칭 +
                박람회 매칭 + 추천서 + 채용 연계까지, "끝나고도 끝이 아닌" 흐름. */}
            <article>
              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t.perksHeading}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {t.perks.map((p, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4"
                  >
                    <span aria-hidden className="shrink-0 text-xl leading-none">{p.emoji}</span>
                    <p className="text-[14.5px] leading-relaxed text-foreground md:text-base">
                      {p.text}
                    </p>
                  </li>
                ))}
              </ul>
            </article>

            {/* 모집 안내 + CTA — 가장 중요한 액션, 시각적으로 도드라지게. 모집
                기간 / 인원 / 자격 을 한 카드 안에서 빠르게 훑을 수 있게 grid. */}
            <article className="rounded-3xl border border-violet-200 bg-violet-50/40 p-6 md:p-8">
              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t.recruitHeading}
              </h2>

              {/* 기간 + 인원 — 2열 (모바일은 자동 줄바꿈) */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t.recruitPeriodLabel}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold tracking-tight md:text-xl">
                    {t.recruitPeriodValue}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t.recruitHeadcountLabel}
                  </p>
                  <p className="mt-1 font-display text-lg font-bold tracking-tight md:text-xl">
                    {t.recruitHeadcountValue}
                  </p>
                </div>
              </div>

              {/* 신청 자격 — bullet list */}
              <div className="mt-5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {t.eligibilityLabel}
                </p>
                <ul className="mt-2 space-y-1.5">
                  {t.eligibilityItems.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[14px] leading-relaxed text-foreground/85">
                      <span aria-hidden className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 text-[13.5px] leading-relaxed text-muted-foreground">
                {t.recruitNote}
              </p>
              <Link
                href={APPLY_PATH}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 active:scale-[0.99] md:w-auto"
              >
                {t.applyCta}
                <ArrowRight className="h-4 w-4" weight="bold" />
              </Link>
            </article>

            {/* 진행 일정 타임라인 — 좌측 인덱스 + 우측 카드 */}
            <article>
              <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">
                {t.scheduleHeading}
              </h2>
              <ol className="mt-4 space-y-3">
                {t.schedule.map((s, i) => {
                  const Icon = SCHEDULE_ICON[s.iconKey];
                  return (
                    <li
                      key={`${s.phase}-${i}`}
                      className="flex gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" weight="bold" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {i + 1}
                          </span>
                          <p className="text-[15px] font-bold text-foreground">{s.phase}</p>
                        </div>
                        <p className="mt-1 text-[13.5px] leading-relaxed text-foreground/80">{s.period}</p>
                        {s.note ? (
                          <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{s.note}</p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </article>

            {/* 참여 전 주의사항 — 모집 안내 직후 + 일정 직후 위치 둘 다 고민했는데
                일정 다음에 두는 게 자연스럽다. "이 일정 다 참여 가능해야 함" 컨텍스트. */}
            <article className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 md:p-6">
              <p className="font-display text-sm font-bold text-amber-900 md:text-base">
                ⚠️ {t.noticeHeading}
              </p>
              <ul className="mt-3 space-y-2">
                {t.noticeItems.map((item, i) => (
                  <li key={i} className="flex gap-2 text-[13.5px] leading-relaxed text-amber-950/85">
                    <span aria-hidden className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>

            {/* 문의처 — 전화 + 이메일. tel:/mailto: deep link 로 모바일에서
                즉시 발신 가능. */}
            <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 md:p-6">
              <h2 className="font-display text-base font-bold tracking-tight md:text-lg">
                {t.inquiryHeading}
              </h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t.inquiryPhoneLabel}
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`tel:${t.inquiryPhone.replace(/[^+\d]/g, "")}`}
                      className="font-display text-base font-bold tracking-tight text-foreground hover:text-primary"
                    >
                      {t.inquiryPhone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    {t.inquiryEmailLabel}
                  </dt>
                  <dd className="mt-1">
                    <a
                      href={`mailto:${t.inquiryEmail}`}
                      className="break-all font-display text-base font-bold tracking-tight text-foreground hover:text-primary"
                    >
                      {t.inquiryEmail}
                    </a>
                  </dd>
                </div>
              </dl>
            </article>

            {/* 주최 기관 안내 — 서울글로벌센터 소개 + 공식 사이트 바로가기.
                정부/공공 기관 협력 프로그램이라 출처에 대한 신뢰감을 강화. */}
            <article className="rounded-3xl border border-border/40 bg-white p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {t.hostOrgHeading}
              </p>
              <h2 className="mt-2 font-display text-xl font-bold tracking-tight md:text-2xl">
                {t.hostOrgName}
              </h2>
              <p className="mt-3 text-[14px] leading-relaxed text-foreground/85 md:text-[14.5px]">
                {t.hostOrgDescription}
              </p>
              <a
                href={SGC_SITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {t.hostOrgVisit}
                <ArrowSquareOut className="h-4 w-4" weight="bold" />
              </a>
            </article>

            {/* 주최 / 운영 라인 — 정식 협력 프로그램의 신뢰감 신호 */}
            <p className="text-center text-[12px] text-muted-foreground">{t.hostNote}</p>
          </div>
        </section>
      </main>

      {/* 모바일 sticky CTA 바 — 스크롤 위치 무관하게 항상 노출되는 지원 버튼.
          데스크탑(md+)에서는 Hero 와 모집 카드 두 곳의 CTA 로 충분하여 숨김.
          backdrop-blur 로 살짝 투명도 주어 본문이 너무 가려지지 않게. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
        {isClosed ? (
          <span
            aria-disabled
            className="flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-muted text-sm font-bold text-muted-foreground shadow-sm"
          >
            {t.recruitClosed}
          </span>
        ) : (
          <Link
            href={APPLY_PATH}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition active:scale-[0.99]"
          >
            {t.heroCta}
            <ArrowRight className="h-4 w-4" weight="bold" />
          </Link>
        )}
      </div>

      <Footer />
    </div>
  );
}
