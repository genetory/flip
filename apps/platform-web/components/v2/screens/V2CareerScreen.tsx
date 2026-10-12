"use client";

// v2 내 커리어 — 나에 관한 것을 한곳에: 프로필(링크) · 지원 서류(다음 할 일) · 기업이 보는 내 강점 · 관심 직무 · 내 스펙에 맞는 공고 · 경력 · 내 스펙 · 더 정리할 것.
// 관심 직무 고르기는 기존 팝업(JobInterestModal)을, 서류 편집은 기존 에디터를 그대로 쓴다.
import { useEffect, useState, type ReactNode } from "react";
import { V2Shell, useProfilePhoto } from "../V2Shell";
import { Button, Chip, DocCard, Masthead, MastheadSkeleton, Page, PrimaryButton, Row, RowsSkeleton, Section, SectionSkeleton, Spinner, TextLink } from "../ui";
import { companyOf, jobPhotoOf, shortPlace } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { getCareerStrengths, AiQuotaError, type CareerStrength } from "../../../lib/resume-maker-client";
import { normalizeUrl } from "../../../lib/talent/resume-doc";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { useResumeDoc, resumeCompleteness, displayMonth, useRenewalDocsStatus, type ResumeDoc, type ResumeItem } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness, coverQuestions, type CoverDoc } from "../../../lib/talent/cover-doc";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";
import { useCareerHistorySync } from "../../../lib/talent/useCareerHistorySync";
import { sectionLabelOf, coverQuestionLabelOf } from "../../../lib/talent/career-labels";
import type { CareerSection } from "../../../lib/talent/career-chat";
import { JobInterestModal } from "../../talent/jobs/JobInterestModal";

const R = {
  profile: "/talent/career/profile",
  resume: "/talent/career/resume/editor",
  resumePreview: "/talent/career/resume/preview",
  cover: "/talent/career/cover/editor",
  coverPreview: "/talent/career/cover/preview",
  resumes: "/talent/career/resumes",
  coverLetters: "/talent/career/cover-letters",
  experiences: "/talent/career/experiences",
  history: "/talent/career/history",
  diagnosis: "/talent/career/resume/diagnosis"
};

/** 이력서 — 완성도 계산(resumeCompleteness)과 같은 순서로, 아직 빈 첫 항목을 짚는다. */
function resumeNote(t: PlatformT, doc: ResumeDoc | null, pct: number): string {
  if (!doc || pct === 0) return t("아직 시작 전", "Not started", "尚未开始", "Chưa bắt đầu", "未着手", "Belum mulai");
  if (pct >= 100) return t("완성", "Done", "完成", "Xong", "完成", "Selesai");
  const has = (secs: CareerSection[]) => doc.items.some((i) => secs.includes(i.section));
  const missing = !has(["education"])
    ? sectionLabelOf(t, "education")
    : !has(["experience", "project"])
      ? t("경력·프로젝트", "Work or projects", "经历·项目", "Kinh nghiệm/dự án", "経歴・プロジェクト", "Kerja/proyek")
      : !has(["skill"])
        ? sectionLabelOf(t, "skill")
        : !has(["certificate", "award", "activity"])
          ? t("자격증·활동", "Certs or activities", "证书·活动", "Chứng chỉ/hoạt động", "資格・活動", "Sertifikat/aktivitas")
          : t("항목 1~2개 더", "1–2 more items", "再加1~2项", "Thêm 1–2 mục", "あと1〜2項目", "1–2 item lagi");
  return t(`남은 것: ${missing}`, `Left: ${missing}`, `还差：${missing}`, `Còn: ${missing}`, `残り：${missing}`, `Sisa: ${missing}`);
}

/** 자기소개서 — 아직 20자를 못 채운 첫 문항을 짚는다(coverCompleteness 와 같은 기준). */
function coverNote(t: PlatformT, doc: CoverDoc | null, pct: number): string {
  if (!doc || pct === 0) return t("아직 시작 전", "Not started", "尚未开始", "Chưa bắt đầu", "未着手", "Belum mulai");
  if (pct >= 100) return t("완성", "Done", "完成", "Xong", "完成", "Selesai");
  const done = new Set(doc.items.filter((i) => i.text.trim().length >= 20).map((i) => i.question));
  const left = coverQuestions(doc).filter((q) => !done.has(q));
  if (!left.length) return t("완성", "Done", "完成", "Xong", "完成", "Selesai");
  const first = coverQuestionLabelOf(t, left[0]);
  return left.length > 1
    ? t(`남은 것: ${first} 외 ${left.length - 1}개`, `Left: ${first} +${left.length - 1}`, `还差：${first} 等${left.length}项`, `Còn: ${first} +${left.length - 1}`, `残り：${first} 他${left.length - 1}件`, `Sisa: ${first} +${left.length - 1}`)
    : t(`남은 것: ${first}`, `Left: ${first}`, `还差：${first}`, `Còn: ${first}`, `残り：${first}`, `Sisa: ${first}`);
}

/** "YYYY-MM" | "현재" → 월 수(서기 기준). */
function monthIndex(s: string | undefined, now: Date): number | null {
  if (!s) return null;
  if (s === "현재") return now.getFullYear() * 12 + now.getMonth();
  const m = s.match(/(\d{4})-(\d{2})/);
  return m ? Number(m[1]) * 12 + Number(m[2]) - 1 : null;
}

/** 경력 기간 합 — 기간이 적힌 경력만. 겹치는 달은 한 번만 센다. */
function workMonths(items: ResumeItem[]): number {
  const now = new Date();
  const months = new Set<number>();
  for (const w of items) {
    const a = monthIndex(w.startDate, now);
    const b = monthIndex(w.endDate || "현재", now);
    if (a == null || b == null || b < a) continue;
    for (let m = a; m <= b; m++) months.add(m);
  }
  return months.size;
}

function durationText(t: PlatformT, months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y && m) return t(`경력 ${y}년 ${m}개월`, `${y}y ${m}m experience`, `经验 ${y}年${m}个月`, `${y} năm ${m} tháng KN`, `経験 ${y}年${m}ヶ月`, `${y}th ${m}bln pengalaman`);
  if (y) return t(`경력 ${y}년`, `${y}y experience`, `经验 ${y}年`, `${y} năm KN`, `経験 ${y}年`, `${y}th pengalaman`);
  return t(`경력 ${m}개월`, `${m}m experience`, `经验 ${m}个月`, `${m} tháng KN`, `経験 ${m}ヶ月`, `${m}bln pengalaman`);
}

/** 스킬 한 항목에 여러 개를 쉼표로 적는 경우가 많다 — 칩으로 쪼갠다. */
function splitList(text: string): string[] {
  return text
    .split(/[,，、\n·]|\s\/\s/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function V2CareerScreen() {
  return (
    <V2Shell requireAuth>
      <Career />
    </V2Shell>
  );
}

function Career() {
  const t = usePlatformT();
  useCareerHistorySync();
  const info = useBasicInfo();
  const ready = isBasicInfoComplete(info);
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const rp = resumeCompleteness(resume);
  const cp = coverCompleteness(cover);
  const interests = useJobInterests();
  const { user } = useAuthSession();
  const photo = useProfilePhoto(user ?? null);
  const [interestOpen, setInterestOpen] = useState(false);
  const items = resume?.items ?? [];
  const work = items.filter((i) => i.section === "experience");
  const of = (sec: CareerSection) => items.filter((i) => i.section === sec);
  const education = of("education");
  const skills = [...new Set(of("skill").flatMap((i) => splitList(i.text)))];
  const languages = of("language").flatMap((i) => splitList(i.text));
  const certs = of("certificate");
  const months = workMonths(work);
  const name = info.realName;
  const docsStatus = useRenewalDocsStatus();

  // 기본 정보·서류는 계정에서 불러온다 — 다 오기 전엔 화면 모양만(기본 정보 미입력 안내가 깜빡이지 않게).
  if (docsStatus !== "loaded")
    return (
      <Page>
        <MastheadSkeleton action={false} />
        <SectionSkeleton thumb={false} rows={2} />
        <SectionSkeleton thumb={false} rows={1} />
        <SectionSkeleton />
      </Page>
    );

  return (
    <Page>
      {ready ? (
        <Profile
          t={t}
          name={name}
          photo={info.photoUrl || photo}
          intro={(resume?.summary || "").split("\n")[0].trim() || resume?.targetRole || ""}
          meta={[months ? durationText(t, months) : null, shortPlace(info.address) || null].filter(Boolean).join(" · ")}
          links={(resume?.links ?? []).filter((l) => l.url.trim())}
        />
      ) : (
        <Masthead
          eyebrow={t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier saya")}
          title={t("기본 정보부터 채워 볼까요", "Let's start with your basic info", "先填写基本信息吧", "Bắt đầu với thông tin cơ bản", "まず基本情報から入力しましょう", "Mulai dari info dasar")}
          lede={t("이름·연락처는 이력서와 자기소개서에 똑같이 들어가요. 한 번만 입력하면 돼요.", "Your name and contact go into both your resume and cover letter. Enter them once.", "姓名和联系方式会同时用于简历和自我介绍，只需填写一次。", "Tên và liên hệ dùng chung cho CV và thư giới thiệu. Chỉ cần nhập một lần.", "名前・連絡先は履歴書と自己PRの両方に入ります。一度入力すればOKです。", "Nama dan kontak dipakai di CV dan surat lamaran. Cukup isi sekali.")}
          action={<PrimaryButton href={R.profile}>{t("기본 정보 입력하기", "Enter basic info", "填写基本信息", "Nhập thông tin", "基本情報を入力", "Isi info dasar")}</PrimaryButton>}
        />
      )}

      <Section title={t("지원 서류", "Documents", "申请材料", "Hồ sơ ứng tuyển", "応募書類", "Dokumen lamaran")}>
        <div className="grid grid-cols-2 gap-3 pb-2">
          <DocCard href={R.resume} label={t("이력서", "Resume", "简历", "CV", "履歴書", "CV")} pct={rp} note={resumeNote(t, resume, rp)} previewHref={resume ? R.resumePreview : null} previewLabel={t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")} extra={rp >= 100 ? { href: R.diagnosis, label: t("AI 진단", "AI check", "AI 诊断", "Chẩn đoán", "AI診断", "Cek AI") } : null} />
          <DocCard href={R.cover} label={t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")} pct={cp} note={coverNote(t, cover, cp)} previewHref={cover ? R.coverPreview : null} previewLabel={t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")} />
        </div>
      </Section>

      {ready && items.length >= 2 ? <Strengths t={t} resume={resume} cover={cover} interests={interests.map((r) => jobTaxonomyLabelOf(t, r))} /> : null}

      <Section
        title={t("관심 직무", "Job interests", "感兴趣的职位", "Nghề quan tâm", "関心職種", "Minat pekerjaan")}
        aside={<TextLink onClick={() => setInterestOpen(true)}>{interests.length ? t("수정", "Edit", "修改", "Sửa", "編集", "Ubah") : t("고르기", "Choose", "选择", "Chọn", "選ぶ", "Pilih")}</TextLink>}
      >
        {interests.length ? (
          <div className="flex flex-wrap gap-2 pb-2">
            {interests.map((r) => (
              <Chip key={r} onClick={() => setInterestOpen(true)}>
                {jobTaxonomyLabelOf(t, r)}
              </Chip>
            ))}
          </div>
        ) : (
          <Row onClick={() => setInterestOpen(true)} lead="🎯" title={t("관심 직무를 골라 주세요", "Pick your job interests", "请选择感兴趣的职位", "Chọn nghề bạn quan tâm", "関心職種を選んでください", "Pilih minat pekerjaan")} meta={t("고르면 맞춤 공고와 모의 면접이 더 정확해져요", "Recommendations and mock interviews get sharper", "推荐职位和模拟面试会更精准", "Gợi ý và phỏng vấn thử sẽ chính xác hơn", "おすすめと模擬面接が正確になります", "Rekomendasi dan wawancara lebih tepat")} />
        )}
      </Section>

      {interests.length ? <MatchedJobs t={t} interests={interests} skills={skills} /> : null}

      <Section title={t("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")} aside={work.length ? <TextLink href={R.resume}>{t("편집", "Edit", "编辑", "Sửa", "編集", "Ubah")}</TextLink> : undefined}>
        {work.length ? (
          work.map((w) => {
            const period = [displayMonth(w.startDate ?? ""), displayMonth(w.endDate ?? "")].filter(Boolean).join(" ~ ");
            return (
              <Row
                key={w.id}
                href={R.resume}
                title={w.company || w.text}
                meta={
                  <>
                    {period ? <span>{period}</span> : <span className="font-semibold text-[color:var(--v2-accent)]">{t("기간을 적어 주세요", "Add dates", "请填写时间", "Thêm thời gian", "期間を入力", "Tambah periode")}</span>}
                    {w.company && w.text ? <span> · {w.text}</span> : null}
                  </>
                }
              />
            );
          })
        ) : (
          <Row href={R.resume} lead="💼" title={t("경력을 적어 보세요", "Add your experience", "填写经历", "Thêm kinh nghiệm", "経歴を書いてみましょう", "Tambah pengalaman")} meta={t("알바·인턴도 좋아요", "Part-time and internships count", "兼职、实习也可以", "Làm thêm, thực tập đều được", "バイト・インターンもOK", "Paruh waktu & magang juga boleh")} />
        )}
      </Section>

      <Section title={t("내 스펙", "My specs", "我的资历", "Hồ sơ năng lực", "スペック", "Kualifikasi")} aside={education.length || skills.length || languages.length || certs.length ? <TextLink href={R.resume}>{t("편집", "Edit", "编辑", "Sửa", "編集", "Ubah")}</TextLink> : undefined}>
        {education.length || skills.length || languages.length || certs.length ? (
          <div className="flex flex-col gap-6 pb-3 pt-2">
            {education.length ? (
              <Spec label={sectionLabelOf(t, "education")}>
                {education.map((e) => (
                  <SpecLine key={e.id} head={e.company || e.text} sub={e.company && e.text ? e.text : undefined} right={[displayMonth(e.startDate ?? ""), displayMonth(e.endDate ?? "")].filter(Boolean).join(" ~ ")} />
                ))}
              </Spec>
            ) : null}
            {skills.length ? (
              <Spec label={sectionLabelOf(t, "skill")}>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((k) => (
                    <span key={k} className="inline-flex h-8 items-center rounded-lg bg-[color:var(--v2-band)] px-2.5 text-[14px] font-medium text-[color:var(--v2-ink-2)]">
                      {k}
                    </span>
                  ))}
                </div>
              </Spec>
            ) : null}
            {languages.length ? (
              <Spec label={sectionLabelOf(t, "language")}>
                {languages.map((l, i) => (
                  <SpecLine key={i} head={l} />
                ))}
              </Spec>
            ) : null}
            {certs.length ? (
              <Spec label={sectionLabelOf(t, "certificate")}>
                {certs.map((c) => (
                  <SpecLine key={c.id} head={c.text || c.company || ""} right={displayMonth(c.startDate ?? "")} />
                ))}
              </Spec>
            ) : null}
          </div>
        ) : (
          <Row href={R.resume} lead="📌" title={t("학력·스킬·어학·자격증을 채워 보세요", "Add education, skills, languages, certs", "填写学历、技能、语言、证书", "Thêm học vấn, kỹ năng, ngoại ngữ", "学歴・スキル・語学・資格を入力", "Tambah pendidikan, keahlian, bahasa")} meta={t("이력서에 그대로 들어가요", "They go straight into your resume", "会直接写进简历", "Sẽ đưa vào CV", "そのまま履歴書に入ります", "Langsung masuk ke CV")} />
        )}
      </Section>

      <Section title={t("더 정리하기", "More", "更多整理", "Sắp xếp thêm", "さらに整理", "Lainnya")}>
        <Row href={R.profile} lead="🙋" title={t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")} meta={[info.realName, info.email].filter(Boolean).join(" · ") || t("이름·연락처", "Name & contact", "姓名·联系方式", "Tên & liên hệ", "名前・連絡先", "Nama & kontak")} />
        <Row href={R.experiences} lead="🧩" title={t("경험 정리", "Experiences", "经历整理", "Kinh nghiệm", "経験の整理", "Pengalaman")} meta={t("알바·프로젝트·동아리를 이력서 재료로", "Turn jobs, projects, and clubs into resume material", "把兼职、项目、社团整理成简历素材", "Biến việc làm thêm, dự án thành chất liệu CV", "バイト・プロジェクトを履歴書の材料に", "Jadikan kerja & proyek bahan CV")} />
        <Row href={R.resumes} lead="🗂️" title={t("저장한 서류", "Saved documents", "已保存的材料", "Hồ sơ đã lưu", "保存した書類", "Dokumen tersimpan")} meta={t("버전별 이력서·자기소개서", "Resume and cover letter versions", "各版本的简历和自我介绍", "Các phiên bản CV và thư", "バージョン別の履歴書・自己PR", "Versi CV dan surat")} />
        <Row href={R.history} lead="📝" title={t("커리어 기록", "Career log", "职业记录", "Nhật ký", "キャリア記録", "Catatan karier")} meta={t("지금까지 적은 기록 전체", "Everything you've logged", "迄今为止的全部记录", "Tất cả ghi chép", "これまでの記録すべて", "Semua catatan")} />
      </Section>

      {interestOpen ? <JobInterestModal initial={interests} onClose={() => setInterestOpen(false)} /> : null}
    </Page>
  );
}

/** 맨 위 프로필 — 사진 · 이름 · 한 줄 소개 · 경력/지역. */
function Profile({ t, name, photo, intro, meta, links }: { t: PlatformT; name: string; photo: string | null; intro: string; meta: string; links: { label: string; url: string }[] }) {
  return (
    <header className="flex items-start gap-4 px-5 pb-8 pt-8 md:gap-5 md:pt-12">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--v2-band)] text-[24px] font-bold text-[color:var(--v2-muted)] md:h-[72px] md:w-[72px]">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          (name || "?").slice(0, 1)
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h1 className="truncate text-[24px] font-bold leading-[1.35] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[28px]">{name || t("나의 커리어", "My career", "我的职业", "Sự nghiệp của tôi", "私のキャリア", "Karier saya")}</h1>
          <TextLink href={R.profile}>{t("수정", "Edit", "修改", "Sửa", "編集", "Ubah")}</TextLink>
        </div>
        {intro ? <p className="mt-0.5 line-clamp-2 text-[15px] leading-[1.55] text-[color:var(--v2-ink-3)]">{intro}</p> : null}
        {meta ? <p className="mt-1 text-[14px] text-[color:var(--v2-faint)]">{meta}</p> : null}
        {links.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {links.map((l) => (
              <a key={l.url} href={normalizeUrl(l.url)} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 max-w-full items-center gap-1 rounded-lg bg-[color:var(--v2-band)] px-2.5 text-[14px] font-medium text-[color:var(--v2-ink-2)] transition hover:bg-[color:var(--v2-line)]">
                <span className="truncate">{l.label || hostOf(l.url)}</span>
                <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[color:var(--v2-faint)]" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[14px] font-semibold text-[color:var(--v2-muted)]">{label}</p>
      {children}
    </div>
  );
}

function SpecLine({ head, sub, right }: { head: string; sub?: string; right?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-[16px] font-semibold leading-[1.5] text-[color:var(--v2-ink-2)]">{head}</p>
        {sub ? <p className="text-[14px] leading-[1.5] text-[color:var(--v2-muted)]">{sub}</p> : null}
      </div>
      {right ? <span className="shrink-0 pt-0.5 text-[13px] text-[color:var(--v2-faint)]">{right}</span> : null}
    </div>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ── 기업이 보는 내 강점 3가지 ────────────────────────────
// 누를 때만 AI 를 부른다. 결과는 이 브라우저에 서류 수정 시각과 함께 기억 — 서류가 바뀌면 '다시 찾기'를 권한다.
const STRENGTHS_KEY = "aply.v2.career.strengths";
type StrengthsCache = { sig: string; list: CareerStrength[] };

function readStrengths(): StrengthsCache | null {
  try {
    const raw = window.localStorage.getItem(STRENGTHS_KEY);
    const v = raw ? (JSON.parse(raw) as StrengthsCache) : null;
    return v && Array.isArray(v.list) ? v : null;
  } catch {
    return null;
  }
}

/** AI 에 보낼 서류 글 — 요약 · 경력 · 프로젝트 · 학력 · 스킬 · 어학 · 자격증 · 활동 · 자소서 답(8000자 안). */
function profileText(t: PlatformT, resume: ResumeDoc | null, cover: CoverDoc | null): string {
  const lines: string[] = [];
  if (resume?.summary?.trim()) lines.push(`[요약] ${resume.summary.trim()}`);
  for (const i of resume?.items ?? []) {
    const period = [displayMonth(i.startDate ?? ""), displayMonth(i.endDate ?? "")].filter(Boolean).join("~");
    lines.push(`[${sectionLabelOf(t, i.section)}] ${[i.company, period, i.text].filter(Boolean).join(" / ")}`);
  }
  for (const c of cover?.items ?? []) if (c.text.trim()) lines.push(`[자기소개서 · ${c.question}] ${c.text.trim()}`);
  return lines.join("\n").slice(0, 8000);
}

function Strengths({ t, resume, cover, interests }: { t: PlatformT; resume: ResumeDoc | null; cover: CoverDoc | null; interests: string[] }) {
  const sig = `${resume?.updatedAt ?? 0}:${cover?.updatedAt ?? 0}`;
  // 이 구획은 서류를 다 불러온 뒤(브라우저에서만) 그려지므로 첫 값에서 바로 읽어도 된다.
  const [cache, setCache] = useState<StrengthsCache | null>(() => readStrengths());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stale = !!cache && cache.sig !== sig;

  const run = async () => {
    const profile = profileText(t, resume, cover);
    if (profile.length < 30) {
      setError(t("서류 내용이 조금 더 있어야 찾을 수 있어요.", "Add a bit more to your documents first.", "材料内容再多一点才能分析。", "Cần thêm nội dung hồ sơ.", "書類の内容がもう少し必要です。", "Tambahkan isi dokumen dulu."));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const list = await getCareerStrengths({ profile, targetRoles: interests });
      const next = { sig, list };
      setCache(next);
      try {
        window.localStorage.setItem(STRENGTHS_KEY, JSON.stringify(next));
      } catch {
        /* 저장 못 해도 화면엔 보인다 */
      }
    } catch (e) {
      setError(
        e instanceof AiQuotaError
          ? t("오늘은 더 찾을 수 없어요. 내일 다시 해 보세요.", "Daily limit reached. Try again tomorrow.", "今天已达上限，明天再试。", "Đã hết lượt hôm nay.", "本日の上限です。明日お試しください。", "Batas harian tercapai.")
          : t("강점을 찾지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't find strengths. Try again soon.", "未能分析，请稍后再试。", "Không tìm được. Thử lại sau.", "見つけられませんでした。後でもう一度。", "Gagal. Coba lagi nanti.")
      );
    } finally {
      setBusy(false);
    }
  };

  const again = (
    <TextLink onClick={busy ? undefined : run}>
      {busy ? t("찾는 중…", "Finding…", "分析中…", "Đang tìm…", "分析中…", "Mencari…") : t("다시 찾기", "Refresh", "重新分析", "Tìm lại", "もう一度", "Ulangi")}
    </TextLink>
  );

  return (
    <Section title={t("기업이 보는 내 강점", "Strengths employers see", "企业眼中的我的优势", "Điểm mạnh trong mắt NTD", "企業から見た強み", "Kekuatan di mata perusahaan")} aside={cache ? again : undefined}>
      {cache ? (
        <div className={`pb-3 pt-1 transition-opacity ${busy ? "opacity-60" : ""}`}>
          {stale ? (
            <p className="mb-3 text-[14px] font-medium text-[color:var(--v2-accent)]">{t("서류가 바뀌었어요. 다시 찾으면 지금 서류로 뽑아 드려요.", "Your documents changed — refresh to update.", "材料已更新，重新分析即可更新。", "Hồ sơ đã đổi — tìm lại để cập nhật.", "書類が変わりました。もう一度で更新します。", "Dokumen berubah — ulangi untuk memperbarui.")}</p>
          ) : null}
          <ol className="grid gap-2.5 md:grid-cols-3">
            {cache.list.map((s, i) => (
              <li key={i} className="rounded-2xl bg-[color:var(--v2-band)] p-4 md:p-5">
                <p className="text-[13px] font-bold text-[color:var(--v2-accent)]">{i + 1}</p>
                <p className="mt-1 text-[17px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{s.keyword}</p>
                {s.evidence ? <p className="mt-1.5 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{s.evidence}</p> : null}
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] text-[color:var(--v2-faint)]">{t("AI가 내 이력서·자기소개서를 읽고 뽑았어요. 자기소개서와 면접 답의 중심으로 써 보세요.", "Picked by AI from your resume and cover letter. Build your answers around these.", "AI 阅读简历和自我介绍后选出，可作为自我介绍和面试回答的核心。", "AI chọn từ CV và thư. Hãy xoay câu trả lời quanh các điểm này.", "AIが書類から選びました。自己PRや面接の軸にしてみてください。", "Dipilih AI dari dokumenmu. Jadikan inti jawabanmu.")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 pb-3 pt-1 md:flex-row md:items-center md:justify-between">
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("AI가 내 서류를 읽고, 채용 담당자 눈에 띄는 강점 3가지를 뽑아 드려요.", "AI reads your documents and picks 3 strengths recruiters notice.", "AI 阅读你的材料，选出招聘方会注意的 3 个优势。", "AI đọc hồ sơ và chọn 3 điểm mạnh nhà tuyển dụng chú ý.", "AIが書類を読み、採用担当の目に留まる強みを3つ選びます。", "AI membaca dokumenmu dan memilih 3 kekuatan.")}</p>
          <Button size="sm" onClick={run} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? t("읽고 있어요", "Reading…", "读取中", "Đang đọc", "読んでいます", "Membaca") : t("내 강점 찾기", "Find strengths", "找优势", "Tìm điểm mạnh", "強みを探す", "Cari kekuatan")}
          </Button>
        </div>
      )}
      {error ? <p className="pb-3 text-[14px] text-[color:var(--v2-attention)]">{error}</p> : null}
    </Section>
  );
}

// ── 내 스펙에 맞는 공고 ───────────────────────────────
// 관심 직무 공고 수 + 그 안에서 내 스킬과 뜻이 가까운 순 셋(포지션 탐색의 문장 검색과 같은 관련도).
function MatchedJobs({ t, interests, skills }: { t: PlatformT; interests: string[]; skills: string[] }) {
  const { locale } = useLanguage();
  const [state, setState] = useState<{ key: string; total: number; items: PublicPositionListItem[] } | null>(null);
  const key = `${interests.join(",")}|${skills.slice(0, 6).join(",")}|${locale}`;
  useEffect(() => {
    let alive = true;
    const jobRoles = jobCategoriesForInterests(interests);
    const q = skills.slice(0, 6).join(" ");
    Promise.all([
      getPublicPositionsPage({ jobRoles, page: 1, limit: 1, locale }),
      getPublicPositionsPage({ jobRoles, limit: 3, locale, ...(q ? { search: q, sort: "relevance" as const } : { sort: "latest" as const }) })
    ])
      .then(([all, top]) => alive && setState({ key, total: all.total ?? all.items.length, items: top.items }))
      .catch(() => alive && setState({ key, total: 0, items: [] }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const loading = !state || state.key !== key;
  if (!loading && !state.items.length) return null;
  return (
    <Section title={t("내 스펙에 맞는 공고", "Jobs that fit you", "适合我的职位", "Việc hợp với bạn", "自分に合う求人", "Lowongan yang cocok")} aside={<TextLink href="/v2/jobs?tab=interest">{t("전체 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}</TextLink>}>
      {loading ? (
        <RowsSkeleton count={3} />
      ) : (
        <>
          <p className="pb-1 text-[15px] text-[color:var(--v2-ink-3)]">
            {skills.length
              ? t(`관심 직무 공고 ${state.total.toLocaleString()}개 중, 내 스킬과 잘 맞는 순서예요.`, `${state.total.toLocaleString()} jobs in your interests, best skill match first.`, `感兴趣职位共 ${state.total.toLocaleString()} 个，按技能匹配排序。`, `${state.total.toLocaleString()} việc quan tâm, hợp kỹ năng nhất trước.`, `関心職種の求人${state.total.toLocaleString()}件、スキルが合う順です。`, `${state.total.toLocaleString()} lowongan minatmu, paling cocok dulu.`)
              : t(`관심 직무 공고가 ${state.total.toLocaleString()}개 있어요.`, `${state.total.toLocaleString()} jobs in your interests.`, `感兴趣职位共 ${state.total.toLocaleString()} 个。`, `${state.total.toLocaleString()} việc bạn quan tâm.`, `関心職種の求人が${state.total.toLocaleString()}件あります。`, `${state.total.toLocaleString()} lowongan minatmu.`)}
          </p>
          {state.items.map((j) => (
            <Row key={j.id} href={`/talent/jobs/${j.id}`} thumb={{ src: jobPhotoOf(j), fallback: companyOf(j) || j.title }} title={j.title} meta={[companyOf(j), shortPlace(j.workLocation)].filter(Boolean).join(" · ") || undefined} />
          ))}
        </>
      )}
    </Section>
  );
}
