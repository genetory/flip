"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Plus, Sparkle, XIcon } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
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

export function ResumeEditPage({ resumeId }: { resumeId: string }) {
  const tr = useTr();
  const router = useRouter();
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);

  const [title, setTitle] = useState("");
  // 희망직무
  const [desiredJobRole, setDesiredJobRole] = useState("");
  const [workType, setWorkType] = useState("");
  const [desiredLocation, setDesiredLocation] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
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

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const [r, p] = await Promise.all([getMyResume(resumeId), getMyCandidateProfile().catch(() => null)]);
        if (cancelled) return;
        setProfile(p);
        const c = r.content ?? {};
        setTitle(r.title);
        setDesiredJobRole(c.desiredJobRole ?? "");
        setWorkType(c.workType ?? "");
        setDesiredLocation(c.desiredLocation ?? "");
        setAvailableFrom(c.availableFrom ?? "");
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
        desiredJobRole: desiredJobRole.trim() || null,
        workType: workType || null,
        desiredLocation: desiredLocation.trim() || null,
        availableFrom: availableFrom.trim() || null,
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
            <Link href="/login?next=/resume">{tr("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}</Link>
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
            <Link href="/resume">{tr("목록으로", "Back", "返回", "Về danh sách", "一覧へ", "Kembali")}</Link>
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
  const workTypeOptions: ChipOption<string>[] = [
    { value: "FULL_TIME", label: tr("정규직", "Full-time", "全职", "Toàn thời gian", "正社員", "Penuh waktu") },
    { value: "CONTRACT", label: tr("계약직", "Contract", "合同", "Hợp đồng", "契約", "Kontrak") },
    { value: "INTERN", label: tr("인턴", "Intern", "实习", "Thực tập", "インターン", "Magang") },
    { value: "PART_TIME", label: tr("파트타임", "Part-time", "兼职", "Bán thời gian", "アルバイト", "Paruh waktu") },
    { value: "ANY", label: tr("무관", "Any", "不限", "Bất kỳ", "問わない", "Apa saja") }
  ];

  const inputClass =
    "h-12 w-full rounded-xl border border-border bg-white px-4 text-[15px] text-foreground outline-none transition focus:border-primary";
  const labelClass = "mb-2 block text-[15px] font-semibold text-foreground";
  const sectionClass = "space-y-3";
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

  const name = user?.name || user?.realName || "-";
  const residence = profile?.residenceProvince || "-";

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
            <div>
              <label className={labelClass}>{tr("이력서 이름", "Resume title", "简历名称", "Tên hồ sơ", "履歴書名", "Nama resume")}</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </div>

            {/* 기본정보 (프로필 공통, 읽기 전용) */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className={`${labelClass} mb-0`}>{tr("기본정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")}</span>
                <Link href="/profile/edit" className="text-[12px] font-medium text-primary hover:underline">
                  {tr("프로필에서 수정", "Edit in profile", "在资料中修改", "Sửa trong hồ sơ", "プロフィールで編集", "Edit di profil")}
                </Link>
              </div>
              <div className="grid gap-x-6 gap-y-2 rounded-2xl bg-muted/40 p-4 sm:grid-cols-2">
                {[
                  [tr("이름", "Name", "姓名", "Tên", "氏名", "Nama"), name],
                  [tr("이메일", "Email", "邮箱", "Email", "メール", "Email"), user?.email || "-"],
                  [tr("휴대폰", "Phone", "手机", "Điện thoại", "電話", "Telepon"), user?.phoneNumber || "-"],
                  [tr("거주지역", "Residence", "居住地", "Nơi ở", "居住地", "Domisili"), residence]
                ].map(([label, value]) => (
                  <div key={label} className="text-[14px]">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="ml-2 text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 희망직무 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("희망 직무", "Desired role", "期望职务", "Vị trí mong muốn", "希望職種", "Posisi diinginkan")}</span>
              <input
                value={desiredJobRole}
                onChange={(e) => setDesiredJobRole(e.target.value)}
                placeholder={tr("예: 프로덕트 디자이너", "e.g. Product Designer", "如：产品设计师", "VD: Nhà thiết kế sản phẩm", "例：プロダクトデザイナー", "Mis: Desainer Produk")}
                className={inputClass}
              />
              <Chips options={workTypeOptions} value={workType} onSelect={setWorkType} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  value={desiredLocation}
                  onChange={(e) => setDesiredLocation(e.target.value)}
                  placeholder={tr("희망 근무지", "Preferred location", "期望工作地", "Địa điểm mong muốn", "希望勤務地", "Lokasi diinginkan")}
                  className={inputClass}
                />
                <input
                  value={availableFrom}
                  onChange={(e) => setAvailableFrom(e.target.value)}
                  placeholder={tr("입사 가능일 (예: 즉시 / 2026-03)", "Available from (e.g. ASAP)", "可入职日（如：随时）", "Có thể bắt đầu (VD: Ngay)", "入社可能日（例：即時）", "Mulai bisa (mis: Segera)")}
                  className={inputClass}
                />
              </div>
            </div>

            {/* 학력 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</span>
              {educations.map((e, i) => (
                <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setEducations((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <input value={e.schoolName ?? ""} onChange={(ev) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, schoolName: ev.target.value } : x)))} placeholder={tr("학교명", "School", "学校", "Trường", "学校", "Sekolah")} className={inputClass} />
                  <input value={e.major ?? ""} onChange={(ev) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, major: ev.target.value } : x)))} placeholder={tr("전공 (선택)", "Major (optional)", "专业（可选）", "Chuyên ngành", "専攻（任意）", "Jurusan")} className={inputClass} />
                  <Chips options={eduTypeOptions} value={e.educationType ?? ""} onSelect={(v) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, educationType: v } : x)))} />
                  <Chips options={eduStatusOptions} value={e.status ?? ""} onSelect={(v) => setEducations((p) => p.map((x, idx) => (idx === i ? { ...x, status: v } : x)))} />
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
                <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setCareers((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <input value={c.companyName ?? ""} onChange={(ev) => setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, companyName: ev.target.value } : x)))} placeholder={tr("회사명", "Company", "公司", "Công ty", "会社", "Perusahaan")} className={inputClass} />
                  <input value={c.position ?? ""} onChange={(ev) => setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, position: ev.target.value } : x)))} placeholder={tr("직무 / 직책", "Role", "职务", "Vị trí", "職務", "Posisi")} className={inputClass} />
                  <textarea value={c.description ?? ""} onChange={(ev) => setCareers((p) => p.map((x, idx) => (idx === i ? { ...x, description: ev.target.value } : x)))} rows={2} placeholder={tr("주요 업무 (선택)", "Highlights (optional)", "主要工作（可选）", "Công việc chính", "主な業務（任意）", "Tugas utama")} className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] outline-none focus:border-primary" />
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
                <div key={i} className="space-y-3 rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-muted-foreground">#{i + 1}</span>
                    <RemoveBtn onClick={() => setActivities((p) => p.filter((_, idx) => idx !== i))} />
                  </div>
                  <input value={a.title ?? ""} onChange={(ev) => setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, title: ev.target.value } : x)))} placeholder={tr("제목", "Title", "标题", "Tiêu đề", "タイトル", "Judul")} className={inputClass} />
                  <input value={a.organization ?? ""} onChange={(ev) => setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, organization: ev.target.value } : x)))} placeholder={tr("기관/소속 (선택)", "Organization (optional)", "机构（可选）", "Tổ chức", "団体（任意）", "Organisasi")} className={inputClass} />
                  <textarea value={a.description ?? ""} onChange={(ev) => setActivities((p) => p.map((x, idx) => (idx === i ? { ...x, description: ev.target.value } : x)))} rows={2} placeholder={tr("설명 (선택)", "Description (optional)", "说明（可选）", "Mô tả", "説明（任意）", "Deskripsi")} className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] outline-none focus:border-primary" />
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
            </div>

            {/* 어학 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}</span>
              {languages.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={l.language ?? ""} onChange={(ev) => setLanguages((p) => p.map((x, idx) => (idx === i ? { ...x, language: ev.target.value } : x)))} placeholder={tr("언어 (예: 한국어)", "Language", "语言", "Ngôn ngữ", "言語", "Bahasa")} className={inputClass} />
                  <input value={l.level ?? ""} onChange={(ev) => setLanguages((p) => p.map((x, idx) => (idx === i ? { ...x, level: ev.target.value } : x)))} placeholder={tr("수준 (예: TOPIK 4급)", "Level", "水平", "Trình độ", "レベル", "Tingkat")} className={inputClass} />
                  <RemoveBtn onClick={() => setLanguages((p) => p.filter((_, idx) => idx !== i))} />
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
                <div key={i} className="flex items-center gap-2">
                  <input value={c.name ?? ""} onChange={(ev) => setCertifications((p) => p.map((x, idx) => (idx === i ? { ...x, name: ev.target.value } : x)))} placeholder={tr("명칭", "Name", "名称", "Tên", "名称", "Nama")} className={inputClass} />
                  <input value={c.issuer ?? ""} onChange={(ev) => setCertifications((p) => p.map((x, idx) => (idx === i ? { ...x, issuer: ev.target.value } : x)))} placeholder={tr("발급기관 (선택)", "Issuer (optional)", "颁发机构", "Tổ chức cấp", "発行機関（任意）", "Penerbit")} className={inputClass} />
                  <RemoveBtn onClick={() => setCertifications((p) => p.filter((_, idx) => idx !== i))} />
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
                <div key={i} className="flex items-center gap-2">
                  <input value={l.label ?? ""} onChange={(ev) => setLinks((p) => p.map((x, idx) => (idx === i ? { ...x, label: ev.target.value } : x)))} placeholder={tr("라벨 (예: GitHub)", "Label", "标签", "Nhãn", "ラベル", "Label")} className={`${inputClass} sm:max-w-[180px]`} />
                  <input value={l.url ?? ""} onChange={(ev) => setLinks((p) => p.map((x, idx) => (idx === i ? { ...x, url: ev.target.value } : x)))} placeholder="https://" className={inputClass} />
                  <RemoveBtn onClick={() => setLinks((p) => p.filter((_, idx) => idx !== i))} />
                </div>
              ))}
              <button type="button" onClick={() => setLinks((p) => [...p, {}])} className={addBtnClass}>
                <Plus weight="bold" className="h-4 w-4" />
                {tr("링크 추가", "Add", "添加", "Thêm", "追加", "Tambah")}
              </button>
            </div>

            {/* 자기소개 / 요약 */}
            <div className={sectionClass}>
              <span className={labelClass}>{tr("자기소개 / 요약", "About / Summary", "自我介绍/概要", "Giới thiệu / Tóm tắt", "自己紹介/要約", "Tentang / Ringkasan")}</span>
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={tr("한 줄 커리어 요약 (선택)", "One-line summary (optional)", "一句话概要（可选）", "Tóm tắt một dòng", "一行サマリー（任意）", "Ringkasan satu baris")}
                className={inputClass}
              />
              <textarea
                value={selfIntro}
                onChange={(e) => setSelfIntro(e.target.value)}
                rows={5}
                placeholder={tr("자기소개", "About me", "自我介绍", "Giới thiệu", "自己紹介", "Tentang saya")}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-[15px] text-foreground outline-none transition focus:border-primary"
              />
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
            <Button onClick={handleSave} disabled={saving} className="h-12 flex-1 rounded-xl text-[15px] font-semibold md:flex-none md:px-10">
              {tr("저장", "Save", "保存", "Lưu", "保存", "Simpan")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
