"use client";

// 이력서 / 자기소개서 진입 카드 — 홈·내 커리어 공용.
// 원형 완성도 프로그레스 + 상태 메시지.
import Link from "next/link";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useResumeDoc, resumeCompleteness } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { useBasicInfo } from "../../../lib/talent/basic-info";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

export function CareerFunnelCards({ showPreview = false }: { showPreview?: boolean }) {
  const t = usePlatformT();
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const name = useBasicInfo().realName?.trim() || t("나", "Me", "我", "Tôi", "私", "Saya");
  const resumePct = resumeCompleteness(resume);
  const coverPct = coverCompleteness(cover);

  return (
    <div className="grid grid-cols-2 gap-3">
      <FunnelCard
        label={t(`${name}님의 이력서`, `${name}'s resume`, `${name} 的简历`, `Hồ sơ của ${name}`, `${name}さんの履歴書`, `Resume ${name}`)}
        pct={resumePct}
        message={resumeMessage(t, resumePct)}
        href={talentAppRoutes.resume}
        started={resume !== null}
        previewHref={showPreview && resume ? talentAppRoutes.resumePreview : undefined}
      />
      <FunnelCard
        label={t(`${name}님의 자기소개서`, `${name}'s cover letter`, `${name} 的自我介绍`, `Thư giới thiệu của ${name}`, `${name}さんの自己紹介書`, `Surat lamaran ${name}`)}
        pct={coverPct}
        message={coverMessage(t, coverPct)}
        href={talentAppRoutes.cover}
        started={cover !== null}
        previewHref={showPreview && cover ? talentAppRoutes.coverPreview : undefined}
      />
    </div>
  );
}

function resumeMessage(t: PlatformT, pct: number): string {
  if (pct === 0) return t("이력서를 만들어보세요", "Start your resume", "开始制作简历", "Bắt đầu hồ sơ", "履歴書を作りましょう", "Mulai resume");
  if (pct < 40) return t("이제 시작했어요", "Just getting started", "刚刚开始", "Vừa bắt đầu", "始めたばかり", "Baru mulai");
  if (pct < 70) return t("절반쯤 왔어요", "About halfway", "已完成一半", "Được nửa chặng", "半分ほど", "Setengah jalan");
  if (pct < 100) return t("거의 다 됐어요", "Almost there", "快完成了", "Sắp xong", "あと少し", "Hampir selesai");
  return t("이력서가 탄탄해요", "Your resume looks solid", "简历很扎实", "Hồ sơ chắc chắn", "履歴書は充実", "Resume solid");
}

function coverMessage(t: PlatformT, pct: number): string {
  if (pct === 0) return t("자기소개서를 시작해보세요", "Start your cover letter", "开始写自我介绍", "Bắt đầu thư giới thiệu", "自己紹介書を始めましょう", "Mulai surat lamaran");
  if (pct < 40) return t("문항을 채우는 중이에요", "Filling in prompts", "正在填写问题", "Đang trả lời câu hỏi", "設問を記入中", "Mengisi pertanyaan");
  if (pct < 70) return t("절반쯤 작성했어요", "About halfway", "已写一半", "Được nửa chặng", "半分ほど作成", "Setengah jalan");
  if (pct < 100) return t("거의 완성이에요", "Almost done", "快完成了", "Sắp hoàn thành", "ほぼ完成", "Hampir selesai");
  return t("자기소개서 완성!", "Cover letter complete!", "自我介绍完成！", "Hoàn thành!", "自己紹介書完成！", "Surat lamaran selesai!");
}

function FunnelCard({ label, pct, message, href, started, previewHref }: { label: string; pct: number; message: string; href: string; started: boolean; previewHref?: string }) {
  const t = usePlatformT();
  const shell = started
    ? "border border-[#EEF1F5] bg-white hover:border-[#0B46E8]/40 hover:shadow-[0_4px_16px_rgba(11,18,39,0.05)]"
    : "border border-dashed border-[#DCE3F0] bg-transparent hover:border-[#0B46E8]/50";
  return (
    <div className={`flex flex-col rounded-2xl p-5 transition ${shell}`}>
      <Link href={href} className="block">
        <ProgressRing pct={pct} muted={!started} />
        <p className="mt-3 text-[15px] font-bold text-[#191F28]">{label}</p>
      </Link>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <p className="break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{message}</p>
        {previewHref ? (
          <Link href={previewHref} className="shrink-0 rounded-lg bg-[#F2F4F6] px-3.5 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]">{t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}</Link>
        ) : null}
      </div>
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
      {pct >= 100 ? (
        <path d="M18.5 26.5 l4.5 4.5 l10 -11" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <text x="26" y="26" textAnchor="middle" dominantBaseline="central" fontSize="10.5" fontWeight="800" fill="#0B1227">
          {pct}%
        </text>
      )}
    </svg>
  );
}
