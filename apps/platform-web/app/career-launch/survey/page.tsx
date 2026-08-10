"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { readAccessToken } from "../../../lib/auth-client";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

type Data = {
  certificate: { certificateNo: string; issuedAt: string } | null;
  outcome: { status: string; companyName: string; positionTitle: string | null } | null;
};

type SurveyStatus = "SEARCHING" | "INTERVIEW" | "OFFER" | "HIRED";

const OPTIONS: { value: SurveyStatus; label: string; needsCompany: boolean }[] = [
  { value: "SEARCHING", label: "아직 구직 중이에요", needsCompany: false },
  { value: "INTERVIEW", label: "면접 진행 중이에요", needsCompany: true },
  { value: "OFFER", label: "합격/오퍼를 받았어요", needsCompany: true },
  { value: "HIRED", label: "입사했어요", needsCompany: true }
];

export default function CareerSurveyPage() {
  const { isReady, isAuthenticated } = useAuthSession();
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<SurveyStatus>("SEARCHING");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    void (async () => {
      try {
        const token = readAccessToken();
        const res = await fetch(`${apiBase()}/career-launch/me/employment-status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (res.status === 403) {
          setError("Career Launch 참여자만 이용할 수 있어요.");
          return;
        }
        const payload = (await res.json()) as { ok?: boolean } & Data;
        if (payload.ok) {
          setData(payload);
          if (payload.outcome) {
            const st = payload.outcome.status;
            const mapped: SurveyStatus = st === "HIRED" ? "HIRED" : st === "OFFER" ? "OFFER" : st === "INTERVIEW" ? "INTERVIEW" : "SEARCHING";
            setStatus(mapped);
            if (payload.outcome.companyName && payload.outcome.companyName !== "구직 중") setCompany(payload.outcome.companyName);
            if (payload.outcome.positionTitle) setPosition(payload.outcome.positionTitle);
          }
        }
      } catch {
        setError("불러오지 못했어요.");
      } finally {
        setLoading(false);
      }
    })();
  }, [isReady, isAuthenticated]);

  const needsCompany = OPTIONS.find((o) => o.value === status)?.needsCompany ?? false;

  async function submit() {
    if (needsCompany && !company.trim()) {
      setError("회사명을 입력해 주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const token = readAccessToken();
      const res = await fetch(`${apiBase()}/career-launch/me/employment-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status, companyName: company.trim() || undefined, positionTitle: position.trim() || undefined })
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError("저장에 실패했어요. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F4F6]">
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-5 py-10 md:py-14">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">← 대시보드</Link>
          <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-[#191F28]">취업 성과 설문</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#4E5968]">
            프로그램 이후 취업 진행 상황을 알려주세요. 여러분의 성과는 프로그램을 더 좋게 만드는 데 쓰입니다.
          </p>

          {loading ? (
            <div className="mt-6 rounded-2xl bg-white p-5 text-[14px] text-[#8B95A1] shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.05)]">불러오는 중…</div>
          ) : error && !data ? (
            <div className="mt-6 rounded-2xl bg-white p-5 text-[14px] text-[#e5484d] shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.05)]">{error}</div>
          ) : (
            <>
              {data?.certificate ? (
                <div className="mt-6 rounded-2xl bg-[#e8f2fe] p-5">
                  <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#1b64da]"><GraduationCap size={16} weight="bold" aria-hidden /> 수료증 발급됨</p>
                  <p className="mt-1 text-[15px] font-extrabold text-[#191F28]">{data.certificate.certificateNo}</p>
                  <p className="mt-1 text-[12.5px] text-[#4E5968]">4주 Career Launch 프로그램을 완주하셨습니다. 축하합니다!</p>
                </div>
              ) : null}

              <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.05)]">
                <p className="text-[15px] font-bold text-[#191F28]">현재 취업 상태</p>
                <div className="mt-3 flex flex-col gap-2">
                  {OPTIONS.map((o) => (
                    <label key={o.value} className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-[14px] font-semibold transition ${status === o.value ? "bg-[#e8f2fe] text-[#1b64da]" : "bg-[#f7f8fa] text-[#4E5968] hover:bg-[#eef0f3]"}`}>
                      <input type="radio" name="status" checked={status === o.value} onChange={() => setStatus(o.value)} className="accent-[#3182f6]" />
                      {o.label}
                    </label>
                  ))}
                </div>

                {needsCompany ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-bold text-[#8B95A1]">회사명</span>
                      <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="예: 플리퍼스" className="rounded-xl bg-[#f7f8fa] px-3.5 py-2.5 text-[14px] outline-none placeholder:text-[#B0B8C1]" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-bold text-[#8B95A1]">직무 (선택)</span>
                      <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 마케팅" className="rounded-xl bg-[#f7f8fa] px-3.5 py-2.5 text-[14px] outline-none placeholder:text-[#B0B8C1]" />
                    </label>
                  </div>
                ) : null}

                {error ? <p className="mt-3 text-[12.5px] font-semibold text-[#e5484d]">{error}</p> : null}
                {saved ? <p className="mt-3 text-[12.5px] font-semibold text-[#3182f6]">제출되었습니다. 감사합니다!</p> : null}

                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={saving}
                  className="mt-5 w-full rounded-xl bg-[#3182f6] px-4 py-3 text-[14px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? "저장 중…" : "제출하기"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
