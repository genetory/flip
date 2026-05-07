"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  addMyFavoritePosition,
  applyMyPosition,
  getMyCandidateProfile,
  getMyAppliedPositions,
  getMyFavoritePositions,
  getMyPartnerOrganization,
  getMyPartnerPositions,
  removeMyFavoritePosition,
  type MyCandidateProfile,
  type MyPartnerOrganization,
  type PartnerPosition,
  type PublicPositionListItem
} from "../../lib/member-profile-client";
import { getPublicPositionStatusBadge } from "../../lib/position-status-meta";
import { partnerIndustryLabel } from "../../lib/partner-industry-labels";
import { getStoredProfilePhoto } from "../../lib/profile-media";
import { BadgeCheck, Bookmark, Briefcase, LayoutGrid, List, MapPin } from "lucide-react";

const PROFILE_SQUIRCLE_CLIP_ID = "profile-page-squircle-clip";
const PROFILE_SQUIRCLE_PATH = "M50,0 C74,0 86,3 93,10 C97,14 100,26 100,50 C100,74 97,86 93,90 C86,97 74,100 50,100 C26,100 14,97 7,90 C3,86 0,74 0,50 C0,26 3,14 7,10 C14,3 26,0 50,0 Z";
const PROFILE_SQUIRCLE_STYLE = {
  clipPath: `url(#${PROFILE_SQUIRCLE_CLIP_ID})`,
  WebkitClipPath: `url(#${PROFILE_SQUIRCLE_CLIP_ID})`
} as const;

type ProfileSection = {
  title: string;
  description: string;
  fields: string[];
};

type StudentResumeSection = {
  title: string;
  description: string;
  fields: Array<{ label: string; value: string }>;
  href: string;
};

type CompanyFieldKind = "text" | "logo" | "additional";
type PartnerPositionNotification = {
  id: string;
  positionId: string;
  positionTitle: string;
  kind: "status" | "progress";
  message: string;
  createdAt: string;
};

function formatIsoDate(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 10);
}

function formatList(values?: string[] | null) {
  if (!values || values.length === 0) return "-";
  return values.join(", ");
}

function toDisplayTitle(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function inferWorkType(value?: string | null): "On-site" | "Hybrid" | "Remote" {
  const text = (value ?? "").toLowerCase();
  if (text.includes("remote") || text.includes("재택")) return "Remote";
  if (text.includes("hybrid") || text.includes("하이브리드")) return "Hybrid";
  return "On-site";
}

function workTypeLabel(value: string, locale: "ko" | "en") {
  const normalized = value.toLowerCase().replace(/[\s_-]/g, "");
  if (normalized === "remote") return locale === "ko" ? "원격근무" : "Remote";
  if (normalized === "hybrid") return locale === "ko" ? "혼합근무" : "Hybrid";
  if (normalized === "onsite") return locale === "ko" ? "대면근무" : "On-site";
  return value;
}

function formatPostedDate(value: string, locale: "ko" | "en") {
  const created = new Date(value);
  if (Number.isNaN(created.getTime())) return "-";
  const now = Date.now();
  const diffMs = Math.max(0, now - created.getTime());
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) return locale === "ko" ? `${Math.max(1, minutes)}분 전` : `${Math.max(1, minutes)}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return locale === "ko" ? `${hours}시간 전` : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return locale === "ko" ? `${days}일 전` : `${days}d ago`;
  const y = created.getFullYear();
  const m = String(created.getMonth() + 1).padStart(2, "0");
  const d = String(created.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${d}`;
}

function getPositionStatusBadge(
  status: PublicPositionListItem["status"],
  locale: "ko" | "en"
) {
  return getPublicPositionStatusBadge(status, locale);
}

function companyHref(partnerOrganizationId?: string | null) {
  if (!partnerOrganizationId?.trim()) return null;
  return `/companies/${encodeURIComponent(partnerOrganizationId.trim())}`;
}

export function ProfilePage() {
  const { locale } = useLanguage();
  const tr = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const { user, isReady, isAuthenticated } = useAuthSession();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [partnerOrg, setPartnerOrg] = useState<MyPartnerOrganization | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "positions" | "notifications">("info");
  const [studentTab, setStudentTab] = useState<"info" | "resume" | "applied" | "favorites">("info");
  const [postedPositions, setPostedPositions] = useState<PublicPositionListItem[]>([]);
  const [partnerPositions, setPartnerPositions] = useState<PartnerPosition[]>([]);
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const [postedViewMode, setPostedViewMode] = useState<"grid" | "list">("list");
  const [studentViewMode, setStudentViewMode] = useState<"grid" | "list">("list");
  const [favoritePositions, setFavoritePositions] = useState<PublicPositionListItem[]>([]);
  const [appliedPositions, setAppliedPositions] = useState<PublicPositionListItem[]>([]);
  const [studentPositionsError, setStudentPositionsError] = useState<string | null>(null);
  const [studentProfile, setStudentProfile] = useState<MyCandidateProfile | null>(null);

  const canEditBasic = user?.role === "PARTNER" || user?.role === "STUDENT";

  const positionNotifications = useMemo<PartnerPositionNotification[]>(() => {
    const notifications = partnerPositions.flatMap((position) => {
      const statusLogs = (position.statusHistories ?? []).map((history) => {
        const fromLabel = history.fromStatus ? getPublicPositionStatusBadge(history.fromStatus, locale).label : null;
        const toLabel = getPublicPositionStatusBadge(history.toStatus, locale).label;
        const base = fromLabel ? `${fromLabel} -> ${toLabel}` : toLabel;
        return {
          id: `status-${history.id}`,
          positionId: position.id,
          positionTitle: position.title,
          kind: "status" as const,
          message: history.note?.trim()
            ? `${tr("상태가 변경되었습니다", "Status has been changed")} (${base}, ${history.note.trim()})`
            : `${tr("상태가 변경되었습니다", "Status has been changed")} (${base})`,
          createdAt: history.createdAt
        };
      });

      const progressLogs = (position.postingProgressLogs ?? []).map((log) => ({
        id: `progress-${log.id}`,
        positionId: position.id,
        positionTitle: position.title,
        kind: "progress" as const,
        message: log.message,
        createdAt: log.createdAt
      }));

      return [...statusLogs, ...progressLogs];
    });

    return notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 30);
  }, [locale, partnerPositions, tr]);

  const enumDisplay = (value?: string | null) => {
    if (!value) return "-";
    const visa: Record<string, string> = {
      D10_JOB_SEEKING: tr("D-10 구직", "D-10 Job Seeking"),
      D2_STUDENT: tr("D-2 유학", "D-2 Student"),
      D4_GENERAL_TRAINING: tr("D-4 일반연수", "D-4 General Training"),
      F2_RESIDENCE: tr("F-2 거주", "F-2 Residence"),
      F4_OVERSEAS_KOREAN: tr("F-4 재외동포", "F-4 Overseas Korean"),
      F5_PERMANENT_RESIDENCE: tr("F-5 영주", "F-5 Permanent Residence"),
      F6_MARRIAGE_IMMIGRATION: tr("F-6 결혼이민", "F-6 Marriage Immigration"),
      E7_SPECIFIC_ACTIVITY: tr("E-7 특정활동", "E-7 Specific Activity"),
      H1_WORKING_HOLIDAY: tr("H-1 워킹홀리데이", "H-1 Working Holiday"),
      OTHER: tr("기타", "Other")
    };
    const educationType: Record<string, string> = {
      HIGH_SCHOOL: tr("고등학교", "High School"),
      ASSOCIATE: tr("전문학사", "Associate"),
      BACHELOR: tr("학사", "Bachelor"),
      MASTER: tr("석사", "Master"),
      DOCTOR: tr("박사", "Doctor"),
      BOOTCAMP: tr("부트캠프", "Bootcamp"),
      CERTIFICATE: tr("자격/수료", "Certificate"),
      OTHER: tr("기타", "Other")
    };
    const educationStatus: Record<string, string> = {
      ENROLLED: tr("재학", "Enrolled"),
      GRADUATED: tr("졸업", "Graduated"),
      LEAVE_OF_ABSENCE: tr("휴학", "Leave of Absence"),
      DROPPED_OUT: tr("중퇴", "Dropped Out"),
      OTHER: tr("기타", "Other")
    };
    const languageType: Record<string, string> = {
      KOREAN: tr("한국어", "Korean"),
      ENGLISH: tr("영어", "English"),
      CHINESE: tr("중국어", "Chinese"),
      JAPANESE: tr("일본어", "Japanese"),
      VIETNAMESE: tr("베트남어", "Vietnamese"),
      INDONESIAN: tr("인도네시아어", "Indonesian"),
      THAI: tr("태국어", "Thai"),
      MALAY: tr("말레이어", "Malay"),
      FILIPINO: tr("필리핀어", "Filipino"),
      HINDI: tr("힌디어", "Hindi"),
      SPANISH: tr("스페인어", "Spanish"),
      FRENCH: tr("프랑스어", "French"),
      GERMAN: tr("독일어", "German"),
      OTHER: tr("기타", "Other")
    };
    const languageLevel: Record<string, string> = {
      BEGINNER: tr("초급", "Beginner"),
      INTERMEDIATE: tr("중급", "Intermediate"),
      ADVANCED: tr("고급", "Advanced"),
      NATIVE: tr("원어민", "Native")
    };
    const activityType: Record<string, string> = {
      PROJECT: tr("프로젝트", "Project"),
      VOLUNTEER: tr("봉사활동", "Volunteer"),
      INTERNSHIP: tr("인턴십", "Internship"),
      CERTIFICATE: tr("자격증", "Certificate"),
      AWARD: tr("수상", "Award"),
      EXTRACURRICULAR: tr("대외활동", "Extracurricular"),
      OTHER: tr("기타", "Other")
    };

    return (
      visa[value] ??
      educationType[value] ??
      educationStatus[value] ??
      languageType[value] ??
      languageLevel[value] ??
      activityType[value] ??
      toDisplayTitle(value)
    );
  };

  const businessSections: ProfileSection[] = useMemo(
    () => [
      {
        title: tr("기본 정보", "Basic information"),
        description: tr("파트너명, 산업군, 웹사이트, 주소, 소개, 기업 이미지, 추가 이미지를 관리합니다.", "Manage partner name, industry, website, address, description, company image, and additional images."),
        fields: []
      },
      {
        title: tr("인증 정보", "Verification"),
        description: tr("최종 인증을 위해 필수 서류/이미지를 업로드합니다.", "Upload required documents/images for final verification."),
        fields: []
      }
    ],
    [locale]
  );

  const roleLabel = useMemo(() => {
    if (!user) return "";
    if (user.role === "PARTNER") return tr("파트너회원", "Partner");
    if (user.role === "OPERATOR") return tr("운영자", "Operator");
    if (user.role === "STUDENT") return tr("일반회원", "General");
    return "";
  }, [locale, user]);

  const partnerVerificationBadge = useMemo(() => {
    if (user?.role !== "PARTNER" && user?.role !== "OPERATOR") return null;
    if (!partnerOrg) return null;
    if (partnerOrg?.verification?.isApproved) {
      return {
        className: "bg-emerald-50 text-emerald-700",
        label: tr("운영중", "Active")
      };
    }
    return {
      className: "bg-amber-50 text-amber-700",
      label: tr("검토중 (승인 대기)", "Under review (approval pending)")
    };
  }, [partnerOrg, partnerOrg?.verification?.isApproved, tr, user?.role]);

  const avatarFallback = useMemo(() => {
    if (user?.name?.trim()) return user.name.trim()[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  }, [user?.email, user?.name]);

  useEffect(() => {
    if (!user) return;
    setProfileImage(getStoredProfilePhoto(user.id));
  }, [user]);

  useEffect(() => {
    if (!user || (user.role !== "PARTNER" && user.role !== "OPERATOR")) return;
    let isMounted = true;

    void (async () => {
      try {
        const item = await getMyPartnerOrganization();
        if (!isMounted) return;
        setPartnerOrg(item);
        setProfileError(null);
      } catch (error) {
        if (!isMounted) return;
        setProfileError(error instanceof Error ? error.message : tr("파트너 정보를 불러오지 못했습니다.", "Failed to load partner profile."));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [locale, user]);

  useEffect(() => {
    if (!user || (user.role !== "PARTNER" && user.role !== "OPERATOR")) return;
    let isMounted = true;

    void (async () => {
      try {
        const mine = await getMyPartnerPositions();
        if (!isMounted) return;
        setPartnerPositions(mine);
        const items: PublicPositionListItem[] = mine.map((item) => ({
          ...item,
          sourceKind: "INTERNAL",
          sourceProvider: "INTERNAL",
          sourceExternalId: null,
          sourceUrl: null,
          sourceFetchedAt: null,
          matchingParticipantsCount: 0,
          partnerOrganization: partnerOrg
            ? {
                id: partnerOrg.id,
                name: partnerOrg.name ?? "-",
                industry: partnerOrg.industry ?? "OTHER",
                companySize: partnerOrg.companySize ?? null,
                officeAddress: partnerOrg.officeAddress ?? null
              }
            : null
        }));
        setPostedPositions(items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setPositionsError(null);
      } catch (error) {
        if (!isMounted) return;
        setPositionsError(error instanceof Error ? error.message : tr("등록한 포지션 목록을 불러오지 못했습니다.", "Failed to load posted positions."));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [locale, partnerOrg?.id, user]);

  useEffect(() => {
    if (!user || user.role === "PARTNER" || user.role === "OPERATOR") return;
    let isMounted = true;

    void (async () => {
      try {
        const [favorites, applied, profile] = await Promise.all([
          getMyFavoritePositions(),
          getMyAppliedPositions(),
          getMyCandidateProfile()
        ]);
        if (!isMounted) return;
        setFavoritePositions(favorites);
        setAppliedPositions(applied);
        setStudentProfile(profile ?? null);
        setStudentPositionsError(null);
      } catch (error) {
        if (!isMounted) return;
        setStudentPositionsError(error instanceof Error ? error.message : tr("포지션 목록을 불러오지 못했습니다.", "Failed to load positions."));
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [locale, user]);

  useEffect(() => {
    if (!user) return;

    if (user.role === "PARTNER" || user.role === "OPERATOR") {
      if (tabParam === "positions" || tabParam === "notifications" || tabParam === "info") {
        setActiveTab(tabParam);
      } else {
        setActiveTab("info");
      }
      return;
    }

    if (tabParam === "resume" || tabParam === "applied" || tabParam === "favorites" || tabParam === "info") {
      setStudentTab(tabParam);
    } else {
      setStudentTab("info");
    }
  }, [tabParam, user]);

  const additionalCompanyImages = useMemo(() => {
    const raw = partnerOrg?.officePhotoImageData;
    if (!raw) return [] as string[];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
      return [raw];
    } catch {
      return [raw];
    }
  }, [partnerOrg?.officePhotoImageData]);

  const basicCompanyFields = useMemo(
    () => [
      {
        label: tr("로고 이미지", "Logo image"),
        value: partnerOrg?.companyLogoImageData ? tr("업로드 완료", "Uploaded") : tr("미업로드", "Not uploaded"),
        kind: "logo" as CompanyFieldKind
      },
      {
        label: tr("추가 이미지", "Additional images"),
        value: additionalCompanyImages.length > 0 ? tr("업로드 완료", "Uploaded") : tr("미업로드", "Not uploaded"),
        kind: "additional" as CompanyFieldKind
      },
      { label: tr("파트너명", "Partner name"), value: partnerOrg?.name ?? "-", kind: "text" as CompanyFieldKind },
      { label: tr("회사 코드", "Company code"), value: partnerOrg?.slug ?? "-", kind: "text" as CompanyFieldKind },
      { label: tr("산업군", "Industry"), value: partnerIndustryLabel(partnerOrg?.industry), kind: "text" as CompanyFieldKind },
      { label: tr("웹사이트", "Website"), value: partnerOrg?.website ?? "-", kind: "text" as CompanyFieldKind },
      { label: tr("주소", "Address"), value: partnerOrg?.officeAddress ?? "-", kind: "text" as CompanyFieldKind },
      { label: tr("소개", "Description"), value: partnerOrg?.description ?? "-", kind: "text" as CompanyFieldKind }
    ],
    [additionalCompanyImages.length, locale, partnerOrg]
  );

  const verificationFields = useMemo(
    () => [
      {
        label: tr("사업자등록증", "Business registration"),
        value: partnerOrg?.businessRegistrationDocumentData ? tr("업로드 완료", "Uploaded") : tr("미업로드", "Not uploaded")
      },
      {
        label: tr("4대보험 가입자명부", "4-insurance subscriber list"),
        value: partnerOrg?.fourInsuranceSubscriberListData ? tr("업로드 완료", "Uploaded") : tr("미업로드", "Not uploaded")
      }
    ],
    [
      locale,
      partnerOrg?.businessRegistrationDocumentData,
      partnerOrg?.fourInsuranceSubscriberListData
    ]
  );

  const verificationSummary = useMemo(() => {
    const notUploadedLabel = tr("미업로드", "Not uploaded");
    const requiredLabels = new Set([
      tr("사업자등록증", "Business registration"),
      tr("4대보험 가입자명부", "4-insurance subscriber list")
    ]);
    const missingRequired = verificationFields
      .filter((field) => requiredLabels.has(field.label) && field.value === notUploadedLabel)
      .map((field) => field.label);

    const isApproved = Boolean(partnerOrg?.verification?.isApproved);

    if (isApproved) {
      return tr(
        missingRequired.length === 0
          ? "운영중: 운영자 승인이 완료되었습니다."
          : `운영중: 운영자 승인 완료 (서류 보완 필요: ${missingRequired.join(", ")}).`,
        missingRequired.length === 0
          ? "Active: operator approval is completed."
          : `Active: operator approved (documents to complete: ${missingRequired.join(", ")}).`
      );
    }

    return tr(
      missingRequired.length === 0
        ? "검토중: 운영자 승인 대기 상태입니다."
        : `검토중: 운영자 승인 대기 (서류 보완 필요: ${missingRequired.join(", ")}).`,
      missingRequired.length === 0
        ? "Under review: waiting for operator approval."
        : `Under review: waiting for operator approval (documents to complete: ${missingRequired.join(", ")}).`
    );
  }, [locale, partnerOrg?.verification?.isApproved, verificationFields]);


  const studentResumeSections = useMemo<StudentResumeSection[]>(
    () => [
      {
        title: tr("근무 가능 조건", "Work availability"),
        description: tr("매칭 정확도를 높이는 기본 조건입니다.", "Core conditions that improve matching accuracy."),
        fields: [
          { label: tr("비자 유형", "Visa type"), value: enumDisplay(studentProfile?.visaType) },
          { label: tr("거주 지역", "Residence region"), value: studentProfile?.residenceProvince ?? "-" },
          {
            label: tr("시작 가능 시점", "Available start timing"),
            value:
              studentProfile?.programStartOption === "SPECIFIC_DATE"
                ? `${tr("특정 날짜", "Specific date")} (${formatIsoDate(studentProfile?.programStartDate)})`
                : studentProfile?.programStartOption === "ASAP"
                  ? tr("즉시 가능", "ASAP")
                  : "-"
          }
        ],
        href: "/profile/resume/edit/work-availability"
      },
      {
        title: tr("학력", "Education"),
        description: tr("최종 학력과 현재 상태를 보여주세요.", "Share your latest education and current status."),
        fields: [
          { label: tr("학교명", "School"), value: studentProfile?.educations?.[0]?.schoolName ?? "-" },
          { label: tr("전공", "Major"), value: studentProfile?.educations?.[0]?.major ?? "-" },
          {
            label: tr("학위/재학 상태", "Degree/enrollment status"),
            value: studentProfile?.educations?.[0]
              ? `${enumDisplay(studentProfile.educations[0].educationType)} / ${enumDisplay(studentProfile.educations[0].status)}`
              : "-"
          }
        ],
        href: "/profile/resume/edit/education"
      },
      {
        title: tr("언어 능력", "Language skills"),
        description: tr("업무 가능한 언어 수준을 입력해 주세요.", "Add your working language levels."),
        fields: [
          { label: tr("언어", "Language"), value: enumDisplay(studentProfile?.languageSkills?.[0]?.language) },
          { label: tr("레벨", "Level"), value: enumDisplay(studentProfile?.languageSkills?.[0]?.level) },
          {
            label: tr("시험/인증", "Test/certificate"),
            value: studentProfile?.languageSkills?.[0]
              ? [studentProfile.languageSkills[0].testName, studentProfile.languageSkills[0].score].filter(Boolean).join(" / ") || "-"
              : "-"
          }
        ],
        href: "/profile/resume/edit/language"
      },
      {
        title: tr("경력", "Experience"),
        description: tr("인턴/아르바이트/정규 경력을 추가해 주세요.", "Add internship/part-time/full-time experience."),
        fields: [
          { label: tr("회사명", "Company"), value: studentProfile?.careers?.[0]?.companyName ?? "-" },
          { label: tr("직무", "Role"), value: studentProfile?.careers?.[0]?.position ?? "-" },
          {
            label: tr("기간", "Period"),
            value: studentProfile?.careers?.[0]
              ? `${formatIsoDate(studentProfile.careers[0].startDate)} ~ ${
                studentProfile.careers[0].isCurrent ? tr("현재", "Current") : formatIsoDate(studentProfile.careers[0].endDate)
              }`
              : "-"
          }
        ],
        href: "/profile/resume/edit/career"
      },
      {
        title: tr("활동 경험", "Activities"),
        description: tr("프로젝트/대외활동/수상 이력을 보여주세요.", "Show projects, extracurriculars, and awards."),
        fields: [
          { label: tr("활동 유형", "Activity type"), value: enumDisplay(studentProfile?.activityExperiences?.[0]?.activityType) },
          { label: tr("활동명", "Title"), value: studentProfile?.activityExperiences?.[0]?.title ?? "-" },
          { label: tr("성과", "Outcome"), value: studentProfile?.activityExperiences?.[0]?.description ?? "-" }
        ],
        href: "/profile/resume/edit/activity"
      },
      {
        title: tr("소개/동기", "Profile text"),
        description: tr("나를 설명하는 핵심 텍스트 항목입니다.", "Key text areas that explain your profile."),
        fields: [
          { label: tr("스킬", "Skills"), value: formatList(studentProfile?.skills) },
          { label: tr("자기소개", "Self introduction"), value: studentProfile?.selfIntroduction?.trim() || "-" },
          { label: tr("선호 조건", "Preferences"), value: studentProfile?.preferenceConditionNote?.trim() || "-" },
          { label: tr("추가 정보", "Additional notes"), value: studentProfile?.additionalInfoNote?.trim() || "-" }
        ],
        href: "/profile/resume/edit/profile-text"
      }
    ],
    [locale, studentProfile, tr]
  );

  async function toggleStudentFavorite(positionId: string) {
    if (!user || user.role !== "STUDENT") return;
    const isFavorite = favoritePositions.some((item) => item.id === positionId);
    const previous = favoritePositions;
    const source =
      appliedPositions.find((item) => item.id === positionId)
      ?? favoritePositions.find((item) => item.id === positionId);
    const optimistic = isFavorite
      ? favoritePositions.filter((item) => item.id !== positionId)
      : source
      ? [source, ...favoritePositions]
      : favoritePositions;
    setFavoritePositions(optimistic);

    try {
      if (isFavorite) {
        await removeMyFavoritePosition(positionId);
      } else {
        await addMyFavoritePosition(positionId);
      }
    } catch (error) {
      setFavoritePositions(previous);
      window.alert(error instanceof Error ? error.message : tr("즐겨찾기 처리에 실패했습니다.", "Failed to update favorite."));
    }
  }

  async function applyFromStudentFavorite(positionId: string) {
    if (!user || user.role !== "STUDENT") return;
    if (appliedPositions.some((item) => item.id === positionId)) return;

    try {
      await applyMyPosition(positionId);
      if (!appliedPositions.some((item) => item.id === positionId)) {
        const found = favoritePositions.find((item) => item.id === positionId);
        if (found) {
          setAppliedPositions((prev) => [found, ...prev]);
        }
      }
      window.alert(tr("지원한 포지션에 추가되었습니다.", "Added to applied positions."));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : tr("지원 처리에 실패했습니다.", "Failed to apply."));
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <svg width="0" height="0" aria-hidden className="absolute">
        <defs>
          <clipPath id={PROFILE_SQUIRCLE_CLIP_ID} clipPathUnits="objectBoundingBox">
            <path d={PROFILE_SQUIRCLE_PATH} transform="scale(0.01)" />
          </clipPath>
        </defs>
      </svg>
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">{tr("내 프로필", "My profile")}</h1>

          {!isReady ? (
            <section className="rounded-2xl bg-white p-5 md:p-6">
              <p className="text-sm text-muted-foreground">{tr("프로필 정보를 불러오는 중...", "Loading profile information...")}</p>
            </section>
          ) : !isAuthenticated || !user ? (
            <section className="rounded-2xl bg-white p-5 md:p-6">
              <p className="mt-2 text-sm text-muted-foreground">{tr("로그인이 필요합니다.", "Sign in is required.")}</p>
              <div className="mt-4">
                <Button variant="dark" asChild>
                  <Link href="/login">{tr("로그인하러 가기", "Go to login")}</Link>
                </Button>
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              <div className="rounded-2xl border border-border/70 bg-card p-5 md:p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {profileImage ? (
                    <img src={profileImage} alt={tr("프로필 사진", "Profile photo")} className="h-16 w-16 object-cover" style={PROFILE_SQUIRCLE_STYLE} />
                  ) : (
                    <div className={`grid h-16 w-16 place-items-center text-lg font-semibold ${
                      user.role === "STUDENT" ? "border border-border/60 bg-[#F8FAFC] text-muted-foreground" : "bg-muted"
                    }`} style={PROFILE_SQUIRCLE_STYLE}>{avatarFallback}</div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold">{user.name ?? tr("이름 없음", "No name")}</p>
                      {roleLabel ? (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{roleLabel}</span>
                      ) : null}
                      {partnerVerificationBadge ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${partnerVerificationBadge.className}`}>
                          <BadgeCheck className="h-3.5 w-3.5" />
                          {partnerVerificationBadge.label}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild disabled={!canEditBasic}>
                  <Link href="/profile/edit">{tr("편집", "Edit")}</Link>
                </Button>
              </div>

              {profileError ? <p className="text-sm text-destructive">{profileError}</p> : null}
              </div>

              <div className="space-y-6">
                {user.role === "PARTNER" || user.role === "OPERATOR" ? (
                  <article className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveTab("info")}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            activeTab === "info" ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >
                          {tr("정보", "Info")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("positions")}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            activeTab === "positions" ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >
                          {tr("올려진 포지션", "Posted positions")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab("notifications")}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            activeTab === "notifications" ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >
                          {tr("알림", "Notifications")}
                        </button>
                      </div>
                      <Button size="sm" className="bg-[#b7ff5a] font-semibold text-[#111111] hover:bg-[#a8ee4d]" asChild>
                        <Link href="/profile">{tr("대시보드로 이동하기", "Go to dashboard")}</Link>
                      </Button>
                    </div>

                    {activeTab === "info" ? (
                      <>
                        {businessSections.map((section) => (
                          <div key={section.title} className="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold">{section.title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                              </div>
                              {user.role === "PARTNER" ? (
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={section.title === tr("인증 정보", "Verification") ? "/partner-profile/verification/edit" : "/partner-profile/edit"}>
                                    {tr("편집", "Edit")}
                                  </Link>
                                </Button>
                              ) : null}
                            </div>

                            {section.title === tr("기본 정보", "Basic information") ? (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {basicCompanyFields.map((field) => (
                                  <div
                                    key={field.label}
                                    className={`rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm ${
                                      field.label === tr("소개", "Description") ? "sm:col-span-2" : ""
                                    }`}
                                  >
                                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                                    {field.kind === "logo" ? (
                                      partnerOrg?.companyLogoImageData ? (
                                        <div className="mt-2">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={partnerOrg.companyLogoImageData}
                                            alt={tr("로고 이미지", "Logo image")}
                                            className="h-14 w-14 object-cover"
                                            style={PROFILE_SQUIRCLE_STYLE}
                                          />
                                        </div>
                                      ) : (
                                        <p className="mt-1 break-words text-foreground">{field.value}</p>
                                      )
                                    ) : field.kind === "additional" ? (
                                      additionalCompanyImages.length > 0 ? (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                          {additionalCompanyImages.slice(0, 4).map((image, index) => (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                              key={`${field.label}-${index}`}
                                              src={image}
                                              alt={`${tr("추가 이미지", "Additional image")} ${index + 1}`}
                                              className="h-14 w-14 object-cover"
                                              style={PROFILE_SQUIRCLE_STYLE}
                                            />
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="mt-1 break-words text-foreground">{field.value}</p>
                                      )
                                    ) : (
                                      <p className={`mt-1 break-words text-foreground ${
                                        field.label === tr("소개", "Description") ? "whitespace-pre-wrap leading-relaxed" : ""
                                      }`}>{field.value}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : section.title === tr("인증 정보", "Verification") ? (
                              <div className="space-y-3">
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {verificationFields.map((field) => (
                                    <div key={field.label} className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                                      <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                                      <p className="mt-1 break-words text-foreground">{field.value}</p>
                                    </div>
                                  ))}
                                </div>
                                <p className="text-xs text-muted-foreground">{verificationSummary}</p>
                              </div>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {section.fields.map((field) => (
                                  <div key={field} className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm text-muted-foreground">
                                    {field}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : activeTab === "positions" ? (
                      <div className="space-y-3">
                        <div className="flex items-start justify-end gap-3">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant={postedViewMode === "list" ? "dark" : "outline"}
                              size="icon"
                              aria-label={tr("리스트 보기", "List view")}
                              onClick={() => setPostedViewMode("list")}
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={postedViewMode === "grid" ? "dark" : "outline"}
                              size="icon"
                              aria-label={tr("그리드 보기", "Grid view")}
                              onClick={() => setPostedViewMode("grid")}
                            >
                              <LayoutGrid className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {positionsError ? <p className="text-sm text-destructive">{positionsError}</p> : null}

                        {postedPositions.length === 0 ? (
                          <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                            {tr("아직 등록된 포지션이 없습니다.", "No posted positions yet.")}
                          </div>
                        ) : postedViewMode === "grid" ? (
                          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {postedPositions.map((item) => (
                              <PostedPositionGridCard key={item.id} item={item} canEdit={user.role === "PARTNER"} />
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {postedPositions.map((item) => (
                              <PostedPositionRow key={item.id} item={item} canEdit={user.role === "PARTNER"} />
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {positionNotifications.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            {tr("아직 알림이 없습니다.", "No notifications yet.")}
                          </p>
                        ) : (
                          <div className="max-h-[560px] space-y-2 overflow-auto pr-1">
                            {positionNotifications.map((notification) => (
                              <article key={notification.id} className="rounded-md border border-border/50 bg-background p-3">
                                <div className="mb-1 flex items-center gap-2">
                                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    notification.kind === "status"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-emerald-50 text-emerald-700"
                                  }`}>
                                    {notification.kind === "status" ? tr("상태 변경", "Status update") : tr("진행 로그", "Progress log")}
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">{formatPostedDate(notification.createdAt, locale)}</span>
                                </div>
                                <p className="line-clamp-1 text-xs text-muted-foreground">{notification.positionTitle}</p>
                                <p className="mt-1 text-sm text-foreground">{notification.message}</p>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ) : (
                  <article className="space-y-5 rounded-2xl border border-border/70 bg-card p-5 md:p-6">
                    <div className="flex items-center justify-between gap-3 pb-1">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStudentTab("info")}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            studentTab === "info" ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >
                          {tr("정보", "Info")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentTab("resume")}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            studentTab === "resume" ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >
                          {tr("이력관리", "Resume")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentTab("applied")}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            studentTab === "applied" ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >
                          {tr("지원한 포지션", "Applied positions")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setStudentTab("favorites")}
                          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                            studentTab === "favorites" ? "bg-foreground text-background" : "text-muted-foreground"
                          }`}
                        >
                          {tr("즐겨찾기한 포지션", "Favorite positions")}
                        </button>
                      </div>
                    </div>

                    {studentTab === "info" ? (
                      <div className="space-y-2 rounded-xl border border-border/60 bg-muted/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{tr("기본 정보", "Basic information")}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {tr("프로필의 핵심 연락/신상 정보를 관리합니다.", "Manage your core contact and personal profile information.")}
                            </p>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href="/profile/edit">{tr("편집", "Edit")}</Link>
                          </Button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                            <p className="text-xs font-medium text-muted-foreground">{tr("프로필 사진", "Profile photo")}</p>
                            <p className="mt-1 break-words text-foreground">{profileImage ? tr("등록됨", "Uploaded") : tr("미등록", "Not uploaded")}</p>
                          </div>
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                            <p className="text-xs font-medium text-muted-foreground">{tr("실명", "Legal name")}</p>
                            <p className="mt-1 break-words text-foreground">{user.realName ?? "-"}</p>
                          </div>
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                            <p className="text-xs font-medium text-muted-foreground">{tr("닉네임", "Nickname")}</p>
                            <p className="mt-1 break-words text-foreground">{user.name ?? "-"}</p>
                          </div>
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                            <p className="text-xs font-medium text-muted-foreground">{tr("연락처", "Phone")}</p>
                            <p className="mt-1 break-words text-foreground">{user.phoneNumber ?? "-"}</p>
                          </div>
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                            <p className="text-xs font-medium text-muted-foreground">{tr("성별", "Gender")}</p>
                            <p className="mt-1 break-words text-foreground">
                              {user.gender === "MALE"
                                ? tr("남성", "Male")
                                : user.gender === "FEMALE"
                                  ? tr("여성", "Female")
                                  : user.gender === "OTHER"
                                    ? tr("기타", "Other")
                                    : tr("선택 안 함", "Prefer not to say")}
                            </p>
                          </div>
                          <div className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                            <p className="text-xs font-medium text-muted-foreground">{tr("생년월일", "Date of birth")}</p>
                            <p className="mt-1 break-words text-foreground">{user.birthDate ? user.birthDate.slice(0, 10) : "-"}</p>
                          </div>
                        </div>
                      </div>
                    ) : studentTab === "resume" ? (
                      <div className="space-y-4 rounded-xl border border-border/60 bg-muted/10 p-4">
                        <div className="space-y-5">
                          {studentResumeSections.map((section) => (
                            <section key={section.title} className="space-y-2 rounded-lg border border-border/50 bg-card/60 p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{section.title}</p>
                                  <p className="mt-1 text-xs text-muted-foreground">{section.description}</p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                  <Link href={section.href}>{tr("편집", "Edit")}</Link>
                                </Button>
                              </div>
                              <div className="grid gap-2 sm:grid-cols-2">
                                {section.fields.map((field) => (
                                  <div key={`${section.title}-${field.label}`} className="rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-sm">
                                    <p className="text-xs font-medium text-muted-foreground">{field.label}</p>
                                    <p className="mt-1 break-words text-foreground">{field.value}</p>
                                  </div>
                                ))}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-muted-foreground">
                            {studentTab === "applied" ? appliedPositions.length : favoritePositions.length}
                            {tr("개", "")}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant={studentViewMode === "list" ? "dark" : "outline"}
                              size="icon"
                              aria-label={tr("리스트 보기", "List view")}
                              onClick={() => setStudentViewMode("list")}
                            >
                              <List className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant={studentViewMode === "grid" ? "dark" : "outline"}
                              size="icon"
                              aria-label={tr("그리드 보기", "Grid view")}
                              onClick={() => setStudentViewMode("grid")}
                            >
                              <LayoutGrid className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {studentPositionsError ? <p className="text-sm text-destructive">{studentPositionsError}</p> : null}

                        {(() => {
                          const source = studentTab === "applied" ? appliedPositions : favoritePositions;
                          const favoriteIdSet = new Set(favoritePositions.map((item) => item.id));
                          const appliedIdSet = new Set(appliedPositions.map((item) => item.id));

                          if (source.length === 0) {
                            return (
                              <div className="rounded-md border border-border/50 bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
                                {studentTab === "applied"
                                  ? tr("아직 지원한 포지션이 없습니다.", "No applied positions yet.")
                                  : tr("아직 즐겨찾기한 포지션이 없습니다.", "No favorite positions yet.")}
                              </div>
                            );
                          }

                          if (studentViewMode === "grid") {
                            return (
                              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {source.map((item) => (
                                  <PostedPositionGridCard
                                    key={item.id}
                                    item={item}
                                    canEdit={false}
                                    showStudentActions
                                    isFavorite={favoriteIdSet.has(item.id)}
                                    isApplied={appliedIdSet.has(item.id)}
                                    onToggleFavorite={() => {
                                      void toggleStudentFavorite(item.id);
                                    }}
                                    onApply={() => {
                                      void applyFromStudentFavorite(item.id);
                                    }}
                                  />
                                ))}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-3">
                              {source.map((item) => (
                                <PostedPositionRow
                                  key={item.id}
                                  item={item}
                                  canEdit={false}
                                  showStudentActions
                                  isFavorite={favoriteIdSet.has(item.id)}
                                  isApplied={appliedIdSet.has(item.id)}
                                  onToggleFavorite={() => {
                                    void toggleStudentFavorite(item.id);
                                  }}
                                  onApply={() => {
                                    void applyFromStudentFavorite(item.id);
                                  }}
                                />
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </article>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

const PostedPositionRow = ({
  item,
  canEdit,
  showStudentActions = false,
  isFavorite = false,
  isApplied = false,
  onToggleFavorite,
  onApply
}: {
  item: PublicPositionListItem;
  canEdit: boolean;
  showStudentActions?: boolean;
  isFavorite?: boolean;
  isApplied?: boolean;
  onToggleFavorite?: () => void;
  onApply?: () => void;
}) => {
  const { locale } = useLanguage();
  const tr = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const itemCompany = item.partnerOrganization?.name?.trim() || tr("파트너 기업", "Partner company");
  const itemCompanyHref = companyHref(item.partnerOrganization?.id);
  const itemWorkType = item.workType ?? inferWorkType(item.workingHours);
  const itemLocation = item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || tr("협의", "To be discussed");
  const itemJobRole = item.preferredJobRole?.trim() || tr("직무 미정", "Role TBD");
  const thumbnail = item.thumbnailImages?.[0];
  const statusBadge = getPositionStatusBadge(item.status, locale);

  return (
    <article className="group relative rounded-xl border border-border/60 bg-card p-4">
      <Link href={`/positions/${item.id}`} aria-label={`${item.title} ${tr("상세보기", "View details")}`} className="absolute inset-0 z-10 rounded-xl" />
      <p className="absolute right-4 top-3 text-[11px] text-muted-foreground">{formatPostedDate(item.createdAt, locale)}</p>
      <div className="flex flex-col gap-2 md:grid md:grid-cols-[180px_1fr_auto] md:items-stretch md:gap-3">
        <div className="relative aspect-[16/9] w-full shrink-0 self-start overflow-hidden rounded-xl md:w-[180px] md:self-auto">
          <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
            {statusBadge.label}
          </span>
          {thumbnail ? (
            <img src={thumbnail} alt={`${itemCompany} ${tr("썸네일", "thumbnail")}`} className="block h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-muted font-display text-2xl font-bold leading-none text-muted-foreground">
              {itemCompany[0]?.toUpperCase() ?? "P"}
            </div>
          )}
        </div>

        <div className="flex-1 md:flex md:flex-col md:justify-center">
          <div className="mb-0.5 min-w-0 text-xs text-muted-foreground">
            {itemCompanyHref ? (
              <Link href={itemCompanyHref} className="relative z-20 block max-w-[45%] truncate font-semibold">
                {itemCompany}
              </Link>
            ) : (
              <p className="max-w-[45%] truncate font-semibold">{itemCompany}</p>
            )}
            <p className="mt-1 truncate leading-tight">{itemJobRole}</p>
          </div>
          <h3 className="line-clamp-1 font-display text-lg font-bold leading-snug">{item.title}</h3>
          <div className="mt-0.5 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 max-w-[50%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{itemLocation}</span>
            <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(itemWorkType, locale)}</span>
          </div>
        </div>

        <div className="relative z-20 flex shrink-0 flex-row items-center justify-between gap-2 border-t border-border/60 pt-1.5 md:mt-auto md:self-end md:border-0 md:pt-0">
          <div className="flex items-center gap-1.5">
            {showStudentActions ? (
              <>
                <Button variant="outline" size="icon" aria-label={tr("저장", "Save")} onClick={onToggleFavorite}>
                  <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
                </Button>
                <Button
                  variant="dark"
                  size="sm"
                  onClick={onApply}
                  disabled={isApplied}
                  className={isApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 disabled:opacity-100" : undefined}
                >
                  {isApplied ? tr("지원완료", "Applied") : tr("지원하기", "Apply")}
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/positions/${item.id}`}>{tr("상세보기", "View details")}</Link>
              </Button>
            )}
            {canEdit && !showStudentActions ? (
              <Button variant="dark" size="sm" asChild>
                <Link href={`/positions/${item.id}/edit`}>{tr("수정하기", "Edit")}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
};

const PostedPositionGridCard = ({
  item,
  canEdit,
  showStudentActions = false,
  isFavorite = false,
  isApplied = false,
  onToggleFavorite,
  onApply
}: {
  item: PublicPositionListItem;
  canEdit: boolean;
  showStudentActions?: boolean;
  isFavorite?: boolean;
  isApplied?: boolean;
  onToggleFavorite?: () => void;
  onApply?: () => void;
}) => {
  const { locale } = useLanguage();
  const tr = (ko: string, en: string) => (locale === "ko" ? ko : en);
  const itemCompany = item.partnerOrganization?.name?.trim() || tr("파트너 기업", "Partner company");
  const itemCompanyHref = companyHref(item.partnerOrganization?.id);
  const itemWorkType = item.workType ?? inferWorkType(item.workingHours);
  const itemLocation = item.workLocation?.trim() || item.partnerOrganization?.officeAddress?.trim() || tr("협의", "To be discussed");
  const itemJobRole = item.preferredJobRole?.trim() || tr("직무 미정", "Role TBD");
  const thumbnail = item.thumbnailImages?.[0];
  const statusBadge = getPositionStatusBadge(item.status, locale);

  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border/60 bg-card p-4">
      <Link href={`/positions/${item.id}`} aria-label={`${item.title} ${tr("상세보기", "View details")}`} className="absolute inset-0 z-10 rounded-xl" />
      <div className="relative">
        <span className={`absolute left-2 top-2 z-20 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
        {thumbnail ? (
          <img src={thumbnail} alt={`${itemCompany} ${tr("썸네일", "thumbnail")}`} className="block aspect-[16/9] w-full rounded-xl object-cover" />
        ) : (
          <div className="grid aspect-[16/9] w-full place-items-center rounded-xl bg-muted font-display text-4xl font-bold text-muted-foreground">
            {itemCompany[0]?.toUpperCase() ?? "P"}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        <div className="min-w-0 md:flex md:flex-col md:justify-center">
          {itemCompanyHref ? (
            <Link href={itemCompanyHref} className="relative z-20 block truncate font-semibold">
              {itemCompany}
            </Link>
          ) : (
            <p className="truncate font-semibold">{itemCompany}</p>
          )}
          <p className="mt-1 truncate">{itemJobRole}</p>
        </div>
      </div>

      <h3 className="mt-1 truncate font-display text-base font-bold leading-tight">{item.title}</h3>
      <div className="mt-1 flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
        <span className="inline-flex min-w-0 max-w-[58%] items-center gap-1 truncate"><MapPin className="h-3 w-3 shrink-0" />{itemLocation}</span>
        <span className="inline-flex min-w-0 items-center gap-1 truncate"><Briefcase className="h-3 w-3 shrink-0" />{workTypeLabel(itemWorkType, locale)}</span>
      </div>

      <div className="relative z-20 mt-auto flex items-center gap-2 pt-3">
        {showStudentActions ? (
          <>
            <Button variant="outline" size="icon" aria-label={tr("저장", "Save")} onClick={onToggleFavorite}>
              <Bookmark className={isFavorite ? "fill-current text-foreground" : ""} />
            </Button>
            <Button
              variant="dark"
              className={`h-10 flex-1 text-sm ${isApplied ? "border border-zinc-300 bg-zinc-200 text-zinc-500 disabled:opacity-100" : ""}`}
              onClick={onApply}
              disabled={isApplied}
            >
              {isApplied ? tr("지원완료", "Applied") : tr("지원하기", "Apply")}
            </Button>
          </>
        ) : (
          <Button variant="outline" className="h-10 flex-1 text-sm" asChild>
            <Link href={`/positions/${item.id}`}>{tr("상세보기", "View details")}</Link>
          </Button>
        )}

        {canEdit && !showStudentActions ? (
          <Button variant="dark" className="h-10 flex-1 text-sm" asChild>
            <Link href={`/positions/${item.id}/edit`}>{tr("수정하기", "Edit")}</Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
};
