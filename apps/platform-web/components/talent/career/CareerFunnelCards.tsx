"use client";

// 이력서 / 자기소개서 진입 카드 — 홈·내 커리어 공용.
// 원형 완성도 프로그레스 + 상태 메시지.
import Link from "next/link";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { useBasicInfo } from "../../../lib/talent/basic-info";

export function CareerFunnelCards({ showPreview = false }: { showPreview?: boolean }) {
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const name = useBasicInfo().realName?.trim() || "나";
  const resumePct = resumeCompleteness(resume);
  const coverPct = coverCompleteness(cover);

  return (
    <div className="grid grid-cols-2 gap-3">
      <FunnelCard
        label={`${name}님의 이력서`}
        pct={resumePct}
        message={resumeMessage(resumePct)}
        href={talentAppRoutes.resume}
        started={resume !== null}
        previewHref={showPreview && resume ? talentAppRoutes.resumePreview : undefined}
      />
      <FunnelCard
        label={`${name}님의 자기소개서`}
        pct={coverPct}
        message={coverMessage(coverPct)}
        href={talentAppRoutes.cover}
        started={cover !== null}
        previewHref={showPreview && cover ? talentAppRoutes.coverPreview : undefined}
      />
    </div>
  );
}

function resumeMessage(pct: number): string {
  if (pct === 0) return "이력서를 만들어보세요";
  if (pct < 40) return "이제 시작했어요";
  if (pct < 70) return "절반쯤 왔어요";
  if (pct < 100) return "거의 다 됐어요";
  return "이력서가 탄탄해요";
}

function coverMessage(pct: number): string {
  if (pct === 0) return "자기소개서를 시작해보세요";
  if (pct < 40) return "문항을 채우는 중이에요";
  if (pct < 70) return "절반쯤 작성했어요";
  if (pct < 100) return "거의 완성이에요";
  return "자기소개서 완성!";
}

function FunnelCard({ label, pct, message, href, started, previewHref }: { label: string; pct: number; message: string; href: string; started: boolean; previewHref?: string }) {
  const shell = started
    ? "border border-[#EEF1F5] bg-white hover:border-[#0B46E8]/40 hover:shadow-[0_4px_16px_rgba(11,18,39,0.05)]"
    : "border border-dashed border-[#DCE3F0] bg-transparent hover:border-[#0B46E8]/50";
  return (
    <div className={`flex flex-col gap-3 rounded-2xl p-5 transition ${shell}`}>
      <Link href={href} className="flex flex-col gap-3">
        <ProgressRing pct={pct} muted={!started} />
        <div>
          <p className="text-[15px] font-bold text-[#191F28]">{label}</p>
          <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{message}</p>
        </div>
      </Link>
      {previewHref ? (
        <Link
          href={previewHref}
          className="mt-1 flex items-center justify-center rounded-xl bg-[#F2F4F6] px-3 py-2 text-[12.5px] font-semibold text-[#4E5968] transition hover:bg-[#E5E8EB]"
        >
          미리보기
        </Link>
      ) : null}
    </div>
  );
}

function ProgressRing({ pct, muted }: { pct: number; muted?: boolean }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  const color = muted ? "#B0B8C1" : "#0B46E8";
  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="shrink-0" aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="#EDF1FD" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
      />
      <text x="26" y="26" textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="800" fill="#0B1227">
        {pct}%
      </text>
    </svg>
  );
}
