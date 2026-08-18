"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowSquareOut,
  Check,
  DownloadSimple,
  LinkSimple,
  PencilSimple,
  Rows,
  SidebarSimple,
  Star
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { ResumeSheetSkeleton } from "./ResumeSheetSkeleton";
import { Header } from "../site/Header";
import { Button } from "../ui/button";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLanguage } from "../i18n/LanguageProvider";
import type { PlatformLocale } from "../../lib/auth-messages";
import {
  getMyCandidateProfile,
  getMyResume,
  getMyResumes,
  setMyPrimaryResume,
  type CandidateEducationStatus,
  type CandidateEducationType,
  type CandidateVisaType,
  type MyCandidateProfile,
  type Resume
} from "../../lib/member-profile-client";

// ---------------------------------------------------------------------------
// Single-page resume view.
//
// Two layouts ("세로" / "투 컬럼") plus a PDF export via window.print(). The
// toolbar above the sheet is hidden in @media print so what the user sees is
// just the resume document. Basic info reads from the resume content first
// (per-resume), with the user account as fallback for legacy resumes.
//
// 대표 이력서: a user with exactly one resume always reads as "대표", even
// if `isPrimary` happens to be false in the row (e.g. for legacy data
// created before the auto-primary rule). We compute the badge from
// resume-count, not just the boolean.
// ---------------------------------------------------------------------------

function useTr() {
  const { locale } = useLanguage();
  return (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => {
    const map: Record<PlatformLocale, string> = { ko, en, "zh-CN": zh, vi, ja, id };
    return map[locale] ?? ko;
  };
}

type Layout = "single" | "two-column";

export function ResumeDetailPage({ resumeId }: { resumeId: string }) {
  const tr = useTr();
  const { user, isReady, isAuthenticated } = useAuthSession();

  const [resume, setResume] = useState<Resume | null>(null);
  const [profile, setProfile] = useState<MyCandidateProfile | null>(null);
  const [resumeCount, setResumeCount] = useState<number>(0);
  const [loadError, setLoadError] = useState(false);
  const [primaryBusy, setPrimaryBusy] = useState(false);
  const [layout, setLayout] = useState<Layout>("single");
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    let cancelled = false;
    void (async () => {
      try {
        const [r, p, all] = await Promise.all([
          getMyResume(resumeId),
          getMyCandidateProfile().catch(() => null),
          getMyResumes().catch(() => [] as Resume[])
        ]);
        if (cancelled) return;
        setResume(r);
        setProfile(p);
        setResumeCount(Array.isArray(all) ? all.length : 0);
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

  function handlePrint() {
    if (typeof window === "undefined") return;
    window.print();
  }

  async function handleCopyShareLink() {
    if (typeof window === "undefined") return;
    const slug = resume?.shareSlug;
    if (!slug) {
      // 시드된 옛 데이터 등 어떤 이유로 슬러그가 없으면 알림 후 종료.
      alert(tr("공유 링크가 없어요. 이력서를 한 번 저장하면 생성됩니다.", "No share link yet — save the resume once to mint one.", "暂无分享链接，请先保存简历。", "Chưa có liên kết chia sẻ — hãy lưu hồ sơ một lần.", "共有リンクがありません。一度保存してください。", "Belum ada tautan — simpan resume sekali."));
      return;
    }
    const url = `${window.location.origin}/resume/share/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers — fall back to prompt so the user can copy manually.
      window.prompt(tr("이 링크를 복사하세요", "Copy this link", "请复制此链接", "Sao chép liên kết", "このリンクをコピー", "Salin tautan ini"), url);
      return;
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
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
            <Link href="/login?next=/profile?tab=resume">{tr("로그인", "Sign in", "登录", "Đăng nhập", "ログイン", "Masuk")}</Link>
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
            <Link href="/profile?tab=resume">{tr("이력서 목록으로", "Back to resumes", "返回简历列表", "Về danh sách hồ sơ", "履歴書一覧へ", "Ke daftar resume")}</Link>
          </Button>
        </main>
      </div>
    );
  }
  if (!isReady || !resume) {
    return (
      <>
        <Header />
        <ResumeSheetSkeleton />
      </>
    );
  }

  const c = resume.content ?? {};
  // 한국어 번역 캐시 — 저장 시 외국어 본문이 감지된 단위만 채워짐. 없으면
  // 그대로 원문만 보여줌. 화면 어디에 표시할지는 sub-component 들이 결정.
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

  // 기본정보 fallback chain
  const nameVal = c.basicName?.trim() || user?.name || user?.realName || "";
  const emailVal = c.basicEmail?.trim() || user?.email || "";
  const phoneVal = c.basicPhone?.trim() || user?.phoneNumber || "";
  const residenceVal = c.basicResidence?.trim() || profile?.residenceProvince || "";
  const visaVal = visaLabel(c.basicVisa ?? profile?.visaType ?? c.visaType ?? null) || "";

  // 1개뿐인 이력서는 자동 대표로 간주 (배지/버튼 UX 일관화)
  const isEffectivelyPrimary = resume.isPrimary || resumeCount <= 1;

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
      <Header />
      <main className="container pb-16 pt-6 md:pt-10">
        <div className="mx-auto max-w-4xl">
          {/* Top bar — back link + layout toggle + actions (hidden on print) */}
          <div className="resume-toolbar mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/profile?tab=resume"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft weight="bold" className="h-4 w-4" />
              {tr("이력서 목록", "Resumes", "简历列表", "Danh sách hồ sơ", "履歴書一覧", "Daftar resume")}
            </Link>
            <div className="flex items-center gap-2">
              {/* Layout segmented control */}
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
              <Button variant="outline" size="sm" onClick={handlePrint} className="h-9 px-3">
                <span className="inline-flex items-center gap-1.5">
                  <DownloadSimple weight="bold" className="h-4 w-4" />
                  {tr("PDF 다운로드", "Download PDF", "下载 PDF", "Tải PDF", "PDFダウンロード", "Unduh PDF")}
                </span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleCopyShareLink} className="h-9 px-3">
                <span className="inline-flex items-center gap-1.5">
                  {shareCopied ? (
                    <Check weight="bold" className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <LinkSimple weight="bold" className="h-4 w-4" />
                  )}
                  {shareCopied
                    ? tr("복사됨", "Copied", "已复制", "Đã sao chép", "コピー済み", "Tersalin")
                    : tr("공유 링크", "Share link", "分享链接", "Liên kết chia sẻ", "共有リンク", "Tautan bagikan")}
                </span>
              </Button>
              <Button asChild variant="outline" size="sm" className="h-9 px-3">
                <Link href={`/resume/${resume.id}/edit`} className="inline-flex items-center gap-1.5">
                  <PencilSimple weight="bold" className="h-4 w-4" />
                  {tr("수정", "Edit", "编辑", "Sửa", "編集", "Edit")}
                </Link>
              </Button>
            </div>
          </div>

          {/* Resume sheet */}
          <article className="resume-sheet rounded-3xl border border-border bg-white p-6 shadow-sm md:p-10">
            {/* Top Aply mark — 로고 클릭 시 aply.global 새창 이동 */}
            <div className="mb-6 flex items-center justify-between border-b border-border pb-5">
              <a href="https://aply.global" target="_blank" rel="noopener noreferrer" aria-label="Aply" className="inline-flex">
                <Image
                  src="/img_logo.webp"
                  alt="Aply"
                  width={84}
                  height={26}
                  className="h-6 w-auto object-contain"
                  priority
                />
              </a>
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                {tr("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume")}
              </span>
            </div>

            {/* Single-column mode keeps the wide hero on top. Two-column
                mode renders its own sidebar (photo + name + about + contact)
                so we skip this hero to avoid double-presenting the basics. */}
            {layout === "single" ? (
              // 우측 컬럼(이름 + 연락처 4줄)을 사진 높이를 기준으로 위아래
              // 동일 간격으로 중앙정렬. 사진이 시각적 앵커가 되도록 items-center.
              <header className="resume-hero flex items-center gap-5 md:gap-6">
                {c.basicPhotoUrl ? (
                  // 너비 고정 + 3:4 비율 → 모바일 96×128 / 데스크탑 112×149.
                  // 우측 컬럼 높이(이름 1줄 + 연락처 4줄)에 거의 들어맞도록
                  // 사이즈 조정.
                  <div className="aspect-[3/4] w-24 flex-none overflow-hidden rounded-2xl border border-border md:w-28">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.basicPhotoUrl}
                      alt={nameVal || "Profile photo"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <h1 className="text-[28px] font-bold tracking-tight text-foreground md:text-[34px]">
                    {nameVal || tr("이름 미입력", "Name not set", "未填写姓名", "Chưa nhập tên", "氏名未入力", "Nama belum diisi")}
                  </h1>
                  {/* 사진 옆 빈 공간을 채우도록 연락처를 가로 1줄 → 세로 스택으로
                      바꿈. 메일/전화/주소(+비자)가 각자 한 줄씩. */}
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
                {tr("아직 내용이 비어있어요. 수정에서 채워보세요.", "Nothing filled in yet. Tap edit to start.", "内容还是空的，点击编辑开始填写。", "Chưa có nội dung. Nhấn sửa để bắt đầu.", "まだ内容が空です。編集から入力しましょう。", "Belum ada isi. Ketuk edit untuk mulai.")}
              </p>
            ) : layout === "single" ? (
              <SingleColumnBody
                tr={tr}
                c={c}
                ko={ko}
                eduList={eduList}
                careerList={careerList}
                activityList={activityList}
                skills={skills}
                languageList={languageList}
                certList={certList}
                linkList={linkList}
                eduTypeLabel={eduTypeLabel}
                eduStatusLabel={eduStatusLabel}
              />
            ) : (
              <SidebarLayout
                tr={tr}
                c={c}
                ko={ko}
                nameVal={nameVal}
                emailVal={emailVal}
                phoneVal={phoneVal}
                residenceVal={residenceVal}
                visaVal={visaVal}
                eduList={eduList}
                careerList={careerList}
                activityList={activityList}
                skills={skills}
                languageList={languageList}
                certList={certList}
                linkList={linkList}
                eduTypeLabel={eduTypeLabel}
                eduStatusLabel={eduStatusLabel}
              />
            )}

            {/* Aply 워터마크 — 이력서 시트 안에 박혀있어서 PDF에도 그대로
                남고, 외부에 공유된 페이지에서도 "Aply에서 만든 이력서"임을
                알아볼 수 있게 합니다. */}
            <footer className="resume-footer mt-12 flex flex-col items-center gap-2 border-t border-border pt-6 text-center">
              <a href="https://aply.global" target="_blank" rel="noopener noreferrer" aria-label="Aply" className="inline-flex">
                <Image
                  src="/img_logo.webp"
                  alt="Aply"
                  width={140}
                  height={42}
                  className="h-9 w-auto object-contain"
                  priority={false}
                />
              </a>
              <p className="text-[12.5px] text-muted-foreground">
                {tr("Aply 에서 만든 이력서예요", "Made with Aply — Korean job matching", "通过 Aply 制作", "Tạo bằng Aply", "Aplyで作成された履歴書です", "Dibuat dengan Aply")}{" "}
                <a
                  href="https://aply.global"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  aply.global
                </a>
              </p>
            </footer>
          </article>

          {/* Actions — hidden on print. "매칭 공고 보기" 버튼은 제거. */}
          {!isEffectivelyPrimary ? (
            <div className="resume-actions mt-6">
              <Button onClick={handleSetPrimary} disabled={primaryBusy} variant="outline" className="h-12 w-full">
                <span className="inline-flex items-center gap-1.5">
                  <Star weight="fill" className="h-4 w-4" />
                  {tr("대표 이력서로 설정", "Set as primary", "设为代表简历", "Đặt làm hồ sơ đại diện", "代表履歴書に設定", "Jadikan resume utama")}
                </span>
              </Button>
            </div>
          ) : null}
        </div>
      </main>

      {/* Print-only styling — hides site chrome and lets the sheet flow to
          the page. Applied as global so the site Header can be hidden too. */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 12mm;
          }
          html, body {
            background: #ffffff !important;
          }
          /* Hide site chrome ONLY — keep the resume sheet's own header (hero)
             and footer (Aply watermark). The previous broad header/footer
             rule was wiping out the sheet's own elements, which is why
             the PDF looked different from the on-screen view. */
          header:not(.resume-hero),
          nav,
          footer:not(.resume-footer),
          .resume-toolbar,
          .resume-actions {
            display: none !important;
          }
          /* Strip the in-app card chrome; print should look like a plain doc. */
          main {
            padding: 0 !important;
          }
          .resume-sheet {
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
          a {
            color: inherit !important;
            text-decoration: none !important;
          }
          /* Avoid awkward orphan headings at the top of page 2. */
          h1, h2 {
            break-after: avoid;
          }
          section, article {
            break-inside: avoid;
          }
          /* 인쇄 영역은 ~700px 라 Tailwind md(768+) 브레이크포인트가 안
             잡힘. 두 컬럼 사이드바와 스킬/어학/자격 서브그리드를 인쇄에서도
             강제로 두 컬럼으로 잡아 화면 보기와 동일하게 출력. */
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
// Body layouts
// ---------------------------------------------------------------------------

type Trans = (ko: string, en: string, zh: string, vi: string, ja: string, id: string) => string;
type C = NonNullable<Resume["content"]>;
type Ko = NonNullable<NonNullable<Resume["translations"]>["ko"]>;
type SectionProps = {
  tr: Trans;
  c: C;
  // 한국어 번역 캐시. 외국어로 쓴 본문이 있는 자기소개/요약/경력·활동
  // description 옆에 쌍으로 표시. 없으면 그냥 무시.
  ko?: Ko;
  eduList: NonNullable<C["educations"]>;
  careerList: NonNullable<C["careers"]>;
  activityList: NonNullable<C["activities"]>;
  skills: NonNullable<C["skills"]>;
  languageList: NonNullable<C["languages"]>;
  certList: NonNullable<C["certifications"]>;
  linkList: NonNullable<C["links"]>;
  eduTypeLabel: (v?: CandidateEducationType) => string | null | undefined;
  eduStatusLabel: (v?: CandidateEducationStatus) => string | null | undefined;
  // 두 가지 시각 스타일 — 같은 데이터로 다른 톤을 렌더링.
  variant?: "classic" | "sidebar";
};

// 한국어 번역을 원문 아래에 인용 박스로 표시. 한국 기업이 메인 독자라
// 한국어를 강조하기보다 "원문 + 보조 한국어" 의 차분한 톤으로 둠.
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

function SingleColumnBody(props: SectionProps) {
  // 단일 컬럼은 기존 "클래식" 톤 — 액센트 점 + 대문자 헤더, 모든 섹션이
  // 한 흐름으로 쭉 이어지는 추천서/PDF 친화 레이아웃.
  const variant = "classic" as const;
  const { tr, c, ko, eduList, careerList, activityList, skills, languageList, certList, linkList } = props;
  return (
    <div className="mt-7 space-y-10">
      {c.summary || c.selfIntroduction ? <AboutSection tr={tr} c={c} ko={ko} variant={variant} /> : null}
      {careerList.length > 0 ? <CareerSection {...props} variant={variant} /> : null}
      {activityList.length > 0 ? <ActivitySection {...props} variant={variant} /> : null}
      {eduList.length > 0 ? <EducationSection {...props} variant={variant} /> : null}
      {skills.length > 0 ? <SkillsSection tr={tr} skills={skills} variant={variant} /> : null}
      {languageList.length > 0 ? <LanguageSection tr={tr} list={languageList} variant={variant} /> : null}
      {certList.length > 0 ? <CertSection tr={tr} list={certList} variant={variant} /> : null}
      {linkList.length > 0 ? <LinkSection tr={tr} list={linkList} variant={variant} /> : null}
    </div>
  );
}

// Sidebar layout — portrait-style left column carries the photo, name,
// about, contact and links; the right column holds Experience, Education
// and the sub-grid of Skills/Languages/Certificates. Modeled on classic
// recruiter-document layouts (think Wanted / Coursera portfolio resumes).
function SidebarLayout(props: SectionProps & {
  nameVal: string;
  emailVal: string;
  phoneVal: string;
  residenceVal: string;
  visaVal: string;
}) {
  const {
    tr,
    c,
    ko,
    nameVal,
    emailVal,
    phoneVal,
    residenceVal,
    visaVal,
    eduList,
    careerList,
    activityList,
    skills,
    languageList,
    certList,
    linkList
  } = props;

  return (
    <div className="resume-sidebar-grid mt-2 grid grid-cols-1 gap-10 md:grid-cols-[230px_1fr] md:gap-12">
      {/* ---------- LEFT: portrait sidebar ----------
          순서: 사진 → 이름 → (메일·전화·주소·비자) → 한 줄 요약·자기소개 → 링크.
          연락처가 이름 바로 아래에 붙어 있고, 그 다음에 요약/자기소개가 와요. */}
      <aside className="space-y-6 md:order-1">
        {c.basicPhotoUrl ? (
          <div className="overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.basicPhotoUrl}
              alt={nameVal || "Profile photo"}
              className="aspect-[3/4] w-full object-cover"
            />
          </div>
        ) : null}

        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-foreground">
          {nameVal || tr("이름 미입력", "Name not set", "未填写姓名", "Chưa nhập tên", "氏名未入力", "Nama belum diisi")}
        </h1>

        {/* Contact info — 이름 바로 아래, 이메일 → 전화 → 주소 순 */}
        {(emailVal || phoneVal || residenceVal || visaVal) ? (
          <div className="space-y-1 text-[12.5px] leading-relaxed text-muted-foreground">
            {emailVal ? <p>{emailVal}</p> : null}
            {phoneVal ? <p>{phoneVal}</p> : null}
            {residenceVal ? <p>{residenceVal}</p> : null}
            {visaVal ? <p>{visaVal}</p> : null}
          </div>
        ) : null}

        {/* Summary one-liner + Self-introduction (연락처 아래) */}
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
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
                  {c.selfIntroduction}
                </p>
                <KoLine text={ko?.selfIntroduction} />
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Links list — label : url style */}
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

      {/* ---------- RIGHT: main column ----------- */}
      <div className="space-y-12 md:order-2">
        {careerList.length > 0 ? <CareerSection {...props} /> : null}
        {activityList.length > 0 ? <ActivitySection {...props} /> : null}
        {eduList.length > 0 ? <EducationSection {...props} /> : null}

        {/* Skills + Languages + Certs in a sub-grid */}
        {(skills.length > 0 || languageList.length > 0 || certList.length > 0) ? (
          <div className="resume-meta-grid grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
            {skills.length > 0 ? <SkillsSection tr={tr} skills={skills} compact /> : null}
            {languageList.length > 0 ? <LanguageSection tr={tr} list={languageList} compact /> : null}
            {certList.length > 0 ? <CertSection tr={tr} list={certList} compact /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section atoms
// ---------------------------------------------------------------------------

// Section header. Bigger title + thin rule underneath separates the heading
// from its content so the reader instantly sees where one section ends and
// another begins. The leading accent dot is a small but persistent visual
// anchor for the eye.
// Single section-title style applied to BOTH layouts — Title Case, 24px bold.
// The `variant` arg is kept for API back-compat (section atoms still pass it
// through) but no longer changes rendering: dot accent and uppercase are
// gone everywhere per the unified resume look.
function SectionTitle({
  children
}: {
  children: React.ReactNode;
  variant?: "classic" | "sidebar";
}) {
  return (
    <h2 className="mb-4 text-[24px] font-bold tracking-tight text-foreground">{children}</h2>
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

function AboutSection({ tr, c, ko, variant }: { tr: Trans; c: C; ko?: Ko; variant?: "classic" | "sidebar" }) {
  return (
    <section>
      <SectionTitle variant={variant}>{tr("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang")}</SectionTitle>
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

// 기간 포맷 — "YYYY-MM" 같은 month input 값을 "YYYY.MM"으로 다듬어 보여줌.
// 자유 입력 ("재직중", "Present" 등)은 그대로 통과.
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

function CareerSection({ tr, careerList, ko, variant }: SectionProps) {
  return (
    <section>
      <SectionTitle variant={variant}>{tr("경력", "Experience", "经历", "Kinh nghiệm", "経歴", "Pengalaman")}</SectionTitle>
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

function ActivitySection({ tr, activityList, ko, variant }: SectionProps) {
  return (
    <section>
      <SectionTitle variant={variant}>{tr("프로젝트", "Projects", "项目/活动", "Dự án / Hoạt động", "プロジェクト/活動", "Proyek")}</SectionTitle>
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

function EducationSection({ tr, eduList, eduTypeLabel, eduStatusLabel, variant }: SectionProps) {
  return (
    <section>
      <SectionTitle variant={variant}>{tr("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan")}</SectionTitle>
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

function SkillsSection({ tr, skills, compact, variant }: { tr: Trans; skills: string[]; compact?: boolean; variant?: "classic" | "sidebar" }) {
  return (
    <section>
      <SectionTitle variant={variant}>{tr("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Skill")}</SectionTitle>
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

function LanguageSection({
  tr,
  list,
  compact,
  variant
}: {
  tr: Trans;
  list: NonNullable<C["languages"]>;
  compact?: boolean;
  variant?: "classic" | "sidebar";
}) {
  return (
    <section>
      <SectionTitle variant={variant}>{tr("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa")}</SectionTitle>
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

function CertSection({
  tr,
  list,
  compact,
  variant
}: {
  tr: Trans;
  list: NonNullable<C["certifications"]>;
  compact?: boolean;
  variant?: "classic" | "sidebar";
}) {
  return (
    <section>
      <SectionTitle variant={variant}>{tr("자격 / 수상", "Certificates / Awards", "证书/获奖", "Chứng chỉ / Giải thưởng", "資格/受賞", "Sertifikat / Penghargaan")}</SectionTitle>
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

function LinkSection({
  tr,
  list,
  compact,
  variant
}: {
  tr: Trans;
  list: NonNullable<C["links"]>;
  compact?: boolean;
  variant?: "classic" | "sidebar";
}) {
  return (
    <section>
      <SectionTitle variant={variant}>{tr("포트폴리오 / 링크", "Portfolio / Links", "作品集/链接", "Portfolio / Liên kết", "ポートフォリオ/リンク", "Portofolio / Tautan")}</SectionTitle>
      <ul className={compact ? "space-y-1" : "space-y-1.5"}>
        {list.map((l, i) => (
          <li key={i}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 ${compact ? "text-[13px]" : "text-[14.5px]"} text-primary hover:underline`}
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
