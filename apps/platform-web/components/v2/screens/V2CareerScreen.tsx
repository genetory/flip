"use client";

// v2 내 커리어 — 나에 관한 것을 한곳에: 프로필(링크) · 지원 서류(다음 할 일) · 기업이 보는 내 강점 · 관심 직무 · 내 스펙에 맞는 공고 · 경력 · 내 스펙 · 더 정리할 것.
// 관심 직무 고르기는 기존 팝업(JobInterestModal)을, 서류 편집은 기존 에디터를 그대로 쓴다.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { V2Shell, useProfilePhoto } from "../V2Shell";
import { Band, Button, Chip, Masthead, MastheadSkeleton, Page, PrimaryButton, Row, RowsSkeleton, Section, SectionSkeleton, Spinner, TextLink } from "../ui";
import { companyOf, jobPhotoOf, shortPlace } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { getPublicPositionsPage, getInterestedCompanies, getMyCandidateProfile, updateMyCandidateProfile, updateMyBasicInfo, type CandidateVisaType, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { isForeignNationality } from "../../../lib/nationality";
import { NationalityField } from "../../talent/career/NationalityField";
import { getCareerStrengths, getRoleChecklist, AiQuotaError, type CareerStrength, type RoleChecklistItem } from "../../../lib/resume-maker-client";
import { listMyConnections, type MyConnection } from "../../../lib/candidate-connect-client";
import { V2_ROUTES } from "../V2Shell";
import { Sheet } from "../sheets";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { normalizeUrl } from "../../../lib/talent/resume-doc";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { useResumeDoc, displayMonth, useRenewalDocsStatus, saveResumeDoc, addResumeItem, type ResumeDoc, type ResumeItem } from "../../../lib/talent/resume-doc";
import { useCoverDoc, saveCoverDoc, generateCoverDoc, type CoverDoc } from "../../../lib/talent/cover-doc";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";
import { useCareerHistorySync } from "../../../lib/talent/useCareerHistorySync";
import { sectionLabelOf } from "../../../lib/talent/career-labels";
import type { CareerSection } from "../../../lib/talent/career-chat";
import { JobInterestModal } from "../../talent/jobs/JobInterestModal";
import { V2CareerGuest } from "./V2CareerGuest";

const R = {
  profile: "/v2/profile",
  resume: "/talent/career/resume/editor",
  resumePreview: "/talent/career/resume/preview",
  cover: "/talent/career/cover/editor",
  coverPreview: "/talent/career/cover/preview",
  resumes: "/talent/career/resumes",
  coverLetters: "/talent/career/cover-letters",
  experiences: "/v2/experiences",
  history: "/v2/history",
  diagnosis: "/talent/career/resume/diagnosis"
};

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
export function splitList(text: string): string[] {
  return text
    .split(/[,，、\n·]|\s\/\s/)
    .map((x) => x.trim())
    .filter(Boolean);
}

export function V2CareerScreen() {
  return (
    <V2Shell>
      <CareerGate />
    </V2Shell>
  );
}

/** 로그인 여부로 갈린다 — 로그인 전엔 둘러보기(V2CareerGuest), 로그인하면 내 커리어. 확인 중엔 화면 모양만. */
function CareerGate() {
  const { isReady, isAuthenticated } = useAuthSession();
  if (!isReady)
    return (
      <Page>
        <MastheadSkeleton />
        <SectionSkeleton />
      </Page>
    );
  return isAuthenticated ? <Career /> : <V2CareerGuest />;
}

function Career() {
  const t = usePlatformT();
  useCareerHistorySync();
  const info = useBasicInfo();
  const ready = isBasicInfoComplete(info);
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const interests = useJobInterests();
  const { user } = useAuthSession();
  const photo = useProfilePhoto(user ?? null);
  const [interestOpen, setInterestOpen] = useState(false);
  const [tab, setTab] = useState<"prep" | "me">("prep");
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

      {/* 지원 준비(서류·관심 직무·맞는 공고) / 내 프로필(강점·경력·스펙) — 한 화면이 너무 길지 않게 둘로 나눈다.
          둘 다 그려 두고 숨기기만 해서, 탭을 오가도 불러온 공고·강점이 그대로 남는다. */}
      <div role="tablist" className="flex gap-2 px-5 pb-6">
        {(
          [
            ["prep", t("지원 준비", "Get ready", "求职准备", "Chuẩn bị", "応募準備", "Persiapan")],
            ["me", t("내 프로필", "My profile", "我的档案", "Hồ sơ", "プロフィール", "Profil saya")]
          ] as const
        ).map(([k, label]) => (
          <Chip key={k} active={tab === k} onClick={() => setTab(k)}>
            {label}
          </Chip>
        ))}
      </div>

      <div hidden={tab !== "prep"}>
        <VisaCard t={t} slot="ask" />

        <Section
          title={t("관심 직무", "Job interests", "感兴趣的职位", "Nghề quan tâm", "関心職種", "Minat pekerjaan")}
        >
          {/* 맞는 공고·이 직무에 필요한 것이 모두 여기서 고른 직무로 정해진다 — 눈에 띄게 연파랑 카드로. */}
          <div className="mb-2 rounded-2xl bg-[color:var(--v2-accent-weak)] p-4 md:p-5">
            {interests.length ? (
              <div className="flex flex-wrap gap-2">
                {interests.map((r) => (
                  <button key={r} type="button" onClick={() => setInterestOpen(true)} className="inline-flex h-9 items-center rounded-full bg-white px-3.5 text-[15px] font-semibold text-[color:var(--v2-accent)] transition hover:opacity-80">
                    {jobTaxonomyLabelOf(t, r)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[16px] font-bold text-[color:var(--v2-ink)]">{t("관심 직무를 골라 주세요", "Pick your job interests", "请选择感兴趣的职位", "Chọn nghề bạn quan tâm", "関心職種を選んでください", "Pilih minat pekerjaan")}</p>
            )}
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[13px] leading-[1.5] text-[color:var(--v2-ink-3)]">{t("고른 직무로 맞는 공고와 이 직무에 필요한 것을 골라 드려요.", "We pick matching jobs and what the role needs from these.", "将根据所选职位推荐职位和所需条件。", "Dựa vào đây để gợi ý việc làm và yêu cầu.", "選んだ職種で求人と必要なものを選びます。", "Dipakai untuk lowongan dan kebutuhan peran.")}</p>
              <Button size="sm" variant={interests.length ? "white" : "primary"} onClick={() => setInterestOpen(true)}>
                {interests.length ? t("바꾸기", "Change", "更改", "Đổi", "変更", "Ubah") : t("고르기", "Choose", "选择", "Chọn", "選ぶ", "Pilih")}
              </Button>
            </div>
          </div>
        </Section>

        <Section title={t("지원 서류", "Documents", "申请材料", "Hồ sơ ứng tuyển", "応募書類", "Dokumen lamaran")}>
          {/* 모바일은 한 줄에 하나 — 반 폭이면 [미리보기][수정하기]가 두 줄로 꺾인다. */}
          <div className="grid grid-cols-1 gap-3 pb-2 md:grid-cols-2">
            <DocStatusCard t={t} kind="resume" resume={resume} cover={cover} />
            <DocStatusCard t={t} kind="cover" resume={resume} cover={cover} />
          </div>
        </Section>

        <VisaCard t={t} slot="card" />

        {interests.length ? <MatchedJobs t={t} interests={interests} skills={skills} cover={cover} /> : null}
        {ready && interests.length && items.length >= 2 ? <RoleChecklist t={t} interests={interests} resume={resume} cover={cover} /> : null}

        <CompanyLinks t={t} />

        <Section title={t("더 정리하기", "More", "更多整理", "Sắp xếp thêm", "さらに整理", "Lainnya")}>
          <Row href={R.profile} lead="🙋" title={t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar")} meta={[info.realName, info.email].filter(Boolean).join(" · ") || t("이름·연락처", "Name & contact", "姓名·联系方式", "Tên & liên hệ", "名前・連絡先", "Nama & kontak")} />
          <Row href={R.experiences} lead="🧩" title={t("경험 정리", "Experiences", "经历整理", "Kinh nghiệm", "経験の整理", "Pengalaman")} meta={t("알바·프로젝트·동아리를 이력서 재료로", "Turn jobs, projects, and clubs into resume material", "把兼职、项目、社团整理成简历素材", "Biến việc làm thêm, dự án thành chất liệu CV", "バイト・プロジェクトを履歴書の材料に", "Jadikan kerja & proyek bahan CV")} />
          <Row href={R.resumes} lead="🗂️" title={t("저장한 서류", "Saved documents", "已保存的材料", "Hồ sơ đã lưu", "保存した書類", "Dokumen tersimpan")} meta={t("버전별 이력서·자기소개서", "Resume and cover letter versions", "各版本的简历和自我介绍", "Các phiên bản CV và thư", "バージョン別の履歴書・自己PR", "Versi CV dan surat")} />
          <Row href={R.history} lead="📝" title={t("커리어 기록", "Career log", "职业记录", "Nhật ký", "キャリア記録", "Catatan karier")} meta={t("지금까지 적은 기록 전체", "Everything you've logged", "迄今为止的全部记录", "Tất cả ghi chép", "これまでの記録すべて", "Semua catatan")} />
        </Section>

      </div>
      <div hidden={tab !== "me"}>
        {ready && items.length >= 2 ? <Strengths t={t} resume={resume} cover={cover} interests={interests.map((r) => jobTaxonomyLabelOf(t, r))} /> : null}

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

      </div>

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

/** 글에 표기가 있나 — 영문·숫자 표기는 단어 경계로(Go 가 Google 에 걸리지 않게), 한글은 띄어쓰기 무시. 서버 hasTerm 과 같은 규칙. */
export function termIn(text: string, term: string): boolean {
  const a = term.trim();
  if (!a) return false;
  if (/^[\x00-\x7F]+$/.test(a)) {
    const esc = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
    return new RegExp(`(^|[^A-Za-z0-9+#])${esc}(?![A-Za-z0-9+#])`, "i").test(text);
  }
  return text.replace(/\s+/g, "").toLowerCase().includes(a.replace(/\s+/g, "").toLowerCase());
}

function hostOf(url: string): string {
  try {
    return new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ── 기업이 보는 내 강점 3가지 ────────────────────────────
// 누를 때만 AI 를 부른다. 결과는 이 브라우저에 서류 수정 시각과 함께 기억 — 서류가 바뀌었을 때만 '다시 찾기'가 보인다
// (같은 서류로 다시 뽑아도 결과가 달라질 이유가 없어서).
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
  const coverKeywords = cover?.keywords ?? [];
  // 자기소개서 '필수 소재'(CoverDoc.keywords, 최대 10개)에 강점을 더한다 — 에디터의 AI 자소서가 반드시 녹여 쓰는 소재.
  const addKeyword = (k: string) => {
    const base = cover ?? generateCoverDoc();
    saveCoverDoc({ ...base, keywords: [...new Set([...(base.keywords ?? []), k])].slice(0, 10) }, { label: t("강점을 소재로 추가", "Added strength", "添加优势素材", "Thêm điểm mạnh", "強みを追加", "Tambah kekuatan") });
  };

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
    <Section title={t("기업이 보는 내 강점", "Strengths employers see", "企业眼中的我的优势", "Điểm mạnh trong mắt NTD", "企業から見た強み", "Kekuatan di mata perusahaan")} aside={stale ? again : undefined}>
      {cache ? (
        <div className={`pb-3 pt-1 transition-opacity ${busy ? "opacity-60" : ""}`}>
          {stale ? (
            <p className="mb-3 text-[14px] font-medium text-[color:var(--v2-accent)]">{t("서류가 바뀌었어요. 다시 찾으면 지금 서류로 뽑아 드려요.", "Your documents changed — refresh to update.", "材料已更新，重新分析即可更新。", "Hồ sơ đã đổi — tìm lại để cập nhật.", "書類が変わりました。もう一度で更新します。", "Dokumen berubah — ulangi untuk memperbarui.")}</p>
          ) : null}
          <ol className="grid gap-2.5 md:grid-cols-3">
            {cache.list.map((s, i) => (
              <li key={i} className="flex flex-col rounded-2xl bg-[color:var(--v2-band)] p-4 md:p-5">
                <p className="text-[13px] font-bold text-[color:var(--v2-accent)]">{i + 1}</p>
                <p className="mt-1 text-[17px] font-bold leading-[1.4] text-[color:var(--v2-ink)]">{s.keyword}</p>
                {s.evidence ? <p className="mt-1.5 flex-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{s.evidence}</p> : <span className="flex-1" />}
                {/* 강점을 행동으로 — 자기소개서 '필수 소재'에 넣거나(에디터의 AI 자소서가 꼭 녹여 쓴다), 모의 면접으로. */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {coverKeywords.includes(s.keyword) ? (
                    <Button size="sm" variant="white" href={R.cover}>
                      {t("✓ 자소서에 넣음", "✓ In cover letter", "✓ 已加入", "✓ Đã thêm", "✓ 追加済み", "✓ Ditambahkan")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="white" onClick={() => addKeyword(s.keyword)}>
                      {t("자소서 소재로", "Use in cover", "用于自我介绍", "Dùng cho thư", "自己PRに使う", "Pakai di surat")}
                    </Button>
                  )}
                  <Button size="sm" variant="white" href={V2_ROUTES.interviews}>
                    {t("면접 연습", "Practice", "面试练习", "Luyện PV", "面接練習", "Latihan")}
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[13px] text-[color:var(--v2-faint)]">{t("AI가 내 이력서·자기소개서를 읽고 뽑았어요. 자기소개서와 면접 답의 중심으로 써 보세요.", "Picked by AI from your resume and cover letter. Build your answers around these.", "AI 阅读简历和自我介绍后选出，可作为自我介绍和面试回答的核心。", "AI chọn từ CV và thư. Hãy xoay câu trả lời quanh các điểm này.", "AIが書類から選びました。自己PRや面接の軸にしてみてください。", "Dipilih AI dari dokumenmu. Jadikan inti jawabanmu.")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 pb-3 pt-2 text-center">
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("AI가 내 서류를 읽고, 채용 담당자 눈에 띄는 강점 3가지를 뽑아 드려요.", "AI reads your documents and picks 3 strengths recruiters notice.", "AI 阅读你的材料，选出招聘方会注意的 3 个优势。", "AI đọc hồ sơ và chọn 3 điểm mạnh nhà tuyển dụng chú ý.", "AIが書類を読み、採用担当の目に留まる強みを3つ選びます。", "AI membaca dokumenmu dan memilih 3 kekuatan.")}</p>
          <Button onClick={run} disabled={busy}>
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
function MatchedJobs({ t, interests, skills, cover }: { t: PlatformT; interests: string[]; skills: string[]; cover: CoverDoc | null }) {
  const { locale } = useLanguage();
  const router = useRouter();
  // [자소서 맞추기] — 자기소개서의 지원 회사·공고 본문을 이 공고로 채우고 에디터로 간다(에디터의 AI 자소서가 공고에 1:1로 맞춰 쓴다).
  // 이미 다른 회사로 맞춰 둔 게 있으면 v2 시트로 한 번 묻는다.
  const [confirmJob, setConfirmJob] = useState<PublicPositionListItem | null>(null);
  const applyTailor = (j: PublicPositionListItem) => {
    const company = companyOf(j);
    const base = cover ?? generateCoverDoc();
    const jd = [j.title, j.requiredQualifications ? `[자격 요건]\n${j.requiredQualifications}` : "", j.preferredQualifications ? `[우대 사항]\n${j.preferredQualifications}` : ""].filter(Boolean).join("\n\n").slice(0, 4000);
    saveCoverDoc({ ...base, companyName: company, jobText: jd }, { label: t(`${company} 공고에 맞춤`, `Tailored to ${company}`, `针对${company}`, `Theo ${company}`, `${company}向け`, `Untuk ${company}`), force: true }); // force — 바꾸기 전 버전을 꼭 남겨 되돌릴 수 있게
    router.push(R.cover);
  };
  const tailor = (j: PublicPositionListItem) => {
    const current = cover?.companyName?.trim();
    if (current && current !== companyOf(j)) setConfirmJob(j);
    else applyTailor(j);
  };
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
          {state.items.map((j) => {
            // 왜 맞는지 — 공고 제목·자격 요건에 그대로 나오는 내 스킬(최대 3개 — 넘치면 '일치'가 잘린다).
            const text = `${j.title}\n${j.requiredQualifications ?? ""}\n${j.preferredQualifications ?? ""}`;
            const hits = skills.filter((k) => termIn(text, k)).slice(0, 3);
            const photo = jobPhotoOf(j);
            return (
              <div key={j.id} className="flex items-start gap-3.5 py-3">
                <Link href={`/v2/jobs/${j.id}`} className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[color:var(--v2-band)] text-[15px] font-bold text-[color:var(--v2-muted)]">
                  {photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (companyOf(j) || j.title).slice(0, 1)
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/v2/jobs/${j.id}`} className="block transition hover:opacity-70">
                    <span className="block truncate text-[17px] font-semibold leading-[1.45] text-[color:var(--v2-ink)]">{j.title}</span>
                    <span className="mt-0.5 block truncate text-[14px] text-[color:var(--v2-faint)]">{[companyOf(j), shortPlace(j.workLocation)].filter(Boolean).join(" · ")}</span>
                    {hits.length ? (
                      <span className="mt-0.5 block truncate text-[13px] font-semibold text-[color:var(--v2-accent)]">
                        {t(`${hits.join(" · ")} 일치`, `Matches ${hits.join(" · ")}`, `${hits.join(" · ")} 匹配`, `Khớp ${hits.join(" · ")}`, `${hits.join("・")} 一致`, `Cocok ${hits.join(" · ")}`)}
                      </span>
                    ) : null}
                  </Link>
                  <button type="button" onClick={() => tailor(j)} className="mt-1.5 inline-flex items-center gap-0.5 text-[13px] font-semibold text-[color:var(--v2-ink-3)] underline-offset-2 transition hover:text-[color:var(--v2-accent)] hover:underline">
                    {t("이 공고에 맞춰 자소서 쓰기", "Tailor my cover letter", "按此职位写自我介绍", "Viết thư theo tin này", "この求人に合わせて自己PR", "Sesuaikan surat lamaran")}
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </>
      )}
      {confirmJob ? (
        <Sheet
          title={t("자기소개서 회사를 바꿀까요?", "Switch the target company?", "要更换目标公司吗？", "Đổi công ty mục tiêu?", "応募先を変えますか？", "Ganti perusahaan tujuan?")}
          onClose={() => setConfirmJob(null)}
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="neutral" full onClick={() => setConfirmJob(null)}>
                {t("그대로 두기", "Keep", "保持不变", "Giữ nguyên", "そのまま", "Biarkan")}
              </Button>
              <Button full onClick={() => applyTailor(confirmJob)}>
                {t("바꾸기", "Switch", "更换", "Đổi", "変える", "Ganti")}
              </Button>
            </div>
          }
        >
          <p className="text-[16px] leading-[1.65] text-[color:var(--v2-ink-2)]">
            {t(
              `지금 자기소개서는 '${cover?.companyName ?? ""}'에 맞춰져 있어요. '${companyOf(confirmJob)}' 공고로 바꾸면 지원 회사와 공고 내용이 바뀌어요.`,
              `Your cover letter targets '${cover?.companyName ?? ""}'. Switching to '${companyOf(confirmJob)}' replaces the company and job text.`,
              `当前自我介绍针对'${cover?.companyName ?? ""}'。改为'${companyOf(confirmJob)}'会替换公司和职位内容。`,
              `Thư đang nhắm '${cover?.companyName ?? ""}'. Đổi sang '${companyOf(confirmJob)}' sẽ thay công ty và nội dung tin.`,
              `今の自己PRは「${cover?.companyName ?? ""}」向けです。「${companyOf(confirmJob)}」に変えると会社と求人内容が置き換わります。`,
              `Surat ditujukan ke '${cover?.companyName ?? ""}'. Mengganti ke '${companyOf(confirmJob)}' akan mengubah perusahaan dan teks lowongan.`
            )}
          </p>
          <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{t("이미 쓴 답변은 그대로 남고, 지금 버전은 '저장한 서류'에서 되돌릴 수 있어요.", "Your answers stay. You can restore this version from Saved documents.", "已写的回答会保留，可在'已保存的材料'中恢复当前版本。", "Câu trả lời vẫn giữ; có thể khôi phục phiên bản này trong Hồ sơ đã lưu.", "書いた回答は残り、今の版は「保存した書類」から戻せます。", "Jawaban tetap; versi ini bisa dipulihkan dari Dokumen tersimpan.")}</p>
        </Sheet>
      ) : null}
    </Section>
  );
}

// ── 이 직무에 필요한 것 ────────────────────────────
// 관심 직무 '신입' 공고(경력 3년 이상·시니어 공고는 뺀다)의 자격 요건에 자주 나온 기술·경험·자격증·어학 +
// 한국에서 이 직무 신입이 흔히 준비하는 것(모델 지식)을 체크리스트로 — 내 서류에 없는 것부터(서버 role-checklist).
// 강점과 같이 누를 때만 AI 를 부르고, 직무별로 서류 수정 시각과 함께 이 브라우저에 기억한다.
// 비교 방식이 바뀌면 키를 올린다 — 예전 방식 결과가 남아 보이지 않게.
const CHECKLIST_KEY = "aply.v2.career.checklist.v2";
type ChecklistResult = { sig: string; total: number; items: RoleChecklistItem[]; scope?: "junior" | "early" | "all" | "none" };

/** 공고가 요구하는 최소 연차(못 찾으면 0). "3년 이상", "3~5년", "3년차", "경력 3년". */
function minYears(j: PublicPositionListItem): number {
  const text = `${j.title}\n${j.requiredQualifications ?? ""}`;
  const years = [...text.matchAll(/(\d{1,2})\s*(?:년|years?)\s*(?:이상|↑|\+|or more)|(\d{1,2})\s*[~\-]\s*\d{1,2}\s*(?:년|years?)|(\d{1,2})\s*년차|경력\s*(\d{1,2})\s*년/gi)].map((m) => Number(m[1] ?? m[2] ?? m[3] ?? m[4]));
  return years.length ? Math.min(...years) : 0;
}
const SENIOR_TITLE = /시니어|senior|리드|lead|팀장|head\b|principal|책임|수석|staff/i;
export const JUNIOR_TITLE = /신입|경력\s*무관|주니어|junior|new\s*grad|인턴|intern/i;

/** 신입이 지원할 만한 공고인가 — 제목에 신입·인턴 표시가 있거나, 시니어 제목이 아니고 경력 3년 이상을 요구하지 않는 공고.
 *  employmentType 은 보지 않는다 — 외부 수집 공고는 '무급 인턴'으로 잘못 들어간 경우가 많다(시니어 공고 포함). */
export function isJuniorJob(j: PublicPositionListItem): boolean {
  if (JUNIOR_TITLE.test(j.title)) return true;
  return !SENIOR_TITLE.test(j.title) && minYears(j) < 3;
}

/** 직무 이름이 공고에 들어 있나 — 한글·영문 직무 이름의 낱말로(개발·Development 같은 흔한 말은 빼고). */
function roleMatcher(t: PlatformT, role: string): (text: string) => boolean {
  const en = jobTaxonomyLabelOf(((_ko: string, e: string) => e) as PlatformT, role);
  const keys = [...new Set([jobTaxonomyLabelOf(t, role), role, en].flatMap((l) => l.split(/[\/·&,()\s]+/)))]
    .map((k) => k.trim())
    .filter((k) => k.length >= 2 && !/^(개발|개발자|development|developer|and|engineer|엔지니어|직무|기타)$/i.test(k));
  const norm = (x: string) => x.toLowerCase().replace(/[\s\-_.]/g, "");
  return (text) =>
    keys.some((k) => (/^[A-Za-z]{1,3}$/.test(k) ? new RegExp(`(^|[^A-Za-z])${k}(?![A-Za-z])`, "i").test(text) : norm(text).includes(norm(k))));
}

export function readChecklists(): Record<string, ChecklistResult> {
  try {
    const raw = window.localStorage.getItem(CHECKLIST_KEY);
    const v = raw ? (JSON.parse(raw) as Record<string, ChecklistResult>) : null;
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function categoryLabel(t: PlatformT, c: RoleChecklistItem["category"]): string {
  if (c === "certificate") return t("자격증", "Cert", "证书", "Chứng chỉ", "資格", "Sertifikat");
  if (c === "experience") return t("경험", "Experience", "经验", "Kinh nghiệm", "経験", "Pengalaman");
  if (c === "language") return t("어학", "Language", "语言", "Ngoại ngữ", "語学", "Bahasa");
  return t("스킬", "Skill", "技能", "Kỹ năng", "スキル", "Keahlian");
}

export function RoleChecklist({ t, interests, resume, cover }: { t: PlatformT; interests: string[]; resume: ResumeDoc | null; cover: CoverDoc | null }) {
  const sig = `${resume?.updatedAt ?? 0}:${cover?.updatedAt ?? 0}`;
  const [role, setRole] = useState(interests[0]);
  const current = interests.includes(role) ? role : interests[0];
  const [saved, setSaved] = useState<Record<string, ChecklistResult>>(() => readChecklists());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const result = saved[current] ?? null;
  const roleLabel = jobTaxonomyLabelOf(t, current);

  const run = async () => {
    const profile = profileText(t, resume, cover);
    setBusy(true);
    setError(null);
    try {
      // 같은 분류(예: 개발)에 백엔드·프론트엔드가 함께 묶여 있어서, 직무 이름으로 관련도순 검색해 그 직무 공고를 앞에 세운다.
      // locale 은 넘기지 않는다 — 원문(한국어) 자격 요건으로 비교.
      const page = await getPublicPositionsPage({ jobRoles: jobCategoriesForInterests([current]), search: roleLabel, sort: "relevance", limit: 100 });
      const withReq = page.items.filter((j) => (j.requiredQualifications ?? "").trim() || (j.preferredQualifications ?? "").trim());
      // 그 직무 공고만 — 제목에 직무 이름이 든 것, 모자라면(8곳 미만) 자격 요건에 든 것까지.
      const isRole = roleMatcher(t, current);
      const byTitle = withReq.filter((j) => isRole(j.title));
      const roleJobs = byTitle.length >= 8 ? byTitle : withReq.filter((j) => isRole(`${j.title}\n${j.requiredQualifications ?? ""}`));
      // 신입 공고가 충분하면(15곳 이상) 신입만, 아니면 신입~5년 차(시니어·리드 제외) — 기술 스택은 연차로 크게 갈리지 않고,
      // 표본이 너무 작으면 한두 공고의 요건이 '자주 나온 것'처럼 보인다. 그래도 모자라면 전부. 화면에 범위를 알린다.
      const juniors = roleJobs.filter(isJuniorJob);
      const early = roleJobs.filter((j) => JUNIOR_TITLE.test(j.title) || (!SENIOR_TITLE.test(j.title) && minYears(j) <= 5));
      // 그 직무 공고가 3곳도 안 되면 공고 없이 — 신입이 흔히 준비하는 것(모델 지식)만으로 비교한다.
      const scope: "junior" | "early" | "all" | "none" = roleJobs.length < 3 ? "none" : juniors.length >= 15 ? "junior" : early.length >= 3 ? "early" : "all";
      const pool = scope === "junior" ? juniors : scope === "early" ? early : scope === "all" ? roleJobs : [];
      const jobs = pool.slice(0, 40).map((j) => ({ title: j.title.slice(0, 200), required: (j.requiredQualifications ?? "").slice(0, 800) || undefined, preferred: (j.preferredQualifications ?? "").slice(0, 600) || undefined }));
      const r = await getRoleChecklist({ role: roleLabel, profile, jobs });
      const next = { ...readChecklists(), [current]: { sig, total: r.total, items: r.items, scope } };
      setSaved(next);
      try {
        window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {
        /* 저장 못 해도 화면엔 보인다 */
      }
    } catch (e) {
      setError(
        e instanceof AiQuotaError
          ? t("오늘은 더 비교할 수 없어요. 내일 다시 해 보세요.", "Daily limit reached. Try again tomorrow.", "今天已达上限，明天再试。", "Đã hết lượt hôm nay.", "本日の上限です。明日お試しください。", "Batas harian tercapai.")
          : t("비교하지 못했어요. 잠시 후 다시 해 보세요.", "Couldn't compare. Try again soon.", "未能比较，请稍后再试。", "Không so sánh được. Thử lại sau.", "比較できませんでした。後でもう一度。", "Gagal. Coba lagi nanti.")
      );
    } finally {
      setBusy(false);
    }
  };

  // [있어요]로 방금 넣은 항목은 제자리에 둔다 — '갖춤'으로 바로 내려가면 접힌 목록에서 사라져 되돌리기를 못 누른다.
  const [added, setAdded] = useState<Record<string, ResumeDoc>>({});
  const sinks = (x: RoleChecklistItem) => x.have && !added[x.name];
  const sorted = result ? [...result.items].sort((a, b) => Number(sinks(a)) - Number(sinks(b)) || b.count - a.count) : [];
  const haveCount = sorted.filter((x) => x.have).length;

  // [있어요] — 해 봤는데 이력서에 안 적어 '없음'으로 나온 것을 이력서에 바로 넣는다(확인 없이, 그 자리에서 되돌리기).
  // 스킬은 첫 스킬 항목 끝에 이어 붙이고(없으면 새로), 자격증·어학은 항목을 하나 더한다. 경험은 글로 써야 해서 에디터로 보낸다.
  const markHave = (name: string, have: boolean) => {
    if (!result) return;
    const next = { ...readChecklists(), [current]: { ...result, items: result.items.map((x) => (x.name === name ? { ...x, have } : x)) } };
    setSaved(next);
    try {
      window.localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
    } catch {
      /* 저장 못 해도 화면엔 보인다 */
    }
  };
  const addToResume = (x: RoleChecklistItem) => {
    const base: ResumeDoc = resume ?? { targetRole: "", items: [], createdAt: Date.now(), updatedAt: Date.now() };
    let next: ResumeDoc;
    const skill = base.items.find((i) => i.section === "skill");
    if (x.category === "skill" && skill) {
      next = { ...base, items: base.items.map((i) => (i.id === skill.id ? { ...i, text: i.text.trim() ? `${i.text.trim()}, ${x.name}` : x.name } : i)) };
    } else {
      next = addResumeItem(base, x.category === "skill" ? "skill" : x.category === "certificate" ? "certificate" : "language", x.name).doc;
    }
    saveResumeDoc(next, { label: t("이 직무에 필요한 것에서 추가", "Added from role needs", "从职位所需添加", "Thêm từ yêu cầu", "必要なものから追加", "Ditambah dari kebutuhan") });
    setAdded((m) => ({ ...m, [x.name]: base }));
    markHave(x.name, true);
  };
  const undo = (x: RoleChecklistItem) => {
    const prev = added[x.name];
    if (!prev) return;
    saveResumeDoc(prev);
    setAdded((m) => {
      const n = { ...m };
      delete n[x.name];
      return n;
    });
    markHave(x.name, false);
  };

  return (
    <Section
      title={t("직무별 준비 체크리스트", "Role checklist", "职位准备清单", "Checklist theo ngành", "職種別チェックリスト", "Checklist peran")}
      // 강점과 달리 서류가 그대로여도 다시 비교할 수 있다 — 공고는 계속 바뀐다.
      aside={
        result ? (
          <TextLink onClick={busy ? undefined : run}>
            {busy ? t("비교 중…", "Comparing…", "比较中…", "Đang so sánh…", "比較中…", "Membandingkan…") : t("다시 비교", "Refresh", "重新比较", "So sánh lại", "もう一度", "Ulangi")}
          </TextLink>
        ) : undefined
      }
    >
      {interests.length > 1 ? (
        <div className="-mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          {interests.map((r) => (
            <Chip
              key={r}
              active={r === current}
              onClick={() => {
                setRole(r);
                setAll(false);
              }}
            >
              {jobTaxonomyLabelOf(t, r)}
            </Chip>
          ))}
        </div>
      ) : null}

      {result ? (
        <div className={`pb-3 transition-opacity ${busy ? "opacity-60" : ""}`}>
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
            {result.scope === "none" || !result.total
              ? t(`${roleLabel} 신입들이 흔히 준비하는 것을 내 서류와 비교했어요.`, `Compared what entry-level ${roleLabel} applicants usually prepare with your documents.`, `将${roleLabel}新人常准备的条件与你的材料作了比较。`, `Đã so những gì người mới vào ${roleLabel} thường chuẩn bị với hồ sơ của bạn.`, `${roleLabel}の新卒がよく準備するものを書類と比べました。`, `Membandingkan yang biasa disiapkan pemula ${roleLabel} dengan dokumenmu.`)
              : t(
                  `${roleLabel} ${result.scope === "junior" ? "신입" : result.scope === "early" ? "신입~5년 차" : ""} 공고 ${result.total}곳의 요건과 신입들이 흔히 준비하는 것을 내 서류와 비교했어요.`.replace("  ", " "),
                  `Compared ${result.total} ${roleLabel} jobs and what entry-level applicants usually prepare with your documents.`,
                  `将 ${result.total} 个${roleLabel}职位的要求和新人常准备的条件与你的材料作了比较。`,
                  `Đã so yêu cầu của ${result.total} tin ${roleLabel} và những gì người mới thường chuẩn bị với hồ sơ của bạn.`,
                  `${roleLabel}の求人${result.total}件の要件と新卒がよく準備するものを書類と比べました。`,
                  `Membandingkan syarat ${result.total} lowongan ${roleLabel} dan persiapan umum pemula dengan dokumenmu.`
                )}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--v2-band)]" aria-hidden>
              <div className="h-full rounded-full bg-[color:var(--v2-good)]" style={{ width: `${sorted.length ? Math.round((haveCount / sorted.length) * 100) : 0}%` }} />
            </div>
            <span className="shrink-0 text-[14px] font-semibold text-[color:var(--v2-ink-2)]">
              {t(`${sorted.length}개 중 ${haveCount}개 갖춤`, `${haveCount} of ${sorted.length}`, `${sorted.length} 项中具备 ${haveCount} 项`, `${haveCount}/${sorted.length}`, `${sorted.length}件中${haveCount}件`, `${haveCount} dari ${sorted.length}`)}
            </span>
          </div>
          {!sorted.length ? <p className="mt-4 text-[14px] text-[color:var(--v2-muted)]">{t("공고마다 요구가 달라 자주 나오는 요건을 찾지 못했어요.", "No requirement came up often enough.", "各职位要求不同，未找到常见要求。", "Không có yêu cầu nào lặp lại đủ nhiều.", "よく出る要件は見つかりませんでした。", "Tidak ada syarat yang sering muncul.")}</p> : null}
          <ul className="mt-3">
            {(all ? sorted : sorted.slice(0, 3)).map((x) => (
              <li key={x.name} className="flex items-start gap-3 border-b border-[color:var(--v2-band)] py-3.5 last:border-b-0">
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${x.have ? "bg-[color:var(--v2-good)] text-white" : "border-2 border-[color:var(--v2-line)]"}`} aria-label={x.have ? t("갖춤", "Have", "具备", "Có", "あり", "Ada") : t("없음", "Missing", "缺少", "Chưa có", "なし", "Belum")}>
                  {x.have ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12.5 10 17 19 7" />
                    </svg>
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[16px] font-semibold leading-[1.45] ${x.have ? "text-[color:var(--v2-muted)]" : "text-[color:var(--v2-ink)]"}`}>{x.name}</p>
                  <p className="mt-0.5 text-[13px] text-[color:var(--v2-faint)]">
                    {categoryLabel(t, x.category)} ·{" "}
                    {x.count
                      ? t(`공고 ${result.total}곳 중 ${x.count}곳`, `${x.count} of ${result.total} jobs`, `${result.total} 个职位中 ${x.count} 个`, `${x.count}/${result.total} tin`, `${result.total}件中${x.count}件`, `${x.count} dari ${result.total} lowongan`)
                      : t("신입들이 흔히 준비해요", "Common for newcomers", "新人常准备", "Người mới hay chuẩn bị", "新卒がよく準備", "Umum bagi pemula")}
                  </p>
                  {!x.have && x.tip ? <p className="mt-1 text-[14px] leading-[1.55] text-[color:var(--v2-ink-3)]">{x.tip}</p> : null}
                  {added[x.name] ? (
                    <p className="mt-1 text-[13px] text-[color:var(--v2-good)]">
                      {t("이력서에 추가했어요", "Added to your resume", "已添加到简历", "Đã thêm vào CV", "履歴書に追加しました", "Ditambahkan ke CV")} ·{" "}
                      <button type="button" onClick={() => undo(x)} className="font-semibold text-[color:var(--v2-muted)] underline underline-offset-2 hover:text-[color:var(--v2-ink-2)]">
                        {t("되돌리기", "Undo", "撤销", "Hoàn tác", "元に戻す", "Urungkan")}
                      </button>
                    </p>
                  ) : null}
                </div>
                {!x.have ? (
                  x.category === "experience" ? (
                    <Button size="sm" variant="neutral" href={R.resume}>
                      {t("적으러 가기", "Write it", "去填写", "Viết", "書きに行く", "Tulis")}
                    </Button>
                  ) : (
                    <Button size="sm" variant="neutral" onClick={() => addToResume(x)}>
                      {t("있어요", "I have it", "我有", "Tôi có", "あります", "Punya")}
                    </Button>
                  )
                ) : null}
              </li>
            ))}
          </ul>
          {sorted.length > 3 ? (
            <button type="button" onClick={() => setAll((v) => !v)} className="mt-1 h-10 text-[14px] font-semibold text-[color:var(--v2-muted)] transition hover:text-[color:var(--v2-ink-2)]">
              {all ? t("접기", "Show less", "收起", "Thu gọn", "閉じる", "Tutup") : t(`${sorted.length - 3}개 더 보기`, `Show ${sorted.length - 3} more`, `再看 ${sorted.length - 3} 项`, `Xem thêm ${sorted.length - 3}`, `あと${sorted.length - 3}件`, `${sorted.length - 3} lagi`)}
            </button>
          ) : null}
          <p className="mt-2 text-[13px] text-[color:var(--v2-faint)]">{t("이미 있는데 없다고 나오면, 이력서에 적어 두면 다음 비교부터 반영돼요.", "Already have one marked missing? Add it to your resume.", "已具备却显示缺少？写进简历，下次比较即可反映。", "Đã có mà báo thiếu? Hãy thêm vào CV.", "持っているのに「なし」なら、履歴書に書いてください。", "Sudah punya tapi tertulis belum? Tambahkan ke CV.")}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-8 pb-3 pt-2 text-center">
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
            {t(
              `${roleLabel} 공고에 자주 나오는 것과 신입들이 흔히 준비하는 기술·경험·자격증·어학을 모아, 내 서류에 없는 것부터 짚어 드려요.`,
              `See the skills, experience, certs, and languages entry-level ${roleLabel} jobs actually ask for — missing ones first.`,
              `汇总${roleLabel}新人职位中常见的技术、经验、证书、语言，先指出你缺少的。`,
              `Xem kỹ năng, kinh nghiệm, chứng chỉ, ngoại ngữ mà tin ${roleLabel} cho người mới hay yêu cầu — thiếu gì trước.`,
              `${roleLabel}の新卒求人によく出る技術・経験・資格・語学を集め、足りないものから示します。`,
              `Lihat keahlian, pengalaman, sertifikat, dan bahasa yang diminta lowongan pemula ${roleLabel}.`
            )}
          </p>
          <Button onClick={run} disabled={busy}>
            {busy ? <Spinner /> : null}
            {busy ? t("비교하고 있어요", "Comparing…", "比较中", "Đang so sánh", "比較中", "Membandingkan") : t("내 서류와 비교", "Compare", "与我的材料比较", "So sánh", "書類と比べる", "Bandingkan")}
          </Button>
        </div>
      )}
      {error ? <p className="pb-3 text-[14px] text-[color:var(--v2-attention)]">{error}</p> : null}
    </Section>
  );
}

// ── 지원 서류 카드 ──────────────────────────────────────
// 완성도 % 대신 — 채우는 중엔 필수 항목 막대, 다 채우면 쓴 양·수정 시각. %는 '칸이 있나'만 봐서 믿기 어렵다.
// 내용 점검(AI)은 에디터의 전체 점검에서 한다 — 카드에선 부르지 않는다.

/** 필수 항목 — 이력서: 학력·경력/프로젝트·스킬·어학·한 줄 소개.
 *  자기소개서는 문항이 회사마다 달라(사용자가 바꾸고 지운다) 정해진 필수가 없다 — 한 문항이라도 썼으면 다 찬 것으로 본다.
 *  기본 문항(입사 후 포부 등)을 안 썼다고 '빠졌다'고 하지 않는다. */
export function docChecklist(t: PlatformT, kind: "resume" | "cover", resume: ResumeDoc | null, cover: CoverDoc | null): { label: string; done: boolean }[] {
  if (kind === "resume") {
    const has = (secs: CareerSection[]) => !!resume?.items.some((i) => secs.includes(i.section) && (i.text.trim() || (i.company ?? "").trim()));
    return [
      { label: sectionLabelOf(t, "education"), done: has(["education"]) },
      { label: t("경력·프로젝트", "Work/projects", "经历·项目", "Kinh nghiệm/dự án", "経歴・PJ", "Kerja/proyek"), done: has(["experience", "project"]) },
      { label: sectionLabelOf(t, "skill"), done: has(["skill"]) },
      { label: sectionLabelOf(t, "language"), done: has(["language"]) },
      { label: t("한 줄 소개", "Summary", "简介", "Giới thiệu", "自己紹介", "Ringkasan"), done: !!resume?.summary?.trim() }
    ];
  }
  return [{ label: t("문항 1개 이상 쓰기", "Write at least one answer", "至少写一个问题", "Viết ít nhất 1 câu", "1問以上書く", "Tulis minimal 1 jawaban"), done: coverWritten(cover).count > 0 }];
}

/** 자기소개서에 쓴 것 — 글이 20자 이상인 문항 수와 전체 글자 수. */
export function coverWritten(cover: CoverDoc | null): { count: number; chars: number } {
  const byQ = new Map<string, number>();
  for (const it of cover?.items ?? []) byQ.set(it.question, (byQ.get(it.question) ?? 0) + it.text.trim().length);
  const written = [...byQ.values()].filter((n) => n >= 20);
  return { count: written.length, chars: written.reduce((a, b) => a + b, 0) };
}

export function DocStatusCard({ t, kind, resume, cover }: { t: PlatformT; kind: "resume" | "cover"; resume: ResumeDoc | null; cover: CoverDoc | null }) {
  const doc = kind === "resume" ? resume : cover;
  const label = kind === "resume" ? t("이력서", "Resume", "简历", "CV", "履歴書", "CV") : t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran");
  const editHref = kind === "resume" ? R.resume : R.cover;
  const previewHref = doc ? (kind === "resume" ? R.resumePreview : R.coverPreview) : null;
  const checks = docChecklist(t, kind, resume, cover);
  const left = checks.filter((c) => !c.done);
  const done = checks.length - left.length;
  const ready = !!doc && !left.length;
  const written = coverWritten(cover);
  const edited = doc?.updatedAt ? t(`${formatRelativeTime(doc.updatedAt, undefined, t)} 수정`, `Edited ${formatRelativeTime(doc.updatedAt, undefined, t)}`, `${formatRelativeTime(doc.updatedAt, undefined, t)}修改`, `Sửa ${formatRelativeTime(doc.updatedAt, undefined, t)}`, `${formatRelativeTime(doc.updatedAt, undefined, t)}編集`, `Diubah ${formatRelativeTime(doc.updatedAt, undefined, t)}`) : "";

  const badge = !doc
    ? { text: t("시작 전", "Not started", "未开始", "Chưa bắt đầu", "未着手", "Belum mulai"), cls: "bg-white text-[color:var(--v2-muted)]" }
    : !ready
      ? { text: t("채우는 중", "In progress", "填写中", "Đang điền", "作成中", "Diisi"), cls: "bg-white text-[color:var(--v2-ink-3)]" }
      : { text: t("준비됐어요", "Ready", "已就绪", "Sẵn sàng", "準備OK", "Siap"), cls: "bg-[#e5f6ee] text-[color:var(--v2-good)]" };

  return (
    <div className="flex flex-col rounded-2xl bg-[color:var(--v2-band)] p-4 md:p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[17px] font-bold text-[color:var(--v2-ink)]">{label}</p>
        <span className={`shrink-0 rounded-md px-2 py-1 text-[12px] font-bold leading-none ${badge.cls}`}>{badge.text}</span>
      </div>

      <div className="mt-4 flex-1">
        {kind === "cover" && !ready ? (
          // 자기소개서 — 아직 쓴 문항이 없음(정해진 필수 문항은 없다)
          <>
            <p className="text-[15px] font-semibold leading-[1.5] text-[color:var(--v2-ink)]">{t("아직 쓴 문항이 없어요", "No answers yet", "还没有写任何问题", "Chưa có câu trả lời", "まだ書いた設問がありません", "Belum ada jawaban")}</p>
            <p className="mt-1 text-[13px] leading-[1.5] text-[color:var(--v2-muted)]">{t("회사마다 문항이 달라요. 지원할 곳 문항부터 써도 좋아요.", "Questions differ by company — start with the one you're applying to.", "每家公司问题不同，可以先写要投递公司的问题。", "Mỗi công ty hỏi khác nhau — hãy bắt đầu với nơi bạn ứng tuyển.", "設問は会社ごとに違います。応募先の設問から書いてOK。", "Tiap perusahaan beda — mulai dari yang kamu lamar.")}</p>
          </>
        ) : !ready ? (
          // 이력서 채우는 중 — 필수 항목 막대(칸마다 한 항목) + 남은 항목
          <>
            <div className="flex gap-1" aria-hidden>
              {checks.map((c) => (
                <span key={c.label} className={`h-1.5 flex-1 rounded-full ${c.done ? "bg-[color:var(--v2-accent)]" : "bg-white"}`} />
              ))}
            </div>
            <p className="mt-2.5 text-[13px] text-[color:var(--v2-muted)]">
              {t(`필수 ${checks.length}개 중 ${done}개`, `${done} of ${checks.length} essentials`, `必填 ${checks.length} 项中 ${done} 项`, `${done}/${checks.length} mục chính`, `必須${checks.length}件中${done}件`, `${done} dari ${checks.length} inti`)}
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {left.slice(0, 3).map((c) => (
                <li key={c.label} className="flex min-w-0 items-center gap-1.5 text-[14px] font-semibold text-[color:var(--v2-ink-2)]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--v2-attention)]" aria-hidden />
                  <span className="truncate">{c.label}</span>
                </li>
              ))}
              {left.length > 3 ? <li className="text-[13px] text-[color:var(--v2-faint)]">{t(`외 ${left.length - 3}개`, `+${left.length - 3} more`, `等 ${left.length - 3} 项`, `+${left.length - 3}`, `他${left.length - 3}件`, `+${left.length - 3}`)}</li> : null}
            </ul>
          </>
        ) : (
          // 준비됨 — 쓴 양 · 수정 시각
          <>
            <p className="text-[15px] font-semibold leading-[1.5] text-[color:var(--v2-ink)]">
              {kind === "resume"
                ? t("필수 항목을 다 채웠어요", "All essentials are in", "必填项都写好了", "Đã đủ mục chính", "必須項目はそろいました", "Semua inti terisi")
                : t(`문항 ${written.count}개를 썼어요`, `${written.count} answers written`, `已写 ${written.count} 个问题`, `Đã viết ${written.count} câu`, `${written.count}問書きました`, `${written.count} jawaban ditulis`)}
            </p>
            <p className="mt-1 text-[13px] text-[color:var(--v2-muted)]">
              {[
                kind === "resume"
                  ? t(`항목 ${resume?.items.length ?? 0}개`, `${resume?.items.length ?? 0} items`, `${resume?.items.length ?? 0} 项`, `${resume?.items.length ?? 0} mục`, `${resume?.items.length ?? 0}項目`, `${resume?.items.length ?? 0} item`)
                  : t(`${written.chars.toLocaleString()}자`, `${written.chars.toLocaleString()} chars`, `${written.chars.toLocaleString()} 字`, `${written.chars.toLocaleString()} ký tự`, `${written.chars.toLocaleString()}字`, `${written.chars.toLocaleString()} karakter`),
                edited
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="white" full href={previewHref ?? undefined} disabled={!previewHref}>
          {t("미리보기", "Preview", "预览", "Xem", "プレビュー", "Lihat")}
        </Button>
        <Button variant="primary" full href={editHref}>
          {doc ? t("수정하기", "Edit", "修改", "Sửa", "編集", "Ubah") : t("시작하기", "Start", "开始", "Bắt đầu", "始める", "Mulai")}
        </Button>
      </div>
    </div>
  );
}

// ── 비자 ───────────────────────────────────────────────
// 외국인 지원자에게만 있는 고민 — 지금 비자에서 취업 비자(E-7)까지 어디쯤인지. 비자는 계정(CandidateProfile.visaType)에 저장.
// 외국인인지는 국적(User.nationality)으로 본다 — 비자 저장됨 → 카드 / 외국 국적 → 비자 고르기 / 한국 → 숨김 /
// 국적 모름 → 얇은 '혹시 외국인이세요?' 카드: [네] 국적 고르기, [아니요] 한국으로 저장.

function visaLabel(t: PlatformT, v: CandidateVisaType): string {
  switch (v) {
    case "D2_STUDENT":
      return t("D-2 유학", "D-2 Student", "D-2 留学", "D-2 Du học", "D-2 留学", "D-2 Pelajar");
    case "D4_GENERAL_TRAINING":
      return t("D-4 어학연수", "D-4 Language", "D-4 语言研修", "D-4 Học tiếng", "D-4 語学研修", "D-4 Bahasa");
    case "D10_JOB_SEEKING":
      return t("D-10 구직", "D-10 Job seeking", "D-10 求职", "D-10 Tìm việc", "D-10 求職", "D-10 Cari kerja");
    case "E7_SPECIFIC_ACTIVITY":
      return t("E-7 취업", "E-7 Work", "E-7 就业", "E-7 Làm việc", "E-7 就労", "E-7 Kerja");
    case "F2_RESIDENCE":
      return "F-2";
    case "F4_OVERSEAS_KOREAN":
      return "F-4";
    case "F5_PERMANENT_RESIDENCE":
      return "F-5";
    case "F6_MARRIAGE_IMMIGRATION":
      return "F-6";
    case "H1_WORKING_HOLIDAY":
      return t("H-1 워킹홀리데이", "H-1 Working holiday", "H-1 打工度假", "H-1 Working holiday", "H-1 ワーホリ", "H-1 Working holiday");
    default:
      return t("기타", "Other", "其他", "Khác", "その他", "Lainnya");
  }
}

const VISA_CHOICES: CandidateVisaType[] = ["D2_STUDENT", "D10_JOB_SEEKING", "E7_SPECIFIC_ACTIVITY", "D4_GENERAL_TRAINING", "F2_RESIDENCE", "F4_OVERSEAS_KOREAN", "F5_PERMANENT_RESIDENCE", "F6_MARRIAGE_IMMIGRATION", "H1_WORKING_HOLIDAY", "OTHER"];

// 비자는 한 화면에서 두 군데(질문 카드·비자 카드)가 읽어서, 계정별로 한 번만 불러 나눠 쓴다.
const visaLoads = new Map<string, Promise<CandidateVisaType | null>>();
function loadVisa(userId: string): Promise<CandidateVisaType | null> {
  let p = visaLoads.get(userId);
  if (!p) {
    p = getMyCandidateProfile()
      .then((x) => x?.visaType ?? null)
      .catch(() => null);
    visaLoads.set(userId, p);
  }
  return p;
}

/** slot="ask" — 국적을 모를 때의 '혹시 외국인이세요?'(관심 직무 위) / slot="card" — 비자 고르기·비자 카드(지원 서류 아래). */
function VisaCard({ t, slot }: { t: PlatformT; slot: "ask" | "card" }) {
  const { user, refreshSession } = useAuthSession();
  const foreign = isForeignNationality(user?.nationality);
  const [visa, setVisa] = useState<CandidateVisaType | null | undefined>(undefined); // undefined = 불러오는 중
  const [askNationality, setAskNationality] = useState(false);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const userId = user?.id ?? "";
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    loadVisa(userId).then((v) => alive && setVisa(v));
    return () => {
      alive = false;
    };
  }, [userId]);

  const choose = async (v: CandidateVisaType) => {
    setSaving(true);
    try {
      await updateMyCandidateProfile({ visaType: v });
      visaLoads.set(userId, Promise.resolve(v));
      setVisa(v);
      setPicking(false);
    } catch {
      /* 실패하면 고르는 화면을 그대로 둔다 */
    } finally {
      setSaving(false);
    }
  };
  const notForeigner = async () => {
    setSaving(true);
    try {
      await updateMyBasicInfo({ nationality: "KR" });
      await refreshSession();
    } catch {
      /* 실패하면 질문을 그대로 둔다 */
    } finally {
      setSaving(false);
    }
  };

  if (visa === undefined) return null;
  if (!visa && foreign === false) return null;
  const title = t("비자", "Visa", "签证", "Visa", "ビザ", "Visa");
  const asking = !visa && foreign === null;
  if ((slot === "ask") !== asking) return null; // 질문은 질문 자리에서만, 카드는 카드 자리에서만

  // 국적 모름 — [네]를 누르면 국적을 고르게 한다(계정에 저장되어 다른 기기에서도 다시 묻지 않는다).
  if (asking) {
    if (askNationality) {
      return (
        <Section title={t("국적", "Nationality", "国籍", "Quốc tịch", "国籍", "Kebangsaan")}>
          <div className="pb-3">
            <p className="mb-3 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("국적을 알려 주시면 비자에 맞춰 취업 준비를 도와드려요.", "Tell us your nationality and we'll guide you by visa.", "告诉我们你的国籍，我们会按签证帮你准备就业。", "Cho biết quốc tịch, chúng tôi hướng dẫn theo visa.", "国籍を教えていただければビザに合わせてサポートします。", "Beri tahu kebangsaanmu, kami bantu sesuai visa.")}</p>
            <NationalityField className="max-w-md" />
            <div className="mt-1">
              <TextLink onClick={() => setAskNationality(false)}>{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</TextLink>
            </div>
          </div>
        </Section>
      );
    }
    return (
      <>
        <Band />
        <div className="px-5 py-7 md:py-9">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-[color:var(--v2-accent-weak)] px-4 py-3">
            <p className="min-w-0 text-[14px] leading-[1.5] text-[color:var(--v2-ink-2)]">
              <b className="font-bold">{t("혹시 외국인이세요?", "Are you an international?", "你是外国人吗？", "Bạn là người nước ngoài?", "外国の方ですか？", "Apakah kamu WNA?")}</b>{" "}
              {t("비자에 맞춰 취업 준비를 도와드려요.", "We'll guide you by visa.", "我们会按签证帮你准备就业。", "Chúng tôi hướng dẫn theo visa.", "ビザに合わせて就活をサポートします。", "Kami bantu sesuai visa.")}
            </p>
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" onClick={() => setAskNationality(true)}>
                {t("네", "Yes", "是", "Có", "はい", "Ya")}
              </Button>
              <Button size="sm" variant="white" onClick={() => void notForeigner()} disabled={saving}>
                {t("아니요", "No", "不是", "Không", "いいえ", "Tidak")}
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // 비자를 모르거나 바꾸는 중 — 고르기
  if (!visa || picking) {
    return (
      <Section title={title}>
        <div className="pb-3">
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
            {t("지금 비자를 알려 주세요. 취업 비자까지 무엇을 준비하면 되는지 알려 드려요.", "Tell us your visa — we'll show what to prepare for a work visa.", "请告诉我们你的签证，我们会告诉你就业签证需要准备什么。", "Hãy cho biết visa — chúng tôi chỉ cách chuẩn bị visa làm việc.", "今のビザを教えてください。就労ビザまでの準備をご案内します。", "Beri tahu visamu — kami tunjukkan persiapan visa kerja.")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {VISA_CHOICES.map((v) => (
              <Chip key={v} active={visa === v} onClick={() => (saving ? undefined : void choose(v))}>
                {visaLabel(t, v)}
              </Chip>
            ))}
          </div>
          {picking ? (
            <div className="mt-3">
              <TextLink onClick={() => setPicking(false)}>{t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal")}</TextLink>
            </div>
          ) : null}
        </div>
      </Section>
    );
  }

  // 취업 비자 흐름 — D-2 유학 → D-10 구직 → E-7 취업. F 계열·H-1·기타는 흐름 대신 한 줄 안내.
  const flow: CandidateVisaType[] = ["D2_STUDENT", "D10_JOB_SEEKING", "E7_SPECIFIC_ACTIVITY"];
  const at = flow.indexOf(visa);
  const note =
    visa === "D2_STUDENT"
      ? t("졸업 후엔 D-10(구직)으로 바꿔 구직을 이어갈 수 있어요. 취업이 정해지면 E-7으로 바꿔요.", "After graduating you can switch to D-10 to keep job hunting, then to E-7 once hired.", "毕业后可转为 D-10（求职）继续找工作，确定就业后转为 E-7。", "Sau tốt nghiệp có thể đổi sang D-10 để tiếp tục tìm việc, rồi E-7 khi có việc.", "卒業後はD-10（求職）に変えて就活を続けられます。就職が決まればE-7へ。", "Setelah lulus bisa ganti ke D-10 untuk cari kerja, lalu E-7 saat diterima.")
      : visa === "D10_JOB_SEEKING"
        ? t("취업이 정해지면 회사와 함께 E-7 변경을 준비해요.", "Once hired, prepare the E-7 change with your company.", "确定就业后与公司一起准备变更为 E-7。", "Khi có việc, cùng công ty chuẩn bị đổi sang E-7.", "就職が決まれば会社と一緒にE-7への変更を準備します。", "Setelah diterima, siapkan perubahan ke E-7 bersama perusahaan.")
        : visa === "E7_SPECIFIC_ACTIVITY"
          ? t("이미 취업 비자예요. 회사를 옮길 땐 근무처 변경 허가가 필요해요.", "You already have a work visa. Changing jobs needs a workplace-change permit.", "你已持有就业签证。换公司时需要办理工作单位变更许可。", "Bạn đã có visa làm việc. Đổi công ty cần xin phép đổi nơi làm.", "すでに就労ビザです。転職時は勤務先変更の許可が必要です。", "Kamu sudah punya visa kerja. Pindah kerja perlu izin perubahan tempat kerja.")
          : visa === "D4_GENERAL_TRAINING"
            ? t("학위 과정(D-2)에 들어가면 D-2 → D-10 → E-7 순서로 취업을 준비해요.", "Once in a degree program (D-2), the path is D-2 → D-10 → E-7.", "进入学位课程（D-2）后，按 D-2 → D-10 → E-7 准备就业。", "Khi vào chương trình học (D-2), lộ trình là D-2 → D-10 → E-7.", "学位課程（D-2）に入るとD-2→D-10→E-7の順で準備します。", "Setelah masuk program gelar (D-2): D-2 → D-10 → E-7.")
            : visa === "H1_WORKING_HOLIDAY"
              ? t("정해진 기간 동안 일할 수 있어요. 오래 일하려면 E-7 같은 취업 비자로 바꿔야 해요.", "You can work for a set period. To stay longer, switch to a work visa like E-7.", "可在规定期间内工作。想长期工作需转为 E-7 等就业签证。", "Có thể làm việc trong thời hạn nhất định. Muốn ở lâu cần đổi sang visa như E-7.", "決められた期間働けます。長く働くにはE-7などへの変更が必要です。", "Bisa bekerja dalam periode tertentu. Untuk lebih lama, ganti ke visa kerja seperti E-7.")
              : visa.startsWith("F")
                ? t("F 비자는 취업 제한이 거의 없어요. 지원할 때 비자 종류만 알려 주면 돼요.", "F visas have almost no work restrictions — just tell employers your visa type.", "F 签证几乎没有就业限制，投递时告知签证类型即可。", "Visa F hầu như không hạn chế làm việc — chỉ cần báo loại visa.", "Fビザは就労制限がほとんどありません。応募時にビザの種類を伝えればOK。", "Visa F hampir tanpa batasan kerja — cukup sebutkan jenis visamu.")
                : t("비자마다 일할 수 있는 조건이 달라요. 비자 안내에서 확인해 보세요.", "Work conditions differ by visa — check the visa guide.", "不同签证的工作条件不同，请查看签证指南。", "Điều kiện làm việc khác nhau theo visa — xem hướng dẫn.", "ビザごとに条件が違います。ビザ案内で確認してください。", "Syarat kerja berbeda tiap visa — cek panduan visa.");

  return (
    <Section title={title} aside={<TextLink onClick={() => setPicking(true)}>{t("바꾸기", "Change", "更改", "Đổi", "変更", "Ubah")}</TextLink>}>
      <div className="pb-3">
        {at >= 0 ? (
          <ol className="flex items-center gap-1.5">
            {flow.map((v, i) => (
              <li key={v} className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className={`flex h-9 min-w-0 flex-1 items-center justify-center rounded-xl px-2 text-[13px] font-bold ${i === at ? "bg-[color:var(--v2-accent)] text-white" : i < at ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[color:var(--v2-band)] text-[color:var(--v2-muted)]"}`}>
                  <span className="truncate">{visaLabel(t, v)}</span>
                </span>
                {i < flow.length - 1 ? (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[color:var(--v2-faint)]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">{t(`지금 비자: ${visaLabel(t, visa)}`, `Your visa: ${visaLabel(t, visa)}`, `当前签证：${visaLabel(t, visa)}`, `Visa hiện tại: ${visaLabel(t, visa)}`, `今のビザ：${visaLabel(t, visa)}`, `Visa saat ini: ${visaLabel(t, visa)}`)}</p>
        )}
        <p className="mt-3 text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{note}</p>

        {visa === "D2_STUDENT" || visa === "D10_JOB_SEEKING" || visa === "D4_GENERAL_TRAINING" ? (
          <div className="mt-4 rounded-2xl bg-[color:var(--v2-band)] p-4">
            <p className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">{t("E-7을 받으려면 보통 이걸 봐요", "What E-7 usually requires", "申请 E-7 通常看这些", "E-7 thường xét những điều này", "E-7で主に見られること", "Yang biasanya dilihat untuk E-7")}</p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[14px] leading-[1.55] text-[color:var(--v2-ink-3)]">
              <li>· {t("관련 분야 학위(학사 이상) 또는 경력", "A related degree (bachelor's+) or experience", "相关领域学位（本科以上）或经验", "Bằng cấp liên quan (cử nhân+) hoặc kinh nghiệm", "関連分野の学位（学士以上）または経歴", "Gelar terkait (S1+) atau pengalaman")}</li>
              <li>· {t("전공·경력과 하는 일이 관련 있을 것", "Your job relates to your major or experience", "工作与专业或经验相关", "Công việc liên quan đến ngành học/kinh nghiệm", "仕事が専攻・経歴と関連していること", "Pekerjaan terkait jurusan/pengalaman")}</li>
              <li>· {t("연봉이 정해진 기준 이상일 것(기준은 해마다 바뀌어요)", "Salary above the set threshold (changes yearly)", "年薪达到规定标准（每年调整）", "Lương trên mức quy định (thay đổi hằng năm)", "年収が基準以上（基準は毎年変わります）", "Gaji di atas ambang (berubah tiap tahun)")}</li>
            </ul>
            <p className="mt-2 text-[12px] text-[color:var(--v2-faint)]">{t("정확한 조건은 하이코리아·출입국사무소에서 확인하세요.", "Confirm exact rules with HiKorea or Immigration.", "具体条件请在 HiKorea 或出入境事务所确认。", "Xác nhận điều kiện tại HiKorea hoặc Sở XNC.", "正確な条件はハイコリア・出入国事務所でご確認ください。", "Pastikan di HiKorea atau Imigrasi.")}</p>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {visa !== "E7_SPECIFIC_ACTIVITY" && !visa.startsWith("F") ? <TextLink href="/talent/visa/E-7">{t("E-7 자세히 보기", "E-7 details", "E-7 详情", "Chi tiết E-7", "E-7の詳細", "Detail E-7")}</TextLink> : null}
          {visa === "D2_STUDENT" ? <TextLink href="/talent/visa/D-10">{t("D-10 자세히 보기", "D-10 details", "D-10 详情", "Chi tiết D-10", "D-10の詳細", "Detail D-10")}</TextLink> : null}
        </div>
      </div>
    </Section>
  );
}

// ── 기업과의 연결 ─────────────────────────────────────────
// 기업이 나를 찾아오는 쪽 — 받은 연결 요청(수락하면 연락처가 열린다)과 나를 관심 목록에 담은 회사.
// 인재풀 노출은 '가입 + 완성된 대표 이력서' 기준이라 따로 켜고 끄는 스위치가 없다 — 이력서를 채우라고만 안내한다.
// 수락·거절과 목록은 기존 화면(/talent/connections, /talent/feed)에서.
function CompanyLinks({ t }: { t: PlatformT }) {
  const [data, setData] = useState<{ conns: MyConnection[]; interested: number } | null>(null);
  useEffect(() => {
    let alive = true;
    Promise.all([listMyConnections().catch(() => [] as MyConnection[]), getInterestedCompanies().catch(() => [])]).then(([conns, list]) => alive && setData({ conns, interested: list.length }));
    return () => {
      alive = false;
    };
  }, []);
  if (!data) return null;
  const pending = data.conns.filter((c) => c.status === "PENDING");
  const latest = pending[0];

  return (
    <Section title={t("기업과의 연결", "Companies", "与企业的联系", "Kết nối doanh nghiệp", "企業とのつながり", "Koneksi perusahaan")}>
      <p className="pb-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">
        {t("이력서를 완성하면 기업이 인재 검색에서 나를 찾을 수 있어요. 연락처는 내가 연결을 수락하기 전까지 가려져요.", "With a complete resume, companies can find you in talent search. Your contact stays hidden until you accept.", "完善简历后，企业可在人才搜索中找到你。在你接受联系前，联系方式保持隐藏。", "Khi CV hoàn chỉnh, doanh nghiệp có thể tìm thấy bạn. Liên hệ được ẩn cho đến khi bạn chấp nhận.", "履歴書を完成させると企業が人材検索であなたを見つけられます。連絡先は承諾するまで非公開です。", "Dengan CV lengkap, perusahaan bisa menemukanmu. Kontak tersembunyi sampai kamu menerima.")}
      </p>
      <Row
        href="/v2/connections"
        lead="✉️"
        title={t("받은 연결 요청", "Connection requests", "收到的联系请求", "Yêu cầu kết nối", "届いたリクエスト", "Permintaan koneksi")}
        meta={
          latest
            ? t(`${latest.orgName}에서 연결을 요청했어요`, `${latest.orgName} wants to connect`, `${latest.orgName} 请求联系`, `${latest.orgName} muốn kết nối`, `${latest.orgName}からリクエスト`, `${latest.orgName} ingin terhubung`)
            : t("아직 새 요청이 없어요", "No new requests", "暂无新请求", "Chưa có yêu cầu mới", "新しいリクエストはありません", "Belum ada permintaan baru")
        }
        right={pending.length ? <span className="rounded-full bg-[color:var(--v2-attention)] px-2 py-0.5 text-[12px] font-bold text-white">{pending.length}</span> : undefined}
      />
      <Row
        href="/v2/connections#interested"
        lead="🏢"
        title={t("관심 보인 회사", "Interested companies", "感兴趣的公司", "Công ty quan tâm", "関心を持った会社", "Perusahaan tertarik")}
        meta={
          data.interested
            ? t(`${data.interested}곳이 나를 관심 목록에 담았어요`, `${data.interested} saved you`, `${data.interested} 家公司收藏了你`, `${data.interested} công ty đã lưu bạn`, `${data.interested}社が保存しました`, `${data.interested} menyimpanmu`)
            : t("이력서를 채울수록 관심받기 쉬워요", "A fuller resume gets more interest", "简历越完整越容易被关注", "CV đầy đủ dễ được chú ý", "履歴書を充実させると注目されやすい", "CV lengkap lebih dilirik")
        }
        right={data.interested ? <span className="text-[15px] font-bold text-[color:var(--v2-ink-2)]">{data.interested}</span> : undefined}
      />
    </Section>
  );
}
