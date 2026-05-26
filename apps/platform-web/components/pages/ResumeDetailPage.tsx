"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowSquareOut, PencilSimple, Sparkle, Star } from "@phosphor-icons/react/dist/ssr";
import { Header } from "../site/Header";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  getMyCandidateProfile,
  getMyResume,
  setMyPrimaryResume,
  type CandidateEducationStatus,
  type CandidateEducationType,
  type CandidateVisaType,
  type MyCandidateProfile,
  type Resume
} from "../../lib/member-profile-client";

function useTr() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => {
    const map: Record<PlatformLocale, string> = { ko, en, "zh-CN": zh, vi, ja, id };
    return map[locale] ?? ko;
  };
}

export function ResumeDetailPage({ resumeId }: { resumeId: string }) {
  const tr = useTr();
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [resume, setResume] = useState<Resume | null>(null);
  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [primaryBusy, setPrimaryBusy] = useState(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const [r, p] = await Promise.all([getMyResume(resumeId), getMyCandidateProfile().catch(() => null)]);
        if (cancelled) return;
        setResume(r);
        setProfile(p);
      } catch {
        if (!cancelled) setLoadError(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, resumeId]);

  async function handleSetPrimary() {
    if (!resume || resume.isPrimary || primaryBusy) return;
    setPrimaryBusy(true);
    try {
      await setMyPrimaryResume(resume.id);
      setResume((prev) => (prev ? { ...prev, isPrimary: true } : prev));
    } catch {
      // ignore
    } finally {
      setPrimaryBusy(false);
    }
  }

  const eduTypeLabel = (v?: CandidateEducationType) =>
    !v
      ? null
      : {
          HIGH_SCHOOL: tr("고졸", "High school", "高中", "THPT", "高卒", "SMA"),
          ASSOCIATE: tr("전문학사", "Associate", "专科", "Cao đẳng", "短大", "Diploma"),
          BACHELOR: tr("학사", "Bachelor", "本科", "Cử nhân", "学士", "Sarjana"),
          MASTER: tr("석사", "Master", "硕士", "Thạc sĩ", "修士", "Magister"),
          DOCTOR: tr("박사", "Doctorate", "博士", "Tiến sĩ", "博士", "Doktor"),
          BOOTCAMP: tr("부트캠프", "Bootcamp", "训练营", "Bootcamp", "ブートキャンプ", "Bootcamp"),
          CERTIFICATE: tr("수료", "Certificate", "证书", "Chứng chỉ", "修了", "Sertifikat"),
          OTHER: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
        }[v];
  const eduStatusLabel = (v?: CandidateEducationStatus) =>
    !v
      ? null
      : {
          ENROLLED: tr("재학", "Enrolled", "在读", "Đang học", "在学", "Aktif"),
          GRADUATED: tr("졸업", "Graduated", "毕业", "Đã tốt nghiệp", "卒業", "Lulus"),
          LEAVE_OF_ABSENCE: tr("휴학", "On leave", "休学", "Bảo lưu", "休学", "Cuti"),
          DROPPED_OUT: tr("중퇴", "Dropped out", "退学", "Bỏ học", "中退", "Putus"),
          OTHER: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
        }[v];
  const visaLabel = (v?: CandidateVisaType | null) =>
    !v
      ? null
      : {
          D2_STUDENT: "D-2",
          D4_GENERAL_TRAINING: "D-4",
          D10_JOB_SEEKING: "D-10",
          E7_SPECIFIC_ACTIVITY: "E-7",
          F2_RESIDENCE: "F-2",
          F4_OVERSEAS_KOREAN: "F-4",
          F5_PERMANENT_RESIDENCE: "F-5",
          F6_MARRIAGE_IMMIGRATION: "F-6",
          H1_WORKING_HOLIDAY: "H-1",
          OTHER: tr("기타", "Other", "其他", "Khác", "その他", "Lainnya")
        }[v];

  // ---- Gates -------------------------------------------------------------
  if (isReady && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="container flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">{tr("로그인이 필요해요.", "Please sign in.", "请先登录。", "Vui lòng đăng nhập.", "ログインが必要です。", "Silakan masuk.")}</p>
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
          <p className="text-sm text-muted-foreground">{tr("이력서를 찾을 수 없어요.", "Resume not found.", "找不到该简历。", "Không tìm thấy hồ sơ.", "履歴書が見つかりません。", "Resume tidak ditemukan.")}</p>
          <Button asChild variant="outline" className="h-12">
            <Link href="/resume">{tr("이력서 목록으로", "Back to resumes", "返回简历列表", "Về danh sách hồ sơ", "履歴書一覧へ", "Ke daftar resume")}</Link>
          </Button>
        </main>
      </div>
    );
  }
  if (!isReady || !resume) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <Header />
        <main className="container flex items-center justify-center py-24">
          <Sparkle className="h-6 w-6 animate-pulse text-primary" />
        </main>
      </div>
    );
  }

  const c = resume.content ?? {};
  const eduList = (c.educations ?? (c.education ? [c.education] : [])).filter((e) => e.schoolName);
  const careerList = (c.careers ?? (c.career ? [c.career] : [])).filter((x) => x.companyName && x.position);
  const activityList = (c.activities ?? []).filter((a) => a.title);
  const languageList = (() => {
    const l = (c.languages ?? []).filter((x) => x.language);
    if (l.length === 0 && c.koreanLevel) l.push({ language: tr("한국어", "Korean", "韩语", "Tiếng Hàn", "韓国語", "Korea"), level: c.koreanLevel });
    return l;
  })();
  const certList = (c.certifications ?? []).filter((x) => x.name);
  const linkList = (c.links ?? []).filter((x) => x.url);
  const skills = c.skills ?? [];
  const visaText = visaLabel(profile?.visaType ?? c.visaType ?? null);

  const heading = "mb-3 text-[15px] font-semibold text-foreground";
  const sectionGap = "border-t border-border pt-6";

  const hasAnyDetail =
    Boolean(c.desiredJobRole || c.workType || c.desiredLocation || c.availableFrom) ||
    eduList.length > 0 ||
    careerList.length > 0 ||
    activityList.length > 0 ||
    skills.length > 0 ||
    languageList.length > 0 ||
    certList.length > 0 ||
    linkList.length > 0 ||
    Boolean(c.summary || c.selfIntroduction);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header />
      <main className="container pb-16 pt-8 md:pt-14">
        <div className="mx-auto max-w-4xl">
          <Link href="/resume" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground">
            <ArrowLeft weight="bold" className="h-4 w-4" />
            {tr("이력서 목록", "Resumes", "简历列表", "Danh sách hồ sơ", "履歴書一覧", "Daftar resume")}
          </Link>

          <div className="space-y-6 rounded-3xl border border-border bg-white p-6 md:p-10">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{resume.title}</h1>
                {resume.isPrimary ? (
                  <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[#b7ff5a] px-2.5 py-1 text-[12px] font-semibold text-[#111111]">
                    <Star weight="fill" className="h-3.5 w-3.5" />
                    {tr("대표", "Primary", "代表", "Đại diện", "代表", "Utama")}
                  </span>
                ) : null}
              </div>
              <Button asChild variant="outline" size="sm" className="flex-none">
                <Link href={`/resume/${resume.id}/edit`} className="inline-flex items-center gap-1.5">
                  <PencilSimple weight="bold" className="h-4 w-4" />
                  {tr("수정", "Edit", "编辑", "Sửa", "編集", "Edit")}
                </Link>
              </Button>
            </div>

            {/* 기본정보 */}
            <div className="grid gap-x-6 gap-y-2 rounded-2xl bg-muted/40 p-4 sm:grid-cols-2">
              {[
                [tr("이름", "Name", "姓名", "Tên", "氏名", "Nama"), user?.name || user?.realName || "-"],
                [tr("이메일", "Email", "邮箱", "Email", "メール", "Email"), user?.email || "-"],
                [tr("휴대폰", "Phone", "手机", "Điện thoại", "電話", "Telepon"), user?.phoneNumber || "-"],
                [tr("거주지역", "Residence", "居住地", "Nơi ở", "居住地", "Domisili"), profile?.residenceProvince || "-"],
                [tr("비자", "Visa", "签证", "Visa", "ビザ", "Visa"), visaText || "-"]
              ].map(([label, value]) => (
                <div key={label} className="text-[14px]">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="ml-2 text-foreground">{value}</span>
                </div>
              ))}
            </div>

            {!hasAnyDetail ? (
              <p className="text-[14px] text-muted-foreground">
                {tr("아직 내용이 비어있어요. 수정에서 채워보세요.", "Nothing filled in yet. Tap edit to start.", "内容还是空的，点击编辑开始填写。", "Chưa có nội dung. Nhấn sửa để bắt đầu.", "まだ内容が空です。編集から入力しましょう。", "Belum ada isi. Ketuk edit untuk mulai.")}
              </p>
            ) : null}

            {/* 희망직무 */}
            {c.desiredJobRole || c.workType || c.desiredLocation || c.availableFrom ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("희망 직무", "Desired role", "期望职务", "Vị trí mong muốn", "希望職種", "Posisi diinginkan")}</h2>
                <div className="space-y-1 text-[15px] text-foreground">
                  {c.desiredJobRole ? <p>{c.desiredJobRole}</p> : null}
                  <p className="text-[14px] text-muted-foreground">
                    {[c.workType, c.desiredLocation, c.availableFrom].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </section>
            ) : null}

            {/* 학력 */}
            {eduList.length > 0 ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</h2>
                <div className="space-y-2">
                  {eduList.map((e, i) => (
                    <div key={i} className="text-[15px]">
                      <p className="text-foreground">
                        {e.schoolName}
                        {e.major ? ` · ${e.major}` : ""}
                      </p>
                      <p className="text-[13px] text-muted-foreground">{[eduTypeLabel(e.educationType), eduStatusLabel(e.status)].filter(Boolean).join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 경력 */}
            {careerList.length > 0 ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")}</h2>
                <div className="space-y-3">
                  {careerList.map((cr, i) => (
                    <div key={i} className="text-[15px]">
                      <p className="font-medium text-foreground">{cr.companyName} · {cr.position}</p>
                      {cr.description ? <p className="mt-0.5 whitespace-pre-wrap text-[14px] text-muted-foreground">{cr.description}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 프로젝트 / 활동 */}
            {activityList.length > 0 ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("프로젝트 / 활동", "Projects / Activities", "项目/活动", "Dự án / Hoạt động", "プロジェクト/活動", "Proyek / Aktivitas")}</h2>
                <div className="space-y-3">
                  {activityList.map((a, i) => (
                    <div key={i} className="text-[15px]">
                      <p className="font-medium text-foreground">{a.title}{a.organization ? ` · ${a.organization}` : ""}</p>
                      {a.description ? <p className="mt-0.5 whitespace-pre-wrap text-[14px] text-muted-foreground">{a.description}</p> : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 스킬 */}
            {skills.length > 0 ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Skill")}</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s, i) => (
                    <span key={i} className="rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground">{s}</span>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 어학 */}
            {languageList.length > 0 ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}</h2>
                <div className="space-y-1">
                  {languageList.map((l, i) => (
                    <p key={i} className="text-[15px] text-foreground">
                      {l.language}
                      {l.level ? <span className="text-muted-foreground"> · {l.level}</span> : null}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 자격 / 수상 */}
            {certList.length > 0 ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("자격 / 수상", "Certificates / Awards", "证书/获奖", "Chứng chỉ / Giải thưởng", "資格/受賞", "Sertifikat / Penghargaan")}</h2>
                <div className="space-y-1">
                  {certList.map((ct, i) => (
                    <p key={i} className="text-[15px] text-foreground">
                      {ct.name}
                      {ct.issuer ? <span className="text-muted-foreground"> · {ct.issuer}</span> : null}
                    </p>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 포트폴리오 / 링크 */}
            {linkList.length > 0 ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("포트폴리오 / 링크", "Portfolio / Links", "作品集/链接", "Portfolio / Liên kết", "ポートフォリオ/リンク", "Portofolio / Tautan")}</h2>
                <div className="space-y-1.5">
                  {linkList.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[15px] text-primary hover:underline">
                      {l.label || l.url}
                      <ArrowSquareOut className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 자기소개 / 요약 */}
            {c.summary || c.selfIntroduction ? (
              <section className={sectionGap}>
                <h2 className={heading}>{tr("자기소개 / 요약", "About / Summary", "自我介绍/概要", "Giới thiệu / Tóm tắt", "自己紹介/要約", "Tentang / Ringkasan")}</h2>
                {c.summary ? <p className="mb-2 text-[15px] font-medium text-foreground">{c.summary}</p> : null}
                {c.selfIntroduction ? <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">{c.selfIntroduction}</p> : null}
              </section>
            ) : null}
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            {!resume.isPrimary ? (
              <Button onClick={handleSetPrimary} disabled={primaryBusy} variant="outline" className="h-12 sm:flex-1">
                <span className="inline-flex items-center gap-1.5">
                  <Star weight="fill" className="h-4 w-4" />
                  {tr("대표 이력서로 설정", "Set as primary", "设为代表简历", "Đặt làm hồ sơ đại diện", "代表履歴書に設定", "Jadikan resume utama")}
                </span>
              </Button>
            ) : null}
            <Button asChild className="h-12 sm:flex-1">
              <Link href="/positions">{tr("매칭 공고 보기", "See matching jobs", "查看匹配职位", "Xem việc làm phù hợp", "マッチ求人を見る", "Lihat lowongan cocok")}</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
