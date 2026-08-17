"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle, Gift, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Reveal } from "../site/Reveal";
import { Button } from "../ui/button";
import { useToast } from "../toast/ToastProvider";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { paperlogy } from "../../lib/fonts";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  submitHanpassSurvey,
  type HanpassAvailableFrom,
  type HanpassJobField,
  type HanpassJobIntent,
  type HanpassLanguage,
  type HanpassVisaType,
  type HanpassWantsConsulting
} from "../../lib/hanpass-event-client";

// ---------------------------------------------------------------------------
// /events/hanpass — Hanpass × Aply 취업 지원 확인 이벤트.
// Hanpass 이용자(한국 거주 외국인)에게 문자로 전달되는 링크로 접속 → 인페이지
// 설문 작성 → 이력서 첨삭/취업 컨설팅을 원하면 회원가입/로그인 안내.
// 이용자가 외국인이므로 6개 로케일(ko/en/zh-CN/vi/ja/id) 전체 번역 제공.
// 옵션 value(백엔드 전송 코드)는 고정하고 라벨만 로케일별로 번역한다.
// ---------------------------------------------------------------------------

// 이력서 첨삭 신청은 회원가입/로그인이 전제. 가입·로그인 후 다시 이 페이지로 복귀.
// `?next=/events/...` 는 SignupPage 에서 계정 유형 선택을 건너뛰는 원탭 가입 플로우.
const SIGNUP_HREF = "/signup?next=%2Fevents%2Fhanpass";
const LOGIN_HREF = "/login?next=%2Fevents%2Fhanpass";

// 같은 기기에서 이미 응답했는지 기억(소프트). 하드 차단이 아니라 안내용 —
// '다시 응답하기'로 수정 가능하고, 서버가 전화번호 기준으로 업서트한다.
const RESPONDED_STORAGE_KEY = "aply_hanpass_responded";

// 옵션 순서(고정). 라벨은 Copy 의 *Labels 레코드에서 로케일별로 가져온다.
const JOB_INTENT_VALUES: HanpassJobIntent[] = ["active_seeking", "open_to_offers", "not_seeking", "unsure"];
const AVAILABLE_FROM_VALUES: HanpassAvailableFrom[] = ["immediately", "within_1m", "within_3m", "undecided", "not_available"];
const JOB_FIELD_VALUES: HanpassJobField[] = [
  "manufacturing",
  "logistics",
  "service",
  "office",
  "translation",
  "it",
  "design_marketing",
  "research",
  "other"
];
const VISA_VALUES: HanpassVisaType[] = ["D-2", "D-4", "D-10", "E-7", "F-2", "F-4", "F-5", "F-6", "other", "unsure"];
const WANTS_VALUES: HanpassWantsConsulting[] = ["yes", "info_only", "unsure"];
const LANGUAGE_VALUES: HanpassLanguage[] = ["ko", "en"];

type Copy = {
  pill: string;
  title: string;
  heroDesc: string;
  deadline: string;
  benefit: string; // "{deadline}" 치환
  benefitsHeading: string;
  benefits: { title: string; desc: string }[]; // 4개
  qName: string;
  qNamePh: string;
  qPhone: string;
  qPhonePh: string;
  qEmail: string;
  qEmailPh: string;
  qJobIntent: string;
  qAvailable: string;
  qJobFields: string;
  qJobFieldsHint: string;
  qJobFieldOtherPh: string;
  qVisa: string;
  qWants: string;
  qWantsHint: string; // "{deadline}" 치환
  qWantsAuthNote: string;
  qLanguages: string;
  qLanguagesHint: string;
  qPrivacy: string;
  jobIntentLabels: Record<HanpassJobIntent, string>;
  availableFromLabels: Record<HanpassAvailableFrom, string>;
  jobFieldLabels: Record<HanpassJobField, string>;
  visaLabels: Record<HanpassVisaType, string>;
  wantsLabels: Record<HanpassWantsConsulting, string>;
  languageLabels: Record<HanpassLanguage, string>;
  privacyNotice: string;
  consentAgree: string;
  consentDisagree: string;
  submit: string;
  submitting: string;
  unsubscribePre: string;
  unsubscribeLink: string;
  unsubscribePost: string;
  // validation toast
  vName: string;
  vPhone: string;
  vEmail: string;
  vJobIntent: string;
  vAvailable: string;
  vJobFields: string;
  vJobFieldOther: string;
  vVisa: string;
  vWants: string;
  vLanguages: string;
  vConsent: string;
  vSubmitFail: string;
  // completion
  thanksTitle: string;
  thanksBody: string;
  doneAuthedTitle: string;
  doneAuthedBody: string;
  doneApplicantTitle: string;
  doneApplicantBody: string;
  doneNonApplicantBody: string;
  ctaBrowse: string;
  ctaSignupComplete: string;
  ctaLogin: string;
  ctaSignup: string;
  // 같은 기기에서 이미 응답한 경우
  alreadyTitle: string;
  alreadyBody: string;
  ctaRespondAgain: string;
};

const COPY: Record<PlatformLocale, Copy> = {
  ko: {
    pill: "Hanpass × Aply",
    title: "Hanpass 이용자 취업 지원 확인",
    heroDesc:
      "Aply는 Hanpass와 함께 한국에서 취업을 희망하는 외국인 분들께 채용 정보, 이력서 첨삭, 취업 상담 안내를 도와드리고 있습니다.\n\n현재 구직 또는 이직 희망 여부와 취업 지원 필요 여부를 확인하기 위한 설문입니다. 응답은 약 30초~1분 정도 소요됩니다.",
    deadline: "2026년 6월 26일(금)",
    benefit: "{deadline}까지 응답해 주신 분 중 선착순 10명에게 이력서 첨삭 및 취업 컨설팅을 우선 제공해 드립니다.",
    benefitsHeading: "응답 후 받을 수 있는 안내",
    benefits: [
      { title: "채용 정보 안내", desc: "응답 내용을 바탕으로 현재 지원 가능한 채용 정보를 안내드릴 수 있습니다." },
      { title: "이력서 작성 및 첨삭 도움", desc: "선착순 10명에게 한국 기업 지원에 필요한 이력서 첨삭과 작성 방향을 우선 안내드립니다." },
      { title: "취업 준비 및 컨설팅", desc: "선착순 대상자에게 면접 준비, 직무 선택, 한국 회사 지원 과정에 대한 컨설팅을 우선 제공드립니다." },
      { title: "본인에게 맞는 일자리 안내", desc: "비자, 경력, 희망 직무에 맞는 기회가 있을 때 순차적으로 안내드릴 수 있습니다." }
    ],
    qName: "이름",
    qNamePh: "예: 홍길동",
    qPhone: "연락 가능한 전화번호",
    qPhonePh: "010으로 시작하는 11자리, 예: 01012345678",
    qEmail: "이메일 주소",
    qEmailPh: "ㅇㅇㅇㅇ@ㅇㅇㅇ.com",
    qJobIntent: "현재 구직 또는 이직을 희망하시나요?",
    qAvailable: "언제부터 근무가 가능하신가요?",
    qJobFields: "희망하시는 일자리 분야를 선택해 주세요.",
    qJobFieldsHint: "복수 선택 가능",
    qJobFieldOtherPh: "기타 희망 분야를 입력해 주세요.",
    qVisa: "보유 중인 비자 종류를 선택해 주세요.",
    qWants: "이력서 첨삭 및 취업 컨설팅을 신청하시겠어요?",
    qWantsHint: "{deadline}까지 응답자 중 선착순 10명 우선 제공",
    qWantsAuthNote: "이력서 첨삭 신청은 회원가입 또는 로그인 후 완료됩니다. 설문을 제출하면 다음 단계에서 안내해 드려요.",
    qLanguages: "상담이 가능한 언어를 선택해 주세요.",
    qLanguagesHint: "복수 선택 가능",
    qPrivacy: "개인정보 활용에 동의해 주세요.",
    jobIntentLabels: {
      active_seeking: "네, 적극적으로 구직 중이에요",
      open_to_offers: "네, 좋은 기회가 있으면 이직·취업을 희망해요",
      not_seeking: "아니요, 현재는 구직 의향이 없어요",
      unsure: "아직 잘 모르겠어요"
    },
    availableFromLabels: {
      immediately: "즉시 가능",
      within_1m: "1개월 이내",
      within_3m: "3개월 이내",
      undecided: "아직 미정",
      not_available: "현재는 근무가 가능하지 않아요"
    },
    jobFieldLabels: {
      manufacturing: "제조/생산",
      logistics: "물류/창고",
      service: "서비스/매장",
      office: "사무/관리",
      translation: "통번역",
      it: "IT/개발",
      design_marketing: "디자인/마케팅",
      research: "연구/전문직",
      other: "기타"
    },
    visaLabels: {
      "D-2": "D-2 유학",
      "D-4": "D-4 어학연수",
      "D-10": "D-10 구직",
      "E-7": "E-7 특정활동",
      "F-2": "F-2 거주",
      "F-4": "F-4 재외동포",
      "F-5": "F-5 영주",
      "F-6": "F-6 결혼이민",
      other: "기타",
      unsure: "잘 모르겠어요"
    },
    wantsLabels: {
      yes: "네, 신청하고 싶어요",
      info_only: "아니요, 채용 정보 안내만 받고 싶어요",
      unsure: "아직 잘 모르겠어요"
    },
    languageLabels: { ko: "한국어", en: "영어" },
    privacyNotice:
      "입력하신 정보는 플리퍼스(Aply)가 Hanpass 연계 취업 지원, 채용 정보 안내, 채용 매칭, 이력서 첨삭 및 취업 컨설팅 제공을 위해 수집·이용하며, 향후 적합한 채용 기회와 Aply의 취업 지원 서비스 안내를 위해 보관 및 활용될 수 있습니다.\n\n개인정보 활용에 동의하지 않으시는 경우 설문 제출 및 취업 지원 안내가 제한될 수 있습니다.",
    consentAgree: "동의합니다",
    consentDisagree: "동의하지 않습니다",
    submit: "설문 제출하기",
    submitting: "제출 중…",
    unsubscribePre: "문자 수신을 원하지 않으시면 ",
    unsubscribeLink: "수신거부 의사",
    unsubscribePost: "를 남겨주세요.",
    vName: "이름을 입력해 주세요.",
    vPhone: "연락 가능한 휴대폰 번호를 정확히 입력해 주세요. (예: 01012345678)",
    vEmail: "이메일 주소를 정확히 입력해 주세요.",
    vJobIntent: "구직 또는 이직 희망 여부를 선택해 주세요.",
    vAvailable: "근무 가능 시점을 선택해 주세요.",
    vJobFields: "희망하는 일자리 분야를 한 가지 이상 선택해 주세요.",
    vJobFieldOther: "기타 분야를 선택하셨다면 내용을 입력해 주세요.",
    vVisa: "보유 중인 비자 종류를 선택해 주세요.",
    vWants: "이력서 첨삭 및 취업 컨설팅 신청 여부를 선택해 주세요.",
    vLanguages: "상담 가능한 언어를 선택해 주세요.",
    vConsent: "개인정보 활용에 동의해야 설문을 제출할 수 있습니다.",
    vSubmitFail: "설문 제출에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    thanksTitle: "응답해주셔서 감사합니다.",
    thanksBody: "Aply가 응답 내용을 확인한 뒤 필요한 경우 순차적으로 안내드리겠습니다.",
    doneAuthedTitle: "이력서 첨삭 신청이 접수되었습니다.",
    doneAuthedBody: "선착순 10명 안내 대상은 운영팀이 응답을 확인한 뒤 개별적으로 연락드립니다.",
    doneApplicantTitle: "이력서 첨삭 신청은 한 단계가 남았어요!",
    doneApplicantBody:
      "이력서 첨삭 신청은 회원가입 또는 로그인 후 완료됩니다. 선착순 10명 안내 대상은 운영팀이 응답을 확인한 뒤 개별적으로 연락드립니다.",
    doneNonApplicantBody:
      "Aply에서 더 많은 채용 정보를 확인하고 싶으시면 회원가입 후 맞춤 채용 정보를 받아보실 수 있어요.",
    ctaBrowse: "채용 정보 둘러보기",
    ctaSignupComplete: "회원가입 하고 신청 완료",
    ctaLogin: "이미 계정이 있어요 (로그인)",
    ctaSignup: "회원가입 하기",
    alreadyTitle: "이미 응답을 보내주셨어요",
    alreadyBody: "이 기기에서 이미 Hanpass 취업 지원 설문에 응답하셨습니다. 답변을 수정하시려면 다시 응답할 수 있어요.",
    ctaRespondAgain: "다시 응답하기"
  },
  en: {
    pill: "Hanpass × Aply",
    title: "Hanpass User Job Support Check",
    heroDesc:
      "Together with Hanpass, Aply helps foreigners seeking jobs in Korea with job listings, resume feedback, and career consulting.\n\nThis short survey checks whether you're currently job-seeking or open to a move, and what support you need. It takes about 30 seconds to 1 minute.",
    deadline: "Fri, June 26, 2026",
    benefit:
      "Among those who respond by {deadline}, the first 10 people will receive priority resume feedback and career consulting.",
    benefitsHeading: "What you can receive after responding",
    benefits: [
      { title: "Job information", desc: "Based on your responses, we can share job openings you can currently apply for." },
      {
        title: "Resume writing & feedback",
        desc: "The first 10 people receive priority help with resume feedback and writing direction for applying to Korean companies."
      },
      {
        title: "Job prep & consulting",
        desc: "Priority recipients get consulting on interview prep, role selection, and the Korean company application process."
      },
      {
        title: "Jobs matched to you",
        desc: "When opportunities matching your visa, experience, and desired role arise, we'll let you know in turn."
      }
    ],
    qName: "Name",
    qNamePh: "e.g., John Smith",
    qPhone: "Contact phone number",
    qPhonePh: "11 digits starting with 010, e.g., 01012345678",
    qEmail: "Email address",
    qEmailPh: "example@email.com",
    qJobIntent: "Are you currently looking for a job or open to changing jobs?",
    qAvailable: "When can you start working?",
    qJobFields: "Select the job fields you're interested in.",
    qJobFieldsHint: "Multiple choices allowed",
    qJobFieldOtherPh: "Please enter the other field.",
    qVisa: "Select the visa you currently hold.",
    qWants: "Would you like to apply for resume feedback and career consulting?",
    qWantsHint: "First 10 respondents by {deadline} get priority",
    qWantsAuthNote:
      "Resume feedback requires sign-up or login to complete. We'll guide you in the next step after you submit.",
    qLanguages: "Select the languages you can be consulted in.",
    qLanguagesHint: "Multiple choices allowed",
    qPrivacy: "Please agree to the use of your personal information.",
    jobIntentLabels: {
      active_seeking: "Yes, actively job-seeking",
      open_to_offers: "Yes, open to a good opportunity",
      not_seeking: "No, not looking right now",
      unsure: "Not sure yet"
    },
    availableFromLabels: {
      immediately: "Immediately",
      within_1m: "Within 1 month",
      within_3m: "Within 3 months",
      undecided: "Undecided",
      not_available: "Not available right now"
    },
    jobFieldLabels: {
      manufacturing: "Manufacturing/Production",
      logistics: "Logistics/Warehouse",
      service: "Service/Retail",
      office: "Office/Admin",
      translation: "Interpretation/Translation",
      it: "IT/Development",
      design_marketing: "Design/Marketing",
      research: "Research/Professional",
      other: "Other"
    },
    visaLabels: {
      "D-2": "D-2 Study abroad",
      "D-4": "D-4 Language training",
      "D-10": "D-10 Job seeking",
      "E-7": "E-7 Designated activity",
      "F-2": "F-2 Residence",
      "F-4": "F-4 Overseas Korean",
      "F-5": "F-5 Permanent residence",
      "F-6": "F-6 Marriage migrant",
      other: "Other",
      unsure: "Not sure"
    },
    wantsLabels: {
      yes: "Yes, I'd like to apply",
      info_only: "No, just send me job listings",
      unsure: "Not sure yet"
    },
    languageLabels: { ko: "Korean", en: "English" },
    privacyNotice:
      "The information you provide is collected and used by Flipers (Aply) to support Hanpass-linked job assistance, job listings, job matching, resume feedback, and career consulting, and may be retained and used to inform you of suitable job opportunities and Aply's job support services in the future.\n\nIf you do not agree to the use of your personal information, survey submission and job support may be limited.",
    consentAgree: "I agree",
    consentDisagree: "I do not agree",
    submit: "Submit survey",
    submitting: "Submitting…",
    unsubscribePre: "If you'd rather not receive text messages, please send us ",
    unsubscribeLink: "an opt-out request",
    unsubscribePost: ".",
    vName: "Please enter your name.",
    vPhone: "Please enter a valid contact phone number. (e.g., 01012345678)",
    vEmail: "Please enter a valid email address.",
    vJobIntent: "Please select your job-seeking status.",
    vAvailable: "Please select when you can start.",
    vJobFields: "Please select at least one job field.",
    vJobFieldOther: "If you selected Other, please enter the details.",
    vVisa: "Please select your visa type.",
    vWants: "Please choose whether to apply for resume feedback and consulting.",
    vLanguages: "Please select a consultation language.",
    vConsent: "You must agree to the use of personal information to submit.",
    vSubmitFail: "Failed to submit the survey. Please try again shortly.",
    thanksTitle: "Thank you for your response.",
    thanksBody: "Aply will review your response and reach out in order if needed.",
    doneAuthedTitle: "Your resume feedback request has been received.",
    doneAuthedBody: "Our team will review responses and contact the first 10 individually.",
    doneApplicantTitle: "One more step to apply for resume feedback!",
    doneApplicantBody:
      "Resume feedback is completed after sign-up or login. Our team will review responses and contact the first 10 individually.",
    doneNonApplicantBody:
      "Want more job listings from Aply? Sign up to get tailored job recommendations.",
    ctaBrowse: "Browse job listings",
    ctaSignupComplete: "Sign up to finish applying",
    ctaLogin: "I already have an account (Log in)",
    ctaSignup: "Sign up",
    alreadyTitle: "You've already responded",
    alreadyBody:
      "You already completed the Hanpass job support survey on this device. You can respond again to update your answers.",
    ctaRespondAgain: "Respond again"
  },
  "zh-CN": {
    pill: "Hanpass × Aply",
    title: "Hanpass 用户就业支援确认",
    heroDesc:
      "Aply 与 Hanpass 携手，为希望在韩国就业的外国人提供招聘信息、简历修改和就业咨询服务。\n\n这是一份用于确认您当前是否正在求职或希望跳槽、以及是否需要就业支援的问卷。回答约需 30 秒至 1 分钟。",
    deadline: "2026年6月26日（周五）",
    benefit: "在 {deadline} 之前回复的用户中，前 10 名将优先获得简历修改和就业咨询服务。",
    benefitsHeading: "回复后可获得的服务",
    benefits: [
      { title: "招聘信息推送", desc: "我们将根据您的回复，为您推送目前可申请的招聘信息。" },
      { title: "简历撰写与修改帮助", desc: "前 10 名将优先获得申请韩国企业所需的简历修改和撰写方向指导。" },
      { title: "就业准备与咨询", desc: "优先对象将优先获得面试准备、职务选择及韩国公司申请流程方面的咨询。" },
      { title: "适合您的工作推荐", desc: "当出现符合您签证、经历和期望职务的机会时，我们将依次为您推荐。" }
    ],
    qName: "姓名",
    qNamePh: "例：张伟",
    qPhone: "可联系的电话号码",
    qPhonePh: "以 010 开头的 11 位数字，例：01012345678",
    qEmail: "电子邮箱",
    qEmailPh: "example@email.com",
    qJobIntent: "您目前是否正在求职或希望跳槽？",
    qAvailable: "您从什么时候可以开始工作？",
    qJobFields: "请选择您希望的工作领域。",
    qJobFieldsHint: "可多选",
    qJobFieldOtherPh: "请输入其他领域。",
    qVisa: "请选择您目前持有的签证类型。",
    qWants: "您要申请简历修改和就业咨询吗？",
    qWantsHint: "在 {deadline} 前回复者中前 10 名优先提供",
    qWantsAuthNote: "简历修改申请需注册或登录后完成。提交问卷后将在下一步引导您。",
    qLanguages: "请选择可进行咨询的语言。",
    qLanguagesHint: "可多选",
    qPrivacy: "请同意使用您的个人信息。",
    jobIntentLabels: {
      active_seeking: "是，正在积极求职",
      open_to_offers: "是，有好机会的话希望就业/跳槽",
      not_seeking: "否，目前没有求职意向",
      unsure: "还不确定"
    },
    availableFromLabels: {
      immediately: "立即可以",
      within_1m: "1 个月内",
      within_3m: "3 个月内",
      undecided: "尚未确定",
      not_available: "目前无法工作"
    },
    jobFieldLabels: {
      manufacturing: "制造/生产",
      logistics: "物流/仓储",
      service: "服务/门店",
      office: "事务/管理",
      translation: "口译/笔译",
      it: "IT/开发",
      design_marketing: "设计/市场营销",
      research: "研究/专业",
      other: "其他"
    },
    visaLabels: {
      "D-2": "D-2 留学",
      "D-4": "D-4 语言研修",
      "D-10": "D-10 求职",
      "E-7": "E-7 特定活动",
      "F-2": "F-2 居住",
      "F-4": "F-4 在外同胞",
      "F-5": "F-5 永驻",
      "F-6": "F-6 结婚移民",
      other: "其他",
      unsure: "不清楚"
    },
    wantsLabels: {
      yes: "是，我想申请",
      info_only: "否，只想接收招聘信息",
      unsure: "还不确定"
    },
    languageLabels: { ko: "韩语", en: "英语" },
    privacyNotice:
      "您填写的信息将由 Flipers（Aply）用于 Hanpass 关联就业支援、招聘信息推送、招聘匹配、简历修改及就业咨询，并可能为今后向您提供合适的招聘机会及 Aply 就业支援服务而保存和使用。\n\n如不同意使用个人信息，问卷提交及就业支援可能受到限制。",
    consentAgree: "我同意",
    consentDisagree: "我不同意",
    submit: "提交问卷",
    submitting: "提交中…",
    unsubscribePre: "如不希望接收短信，请向我们发送",
    unsubscribeLink: "退订请求",
    unsubscribePost: "。",
    vName: "请输入姓名。",
    vPhone: "请准确输入可联系的手机号码。（例：01012345678）",
    vEmail: "请准确输入电子邮箱。",
    vJobIntent: "请选择是否有求职或跳槽意向。",
    vAvailable: "请选择可工作时间。",
    vJobFields: "请至少选择一个工作领域。",
    vJobFieldOther: "若选择了其他，请输入内容。",
    vVisa: "请选择您的签证类型。",
    vWants: "请选择是否申请简历修改和就业咨询。",
    vLanguages: "请选择可咨询的语言。",
    vConsent: "需同意使用个人信息方可提交问卷。",
    vSubmitFail: "问卷提交失败。请稍后重试。",
    thanksTitle: "感谢您的回复。",
    thanksBody: "Aply 将确认您的回复，并在需要时依次与您联系。",
    doneAuthedTitle: "您的简历修改申请已受理。",
    doneAuthedBody: "运营团队将确认回复后，单独联系前 10 名。",
    doneApplicantTitle: "申请简历修改还差一步！",
    doneApplicantBody: "简历修改申请需注册或登录后完成。运营团队将确认回复后单独联系前 10 名。",
    doneNonApplicantBody: "想在 Aply 查看更多招聘信息？注册后即可获取定制招聘推荐。",
    ctaBrowse: "浏览招聘信息",
    ctaSignupComplete: "注册并完成申请",
    ctaLogin: "我已有账号（登录）",
    ctaSignup: "注册",
    alreadyTitle: "您已提交过回复",
    alreadyBody: "您已在此设备上完成 Hanpass 就业支援问卷。如需修改答案，可以重新作答。",
    ctaRespondAgain: "重新作答"
  },
  vi: {
    pill: "Hanpass × Aply",
    title: "Xác nhận hỗ trợ việc làm cho người dùng Hanpass",
    heroDesc:
      "Cùng với Hanpass, Aply hỗ trợ người nước ngoài muốn tìm việc tại Hàn Quốc với thông tin tuyển dụng, chỉnh sửa hồ sơ (CV) và tư vấn nghề nghiệp.\n\nĐây là khảo sát để xác nhận bạn có đang tìm việc hoặc muốn chuyển việc hay không, và bạn cần hỗ trợ gì. Khảo sát mất khoảng 30 giây đến 1 phút.",
    deadline: "Thứ Sáu, 26/6/2026",
    benefit:
      "Trong số những người phản hồi trước {deadline}, 10 người đầu tiên sẽ được ưu tiên chỉnh sửa hồ sơ và tư vấn nghề nghiệp.",
    benefitsHeading: "Những gì bạn nhận được sau khi phản hồi",
    benefits: [
      { title: "Thông tin tuyển dụng", desc: "Dựa trên phản hồi của bạn, chúng tôi có thể giới thiệu các vị trí bạn có thể ứng tuyển hiện nay." },
      {
        title: "Hỗ trợ viết & chỉnh sửa hồ sơ",
        desc: "10 người đầu tiên được ưu tiên hỗ trợ chỉnh sửa và định hướng viết hồ sơ để ứng tuyển vào công ty Hàn Quốc."
      },
      {
        title: "Chuẩn bị việc làm & tư vấn",
        desc: "Đối tượng ưu tiên được tư vấn về chuẩn bị phỏng vấn, chọn vị trí và quy trình ứng tuyển công ty Hàn Quốc."
      },
      {
        title: "Việc làm phù hợp với bạn",
        desc: "Khi có cơ hội phù hợp với visa, kinh nghiệm và vị trí mong muốn, chúng tôi sẽ lần lượt thông báo cho bạn."
      }
    ],
    qName: "Họ và tên",
    qNamePh: "VD: Nguyễn Văn A",
    qPhone: "Số điện thoại liên hệ",
    qPhonePh: "11 chữ số bắt đầu bằng 010, VD: 01012345678",
    qEmail: "Địa chỉ email",
    qEmailPh: "example@email.com",
    qJobIntent: "Bạn có đang tìm việc hoặc muốn chuyển việc không?",
    qAvailable: "Bạn có thể bắt đầu làm việc từ khi nào?",
    qJobFields: "Chọn lĩnh vực công việc bạn mong muốn.",
    qJobFieldsHint: "Có thể chọn nhiều",
    qJobFieldOtherPh: "Vui lòng nhập lĩnh vực khác.",
    qVisa: "Chọn loại visa bạn đang có.",
    qWants: "Bạn có muốn đăng ký chỉnh sửa hồ sơ và tư vấn nghề nghiệp không?",
    qWantsHint: "10 người phản hồi đầu tiên trước {deadline} được ưu tiên",
    qWantsAuthNote:
      "Đăng ký chỉnh sửa hồ sơ cần đăng ký hoặc đăng nhập để hoàn tất. Chúng tôi sẽ hướng dẫn ở bước tiếp theo sau khi bạn gửi.",
    qLanguages: "Chọn ngôn ngữ bạn có thể được tư vấn.",
    qLanguagesHint: "Có thể chọn nhiều",
    qPrivacy: "Vui lòng đồng ý sử dụng thông tin cá nhân.",
    jobIntentLabels: {
      active_seeking: "Có, đang tích cực tìm việc",
      open_to_offers: "Có, sẵn sàng nếu có cơ hội tốt",
      not_seeking: "Không, hiện không có ý định tìm việc",
      unsure: "Chưa chắc chắn"
    },
    availableFromLabels: {
      immediately: "Ngay lập tức",
      within_1m: "Trong vòng 1 tháng",
      within_3m: "Trong vòng 3 tháng",
      undecided: "Chưa xác định",
      not_available: "Hiện chưa thể làm việc"
    },
    jobFieldLabels: {
      manufacturing: "Sản xuất/Chế tạo",
      logistics: "Logistics/Kho bãi",
      service: "Dịch vụ/Cửa hàng",
      office: "Văn phòng/Quản lý",
      translation: "Phiên dịch/Biên dịch",
      it: "IT/Lập trình",
      design_marketing: "Thiết kế/Marketing",
      research: "Nghiên cứu/Chuyên môn",
      other: "Khác"
    },
    visaLabels: {
      "D-2": "D-2 Du học",
      "D-4": "D-4 Học tiếng",
      "D-10": "D-10 Tìm việc",
      "E-7": "E-7 Hoạt động đặc định",
      "F-2": "F-2 Cư trú",
      "F-4": "F-4 Kiều bào",
      "F-5": "F-5 Thường trú",
      "F-6": "F-6 Kết hôn di trú",
      other: "Khác",
      unsure: "Không rõ"
    },
    wantsLabels: {
      yes: "Có, tôi muốn đăng ký",
      info_only: "Không, chỉ muốn nhận tin tuyển dụng",
      unsure: "Chưa chắc chắn"
    },
    languageLabels: { ko: "Tiếng Hàn", en: "Tiếng Anh" },
    privacyNotice:
      "Thông tin bạn cung cấp được Flipers (Aply) thu thập và sử dụng để hỗ trợ việc làm liên kết Hanpass, cung cấp thông tin tuyển dụng, kết nối tuyển dụng, chỉnh sửa hồ sơ và tư vấn nghề nghiệp, và có thể được lưu giữ, sử dụng để giới thiệu cơ hội việc làm phù hợp cùng các dịch vụ hỗ trợ việc làm của Aply trong tương lai.\n\nNếu bạn không đồng ý sử dụng thông tin cá nhân, việc gửi khảo sát và hỗ trợ việc làm có thể bị hạn chế.",
    consentAgree: "Tôi đồng ý",
    consentDisagree: "Tôi không đồng ý",
    submit: "Gửi khảo sát",
    submitting: "Đang gửi…",
    unsubscribePre: "Nếu không muốn nhận tin nhắn, vui lòng gửi cho chúng tôi ",
    unsubscribeLink: "yêu cầu hủy nhận",
    unsubscribePost: ".",
    vName: "Vui lòng nhập tên.",
    vPhone: "Vui lòng nhập đúng số điện thoại liên hệ. (VD: 01012345678)",
    vEmail: "Vui lòng nhập đúng địa chỉ email.",
    vJobIntent: "Vui lòng chọn tình trạng tìm việc.",
    vAvailable: "Vui lòng chọn thời điểm có thể làm việc.",
    vJobFields: "Vui lòng chọn ít nhất một lĩnh vực.",
    vJobFieldOther: "Nếu chọn Khác, vui lòng nhập chi tiết.",
    vVisa: "Vui lòng chọn loại visa.",
    vWants: "Vui lòng chọn có đăng ký chỉnh sửa hồ sơ và tư vấn không.",
    vLanguages: "Vui lòng chọn ngôn ngữ tư vấn.",
    vConsent: "Bạn phải đồng ý sử dụng thông tin cá nhân để gửi.",
    vSubmitFail: "Gửi khảo sát thất bại. Vui lòng thử lại sau.",
    thanksTitle: "Cảm ơn bạn đã phản hồi.",
    thanksBody: "Aply sẽ xem xét phản hồi của bạn và liên hệ theo thứ tự nếu cần.",
    doneAuthedTitle: "Yêu cầu chỉnh sửa hồ sơ của bạn đã được tiếp nhận.",
    doneAuthedBody: "Đội ngũ sẽ xem xét phản hồi và liên hệ riêng với 10 người đầu tiên.",
    doneApplicantTitle: "Còn một bước để đăng ký chỉnh sửa hồ sơ!",
    doneApplicantBody:
      "Đăng ký chỉnh sửa hồ sơ hoàn tất sau khi đăng ký hoặc đăng nhập. Đội ngũ sẽ liên hệ riêng với 10 người đầu tiên.",
    doneNonApplicantBody:
      "Muốn xem thêm tin tuyển dụng từ Aply? Đăng ký để nhận gợi ý việc làm phù hợp.",
    ctaBrowse: "Xem tin tuyển dụng",
    ctaSignupComplete: "Đăng ký để hoàn tất",
    ctaLogin: "Tôi đã có tài khoản (Đăng nhập)",
    ctaSignup: "Đăng ký",
    alreadyTitle: "Bạn đã phản hồi rồi",
    alreadyBody:
      "Bạn đã hoàn thành khảo sát hỗ trợ việc làm Hanpass trên thiết bị này. Bạn có thể trả lời lại để cập nhật câu trả lời.",
    ctaRespondAgain: "Trả lời lại"
  },
  ja: {
    pill: "Hanpass × Aply",
    title: "Hanpass 利用者向け就職支援アンケート",
    heroDesc:
      "Aply は Hanpass とともに、韓国での就職を希望する外国人の方へ求人情報・履歴書添削・就職相談のご案内をお手伝いしています。\n\n現在求職中または転職をご希望かどうか、就職支援が必要かどうかを確認するためのアンケートです。回答は約30秒～1分ほどで完了します。",
    deadline: "2026年6月26日（金）",
    benefit: "{deadline}までにご回答いただいた方のうち、先着10名様に履歴書添削および就職コンサルティングを優先的にご提供します。",
    benefitsHeading: "ご回答後に受けられるご案内",
    benefits: [
      { title: "求人情報のご案内", desc: "ご回答内容をもとに、現在応募可能な求人情報をご案内できます。" },
      { title: "履歴書作成・添削サポート", desc: "先着10名様に、韓国企業への応募に必要な履歴書添削と作成方法を優先的にご案内します。" },
      { title: "就職準備・コンサルティング", desc: "先着対象者の方に、面接準備・職種選択・韓国企業への応募プロセスに関するコンサルティングを優先的にご提供します。" },
      { title: "あなたに合った求人のご案内", desc: "ビザ・経歴・希望職種に合う機会があれば、順次ご案内します。" }
    ],
    qName: "お名前",
    qNamePh: "例：山田太郎",
    qPhone: "連絡可能な電話番号",
    qPhonePh: "010で始まる11桁、例：01012345678",
    qEmail: "メールアドレス",
    qEmailPh: "example@email.com",
    qJobIntent: "現在、求職中または転職をご希望ですか？",
    qAvailable: "いつから勤務が可能ですか？",
    qJobFields: "希望する職種分野を選んでください。",
    qJobFieldsHint: "複数選択可",
    qJobFieldOtherPh: "その他の希望分野を入力してください。",
    qVisa: "保有しているビザの種類を選んでください。",
    qWants: "履歴書添削および就職コンサルティングを申し込みますか？",
    qWantsHint: "{deadline}までの回答者のうち先着10名に優先提供",
    qWantsAuthNote:
      "履歴書添削のお申し込みは会員登録またはログイン後に完了します。アンケート送信後、次のステップでご案内します。",
    qLanguages: "相談が可能な言語を選んでください。",
    qLanguagesHint: "複数選択可",
    qPrivacy: "個人情報の利用に同意してください。",
    jobIntentLabels: {
      active_seeking: "はい、積極的に求職中です",
      open_to_offers: "はい、良い機会があれば転職・就職を希望します",
      not_seeking: "いいえ、今は求職の予定はありません",
      unsure: "まだわかりません"
    },
    availableFromLabels: {
      immediately: "即時可能",
      within_1m: "1か月以内",
      within_3m: "3か月以内",
      undecided: "未定",
      not_available: "現在は勤務できません"
    },
    jobFieldLabels: {
      manufacturing: "製造/生産",
      logistics: "物流/倉庫",
      service: "サービス/店舗",
      office: "事務/管理",
      translation: "通訳/翻訳",
      it: "IT/開発",
      design_marketing: "デザイン/マーケティング",
      research: "研究/専門職",
      other: "その他"
    },
    visaLabels: {
      "D-2": "D-2 留学",
      "D-4": "D-4 語学研修",
      "D-10": "D-10 求職",
      "E-7": "E-7 特定活動",
      "F-2": "F-2 居住",
      "F-4": "F-4 在外同胞",
      "F-5": "F-5 永住",
      "F-6": "F-6 結婚移民",
      other: "その他",
      unsure: "わかりません"
    },
    wantsLabels: {
      yes: "はい、申し込みたいです",
      info_only: "いいえ、求人情報の案内のみ希望します",
      unsure: "まだわかりません"
    },
    languageLabels: { ko: "韓国語", en: "英語" },
    privacyNotice:
      "ご入力いただいた情報は、Flipers（Aply）が Hanpass 連携の就職支援、求人情報のご案内、採用マッチング、履歴書添削および就職コンサルティングの提供のために収集・利用し、今後の適切な求人機会や Aply の就職支援サービスのご案内のために保管・活用される場合があります。\n\n個人情報の活用に同意いただけない場合、アンケートの提出および就職支援のご案内が制限されることがあります。",
    consentAgree: "同意します",
    consentDisagree: "同意しません",
    submit: "アンケートを送信",
    submitting: "送信中…",
    unsubscribePre: "メッセージの受信を希望されない場合は、",
    unsubscribeLink: "受信拒否のご連絡",
    unsubscribePost: "をお送りください。",
    vName: "お名前を入力してください。",
    vPhone: "連絡可能な携帯番号を正しく入力してください。（例：01012345678）",
    vEmail: "メールアドレスを正しく入力してください。",
    vJobIntent: "求職または転職の希望を選択してください。",
    vAvailable: "勤務可能な時期を選択してください。",
    vJobFields: "希望する職種分野を1つ以上選択してください。",
    vJobFieldOther: "その他を選択した場合は内容を入力してください。",
    vVisa: "ビザの種類を選択してください。",
    vWants: "履歴書添削・就職コンサルティングの申込可否を選択してください。",
    vLanguages: "相談可能な言語を選択してください。",
    vConsent: "個人情報の活用に同意いただくとアンケートを提出できます。",
    vSubmitFail: "アンケートの送信に失敗しました。しばらくしてからもう一度お試しください。",
    thanksTitle: "ご回答ありがとうございます。",
    thanksBody: "Aply が回答内容を確認のうえ、必要に応じて順次ご案内いたします。",
    doneAuthedTitle: "履歴書添削のお申し込みを受け付けました。",
    doneAuthedBody: "先着10名様には運営チームが回答を確認のうえ個別にご連絡します。",
    doneApplicantTitle: "履歴書添削の申し込みまであと1ステップ！",
    doneApplicantBody:
      "履歴書添削のお申し込みは会員登録またはログイン後に完了します。先着10名様には運営チームが個別にご連絡します。",
    doneNonApplicantBody:
      "Aply でより多くの求人情報をご覧になりたい場合は、会員登録すると個別の求人情報を受け取れます。",
    ctaBrowse: "求人情報を見る",
    ctaSignupComplete: "会員登録して申し込み完了",
    ctaLogin: "アカウントをお持ちの方（ログイン）",
    ctaSignup: "会員登録する",
    alreadyTitle: "すでにご回答いただいています",
    alreadyBody:
      "この端末で Hanpass 就職支援アンケートにすでにご回答いただいています。回答を修正する場合は、もう一度ご回答いただけます。",
    ctaRespondAgain: "もう一度回答する"
  },
  id: {
    pill: "Hanpass × Aply",
    title: "Konfirmasi Dukungan Kerja Pengguna Hanpass",
    heroDesc:
      "Bersama Hanpass, Aply membantu warga asing yang ingin bekerja di Korea dengan informasi lowongan, koreksi resume, dan konsultasi karier.\n\nSurvei ini untuk memastikan apakah Anda sedang mencari kerja atau ingin pindah kerja, serta dukungan apa yang Anda butuhkan. Pengisian memakan waktu sekitar 30 detik hingga 1 menit.",
    deadline: "Jumat, 26 Juni 2026",
    benefit:
      "Di antara yang merespons sebelum {deadline}, 10 orang pertama akan mendapat prioritas koreksi resume dan konsultasi karier.",
    benefitsHeading: "Yang bisa Anda dapatkan setelah merespons",
    benefits: [
      { title: "Informasi lowongan", desc: "Berdasarkan jawaban Anda, kami dapat memberi tahu lowongan yang bisa Anda lamar saat ini." },
      {
        title: "Bantuan menulis & koreksi resume",
        desc: "10 orang pertama mendapat prioritas bantuan koreksi resume dan arahan menulis untuk melamar ke perusahaan Korea."
      },
      {
        title: "Persiapan kerja & konsultasi",
        desc: "Penerima prioritas mendapat konsultasi persiapan wawancara, pemilihan posisi, dan proses lamaran perusahaan Korea."
      },
      {
        title: "Pekerjaan yang cocok untuk Anda",
        desc: "Saat ada peluang yang sesuai visa, pengalaman, dan posisi yang Anda inginkan, kami akan memberi tahu secara bertahap."
      }
    ],
    qName: "Nama",
    qNamePh: "Cth: Budi Santoso",
    qPhone: "Nomor telepon yang bisa dihubungi",
    qPhonePh: "11 digit diawali 010, cth: 01012345678",
    qEmail: "Alamat email",
    qEmailPh: "example@email.com",
    qJobIntent: "Apakah Anda sedang mencari kerja atau ingin pindah kerja?",
    qAvailable: "Kapan Anda bisa mulai bekerja?",
    qJobFields: "Pilih bidang pekerjaan yang Anda inginkan.",
    qJobFieldsHint: "Boleh pilih lebih dari satu",
    qJobFieldOtherPh: "Masukkan bidang lainnya.",
    qVisa: "Pilih jenis visa yang Anda miliki.",
    qWants: "Apakah Anda ingin mendaftar koreksi resume dan konsultasi karier?",
    qWantsHint: "10 responden pertama sebelum {deadline} mendapat prioritas",
    qWantsAuthNote:
      "Pendaftaran koreksi resume diselesaikan setelah daftar atau masuk. Kami akan memandu di langkah berikutnya setelah Anda mengirim.",
    qLanguages: "Pilih bahasa untuk konsultasi.",
    qLanguagesHint: "Boleh pilih lebih dari satu",
    qPrivacy: "Mohon setujui penggunaan informasi pribadi Anda.",
    jobIntentLabels: {
      active_seeking: "Ya, sedang aktif mencari kerja",
      open_to_offers: "Ya, terbuka jika ada peluang bagus",
      not_seeking: "Tidak, saat ini tidak mencari",
      unsure: "Belum yakin"
    },
    availableFromLabels: {
      immediately: "Segera",
      within_1m: "Dalam 1 bulan",
      within_3m: "Dalam 3 bulan",
      undecided: "Belum ditentukan",
      not_available: "Saat ini belum bisa bekerja"
    },
    jobFieldLabels: {
      manufacturing: "Manufaktur/Produksi",
      logistics: "Logistik/Gudang",
      service: "Layanan/Toko",
      office: "Kantor/Administrasi",
      translation: "Penerjemahan/Interpretasi",
      it: "IT/Pengembangan",
      design_marketing: "Desain/Pemasaran",
      research: "Riset/Profesional",
      other: "Lainnya"
    },
    visaLabels: {
      "D-2": "D-2 Studi",
      "D-4": "D-4 Kursus bahasa",
      "D-10": "D-10 Mencari kerja",
      "E-7": "E-7 Aktivitas khusus",
      "F-2": "F-2 Tinggal",
      "F-4": "F-4 Diaspora Korea",
      "F-5": "F-5 Menetap permanen",
      "F-6": "F-6 Migran pernikahan",
      other: "Lainnya",
      unsure: "Tidak yakin"
    },
    wantsLabels: {
      yes: "Ya, saya ingin mendaftar",
      info_only: "Tidak, cukup info lowongan saja",
      unsure: "Belum yakin"
    },
    languageLabels: { ko: "Bahasa Korea", en: "Bahasa Inggris" },
    privacyNotice:
      "Informasi yang Anda berikan dikumpulkan dan digunakan oleh Flipers (Aply) untuk dukungan kerja terkait Hanpass, informasi lowongan, pencocokan kerja, koreksi resume, dan konsultasi karier, serta dapat disimpan dan digunakan untuk memberi tahu peluang kerja yang sesuai dan layanan dukungan kerja Aply di masa depan.\n\nJika Anda tidak menyetujui penggunaan informasi pribadi, pengiriman survei dan dukungan kerja dapat dibatasi.",
    consentAgree: "Saya setuju",
    consentDisagree: "Saya tidak setuju",
    submit: "Kirim survei",
    submitting: "Mengirim…",
    unsubscribePre: "Jika tidak ingin menerima SMS, silakan kirim ",
    unsubscribeLink: "permintaan berhenti",
    unsubscribePost: ".",
    vName: "Mohon masukkan nama.",
    vPhone: "Mohon masukkan nomor HP yang valid. (cth: 01012345678)",
    vEmail: "Mohon masukkan alamat email yang valid.",
    vJobIntent: "Mohon pilih status pencarian kerja.",
    vAvailable: "Mohon pilih waktu mulai bekerja.",
    vJobFields: "Mohon pilih minimal satu bidang.",
    vJobFieldOther: "Jika memilih Lainnya, mohon isi detailnya.",
    vVisa: "Mohon pilih jenis visa.",
    vWants: "Mohon pilih apakah mendaftar koreksi resume dan konsultasi.",
    vLanguages: "Mohon pilih bahasa konsultasi.",
    vConsent: "Anda harus menyetujui penggunaan informasi pribadi untuk mengirim.",
    vSubmitFail: "Gagal mengirim survei. Silakan coba lagi nanti.",
    thanksTitle: "Terima kasih atas tanggapan Anda.",
    thanksBody: "Aply akan meninjau tanggapan Anda dan menghubungi secara berurutan jika perlu.",
    doneAuthedTitle: "Permintaan koreksi resume Anda telah diterima.",
    doneAuthedBody: "Tim kami akan meninjau dan menghubungi 10 orang pertama secara individual.",
    doneApplicantTitle: "Tinggal satu langkah untuk daftar koreksi resume!",
    doneApplicantBody:
      "Pendaftaran koreksi resume selesai setelah daftar atau masuk. Tim kami akan menghubungi 10 orang pertama secara individual.",
    doneNonApplicantBody:
      "Ingin lebih banyak lowongan dari Aply? Daftar untuk rekomendasi kerja yang sesuai.",
    ctaBrowse: "Lihat lowongan",
    ctaSignupComplete: "Daftar untuk menyelesaikan",
    ctaLogin: "Sudah punya akun (Masuk)",
    ctaSignup: "Daftar",
    alreadyTitle: "Anda sudah merespons",
    alreadyBody:
      "Anda sudah mengisi survei dukungan kerja Hanpass di perangkat ini. Anda bisa merespons lagi untuk memperbarui jawaban.",
    ctaRespondAgain: "Jawab lagi"
  }
};

type Option<T extends string> = { value: T; label: string };

type FormState = {
  name: string;
  phone: string;
  email: string;
  jobIntent: HanpassJobIntent | "";
  availableFrom: HanpassAvailableFrom | "";
  jobFields: HanpassJobField[];
  jobFieldOther: string;
  visaType: HanpassVisaType | "";
  wantsConsulting: HanpassWantsConsulting | "";
  consultLanguages: HanpassLanguage[];
  privacyConsent: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  phone: "",
  email: "",
  jobIntent: "",
  availableFrom: "",
  jobFields: [],
  jobFieldOther: "",
  visaType: "",
  wantsConsulting: "",
  consultLanguages: [],
  // 개인정보 활용 동의는 기본적으로 "동의합니다" 가 선택된 상태로 시작.
  privacyConsent: true
};

function normalizePhone(raw: string) {
  return raw.replace(/[^0-9]/g, "");
}

function fillDeadline(template: string, deadline: string) {
  return template.replace("{deadline}", deadline);
}

export function HanpassEventPage() {
  const toast = useToast();
  const { isAuthenticated } = useAuthSession();
  const { locale } = useLanguage();
  const t = COPY[locale] ?? COPY.ko;
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<null | { wantsConsulting: HanpassWantsConsulting }>(null);
  // 같은 기기에서 이미 응답했는지(localStorage). 마운트 후에만 읽어 SSR 불일치 방지.
  const [alreadyResponded, setAlreadyResponded] = useState(false);
  const [showFormAnyway, setShowFormAnyway] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(RESPONDED_STORAGE_KEY)) {
        setAlreadyResponded(true);
      }
    } catch {
      // localStorage 접근 불가(시크릿 모드 등) — 무시하고 폼 노출.
    }
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleArray = <T extends string>(key: "jobFields" | "consultLanguages", value: T) =>
    setForm((prev) => {
      const list = prev[key] as T[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [key]: next };
    });

  const jobIntentOptions: Option<HanpassJobIntent>[] = JOB_INTENT_VALUES.map((v) => ({ value: v, label: t.jobIntentLabels[v] }));
  const availableFromOptions: Option<HanpassAvailableFrom>[] = AVAILABLE_FROM_VALUES.map((v) => ({ value: v, label: t.availableFromLabels[v] }));
  const jobFieldOptions: Option<HanpassJobField>[] = JOB_FIELD_VALUES.map((v) => ({ value: v, label: t.jobFieldLabels[v] }));
  const visaOptions: Option<HanpassVisaType>[] = VISA_VALUES.map((v) => ({ value: v, label: t.visaLabels[v] }));
  const wantsOptions: Option<HanpassWantsConsulting>[] = WANTS_VALUES.map((v) => ({ value: v, label: t.wantsLabels[v] }));
  const languageOptions: Option<HanpassLanguage>[] = LANGUAGE_VALUES.map((v) => ({ value: v, label: t.languageLabels[v] }));

  const validationError = useMemo(() => {
    if (!form.name.trim()) return t.vName;
    const phone = normalizePhone(form.phone);
    if (!/^01\d{8,9}$/.test(phone)) return t.vPhone;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return t.vEmail;
    if (!form.jobIntent) return t.vJobIntent;
    if (!form.availableFrom) return t.vAvailable;
    if (form.jobFields.length === 0) return t.vJobFields;
    if (form.jobFields.includes("other") && !form.jobFieldOther.trim()) return t.vJobFieldOther;
    if (!form.visaType) return t.vVisa;
    if (!form.wantsConsulting) return t.vWants;
    if (form.consultLanguages.length === 0) return t.vLanguages;
    if (!form.privacyConsent) return t.vConsent;
    return null;
  }, [form, t]);

  const handleSubmit = async () => {
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitHanpassSurvey({
        name: form.name.trim(),
        phone: normalizePhone(form.phone),
        email: form.email.trim(),
        jobIntent: form.jobIntent as HanpassJobIntent,
        availableFrom: form.availableFrom as HanpassAvailableFrom,
        jobFields: form.jobFields,
        jobFieldOther: form.jobFields.includes("other") ? form.jobFieldOther.trim() : undefined,
        visaType: form.visaType as HanpassVisaType,
        wantsConsulting: form.wantsConsulting as HanpassWantsConsulting,
        consultLanguages: form.consultLanguages,
        privacyConsent: true,
        locale,
        source: "hanpass"
      });
      setSubmitted({ wantsConsulting: result.wantsConsulting });
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(RESPONDED_STORAGE_KEY, String(Date.now()));
        }
      } catch {
        // 저장 실패는 무시 (완료 화면은 정상 노출됨)
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      toast.error(t.vSubmitFail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0B1227] text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(900px 480px at 18% -10%, rgba(11,70,232,0.45), transparent 60%), radial-gradient(700px 420px at 95% 0%, rgba(11,70,232,0.22), transparent 55%)"
          }}
        />
        <div className="relative mx-auto w-full max-w-[760px] px-5 py-16 sm:py-20">
          <Reveal>
            <span className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2.5 shadow-sm">
              <Image
                src="/logo_hanpass.webp"
                alt="Hanpass"
                width={900}
                height={300}
                priority
                className="h-[22px] w-auto sm:h-6"
              />
              <span className="text-sm font-semibold text-slate-300">×</span>
              <Image
                src="/img_logo.webp"
                alt="Aply"
                width={1800}
                height={900}
                priority
                className="h-[18px] w-auto sm:h-5"
              />
            </span>
          </Reveal>
          <Reveal delayMs={60}>
            <h1 className={`${paperlogy.className} mt-5 text-3xl font-bold leading-tight sm:text-4xl`}>{t.title}</h1>
          </Reveal>
          <Reveal delayMs={120}>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/80 sm:text-base">{t.heroDesc}</p>
          </Reveal>
          <Reveal delayMs={180}>
            <div className="mt-7 flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <Gift size={22} weight="fill" className="mt-0.5 shrink-0 text-[#7aa2ff]" />
                <p className="text-sm leading-relaxed text-white/90">{fillDeadline(t.benefit, t.deadline)}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {submitted ? (
        <CompletionView t={t} wantsConsulting={submitted.wantsConsulting} isAuthenticated={isAuthenticated} />
      ) : alreadyResponded && !showFormAnyway ? (
        <AlreadyRespondedView t={t} onRespondAgain={() => setShowFormAnyway(true)} />
      ) : (
        <main className="mx-auto w-full max-w-[760px] px-5 py-12 sm:py-16">
          {/* 응답 후 받을 수 있는 안내 */}
          <Reveal>
            <section className="rounded-2xl border border-border bg-card p-6 sm:p-7">
              <h2 className={`${paperlogy.className} text-lg font-bold sm:text-xl`}>{t.benefitsHeading}</h2>
              <ul className="mt-5 space-y-4">
                {t.benefits.map((b) => (
                  <li key={b.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B46E8]/10 text-[#0B46E8]">
                      <CheckCircle size={16} weight="fill" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold sm:text-base">{b.title}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-sm">{b.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>

          {/* 설문 폼 */}
          <Reveal delayMs={80}>
            <div className="mt-10 space-y-8">
              <ShortAnswer index={1} label={t.qName} placeholder={t.qNamePh} value={form.name} onChange={(v) => set("name", v)} />
              <ShortAnswer
                index={2}
                label={t.qPhone}
                placeholder={t.qPhonePh}
                value={form.phone}
                onChange={(v) => set("phone", v)}
                inputMode="numeric"
              />
              <ShortAnswer index={3} label={t.qEmail} placeholder={t.qEmailPh} value={form.email} onChange={(v) => set("email", v)} type="email" />

              <RadioGroup index={4} label={t.qJobIntent} options={jobIntentOptions} value={form.jobIntent} onChange={(v) => set("jobIntent", v)} />
              <RadioGroup index={5} label={t.qAvailable} options={availableFromOptions} value={form.availableFrom} onChange={(v) => set("availableFrom", v)} />

              <CheckboxGroup
                index={6}
                label={t.qJobFields}
                hint={t.qJobFieldsHint}
                options={jobFieldOptions}
                values={form.jobFields}
                onToggle={(v) => toggleArray("jobFields", v)}
              />
              {form.jobFields.includes("other") && (
                <input
                  value={form.jobFieldOther}
                  onChange={(e) => set("jobFieldOther", e.target.value)}
                  placeholder={t.qJobFieldOtherPh}
                  className="-mt-4 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-[#0B46E8] focus:ring-2 focus:ring-[#0B46E8]/20"
                />
              )}

              <RadioGroup index={7} label={t.qVisa} options={visaOptions} value={form.visaType} onChange={(v) => set("visaType", v)} />

              <div>
                <RadioGroup
                  index={8}
                  label={t.qWants}
                  hint={fillDeadline(t.qWantsHint, t.deadline)}
                  options={wantsOptions}
                  value={form.wantsConsulting}
                  onChange={(v) => set("wantsConsulting", v)}
                />
                {form.wantsConsulting === "yes" && !isAuthenticated && (
                  <p className="mt-2 rounded-lg bg-[#0B46E8]/5 px-3 py-2 text-xs leading-relaxed text-[#0B46E8]">{t.qWantsAuthNote}</p>
                )}
              </div>

              <CheckboxGroup
                index={9}
                label={t.qLanguages}
                hint={t.qLanguagesHint}
                options={languageOptions}
                values={form.consultLanguages}
                onToggle={(v) => toggleArray("consultLanguages", v)}
              />

              {/* 개인정보 동의 */}
              <div className="rounded-2xl border border-border bg-muted/30 p-5">
                <QuestionLabel index={10} label={t.qPrivacy} />
                <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{t.privacyNotice}</p>
                <div className="mt-4 space-y-2">
                  <ConsentRadio checked={form.privacyConsent === true} onChange={() => set("privacyConsent", true)} label={t.consentAgree} />
                  <ConsentRadio checked={form.privacyConsent === false} onChange={() => set("privacyConsent", false)} label={t.consentDisagree} muted />
                </div>
              </div>

              <Button variant="hero" size="xl" className="w-full" disabled={submitting} onClick={handleSubmit}>
                {submitting ? t.submitting : t.submit}
                {!submitting && <ArrowRight weight="bold" />}
              </Button>

              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                {t.unsubscribePre}
                <a
                  href="mailto:info@flip-ers.com?subject=Hanpass%20opt-out"
                  className="font-medium text-[#0B46E8] underline underline-offset-2"
                >
                  {t.unsubscribeLink}
                </a>
                {t.unsubscribePost}
              </p>
            </div>
          </Reveal>
        </main>
      )}

      <Footer />
    </div>
  );
}

// ---------------------------------------------------------------------------
// 이미 응답함 화면 (같은 기기 재접속) — 하드 차단이 아니라 '다시 응답하기' 허용
// ---------------------------------------------------------------------------
function AlreadyRespondedView({ t, onRespondAgain }: { t: Copy; onRespondAgain: () => void }) {
  return (
    <main className="mx-auto w-full max-w-[640px] px-5 py-16 sm:py-24">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0B46E8]/10 text-[#0B46E8]">
            <CheckCircle size={40} weight="fill" />
          </span>
          <h2 className={`${paperlogy.className} mt-6 text-2xl font-bold sm:text-3xl`}>{t.alreadyTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{t.alreadyBody}</p>
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="hero" size="lg" onClick={onRespondAgain}>
              {t.ctaRespondAgain}
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/talent/jobs">{t.ctaBrowse}</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </main>
  );
}

// ---------------------------------------------------------------------------
// 완료 화면
// ---------------------------------------------------------------------------
function CompletionView({
  t,
  wantsConsulting,
  isAuthenticated
}: {
  t: Copy;
  wantsConsulting: HanpassWantsConsulting;
  isAuthenticated: boolean;
}) {
  const isApplicant = wantsConsulting === "yes";
  return (
    <main className="mx-auto w-full max-w-[640px] px-5 py-16 sm:py-24">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0B46E8]/10 text-[#0B46E8]">
            <CheckCircle size={40} weight="fill" />
          </span>
          <h2 className={`${paperlogy.className} mt-6 text-2xl font-bold sm:text-3xl`}>{t.thanksTitle}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">{t.thanksBody}</p>
        </div>
      </Reveal>

      {/* 첨삭 신청자 — 회원가입/로그인 후 신청 완료 (이미 로그인 시 접수 안내) */}
      {isApplicant && isAuthenticated && (
        <Reveal delayMs={120}>
          <div className="mt-10 rounded-2xl border border-[#0B46E8]/20 bg-[#0B46E8]/5 p-6 text-center">
            <Sparkle size={24} weight="fill" className="mx-auto text-[#0B46E8]" />
            <h3 className="mt-3 text-lg font-bold">{t.doneAuthedTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.doneAuthedBody}</p>
            <div className="mt-5 flex justify-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/talent/jobs">{t.ctaBrowse}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      )}

      {isApplicant && !isAuthenticated && (
        <Reveal delayMs={120}>
          <div className="mt-10 rounded-2xl border border-[#0B46E8]/20 bg-[#0B46E8]/5 p-6 text-center">
            <Sparkle size={24} weight="fill" className="mx-auto text-[#0B46E8]" />
            <h3 className="mt-3 text-lg font-bold">{t.doneApplicantTitle}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.doneApplicantBody}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button asChild variant="hero" size="lg">
                <Link href={SIGNUP_HREF}>
                  {t.ctaSignupComplete}
                  <ArrowRight weight="bold" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href={LOGIN_HREF}>{t.ctaLogin}</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      )}

      {!isApplicant && (
        <Reveal delayMs={120}>
          <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-6 text-center">
            <p className="text-sm leading-relaxed text-muted-foreground">{t.doneNonApplicantBody}</p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <Button asChild variant="dark" size="lg">
                  <Link href="/talent/jobs">
                    {t.ctaBrowse}
                    <ArrowRight weight="bold" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="dark" size="lg">
                    <Link href={SIGNUP_HREF}>
                      {t.ctaSignup}
                      <ArrowRight weight="bold" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/talent/jobs">{t.ctaBrowse}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </Reveal>
      )}
    </main>
  );
}

// ---------------------------------------------------------------------------
// 폼 서브 컴포넌트
// ---------------------------------------------------------------------------
function QuestionLabel({ index, label, hint }: { index: number; label: string; hint?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold leading-relaxed sm:text-base">
        <span className="mr-1.5 text-[#0B46E8]">{index}.</span>
        {label}
        <span className="ml-1 text-[#e5484d]">*</span>
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ShortAnswer({
  index,
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  inputMode
}: {
  index: number;
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  inputMode?: "numeric" | "text" | "email";
}) {
  return (
    <div>
      <QuestionLabel index={index} label={label} />
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-[#0B46E8] focus:ring-2 focus:ring-[#0B46E8]/20"
      />
    </div>
  );
}

function RadioGroup<T extends string>({
  index,
  label,
  hint,
  options,
  value,
  onChange
}: {
  index: number;
  label: string;
  hint?: string;
  options: Option<T>[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <QuestionLabel index={index} label={label} hint={hint} />
      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-[#0B46E8] bg-[#0B46E8]/5 font-medium"
                  : "border-input bg-background hover:border-[#0B46E8]/40 hover:bg-muted/40"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? "border-[#0B46E8]" : "border-muted-foreground/40"
                }`}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-[#0B46E8]" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CheckboxGroup<T extends string>({
  index,
  label,
  hint,
  options,
  values,
  onToggle
}: {
  index: number;
  label: string;
  hint?: string;
  options: Option<T>[];
  values: T[];
  onToggle: (v: T) => void;
}) {
  return (
    <div>
      <QuestionLabel index={index} label={label} hint={hint} />
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((opt) => {
          const active = values.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onToggle(opt.value)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                active
                  ? "border-[#0B46E8] bg-[#0B46E8]/5 font-medium"
                  : "border-input bg-background hover:border-[#0B46E8]/40 hover:bg-muted/40"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? "border-[#0B46E8]" : "border-muted-foreground/40"
                }`}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-[#0B46E8]" />}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConsentRadio({
  checked,
  onChange,
  label,
  muted
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
        checked
          ? muted
            ? "border-muted-foreground/50 bg-muted/60 font-medium"
            : "border-[#0B46E8] bg-[#0B46E8]/5 font-medium"
          : "border-input bg-background hover:bg-muted/40"
      }`}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
          checked ? (muted ? "border-muted-foreground" : "border-[#0B46E8]") : "border-muted-foreground/40"
        }`}
      >
        {checked && <span className={`h-2.5 w-2.5 rounded-full ${muted ? "bg-muted-foreground" : "bg-[#0B46E8]"}`} />}
      </span>
      {label}
    </button>
  );
}

