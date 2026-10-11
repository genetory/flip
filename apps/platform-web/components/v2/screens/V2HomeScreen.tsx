"use client";

// v2 홈 — 맨 위에 '지금 가장 중요한 한 가지'를 큰 글로, 아래는 할 일·서류·지원·추천 공고를 글 목록으로.
// 데이터는 기존 것(이력서·자소서·지원·공고)을 그대로 읽는다.
import { useEffect, useMemo, useState } from "react";
import { V2Shell, V2_ROUTES } from "../V2Shell";
import { Attention, Masthead, Page, PrimaryButton, Progress, Row, Section, TextLink } from "../ui";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { getMyApplications, getPublicPositionsPage, type MyApplication, type PublicPositionListItem } from "../../../lib/member-profile-client";

const EDITOR = { resume: "/talent/career/resume/editor", cover: "/talent/career/cover/editor" };

function daysUntil(iso: string): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = new Date(iso);
  day.setHours(0, 0, 0, 0);
  const d = Math.round((day.getTime() - today.getTime()) / 86400000);
  return d >= 0 ? d : null;
}

function statusText(t: PlatformT, a: MyApplication): string {
  if (a.status === "INTERVIEW") return a.interviewSelectedAt ? t("면접 확정", "Interview set", "面试已定", "Đã hẹn PV", "面接確定", "Terjadwal") : t("면접 일정 선택", "Pick a time", "选择时间", "Chọn lịch", "日程を選択", "Pilih jadwal");
  if (a.status === "ACCEPTED") return t("합격", "Accepted", "已录取", "Trúng tuyển", "合格", "Diterima");
  if (a.status === "REJECTED") return t("불합격", "Not selected", "未录取", "Không đạt", "不合格", "Tidak lolos");
  if (a.status === "WITHDRAWN") return t("철회", "Withdrawn", "已撤回", "Đã rút", "取り消し", "Ditarik");
  return t("검토 중", "In review", "审核中", "Đang xét", "選考中", "Ditinjau");
}

function docNote(t: PlatformT, pct: number): string {
  if (pct === 0) return t("아직 시작 전", "Not started", "尚未开始", "Chưa bắt đầu", "未着手", "Belum mulai");
  if (pct < 70) return t("채우는 중", "In progress", "填写中", "Đang điền", "作成中", "Sedang diisi");
  if (pct < 100) return t("거의 다 됐어요", "Almost there", "快完成了", "Sắp xong", "あと少し", "Hampir selesai");
  return t("완성", "Done", "完成", "Xong", "完成", "Selesai");
}

export function V2HomeScreen() {
  return (
    <V2Shell requireAuth>
      <Home />
    </V2Shell>
  );
}

function Home() {
  const t = usePlatformT();
  const { locale } = useLanguage();
  const { user } = useAuthSession();
  const name = user?.realName || user?.name || "";
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const rp = resumeCompleteness(resume);
  const cp = coverCompleteness(cover);
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [jobs, setJobs] = useState<PublicPositionListItem[]>([]);

  useEffect(() => {
    getMyApplications().then(setApps).catch(() => setApps([]));
    getPublicPositionsPage({ limit: 3, locale })
      .then((p) => setJobs(p.items))
      .catch(() => setJobs([]));
  }, [locale]);

  const upcoming = useMemo(
    () =>
      apps
        .filter((a) => a.status === "INTERVIEW" && a.interviewSelectedAt && daysUntil(a.interviewSelectedAt) !== null)
        .sort((a, b) => new Date(a.interviewSelectedAt!).getTime() - new Date(b.interviewSelectedAt!).getTime())[0] ?? null,
    [apps]
  );
  const active = apps.filter((a) => a.status !== "WITHDRAWN" && a.status !== "REJECTED");

  // 맨 위 한 가지 — 가장 급한 것부터.
  const lead = (() => {
    if (upcoming) {
      const d = daysUntil(upcoming.interviewSelectedAt!) ?? 0;
      return {
        title: d === 0 ? t("오늘 면접이 있어요", "Your interview is today", "今天有面试", "Hôm nay có phỏng vấn", "今日は面接です", "Hari ini wawancara") : t(`면접까지 ${d}일 남았어요`, `${d} days until your interview`, `距离面试还有 ${d} 天`, `Còn ${d} ngày đến buổi phỏng vấn`, `面接まであと${d}日`, `${d} hari lagi menuju wawancara`),
        lede: t(
          `${[upcoming.partnerOrganizationName, upcoming.positionTitle].filter(Boolean).join(" · ")}. 나올 만한 질문을 미리 풀어 두세요.`,
          `${[upcoming.partnerOrganizationName, upcoming.positionTitle].filter(Boolean).join(" · ")}. Practice the likely questions ahead of time.`,
          `${[upcoming.partnerOrganizationName, upcoming.positionTitle].filter(Boolean).join(" · ")}。提前练习可能会被问到的问题。`,
          `${[upcoming.partnerOrganizationName, upcoming.positionTitle].filter(Boolean).join(" · ")}. Hãy luyện trước các câu hỏi có thể gặp.`,
          `${[upcoming.partnerOrganizationName, upcoming.positionTitle].filter(Boolean).join(" · ")}。出そうな質問を先に練習しておきましょう。`,
          `${[upcoming.partnerOrganizationName, upcoming.positionTitle].filter(Boolean).join(" · ")}. Latih pertanyaan yang mungkin muncul.`
        ),
        cta: { label: t("면접 연습하기", "Practice now", "开始练习", "Luyện ngay", "練習する", "Latihan"), href: V2_ROUTES.interviews }
      };
    }
    if (rp < 100)
      return {
        title: rp === 0 ? t("이력서부터 시작해 볼까요", "Let's start with your resume", "先从简历开始吧", "Bắt đầu từ CV nhé", "まず履歴書から始めましょう", "Mulai dari CV yuk") : t("이력서를 마무리해 볼까요", "Let's finish your resume", "把简历完成吧", "Hoàn thiện CV nhé", "履歴書を仕上げましょう", "Selesaikan CV yuk"),
        lede: t(`지금 ${rp}%예요. 이력서가 있어야 공고에 지원하고 맞춤 면접 연습도 할 수 있어요.`, `You're at ${rp}%. You need a resume to apply and to get tailored interview practice.`, `目前完成 ${rp}%。有了简历才能投递并进行定制面试练习。`, `Hiện ${rp}%. Cần có CV để ứng tuyển và luyện phỏng vấn theo bạn.`, `いま${rp}%です。履歴書があると応募も、自分に合った面接練習もできます。`, `Sekarang ${rp}%. Butuh CV untuk melamar dan latihan wawancara yang pas.`),
        cta: { label: t("이력서 쓰기", "Write resume", "写简历", "Viết CV", "履歴書を書く", "Tulis CV"), href: EDITOR.resume }
      };
    if (cp < 100)
      return {
        title: t("자기소개서만 남았어요", "Just your cover letter left", "只剩自我介绍了", "Chỉ còn thư giới thiệu", "残りは自己紹介書だけ", "Tinggal surat lamaran"),
        lede: t(`이력서는 완성했어요. 자기소개서는 지금 ${cp}%예요.`, `Your resume is done. Your cover letter is at ${cp}%.`, `简历已完成，自我介绍目前 ${cp}%。`, `CV đã xong. Thư giới thiệu đang ${cp}%.`, `履歴書は完成。自己紹介書はいま${cp}%です。`, `CV selesai. Surat lamaran ${cp}%.`),
        cta: { label: t("자기소개서 쓰기", "Write cover letter", "写自我介绍", "Viết thư", "自己紹介書を書く", "Tulis surat"), href: EDITOR.cover }
      };
    return {
      title: t("지원할 준비가 됐어요", "You're ready to apply", "可以开始投递了", "Bạn đã sẵn sàng ứng tuyển", "応募の準備ができました", "Siap melamar"),
      lede: t("서류가 모두 준비됐어요. 나에게 맞는 공고를 찾아 지원해 보세요.", "Your documents are ready. Find a job that fits and apply.", "材料都准备好了，去找适合的职位投递吧。", "Hồ sơ đã sẵn sàng. Tìm việc phù hợp và ứng tuyển.", "書類はすべて揃いました。合う求人を探して応募しましょう。", "Dokumen siap. Cari lowongan yang cocok dan lamar."),
      cta: { label: t("공고 보기", "Browse jobs", "浏览职位", "Xem việc làm", "求人を見る", "Lihat lowongan"), href: V2_ROUTES.jobs }
    };
  })();

  const today = new Date();
  const eyebrow = [
    t(`${today.getMonth() + 1}월 ${today.getDate()}일`, today.toLocaleDateString("en", { month: "long", day: "numeric" }), `${today.getMonth() + 1}月${today.getDate()}日`, `${today.getDate()}/${today.getMonth() + 1}`, `${today.getMonth() + 1}月${today.getDate()}日`, `${today.getDate()}/${today.getMonth() + 1}`),
    name ? t(`${name}님`, name, name, name, `${name}さん`, name) : null
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Page>
      <Masthead eyebrow={eyebrow} title={lead.title} lede={lead.lede} action={<PrimaryButton href={lead.cta.href}>{lead.cta.label}</PrimaryButton>} />

      <Section title={t("내 서류", "My documents", "我的材料", "Hồ sơ của tôi", "私の書類", "Dokumen saya")}>
        {[
          { label: t("이력서", "Resume", "简历", "CV", "履歴書", "CV"), pct: rp, href: EDITOR.resume },
          { label: t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran"), pct: cp, href: EDITOR.cover }
        ].map((d) => (
          <div key={d.href} className="py-1">
            <Row href={d.href} title={d.label} meta={docNote(t, d.pct)} right={`${d.pct}%`} />
            <div className="-mt-1 mb-2">
              <Progress pct={d.pct} />
            </div>
          </div>
        ))}
      </Section>

      <Section
        title={t("지원", "Applications", "申请", "Ứng tuyển", "応募", "Lamaran")}
        aside={active.length ? <span className="text-[14px] text-[color:var(--v2-muted)]">{t(`${active.length}곳 진행 중`, `${active.length} active`, `${active.length} 个进行中`, `${active.length} đang xử lý`, `${active.length}件進行中`, `${active.length} aktif`)}</span> : null}
      >
        {active.length ? (
          <div>
            {active.slice(0, 3).map((a) => {
              const d = a.interviewSelectedAt ? daysUntil(a.interviewSelectedAt) : null;
              return (
                <Row
                  key={a.id}
                  href={V2_ROUTES.applications}
                  title={a.positionTitle}
                  meta={a.partnerOrganizationName ?? undefined}
                  right={d !== null && a.status === "INTERVIEW" ? <Attention>{d === 0 ? t("오늘 면접", "Today", "今天面试", "Hôm nay", "今日面接", "Hari ini") : `D-${d}`}</Attention> : statusText(t, a)}
                />
              );
            })}
          </div>
        ) : (
          <p className="text-[15px] leading-[1.75] text-[color:var(--v2-muted)]">
            {t("아직 지원한 곳이 없어요. 서류가 준비되면 공고에서 바로 지원할 수 있어요.", "No applications yet. Once your documents are ready, you can apply right from a job.", "还没有投递。材料准备好后可直接在职位页投递。", "Chưa ứng tuyển nơi nào. Khi hồ sơ sẵn sàng, bạn có thể ứng tuyển ngay.", "まだ応募はありません。書類が揃えば求人からすぐ応募できます。", "Belum ada lamaran. Setelah dokumen siap, langsung lamar dari lowongan.")}
          </p>
        )}
      </Section>

      {jobs.length ? (
        <Section title={t("새로 올라온 공고", "New jobs", "最新职位", "Việc làm mới", "新着求人", "Lowongan baru")} aside={<TextLink href={V2_ROUTES.jobs}>{t("전체 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}</TextLink>}>
          <div>
            {jobs.map((j) => (
              <Row
                key={j.id}
                href={`/talent/jobs/${j.id}`}
                title={j.title}
                meta={[j.partnerOrganization?.name || j.sourceCompanyName, j.workLocation].filter(Boolean).join(" · ") || undefined}
              />
            ))}
          </div>
        </Section>
      ) : null}
    </Page>
  );
}
