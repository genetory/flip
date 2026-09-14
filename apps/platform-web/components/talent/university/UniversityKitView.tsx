"use client";

// 대학 취업지원센터용 '배포 키트' — 대학 랜딩을 설명회·부스·포스터·SNS 에 뿌릴 수 있게
// 링크 + QR 을 채널별로 만들어 준다. 채널마다 ?c=<채널> 이 붙어 어디서 유입됐는지 집계된다.
// 내부 배포 도구라 한국어 전용. slug 로만 진입(noindex).
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Copy, Check, DownloadSimple, CaretLeft, QrCode } from "@phosphor-icons/react";
import type { UniversityLanding } from "../../../lib/talent/university-landing";

type Channel = { key: string; label: string; hint: string };
const CHANNELS: Channel[] = [
  { key: "", label: "기본 링크", hint: "온라인 공유 전반 (카톡·문자·메일)" },
  { key: "booth", label: "설명회·부스", hint: "현장 배너·테이블 QR" },
  { key: "poster", label: "포스터·전단", hint: "교내 게시물" },
  { key: "instagram", label: "인스타그램", hint: "학과·센터 계정 프로필·스토리" },
  { key: "class", label: "수업·특강", hint: "강의 슬라이드·안내" }
];

export function UniversityKitView({ data }: { data: UniversityLanding }) {
  const [origin, setOrigin] = useState("");
  const [qrs, setQrs] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    try {
      setOrigin(window.location.origin);
    } catch {
      setOrigin("");
    }
  }, []);

  const base = origin ? `${origin}/talent/university/${data.slug}` : "";
  const linkFor = (c: string) => (c ? `${base}?c=${c}` : base);

  useEffect(() => {
    if (!base) return;
    let alive = true;
    void (async () => {
      const QR = (await import("qrcode")).default;
      const out: Record<string, string> = {};
      for (const ch of CHANNELS) {
        try {
          out[ch.key] = await QR.toDataURL(linkFor(ch.key), { margin: 1, width: 640, errorCorrectionLevel: "M", color: { dark: data.accentDeep, light: "#FFFFFF" } });
        } catch {
          /* 개별 QR 실패 무시 */
        }
      }
      if (alive) setQrs(out);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, data.slug, data.accentDeep]);

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
    } catch {
      /* 클립보드 실패 무시 */
    }
  };

  return (
    <main className="min-h-screen bg-[#F6F8FB] text-[#191F28]">
      <header className="border-b border-[#EEF1F5] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-5">
          <Link href={`/talent/university/${data.slug}`} className="-ml-1.5 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> 랜딩 보기
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <p className="inline-flex items-center gap-1.5 rounded-full bg-[#EDF1FD] px-3 py-1 text-[11.5px] font-black uppercase tracking-[0.1em]" style={{ color: data.accent }}>
          <QrCode className="h-3.5 w-3.5" weight="bold" aria-hidden /> 배포 키트
        </p>
        <h1 className="mt-3 break-keep text-[26px] font-black leading-[1.25] tracking-[-0.02em] text-[#0B1227] md:text-[30px]">{data.displayName} 배포 키트</h1>
        <p className="mt-2 max-w-[52ch] break-keep text-[14px] leading-relaxed text-[#8B95A1]">
          설명회·부스·포스터·SNS 어디에 붙여도, 이 QR/링크로 들어온 학생은 <b className="text-[#4E5968]">어느 채널에서 왔는지</b> 자동으로 집계돼요. 채널별 링크를 각각 사용하세요.
        </p>

        {/* 기본 링크 — 큰 QR */}
        <section className="mt-7 flex flex-col items-center gap-4 rounded-3xl border border-[#EEF1F5] bg-white p-6 text-center sm:flex-row sm:items-center sm:text-left">
          <span className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl border border-[#EEF1F5] bg-white p-2">
            {qrs[""] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrs[""]} alt={`${data.displayName} 기본 링크 QR`} className="h-full w-full object-contain" />
            ) : (
              <span className="text-[12px] text-[#B0B8C1]">QR 생성 중…</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-black text-[#0B1227]">기본 링크</p>
            <p className="mt-1 break-all rounded-xl bg-[#F6F8FB] px-3 py-2 text-[12.5px] text-[#4E5968]">{base || "…"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copy("", base)}
                disabled={!base}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-bold text-white transition disabled:opacity-40"
                style={{ backgroundColor: data.accent }}
              >
                {copied === "" ? <Check className="h-4 w-4" weight="bold" /> : <Copy className="h-4 w-4" weight="bold" />}
                {copied === "" ? "복사됨" : "링크 복사"}
              </button>
              {qrs[""] ? (
                <a
                  href={qrs[""]}
                  download={`${data.slug}-qr.png`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E5E8EB] bg-white px-4 py-2.5 text-[13px] font-bold text-[#4E5968] transition hover:text-[#191F28]"
                >
                  <DownloadSimple className="h-4 w-4" weight="bold" /> QR 저장
                </a>
              ) : null}
            </div>
          </div>
        </section>

        {/* 채널별 링크 */}
        <h2 className="mt-9 text-[16px] font-black text-[#0B1227]">채널별 링크</h2>
        <p className="mt-1 text-[13px] text-[#8B95A1]">각 채널에 맞는 링크를 쓰면, 어디서 가장 많이 들어오는지 볼 수 있어요.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CHANNELS.filter((c) => c.key).map((ch) => {
            const link = linkFor(ch.key);
            return (
              <div key={ch.key} className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-4">
                <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-[#EEF1F5] bg-white p-1.5">
                  {qrs[ch.key] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrs[ch.key]} alt={`${ch.label} QR`} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-[#B0B8C1]">…</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-black text-[#191F28]">{ch.label}</p>
                  <p className="mt-0.5 break-keep text-[11.5px] leading-snug text-[#8B95A1]">{ch.hint}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => copy(ch.key, link)}
                      disabled={!base}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB] disabled:opacity-40"
                    >
                      {copied === ch.key ? <Check className="h-3.5 w-3.5" weight="bold" /> : <Copy className="h-3.5 w-3.5" weight="bold" />}
                      {copied === ch.key ? "복사됨" : "링크"}
                    </button>
                    {qrs[ch.key] ? (
                      <a
                        href={qrs[ch.key]}
                        download={`${data.slug}-${ch.key}-qr.png`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#F2F4F6] px-2.5 py-1.5 text-[12px] font-bold text-[#4E5968] transition hover:bg-[#E5E8EB]"
                      >
                        <DownloadSimple className="h-3.5 w-3.5" weight="bold" /> QR
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 rounded-2xl bg-[#EDF1FD] px-4 py-3 text-[12.5px] leading-relaxed text-[#4E5968]">
          💡 이 페이지는 검색에 노출되지 않아요. 취업지원센터 내부에서만 공유해 사용하세요.
        </p>
      </div>
    </main>
  );
}
