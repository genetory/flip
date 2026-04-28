"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  createMyActivityExperience,
  createMyCareer,
  createMyEducation,
  createMyLanguageSkill,
  deleteMyActivityExperience,
  deleteMyCareer,
  deleteMyEducation,
  deleteMyLanguageSkill,
  getMyCandidateProfile,
  type MyCandidateProfile,
  updateMyActivityExperience,
  updateMyCandidateProfile,
  updateMyCareer,
  updateMyEducation,
  updateMyLanguageSkill
} from "../../lib/member-profile-client";

type SectionKey = "work-availability" | "education" | "language" | "career" | "activity" | "profile-text";

function toIsoDate(dateInput: string) {
  if (!dateInput) return null;
  return new Date(`${dateInput}T00:00:00.000Z`).toISOString();
}

function toDateInput(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function educationTypeLabel(value: string, tr: (ko: string, en: string) => string) {
  switch (value) {
    case "HIGH_SCHOOL":
      return tr("고등학교", "High school");
    case "ASSOCIATE":
      return tr("전문학사", "Associate");
    case "BACHELOR":
      return tr("학사", "Bachelor");
    case "MASTER":
      return tr("석사", "Master");
    case "DOCTOR":
      return tr("박사", "Doctor");
    case "BOOTCAMP":
      return tr("부트캠프", "Bootcamp");
    case "CERTIFICATE":
      return tr("수료/자격", "Certificate");
    default:
      return tr("기타", "Other");
  }
}

function educationStatusLabel(value: string, tr: (ko: string, en: string) => string) {
  switch (value) {
    case "ENROLLED":
      return tr("재학", "Enrolled");
    case "GRADUATED":
      return tr("졸업", "Graduated");
    case "LEAVE_OF_ABSENCE":
      return tr("휴학", "Leave of absence");
    case "DROPPED_OUT":
      return tr("중퇴", "Dropped out");
    default:
      return tr("기타", "Other");
  }
}

function languageLabel(value: string, tr: (ko: string, en: string) => string) {
  switch (value) {
    case "KOREAN":
      return tr("한국어", "Korean");
    case "ENGLISH":
      return tr("영어", "English");
    case "CHINESE":
      return tr("중국어", "Chinese");
    case "JAPANESE":
      return tr("일본어", "Japanese");
    case "VIETNAMESE":
      return tr("베트남어", "Vietnamese");
    case "INDONESIAN":
      return tr("인도네시아어", "Indonesian");
    case "THAI":
      return tr("태국어", "Thai");
    case "MALAY":
      return tr("말레이어", "Malay");
    case "FILIPINO":
      return tr("필리핀어", "Filipino");
    case "HINDI":
      return tr("힌디어", "Hindi");
    case "SPANISH":
      return tr("스페인어", "Spanish");
    case "FRENCH":
      return tr("프랑스어", "French");
    case "GERMAN":
      return tr("독일어", "German");
    default:
      return tr("기타", "Other");
  }
}

function languageLevelLabel(value: string, tr: (ko: string, en: string) => string) {
  switch (value) {
    case "BEGINNER":
      return tr("초급", "Beginner");
    case "INTERMEDIATE":
      return tr("중급", "Intermediate");
    case "ADVANCED":
      return tr("고급", "Advanced");
    default:
      return tr("원어민", "Native");
  }
}

function activityTypeLabel(value: string, tr: (ko: string, en: string) => string) {
  switch (value) {
    case "PROJECT":
      return tr("프로젝트", "Project");
    case "VOLUNTEER":
      return tr("봉사활동", "Volunteer");
    case "INTERNSHIP":
      return tr("인턴십", "Internship");
    case "CERTIFICATE":
      return tr("자격/수료", "Certificate");
    case "AWARD":
      return tr("수상", "Award");
    case "EXTRACURRICULAR":
      return tr("대외/교내활동", "Extracurricular");
    default:
      return tr("기타", "Other");
  }
}

export function ProfileResumeSectionEditPage() {
  const router = useRouter();
  const params = useParams<{ section: string }>();
  const { isAuthenticated, isReady, user } = useAuthSession();
  const { locale } = useLanguage();
  const tr = (ko: string, en: string) => (locale === "ko" ? ko : en);

  const rawSection = Array.isArray(params.section) ? params.section[0] : params.section;
  const section = (rawSection ?? "") as SectionKey;
  const isValidSection = ["work-availability", "education", "language", "career", "activity", "profile-text"].includes(section);

  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [visaType, setVisaType] = useState("");
  const [residenceProvince, setResidenceProvince] = useState("");
  const [programStartOption, setProgramStartOption] = useState<"" | "ASAP" | "SPECIFIC_DATE">("");
  const [programStartDate, setProgramStartDate] = useState("");

  const [skillsInput, setSkillsInput] = useState("");
  const [selfIntroduction, setSelfIntroduction] = useState("");
  const [programMotivation, setProgramMotivation] = useState("");
  const [preferenceConditionNote, setPreferenceConditionNote] = useState("");
  const [additionalInfoNote, setAdditionalInfoNote] = useState("");

  const [editingEducationId, setEditingEducationId] = useState<string | null>(null);
  const [educationSchoolName, setEducationSchoolName] = useState("");
  const [educationType, setEducationType] = useState("BACHELOR");
  const [educationMajor, setEducationMajor] = useState("");
  const [educationStatus, setEducationStatus] = useState("ENROLLED");
  const [educationCountry, setEducationCountry] = useState("");
  const [educationCity, setEducationCity] = useState("");
  const [educationStartDate, setEducationStartDate] = useState("");
  const [educationEndDate, setEducationEndDate] = useState("");
  const [educationIsKoreanSchool, setEducationIsKoreanSchool] = useState(false);

  const [editingLanguageId, setEditingLanguageId] = useState<string | null>(null);
  const [language, setLanguage] = useState("KOREAN");
  const [languageLevel, setLanguageLevel] = useState("BEGINNER");
  const [languageTestName, setLanguageTestName] = useState("");
  const [languageScore, setLanguageScore] = useState("");

  const [editingCareerId, setEditingCareerId] = useState<string | null>(null);
  const [careerCompanyName, setCareerCompanyName] = useState("");
  const [careerPosition, setCareerPosition] = useState("");
  const [careerDepartment, setCareerDepartment] = useState("");
  const [careerIsCurrent, setCareerIsCurrent] = useState(false);
  const [careerStartDate, setCareerStartDate] = useState("");
  const [careerEndDate, setCareerEndDate] = useState("");
  const [careerDescription, setCareerDescription] = useState("");

  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [activityTitle, setActivityTitle] = useState("");
  const [activityType, setActivityType] = useState("PROJECT");
  const [activityOrganization, setActivityOrganization] = useState("");
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [activitySkills, setActivitySkills] = useState("");

  const sectionItems = useMemo(
    () => [
      { id: "work-availability", title: tr("근무 가능 조건", "Work availability") },
      { id: "education", title: tr("학력", "Education") },
      { id: "language", title: tr("언어 능력", "Language skills") },
      { id: "career", title: tr("경력", "Experience") },
      { id: "activity", title: tr("활동 경험", "Activities") },
      { id: "profile-text", title: tr("소개/동기", "Profile text") }
    ],
    [locale, tr]
  );

  const sectionTitle = useMemo(() => {
    return sectionItems.find((item) => item.id === section)?.title ?? tr("이력관리 편집", "Resume editing");
  }, [section, sectionItems, tr]);

  async function refreshProfile() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const item = await getMyCandidateProfile();
      setProfile(item ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tr("프로필 정보를 불러오지 못했습니다.", "Failed to load profile."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!isReady || !isAuthenticated || user?.role !== "STUDENT") return;
    void refreshProfile();
  }, [isAuthenticated, isReady, user?.role]);

  useEffect(() => {
    setVisaType(profile?.visaType ?? "");
    setResidenceProvince(profile?.residenceProvince ?? "");
    setProgramStartOption((profile?.programStartOption ?? "") as "" | "ASAP" | "SPECIFIC_DATE");
    setProgramStartDate(toDateInput(profile?.programStartDate));

    setSkillsInput((profile?.skills ?? []).join(", "));
    setSelfIntroduction(profile?.selfIntroduction ?? "");
    setProgramMotivation(profile?.programMotivation ?? "");
    setPreferenceConditionNote(profile?.preferenceConditionNote ?? "");
    setAdditionalInfoNote(profile?.additionalInfoNote ?? "");
  }, [profile]);

  function resetEducationForm() {
    setEditingEducationId(null);
    setEducationSchoolName("");
    setEducationType("BACHELOR");
    setEducationMajor("");
    setEducationStatus("ENROLLED");
    setEducationCountry("");
    setEducationCity("");
    setEducationStartDate("");
    setEducationEndDate("");
    setEducationIsKoreanSchool(false);
  }

  function resetLanguageForm() {
    setEditingLanguageId(null);
    setLanguage("KOREAN");
    setLanguageLevel("BEGINNER");
    setLanguageTestName("");
    setLanguageScore("");
  }

  function resetCareerForm() {
    setEditingCareerId(null);
    setCareerCompanyName("");
    setCareerPosition("");
    setCareerDepartment("");
    setCareerIsCurrent(false);
    setCareerStartDate("");
    setCareerEndDate("");
    setCareerDescription("");
  }

  function resetActivityForm() {
    setEditingActivityId(null);
    setActivityTitle("");
    setActivityType("PROJECT");
    setActivityOrganization("");
    setActivityStartDate("");
    setActivityEndDate("");
    setActivityDescription("");
    setActivitySkills("");
  }

  async function saveWorkAvailability() {
    setSaving(true);
    setErrorMessage(null);
    try {
      await updateMyCandidateProfile({
        visaType: visaType ? (visaType as MyCandidateProfile["visaType"]) : null,
        residenceProvince: residenceProvince.trim() || null,
        programStartOption: programStartOption || null,
        programStartDate: programStartOption === "SPECIFIC_DATE" ? toIsoDate(programStartDate) : null
      });
      await refreshProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tr("저장에 실패했습니다.", "Failed to save."));
    } finally {
      setSaving(false);
    }
  }

  async function saveProfileText() {
    const skillTokens = skillsInput
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setSaving(true);
    setErrorMessage(null);
    try {
      await updateMyCandidateProfile({
        skills: skillTokens,
        selfIntroduction: selfIntroduction.trim() || null,
        programMotivation: programMotivation.trim() || null,
        preferenceConditionNote: preferenceConditionNote.trim() || null,
        additionalInfoNote: additionalInfoNote.trim() || null
      });
      await refreshProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tr("저장에 실패했습니다.", "Failed to save."));
    } finally {
      setSaving(false);
    }
  }

  async function saveEducation() {
    if (!educationSchoolName.trim()) {
      setErrorMessage(tr("학교명을 입력해 주세요.", "Please enter school name."));
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        schoolName: educationSchoolName.trim(),
        educationType: educationType as "HIGH_SCHOOL" | "ASSOCIATE" | "BACHELOR" | "MASTER" | "DOCTOR" | "BOOTCAMP" | "CERTIFICATE" | "OTHER",
        major: educationMajor.trim() || null,
        status: educationStatus as "ENROLLED" | "GRADUATED" | "LEAVE_OF_ABSENCE" | "DROPPED_OUT" | "OTHER",
        country: educationCountry.trim() || null,
        city: educationCity.trim() || null,
        startDate: toIsoDate(educationStartDate),
        endDate: toIsoDate(educationEndDate),
        isKoreanSchool: educationIsKoreanSchool
      };
      if (editingEducationId) {
        await updateMyEducation(editingEducationId, payload);
      } else {
        await createMyEducation(payload);
      }
      resetEducationForm();
      await refreshProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tr("저장에 실패했습니다.", "Failed to save."));
    } finally {
      setSaving(false);
    }
  }

  async function saveLanguage() {
    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        language: language as
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
          | "OTHER",
        level: languageLevel as "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "NATIVE",
        testName: languageTestName.trim() || null,
        score: languageScore.trim() || null
      };
      if (editingLanguageId) {
        await updateMyLanguageSkill(editingLanguageId, payload);
      } else {
        await createMyLanguageSkill(payload);
      }
      resetLanguageForm();
      await refreshProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tr("저장에 실패했습니다.", "Failed to save."));
    } finally {
      setSaving(false);
    }
  }

  async function saveCareer() {
    if (!careerCompanyName.trim() || !careerPosition.trim()) {
      setErrorMessage(tr("회사명과 직무를 입력해 주세요.", "Please enter company and role."));
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        companyName: careerCompanyName.trim(),
        position: careerPosition.trim(),
        department: careerDepartment.trim() || null,
        isCurrent: careerIsCurrent,
        startDate: toIsoDate(careerStartDate),
        endDate: careerIsCurrent ? null : toIsoDate(careerEndDate),
        description: careerDescription.trim() || null
      };
      if (editingCareerId) {
        await updateMyCareer(editingCareerId, payload);
      } else {
        await createMyCareer(payload);
      }
      resetCareerForm();
      await refreshProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tr("저장에 실패했습니다.", "Failed to save."));
    } finally {
      setSaving(false);
    }
  }

  async function saveActivity() {
    if (!activityTitle.trim()) {
      setErrorMessage(tr("활동명을 입력해 주세요.", "Please enter activity title."));
      return;
    }

    const skillTokens = activitySkills
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        title: activityTitle.trim(),
        activityType: activityType as "PROJECT" | "VOLUNTEER" | "INTERNSHIP" | "CERTIFICATE" | "AWARD" | "EXTRACURRICULAR" | "OTHER",
        organization: activityOrganization.trim() || null,
        startDate: toIsoDate(activityStartDate),
        endDate: toIsoDate(activityEndDate),
        description: activityDescription.trim() || null,
        skills: skillTokens
      };
      if (editingActivityId) {
        await updateMyActivityExperience(editingActivityId, payload);
      } else {
        await createMyActivityExperience(payload);
      }
      resetActivityForm();
      await refreshProfile();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tr("저장에 실패했습니다.", "Failed to save."));
    } finally {
      setSaving(false);
    }
  }

  if (!isValidSection) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
        <Header />
        <main className="container py-12">
          <p className="text-sm text-muted-foreground">{tr("지원하지 않는 섹션입니다.", "Unsupported section.")}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
      <Header />
      <main className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight">{sectionTitle}</h1>
            <Button variant="outline" asChild>
              <Link href="/profile?tab=resume">{tr("이력관리로 돌아가기", "Back to resume")}</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {sectionItems.map((item) => (
              <Button key={item.id} variant={item.id === section ? "dark" : "outline"} size="sm" asChild>
                <Link href={`/profile/resume/edit/${item.id}`}>{item.title}</Link>
              </Button>
            ))}
          </div>

          {!isReady ? (
            <p className="text-sm text-muted-foreground">{tr("세션 정보를 확인하는 중...", "Checking session...")}</p>
          ) : !isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{tr("로그인이 필요합니다.", "Sign in is required.")}</p>
              <Button variant="dark" asChild>
                <Link href="/login">{tr("로그인하러 가기", "Go to login")}</Link>
              </Button>
            </div>
          ) : user?.role !== "STUDENT" ? (
            <p className="text-sm text-muted-foreground">{tr("학생 계정만 이력관리 편집이 가능합니다.", "Only student accounts can edit resume sections.")}</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">{tr("프로필을 불러오는 중...", "Loading profile...")}</p>
          ) : (
            <section className="space-y-5">
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              {section === "work-availability" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("비자 유형", "Visa type")}</label>
                    <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={visaType} onChange={(e) => setVisaType(e.target.value)}>
                      <option value="">{tr("선택 안 함", "Not selected")}</option>
                      <option value="D10_JOB_SEEKING">D-10</option>
                      <option value="D2_STUDENT">D-2</option>
                      <option value="D4_GENERAL_TRAINING">D-4</option>
                      <option value="F2_RESIDENCE">F-2</option>
                      <option value="F4_OVERSEAS_KOREAN">F-4</option>
                      <option value="F5_PERMANENT_RESIDENCE">F-5</option>
                      <option value="F6_MARRIAGE_IMMIGRATION">F-6</option>
                      <option value="E7_SPECIFIC_ACTIVITY">E-7</option>
                      <option value="H1_WORKING_HOLIDAY">H-1</option>
                      <option value="OTHER">{tr("기타", "Other")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("거주 지역", "Residence region")}</label>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={residenceProvince} onChange={(e) => setResidenceProvince(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("시작 가능 시점", "Available start timing")}</label>
                    <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={programStartOption} onChange={(e) => setProgramStartOption(e.target.value as "" | "ASAP" | "SPECIFIC_DATE")}>
                      <option value="">{tr("선택 안 함", "Not selected")}</option>
                      <option value="ASAP">{tr("즉시 가능", "ASAP")}</option>
                      <option value="SPECIFIC_DATE">{tr("특정 날짜", "Specific date")}</option>
                    </select>
                  </div>
                  {programStartOption === "SPECIFIC_DATE" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{tr("시작 가능 날짜", "Available start date")}</label>
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={programStartDate} onChange={(e) => setProgramStartDate(e.target.value)} />
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <Button variant="dark" onClick={() => void saveWorkAvailability()} disabled={saving}>{saving ? tr("저장 중...", "Saving...") : tr("저장", "Save")}</Button>
                  </div>
                </div>
              ) : null}

              {section === "profile-text" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("스킬 (쉼표로 구분)", "Skills (comma-separated)")}</label>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("자기소개", "Self introduction")}</label>
                    <textarea className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={selfIntroduction} onChange={(e) => setSelfIntroduction(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("지원 동기", "Motivation")}</label>
                    <textarea className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={programMotivation} onChange={(e) => setProgramMotivation(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("선호 조건", "Preferences")}</label>
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={preferenceConditionNote} onChange={(e) => setPreferenceConditionNote(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("추가 정보", "Additional notes")}</label>
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={additionalInfoNote} onChange={(e) => setAdditionalInfoNote(e.target.value)} />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="dark" onClick={() => void saveProfileText()} disabled={saving}>{saving ? tr("저장 중...", "Saving...") : tr("저장", "Save")}</Button>
                  </div>
                </div>
              ) : null}

              {section === "education" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {(profile?.educations ?? []).map((item) => (
                      <div key={item.id} className="p-1">
                        <p className="text-sm font-semibold">{item.schoolName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {item.major ?? "-"} · {educationTypeLabel(item.educationType, tr)} / {educationStatusLabel(item.status, tr)}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingEducationId(item.id);
                              setEducationSchoolName(item.schoolName);
                              setEducationType(item.educationType);
                              setEducationMajor(item.major ?? "");
                              setEducationStatus(item.status);
                              setEducationCountry(item.country ?? "");
                              setEducationCity(item.city ?? "");
                              setEducationStartDate(toDateInput(item.startDate));
                              setEducationEndDate(toDateInput(item.endDate));
                              setEducationIsKoreanSchool(Boolean(item.isKoreanSchool));
                            }}
                          >
                            {tr("수정", "Edit")}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => void deleteMyEducation(item.id).then(refreshProfile)}>
                            {tr("삭제", "Delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-semibold">{editingEducationId ? tr("학력 수정", "Edit education") : tr("학력 추가", "Add education")}</p>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("학교명", "School")} value={educationSchoolName} onChange={(e) => setEducationSchoolName(e.target.value)} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={educationType} onChange={(e) => setEducationType(e.target.value)}>
                        <option value="HIGH_SCHOOL">{educationTypeLabel("HIGH_SCHOOL", tr)}</option>
                        <option value="ASSOCIATE">{educationTypeLabel("ASSOCIATE", tr)}</option>
                        <option value="BACHELOR">{educationTypeLabel("BACHELOR", tr)}</option>
                        <option value="MASTER">{educationTypeLabel("MASTER", tr)}</option>
                        <option value="DOCTOR">{educationTypeLabel("DOCTOR", tr)}</option>
                        <option value="BOOTCAMP">{educationTypeLabel("BOOTCAMP", tr)}</option>
                        <option value="CERTIFICATE">{educationTypeLabel("CERTIFICATE", tr)}</option>
                        <option value="OTHER">{educationTypeLabel("OTHER", tr)}</option>
                      </select>
                      <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={educationStatus} onChange={(e) => setEducationStatus(e.target.value)}>
                        <option value="ENROLLED">{educationStatusLabel("ENROLLED", tr)}</option>
                        <option value="GRADUATED">{educationStatusLabel("GRADUATED", tr)}</option>
                        <option value="LEAVE_OF_ABSENCE">{educationStatusLabel("LEAVE_OF_ABSENCE", tr)}</option>
                        <option value="DROPPED_OUT">{educationStatusLabel("DROPPED_OUT", tr)}</option>
                        <option value="OTHER">{educationStatusLabel("OTHER", tr)}</option>
                      </select>
                    </div>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("전공", "Major")} value={educationMajor} onChange={(e) => setEducationMajor(e.target.value)} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("국가", "Country")} value={educationCountry} onChange={(e) => setEducationCountry(e.target.value)} />
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("도시", "City")} value={educationCity} onChange={(e) => setEducationCity(e.target.value)} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={educationStartDate} onChange={(e) => setEducationStartDate(e.target.value)} />
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={educationEndDate} onChange={(e) => setEducationEndDate(e.target.value)} />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={educationIsKoreanSchool} onChange={(e) => setEducationIsKoreanSchool(e.target.checked)} />
                      {tr("한국 학교", "Korean school")}
                    </label>
                    <div className="flex justify-end gap-2">
                      {editingEducationId ? <Button variant="outline" onClick={resetEducationForm}>{tr("취소", "Cancel")}</Button> : null}
                      <Button variant="dark" onClick={() => void saveEducation()} disabled={saving}>{saving ? tr("저장 중...", "Saving...") : tr("저장", "Save")}</Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {section === "language" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {(profile?.languageSkills ?? []).map((item) => (
                      <div key={item.id} className="p-1">
                        <p className="text-sm font-semibold">{languageLabel(item.language, tr)} · {languageLevelLabel(item.level, tr)}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.testName ?? "-"} / {item.score ?? "-"}</p>
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingLanguageId(item.id);
                            setLanguage(item.language);
                            setLanguageLevel(item.level);
                            setLanguageTestName(item.testName ?? "");
                            setLanguageScore(item.score ?? "");
                          }}>{tr("수정", "Edit")}</Button>
                          <Button variant="outline" size="sm" onClick={() => void deleteMyLanguageSkill(item.id).then(refreshProfile)}>{tr("삭제", "Delete")}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-semibold">{editingLanguageId ? tr("언어 능력 수정", "Edit language skill") : tr("언어 능력 추가", "Add language skill")}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={language} onChange={(e) => setLanguage(e.target.value)}>
                        {["KOREAN", "ENGLISH", "CHINESE", "JAPANESE", "VIETNAMESE", "INDONESIAN", "THAI", "MALAY", "FILIPINO", "HINDI", "SPANISH", "FRENCH", "GERMAN", "OTHER"].map((item) => (
                          <option key={item} value={item}>{languageLabel(item, tr)}</option>
                        ))}
                      </select>
                      <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={languageLevel} onChange={(e) => setLanguageLevel(e.target.value)}>
                        {["BEGINNER", "INTERMEDIATE", "ADVANCED", "NATIVE"].map((item) => (
                          <option key={item} value={item}>{languageLevelLabel(item, tr)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("시험명", "Test name")} value={languageTestName} onChange={(e) => setLanguageTestName(e.target.value)} />
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("점수/등급", "Score/grade")} value={languageScore} onChange={(e) => setLanguageScore(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      {editingLanguageId ? <Button variant="outline" onClick={resetLanguageForm}>{tr("취소", "Cancel")}</Button> : null}
                      <Button variant="dark" onClick={() => void saveLanguage()} disabled={saving}>{saving ? tr("저장 중...", "Saving...") : tr("저장", "Save")}</Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {section === "career" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {(profile?.careers ?? []).map((item) => (
                      <div key={item.id} className="p-1">
                        <p className="text-sm font-semibold">{item.companyName} · {item.position}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.isCurrent ? tr("재직 중", "Current") : tr("종료", "Finished")}</p>
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingCareerId(item.id);
                            setCareerCompanyName(item.companyName);
                            setCareerPosition(item.position);
                            setCareerDepartment(item.department ?? "");
                            setCareerIsCurrent(Boolean(item.isCurrent));
                            setCareerStartDate(toDateInput(item.startDate));
                            setCareerEndDate(toDateInput(item.endDate));
                            setCareerDescription(item.description ?? "");
                          }}>{tr("수정", "Edit")}</Button>
                          <Button variant="outline" size="sm" onClick={() => void deleteMyCareer(item.id).then(refreshProfile)}>{tr("삭제", "Delete")}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-semibold">{editingCareerId ? tr("경력 수정", "Edit career") : tr("경력 추가", "Add career")}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("회사명", "Company")} value={careerCompanyName} onChange={(e) => setCareerCompanyName(e.target.value)} />
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("직무", "Role")} value={careerPosition} onChange={(e) => setCareerPosition(e.target.value)} />
                    </div>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("부서", "Department")} value={careerDepartment} onChange={(e) => setCareerDepartment(e.target.value)} />
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={careerIsCurrent} onChange={(e) => setCareerIsCurrent(e.target.checked)} />
                      {tr("현재 재직 중", "Currently employed")}
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={careerStartDate} onChange={(e) => setCareerStartDate(e.target.value)} />
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={careerEndDate} onChange={(e) => setCareerEndDate(e.target.value)} disabled={careerIsCurrent} />
                    </div>
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("업무 설명", "Description")} value={careerDescription} onChange={(e) => setCareerDescription(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      {editingCareerId ? <Button variant="outline" onClick={resetCareerForm}>{tr("취소", "Cancel")}</Button> : null}
                      <Button variant="dark" onClick={() => void saveCareer()} disabled={saving}>{saving ? tr("저장 중...", "Saving...") : tr("저장", "Save")}</Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {section === "activity" ? (
                <div className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    {(profile?.activityExperiences ?? []).map((item) => (
                      <div key={item.id} className="p-1">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{activityTypeLabel(item.activityType, tr)} · {item.organization ?? "-"}</p>
                        <div className="mt-3 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => {
                            setEditingActivityId(item.id);
                            setActivityTitle(item.title);
                            setActivityType(item.activityType);
                            setActivityOrganization(item.organization ?? "");
                            setActivityStartDate(toDateInput(item.startDate));
                            setActivityEndDate(toDateInput(item.endDate));
                            setActivityDescription(item.description ?? "");
                            setActivitySkills((item.skills ?? []).join(", "));
                          }}>{tr("수정", "Edit")}</Button>
                          <Button variant="outline" size="sm" onClick={() => void deleteMyActivityExperience(item.id).then(refreshProfile)}>{tr("삭제", "Delete")}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-semibold">{editingActivityId ? tr("활동 경험 수정", "Edit activity") : tr("활동 경험 추가", "Add activity")}</p>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("활동명", "Title")} value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                        {["PROJECT", "VOLUNTEER", "INTERNSHIP", "CERTIFICATE", "AWARD", "EXTRACURRICULAR", "OTHER"].map((item) => (
                          <option key={item} value={item}>{activityTypeLabel(item, tr)}</option>
                        ))}
                      </select>
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("기관/조직", "Organization")} value={activityOrganization} onChange={(e) => setActivityOrganization(e.target.value)} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={activityStartDate} onChange={(e) => setActivityStartDate(e.target.value)} />
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={activityEndDate} onChange={(e) => setActivityEndDate(e.target.value)} />
                    </div>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("활동 스킬 (쉼표 구분)", "Skills (comma-separated)")} value={activitySkills} onChange={(e) => setActivitySkills(e.target.value)} />
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("활동 설명", "Description")} value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      {editingActivityId ? <Button variant="outline" onClick={resetActivityForm}>{tr("취소", "Cancel")}</Button> : null}
                      <Button variant="dark" onClick={() => void saveActivity()} disabled={saving}>{saving ? tr("저장 중...", "Saving...") : tr("저장", "Save")}</Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
