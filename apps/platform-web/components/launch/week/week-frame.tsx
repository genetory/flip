"use client";

// UX Phase 4 — 공통 주차 프레임(모든 Week 일관 구조). 기능 나열이 아니라 목표→미션→결과물→완료→다음.
// step id·route·완료 로직(step-status)은 유지하고 표현만 통일한다.
import Link from "next/link";
import { ArrowRight, CheckCircle, Circle, Lock, ArrowDown } from "@phosphor-icons/react";
import type { Step } from "../../../lib/launch/data";
import { isStepDone, type LaunchData } from "../../../lib/launch/step-status";
import { useLaunchT } from "../../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;

export type WeekFrameStatus = "not_started" | "available" | "in_progress" | "completed" | "locked";

// 주차/미션 상태 라벨 — 공유 한국어 상수(copy.ts) 대신 로컬 6개국어.
function weekStatusLabel(t: LaunchT, s: string): string {
  switch (s) {
    case "not_started": return t("아직 시작 전", "Not started", "尚未开始", "Chưa bắt đầu", "開始前", "Belum dimulai");
    case "available": return t("시작할 수 있어요", "Ready to start", "可以开始", "Sẵn sàng bắt đầu", "開始できます", "Siap dimulai");
    case "in_progress": return t("진행 중", "In progress", "进行中", "Đang thực hiện", "進行中", "Berlangsung");
    case "needs_confirmation": return t("확인이 필요해요", "Needs review", "需要确认", "Cần xem lại", "確認が必要", "Perlu ditinjau");
    case "completed": return t("완성했어요", "Completed", "已完成", "Đã hoàn thành", "完了しました", "Selesai");
    case "skipped": return t("이번에는 건너뛰었어요", "Skipped this time", "本次已跳过", "Đã bỏ qua lần này", "今回はスキップ", "Dilewati kali ini");
    case "blocked": return t("먼저 확인할 내용이 있어요", "Something to confirm first", "有需要先确认的内容", "Có điều cần xác nhận trước", "先に確認する内容があります", "Ada yang perlu dikonfirmasi dulu");
    default: return t("이전 결과물을 완성하면 열려요", "Opens when you finish the previous", "完成上一阶段成果后解锁", "Mở khi hoàn thành phần trước", "前の成果物を完成すると開きます", "Terbuka setelah bagian sebelumnya selesai");
  }
}

// ── Week Hero — 번호·주차명·핵심 질문·목표·상태·진행(N/M)·결과물·대표 CTA. ──
export function WeekHero({ week, title, subtitle, question, status, doneCount, totalCount, resultLabels, ctaLabel, ctaHref, onCta, image }: {
  week: number;
  title: string;
  subtitle: string;
  question: string;
  status: WeekFrameStatus;
  doneCount: number;
  totalCount: number;
  resultLabels: string[];
  ctaLabel: string;
  ctaHref?: string;
  onCta?: () => void;
  image?: string;
}) {
  const t = useLaunchT();
  const statusTone: Record<string, string> = {
    completed: "bg-[#E7F7EF] text-[#0A9B59]",
    in_progress: "bg-[#E8F3FF] text-[#1B64DA]",
    available: "bg-[#F2F4F6] text-[#4E5968]",
    not_started: "bg-[#F2F4F6] text-[#8B95A1]",
    locked: "bg-[#F2F4F6] text-[#B0B8C1]"
  };
  return (
    <div className="rounded-3xl border border-[#EEF1F5] bg-white p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#3182F6]">Week {week}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${statusTone[status]}`}>{weekStatusLabel(t, status)}</span>
          </div>
          <h1 className="cl-display mt-2.5">{title}</h1>
          <p className="cl-lead mt-2 max-w-[52ch]">{subtitle}</p>
        </div>
        {image ? <img src={image} alt="" className="hidden h-28 w-40 shrink-0 rounded-2xl object-cover sm:block" loading="lazy" /> : null}
      </div>

      {/* 핵심 질문 */}
      <div className="mt-5 rounded-2xl bg-[#F4F8FF] p-4">
        <p className="text-[11.5px] font-bold text-[#1B64DA]">{t("이번 주 핵심 질문", "This week's key question", "本周核心问题", "Câu hỏi chính tuần này", "今週の核心の質問", "Pertanyaan inti minggu ini")}</p>
        <p className="mt-1 break-keep text-[14.5px] font-semibold leading-relaxed text-[#191F28]">{question}</p>
      </div>

      {/* 결과물 */}
      <div className="mt-4">
        <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#8B95A1]">{t("이번 주 결과물", "This week's deliverables", "本周成果", "Kết quả tuần này", "今週の成果物", "Hasil minggu ini")}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {resultLabels.map((r) => (
            <span key={r} className="rounded-full bg-[#F2F4F6] px-2.5 py-1 text-[12px] font-medium text-[#4E5968]">
              {r}
            </span>
          ))}
        </div>
      </div>

      {/* 진행 N/M + CTA (퍼센트 단독 표시 금지) */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-[#191F28]">
            {t(`${totalCount}개 중 ${doneCount}개 완료`, `${doneCount} of ${totalCount} done`, `${totalCount} 项中完成 ${doneCount} 项`, `${doneCount}/${totalCount} hoàn thành`, `${totalCount}件中${doneCount}件完了`, `${doneCount} dari ${totalCount} selesai`)}
          </p>
          <div className="mt-1.5 h-1.5 w-40 overflow-hidden rounded-full bg-[#F2F4F6]">
            <div className="h-full rounded-full bg-[#3182F6]" style={{ width: `${totalCount ? Math.round((doneCount / totalCount) * 100) : 0}%` }} />
          </div>
        </div>
        {status !== "locked" ? (
          ctaHref ? (
            <Link href={ctaHref} onClick={onCta} className="inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2.5 text-[14px] font-bold text-white transition">
              {ctaLabel} <ArrowRight size={15} weight="bold" />
            </Link>
          ) : (
            <button onClick={onCta} className="inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-4 py-2.5 text-[14px] font-bold text-white transition">
              {ctaLabel} <ArrowRight size={15} weight="bold" />
            </button>
          )
        ) : null}
      </div>
    </div>
  );
}

// ── 완료 조건 — 각 미션 완료 상태(step-status 재사용). 미완료는 행동으로 연결. ──
export function WeekCompletionCriteria({ steps, data, onView }: { steps: Step[]; data: LaunchData; onView?: () => void }) {
  const t = useLaunchT();
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5" onMouseEnter={onView}>
      <p className="text-[13px] font-bold text-[#191F28]">{t("이번 주 완료 조건", "This week's completion criteria", "本周完成条件", "Điều kiện hoàn thành tuần này", "今週の完了条件", "Kriteria penyelesaian minggu ini")}</p>
      <ul className="mt-2.5 flex flex-col gap-1.5">
        {steps.map((s) => {
          const done = isStepDone(s.id, data);
          return (
            <li key={s.id} className="flex items-center gap-2 text-[13.5px]">
              {done ? <CheckCircle size={18} weight="fill" className="flex-none text-[#0A9B59]" /> : <Circle size={18} className="flex-none text-[#C9CDD2]" />}
              <span className={done ? "text-[#8B95A1] line-through" : "text-[#191F28]"}>{s.title}</span>
              {!done && s.action?.href ? (
                <Link href={s.action.href} className="ml-auto flex-none text-[12px] font-semibold text-[#1B64DA]">
                  {t("하러 가기", "Go do it", "去完成", "Đi làm", "やりに行く", "Kerjakan")}
                </Link>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── 다음 주 연결/미리보기. 잠겨 있으면 해제 조건 안내. ──
export function NextWeekPreview({ week, teaser, unlocked, onClick }: { week: number; teaser: string; unlocked: boolean; onClick?: () => void }) {
  const t = useLaunchT();
  if (week >= 5) return null;
  const isFinal = week === 4;
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-[#FBFCFD] p-5">
      <div className="flex items-center gap-2 text-[#8B95A1]">
        <ArrowDown size={14} weight="bold" />
        <p className="text-[11.5px] font-bold uppercase tracking-[0.08em]">{isFinal ? t("프로그램 마무리", "Program wrap-up", "项目收尾", "Kết thúc chương trình", "プログラムの締め", "Penutup program") : t(`다음 · Week ${week + 1}`, `Next · Week ${week + 1}`, `下一步 · Week ${week + 1}`, `Tiếp · Week ${week + 1}`, `次 · Week ${week + 1}`, `Berikutnya · Week ${week + 1}`)}</p>
      </div>
      <p className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#191F28]">{teaser}</p>
      {!isFinal ? (
        unlocked ? (
          <Link href={`/career-launch/week/${week + 1}`} onClick={onClick} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-3.5 py-2 text-[13px] font-bold text-white">
            {t(`Week ${week + 1} 시작하기`, `Start Week ${week + 1}`, `开始 Week ${week + 1}`, `Bắt đầu Week ${week + 1}`, `Week ${week + 1}を始める`, `Mulai Week ${week + 1}`)} <ArrowRight size={14} weight="bold" />
          </Link>
        ) : (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#B0B8C1]">
            <Lock size={12} weight="fill" /> {t("이번 주 결과물을 완성하면 열려요", "Opens when you finish this week's deliverables", "完成本周成果后解锁", "Mở khi hoàn thành kết quả tuần này", "今週の成果物を完成すると開きます", "Terbuka setelah hasil minggu ini selesai")}
          </p>
        )
      ) : null}
    </div>
  );
}
