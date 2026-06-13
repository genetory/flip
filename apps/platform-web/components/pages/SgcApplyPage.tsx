"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, FileText, Warning } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";
import type { PlatformLocale } from "../../lib/auth-messages";
import { getMyResumes, type Resume } from "../../lib/member-profile-client";
import {
  getMySgcApplication,
  submitSgcApplication,
  type SgcApplication,
  type SgcDesiredJob,
  type SgcGender,
  type SgcGrade,
  type SgcKoreaStay,
  type SgcReferralSource,
  type SgcTopikLevel,
  type SgcVisaType
} from "../../lib/sgc-event-client";
import { isSgcRecruitClosed } from "../../lib/sgc-event-config";

// ---------------------------------------------------------------------------
// /events/seoul-global-center/apply — SGC 6주 일경험 프로그램 지원 페이지.
// 회원 + 이력서 보유자만 지원 가능. 비로그인은 /login 으로, 이력서 없으면
// /resume/new/edit 로 부드럽게 안내. 이미 지원한 사용자는 status 화면.
// ---------------------------------------------------------------------------

const VISA_OPTIONS: SgcVisaType[] = ["D-2", "D-10", "OTHER"];
const DESIRED_JOB_OPTIONS: SgcDesiredJob[] = ["MARKETING", "SALES", "TRANSLATION", "DEV", "OTHER"];
const GENDER_OPTIONS: SgcGender[] = ["FEMALE", "MALE"];
const GRADE_OPTIONS: SgcGrade[] = ["UNDERGRAD_4", "GRAD", "GRADUATED"];
const KOREA_STAY_OPTIONS: SgcKoreaStay[] = ["LT_1Y", "Y1_2", "Y2_3", "Y3_5", "GTE_5Y"];
const TOPIK_OPTIONS: SgcTopikLevel[] = ["4", "5", "6"];
const REFERRAL_OPTIONS: SgcReferralSource[] = ["FRIEND", "SNS", "SCHOOL", "SEARCH", "OTHER"];

// 텍스트 입력 공통 스타일 (포스터 폼 단답 항목들).
const INPUT_CLS =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary";

type Copy = {
  pageHeading: string;
  pageSubheading: string;
  // 비-회원 / 이력서 없음 / 이미 지원 / 학생 아님 / 모집 마감 안내
  loginRequiredTitle: string;
  loginRequiredBody: string;
  loginCta: string;
  noResumeTitle: string;
  noResumeBody: string;
  noResumeCta: string;
  alreadyAppliedTitle: string;
  alreadyAppliedBody: string;
  notStudentTitle: string;
  notStudentBody: string;
  closedTitle: string;
  closedBody: string;
  statusLabel: string;
  statusValue: Record<string, string>;
  backToDetail: string;
  // 폼
  resumeSectionLabel: string;
  resumeSelectHint: string;
  resumeEditLink: string;
  // 기본 정보 (계정 prefill)
  nameLabel: string;
  namePlaceholder: string;
  birthDateLabel: string;
  genderLabel: string;
  genderOptionLabel: Record<SgcGender, string>;
  nationalityLabel: string;
  nationalityPlaceholder: string;
  phoneLabel: string;
  phonePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  addressLabel: string;
  addressPlaceholder: string;
  koreaStayLabel: string;
  koreaStayOptionLabel: Record<SgcKoreaStay, string>;
  // 학력
  universityLabel: string;
  universityPlaceholder: string;
  majorLabel: string;
  majorPlaceholder: string;
  gradeLabel: string;
  gradeOptionLabel: Record<SgcGrade, string>;
  // 졸업 / 졸업 예정일
  graduationLabel: string;
  graduationNote: string;
  graduationPlaceholder: string;
  topikLabel: string;
  topikNote: string;
  topikOptionLabel: Record<SgcTopikLevel, string>;
  // 알게 된 경로
  referralLabel: string;
  referralOptionLabel: Record<SgcReferralSource, string>;
  referralOtherPlaceholder: string;
  visaTypeLabel: string;
  visaTypeNote: string;
  visaOptionLabel: Record<SgcVisaType, string>;
  visaOtherPlaceholder: string;
  healthLabel: string;
  healthPlaceholder: string;
  desiredJobLabel: string;
  desiredJobOptionLabel: Record<SgcDesiredJob, string>;
  desiredJobOtherPlaceholder: string;
  motivationLabel: string;
  motivationPlaceholder: string;
  motivationHelp: string;
  marketingHeading: string;
  marketingBody: string;
  marketingYes: string;
  marketingNo: string;
  privacyHeading: string;
  privacyBody: string;
  privacyAgree: string;
  // 사전 교육 필수 참여 확인 — 안내문 + 질문 + 동의 체크박스 라벨
  preTrainingTitle: string;
  preTrainingNotice: string[];
  preTrainingQuestion: string;
  preTrainingAgree: string;
  submit: string;
  submitting: string;
  // 에러
  errRequired: string;
  errRetry: string;
  // 성공
  successTitle: string;
  successBody: string;
};

// 6개 로케일(ko/en/zh-CN/vi/ja/id) 전체 번역. ko 를 1차 언어로 작성하고
// 각 로케일은 ...ko 로 안전망을 깐 뒤 모든 표시 문구를 직접 번역한다.
// (event-page 와 동일한 풀 로케일 패턴.)
const COPY: Record<PlatformLocale, Copy> = (() => {
  const ko: Copy = {
    pageHeading: "프로그램 지원",
    pageSubheading: "서울글로벌센터 × Aply 6주 일경험 프로그램 신청",
    loginRequiredTitle: "Aply 회원만 지원 가능합니다",
    loginRequiredBody:
      "신청을 위해서는 Aply 회원가입과 이력서가 필요해요. 로그인 후 다시 진입하시면 됩니다.",
    loginCta: "로그인 / 가입하기",
    noResumeTitle: "이력서를 먼저 작성해 주세요",
    noResumeBody:
      "SGC 프로그램 지원에는 Aply 이력서가 필요합니다. 1분 만에 이력서를 만들고 지원할 수 있어요.",
    noResumeCta: "이력서 만들기",
    alreadyAppliedTitle: "이미 지원이 접수됐습니다",
    alreadyAppliedBody:
      "한 사용자당 1회 지원 가능해요. 운영팀에서 검토 후 개별 연락드릴게요.",
    notStudentTitle: "학생 회원만 지원 가능합니다",
    notStudentBody:
      "본 프로그램은 외국인 유학생 대상이라 STUDENT 계정에서만 신청 가능해요. 학생 계정으로 다시 로그인해 주세요.",
    closedTitle: "모집이 마감됐어요",
    closedBody:
      "신청 기간이 종료됐습니다. 다음 모집 공지는 Aply 이벤트 페이지에서 안내드릴게요.",
    statusLabel: "지원 상태",
    statusValue: {
      SUBMITTED: "접수 완료",
      INTERVIEW: "면접 진행",
      ACCEPTED: "합격",
      REJECTED: "불합격",
      WITHDRAWN: "지원 취소"
    },
    backToDetail: "프로그램 페이지로 돌아가기",
    resumeSectionLabel: "지원에 사용할 이력서",
    resumeSelectHint: "운영팀이 검토할 이력서를 선택해 주세요. 보완이 필요하면 옆의 \"수정\"으로 바로 편집할 수 있어요.",
    resumeEditLink: "수정",
    nameLabel: "이름",
    namePlaceholder: "본명 또는 한국어 이름",
    birthDateLabel: "생년월일",
    genderLabel: "성별",
    genderOptionLabel: { FEMALE: "여성", MALE: "남성" },
    nationalityLabel: "국적",
    nationalityPlaceholder: "예) 베트남",
    phoneLabel: "휴대폰 번호",
    phonePlaceholder: "예) 010-1234-5678",
    emailLabel: "이메일",
    emailPlaceholder: "예) name@email.com",
    addressLabel: "현재 거주 주소",
    addressPlaceholder: "예) 서울시 종로구",
    koreaStayLabel: "한국 거주 기간",
    koreaStayOptionLabel: { LT_1Y: "1년 미만", Y1_2: "1~2년", Y2_3: "2~3년", Y3_5: "3~5년", GTE_5Y: "5년 이상" },
    universityLabel: "대학교",
    universityPlaceholder: "재학/졸업 대학교 이름",
    majorLabel: "전공",
    majorPlaceholder: "예) 경영학과",
    gradeLabel: "학적 구분",
    gradeOptionLabel: { UNDERGRAD_4: "학부 재학", GRAD: "대학원 재학", GRADUATED: "졸업" },
    graduationLabel: "졸업 / 졸업 예정일",
    graduationNote: "재학 중이라면 졸업 예정일을, 졸업했다면 졸업한 시기를 적어 주세요.",
    graduationPlaceholder: "예) 2026년 3월",
    topikLabel: "TOPIK 등급",
    topikNote: "※ TOPIK 4급 이상만 지원 가능",
    topikOptionLabel: { "4": "4급", "5": "5급", "6": "6급" },
    referralLabel: "이 프로그램을 알게 된 경로",
    referralOptionLabel: { FRIEND: "지인 추천", SNS: "SNS (인스타그램 등)", SCHOOL: "학교 · 교내 공지", SEARCH: "인터넷 검색", OTHER: "기타" },
    referralOtherPlaceholder: "경로를 입력해 주세요 (검색어 등)",
    visaTypeLabel: "체류자격",
    visaTypeNote: "※ D-2, D-10 비자 소지자 또는 소지 예정자만 지원 가능",
    visaOptionLabel: {
      "D-2": "D-2 (유학) · 9월 졸업 예정자",
      "D-10": "D-10 (구직)",
      OTHER: "기타"
    },
    visaOtherPlaceholder: "보유 비자 코드 입력",
    healthLabel: "건강상 특이사항 (지병, 알러지, 식습관 등)",
    healthPlaceholder: "예) 갑각류 알러지, 저혈압, 채식 등",
    desiredJobLabel: "희망 직무",
    desiredJobOptionLabel: {
      MARKETING:   "마케팅",
      SALES:       "세일즈",
      TRANSLATION: "통번역",
      DEV:         "개발",
      OTHER:       "기타"
    },
    desiredJobOtherPlaceholder: "희망 직무 입력",
    motivationLabel: "기업 현장 일경험에 왜 신청하셨나요?",
    motivationPlaceholder: "신청 이유를 자세하게 작성해 주세요.",
    motivationHelp: "20자 이상 작성해 주세요.",
    marketingHeading:
      "서울글로벌센터의 외국인 가이드 교육 / 프리랜서 기회 정보를 받아보시겠어요?",
    marketingBody:
      "Seoul Global Center is offering training programs for foreign guides, along with opportunities for work experience and freelance activities.",
    marketingYes: "네, 정보 받기를 원합니다",
    marketingNo: "아니요, 원하지 않습니다",
    privacyHeading: "개인정보 수집 및 이용 동의 (필수)",
    privacyBody:
      "수집 항목: 성명, 전화번호, 국적, 이메일 등 (필수) / 학교·전공 등 (선택)\n" +
      "이용 목적: 프로그램 일정 안내 · 업무 연락 · 향후 사업 안내\n" +
      "보유 기간: 2년\n\n" +
      "동의를 거부할 권리가 있으나, 거부 시 참가가 제한될 수 있습니다.",
    privacyAgree: "위 내용에 동의합니다",
    preTrainingTitle: "사전 교육 참여 확인",
    preTrainingNotice: [
      "기업 현장 일경험의 최종 합격자 선발 결과는 6/29(월)에 발표될 예정입니다.",
      "최종 합격자는 바로 다음 날(6/30, 화)에 진행되는 사전 교육에 필수 참여하셔야 합니다."
    ],
    preTrainingQuestion: "사전 교육 일정에 참여가 가능하신가요?",
    preTrainingAgree: "네, 사전 교육 일정에 참석 가능하고, 합격 시 꼭 참여하겠습니다.",
    submit: "지원하기",
    submitting: "전송 중...",
    errRequired: "필수 항목을 모두 입력해 주세요.",
    errRetry: "잠시 후 다시 시도해 주세요.",
    successTitle: "지원이 완료됐어요",
    successBody:
      "운영팀이 이력서와 함께 신청을 검토 후 면접 일정을 개별 안내드릴 예정입니다."
  };
  const en: Copy = {
    ...ko,
    pageHeading: "Apply to the program",
    pageSubheading: "Seoul Global Center × Aply · 6-Week Korea Work Experience",
    loginRequiredTitle: "Sign in to apply",
    loginRequiredBody: "Applying requires an Aply account and a resume. Sign in and come back.",
    loginCta: "Sign in / Sign up",
    noResumeTitle: "Create your resume first",
    noResumeBody: "An Aply resume is required to apply. It only takes a minute.",
    noResumeCta: "Create a resume",
    alreadyAppliedTitle: "Application already received",
    alreadyAppliedBody:
      "One application per user. Our team will review it and contact you with the next steps.",
    notStudentTitle: "Student members only",
    notStudentBody:
      "This program is for international students, so applications are accepted only from STUDENT accounts. Please sign in with a student account.",
    closedTitle: "Applications closed",
    closedBody:
      "The application window has closed. We'll announce the next round on Aply's events page.",
    statusLabel: "Status",
    statusValue: {
      SUBMITTED: "Received",
      INTERVIEW: "In interview",
      ACCEPTED: "Accepted",
      REJECTED: "Not selected",
      WITHDRAWN: "Withdrawn"
    },
    backToDetail: "Back to program page",
    resumeSectionLabel: "Resume to submit",
    resumeSelectHint: "Choose which resume our team should review. Tap \"Edit\" next to a resume to touch it up first.",
    resumeEditLink: "Edit",
    nameLabel: "Name",
    namePlaceholder: "Legal name or Korean name",
    birthDateLabel: "Date of birth",
    genderLabel: "Gender",
    genderOptionLabel: { FEMALE: "Female", MALE: "Male" },
    nationalityLabel: "Nationality",
    nationalityPlaceholder: "e.g. Vietnam",
    phoneLabel: "Mobile number",
    phonePlaceholder: "e.g. 010-1234-5678",
    emailLabel: "Email",
    emailPlaceholder: "e.g. name@email.com",
    addressLabel: "Current address",
    addressPlaceholder: "e.g. Jongno-gu, Seoul",
    koreaStayLabel: "Time lived in Korea",
    koreaStayOptionLabel: { LT_1Y: "Under 1 year", Y1_2: "1–2 years", Y2_3: "2–3 years", Y3_5: "3–5 years", GTE_5Y: "5+ years" },
    universityLabel: "University",
    universityPlaceholder: "Your (former) university",
    majorLabel: "Major",
    majorPlaceholder: "e.g. Business Administration",
    gradeLabel: "Academic status",
    gradeOptionLabel: { UNDERGRAD_4: "Undergraduate", GRAD: "Graduate school", GRADUATED: "Graduated" },
    graduationLabel: "Graduation (expected) date",
    graduationNote: "If you're still enrolled, enter your expected graduation date; if graduated, when you graduated.",
    graduationPlaceholder: "e.g. March 2026",
    topikLabel: "TOPIK level",
    topikNote: "※ Open to TOPIK level 4 or above",
    topikOptionLabel: { "4": "Level 4", "5": "Level 5", "6": "Level 6" },
    referralLabel: "How did you hear about this program?",
    referralOptionLabel: { FRIEND: "Word of mouth", SNS: "Social media (Instagram, etc.)", SCHOOL: "School / campus notice", SEARCH: "Web search", OTHER: "Other" },
    referralOtherPlaceholder: "Please specify (search term, etc.)",
    visaTypeLabel: "Residency status",
    visaTypeNote: "※ Open to D-2 or D-10 holders (or about to hold one)",
    visaOptionLabel: {
      "D-2": "D-2 (student) · graduating this September",
      "D-10": "D-10 (job-seeking)",
      OTHER: "Other"
    },
    visaOtherPlaceholder: "Enter your visa code",
    healthLabel: "Health notes (conditions, allergies, dietary, etc.)",
    healthPlaceholder: "e.g. shellfish allergy, vegetarian diet",
    desiredJobLabel: "Desired role",
    desiredJobOptionLabel: {
      MARKETING:   "Marketing",
      SALES:       "Sales",
      TRANSLATION: "Translation / Interpretation",
      DEV:         "Engineering / Dev",
      OTHER:       "Other"
    },
    desiredJobOtherPlaceholder: "Enter your desired role",
    motivationLabel: "Why are you applying to this work-experience program?",
    motivationPlaceholder: "Tell us in detail why you're applying.",
    motivationHelp: "Please write at least 20 characters.",
    marketingHeading:
      "Seoul Global Center is offering training programs for foreign guides + freelance opportunities. Want updates?",
    marketingBody: "",
    marketingYes: "Yes, send me information",
    marketingNo: "No, thanks",
    privacyHeading: "Consent to use of personal information (required)",
    privacyBody:
      "Required items: name, phone, nationality, email, etc.\n" +
      "Optional: school / department / company name.\n" +
      "Purpose: program scheduling, follow-up, future program info.\n" +
      "Storage period: 2 years.\n\n" +
      "You may refuse; refusal may limit participation.",
    privacyAgree: "I agree to the terms above",
    preTrainingTitle: "Pre-training attendance",
    preTrainingNotice: [
      "Final selection results will be announced on Mon, Jun 29.",
      "Selected participants must attend the pre-training held the very next day (Tue, Jun 30)."
    ],
    preTrainingQuestion: "Can you attend the pre-training session?",
    preTrainingAgree: "Yes, I can attend the pre-training and will join if selected.",
    submit: "Submit application",
    submitting: "Sending...",
    errRequired: "Please complete the required fields.",
    errRetry: "Something went wrong — please try again.",
    successTitle: "Application received",
    successBody: "Our team will review your resume + answers and contact you with interview details."
  };
  // 6개 로케일 전체 번역. ...ko 로 안전망(누락 시 한국어)을 깔되 모든 표시
  // 문구는 언어별로 직접 번역. 날짜(6/29·6/30) 는 모든 언어 공통 표기.
  const zhCN: Copy = {
    ...ko,
    pageHeading: "项目申请",
    pageSubheading: "首尔全球中心 × Aply 6 周韩国企业实习项目申请",
    loginRequiredTitle: "仅限 Aply 会员申请",
    loginRequiredBody: "申请需要 Aply 账号和简历。请登录后重新进入。",
    loginCta: "登录 / 注册",
    noResumeTitle: "请先填写简历",
    noResumeBody: "申请 SGC 项目需要 Aply 简历。1 分钟即可创建并申请。",
    noResumeCta: "创建简历",
    alreadyAppliedTitle: "申请已受理",
    alreadyAppliedBody: "每位用户限申请 1 次。运营团队审核后将单独与您联系。",
    notStudentTitle: "仅限学生会员申请",
    notStudentBody:
      "本项目面向外国留学生，仅可使用 STUDENT 账号申请。请用学生账号重新登录。",
    closedTitle: "招募已结束",
    closedBody: "申请期间已结束。下次招募将在 Aply 活动页面通知。",
    statusLabel: "申请状态",
    statusValue: {
      SUBMITTED: "已受理",
      INTERVIEW: "面试进行中",
      ACCEPTED: "合格",
      REJECTED: "未通过",
      WITHDRAWN: "已取消申请"
    },
    backToDetail: "返回项目页面",
    resumeSectionLabel: "用于申请的简历",
    resumeSelectHint: "请选择运营团队将审核的简历。如需补充，可点击旁边的\"修改\"直接编辑。",
    resumeEditLink: "修改",
    nameLabel: "姓名",
    namePlaceholder: "本名或韩语姓名",
    birthDateLabel: "出生日期",
    genderLabel: "性别",
    genderOptionLabel: { FEMALE: "女", MALE: "男" },
    nationalityLabel: "国籍",
    nationalityPlaceholder: "例) 越南",
    phoneLabel: "手机号码",
    phonePlaceholder: "例) 010-1234-5678",
    emailLabel: "邮箱",
    emailPlaceholder: "例) name@email.com",
    addressLabel: "现居住地址",
    addressPlaceholder: "例) 首尔市钟路区",
    koreaStayLabel: "在韩居住时长",
    koreaStayOptionLabel: { LT_1Y: "不满 1 年", Y1_2: "1~2 年", Y2_3: "2~3 年", Y3_5: "3~5 年", GTE_5Y: "5 年以上" },
    universityLabel: "大学",
    universityPlaceholder: "在读/毕业大学名称",
    majorLabel: "专业",
    majorPlaceholder: "例) 工商管理",
    gradeLabel: "学籍类别",
    gradeOptionLabel: { UNDERGRAD_4: "本科在读", GRAD: "研究生在读", GRADUATED: "已毕业" },
    topikLabel: "TOPIK 等级",
    topikNote: "※ 仅限 TOPIK 4 级以上申请",
    topikOptionLabel: { "4": "4 级", "5": "5 级", "6": "6 级" },
    referralLabel: "通过什么渠道了解到本项目？",
    referralOptionLabel: { FRIEND: "熟人推荐", SNS: "社交媒体（Instagram 等）", SCHOOL: "学校 · 校内公告", SEARCH: "网络搜索", OTHER: "其他" },
    referralOtherPlaceholder: "请填写渠道（搜索词等）",
    graduationLabel: "毕业 / 预计毕业时间",
    graduationNote: "在读请填写预计毕业时间，已毕业请填写毕业时间。",
    graduationPlaceholder: "例) 2026 年 3 月",
    visaTypeLabel: "居留资格",
    visaTypeNote: "※ 仅限 D-2、D-10 签证持有者或预定持有者申请",
    visaOptionLabel: {
      "D-2": "D-2（留学）· 9 月预计毕业",
      "D-10": "D-10（求职）",
      OTHER: "其他"
    },
    visaOtherPlaceholder: "请输入持有的签证代码",
    healthLabel: "健康方面特殊事项（疾病、过敏、饮食习惯等）",
    healthPlaceholder: "例) 甲壳类过敏、低血压、素食等",
    desiredJobLabel: "希望职务",
    desiredJobOptionLabel: {
      MARKETING: "市场营销",
      SALES: "销售",
      TRANSLATION: "口笔译",
      DEV: "开发",
      OTHER: "其他"
    },
    desiredJobOtherPlaceholder: "请输入希望职务",
    motivationLabel: "您为什么申请企业现场实习？",
    motivationPlaceholder: "请详细填写申请理由。",
    motivationHelp: "请填写 20 字以上。",
    marketingHeading: "是否希望接收首尔全球中心的外国人向导培训 / 自由职业机会信息？",
    marketingBody: "",
    marketingYes: "是，我愿意接收信息",
    marketingNo: "否，我不需要",
    privacyHeading: "个人信息收集及使用同意（必填）",
    privacyBody:
      "收集项目：姓名、电话号码、国籍、邮箱等（必填）/ 学校·专业等（选填）\n" +
      "使用目的：项目日程通知 · 业务联系 · 今后项目介绍\n" +
      "保存期限：2 年\n\n" +
      "您有权拒绝同意，但拒绝时可能限制参加。",
    privacyAgree: "我同意以上内容",
    preTrainingTitle: "事前培训参与确认",
    preTrainingNotice: [
      "企业现场实习的最终合格者名单将于 6/29（周一）公布。",
      "最终合格者须参加紧接其后一天（6/30，周二）举行的事前培训。"
    ],
    preTrainingQuestion: "您能参加事前培训日程吗？",
    preTrainingAgree: "是，我能参加事前培训日程，合格后一定参加。",
    submit: "提交申请",
    submitting: "提交中...",
    errRequired: "请填写所有必填项。",
    errRetry: "请稍后再试。",
    successTitle: "申请已完成",
    successBody: "运营团队将连同简历审核您的申请，并单独通知面试日程。"
  };
  const vi: Copy = {
    ...ko,
    pageHeading: "Đăng ký chương trình",
    pageSubheading: "Seoul Global Center × Aply · Chương trình thực tập 6 tuần tại Hàn Quốc",
    loginRequiredTitle: "Chỉ hội viên Aply mới đăng ký được",
    loginRequiredBody:
      "Để đăng ký bạn cần có tài khoản Aply và một CV. Vui lòng đăng nhập rồi quay lại.",
    loginCta: "Đăng nhập / Đăng ký",
    noResumeTitle: "Vui lòng tạo CV trước",
    noResumeBody:
      "Cần có CV Aply để đăng ký chương trình SGC. Chỉ mất 1 phút để tạo và ứng tuyển.",
    noResumeCta: "Tạo CV",
    alreadyAppliedTitle: "Đơn đăng ký đã được tiếp nhận",
    alreadyAppliedBody:
      "Mỗi người chỉ đăng ký 1 lần. Đội ngũ vận hành sẽ xem xét và liên hệ riêng với bạn.",
    notStudentTitle: "Chỉ dành cho hội viên là sinh viên",
    notStudentBody:
      "Chương trình dành cho du học sinh quốc tế nên chỉ tài khoản STUDENT mới đăng ký được. Vui lòng đăng nhập bằng tài khoản sinh viên.",
    closedTitle: "Đã hết hạn tuyển",
    closedBody:
      "Thời gian đăng ký đã kết thúc. Đợt tuyển tiếp theo sẽ được thông báo trên trang sự kiện của Aply.",
    statusLabel: "Trạng thái đăng ký",
    statusValue: {
      SUBMITTED: "Đã tiếp nhận",
      INTERVIEW: "Đang phỏng vấn",
      ACCEPTED: "Trúng tuyển",
      REJECTED: "Không trúng tuyển",
      WITHDRAWN: "Đã hủy đăng ký"
    },
    backToDetail: "Quay lại trang chương trình",
    resumeSectionLabel: "CV dùng để đăng ký",
    resumeSelectHint:
      "Hãy chọn CV để đội ngũ xem xét. Nếu cần bổ sung, nhấn \"Sửa\" bên cạnh để chỉnh sửa ngay.",
    resumeEditLink: "Sửa",
    nameLabel: "Họ tên",
    namePlaceholder: "Tên thật hoặc tên tiếng Hàn",
    birthDateLabel: "Ngày sinh",
    genderLabel: "Giới tính",
    genderOptionLabel: { FEMALE: "Nữ", MALE: "Nam" },
    nationalityLabel: "Quốc tịch",
    nationalityPlaceholder: "VD) Việt Nam",
    phoneLabel: "Số điện thoại",
    phonePlaceholder: "VD) 010-1234-5678",
    emailLabel: "Email",
    emailPlaceholder: "VD) name@email.com",
    addressLabel: "Địa chỉ hiện tại",
    addressPlaceholder: "VD) Jongno-gu, Seoul",
    koreaStayLabel: "Thời gian sống ở Hàn Quốc",
    koreaStayOptionLabel: { LT_1Y: "Dưới 1 năm", Y1_2: "1–2 năm", Y2_3: "2–3 năm", Y3_5: "3–5 năm", GTE_5Y: "Trên 5 năm" },
    universityLabel: "Trường đại học",
    universityPlaceholder: "Trường đang học / đã tốt nghiệp",
    majorLabel: "Chuyên ngành",
    majorPlaceholder: "VD) Quản trị kinh doanh",
    gradeLabel: "Tình trạng học vấn",
    gradeOptionLabel: { UNDERGRAD_4: "Đại học", GRAD: "Cao học", GRADUATED: "Đã tốt nghiệp" },
    topikLabel: "Cấp độ TOPIK",
    topikNote: "※ Chỉ nhận TOPIK cấp 4 trở lên",
    topikOptionLabel: { "4": "Cấp 4", "5": "Cấp 5", "6": "Cấp 6" },
    referralLabel: "Bạn biết đến chương trình qua đâu?",
    referralOptionLabel: { FRIEND: "Người quen giới thiệu", SNS: "Mạng xã hội (Instagram, v.v.)", SCHOOL: "Trường / thông báo trong trường", SEARCH: "Tìm kiếm trên mạng", OTHER: "Khác" },
    referralOtherPlaceholder: "Vui lòng ghi rõ (từ khóa tìm kiếm, v.v.)",
    graduationLabel: "Ngày tốt nghiệp / dự kiến tốt nghiệp",
    graduationNote:
      "Nếu đang học, hãy ghi ngày dự kiến tốt nghiệp; nếu đã tốt nghiệp, hãy ghi thời điểm tốt nghiệp.",
    graduationPlaceholder: "VD) Tháng 3 năm 2026",
    visaTypeLabel: "Tư cách lưu trú",
    visaTypeNote: "※ Chỉ người giữ (hoặc sắp giữ) visa D-2, D-10 mới đăng ký được",
    visaOptionLabel: {
      "D-2": "D-2 (du học) · dự kiến tốt nghiệp tháng 9",
      "D-10": "D-10 (tìm việc)",
      OTHER: "Khác"
    },
    visaOtherPlaceholder: "Nhập mã visa bạn đang giữ",
    healthLabel: "Lưu ý sức khỏe (bệnh nền, dị ứng, thói quen ăn uống, v.v.)",
    healthPlaceholder: "VD) dị ứng hải sản có vỏ, huyết áp thấp, ăn chay...",
    desiredJobLabel: "Vị trí mong muốn",
    desiredJobOptionLabel: {
      MARKETING: "Marketing",
      SALES: "Kinh doanh",
      TRANSLATION: "Biên/phiên dịch",
      DEV: "Lập trình",
      OTHER: "Khác"
    },
    desiredJobOtherPlaceholder: "Nhập vị trí mong muốn",
    motivationLabel: "Vì sao bạn đăng ký chương trình thực tập tại doanh nghiệp?",
    motivationPlaceholder: "Hãy viết chi tiết lý do đăng ký.",
    motivationHelp: "Vui lòng viết từ 20 ký tự trở lên.",
    marketingHeading:
      "Bạn có muốn nhận thông tin về đào tạo hướng dẫn viên cho người nước ngoài / cơ hội freelance của Seoul Global Center không?",
    marketingBody: "",
    marketingYes: "Có, tôi muốn nhận thông tin",
    marketingNo: "Không, cảm ơn",
    privacyHeading: "Đồng ý thu thập và sử dụng thông tin cá nhân (bắt buộc)",
    privacyBody:
      "Mục thu thập: họ tên, số điện thoại, quốc tịch, email... (bắt buộc) / trường·chuyên ngành... (tùy chọn)\n" +
      "Mục đích: thông báo lịch chương trình · liên hệ công việc · giới thiệu chương trình sau này\n" +
      "Thời gian lưu trữ: 2 năm\n\n" +
      "Bạn có quyền từ chối, nhưng việc từ chối có thể hạn chế tham gia.",
    privacyAgree: "Tôi đồng ý với nội dung trên",
    preTrainingTitle: "Xác nhận tham gia đào tạo trước",
    preTrainingNotice: [
      "Kết quả tuyển chọn cuối cùng sẽ được công bố vào thứ Hai, ngày 29/6.",
      "Người trúng tuyển bắt buộc tham gia buổi đào tạo trước diễn ra ngay hôm sau (thứ Ba, 30/6)."
    ],
    preTrainingQuestion: "Bạn có thể tham gia lịch đào tạo trước không?",
    preTrainingAgree: "Có, tôi có thể tham gia đào tạo trước và sẽ tham gia nếu trúng tuyển.",
    submit: "Gửi đơn đăng ký",
    submitting: "Đang gửi...",
    errRequired: "Vui lòng điền đầy đủ các mục bắt buộc.",
    errRetry: "Đã xảy ra lỗi — vui lòng thử lại.",
    successTitle: "Đã nhận đơn đăng ký",
    successBody:
      "Đội ngũ sẽ xem xét CV cùng câu trả lời của bạn và liên hệ về lịch phỏng vấn."
  };
  const ja: Copy = {
    ...ko,
    pageHeading: "プログラム応募",
    pageSubheading: "ソウルグローバルセンター × Aply 6週間就業体験プログラム応募",
    loginRequiredTitle: "Aply 会員のみ応募できます",
    loginRequiredBody:
      "応募には Aply の会員登録と履歴書が必要です。ログイン後、再度アクセスしてください。",
    loginCta: "ログイン / 登録",
    noResumeTitle: "まず履歴書を作成してください",
    noResumeBody: "SGC プログラムの応募には Aply 履歴書が必要です。1 分で作成して応募できます。",
    noResumeCta: "履歴書を作成",
    alreadyAppliedTitle: "すでに応募を受け付けました",
    alreadyAppliedBody:
      "1 ユーザーにつき 1 回応募できます。運営チームが確認後、個別にご連絡します。",
    notStudentTitle: "学生会員のみ応募できます",
    notStudentBody:
      "本プログラムは外国人留学生対象のため、STUDENT アカウントからのみ応募できます。学生アカウントで再度ログインしてください。",
    closedTitle: "募集が締め切られました",
    closedBody: "応募期間が終了しました。次回の募集案内は Aply イベントページでお知らせします。",
    statusLabel: "応募状況",
    statusValue: {
      SUBMITTED: "受付完了",
      INTERVIEW: "面接進行中",
      ACCEPTED: "合格",
      REJECTED: "不合格",
      WITHDRAWN: "応募取消"
    },
    backToDetail: "プログラムページに戻る",
    resumeSectionLabel: "応募に使う履歴書",
    resumeSelectHint:
      "運営チームが確認する履歴書を選択してください。補完が必要な場合は横の「修正」からすぐ編集できます。",
    resumeEditLink: "修正",
    nameLabel: "氏名",
    namePlaceholder: "本名または韓国語名",
    birthDateLabel: "生年月日",
    genderLabel: "性別",
    genderOptionLabel: { FEMALE: "女性", MALE: "男性" },
    nationalityLabel: "国籍",
    nationalityPlaceholder: "例) ベトナム",
    phoneLabel: "携帯番号",
    phonePlaceholder: "例) 010-1234-5678",
    emailLabel: "メール",
    emailPlaceholder: "例) name@email.com",
    addressLabel: "現住所",
    addressPlaceholder: "例) ソウル市鍾路区",
    koreaStayLabel: "韓国在住期間",
    koreaStayOptionLabel: { LT_1Y: "1年未満", Y1_2: "1〜2年", Y2_3: "2〜3年", Y3_5: "3〜5年", GTE_5Y: "5年以上" },
    universityLabel: "大学",
    universityPlaceholder: "在学/卒業した大学名",
    majorLabel: "専攻",
    majorPlaceholder: "例) 経営学科",
    gradeLabel: "学籍区分",
    gradeOptionLabel: { UNDERGRAD_4: "学部在学", GRAD: "大学院在学", GRADUATED: "卒業" },
    topikLabel: "TOPIK 等級",
    topikNote: "※ TOPIK 4級以上のみ応募可能",
    topikOptionLabel: { "4": "4級", "5": "5級", "6": "6級" },
    referralLabel: "このプログラムを知ったきっかけ",
    referralOptionLabel: { FRIEND: "知人の紹介", SNS: "SNS（Instagram など）", SCHOOL: "学校・学内のお知らせ", SEARCH: "インターネット検索", OTHER: "その他" },
    referralOtherPlaceholder: "きっかけをご記入ください（検索ワードなど）",
    graduationLabel: "卒業 / 卒業予定日",
    graduationNote: "在学中なら卒業予定日を、卒業済みなら卒業した時期をご記入ください。",
    graduationPlaceholder: "例) 2026年3月",
    visaTypeLabel: "在留資格",
    visaTypeNote: "※ D-2・D-10 ビザ保有者または取得予定者のみ応募可能",
    visaOptionLabel: {
      "D-2": "D-2（留学）· 9月卒業予定",
      "D-10": "D-10（求職）",
      OTHER: "その他"
    },
    visaOtherPlaceholder: "保有ビザコードを入力",
    healthLabel: "健康上の特記事項（持病・アレルギー・食習慣など）",
    healthPlaceholder: "例) 甲殻類アレルギー、低血圧、ベジタリアンなど",
    desiredJobLabel: "希望職務",
    desiredJobOptionLabel: {
      MARKETING: "マーケティング",
      SALES: "セールス",
      TRANSLATION: "通訳・翻訳",
      DEV: "開発",
      OTHER: "その他"
    },
    desiredJobOtherPlaceholder: "希望職務を入力",
    motivationLabel: "企業現場での就業体験になぜ応募しましたか？",
    motivationPlaceholder: "応募理由を詳しくご記入ください。",
    motivationHelp: "20 文字以上ご記入ください。",
    marketingHeading:
      "ソウルグローバルセンターの外国人ガイド教育 / フリーランス機会の情報を受け取りますか？",
    marketingBody: "",
    marketingYes: "はい、情報を受け取りたいです",
    marketingNo: "いいえ、希望しません",
    privacyHeading: "個人情報の収集および利用への同意（必須）",
    privacyBody:
      "収集項目：氏名、電話番号、国籍、メールなど（必須）/ 学校・専攻など（任意）\n" +
      "利用目的：プログラム日程案内 · 業務連絡 · 今後の事業案内\n" +
      "保有期間：2 年\n\n" +
      "同意を拒否する権利がありますが、拒否の場合は参加が制限されることがあります。",
    privacyAgree: "上記の内容に同意します",
    preTrainingTitle: "事前研修参加の確認",
    preTrainingNotice: [
      "企業現場就業体験の最終合格者は 6/29（月）に発表予定です。",
      "最終合格者は翌日（6/30、火）に行われる事前研修に必ず参加する必要があります。"
    ],
    preTrainingQuestion: "事前研修の日程に参加できますか？",
    preTrainingAgree: "はい、事前研修の日程に参加でき、合格時には必ず参加します。",
    submit: "応募する",
    submitting: "送信中...",
    errRequired: "必須項目をすべて入力してください。",
    errRetry: "しばらくしてから再度お試しください。",
    successTitle: "応募が完了しました",
    successBody: "運営チームが履歴書とともに応募を確認後、面接日程を個別にご案内します。"
  };
  const id: Copy = {
    ...ko,
    pageHeading: "Daftar program",
    pageSubheading: "Seoul Global Center × Aply · Program Magang 6 Minggu di Korea",
    loginRequiredTitle: "Hanya anggota Aply yang bisa mendaftar",
    loginRequiredBody:
      "Pendaftaran memerlukan akun Aply dan resume. Silakan masuk lalu kembali lagi.",
    loginCta: "Masuk / Daftar",
    noResumeTitle: "Buat resume terlebih dahulu",
    noResumeBody:
      "Resume Aply diperlukan untuk mendaftar program SGC. Hanya butuh 1 menit untuk membuat dan mendaftar.",
    noResumeCta: "Buat resume",
    alreadyAppliedTitle: "Pendaftaran sudah diterima",
    alreadyAppliedBody:
      "Satu pendaftaran per pengguna. Tim kami akan meninjau dan menghubungi Anda secara pribadi.",
    notStudentTitle: "Hanya untuk anggota pelajar",
    notStudentBody:
      "Program ini untuk mahasiswa asing, jadi pendaftaran hanya diterima dari akun STUDENT. Silakan masuk dengan akun pelajar.",
    closedTitle: "Pendaftaran ditutup",
    closedBody:
      "Masa pendaftaran telah berakhir. Putaran berikutnya akan diumumkan di halaman acara Aply.",
    statusLabel: "Status pendaftaran",
    statusValue: {
      SUBMITTED: "Diterima",
      INTERVIEW: "Sedang wawancara",
      ACCEPTED: "Lulus",
      REJECTED: "Tidak lolos",
      WITHDRAWN: "Dibatalkan"
    },
    backToDetail: "Kembali ke halaman program",
    resumeSectionLabel: "Resume untuk pendaftaran",
    resumeSelectHint:
      "Pilih resume yang akan ditinjau tim kami. Jika perlu diperbaiki, klik \"Edit\" di sebelahnya untuk langsung menyunting.",
    resumeEditLink: "Edit",
    nameLabel: "Nama",
    namePlaceholder: "Nama asli atau nama Korea",
    birthDateLabel: "Tanggal lahir",
    genderLabel: "Jenis kelamin",
    genderOptionLabel: { FEMALE: "Perempuan", MALE: "Laki-laki" },
    nationalityLabel: "Kewarganegaraan",
    nationalityPlaceholder: "Cth) Vietnam",
    phoneLabel: "Nomor ponsel",
    phonePlaceholder: "Cth) 010-1234-5678",
    emailLabel: "Email",
    emailPlaceholder: "Cth) name@email.com",
    addressLabel: "Alamat saat ini",
    addressPlaceholder: "Cth) Jongno-gu, Seoul",
    koreaStayLabel: "Lama tinggal di Korea",
    koreaStayOptionLabel: { LT_1Y: "Kurang dari 1 tahun", Y1_2: "1–2 tahun", Y2_3: "2–3 tahun", Y3_5: "3–5 tahun", GTE_5Y: "Lebih dari 5 tahun" },
    universityLabel: "Universitas",
    universityPlaceholder: "Universitas Anda (saat ini/dulu)",
    majorLabel: "Jurusan",
    majorPlaceholder: "Cth) Manajemen Bisnis",
    gradeLabel: "Status akademik",
    gradeOptionLabel: { UNDERGRAD_4: "Sarjana (S1)", GRAD: "Pascasarjana", GRADUATED: "Sudah lulus" },
    topikLabel: "Level TOPIK",
    topikNote: "※ Hanya untuk TOPIK level 4 ke atas",
    topikOptionLabel: { "4": "Level 4", "5": "Level 5", "6": "Level 6" },
    referralLabel: "Dari mana Anda tahu program ini?",
    referralOptionLabel: { FRIEND: "Rekomendasi kenalan", SNS: "Media sosial (Instagram, dll.)", SCHOOL: "Sekolah / pengumuman kampus", SEARCH: "Pencarian internet", OTHER: "Lainnya" },
    referralOtherPlaceholder: "Mohon sebutkan (kata kunci pencarian, dll.)",
    graduationLabel: "Tanggal lulus / perkiraan lulus",
    graduationNote:
      "Jika masih kuliah, isi perkiraan tanggal lulus; jika sudah lulus, isi kapan Anda lulus.",
    graduationPlaceholder: "Cth) Maret 2026",
    visaTypeLabel: "Status tinggal",
    visaTypeNote: "※ Hanya untuk pemegang (atau calon pemegang) visa D-2, D-10",
    visaOptionLabel: {
      "D-2": "D-2 (studi) · lulus September",
      "D-10": "D-10 (pencari kerja)",
      OTHER: "Lainnya"
    },
    visaOtherPlaceholder: "Masukkan kode visa Anda",
    healthLabel: "Catatan kesehatan (penyakit, alergi, pola makan, dll.)",
    healthPlaceholder: "Cth) alergi kerang, tekanan darah rendah, vegetarian",
    desiredJobLabel: "Posisi yang diinginkan",
    desiredJobOptionLabel: {
      MARKETING: "Marketing",
      SALES: "Sales",
      TRANSLATION: "Penerjemahan",
      DEV: "Pengembangan",
      OTHER: "Lainnya"
    },
    desiredJobOtherPlaceholder: "Masukkan posisi yang diinginkan",
    motivationLabel: "Mengapa Anda mendaftar magang di perusahaan ini?",
    motivationPlaceholder: "Tuliskan alasan pendaftaran Anda secara rinci.",
    motivationHelp: "Tulis minimal 20 karakter.",
    marketingHeading:
      "Ingin menerima info pelatihan pemandu asing / peluang freelance dari Seoul Global Center?",
    marketingBody: "",
    marketingYes: "Ya, kirimi saya informasi",
    marketingNo: "Tidak, terima kasih",
    privacyHeading: "Persetujuan pengumpulan & penggunaan data pribadi (wajib)",
    privacyBody:
      "Item wajib: nama, nomor telepon, kewarganegaraan, email, dll. (wajib) / sekolah·jurusan, dll. (opsional)\n" +
      "Tujuan: pemberitahuan jadwal program · komunikasi kerja · info program mendatang\n" +
      "Masa simpan: 2 tahun\n\n" +
      "Anda berhak menolak, tetapi penolakan dapat membatasi partisipasi.",
    privacyAgree: "Saya menyetujui ketentuan di atas",
    preTrainingTitle: "Konfirmasi kehadiran pra-pelatihan",
    preTrainingNotice: [
      "Hasil seleksi akhir akan diumumkan pada Senin, 29 Juni.",
      "Peserta terpilih wajib mengikuti pra-pelatihan yang diadakan keesokan harinya (Selasa, 30 Juni)."
    ],
    preTrainingQuestion: "Bisakah Anda menghadiri jadwal pra-pelatihan?",
    preTrainingAgree: "Ya, saya bisa hadir pra-pelatihan dan akan ikut jika lolos.",
    submit: "Kirim pendaftaran",
    submitting: "Mengirim...",
    errRequired: "Lengkapi semua kolom wajib.",
    errRetry: "Terjadi kesalahan — silakan coba lagi.",
    successTitle: "Pendaftaran diterima",
    successBody:
      "Tim kami akan meninjau resume + jawaban Anda dan menghubungi Anda dengan detail wawancara."
  };
  return { ko, en, "zh-CN": zhCN, vi, ja, id };
})();

type FormState =
  | "loading"
  | "unauth"
  | "not-student"
  | "closed"
  | "no-resume"
  | "already-applied"
  | "form"
  | "submitting"
  | "success";

export function SgcApplyPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const t = COPY[locale] ?? COPY.ko;
  const { isReady, isAuthenticated, user } = useAuthSession();

  const [state, setState] = useState<FormState>("loading");
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [application, setApplication] = useState<SgcApplication | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 폼 상태
  const [resumeId, setResumeId] = useState<string>("");
  // 기본 정보 (계정 prefill)
  const [applicantName, setApplicantName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<SgcGender | "">("");
  const [nationality, setNationality] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [koreaStayDuration, setKoreaStayDuration] = useState<SgcKoreaStay | "">("");
  // 학력
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [grade, setGrade] = useState<SgcGrade | "">("");
  const [graduationDate, setGraduationDate] = useState("");
  const [topikLevel, setTopikLevel] = useState<SgcTopikLevel | "">("");
  // 경로
  const [referralSource, setReferralSource] = useState<SgcReferralSource | "">("");
  const [referralOther, setReferralOther] = useState("");
  const [visaType, setVisaType] = useState<SgcVisaType | "">("");
  const [visaOther, setVisaOther] = useState("");
  const [healthNote, setHealthNote] = useState("");
  const [desiredJob, setDesiredJob] = useState<SgcDesiredJob | "">("");
  const [desiredJobOther, setDesiredJobOther] = useState("");
  const [motivation, setMotivation] = useState("");
  const [marketingOptIn, setMarketingOptIn] = useState<"" | "yes" | "no">("");
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [preTrainingAgreed, setPreTrainingAgreed] = useState(false);

  // 인증 + 역할 + 모집 마감 + 이력서 + 기존 지원 상태 우선순위 조회.
  // 우선순위:
  //   (1) 모집 마감 → "closed" (가장 단호한 메시지, 모든 분기보다 위)
  //   (2) 비로그인 → "unauth"
  //   (3) STUDENT 아님 → "not-student"
  //   (4) 이미 지원 → "already-applied"
  //   (5) 이력서 없음 → "no-resume"
  //   (6) 그 외 → "form"
  useEffect(() => {
    if (!isReady) return;
    // (1) 마감 — 인증 여부와 무관하게 가장 먼저 차단.
    if (isSgcRecruitClosed()) {
      setState("closed");
      return;
    }
    // (2) 비로그인.
    if (!isAuthenticated) {
      setState("unauth");
      return;
    }
    // (3) 학생이 아닌 역할(파트너/운영자).
    if (user && user.role !== "STUDENT") {
      setState("not-student");
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const [resumeList, existing] = await Promise.all([
          getMyResumes().catch(() => []),
          getMySgcApplication().catch(() => null)
        ]);
        if (cancelled) return;
        if (existing) {
          setApplication(existing);
          setState("already-applied");
          return;
        }
        if (!resumeList || resumeList.length === 0) {
          setState("no-resume");
          return;
        }
        setResumes(resumeList);
        // 기본값: 대표 이력서 우선, 없으면 첫 번째.
        const primary = resumeList.find((r) => r.isPrimary) ?? resumeList[0];
        setResumeId(primary.id);
        setState("form");
      } catch {
        if (!cancelled) {
          setError(t.errRetry);
          setState("form");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, user, t.errRetry]);

  // 계정 정보로 기본 항목 prefill — 비어 있을 때만 채워 사용자가 직접 고친 값은
  // 보존한다. (이름·생년월일·성별·이메일·전화는 세션에서 제공.)
  useEffect(() => {
    if (!user) return;
    setApplicantName((v) => v || user.realName || user.name || "");
    setBirthDate((v) => v || (user.birthDate ?? "").slice(0, 10));
    setGender((v) => v || (user.gender === "FEMALE" || user.gender === "MALE" ? user.gender : ""));
    setEmail((v) => v || (user.email ?? ""));
    setPhone((v) => v || (user.phoneNumber ?? ""));
  }, [user]);

  // 폼 검증 — 필수 항목 모두 채워졌고 동의가 잡혔는지.
  const canSubmit = useMemo(() => {
    if (state !== "form" && state !== "submitting") return false;
    if (!resumeId) return false;
    if (!applicantName.trim()) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return false;
    if (!gender) return false;
    if (!nationality.trim()) return false;
    if (!phone.trim()) return false;
    if (!email.trim()) return false;
    if (!address.trim()) return false;
    if (!koreaStayDuration) return false;
    if (!university.trim()) return false;
    if (!major.trim()) return false;
    if (!grade) return false;
    if (!graduationDate.trim()) return false;
    if (!topikLevel) return false;
    if (!referralSource) return false;
    if (referralSource === "OTHER" && !referralOther.trim()) return false;
    if (!visaType) return false;
    if (visaType === "OTHER" && !visaOther.trim()) return false;
    if (!healthNote.trim()) return false;
    if (!desiredJob) return false;
    if (desiredJob === "OTHER" && !desiredJobOther.trim()) return false;
    if (motivation.trim().length < 20) return false;
    if (!marketingOptIn) return false;
    if (!privacyAgreed) return false;
    if (!preTrainingAgreed) return false;
    return true;
  }, [
    state,
    resumeId,
    applicantName,
    birthDate,
    gender,
    nationality,
    phone,
    email,
    address,
    koreaStayDuration,
    university,
    major,
    grade,
    graduationDate,
    topikLevel,
    referralSource,
    referralOther,
    visaType,
    visaOther,
    healthNote,
    desiredJob,
    desiredJobOther,
    motivation,
    marketingOptIn,
    privacyAgreed,
    preTrainingAgreed
  ]);

  async function submit() {
    if (!canSubmit) {
      setError(t.errRequired);
      return;
    }
    setState("submitting");
    setError(null);
    try {
      const result = await submitSgcApplication({
        resumeId,
        applicantName: applicantName.trim(),
        birthDate: birthDate.trim(),
        gender: gender as SgcGender,
        nationality: nationality.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        koreaStayDuration: koreaStayDuration as SgcKoreaStay,
        university: university.trim(),
        major: major.trim(),
        grade: grade as SgcGrade,
        expectedGraduation: graduationDate.trim(),
        topikLevel: topikLevel as SgcTopikLevel,
        visaType: visaType as SgcVisaType,
        visaOther: visaType === "OTHER" ? visaOther.trim() : undefined,
        healthNote: healthNote.trim(),
        desiredJob: desiredJob as SgcDesiredJob,
        desiredJobOther: desiredJob === "OTHER" ? desiredJobOther.trim() : undefined,
        motivation: motivation.trim(),
        referralSource: referralSource as SgcReferralSource,
        referralOther:
          referralSource === "OTHER" || referralSource === "SEARCH" ? referralOther.trim() || undefined : undefined,
        marketingOptIn: marketingOptIn === "yes",
        privacyConsent: true,
        preTrainingConsent: true,
        locale
      });
      setApplication(result.application);
      // 서버가 unique([userId]) 충돌을 P2002 로 받아 alreadyApplied=true 로
      // 돌려주면, "이미 접수됐어요" 화면으로 안내. 사용자가 두 탭을 열어 두
      // 번 submit 한 경우 등에 자연스럽게 작동.
      setState(result.alreadyApplied ? "already-applied" : "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errRetry);
      setState("form");
    }
  }

  // 폼 화면에서만 모바일 하단 고정 제출 바가 뜨므로, 그 상태에서만 푸터/마지막
  // 입력이 바(높이 ≈ 73px)에 가리지 않도록 페이지 하단 클리어런스를 준다.
  const hasMobileSubmitBar = state === "form" || state === "submitting";

  return (
    <div
      className={`min-h-screen flex flex-col bg-background font-sans text-foreground antialiased ${
        hasMobileSubmitBar ? "pb-[76px] md:pb-0" : ""
      }`}
    >
      <Header />
      <main className="flex-1">
        <section className="container py-10 md:py-14">
          <div className="mx-auto max-w-4xl">
            <header className="mb-8 md:mb-10">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Seoul Global Center × Aply
              </p>
              <h1 className={`${paperlogy.className} mt-2 text-3xl font-black tracking-[-0.03em] text-black md:text-4xl`}>
                {t.pageHeading}
              </h1>
              <p className="mt-2 text-sm text-slate-600 md:text-base">{t.pageSubheading}</p>
            </header>

            {state === "loading" ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : null}

            {state === "closed" ? (
              <GateCard
                icon={<Warning className="h-6 w-6" weight="bold" />}
                title={t.closedTitle}
                body={t.closedBody}
                cta={
                  <Link
                    href="/events/seoul-global-center"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground"
                  >
                    {t.backToDetail}
                  </Link>
                }
              />
            ) : null}

            {state === "unauth" ? (
              <GateCard
                icon={<Warning className="h-6 w-6" weight="bold" />}
                title={t.loginRequiredTitle}
                body={t.loginRequiredBody}
                cta={
                  <Link
                    href={`/login?next=${encodeURIComponent("/events/seoul-global-center/apply")}`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
                  >
                    {t.loginCta}
                    <ArrowRight className="h-4 w-4" weight="bold" />
                  </Link>
                }
              />
            ) : null}

            {state === "not-student" ? (
              <GateCard
                icon={<Warning className="h-6 w-6" weight="bold" />}
                title={t.notStudentTitle}
                body={t.notStudentBody}
                cta={
                  <Link
                    href="/events/seoul-global-center"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground"
                  >
                    {t.backToDetail}
                  </Link>
                }
              />
            ) : null}

            {state === "no-resume" ? (
              <GateCard
                icon={<FileText className="h-6 w-6" weight="bold" />}
                title={t.noResumeTitle}
                body={t.noResumeBody}
                cta={
                  <Link
                    href={`/resume/new/edit?next=${encodeURIComponent("/events/seoul-global-center/apply")}`}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
                  >
                    {t.noResumeCta}
                    <ArrowRight className="h-4 w-4" weight="bold" />
                  </Link>
                }
              />
            ) : null}

            {state === "already-applied" && application ? (
              <GateCard
                icon={<CheckCircle className="h-6 w-6" weight="bold" />}
                title={t.alreadyAppliedTitle}
                body={t.alreadyAppliedBody}
                extra={
                  <div className="mt-4 rounded-xl bg-muted/40 px-4 py-3 text-sm">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t.statusLabel}
                    </p>
                    <p className="mt-1 font-display text-base font-bold">
                      {t.statusValue[application.status] ?? application.status}
                    </p>
                  </div>
                }
                cta={
                  <Link
                    href="/events/seoul-global-center"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground"
                  >
                    {t.backToDetail}
                  </Link>
                }
              />
            ) : null}

            {state === "success" ? (
              <GateCard
                icon={<CheckCircle className="h-6 w-6" weight="bold" />}
                title={t.successTitle}
                body={t.successBody}
                cta={
                  <button
                    type="button"
                    onClick={() => router.push("/events/seoul-global-center")}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition active:scale-[0.98]"
                  >
                    {t.backToDetail}
                  </button>
                }
              />
            ) : null}

            {state === "form" || state === "submitting" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
                className="space-y-6"
              >
                {/* 이력서 선택 */}
                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <label className="block text-sm font-bold text-foreground">
                    {t.resumeSectionLabel}
                    <span className="ml-0.5 text-rose-500" aria-hidden>*</span>
                  </label>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">{t.resumeSelectHint}</p>
                  <div className="mt-3 space-y-2">
                    {resumes.map((r) => {
                      const checked = resumeId === r.id;
                      // 카드 전체는 div — 라디오 선택은 좌측 label 영역에만,
                      // 우측 "수정" 링크는 별도 Link 로 클릭 충돌 없이 분리.
                      // 편집 후 돌아오기 위해 ?next= 동봉.
                      return (
                        <div
                          key={r.id}
                          className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-border/60 bg-white hover:border-primary/40"
                          }`}
                        >
                          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                            <input
                              type="radio"
                              name="sgc-resume"
                              value={r.id}
                              checked={checked}
                              onChange={() => setResumeId(r.id)}
                              className="h-4 w-4"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold">{r.title}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {r.isPrimary ? "★ " : ""}
                                {new Date(r.updatedAt).toLocaleDateString("ko-KR")}
                              </p>
                            </div>
                          </label>
                          <Link
                            href={`/resume/${r.id}/edit?next=${encodeURIComponent(
                              "/events/seoul-global-center/apply"
                            )}`}
                            className="shrink-0 rounded-lg border border-border/60 bg-white px-3 py-1.5 text-[12px] font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
                          >
                            {t.resumeEditLink}
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* 이름 */}
                <FormSection title={t.nameLabel} required>
                  <input className={INPUT_CLS} value={applicantName} onChange={(e) => setApplicantName(e.target.value)} placeholder={t.namePlaceholder} maxLength={80} />
                </FormSection>

                {/* 생년월일 */}
                <FormSection title={t.birthDateLabel} required>
                  <input type="date" className={INPUT_CLS} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} max="2015-12-31" />
                </FormSection>

                {/* 성별 */}
                <FormSection title={t.genderLabel} required>
                  <div className="space-y-2">
                    {GENDER_OPTIONS.map((opt) => (
                      <RadioRow key={opt} name="sgc-gender" value={opt} checked={gender === opt} label={t.genderOptionLabel[opt]} onChange={() => setGender(opt)} />
                    ))}
                  </div>
                </FormSection>

                {/* 국적 */}
                <FormSection title={t.nationalityLabel} required>
                  <input className={INPUT_CLS} value={nationality} onChange={(e) => setNationality(e.target.value)} placeholder={t.nationalityPlaceholder} maxLength={60} />
                </FormSection>

                {/* 휴대폰 번호 */}
                <FormSection title={t.phoneLabel} required>
                  <input className={INPUT_CLS} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phonePlaceholder} maxLength={40} inputMode="tel" />
                </FormSection>

                {/* 이메일 */}
                <FormSection title={t.emailLabel} required>
                  <input type="email" className={INPUT_CLS} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.emailPlaceholder} maxLength={120} inputMode="email" />
                </FormSection>

                {/* 현재 거주 주소 */}
                <FormSection title={t.addressLabel} required>
                  <input className={INPUT_CLS} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t.addressPlaceholder} maxLength={200} />
                </FormSection>

                {/* 한국 거주 기간 */}
                <FormSection title={t.koreaStayLabel} required>
                  <div className="space-y-2">
                    {KOREA_STAY_OPTIONS.map((opt) => (
                      <RadioRow key={opt} name="sgc-korea-stay" value={opt} checked={koreaStayDuration === opt} label={t.koreaStayOptionLabel[opt]} onChange={() => setKoreaStayDuration(opt)} />
                    ))}
                  </div>
                </FormSection>

                {/* 대학교 */}
                <FormSection title={t.universityLabel} required>
                  <input className={INPUT_CLS} value={university} onChange={(e) => setUniversity(e.target.value)} placeholder={t.universityPlaceholder} maxLength={120} />
                </FormSection>

                {/* 전공 */}
                <FormSection title={t.majorLabel} required>
                  <input className={INPUT_CLS} value={major} onChange={(e) => setMajor(e.target.value)} placeholder={t.majorPlaceholder} maxLength={120} />
                </FormSection>

                {/* 학적 구분 */}
                <FormSection title={t.gradeLabel} required>
                  <div className="space-y-2">
                    {GRADE_OPTIONS.map((opt) => (
                      <RadioRow key={opt} name="sgc-grade" value={opt} checked={grade === opt} label={t.gradeOptionLabel[opt]} onChange={() => setGrade(opt)} />
                    ))}
                  </div>
                </FormSection>

                {/* 졸업 / 졸업 예정일 */}
                <FormSection title={t.graduationLabel} note={t.graduationNote} required>
                  <input
                    className={INPUT_CLS}
                    value={graduationDate}
                    onChange={(e) => setGraduationDate(e.target.value)}
                    placeholder={t.graduationPlaceholder}
                    maxLength={40}
                  />
                </FormSection>

                {/* TOPIK 등급 */}
                <FormSection title={t.topikLabel} note={t.topikNote} required>
                  <div className="space-y-2">
                    {TOPIK_OPTIONS.map((opt) => (
                      <RadioRow key={opt} name="sgc-topik" value={opt} checked={topikLevel === opt} label={t.topikOptionLabel[opt]} onChange={() => setTopikLevel(opt)} />
                    ))}
                  </div>
                </FormSection>

                {/* 체류자격 */}
                <FormSection title={t.visaTypeLabel} note={t.visaTypeNote} required>
                  <div className="space-y-2">
                    {VISA_OPTIONS.map((opt) => (
                      <RadioRow
                        key={opt}
                        name="sgc-visa"
                        value={opt}
                        checked={visaType === opt}
                        label={t.visaOptionLabel[opt]}
                        onChange={() => setVisaType(opt)}
                      />
                    ))}
                  </div>
                  {visaType === "OTHER" ? (
                    <input
                      className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={visaOther}
                      onChange={(e) => setVisaOther(e.target.value)}
                      placeholder={t.visaOtherPlaceholder}
                      maxLength={80}
                    />
                  ) : null}
                </FormSection>

                {/* 건강상 특이사항 */}
                <FormSection title={t.healthLabel} required>
                  <textarea
                    className="h-24 w-full rounded-xl border border-border bg-white p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={healthNote}
                    onChange={(e) => setHealthNote(e.target.value)}
                    placeholder={t.healthPlaceholder}
                    maxLength={2000}
                  />
                </FormSection>

                {/* 희망 직무 */}
                <FormSection title={t.desiredJobLabel} required>
                  <div className="space-y-2">
                    {DESIRED_JOB_OPTIONS.map((opt) => (
                      <RadioRow
                        key={opt}
                        name="sgc-desired"
                        value={opt}
                        checked={desiredJob === opt}
                        label={t.desiredJobOptionLabel[opt]}
                        onChange={() => setDesiredJob(opt)}
                      />
                    ))}
                  </div>
                  {desiredJob === "OTHER" ? (
                    <input
                      className="mt-3 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      value={desiredJobOther}
                      onChange={(e) => setDesiredJobOther(e.target.value)}
                      placeholder={t.desiredJobOtherPlaceholder}
                      maxLength={80}
                    />
                  ) : null}
                </FormSection>

                {/* 신청 동기 */}
                <FormSection title={t.motivationLabel} note={t.motivationHelp} required>
                  <textarea
                    className="h-40 w-full rounded-xl border border-border bg-white p-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    value={motivation}
                    onChange={(e) => setMotivation(e.target.value)}
                    placeholder={t.motivationPlaceholder}
                    maxLength={4000}
                  />
                  <p className="mt-1 text-right text-[11px] text-muted-foreground">
                    {motivation.length} / 4000
                  </p>
                </FormSection>

                {/* 알게 된 경로 */}
                <FormSection title={t.referralLabel} required>
                  <div className="space-y-2">
                    {REFERRAL_OPTIONS.map((opt) => (
                      <RadioRow key={opt} name="sgc-referral" value={opt} checked={referralSource === opt} label={t.referralOptionLabel[opt]} onChange={() => setReferralSource(opt)} />
                    ))}
                  </div>
                  {referralSource === "OTHER" || referralSource === "SEARCH" ? (
                    <input
                      className={`mt-3 ${INPUT_CLS}`}
                      value={referralOther}
                      onChange={(e) => setReferralOther(e.target.value)}
                      placeholder={t.referralOtherPlaceholder}
                      maxLength={120}
                    />
                  ) : null}
                </FormSection>

                {/* SGC 마케팅 동의 */}
                <FormSection title={t.marketingHeading} note={t.marketingBody} required>
                  <div className="space-y-2">
                    <RadioRow
                      name="sgc-marketing"
                      value="yes"
                      checked={marketingOptIn === "yes"}
                      label={t.marketingYes}
                      onChange={() => setMarketingOptIn("yes")}
                    />
                    <RadioRow
                      name="sgc-marketing"
                      value="no"
                      checked={marketingOptIn === "no"}
                      label={t.marketingNo}
                      onChange={() => setMarketingOptIn("no")}
                    />
                  </div>
                </FormSection>

                {/* 사전 교육 필수 참여 확인 — 안내문 + 질문 + 필수 동의 체크박스 */}
                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <p className="text-sm font-bold text-foreground">
                    {t.preTrainingTitle}
                    <span className="ml-0.5 text-rose-500" aria-hidden>*</span>
                  </p>
                  <ul className="mt-3 space-y-1.5 rounded-xl bg-amber-50/60 p-3">
                    {t.preTrainingNotice.map((line, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-amber-950/85">
                        <span aria-hidden className="mt-[7px] inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm font-semibold text-foreground">{t.preTrainingQuestion}</p>
                  <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-xl border border-border/60 p-3 transition hover:border-primary/40">
                    <input
                      type="checkbox"
                      checked={preTrainingAgreed}
                      onChange={(e) => setPreTrainingAgreed(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span className="text-sm font-semibold leading-relaxed">{t.preTrainingAgree}</span>
                  </label>
                </section>

                {/* 개인정보 동의 */}
                <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
                  <p className="text-sm font-bold">
                    {t.privacyHeading}
                    <span className="ml-0.5 text-rose-500" aria-hidden>*</span>
                  </p>
                  <pre className="mt-3 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-xl bg-muted/40 p-3 font-sans text-[12.5px] leading-relaxed text-foreground/85">
                    {t.privacyBody}
                  </pre>
                  <label className="mt-3 flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={privacyAgreed}
                      onChange={(e) => setPrivacyAgreed(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-semibold">{t.privacyAgree}</span>
                  </label>
                </section>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                {/* 데스크탑 인라인 제출 — 모바일은 하단 고정 바로 대체(md:hidden). */}
                <button
                  type="submit"
                  disabled={!canSubmit || state === "submitting"}
                  className="hidden h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] md:flex"
                >
                  {state === "submitting" ? t.submitting : t.submit}
                  {state === "submitting" ? null : <ArrowRight className="h-4 w-4" weight="bold" />}
                </button>
              </form>
            ) : null}
          </div>
        </section>
      </main>

      {/* 모바일 하단 고정 제출 바 — 긴 폼을 끝까지 스크롤하지 않아도 제출 가능.
          form 밖의 sibling 이라 submit() 을 직접 호출. 이벤트 페이지의 sticky
          CTA 와 동일한 톤(backdrop-blur + 상단 border). 데스크탑은 인라인 버튼. */}
      {hasMobileSubmitBar ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit || state === "submitting"}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99]"
          >
            {state === "submitting" ? t.submitting : t.submit}
            {state === "submitting" ? null : <ArrowRight className="h-4 w-4" weight="bold" />}
          </button>
        </div>
      ) : null}

      <Footer />
    </div>
  );
}

// ---- Helpers ---------------------------------------------------------------

function GateCard({
  icon,
  title,
  body,
  extra,
  cta
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  extra?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-border/40 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <h2 className="mt-4 font-display text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
      {extra}
      {cta ? <div className="mt-6">{cta}</div> : null}
    </article>
  );
}

function FormSection({
  title,
  note,
  required,
  children
}: {
  title: string;
  note?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p className="text-sm font-bold text-foreground">
        {title}
        {required ? <span className="ml-0.5 text-rose-500" aria-hidden>*</span> : null}
      </p>
      {note ? <p className="mt-1 text-[12.5px] text-muted-foreground">{note}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function RadioRow({
  name,
  value,
  checked,
  label,
  onChange
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
        checked ? "border-primary bg-primary/5" : "border-border/60 bg-white hover:border-primary/40"
      }`}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4" />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );
}
