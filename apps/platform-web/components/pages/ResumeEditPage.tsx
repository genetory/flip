"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowSquareOut, Eye, Lock, Plus, Rows, SidebarSimple, Sparkle, X, XIcon } from "@phosphor-icons/react/dist/ssr";
import { AiTextHelperModal } from "./AiTextHelperModal";
import type { DraftResumeTextFieldType } from "../../lib/member-profile-client";
import Image from "next/image";
import { Header } from "../site/Header";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  createMyResume,
  getMyCandidateProfile,
  getMyResume,
  updateMyResume,
  type CandidateEducationStatus,
  type CandidateEducationType,
  type MyCandidateProfile,
  type ResumeActivityEntry,
  type ResumeCareerEntry,
  type ResumeCertificationEntry,
  type ResumeContent,
  type ResumeEducationEntry,
  type ResumeLanguageEntry,
  type ResumeLinkEntry
} from "../../lib/member-profile-client";

function useTr() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => {
    const map: Record<PlatformLocale, string> = { ko, en, "zh-CN": zh, vi, ja, id };
    return map[locale] ?? ko;
  };
}

type ChipOption<T extends string> = { value: T; label: string };

// 연/월 드롭다운. 사용자가 한쪽만 골랐을 때 그 선택을 잃지 않도록 partial
// 입력은 로컬 state(`localYear`/`localMonth`)에 보관. 부모로 onChange 가
// 발화되는 시점은 (a) 둘 다 채워졌을 때 "YYYY-MM" 또는 (b) 둘 다 비워졌을
// 때 빈 문자열. 한쪽만 채워진 상태는 부모 값에 영향을 주지 않습니다.
function MonthYearPicker({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: { year: string; month: string };
}) {
  const [localYear, setLocalYear] = useState("");
  const [localMonth, setLocalMonth] = useState("");

  // 외부 value 변화 시(초기 로드/리셋) 로컬 state 동기화. value 만 deps 에
  // 두기 위해 exhaustive-deps lint 는 의도적으로 무시.
  useEffect(() => {
    const m = value.match(/^(\d{4})-(\d{2})$/);
    setLocalYear(m?.[1] ?? "");
    setLocalMonth(m?.[2] ?? "");
  }, [value]);

  const propagate = (y: string, mo: string) => {
    if (y && mo) onChange(`${y}-${mo}`);
    else if (!y && !mo) onChange("");
    // partial 은 부모에 전파하지 않고 로컬에서만 유지.
  };

  const handleYear = (y: string) => {
    setLocalYear(y);
    propagate(y, localMonth);
  };
  const handleMonth = (mo: string) => {
    setLocalMonth(mo);
    propagate(localYear, mo);
  };

  // 1975 → 현재 + 5년. 보통 학력·경력은 이 범위 안에 들어옵니다.
  const currentYear = new Date().getFullYear();
  const years: string[] = [];
  for (let y = currentYear + 5; y >= 1975; y -= 1) years.push(String(y));
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

  const selectCls =
    "h-11 w-full appearance-none rounded-xl border border-border bg-white px-3 pr-7 text-[14px] text-foreground outline-none transition focus:border-primary";

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="relative">
        <select value={localYear} onChange={(e) => handleYear(e.target.value)} className={selectCls}>
          <option value="">{placeholder?.year ?? "연도"}</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
      </div>
      <div className="relative">
        <select value={localMonth} onChange={(e) => handleMonth(e.target.value)} className={selectCls}>
          <option value="">{placeholder?.month ?? "월"}</option>
          {months.map((mo) => (
            <option key={mo} value={mo}>{Number(mo)}월</option>
          ))}
        </select>
        <span aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">▾</span>
      </div>
    </div>
  );
}

// Small field label rendered above every input. Defined at module scope so
// React keeps the same component identity across re-renders — otherwise
// the wrapped <input> loses focus after every keystroke.
function Field({
  label,
  hint,
  required,
  action,
  children,
  className
}: {
  label: string;
  hint?: string;
  required?: boolean;
  // 우측에 두는 인라인 액션 (예: "AI 도우미" 버튼). hint 가 있으면 hint 뒤에 둠.
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="block text-[12.5px] font-normal text-foreground/80">
          {label}
          {required ? <span className="ml-0.5 text-rose-500" aria-hidden>*</span> : null}
        </span>
        <div className="flex items-center gap-2">
          {hint ? <span className="text-[11px] text-muted-foreground">{hint}</span> : null}
          {action}
        </div>
      </div>
      {children}
    </div>
  );
}

export function ResumeEditPage({ resumeId }: { resumeId: string }) {
  const tr = useTr();
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);

  const [title, setTitle] = useState("");
  // 기본정보 (per-resume; falls back to user account values on the detail
  // view when these are empty so legacy resumes still render correctly)
  const [basicName, setBasicName] = useState("");
  const [basicEmail, setBasicEmail] = useState("");
  const [basicPhone, setBasicPhone] = useState("");
  const [basicResidence, setBasicResidence] = useState("");
  const [basicVisa, setBasicVisa] = useState<"" | "D10_JOB_SEEKING" | "D2_STUDENT" | "D4_GENERAL_TRAINING" | "F2_RESIDENCE" | "F4_OVERSEAS_KOREAN" | "F5_PERMANENT_RESIDENCE" | "F6_MARRIAGE_IMMIGRATION" | "E7_SPECIFIC_ACTIVITY" | "H1_WORKING_HOLIDAY" | "OTHER">("");
  // Optional profile photo. We hold either a data URL (just-picked) or a
  // CDN URL (loaded from save) — both can be rendered with <img src>.
  const [basicPhotoUrl, setBasicPhotoUrl] = useState<string>("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  // 학력 / 경력 / 활동
  const [educations, setEducations] = useState<ResumeEducationEntry[]>([]);
  const [careers, setCareers] = useState<ResumeCareerEntry[]>([]);
  const [activities, setActivities] = useState<ResumeActivityEntry[]>([]);
  // 스킬
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  // 자격 / 어학 / 수상
  const [languages, setLanguages] = useState<ResumeLanguageEntry[]>([]);
  const [certifications, setCertifications] = useState<ResumeCertificationEntry[]>([]);
  // 포트폴리오 / 링크
  const [links, setLinks] = useState<ResumeLinkEntry[]>([]);
  // 자기소개 / 요약
  const [summary, setSummary] = useState("");
  const [selfIntro, setSelfIntro] = useState("");

  // AI 작성 도우미 — null 이면 모달 닫힘. open 시 textarea 의 현재값과 적용
  // 콜백을 함께 전달해서 모달이 self-contained 으로 동작.
  type AiHelperState = {
    fieldType: DraftResumeTextFieldType;
    fieldLabel: string;
    currentText: string;
    context?: { companyName?: string; position?: string; title?: string };
    onApply: (text: string) => void;
  };
  const [aiHelper, setAiHelper] = useState<AiHelperState | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        // resumeId === "new" 면 아직 DB 에 row 가 없는 임시 편집 모드. 사용자가
        // "저장" 을 누른 순간에만 createMyResume 가 실행되고, 그 전에 페이지를
        // 떠나면 어떤 row 도 남지 않음. profile 만 받아서 기본정보를 seed.
        const isNew = resumeId === "new";
        const [r, p] = await Promise.all([
          isNew ? Promise.resolve(null) : getMyResume(resumeId),
          getMyCandidateProfile().catch(() => null)
        ]);
        if (cancelled) return;
        setProfile(p);
        const c = (r?.content ?? {}) as ResumeContent & { education?: ResumeEducationEntry; career?: ResumeCareerEntry; visaType?: string; koreanLevel?: string };
        setTitle(r?.title ?? tr("새 이력서", "New resume", "新简历", "Hồ sơ mới", "新しい履歴書", "Resume baru"));
        // Basic info — prefer what's saved on the resume; otherwise seed
        // from the user account so the first edit is one click away from
        // "good enough" before the user tweaks per-resume details.
        setBasicName(c.basicName ?? (user?.name || user?.realName || ""));
        setBasicEmail(c.basicEmail ?? (user?.email || ""));
        setBasicPhone(c.basicPhone ?? (user?.phoneNumber || ""));
        setBasicResidence(c.basicResidence ?? (p?.residenceProvince || ""));
        setBasicVisa((c.basicVisa ?? p?.visaType ?? c.visaType ?? "") as typeof basicVisa);
        setBasicPhotoUrl(c.basicPhotoUrl ?? "");
        setEducations(c.educations ?? (c.education ? [c.education] : []));
        setCareers(c.careers ?? (c.career ? [c.career] : []));
        setActivities(c.activities ?? []);
        setSkills(c.skills ?? []);
        // Migrate a legacy Korean level into the languages list.
        const langs = c.languages ?? [];
        if (langs.length === 0 && c.koreanLevel) {
          langs.push({ language: "한국어 (Korean)", level: c.koreanLevel });
        }
        setLanguages(langs);
        setCertifications(c.certifications ?? []);
        setLinks(c.links ?? []);
        setSummary(c.summary ?? "");
        setSelfIntro(c.selfIntroduction ?? "");
        setLoaded(true);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, isAuthenticated, resumeId]);

  function addSkill() {
    const s = skillDraft.trim();
    if (!s || skills.includes(s)) {
      setSkillDraft("");
      return;
    }
    setSkills((prev) => [...prev, s]);
    setSkillDraft("");
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      const content: ResumeContent = {
        basicName: basicName.trim() || null,
        basicEmail: basicEmail.trim() || null,
        basicPhone: basicPhone.trim() || null,
        basicResidence: basicResidence.trim() || null,
        basicVisa: basicVisa || null,
        basicPhotoUrl: basicPhotoUrl.trim() || null,
        // 희망 직무 / 근무 형태 / 근무지 / 입사 가능일 — 입력 폼에서 제거
        // (기존 데이터 보존을 위해 명시적으로 null 처리하지 않고 빈 값으로 둠)
        educations: educations.filter((e) => e.schoolName?.trim()),
        careers: careers.filter((c) => c.companyName?.trim() && c.position?.trim()),
        activities: activities.filter((a) => a.title?.trim()),
        skills,
        languages: languages.filter((l) => l.language?.trim()),
        certifications: certifications.filter((c) => c.name?.trim()),
        links: links.filter((l) => l.url?.trim()),
        summary: summary.trim() || null,
        selfIntroduction: selfIntro.trim() || null
      };
      // 신규 모드: 이때 처음으로 DB row 가 만들어진다. 저장이 끝나면
      // /resume/[realId] 코치 화면으로 replace 해서 URL 이 새 id 를 반영하게.
      if (resumeId === "new") {
        const trimmedTitle = title.trim();
        const created = await createMyResume({
          // 백엔드는 title 이 필수라 빈 입력이어도 기본값으로 채워서 보냄.
          title: trimmedTitle || tr("새 이력서", "New resume", "新简历", "Hồ sơ mới", "新しい履歴書", "Resume baru"),
          content
        });
        router.replace(`/resume/${created.id}`);
        return;
      }
      await updateMyResume(resumeId, { title: title.trim() || undefined, content });
      router.push(`/resume/${resumeId}`);
    } catch {
      setSaving(false);
    }
  }

  // ---- Gates -------------------------------------------------------------
  if (isReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="container flex flex-col items-center gap-4 py-24 text-center">
          <Lock className="h-8 w-8 text-primary" />
          <Button asChild className="h-12">
            <Link href="/login?next=/profile?tab=resume">{tr("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}</Link>
          </Button>
        </main>
      </div>
    );
  }
  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="container flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">
            {tr("이력서를 찾을 수 없어요.", "Resume not found.", "找不到该简历。", "Không tìm thấy hồ sơ.", "履歴書が見つかりません。", "Resume tidak ditemukan.")}
          </p>
          <Button asChild variant="outline" className="h-12">
            <Link href="/profile?tab=resume">{tr("목록으로", "Back", "返回", "Về danh sách", "一覧へ", "Kembali")}</Link>
          </Button>
        </main>
      </div>
    );
  }
  if (!isReady || !loaded) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="container flex items-center justify-center py-24">
          <Sparkle className="h-6 w-6 animate-pulse text-primary" />
        </main>
      </div>
    );
  }

  const eduTypeOptions: ChipOption<CandidateEducationType>[] = [
    { value: "HIGH_SCHOOL", label: tr("고졸", "High school", "高中", "THPT", "高卒", "SMA") },
    { value: "ASSOCIATE", label: tr("전문학사", "Associate", "专科", "Cao đẳng", "短大", "Diploma") },
    { value: "BACHELOR", label: tr("학사", "Bachelor", "本科", "Cử nhân", "学士", "Sarjana") },
    { value: "MASTER", label: tr("석사", "Master", "硕士", "Thạc sĩ", "修士", "Magister") },
    { value: "DOCTOR", label: tr("박사", "Doctorate", "博士", "Tiến sĩ", "博士", "Doktor") },
    { value: "OTHER", label: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya") }
  ];
  const eduStatusOptions: ChipOption<CandidateEducationStatus>[] = [
    { value: "ENROLLED", label: tr("재학", "Enrolled", "在读", "Đang học", "在学", "Aktif") },
    { value: "GRADUATED", label: tr("졸업", "Graduated", "毕业", "Đã tốt nghiệp", "卒業", "Lulus") },
    { value: "LEAVE_OF_ABSENCE", label: tr("휴학", "On leave", "休学", "Bảo lưu", "休学", "Cuti") },
    { value: "OTHER", label: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya") }
  ];

  const inputClass =
    "h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] text-foreground outline-none transition focus:border-primary";
  const labelClass = "mb-2 block text-[15px] font-semibold text-foreground";
  // 섹션 내부 간격 통일: 모든 섹션이 동일하게 16px 간격으로 필드를 쌓아둠.
  // 섹션 사이 큰 간격은 바깥 `space-y-8` 컨테이너가 책임.
  const sectionClass = "space-y-4";
  const addBtnClass =
    "inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium text-primary ring-1 ring-primary/30 transition hover:bg-primary/5";

  function Chips<T extends string>({ options, value, onSelect }: { options: ChipOption<T>[]; value: T | ""; onSelect: (v: T) => void }) {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`rounded-full px-4 py-2.5 text-[14px] font-medium transition ${
              value === opt.value ? "bg-primary text-primary-foreground" : "bg-white text-foreground/70 ring-1 ring-border hover:ring-primary/50"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  function RemoveBtn({ onClick }: { onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={tr("삭제", "Remove", "删除", "Xóa", "削除", "Hapus")}
        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-muted-foreground transition hover:bg-rose-50 hover:text-rose-600"
      >
        <XIcon weight="bold" className="h-4 w-4" />
      </button>
    );
  }

  // Visa label helper (Korean codes shown verbatim; "기타" for OTHER).
  const visaShortLabel = (v: typeof basicVisa) => {
    if (!v) return "";
    if (v === "OTHER") return tr("기타", "Other", "其他", "Khác", "その他", "Lainnya");
    return v.split("_")[0].replace(/(\d)/, "-$1"); // D10 → D-10
  };
  const visaOptions: Array<{ value: typeof basicVisa; label: string }> = [
    { value: "", label: tr("미지정", "Not set", "未指定", "Chưa chọn", "未指定", "Tidak diatur") },
    { value: "D2_STUDENT", label: "D-2" },
    { value: "D4_GENERAL_TRAINING", label: "D-4" },
    { value: "D10_JOB_SEEKING", label: "D-10" },
    { value: "E7_SPECIFIC_ACTIVITY", label: "E-7" },
    { value: "F2_RESIDENCE", label: "F-2" },
    { value: "F4_OVERSEAS_KOREAN", label: "F-4" },
    { value: "F5_PERMANENT_RESIDENCE", label: "F-5" },
    { value: "F6_MARRIAGE_IMMIGRATION", label: "F-6" },
    { value: "H1_WORKING_HOLIDAY", label: "H-1" },
    { value: "OTHER", label: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya") }
  ];
  void visaShortLabel; // available if future display needs it

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <main className="container pb-28 pt-8 md:pb-16 md:pt-14">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            onClick={() => router.back()}
            className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft weight="bold" className="h-4 w-4" />
            {tr("뒤로", "Back", "返回", "Quay lại", "戻る", "Kembali")}
          </button>

          <div className="space-y-8 rounded-3xl border border-border bg-white p-6 md:p-10">
            {/* Title */}
            <Field
              label={tr("이력서 이름", "Resume title", "简历名称", "Tên hồ sơ", "履歴書名", "Nama resume")}
              hint={tr("나만 보이는 분류용", "Used only by you to label this resume", "仅供自己分类用", "Chỉ bạn thấy để phân loại", "自分用の分類名", "Hanya untuk pelabelan pribadi")}
            >
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tr("예: 백엔드 신입 지원용", "e.g. Backend new-grad version", "如：后端应届生版本", "VD: Bản dành cho backend mới", "例：バックエンド新卒版", "Mis: Versi backend pemula")}
                className={inputClass}
              />
            </Field>

            {/* 기본정보 — per-resume entry. Falls back to account fields on
                first edit (we seed from user/profile in the load effect). */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("기본정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")}</span>
              {/* Optional profile photo — the row above the contact fields
                  so the photo + name pair feels like a single block. */}
              <Field
                label={tr("프로필 사진", "Profile photo", "头像", "Ảnh hồ sơ", "プロフィール写真", "Foto profil")}
                hint={tr("선택", "Optional", "可选", "Tùy chọn", "任意", "Opsional")}
              >
                <div className="flex items-start gap-4">
                  {/* 썸네일 — 3:4 비율, 실제 이력서 뷰에서 보이는 사이즈와 동일. */}
                  <div className="flex aspect-[3/4] w-32 flex-none items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
                    {basicPhotoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={basicPhotoUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-center text-[11px] leading-tight text-muted-foreground">
                        {tr("미선택", "None", "未选择", "Chưa chọn", "未選択", "Belum dipilih")}
                      </span>
                    )}
                  </div>
                  {/* 버튼 묶음 — 업로드/변경과 제거를 같은 스타일(작은 outline)로 통일. */}
                  <div className="flex flex-col gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-lg border border-border bg-white px-4 text-[13px] font-medium text-foreground transition hover:bg-muted/30">
                      {photoUploading
                        ? tr("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")
                        : basicPhotoUrl
                          ? tr("사진 변경", "Change photo", "更换照片", "Đổi ảnh", "写真変更", "Ganti foto")
                          : tr("사진 업로드", "Upload photo", "上传照片", "Tải ảnh", "写真アップロード", "Unggah foto")}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            alert(tr("5MB 이하 이미지를 선택해 주세요.", "Pick an image under 5MB.", "请选择不超过5MB的图片。", "Vui lòng chọn ảnh dưới 5MB.", "5MB以下の画像を選択してください。", "Pilih gambar di bawah 5MB."));
                            e.target.value = "";
                            return;
                          }
                          setPhotoUploading(true);
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = typeof reader.result === "string" ? reader.result : "";
                            setBasicPhotoUrl(result);
                            setPhotoUploading(false);
                          };
                          reader.onerror = () => setPhotoUploading(false);
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {basicPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setBasicPhotoUrl("")}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-rose-200 bg-white px-4 text-[13px] font-medium text-rose-600 transition hover:bg-rose-50"
                      >
                        {tr("사진 제거", "Remove photo", "移除照片", "Xóa ảnh", "写真を削除", "Hapus foto")}
                      </button>
                    ) : null}
                  </div>
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={tr("이름", "Name", "姓名", "Tên", "氏名", "Nama")} required>
                  <input
                    value={basicName}
                    onChange={(e) => setBasicName(e.target.value)}
                    placeholder={tr("예: 김함판", "e.g. Hampan Kim", "如：金含板", "VD: Hampan Kim", "例：キム・ハンパン", "Mis: Hampan Kim")}
                    maxLength={80}
                    className={inputClass}
                  />
                </Field>
                <Field label={tr("이메일", "Email", "邮箱", "Email", "メール", "Email")} required>
                  <input
                    type="email"
                    value={basicEmail}
                    onChange={(e) => setBasicEmail(e.target.value)}
                    placeholder="name@example.com"
                    maxLength={120}
                    className={inputClass}
                  />
                </Field>
                <Field label={tr("휴대폰", "Phone", "手机", "Điện thoại", "電話", "Telepon")} required>
                  <input
                    value={basicPhone}
                    onChange={(e) => setBasicPhone(e.target.value)}
                    placeholder={tr("예: 010-1234-5678", "e.g. +82 10 1234 5678", "如：010-1234-5678", "VD: 010-1234-5678", "例：010-1234-5678", "Mis: 010-1234-5678")}
                    maxLength={40}
                    className={inputClass}
                  />
                </Field>
                <Field label={tr("거주지역", "Residence", "居住地", "Nơi ở", "居住地", "Domisili")}>
                  <input
                    value={basicResidence}
                    onChange={(e) => setBasicResidence(e.target.value)}
                    placeholder={tr("예: 서울", "e.g. Seoul", "如：首尔", "VD: Seoul", "例：ソウル", "Mis: Seoul")}
                    maxLength={80}
                    className={inputClass}
                  />
                </Field>
                <Field label={tr("비자", "Visa", "签证", "Visa", "ビザ", "Visa")} className="sm:col-span-2">
                  <select
                    value={basicVisa}
                    onChange={(e) => setBasicVisa(e.target.value as typeof basicVisa)}
                    className={`${inputClass} appearance-none bg-white`}
                  >
                    {visaOptions.map((opt) => (
                      <option key={opt.value || "_none"} value={opt.value}>
                        {opt.value ? `${opt.label}` : opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            {/* 자기소개 / 요약 — 기본정보 다음, 학력 위. 한 줄 요약과
                자기소개는 모두 필수 항목으로 표시. */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("자기소개 / 요약", "About / Summary", "自我介绍/概要", "Giới thiệu / Tóm tắt", "自己紹介/要約", "Tentang / Ringkasan")}</span>
              <Field label={tr("한 줄 요약", "One-line summary", "一句话概要", "Tóm tắt một dòng", "一行サマリー", "Ringkasan satu baris")} required>
                <input
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={tr("예: 3년차 프런트엔드 — 디자인 시스템·DX 강함", "e.g. FE engineer (3y) — DX & design systems", "如：3年前端，擅长设计系统/DX", "VD: FE 3 năm — design system & DX", "例：FE3年目 — DX・デザインシステム", "Mis: 3 thn FE — design system & DX")}
                  className={inputClass}
                />
              </Field>
              <Field
                label={tr("자기소개", "About me", "自我介绍", "Giới thiệu bản thân", "自己紹介", "Tentang saya")}
                required
                action={
                  <button
                    type="button"
                    onClick={() =>
                      setAiHelper({
                        fieldType: "selfIntroduction",
                        fieldLabel: tr("자기소개", "About me", "自我介绍", "Giới thiệu bản thân", "自己紹介", "Tentang saya"),
                        currentText: selfIntro,
                        onApply: (text) => setSelfIntro(text)
                      })
                    }
                    className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background hover:opacity-90"
                  >
                    <Sparkle className="h-3 w-3" weight="fill" />
                    {tr("AI 도우미", "AI helper", "AI助手", "Trợ lý AI", "AIアシスタント", "Asisten AI")}
                  </button>
                }
              >
                <textarea
                  value={selfIntro}
                  onChange={(e) => setSelfIntro(e.target.value)}
                  rows={8}
                  placeholder={tr("이력서를 읽는 사람에게 전하고 싶은 이야기를 자유롭게", "Tell the reader who you are", "请自由描述你想表达的内容", "Hãy chia sẻ về bản thân bạn", "読み手に伝えたい内容を自由に", "Ceritakan dirimu kepada pembaca")}
                  className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] leading-relaxed text-foreground outline-none transition focus:border-primary"
                />
              </Field>
            </div>

            {/* 학력 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</span>
              {educations.map((e, i) => (
                <div key={i} className="space-y-4 rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setEducations((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <Field label={tr("학교명", "School name", "学校", "Trường", "学校名", "Nama sekolah")} required>
                    <input value={e.schoolName ?? ""} onChange={(ev) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, schoolName: ev.target.value } : x)))} placeholder={tr("예: 서울대학교", "e.g. Seoul National University", "如：首尔大学", "VD: Đại học Quốc gia Seoul", "例：ソウル大学", "Mis: Universitas Nasional Seoul")} className={inputClass} />
                  </Field>
                  <Field label={tr("전공", "Major", "专业", "Chuyên ngành", "専攻", "Jurusan")} hint={tr("선택", "Optional", "可选", "Tùy chọn", "任意", "Opsional")}>
                    <input value={e.major ?? ""} onChange={(ev) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, major: ev.target.value } : x)))} placeholder={tr("예: 컴퓨터공학", "e.g. Computer Science", "如：计算机科学", "VD: Khoa học máy tính", "例：コンピュータ工学", "Mis: Ilmu Komputer")} className={inputClass} />
                  </Field>
                  <Field label={tr("학력 단계", "Education level", "学历", "Trình độ học vấn", "学歴", "Jenjang pendidikan")}>
                    <Chips options={eduTypeOptions} value={e.educationType ?? ""} onSelect={(v) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, educationType: v } : x)))} />
                  </Field>
                  <Field label={tr("재학 상태", "Status", "在读状态", "Trạng thái", "在籍状況", "Status")}>
                    <Chips options={eduStatusOptions} value={e.status ?? ""} onSelect={(v) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, status: v } : x)))} />
                  </Field>
                  <Field label={tr("입학", "Start", "入学", "Nhập học", "入学", "Mulai")}>
                    <MonthYearPicker
                      value={e.startDate ?? ""}
                      onChange={(v) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, startDate: v } : x)))}
                      placeholder={{ year: tr("연도", "Year", "年份", "Năm", "年", "Tahun"), month: tr("월", "Month", "月", "Tháng", "月", "Bulan") }}
                    />
                  </Field>
                  <Field label={tr("졸업·예정", "End", "毕业·预定", "Kết thúc", "卒業・予定", "Selesai")}>
                    <MonthYearPicker
                      value={e.endDate ?? ""}
                      onChange={(v) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, endDate: v } : x)))}
                      placeholder={{ year: tr("연도", "Year", "年份", "Năm", "年", "Tahun"), month: tr("월", "Month", "月", "Tháng", "月", "Bulan") }}
                    />
                  </Field>
                </div>
              ))}
              <button type="button" onClick={() => setEducations((p) => [...p, {}])} className={addBtnClass}>
                <Plus weight="bold" className="h-4 w-4" />
                {tr("학력 추가", "Add", "添加", "Thêm", "追加", "Tambah")}
              </button>
            </div>

            {/* 경력 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")}</span>
              {careers.map((c, i) => (
                <div key={i} className="space-y-4 rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setCareers((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <Field label={tr("회사명", "Company name", "公司名称", "Tên công ty", "会社名", "Nama perusahaan")} required>
                    <input value={c.companyName ?? ""} onChange={(ev) => setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, companyName: ev.target.value } : x)))} placeholder={tr("예: 카카오", "e.g. Kakao", "如：Kakao", "VD: Kakao", "例：カカオ", "Mis: Kakao")} className={inputClass} />
                  </Field>
                  <Field label={tr("직무 / 직책", "Role / position", "职务/职位", "Vị trí / chức danh", "職務 / 役職", "Peran / posisi")} required>
                    <input value={c.position ?? ""} onChange={(ev) => setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, position: ev.target.value } : x)))} placeholder={tr("예: 프런트엔드 엔지니어", "e.g. Frontend Engineer", "如：前端工程师", "VD: Kỹ sư Frontend", "例：フロントエンドエンジニア", "Mis: Frontend Engineer")} className={inputClass} />
                  </Field>
                  <Field label={tr("입사", "Start", "入职", "Bắt đầu", "入社", "Mulai")}>
                    <MonthYearPicker
                      value={c.startDate ?? ""}
                      onChange={(v) => setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, startDate: v } : x)))}
                      placeholder={{ year: tr("연도", "Year", "年份", "Năm", "年", "Tahun"), month: tr("월", "Month", "月", "Tháng", "月", "Bulan") }}
                    />
                  </Field>
                  <Field label={tr("퇴사", "End", "离职", "Kết thúc", "退職", "Berakhir")} hint={tr("재직 중이면 비워두기", "Leave empty if current", "在职则留空", "Để trống nếu đang làm", "在職中なら空欄", "Kosongkan jika masih bekerja")}>
                    <MonthYearPicker
                      value={c.endDate ?? ""}
                      onChange={(v) => setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, endDate: v } : x)))}
                      placeholder={{ year: tr("연도", "Year", "年份", "Năm", "年", "Tahun"), month: tr("월", "Month", "月", "Tháng", "月", "Bulan") }}
                    />
                  </Field>
                  <Field
                    label={tr("주요 업무", "Highlights", "主要工作", "Công việc chính", "主な業務", "Tugas utama")}
                    hint={tr("선택", "Optional", "可选", "Tùy chọn", "任意", "Opsional")}
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          setAiHelper({
                            fieldType: "career",
                            fieldLabel: `${c.companyName?.trim() || tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")} · ${tr("주요 업무", "Highlights", "主要工作", "Công việc chính", "主な業務", "Tugas utama")}`,
                            currentText: c.description ?? "",
                            context: { companyName: c.companyName, position: c.position },
                            onApply: (text) =>
                              setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, description: text } : x)))
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background hover:opacity-90"
                      >
                        <Sparkle className="h-3 w-3" weight="fill" />
                        {tr("AI 도우미", "AI helper", "AI助手", "Trợ lý AI", "AIアシスタント", "Asisten AI")}
                      </button>
                    }
                  >
                    <textarea value={c.description ?? ""} onChange={(ev) => setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, description: ev.target.value } : x)))} rows={8} placeholder={tr("담당 프로젝트·성과 등을 자유롭게", "Describe projects and impact", "请简述项目与成果", "Mô tả dự án và thành tựu", "プロジェクトや成果を記載", "Tulis proyek & dampak")} className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-primary" />
                  </Field>
                </div>
              ))}
              <button type="button" onClick={() => setCareers((p) => [...p, {}])} className={addBtnClass}>
                <Plus weight="bold" className="h-4 w-4" />
                {tr("경력 추가", "Add", "添加", "Thêm", "追加", "Tambah")}
              </button>
            </div>

            {/* 프로젝트 / 활동 / 인턴 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("프로젝트 / 활동", "Projects / Activities", "项目/活动", "Dự án / Hoạt động", "プロジェクト/活動", "Proyek / Aktivitas")}</span>
              {activities.map((a, i) => (
                <div key={i} className="space-y-4 rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setActivities((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <Field label={tr("프로젝트/활동명", "Title", "项目/活动名称", "Tên dự án / hoạt động", "プロジェクト/活動名", "Nama proyek / aktivitas")} required>
                    <input value={a.title ?? ""} onChange={(ev) => setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, title: ev.target.value } : x)))} placeholder={tr("예: 졸업 작품", "e.g. Capstone project", "如：毕业作品", "VD: Đồ án tốt nghiệp", "例：卒業制作", "Mis: Proyek capstone")} className={inputClass} />
                  </Field>
                  <Field label={tr("기관/소속", "Organization", "机构/所属", "Tổ chức", "団体/所属", "Organisasi")} hint={tr("선택", "Optional", "可选", "Tùy chọn", "任意", "Opsional")}>
                    <input value={a.organization ?? ""} onChange={(ev) => setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, organization: ev.target.value } : x)))} placeholder={tr("예: 학교 / 동아리 / 회사", "e.g. School / Club / Company", "如：学校 / 社团 / 公司", "VD: Trường / CLB / Công ty", "例：学校 / サークル / 会社", "Mis: Sekolah / Klub / Perusahaan")} className={inputClass} />
                  </Field>
                  <Field label={tr("시작", "Start", "开始", "Bắt đầu", "開始", "Mulai")}>
                    <MonthYearPicker
                      value={a.startDate ?? ""}
                      onChange={(v) => setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, startDate: v } : x)))}
                      placeholder={{ year: tr("연도", "Year", "年份", "Năm", "年", "Tahun"), month: tr("월", "Month", "月", "Tháng", "月", "Bulan") }}
                    />
                  </Field>
                  <Field label={tr("종료", "End", "结束", "Kết thúc", "終了", "Berakhir")} hint={tr("진행 중이면 비워두기", "Leave empty if ongoing", "进行中则留空", "Để trống nếu đang diễn ra", "進行中なら空欄", "Kosongkan jika berlangsung")}>
                    <MonthYearPicker
                      value={a.endDate ?? ""}
                      onChange={(v) => setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, endDate: v } : x)))}
                      placeholder={{ year: tr("연도", "Year", "年份", "Năm", "年", "Tahun"), month: tr("월", "Month", "月", "Tháng", "月", "Bulan") }}
                    />
                  </Field>
                  <Field
                    label={tr("설명", "Description", "说明", "Mô tả", "説明", "Deskripsi")}
                    hint={tr("선택", "Optional", "可选", "Tùy chọn", "任意", "Opsional")}
                    action={
                      <button
                        type="button"
                        onClick={() =>
                          setAiHelper({
                            fieldType: "activity",
                            fieldLabel: `${a.title?.trim() || tr("활동", "Activity", "活动", "Hoạt động", "活動", "Aktivitas")} · ${tr("설명", "Description", "说明", "Mô tả", "説明", "Deskripsi")}`,
                            currentText: a.description ?? "",
                            context: { title: a.title },
                            onApply: (text) =>
                              setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, description: text } : x)))
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-0.5 text-[11px] font-semibold text-background hover:opacity-90"
                      >
                        <Sparkle className="h-3 w-3" weight="fill" />
                        {tr("AI 도우미", "AI helper", "AI助手", "Trợ lý AI", "AIアシスタント", "Asisten AI")}
                      </button>
                    }
                  >
                    <textarea value={a.description ?? ""} onChange={(ev) => setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, description: ev.target.value } : x)))} rows={8} placeholder={tr("역할·결과·배운 점 등", "Role, outcome, learnings", "角色·成果·所学", "Vai trò, kết quả, bài học", "役割・成果・学び", "Peran, hasil, pelajaran")} className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-primary" />
                  </Field>
                </div>
              ))}
              <button type="button" onClick={() => setActivities((p) => [...p, {}])} className={addBtnClass}>
                <Plus weight="bold" className="h-4 w-4" />
                {tr("활동 추가", "Add", "添加", "Thêm", "追加", "Tambah")}
              </button>
            </div>

            {/* 스킬 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Skill")}</span>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground">
                      {s}
                      <button type="button" onClick={() => setSkills((p) => p.filter((_, idx) => idx !== i))} aria-label="remove">
                        <XIcon weight="bold" className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <Field
                label={tr("스킬 추가", "Add a skill", "添加技能", "Thêm kỹ năng", "スキル追加", "Tambah skill")}
                hint={tr("Enter로 추가", "Press Enter", "回车添加", "Enter để thêm", "Enterで追加", "Tekan Enter")}
              >
                <div className="flex gap-2">
                  <input
                    value={skillDraft}
                    onChange={(e) => setSkillDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    placeholder={tr("예: Figma, Python", "e.g. Figma, Python", "如：Figma、Python", "VD: Figma, Python", "例：Figma、Python", "Mis: Figma, Python")}
                    className={inputClass}
                  />
                  <Button type="button" variant="outline" onClick={addSkill} className="h-12 flex-none px-5">
                    {tr("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
                  </Button>
                </div>
              </Field>
            </div>

            {/* 어학 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}</span>
              {languages.map((l, i) => (
                <div key={i} className="space-y-4 rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setLanguages((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={tr("언어", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")}>
                      <input value={l.language ?? ""} onChange={(ev) => setLanguages((p) => p.map((x, idx) => (idx === i ? { ...x, language: ev.target.value } : x)))} placeholder={tr("예: 한국어 / English", "e.g. Korean / English", "如：韩语 / English", "VD: Tiếng Hàn / English", "例：韓国語 / English", "Mis: Bahasa Korea / English")} className={inputClass} />
                    </Field>
                    <Field label={tr("수준", "Level", "水平", "Trình độ", "レベル", "Tingkat")}>
                      <input value={l.level ?? ""} onChange={(ev) => setLanguages((p) => p.map((x, idx) => (idx === i ? { ...x, level: ev.target.value } : x)))} placeholder={tr("예: TOPIK 4급 / Business", "e.g. TOPIK 4 / Business", "如：TOPIK 4级 / Business", "VD: TOPIK 4 / Business", "例：TOPIK 4級 / Business", "Mis: TOPIK 4 / Business")} className={inputClass} />
                    </Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setLanguages((p) => [...p, {}])} className={addBtnClass}>
                <Plus weight="bold" className="h-4 w-4" />
                {tr("어학 추가", "Add", "添加", "Thêm", "追加", "Tambah")}
              </button>
            </div>

            {/* 자격 / 수상 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("자격 / 수상", "Certificates / Awards", "证书/获奖", "Chứng chỉ / Giải thưởng", "資格/受賞", "Sertifikat / Penghargaan")}</span>
              {certifications.map((c, i) => (
                <div key={i} className="space-y-4 rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setCertifications((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label={tr("자격 / 수상 명칭", "Name", "证书 / 奖项名称", "Tên chứng chỉ / giải thưởng", "資格 / 受賞名", "Nama sertifikat / penghargaan")}>
                      <input value={c.name ?? ""} onChange={(ev) => setCertifications((p) => p.map((x, idx) => (idx === i ? { ...x, name: ev.target.value } : x)))} placeholder={tr("예: 정보처리기사", "e.g. AWS SAA", "如：信息处理工程师", "VD: AWS SAA", "例：基本情報技術者", "Mis: AWS SAA")} className={inputClass} />
                    </Field>
                    <Field label={tr("발급기관", "Issuer", "颁发机构", "Tổ chức cấp", "発行機関", "Penerbit")} hint={tr("선택", "Optional", "可选", "Tùy chọn", "任意", "Opsional")}>
                      <input value={c.issuer ?? ""} onChange={(ev) => setCertifications((p) => p.map((x, idx) => (idx === i ? { ...x, issuer: ev.target.value } : x)))} placeholder={tr("예: 한국산업인력공단", "e.g. AWS", "如：AWS", "VD: AWS", "例：AWS", "Mis: AWS")} className={inputClass} />
                    </Field>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setCertifications((p) => [...p, {}])} className={addBtnClass}>
                <Plus weight="bold" className="h-4 w-4" />
                {tr("추가", "Add", "添加", "Thêm", "追加", "Tambah")}
              </button>
            </div>

            {/* 포트폴리오 / 링크 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("포트폴리오 / 링크", "Portfolio / Links", "作品集/链接", "Portfolio / Liên kết", "ポートフォリオ/リンク", "Portofolio / Tautan")}</span>
              {links.map((l, i) => (
                <div key={i} className="space-y-4 rounded-2xl bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setLinks((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <Field label={tr("라벨", "Label", "标签", "Nhãn", "ラベル", "Label")}>
                    <input value={l.label ?? ""} onChange={(ev) => setLinks((p) => p.map((x, idx) => (idx === i ? { ...x, label: ev.target.value } : x)))} placeholder={tr("예: GitHub / 포트폴리오", "e.g. GitHub / Portfolio", "如：GitHub / 作品集", "VD: GitHub / Portfolio", "例：GitHub / ポートフォリオ", "Mis: GitHub / Portofolio")} className={inputClass} />
                  </Field>
                  <Field label={tr("URL", "URL", "网址", "URL", "URL", "URL")}>
                    <input value={l.url ?? ""} onChange={(ev) => setLinks((p) => p.map((x, idx) => (idx === i ? { ...x, url: ev.target.value } : x)))} placeholder="https://" className={inputClass} />
                  </Field>
                </div>
              ))}
              <button type="button" onClick={() => setLinks((p) => [...p, {}])} className={addBtnClass}>
                <Plus weight="bold" className="h-4 w-4" />
                {tr("링크 추가", "Add", "添加", "Thêm", "追加", "Tambah")}
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Save bar */}
      <div className="max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:border-t max-md:border-border max-md:bg-white/95 max-md:backdrop-blur">
        <div className="container">
          <div className="mx-auto flex max-w-4xl items-center gap-3 max-md:py-4 md:pb-10">
            <Button type="button" variant="outline" onClick={() => router.back()} className="h-12 flex-none px-6 max-md:hidden">
              {tr("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}
            </Button>
            <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)} className="h-12 flex-none px-5">
              <span className="inline-flex items-center gap-1.5">
                <Eye weight="bold" className="h-4 w-4" />
                {tr("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}
              </span>
            </Button>
            <Button onClick={handleSave} disabled={saving} className="h-12 flex-1 rounded-xl text-[15px] font-semibold md:flex-none md:px-10">
              {tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview modal — renders the current edit state with the same layout
          as ResumeDetailPage so the user sees exactly what they're saving. */}
      {previewOpen ? (
        <ResumePreviewModal
          tr={tr}
          onClose={() => setPreviewOpen(false)}
          title={title}
          basicName={basicName}
          basicEmail={basicEmail}
          basicPhone={basicPhone}
          basicResidence={basicResidence}
          basicVisa={basicVisa}
          basicPhotoUrl={basicPhotoUrl}
          summary={summary}
          selfIntro={selfIntro}
          careers={careers}
          activities={activities}
          educations={educations}
          skills={skills}
          languages={languages}
          certifications={certifications}
          links={links}
          eduTypeOptions={eduTypeOptions}
          eduStatusOptions={eduStatusOptions}
        />
      ) : null}

      {/* AI 작성 도우미 모달 — 자기소개/경력/활동의 [AI 도우미] 클릭 시 노출 */}
      <AiTextHelperModal
        open={aiHelper !== null}
        onClose={() => setAiHelper(null)}
        fieldType={aiHelper?.fieldType ?? "selfIntroduction"}
        fieldLabel={aiHelper?.fieldLabel ?? ""}
        currentText={aiHelper?.currentText ?? ""}
        context={aiHelper?.context}
        onApply={(text) => aiHelper?.onApply(text)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview modal — read-only render of the in-progress resume. Mirrors the
// ResumeDetailPage layout so the user sees exactly what gets saved. Kept
// inline here so the modal can read the live edit state without prop drilling
// through a separate file.
// ---------------------------------------------------------------------------

type Trans = (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => string;

function ResumePreviewModal(props: {
  tr: Trans;
  onClose: () => void;
  title: string;
  basicName: string;
  basicEmail: string;
  basicPhone: string;
  basicResidence: string;
  basicVisa: string;
  basicPhotoUrl: string;
  summary: string;
  selfIntro: string;
  careers: ResumeCareerEntry[];
  activities: ResumeActivityEntry[];
  educations: ResumeEducationEntry[];
  skills: string[];
  languages: ResumeLanguageEntry[];
  certifications: ResumeCertificationEntry[];
  links: ResumeLinkEntry[];
  eduTypeOptions: { value: CandidateEducationType; label: string }[];
  eduStatusOptions: { value: CandidateEducationStatus; label: string }[];
}) {
  const {
    tr,
    onClose,
    title,
    basicName,
    basicEmail,
    basicPhone,
    basicResidence,
    basicVisa,
    basicPhotoUrl,
    summary,
    selfIntro,
    careers,
    activities,
    educations,
    skills,
    languages,
    certifications,
    links,
    eduTypeOptions,
    eduStatusOptions
  } = props;

  const careerList = careers.filter((c) => c.companyName?.trim() && c.position?.trim());
  const activityList = activities.filter((a) => a.title?.trim());
  const eduList = educations.filter((e) => e.schoolName?.trim());
  const languageList = languages.filter((l) => l.language?.trim());
  const certList = certifications.filter((c) => c.name?.trim());
  const linkList = links.filter((l) => l.url?.trim());

  const visaShort = (v: string) => {
    if (!v) return "";
    if (v === "OTHER") return tr("기타", "Other", "其他", "Khác", "その他", "Lainnya");
    return v.split("_")[0].replace(/(\d)/, "-$1");
  };
  // 기간 포맷 (편집 시 month input "YYYY-MM" → "YYYY.MM" 표시)
  const formatRange = (start?: string, end?: string) => {
    const pretty = (val?: string) => {
      if (!val) return "";
      const m = val.match(/^(\d{4})-(\d{2})$/);
      return m ? `${m[1]}.${m[2]}` : val;
    };
    const s = pretty(start);
    const e = pretty(end);
    const present = tr("재직중", "Present", "在职中", "Hiện tại", "在職中", "Sekarang");
    if (s && e) return `${s} — ${e}`;
    if (s && !e) return `${s} — ${present}`;
    if (!s && e) return e;
    return "";
  };
  const eduTypeLabel = (v?: CandidateEducationType) =>
    !v ? null : eduTypeOptions.find((o) => o.value === v)?.label ?? null;
  const eduStatusLabel = (v?: CandidateEducationStatus) =>
    !v ? null : eduStatusOptions.find((o) => o.value === v)?.label ?? null;

  const hasAny =
    summary.trim() ||
    selfIntro.trim() ||
    careerList.length ||
    activityList.length ||
    eduList.length ||
    skills.length ||
    languageList.length ||
    certList.length ||
    linkList.length;

  // 공유 페이지와 동일하게 세로/투 컬럼 토글 — 기본 세로(single).
  const [layout, setLayout] = useState<"single" | "two-column">("single");

  // Lock background body scroll while the modal is open so the page behind
  // doesn't move when the user wheels/swipes inside the modal.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr("이력서 미리보기", "Resume preview", "简历预览", "Xem trước hồ sơ", "履歴書プレビュー", "Pratinjau resume")}
      className="fixed inset-0 z-50 flex items-stretch justify-center overflow-hidden bg-black/40 p-3 md:p-8"
      onClick={onClose}
    >
      <div
        className="relative my-auto flex max-h-[calc(100vh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-border bg-white shadow-2xl md:max-h-[calc(100vh-4rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar — 미리보기 라벨 + 레이아웃 토글(공유 페이지와 동일) + 닫기 */}
        <div className="flex flex-none flex-wrap items-center justify-between gap-2 border-b border-border bg-white px-5 py-3">
          <p className="text-[14px] font-semibold text-foreground">
            {tr("이력서 미리보기", "Resume preview", "简历预览", "Xem trước hồ sơ", "履歴書プレビュー", "Pratinjau resume")}
          </p>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-border bg-white p-1 text-[12.5px]">
              <button
                type="button"
                onClick={() => setLayout("single")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition ${
                  layout === "single" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={layout === "single"}
              >
                <Rows weight="bold" className="h-3.5 w-3.5" />
                {tr("세로", "Single", "单列", "Một cột", "シングル", "Tunggal")}
              </button>
              <button
                type="button"
                onClick={() => setLayout("two-column")}
                className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition ${
                  layout === "two-column" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
                aria-pressed={layout === "two-column"}
              >
                <SidebarSimple weight="bold" className="h-3.5 w-3.5" />
                {tr("투 컬럼", "Two-column", "双列", "Hai cột", "ツーカラム", "Dua kolom")}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={tr("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-muted/30 hover:text-foreground"
            >
              <X weight="bold" className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Resume sheet — scrollable area is THIS div only */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-6 md:p-10">
          {/* Top Aply mark — mirrors the detail page sheet so the preview
              matches what the user will see after saving. */}
          <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
            <Image src="/img_logo.webp" alt="Aply" width={84} height={26} className="h-6 w-auto object-contain" />
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              {tr("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}
            </span>
          </div>

          {/* 세로 모드에서는 사진 + 이름 + 연락처 hero 가 시트 위에 자리잡음.
              투 컬럼 모드에서는 좌측 사이드바가 그 역할을 하므로 hero 는 생략. */}
          {hasAny && layout === "single" ? (
            <header className="flex items-center gap-5 md:gap-6">
              {basicPhotoUrl ? (
                <div className="aspect-[3/4] w-24 flex-none overflow-hidden rounded-2xl border border-border md:w-28">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={basicPhotoUrl} alt="" className="h-full w-full object-cover" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <h1 className="text-[28px] font-bold tracking-tight text-foreground md:text-[34px]">
                  {basicName.trim() || tr("이름 미입력", "Name not set", "未填写姓名", "Chưa nhập tên", "氏名未入力", "Nama belum diisi")}
                </h1>
                <div className="mt-3 space-y-1 text-[13.5px] leading-relaxed text-foreground/80">
                  {basicEmail ? <p>{basicEmail}</p> : null}
                  {basicPhone ? <p>{basicPhone}</p> : null}
                  {basicResidence ? <p>{basicResidence}</p> : null}
                  {visaShort(basicVisa) ? <p>{visaShort(basicVisa)}</p> : null}
                </div>
              </div>
            </header>
          ) : null}

          {!hasAny ? (
            <p className="mt-6 text-[14px] text-muted-foreground">
              {tr("아직 내용이 비어있어요.", "Nothing filled in yet.", "内容还是空的。", "Chưa có nội dung.", "まだ内容が空です。", "Belum ada isi.")}
            </p>
          ) : layout === "single" ? (
            // 세로 (single column) — 자기소개 → 경력 → 프로젝트 → 학력 → 스킬 → 어학 → 자격 → 링크
            <div className="mt-7 space-y-10">
              {(summary || selfIntro) ? (
                <section>
                  <SectionTitle>{tr("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang")}</SectionTitle>
                  {summary ? <p className="mb-2 text-[15px] font-medium text-foreground">{summary}</p> : null}
                  {selfIntro ? (
                    <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-foreground">{selfIntro}</p>
                  ) : null}
                </section>
              ) : null}

              {careerList.length > 0 ? (
                <section>
                  <SectionTitle>{tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")}</SectionTitle>
                  <div className="space-y-6">
                    {careerList.map((cr, i) => {
                      const range = formatRange(cr.startDate, cr.endDate);
                      return (
                        <div key={i}>
                          <p className="text-[15px] text-foreground">
                            <span className="font-bold">{cr.position}</span>
                            {cr.companyName ? <span className="ml-2 text-muted-foreground">{cr.companyName}</span> : null}
                          </p>
                          {range ? <p className="mt-1 text-[13px] italic text-muted-foreground">{range}</p> : null}
                          {cr.description ? (
                            <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">{cr.description}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {activityList.length > 0 ? (
                <section>
                  <SectionTitle>{tr("프로젝트", "Projects", "项目/活动", "Dự án / Hoạt động", "プロジェクト/活動", "Proyek")}</SectionTitle>
                  <div className="space-y-6">
                    {activityList.map((a, i) => {
                      const range = formatRange(a.startDate, a.endDate);
                      return (
                        <div key={i}>
                          <p className="text-[15px] text-foreground">
                            <span className="font-bold">{a.title}</span>
                            {a.organization ? <span className="ml-2 text-muted-foreground">{a.organization}</span> : null}
                          </p>
                          {range ? <p className="mt-1 text-[13px] italic text-muted-foreground">{range}</p> : null}
                          {a.description ? (
                            <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">{a.description}</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {eduList.length > 0 ? (
                <section>
                  <SectionTitle>{tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</SectionTitle>
                  <div className="space-y-5">
                    {eduList.map((e, i) => {
                      const range = formatRange(e.startDate, e.endDate);
                      const meta = [eduTypeLabel(e.educationType), eduStatusLabel(e.status)].filter(Boolean).join(" · ");
                      return (
                        <div key={i}>
                          <p className="text-[15px] text-foreground">
                            <span className="font-bold">{e.major || e.schoolName}</span>
                            {e.major && e.schoolName ? <span className="ml-2 text-muted-foreground">{e.schoolName}</span> : null}
                          </p>
                          {(range || meta) ? (
                            <p className="mt-1 text-[13px] italic text-muted-foreground">
                              {[range, meta].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {skills.length > 0 ? (
                <section>
                  <SectionTitle>{tr("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Skill")}</SectionTitle>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((s, i) => (
                      <span key={i} className="rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground">{s}</span>
                    ))}
                  </div>
                </section>
              ) : null}

              {languageList.length > 0 ? (
                <section>
                  <SectionTitle>{tr("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}</SectionTitle>
                  <ul className="space-y-1.5">
                    {languageList.map((l, i) => (
                      <li key={i} className="text-[14.5px] text-foreground">
                        {l.language}
                        {l.level ? <span className="text-muted-foreground"> · {l.level}</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {certList.length > 0 ? (
                <section>
                  <SectionTitle>{tr("자격 / 수상", "Certificates / Awards", "证书/获奖", "Chứng chỉ / Giải thưởng", "資格/受賞", "Sertifikat / Penghargaan")}</SectionTitle>
                  <ul className="space-y-1.5">
                    {certList.map((ct, i) => (
                      <li key={i} className="text-[14.5px] text-foreground">
                        {ct.name}
                        {ct.issuer ? <span className="text-muted-foreground"> · {ct.issuer}</span> : null}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              {linkList.length > 0 ? (
                <section>
                  <SectionTitle>{tr("포트폴리오 / 링크", "Portfolio / Links", "作品集/链接", "Portfolio / Liên kết", "ポートフォリオ/リンク", "Portofolio / Tautan")}</SectionTitle>
                  <ul className="space-y-1.5">
                    {linkList.map((l, i) => (
                      <li key={i}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[14.5px] text-primary hover:underline"
                        >
                          {l.label || l.url}
                          <ArrowSquareOut className="h-3 w-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : (
            // 투 컬럼 (sidebar) — 좌측: 사진+이름+연락처+요약·자기소개+링크 / 우측: 경력·프로젝트·학력·서브그리드
            <div className="mt-2 grid grid-cols-1 gap-10 md:grid-cols-[230px_1fr] md:gap-12">
              {/* LEFT sidebar — 순서: 사진 → 이름 → 메일/전화/주소 → 요약·자기소개 → 링크 */}
              <aside className="space-y-6">
                {basicPhotoUrl ? (
                  <div className="overflow-hidden rounded-xl border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={basicPhotoUrl} alt="" className="aspect-[3/4] w-full object-cover" />
                  </div>
                ) : null}
                <h1 className="text-[26px] font-bold leading-tight tracking-tight text-foreground">
                  {basicName.trim() || tr("이름 미입력", "Name not set", "未填写姓名", "Chưa nhập tên", "氏名未入力", "Nama belum diisi")}
                </h1>
                {(basicEmail || basicPhone || basicResidence || visaShort(basicVisa)) ? (
                  <div className="space-y-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {basicEmail ? <p>{basicEmail}</p> : null}
                    {basicPhone ? <p>{basicPhone}</p> : null}
                    {basicResidence ? <p>{basicResidence}</p> : null}
                    {visaShort(basicVisa) ? <p>{visaShort(basicVisa)}</p> : null}
                  </div>
                ) : null}
                {(summary || selfIntro) ? (
                  <div className="space-y-2 border-t border-border pt-5">
                    {summary ? (
                      <p className="text-[14px] italic leading-snug text-foreground">{summary}</p>
                    ) : null}
                    {selfIntro ? (
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">{selfIntro}</p>
                    ) : null}
                  </div>
                ) : null}
                {linkList.length > 0 ? (
                  <div className="space-y-1 border-t border-border pt-5 text-[12.5px] leading-relaxed">
                    {linkList.map((l, i) => (
                      <p key={i} className="break-all text-foreground/80">
                        {l.label ? <span className="text-muted-foreground">{l.label}: </span> : null}
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {(l.url ?? "").replace(/^https?:\/\//, "")}
                        </a>
                      </p>
                    ))}
                  </div>
                ) : null}
              </aside>

              {/* RIGHT main */}
              <div className="space-y-12">
                {careerList.length > 0 ? (
                  <section>
                    <SectionTitle>{tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")}</SectionTitle>
                    <div className="space-y-6">
                      {careerList.map((cr, i) => {
                        const range = formatRange(cr.startDate, cr.endDate);
                        return (
                          <div key={i}>
                            <p className="text-[15px] text-foreground">
                              <span className="font-bold">{cr.position}</span>
                              {cr.companyName ? <span className="ml-2 text-muted-foreground">{cr.companyName}</span> : null}
                            </p>
                            {range ? <p className="mt-1 text-[13px] italic text-muted-foreground">{range}</p> : null}
                            {cr.description ? (
                              <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">{cr.description}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {activityList.length > 0 ? (
                  <section>
                    <SectionTitle>{tr("프로젝트", "Projects", "项目/活动", "Dự án / Hoạt động", "プロジェクト/活動", "Proyek")}</SectionTitle>
                    <div className="space-y-6">
                      {activityList.map((a, i) => {
                        const range = formatRange(a.startDate, a.endDate);
                        return (
                          <div key={i}>
                            <p className="text-[15px] text-foreground">
                              <span className="font-bold">{a.title}</span>
                              {a.organization ? <span className="ml-2 text-muted-foreground">{a.organization}</span> : null}
                            </p>
                            {range ? <p className="mt-1 text-[13px] italic text-muted-foreground">{range}</p> : null}
                            {a.description ? (
                              <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">{a.description}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {eduList.length > 0 ? (
                  <section>
                    <SectionTitle>{tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</SectionTitle>
                    <div className="space-y-5">
                      {eduList.map((e, i) => {
                        const range = formatRange(e.startDate, e.endDate);
                        const meta = [eduTypeLabel(e.educationType), eduStatusLabel(e.status)].filter(Boolean).join(" · ");
                        return (
                          <div key={i}>
                            <p className="text-[15px] text-foreground">
                              <span className="font-bold">{e.major || e.schoolName}</span>
                              {e.major && e.schoolName ? (
                                <span className="ml-2 text-muted-foreground">{e.schoolName}</span>
                              ) : null}
                            </p>
                            {(range || meta) ? (
                              <p className="mt-1 text-[13px] italic text-muted-foreground">
                                {[range, meta].filter(Boolean).join(" · ")}
                              </p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {(skills.length > 0 || languageList.length > 0 || certList.length > 0) ? (
                  <div className="grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
                    {skills.length > 0 ? (
                      <section>
                        <SectionTitle>{tr("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Skill")}</SectionTitle>
                        <ul className="space-y-1">
                          {skills.map((s, i) => (
                            <li key={i} className="text-[13.5px] text-foreground/80">{s}</li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                    {languageList.length > 0 ? (
                      <section>
                        <SectionTitle>{tr("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}</SectionTitle>
                        <ul className="space-y-1">
                          {languageList.map((l, i) => (
                            <li key={i} className="text-[13.5px] text-foreground/80">
                              {l.language}
                              {l.level ? <span className="text-muted-foreground"> · {l.level}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                    {certList.length > 0 ? (
                      <section>
                        <SectionTitle>{tr("자격 / 수상", "Certificates", "证书/获奖", "Chứng chỉ", "資格/受賞", "Sertifikat")}</SectionTitle>
                        <ul className="space-y-1">
                          {certList.map((ct, i) => (
                            <li key={i} className="text-[13.5px] text-foreground/80">
                              {ct.name}
                              {ct.issuer ? <span className="text-muted-foreground"> · {ct.issuer}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* Aply footer — bigger logo, mirrors the detail page 1:1 */}
          <footer className="mt-12 flex flex-col items-center gap-2 border-t border-border pt-6 text-center">
            <Image src="/img_logo.webp" alt="Aply" width={140} height={42} className="h-9 w-auto object-contain" />
            <p className="text-[12.5px] text-muted-foreground">
              {tr("Aply 에서 만든 이력서예요", "Made with Aply — Korean job matching", "通过 Aply 制作", "Tạo bằng Aply", "Aplyで作成された履歴書です", "Dibuat dengan Aply")}{" "}
              <span className="text-primary">aply.global</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}

function ContactSep({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-3">
      <span aria-hidden className="text-muted-foreground/40">·</span>
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  // 디바이더 밑줄 제거 — 큰 여백과 액센트 점·헤더 굵기만으로 구분.
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#b7ff5a]" />
      <h2 className="text-[19px] font-bold uppercase tracking-[0.1em] text-foreground">{children}</h2>
    </div>
  );
}
