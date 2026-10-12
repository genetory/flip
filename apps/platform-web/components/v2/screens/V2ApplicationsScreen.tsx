"use client";

// v2 지원 현황 — 맨 위에 몇 곳에 지원했는지, 칩으로 상태를 거르고, 지원마다 지금 상태와 필요한 행동만.
// 메시지·면접 시간·진행 내역·철회 팝업은 기존 것을 그대로 쓴다.
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { V2Shell, V2_ROUTES } from "../V2Shell";
import { Attention, Button, Chip, Empty, Masthead, MastheadSkeleton, Page, PrimaryButton, Row, RowsSkeleton } from "../ui";
import { companyOf, daysUntil, jobPhotoOf } from "../lib";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { getMyApplications, getMyMockInterviewUsage, getPublicPositionById, getPublicPositionsPage, withdrawMyApplication, type MyApplication, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { InterviewSlotModal, WithdrawModal } from "../../talent/screens/ApplicationsScreen";
import { DocumentsSheet, MessageSheet, ProgressSheet } from "../sheets";
import { StartSheet } from "../interview-content";
import { MockInterviewModal } from "../../talent/jobs/MockInterviewModal";
import { InterviewPrepSheet } from "../../talent/jobs/InterviewPrepSheet";
import { useLanguage } from "../../i18n/LanguageProvider";
import { trackInterviewPrepSheetOpened, trackInterviewStart } from "../../../lib/analytics";

type Filter = "all" | "active" | "interview" | "done" | "withdrawn";
const MATCH: Record<Filter, (a: MyApplication) => boolean> = {
  all: () => true,
  active: (a) => a.status === "SUBMITTED" || a.status === "INTERVIEW",
  interview: (a) => a.status === "INTERVIEW",
  done: (a) => a.status === "ACCEPTED" || a.status === "REJECTED",
  withdrawn: (a) => a.status === "WITHDRAWN"
};

// 손이 가야 하는 것부터 — 면접(가까운 날 먼저) → 검토 중 → 결과 → 철회.
const RANK: Record<MyApplication["status"], number> = { INTERVIEW: 0, SUBMITTED: 1, ACCEPTED: 2, REJECTED: 3, WITHDRAWN: 4 };

function whenText(t: PlatformT, iso: string): string {
  const d = new Date(iso);
  const hm = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return t(`${d.getMonth() + 1}월 ${d.getDate()}일 ${hm}`, `${d.toLocaleDateString("en", { month: "short", day: "numeric" })} ${hm}`, `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`, `${d.getDate()}/${d.getMonth() + 1} ${hm}`, `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`, `${d.getDate()}/${d.getMonth() + 1} ${hm}`);
}

export function V2ApplicationsScreen() {
  return (
    <V2Shell requireAuth>
      <Applications />
    </V2Shell>
  );
}

function Applications() {
  const t = usePlatformT();
  const toast = useTalentPopup();
  const [apps, setApps] = useState<MyApplication[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [msg, setMsg] = useState<MyApplication | null>(null);
  const [slot, setSlot] = useState<MyApplication | null>(null);
  const [timeline, setTimeline] = useState<MyApplication | null>(null);
  const [withdraw, setWithdraw] = useState<MyApplication | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [docs, setDocs] = useState<MyApplication | null>(null);
  const [sheetApp, setSheetApp] = useState<MyApplication | null>(null);
  // 면접 준비 — 지원 현황에서 바로 그 공고로 모의 면접(게이트 → 연습). 모의 면접 탭과 같은 규칙.
  const { locale } = useLanguage();
  const [gate, setGate] = useState<PublicPositionListItem | null>(null);
  const [practice, setPractice] = useState<PublicPositionListItem | null>(null);
  const [limit, setLimit] = useState({ reached: false, limit: 3 });
  const practiceFor = async (a: MyApplication) => {
    const item = await getPublicPositionById(a.positionId, { locale }).catch(() => null);
    if (!item) return;
    trackInterviewStart("upcoming");
    getMyMockInterviewUsage()
      .then((u) => setLimit({ reached: u.companiesUsedToday >= u.dailyCompanyLimit && !u.practicedTodayPositionIds.includes(item.id), limit: u.dailyCompanyLimit }))
      .catch(() => setLimit({ reached: false, limit: 3 }));
    setGate(item);
  };

  const load = () => getMyApplications().then(setApps).catch(() => setApps([]));
  useEffect(() => {
    load();
  }, []);

  const list = useMemo(
    () =>
      (apps ?? [])
        .filter(MATCH[filter])
        .sort((a, b) => RANK[a.status] - RANK[b.status] || (a.interviewSelectedAt && b.interviewSelectedAt ? new Date(a.interviewSelectedAt).getTime() - new Date(b.interviewSelectedAt).getTime() : 0)),
    [apps, filter]
  );
  const counts = useMemo(() => Object.fromEntries((Object.keys(MATCH) as Filter[]).map((k) => [k, (apps ?? []).filter(MATCH[k]).length])) as Record<Filter, number>, [apps]);

  const confirmWithdraw = () => {
    const app = withdraw;
    if (!app || withdrawing) return;
    setWithdrawing(true);
    withdrawMyApplication(app.id)
      .then(() => {
        setApps((prev) => (prev ? prev.map((a) => (a.id === app.id ? { ...a, status: "WITHDRAWN" } : a)) : prev));
        setWithdraw(null);
        toast.success(t("지원을 철회했어요", "Application withdrawn", "已撤回申请", "Đã rút đơn", "応募を取り消しました", "Lamaran ditarik"));
      })
      .catch(() => toast.error(t("철회에 실패했어요. 잠시 후 다시 시도해 주세요.", "Failed to withdraw. Please try again shortly.", "撤回失败，请稍后再试。", "Rút đơn thất bại. Vui lòng thử lại sau.", "取り消しに失敗しました。しばらくして再度お試しください。", "Gagal menarik. Coba lagi nanti.")))
      .finally(() => setWithdrawing(false));
  };

  if (apps === null)
    return (
      <Page>
        <MastheadSkeleton action={false} />
        <div className="px-5">
          <RowsSkeleton count={4} thumb={false} />
        </div>
      </Page>
    );

  const total = apps.length;
  const summary = [
    counts.interview ? t(`면접 ${counts.interview}`, `${counts.interview} interview`, `面试 ${counts.interview}`, `${counts.interview} phỏng vấn`, `面接 ${counts.interview}`, `${counts.interview} wawancara`) : null,
    apps.filter((a) => a.status === "SUBMITTED").length ? t(`검토 중 ${apps.filter((a) => a.status === "SUBMITTED").length}`, `${apps.filter((a) => a.status === "SUBMITTED").length} in review`, `审核中 ${apps.filter((a) => a.status === "SUBMITTED").length}`, `${apps.filter((a) => a.status === "SUBMITTED").length} đang xét`, `選考中 ${apps.filter((a) => a.status === "SUBMITTED").length}`, `${apps.filter((a) => a.status === "SUBMITTED").length} ditinjau`) : null,
    counts.done ? t(`결과 ${counts.done}`, `${counts.done} decided`, `结果 ${counts.done}`, `${counts.done} có kết quả`, `結果 ${counts.done}`, `${counts.done} hasil`) : null
  ]
    .filter(Boolean)
    .join(" · ");

  const filters: [Filter, string][] = [
    ["all", t("전체", "All", "全部", "Tất cả", "すべて", "Semua")],
    ["active", t("진행 중", "Active", "进行中", "Đang xử lý", "進行中", "Aktif")],
    ["interview", t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")],
    ["done", t("결과", "Results", "结果", "Kết quả", "結果", "Hasil")],
    ["withdrawn", t("철회", "Withdrawn", "已撤回", "Đã rút", "取り消し", "Ditarik")]
  ];

  return (
    <Page>
      {total ? (
        <Masthead
          eyebrow={t("지원 현황", "Applications", "申请状态", "Ứng tuyển", "応募状況", "Lamaran")}
          title={t(`${total}곳에 지원했어요`, `You've applied to ${total}`, `已投递 ${total} 家`, `Đã ứng tuyển ${total} nơi`, `${total}社に応募しました`, `Sudah melamar ${total}`)}
          lede={summary || undefined}
        />
      ) : (
        <Masthead
          eyebrow={t("지원 현황", "Applications", "申请状态", "Ứng tuyển", "応募状況", "Lamaran")}
          title={t("아직 지원한 곳이 없어요", "No applications yet", "还没有投递", "Chưa ứng tuyển nơi nào", "まだ応募はありません", "Belum ada lamaran")}
          lede={t("마음에 드는 공고를 찾으면 바로 지원할 수 있어요.", "Find a job you like and apply right away.", "找到喜欢的职位即可直接投递。", "Tìm việc bạn thích và ứng tuyển ngay.", "気に入った求人が見つかればすぐ応募できます。", "Temukan lowongan yang disukai dan langsung lamar.")}
          action={<PrimaryButton href={V2_ROUTES.jobs}>{t("공고 보러 가기", "Browse jobs", "去看职位", "Xem việc làm", "求人を見る", "Lihat lowongan")}</PrimaryButton>}
        />
      )}

      {total ? (
        <>
          <div className="flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filters.map(([k, label]) => (
              <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
                {label} {counts[k] ? <span className="ml-0.5 opacity-60">{counts[k]}</span> : null}
              </Chip>
            ))}
          </div>
          <div className="mt-2 h-3 bg-[color:var(--v2-band)] md:mx-5 md:h-px md:bg-[color:var(--v2-line)]" aria-hidden />
          <ul className="px-5">
            {list.length ? (
              list.map((a) => (
                <ApplicationItem
                  key={a.id}
                  t={t}
                  a={a}
                  onMessage={() => setMsg(a)}
                  onSlot={() => setSlot(a)}
                  onTimeline={() => setTimeline(a)}
                  onWithdraw={() => setWithdraw(a)}
                  onDocs={() => setDocs(a)}
                  onPractice={() => void practiceFor(a)}
                  onSheet={() => {
                    trackInterviewPrepSheetOpened();
                    setSheetApp(a);
                  }}
                />
              ))
            ) : (
              <Empty>{t("이 상태의 지원이 없어요.", "Nothing here.", "没有该状态的申请。", "Không có đơn ở trạng thái này.", "この状態の応募はありません。", "Tidak ada lamaran di sini.")}</Empty>
            )}
          </ul>
        </>
      ) : null}

      {msg ? (
        <MessageSheet
          app={msg}
          onClose={() => {
            setMsg(null);
            load();
          }}
        />
      ) : null}
      {slot ? (
        <InterviewSlotModal
          app={slot}
          onClose={() => {
            setSlot(null);
            load();
          }}
        />
      ) : null}
      {timeline ? <ProgressSheet app={timeline} onClose={() => setTimeline(null)} /> : null}
      {docs ? <DocumentsSheet app={docs} onClose={() => setDocs(null)} /> : null}
      {sheetApp ? (
        <InterviewPrepSheet
          positionId={sheetApp.positionId}
          title={sheetApp.positionTitle}
          company={sheetApp.partnerOrganizationName}
          interviewAt={sheetApp.interviewSelectedAt}
          onPractice={() => {
            const a = sheetApp;
            setSheetApp(null);
            void practiceFor(a);
          }}
          onClose={() => setSheetApp(null)}
        />
      ) : null}
      {gate ? (
        <StartSheet
          allowWithoutDocs
          dailyLimitReached={limit.reached}
          dailyLimit={limit.limit}
          onClose={() => setGate(null)}
          onConfirm={() => {
            setPractice(gate);
            setGate(null);
          }}
        />
      ) : null}
      {practice ? <MockInterviewModal item={practice} onClose={() => setPractice(null)} /> : null}
      {withdraw ? <WithdrawModal app={withdraw} withdrawing={withdrawing} onClose={() => setWithdraw(null)} onConfirm={confirmWithdraw} /> : null}
    </Page>
  );
}

/** 지원 하나 — 제목·회사, 지금 상태 한 줄, 그 상태에서 필요한 행동만 작은 버튼으로. */
function ApplicationItem({
  t,
  a,
  onMessage,
  onSlot,
  onTimeline,
  onWithdraw,
  onDocs,
  onPractice,
  onSheet
}: {
  t: PlatformT;
  a: MyApplication;
  onMessage: () => void;
  onSlot: () => void;
  onTimeline: () => void;
  onWithdraw: () => void;
  onDocs: () => void;
  onPractice: () => void;
  onSheet: () => void;
}) {
  const d = a.interviewSelectedAt ? daysUntil(a.interviewSelectedAt) : null;
  const dimmed = a.status === "WITHDRAWN";

  const status = (() => {
    if (a.status === "INTERVIEW" && a.interviewSelectedAt)
      return (
        <>
          {d !== null ? <Attention>{d === 0 ? t("오늘 면접", "Interview today", "今天面试", "Phỏng vấn hôm nay", "今日面接", "Wawancara hari ini") : `${t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")} D-${d}`}</Attention> : t("면접 완료", "Interviewed", "已面试", "Đã phỏng vấn", "面接済み", "Sudah wawancara")}
          <span className="text-[color:var(--v2-faint)]"> · {whenText(t, a.interviewSelectedAt)}</span>
        </>
      );
    if (a.status === "INTERVIEW" && a.interviewPending) return <Attention>{t("면접 시간을 골라 주세요", "Pick an interview time", "请选择面试时间", "Hãy chọn giờ phỏng vấn", "面接の時間を選んでください", "Pilih jadwal wawancara")}</Attention>;
    if (a.status === "INTERVIEW") return t("면접 진행 중", "Interviewing", "面试中", "Đang phỏng vấn", "面接中", "Wawancara");
    if (a.status === "ACCEPTED") return <span className="font-semibold text-[color:var(--v2-good)]">{t("합격했어요", "Accepted", "已录取", "Trúng tuyển", "合格しました", "Diterima")}</span>;
    if (a.status === "REJECTED") return t("이번엔 함께하지 못했어요", "Not selected this time", "这次未能录取", "Lần này chưa phù hợp", "今回はご縁がありませんでした", "Belum terpilih kali ini");
    if (a.status === "WITHDRAWN") return t("지원을 철회했어요", "Withdrawn", "已撤回", "Đã rút đơn", "取り消しました", "Ditarik");
    return t("회사가 서류를 보고 있어요", "The company is reviewing", "公司正在审核", "Công ty đang xem hồ sơ", "会社が書類を確認中です", "Perusahaan sedang meninjau");
  })();

  return (
    <li className="border-b border-[color:var(--v2-line)] py-5 last:border-b-0">
      <Link href={`/v2/jobs/${a.positionId}`} className={`block transition hover:opacity-70 ${dimmed ? "opacity-60" : ""}`}>
        <p className="text-[17px] font-semibold leading-[1.45] text-[color:var(--v2-ink)]">{a.positionTitle}</p>
        <p className="mt-0.5 text-[14px] text-[color:var(--v2-faint)]">
          {[a.partnerOrganizationName, `${t("지원", "Applied", "申请", "Ứng tuyển", "応募", "Dilamar")} ${formatRelativeTime(new Date(a.submittedAt).getTime(), undefined, t)}`].filter(Boolean).join(" · ")}
        </p>
      </Link>
      <p className={`mt-2.5 text-[15px] text-[color:var(--v2-ink-2)] ${dimmed ? "opacity-60" : ""}`}>{status}</p>

      {/* 상태별 다음 할 일 — 면접 시간 고르기 / 면접 준비 / 합격 후 체크 / 비슷한 공고 */}
      {a.status === "INTERVIEW" && a.interviewPending ? (
        <div className="mt-3">
          <Button size="sm" onClick={onSlot}>
            {t("면접 시간 고르기", "Pick a time", "选择时间", "Chọn giờ", "時間を選ぶ", "Pilih jadwal")}
          </Button>
        </div>
      ) : null}
      {a.status === "INTERVIEW" && a.interviewSelectedAt && d !== null ? (
        <div className="mt-3 rounded-2xl bg-[color:var(--v2-accent-weak)] p-4">
          <p className="text-[14px] font-semibold text-[color:var(--v2-ink-2)]">{t("면접 전에 준비해 두세요", "Get ready before the interview", "面试前做好准备", "Chuẩn bị trước buổi phỏng vấn", "面接の前に準備しましょう", "Bersiap sebelum wawancara")}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button size="sm" onClick={onPractice}>{t("모의 면접으로 준비", "Practice with a mock interview", "用模拟面试准备", "Luyện phỏng vấn thử", "模擬面接で準備", "Latihan wawancara")}</Button>
            <Button size="sm" variant="neutral" onClick={onSheet}>{t("전날 볼 한 장", "Night-before sheet", "考前速览", "Bản ôn tập", "前日の1枚", "Lembar ringkas")}</Button>
          </div>
        </div>
      ) : null}
      {a.status === "ACCEPTED" ? (
        <div className="mt-3 rounded-2xl bg-[color:var(--v2-band)] p-4">
          <p className="text-[15px] font-bold text-[color:var(--v2-ink)]">🎉 {t("합격을 축하해요!", "Congratulations!", "恭喜录取！", "Chúc mừng bạn!", "合格おめでとうございます！", "Selamat!")}</p>
          <p className="mt-1 text-[14px] leading-[1.6] text-[color:var(--v2-muted)]">{t("입사 전에 비자와 서류를 확인해 두세요.", "Check your visa and paperwork before you start.", "入职前请确认签证和材料。", "Hãy kiểm tra visa và giấy tờ trước khi đi làm.", "入社前にビザと書類を確認しましょう。", "Cek visa dan dokumen sebelum mulai bekerja.")}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" href="/talent/visa/E-7">{t("E-7 취업 비자 안내", "E-7 work visa guide", "E-7 工作签证指南", "Hướng dẫn visa E-7", "E-7 就労ビザ案内", "Panduan visa E-7")}</Button>
            <Button size="sm" variant="neutral" onClick={onMessage}>{t("회사에 입사 일정 묻기", "Ask about the start date", "询问入职日期", "Hỏi ngày bắt đầu", "入社日を聞く", "Tanya tanggal mulai")}</Button>
          </div>
        </div>
      ) : null}
      {a.status === "REJECTED" ? <SimilarJobs t={t} title={a.positionTitle} excludeId={a.positionId} /> : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
          {a.status !== "WITHDRAWN" ? (
            <Button size="sm" variant="neutral" onClick={onMessage}>
              {t("메시지", "Messages", "消息", "Tin nhắn", "メッセージ", "Pesan")}
              {a.unreadMessages ? <span className="font-bold text-[color:var(--v2-attention)]">{a.unreadMessages}</span> : null}
            </Button>
          ) : null}
          <Button size="sm" variant="neutral" onClick={onTimeline}>
            {t("진행 내역", "Progress", "进度", "Tiến trình", "進捗", "Progres")}
          </Button>
          <Button size="sm" variant="neutral" onClick={onDocs}>
            {t("제출한 서류", "Sent documents", "已交材料", "Hồ sơ đã gửi", "提出書類", "Dokumen terkirim")}
          </Button>
          {a.status === "SUBMITTED" || a.status === "INTERVIEW" ? (
            <button type="button" onClick={onWithdraw} className="ml-auto h-9 px-1 text-[14px] font-medium text-[color:var(--v2-faint)] transition hover:text-[color:var(--v2-attention)]">
              {t("지원 철회", "Withdraw", "撤回", "Rút đơn", "取り消し", "Tarik")}
            </button>
          ) : null}
      </div>
    </li>
  );
}

/** 불합격 뒤 — 비슷한 공고(같은 직무 이름으로 뜻 기반 검색). 눌렀을 때만 불러온다(지원마다 미리 부르지 않게). */
function SimilarJobs({ t, title, excludeId }: { t: PlatformT; title: string; excludeId: string }) {
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PublicPositionListItem[] | null>(null);
  const load = () => {
    setOpen(true);
    if (items) return;
    getPublicPositionsPage({ search: title, sort: "relevance", limit: 4, locale })
      .then((p) => setItems(p.items.filter((j) => j.id !== excludeId).slice(0, 3)))
      .catch(() => setItems([]));
  };
  return (
    <div className="mt-3 rounded-2xl bg-[color:var(--v2-band)] p-4">
      <p className="text-[14px] leading-[1.6] text-[color:var(--v2-ink-3)]">{t("아쉽지만, 비슷한 자리가 또 있어요.", "Not this time, but there are similar roles.", "很遗憾，不过还有类似的职位。", "Tiếc quá, nhưng vẫn còn vị trí tương tự.", "残念ですが、似たポジションがあります。", "Sayang sekali, tapi ada posisi serupa.")}</p>
      {!open ? (
        <div className="mt-2.5">
          <Button size="sm" variant="secondary" onClick={load}>{t("비슷한 공고 보기", "See similar jobs", "查看类似职位", "Xem việc tương tự", "似た求人を見る", "Lihat yang serupa")}</Button>
        </div>
      ) : items === null ? (
        <div className="mt-1">
          <RowsSkeleton count={2} />
        </div>
      ) : items.length === 0 ? (
        <p className="mt-2 text-[14px] text-[color:var(--v2-faint)]">{t("지금은 비슷한 공고가 없어요.", "No similar jobs right now.", "目前没有类似职位。", "Hiện chưa có việc tương tự.", "今は似た求人がありません。", "Belum ada yang serupa.")}</p>
      ) : (
        <div className="mt-1">
          {items.map((j) => (
            <Row key={j.id} href={`/v2/jobs/${j.id}`} thumb={{ src: jobPhotoOf(j), fallback: companyOf(j) || j.title }} title={j.title} meta={companyOf(j) || undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
