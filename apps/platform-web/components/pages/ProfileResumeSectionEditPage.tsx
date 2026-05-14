"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import { useToast } from "../toast/ToastProvider";
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

function educationTypeLabel(value: string, tr: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  switch (value) {
    case "HIGH_SCHOOL":
      return tr("고등학교", "High school", "高中", "Trung học phổ thông", "高校", "Sekolah menengah atas");
    case "ASSOCIATE":
      return tr("전문학사", "Associate", "专科", "Cao đẳng", "短期大学士", "Diploma");
    case "BACHELOR":
      return tr("학사", "Bachelor", "本科", "Cử nhân", "学士", "Sarjana");
    case "MASTER":
      return tr("석사", "Master", "硕士", "Thạc sĩ", "修士", "Magister");
    case "DOCTOR":
      return tr("박사", "Doctor", "博士", "Tiến sĩ", "博士", "Doktor");
    case "BOOTCAMP":
      return tr("부트캠프", "Bootcamp", "训练营", "Bootcamp", "ブートキャンプ", "Bootcamp");
    case "CERTIFICATE":
      return tr("수료/자격", "Certificate", "结业/资格", "Chứng chỉ", "修了・資格", "Sertifikat");
    default:
      return tr("기타", "Other", "其他", "Khác", "その他", "Lainnya");
  }
}

function educationStatusLabel(value: string, tr: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  switch (value) {
    case "ENROLLED":
      return tr("재학", "Enrolled", "在读", "Đang học", "在学中", "Aktif kuliah");
    case "GRADUATED":
      return tr("졸업", "Graduated", "已毕业", "Đã tốt nghiệp", "卒業", "Lulus");
    case "LEAVE_OF_ABSENCE":
      return tr("휴학", "Leave of absence", "休学", "Bảo lưu", "休学", "Cuti akademik");
    case "DROPPED_OUT":
      return tr("중퇴", "Dropped out", "退学", "Bỏ học", "中退", "Putus kuliah");
    default:
      return tr("기타", "Other", "其他", "Khác", "その他", "Lainnya");
  }
}

function languageLabel(value: string, tr: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  switch (value) {
    case "KOREAN":
      return tr("한국어", "Korean", "韩语", "Tiếng Hàn", "韓国語", "Bahasa Korea");
    case "ENGLISH":
      return tr("영어", "English", "英语", "Tiếng Anh", "英語", "Bahasa Inggris");
    case "CHINESE":
      return tr("중국어", "Chinese", "中文", "Tiếng Trung", "中国語", "Bahasa Tionghoa");
    case "JAPANESE":
      return tr("일본어", "Japanese", "日语", "Tiếng Nhật", "日本語", "Bahasa Jepang");
    case "VIETNAMESE":
      return tr("베트남어", "Vietnamese", "越南语", "Tiếng Việt", "ベトナム語", "Bahasa Vietnam");
    case "INDONESIAN":
      return tr("인도네시아어", "Indonesian", "印尼语", "Tiếng Indonesia", "インドネシア語", "Bahasa Indonesia");
    case "THAI":
      return tr("태국어", "Thai", "泰语", "Tiếng Thái", "タイ語", "Bahasa Thai");
    case "MALAY":
      return tr("말레이어", "Malay", "马来语", "Tiếng Mã Lai", "マレー語", "Bahasa Melayu");
    case "FILIPINO":
      return tr("필리핀어", "Filipino", "菲律宾语", "Tiếng Philippines", "フィリピン語", "Bahasa Filipina");
    case "HINDI":
      return tr("힌디어", "Hindi", "印地语", "Tiếng Hindi", "ヒンディー語", "Bahasa Hindi");
    case "SPANISH":
      return tr("스페인어", "Spanish", "西班牙语", "Tiếng Tây Ban Nha", "スペイン語", "Bahasa Spanyol");
    case "FRENCH":
      return tr("프랑스어", "French", "法语", "Tiếng Pháp", "フランス語", "Bahasa Prancis");
    case "GERMAN":
      return tr("독일어", "German", "德语", "Tiếng Đức", "ドイツ語", "Bahasa Jerman");
    default:
      return tr("기타", "Other", "其他", "Khác", "その他", "Lainnya");
  }
}

function languageLevelLabel(value: string, tr: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  switch (value) {
    case "BEGINNER":
      return tr("초급", "Beginner", "初级", "Sơ cấp", "初級", "Pemula");
    case "INTERMEDIATE":
      return tr("중급", "Intermediate", "中级", "Trung cấp", "中級", "Menengah");
    case "ADVANCED":
      return tr("고급", "Advanced", "高级", "Nâng cao", "上級", "Mahir");
    default:
      return tr("원어민", "Native", "母语", "Bản ngữ", "ネイティブ", "Penutur asli");
  }
}

function activityTypeLabel(value: string, tr: (ko: string, en: string, zh?: string, vi?: string, ja?: string, id?: string) => string) {
  switch (value) {
    case "PROJECT":
      return tr("프로젝트", "Project", "项目", "Dự án", "プロジェクト", "Proyek");
    case "VOLUNTEER":
      return tr("봉사활동", "Volunteer", "志愿活动", "Tình nguyện", "ボランティア活動", "Kegiatan sukarela");
    case "INTERNSHIP":
      return tr("인턴십", "Internship", "实习", "Thực tập", "インターンシップ", "Magang");
    case "CERTIFICATE":
      return tr("자격/수료", "Certificate", "资格/结业", "Chứng chỉ", "資格・修了", "Sertifikat");
    case "AWARD":
      return tr("수상", "Award", "获奖", "Giải thưởng", "受賞", "Penghargaan");
    case "EXTRACURRICULAR":
      return tr("대외/교내활동", "Extracurricular", "校内/校外活动", "Hoạt động ngoại khóa", "学内・学外活動", "Kegiatan ekstrakurikuler");
    default:
      return tr("기타", "Other", "其他", "Khác", "その他", "Lainnya");
  }
}

export function ProfileResumeSectionEditPage() {
  const router = useRouter();
  const params = useParams<{ section: string }>();
  const { isAuthenticated, isReady, user } = useAuthSession();
  const { locale } = useLanguage();
  const toast = useToast();
  const tr = (ko: string, en: string, zh: string = en, vi: string = en, ja: string = en, id: string = en) =>
    locale === "ko" ? ko : locale === "zh-CN" ? zh : locale === "vi" ? vi : locale === "ja" ? ja : locale === "id" ? id : en;

  const saveSuccessText = tr("저장되었습니다.", "Saved successfully.", "已保存。", "Đã lưu.", "保存しました。", "Berhasil disimpan.");
  const saveFailedText = tr("저장에 실패했습니다.", "Failed to save.", "保存失败。", "Lưu thất bại.", "保存に失敗しました。", "Gagal menyimpan.");
  const deleteSuccessText = tr("삭제되었습니다.", "Deleted successfully.", "已删除。", "Đã xóa.", "削除しました。", "Berhasil dihapus.");
  const deleteFailedText = tr("삭제에 실패했습니다.", "Failed to delete.", "删除失败。", "Xóa thất bại.", "削除に失敗しました。", "Gagal menghapus.");

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
      { id: "work-availability", title: tr("근무 가능 조건", "Work availability", "工作条件", "Điều kiện làm việc", "勤務可能条件", "Ketersediaan kerja") },
      { id: "education", title: tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan") },
      { id: "language", title: tr("언어 능력", "Language skills", "语言能力", "Khả năng ngôn ngữ", "言語スキル", "Kemampuan bahasa") },
      { id: "career", title: tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman kerja") },
      { id: "activity", title: tr("활동 경험", "Activities", "活动经验", "Kinh nghiệm hoạt động", "活動経歴", "Pengalaman kegiatan") },
      { id: "profile-text", title: tr("소개/동기", "Profile text", "介绍/动机", "Giới thiệu/Động cơ", "自己紹介・志望動機", "Pengantar/Motivasi") }
    ],
    [locale, tr]
  );

  const sectionTitle = useMemo(() => {
    return sectionItems.find((item) => item.id === section)?.title ?? tr("이력관리 편집", "Resume editing", "简历编辑", "Chỉnh sửa hồ sơ", "履歴管理の編集", "Edit resume");
  }, [section, sectionItems, tr]);

  async function refreshProfile() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const item = await getMyCandidateProfile();
      setProfile(item ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : tr("프로필 정보를 불러오지 못했습니다.", "Failed to load profile.", "无法加载个人资料。", "Không thể tải hồ sơ.", "プロフィール情報の読み込みに失敗しました。", "Gagal memuat profil."));
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
      toast.success(saveSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : saveFailedText;
      setErrorMessage(message);
      toast.error(message);
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
      toast.success(saveSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : saveFailedText;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function saveEducation() {
    if (!educationSchoolName.trim()) {
      const message = tr("학교명을 입력해 주세요.", "Please enter school name.", "请输入学校名称。", "Vui lòng nhập tên trường.", "学校名を入力してください。", "Silakan masukkan nama sekolah.");
      setErrorMessage(message);
      toast.error(message);
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
      toast.success(saveSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : saveFailedText;
      setErrorMessage(message);
      toast.error(message);
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
      toast.success(saveSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : saveFailedText;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function saveCareer() {
    if (!careerCompanyName.trim() || !careerPosition.trim()) {
      const message = tr("회사명과 직무를 입력해 주세요.", "Please enter company and role.", "请输入公司名称和岗位。", "Vui lòng nhập tên công ty và vị trí.", "会社名と職務を入力してください。", "Silakan masukkan nama perusahaan dan peran.");
      setErrorMessage(message);
      toast.error(message);
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
      toast.success(saveSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : saveFailedText;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function saveActivity() {
    if (!activityTitle.trim()) {
      const message = tr("활동명을 입력해 주세요.", "Please enter activity title.", "请输入活动名称。", "Vui lòng nhập tên hoạt động.", "活動名を入力してください。", "Silakan masukkan judul kegiatan.");
      setErrorMessage(message);
      toast.error(message);
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
      toast.success(saveSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : saveFailedText;
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEducation(id: string) {
    try {
      await deleteMyEducation(id);
      await refreshProfile();
      toast.success(deleteSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : deleteFailedText;
      setErrorMessage(message);
      toast.error(message);
    }
  }

  async function handleDeleteLanguage(id: string) {
    try {
      await deleteMyLanguageSkill(id);
      await refreshProfile();
      toast.success(deleteSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : deleteFailedText;
      setErrorMessage(message);
      toast.error(message);
    }
  }

  async function handleDeleteCareer(id: string) {
    try {
      await deleteMyCareer(id);
      await refreshProfile();
      toast.success(deleteSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : deleteFailedText;
      setErrorMessage(message);
      toast.error(message);
    }
  }

  async function handleDeleteActivity(id: string) {
    try {
      await deleteMyActivityExperience(id);
      await refreshProfile();
      toast.success(deleteSuccessText);
    } catch (error) {
      const message = error instanceof Error ? error.message : deleteFailedText;
      setErrorMessage(message);
      toast.error(message);
    }
  }

  if (!isValidSection) {
    return (
      <div className="min-h-screen flex flex-col bg-background font-sans text-foreground antialiased">
        <Header />
        <main className="container py-12">
          <p className="text-sm text-muted-foreground">{tr("지원하지 않는 섹션입니다.", "Unsupported section.", "不支持该部分。", "Phần này không được hỗ trợ.", "サポートされていないセクションです。", "Bagian tidak didukung.")}</p>
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
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <span aria-hidden>←</span>
            {tr("뒤로", "Back", "返回", "Quay lại", "戻る", "Kembali")}
          </button>
          <div className="flex items-center justify-between gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight">{sectionTitle}</h1>
            <Button variant="outline" asChild>
              <Link href="/profile?tab=resume">{tr("이력관리로 돌아가기", "Back to resume", "返回简历管理", "Quay lại quản lý hồ sơ", "履歴管理に戻る", "Kembali ke resume")}</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {sectionItems.map((item) => (
              <Button key={item.id} variant={item.id === section ? "dark" : "outline"} size="sm" asChild>
                <Link href={`/profile/resume/edit/${item.id}`}>{item.title}</Link>
              </Button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-card md:p-6">
          {!isReady ? (
            <p className="text-sm text-muted-foreground">{tr("세션 정보를 확인하는 중...", "Checking session...", "正在确认会话信息...", "Đang kiểm tra phiên...", "セッション情報を確認中...", "Memeriksa sesi...")}</p>
          ) : !isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{tr("로그인이 필요합니다.", "Sign in is required.", "需要登录。", "Cần đăng nhập.", "ログインが必要です。", "Diperlukan masuk.")}</p>
              <Button variant="dark" asChild>
                <Link href="/login">{tr("로그인하러 가기", "Go to login", "前往登录", "Đi đến đăng nhập", "ログインへ移動", "Pergi ke halaman masuk")}</Link>
              </Button>
            </div>
          ) : user?.role !== "STUDENT" ? (
            <p className="text-sm text-muted-foreground">{tr("학생 계정만 이력관리 편집이 가능합니다.", "Only student accounts can edit resume sections.", "仅学生账户可编辑简历。", "Chỉ tài khoản sinh viên mới có thể chỉnh sửa hồ sơ.", "学生アカウントのみ履歴管理を編集できます。", "Hanya akun siswa yang dapat mengedit bagian resume.")}</p>
          ) : loading ? (
            <p className="text-sm text-muted-foreground">{tr("프로필을 불러오는 중...", "Loading profile...", "正在加载个人资料...", "Đang tải hồ sơ...", "プロフィールを読み込み中...", "Memuat profil...")}</p>
          ) : (
            <section className="space-y-5">
              {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

              {section === "work-availability" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("비자 유형", "Visa type", "签证类型", "Loại visa", "ビザの種類", "Jenis visa")}</label>
                    <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={visaType} onChange={(e) => setVisaType(e.target.value)}>
                      <option value="">{tr("선택 안 함", "Not selected", "未选择", "Chưa chọn", "選択しない", "Tidak memilih")}</option>
                      <option value="D10_JOB_SEEKING">D-10</option>
                      <option value="D2_STUDENT">D-2</option>
                      <option value="D4_GENERAL_TRAINING">D-4</option>
                      <option value="F2_RESIDENCE">F-2</option>
                      <option value="F4_OVERSEAS_KOREAN">F-4</option>
                      <option value="F5_PERMANENT_RESIDENCE">F-5</option>
                      <option value="F6_MARRIAGE_IMMIGRATION">F-6</option>
                      <option value="E7_SPECIFIC_ACTIVITY">E-7</option>
                      <option value="H1_WORKING_HOLIDAY">H-1</option>
                      <option value="OTHER">{tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")}</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("거주 지역", "Residence region", "居住地区", "Khu vực cư trú", "居住地域", "Wilayah tempat tinggal")}</label>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("예: 서울특별시, 경기도", "e.g., Seoul, Gyeonggi", "例如：首尔、京畿道", "Ví dụ: Seoul, Gyeonggi", "例: ソウル特別市、京畿道", "Contoh: Seoul, Gyeonggi")} value={residenceProvince} onChange={(e) => setResidenceProvince(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("시작 가능 시점", "Available start timing", "可开始时间", "Thời điểm có thể bắt đầu", "開始可能時期", "Waktu mulai tersedia")}</label>
                    <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={programStartOption} onChange={(e) => setProgramStartOption(e.target.value as "" | "ASAP" | "SPECIFIC_DATE")}>
                      <option value="">{tr("선택 안 함", "Not selected", "未选择", "Chưa chọn", "選択しない", "Tidak memilih")}</option>
                      <option value="ASAP">{tr("즉시 가능", "ASAP", "立即", "Ngay lập tức", "すぐに可能", "Segera")}</option>
                      <option value="SPECIFIC_DATE">{tr("특정 날짜", "Specific date", "特定日期", "Ngày cụ thể", "特定の日付", "Tanggal tertentu")}</option>
                    </select>
                  </div>
                  {programStartOption === "SPECIFIC_DATE" ? (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">{tr("시작 가능 날짜", "Available start date", "可开始日期", "Ngày có thể bắt đầu", "開始可能日", "Tanggal mulai tersedia")}</label>
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={programStartDate} onChange={(e) => setProgramStartDate(e.target.value)} />
                    </div>
                  ) : null}
                  <div className="flex justify-end">
                    <Button variant="dark" onClick={() => void saveWorkAvailability()} disabled={saving}>{saving ? tr("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")}</Button>
                  </div>
                </div>
              ) : null}

              {section === "profile-text" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("스킬 (쉼표로 구분)", "Skills (comma-separated)", "技能 (逗号分隔)", "Kỹ năng (phân cách bằng dấu phẩy)", "スキル(カンマ区切り)", "Keahlian (dipisahkan koma)")}</label>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("예: React, TypeScript, 마케팅", "e.g., React, TypeScript, Marketing", "例如：React, TypeScript, 营销", "Ví dụ: React, TypeScript, Marketing", "例: React, TypeScript, マーケティング", "Contoh: React, TypeScript, Marketing")} value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("자기소개", "Self introduction", "自我介绍", "Giới thiệu bản thân", "自己紹介", "Pengenalan diri")}</label>
                    <textarea
                      className="min-h-28 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder={tr(
                        "어떤 사람인지, 어떤 일을 잘하는지 2~3 문장으로 소개해주세요. (120자 이상 권장)",
                        "Introduce yourself in 2-3 sentences: who you are and what you're good at. (120+ chars recommended)",
                        "用 2-3 句话介绍自己以及您擅长的领域。（建议 120 字以上）",
                        "Hãy giới thiệu bản thân trong 2-3 câu: bạn là ai và bạn giỏi gì. (Khuyến nghị 120+ ký tự)",
                        "あなたがどんな人で、何が得意かを2〜3文で紹介してください。(120文字以上推奨)",
                        "Perkenalkan diri Anda dalam 2-3 kalimat: siapa Anda dan apa yang Anda kuasai. (Disarankan 120+ karakter)"
                      )}
                      value={selfIntroduction}
                      onChange={(e) => setSelfIntroduction(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("선호 조건", "Preferences", "偏好条件", "Điều kiện ưu tiên", "希望条件", "Preferensi")}</label>
                    <textarea
                      className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder={tr(
                        "예: 주 4일 근무, 재택 가능, 외국계 선호 등 원하는 근무 조건을 적어주세요.",
                        "e.g., 4-day week, remote, international company preferred — share your ideal conditions.",
                        "例如：每周 4 天工作、可远程、偏好外企 等。",
                        "Ví dụ: làm 4 ngày/tuần, làm từ xa, ưu tiên công ty quốc tế...",
                        "例: 週4日勤務、リモート可、外資系希望など、希望する勤務条件を記入してください。",
                        "Contoh: 4 hari kerja per minggu, kerja jarak jauh, perusahaan internasional — bagikan kondisi ideal Anda."
                      )}
                      value={preferenceConditionNote}
                      onChange={(e) => setPreferenceConditionNote(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{tr("추가 정보", "Additional notes", "附加信息", "Thông tin bổ sung", "追加情報", "Catatan tambahan")}</label>
                    <textarea
                      className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                      placeholder={tr(
                        "기업이 알면 좋을 정보(자격증, 포트폴리오 링크, 특이사항 등)를 자유롭게 적어주세요.",
                        "Anything else companies should know — certifications, portfolio links, notes.",
                        "请自由填写其他想让企业知道的信息（证书、作品集链接、备注等）。",
                        "Thông tin khác mà công ty nên biết (chứng chỉ, link portfolio, ghi chú).",
                        "企業に知っておいてほしい情報(資格、ポートフォリオリンク、特記事項など)を自由に記入してください。",
                        "Hal lain yang perlu diketahui perusahaan — sertifikat, tautan portofolio, catatan."
                      )}
                      value={additionalInfoNote}
                      onChange={(e) => setAdditionalInfoNote(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button variant="dark" onClick={() => void saveProfileText()} disabled={saving}>{saving ? tr("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")}</Button>
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
                            {tr("수정", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => void handleDeleteEducation(item.id)}>
                            {tr("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-semibold">{editingEducationId ? tr("학력 수정", "Edit education", "编辑学历", "Chỉnh sửa học vấn", "学歴の編集", "Edit pendidikan") : tr("학력 추가", "Add education", "添加学历", "Thêm học vấn", "学歴を追加", "Tambah pendidikan")}</p>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("학교명", "School", "学校名称", "Tên trường", "学校名", "Nama sekolah")} value={educationSchoolName} onChange={(e) => setEducationSchoolName(e.target.value)} />
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
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("전공", "Major", "专业", "Chuyên ngành", "専攻", "Jurusan")} value={educationMajor} onChange={(e) => setEducationMajor(e.target.value)} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("국가", "Country", "国家", "Quốc gia", "国", "Negara")} value={educationCountry} onChange={(e) => setEducationCountry(e.target.value)} />
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("도시", "City", "城市", "Thành phố", "都市", "Kota")} value={educationCity} onChange={(e) => setEducationCity(e.target.value)} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={educationStartDate} onChange={(e) => setEducationStartDate(e.target.value)} />
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={educationEndDate} onChange={(e) => setEducationEndDate(e.target.value)} />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={educationIsKoreanSchool} onChange={(e) => setEducationIsKoreanSchool(e.target.checked)} />
                      {tr("한국 학교", "Korean school", "韩国学校", "Trường Hàn Quốc", "韓国の学校", "Sekolah Korea")}
                    </label>
                    <div className="flex justify-end gap-2">
                      {editingEducationId ? <Button variant="outline" onClick={resetEducationForm}>{tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</Button> : null}
                      <Button variant="dark" onClick={() => void saveEducation()} disabled={saving}>{saving ? tr("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")}</Button>
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
                          }}>{tr("수정", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}</Button>
                          <Button variant="outline" size="sm" onClick={() => void handleDeleteLanguage(item.id)}>{tr("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-semibold">{editingLanguageId ? tr("언어 능력 수정", "Edit language skill", "编辑语言能力", "Chỉnh sửa khả năng ngôn ngữ", "言語スキルの編集", "Edit kemampuan bahasa") : tr("언어 능력 추가", "Add language skill", "添加语言能力", "Thêm khả năng ngôn ngữ", "言語スキルを追加", "Tambah kemampuan bahasa")}</p>
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
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("시험명", "Test name", "考试名称", "Tên kỳ thi", "試験名", "Nama tes")} value={languageTestName} onChange={(e) => setLanguageTestName(e.target.value)} />
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("점수/등급", "Score/grade", "分数/等级", "Điểm/Cấp độ", "スコア・等級", "Skor/Tingkat")} value={languageScore} onChange={(e) => setLanguageScore(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      {editingLanguageId ? <Button variant="outline" onClick={resetLanguageForm}>{tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</Button> : null}
                      <Button variant="dark" onClick={() => void saveLanguage()} disabled={saving}>{saving ? tr("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")}</Button>
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
                        <p className="mt-1 text-xs text-muted-foreground">{item.isCurrent ? tr("재직 중", "Current", "在职", "Đang làm", "在職中", "Sedang bekerja") : tr("종료", "Finished", "已结束", "Đã kết thúc", "終了", "Selesai")}</p>
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
                          }}>{tr("수정", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}</Button>
                          <Button variant="outline" size="sm" onClick={() => void handleDeleteCareer(item.id)}>{tr("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-semibold">{editingCareerId ? tr("경력 수정", "Edit career", "编辑经历", "Chỉnh sửa kinh nghiệm", "経歴の編集", "Edit pengalaman") : tr("경력 추가", "Add career", "添加经历", "Thêm kinh nghiệm", "経歴を追加", "Tambah pengalaman")}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("회사명", "Company", "公司", "Công ty", "会社名", "Perusahaan")} value={careerCompanyName} onChange={(e) => setCareerCompanyName(e.target.value)} />
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("직무", "Role", "岗位", "Vị trí", "職務", "Peran")} value={careerPosition} onChange={(e) => setCareerPosition(e.target.value)} />
                    </div>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("부서", "Department", "部门", "Phòng ban", "部署", "Departemen")} value={careerDepartment} onChange={(e) => setCareerDepartment(e.target.value)} />
                    <label className="inline-flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={careerIsCurrent} onChange={(e) => setCareerIsCurrent(e.target.checked)} />
                      {tr("현재 재직 중", "Currently employed", "目前在职", "Hiện đang làm việc", "現在在職中", "Sedang bekerja")}
                    </label>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={careerStartDate} onChange={(e) => setCareerStartDate(e.target.value)} />
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={careerEndDate} onChange={(e) => setCareerEndDate(e.target.value)} disabled={careerIsCurrent} />
                    </div>
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("업무 설명", "Description", "工作描述", "Mô tả công việc", "業務説明", "Deskripsi pekerjaan")} value={careerDescription} onChange={(e) => setCareerDescription(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      {editingCareerId ? <Button variant="outline" onClick={resetCareerForm}>{tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</Button> : null}
                      <Button variant="dark" onClick={() => void saveCareer()} disabled={saving}>{saving ? tr("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")}</Button>
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
                          }}>{tr("수정", "Edit", "编辑", "Chỉnh sửa", "編集", "Edit")}</Button>
                          <Button variant="outline" size="sm" onClick={() => void handleDeleteActivity(item.id)}>{tr("삭제", "Delete", "删除", "Xóa", "削除", "Hapus")}</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-semibold">{editingActivityId ? tr("활동 경험 수정", "Edit activity", "编辑活动经验", "Chỉnh sửa hoạt động", "活動経歴の編集", "Edit kegiatan") : tr("활동 경험 추가", "Add activity", "添加活动经验", "Thêm hoạt động", "活動経歴を追加", "Tambah kegiatan")}</p>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("활동명", "Title", "活动名称", "Tên hoạt động", "活動名", "Judul")} value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} />
                    <div className="grid gap-3 md:grid-cols-2">
                      <select className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={activityType} onChange={(e) => setActivityType(e.target.value)}>
                        {["PROJECT", "VOLUNTEER", "INTERNSHIP", "CERTIFICATE", "AWARD", "EXTRACURRICULAR", "OTHER"].map((item) => (
                          <option key={item} value={item}>{activityTypeLabel(item, tr)}</option>
                        ))}
                      </select>
                      <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("기관/조직", "Organization", "机构/组织", "Tổ chức", "機関・組織", "Organisasi")} value={activityOrganization} onChange={(e) => setActivityOrganization(e.target.value)} />
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={activityStartDate} onChange={(e) => setActivityStartDate(e.target.value)} />
                      <input type="date" className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" value={activityEndDate} onChange={(e) => setActivityEndDate(e.target.value)} />
                    </div>
                    <input className="h-10 w-full rounded-md border-0 bg-muted/50 px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("활동 스킬 (쉼표 구분)", "Skills (comma-separated)", "活动技能 (逗号分隔)", "Kỹ năng (phân cách bằng dấu phẩy)", "活動スキル(カンマ区切り)", "Keahlian kegiatan (dipisahkan koma)")} value={activitySkills} onChange={(e) => setActivitySkills(e.target.value)} />
                    <textarea className="min-h-24 w-full rounded-md border-0 bg-muted/50 px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring" placeholder={tr("활동 설명", "Description", "活动描述", "Mô tả hoạt động", "活動の説明", "Deskripsi kegiatan")} value={activityDescription} onChange={(e) => setActivityDescription(e.target.value)} />
                    <div className="flex justify-end gap-2">
                      {editingActivityId ? <Button variant="outline" onClick={resetActivityForm}>{tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</Button> : null}
                      <Button variant="dark" onClick={() => void saveActivity()} disabled={saving}>{saving ? tr("저장 중...", "Saving...", "保存中...", "Đang lưu...", "保存中...", "Menyimpan...") : tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")}</Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </section>
          )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
