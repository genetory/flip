"use client";

import { ArrowDown, ArrowUp, ArrowsDownUp, FileArrowUp, FileText, PencilSimple, Trash, X } from "@phosphor-icons/react";
import { FormEvent, MouseEvent, SyntheticEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getOpsBadgeClassName } from "../../partners/_components/OpsBadge";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type SortField = "name" | "email" | "phoneNumber" | "affiliation" | "nationality" | "createdAt" | "completion";
type SortOrder = "asc" | "desc";
type CandidateDetailTab =
  | "basic"
  | "visaResidence"
  | "educationLanguage"
  | "career"
  | "activityExperience"
  | "preferenceCapability"
  | "additionalInfo"
  | "emergencyContact"
  | "adminMemo"
  | "matchingResult";
type EducationLanguageView = "list" | "educationAdd" | "languageAdd";
type CareerView = "list" | "add";
type ActivityExperienceView = "list" | "add";

type MemberItem = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  phoneNumber: string | null;
  affiliation?: string | null;
  nationality?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  jobTitle: string | null;
  adminMemo?: string | null;
  role: "STUDENT" | "PARTNER" | "OPERATOR";
  createdAt: string;
  updatedAt: string;
};

type VerificationMenuState = {
  id: string;
  mode: "list" | "detail";
  currentEmailVerified: boolean;
};

type CandidateDraft = {
  name: string;
  email: string;
  phoneNumber: string;
  affiliation: string;
  nationality: string;
  gender: "" | "male" | "female" | "secret";
  birthDate: string;
  jobTitle: string;
  password: string;
};

type CandidateVisaType =
  | "D10_JOB_SEEKING"
  | "D2_STUDENT"
  | "D4_GENERAL_TRAINING"
  | "F2_RESIDENCE"
  | "F4_OVERSEAS_KOREAN"
  | "F5_PERMANENT_RESIDENCE"
  | "F6_MARRIAGE_IMMIGRATION"
  | "E7_SPECIFIC_ACTIVITY"
  | "H1_WORKING_HOLIDAY"
  | "OTHER";

type CandidateProfileItem = {
  id: string | null;
  userId: string | null;
  workPermit: boolean | null;
  visaType: CandidateVisaType | null;
  visaExpiryDate: string | null;
  livesInKorea: boolean | null;
  hasAccommodation: boolean | null;
  residenceProvince: string | null;
  residenceDistrict: string | null;
  residenceAddress: string | null;
  preferredProgramDuration: CandidateProgramDuration | null;
  programStartOption: CandidateProgramStartOption | null;
  programStartDate: string | null;
  preferredIndustries: PartnerIndustry[];
  preferredJobRoles: CandidatePreferredJobRole[];
  skills: string[];
  selfIntroduction: string | null;
  programMotivation: string | null;
  preferenceConditionNote: string | null;
  capabilityNote: string | null;
  additionalInfoNote: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  emergencyContactPhone: string | null;
  emergencyContactEmail: string | null;
  emergencyContactAddress: string | null;
  matchingResultNote: string | null;
  educations: CandidateEducationItem[];
  languageSkills: CandidateLanguageSkillItem[];
  careers: CandidateCareerItem[];
  activityExperiences: CandidateActivityExperienceItem[];
  createdAt: string | null;
  updatedAt: string | null;
};

type CandidateEducationType =
  | "HIGH_SCHOOL"
  | "ASSOCIATE"
  | "BACHELOR"
  | "MASTER"
  | "DOCTOR"
  | "BOOTCAMP"
  | "CERTIFICATE"
  | "OTHER";

type CandidateEducationStatus = "ENROLLED" | "GRADUATED" | "LEAVE_OF_ABSENCE" | "DROPPED_OUT" | "OTHER";

type CandidateLanguageType =
  | "KOREAN"
  | "ENGLISH"
  | "CHINESE"
  | "JAPANESE"
  | "VIETNAMESE"
  | "INDONESIAN"
  | "THAI"
  | "MALAY"
  | "FILIPINO"
  | "HINDI"
  | "SPANISH"
  | "FRENCH"
  | "GERMAN"
  | "OTHER";

type CandidateLanguageLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE";
type PartnerIndustry = string;
type CandidateActivityType =
  | "PROJECT"
  | "VOLUNTEER"
  | "INTERNSHIP"
  | "CERTIFICATE"
  | "AWARD"
  | "EXTRACURRICULAR"
  | "OTHER";
type CandidateProgramDuration = "WEEKS_6" | "WEEKS_8" | "WEEKS_10" | "WEEKS_12" | "WEEKS_14" | "WEEKS_16" | "NEGOTIABLE";
type CandidateProgramStartOption = "ASAP" | "SPECIFIC_DATE";
type CandidatePreferredJobRole =
  | "SOFTWARE_DEVELOPMENT"
  | "FRONTEND_DEVELOPMENT"
  | "BACKEND_DEVELOPMENT"
  | "DATA_ANALYSIS_SCIENCE"
  | "UI_UX_DESIGN"
  | "PRODUCT_MANAGER"
  | "MARKETING"
  | "SALES"
  | "HR"
  | "FINANCE_ACCOUNTING"
  | "OPERATIONS_PLANNING"
  | "OTHER";

type CandidateEducationItem = {
  id: string;
  schoolName: string;
  educationType: CandidateEducationType;
  major: string | null;
  status: CandidateEducationStatus;
  country: string | null;
  city: string | null;
  startDate: string | null;
  endDate: string | null;
  isKoreanSchool: boolean | null;
  createdAt: string;
  updatedAt: string;
};

type CandidateLanguageSkillItem = {
  id: string;
  language: CandidateLanguageType;
  level: CandidateLanguageLevel;
  testName: string | null;
  score: string | null;
  createdAt: string;
  updatedAt: string;
};

type CandidateCareerItem = {
  id: string;
  companyName: string;
  position: string;
  department: string | null;
  isCurrent: boolean;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

type CandidateActivityExperienceItem = {
  id: string;
  title: string;
  activityType: CandidateActivityType;
  organization: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string | null;
  skills: string[];
  createdAt: string;
  updatedAt: string;
};

type CandidateVisaResidenceDraft = {
  workPermit: "yes" | "no" | "unset";
  visaType: CandidateVisaType | "";
  visaExpiryDate: string;
  livesInKorea: "yes" | "no" | "unset";
  hasAccommodation: "yes" | "no" | "unset";
  residenceProvince: string;
  residenceDistrict: string;
  residenceAddress: string;
};

type CandidateEducationDraft = {
  schoolName: string;
  educationType: CandidateEducationType;
  major: string;
  status: CandidateEducationStatus;
  country: string;
  city: string;
  startDate: string;
  endDate: string;
  isKoreanSchool: "yes" | "no" | "unset";
};

type CandidateLanguageSkillDraft = {
  language: CandidateLanguageType;
  level: CandidateLanguageLevel;
  testName: string;
  score: string;
};

type CandidateCareerDraft = {
  companyName: string;
  position: string;
  department: string;
  isCurrent: "yes" | "no";
  startDate: string;
  endDate: string;
  description: string;
};

type CandidateActivityExperienceDraft = {
  title: string;
  activityType: CandidateActivityType;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
  skills: string;
};

type CandidatePreferenceCapabilityDraft = {
  preferredProgramDuration: CandidateProgramDuration | "";
  programStartOption: CandidateProgramStartOption | "";
  programStartDate: string;
  preferredIndustries: PartnerIndustry[];
  preferredJobRoles: CandidatePreferredJobRole[];
  skills: string;
  selfIntroduction: string;
  programMotivation: string;
};

type AdditionalInfoDocumentKey =
  | "resume"
  | "coverLetter"
  | "portfolio"
  | "passportCopy"
  | "enrollmentOrGraduationCertificate"
  | "careerCertificate";

type AdditionalInfoDocumentDraft = Record<AdditionalInfoDocumentKey, string>;

type CandidateEmergencyContactDraft = {
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
  emergencyContactAddress: string;
};

type CandidateMatchingResultDraft = {
  matchingResultNote: string;
};

const EMPTY_CANDIDATE_DRAFT: CandidateDraft = {
  name: "",
  email: "",
  phoneNumber: "",
  affiliation: "",
  nationality: "",
  gender: "",
  birthDate: "",
  jobTitle: "",
  password: ""
};

const visaTypeOptions: Array<{ value: CandidateVisaType; label: string }> = [
  { value: "D10_JOB_SEEKING", label: "D-10 (구직 비자)" },
  { value: "D2_STUDENT", label: "D-2 (유학 비자)" },
  { value: "D4_GENERAL_TRAINING", label: "D-4 (일반연수 비자)" },
  { value: "F2_RESIDENCE", label: "F-2 (거주 비자)" },
  { value: "F4_OVERSEAS_KOREAN", label: "F-4 (재외동포 비자)" },
  { value: "F5_PERMANENT_RESIDENCE", label: "F-5 (영주 비자)" },
  { value: "F6_MARRIAGE_IMMIGRATION", label: "F-6 (결혼 이민 비자)" },
  { value: "E7_SPECIFIC_ACTIVITY", label: "E-7 (특정활동 비자)" },
  { value: "H1_WORKING_HOLIDAY", label: "H-1 (관광취업 비자)" },
  { value: "OTHER", label: "기타" }
];

const EMPTY_CANDIDATE_PROFILE: CandidateProfileItem = {
  id: null,
  userId: null,
  workPermit: null,
  visaType: null,
  visaExpiryDate: null,
  livesInKorea: null,
  hasAccommodation: null,
  residenceProvince: null,
  residenceDistrict: null,
  residenceAddress: null,
  preferredProgramDuration: null,
  programStartOption: null,
  programStartDate: null,
  preferredIndustries: [],
  preferredJobRoles: [],
  skills: [],
  selfIntroduction: null,
  programMotivation: null,
  preferenceConditionNote: null,
  capabilityNote: null,
  additionalInfoNote: null,
  emergencyContactName: null,
  emergencyContactRelation: null,
  emergencyContactPhone: null,
  emergencyContactEmail: null,
  emergencyContactAddress: null,
  matchingResultNote: null,
  educations: [],
  languageSkills: [],
  careers: [],
  activityExperiences: [],
  createdAt: null,
  updatedAt: null
};

const EMPTY_VISA_RESIDENCE_DRAFT: CandidateVisaResidenceDraft = {
  workPermit: "unset",
  visaType: "",
  visaExpiryDate: "",
  livesInKorea: "unset",
  hasAccommodation: "unset",
  residenceProvince: "",
  residenceDistrict: "",
  residenceAddress: ""
};

const educationTypeOptions: Array<{ value: CandidateEducationType; label: string }> = [
  { value: "HIGH_SCHOOL", label: "고등학교" },
  { value: "ASSOCIATE", label: "전문학사" },
  { value: "BACHELOR", label: "학사" },
  { value: "MASTER", label: "석사" },
  { value: "DOCTOR", label: "박사" },
  { value: "BOOTCAMP", label: "부트캠프" },
  { value: "CERTIFICATE", label: "자격증" },
  { value: "OTHER", label: "기타" }
];

const educationStatusOptions: Array<{ value: CandidateEducationStatus; label: string }> = [
  { value: "ENROLLED", label: "재학" },
  { value: "GRADUATED", label: "졸업" },
  { value: "LEAVE_OF_ABSENCE", label: "휴학" },
  { value: "DROPPED_OUT", label: "중퇴" },
  { value: "OTHER", label: "기타" }
];

const languageTypeOptions: Array<{ value: CandidateLanguageType; label: string }> = [
  { value: "KOREAN", label: "한국어" },
  { value: "ENGLISH", label: "영어" },
  { value: "CHINESE", label: "중국어" },
  { value: "JAPANESE", label: "일본어" },
  { value: "VIETNAMESE", label: "베트남어" },
  { value: "INDONESIAN", label: "인도네시아어" },
  { value: "THAI", label: "태국어" },
  { value: "MALAY", label: "말레이어" },
  { value: "FILIPINO", label: "필리핀어" },
  { value: "HINDI", label: "힌디어" },
  { value: "SPANISH", label: "스페인어" },
  { value: "FRENCH", label: "프랑스어" },
  { value: "GERMAN", label: "독일어" },
  { value: "OTHER", label: "기타" }
];

const languageLevelOptions: Array<{ value: CandidateLanguageLevel; label: string }> = [
  { value: "BEGINNER", label: "초급" },
  { value: "INTERMEDIATE", label: "중급" },
  { value: "ADVANCED", label: "고급" },
  { value: "NATIVE", label: "원어민" }
];

const activityTypeOptions: Array<{ value: CandidateActivityType; label: string }> = [
  { value: "PROJECT", label: "프로젝트" },
  { value: "VOLUNTEER", label: "봉사활동" },
  { value: "INTERNSHIP", label: "인턴십" },
  { value: "CERTIFICATE", label: "자격증" },
  { value: "AWARD", label: "수상" },
  { value: "EXTRACURRICULAR", label: "교외활동" },
  { value: "OTHER", label: "기타" }
];

const programDurationOptions: Array<{ value: CandidateProgramDuration; label: string }> = [
  { value: "WEEKS_6", label: "6주" },
  { value: "WEEKS_8", label: "8주" },
  { value: "WEEKS_10", label: "10주" },
  { value: "WEEKS_12", label: "12주" },
  { value: "WEEKS_14", label: "14주" },
  { value: "WEEKS_16", label: "16주" },
  { value: "NEGOTIABLE", label: "협의 가능" }
];

const programStartOptionOptions: Array<{ value: CandidateProgramStartOption; label: string }> = [
  { value: "ASAP", label: "가능한 빨리" },
  { value: "SPECIFIC_DATE", label: "특정한 날짜" }
];

const preferredJobRoleOptions: Array<{ value: CandidatePreferredJobRole; label: string }> = [
  { value: "SOFTWARE_DEVELOPMENT", label: "소프트웨어 개발" },
  { value: "FRONTEND_DEVELOPMENT", label: "프론트엔드 개발" },
  { value: "BACKEND_DEVELOPMENT", label: "백엔드 개발" },
  { value: "DATA_ANALYSIS_SCIENCE", label: "데이터 분석/사이언스" },
  { value: "UI_UX_DESIGN", label: "UI/UX 디자인" },
  { value: "PRODUCT_MANAGER", label: "프로덕트 매니저" },
  { value: "MARKETING", label: "마케팅" },
  { value: "SALES", label: "영업/세일즈" },
  { value: "HR", label: "인사/HR" },
  { value: "FINANCE_ACCOUNTING", label: "재무/회계" },
  { value: "OPERATIONS_PLANNING", label: "운영/기획" },
  { value: "OTHER", label: "기타" }
];

const partnerIndustryLabelMap: Record<string, string> = {
  EDUCATION: "교육 / Education",
  AGRICULTURE: "농업 / Agriculture",
  AGRICULTURAL_PRODUCTS: "농산물 / Agricultural Products",
  PETS: "반려동물 / Pets",
  FITNESS: "피트니스 / Fitness",
  WELLNESS: "웰니스 / Wellness",
  BEAUTY: "뷰티 / Beauty",
  TRAVEL: "여행 / Travel",
  GOLF: "골프",
  IT: "IT",
  DEVELOPMENT: "개발 / Development",
  AI: "AI",
  LLM: "LLM",
  DEEP_LEARNING: "딥러닝 / Deep Learning",
  IOT: "IoT",
  IMAGE_PROCESSING: "영상처리 / Image Processing",
  THREE_D: "3D",
  DEVICE: "디바이스 / Device",
  APP_TECH: "앱테크 / App Tech",
  STARTUP: "스타트업 / Startup",
  PLATFORM: "플랫폼 / Platform",
  COMMERCE: "커머스 / Commerce",
  AGENCY: "에이전시 / Agency",
  COMMUNITY: "커뮤니티 / Community",
  GLOBAL: "글로벌 / Global",
  B2B: "B2B",
  SAAS: "SaaS",
  PRODUCTIVITY: "업무생산성 / Productivity",
  CRM: "CRM",
  AUTOMATION: "자동화 / Automation",
  CONSULTING: "컨설팅 / Consulting",
  ADVERTISING: "광고 / Advertising",
  MARKETING: "마케팅 / Marketing",
  CONTENT: "콘텐츠 / Content",
  WEB_NOVEL: "웹소설 / Web Novel",
  K_POP: "K-pop",
  CHARACTER: "캐릭터 / Character",
  AVATAR: "아바타 / Avatar",
  VIRTUAL: "버추얼 / Virtual",
  PUBLIC_DATA: "공공데이터 / Public Data",
  CONSTRUCTION: "건설 / Construction",
  FOREIGNER: "외국인 / Foreigner",
  HR: "HR",
  MENTAL_CARE: "멘탈케어 / Mental Care",
  RENTAL: "렌탈 / Rental"
};

const EMPTY_EDUCATION_DRAFT: CandidateEducationDraft = {
  schoolName: "",
  educationType: "BACHELOR",
  major: "",
  status: "ENROLLED",
  country: "",
  city: "",
  startDate: "",
  endDate: "",
  isKoreanSchool: "unset"
};

const EMPTY_LANGUAGE_SKILL_DRAFT: CandidateLanguageSkillDraft = {
  language: "ENGLISH",
  level: "INTERMEDIATE",
  testName: "",
  score: ""
};

const EMPTY_CAREER_DRAFT: CandidateCareerDraft = {
  companyName: "",
  position: "",
  department: "",
  isCurrent: "no",
  startDate: "",
  endDate: "",
  description: ""
};

const EMPTY_ACTIVITY_EXPERIENCE_DRAFT: CandidateActivityExperienceDraft = {
  title: "",
  activityType: "PROJECT",
  organization: "",
  startDate: "",
  endDate: "",
  description: "",
  skills: ""
};

const EMPTY_PREFERENCE_CAPABILITY_DRAFT: CandidatePreferenceCapabilityDraft = {
  preferredProgramDuration: "",
  programStartOption: "",
  programStartDate: "",
  preferredIndustries: [],
  preferredJobRoles: [],
  skills: "",
  selfIntroduction: "",
  programMotivation: ""
};

const ADDITIONAL_INFO_DOCUMENT_ITEMS: Array<{ key: AdditionalInfoDocumentKey; title: string }> = [
  { key: "resume", title: "이력서" },
  { key: "coverLetter", title: "커버레터" },
  { key: "portfolio", title: "포트폴리오" },
  { key: "passportCopy", title: "여권 사본" },
  { key: "enrollmentOrGraduationCertificate", title: "재학/졸업 증명서" },
  { key: "careerCertificate", title: "경력 증명서" }
];

const EMPTY_ADDITIONAL_INFO_DOCUMENT_DRAFT: AdditionalInfoDocumentDraft = {
  resume: "",
  coverLetter: "",
  portfolio: "",
  passportCopy: "",
  enrollmentOrGraduationCertificate: "",
  careerCertificate: ""
};

const EMPTY_EMERGENCY_CONTACT_DRAFT: CandidateEmergencyContactDraft = {
  emergencyContactName: "",
  emergencyContactRelation: "",
  emergencyContactPhone: "",
  emergencyContactEmail: "",
  emergencyContactAddress: ""
};

const EMPTY_MATCHING_RESULT_DRAFT: CandidateMatchingResultDraft = {
  matchingResultNote: ""
};

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  return entry ? decodeURIComponent(entry.split("=")[1] ?? "") : "";
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ko-KR");
}

function formatDateCompact(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
}

function toUtcDateOnly(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function addYearsClampedUtc(base: Date, years: number) {
  const year = base.getUTCFullYear() + years;
  const month = base.getUTCMonth();
  const day = base.getUTCDate();
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfMonth)));
}

function addMonthsClampedUtc(base: Date, months: number) {
  const rawMonth = base.getUTCMonth() + months;
  const year = base.getUTCFullYear() + Math.floor(rawMonth / 12);
  const month = ((rawMonth % 12) + 12) % 12;
  const day = base.getUTCDate();
  const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(day, lastDayOfMonth)));
}

function periodDurationLabel(startDate?: string | null, endDate?: string | null) {
  if (!startDate || !endDate) return "기간 -";

  let start = toUtcDateOnly(startDate);
  let end = toUtcDateOnly(endDate);
  if (!start || !end) return "기간 -";
  if (end < start) [start, end] = [end, start];

  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let anchor = addYearsClampedUtc(start, years);
  if (anchor > end) {
    years -= 1;
    anchor = addYearsClampedUtc(start, years);
  }

  let months = (end.getUTCFullYear() - anchor.getUTCFullYear()) * 12 + (end.getUTCMonth() - anchor.getUTCMonth());
  let monthAnchor = addMonthsClampedUtc(anchor, months);
  if (monthAnchor > end) {
    months -= 1;
    monthAnchor = addMonthsClampedUtc(anchor, months);
  }

  const days = Math.floor((end.getTime() - monthAnchor.getTime()) / (1000 * 60 * 60 * 24));
  const normalizedDays = years === 0 && months === 0 && days === 0 ? 1 : days;

  if (years > 0) return `기간 ${years}년 ${months}개월 ${normalizedDays}일`;
  if (months > 0) return `기간 ${months}개월 ${normalizedDays}일`;
  return `기간 ${normalizedDays}일`;
}

function periodMainLabel(startDate?: string | null, endDate?: string | null, isCurrent = false) {
  const startLabel = formatDateCompact(startDate);
  const endLabel = endDate ? formatDateCompact(endDate) : isCurrent ? "현재" : "-";
  return `${startLabel} ~ ${endLabel}`;
}

function periodSubLabel(startDate?: string | null, endDate?: string | null, isCurrent = false) {
  if (endDate) return periodDurationLabel(startDate, endDate);
  if (!isCurrent || !startDate) return "기간 -";
  return periodDurationLabel(startDate, new Date().toISOString());
}

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function emailVerifiedLabel(emailVerified: boolean) {
  return emailVerified ? "승인 완료" : "승인 대기";
}

function normalizeGender(value?: string | null): CandidateDraft["gender"] {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "";

  if (
    normalized === "male" ||
    normalized === "m" ||
    normalized === "man" ||
    normalized === "남" ||
    normalized === "남자" ||
    normalized === "남성"
  ) {
    return "male";
  }

  if (
    normalized === "female" ||
    normalized === "f" ||
    normalized === "woman" ||
    normalized === "여" ||
    normalized === "여자" ||
    normalized === "여성"
  ) {
    return "female";
  }

  if (
    normalized === "secret" ||
    normalized === "unknown" ||
    normalized === "prefer_not_to_say" ||
    normalized === "비밀" ||
    normalized === "비밀이에요"
  ) {
    return "secret";
  }

  return "";
}

function genderLabel(value?: string | null) {
  const normalized = normalizeGender(value);
  if (normalized === "male") return "남성";
  if (normalized === "female") return "여성";
  if (normalized === "secret") return "비밀이에요";
  return "-";
}

function yesNoUnsetToNullableBoolean(value: "yes" | "no" | "unset") {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function nullableBooleanToYesNoUnset(value: boolean | null | undefined): "yes" | "no" | "unset" {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "unset";
}

function yesNoLabel(value: boolean | null | undefined) {
  if (value === true) return "예";
  if (value === false) return "아니오";
  return "-";
}

function visaTypeLabel(value: CandidateVisaType | null | undefined) {
  if (!value) return "-";
  return visaTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function educationTypeLabel(value: CandidateEducationType) {
  return educationTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function educationStatusLabel(value: CandidateEducationStatus) {
  return educationStatusOptions.find((option) => option.value === value)?.label ?? value;
}

function languageTypeLabel(value: CandidateLanguageType) {
  return languageTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function languageLevelLabel(value: CandidateLanguageLevel) {
  return languageLevelOptions.find((option) => option.value === value)?.label ?? value;
}

function activityTypeLabel(value: CandidateActivityType) {
  return activityTypeOptions.find((option) => option.value === value)?.label ?? value;
}

function programDurationLabel(value?: CandidateProgramDuration | null) {
  if (!value) return "-";
  return programDurationOptions.find((option) => option.value === value)?.label ?? value;
}

function programStartOptionLabel(value?: CandidateProgramStartOption | null) {
  if (!value) return "-";
  return programStartOptionOptions.find((option) => option.value === value)?.label ?? value;
}

function preferredJobRoleLabel(value: CandidatePreferredJobRole) {
  return preferredJobRoleOptions.find((option) => option.value === value)?.label ?? value;
}

function partnerIndustryLabel(value: PartnerIndustry) {
  return partnerIndustryLabelMap[value] ?? value;
}

function calculateCandidateProfileCompletion(
  member: Pick<MemberItem, "name" | "email" | "phoneNumber" | "affiliation" | "nationality" | "gender" | "birthDate" | "jobTitle"> | null | undefined,
  profile: CandidateProfileItem | null | undefined
) {
  const safeProfile = profile ?? EMPTY_CANDIDATE_PROFILE;
  const checks: boolean[] = [
    Boolean(member?.name?.trim()),
    Boolean(member?.email?.trim()),
    Boolean(member?.phoneNumber?.trim()),
    Boolean(member?.affiliation?.trim()),
    Boolean(member?.nationality?.trim()),
    Boolean(normalizeGender(member?.gender)),
    Boolean(member?.birthDate),
    Boolean(member?.jobTitle?.trim()),
    safeProfile.workPermit !== null,
    Boolean(safeProfile.visaType),
    Boolean(safeProfile.visaExpiryDate),
    safeProfile.livesInKorea !== null,
    safeProfile.hasAccommodation !== null,
    Boolean(safeProfile.residenceProvince?.trim()),
    Boolean(safeProfile.residenceDistrict?.trim()),
    Boolean(safeProfile.residenceAddress?.trim()),
    safeProfile.educations.length > 0,
    safeProfile.languageSkills.length > 0,
    safeProfile.careers.length > 0,
    safeProfile.activityExperiences.length > 0,
    Boolean(safeProfile.preferredProgramDuration),
    Boolean(safeProfile.programStartOption),
    safeProfile.programStartOption !== "SPECIFIC_DATE" || Boolean(safeProfile.programStartDate),
    safeProfile.preferredIndustries.length > 0,
    safeProfile.preferredJobRoles.length > 0,
    safeProfile.skills.length > 0,
    Boolean(safeProfile.selfIntroduction?.trim()),
    Boolean(safeProfile.programMotivation?.trim()),
    Boolean(safeProfile.emergencyContactName?.trim()),
    Boolean(safeProfile.emergencyContactRelation?.trim()),
    Boolean(safeProfile.emergencyContactPhone?.trim()),
    Boolean(safeProfile.emergencyContactEmail?.trim()),
    Boolean(safeProfile.emergencyContactAddress?.trim())
  ];
  const total = checks.length;
  const filled = checks.filter(Boolean).length;
  const percent = total > 0 ? Math.round((filled / total) * 100) : 0;
  return { percent, filled, total };
}

function profileCompletionTone(percent: number) {
  if (percent < 25) return "very-low";
  if (percent < 50) return "low";
  if (percent < 75) return "medium";
  return "high";
}

function visaResidenceDraftFromProfile(profile: CandidateProfileItem | null): CandidateVisaResidenceDraft {
  if (!profile) return { ...EMPTY_VISA_RESIDENCE_DRAFT };
  return {
    workPermit: nullableBooleanToYesNoUnset(profile.workPermit),
    visaType: profile.visaType ?? "",
    visaExpiryDate: toDateInputValue(profile.visaExpiryDate),
    livesInKorea: nullableBooleanToYesNoUnset(profile.livesInKorea),
    hasAccommodation: nullableBooleanToYesNoUnset(profile.hasAccommodation),
    residenceProvince: profile.residenceProvince ?? "",
    residenceDistrict: profile.residenceDistrict ?? "",
    residenceAddress: profile.residenceAddress ?? ""
  };
}

function preferenceCapabilityDraftFromProfile(profile: CandidateProfileItem | null): CandidatePreferenceCapabilityDraft {
  if (!profile) return { ...EMPTY_PREFERENCE_CAPABILITY_DRAFT };
  return {
    preferredProgramDuration: profile.preferredProgramDuration ?? "",
    programStartOption: profile.programStartOption ?? "",
    programStartDate: toDateInputValue(profile.programStartDate),
    preferredIndustries: profile.preferredIndustries ?? [],
    preferredJobRoles: profile.preferredJobRoles ?? [],
    skills: (profile.skills ?? []).join(", "),
    selfIntroduction: profile.selfIntroduction ?? "",
    programMotivation: profile.programMotivation ?? ""
  };
}

function emergencyContactDraftFromProfile(profile: CandidateProfileItem | null): CandidateEmergencyContactDraft {
  if (!profile) return { ...EMPTY_EMERGENCY_CONTACT_DRAFT };
  return {
    emergencyContactName: profile.emergencyContactName ?? "",
    emergencyContactRelation: profile.emergencyContactRelation ?? "",
    emergencyContactPhone: profile.emergencyContactPhone ?? "",
    emergencyContactEmail: profile.emergencyContactEmail ?? "",
    emergencyContactAddress: profile.emergencyContactAddress ?? ""
  };
}

function matchingResultDraftFromProfile(profile: CandidateProfileItem | null): CandidateMatchingResultDraft {
  if (!profile) return { ...EMPTY_MATCHING_RESULT_DRAFT };
  return {
    matchingResultNote: profile.matchingResultNote ?? ""
  };
}

export default function CandidateManagementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const apiBaseUrl = useMemo(() => process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000", []);
  const isEmbeddedDetailOnly = searchParams.get("embed") === "detail-only";

  const [items, setItems] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 40 | 100>(20);
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const detailDialogRef = useRef<HTMLDialogElement>(null);
  const createDialogRef = useRef<HTMLDialogElement>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<MemberItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<CandidateDetailTab>("basic");
  const [educationLanguageView, setEducationLanguageView] = useState<EducationLanguageView>("list");
  const [careerView, setCareerView] = useState<CareerView>("list");
  const [activityExperienceView, setActivityExperienceView] = useState<ActivityExperienceView>("list");
  const [isBasicEditMode, setIsBasicEditMode] = useState(false);
  const [basicDraft, setBasicDraft] = useState<CandidateDraft>(EMPTY_CANDIDATE_DRAFT);
  const [basicSaving, setBasicSaving] = useState(false);
  const [isMemoEditMode, setIsMemoEditMode] = useState(false);
  const [memoDraft, setMemoDraft] = useState("");
  const [memoSaving, setMemoSaving] = useState(false);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfileItem>(EMPTY_CANDIDATE_PROFILE);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isVisaResidenceEditMode, setIsVisaResidenceEditMode] = useState(false);
  const [isEducationLanguageEditMode, setIsEducationLanguageEditMode] = useState(false);
  const [visaResidenceDraft, setVisaResidenceDraft] = useState<CandidateVisaResidenceDraft>(EMPTY_VISA_RESIDENCE_DRAFT);
  const [visaResidenceSaving, setVisaResidenceSaving] = useState(false);
  const [educationDraft, setEducationDraft] = useState<CandidateEducationDraft>(EMPTY_EDUCATION_DRAFT);
  const [educationEditingId, setEducationEditingId] = useState<string | null>(null);
  const [educationSubmitting, setEducationSubmitting] = useState(false);
  const [educationDeletingId, setEducationDeletingId] = useState<string | null>(null);
  const [languageSkillDraft, setLanguageSkillDraft] = useState<CandidateLanguageSkillDraft>(EMPTY_LANGUAGE_SKILL_DRAFT);
  const [languageSkillEditingId, setLanguageSkillEditingId] = useState<string | null>(null);
  const [languageSkillSubmitting, setLanguageSkillSubmitting] = useState(false);
  const [languageSkillDeletingId, setLanguageSkillDeletingId] = useState<string | null>(null);
  const [isCareerEditMode, setIsCareerEditMode] = useState(false);
  const [careerDraft, setCareerDraft] = useState<CandidateCareerDraft>(EMPTY_CAREER_DRAFT);
  const [careerEditingId, setCareerEditingId] = useState<string | null>(null);
  const [careerSubmitting, setCareerSubmitting] = useState(false);
  const [careerDeletingId, setCareerDeletingId] = useState<string | null>(null);
  const [isActivityExperienceEditMode, setIsActivityExperienceEditMode] = useState(false);
  const [activityExperienceDraft, setActivityExperienceDraft] = useState<CandidateActivityExperienceDraft>(
    EMPTY_ACTIVITY_EXPERIENCE_DRAFT
  );
  const [activityExperienceEditingId, setActivityExperienceEditingId] = useState<string | null>(null);
  const [activityExperienceSubmitting, setActivityExperienceSubmitting] = useState(false);
  const [activityExperienceDeletingId, setActivityExperienceDeletingId] = useState<string | null>(null);
  const [isPreferenceCapabilityEditMode, setIsPreferenceCapabilityEditMode] = useState(false);
  const [preferenceCapabilityDraft, setPreferenceCapabilityDraft] = useState<CandidatePreferenceCapabilityDraft>(
    EMPTY_PREFERENCE_CAPABILITY_DRAFT
  );
  const [preferenceCapabilitySaving, setPreferenceCapabilitySaving] = useState(false);
  const [isAdditionalInfoEditMode, setIsAdditionalInfoEditMode] = useState(false);
  const [additionalInfoDocuments, setAdditionalInfoDocuments] = useState<AdditionalInfoDocumentDraft>(
    EMPTY_ADDITIONAL_INFO_DOCUMENT_DRAFT
  );
  const [isEmergencyContactEditMode, setIsEmergencyContactEditMode] = useState(false);
  const [emergencyContactDraft, setEmergencyContactDraft] = useState<CandidateEmergencyContactDraft>(
    EMPTY_EMERGENCY_CONTACT_DRAFT
  );
  const [emergencyContactSaving, setEmergencyContactSaving] = useState(false);
  const [isMatchingResultEditMode, setIsMatchingResultEditMode] = useState(false);
  const [matchingResultDraft, setMatchingResultDraft] = useState<CandidateMatchingResultDraft>(EMPTY_MATCHING_RESULT_DRAFT);
  const [matchingResultSaving, setMatchingResultSaving] = useState(false);
  const [partnerIndustries, setPartnerIndustries] = useState<PartnerIndustry[]>([]);
  const [industryToAdd, setIndustryToAdd] = useState<PartnerIndustry>("");
  const [jobRoleToAdd, setJobRoleToAdd] = useState<CandidatePreferredJobRole | "">("");
  const [createDraft, setCreateDraft] = useState<CandidateDraft>(EMPTY_CANDIDATE_DRAFT);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [verificationMenu, setVerificationMenu] = useState<VerificationMenuState | null>(null);
  const [listProfileCompletionById, setListProfileCompletionById] = useState<Record<string, number | null>>({});
  const [listProfileCompletionLoadingById, setListProfileCompletionLoadingById] = useState<Record<string, boolean>>({});

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortOrder("asc");
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowsDownUp size={13} weight="bold" aria-hidden />;
    if (sortOrder === "asc") return <ArrowUp size={13} weight="bold" aria-hidden />;
    return <ArrowDown size={13} weight="bold" aria-hidden />;
  }

  async function fetchCandidates() {
    setLoading(true);
    setListErrorMessage(null);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        items?: MemberItem[];
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setListErrorMessage(payload.message ?? "후보자 목록을 불러오지 못했습니다.");
        return;
      }

      const students = (payload.items ?? []).filter((item) => item.role === "STUDENT");
      setItems(students);
    } catch {
      setListErrorMessage("서버 연결에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchCandidateMeta() {
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/partners/meta`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { ok?: boolean; partnerIndustries?: PartnerIndustry[] };
      if (!response.ok || !payload.ok) return;
      if (Array.isArray(payload.partnerIndustries) && payload.partnerIndustries.length > 0) {
        setPartnerIndustries(payload.partnerIndustries);
      }
    } catch {
      // noop: fallback to label map keys in UI
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    void fetchCandidates();
    void fetchCandidateMeta();
  }, []);

  useEffect(() => {
    const candidateId = searchParams.get("candidateId");
    if (!candidateId || loading) return;
    const target = items.find((item) => item.id === candidateId);
    if (!target) return;

    openDetailModal(target);

    if (isEmbeddedDetailOnly) return;
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("candidateId");
    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [isEmbeddedDetailOnly, items, loading, pathname, router, searchParams]);

  const filteredItems = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const name = item.name?.toLowerCase() ?? "";
      const email = item.email.toLowerCase();
      const phone = item.phoneNumber?.toLowerCase() ?? "";
      const affiliation = item.affiliation?.toLowerCase() ?? "";
      const nationality = item.nationality?.toLowerCase() ?? "";
      const gender = item.gender?.toLowerCase() ?? "";
      const genderDisplay = genderLabel(item.gender).toLowerCase();
      const job = item.jobTitle?.toLowerCase() ?? "";
      return (
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        affiliation.includes(q) ||
        nationality.includes(q) ||
        gender.includes(q) ||
        genderDisplay.includes(q) ||
        job.includes(q)
      );
    });
  }, [items, debouncedSearch]);

  const sortedItems = useMemo(() => {
    const normalize = (value: string | null | undefined) => (value ?? "").toLowerCase();
    const completionValue = (id: string) => {
      const value = listProfileCompletionById[id];
      return typeof value === "number" ? value : -1;
    };
    const sorted = [...filteredItems].sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = normalize(a.name).localeCompare(normalize(b.name), "ko");
      if (sortField === "email") cmp = a.email.localeCompare(b.email, "en");
      if (sortField === "phoneNumber") cmp = normalize(a.phoneNumber).localeCompare(normalize(b.phoneNumber), "en");
      if (sortField === "affiliation") cmp = normalize(a.affiliation).localeCompare(normalize(b.affiliation), "ko");
      if (sortField === "nationality") cmp = normalize(a.nationality).localeCompare(normalize(b.nationality), "ko");
      if (sortField === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortField === "completion") {
        const aValue = completionValue(a.id);
        const bValue = completionValue(b.id);
        const aMissing = aValue < 0;
        const bMissing = bValue < 0;
        if (aMissing && bMissing) cmp = 0;
        else if (aMissing) cmp = 1;
        else if (bMissing) cmp = -1;
        else cmp = aValue - bValue;
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [filteredItems, sortField, sortOrder, listProfileCompletionById]);

  const total = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, page, pageSize]);

  const pageButtons = useMemo(() => {
    const maxVisible = 7;
    const pages: number[] = [];
    const start = Math.max(1, page - 3);
    const end = Math.min(totalPages, start + maxVisible - 1);
    const normalizedStart = Math.max(1, end - maxVisible + 1);
    for (let i = normalizedStart; i <= end; i += 1) pages.push(i);
    return pages;
  }, [page, totalPages]);

  const availableIndustryOptions = useMemo(
    () => (partnerIndustries.length ? partnerIndustries : Object.keys(partnerIndustryLabelMap)),
    [partnerIndustries]
  );

  const industryCandidatesToAdd = useMemo(
    () => availableIndustryOptions.filter((item) => !preferenceCapabilityDraft.preferredIndustries.includes(item)),
    [availableIndustryOptions, preferenceCapabilityDraft.preferredIndustries]
  );

  const jobRoleCandidatesToAdd = useMemo(
    () => preferredJobRoleOptions.filter((item) => !preferenceCapabilityDraft.preferredJobRoles.includes(item.value)),
    [preferenceCapabilityDraft.preferredJobRoles]
  );

  const profileCompletion = useMemo(
    () => calculateCandidateProfileCompletion(selectedCandidate, candidateProfile),
    [selectedCandidate, candidateProfile]
  );

  useEffect(() => {
    const idsToFetch = pagedItems
      .map((item) => item.id)
      .filter((id) => listProfileCompletionById[id] === undefined && !listProfileCompletionLoadingById[id]);
    if (idsToFetch.length === 0) return;

    let cancelled = false;
    const token = readCookie(TOKEN_COOKIE_KEY);

    setListProfileCompletionLoadingById((prev) => {
      const next = { ...prev };
      idsToFetch.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    void Promise.all(
      idsToFetch.map(async (id) => {
        try {
          const response = await fetch(`${apiBaseUrl}/ops/candidates/${id}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const payload = (await response.json()) as { ok?: boolean; item?: CandidateProfileItem };
          if (!response.ok || !payload.ok || !payload.item) return [id, null] as const;
          const listItem = pagedItems.find((item) => item.id === id);
          const completion = calculateCandidateProfileCompletion(listItem, payload.item);
          return [id, completion.percent] as const;
        } catch {
          return [id, null] as const;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setListProfileCompletionById((prev) => {
        const next = { ...prev };
        results.forEach(([id, percent]) => {
          next[id] = percent;
        });
        return next;
      });
      setListProfileCompletionLoadingById((prev) => {
        const next = { ...prev };
        idsToFetch.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, pagedItems]);

  useEffect(() => {
    if (sortField !== "completion") return;
    const idsToFetch = filteredItems
      .map((item) => item.id)
      .filter((id) => listProfileCompletionById[id] === undefined && !listProfileCompletionLoadingById[id]);
    if (idsToFetch.length === 0) return;

    let cancelled = false;
    const token = readCookie(TOKEN_COOKIE_KEY);

    setListProfileCompletionLoadingById((prev) => {
      const next = { ...prev };
      idsToFetch.forEach((id) => {
        next[id] = true;
      });
      return next;
    });

    void Promise.all(
      idsToFetch.map(async (id) => {
        try {
          const response = await fetch(`${apiBaseUrl}/ops/candidates/${id}/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const payload = (await response.json()) as { ok?: boolean; item?: CandidateProfileItem };
          if (!response.ok || !payload.ok || !payload.item) return [id, null] as const;
          const listItem = filteredItems.find((item) => item.id === id);
          const completion = calculateCandidateProfileCompletion(listItem, payload.item);
          return [id, completion.percent] as const;
        } catch {
          return [id, null] as const;
        }
      })
    ).then((results) => {
      if (cancelled) return;
      setListProfileCompletionById((prev) => {
        const next = { ...prev };
        results.forEach(([id, percent]) => {
          next[id] = percent;
        });
        return next;
      });
      setListProfileCompletionLoadingById((prev) => {
        const next = { ...prev };
        idsToFetch.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, sortField, filteredItems]);

  async function fetchCandidateProfile(candidateId: string) {
    setProfileLoading(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${candidateId}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateProfileItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "비자&거주 정보를 불러오지 못했습니다.");
        return;
      }
      setCandidateProfile(payload.item);
      setVisaResidenceDraft(visaResidenceDraftFromProfile(payload.item));
      setPreferenceCapabilityDraft(preferenceCapabilityDraftFromProfile(payload.item));
      setEmergencyContactDraft(emergencyContactDraftFromProfile(payload.item));
      setMatchingResultDraft(matchingResultDraftFromProfile(payload.item));
    } catch {
      window.alert("비자&거주 정보 로딩 중 오류가 발생했습니다.");
    } finally {
      setProfileLoading(false);
    }
  }

  async function saveCandidateVisaResidence() {
    if (!selectedCandidate) return;
    setVisaResidenceSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workPermit: yesNoUnsetToNullableBoolean(visaResidenceDraft.workPermit),
          visaType: visaResidenceDraft.visaType || null,
          visaExpiryDate: visaResidenceDraft.visaExpiryDate ? `${visaResidenceDraft.visaExpiryDate}T00:00:00.000Z` : null,
          livesInKorea: yesNoUnsetToNullableBoolean(visaResidenceDraft.livesInKorea),
          hasAccommodation: yesNoUnsetToNullableBoolean(visaResidenceDraft.hasAccommodation),
          residenceProvince: visaResidenceDraft.residenceProvince.trim() || null,
          residenceDistrict: visaResidenceDraft.residenceDistrict.trim() || null,
          residenceAddress: visaResidenceDraft.residenceAddress.trim() || null
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateProfileItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "비자&거주 정보 저장에 실패했습니다.");
        return;
      }
      setCandidateProfile(payload.item);
      setVisaResidenceDraft(visaResidenceDraftFromProfile(payload.item));
      setIsVisaResidenceEditMode(false);
    } catch {
      window.alert("비자&거주 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setVisaResidenceSaving(false);
    }
  }

  async function savePreferenceCapability() {
    if (!selectedCandidate) return;
    setPreferenceCapabilitySaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const skills = Array.from(
        new Set(
          preferenceCapabilityDraft.skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          preferredProgramDuration: preferenceCapabilityDraft.preferredProgramDuration || null,
          programStartOption: preferenceCapabilityDraft.programStartOption || null,
          programStartDate:
            preferenceCapabilityDraft.programStartOption === "SPECIFIC_DATE" && preferenceCapabilityDraft.programStartDate
              ? `${preferenceCapabilityDraft.programStartDate}T00:00:00.000Z`
              : null,
          preferredIndustries: preferenceCapabilityDraft.preferredIndustries,
          preferredJobRoles: preferenceCapabilityDraft.preferredJobRoles,
          skills,
          selfIntroduction: preferenceCapabilityDraft.selfIntroduction.trim() || null,
          programMotivation: preferenceCapabilityDraft.programMotivation.trim() || null
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateProfileItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "선호 조건/역량 정보 저장에 실패했습니다.");
        return;
      }
      setCandidateProfile(payload.item);
      setPreferenceCapabilityDraft(preferenceCapabilityDraftFromProfile(payload.item));
      setIsPreferenceCapabilityEditMode(false);
    } catch {
      window.alert("선호 조건/역량 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setPreferenceCapabilitySaving(false);
    }
  }

  function handleAdditionalInfoDocumentSelect(key: AdditionalInfoDocumentKey, fileList: FileList | null) {
    const file = fileList?.[0];
    setAdditionalInfoDocuments((prev) => ({
      ...prev,
      [key]: file?.name ?? ""
    }));
  }

  async function saveEmergencyContact() {
    if (!selectedCandidate) return;
    setEmergencyContactSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          emergencyContactName: emergencyContactDraft.emergencyContactName.trim() || null,
          emergencyContactRelation: emergencyContactDraft.emergencyContactRelation.trim() || null,
          emergencyContactPhone: emergencyContactDraft.emergencyContactPhone.trim() || null,
          emergencyContactEmail: emergencyContactDraft.emergencyContactEmail.trim() || null,
          emergencyContactAddress: emergencyContactDraft.emergencyContactAddress.trim() || null
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateProfileItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "비상 연락망 저장에 실패했습니다.");
        return;
      }
      setCandidateProfile(payload.item);
      setEmergencyContactDraft(emergencyContactDraftFromProfile(payload.item));
      setIsEmergencyContactEditMode(false);
    } catch {
      window.alert("비상 연락망 저장 중 오류가 발생했습니다.");
    } finally {
      setEmergencyContactSaving(false);
    }
  }

  async function saveMatchingResult() {
    if (!selectedCandidate) return;
    setMatchingResultSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          matchingResultNote: matchingResultDraft.matchingResultNote.trim() || null
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateProfileItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "매칭 결과 저장에 실패했습니다.");
        return;
      }
      setCandidateProfile(payload.item);
      setMatchingResultDraft(matchingResultDraftFromProfile(payload.item));
      setIsMatchingResultEditMode(false);
    } catch {
      window.alert("매칭 결과 저장 중 오류가 발생했습니다.");
    } finally {
      setMatchingResultSaving(false);
    }
  }

  async function addEducation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCandidate) return;
    setEducationSubmitting(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(
        educationEditingId
          ? `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/educations/${educationEditingId}`
          : `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/educations`,
        {
        method: educationEditingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          schoolName: educationDraft.schoolName.trim(),
          educationType: educationDraft.educationType,
          major: educationDraft.major.trim() || null,
          status: educationDraft.status,
          country: educationDraft.country.trim() || null,
          city: educationDraft.city.trim() || null,
          startDate: educationDraft.startDate ? `${educationDraft.startDate}T00:00:00.000Z` : null,
          endDate: educationDraft.endDate ? `${educationDraft.endDate}T00:00:00.000Z` : null,
          isKoreanSchool: yesNoUnsetToNullableBoolean(educationDraft.isKoreanSchool)
        })
      }
      );
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateEducationItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? (educationEditingId ? "학력 정보 수정에 실패했습니다." : "학력 정보 추가에 실패했습니다."));
        return;
      }
      setCandidateProfile((prev) => ({
        ...prev,
        educations: educationEditingId
          ? prev.educations.map((item) => (item.id === payload.item!.id ? payload.item! : item))
          : [payload.item!, ...prev.educations]
      }));
      setEducationDraft(EMPTY_EDUCATION_DRAFT);
      setEducationEditingId(null);
      setEducationLanguageView("list");
    } catch {
      window.alert(educationEditingId ? "학력 정보 수정 중 오류가 발생했습니다." : "학력 정보 추가 중 오류가 발생했습니다.");
    } finally {
      setEducationSubmitting(false);
    }
  }

  async function deleteEducation(educationId: string) {
    if (!selectedCandidate) return;
    const confirmed = window.confirm("학력 정보를 삭제할까요?");
    if (!confirmed) return;
    setEducationDeletingId(educationId);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/educations/${educationId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "학력 정보 삭제에 실패했습니다.");
        return;
      }
      setCandidateProfile((prev) => ({ ...prev, educations: prev.educations.filter((item) => item.id !== educationId) }));
    } catch {
      window.alert("학력 정보 삭제 중 오류가 발생했습니다.");
    } finally {
      setEducationDeletingId(null);
    }
  }

  async function addLanguageSkill(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCandidate) return;
    setLanguageSkillSubmitting(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(
        languageSkillEditingId
          ? `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/language-skills/${languageSkillEditingId}`
          : `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/language-skills`,
        {
        method: languageSkillEditingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          language: languageSkillDraft.language,
          level: languageSkillDraft.level,
          testName: languageSkillDraft.testName.trim() || null,
          score: languageSkillDraft.score.trim() || null
        })
      }
      );
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateLanguageSkillItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? (languageSkillEditingId ? "어학 정보 수정에 실패했습니다." : "어학 정보 추가에 실패했습니다."));
        return;
      }
      setCandidateProfile((prev) => ({
        ...prev,
        languageSkills: languageSkillEditingId
          ? prev.languageSkills.map((item) => (item.id === payload.item!.id ? payload.item! : item))
          : [payload.item!, ...prev.languageSkills]
      }));
      setLanguageSkillDraft(EMPTY_LANGUAGE_SKILL_DRAFT);
      setLanguageSkillEditingId(null);
      setEducationLanguageView("list");
    } catch {
      window.alert(languageSkillEditingId ? "어학 정보 수정 중 오류가 발생했습니다." : "어학 정보 추가 중 오류가 발생했습니다.");
    } finally {
      setLanguageSkillSubmitting(false);
    }
  }

  async function deleteLanguageSkill(languageSkillId: string) {
    if (!selectedCandidate) return;
    const confirmed = window.confirm("어학 정보를 삭제할까요?");
    if (!confirmed) return;
    setLanguageSkillDeletingId(languageSkillId);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(
        `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/language-skills/${languageSkillId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "어학 정보 삭제에 실패했습니다.");
        return;
      }
      setCandidateProfile((prev) => ({
        ...prev,
        languageSkills: prev.languageSkills.filter((item) => item.id !== languageSkillId)
      }));
    } catch {
      window.alert("어학 정보 삭제 중 오류가 발생했습니다.");
    } finally {
      setLanguageSkillDeletingId(null);
    }
  }

  async function addCareer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCandidate) return;
    setCareerSubmitting(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(
        careerEditingId
          ? `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/careers/${careerEditingId}`
          : `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/careers`,
        {
        method: careerEditingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          companyName: careerDraft.companyName.trim(),
          position: careerDraft.position.trim(),
          department: careerDraft.department.trim() || null,
          isCurrent: careerDraft.isCurrent === "yes",
          startDate: careerDraft.startDate ? `${careerDraft.startDate}T00:00:00.000Z` : null,
          endDate: careerDraft.isCurrent === "yes" ? null : careerDraft.endDate ? `${careerDraft.endDate}T00:00:00.000Z` : null,
          description: careerDraft.description.trim() || null
        })
      }
      );
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateCareerItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? (careerEditingId ? "경력 정보 수정에 실패했습니다." : "경력 정보 추가에 실패했습니다."));
        return;
      }
      setCandidateProfile((prev) => ({
        ...prev,
        careers: careerEditingId
          ? prev.careers.map((item) => (item.id === payload.item!.id ? payload.item! : item))
          : [payload.item!, ...prev.careers]
      }));
      setCareerDraft(EMPTY_CAREER_DRAFT);
      setCareerEditingId(null);
      setCareerView("list");
    } catch {
      window.alert(careerEditingId ? "경력 정보 수정 중 오류가 발생했습니다." : "경력 정보 추가 중 오류가 발생했습니다.");
    } finally {
      setCareerSubmitting(false);
    }
  }

  async function deleteCareer(careerId: string) {
    if (!selectedCandidate) return;
    const confirmed = window.confirm("경력 정보를 삭제할까요?");
    if (!confirmed) return;
    setCareerDeletingId(careerId);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/careers/${careerId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "경력 정보 삭제에 실패했습니다.");
        return;
      }
      setCandidateProfile((prev) => ({ ...prev, careers: prev.careers.filter((item) => item.id !== careerId) }));
    } catch {
      window.alert("경력 정보 삭제 중 오류가 발생했습니다.");
    } finally {
      setCareerDeletingId(null);
    }
  }

  async function addActivityExperience(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCandidate) return;
    setActivityExperienceSubmitting(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const skills = Array.from(
        new Set(
          activityExperienceDraft.skills
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        )
      );
      const response = await fetch(
        activityExperienceEditingId
          ? `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/activity-experiences/${activityExperienceEditingId}`
          : `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/activity-experiences`,
        {
          method: activityExperienceEditingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: activityExperienceDraft.title.trim(),
            activityType: activityExperienceDraft.activityType,
            organization: activityExperienceDraft.organization.trim() || null,
            startDate: activityExperienceDraft.startDate ? `${activityExperienceDraft.startDate}T00:00:00.000Z` : null,
            endDate: activityExperienceDraft.endDate ? `${activityExperienceDraft.endDate}T00:00:00.000Z` : null,
            description: activityExperienceDraft.description.trim() || null,
            skills
          })
        }
      );
      const payload = (await response.json()) as { ok?: boolean; item?: CandidateActivityExperienceItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(
          payload.message ??
            (activityExperienceEditingId ? "활동/경험 정보 수정에 실패했습니다." : "활동/경험 정보 추가에 실패했습니다.")
        );
        return;
      }
      setCandidateProfile((prev) => ({
        ...prev,
        activityExperiences: activityExperienceEditingId
          ? prev.activityExperiences.map((item) => (item.id === payload.item!.id ? payload.item! : item))
          : [payload.item!, ...prev.activityExperiences]
      }));
      setActivityExperienceDraft(EMPTY_ACTIVITY_EXPERIENCE_DRAFT);
      setActivityExperienceEditingId(null);
      setActivityExperienceView("list");
    } catch {
      window.alert(
        activityExperienceEditingId ? "활동/경험 정보 수정 중 오류가 발생했습니다." : "활동/경험 정보 추가 중 오류가 발생했습니다."
      );
    } finally {
      setActivityExperienceSubmitting(false);
    }
  }

  async function deleteActivityExperience(activityExperienceId: string) {
    if (!selectedCandidate) return;
    const confirmed = window.confirm("활동/경험 정보를 삭제할까요?");
    if (!confirmed) return;
    setActivityExperienceDeletingId(activityExperienceId);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(
        `${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/activity-experiences/${activityExperienceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        window.alert(payload.message ?? "활동/경험 정보 삭제에 실패했습니다.");
        return;
      }
      setCandidateProfile((prev) => ({
        ...prev,
        activityExperiences: prev.activityExperiences.filter((item) => item.id !== activityExperienceId)
      }));
    } catch {
      window.alert("활동/경험 정보 삭제 중 오류가 발생했습니다.");
    } finally {
      setActivityExperienceDeletingId(null);
    }
  }

  function openDetailModal(item: MemberItem) {
    setSelectedCandidate(item);
    setDetailTab("basic");
    setEducationLanguageView("list");
    setCareerView("list");
    setActivityExperienceView("list");
    setIsBasicEditMode(false);
    setBasicDraft({
      name: item.name ?? "",
      email: item.email ?? "",
      phoneNumber: item.phoneNumber ?? "",
      affiliation: item.affiliation ?? "",
      nationality: item.nationality ?? "",
      gender: normalizeGender(item.gender),
      birthDate: toDateInputValue(item.birthDate),
      jobTitle: item.jobTitle ?? "",
      password: ""
    });
    setIsMemoEditMode(false);
    setMemoDraft(item.adminMemo ?? "");
    setCandidateProfile(EMPTY_CANDIDATE_PROFILE);
    setProfileLoading(true);
    setIsVisaResidenceEditMode(false);
    setIsEducationLanguageEditMode(false);
    setVisaResidenceDraft(EMPTY_VISA_RESIDENCE_DRAFT);
    setVisaResidenceSaving(false);
    setEducationDraft(EMPTY_EDUCATION_DRAFT);
    setEducationEditingId(null);
    setEducationSubmitting(false);
    setEducationDeletingId(null);
    setLanguageSkillDraft(EMPTY_LANGUAGE_SKILL_DRAFT);
    setLanguageSkillEditingId(null);
    setLanguageSkillSubmitting(false);
    setLanguageSkillDeletingId(null);
    setIsCareerEditMode(false);
    setCareerDraft(EMPTY_CAREER_DRAFT);
    setCareerEditingId(null);
    setCareerSubmitting(false);
    setCareerDeletingId(null);
    setIsPreferenceCapabilityEditMode(false);
    setPreferenceCapabilityDraft(EMPTY_PREFERENCE_CAPABILITY_DRAFT);
    setPreferenceCapabilitySaving(false);
    setIsAdditionalInfoEditMode(false);
    setAdditionalInfoDocuments(EMPTY_ADDITIONAL_INFO_DOCUMENT_DRAFT);
    setIsEmergencyContactEditMode(false);
    setEmergencyContactDraft(EMPTY_EMERGENCY_CONTACT_DRAFT);
    setEmergencyContactSaving(false);
    setIsMatchingResultEditMode(false);
    setMatchingResultDraft(EMPTY_MATCHING_RESULT_DRAFT);
    setMatchingResultSaving(false);
    setIndustryToAdd("");
    setJobRoleToAdd("");
    setIsActivityExperienceEditMode(false);
    setActivityExperienceDraft(EMPTY_ACTIVITY_EXPERIENCE_DRAFT);
    setActivityExperienceEditingId(null);
    setActivityExperienceSubmitting(false);
    setActivityExperienceDeletingId(null);
    setVerificationMenu(null);
    setIsDetailModalOpen(true);
    void fetchCandidateProfile(item.id);
  }

  function requestCloseDetailModal() {
    setIsDetailModalOpen(false);
    setDetailTab("basic");
    setEducationLanguageView("list");
    setCareerView("list");
    setActivityExperienceView("list");
    setIsBasicEditMode(false);
    setBasicDraft(EMPTY_CANDIDATE_DRAFT);
    setBasicSaving(false);
    setIsMemoEditMode(false);
    setMemoDraft("");
    setMemoSaving(false);
    setCandidateProfile(EMPTY_CANDIDATE_PROFILE);
    setProfileLoading(false);
    setIsVisaResidenceEditMode(false);
    setIsEducationLanguageEditMode(false);
    setVisaResidenceDraft(EMPTY_VISA_RESIDENCE_DRAFT);
    setVisaResidenceSaving(false);
    setEducationDraft(EMPTY_EDUCATION_DRAFT);
    setEducationEditingId(null);
    setEducationSubmitting(false);
    setEducationDeletingId(null);
    setLanguageSkillDraft(EMPTY_LANGUAGE_SKILL_DRAFT);
    setLanguageSkillEditingId(null);
    setLanguageSkillSubmitting(false);
    setLanguageSkillDeletingId(null);
    setIsCareerEditMode(false);
    setCareerDraft(EMPTY_CAREER_DRAFT);
    setCareerEditingId(null);
    setCareerSubmitting(false);
    setCareerDeletingId(null);
    setIsPreferenceCapabilityEditMode(false);
    setPreferenceCapabilityDraft(EMPTY_PREFERENCE_CAPABILITY_DRAFT);
    setPreferenceCapabilitySaving(false);
    setIsAdditionalInfoEditMode(false);
    setAdditionalInfoDocuments(EMPTY_ADDITIONAL_INFO_DOCUMENT_DRAFT);
    setIsEmergencyContactEditMode(false);
    setEmergencyContactDraft(EMPTY_EMERGENCY_CONTACT_DRAFT);
    setEmergencyContactSaving(false);
    setIsMatchingResultEditMode(false);
    setMatchingResultDraft(EMPTY_MATCHING_RESULT_DRAFT);
    setMatchingResultSaving(false);
    setIndustryToAdd("");
    setJobRoleToAdd("");
    setIsActivityExperienceEditMode(false);
    setActivityExperienceDraft(EMPTY_ACTIVITY_EXPERIENCE_DRAFT);
    setActivityExperienceEditingId(null);
    setActivityExperienceSubmitting(false);
    setActivityExperienceDeletingId(null);
    setVerificationMenu(null);
    setSelectedCandidate(null);
  }

  function openCreateModal() {
    setCreateDraft(EMPTY_CANDIDATE_DRAFT);
    setCreateErrorMessage(null);
    setCreateSubmitting(false);
    setIsCreateModalOpen(true);
  }

  function requestCloseCreateModal() {
    setIsCreateModalOpen(false);
    setCreateDraft(EMPTY_CANDIDATE_DRAFT);
    setCreateErrorMessage(null);
    setCreateSubmitting(false);
  }

  function handleDialogCancel(event: SyntheticEvent<HTMLDialogElement, Event>) {
    event.preventDefault();
    requestCloseDetailModal();
  }

  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInsideDialog) requestCloseDetailModal();
  }

  function handleCreateDialogCancel(event: SyntheticEvent<HTMLDialogElement, Event>) {
    event.preventDefault();
    requestCloseCreateModal();
  }

  function handleCreateDialogClick(event: MouseEvent<HTMLDialogElement>) {
    const dialog = event.currentTarget;
    const rect = dialog.getBoundingClientRect();
    const isInsideDialog =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!isInsideDialog) requestCloseCreateModal();
  }


  useEffect(() => {
    const dialog = detailDialogRef.current;
    if (!dialog) return;
    if (isDetailModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isDetailModalOpen]);

  useEffect(() => {
    const dialog = createDialogRef.current;
    if (!dialog) return;
    if (isCreateModalOpen) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (dialog.open) dialog.close();
  }, [isCreateModalOpen]);

  useEffect(() => {
    if (!verificationMenu) return;

    const handlePointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".ops-status-menu-wrap")) return;
      setVerificationMenu(null);
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [verificationMenu]);

  function toggleVerificationMenu(id: string, currentEmailVerified: boolean, mode: "list" | "detail") {
    setVerificationMenu((prev) => {
      if (prev && prev.id === id && prev.mode === mode) return null;
      return { id, mode, currentEmailVerified };
    });
  }

  async function updateCandidateVerification(id: string, currentEmailVerified: boolean, nextEmailVerified: boolean) {
    setVerificationMenu(null);
    if (currentEmailVerified === nextEmailVerified) return;
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${id}/email-verified`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          emailVerified: nextEmailVerified
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: MemberItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "인증 상태 변경에 실패했습니다.");
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === payload.item!.id ? payload.item! : item)));
      setSelectedCandidate((prev) => (prev?.id === payload.item!.id ? payload.item! : prev));
    } catch {
      window.alert("인증 상태 변경 중 오류가 발생했습니다.");
    }
  }

  async function saveCandidateBasic() {
    if (!selectedCandidate) return;
    setBasicSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${selectedCandidate.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: basicDraft.name.trim() || undefined,
          phoneNumber: basicDraft.phoneNumber.trim(),
          affiliation: basicDraft.affiliation.trim(),
          nationality: basicDraft.nationality.trim(),
          gender: basicDraft.gender || undefined,
          birthDate: basicDraft.birthDate ? `${basicDraft.birthDate}T00:00:00.000Z` : undefined,
          jobTitle: basicDraft.jobTitle.trim()
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: MemberItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "기본 정보 저장에 실패했습니다.");
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === payload.item!.id ? payload.item! : item)));
      setSelectedCandidate(payload.item);
      setBasicDraft({
        name: payload.item.name ?? "",
        email: payload.item.email ?? "",
        phoneNumber: payload.item.phoneNumber ?? "",
        affiliation: payload.item.affiliation ?? "",
        nationality: payload.item.nationality ?? "",
        gender: normalizeGender(payload.item.gender),
        birthDate: toDateInputValue(payload.item.birthDate),
        jobTitle: payload.item.jobTitle ?? "",
        password: ""
      });
      setIsBasicEditMode(false);
    } catch {
      window.alert("기본 정보 저장 중 오류가 발생했습니다.");
    } finally {
      setBasicSaving(false);
    }
  }

  async function createCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreateSubmitting(true);
    setCreateErrorMessage(null);
    try {
      const email = createDraft.email.trim().toLowerCase();
      if (!email) {
        setCreateErrorMessage("이메일은 필수입니다.");
        return;
      }

      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email,
          name: createDraft.name.trim() || undefined,
          phoneNumber: createDraft.phoneNumber.trim() || undefined,
          affiliation: createDraft.affiliation.trim() || undefined,
          nationality: createDraft.nationality.trim() || undefined,
          gender: createDraft.gender || undefined,
          birthDate: createDraft.birthDate ? `${createDraft.birthDate}T00:00:00.000Z` : undefined,
          jobTitle: createDraft.jobTitle.trim() || undefined,
          password: createDraft.password.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: MemberItem; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        setCreateErrorMessage(payload.message ?? "후보자 생성에 실패했습니다.");
        return;
      }

      setItems((prev) => [payload.item!, ...prev]);
      setPage(1);
      requestCloseCreateModal();
    } catch {
      setCreateErrorMessage("후보자 생성 중 오류가 발생했습니다.");
    } finally {
      setCreateSubmitting(false);
    }
  }

  async function saveCandidateMemo() {
    if (!selectedCandidate) return;
    setMemoSaving(true);
    try {
      const token = readCookie(TOKEN_COOKIE_KEY);
      const response = await fetch(`${apiBaseUrl}/ops/candidates/${selectedCandidate.id}/admin-memo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          adminMemo: memoDraft.trim() || undefined
        })
      });
      const payload = (await response.json()) as { ok?: boolean; item?: { id: string; adminMemo: string | null }; message?: string };
      if (!response.ok || !payload.ok || !payload.item) {
        window.alert(payload.message ?? "관리자 메모 저장에 실패했습니다.");
        return;
      }

      setItems((prev) =>
        prev.map((item) =>
          item.id === selectedCandidate.id
            ? {
                ...item,
                adminMemo: payload.item!.adminMemo
              }
            : item
        )
      );
      setSelectedCandidate((prev) =>
        prev
          ? {
              ...prev,
              adminMemo: payload.item!.adminMemo
            }
          : prev
      );
      setMemoDraft(payload.item.adminMemo ?? "");
      setIsMemoEditMode(false);
    } catch {
      window.alert("관리자 메모 저장 중 오류가 발생했습니다.");
    } finally {
      setMemoSaving(false);
    }
  }

  const detailTabs: Array<{ key: CandidateDetailTab; label: string }> = [
    { key: "basic", label: "기본정보" },
    { key: "visaResidence", label: "비자&거주 정보" },
    { key: "educationLanguage", label: "학력&어학" },
    { key: "career", label: "경력" },
    { key: "activityExperience", label: "활동&경험" },
    { key: "preferenceCapability", label: "선호 조건&역량" },
    { key: "additionalInfo", label: "추가 정보" },
    { key: "emergencyContact", label: "비상 연락망" },
    { key: "matchingResult", label: "매칭 결과" },
    { key: "adminMemo", label: "관리자 메모" }
  ];

  return (
    <section className={`ops-content-section ${isEmbeddedDetailOnly ? "is-embedded-detail-only" : ""}`}>
      <header>
        <h1>후보자 관리</h1>
        <p>우리 데이터베이스의 STUDENT 유저를 기준으로 후보자 목록을 관리합니다.</p>
      </header>

      <article className="ops-partner-list-card">
        <div className="ops-partner-list-top">
          <h2>후보자 목록</h2>
          <button type="button" className="ops-partner-add-button" onClick={openCreateModal}>
            후보자 추가하기
          </button>
        </div>

        <div className="ops-partner-filters">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="이름, 이메일, 연락처, 소속, 국적, 성별, 직무 검색"
            className="ops-partner-filter-search"
          />
          <select
            value={String(pageSize)}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as 20 | 40 | 100);
              setPage(1);
            }}
          >
            <option value="20">20개</option>
            <option value="40">40개</option>
            <option value="100">100개</option>
          </select>
        </div>

        {listErrorMessage ? <p className="ops-form-error">{listErrorMessage}</p> : null}

        <div className="ops-partner-table-wrap">
          <table className="ops-partner-table ops-candidate-list-table">
            <colgroup>
              <col style={{ width: "14%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "6%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "name" ? "is-active" : ""}`} onClick={() => toggleSort("name")}>
                    <span>이름</span><SortIcon field="name" />
                  </button>
                </th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "email" ? "is-active" : ""}`} onClick={() => toggleSort("email")}>
                    <span>이메일</span><SortIcon field="email" />
                  </button>
                </th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "phoneNumber" ? "is-active" : ""}`} onClick={() => toggleSort("phoneNumber")}>
                    <span>연락처</span><SortIcon field="phoneNumber" />
                  </button>
                </th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "affiliation" ? "is-active" : ""}`} onClick={() => toggleSort("affiliation")}>
                    <span>소속</span><SortIcon field="affiliation" />
                  </button>
                </th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "nationality" ? "is-active" : ""}`} onClick={() => toggleSort("nationality")}>
                    <span>국적</span><SortIcon field="nationality" />
                  </button>
                </th>
                <th>성별</th>
                <th>인증</th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "createdAt" ? "is-active" : ""}`} onClick={() => toggleSort("createdAt")}>
                    <span>가입일</span><SortIcon field="createdAt" />
                  </button>
                </th>
                <th>
                  <button type="button" className={`ops-th-sort ${sortField === "completion" ? "is-active" : ""}`} onClick={() => toggleSort("completion")}>
                    <span>완성률</span><SortIcon field="completion" />
                  </button>
                </th>
                <th>상세정보</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="ops-table-empty">목록을 불러오는 중입니다...</td></tr>
              ) : pagedItems.length === 0 ? (
                <tr><td colSpan={10} className="ops-table-empty">표시할 후보자가 없습니다.</td></tr>
              ) : (
                pagedItems.map((item) => (
                  <tr key={item.id} className="ops-clickable-row" onClick={() => openDetailModal(item)}>
                    <td>{item.name || "-"}</td>
                    <td>{item.email}</td>
                    <td>{item.phoneNumber || "-"}</td>
                    <td>{item.affiliation || "-"}</td>
                    <td>{item.nationality || "-"}</td>
                    <td>{genderLabel(item.gender)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="ops-status-menu-wrap">
                        <button
                          type="button"
                          className={getOpsBadgeClassName(item.emailVerified ? "status-approved" : "status-pending", "is-clickable")}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVerificationMenu(item.id, item.emailVerified, "list");
                          }}
                        >
                          {emailVerifiedLabel(item.emailVerified)}
                        </button>
                        {verificationMenu?.id === item.id && verificationMenu.mode === "list" ? (
                          <div className="ops-status-toggle-menu">
                            {[true, false].map((next) => (
                              <button
                                key={String(next)}
                                type="button"
                                className={`${next ? "approve" : "pending"} ${verificationMenu.currentEmailVerified === next ? "is-active" : ""}`}
                                onClick={() => void updateCandidateVerification(item.id, item.emailVerified, next)}
                              >
                                {emailVerifiedLabel(next)}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>{formatDate(item.createdAt)}</td>
                    <td>
                      {listProfileCompletionLoadingById[item.id] ? (
                        <span className="ops-profile-completion-pill ops-profile-completion-tone-neutral">...</span>
                      ) : listProfileCompletionById[item.id] === null || listProfileCompletionById[item.id] === undefined ? (
                        <span className="ops-profile-completion-pill ops-profile-completion-tone-neutral">-</span>
                      ) : (
                        <span
                          className={`ops-profile-completion-pill ops-profile-completion-tone-${profileCompletionTone(listProfileCompletionById[item.id] ?? 0)}`}
                        >
                          {listProfileCompletionById[item.id]}%
                        </span>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="ops-detail-button" onClick={() => openDetailModal(item)}>상세정보</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="ops-pagination">
          <span>총 {total}명 · {page}/{totalPages} 페이지</span>
          <div className="ops-pagination-numbers">
            {pageButtons.map((num) => (
              <button key={num} type="button" className={num === page ? "is-active" : ""} onClick={() => setPage(num)}>
                {num}
              </button>
            ))}
          </div>
          <span />
        </div>
      </article>

      <dialog
        ref={detailDialogRef}
        className={`ops-modal-dialog ${isEmbeddedDetailOnly ? "is-embedded-detail-dialog" : ""}`}
        onCancel={handleDialogCancel}
        onClick={handleDialogClick}
      >
        <article className="ops-modal-card ops-detail-modal-card">
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <div className="ops-detail-title-wrap">
                <h2>{selectedCandidate?.name || selectedCandidate?.email || "후보자 상세정보"}</h2>
                <span
                  className={`ops-profile-completion-badge ops-profile-completion-tone-${profileCompletionTone(profileCompletion.percent)}`}
                  title={`완성 항목 ${profileCompletion.filled}/${profileCompletion.total}`}
                >
                  프로필 완성률 {profileCompletion.percent}%
                </span>
                {selectedCandidate ? (
                  <div className="ops-status-menu-wrap">
                    <button
                      type="button"
                      className={getOpsBadgeClassName(
                        selectedCandidate.emailVerified ? "status-approved" : "status-pending",
                        "is-clickable"
                      )}
                      onClick={() => toggleVerificationMenu(selectedCandidate.id, selectedCandidate.emailVerified, "detail")}
                    >
                      {emailVerifiedLabel(selectedCandidate.emailVerified)}
                    </button>
                    {verificationMenu?.id === selectedCandidate.id && verificationMenu.mode === "detail" ? (
                      <div className="ops-status-toggle-menu">
                        {[true, false].map((next) => (
                          <button
                            key={String(next)}
                            type="button"
                            className={`${next ? "approve" : "pending"} ${verificationMenu.currentEmailVerified === next ? "is-active" : ""}`}
                            onClick={() => void updateCandidateVerification(selectedCandidate.id, selectedCandidate.emailVerified, next)}
                          >
                            {emailVerifiedLabel(next)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="ops-detail-top-right">
                <button type="button" className="ops-modal-close" onClick={requestCloseDetailModal} aria-label="닫기">
                  <X size={16} weight="bold" aria-hidden />
                </button>
              </div>
            </div>
            <div className="ops-detail-tabs ops-candidate-detail-tabs" role="tablist" aria-label="후보자 상세 탭">
              {detailTabs.map((tabItem) => (
                <button
                  key={tabItem.key}
                  type="button"
                  role="tab"
                  aria-selected={detailTab === tabItem.key}
                  className={`ops-detail-tab ${detailTab === tabItem.key ? "is-active" : ""}`}
                  onClick={() => setDetailTab(tabItem.key)}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>
          </div>
          <div className="ops-modal-scroll-body">
            <div
              className={`ops-detail-sections ${
                detailTab === "educationLanguage" ||
                detailTab === "career" ||
                detailTab === "activityExperience" ||
                detailTab === "preferenceCapability"
                  ? "ops-candidate-education-sections-scroll"
                  : ""
              }`}
            >
              {detailTab === "basic" ? (
                <section className="ops-detail-section">
                  <h3>기본 정보</h3>
                  {isBasicEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <div className="ops-partner-form-two-cols">
                        <label>
                          <span>이메일</span>
                          <input value={basicDraft.email} disabled />
                        </label>
                        <label>
                          <span>이름</span>
                          <input value={basicDraft.name} onChange={(e) => setBasicDraft((prev) => ({ ...prev, name: e.target.value }))} />
                        </label>
                        <label>
                          <span>연락처</span>
                          <input
                            value={basicDraft.phoneNumber}
                            onChange={(e) => setBasicDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>소속</span>
                          <input
                            value={basicDraft.affiliation}
                            onChange={(e) => setBasicDraft((prev) => ({ ...prev, affiliation: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>국적</span>
                          <input
                            value={basicDraft.nationality}
                            onChange={(e) => setBasicDraft((prev) => ({ ...prev, nationality: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>성별</span>
                          <select
                            value={basicDraft.gender}
                            onChange={(e) =>
                              setBasicDraft((prev) => ({ ...prev, gender: normalizeGender(e.target.value) }))
                            }
                          >
                            <option value="">선택 안 함</option>
                            <option value="male">남성</option>
                            <option value="female">여성</option>
                            <option value="secret">비밀이에요</option>
                          </select>
                        </label>
                        <label>
                          <span>생년월일</span>
                          <input
                            type="date"
                            value={basicDraft.birthDate}
                            onChange={(e) => setBasicDraft((prev) => ({ ...prev, birthDate: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>희망 직무</span>
                          <input
                            value={basicDraft.jobTitle}
                            onChange={(e) => setBasicDraft((prev) => ({ ...prev, jobTitle: e.target.value }))}
                          />
                        </label>
                      </div>
                    </form>
                  ) : (
                    <div className="ops-detail-grid ops-detail-grid-single">
                      <div><span>이름</span><strong>{selectedCandidate?.name || "-"}</strong></div>
                      <div><span>이메일</span><strong>{selectedCandidate?.email || "-"}</strong></div>
                      <div><span>연락처</span><strong>{selectedCandidate?.phoneNumber || "-"}</strong></div>
                      <div><span>소속</span><strong>{selectedCandidate?.affiliation || "-"}</strong></div>
                      <div><span>국적</span><strong>{selectedCandidate?.nationality || "-"}</strong></div>
                      <div><span>성별</span><strong>{genderLabel(selectedCandidate?.gender)}</strong></div>
                      <div><span>생년월일</span><strong>{selectedCandidate?.birthDate ? formatDate(selectedCandidate.birthDate) : "-"}</strong></div>
                      <div><span>희망 직무</span><strong>{selectedCandidate?.jobTitle || "-"}</strong></div>
                      <div><span>가입일</span><strong>{selectedCandidate?.createdAt ? formatDate(selectedCandidate.createdAt) : "-"}</strong></div>
                    </div>
                  )}
                </section>
              ) : detailTab === "visaResidence" ? (
                <section className="ops-detail-section">
                  <h3>비자&거주 정보</h3>
                  {profileLoading ? (
                    <p className="ops-detail-empty">비자&거주 정보를 불러오는 중입니다...</p>
                  ) : isVisaResidenceEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <div className="ops-partner-form-two-cols">
                        <label>
                          <span>취업 허가</span>
                          <select
                            value={visaResidenceDraft.workPermit}
                            onChange={(e) =>
                              setVisaResidenceDraft((prev) => ({
                                ...prev,
                                workPermit: e.target.value as CandidateVisaResidenceDraft["workPermit"]
                              }))
                            }
                          >
                            <option value="unset">-</option>
                            <option value="yes">예</option>
                            <option value="no">아니오</option>
                          </select>
                        </label>
                        <label>
                          <span>비자 유형</span>
                          <select
                            value={visaResidenceDraft.visaType}
                            onChange={(e) =>
                              setVisaResidenceDraft((prev) => ({
                                ...prev,
                                visaType: e.target.value as CandidateVisaResidenceDraft["visaType"]
                              }))
                            }
                          >
                            <option value="">선택 안 함</option>
                            {visaTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>비자 만료일</span>
                          <input
                            type="date"
                            value={visaResidenceDraft.visaExpiryDate}
                            onChange={(e) =>
                              setVisaResidenceDraft((prev) => ({ ...prev, visaExpiryDate: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          <span>한국 거주</span>
                          <select
                            value={visaResidenceDraft.livesInKorea}
                            onChange={(e) =>
                              setVisaResidenceDraft((prev) => ({
                                ...prev,
                                livesInKorea: e.target.value as CandidateVisaResidenceDraft["livesInKorea"]
                              }))
                            }
                          >
                            <option value="unset">-</option>
                            <option value="yes">예</option>
                            <option value="no">아니오</option>
                          </select>
                        </label>
                        <label>
                          <span>숙소 확보</span>
                          <select
                            value={visaResidenceDraft.hasAccommodation}
                            onChange={(e) =>
                              setVisaResidenceDraft((prev) => ({
                                ...prev,
                                hasAccommodation: e.target.value as CandidateVisaResidenceDraft["hasAccommodation"]
                              }))
                            }
                          >
                            <option value="unset">-</option>
                            <option value="yes">예</option>
                            <option value="no">아니오</option>
                          </select>
                        </label>
                        <label>
                          <span>거주 시/도</span>
                          <input
                            value={visaResidenceDraft.residenceProvince}
                            onChange={(e) =>
                              setVisaResidenceDraft((prev) => ({ ...prev, residenceProvince: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          <span>거주 구/군</span>
                          <input
                            value={visaResidenceDraft.residenceDistrict}
                            onChange={(e) =>
                              setVisaResidenceDraft((prev) => ({ ...prev, residenceDistrict: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          <span>거주 상세 주소</span>
                          <input
                            value={visaResidenceDraft.residenceAddress}
                            onChange={(e) =>
                              setVisaResidenceDraft((prev) => ({ ...prev, residenceAddress: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                    </form>
                  ) : (
                    <div className="ops-detail-grid ops-detail-grid-single">
                      <div><span>취업 허가</span><strong>{yesNoLabel(candidateProfile.workPermit)}</strong></div>
                      <div><span>비자 유형</span><strong>{visaTypeLabel(candidateProfile.visaType)}</strong></div>
                      <div><span>비자 만료일</span><strong>{candidateProfile.visaExpiryDate ? formatDate(candidateProfile.visaExpiryDate) : "-"}</strong></div>
                      <div><span>한국 거주</span><strong>{yesNoLabel(candidateProfile.livesInKorea)}</strong></div>
                      <div><span>숙소 확보</span><strong>{yesNoLabel(candidateProfile.hasAccommodation)}</strong></div>
                      <div><span>거주 시/도</span><strong>{candidateProfile.residenceProvince || "-"}</strong></div>
                      <div><span>거주 구/군</span><strong>{candidateProfile.residenceDistrict || "-"}</strong></div>
                      <div><span>거주 상세 주소</span><strong>{candidateProfile.residenceAddress || "-"}</strong></div>
                    </div>
                  )}
                </section>
              ) : detailTab === "educationLanguage" ? (
                <>
                  {educationLanguageView === "educationAdd" ? (
                    <section className="ops-detail-section">
                      <h3>{educationEditingId ? "학력 수정" : "학력 추가"}</h3>
                      <form id="ops-candidate-education-form" className="ops-partner-form" onSubmit={addEducation}>
                        <div className="ops-partner-form-two-cols">
                          <label>
                            <span>학교명</span>
                            <input
                              value={educationDraft.schoolName}
                              onChange={(e) => setEducationDraft((prev) => ({ ...prev, schoolName: e.target.value }))}
                              required
                            />
                          </label>
                          <label>
                            <span>유형</span>
                            <select
                              value={educationDraft.educationType}
                              onChange={(e) =>
                                setEducationDraft((prev) => ({
                                  ...prev,
                                  educationType: e.target.value as CandidateEducationType
                                }))
                              }
                            >
                              {educationTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>전공</span>
                            <input
                              value={educationDraft.major}
                              onChange={(e) => setEducationDraft((prev) => ({ ...prev, major: e.target.value }))}
                            />
                          </label>
                          <label>
                            <span>상태</span>
                            <select
                              value={educationDraft.status}
                              onChange={(e) =>
                                setEducationDraft((prev) => ({
                                  ...prev,
                                  status: e.target.value as CandidateEducationStatus
                                }))
                              }
                            >
                              {educationStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>국가</span>
                            <input
                              value={educationDraft.country}
                              onChange={(e) => setEducationDraft((prev) => ({ ...prev, country: e.target.value }))}
                            />
                          </label>
                          <label>
                            <span>도시</span>
                            <input
                              value={educationDraft.city}
                              onChange={(e) => setEducationDraft((prev) => ({ ...prev, city: e.target.value }))}
                            />
                          </label>
                          <label>
                            <span>시작일</span>
                            <input
                              type="date"
                              value={educationDraft.startDate}
                              onChange={(e) => setEducationDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                            />
                          </label>
                          <label>
                            <span>종료일</span>
                            <input
                              type="date"
                              value={educationDraft.endDate}
                              onChange={(e) => setEducationDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                            />
                          </label>
                          <label>
                            <span>한국 학교</span>
                            <select
                              value={educationDraft.isKoreanSchool}
                              onChange={(e) =>
                                setEducationDraft((prev) => ({
                                  ...prev,
                                  isKoreanSchool: e.target.value as CandidateEducationDraft["isKoreanSchool"]
                                }))
                              }
                            >
                              <option value="unset">-</option>
                              <option value="yes">예</option>
                              <option value="no">아니오</option>
                            </select>
                          </label>
                        </div>
                      </form>
                    </section>
                  ) : educationLanguageView === "languageAdd" ? (
                    <section className="ops-detail-section">
                      <h3>{languageSkillEditingId ? "어학 수정" : "어학 추가"}</h3>
                      <form id="ops-candidate-language-form" className="ops-partner-form" onSubmit={addLanguageSkill}>
                        <div className="ops-partner-form-two-cols">
                          <label>
                            <span>언어</span>
                            <select
                              value={languageSkillDraft.language}
                              onChange={(e) =>
                                setLanguageSkillDraft((prev) => ({
                                  ...prev,
                                  language: e.target.value as CandidateLanguageType
                                }))
                              }
                            >
                              {languageTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>수준</span>
                            <select
                              value={languageSkillDraft.level}
                              onChange={(e) =>
                                setLanguageSkillDraft((prev) => ({
                                  ...prev,
                                  level: e.target.value as CandidateLanguageLevel
                                }))
                              }
                            >
                              {languageLevelOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            <span>시험명</span>
                            <input
                              value={languageSkillDraft.testName}
                              onChange={(e) => setLanguageSkillDraft((prev) => ({ ...prev, testName: e.target.value }))}
                            />
                          </label>
                          <label>
                            <span>점수</span>
                            <input
                              value={languageSkillDraft.score}
                              onChange={(e) => setLanguageSkillDraft((prev) => ({ ...prev, score: e.target.value }))}
                            />
                          </label>
                        </div>
                      </form>
                    </section>
                  ) : (
                    <>
                      <section className="ops-detail-section">
                        <h3>학력</h3>
                        <div className="ops-partner-table-wrap">
                          <table className="ops-partner-table">
                            <thead>
                              <tr>
                                <th>학교명</th>
                                <th>전공</th>
                                <th>유형</th>
                                <th>상태</th>
                                <th className="ops-period-nowrap">기간</th>
                                <th>국가/도시</th>
                                <th>한국 학교</th>
                                {isEducationLanguageEditMode ? <th>액션</th> : null}
                              </tr>
                            </thead>
                            <tbody>
                              {candidateProfile.educations.length === 0 ? (
                                <tr><td colSpan={isEducationLanguageEditMode ? 8 : 7} className="ops-table-empty">등록된 학력이 없습니다.</td></tr>
                              ) : (
                                candidateProfile.educations.map((item) => (
                                  <tr key={item.id}>
                                    <td>{item.schoolName}</td>
                                    <td>{item.major || "-"}</td>
                                    <td>{educationTypeLabel(item.educationType)}</td>
                                    <td>{educationStatusLabel(item.status)}</td>
                                    <td className="ops-period-nowrap">
                                      <div className="ops-period-main">
                                        {periodMainLabel(item.startDate, item.endDate)}
                                      </div>
                                      <div className="ops-period-sub">
                                        {periodSubLabel(item.startDate, item.endDate)}
                                      </div>
                                    </td>
                                    <td>{[item.country, item.city].filter(Boolean).join(" / ") || "-"}</td>
                                    <td>{yesNoLabel(item.isKoreanSchool)}</td>
                                    {isEducationLanguageEditMode ? (
                                      <td>
                                        <div className="ops-inline-icon-actions">
                                          <button
                                            type="button"
                                            className="ops-icon-action-button"
                                            onClick={() => {
                                              setEducationEditingId(item.id);
                                              setEducationDraft({
                                                schoolName: item.schoolName,
                                                educationType: item.educationType,
                                                major: item.major ?? "",
                                                status: item.status,
                                                country: item.country ?? "",
                                                city: item.city ?? "",
                                                startDate: toDateInputValue(item.startDate),
                                                endDate: toDateInputValue(item.endDate),
                                                isKoreanSchool: nullableBooleanToYesNoUnset(item.isKoreanSchool)
                                              });
                                              setEducationLanguageView("educationAdd");
                                            }}
                                            aria-label="학력 수정"
                                          >
                                            <PencilSimple size={16} weight="regular" aria-hidden />
                                          </button>
                                          <button
                                            type="button"
                                            className="ops-icon-danger-button"
                                            onClick={() => void deleteEducation(item.id)}
                                            disabled={educationDeletingId === item.id}
                                            aria-label="학력 삭제"
                                          >
                                            <Trash size={16} weight="regular" aria-hidden />
                                          </button>
                                        </div>
                                      </td>
                                    ) : null}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        {isEducationLanguageEditMode ? (
                          <button
                            type="button"
                            className="ops-inline-add-text-button"
                            onClick={() => {
                              setEducationEditingId(null);
                              setEducationDraft(EMPTY_EDUCATION_DRAFT);
                              setEducationLanguageView("educationAdd");
                            }}
                          >
                            + 추가하기
                          </button>
                        ) : null}
                      </section>

                      <section className="ops-detail-section">
                        <h3>어학</h3>
                        <div className="ops-partner-table-wrap">
                          <table className="ops-partner-table">
                            <thead>
                              <tr>
                                <th>언어</th>
                                <th>수준</th>
                                <th>시험명</th>
                                <th>점수</th>
                                {isEducationLanguageEditMode ? <th>액션</th> : null}
                              </tr>
                            </thead>
                            <tbody>
                              {candidateProfile.languageSkills.length === 0 ? (
                                <tr><td colSpan={isEducationLanguageEditMode ? 5 : 4} className="ops-table-empty">등록된 어학이 없습니다.</td></tr>
                              ) : (
                                candidateProfile.languageSkills.map((item) => (
                                  <tr key={item.id}>
                                    <td>{languageTypeLabel(item.language)}</td>
                                    <td>{languageLevelLabel(item.level)}</td>
                                    <td>{item.testName || "-"}</td>
                                    <td>{item.score || "-"}</td>
                                    {isEducationLanguageEditMode ? (
                                      <td>
                                        <div className="ops-inline-icon-actions">
                                          <button
                                            type="button"
                                            className="ops-icon-action-button"
                                            onClick={() => {
                                              setLanguageSkillEditingId(item.id);
                                              setLanguageSkillDraft({
                                                language: item.language,
                                                level: item.level,
                                                testName: item.testName ?? "",
                                                score: item.score ?? ""
                                              });
                                              setEducationLanguageView("languageAdd");
                                            }}
                                            aria-label="어학 수정"
                                          >
                                            <PencilSimple size={16} weight="regular" aria-hidden />
                                          </button>
                                          <button
                                            type="button"
                                            className="ops-icon-danger-button"
                                            onClick={() => void deleteLanguageSkill(item.id)}
                                            disabled={languageSkillDeletingId === item.id}
                                            aria-label="어학 삭제"
                                          >
                                            <Trash size={16} weight="regular" aria-hidden />
                                          </button>
                                        </div>
                                      </td>
                                    ) : null}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                        {isEducationLanguageEditMode ? (
                          <button
                            type="button"
                            className="ops-inline-add-text-button"
                            onClick={() => {
                              setLanguageSkillEditingId(null);
                              setLanguageSkillDraft(EMPTY_LANGUAGE_SKILL_DRAFT);
                              setEducationLanguageView("languageAdd");
                            }}
                          >
                            + 추가하기
                          </button>
                        ) : null}
                      </section>
                    </>
                  )}
                </>
              ) : detailTab === "career" ? (
                careerView === "add" ? (
                  <section className="ops-detail-section">
                    <h3>{careerEditingId ? "경력 수정" : "경력 추가"}</h3>
                    <form id="ops-candidate-career-form" className="ops-partner-form" onSubmit={addCareer}>
                      <div className="ops-partner-form-two-cols">
                        <label>
                          <span>회사명</span>
                          <input
                            value={careerDraft.companyName}
                            onChange={(e) => setCareerDraft((prev) => ({ ...prev, companyName: e.target.value }))}
                            required
                          />
                        </label>
                        <label>
                          <span>직위</span>
                          <input
                            value={careerDraft.position}
                            onChange={(e) => setCareerDraft((prev) => ({ ...prev, position: e.target.value }))}
                            required
                          />
                        </label>
                        <label>
                          <span>부서</span>
                          <input
                            value={careerDraft.department}
                            onChange={(e) => setCareerDraft((prev) => ({ ...prev, department: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>재직 중</span>
                          <select
                            value={careerDraft.isCurrent}
                            onChange={(e) =>
                              setCareerDraft((prev) => ({
                                ...prev,
                                isCurrent: e.target.value as CandidateCareerDraft["isCurrent"],
                                endDate: e.target.value === "yes" ? "" : prev.endDate
                              }))
                            }
                          >
                            <option value="yes">예</option>
                            <option value="no">아니오</option>
                          </select>
                        </label>
                        <label>
                          <span>시작일</span>
                          <input
                            type="date"
                            value={careerDraft.startDate}
                            onChange={(e) => setCareerDraft((prev) => ({ ...prev, startDate: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>종료일</span>
                          <input
                            type="date"
                            value={careerDraft.endDate}
                            onChange={(e) => setCareerDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                            disabled={careerDraft.isCurrent === "yes"}
                          />
                        </label>
                        <label className="ops-partner-form-span-full">
                          <span>업무 설명</span>
                          <textarea
                            rows={6}
                            value={careerDraft.description}
                            onChange={(e) => setCareerDraft((prev) => ({ ...prev, description: e.target.value }))}
                          />
                        </label>
                      </div>
                    </form>
                  </section>
                ) : (
                  <section className="ops-detail-section">
                    <h3>경력</h3>
                    <div className="ops-partner-table-wrap">
                      <table className="ops-partner-table">
                        <thead>
                          <tr>
                            <th>회사명</th>
                            <th>직위</th>
                            <th>부서</th>
                            <th>재직 중</th>
                            <th className="ops-period-nowrap">기간</th>
                            <th>업무 설명</th>
                            {isCareerEditMode ? <th>액션</th> : null}
                          </tr>
                        </thead>
                        <tbody>
                          {candidateProfile.careers.length === 0 ? (
                            <tr><td colSpan={isCareerEditMode ? 7 : 6} className="ops-table-empty">등록된 경력이 없습니다.</td></tr>
                          ) : (
                            candidateProfile.careers.map((item) => (
                              <tr key={item.id}>
                                <td>{item.companyName}</td>
                                <td>{item.position}</td>
                                <td>{item.department || "-"}</td>
                                <td>{yesNoLabel(item.isCurrent)}</td>
                                <td className="ops-period-nowrap">
                                  <div className="ops-period-main">
                                    {periodMainLabel(item.startDate, item.endDate, item.isCurrent)}
                                  </div>
                                  <div className="ops-period-sub">
                                    {periodSubLabel(item.startDate, item.endDate, item.isCurrent)}
                                  </div>
                                </td>
                                <td>{item.description || "-"}</td>
                                {isCareerEditMode ? (
                                  <td>
                                    <div className="ops-inline-icon-actions">
                                      <button
                                        type="button"
                                        className="ops-icon-action-button"
                                        onClick={() => {
                                          setCareerEditingId(item.id);
                                          setCareerDraft({
                                            companyName: item.companyName,
                                            position: item.position,
                                            department: item.department ?? "",
                                            isCurrent: item.isCurrent ? "yes" : "no",
                                            startDate: toDateInputValue(item.startDate),
                                            endDate: toDateInputValue(item.endDate),
                                            description: item.description ?? ""
                                          });
                                          setCareerView("add");
                                        }}
                                        aria-label="경력 수정"
                                      >
                                        <PencilSimple size={16} weight="regular" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        className="ops-icon-danger-button"
                                        onClick={() => void deleteCareer(item.id)}
                                        disabled={careerDeletingId === item.id}
                                        aria-label="경력 삭제"
                                      >
                                        <Trash size={16} weight="regular" aria-hidden />
                                      </button>
                                    </div>
                                  </td>
                                ) : null}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {isCareerEditMode ? (
                      <button
                        type="button"
                        className="ops-inline-add-text-button"
                        onClick={() => {
                          setCareerEditingId(null);
                          setCareerDraft(EMPTY_CAREER_DRAFT);
                          setCareerView("add");
                        }}
                      >
                        + 추가하기
                      </button>
                    ) : null}
                  </section>
                )
              ) : detailTab === "activityExperience" ? (
                activityExperienceView === "add" ? (
                  <section className="ops-detail-section">
                    <h3>{activityExperienceEditingId ? "활동&경험 수정" : "활동&경험 추가"}</h3>
                    <form id="ops-candidate-activity-experience-form" className="ops-partner-form" onSubmit={addActivityExperience}>
                      <div className="ops-partner-form-two-cols">
                        <label>
                          <span>제목</span>
                          <input
                            value={activityExperienceDraft.title}
                            onChange={(e) => setActivityExperienceDraft((prev) => ({ ...prev, title: e.target.value }))}
                            required
                          />
                        </label>
                        <label>
                          <span>유형</span>
                          <select
                            value={activityExperienceDraft.activityType}
                            onChange={(e) =>
                              setActivityExperienceDraft((prev) => ({
                                ...prev,
                                activityType: e.target.value as CandidateActivityType
                              }))
                            }
                          >
                            {activityTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>기관</span>
                          <input
                            value={activityExperienceDraft.organization}
                            onChange={(e) =>
                              setActivityExperienceDraft((prev) => ({ ...prev, organization: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          <span>스킬</span>
                          <input
                            value={activityExperienceDraft.skills}
                            onChange={(e) => setActivityExperienceDraft((prev) => ({ ...prev, skills: e.target.value }))}
                            placeholder="예: React, Figma, Python"
                          />
                        </label>
                        <label>
                          <span>시작일</span>
                          <input
                            type="date"
                            value={activityExperienceDraft.startDate}
                            onChange={(e) =>
                              setActivityExperienceDraft((prev) => ({ ...prev, startDate: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          <span>종료일</span>
                          <input
                            type="date"
                            value={activityExperienceDraft.endDate}
                            onChange={(e) => setActivityExperienceDraft((prev) => ({ ...prev, endDate: e.target.value }))}
                          />
                        </label>
                        <label className="ops-partner-form-span-full">
                          <span>설명</span>
                          <textarea
                            rows={6}
                            value={activityExperienceDraft.description}
                            onChange={(e) =>
                              setActivityExperienceDraft((prev) => ({ ...prev, description: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                    </form>
                  </section>
                ) : (
                  <section className="ops-detail-section">
                    <h3>활동&경험</h3>
                    <div className="ops-partner-table-wrap">
                      <table className="ops-partner-table">
                        <thead>
                          <tr>
                            <th>제목</th>
                            <th>유형</th>
                            <th>기관</th>
                            <th className="ops-period-nowrap">기간</th>
                            <th>설명</th>
                            <th>스킬</th>
                            {isActivityExperienceEditMode ? <th>액션</th> : null}
                          </tr>
                        </thead>
                        <tbody>
                          {candidateProfile.activityExperiences.length === 0 ? (
                            <tr>
                              <td colSpan={isActivityExperienceEditMode ? 7 : 6} className="ops-table-empty">
                                등록된 활동/경험이 없습니다.
                              </td>
                            </tr>
                          ) : (
                            candidateProfile.activityExperiences.map((item) => (
                              <tr key={item.id}>
                                <td>{item.title}</td>
                                <td>{activityTypeLabel(item.activityType)}</td>
                                <td>{item.organization || "-"}</td>
                                <td className="ops-period-nowrap">
                                  <div className="ops-period-main">{periodMainLabel(item.startDate, item.endDate)}</div>
                                  <div className="ops-period-sub">{periodSubLabel(item.startDate, item.endDate)}</div>
                                </td>
                                <td>{item.description || "-"}</td>
                                <td>{item.skills.join(", ") || "-"}</td>
                                {isActivityExperienceEditMode ? (
                                  <td>
                                    <div className="ops-inline-icon-actions">
                                      <button
                                        type="button"
                                        className="ops-icon-action-button"
                                        onClick={() => {
                                          setActivityExperienceEditingId(item.id);
                                          setActivityExperienceDraft({
                                            title: item.title,
                                            activityType: item.activityType,
                                            organization: item.organization ?? "",
                                            startDate: toDateInputValue(item.startDate),
                                            endDate: toDateInputValue(item.endDate),
                                            description: item.description ?? "",
                                            skills: item.skills.join(", ")
                                          });
                                          setActivityExperienceView("add");
                                        }}
                                        aria-label="활동/경험 수정"
                                      >
                                        <PencilSimple size={16} weight="regular" aria-hidden />
                                      </button>
                                      <button
                                        type="button"
                                        className="ops-icon-danger-button"
                                        onClick={() => void deleteActivityExperience(item.id)}
                                        disabled={activityExperienceDeletingId === item.id}
                                        aria-label="활동/경험 삭제"
                                      >
                                        <Trash size={16} weight="regular" aria-hidden />
                                      </button>
                                    </div>
                                  </td>
                                ) : null}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {isActivityExperienceEditMode ? (
                      <button
                        type="button"
                        className="ops-inline-add-text-button"
                        onClick={() => {
                          setActivityExperienceEditingId(null);
                          setActivityExperienceDraft(EMPTY_ACTIVITY_EXPERIENCE_DRAFT);
                          setActivityExperienceView("add");
                        }}
                      >
                        + 추가하기
                      </button>
                    ) : null}
                  </section>
                )
              ) : detailTab === "preferenceCapability" ? (
                <section className="ops-detail-section">
                  <h3>선호 조건&역량</h3>
                  {isPreferenceCapabilityEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <div className="ops-partner-form-two-cols">
                        <label>
                          <span>희망 기간</span>
                          <select
                            value={preferenceCapabilityDraft.preferredProgramDuration}
                            onChange={(e) =>
                              setPreferenceCapabilityDraft((prev) => ({
                                ...prev,
                                preferredProgramDuration: e.target.value as CandidateProgramDuration | ""
                              }))
                            }
                          >
                            <option value="">선택 안 함</option>
                            {programDurationOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>프로그램 시작 시기</span>
                          <select
                            value={preferenceCapabilityDraft.programStartOption}
                            onChange={(e) =>
                              setPreferenceCapabilityDraft((prev) => ({
                                ...prev,
                                programStartOption: e.target.value as CandidateProgramStartOption | "",
                                programStartDate: e.target.value === "SPECIFIC_DATE" ? prev.programStartDate : ""
                              }))
                            }
                          >
                            <option value="">선택 안 함</option>
                            {programStartOptionOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        {preferenceCapabilityDraft.programStartOption === "SPECIFIC_DATE" ? (
                          <label>
                            <span>시작 가능 날짜</span>
                            <input
                              type="date"
                              value={preferenceCapabilityDraft.programStartDate}
                              onChange={(e) =>
                                setPreferenceCapabilityDraft((prev) => ({ ...prev, programStartDate: e.target.value }))
                              }
                            />
                          </label>
                        ) : null}
                        <div className="ops-partner-form-span-full ops-partner-form-field">
                          <span>선호 산업</span>
                          <div className="ops-selected-list-wrap">
                            {preferenceCapabilityDraft.preferredIndustries.length === 0 ? (
                              <p className="ops-detail-empty">없음</p>
                            ) : (
                              <ul className="ops-selected-list">
                                {preferenceCapabilityDraft.preferredIndustries.map((industry) => (
                                  <li key={industry} className="ops-selected-list-item">
                                    <span className="ops-selected-item-text">{partnerIndustryLabel(industry)}</span>
                                    <button
                                      type="button"
                                      className="ops-selected-delete"
                                      aria-label="선호 산업 삭제"
                                      onClick={() =>
                                        setPreferenceCapabilityDraft((prev) => ({
                                          ...prev,
                                          preferredIndustries: prev.preferredIndustries.filter((item) => item !== industry)
                                        }))
                                      }
                                    >
                                      <X size={12} weight="bold" aria-hidden />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="ops-inline-add-row">
                            <select
                              value={industryToAdd}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!value) {
                                  setIndustryToAdd("");
                                  return;
                                }
                                setPreferenceCapabilityDraft((prev) => ({
                                  ...prev,
                                  preferredIndustries: prev.preferredIndustries.includes(value)
                                    ? prev.preferredIndustries
                                    : [...prev.preferredIndustries, value]
                                }));
                                setIndustryToAdd("");
                              }}
                            >
                              <option value="">산업 선택</option>
                              {industryCandidatesToAdd.map((industry) => (
                                <option key={industry} value={industry}>
                                  {partnerIndustryLabel(industry)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="ops-partner-form-span-full ops-partner-form-field">
                          <span>선호 직무</span>
                          <div className="ops-selected-list-wrap">
                            {preferenceCapabilityDraft.preferredJobRoles.length === 0 ? (
                              <p className="ops-detail-empty">없음</p>
                            ) : (
                              <ul className="ops-selected-list">
                                {preferenceCapabilityDraft.preferredJobRoles.map((role) => (
                                  <li key={role} className="ops-selected-list-item">
                                    <span className="ops-selected-item-text">{preferredJobRoleLabel(role)}</span>
                                    <button
                                      type="button"
                                      className="ops-selected-delete"
                                      aria-label="선호 직무 삭제"
                                      onClick={() =>
                                        setPreferenceCapabilityDraft((prev) => ({
                                          ...prev,
                                          preferredJobRoles: prev.preferredJobRoles.filter((item) => item !== role)
                                        }))
                                      }
                                    >
                                      <X size={12} weight="bold" aria-hidden />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="ops-inline-add-row">
                            <select
                              value={jobRoleToAdd}
                              onChange={(e) => {
                                const value = e.target.value as CandidatePreferredJobRole | "";
                                if (!value) {
                                  setJobRoleToAdd("");
                                  return;
                                }
                                setPreferenceCapabilityDraft((prev) => ({
                                  ...prev,
                                  preferredJobRoles: prev.preferredJobRoles.includes(value)
                                    ? prev.preferredJobRoles
                                    : [...prev.preferredJobRoles, value]
                                }));
                                setJobRoleToAdd("");
                              }}
                            >
                              <option value="">직무 선택</option>
                              {jobRoleCandidatesToAdd.map((role) => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <label className="ops-partner-form-span-full">
                          <span>스킬</span>
                          <input
                            value={preferenceCapabilityDraft.skills}
                            onChange={(e) =>
                              setPreferenceCapabilityDraft((prev) => ({ ...prev, skills: e.target.value }))
                            }
                            placeholder="예: React, Python, Figma"
                          />
                        </label>
                        <label className="ops-partner-form-span-full">
                          <span>자기소개</span>
                          <textarea
                            rows={6}
                            value={preferenceCapabilityDraft.selfIntroduction}
                            onChange={(e) =>
                              setPreferenceCapabilityDraft((prev) => ({ ...prev, selfIntroduction: e.target.value }))
                            }
                          />
                        </label>
                        <label className="ops-partner-form-span-full">
                          <span>프로그램 참여 동기</span>
                          <textarea
                            rows={6}
                            value={preferenceCapabilityDraft.programMotivation}
                            onChange={(e) =>
                              setPreferenceCapabilityDraft((prev) => ({ ...prev, programMotivation: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                    </form>
                  ) : (
                    <div className="ops-detail-grid ops-detail-grid-single">
                      <div><span>희망 기간</span><strong>{programDurationLabel(candidateProfile.preferredProgramDuration)}</strong></div>
                      <div>
                        <span>프로그램 시작 시기</span>
                        <strong>
                          {candidateProfile.programStartOption === "SPECIFIC_DATE"
                            ? `${programStartOptionLabel(candidateProfile.programStartOption)} (${formatDateCompact(candidateProfile.programStartDate)})`
                            : programStartOptionLabel(candidateProfile.programStartOption)}
                        </strong>
                      </div>
                      <div>
                        <span>선호 산업</span>
                        <strong>
                          {candidateProfile.preferredIndustries.length > 0
                            ? candidateProfile.preferredIndustries.map((item) => partnerIndustryLabel(item)).join(", ")
                            : "-"}
                        </strong>
                      </div>
                      <div>
                        <span>선호 직무</span>
                        <strong>
                          {candidateProfile.preferredJobRoles.length > 0
                            ? candidateProfile.preferredJobRoles.map((item) => preferredJobRoleLabel(item)).join(", ")
                            : "-"}
                        </strong>
                      </div>
                      <div><span>스킬</span><strong>{candidateProfile.skills.join(", ") || "-"}</strong></div>
                      <div><span>자기소개</span><strong>{candidateProfile.selfIntroduction || "-"}</strong></div>
                      <div><span>프로그램 참여 동기</span><strong>{candidateProfile.programMotivation || "-"}</strong></div>
                    </div>
                  )}
                </section>
              ) : detailTab === "additionalInfo" ? (
                <section className="ops-detail-section">
                  <h3>추가 정보</h3>
                  <p className="ops-detail-empty">필수 서류를 카드별로 등록할 수 있습니다. 업로드 연동은 다음 단계에서 진행됩니다.</p>
                  <div className="ops-file-card-grid">
                    {ADDITIONAL_INFO_DOCUMENT_ITEMS.map((item) => {
                      const selectedFileName = additionalInfoDocuments[item.key];
                      return (
                        <article key={item.key} className="ops-file-card">
                          <div className="ops-file-card-title-row">
                            <span className="ops-file-card-title">
                              <FileText size={14} aria-hidden />
                              {item.title}
                            </span>
                          </div>
                          <p className="ops-file-card-file-name">{selectedFileName || "선택된 파일 없음"}</p>
                          {isAdditionalInfoEditMode ? (
                            <div className="ops-file-card-actions">
                              <label className="ops-file-card-upload">
                                <FileArrowUp size={14} aria-hidden />
                                파일 선택
                                <input
                                  type="file"
                                  className="ops-file-card-input"
                                  onChange={(e) => handleAdditionalInfoDocumentSelect(item.key, e.target.files)}
                                />
                              </label>
                              <button
                                type="button"
                                className="ops-file-card-clear"
                                onClick={() =>
                                  setAdditionalInfoDocuments((prev) => ({
                                    ...prev,
                                    [item.key]: ""
                                  }))
                                }
                                disabled={!selectedFileName}
                              >
                                <Trash size={14} aria-hidden />
                              </button>
                            </div>
                          ) : (
                            <div className="ops-file-card-status">{selectedFileName ? "선택 완료" : "미등록"}</div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                </section>
              ) : detailTab === "emergencyContact" ? (
                <section className="ops-detail-section">
                  <h3>비상 연락망</h3>
                  {isEmergencyContactEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <div className="ops-partner-form-two-cols">
                        <label>
                          <span>이름</span>
                          <input
                            value={emergencyContactDraft.emergencyContactName}
                            onChange={(e) =>
                              setEmergencyContactDraft((prev) => ({ ...prev, emergencyContactName: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          <span>관계</span>
                          <input
                            value={emergencyContactDraft.emergencyContactRelation}
                            onChange={(e) =>
                              setEmergencyContactDraft((prev) => ({ ...prev, emergencyContactRelation: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          <span>연락처</span>
                          <input
                            value={emergencyContactDraft.emergencyContactPhone}
                            onChange={(e) =>
                              setEmergencyContactDraft((prev) => ({ ...prev, emergencyContactPhone: e.target.value }))
                            }
                          />
                        </label>
                        <label>
                          <span>이메일</span>
                          <input
                            type="email"
                            value={emergencyContactDraft.emergencyContactEmail}
                            onChange={(e) =>
                              setEmergencyContactDraft((prev) => ({ ...prev, emergencyContactEmail: e.target.value }))
                            }
                          />
                        </label>
                        <label className="ops-partner-form-span-full">
                          <span>주소</span>
                          <input
                            value={emergencyContactDraft.emergencyContactAddress}
                            onChange={(e) =>
                              setEmergencyContactDraft((prev) => ({ ...prev, emergencyContactAddress: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                    </form>
                  ) : (
                    <div className="ops-detail-grid ops-detail-grid-single">
                      <div><span>이름</span><strong>{candidateProfile.emergencyContactName || "-"}</strong></div>
                      <div><span>관계</span><strong>{candidateProfile.emergencyContactRelation || "-"}</strong></div>
                      <div><span>연락처</span><strong>{candidateProfile.emergencyContactPhone || "-"}</strong></div>
                      <div><span>이메일</span><strong>{candidateProfile.emergencyContactEmail || "-"}</strong></div>
                      <div><span>주소</span><strong>{candidateProfile.emergencyContactAddress || "-"}</strong></div>
                    </div>
                  )}
                </section>
              ) : detailTab === "matchingResult" ? (
                <section className="ops-detail-section">
                  <h3>매칭 결과</h3>
                  {isMatchingResultEditMode ? (
                    <form className="ops-partner-form ops-detail-edit-form" onSubmit={(e) => e.preventDefault()}>
                      <div className="ops-partner-form-two-cols">
                        <label className="ops-partner-form-span-full">
                          <span>매칭 결과 메모</span>
                          <textarea
                            rows={12}
                            value={matchingResultDraft.matchingResultNote}
                            onChange={(e) =>
                              setMatchingResultDraft((prev) => ({ ...prev, matchingResultNote: e.target.value }))
                            }
                          />
                        </label>
                      </div>
                    </form>
                  ) : (
                    <div className="ops-detail-grid ops-detail-grid-single">
                      <div><span>매칭 결과</span><strong>{candidateProfile.matchingResultNote || "-"}</strong></div>
                    </div>
                  )}
                </section>
              ) : detailTab === "adminMemo" ? (
                <section className="ops-detail-section">
                  <h3>관리자 메모</h3>
                  {isMemoEditMode ? (
                    <div className="ops-detail-grid ops-detail-grid-single">
                      <label>
                        <span>메모</span>
                        <textarea
                          rows={12}
                          value={memoDraft}
                          onChange={(e) => setMemoDraft(e.target.value)}
                          placeholder="관리자 메모를 입력하세요."
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="ops-detail-grid ops-detail-grid-single">
                      <div><span>메모</span><strong>{selectedCandidate?.adminMemo || "-"}</strong></div>
                    </div>
                  )}
                </section>
              ) : (
                <section className="ops-detail-section">
                  <h3>{detailTabs.find((tabItem) => tabItem.key === detailTab)?.label || "상세 정보"}</h3>
                  <p className="ops-detail-empty">해당 탭 데이터는 연동 예정입니다.</p>
                </section>
              )}
            </div>
          </div>
          {detailTab === "basic" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isBasicEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      if (!selectedCandidate) return;
                      setIsBasicEditMode(false);
                      setBasicDraft({
                        name: selectedCandidate.name ?? "",
                        email: selectedCandidate.email ?? "",
                        phoneNumber: selectedCandidate.phoneNumber ?? "",
                        affiliation: selectedCandidate.affiliation ?? "",
                        nationality: selectedCandidate.nationality ?? "",
                        gender: normalizeGender(selectedCandidate.gender),
                        birthDate: toDateInputValue(selectedCandidate.birthDate),
                        jobTitle: selectedCandidate.jobTitle ?? "",
                        password: ""
                      });
                    }}
                    disabled={basicSaving}
                  >
                    취소
                  </button>
                  <button type="button" className="ops-action-save" onClick={() => void saveCandidateBasic()} disabled={basicSaving}>
                    {basicSaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <button type="button" className="ops-action-save" onClick={() => setIsBasicEditMode(true)}>
                  수정
                </button>
              )}
            </div>
          ) : detailTab === "visaResidence" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isVisaResidenceEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      setIsVisaResidenceEditMode(false);
                      setVisaResidenceDraft(visaResidenceDraftFromProfile(candidateProfile));
                    }}
                    disabled={visaResidenceSaving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="ops-action-save"
                    onClick={() => void saveCandidateVisaResidence()}
                    disabled={visaResidenceSaving || profileLoading}
                  >
                    {visaResidenceSaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => setIsVisaResidenceEditMode(true)}
                  disabled={profileLoading}
                >
                  수정
                </button>
              )}
            </div>
          ) : detailTab === "educationLanguage" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isEducationLanguageEditMode ? (
                educationLanguageView === "educationAdd" ? (
                  <>
                    <button
                      type="button"
                      className="ops-action-cancel"
                      onClick={() => {
                        setEducationLanguageView("list");
                        setEducationDraft(EMPTY_EDUCATION_DRAFT);
                        setEducationEditingId(null);
                      }}
                      disabled={educationSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      form="ops-candidate-education-form"
                      className="ops-action-save"
                      disabled={educationSubmitting || profileLoading}
                    >
                      {educationSubmitting ? (educationEditingId ? "수정 중..." : "추가 중...") : (educationEditingId ? "수정" : "추가")}
                    </button>
                  </>
                ) : educationLanguageView === "languageAdd" ? (
                  <>
                    <button
                      type="button"
                      className="ops-action-cancel"
                      onClick={() => {
                        setEducationLanguageView("list");
                        setLanguageSkillDraft(EMPTY_LANGUAGE_SKILL_DRAFT);
                        setLanguageSkillEditingId(null);
                      }}
                      disabled={languageSkillSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      form="ops-candidate-language-form"
                      className="ops-action-save"
                      disabled={languageSkillSubmitting || profileLoading}
                    >
                      {languageSkillSubmitting ? (languageSkillEditingId ? "수정 중..." : "추가 중...") : (languageSkillEditingId ? "수정" : "추가")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="ops-action-cancel"
                      onClick={() => {
                        setIsEducationLanguageEditMode(false);
                        setEducationLanguageView("list");
                        setEducationDraft(EMPTY_EDUCATION_DRAFT);
                        setEducationEditingId(null);
                        setLanguageSkillDraft(EMPTY_LANGUAGE_SKILL_DRAFT);
                        setLanguageSkillEditingId(null);
                      }}
                      disabled={educationSubmitting || languageSkillSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="ops-action-save"
                      onClick={() => {
                        setIsEducationLanguageEditMode(false);
                        setEducationLanguageView("list");
                        setEducationEditingId(null);
                        setLanguageSkillEditingId(null);
                      }}
                      disabled={educationSubmitting || languageSkillSubmitting || profileLoading}
                    >
                      저장
                    </button>
                  </>
                )
              ) : (
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => {
                    setIsEducationLanguageEditMode(true);
                    setEducationLanguageView("list");
                    setEducationEditingId(null);
                    setLanguageSkillEditingId(null);
                  }}
                  disabled={profileLoading}
                >
                  수정
                </button>
              )}
            </div>
          ) : detailTab === "career" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isCareerEditMode ? (
                careerView === "add" ? (
                  <>
                    <button
                      type="button"
                      className="ops-action-cancel"
                      onClick={() => {
                        setCareerView("list");
                        setCareerDraft(EMPTY_CAREER_DRAFT);
                        setCareerEditingId(null);
                      }}
                      disabled={careerSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      form="ops-candidate-career-form"
                      className="ops-action-save"
                      disabled={careerSubmitting || profileLoading}
                    >
                      {careerSubmitting ? (careerEditingId ? "수정 중..." : "추가 중...") : (careerEditingId ? "수정" : "추가")}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="ops-action-cancel"
                      onClick={() => {
                        setIsCareerEditMode(false);
                        setCareerView("list");
                        setCareerDraft(EMPTY_CAREER_DRAFT);
                        setCareerEditingId(null);
                      }}
                      disabled={careerSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="ops-action-save"
                      onClick={() => {
                        setIsCareerEditMode(false);
                        setCareerView("list");
                        setCareerEditingId(null);
                      }}
                      disabled={careerSubmitting || profileLoading}
                    >
                      저장
                    </button>
                  </>
                )
              ) : (
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => {
                    setIsCareerEditMode(true);
                    setCareerView("list");
                    setCareerEditingId(null);
                  }}
                  disabled={profileLoading}
                >
                  수정
                </button>
              )}
            </div>
          ) : detailTab === "activityExperience" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isActivityExperienceEditMode ? (
                activityExperienceView === "add" ? (
                  <>
                    <button
                      type="button"
                      className="ops-action-cancel"
                      onClick={() => {
                        setActivityExperienceView("list");
                        setActivityExperienceDraft(EMPTY_ACTIVITY_EXPERIENCE_DRAFT);
                        setActivityExperienceEditingId(null);
                      }}
                      disabled={activityExperienceSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      form="ops-candidate-activity-experience-form"
                      className="ops-action-save"
                      disabled={activityExperienceSubmitting || profileLoading}
                    >
                      {activityExperienceSubmitting
                        ? activityExperienceEditingId
                          ? "수정 중..."
                          : "추가 중..."
                        : activityExperienceEditingId
                          ? "수정"
                          : "추가"}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="ops-action-cancel"
                      onClick={() => {
                        setIsActivityExperienceEditMode(false);
                        setActivityExperienceView("list");
                        setActivityExperienceDraft(EMPTY_ACTIVITY_EXPERIENCE_DRAFT);
                        setActivityExperienceEditingId(null);
                      }}
                      disabled={activityExperienceSubmitting}
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      className="ops-action-save"
                      onClick={() => {
                        setIsActivityExperienceEditMode(false);
                        setActivityExperienceView("list");
                        setActivityExperienceEditingId(null);
                      }}
                      disabled={activityExperienceSubmitting || profileLoading}
                    >
                      저장
                    </button>
                  </>
                )
              ) : (
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => {
                    setIsActivityExperienceEditMode(true);
                    setActivityExperienceView("list");
                    setActivityExperienceEditingId(null);
                  }}
                  disabled={profileLoading}
                >
                  수정
                </button>
              )}
            </div>
          ) : detailTab === "preferenceCapability" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isPreferenceCapabilityEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      setIsPreferenceCapabilityEditMode(false);
                      setPreferenceCapabilityDraft(preferenceCapabilityDraftFromProfile(candidateProfile));
                      setIndustryToAdd("");
                      setJobRoleToAdd("");
                    }}
                    disabled={preferenceCapabilitySaving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="ops-action-save"
                    onClick={() => void savePreferenceCapability()}
                    disabled={preferenceCapabilitySaving || profileLoading}
                  >
                    {preferenceCapabilitySaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => {
                    setIsPreferenceCapabilityEditMode(true);
                    setIndustryToAdd("");
                    setJobRoleToAdd("");
                  }}
                  disabled={profileLoading}
                >
                  수정
                </button>
              )}
            </div>
          ) : detailTab === "additionalInfo" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isAdditionalInfoEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      setIsAdditionalInfoEditMode(false);
                      setAdditionalInfoDocuments(EMPTY_ADDITIONAL_INFO_DOCUMENT_DRAFT);
                    }}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="ops-action-save"
                    onClick={() => setIsAdditionalInfoEditMode(false)}
                    disabled={profileLoading}
                  >
                    완료
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => setIsAdditionalInfoEditMode(true)}
                  disabled={profileLoading}
                >
                  파일 선택
                </button>
              )}
            </div>
          ) : detailTab === "emergencyContact" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isEmergencyContactEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      setIsEmergencyContactEditMode(false);
                      setEmergencyContactDraft(emergencyContactDraftFromProfile(candidateProfile));
                    }}
                    disabled={emergencyContactSaving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="ops-action-save"
                    onClick={() => void saveEmergencyContact()}
                    disabled={emergencyContactSaving || profileLoading}
                  >
                    {emergencyContactSaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => setIsEmergencyContactEditMode(true)}
                  disabled={profileLoading}
                >
                  수정
                </button>
              )}
            </div>
          ) : detailTab === "matchingResult" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isMatchingResultEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      setIsMatchingResultEditMode(false);
                      setMatchingResultDraft(matchingResultDraftFromProfile(candidateProfile));
                    }}
                    disabled={matchingResultSaving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="ops-action-save"
                    onClick={() => void saveMatchingResult()}
                    disabled={matchingResultSaving || profileLoading}
                  >
                    {matchingResultSaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ops-action-save"
                  onClick={() => setIsMatchingResultEditMode(true)}
                  disabled={profileLoading}
                >
                  수정
                </button>
              )}
            </div>
          ) : detailTab === "adminMemo" ? (
            <div className="ops-modal-fixed-bottom ops-detail-actions">
              {isMemoEditMode ? (
                <>
                  <button
                    type="button"
                    className="ops-action-cancel"
                    onClick={() => {
                      setIsMemoEditMode(false);
                      setMemoDraft(selectedCandidate?.adminMemo ?? "");
                    }}
                    disabled={memoSaving}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="ops-action-save"
                    onClick={() => void saveCandidateMemo()}
                    disabled={memoSaving}
                  >
                    {memoSaving ? "저장 중..." : "저장"}
                  </button>
                </>
              ) : (
                <button type="button" className="ops-action-save" onClick={() => setIsMemoEditMode(true)}>
                  수정
                </button>
              )}
            </div>
          ) : null}
        </article>
      </dialog>

      <dialog ref={createDialogRef} className="ops-modal-dialog" onCancel={handleCreateDialogCancel} onClick={handleCreateDialogClick}>
        <article className="ops-modal-card">
          <div className="ops-modal-fixed-top">
            <div className="ops-modal-header">
              <h2>후보자 추가하기</h2>
              <button type="button" className="ops-modal-close" onClick={requestCloseCreateModal} aria-label="닫기">
                <X size={16} weight="bold" aria-hidden />
              </button>
            </div>
          </div>

          <div className="ops-modal-scroll-body">
            <form id="ops-candidate-create-form" className="ops-partner-form" onSubmit={createCandidate}>
              <div className="ops-partner-form-two-cols">
                <label>
                  <span className="ops-label-required">
                    이메일 <span className="ops-required">*</span>
                  </span>
                  <input
                    type="email"
                    value={createDraft.email}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  <span>이름</span>
                  <input value={createDraft.name} onChange={(e) => setCreateDraft((prev) => ({ ...prev, name: e.target.value }))} />
                </label>
                <label>
                  <span>연락처</span>
                  <input
                    value={createDraft.phoneNumber}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  />
                </label>
                <label>
                  <span>소속</span>
                  <input
                    value={createDraft.affiliation}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, affiliation: e.target.value }))}
                  />
                </label>
                <label>
                  <span>국적</span>
                  <input
                    value={createDraft.nationality}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, nationality: e.target.value }))}
                  />
                </label>
                <label>
                  <span>성별</span>
                  <select
                    value={createDraft.gender}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, gender: normalizeGender(e.target.value) }))}
                  >
                    <option value="">선택 안 함</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="secret">비밀이에요</option>
                  </select>
                </label>
                <label>
                  <span>생년월일</span>
                  <input
                    type="date"
                    value={createDraft.birthDate}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, birthDate: e.target.value }))}
                  />
                </label>
                <label>
                  <span>희망 직무</span>
                  <input
                    value={createDraft.jobTitle}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, jobTitle: e.target.value }))}
                  />
                </label>
                <label>
                  <span>비밀번호(선택)</span>
                  <input
                    type="password"
                    value={createDraft.password}
                    onChange={(e) => setCreateDraft((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="미입력 시 임시 비밀번호 자동 생성"
                  />
                </label>
              </div>
              {createErrorMessage ? <p className="ops-form-error">{createErrorMessage}</p> : null}
            </form>
          </div>

          <div className="ops-modal-fixed-bottom">
            <button type="submit" form="ops-candidate-create-form" className="ops-modal-submit" disabled={createSubmitting}>
              {createSubmitting ? "추가 중..." : "후보자 추가"}
            </button>
          </div>
        </article>
      </dialog>
    </section>
  );
}
