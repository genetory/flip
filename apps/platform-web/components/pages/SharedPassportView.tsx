"use client";

// 공개 Talent Passport — 기업 제출/공유용(무인증). 검증·역량 요약 + 공유 유도.
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchSharedPassport, type SharedPassport, type PassportTier } from "../../lib/launch/progress-client";

const TIER: Record<PassportTier, { label: string; ring: string; bg: string; ink: string }> = {
  preparing: { label: "준비 중", ring: "#C9CDD2", bg: "#F2F4F6", ink: "#8B95A1" },
  bronze: { label: "Verified Bronze", ring: "#C08457", bg: "#F6ECE3", ink: "#A96A3E" },
  silver: { label: "Verified Silver", ring: "#8B95A1", bg: "#EEF1F5", ink: "#5A6472" },
  gold: { label: "Verified Gold", ring: "#E0A500", bg: "#FBF2D6", ink: "#A97B00" }
};

function ringColor(v: number): string {
  return v >= 75 ? "#0A9B59" : v >= 50 ? "#0B46E8" : "#C77700";
}
function Ring({ value, size = 76, stroke = 7 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  const col = ringColor(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E4E7EC" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[19px] font-black leading-none tabular-nums" style={{ color: col }}>{value}</span>
      </div>
    </div>
  );
}

export function SharedPassportView({ token }: { token: string }) {
  const [p, setP] = useState<SharedPassport | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [copied, setCopied] = useState(false);

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
  const sharedStrengths = Array.from(new Set((p?.highlights ?? []).flatMap((h) => h.bullets ?? []).map((b) => (b ?? "").trim()).filter((b) => b.length > 6))).slice(0, 3);

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
      <div className="mx-auto w-full max-w-xl">
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">APLY Talent Passport</p>
              <div className="flex items-center gap-1.5 print:hidden">
                <button
                  type="button"
                  onClick={nativeShare}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0B46E8] px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  ↗ 공유하기
                </button>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE3F0] bg-white px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
                >
                  {copied ? "복사됨!" : "링크 복사"}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#DCE3F0] bg-white px-3 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:border-[#0B46E8]/40 hover:text-[#0B46E8]"
                >
                  🖨 PDF
                </button>
              </div>
            </div>
            <div className="overflow-hidden rounded-[26px] bg-white shadow-[0_28px_64px_-26px_rgba(11,18,39,0.5)] ring-1 ring-black/5">
              {/* 모션 오로라 히어로 */}
              <div className="cl-pp-hero overflow-hidden px-7 pb-7 pt-6 text-white md:px-9">
                {p.background ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.background} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover" aria-hidden />
                    <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(10,16,32,0.35), rgba(10,16,32,0.72))" }} aria-hidden />
                  </>
                ) : (
                  <>
                    <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1.2px)", backgroundSize: "15px 15px" }} aria-hidden />
                    <div className="cl-pp-shine" aria-hidden />
                  </>
                )}
                <div className="relative flex items-center gap-2">
                  <span className="text-[10.5px] font-black uppercase tracking-[0.24em] text-white/90">✈ Career Passport</span>
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-black text-white ring-1 ring-white/25 backdrop-blur-sm">{p.verified ? "✓ " : ""}{TIER[p.tier].label}</span>
                </div>
                <div className="relative mt-6 flex items-center gap-4">
                  {p.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.photo} alt={p.name || ""} className="h-[66px] w-[66px] shrink-0 rounded-2xl object-cover ring-1 ring-white/35" />
                  ) : (
                    <span className="flex h-[66px] w-[66px] shrink-0 items-center justify-center rounded-2xl bg-white/12 text-[26px] font-black text-white ring-1 ring-white/35 backdrop-blur-sm">{(p.name?.trim()?.charAt(0) || "A").toUpperCase()}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="break-keep text-[25px] font-black leading-[1.08] tracking-[-0.035em] text-white md:text-[30px]">{p.name || "익명 인재"}</h1>
                    {p.target.role ? <p className="mt-1.5 break-keep text-[12px] font-bold uppercase tracking-[0.06em] text-[#AFC6FF]">{p.target.role}</p> : null}
                  </div>
                </div>
                {p.headline ? (
                  <div className="relative mt-6">
                    <p className="break-keep font-[Georgia,'Times_New_Roman',serif] text-[19px] italic leading-[1.45] text-white md:text-[22px]"><span className="mr-0.5 align-[-0.2em] text-[30px] not-italic text-white/60">“</span>{p.headline}<span className="not-italic text-white/60">”</span></p>
                    {p.subline ? <p className="mt-2.5 break-keep text-[12.5px] leading-[1.7] text-white/70">{p.subline}</p> : null}
                  </div>
                ) : p.pitch ? (
                  <p className="relative mt-6 break-keep text-[14px] font-medium leading-[1.7] text-white/85">{p.pitch}</p>
                ) : null}
              </div>

              {/* 바디 — 홈처럼 미니 카드 벤토 그리드 */}
              <div className="flex flex-wrap gap-3 px-5 py-5 md:px-6 md:py-6">
                {p.targetJobs && p.targetJobs.length > 0 ? (
                  <div className="grow basis-full min-w-[200px] rounded-2xl bg-[#F4F6F9] p-4 sm:basis-[44%]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8ADB8]">찾는 직무</p>
                    <p className="mt-2 break-keep text-[17px] font-black leading-[1.35] tracking-[-0.01em] text-[#0B1227]">{p.targetJobs.join(" · ")}</p>
                  </div>
                ) : null}

                {typeof p.readiness === "number" ? (
                  <div className="grow basis-[46%] min-w-[130px] flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#F4F6F9] p-4 sm:basis-[26%]">
                    <Ring value={p.readiness} />
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">취업 준비도</p>
                  </div>
                ) : null}

                {p.experienceCount ? (
                  <div className="grow basis-[46%] min-w-[110px] flex flex-col justify-center rounded-2xl bg-[#0E1526] p-4 text-white sm:basis-[22%]">
                    <p className="text-[30px] font-black leading-none tabular-nums">{p.experienceCount}</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">경험</p>
                  </div>
                ) : null}

                {p.languages && p.languages.length > 0 ? (
                  <div className="grow basis-[46%] min-w-[110px] flex flex-col justify-center rounded-2xl bg-[#F4F6F9] p-4 sm:basis-[22%]">
                    <p className="text-[26px] font-black leading-none tabular-nums text-[#0B1227]">{p.languages.length}</p>
                    <p className="mt-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#A8ADB8]">어학</p>
                  </div>
                ) : null}

                {sharedStrengths.length > 0 ? (
                  <div className="grow basis-full rounded-2xl bg-[#F4F6F9] p-4 md:p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8ADB8]">핵심 강점</p>
                    <div className="mt-3 flex flex-col gap-2.5">
                      {sharedStrengths.map((s, i) => (
                        <div key={i} className="flex gap-3">
                          <span className="mt-[10px] h-px w-4 shrink-0 bg-[#0B46E8]" aria-hidden />
                          <p className="break-keep text-[13.5px] leading-[1.6] text-[#333D4B]">{s}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {p.highlights && p.highlights.length > 0 ? (
                  <div className="grow basis-full min-w-[220px] rounded-2xl bg-[#F4F6F9] p-4 sm:basis-[47%]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8ADB8]">대표 경험</p>
                    <div className="mt-1.5 divide-y divide-[#E4E7EC]">
                      {p.highlights.map((h, i) => (
                        <div key={i} className="py-2.5">
                          <p className="break-keep text-[13.5px] font-bold text-[#191F28]">{h.head}</p>
                          {h.period ? <p className="mt-0.5 text-[11.5px] font-semibold tabular-nums text-[#A8ADB8]">{h.period}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 문서 — 절반 카드 */}
                {p.hasResume || p.hasCover ? (
                  <div className="grow basis-full min-w-[220px] rounded-2xl bg-[#F4F6F9] p-4 sm:basis-[47%]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A8ADB8]">내 문서</p>
                    <div className="mt-3 flex flex-col gap-2.5">
                      {p.hasResume ? (
                        <Link href={`/p/${token}/resume`} className="flex items-center justify-between gap-2 rounded-xl bg-[#0B46E8] px-4 py-3 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]"><span className="inline-flex items-center gap-1.5">📄 이력서 보기</span><span aria-hidden>→</span></Link>
                      ) : null}
                      {p.hasCover ? (
                        <Link href={`/p/${token}/cover`} className="flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-[13px] font-bold text-[#0B46E8] transition hover:bg-[#EDF1FD]"><span className="inline-flex items-center gap-1.5">✍ 자기소개서 보기</span><span aria-hidden>→</span></Link>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* 신뢰 스트립 */}
                <div className="basis-full mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#ECEEF1] pt-5 text-[12.5px] text-[#8B95A1]">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: TIER[p.tier].ring }} />취업 준비도 <b className="tabular-nums text-[#191F28]">{p.readiness}</b>/100</span>
                  <span>경험 <b className="text-[#191F28]">{p.experienceCount}</b>건</span>
                  {p.languages.length ? <span>언어 <b className="text-[#191F28]">{p.languages.map((l) => l.language).filter(Boolean).join(", ")}</b></span> : null}
                </div>
              </div>

              {/* MRZ 데코 */}
              <div className="overflow-hidden border-t border-dashed border-[#E5E8EB] px-7 py-3 md:px-9">
                <p className="truncate font-mono text-[10px] uppercase tracking-[0.26em] text-[#C4CAD2]">APLY&lt;CAREER&lt;LAUNCH&lt;PASSPORT&lt;&lt;&lt;&lt;&lt;&lt;VERIFIED&lt;{p.verified ? "Y" : "N"}</p>
              </div>
            </div>

            {/* 바이럴 CTA — 본 사람이 자기 패스포트를 만들게 */}
            <div className="mt-4 overflow-hidden rounded-3xl bg-[#0B1227] p-6 text-center text-white print:hidden">
              <p className="text-[15px] font-black tracking-[-0.02em]">나도 이런 커리어 패스포트 만들 수 있어요</p>
              <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-white/70">APLY Career Launch로 이력서·자소서·면접까지 준비하고, 검증된 인재 프로필을 무료로 받아보세요.</p>
              <Link href="/career-launch" className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-[14px] font-bold text-[#0B1227] transition hover:bg-[#F5F8FF]">
                내 패스포트 만들기 →
              </Link>
            </div>

            <p className="mt-4 text-center text-[11.5px] text-[#B0B8C1] print:mt-2">APLY Career Launch로 검증된 인재 프로필이에요.</p>
          </>
        )}
      </div>
    </main>
  );
}
