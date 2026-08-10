"use client";

import Link from "next/link";
import { useState } from "react";
import { LAUNCH, type Mission, type MissionStatus, type Step } from "../../lib/launch/data";
import { useLaunchT } from "../../lib/launch/i18n";
import { useStepActionLabel } from "../../lib/launch/data-i18n";

// 모바일 우선 컨테이너 — 최대 폭 좁게, 카드형 레이아웃.
export function LaunchContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[480px] px-5 ${className}`}>{children}</div>;
}

export function Card({ children, className = "", onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-[#EEF1F5] bg-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.04),0_8px_24px_-12px_rgba(17,24,39,0.12)] ${onClick ? "cursor-pointer transition hover:border-[#0B46E8]/30" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Pill({ children, tone = "blue" }: { children: React.ReactNode; tone?: "blue" | "lime" | "grey" | "amber" | "green" }) {
  const cls: Record<string, string> = {
    blue: "bg-[#EDF1FD] text-[#0B46E8]",
    lime: "bg-[#EAFFD1] text-[#3A6B00]",
    grey: "bg-[#F2F4F6] text-[#4E5968]",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700"
  };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${cls[tone]}`}>{children}</span>;
}

// 진행률 바 — 라임 포인트.
export function ProgressBar({ value, height = 10 }: { value: number; height?: number }) {
  return (
    <div className="w-full overflow-hidden rounded-full bg-[#F2F4F6]" style={{ height }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: LAUNCH.blue }} />
    </div>
  );
}

// 체크리스트 — 로컬 토글(MVP).
export function Checklist({ items }: { items: Mission[] }) {
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(items.map((m) => [m.id, Boolean(m.done)])));
  return (
    <ul className="space-y-2">
      {items.map((m) => {
        const checked = state[m.id];
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setState((s) => ({ ...s, [m.id]: !s[m.id] }))}
              className="flex w-full items-center gap-3 rounded-xl border border-[#EEF1F5] bg-white px-3.5 py-3 text-left transition hover:bg-[#FAFBFC]"
            >
              <span
                className={`flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 text-[12px] font-black ${checked ? "border-[#0B46E8] bg-[#0B46E8] text-white" : "border-[#C9CDD2] text-transparent"}`}
              >
                ✓
              </span>
              <span className={`text-[14px] ${checked ? "text-[#8B95A1] line-through" : "font-medium text-[#191F28]"}`}>{m.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// 주차별 "스텝별 해야 할 일" — 번호 + 연결선 스테퍼. 완료는 로컬 토글(MVP).
export function Stepper({ steps }: { steps: Step[] }) {
  const t = useLaunchT();
  const actionLabel = useStepActionLabel();
  const [state, setState] = useState<Record<string, boolean>>(() => Object.fromEntries(steps.map((s) => [s.id, Boolean(s.done)])));
  return (
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = state[s.id];
        const last = i === steps.length - 1;
        return (
          <li key={s.id} className="flex gap-4">
            {/* 번호/체크 + 연결선 */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => setState((prev) => ({ ...prev, [s.id]: !prev[s.id] }))}
                aria-label={done
                  ? t("완료 취소", "Mark as incomplete", "取消完成", "Bỏ đánh dấu hoàn thành", "完了を取り消す", "Batalkan selesai")
                  : t("완료로 표시", "Mark as done", "标记为完成", "Đánh dấu hoàn thành", "完了にする", "Tandai selesai")}
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-black shadow-sm transition ${
                  done ? "bg-[#0B46E8] text-white" : "border-2 border-[#D7DCE3] bg-white text-[#4E5968] hover:border-[#0B46E8] hover:text-[#0B46E8]"
                }`}
              >
                {done ? "✓" : i + 1}
              </button>
              {!last ? <span className="mt-1.5 w-[2px] flex-1 rounded bg-[#E5E8EB]" /> : null}
            </div>
            {/* 내용 */}
            <div className={`min-w-0 flex-1 ${last ? "pb-0.5" : "pb-7"}`}>
              <p className={`text-[15.5px] font-bold leading-snug tracking-[-0.01em] md:text-[16px] ${done ? "text-[#B0B8C1] line-through" : "text-[#191F28]"}`}>{s.title}</p>
              <p className={`mt-1.5 break-keep text-[13.5px] leading-[1.7] ${done ? "text-[#B0B8C1]" : "text-[#4E5968]"}`}>
                {s.desc
                  .split(/(?<=\.)\s+/)
                  .filter(Boolean)
                  .map((line, li) => (
                    <span key={li} className="block">
                      {line}
                    </span>
                  ))}
              </p>
              {s.action ? (
                <Link
                  href={s.action.href}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#EDF1FD] px-3.5 py-2 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]"
                >
                  {actionLabel(s.action.label)} <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function LaunchButton({
  children,
  href,
  onClick,
  variant = "primary",
  full = false,
  type = "button"
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "lime" | "outline";
  full?: boolean;
  type?: "button" | "submit";
}) {
  const base = `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold transition ${full ? "w-full" : ""}`;
  const styles: Record<string, string> = {
    primary: "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]",
    lime: "bg-[#B7FF5A] text-[#111111] hover:brightness-105",
    outline: "border border-[#D7DCE3] bg-white text-[#191F28] hover:border-[#0B46E8]/40"
  };
  const cls = `${base} ${styles[variant]}`;
  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return <button type={type} onClick={onClick} className={cls}>{children}</button>;
}

// 과제 제출 영역(MVP — 로컬 상태). 링크/메모 입력 후 제출 → 제출됨 상태 표시.
export function SubmissionBox({ label, initialStatus }: { label: string; initialStatus: "todo" | "submitted" | "reviewed" }) {
  const t = useLaunchT();
  const [status, setStatus] = useState(initialStatus);
  const [value, setValue] = useState("");
  if (status === "reviewed") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-[13.5px] font-semibold text-emerald-700">
        ✓ {t("제출 완료 · 피드백까지 받았어요", "Submitted · Feedback received", "已提交 · 已收到反馈", "Đã nộp · Đã nhận phản hồi", "提出完了 · フィードバックも受け取りました", "Terkirim · Umpan balik diterima")}
      </div>
    );
  }
  if (status === "submitted") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[#CFE0FF] bg-[#EDF1FD] px-4 py-3.5">
        <span className="text-[13.5px] font-semibold text-[#0B46E8]">✓ {t("제출 완료 · 피드백 대기 중", "Submitted · Awaiting feedback", "已提交 · 等待反馈中", "Đã nộp · Đang chờ phản hồi", "提出完了 · フィードバック待ち", "Terkirim · Menunggu umpan balik")}</span>
        <button type="button" onClick={() => setStatus("todo")} className="text-[12px] font-semibold text-[#8B95A1] underline">
          {t("다시 제출", "Resubmit", "重新提交", "Nộp lại", "再提出", "Kirim ulang")}
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-2.5">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={label}
        className="w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none"
      />
      <LaunchButton variant="primary" full onClick={() => setStatus("submitted")}>
        {t("과제 제출하기", "Submit assignment", "提交作业", "Nộp bài tập", "課題を提出する", "Kirim tugas")}
      </LaunchButton>
    </div>
  );
}

// 과제 "제출" — 학생이 수동 제출하는 게 아니라, resume-maker·모의면접 등
// aply.global 활동 결과가 자동으로 수집·반영되는 상태를 보여준다.
export function AutoSubmitStatus({ label, status, source }: { label: string; status: MissionStatus; source: string }) {
  const t = useLaunchT();
  const done = status !== "todo";
  return (
    <div
      className={`rounded-2xl border p-4 md:p-5 ${
        done ? "border-emerald-200 bg-emerald-50/50" : "border-[#EEF1F5] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.04)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl text-[18px] ${done ? "bg-emerald-100" : "bg-[#EDF1FD]"}`}>
          {done ? "✓" : "🪄"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[14.5px] font-bold text-[#191F28]">{label}</p>
            {done
              ? <Pill tone="green">{t("자동 제출됨", "Auto-submitted", "已自动提交", "Đã tự động nộp", "自動提出済み", "Terkirim otomatis")}</Pill>
              : <Pill tone="grey">{t("활동 시 자동 반영", "Applied automatically on activity", "活动时自动应用", "Tự động cập nhật khi hoạt động", "活動時に自動反映", "Otomatis saat beraktivitas")}</Pill>}
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[#4E5968]">
            {done
              ? t(
                  `${source}에서 자동으로 담겨 제출됐어요. 따로 제출하지 않아도 괜찮아요 👍`,
                  `It was automatically collected and submitted from ${source}. No need to submit separately 👍`,
                  `已从 ${source} 自动收集并提交，无需另行提交 👍`,
                  `Đã được tự động thu thập và nộp từ ${source}. Bạn không cần nộp riêng 👍`,
                  `${source} から自動でまとめて提出されました。別途提出しなくても大丈夫です 👍`,
                  `Sudah otomatis dikumpulkan dan dikirim dari ${source}. Tidak perlu mengirim terpisah 👍`
                )
              : t(
                  `${source}을(를) 마치면 자동으로 제출돼요. 번거로운 제출 절차가 없으니 활동에만 집중하면 돼요.`,
                  `Once you finish ${source}, it's submitted automatically. No tedious submission steps — just focus on the activity.`,
                  `完成 ${source} 后会自动提交。没有繁琐的提交步骤，专注活动即可。`,
                  `Khi bạn hoàn thành ${source}, nó sẽ được nộp tự động. Không có bước nộp rườm rà, chỉ cần tập trung vào hoạt động.`,
                  `${source} を終えると自動で提出されます。面倒な提出手続きがないので、活動に集中すれば大丈夫です。`,
                  `Setelah Anda menyelesaikan ${source}, akan dikirim otomatis. Tanpa langkah pengiriman merepotkan, cukup fokus pada aktivitas.`
                )}
          </p>
        </div>
      </div>
    </div>
  );
}

// 섹션 제목 — 좌측 라임 악센트 바 + 큰 제목으로 위계를 명확히.
export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227] md:text-[19px]">{children}</h2>
      {sub ? <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{sub}</p> : null}
    </div>
  );
}

// 상단 브랜드 바(런치 전용).
export function LaunchTopBar({ back }: { back?: { href: string; label: string } }) {
  const t = useLaunchT();
  return (
    <header className="sticky top-0 z-30 border-b border-[#EEF1F5] bg-white/90 backdrop-blur">
      <LaunchContainer className="flex h-14 items-center justify-between">
        {back ? (
          <Link href={back.href} className="text-[13px] font-semibold text-[#8B95A1] hover:text-[#191F28]">
            ← {back.label}
          </Link>
        ) : (
          <Link href="/career-launch" className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rotate-45 rounded-[2px]" style={{ background: LAUNCH.blue }} />
            <span className="text-[14px] font-extrabold text-[#0B1227]">Career Launch</span>
          </Link>
        )}
        <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#0B46E8]">{t("대시보드", "Dashboard", "仪表盘", "Bảng điều khiển", "ダッシュボード", "Dasbor")}</Link>
      </LaunchContainer>
    </header>
  );
}
