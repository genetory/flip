"use client";

// 공개 Talent Passport — 기업 제출/공유용(무인증). 검증·역량 요약 + 공유 유도.
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, NotePencil, QrCode, ShareNetwork, ShieldCheck, X } from "@phosphor-icons/react";
import { fetchSharedPassport, type SharedPassport, type PassportTier } from "../../lib/launch/progress-client";

const TIER: Record<PassportTier, { label: string; ring: string; bg: string; ink: string }> = {
  preparing: { label: "준비 중", ring: "#C9CDD2", bg: "#F2F4F6", ink: "#8B95A1" },
  bronze: { label: "Verified Bronze", ring: "#C08457", bg: "#F6ECE3", ink: "#A96A3E" },
  silver: { label: "Verified Silver", ring: "#8B95A1", bg: "#EEF1F5", ink: "#5A6472" },
  gold: { label: "Verified Gold", ring: "#E0A500", bg: "#FBF2D6", ink: "#A97B00" }
};

const GAUGE_R = 49;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1">
      <span className="text-[19px] font-black leading-none tabular-nums text-[#111826]">{value}</span>
      <span className="text-[11px] font-semibold text-[#8B95A1]">{label}</span>
    </div>
  );
}

export function SharedPassportView({ token }: { token: string }) {
  const [p, setP] = useState<SharedPassport | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    let alive = true;
    void fetchSharedPassport(token).then((x) => {
      if (!alive) return;
      setP(x);
      setStatus(x ? "ready" : "notfound");
    });
    return () => {
      alive = false;
    };
  }, [token]);

  const shareUrl = typeof window !== "undefined" ? window.location.href : `/p/${token}`;

  // 핵심 강점 — 대표 경험의 성과 문장에서 추린다.
  const strengths = Array.from(new Set((p?.highlights ?? []).flatMap((h) => h.bullets ?? []).map((b) => (b ?? "").trim()).filter((b) => b.length > 6))).slice(0, 3);
  // 준비 상태 — 약점을 노출하지 않고, 얼마나 준비됐는지(느낌)를 긍정적으로 전한다.
  const bd = p?.breakdown;
  const dims = bd
    ? [
        { label: "뚜렷한 목표 방향", v: bd.direction || 0 },
        { label: "탄탄한 이력서", v: bd.resume || 0 },
        { label: "설득력 있는 자소서", v: bd.cover || 0 },
        { label: "면접 실전 준비", v: bd.interview || 0 },
        { label: "풍부한 경험", v: bd.experience || 0 }
      ]
    : [];
  // 강한 영역만 위에서부터 최대 3개(약한 영역은 감춰서 인상을 좋게).
  const topAreas = dims.filter((d) => d.v > 0).sort((a, b) => b.v - a.v).slice(0, 3).map((d) => d.label);
  const r = p?.readiness ?? 0;
  const readyPhrase =
    r >= 80
      ? { h: "채용에 바로 투입될 만큼 준비됐어요", s: "서류부터 면접까지 실전 수준으로 마쳤어요" }
      : r >= 60
        ? { h: "실전 지원 단계까지 준비를 마쳤어요", s: "핵심 서류와 면접 준비가 탄탄해요" }
        : r >= 40
          ? { h: "핵심 준비를 갖춘 성장형 지원자예요", s: "방향을 잡고 꾸준히 채워가고 있어요" }
          : { h: "커리어 방향을 잡아가는 단계예요", s: "기초부터 차근차근 준비하고 있어요" };
  const verifiedLabel = p?.verifiedAt ? new Date(p.verifiedAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long" }) : null;

  async function openQr() {
    setQrOpen(true);
    if (qr) return;
    try {
      const QR = (await import("qrcode")).default;
      const url = await QR.toDataURL(shareUrl, { margin: 1, width: 320, color: { dark: "#0B1227", light: "#FFFFFF" } });
      setQr(url);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    const title = p?.name ? `${p.name} · ${TIER[p.tier].label}` : "APLY Talent Passport";
    const text = `${title} · 취업 준비도 ${p?.readiness ?? ""} — APLY로 검증된 인재 프로필`;
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        /* 취소 → 링크 복사로 폴백 */
      }
    }
    void copyLink();
  }

  async function copyLink() {
    try {
      await navigator.clipboard?.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F8FB] px-4 py-10">
      <style>{`@media print { body { background: #ffffff !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 12mm; } .print\\:hidden { display: none !important; } }`}</style>
      <div className="mx-auto w-full max-w-[400px]">
        {status === "loading" ? (
          <p className="py-20 text-center text-[13px] text-[#8B95A1]">불러오는 중…</p>
        ) : status === "notfound" || !p ? (
          <div className="rounded-3xl border border-[#EEF1F5] bg-white p-8 text-center">
            <p className="text-[15px] font-bold text-[#191F28]">공유된 프로필을 찾을 수 없어요</p>
            <p className="mt-1.5 text-[13px] text-[#8B95A1]">링크가 만료되었거나 잘못된 주소일 수 있어요.</p>
            <Link href="/career-launch" className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
              내 커리어 패스포트 만들기
            </Link>
          </div>
        ) : (
          <>
            {/* 상단 액션 — 최소 */}
            <div className="mb-3 flex items-center justify-end gap-1.5 print:hidden">
              <button
                type="button"
                onClick={nativeShare}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#0B1227] px-3.5 py-2 text-[12.5px] font-bold text-white transition hover:bg-black"
              >
                <ShareNetwork className="h-4 w-4" weight="bold" aria-hidden /> 공유하기
              </button>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E5E8EC] bg-white px-3.5 py-2 text-[12.5px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
              >
                {copied ? "복사됨!" : "링크 복사"}
              </button>
            </div>

            {/* 메인 카드 — 심플 프로필 */}
            <div className="overflow-hidden rounded-[26px] bg-white p-2.5 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.4)] ring-1 ring-black/[0.06]">
              {/* 커버 */}
              <div className="relative h-[150px] overflow-hidden rounded-[19px]" style={p.background ? undefined : { background: "linear-gradient(150deg,#EAF0F8 0%,#E3EAF4 52%,#DBE6F1 100%)" }}>
                {p.background ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.background} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
                ) : (
                  <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 90% at 12% 8%, rgba(255,255,255,0.75), transparent 55%)" }} aria-hidden />
                )}
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11.5px] font-bold text-[#191F28] shadow-sm backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full" style={{ background: TIER[p.tier].ring }} aria-hidden />
                  {p.verified ? "✓ " : ""}{TIER[p.tier].label}
                </span>
              </div>

              <div className="px-5 pb-6">
                {/* 아바타 + 준비도 게이지 */}
                <div className="relative mx-auto -mt-[52px] h-[104px] w-[104px]">
                  <svg viewBox="0 0 104 104" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
                    <defs>
                      <linearGradient id="pp-gauge" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#3182F6" />
                        <stop offset="55%" stopColor="#0D9488" />
                        <stop offset="100%" stopColor="#22C55E" />
                      </linearGradient>
                    </defs>
                    <circle cx="52" cy="52" r={GAUGE_R} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="4" />
                    <circle cx="52" cy="52" r={GAUGE_R} fill="none" stroke="url(#pp-gauge)" strokeWidth="4" strokeLinecap="round" strokeDasharray={GAUGE_C} strokeDashoffset={GAUGE_C * (1 - Math.max(0, Math.min(100, p.readiness || 0)) / 100)} />
                  </svg>
                  <div className="absolute inset-[8px] overflow-hidden rounded-full bg-[#EEF1F5] ring-[5px] ring-white">
                    {p.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.photo} alt={p.name || ""} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[34px] font-black text-[#0B46E8]">{(p.name?.trim()?.charAt(0) || "A").toUpperCase()}</span>
                    )}
                  </div>
                </div>

                {/* 이름 · 소개 */}
                <h1 className="mt-4 break-keep text-center text-[26px] font-black leading-[1.1] tracking-[-0.035em] text-[#111826]">{p.name || "익명 인재"}</h1>
                {p.headline || p.pitch ? (
                  <p className="mx-auto mt-2 max-w-[21rem] break-keep text-center text-[14.5px] leading-[1.6] text-[#4E5968]">{p.headline || p.pitch}</p>
                ) : null}
                {p.targetJobs && p.targetJobs.length > 0 ? (
                  <p className="mt-3 break-keep text-center text-[12.5px] font-bold tracking-[-0.01em] text-[#0B46E8]">{p.targetJobs.join(" · ")}</p>
                ) : null}

                {/* 스탯 */}
                <div className="mt-5 flex items-stretch rounded-2xl bg-[#F6F7F9] py-3.5">
                  <Stat value={p.readiness} label="준비도" />
                  <span className="my-1 w-px bg-[#E7E9ED]" aria-hidden />
                  <Stat value={p.experienceCount} label="경험" />
                  <span className="my-1 w-px bg-[#E7E9ED]" aria-hidden />
                  <Stat value={p.languages?.length ?? 0} label="어학" />
                </div>

                {/* 검증 라인 */}
                {p.verified && verifiedLabel ? (
                  <p className="mt-3.5 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#8B95A1]">
                    <ShieldCheck className="h-4 w-4 text-[#0A9B59]" weight="fill" aria-hidden />
                    APLY 검증 · {verifiedLabel}
                  </p>
                ) : null}

                {/* 준비 상태 — 얼마나 준비됐고 어떤 느낌인지 */}
                <div className="mt-5 rounded-2xl bg-[#EEF3FF] p-4">
                  <p className="text-[14px] font-black leading-[1.4] tracking-[-0.01em] text-[#0B2A66]">{readyPhrase.h}</p>
                  <p className="mt-1 break-keep text-[12.5px] leading-[1.5] text-[#4E5968]">{readyPhrase.s}</p>
                  {topAreas.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {topAreas.map((a, i) => (
                        <span key={i} className="rounded-full bg-white px-2.5 py-1 text-[11.5px] font-bold text-[#0B46E8] ring-1 ring-[#0B46E8]/15">{a}</span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* 핵심 강점 */}
                {strengths.length > 0 ? (
                  <div className="mt-5 border-t border-[#F0F1F4] pt-5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">핵심 강점</p>
                    <div className="mt-3 flex flex-col gap-2.5">
                      {strengths.map((s, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="mt-[9px] h-px w-4 shrink-0 bg-[#0B46E8]" aria-hidden />
                          <p className="break-keep text-[13.5px] leading-[1.55] text-[#333D4B]">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 대표 경험 */}
                {p.highlights && p.highlights.length > 0 ? (
                  <div className="mt-5 border-t border-[#F0F1F4] pt-5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">대표 경험</p>
                    <div className="mt-1.5 divide-y divide-[#F0F1F4]">
                      {p.highlights.slice(0, 3).map((h, i) => (
                        <div key={i} className="flex items-baseline justify-between gap-3 py-2.5">
                          <p className="min-w-0 break-keep text-[13.5px] font-bold text-[#191F28]">{h.head}</p>
                          {h.period ? <p className="shrink-0 text-[11.5px] font-semibold tabular-nums text-[#A8ADB8]">{h.period}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 보유 스킬 */}
                {p.skills && p.skills.length > 0 ? (
                  <div className="mt-5 border-t border-[#F0F1F4] pt-5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">보유 스킬</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.skills.slice(0, 12).map((s, i) => (
                        <span key={i} className="rounded-lg bg-[#F1F3F5] px-2.5 py-1 text-[12px] font-semibold text-[#4E5968]">{s}</span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 문서 · QR — 자세한 내용은 링크/QR로 */}
                <div className="mt-5 flex items-stretch overflow-hidden rounded-2xl border border-[#EEF0F3]">
                  {p.hasResume ? (
                    <Link href={`/p/${token}/resume`} target="_blank" rel="noopener noreferrer" className="group flex flex-1 flex-col items-center gap-1.5 py-3.5 transition hover:bg-[#F6F8FF]">
                      <FileText className="h-5 w-5 text-[#4E5968] transition group-hover:text-[#0B46E8]" aria-hidden />
                      <span className="text-[11.5px] font-bold text-[#4E5968] transition group-hover:text-[#0B46E8]">이력서</span>
                    </Link>
                  ) : null}
                  {p.hasResume && p.hasCover ? <span className="w-px bg-[#EEF0F3]" aria-hidden /> : null}
                  {p.hasCover ? (
                    <Link href={`/p/${token}/cover`} target="_blank" rel="noopener noreferrer" className="group flex flex-1 flex-col items-center gap-1.5 py-3.5 transition hover:bg-[#F6F8FF]">
                      <NotePencil className="h-5 w-5 text-[#4E5968] transition group-hover:text-[#0B46E8]" aria-hidden />
                      <span className="text-[11.5px] font-bold text-[#4E5968] transition group-hover:text-[#0B46E8]">자기소개서</span>
                    </Link>
                  ) : null}
                  {p.hasResume || p.hasCover ? <span className="w-px bg-[#EEF0F3]" aria-hidden /> : null}
                  <button type="button" onClick={openQr} className="group flex flex-1 flex-col items-center gap-1.5 py-3.5 transition hover:bg-[#F6F8FF] print:hidden">
                    <QrCode className="h-5 w-5 text-[#4E5968] transition group-hover:text-[#0B46E8]" aria-hidden />
                    <span className="text-[11.5px] font-bold text-[#4E5968] transition group-hover:text-[#0B46E8]">QR 코드</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 바이럴 CTA — 본 사람이 자기 패스포트를 만들게 */}
            <div className="mt-4 overflow-hidden rounded-3xl bg-[#0B1227] p-6 text-center text-white print:hidden">
              <p className="text-[15px] font-black tracking-[-0.02em]">나도 이런 커리어 카드 만들 수 있어요</p>
              <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-white/70">APLY Career Launch로 이력서·자소서·면접까지 준비하고, 검증된 인재 프로필을 무료로 받아보세요.</p>
              <Link href="/career-launch" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-[14px] font-bold text-[#0B1227] transition hover:bg-[#F5F8FF]">
                내 커리어 카드 만들기 →
              </Link>
            </div>

            <p className="mt-4 text-center text-[11.5px] text-[#B0B8C1] print:mt-2">APLY Career Launch로 검증된 인재 프로필이에요.</p>

            {/* QR 오버레이 */}
            {qrOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 print:hidden" onClick={() => setQrOpen(false)}>
                <div className="w-full max-w-[288px] rounded-3xl bg-white p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end">
                    <button type="button" onClick={() => setQrOpen(false)} aria-label="닫기" className="text-[#8B95A1] transition hover:text-[#191F28]">
                      <X className="h-5 w-5" weight="bold" aria-hidden />
                    </button>
                  </div>
                  {qr ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={qr} alt="프로필 QR 코드" className="mx-auto h-52 w-52" />
                  ) : (
                    <div className="mx-auto flex h-52 w-52 items-center justify-center text-[13px] text-[#8B95A1]">생성 중…</div>
                  )}
                  <p className="mt-3 text-[13.5px] font-bold text-[#191F28]">스캔해서 이 프로필 열기</p>
                  <p className="mt-1 text-[12px] text-[#8B95A1]">이력서·자소서도 여기서 확인할 수 있어요</p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
