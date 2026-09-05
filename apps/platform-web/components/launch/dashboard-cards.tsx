"use client";

// UX Phase 2 — 대시보드 카드 8종(프레젠테이셔널, view model props 소비). 자체 fetch 없음.
// 원칙: 기능 나열이 아니라 오늘 할 한 가지 행동·현재 주차·결과물·성장·다음 행동을 연결.
// i18n: 구조 라벨은 useLaunchT 로 6개국어. 코치 메시지·결과물 상태/라벨 등 VM 데이터는 서버가 생성(현재 한국어) —
//       완전 다국어화는 서버 로컬라이제이션 필요(별도 과제).
import Link from "next/link";
import { ArrowRight, Clock, CheckCircle, Lock, Sparkle, Users, CalendarBlank, FileText, WarningCircle } from "@phosphor-icons/react";
import { trackCareerFunnel } from "../../lib/analytics";
import { logActivity } from "../../lib/launch/pilot-client";
import { EmptyState } from "./dashboard-states";
import { useLaunchT } from "../../lib/launch/i18n";
import type { DashboardVM, DashArtifact } from "../../lib/launch/dashboard-client";

type LaunchT = ReturnType<typeof useLaunchT>;

// 4주 여정 메타(클라 하드코딩) — 6개국어.
function weekMeta(t: LaunchT): { title: string; goal: string; result: string }[] {
  return [
    {
      title: t("나를 이해하고 직무 탐험", "Understand yourself & explore roles", "认识自己·探索职务", "Hiểu bản thân & khám phá nghề", "自分を知り職種を探索", "Pahami diri & jelajahi peran"),
      goal: t("강점을 발견하고 어울리는 목표 직무를 정해요", "Discover your strengths and set a fitting target role", "发现优势并确定合适的目标职务", "Khám phá điểm mạnh và chọn nghề mục tiêu phù hợp", "強みを見つけ、合う目標職種を決めます", "Temukan kelebihan dan tetapkan peran target yang cocok"),
      result: t("목표 직무 · 강점 정리", "Target role · strengths summary", "目标职务·优势整理", "Nghề mục tiêu · tóm tắt điểm mạnh", "目標職種・強みの整理", "Peran target · ringkasan kelebihan")
    },
    {
      title: t("실제 지원서 완성하기", "Complete real application docs", "完成真实申请材料", "Hoàn thành hồ sơ ứng tuyển thật", "実際の応募書類を完成", "Selesaikan dokumen lamaran nyata"),
      goal: t("목표 직무·기준 공고에 맞춰 이력서와 자기소개서를 완성해요", "Finish your resume and cover letter tailored to your target role and posting", "根据目标职务与基准公告完成简历和求职信", "Hoàn thành CV và thư theo nghề mục tiêu và tin tuyển", "目標職種・基準求人に合わせ履歴書と自己紹介書を完成", "Selesaikan resume dan surat lamaran sesuai peran target dan lowongan"),
      result: t("공고 맞춤 이력서 · 자기소개서", "Posting-tailored resume · cover letter", "定制简历·求职信", "CV · thư theo tin tuyển", "求人に合わせた履歴書・自己紹介書", "Resume · surat lamaran sesuai lowongan")
    },
    {
      title: t("실전면접에서 약점 찾기", "Find weaknesses in a real mock interview", "在实战面试中找弱点", "Tìm điểm yếu qua phỏng vấn thử", "実戦模擬面接で弱点を発見", "Temukan kelemahan lewat wawancara simulasi"),
      goal: t("실전처럼 모의면접을 보고 반복되는 약점을 찾아요", "Take a realistic mock interview and spot recurring weaknesses", "像实战一样进行模拟面试，找出反复出现的弱点", "Phỏng vấn thử như thật và tìm điểm yếu lặp lại", "実戦のように模擬面接を受け、繰り返す弱点を見つけます", "Ikuti wawancara simulasi realistis dan temukan kelemahan berulang"),
      result: t("첫 모의면접 리포트 · 핵심 오답노트", "First mock report · key review notes", "首次模拟报告·核心错题本", "Báo cáo thử đầu · sổ lỗi chính", "初回模擬レポート・重要復習ノート", "Laporan simulasi pertama · catatan koreksi utama")
    },
    {
      title: t("약점 교정하고 최종 검증", "Fix weaknesses & final check", "纠正弱点·最终验证", "Sửa điểm yếu & kiểm tra cuối", "弱点を修正し最終検証", "Perbaiki kelemahan & verifikasi akhir"),
      goal: t("오답을 반복 교정하고 최종 면접에서 성장을 확인해요", "Repeatedly fix corrections and confirm your growth in a final interview", "反复纠错并在终面确认成长", "Sửa lỗi lặp lại và xác nhận sự phát triển ở phỏng vấn cuối", "復習を繰り返し修正し、最終面接で成長を確認", "Perbaiki koreksi berulang dan konfirmasi pertumbuhan di wawancara akhir"),
      result: t("성장 리포트 · 30일 계획", "Growth report · 30-day plan", "成长报告·30天计划", "Báo cáo phát triển · kế hoạch 30 ngày", "成長レポート・30日計画", "Laporan pertumbuhan · rencana 30 hari")
    }
  ];
}

// 공용 짧은 라벨.
const tResult = (t: LaunchT) => t("결과물", "Result", "成果", "Kết quả", "成果物", "Hasil");

// 영역 1 — 전담 코치 메시지(최상단). 기억·오늘 할 일·목적·예상시간·CTA. (코치 텍스트는 VM=서버 생성)
export function CoachTodayCard({ vm }: { vm: DashboardVM }) {
  const t = useLaunchT();
  const c = vm.coach;
  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#3182F6] to-[#1B64DA] p-5 text-white shadow-[0_8px_24px_-10px_rgba(49,130,246,0.5)]">
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white/85">
        <Sparkle size={15} weight="fill" /> {t("전담 커리어 코치", "Your career coach", "专属职业教练", "Coach nghề riêng", "専属キャリアコーチ", "Coach karier pribadi")}
      </div>
      <div className="mt-2.5 space-y-1.5 text-[15px] leading-relaxed">
        {c.remembered ? <p className="text-white/90">{c.remembered}</p> : null}
        <p className="font-semibold">{c.todayFocus}</p>
        {c.purpose ? <p className="text-[13.5px] text-white/85">{c.purpose}</p> : null}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[12.5px] text-white/85">
        <span className="inline-flex items-center gap-1">
          <Clock size={13} weight="bold" /> {t(`약 ${c.estimatedMinutes}분`, `About ${c.estimatedMinutes} min`, `约 ${c.estimatedMinutes} 分钟`, `Khoảng ${c.estimatedMinutes} phút`, `約${c.estimatedMinutes}分`, `Sekitar ${c.estimatedMinutes} mnt`)}
        </span>
        <span aria-hidden>·</span>
        <span>{tResult(t)}: {c.expectedResult}</span>
      </div>
      <Link
        href={vm.nextAction.destination}
        onClick={() => {
          void logActivity("next_action_click", { week: vm.currentWeek }); // 주요 행동 클릭 자체 DB 적재(#3)
          trackCareerFunnel("career_primary_action_clicked", { actionType: vm.nextAction.actionType, destination: vm.nextAction.destination, currentWeek: vm.currentWeek });
        }}
        className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-3 text-[14.5px] font-bold text-[#1B64DA] transition"
      >
        {c.cta} <ArrowRight size={16} weight="bold" />
      </Link>
    </div>
  );
}

// 영역 2 — 현재 주차. 진행률보다 현재 미션·완료 결과물을 강조.
export function CurrentWeekCard({ vm, doneCount, requiredCount }: { vm: DashboardVM; doneCount: number; requiredCount: number }) {
  const t = useLaunchT();
  const w = vm.currentWeek;
  const metas = weekMeta(t);
  const meta = metas[w - 1] ?? metas[0];
  const pct = requiredCount > 0 ? Math.round((doneCount / requiredCount) * 100) : 0;
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-[#E8F3FF] px-2.5 py-1 text-[12px] font-bold text-[#1B64DA]">Week {w}</span>
        <span className="text-[15px] font-bold text-[#191F28]">{meta.title}</span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-[#4E5968]">{meta.goal}</p>
      <div className="mt-3 flex items-center justify-between text-[12.5px]">
        <span className="font-semibold text-[#191F28]">
          {t(`${requiredCount}개 중 ${doneCount}개 완료`, `${doneCount} of ${requiredCount} done`, `${requiredCount} 项中完成 ${doneCount} 项`, `${doneCount}/${requiredCount} hoàn thành`, `${requiredCount}件中${doneCount}件完了`, `${doneCount} dari ${requiredCount} selesai`)}
        </span>
        <span className="tabular-nums text-[#8B95A1]">{pct}%</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#F2F4F6]">
        <div className="h-full rounded-full bg-[#3182F6] transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-3 text-[12.5px] text-[#4E5968]">
        <span className="text-[#8B95A1]">{tResult(t)}</span> · {meta.result}
      </p>
    </div>
  );
}

// 영역 3 — 오늘 할 일(단일 행동, 구조화). 모호한 버튼 금지. (label/reason/cta 는 VM=서버 생성)
export function NextActionCard({ vm }: { vm: DashboardVM }) {
  const t = useLaunchT();
  const a = vm.nextAction;
  const blocked = Boolean(a.blockedReason);
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <p className="text-[15px] font-bold text-[#191F28]">{a.label}</p>
      {a.reason ? <p className="mt-1 text-[13px] text-[#4E5968]">{a.reason}</p> : null}
      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[12px] text-[#8B95A1]">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F2F4F6] px-2 py-0.5">
          <Clock size={12} weight="bold" /> {t(`약 ${a.estimatedMinutes}분`, `About ${a.estimatedMinutes} min`, `约 ${a.estimatedMinutes} 分钟`, `Khoảng ${a.estimatedMinutes} phút`, `約${a.estimatedMinutes}分`, `Sekitar ${a.estimatedMinutes} mnt`)}
        </span>
        <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5">{tResult(t)}: {a.expectedResult}</span>
      </div>
      {blocked ? (
        <p className="mt-3 flex items-center gap-1 text-[12.5px] text-[#C77700]">
          <WarningCircle size={14} weight="fill" /> {a.blockedReason}
        </p>
      ) : (
        <Link
          href={a.destination}
          onClick={() => {
            void logActivity("next_action_click", { week: vm.currentWeek }); // 주요 행동 클릭 자체 DB 적재(#3)
            trackCareerFunnel("career_primary_action_clicked", { actionType: a.actionType, destination: a.destination, currentWeek: vm.currentWeek });
          }}
          className="mt-3.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-3 text-[14px] font-bold text-white transition"
        >
          {a.cta} <ArrowRight size={15} weight="bold" />
        </Link>
      )}
    </div>
  );
}

// 영역 4 — 4주 여정. 상태 + 잠긴 주차 해제 조건.
const STATUS_TONE: Record<string, string> = {
  completed: "bg-[#E7F7EF] text-[#0A9B59]",
  in_progress: "bg-[#E8F3FF] text-[#1B64DA]",
  available: "bg-[#F2F4F6] text-[#4E5968]",
  locked: "bg-[#F2F4F6] text-[#B0B8C1]"
};
function journeyStatusLabel(t: LaunchT, status: string): string {
  switch (status) {
    case "completed": return t("완성했어요", "Completed", "已完成", "Đã hoàn thành", "完了しました", "Selesai");
    case "in_progress": return t("진행 중", "In progress", "进行中", "Đang thực hiện", "進行中", "Berlangsung");
    case "available": return t("시작할 수 있어요", "Ready to start", "可以开始", "Sẵn sàng bắt đầu", "開始できます", "Siap dimulai");
    default: return t("잠김", "Locked", "已锁定", "Đã khóa", "ロック中", "Terkunci");
  }
}
export function FourWeekJourney({ vm }: { vm: DashboardVM }) {
  const t = useLaunchT();
  const metas = weekMeta(t);
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {metas.map((meta, i) => {
        const week = i + 1;
        const done = vm.weekComplete[i];
        const isCurrent = week === vm.currentWeek && !done;
        const prevDone = i === 0 || vm.weekComplete[i - 1];
        const status = done ? "completed" : isCurrent ? "in_progress" : prevDone ? "available" : "locked";
        return (
          <Link
            key={week}
            href={status === "locked" ? "#" : `/career-launch/week/${week}`}
            onClick={(e) => {
              if (status === "locked") {
                e.preventDefault();
                return;
              }
              trackCareerFunnel("career_week_card_clicked", { currentWeek: week });
            }}
            aria-disabled={status === "locked"}
            className={`rounded-2xl border p-4 transition ${status === "locked" ? "cursor-default border-[#F2F4F6] bg-[#FBFCFD]" : "border-[#EEF1F5] bg-white hover:border-[#3182F6]/30"} ${isCurrent ? "ring-2 ring-[#3182F6]/25" : ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold text-[#8B95A1]">Week {week}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${STATUS_TONE[status]}`}>
                {status === "completed" ? <CheckCircle size={11} weight="fill" /> : status === "locked" ? <Lock size={10} weight="fill" /> : null}
                {journeyStatusLabel(t, status)}
              </span>
            </div>
            <p className="mt-1.5 text-[14px] font-bold text-[#191F28]">{meta.title}</p>
            <p className="mt-0.5 text-[12px] text-[#8B95A1]">{tResult(t)} · {meta.result}</p>
            {status === "locked" ? (
              <p className="mt-2 text-[11.5px] text-[#B0B8C1]">{t(`Week ${week - 1} 결과물을 완성하면 열려요`, `Opens when you finish Week ${week - 1}`, `完成第${week - 1}周成果后解锁`, `Mở khi hoàn thành Tuần ${week - 1}`, `Week ${week - 1}を終えると開きます`, `Terbuka setelah Minggu ${week - 1} selesai`)}</p>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

// 영역 5 — 최근 결과물(최대 3). 상태(a.status)는 서버 한국어 → 알려진 값만 로컬 라벨로 매핑.
const ART_TONE: Record<string, string> = { 완성: "text-[#0B46E8]", "확인 필요": "text-[#C77700]", "작성 중": "text-[#4E5968]", "작성 전": "text-[#8B95A1]" };
function artStatusLabel(t: LaunchT, s: string): string {
  switch (s) {
    case "완성": return t("완성", "Done", "完成", "Xong", "完成", "Selesai");
    case "확인 필요": return t("확인 필요", "Needs review", "待确认", "Cần xem lại", "確認必要", "Perlu ditinjau");
    case "작성 중": return t("작성 중", "In progress", "编写中", "Đang viết", "作成中", "Sedang dibuat");
    case "작성 전": return t("작성 전", "Not started", "未开始", "Chưa bắt đầu", "未作成", "Belum dimulai");
    default: return s;
  }
}
export function ArtifactStatusCard({ artifacts }: { artifacts: DashArtifact[] }) {
  const t = useLaunchT();
  const items = artifacts.slice(0, 3);
  if (items.length === 0) return <EmptyState title={t("아직 결과물이 없어요", "No deliverables yet", "还没有成果", "Chưa có kết quả", "まだ成果物がありません", "Belum ada hasil")} description={t("첫 상담부터 시작하면 결과물이 하나씩 만들어져요.", "Start your first coaching and deliverables build up one by one.", "从首次咨询开始，成果会一个个产生。", "Bắt đầu buổi tư vấn đầu tiên, kết quả sẽ hình thành dần.", "最初の相談から始めると成果物が一つずつ作られます。", "Mulai konseling pertama dan hasil terbentuk satu per satu.")} />;
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((a) => (
        <Link
          key={a.type}
          href={a.destination}
          onClick={() => trackCareerFunnel("career_artifact_clicked", { artifactType: a.type, destination: a.destination })}
          className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#3182F6]/30"
        >
          <FileText size={20} className="flex-none text-[#8B95A1]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-[#191F28]">{a.label}</p>
            <p className={`mt-0.5 text-[12.5px] font-semibold ${ART_TONE[a.status] ?? "text-[#8B95A1]"}`}>
              {artStatusLabel(t, a.status)}
              {a.remaining ? ` · ${t(`확인할 문장 ${a.remaining}개`, `${a.remaining} lines to review`, `${a.remaining} 句待确认`, `${a.remaining} câu cần xem`, `確認する文 ${a.remaining}件`, `${a.remaining} kalimat perlu ditinjau`)}` : a.detail ? ` · ${a.detail}` : ""}
            </p>
          </div>
          <ArrowRight size={16} className="flex-none text-[#C9CDD2]" />
        </Link>
      ))}
    </div>
  );
}

// 영역 6 — 내 성장(요약). 점수 없으면 0점 그래프 대신 다음 행동 안내.
export function GrowthSummaryCard({ vm }: { vm: DashboardVM }) {
  const t = useLaunchT();
  const g = vm.growthSummary;
  if (!g.available) {
    return <EmptyState title={t("아직 성장 데이터가 없어요", "No growth data yet", "还没有成长数据", "Chưa có dữ liệu phát triển", "まだ成長データがありません", "Belum ada data pertumbuhan")} description={t("첫 모의면접을 마치면 최초 대비 변화를 볼 수 있어요.", "Finish your first mock interview to see the change vs your first.", "完成首次模拟面试后可查看对比首次的变化。", "Hoàn thành phỏng vấn thử đầu tiên để thấy thay đổi so với ban đầu.", "初回模擬面接を終えると最初との変化が見られます。", "Selesaikan wawancara simulasi pertama untuk melihat perubahan dari awal.")} ctaLabel={t("첫 모의면접 시작하기", "Start your first mock interview", "开始首次模拟面试", "Bắt đầu phỏng vấn thử đầu tiên", "初回模擬面接を始める", "Mulai wawancara simulasi pertama")} href="/career-launch/week/3" />;
  }
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
        <p className="text-[12px] text-[#8B95A1]">{t("면접 성장(최초 대비)", "Interview growth (vs first)", "面试成长(对比首次)", "Tiến bộ PV (so với đầu)", "面接の成長(最初比)", "Pertumbuhan wawancara (vs awal)")}</p>
        <p className="mt-1 text-[22px] font-bold tabular-nums text-[#0A9B59]">{t(`+${g.scoreGrowthRate}점`, `+${g.scoreGrowthRate} pts`, `+${g.scoreGrowthRate} 分`, `+${g.scoreGrowthRate} điểm`, `+${g.scoreGrowthRate}点`, `+${g.scoreGrowthRate} poin`)}</p>
      </div>
      <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
        <p className="text-[12px] text-[#8B95A1]">{t("오답 해결", "Corrections resolved", "错题解决", "Lỗi đã sửa", "復習の解決", "Koreksi selesai")}</p>
        <p className="mt-1 text-[22px] font-bold tabular-nums text-[#191F28]">
          {g.correctionResolved ?? 0}
          <span className="text-[14px] text-[#8B95A1]">/{g.correctionTotal ?? 0}</span>
        </p>
      </div>
    </div>
  );
}

// 영역 7 — 함께하는 동료(참여감).
// activeThisWeek는 '본인 포함' 카운트라, 본인만 활동 중(<=1)이면 '함께'라는 신호가 없어 숨긴다
// (세미나 카드가 일정 없으면 숨는 것과 동일). 실제로 동료가 함께 활동할 때만 노출한다.
export function CohortActivityCard({ vm }: { vm: DashboardVM }) {
  const t = useLaunchT();
  const active = vm.cohortActivity.activeThisWeek;
  if (active == null || active < 2) return null;
  const peers = active - 1; // 본인을 제외한 동료 수
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-4">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EAF2FF]">
          <Users size={16} className="text-[#3182F6]" />
        </span>
        <div className="min-w-0">
          <p className="cl-eyebrow text-[#8B95A1]">{t("함께하는 동료", "Peers with you", "同行伙伴", "Đồng đội cùng bạn", "一緒に取り組む仲間", "Rekan bersamamu")}</p>
          <p className="mt-0.5 text-[14px] leading-snug text-[#191F28]">
            {t(`같은 기수 동료 ${peers}명이 이번 주 커리어를 준비하고 있어요`, `${peers} peers in your cohort are preparing this week`, `同期 ${peers} 名同伴本周正在准备求职`, `${peers} đồng đội cùng khóa đang chuẩn bị tuần này`, `同じ期の仲間 ${peers}名が今週キャリアを準備しています`, `${peers} rekan seangkatan sedang bersiap minggu ini`)}
          </p>
        </div>
      </div>
    </div>
  );
}

// 영역 8 — 일정 및 세미나(없으면 렌더 안 함). 세미나 제목(s.title)은 서버 데이터.
export function SeminarCard({ vm }: { vm: DashboardVM }) {
  const t = useLaunchT();
  const s = vm.nextSeminar;
  if (!s) return null;
  const dt = new Date(s.startsAt);
  return (
    <Link
      href="/career-launch/dashboard"
      onClick={() => trackCareerFunnel("career_seminar_clicked", { currentWeek: s.week })}
      className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-4"
    >
      <CalendarBlank size={20} className="flex-none text-[#3182F6]" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-[#191F28]">{s.title ?? `Week ${s.week} ${t("세미나", "Seminar", "研讨会", "Hội thảo", "セミナー", "Seminar")}`}</p>
        <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">
          {dt.toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {s.online ? t("온라인", "Online", "线上", "Trực tuyến", "オンライン", "Online") : t("오프라인", "Offline", "线下", "Trực tiếp", "オフライン", "Offline")}
        </p>
      </div>
    </Link>
  );
}
