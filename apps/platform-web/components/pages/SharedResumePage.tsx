"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ArrowSquareOut, DownloadSimple, Rows, SidebarSimple } from "@phosphor-icons/react/dist/ssr";
import { ResumeSheetSkeleton } from "./ResumeSheetSkeleton";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  getSharedResume,
  type CandidateEducationStatus,
  type CandidateEducationType,
  type CandidateVisaType,
  type SharedResume
} from "../../lib/member-profile-client";

// ---------------------------------------------------------------------------
// Public, anonymous resume share view.
//
// Mirrors the owner-side ResumeDetailPage rendering (single + sidebar layouts,
// PDF download, Aply watermark) but strips out anything owner-only — no edit
// button, no "set as primary", no share-link copy. Auth is NOT required;
// the page fetches from /resumes/share/:slug on the API.
// ---------------------------------------------------------------------------

function useTr() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => {
    const map: Record<PlatformLocale, string> = { ko, en, "zh-CN": zh, vi, ja, id };
    return map[locale] ?? ko;
  };
}

type Layout = "single" | "two-column";

// preloaded: 슬러그로 API 조회하지 않고 이미 가진 이력서(예: 운영콘솔의 제출 스냅샷)를
// 그대로 공유뷰로 렌더할 때 넘긴다. 넘기면 fetch 를 생략한다.
export function SharedResumePage({ slug, preloaded }: { slug: string; preloaded?: SharedResume }) {
  const tr = useTr();
  const [resume, setResume] = useState<SharedResume | null>(preloaded ?? null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>("single");

  useEffect(() => {
    if (preloaded) return; // 미리 받은 이력서면 조회 생략
    let cancelled = false;
    void (async () => {
      try {
        const r = await getSharedResume(slug);
        if (!cancelled) setResume(r);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : "이력서를 불러오지 못했어요.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, preloaded]);

  function handlePrint() {
    if (typeof window === "undefined") return;
    window.print();
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

  if (loadError) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        <main className="container flex flex-col items-center gap-4 py-24 text-center">
          <p className="text-sm text-muted-foreground">{loadError}</p>
        </main>
      </div>
    );
  }
  if (!resume) {
    return <ResumeSheetSkeleton />;
  }

  const c = resume.content ?? {};
  // 한국어 번역 캐시 — 외국어로 쓴 자기소개·요약·경력·활동 description 옆에
  // KO 라벨 인용 박스로 표시. 보는 사람(채용 담당자) 이 모국어로 읽게.
  const ko = resume.translations?.ko ?? undefined;
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

  // Basic info — content first, then the joined owner record (name+email+phone)
  const nameVal = c.basicName?.trim() || resume.user?.name || resume.user?.realName || "";
  const emailVal = c.basicEmail?.trim() || resume.user?.email || "";
  const phoneVal = c.basicPhone?.trim() || resume.user?.phoneNumber || "";
  const residenceVal = c.basicResidence?.trim() || "";
  const visaVal = visaLabel(c.basicVisa ?? c.visaType ?? null) || "";

  const hasAnyDetail =
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
      <main className="container pb-16 pt-6 md:pt-10">
        <div className="mx-auto max-w-4xl">
          {/* 운영자 시점일 때만 보이는 안내 — 연락처가 노출되고 있다는 컨텍스트. */}
          {resume.viewerScope === "operator" ? (
            <div className="resume-toolbar mb-3 inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-800">
              <span aria-hidden>🔒</span>
              {tr(
                "운영자 시점 — 전화·이메일·주소까지 노출됩니다.",
                "Operator view — phone, email and residence are shown.",
                "运营者视图 — 包含电话/邮箱/居住地。",
                "Chế độ vận hành — hiển thị cả điện thoại / email / địa chỉ.",
                "運営者ビュー — 電話・メール・住所まで表示。",
                "Tampilan operator — termasuk telepon, email, dan domisili."
              )}
            </div>
          ) : null}

          {/* Top bar — Aply 로고+슬로건(왼쪽) + 레이아웃 토글·PDF(오른쪽). 인쇄 시 숨김. */}
          <div className="resume-toolbar mb-5 flex flex-wrap items-center justify-between gap-2">
            <a
              href="https://aply.global"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Aply"
              className="inline-flex h-9 items-center gap-3 px-1"
            >
              <Image
                src="/img_logo.webp"
                alt="Aply"
                width={84}
                height={26}
                className="h-6 w-auto object-contain"
                priority
              />
              <span className="hidden text-[12.5px] font-medium leading-tight text-muted-foreground sm:inline">
                {tr(
                  "글로벌 인재의 한국 취업",
                  "Korean careers for global talent",
                  "全球人才的韩国求职",
                  "Việc làm Hàn cho nhân tài toàn cầu",
                  "グローバル人材のための韓国就職",
                  "Karir Korea untuk talenta global"
                )}
              </span>
            </a>
            <div className="flex flex-wrap items-center gap-2">
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
                onClick={handlePrint}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-[13px] font-medium text-foreground transition hover:bg-muted/30"
              >
                <DownloadSimple weight="bold" className="h-4 w-4" />
                {tr("PDF 다운로드", "Download PDF", "下载 PDF", "Tải PDF", "PDFダウンロード", "Unduh PDF")}
              </button>
            </div>
          </div>

          {/* Resume sheet */}
          <article className="resume-sheet rounded-3xl border border-border bg-white p-6 shadow-sm md:p-10">
            {/* Top Aply mark — 로고 클릭 시 aply.global 새창 이동 */}
            <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
              <a href="https://aply.global" target="_blank" rel="noopener noreferrer" aria-label="Aply" className="inline-flex">
                <Image src="/img_logo.webp" alt="Aply" width={84} height={26} className="h-6 w-auto object-contain" priority />
              </a>
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {tr("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}
              </span>
            </div>

            {layout === "single" ? (
              <header className="resume-hero flex items-center gap-5 md:gap-6">
                {c.basicPhotoUrl ? (
                  <div className="aspect-[3/4] w-24 flex-none overflow-hidden rounded-2xl border border-border md:w-28">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.basicPhotoUrl} alt={nameVal || "Profile photo"} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <h1 className="text-[28px] font-bold tracking-tight text-foreground md:text-[34px]">
                    {nameVal || tr("이름 미입력", "Name not set", "未填写姓名", "Chưa nhập tên", "氏名未入力", "Nama belum diisi")}
                  </h1>
                  <div className="mt-3 space-y-1 text-[13.5px] leading-relaxed text-foreground/80">
                    {emailVal ? <p>{emailVal}</p> : null}
                    {phoneVal ? <p>{phoneVal}</p> : null}
                    {residenceVal ? <p>{residenceVal}</p> : null}
                    {visaVal ? <p>{visaVal}</p> : null}
                  </div>
                </div>
              </header>
            ) : null}

            {!hasAnyDetail ? (
              <p className="mt-6 text-[14px] text-muted-foreground">
                {tr("아직 내용이 비어있어요.", "Nothing filled in yet.", "内容还是空的。", "Chưa có nội dung.", "まだ内容が空です。", "Belum ada isi.")}
              </p>
            ) : layout === "single" ? (
              <div className="mt-7 space-y-10">
                {c.summary || c.selfIntroduction ? <AboutBlock tr={tr} c={c} ko={ko} /> : null}
                {careerList.length > 0 ? <CareerBlock tr={tr} careerList={careerList} ko={ko} /> : null}
                {activityList.length > 0 ? <ActivityBlock tr={tr} activityList={activityList} ko={ko} /> : null}
                {eduList.length > 0 ? (
                  <EducationBlock tr={tr} eduList={eduList} eduTypeLabel={eduTypeLabel} eduStatusLabel={eduStatusLabel} />
                ) : null}
                {skills.length > 0 ? <SkillsBlock tr={tr} skills={skills} /> : null}
                {languageList.length > 0 ? <LanguagesBlock tr={tr} list={languageList} /> : null}
                {certList.length > 0 ? <CertsBlock tr={tr} list={certList} /> : null}
                {linkList.length > 0 ? <LinksBlock tr={tr} list={linkList} /> : null}
              </div>
            ) : (
              <div className="resume-sidebar-grid mt-2 grid grid-cols-1 gap-10 md:grid-cols-[230px_1fr] md:gap-12">
                <aside className="space-y-6 md:order-1">
                  {c.basicPhotoUrl ? (
                    <div className="overflow-hidden rounded-xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.basicPhotoUrl} alt={nameVal || "Profile photo"} className="aspect-[3/4] w-full object-cover" />
                    </div>
                  ) : null}
                  <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
                    {nameVal || tr("이름 미입력", "Name not set", "未填写姓名", "Chưa nhập tên", "氏名未入力", "Nama belum diisi")}
                  </h1>
                  {(emailVal || phoneVal || residenceVal || visaVal) ? (
                    <div className="space-y-1 text-[12.5px] leading-relaxed text-muted-foreground">
                      {emailVal ? <p>{emailVal}</p> : null}
                      {phoneVal ? <p>{phoneVal}</p> : null}
                      {residenceVal ? <p>{residenceVal}</p> : null}
                      {visaVal ? <p>{visaVal}</p> : null}
                    </div>
                  ) : null}
                  {(c.summary || c.selfIntroduction) ? (
                    <div className="space-y-2 border-t border-border pt-5">
                      {c.summary ? (
                        <div>
                          <p className="text-[14px] italic leading-snug text-foreground">{c.summary}</p>
                          <KoLine text={ko?.summary} />
                        </div>
                      ) : null}
                      {c.selfIntroduction ? (
                        <div>
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">{c.selfIntroduction}</p>
                          <KoLine text={ko?.selfIntroduction} />
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                  {linkList.length > 0 ? (
                    <div className="space-y-1 border-t border-border pt-5 text-[12.5px] leading-relaxed">
                      {linkList.map((l, i) => (
                        <p key={i} className="break-all text-foreground/80">
                          {l.label ? <span className="text-muted-foreground">{l.label}: </span> : null}
                          <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {(l.url ?? "").replace(/^https?:\/\//, "")}
                          </a>
                        </p>
                      ))}
                    </div>
                  ) : null}
                </aside>

                <div className="space-y-12 md:order-2">
                  {careerList.length > 0 ? <CareerBlock tr={tr} careerList={careerList} ko={ko} /> : null}
                  {activityList.length > 0 ? <ActivityBlock tr={tr} activityList={activityList} ko={ko} /> : null}
                  {eduList.length > 0 ? (
                    <EducationBlock tr={tr} eduList={eduList} eduTypeLabel={eduTypeLabel} eduStatusLabel={eduStatusLabel} />
                  ) : null}
                  {(skills.length > 0 || languageList.length > 0 || certList.length > 0) ? (
                    <div className="resume-meta-grid grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
                      {skills.length > 0 ? <SkillsBlock tr={tr} skills={skills} compact /> : null}
                      {languageList.length > 0 ? <LanguagesBlock tr={tr} list={languageList} compact /> : null}
                      {certList.length > 0 ? <CertsBlock tr={tr} list={certList} compact /> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* Aply 워터마크 — 큰 로고도 클릭 시 aply.global 새창 이동 */}
            <footer className="resume-footer mt-12 flex flex-col items-center gap-2 border-t border-border pt-6 text-center">
              <a href="https://aply.global" target="_blank" rel="noopener noreferrer" aria-label="Aply" className="inline-flex">
                <Image src="/img_logo.webp" alt="Aply" width={140} height={42} className="h-9 w-auto object-contain" />
              </a>
              <p className="text-[12.5px] text-muted-foreground">
                {tr("Aply 에서 만든 이력서예요", "Made with Aply — Korean job matching", "通过 Aply 制作", "Tạo bằng Aply", "Aplyで作成された履歴書です", "Dibuat dengan Aply")}{" "}
                <a href="https://aply.global" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  aply.global
                </a>
              </p>
            </footer>
          </article>
        </div>
      </main>

      {/* Print CSS — identical to ResumeDetailPage so PDF output matches */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          html, body { background: #ffffff !important; }
          header:not(.resume-hero),
          nav,
          footer:not(.resume-footer),
          .resume-toolbar { display: none !important; }
          main { padding: 0 !important; }
          .resume-sheet {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          a { color: inherit !important; text-decoration: none !important; }
          h1, h2 { break-after: avoid; }
          section, article { break-inside: avoid; }
          .resume-sidebar-grid {
            grid-template-columns: 200px 1fr !important;
            gap: 2.5rem !important;
          }
          .resume-meta-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render blocks — kept local to this file so the public page doesn't depend
// on the owner-page component tree. Mirrors the styling of the section atoms
// in ResumeDetailPage so both views look identical.
// ---------------------------------------------------------------------------

type Trans = (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => string;
type C = NonNullable<SharedResume["content"]>;
type Ko = NonNullable<NonNullable<SharedResume["translations"]>["ko"]>;

// 한국어 번역을 원문 아래에 인용 박스로 표시. 한국 기업이 메인 독자라
// 한국어를 강조하기보다 "원문 + 보조 한국어" 의 차분한 톤.
function KoLine({ text, size }: { text?: string; size?: "sm" | "md" }) {
  if (!text) return null;
  return (
    <p
      className={`mt-1.5 border-l-2 border-foreground/15 pl-2.5 ${
        size === "md" ? "text-[13.5px]" : "text-[12.5px]"
      } leading-relaxed text-muted-foreground`}
    >
      <span className="mr-1 text-[10px] font-semibold text-foreground/40">KO</span>
      {text}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-[24px] font-bold tracking-tight text-foreground">{children}</h2>;
}

// 기간 포맷 — 디테일 페이지와 동일. "YYYY-MM" → "YYYY.MM". 자유 문자열은
// 그대로 노출. 한쪽만 있으면 "재직중"/"Present" 라벨로 표기.
function formatRange(tr: Trans, start?: string, end?: string): string {
  const pretty = (v?: string) => {
    if (!v) return "";
    const m = v.match(/^(\d{4})-(\d{2})$/);
    if (m) return `${m[1]}.${m[2]}`;
    return v;
  };
  const s = pretty(start);
  const e = pretty(end);
  const present = tr("재직중", "Present", "在职中", "Hiện tại", "在職中", "Sekarang");
  if (s && e) return `${s} — ${e}`;
  if (s && !e) return `${s} — ${present}`;
  if (!s && e) return e;
  return "";
}

function AboutBlock({ tr, c, ko }: { tr: Trans; c: C; ko?: Ko }) {
  return (
    <section>
      <SectionTitle>{tr("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang")}</SectionTitle>
      {c.summary ? (
        <div className="mb-2">
          <p className="text-[15px] font-medium text-foreground">{c.summary}</p>
          <KoLine text={ko?.summary} size="md" />
        </div>
      ) : null}
      {c.selfIntroduction ? (
        <div>
          <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-foreground">{c.selfIntroduction}</p>
          <KoLine text={ko?.selfIntroduction} size="md" />
        </div>
      ) : null}
    </section>
  );
}

function CareerBlock({ tr, careerList, ko }: { tr: Trans; careerList: NonNullable<C["careers"]>; ko?: Ko }) {
  return (
    <section>
      <SectionTitle>{tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")}</SectionTitle>
      <div className="space-y-6">
        {careerList.map((cr, i) => {
          const range = formatRange(tr, cr.startDate, cr.endDate);
          const koDesc = ko?.careers?.[i]?.description;
          return (
            <div key={i}>
              <p className="text-[15px] text-foreground">
                <span className="font-bold">{cr.position}</span>
                {cr.companyName ? <span className="ml-2 text-muted-foreground">{cr.companyName}</span> : null}
              </p>
              {range ? <p className="mt-1 text-[13px] italic text-muted-foreground">{range}</p> : null}
              {cr.description ? (
                <>
                  <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">{cr.description}</p>
                  <KoLine text={koDesc} />
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ActivityBlock({ tr, activityList, ko }: { tr: Trans; activityList: NonNullable<C["activities"]>; ko?: Ko }) {
  return (
    <section>
      <SectionTitle>{tr("프로젝트", "Projects", "项目/活动", "Dự án / Hoạt động", "プロジェクト/活動", "Proyek")}</SectionTitle>
      <div className="space-y-6">
        {activityList.map((a, i) => {
          const range = formatRange(tr, a.startDate, a.endDate);
          const koDesc = ko?.activities?.[i]?.description;
          return (
            <div key={i}>
              <p className="text-[15px] text-foreground">
                <span className="font-bold">{a.title}</span>
                {a.organization ? <span className="ml-2 text-muted-foreground">{a.organization}</span> : null}
              </p>
              {range ? <p className="mt-1 text-[13px] italic text-muted-foreground">{range}</p> : null}
              {a.description ? (
                <>
                  <p className="mt-2 whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">{a.description}</p>
                  <KoLine text={koDesc} />
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function EducationBlock({
  tr,
  eduList,
  eduTypeLabel,
  eduStatusLabel
}: {
  tr: Trans;
  eduList: NonNullable<C["educations"]>;
  eduTypeLabel: (v?: CandidateEducationType) => string | null | undefined;
  eduStatusLabel: (v?: CandidateEducationStatus) => string | null | undefined;
}) {
  return (
    <section>
      <SectionTitle>{tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</SectionTitle>
      <div className="space-y-5">
        {eduList.map((e, i) => {
          const range = formatRange(tr, e.startDate, e.endDate);
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
  );
}

function SkillsBlock({ tr, skills, compact }: { tr: Trans; skills: string[]; compact?: boolean }) {
  return (
    <section>
      <SectionTitle>{tr("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Skill")}</SectionTitle>
      {compact ? (
        <ul className="space-y-1">
          {skills.map((s, i) => (
            <li key={i} className="text-[13px] text-foreground">{s}</li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-2">
          {skills.map((s, i) => (
            <span key={i} className="rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground">{s}</span>
          ))}
        </div>
      )}
    </section>
  );
}

function LanguagesBlock({ tr, list, compact }: { tr: Trans; list: NonNullable<C["languages"]>; compact?: boolean }) {
  return (
    <section>
      <SectionTitle>{tr("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}</SectionTitle>
      <ul className={compact ? "space-y-1" : "space-y-1.5"}>
        {list.map((l, i) => (
          <li key={i} className={compact ? "text-[13px] text-foreground" : "text-[14.5px] text-foreground"}>
            {l.language}
            {l.level ? <span className="text-muted-foreground"> · {l.level}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CertsBlock({ tr, list, compact }: { tr: Trans; list: NonNullable<C["certifications"]>; compact?: boolean }) {
  return (
    <section>
      <SectionTitle>{tr("자격 / 수상", "Certificates / Awards", "证书/获奖", "Chứng chỉ / Giải thưởng", "資格/受賞", "Sertifikat / Penghargaan")}</SectionTitle>
      <ul className={compact ? "space-y-1" : "space-y-1.5"}>
        {list.map((ct, i) => (
          <li key={i} className={compact ? "text-[13px] text-foreground" : "text-[14.5px] text-foreground"}>
            {ct.name}
            {ct.issuer ? <span className="text-muted-foreground"> · {ct.issuer}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LinksBlock({ tr, list }: { tr: Trans; list: NonNullable<C["links"]> }) {
  return (
    <section>
      <SectionTitle>{tr("포트폴리오 / 링크", "Portfolio / Links", "作品集/链接", "Portfolio / Liên kết", "ポートフォリオ/リンク", "Portofolio / Tautan")}</SectionTitle>
      <ul className="space-y-1.5">
        {list.map((l, i) => (
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
  );
}
