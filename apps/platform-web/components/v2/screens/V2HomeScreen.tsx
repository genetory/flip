"use client";

// v2 홈 — 맨 위에 '지금 가장 중요한 한 가지'를 크게, 아래로 오늘 할 일·서류·지원·마감 임박·맞춤 공고·
// 모의 면접·회사·가이드를 같은 목록 모양으로 쌓는다. 데이터는 전부 기존 것을 읽는다(새 API 없음).
// 비어 있는 구획은 아예 그리지 않는다 — 빈 칸 안내가 줄줄이 늘어서면 오히려 허전해 보인다.
import { useEffect, useMemo, useState } from "react";
import { V2Shell, V2_ROUTES } from "../V2Shell";
import { Attention, Masthead, Page, PrimaryButton, Progress, Row, Section, TextLink } from "../ui";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import {
  getMyApplications,
  getMyFavoritePositions,
  getMyMockInterviews,
  getPublicPositionsPage,
  getRecommendedPositions,
  type MockInterviewRecord,
  type MyApplication,
  type PublicPositionListItem
} from "../../../lib/member-profile-client";
import { useJobInterests } from "../../../lib/talent/job-interest";
import { useSelfMock } from "../../../lib/talent/self-mock";
import { analyzeMockWeakness, WEAK_BELOW } from "../../../lib/talent/mock-weakness";
import { careerGuides } from "../../../lib/talent/home-content";
import { partnerIndustryLabel } from "../../../lib/partner-industry-labels";

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
  const interests = useJobInterests();
  const selfMock = useSelfMock();
  const [apps, setApps] = useState<MyApplication[]>([]);
  const [jobs, setJobs] = useState<PublicPositionListItem[]>([]);
  const [personalized, setPersonalized] = useState(false);
  const [saved, setSaved] = useState<PublicPositionListItem[]>([]);
  const [mocks, setMocks] = useState<MockInterviewRecord[]>([]);
  const [companies, setCompanies] = useState<{ name: string; industry?: string; count: number; positionId: string }[]>([]);

  useEffect(() => {
    getMyApplications().then(setApps).catch(() => setApps([]));
    getMyFavoritePositions().then(setSaved).catch(() => setSaved([]));
    getMyMockInterviews().then(setMocks).catch(() => setMocks([]));
    // 맞춤 공고 — 관심 직무·이력 기반 추천, 안 되면 최신 공고.
    getRecommendedPositions({ limit: 4, locale })
      .then((r) => {
        if (r.items.length) {
          setJobs(r.items);
          setPersonalized(r.personalized);
        } else throw new Error("empty");
      })
      .catch(() =>
        getPublicPositionsPage({ limit: 4, locale })
          .then((p) => setJobs(p.items))
          .catch(() => setJobs([]))
      );
    // 이런 회사 — 직접 채용 중인 회사 중 셋(공고 수 많은 순).
    getPublicPositionsPage({ limit: 60, sourceProviders: ["INTERNAL"], locale })
      .then((p) => {
        const map = new Map<string, { name: string; industry?: string; count: number; positionId: string }>();
        for (const j of p.items) {
          const org = j.partnerOrganization;
          if (!org?.name) continue;
          const e = map.get(org.name) ?? { name: org.name, industry: org.industry ? partnerIndustryLabel(org.industry) : undefined, count: 0, positionId: j.id };
          e.count += 1;
          map.set(org.name, e);
        }
        setCompanies([...map.values()].sort((a, b) => b.count - a.count).slice(0, 3));
      })
      .catch(() => setCompanies([]));
  }, [locale, interests.length]);

  // 저장한 공고 중 7일 안에 마감.
  const closing = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return saved
      .map((p) => {
        if (p.sourceDeadlineRolling || !p.sourceDeadlineDate) return null;
        const d = Math.ceil((new Date(p.sourceDeadlineDate.slice(0, 10)).getTime() - today.getTime()) / 86400000);
        return d >= 0 && d <= 7 ? { p, d } : null;
      })
      .filter((x): x is { p: PublicPositionListItem; d: number } => x !== null)
      .sort((a, b) => a.d - b.d)
      .slice(0, 3);
  }, [saved]);

  // 모의 면접 요약 — 가장 최근 기록과 가장 약한 영역 하나.
  const weakest = useMemo(() => analyzeMockWeakness(selfMock).filter((r) => r.average !== null && r.average < WEAK_BELOW).sort((a, b) => (a.average ?? 0) - (b.average ?? 0))[0] ?? null, [selfMock]);
  const lastMock = mocks[0] ?? null;

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

  // 오늘 할 일 — 맨 위 한 가지와 겹치지 않게, 급한 순으로 셋까지.
  const todos: { key: string; title: string; meta?: string; href: string }[] = [];
  const unread = apps.reduce((n, a) => n + (a.unreadMessages || 0), 0);
  const pendingSlot = apps.find((a) => a.status === "INTERVIEW" && a.interviewPending);
  if (pendingSlot) todos.push({ key: "slot", title: t("면접 시간을 골라 주세요", "Pick your interview time", "请选择面试时间", "Hãy chọn giờ phỏng vấn", "面接の時間を選んでください", "Pilih jadwal wawancara"), meta: pendingSlot.positionTitle, href: "/talent/applications" });
  if (unread) todos.push({ key: "msg", title: t(`회사가 보낸 메시지 ${unread}개`, `${unread} message(s) from companies`, `公司发来 ${unread} 条消息`, `${unread} tin nhắn từ công ty`, `会社からのメッセージ ${unread}件`, `${unread} pesan dari perusahaan`), meta: t("확인하고 답해 보세요", "Read and reply", "查看并回复", "Đọc và trả lời", "確認して返信しましょう", "Baca dan balas"), href: "/talent/applications" });
  if (closing[0] && lead.cta.href !== V2_ROUTES.jobs) todos.push({ key: "close", title: t(`저장한 공고가 ${closing[0].d === 0 ? "오늘" : `${closing[0].d}일 뒤`} 마감돼요`, `A saved job closes ${closing[0].d === 0 ? "today" : `in ${closing[0].d} days`}`, `收藏的职位${closing[0].d === 0 ? "今天" : `${closing[0].d}天后`}截止`, `Tin đã lưu đóng ${closing[0].d === 0 ? "hôm nay" : `sau ${closing[0].d} ngày`}`, `保存した求人が${closing[0].d === 0 ? "今日" : `${closing[0].d}日後に`}締切`, `Lowongan tersimpan tutup ${closing[0].d === 0 ? "hari ini" : `${closing[0].d} hari lagi`}`), meta: closing[0].p.title, href: `/talent/jobs/${closing[0].p.id}` });
  if (lead.cta.href !== EDITOR.cover && rp >= 100 && cp < 100) todos.push({ key: "cover", title: t("자기소개서 마무리하기", "Finish your cover letter", "完成自我介绍", "Hoàn thành thư giới thiệu", "自己紹介書を仕上げる", "Selesaikan surat lamaran"), meta: t(`지금 ${cp}%`, `Now ${cp}%`, `目前 ${cp}%`, `Hiện ${cp}%`, `いま${cp}%`, `Sekarang ${cp}%`), href: EDITOR.cover });
  if (!interests.length) todos.push({ key: "interest", title: t("관심 직무 고르기", "Choose job interests", "选择感兴趣的职位", "Chọn nghề quan tâm", "関心職種を選ぶ", "Pilih minat pekerjaan"), meta: t("고르면 맞춤 공고가 더 정확해져요", "Recommendations get sharper", "推荐会更精准", "Gợi ý sẽ chính xác hơn", "おすすめが正確になります", "Rekomendasi lebih tepat"), href: "/talent/career" });
  if (weakest && lead.cta.href !== V2_ROUTES.interviews) todos.push({ key: "weak", title: t(`'${weakest.label}' 다시 연습하기`, `Practice '${weakest.label}' again`, `再次练习「${weakest.label}」`, `Luyện lại '${weakest.label}'`, `「${weakest.label}」をもう一度練習`, `Latih lagi '${weakest.label}'`), meta: t(`평균 ${weakest.average}점`, `Avg ${weakest.average}`, `平均 ${weakest.average} 分`, `TB ${weakest.average}`, `平均${weakest.average}点`, `Rata-rata ${weakest.average}`), href: V2_ROUTES.interviews });

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

      {todos.length ? (
        <Section title={t("오늘 할 일", "Today", "今日待办", "Việc hôm nay", "今日やること", "Hari ini")}>
          {todos.slice(0, 3).map((x, i) => (
            <Row key={x.key} href={x.href} lead={i + 1} title={x.title} meta={x.meta} />
          ))}
        </Section>
      ) : null}

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

      {closing.length ? (
        <Section title={t("곧 마감되는 저장 공고", "Saved jobs closing soon", "即将截止的收藏职位", "Tin đã lưu sắp đóng", "まもなく締切の保存求人", "Lowongan tersimpan segera tutup")}>
          {closing.map(({ p, d }) => (
            <Row
              key={p.id}
              href={`/talent/jobs/${p.id}`}
              title={p.title}
              meta={p.partnerOrganization?.name || p.sourceCompanyName || undefined}
              right={<Attention>{d === 0 ? t("오늘 마감", "Today", "今天截止", "Hôm nay", "今日締切", "Hari ini") : `D-${d}`}</Attention>}
            />
          ))}
        </Section>
      ) : null}

      {jobs.length ? (
        <Section
          title={personalized ? t("나에게 맞는 공고", "Jobs for you", "适合你的职位", "Việc làm cho bạn", "あなたに合う求人", "Lowongan untukmu") : t("새로 올라온 공고", "New jobs", "最新职位", "Việc làm mới", "新着求人", "Lowongan baru")}
          aside={<TextLink href={V2_ROUTES.jobs}>{t("전체 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}</TextLink>}
        >
          {jobs.map((j) => (
            <Row
              key={j.id}
              href={`/talent/jobs/${j.id}`}
              title={j.title}
              meta={[j.partnerOrganization?.name || j.sourceCompanyName, (j.workLocation || "").split(" ").slice(0, 2).join(" ")].filter(Boolean).join(" · ") || undefined}
            />
          ))}
        </Section>
      ) : null}

      <Section
        title={t("모의 면접", "Mock interview", "模拟面试", "Phỏng vấn thử", "模擬面接", "Wawancara simulasi")}
        aside={<TextLink href={V2_ROUTES.interviews}>{t("연습하러 가기", "Practice", "去练习", "Luyện tập", "練習へ", "Latihan")}</TextLink>}
      >
        {lastMock || weakest ? (
          <>
            {lastMock ? (
              <Row
                href={V2_ROUTES.interviews}
                title={lastMock.positionTitle}
                meta={[lastMock.companyName, t(`답변 ${lastMock.answeredCount}개`, `${lastMock.answeredCount} answers`, `${lastMock.answeredCount} 个回答`, `${lastMock.answeredCount} câu`, `回答${lastMock.answeredCount}件`, `${lastMock.answeredCount} jawaban`)].filter(Boolean).join(" · ")}
                right={lastMock.bestScore != null ? t(`최고 ${lastMock.bestScore}점`, `Best ${lastMock.bestScore}`, `最高 ${lastMock.bestScore}`, `Cao nhất ${lastMock.bestScore}`, `最高${lastMock.bestScore}点`, `Terbaik ${lastMock.bestScore}`) : undefined}
              />
            ) : null}
            {weakest ? (
              <Row
                href={V2_ROUTES.interviews}
                title={t(`가장 약한 곳: ${weakest.label}`, `Weakest: ${weakest.label}`, `最弱：${weakest.label}`, `Yếu nhất: ${weakest.label}`, `いちばん弱い所：${weakest.label}`, `Terlemah: ${weakest.label}`)}
                meta={weakest.worst?.improvement || undefined}
                right={<Attention>{weakest.average}</Attention>}
              />
            ) : null}
          </>
        ) : (
          <Row
            href={V2_ROUTES.interviews}
            title={t("첫 모의 면접을 해 보세요", "Try your first mock interview", "试试第一次模拟面试", "Thử phỏng vấn thử đầu tiên", "初めての模擬面接をしてみましょう", "Coba wawancara simulasi pertama")}
            meta={t("질문 하나만 답해도 AI 피드백을 받아요", "Answer just one question and get AI feedback", "回答一道题即可获得 AI 反馈", "Trả lời một câu là nhận phản hồi AI", "1問答えるだけでAIフィードバック", "Jawab satu pertanyaan, dapat masukan AI")}
          />
        )}
      </Section>

      {companies.length ? (
        <Section title={t("이런 회사는 어때요", "Companies to check out", "这些公司怎么样", "Công ty đáng xem", "こんな会社はいかが", "Perusahaan untuk dilihat")}>
          {companies.map((c) => (
            <Row
              key={c.name}
              href={`/talent/company/${encodeURIComponent(c.name)}`}
              lead={c.name.slice(0, 1)}
              title={c.name}
              meta={[c.industry, t(`채용 중 ${c.count}`, `${c.count} open`, `在招 ${c.count}`, `${c.count} vị trí`, `募集中 ${c.count}`, `${c.count} lowongan`)].filter(Boolean).join(" · ")}
            />
          ))}
        </Section>
      ) : null}

      <Section
        title={t("취업 가이드", "Career guide", "求职指南", "Hướng dẫn", "就活ガイド", "Panduan karier")}
        aside={<TextLink href={V2_ROUTES.guide}>{t("전체 보기", "See all", "查看全部", "Xem tất cả", "すべて見る", "Lihat semua")}</TextLink>}
      >
        {careerGuides(t)
          .slice(0, 3)
          .map((g) => (
            <Row key={g.title} href={V2_ROUTES.guide} lead={g.emoji} title={g.title.replace(/\n/g, " ")} meta={g.desc} />
          ))}
      </Section>
    </Page>
  );
}
