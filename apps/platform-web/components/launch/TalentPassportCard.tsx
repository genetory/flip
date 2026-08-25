"use client";

// My Career Passport — Career Launch 데이터를 조립한 "검증된 Talent" 프로필.
// Readiness(원형 게이지) + Verified 등급 배지 + 영역별 준비도 + 활동 + 다음 액션.
// 각 점수는 반드시 행동(다음 액션)과 연결한다 — 점수 놀이가 되지 않게.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, SealCheck, CheckCircle, ShareNetwork } from "@phosphor-icons/react";
import { fetchTalentPassport, sharePassport, type TalentPassport, type PassportTier } from "../../lib/launch/progress-client";
import { useLaunchT } from "../../lib/launch/i18n";

const TIER_META: Record<PassportTier, { label: string; ring: string; chipBg: string; chipInk: string }> = {
  preparing: { label: "준비 중", ring: "#C9CDD2", chipBg: "#F2F4F6", chipInk: "#8B95A1" },
  bronze: { label: "Verified Bronze", ring: "#C08457", chipBg: "#F6ECE3", chipInk: "#A96A3E" },
  silver: { label: "Verified Silver", ring: "#8B95A1", chipBg: "#EEF1F5", chipInk: "#5A6472" },
  gold: { label: "Verified Gold", ring: "#E0A500", chipBg: "#FBF2D6", chipInk: "#A97B00" }
};

function ReadinessRing({ value, color }: { value: number; color: string }) {
  const r = 46;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative h-[116px] w-[116px] shrink-0">
      <svg viewBox="0 0 116 116" className="h-full w-full -rotate-90">
        <circle cx="58" cy="58" r={r} fill="none" stroke="#EEF1F5" strokeWidth="10" />
        <circle cx="58" cy="58" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-black leading-none tracking-[-0.02em] text-[#0B1227]">{value}</span>
        <span className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8B95A1]">Readiness</span>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <span className="w-14 shrink-0 text-[#8B95A1]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: "linear-gradient(90deg,#0B46E8,#3A6BFF)" }} />
      </div>
      <span className="w-7 shrink-0 text-right font-bold tabular-nums text-[#0B1227]">{v}</span>
    </div>
  );
}

export function TalentPassportCard() {
  const t = useLaunchT();
  const [p, setP] = useState<TalentPassport | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  async function share() {
    if (sharing) return;
    setSharing(true);
    try {
      const token = await sharePassport();
      if (token && typeof window !== "undefined") {
        const url = `${window.location.origin}/p/${token}`;
        await navigator.clipboard.writeText(url).catch(() => {});
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2200);
      }
    } finally {
      setSharing(false);
    }
  }

  useEffect(() => {
    let alive = true;
    void fetchTalentPassport().then((x) => {
      if (alive) {
        setP(x);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading || !p) return null;

  const tier = TIER_META[p.tier];

  const activityMeta = (status: string): { label: string; bg: string; ink: string } => {
    switch (status) {
      case "PENDING":
        return { label: t("인터뷰 제안 받음", "Interview invite", "收到面试邀约", "Nhận lời mời PV", "面接オファー", "Undangan wawancara"), bg: "#EDF1FD", ink: "#0B46E8" };
      case "ACCEPTED":
        return { label: t("수락함", "Accepted", "已接受", "Đã chấp nhận", "承認済み", "Diterima"), bg: "#EDF1FD", ink: "#0B46E8" };
      case "SCHEDULED":
        return { label: t("인터뷰 일정", "Scheduled", "已排期", "Đã hẹn", "面接予定", "Terjadwal"), bg: "#EDF1FD", ink: "#0B46E8" };
      case "COMPLETED":
        return { label: t("인터뷰 완료", "Interviewed", "已面试", "Đã PV", "面接完了", "Selesai"), bg: "#F2F4F6", ink: "#4E5968" };
      case "PASSED":
        return { label: t("합격 🎉", "Passed 🎉", "通过 🎉", "Đạt 🎉", "合格 🎉", "Lulus 🎉"), bg: "#E7F8EF", ink: "#0A9B59" };
      case "REJECTED":
        return { label: t("불합격", "Rejected", "未通过", "Trượt", "不合格", "Ditolak"), bg: "#FDECEE", ink: "#F04452" };
      default:
        return { label: t("거절함", "Declined", "已拒绝", "Đã từ chối", "辞退", "Ditolak"), bg: "#F2F4F6", ink: "#8B95A1" };
    }
  };

  return (
    <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-[#F6F9FF] to-[#EAF1FF] p-6 shadow-[0_16px_50px_-18px_rgba(11,70,232,0.24)] ring-1 ring-[#0B46E8]/10 md:p-8">
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-[240px] w-[240px] rounded-full bg-[#0B46E8]/[0.12] blur-[90px]" />

      <div className="relative flex flex-col gap-6">
        {/* 헤더 — 타이틀 + Verified 배지 */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-[#0B46E8]">My Career Passport</p>
            <h2 className="mt-1 text-[19px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[22px]">
              {t("검증된 나의 커리어", "My verified career", "我的已验证履历", "Hồ sơ đã xác minh", "検証済みのキャリア", "Karier terverifikasi")}
            </h2>
            {p.verifiedAt ? <p className="mt-1 text-[11.5px] font-semibold text-[#8B95A1]">{t("검증일", "Verified on", "验证日期", "Ngày xác minh", "検証日", "Terverifikasi")} {p.verifiedAt.slice(0, 10)}</p> : null}
          </div>
          <span
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-black"
            style={{ background: tier.chipBg, color: tier.chipInk }}
          >
            {p.verified ? <SealCheck size={15} weight="fill" aria-hidden /> : null}
            {tier.label}
          </span>
        </div>

        {/* 기업 제출용 공유 링크 */}
        <button
          type="button"
          onClick={() => void share()}
          disabled={sharing}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#DCE3F0] bg-white/70 px-3 py-1.5 text-[12px] font-bold text-[#4E5968] backdrop-blur-sm transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8] disabled:opacity-60"
        >
          <ShareNetwork size={14} weight="bold" aria-hidden />
          {copied
            ? t("링크가 복사됐어요 ✓", "Link copied ✓", "链接已复制 ✓", "Đã sao chép ✓", "リンクをコピーしました ✓", "Tersalin ✓")
            : t("기업 제출용 링크 공유", "Share link for employers", "分享给企业的链接", "Chia sẻ link cho NTD", "企業提出用リンクを共有", "Bagikan untuk perusahaan")}
        </button>

        {/* 상단 — Readiness 링 + 영역 바 */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ReadinessRing value={p.readiness} color={tier.ring} />
          <div className="flex-1 space-y-1.5">
            <Bar label={t("방향", "Direction", "方向", "Định hướng", "方向", "Arah")} value={p.breakdown.direction} />
            <Bar label={t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")} value={p.breakdown.resume} />
            <Bar label={t("자소서", "Cover", "自我介绍", "Thư", "自己PR", "Cover")} value={p.breakdown.cover} />
            <Bar label={t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara")} value={p.breakdown.interview} />
            <Bar label={t("경험", "Experience", "经历", "Kinh nghiệm", "経験", "Pengalaman")} value={p.breakdown.experience} />
          </div>
        </div>

        {/* 요약 스탯 */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[
            { k: "target", label: t("목표 직무", "Target", "目标职务", "Vị trí", "目標職務", "Target"), value: p.target.role ?? "—" },
            { k: "apply", label: t("지원", "Applied", "申请", "Ứng tuyển", "応募", "Lamaran"), value: String(p.activity.applications) },
            { k: "interview", label: t("면접 제안", "Interviews", "面试邀约", "Lời mời PV", "面接オファー", "Wawancara"), value: String(p.activity.interviewsInvited) },
            { k: "mock", label: t("모의면접", "Mock", "模拟面试", "PV thử", "模擬面接", "Simulasi"), value: `${p.activity.mockInterviews}/3` }
          ].map((s) => (
            <div key={s.k} className="rounded-2xl border border-[#EDF1F7] bg-white/70 px-3.5 py-3 backdrop-blur-sm">
              <p className="text-[11px] font-semibold text-[#8B95A1]">{s.label}</p>
              <p className="mt-1 break-keep text-[14px] font-bold text-[#0B1227]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* 기업 반응 — 나에게 온 인터뷰 제안·진행(Outcome 역류) */}
        {p.companyActivity?.length ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#4E5968]">{t("기업 반응", "Company activity", "企业反应", "Phản ứng doanh nghiệp", "企業の反応", "Aktivitas perusahaan")}</p>
            <div className="flex flex-col gap-1.5">
              {p.companyActivity.slice(0, 5).map((a, i) => {
                const m = activityMeta(a.status);
                return (
                  <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-[#EDF1F7] bg-white/70 px-3.5 py-2.5">
                    <span className="truncate text-[13px] font-semibold text-[#191F28]">{a.org ?? t("어느 기업", "A company", "某企业", "Một công ty", "ある企業", "Sebuah perusahaan")}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ background: m.bg, color: m.ink }}>{m.label}</span>
                      <span className="text-[11px] text-[#B0B8C1]">{a.at.slice(5, 10)}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* 기업 피드백 — 인터뷰 후 기업이 남긴 코멘트(비공개) */}
        {p.companyFeedback?.length ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#4E5968]">{t("기업 피드백", "Employer feedback", "企业反馈", "Phản hồi từ NTD", "企業フィードバック", "Umpan balik perusahaan")}</p>
            <div className="flex flex-col gap-2">
              {p.companyFeedback.slice(0, 3).map((f, i) => (
                <div key={i} className="rounded-2xl border border-[#EDF1F7] bg-white/70 p-3.5">
                  <p className="break-keep text-[13px] leading-relaxed text-[#4E5968]">{f.comment}</p>
                  <p className="mt-1.5 text-[11px] font-semibold text-[#8B95A1]">{f.org ?? t("기업", "A company", "企业", "Công ty", "企業", "Perusahaan")} · {f.at.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 다음 액션 — 각 점수를 행동으로 연결 */}
        {p.nextActions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[12px] font-bold text-[#4E5968]">{t("점수를 올리는 다음 액션", "Next actions to level up", "提升分数的下一步", "Hành động tiếp theo", "スコアを上げる次の行動", "Langkah berikutnya")}</p>
            <div className="flex flex-col gap-2">
              {p.nextActions.map((a) => (
                <Link
                  key={a.key}
                  href={a.href}
                  className="group flex items-center justify-between gap-3 rounded-2xl border border-[#EDF1F7] bg-white px-4 py-3 transition hover:border-[#0B46E8]/40 hover:shadow-[0_6px_20px_-10px_rgba(11,70,232,0.3)]"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-[#0B1227]">{a.label}</p>
                    <p className="truncate text-[12px] text-[#8B95A1]">{a.reason}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#C4CAD2] transition group-hover:translate-x-0.5 group-hover:text-[#0B46E8]" weight="bold" aria-hidden />
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl bg-[#EAF6EF] px-4 py-3 text-[13px] font-bold text-[#0F8A52]">
            <CheckCircle size={17} weight="fill" aria-hidden />
            {t("검증 기준을 모두 충족했어요. 기업에 추천될 준비 완료!", "You meet all verification criteria — ready to be shown to companies!", "已满足所有验证标准，可推荐给企业！", "Đã đạt mọi tiêu chí xác minh!", "検証基準をすべて満たしました！", "Semua kriteria verifikasi terpenuhi!")}
          </div>
        )}
      </div>
    </section>
  );
}
