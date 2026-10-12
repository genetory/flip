"use client";

// v2 공고 상세 — 무엇을 하는 자리인지 → 나와 맞는 점 → 할 일(저장·지원·모의 면접·맞춤 자소서) → 회사. 게스트도 본다.
// 기존 화면(JobDetailScreen)의 데이터·흐름을 그대로 쓰되 v2 모양으로. 모의 면접은 v2 시작 시트 → 모의 면접 세션(InterviewSession).
// 지원 서류 준비 기준은 v2 내 커리어와 같다 — 이력서는 필수 항목, 자기소개서는 문항 1개 이상.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { V2Shell, V2_ROUTES } from "../V2Shell";
import { Button, Page, Row, RowsSkeleton } from "../ui";
import { Sheet } from "../sheets";
import { PracticeSheet, type PracticeQuestion } from "../practice";
import { companyOf, daysUntil, docsReady, jobPhotoOf, shortPlace } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import {
  addMyFavoritePosition,
  applyMyPosition,
  getMyAppliedPositions,
  getMyFavoritePositions,
  getMyMockInterviewUsage,
  getPublicPositionById,
  getPublicPositionsPage,
  getInterviewQuestions,
  removeMyFavoritePosition,
  type InterviewReportItem,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { toPositionView } from "../../../lib/talent/positions-adapter";
import { deriveForeignerEligibility } from "../../../lib/talent/foreigner-eligibility";
import { useResumeDoc, type ResumeDoc } from "../../../lib/talent/resume-doc";
import { useCoverDoc, saveCoverDoc, generateCoverDoc } from "../../../lib/talent/cover-doc";
import { notifyApplied, notifySavedPosition } from "../../../lib/talent/activity-log";
import { setFabInset, clearFabInset } from "../../../lib/talent/fab-inset";
import { parseOfficePhotos } from "../../../lib/image-upload";
import { trackInterviewStart } from "../../../lib/analytics";
import { StartSheet } from "../interview-content";
import { InterviewSession } from "../interview-session";

const EDITOR = { resume: "/talent/career/resume/editor", cover: "/talent/career/cover/editor" };

export function V2JobDetailScreen({ id }: { id: string }) {
  return (
    <V2Shell>
      <JobDetail id={id} />
    </V2Shell>
  );
}

/** 마감 — 공고 상태가 OPEN 이 아니거나 마감일이 지났다(상시 채용 제외). 서버 lib/server/positions isClosed 와 같은 기준. */
function isClosed(p: PublicPositionListItem): boolean {
  if (p.status !== "OPEN") return true;
  if (p.sourceDeadlineRolling || !p.sourceDeadlineDate) return false;
  const d = daysUntil(p.sourceDeadlineDate);
  return d !== null && d < 0;
}

/** 글에 표기가 있나 — 영문은 단어 경계로, 한글은 띄어쓰기 무시(내 커리어와 같은 규칙). */
function termIn(text: string, term: string): boolean {
  const a = term.trim();
  if (!a) return false;
  if (/^[\x00-\x7F]+$/.test(a)) {
    const esc = a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s*");
    return new RegExp(`(^|[^A-Za-z0-9+#])${esc}(?![A-Za-z0-9+#])`, "i").test(text);
  }
  return text.replace(/\s+/g, "").toLowerCase().includes(a.replace(/\s+/g, "").toLowerCase());
}

function mySkills(resume: ResumeDoc | null): string[] {
  const out = (resume?.items ?? [])
    .filter((i) => i.section === "skill")
    .flatMap((i) => i.text.split(/[,，、\n·]|\s\/\s/))
    .map((x) => x.trim())
    .filter(Boolean);
  return [...new Set(out)];
}

function sizeLabel(t: PlatformT, s: string | null | undefined): string | null {
  switch (s) {
    case "SIZE_1_10":
      return t("1~10명", "1–10", "1~10人", "1–10", "1〜10名", "1–10");
    case "SIZE_UNDER_30":
      return t("30명 미만", "Under 30", "30人以下", "Dưới 30", "30名未満", "<30");
    case "SIZE_UNDER_50":
      return t("50명 미만", "Under 50", "50人以下", "Dưới 50", "50名未満", "<50");
    case "SIZE_OVER_100":
      return t("100명 이상", "100+", "100人以上", "100+", "100名以上", "100+");
    default:
      return null;
  }
}

function JobDetail({ id }: { id: string }) {
  const t = usePlatformT();
  const router = useRouter();
  const { locale } = useLanguage();
  const { isAuthenticated } = useAuthSession();
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const [item, setItem] = useState<PublicPositionListItem | null | undefined>(undefined); // undefined = 불러오는 중, null = 실패
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [gate, setGate] = useState(false);
  const [limit, setLimit] = useState({ reached: false, limit: 3 });
  const [practice, setPractice] = useState(false);
  const [confirmTailor, setConfirmTailor] = useState(false);

  useEffect(() => {
    let alive = true;
    getPublicPositionById(id, { locale })
      .then((p) => alive && setItem(p))
      .catch(() => alive && setItem(null));
    return () => {
      alive = false;
    };
  }, [id, locale]);
  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    getMyFavoritePositions()
      .then((list) => alive && setSaved(list.some((p) => p.id === id)))
      .catch(() => {});
    getMyAppliedPositions()
      .then((list) => alive && setApplied(list.some((p) => p.id === id)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [id, isAuthenticated]);
  // 모바일 하단 고정 바 — 전역 피드백 버튼이 덮지 않게 비켜 세운다.
  useEffect(() => {
    if (!item) return;
    const apply = () => (window.innerWidth <= 767 ? setFabInset("v2-job-detail", 76) : clearFabInset("v2-job-detail"));
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      clearFabInset("v2-job-detail");
    };
  }, [item]);

  const needLogin = () => router.push(`/talent/login?next=${encodeURIComponent(`/v2/jobs/${id}`)}`);

  if (item === undefined) return <DetailSkeleton />;
  if (item === null)
    return (
      <Page>
        <div className="px-5 py-20 text-center">
          <p className="text-[18px] font-bold text-[color:var(--v2-ink)]">{t("공고를 불러오지 못했어요", "Couldn't load this job", "无法加载该职位", "Không tải được tin", "求人を読み込めませんでした", "Gagal memuat lowongan")}</p>
          <p className="mt-2 text-[15px] text-[color:var(--v2-muted)]">{t("마감됐거나 잠시 문제가 있어요.", "It may be closed, or something went wrong.", "可能已截止或暂时出错。", "Có thể đã đóng hoặc có lỗi.", "締切か一時的な問題です。", "Mungkin sudah tutup atau ada masalah.")}</p>
          <div className="mt-6">
            <Button href={V2_ROUTES.jobs} variant="secondary">
              {t("다른 공고 보기", "Browse jobs", "看看其他职位", "Xem tin khác", "他の求人を見る", "Lihat lowongan lain")}
            </Button>
          </div>
        </div>
      </Page>
    );

  const view = toPositionView(item, t);
  const company = companyOf(item) || view.company;
  const org = item.partnerOrganization;
  const closed = isClosed(item);
  const d = item.sourceDeadlineDate && !item.sourceDeadlineRolling ? daysUntil(item.sourceDeadlineDate) : null;
  const deadline = closed
    ? t("마감됐어요", "Closed", "已截止", "Đã đóng", "締切", "Ditutup")
    : item.sourceDeadlineRolling
      ? t("상시 채용", "Rolling", "常年招聘", "Tuyển liên tục", "随時募集", "Bergulir")
      : d === null
        ? null
        : d === 0
          ? t("오늘 마감", "Closes today", "今天截止", "Hôm nay hết hạn", "本日締切", "Tutup hari ini")
          : `D-${d}`;
  const photo = jobPhotoOf(item);
  const eligibility = deriveForeignerEligibility(item);
  const visas = (item.eligibleVisas ?? []).filter((v) => v && v !== "FOREIGNER_FRIENDLY");
  const reqText = `${item.title}\n${item.requiredQualifications ?? ""}\n${item.preferredQualifications ?? ""}`;
  const skills = mySkills(resume);
  const hits = skills.filter((k) => termIn(reqText, k));
  const canPractice = !!(item.mockInterviewIntent || item.mockInterviewQuestions || item.mainResponsibilities || item.requiredQualifications);
  const ready = docsReady(resume, cover);

  const toggleSave = () => {
    if (!isAuthenticated) return needLogin();
    const next = !saved;
    setSaved(next);
    (next ? addMyFavoritePosition(id) : removeMyFavoritePosition(id))
      .then(() => {
        if (next) notifySavedPosition(t, id, item.title);
      })
      .catch(() => setSaved(!next));
  };
  const startPractice = () => {
    if (!isAuthenticated) return needLogin();
    trackInterviewStart("job");
    getMyMockInterviewUsage()
      .then((u) => setLimit({ reached: u.companiesUsedToday >= u.dailyCompanyLimit && !u.practicedTodayPositionIds.includes(id), limit: u.dailyCompanyLimit }))
      .catch(() => setLimit({ reached: false, limit: 3 }));
    setGate(true);
  };
  const applyTailor = () => {
    const base = cover ?? generateCoverDoc();
    const jd = [item.title, item.requiredQualifications ? `[자격 요건]\n${item.requiredQualifications}` : "", item.preferredQualifications ? `[우대 사항]\n${item.preferredQualifications}` : ""].filter(Boolean).join("\n\n").slice(0, 4000);
    saveCoverDoc({ ...base, companyName: company, jobText: jd }, { label: t(`${company} 공고에 맞춤`, `Tailored to ${company}`, `针对${company}`, `Theo ${company}`, `${company}向け`, `Untuk ${company}`), force: true });
    router.push(EDITOR.cover);
  };
  const tailor = () => {
    if (!isAuthenticated) return needLogin();
    const current = cover?.companyName?.trim();
    if (current && current !== company) setConfirmTailor(true);
    else applyTailor();
  };
  const openApply = () => {
    if (!isAuthenticated) return needLogin();
    setApplyError(null);
    setApplyOpen(true);
  };
  const submit = () => {
    setApplying(true);
    setApplyError(null);
    applyMyPosition(id)
      .then(() => {
        setApplied(true);
        setApplyOpen(false);
        notifyApplied(t, id, item.title, company);
      })
      .catch(() => setApplyError(t("지원하지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't apply. Please try again.", "投递失败，请稍后再试。", "Không ứng tuyển được. Thử lại sau.", "応募できませんでした。", "Gagal melamar. Coba lagi.")))
      .finally(() => setApplying(false));
  };

  const applyLabel = applied
    ? t("지원했어요", "Applied", "已投递", "Đã ứng tuyển", "応募済み", "Sudah melamar")
    : closed
      ? t("마감된 공고예요", "Closed", "已截止", "Đã đóng", "締切済み", "Ditutup")
      : view.external
        ? t(`${view.sourceLabel ?? "외부"}에서 지원하기`, `Apply on ${view.sourceLabel ?? "site"}`, `去${view.sourceLabel ?? "外部"}投递`, `Ứng tuyển trên ${view.sourceLabel ?? "web"}`, `${view.sourceLabel ?? "外部"}で応募`, `Lamar di ${view.sourceLabel ?? "situs"}`)
        : t("지원하기", "Apply", "投递", "Ứng tuyển", "応募する", "Lamar");
  const applyButton = (full: boolean) =>
    view.external && view.externalUrl && !closed ? (
      <a href={view.externalUrl} target="_blank" rel="noopener noreferrer" className={`inline-flex h-12 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--v2-accent)] px-5 text-[16px] font-semibold text-white transition hover:opacity-90 ${full ? "w-full" : ""}`}>
        {applyLabel}
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 17 17 7M9 7h8v8" />
        </svg>
      </a>
    ) : (
      <Button full={full} onClick={openApply} disabled={applied || closed}>
        {applyLabel}
      </Button>
    );
  const saveButton = (
    <button type="button" onClick={toggleSave} aria-pressed={saved} aria-label={saved ? t("저장 취소", "Unsave", "取消收藏", "Bỏ lưu", "保存解除", "Batal simpan") : t("저장", "Save", "收藏", "Lưu", "保存", "Simpan")} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--v2-band)] transition hover:bg-[color:var(--v2-line)]">
      <svg viewBox="0 0 24 24" className={`h-5 w-5 ${saved ? "text-[color:var(--v2-accent)]" : "text-[color:var(--v2-ink-3)]"}`} fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
      </svg>
    </button>
  );

  const officePhotos = parseOfficePhotos(org?.officePhotoImageData ?? null).slice(0, 4);
  const info = [
    [t("모집 직무", "Role", "招聘职位", "Vị trí", "募集職種", "Posisi"), item.preferredJobRole],
    [t("모집 인원", "Openings", "招聘人数", "Số lượng", "募集人数", "Jumlah"), item.hiringCount ? t(`${item.hiringCount}명`, `${item.hiringCount}`, `${item.hiringCount}人`, `${item.hiringCount}`, `${item.hiringCount}名`, `${item.hiringCount}`) : null],
    [t("근무 시간", "Hours", "工作时间", "Giờ làm", "勤務時間", "Jam kerja"), item.workingHours],
    [t("복장", "Dress code", "着装", "Trang phục", "服装", "Pakaian"), item.dressCode]
  ].filter((x): x is [string, string] => !!x[1]);

  return (
    <Page>
      {/* 맨 위 — 대표 사진 · 회사 · 공고 이름 · 한 줄 정보 */}
      <header className="px-5 pt-6 md:pt-10">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="mb-5 aspect-[16/8] w-full rounded-2xl object-cover" />
        ) : null}
        <div className="flex items-center gap-2">
          {org?.companyLogoImageData ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.companyLogoImageData} alt="" className="h-7 w-7 rounded-lg object-cover" />
          ) : null}
          <p className="min-w-0 flex-1 truncate text-[15px] font-semibold text-[color:var(--v2-ink-3)]">{company}</p>
          <ShareButton t={t} id={id} title={`${company} · ${item.title}`} />
        </div>
        <h1 className="mt-2 text-[24px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)] md:text-[28px]">{item.title}</h1>
        <p className="mt-2 text-[15px] text-[color:var(--v2-muted)]">
          {[shortPlace(item.workLocation || org?.officeAddress), view.employmentLabel, view.workTypeLabel].filter(Boolean).join(" · ")}
          {deadline ? (
            <>
              {" · "}
              <span className={`font-semibold ${closed ? "text-[color:var(--v2-faint)]" : d !== null && d <= 7 ? "text-[color:var(--v2-attention)]" : "text-[color:var(--v2-ink-3)]"}`}>{deadline}</span>
            </>
          ) : null}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {view.isInternal ? <Tag accent>Aply ONLY</Tag> : view.sourceLabel ? <Tag>{view.sourceLabel}</Tag> : null}
          {eligibility === "VERIFIED" || eligibility === "LIKELY" ? <Tag accent>{t("외국인 채용 가능", "Foreigners OK", "可招外国人", "Nhận người nước ngoài", "外国人採用可", "Terbuka WNA")}</Tag> : null}
          {view.hasMockInterview ? <Tag accent>{t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Simulasi")}</Tag> : null}
        </div>
        <div className="mt-6 hidden gap-2 md:flex">
          {saveButton}
          <div className="w-64">{applyButton(true)}</div>
        </div>
      </header>

      {/* 나와 맞는 점 · 할 일 — 지원 전에 준비할 것을 이 공고 기준으로 */}
      <Block title={t("이 공고, 나는 어때요?", "How do you fit?", "我适合吗？", "Bạn có phù hợp?", "自分に合う？", "Cocok untukmu?")}>
        {isAuthenticated ? (
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
            {hits.length
              ? t(`공고 요건과 겹치는 내 스킬 — ${hits.slice(0, 5).join(" · ")}`, `Your skills ${hits.slice(0, 5).join(" · ")} appear in this job.`, `你的技能 ${hits.slice(0, 5).join(" · ")} 出现在该职位要求中。`, `Kỹ năng ${hits.slice(0, 5).join(" · ")} có trong yêu cầu.`, `あなたのスキル ${hits.slice(0, 5).join("・")} が要件にあります。`, `Keahlian ${hits.slice(0, 5).join(" · ")} ada di syarat.`)
              : t("이력서 스킬과 겹치는 요건은 아직 없어요. 자격 요건을 보고 해 본 것이 있다면 이력서에 적어 보세요.", "No skill overlap yet — if you've done what's required, add it to your resume.", "暂无与简历技能重合的要求。如有相关经验，请写进简历。", "Chưa có kỹ năng trùng — nếu đã làm, hãy thêm vào CV.", "スキルの一致はまだありません。経験があれば履歴書に書きましょう。", "Belum ada keahlian yang cocok — tambahkan ke CV jika pernah.")}
          </p>
        ) : (
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("로그인하면 내 이력서와 이 공고를 비교해 보여 드려요.", "Log in to compare your resume with this job.", "登录后可将简历与该职位对比。", "Đăng nhập để so CV với tin này.", "ログインすると履歴書と比べられます。", "Masuk untuk membandingkan CV.")}</p>
        )}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <ActionCard
            title={t("이 공고에 맞춰 자소서 쓰기", "Tailor your cover letter", "按此职位写自我介绍", "Viết thư theo tin này", "この求人向けに自己PR", "Sesuaikan surat lamaran")}
            desc={t("회사·공고 내용을 자기소개서에 넣고 AI로 맞춰 써요", "Adds the company and JD so AI can tailor it", "填入公司和职位内容，用 AI 定制", "Thêm công ty và JD để AI viết theo", "会社と求人内容を入れてAIで合わせます", "Isi perusahaan & JD agar AI menyesuaikan")}
            onClick={tailor}
          />
          {canPractice ? (
            <ActionCard
              title={t("이 공고로 모의 면접", "Mock interview for this job", "用此职位模拟面试", "Phỏng vấn thử cho tin này", "この求人で模擬面接", "Simulasi untuk lowongan ini")}
              desc={view.isInternal ? t("회사가 낸 질문과 공고로 연습해요", "Practice with the company's questions", "用公司提供的问题练习", "Luyện với câu hỏi của công ty", "会社の質問で練習します", "Latihan dengan pertanyaan perusahaan") : t("공고 내용으로 나올 만한 질문을 연습해요", "Practice likely questions from the JD", "根据职位内容练习可能的问题", "Luyện câu hỏi có thể gặp từ JD", "求人内容から想定質問を練習", "Latihan pertanyaan dari JD")}
              onClick={startPractice}
            />
          ) : null}
        </div>
      </Block>

      <CompanyQuestions t={t} company={company} loggedIn={isAuthenticated} onLogin={needLogin} />

      {item.mainResponsibilities ? <TextBlock title={t("주요 업무", "What you'll do", "主要工作", "Công việc chính", "主な業務", "Tugas utama")} text={item.mainResponsibilities} /> : null}
      {item.requiredQualifications ? <TextBlock title={t("자격 요건", "Requirements", "任职要求", "Yêu cầu", "応募資格", "Persyaratan")} text={item.requiredQualifications} highlight={hits} /> : null}
      {item.preferredQualifications ? <TextBlock title={t("우대 사항", "Nice to have", "优先条件", "Ưu tiên", "歓迎条件", "Nilai tambah")} text={item.preferredQualifications} highlight={hits} /> : null}
      {item.hiringProcess ? <TextBlock title={t("채용 절차", "Hiring process", "招聘流程", "Quy trình", "選考フロー", "Proses rekrutmen")} text={item.hiringProcess} /> : null}

      {info.length ? (
        <Block title={t("근무 정보", "Details", "工作信息", "Thông tin", "勤務情報", "Detail")}>
          <dl className="divide-y divide-[color:var(--v2-band)]">
            {info.map(([k, v]) => (
              <div key={k} className="flex gap-4 py-3">
                <dt className="w-24 shrink-0 text-[15px] text-[color:var(--v2-muted)]">{k}</dt>
                <dd className="min-w-0 flex-1 whitespace-pre-wrap text-[15px] text-[color:var(--v2-ink-2)]">{v}</dd>
              </div>
            ))}
          </dl>
        </Block>
      ) : null}

      <Block title={t("외국인 지원", "For internationals", "外国人申请", "Người nước ngoài", "外国人の応募", "Untuk WNA")}>
        <p className="text-[15px] font-semibold text-[color:var(--v2-ink-2)]">
          {eligibility === "VERIFIED"
            ? t("회사가 외국인 채용 가능하다고 밝혔어요", "The company accepts international applicants", "公司表示可招聘外国人", "Công ty nhận người nước ngoài", "会社が外国人採用可と明記", "Perusahaan menerima WNA")
            : eligibility === "LIKELY"
              ? t("외국인 지원 가능성이 높아요", "Likely open to internationals", "外国人申请可能性高", "Có thể nhận người nước ngoài", "外国人も応募できる可能性が高い", "Kemungkinan terbuka untuk WNA")
              : t("외국인 지원 여부는 회사에 확인이 필요해요", "Check with the company about internationals", "是否接受外国人需向公司确认", "Cần hỏi công ty về người nước ngoài", "外国人の応募可否は会社に確認が必要", "Perlu konfirmasi ke perusahaan")}
        </p>
        {visas.length ? <p className="mt-1 text-[14px] text-[color:var(--v2-muted)]">{t(`받는 비자: ${visas.join(", ")}`, `Visas: ${visas.join(", ")}`, `签证：${visas.join(", ")}`, `Visa: ${visas.join(", ")}`, `ビザ：${visas.join(", ")}`, `Visa: ${visas.join(", ")}`)}</p> : null}
        <p className="mt-2 text-[13px] leading-[1.5] text-[color:var(--v2-faint)]">{t("비자는 상황과 출입국 심사에 따라 달라요. Aply가 비자를 보장하지는 않아요.", "Visa outcomes depend on your situation and immigration review. Aply doesn't guarantee a visa.", "签证取决于个人情况和出入境审查，Aply 不保证签证。", "Visa phụ thuộc hoàn cảnh và xét duyệt. Aply không bảo đảm visa.", "ビザは状況と審査次第です。Aplyは保証しません。", "Visa tergantung situasi dan imigrasi. Aply tidak menjamin.")}</p>
      </Block>

      {org ? (
        <Block
          title={t("회사", "Company", "公司", "Công ty", "会社", "Perusahaan")}
          aside={
            view.isInternal && !view.isUndisclosedCompany ? (
              <Link href={`/talent/company/${encodeURIComponent(org.name)}`} className="text-[15px] font-medium text-[color:var(--v2-faint)] hover:text-[color:var(--v2-ink-3)]">
                {t("회사 더 보기", "More", "查看更多", "Xem thêm", "もっと見る", "Lainnya")}
              </Link>
            ) : undefined
          }
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[color:var(--v2-band)] text-[17px] font-bold text-[color:var(--v2-muted)]">
              {org.companyLogoImageData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={org.companyLogoImageData} alt="" className="h-full w-full object-cover" />
              ) : (
                company.slice(0, 1)
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[17px] font-bold text-[color:var(--v2-ink)]">{company}</p>
              <p className="truncate text-[14px] text-[color:var(--v2-muted)]">{[org.industry, sizeLabel(t, org.companySize), shortPlace(org.officeAddress)].filter(Boolean).join(" · ")}</p>
            </div>
          </div>
          {officePhotos.length ? (
            <div className={`mt-4 grid gap-2 ${officePhotos.length > 1 ? "grid-cols-2" : ""}`}>
              {officePhotos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
              ))}
            </div>
          ) : null}
          {org.description ? <p className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.7] text-[color:var(--v2-ink-3)]">{org.description}</p> : null}
          {org.strengths ? (
            <div className="mt-4 rounded-2xl bg-[color:var(--v2-fill)] p-4">
              <p className="text-[14px] font-bold text-[color:var(--v2-ink-2)]">{t("이 회사의 자랑", "Why work here", "公司亮点", "Điểm nổi bật", "この会社の魅力", "Keunggulan")}</p>
              <p className="mt-1.5 whitespace-pre-wrap text-[14px] leading-[1.65] text-[color:var(--v2-ink-3)]">{org.strengths}</p>
            </div>
          ) : null}
          {org.website ? (
            <a href={/^https?:\/\//i.test(org.website) ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-[color:var(--v2-accent)] hover:opacity-70">
              {t("회사 홈페이지", "Website", "公司官网", "Trang web", "公式サイト", "Situs web")}
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          ) : null}
        </Block>
      ) : null}

      <SimilarJobs t={t} item={item} />

      {/* 모바일 하단 고정 — 저장 · 지원 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--v2-line)] bg-white px-4 pt-3 md:hidden" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
        <div className="flex gap-2">
          {saveButton}
          <div className="min-w-0 flex-1">{applyButton(true)}</div>
        </div>
      </div>

      {applyOpen ? (
        <Sheet
          title={t("지원하기", "Apply", "投递", "Ứng tuyển", "応募する", "Lamar")}
          subtitle={`${company} · ${item.title}`}
          onClose={() => setApplyOpen(false)}
          footer={
            <Button full onClick={submit} disabled={applying || !ready.resume || !ready.cover}>
              {applying ? t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…") : t("이 서류로 지원하기", "Apply with these", "用这些材料投递", "Ứng tuyển với hồ sơ này", "この書類で応募", "Lamar dengan dokumen ini")}
            </Button>
          }
        >
          <p className="text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("지금 이력서와 자기소개서가 그대로 회사에 전달돼요. 보낸 뒤 고쳐도 보낸 서류는 바뀌지 않아요.", "Your current resume and cover letter are sent as they are. Later edits won't change what was sent.", "将按当前简历和自我介绍发送。之后修改不影响已发送内容。", "CV và thư hiện tại sẽ được gửi. Sửa sau không thay đổi bản đã gửi.", "今の履歴書と自己PRがそのまま送られます。後で直しても送信分は変わりません。", "CV dan surat saat ini dikirim apa adanya.")}</p>
          <div className="mt-4 flex flex-col gap-2">
            <DocRow t={t} label={t("이력서", "Resume", "简历", "CV", "履歴書", "CV")} ok={ready.resume} href={EDITOR.resume} />
            <DocRow t={t} label={t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")} ok={ready.cover} href={EDITOR.cover} />
          </div>
          {applyError ? <p className="mt-3 text-[14px] text-[color:var(--v2-attention)]">{applyError}</p> : null}
        </Sheet>
      ) : null}

      {confirmTailor ? (
        <Sheet
          title={t("자기소개서 회사를 바꿀까요?", "Switch the target company?", "要更换目标公司吗？", "Đổi công ty mục tiêu?", "応募先を変えますか？", "Ganti perusahaan tujuan?")}
          onClose={() => setConfirmTailor(false)}
          footer={
            <div className="grid grid-cols-2 gap-2">
              <Button variant="neutral" full onClick={() => setConfirmTailor(false)}>
                {t("그대로 두기", "Keep", "保持不变", "Giữ nguyên", "そのまま", "Biarkan")}
              </Button>
              <Button full onClick={applyTailor}>
                {t("바꾸기", "Switch", "更换", "Đổi", "変える", "Ganti")}
              </Button>
            </div>
          }
        >
          <p className="text-[16px] leading-[1.65] text-[color:var(--v2-ink-2)]">
            {t(
              `지금 자기소개서는 '${cover?.companyName ?? ""}'에 맞춰져 있어요. '${company}' 공고로 바꾸면 지원 회사와 공고 내용이 바뀌어요.`,
              `Your cover letter targets '${cover?.companyName ?? ""}'. Switching to '${company}' replaces the company and job text.`,
              `当前自我介绍针对'${cover?.companyName ?? ""}'。改为'${company}'会替换公司和职位内容。`,
              `Thư đang nhắm '${cover?.companyName ?? ""}'. Đổi sang '${company}' sẽ thay công ty và nội dung tin.`,
              `今の自己PRは「${cover?.companyName ?? ""}」向けです。「${company}」に変えると会社と求人内容が置き換わります。`,
              `Surat ditujukan ke '${cover?.companyName ?? ""}'. Mengganti ke '${company}' akan mengubah perusahaan dan teks lowongan.`
            )}
          </p>
          <p className="mt-2 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{t("이미 쓴 답변은 그대로 남고, 지금 버전은 '저장한 서류'에서 되돌릴 수 있어요.", "Your answers stay. You can restore this version from Saved documents.", "已写的回答会保留，可在'已保存的材料'中恢复当前版本。", "Câu trả lời vẫn giữ; có thể khôi phục phiên bản này trong Hồ sơ đã lưu.", "書いた回答は残り、今の版は「保存した書類」から戻せます。", "Jawaban tetap; versi ini bisa dipulihkan dari Dokumen tersimpan.")}</p>
        </Sheet>
      ) : null}

      {gate ? (
        <StartSheet
          allowWithoutDocs
          dailyLimitReached={limit.reached}
          dailyLimit={limit.limit}
          onClose={() => setGate(false)}
          onConfirm={() => {
            setGate(false);
            setPractice(true);
          }}
        />
      ) : null}
      {practice ? <InterviewSession item={item} onClose={() => setPractice(false)} /> : null}
    </Page>
  );
}

function Tag({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return <span className={`inline-flex h-7 items-center rounded-md px-2.5 text-[13px] font-semibold ${accent ? "bg-[color:var(--v2-accent-weak)] text-[color:var(--v2-accent)]" : "bg-[color:var(--v2-band)] text-[color:var(--v2-ink-3)]"}`}>{children}</span>;
}

/** 구획 — 띠(모바일)·가는 선(PC) 아래 제목과 내용. ui.Section 과 같은 간격. */
function Block({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="mt-8 h-3 bg-[color:var(--v2-band)] md:mx-5 md:mt-10 md:h-px md:bg-[color:var(--v2-line)]" />
      <section className="px-5 pb-2 pt-8 md:pt-10">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-[20px] font-bold tracking-[-0.02em] text-[color:var(--v2-ink)]">{title}</h2>
          {aside}
        </div>
        <div className="mt-4">{children}</div>
      </section>
    </>
  );
}

/** 긴 글 — 줄바꿈 그대로, 내 스킬은 파랗게. */
function TextBlock({ title, text, highlight = [] }: { title: string; text: string; highlight?: string[] }) {
  const terms = highlight.filter((h) => /^[\x00-\x7F]+$/.test(h)).sort((a, b) => b.length - a.length);
  const parts = terms.length ? text.split(new RegExp(`(${terms.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi")) : [text];
  return (
    <Block title={title}>
      <p className="whitespace-pre-wrap text-[16px] leading-[1.75] text-[color:var(--v2-ink-2)]">
        {parts.map((p, i) => (terms.some((h) => h.toLowerCase() === p.toLowerCase()) ? <mark key={i} className="rounded bg-[color:var(--v2-accent-weak)] px-0.5 font-semibold text-[color:var(--v2-accent)]">{p}</mark> : <span key={i}>{p}</span>))}
      </p>
    </Block>
  );
}

function ActionCard({ title, desc, onClick }: { title: string; desc: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-3 rounded-2xl bg-[color:var(--v2-band)] p-4 text-left transition hover:bg-[color:var(--v2-line)]">
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold text-[color:var(--v2-ink)]">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-[1.5] text-[color:var(--v2-muted)]">{desc}</span>
      </span>
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[color:var(--v2-faint)]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
  );
}

function DocRow({ t, label, ok, href }: { t: PlatformT; label: string; ok: boolean; href: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[color:var(--v2-fill)] px-4 py-3">
      <div className="flex items-center gap-2.5">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${ok ? "bg-[color:var(--v2-good)] text-white" : "border-2 border-[color:var(--v2-line)] bg-white"}`} aria-hidden>
          {ok ? (
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5 10 17 19 7" />
            </svg>
          ) : null}
        </span>
        <span className="text-[16px] font-semibold text-[color:var(--v2-ink)]">{label}</span>
        <span className={`text-[13px] ${ok ? "text-[color:var(--v2-good)]" : "text-[color:var(--v2-attention)]"}`}>{ok ? t("준비됐어요", "Ready", "已就绪", "Sẵn sàng", "準備OK", "Siap") : t("아직 덜 채웠어요", "Not ready", "未完成", "Chưa xong", "未完成", "Belum siap")}</span>
      </div>
      <Link href={href} className="text-[14px] font-semibold text-[color:var(--v2-accent)] hover:opacity-70">
        {ok ? t("확인", "Check", "查看", "Xem", "確認", "Cek") : t("채우기", "Fill in", "去填写", "Điền", "書く", "Isi")}
      </Link>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <Page>
      <div className="animate-pulse px-5 pt-6 md:pt-10" aria-busy="true">
        <div className="aspect-[16/8] w-full rounded-2xl bg-[color:var(--v2-band)]" />
        <div className="mt-5 h-4 w-32 rounded bg-[color:var(--v2-band)]" />
        <div className="mt-3 h-7 w-3/4 rounded bg-[color:var(--v2-band)]" />
        <div className="mt-3 h-4 w-1/2 rounded bg-[color:var(--v2-band)]" />
        <div className="mt-10 h-24 w-full rounded-2xl bg-[color:var(--v2-band)]" />
      </div>
    </Page>
  );
}

/** 공유 — 휴대폰은 공유 시트, 아니면 링크 복사. 링크는 누구나 열리는 공개 공고 주소(/talent/jobs/…)로 — v2 는 프로덕션에서 숨겨져 있다. */
function ShareButton({ t, id, title }: { t: PlatformT; id: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/talent/jobs/${id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 공유를 취소했거나 막혀 있으면 아무것도 하지 않는다 */
    }
  };
  return (
    <button type="button" onClick={() => void share()} className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-[14px] font-semibold text-[color:var(--v2-ink-3)] transition hover:bg-[color:var(--v2-band)]">
      {copied ? (
        t("링크를 복사했어요", "Link copied", "已复制链接", "Đã sao chép", "コピーしました", "Tautan disalin")
      ) : (
        <>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
          </svg>
          {t("공유", "Share", "分享", "Chia sẻ", "共有", "Bagikan")}
        </>
      )}
    </button>
  );
}

/** 비슷한 공고 — 공고 이름으로 뜻 기반 검색(포지션 탐색의 관련도순) 3개. 지금 공고는 뺀다. */
function SimilarJobs({ t, item }: { t: PlatformT; item: PublicPositionListItem }) {
  const { locale } = useLanguage();
  const [list, setList] = useState<PublicPositionListItem[] | null>(null);
  useEffect(() => {
    let alive = true;
    getPublicPositionsPage({ search: item.title, sort: "relevance", limit: 6, locale })
      .then((p) => alive && setList(p.items.filter((x) => x.id !== item.id).slice(0, 3)))
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, [item.id, item.title, locale]);
  if (list && !list.length) return null;
  return (
    <Block title={t("비슷한 공고", "Similar jobs", "相似职位", "Tin tương tự", "似た求人", "Lowongan serupa")}>
      {list === null ? (
        <RowsSkeleton count={3} />
      ) : (
        list.map((j) => <Row key={j.id} href={`/v2/jobs/${j.id}`} thumb={{ src: jobPhotoOf(j), fallback: companyOf(j) || j.title }} title={j.title} meta={[companyOf(j), shortPlace(j.workLocation)].filter(Boolean).join(" · ") || undefined} />)
      )}
    </Block>
  );
}

/** 이 회사 면접에서 나온 질문 — 면접을 본 사람들이 남긴 것(익명). 누르면 그 질문으로 한 문항 연습. */
function CompanyQuestions({ t, company, loggedIn, onLogin }: { t: PlatformT; company: string; loggedIn: boolean; onLogin: () => void }) {
  const [list, setList] = useState<InterviewReportItem[] | null>(null);
  const [practice, setPractice] = useState<PracticeQuestion | null>(null);
  useEffect(() => {
    if (!company) return;
    let alive = true;
    getInterviewQuestions({ organization: company, limit: 6 })
      .then((d) => alive && setList(d.items))
      .catch(() => alive && setList([]));
    return () => {
      alive = false;
    };
  }, [company]);
  if (!list || !list.length) return null;
  return (
    <Block title={t("이 회사 면접에서 나온 질문", "Asked in this company's interviews", "该公司面试中出现的问题", "Câu hỏi phỏng vấn ở công ty này", "この会社の面接で出た質問", "Pertanyaan wawancara di perusahaan ini")}>
      <p className="pb-1 text-[14px] text-[color:var(--v2-muted)]">{t("면접을 본 사람들이 남긴 질문이에요. 눌러서 미리 답해 보세요.", "Shared by people who interviewed here. Tap to practice.", "来自在此面试过的人。点击练习。", "Do người đã phỏng vấn tại đây chia sẻ. Chạm để luyện.", "ここで面接を受けた人の共有です。押して練習。", "Dibagikan peserta wawancara di sini. Ketuk untuk latihan.")}</p>
      {list.map((q) => (
        <Row key={q.id} onClick={() => (loggedIn ? setPractice({ ko: q.question, shown: q.question, category: "job" }) : onLogin())} lead="💬" title={q.question} meta={q.positionTitle} />
      ))}
      {practice ? <PracticeSheet question={practice} onClose={() => setPractice(null)} /> : null}
    </Block>
  );
}
