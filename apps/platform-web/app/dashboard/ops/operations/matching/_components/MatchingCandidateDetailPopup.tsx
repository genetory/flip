"use client";

import { FileText } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

const TOKEN_COOKIE_KEY = "ops_admin_token";

type CandidateDetailTab =
  | "basic"
  | "visaResidence"
  | "educationLanguage"
  | "career"
  | "activityExperience"
  | "preferenceCapability"
  | "additionalInfo"
  | "emergencyContact"
  | "matchingResult"
  | "adminMemo";

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

export type MatchingCandidateSummary = {
  id: string;
  email: string;
  name: string | null;
  phoneNumber?: string | null;
  affiliation?: string | null;
  nationality?: string | null;
  gender?: string | null;
  birthDate?: string | null;
  jobTitle: string | null;
  adminMemo?: string | null;
  createdAt: string;
};

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
};

type CandidateLanguageSkillItem = {
  id: string;
  language: CandidateLanguageType;
  level: CandidateLanguageLevel;
  testName: string | null;
  score: string | null;
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
};

type CandidateProfile = {
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
  preferredIndustries: string[];
  preferredJobRoles: CandidatePreferredJobRole[];
  skills: string[];
  selfIntroduction: string | null;
  programMotivation: string | null;
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
};

const EMPTY_PROFILE: CandidateProfile = {
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
  emergencyContactName: null,
  emergencyContactRelation: null,
  emergencyContactPhone: null,
  emergencyContactEmail: null,
  emergencyContactAddress: null,
  matchingResultNote: null,
  educations: [],
  languageSkills: [],
  careers: [],
  activityExperiences: []
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

const ADDITIONAL_INFO_DOCUMENT_ITEMS: Array<{ key: string; title: string }> = [
  { key: "resume", title: "이력서" },
  { key: "coverLetter", title: "커버레터" },
  { key: "portfolio", title: "포트폴리오" },
  { key: "passportCopy", title: "여권 사본" },
  { key: "enrollmentOrGraduationCertificate", title: "재학/졸업 증명서" },
  { key: "careerCertificate", title: "경력 증명서" }
];

function readCookie(key: string) {
  if (typeof document === "undefined") return "";
  const entry = document.cookie.split("; ").find((item) => item.startsWith(`${key}=`));
  if (entry) return decodeURIComponent(entry.split("=")[1] ?? ""); try { return window.localStorage.getItem("platform_access_token") || ""; } catch { return ""; }
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

function normalizeGender(value?: string | null): "male" | "female" | "secret" | "" {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return "";
  if (["male", "m", "man", "남", "남자", "남성"].includes(normalized)) return "male";
  if (["female", "f", "woman", "여", "여자", "여성"].includes(normalized)) return "female";
  if (["secret", "unknown", "prefer_not_to_say", "비밀", "비밀이에요"].includes(normalized)) return "secret";
  return "";
}

function genderLabel(value?: string | null) {
  const normalized = normalizeGender(value);
  if (normalized === "male") return "남성";
  if (normalized === "female") return "여성";
  if (normalized === "secret") return "비밀이에요";
  return "-";
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

type Props = {
  apiBaseUrl: string;
  candidateId: string;
  candidate: MatchingCandidateSummary | null;
};

export default function MatchingCandidateDetailPopup({ apiBaseUrl, candidateId, candidate }: Props) {
  const [profile, setProfile] = useState<CandidateProfile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<CandidateDetailTab>("basic");

  useEffect(() => {
    setDetailTab("basic");
  }, [candidateId]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      setLoading(true);
      setErrorMessage(null);
      try {
        const token = readCookie(TOKEN_COOKIE_KEY);
        const response = await fetch(`${apiBaseUrl}/ops/candidates/${candidateId}/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const payload = (await response.json()) as { ok?: boolean; item?: CandidateProfile; message?: string };
        if (!response.ok || !payload.ok || !payload.item) {
          if (!cancelled) {
            setProfile(EMPTY_PROFILE);
            setErrorMessage(payload.message ?? "후보자 프로필 정보를 불러오지 못했습니다.");
          }
          return;
        }
        if (!cancelled) setProfile({ ...EMPTY_PROFILE, ...payload.item });
      } catch {
        if (!cancelled) {
          setProfile(EMPTY_PROFILE);
          setErrorMessage("후보자 프로필 정보를 불러오는 중 오류가 발생했습니다.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, candidateId]);

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
    <section className="ops-matching-candidate-panel">
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
            <div className="ops-detail-grid ops-detail-grid-single">
              <div><span>이름</span><strong>{candidate?.name || "-"}</strong></div>
              <div><span>이메일</span><strong>{candidate?.email || "-"}</strong></div>
              <div><span>연락처</span><strong>{candidate?.phoneNumber || "-"}</strong></div>
              <div><span>소속</span><strong>{candidate?.affiliation || "-"}</strong></div>
              <div><span>국적</span><strong>{candidate?.nationality || "-"}</strong></div>
              <div><span>성별</span><strong>{genderLabel(candidate?.gender)}</strong></div>
              <div><span>생년월일</span><strong>{candidate?.birthDate ? formatDate(candidate.birthDate) : "-"}</strong></div>
              <div><span>희망 직무</span><strong>{candidate?.jobTitle || "-"}</strong></div>
              <div><span>가입일</span><strong>{candidate?.createdAt ? formatDate(candidate.createdAt) : "-"}</strong></div>
            </div>
          </section>
        ) : detailTab === "visaResidence" ? (
          <section className="ops-detail-section">
            <h3>비자&거주 정보</h3>
            {loading ? (
              <p className="ops-detail-empty">비자&거주 정보를 불러오는 중입니다...</p>
            ) : errorMessage ? (
              <p className="ops-form-error">{errorMessage}</p>
            ) : (
              <div className="ops-detail-grid ops-detail-grid-single">
                <div><span>취업 허가</span><strong>{yesNoLabel(profile.workPermit)}</strong></div>
                <div><span>비자 유형</span><strong>{visaTypeLabel(profile.visaType)}</strong></div>
                <div><span>비자 만료일</span><strong>{profile.visaExpiryDate ? formatDate(profile.visaExpiryDate) : "-"}</strong></div>
                <div><span>한국 거주</span><strong>{yesNoLabel(profile.livesInKorea)}</strong></div>
                <div><span>숙소 확보</span><strong>{yesNoLabel(profile.hasAccommodation)}</strong></div>
                <div><span>거주 시/도</span><strong>{profile.residenceProvince || "-"}</strong></div>
                <div><span>거주 구/군</span><strong>{profile.residenceDistrict || "-"}</strong></div>
                <div><span>거주 상세 주소</span><strong>{profile.residenceAddress || "-"}</strong></div>
              </div>
            )}
          </section>
        ) : detailTab === "educationLanguage" ? (
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
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="ops-table-empty">학력 정보를 불러오는 중입니다...</td></tr>
                    ) : errorMessage ? (
                      <tr><td colSpan={7} className="ops-table-empty">{errorMessage}</td></tr>
                    ) : profile.educations.length === 0 ? (
                      <tr><td colSpan={7} className="ops-table-empty">등록된 학력이 없습니다.</td></tr>
                    ) : (
                      profile.educations.map((item) => (
                        <tr key={item.id}>
                          <td>{item.schoolName}</td>
                          <td>{item.major || "-"}</td>
                          <td>{educationTypeLabel(item.educationType)}</td>
                          <td>{educationStatusLabel(item.status)}</td>
                          <td className="ops-period-nowrap">
                            <div className="ops-period-main">{periodMainLabel(item.startDate, item.endDate)}</div>
                            <div className="ops-period-sub">{periodSubLabel(item.startDate, item.endDate)}</div>
                          </td>
                          <td>{[item.country, item.city].filter(Boolean).join(" / ") || "-"}</td>
                          <td>{yesNoLabel(item.isKoreanSchool)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="ops-table-empty">어학 정보를 불러오는 중입니다...</td></tr>
                    ) : errorMessage ? (
                      <tr><td colSpan={4} className="ops-table-empty">{errorMessage}</td></tr>
                    ) : profile.languageSkills.length === 0 ? (
                      <tr><td colSpan={4} className="ops-table-empty">등록된 어학이 없습니다.</td></tr>
                    ) : (
                      profile.languageSkills.map((item) => (
                        <tr key={item.id}>
                          <td>{languageTypeLabel(item.language)}</td>
                          <td>{languageLevelLabel(item.level)}</td>
                          <td>{item.testName || "-"}</td>
                          <td>{item.score || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : detailTab === "career" ? (
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
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="ops-table-empty">경력 정보를 불러오는 중입니다...</td></tr>
                  ) : errorMessage ? (
                    <tr><td colSpan={6} className="ops-table-empty">{errorMessage}</td></tr>
                  ) : profile.careers.length === 0 ? (
                    <tr><td colSpan={6} className="ops-table-empty">등록된 경력이 없습니다.</td></tr>
                  ) : (
                    profile.careers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.companyName}</td>
                        <td>{item.position}</td>
                        <td>{item.department || "-"}</td>
                        <td>{yesNoLabel(item.isCurrent)}</td>
                        <td className="ops-period-nowrap">
                          <div className="ops-period-main">{periodMainLabel(item.startDate, item.endDate, item.isCurrent)}</div>
                          <div className="ops-period-sub">{periodSubLabel(item.startDate, item.endDate, item.isCurrent)}</div>
                        </td>
                        <td>{item.description || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : detailTab === "activityExperience" ? (
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
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="ops-table-empty">활동/경험 정보를 불러오는 중입니다...</td></tr>
                  ) : errorMessage ? (
                    <tr><td colSpan={6} className="ops-table-empty">{errorMessage}</td></tr>
                  ) : profile.activityExperiences.length === 0 ? (
                    <tr><td colSpan={6} className="ops-table-empty">등록된 활동/경험이 없습니다.</td></tr>
                  ) : (
                    profile.activityExperiences.map((item) => (
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
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : detailTab === "preferenceCapability" ? (
          <section className="ops-detail-section">
            <h3>선호 조건&역량</h3>
            {loading ? (
              <p className="ops-detail-empty">선호 조건&역량 정보를 불러오는 중입니다...</p>
            ) : errorMessage ? (
              <p className="ops-form-error">{errorMessage}</p>
            ) : (
              <div className="ops-detail-grid ops-detail-grid-single">
                <div><span>희망 기간</span><strong>{programDurationLabel(profile.preferredProgramDuration)}</strong></div>
                <div>
                  <span>프로그램 시작 시기</span>
                  <strong>
                    {profile.programStartOption === "SPECIFIC_DATE"
                      ? `${programStartOptionLabel(profile.programStartOption)} (${formatDateCompact(profile.programStartDate)})`
                      : programStartOptionLabel(profile.programStartOption)}
                  </strong>
                </div>
                <div><span>선호 산업</span><strong>{profile.preferredIndustries.join(", ") || "-"}</strong></div>
                <div>
                  <span>선호 직무</span>
                  <strong>{profile.preferredJobRoles.length > 0 ? profile.preferredJobRoles.map((item) => preferredJobRoleLabel(item)).join(", ") : "-"}</strong>
                </div>
                <div><span>스킬</span><strong>{profile.skills.join(", ") || "-"}</strong></div>
                <div><span>자기소개</span><strong>{profile.selfIntroduction || "-"}</strong></div>
                <div><span>프로그램 참여 동기</span><strong>{profile.programMotivation || "-"}</strong></div>
              </div>
            )}
          </section>
        ) : detailTab === "additionalInfo" ? (
          <section className="ops-detail-section">
            <h3>추가 정보</h3>
            <p className="ops-detail-empty">필수 서류를 카드별로 등록할 수 있습니다. 업로드 연동은 다음 단계에서 진행됩니다.</p>
            <div className="ops-file-card-grid">
              {ADDITIONAL_INFO_DOCUMENT_ITEMS.map((item) => (
                <article key={item.key} className="ops-file-card">
                  <div className="ops-file-card-title-row">
                    <span className="ops-file-card-title">
                      <FileText size={14} aria-hidden />
                      {item.title}
                    </span>
                  </div>
                  <p className="ops-file-card-file-name">선택된 파일 없음</p>
                  <div className="ops-file-card-status">미등록</div>
                </article>
              ))}
            </div>
          </section>
        ) : detailTab === "emergencyContact" ? (
          <section className="ops-detail-section">
            <h3>비상 연락망</h3>
            {loading ? (
              <p className="ops-detail-empty">비상 연락망 정보를 불러오는 중입니다...</p>
            ) : errorMessage ? (
              <p className="ops-form-error">{errorMessage}</p>
            ) : (
              <div className="ops-detail-grid ops-detail-grid-single">
                <div><span>이름</span><strong>{profile.emergencyContactName || "-"}</strong></div>
                <div><span>관계</span><strong>{profile.emergencyContactRelation || "-"}</strong></div>
                <div><span>연락처</span><strong>{profile.emergencyContactPhone || "-"}</strong></div>
                <div><span>이메일</span><strong>{profile.emergencyContactEmail || "-"}</strong></div>
                <div><span>주소</span><strong>{profile.emergencyContactAddress || "-"}</strong></div>
              </div>
            )}
          </section>
        ) : detailTab === "matchingResult" ? (
          <section className="ops-detail-section">
            <h3>매칭 결과</h3>
            {loading ? (
              <p className="ops-detail-empty">매칭 결과를 불러오는 중입니다...</p>
            ) : errorMessage ? (
              <p className="ops-form-error">{errorMessage}</p>
            ) : (
              <div className="ops-detail-grid ops-detail-grid-single">
                <div><span>매칭 결과</span><strong>{profile.matchingResultNote || "-"}</strong></div>
              </div>
            )}
          </section>
        ) : (
          <section className="ops-detail-section">
            <h3>관리자 메모</h3>
            <div className="ops-detail-grid ops-detail-grid-single">
              <div><span>메모</span><strong>{candidate?.adminMemo || "-"}</strong></div>
            </div>
          </section>
        )}
      </div>
    </section>
  );
}
