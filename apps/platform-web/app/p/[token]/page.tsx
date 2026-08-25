"use client";

// 공개 Talent Passport — 기업 제출용 공유 뷰(무인증). 연락처 없이 검증·역량 요약만.
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { fetchSharedPassport, type SharedPassport, type PassportTier } from "../../../lib/launch/progress-client";

const TIER: Record<PassportTier, { label: string; ring: string; bg: string; ink: string }> = {
  preparing: { label: "준비 중", ring: "#C9CDD2", bg: "#F2F4F6", ink: "#8B95A1" },
  bronze: { label: "Verified Bronze", ring: "#C08457", bg: "#F6ECE3", ink: "#A96A3E" },
  silver: { label: "Verified Silver", ring: "#8B95A1", bg: "#EEF1F5", ink: "#5A6472" },
  gold: { label: "Verified Gold", ring: "#E0A500", bg: "#FBF2D6", ink: "#A97B00" }
};

function Ring({ value, color }: { value: number; color: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  return (
    <div className="relative h-[132px] w-[132px] shrink-0">
      <svg viewBox="0 0 132 132" className="h-full w-full -rotate-90">
        <circle cx="66" cy="66" r={r} fill="none" stroke="#EEF1F5" strokeWidth="11" />
        <circle cx="66" cy="66" r={r} fill="none" stroke={color} strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-black leading-none tracking-[-0.02em] text-[#0B1227]">{value}</span>
        <span className="mt-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8B95A1]">Readiness</span>
      </div>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-2.5 text-[12.5px]">
      <span className="w-16 shrink-0 text-[#8B95A1]">{label}</span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F2F4F6]">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: "linear-gradient(90deg,#0B46E8,#3A6BFF)" }} />
      </div>
      <span className="w-7 shrink-0 text-right font-bold tabular-nums text-[#0B1227]">{v}</span>
    </div>
  );
}

export default function SharedPassportPage() {
  const params = useParams();
  const token = String((params as { token?: string })?.token ?? "");
  const [p, setP] = useState<SharedPassport | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

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

  return (
    <main className="min-h-screen bg-[#F6F8FB] px-4 py-10">
      <div className="mx-auto w-full max-w-xl">
        {status === "loading" ? (
          <p className="py-20 text-center text-[13px] text-[#8B95A1]">불러오는 중…</p>
        ) : status === "notfound" || !p ? (
          <div className="rounded-3xl border border-[#EEF1F5] bg-white p-8 text-center">
            <p className="text-[15px] font-bold text-[#191F28]">공유된 프로필을 찾을 수 없어요</p>
            <p className="mt-1.5 text-[13px] text-[#8B95A1]">링크가 만료되었거나 잘못된 주소일 수 있어요.</p>
          </div>
        ) : (
          <>
            <div className="mb-3 text-center">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">APLY Talent Passport</p>
            </div>
            <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-[#F6F9FF] to-[#EAF1FF] p-6 shadow-[0_16px_50px_-18px_rgba(11,70,232,0.24)] ring-1 ring-[#0B46E8]/10 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h1 className="text-[22px] font-black tracking-[-0.02em] text-[#0B1227]">{p.name || "익명 인재"}</h1>
                    {p.target.role ? <p className="mt-1 text-[13.5px] font-semibold text-[#4E5968]">{p.target.role}</p> : null}
                    {p.verifiedAt ? <p className="mt-1 text-[11.5px] font-semibold text-[#8B95A1]">검증일 {p.verifiedAt.slice(0, 10)}</p> : null}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-black" style={{ background: TIER[p.tier].bg, color: TIER[p.tier].ink }}>
                    {p.verified ? "✓ " : ""}
                    {TIER[p.tier].label}
                  </span>
                </div>

                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <Ring value={p.readiness} color={TIER[p.tier].ring} />
                  <div className="flex-1 space-y-1.5">
                    <Bar label="방향" value={p.breakdown.direction} />
                    <Bar label="이력서" value={p.breakdown.resume} />
                    <Bar label="자소서" value={p.breakdown.cover} />
                    <Bar label="면접" value={p.breakdown.interview} />
                    <Bar label="경험" value={p.breakdown.experience} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {[
                    { label: "커리어", value: p.scores.career },
                    { label: "이력서", value: p.scores.resume },
                    { label: "자소서", value: p.scores.cover },
                    { label: "면접", value: p.scores.interview }
                  ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-[#EDF1F7] bg-white/70 px-3.5 py-3 text-center">
                      <p className="text-[11px] font-semibold text-[#8B95A1]">{s.label}</p>
                      <p className="mt-1 text-[17px] font-extrabold tabular-nums text-[#0B1227]">{typeof s.value === "number" ? s.value : "–"}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[#8B95A1]">
                  <span>경험 <b className="text-[#191F28]">{p.experienceCount}</b>건</span>
                  {p.languages.length ? <span>언어 <b className="text-[#191F28]">{p.languages.map((l) => l.language).filter(Boolean).join(", ")}</b></span> : null}
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-[11.5px] text-[#B0B8C1]">APLY Career Launch로 검증된 인재 프로필이에요.</p>
          </>
        )}
      </div>
    </main>
  );
}
