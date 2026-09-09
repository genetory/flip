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
              <div className="cl-pp-hero overflow-hidden px-6 pb-6 pt-5 text-white md:px-8">
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
                <div className="relative mt-5 flex items-center gap-4">
                  {p.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.photo} alt={p.name || ""} className="h-[62px] w-[62px] shrink-0 rounded-2xl object-cover ring-1 ring-white/35" />
                  ) : (
                    <span className="flex h-[62px] w-[62px] shrink-0 items-center justify-center rounded-2xl bg-white/12 text-[24px] font-black text-white ring-1 ring-white/35 backdrop-blur-sm">{(p.name?.trim()?.charAt(0) || "A").toUpperCase()}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <h1 className="break-keep text-[23px] font-black leading-[1.12] tracking-[-0.03em] text-white md:text-[27px]">{p.name || "익명 인재"}</h1>
                    {p.target.role ? <p className="mt-1 break-keep text-[13px] font-bold text-[#AFC6FF]">{p.target.role}</p> : null}
                  </div>
                </div>
                {p.headline ? (
                  <div className="relative mt-4">
                    <p className="break-keep text-[16px] font-black leading-snug text-white md:text-[17px]">“{p.headline}”</p>
                    {p.subline ? <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-white/75">{p.subline}</p> : null}
                  </div>
                ) : p.pitch ? (
                  <p className="relative mt-4 break-keep text-[14px] font-medium leading-relaxed text-white/85">{p.pitch}</p>
                ) : null}
              </div>

              {/* 바디 — 내가 어떤 사람인지 */}
              <div className="p-6 md:p-8">
                {p.targetJobs && p.targetJobs.length > 0 ? (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">보고 있는 직무</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{p.targetJobs.map((j, i) => <span key={i} className="rounded-full bg-[#0B46E8] px-3 py-1.5 text-[12.5px] font-bold text-white">{j}</span>)}</div>
                  </div>
                ) : null}

                {p.skills && p.skills.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">보유 스킬</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">{p.skills.map((s, i) => <span key={i} className="rounded-full bg-[#EAEFFE] px-2.5 py-1 text-[11.5px] font-bold text-[#0B46E8]">{s}</span>)}</div>
                  </div>
                ) : null}

                {p.highlights && p.highlights.length > 0 ? (
                  <div className="mt-5 border-t border-[#EEF1F5] pt-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">핵심 경험</p>
                    <div className="mt-3 flex flex-col gap-3.5">
                      {p.highlights.map((h, i) => (
                        <div key={i} className="flex gap-2.5">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                          <div className="min-w-0">
                            <p className="break-keep text-[13.5px] font-bold text-[#191F28]">{h.head}{h.period ? <span className="font-semibold text-[#8B95A1]"> · {h.period}</span> : null}</p>
                            {h.bullets.map((b, bi) => <p key={bi} className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">· {b}</p>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* 원본 문서 열람 — 이력서·자소서 바로 보기 */}
                {p.hasResume || p.hasCover ? (
                  <div className="mt-5 grid gap-2 border-t border-[#EEF1F5] pt-5 sm:grid-cols-2">
                    {p.hasResume ? (
                      <Link href={`/p/${token}/resume`} className="flex items-center justify-between gap-2 rounded-2xl bg-[#0B46E8] px-4 py-3 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]">
                        <span className="inline-flex items-center gap-1.5">📄 이력서 보기</span>
                        <span aria-hidden>→</span>
                      </Link>
                    ) : null}
                    {p.hasCover ? (
                      <Link href={`/p/${token}/cover`} className="flex items-center justify-between gap-2 rounded-2xl bg-[#EDF1FD] px-4 py-3 text-[13.5px] font-bold text-[#0B46E8] transition hover:bg-[#E1E9FC]">
                        <span className="inline-flex items-center gap-1.5">✍ 자기소개서 보기</span>
                        <span aria-hidden>→</span>
                      </Link>
                    ) : null}
                  </div>
                ) : null}

                {/* 신뢰 스트립 — 준비도·검증·경험·언어 */}
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[#EEF1F5] pt-5 text-[12.5px] text-[#8B95A1]">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: TIER[p.tier].ring }} />취업 준비도 <b className="tabular-nums text-[#191F28]">{p.readiness}</b>/100</span>
                  <span>경험 <b className="text-[#191F28]">{p.experienceCount}</b>건</span>
                  {p.languages.length ? <span>언어 <b className="text-[#191F28]">{p.languages.map((l) => l.language).filter(Boolean).join(", ")}</b></span> : null}
                </div>
              </div>

              {/* MRZ 데코 */}
              <div className="overflow-hidden border-t border-dashed border-[#E5E8EB] px-6 py-2.5 md:px-8">
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
