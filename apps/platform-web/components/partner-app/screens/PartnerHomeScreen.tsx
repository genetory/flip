"use client";

// 파트너 홈 — 대시보드. 처리 필요 + 채용 파이프라인 + 공고별 지원 현황 + 최근 지원자 + 빠른 작업.
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CaretRight, Plus, ChatCircleDots, X, PaperPlaneTilt, ArrowUpRight, CheckCircle, Circle } from "@phosphor-icons/react";
import { PartnerAppShell } from "../PartnerAppShell";
import { PartnerMoreLink, PartnerEmptyCard } from "../ui/cards";
import { PartnerApplicantCard, PartnerParticipantCard } from "../ListCards";
import { ProposeCandidateModal } from "../ProposeCandidateModal";
import { TLoading, TError } from "../../talent/ui/primitives";
import { useTalentPopup } from "../../talent/feedback/TalentPopupProvider";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { partnerRoutes } from "../../../lib/partner/app-nav";
import { useTimeGreeting } from "../../../lib/time-greeting";
import { formatRelativeTime } from "../../../lib/talent/career-feed";
import { PARTNER_POSITION_STATUS, usePartnerPositionStatusLabel } from "../../../lib/partner/labels";
import { usePlatformT } from "../../../lib/i18n";
import {
  getMyPartnerOrganization,
  getMyPartnerPositions,
  getMyPartnerApplicants,
  getPartnerPendingMessages,
  getPartnerApplicantMessages,
  sendPartnerApplicantMessage,
  getOrgMockInterviewParticipants,
  type MyPartnerOrganization,
  type PartnerPosition,
  type PartnerApplicantListItem,
  type PartnerApplicantStatus,
  type PartnerPendingMessage,
  type PartnerApplicantMessage,
  type OrgMockInterviewParticipant
} from "../../../lib/member-profile-client";

export function PartnerHomeScreen() {
  const [org, setOrg] = useState<MyPartnerOrganization | null>(null);
  const [positions, setPositions] = useState<PartnerPosition[]>([]);
  const [applicants, setApplicants] = useState<PartnerApplicantListItem[]>([]);
  const [pending, setPending] = useState<PartnerPendingMessage[]>([]);
  const [participants, setParticipants] = useState<OrgMockInterviewParticipant[]>([]);
  const [chat, setChat] = useState<{ applicationId: string; applicantId: string; name: string; positionTitle: string } | null>(null);
  const [proposeTarget, setProposeTarget] = useState<OrgMockInterviewParticipant | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const greeting = useTimeGreeting();
  const t = usePlatformT();
  const positionLabel = usePartnerPositionStatusLabel();

  function load() {
    setStatus("loading");
    Promise.all([
      getMyPartnerOrganization().catch(() => null),
      getMyPartnerPositions().catch(() => []),
      getMyPartnerApplicants().catch(() => [])
    ])
      .then(([o, p, a]) => {
        setOrg(o);
        setPositions(p);
        setApplicants(a);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
    void getPartnerPendingMessages().then(setPending).catch(() => setPending([]));
    void getOrgMockInterviewParticipants().then(setParticipants).catch(() => setParticipants([]));
  }
  useEffect(() => {
    load();
  }, []);

  const count = (s: PartnerApplicantStatus) => applicants.filter((a) => a.status === s).length;

  // 처리 필요 — 지금 액션할 것들.
  const actions = useMemo(() => {
    const list: { emoji: string; title: string; desc: string; href: string }[] = [];
    const newApplied = count("APPLIED");
    if (newApplied > 0) list.push({ emoji: "🧑‍💼", title: t(`신규 지원자 ${newApplied}명`, `${newApplied} new applicants`, `新增申请者 ${newApplied}名`, `${newApplied} ứng viên mới`, `新規応募者 ${newApplied}名`, `${newApplied} pelamar baru`), desc: t("새로 지원한 인재를 검토해보세요.", "Review the newly applied talent.", "查看新申请的人才。", "Xem xét nhân tài mới ứng tuyển.", "新しく応募した人材を確認しましょう。", "Tinjau talenta yang baru melamar."), href: partnerRoutes.applicants });
    // 후보자가 제안한 면접 시간을 선택함 → 파트너가 확인/준비할 차례.
    const slotPicked = applicants.filter((a) => a.interviewSlotSelected).length;
    if (slotPicked > 0) list.push({ emoji: "🗓️", title: t(`면접 시간 확정 ${slotPicked}명`, `${slotPicked} interview times set`, `面试时间确定 ${slotPicked}名`, `${slotPicked} lịch phỏng vấn đã chọn`, `面接日程確定 ${slotPicked}名`, `${slotPicked} jadwal wawancara`), desc: t("지원자가 면접 시간을 선택했어요. 일정을 확인하세요.", "Applicants picked interview times. Check the schedule.", "申请者已选择面试时间，请确认日程。", "Ứng viên đã chọn giờ phỏng vấn. Hãy kiểm tra lịch.", "応募者が面接時間を選びました。日程を確認してください。", "Pelamar memilih waktu wawancara. Periksa jadwalnya."), href: partnerRoutes.applicants });
    const pending = positions.filter((p) => p.status === "PENDING_REVIEW").length;
    if (pending > 0) list.push({ emoji: "📋", title: t(`검토 중 공고 ${pending}개`, `${pending} postings in review`, `审核中职位 ${pending}个`, `${pending} tin đang duyệt`, `審査中の求人 ${pending}件`, `${pending} lowongan ditinjau`), desc: t("게시 승인을 기다리는 공고가 있어요.", "Some postings are awaiting approval.", "有职位正在等待发布审批。", "Có tin đang chờ phê duyệt đăng.", "掲載承認待ちの求人があります。", "Ada lowongan menunggu persetujuan."), href: partnerRoutes.positions });
    const draft = positions.filter((p) => p.status === "DRAFT").length;
    if (draft > 0) list.push({ emoji: "✏️", title: t(`작성 중 공고 ${draft}개`, `${draft} draft postings`, `草稿职位 ${draft}个`, `${draft} tin nháp`, `作成中の求人 ${draft}件`, `${draft} lowongan draf`), desc: t("마무리하지 못한 공고가 있어요.", "You have unfinished postings.", "有尚未完成的职位。", "Bạn có tin chưa hoàn tất.", "未完成の求人があります。", "Ada lowongan yang belum selesai."), href: partnerRoutes.positions });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicants, positions]);

  // 채용 파이프라인.
  const pipeline = useMemo(
    () => [
      { label: t("지원", "Applied", "申请", "Ứng tuyển", "応募", "Melamar"), count: count("APPLIED") },
      { label: t("검토", "Review", "审核", "Xem xét", "審査", "Ditinjau"), count: count("REVIEWING") },
      { label: t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara"), count: count("INTERVIEW") },
      { label: t("합격", "Hired", "录用", "Trúng tuyển", "合格", "Diterima"), count: count("ACCEPTED") + count("OFFERED") }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applicants]
  );

  // 공고별 지원 현황(게시 중 공고).
  const byPosition = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of applicants) counts.set(a.positionId, (counts.get(a.positionId) ?? 0) + 1);
    return positions
      .filter((p) => p.status === "OPEN")
      .map((p) => ({ p, count: counts.get(p.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [applicants, positions]);

  const recent = useMemo(
    () => [...applicants].sort((a, b) => (b.appliedAt ?? "").localeCompare(a.appliedAt ?? "")).slice(0, 5),
    [applicants]
  );

  // 모의 면접으로 발굴 — 지원 안 한 사람 우선, 점수순 상위 4(인재 중복 제거).
  const discovered = useMemo(() => {
    const sorted = [...participants].sort((a, b) => Number(a.applied) - Number(b.applied) || (b.bestScore ?? -1) - (a.bestScore ?? -1));
    const seen = new Set<string>();
    const out: OrgMockInterviewParticipant[] = [];
    for (const m of sorted) {
      if (seen.has(m.userId)) continue;
      seen.add(m.userId);
      out.push(m);
      if (out.length >= 4) break;
    }
    return out;
  }, [participants]);

  return (
    <PartnerAppShell>
      {status === "loading" ? <TLoading /> : null}
      {status === "error" ? <TError onRetry={load} /> : null}

      {status === "ready" ? (
        <div className="flex flex-col gap-10">
          {/* 인사 히어로 — 배경 카드 없이 일러스트가 페이지에 녹아들게 */}
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#0B46E8]">PARTNER</p>
              <p className="mt-2 text-[13px] font-bold text-[#4E5968]">{greeting} 👋</p>
              <h1 className="mt-1 break-keep text-[22px] font-black leading-[1.2] tracking-[-0.02em] text-[#0B1227] md:text-[26px]">
                {t(`${org?.name || "우리 회사"}, 좋은 인재를 만나요`, `${org?.name || "Our company"}, meet great talent`, `${org?.name || "我们公司"}，遇见优秀人才`, `${org?.name || "Công ty của bạn"}, gặp gỡ nhân tài`, `${org?.name || "わが社"}、良い人材に出会いましょう`, `${org?.name || "Perusahaan kami"}, temukan talenta hebat`)}
              </h1>
              <p className="mt-1.5 text-[13.5px] text-[#8B95A1]">{t(`게시 중 공고 ${positions.filter((p) => p.status === "OPEN").length}개 · 전체 지원자 ${applicants.length}명`, `${positions.filter((p) => p.status === "OPEN").length} open postings · ${applicants.length} applicants`, `在招职位 ${positions.filter((p) => p.status === "OPEN").length}个 · 申请者共 ${applicants.length}名`, `${positions.filter((p) => p.status === "OPEN").length} tin đang tuyển · ${applicants.length} ứng viên`, `掲載中の求人 ${positions.filter((p) => p.status === "OPEN").length}件 · 応募者 ${applicants.length}名`, `${positions.filter((p) => p.status === "OPEN").length} lowongan aktif · ${applicants.length} pelamar`)}{(() => {
                const weekAgo = Date.now() - 7 * 86_400_000;
                const wk = applicants.filter((a) => a.appliedAt && new Date(a.appliedAt).getTime() >= weekAgo).length;
                return wk > 0 ? t(` · 이번 주 신규 ${wk}명`, ` · ${wk} new this week`, ` · 本周新增 ${wk}名`, ` · ${wk} mới tuần này`, ` · 今週の新規 ${wk}名`, ` · ${wk} baru minggu ini`) : "";
              })()}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={partnerRoutes.positionNew} className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-3.5 py-2.5 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]"><Plus className="h-4 w-4" weight="bold" /> {t("새 공고 작성", "New posting", "新建职位", "Tạo tin mới", "新規求人", "Lowongan baru")}</Link>
                <Link href={partnerRoutes.talent} className="inline-flex items-center rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">{t("인재 검색", "Talent search", "人才搜索", "Tìm nhân tài", "人材検索", "Cari talenta")}</Link>
              </div>
            </div>
            <div className="relative hidden aspect-square w-[140px] shrink-0 self-center sm:block md:w-[190px]" aria-hidden>
              <Image src="/img_partner_recruit.webp" alt="" fill sizes="190px" className="object-contain" />
            </div>
          </div>

          {/* 새 파트너 온보딩 — 공고가 아직 없으면 시작 가이드 */}
          {positions.length === 0 ? (
            <section className="rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-5">
              <p className="text-[14.5px] font-bold text-[#191F28]">{t("채용을 시작해볼까요?", "Ready to start hiring?", "开始招聘了吗？", "Bắt đầu tuyển dụng nhé?", "採用を始めましょうか？", "Mulai rekrut yuk?")}</p>
              <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("두 가지만 완성하면 인재들에게 우리 회사가 보여요.", "Complete two steps and talent will see your company.", "只需完成两步，人才就能看到你的公司。", "Hoàn tất hai bước là nhân tài sẽ thấy công ty bạn.", "2つ完了すれば人材に会社が表示されます。", "Selesaikan dua langkah, talenta akan melihat perusahaan Anda.")}</p>
              <div className="mt-3 flex flex-col gap-2">
                <OnboardStep done={!!(org?.description && org.description.trim())} label={t("회사 프로필 채우기", "Fill in company profile", "完善公司资料", "Điền hồ sơ công ty", "会社プロフィールを入力", "Lengkapi profil perusahaan")} desc={t("소개·로고를 등록하면 지원자에게 신뢰를 줘요.", "Adding an intro and logo builds trust with applicants.", "填写简介和标志能赢得申请者信任。", "Thêm giới thiệu và logo tạo niềm tin với ứng viên.", "紹介・ロゴを登録すると応募者の信頼を得られます。", "Menambah perkenalan dan logo membangun kepercayaan pelamar.")} href={partnerRoutes.company} />
                <OnboardStep done={false} label={t("첫 공고 올리기", "Post your first job", "发布首个职位", "Đăng tin đầu tiên", "最初の求人を投稿", "Posting lowongan pertama")} desc={t("공고를 게시하고 지원을 받아보세요.", "Publish a posting and start receiving applications.", "发布职位并开始接收申请。", "Đăng tin và bắt đầu nhận đơn ứng tuyển.", "求人を掲載して応募を受け付けましょう。", "Terbitkan lowongan dan mulai terima lamaran.")} href={partnerRoutes.positionNew} />
              </div>
            </section>
          ) : null}

          {/* 처리 필요 */}
          <section className="flex flex-col gap-4">
            <SectionHead title={t("처리 필요", "Needs attention", "待处理", "Cần xử lý", "対応が必要", "Perlu ditangani")} desc={t("지금 확인하면 좋은 일이에요.", "Good things to check right now.", "现在处理更好。", "Nên xử lý ngay bây giờ.", "今確認しておくとよいことです。", "Sebaiknya ditangani sekarang.")} />
            {actions.length ? (
              <div className="flex flex-col gap-2.5">
                {actions.map((a) => (
                  <Link key={a.title} href={a.href} className="flex items-center gap-3.5 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4 transition hover:border-[#0B46E8]/40">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[19px]" aria-hidden>{a.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold text-[#191F28]">{a.title}</p>
                      <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{a.desc}</p>
                    </div>
                    <CaretRight className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="bold" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#EEF1F5] bg-white p-6 text-center text-[13.5px] text-[#8B95A1]">{t("지금 처리할 일이 없어요 👍", "Nothing to handle right now 👍", "暂时没有待处理事项 👍", "Hiện chưa có việc cần xử lý 👍", "今対応することはありません 👍", "Tidak ada yang perlu ditangani 👍")}</div>
            )}
          </section>

          {/* 답장을 기다리는 메시지 */}
          {pending.length ? (
            <section className="flex flex-col gap-4">
              <SectionHead title={t(`답장을 기다리는 메시지 (${pending.length})`, `Awaiting reply (${pending.length})`, `等待回复的消息 (${pending.length})`, `Tin chờ trả lời (${pending.length})`, `返信待ちのメッセージ (${pending.length})`, `Menunggu balasan (${pending.length})`)} desc={t("지원자가 보낸 메시지에 아직 답하지 않았어요.", "You haven't replied to applicants' messages yet.", "你还没有回复申请者的消息。", "Bạn chưa trả lời tin nhắn của ứng viên.", "応募者からのメッセージにまだ返信していません。", "Anda belum membalas pesan pelamar.")} />
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {pending.slice(0, 6).map((m, i) => (
                  <button key={m.applicantId} type="button" onClick={() => setChat({ applicationId: m.applicationId, applicantId: m.applicantId, name: m.name, positionTitle: m.positionTitle })} className={`flex items-center gap-3 px-4 py-3.5 text-left transition hover:bg-[#F6F8FB] ${i === Math.min(pending.length, 6) - 1 ? "" : "border-b border-[#F2F4F6]"}`}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3E6] text-[#E8890C]"><ChatCircleDots className="h-5 w-5" weight="fill" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] font-bold text-[#191F28]">{m.name}</p>
                        <span className="shrink-0 text-[11px] text-[#B0B8C1]">{formatRelativeTime(new Date(m.lastMessageAt).getTime())}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{m.lastMessage}</p>
                    </div>
                    <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {/* 채용 파이프라인 */}
          <section className="flex flex-col gap-4">
            <SectionHead title={t("채용 파이프라인", "Hiring pipeline", "招聘流程", "Quy trình tuyển dụng", "採用パイプライン", "Alur rekrutmen")} desc={t("지원부터 합격까지 단계별 인원이에요.", "People at each stage from applied to hired.", "从申请到录用各阶段的人数。", "Số người ở mỗi giai đoạn từ ứng tuyển đến trúng tuyển.", "応募から合格までの段階別人数です。", "Jumlah orang di tiap tahap dari melamar hingga diterima.")} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {pipeline.map((s) => (
                <div key={s.label} className="rounded-2xl border border-[#EEF1F5] bg-white px-3 py-4 text-center">
                  <p className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{s.count}</p>
                  <p className="mt-0.5 text-[12px] font-semibold text-[#8B95A1]">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* 공고별 지원 현황 */}
          {byPosition.length ? (
            <section className="flex flex-col gap-4">
              <SectionHead title={t("공고별 지원 현황", "Applications by posting", "各职位申请情况", "Ứng tuyển theo tin", "求人別の応募状況", "Lamaran per lowongan")} desc={t("게시 중 공고에 얼마나 지원했는지 확인해요.", "See how many applied to each open posting.", "查看各在招职位的申请数量。", "Xem có bao nhiêu người ứng tuyển mỗi tin.", "掲載中の求人への応募数を確認します。", "Lihat berapa banyak yang melamar tiap lowongan aktif.")} />
              <div className="flex flex-col overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
                {byPosition.map(({ p, count: c }, i) => (
                  <Link key={p.id} href={`${partnerRoutes.positions}/${p.id}`} className={`flex items-center gap-3 px-4 py-3.5 transition hover:bg-[#F6F8FB] ${i === byPosition.length - 1 ? "" : "border-b border-[#F2F4F6]"}`}>
                    <span className={`shrink-0 rounded-md px-2.5 py-0.5 text-[11px] font-bold ${PARTNER_POSITION_STATUS[p.status].cls}`}>{positionLabel(p.status)}</span>
                    <p className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#191F28]">{p.title || t("제목 없는 공고", "Untitled posting", "无标题职位", "Tin chưa có tiêu đề", "無題の求人", "Lowongan tanpa judul")}</p>
                    <span className="shrink-0 text-[13px] font-bold text-[#0B46E8]">{t(`지원 ${c}명`, `${c} applied`, `${c}人申请`, `${c} ứng tuyển`, `${c}名応募`, `${c} melamar`)}</span>
                    <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
                  </Link>
                ))}
              </div>
              <PartnerMoreLink href={partnerRoutes.positions}>{t("공고 전체 보기", "View all postings", "查看全部职位", "Xem tất cả tin", "求人をすべて見る", "Lihat semua lowongan")}</PartnerMoreLink>
            </section>
          ) : null}

          {/* 최근 지원자 */}
          <section className="flex flex-col gap-4">
            <SectionHead title={t("최근 지원자", "Recent applicants", "最近申请者", "Ứng viên gần đây", "最近の応募者", "Pelamar terbaru")} desc={t("새로 지원한 인재를 확인해요.", "Check the newly applied talent.", "查看新申请的人才。", "Xem nhân tài mới ứng tuyển.", "新しく応募した人材を確認します。", "Lihat talenta yang baru melamar.")} />
            {recent.length ? (
              <>
                <div className="flex flex-col gap-2.5">
                  {recent.map((a) => (
                    <PartnerApplicantCard key={a.id} a={a} />
                  ))}
                </div>
                <PartnerMoreLink href={partnerRoutes.applicants}>{t("지원자 전체 보기", "View all applicants", "查看全部申请者", "Xem tất cả ứng viên", "応募者をすべて見る", "Lihat semua pelamar")}</PartnerMoreLink>
              </>
            ) : (
              <PartnerEmptyCard emoji="🧑‍💼" title={t("아직 지원자가 없어요", "No applicants yet", "还没有申请者", "Chưa có ứng viên", "まだ応募者がいません", "Belum ada pelamar")} desc={t("공고를 올리면 지원자가 여기에 모여요.", "Post a job and applicants gather here.", "发布职位后，申请者会汇集在这里。", "Đăng tin và ứng viên sẽ tập hợp ở đây.", "求人を投稿すると応募者がここに集まります。", "Posting lowongan dan pelamar akan berkumpul di sini.")} />
            )}
          </section>

          {/* 모의 면접으로 발굴한 인재 — 지원 안 해도 모의 면접 본 사람 우선 노출 */}
          {discovered.length ? (
            <section className="flex flex-col gap-4">
              <SectionHead title={t("모의 면접으로 발굴한 인재", "Talent found via mock interview", "通过模拟面试发掘的人才", "Nhân tài từ phỏng vấn thử", "模擬面接で見つけた人材", "Talenta dari wawancara simulasi")} desc={t("지원 전이라도 우리 공고 모의 면접을 풀어본 인재예요.", "Talent who tried this posting's mock interview, even before applying.", "即使还未申请，也做过本职位模拟面试的人才。", "Nhân tài đã thử phỏng vấn của tin này dù chưa ứng tuyển.", "応募前でもこの求人の模擬面接を受けた人材です。", "Talenta yang mencoba wawancara simulasi lowongan ini sebelum melamar.")} />
              <div className="flex flex-col gap-2.5">
                {discovered.map((m) => (
                  <PartnerParticipantCard key={`${m.userId}:${m.positionId}`} m={m} onPropose={() => setProposeTarget(m)} />
                ))}
              </div>
              <PartnerMoreLink href={`${partnerRoutes.applicants}?tab=mock`}>{t("모의 면접 참여자 전체 보기", "View all mock participants", "查看全部模拟面试参与者", "Xem tất cả người phỏng vấn thử", "模擬面接参加者をすべて見る", "Lihat semua peserta wawancara simulasi")}</PartnerMoreLink>
            </section>
          ) : null}

          {/* 빠른 작업 */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href={partnerRoutes.positionNew} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] px-5 py-3.5 text-[14.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
              <Plus className="h-4 w-4" weight="bold" /> {t("새 공고 작성", "New posting", "新建职位", "Tạo tin mới", "新規求人", "Lowongan baru")}
            </Link>
            <Link href={partnerRoutes.positions} className="inline-flex flex-1 items-center justify-center rounded-2xl border border-[#E5E8EB] bg-white px-5 py-3.5 text-[14.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]">
              {t("공고 관리", "Manage postings", "管理职位", "Quản lý tin", "求人管理", "Kelola lowongan")}
            </Link>
          </div>
        </div>
      ) : null}

      {chat ? (
        <ChatModal
          applicationId={chat.applicationId}
          applicantId={chat.applicantId}
          name={chat.name}
          positionTitle={chat.positionTitle}
          onReplied={() => setPending((prev) => prev.filter((x) => x.applicationId !== chat.applicationId))}
          onClose={() => {
            setChat(null);
            void getPartnerPendingMessages().then(setPending).catch(() => {});
          }}
        />
      ) : null}

      {proposeTarget ? (
        <ProposeCandidateModal
          positionId={proposeTarget.positionId}
          userId={proposeTarget.userId}
          name={proposeTarget.name}
          onClose={() => setProposeTarget(null)}
          onDone={() => {
            setParticipants((prev) => prev.map((x) => (x.userId === proposeTarget.userId ? { ...x, connectionStatus: "PENDING" } : x)));
            setProposeTarget(null);
          }}
        />
      ) : null}
    </PartnerAppShell>
  );
}

// 지원자와의 대화 팝업 — 스레드 + 답장.
function ChatModal({ applicationId, applicantId, name, positionTitle, onClose, onReplied }: { applicationId: string; applicantId: string; name: string; positionTitle: string; onClose: () => void; onReplied: () => void }) {
  const toast = useTalentPopup();
  const t = usePlatformT();
  useLockBodyScroll();
  const [messages, setMessages] = useState<PartnerApplicantMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  function loadMessages() {
    void getPartnerApplicantMessages(applicationId).then(setMessages).catch(() => {});
  }
  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  function send() {
    const msg = text.trim();
    if (!msg || sending) return;
    setSending(true);
    sendPartnerApplicantMessage(applicationId, msg)
      .then(() => {
        setText("");
        loadMessages();
        onReplied(); // 답장했으니 미답장 목록에서 즉시 제거.
      })
      .catch(() => toast.error(t("메시지 전송에 실패했어요.", "Couldn't send the message.", "消息发送失败。", "Không gửi được tin nhắn.", "メッセージを送信できませんでした。", "Gagal mengirim pesan.")))
      .finally(() => setSending(false));
  }

  const chat = messages.filter((m) => m.visibility === "CANDIDATE");

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#0B1227]/40 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="flex h-[80vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-3xl bg-white sm:h-[560px] sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#F2F4F6] px-5 py-4">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold text-[#191F28]">{name}</p>
            <p className="truncate text-[12px] text-[#8B95A1]">{positionTitle}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Link href={`${partnerRoutes.applicants}/${encodeURIComponent(applicantId)}`} className="inline-flex items-center gap-1 rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">
              {t("지원자 상세", "Applicant detail", "申请者详情", "Chi tiết ứng viên", "応募者詳細", "Detail pelamar")} <ArrowUpRight className="h-3.5 w-3.5" weight="bold" />
            </Link>
            <button type="button" onClick={onClose} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-9 w-9 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]"><X className="h-5 w-5" /></button>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-5 py-4">
          {chat.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-[#B0B8C1]">{t("아직 주고받은 메시지가 없어요.", "No messages exchanged yet.", "还没有任何消息往来。", "Chưa có tin nhắn nào.", "まだやり取りしたメッセージがありません。", "Belum ada pesan.")}</p>
          ) : (
            chat.map((m) => {
              const mine = m.authorRole !== "STUDENT";
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${mine ? "bg-[#0B46E8] text-white" : "border border-[#EEF1F5] bg-white text-[#191F28]"}`}>
                    <p className="whitespace-pre-wrap break-words text-[13.5px] leading-relaxed">{m.content}</p>
                    <p className={`mt-1 text-[10.5px] ${mine ? "text-white/60" : "text-[#B0B8C1]"}`}>{formatRelativeTime(new Date(m.createdAt).getTime())}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex items-end gap-2 border-t border-[#F2F4F6] px-4 py-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={t("답장 보내기…", "Send a reply…", "发送回复…", "Gửi trả lời…", "返信を送る…", "Kirim balasan…")}
            className="max-h-28 flex-1 resize-none rounded-2xl bg-[#F2F4F6] px-4 py-2.5 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] focus:outline-none focus:ring-2 focus:ring-[#0B46E8]/30"
          />
          <button type="button" onClick={send} disabled={!text.trim() || sending} aria-label={t("보내기", "Send", "发送", "Gửi", "送信", "Kirim")} className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl bg-[#0B46E8] text-white transition hover:bg-[#0A3ECB] disabled:opacity-40">
            <PaperPlaneTilt className="h-5 w-5" weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{desc}</p>
    </div>
  );
}

function OnboardStep({ done, label, desc, href }: { done: boolean; label: string; desc: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 transition hover:bg-[#EEF3FF]">
      {done ? <CheckCircle className="h-5 w-5 shrink-0 text-[#0A9B59]" weight="fill" /> : <Circle className="h-5 w-5 shrink-0 text-[#B0B8C1]" />}
      <div className="min-w-0 flex-1">
        <p className={`text-[13.5px] font-bold ${done ? "text-[#8B95A1] line-through" : "text-[#191F28]"}`}>{label}</p>
        <p className="mt-0.5 break-keep text-[12px] text-[#8B95A1]">{desc}</p>
      </div>
      <CaretRight className="h-4 w-4 shrink-0 text-[#0B46E8]" weight="bold" />
    </Link>
  );
}

