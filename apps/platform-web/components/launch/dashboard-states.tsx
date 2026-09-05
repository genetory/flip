"use client";

// UX Phase 2 — 대시보드 공통 상태 프리미티브(빈/오류/재개/섹션/스켈레톤).
// 모든 주요 영역이 로딩·빈·오류 상태를 일관되게 갖도록 표준화한다.
import type { ReactNode } from "react";
import { ArrowClockwise, ArrowRight } from "@phosphor-icons/react";
import { useLaunchT } from "../../lib/launch/i18n";

// 섹션 래퍼 — semantic heading + 여백 통일.
export function DashboardSection({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="cl-title">{title}</h2>
          {sub ? <p className="mt-0.5 cl-caption font-medium">{sub}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// 빈 상태 — 왜 비었는지 + 만들 수 있는 행동. 의미 없는 빈 그래프 금지.
export function EmptyState({ title, description, ctaLabel, onCta, href }: { title: string; description?: string; ctaLabel?: string; onCta?: () => void; href?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[#E5E8EB] bg-[#FBFCFD] px-4 py-6 text-center">
      <p className="text-[14px] font-semibold text-[#4E5968]">{title}</p>
      {description ? <p className="mt-1 text-[12.5px] text-[#8B95A1]">{description}</p> : null}
      {ctaLabel ? (
        href ? (
          <a href={href} className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#191F28] px-3.5 py-2 text-[13px] font-semibold text-white">
            {ctaLabel} <ArrowRight size={14} weight="bold" />
          </a>
        ) : (
          <button onClick={onCta} className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#191F28] px-3.5 py-2 text-[13px] font-semibold text-white">
            {ctaLabel} <ArrowRight size={14} weight="bold" />
          </button>
        )
      ) : null}
    </div>
  );
}

// 오류 상태 — 실패한 영역만 재시도. 저장 여부를 사실과 다르게 안내하지 않는다.
export function ErrorState({ onRetry, message }: { onRetry?: () => void; message?: string }) {
  const t = useLaunchT();
  return (
    <div role="alert" className="rounded-2xl border border-[#F2D2D2] bg-[#FEF6F6] px-4 py-5 text-center">
      <p className="text-[14px] font-semibold text-[#C0392B]">{message ?? t("진행 내용을 불러오지 못했어요.", "Couldn't load your progress.", "无法加载进度。", "Không tải được tiến độ.", "進行内容を読み込めませんでした。", "Gagal memuat progres.")}</p>
      <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t("작성한 내용은 저장되어 있어요. 잠시 후 다시 확인해 주세요.", "Your work is saved. Please check again in a moment.", "你填写的内容已保存，请稍后再查看。", "Nội dung đã lưu. Vui lòng kiểm tra lại sau.", "入力内容は保存されています。少し後にもう一度ご確認ください。", "Isianmu tersimpan. Silakan cek lagi sebentar lagi.")}</p>
      {onRetry ? (
        <button onClick={onRetry} className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#4E5968]">
          <ArrowClockwise size={14} weight="bold" /> {t("다시 불러오기", "Retry", "重新加载", "Tải lại", "再読み込み", "Muat ulang")}
        </button>
      ) : null}
    </div>
  );
}

// 재개 상태 — 정체 사용자에게 죄책감 없이, 저장돼 있음을 알리고 이어가게 한다.
export function ResumeState({ days, onCta, href }: { days: number | null; onCta?: () => void; href?: string }) {
  const t = useLaunchT();
  const cont = t("이어서 진행하기", "Continue", "继续进行", "Tiếp tục", "続けて進める", "Lanjutkan");
  return (
    <div className="rounded-2xl border border-[#DDE7FB] bg-[#F4F8FF] px-4 py-5">
      <p className="text-[14px] font-semibold text-[#191F28]">{t(`잠시 멈춰 있었네요${days ? ` (${days}일)` : ""} — 이어서 하면 돼요`, `You paused for a bit${days ? ` (${days} day${days > 1 ? "s" : ""})` : ""} — pick up anytime`, `稍作停顿${days ? `（${days}天）` : ""}——随时可以继续`, `Bạn đã tạm dừng${days ? ` (${days} ngày)` : ""} — tiếp tục bất cứ lúc nào`, `少し止まっていましたね${days ? `（${days}日）` : ""} — 続きからで大丈夫`, `Sempat berhenti${days ? ` (${days} hari)` : ""} — lanjutkan kapan saja`)}</p>
      <p className="mt-1 text-[12.5px] text-[#4E5968]">{t("이전에 작성한 내용은 모두 저장돼 있어요. 5분이면 다음 단계부터 이어갈 수 있어요.", "Everything you wrote is saved. In 5 minutes you can continue from the next step.", "之前填写的内容都已保存。5分钟即可从下一步继续。", "Mọi thứ bạn đã viết đều được lưu. Chỉ 5 phút để tiếp tục từ bước tiếp theo.", "以前の入力はすべて保存されています。5分あれば次のステップから続けられます。", "Semua yang kamu tulis tersimpan. Dalam 5 menit kamu bisa lanjut dari langkah berikutnya.")}</p>
      {href ? (
        <a href={href} className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#3182F6] px-3.5 py-2 text-[13px] font-semibold text-white">
          {cont} <ArrowRight size={14} weight="bold" />
        </a>
      ) : (
        <button onClick={onCta} className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[#3182F6] px-3.5 py-2 text-[13px] font-semibold text-white">
          {cont} <ArrowRight size={14} weight="bold" />
        </button>
      )}
    </div>
  );
}

// 카드 스켈레톤 — 전체 페이지 스피너 대신 카드 단위. 레이아웃 이동 최소화.
export function CardSkeleton({ height = 96 }: { height?: number }) {
  return <div className="animate-pulse rounded-2xl bg-[#EEF1F5]" style={{ height }} aria-hidden />;
}
