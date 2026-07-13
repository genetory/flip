"use client";

import { useEffect, useState } from "react";
import { fetchMyEnrollment, enrollByCode } from "../../lib/launch/enrollment-client";
import { trackCareerEnroll } from "../../lib/analytics";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Card } from "./ui";

// Career Launch 접근 게이트 — 기수에 등록된 학생(또는 운영자)만 통과. 아니면 초대코드 입력 안내.
export function EnrollmentGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "gate">("loading");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const check = async () => {
    try {
      const e = await fetchMyEnrollment();
      setState(e.enrolled ? "ok" : "gate");
    } catch {
      setState("gate");
    }
  };

  useEffect(() => {
    void check();
  }, []);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true);
    setErr("");
    try {
      await enrollByCode(c);
      trackCareerEnroll("code");
      await check(); // 성공 → 재확인 후 통과
    } catch (e) {
      setErr(e instanceof Error ? e.message : "등록에 실패했어요.");
    } finally {
      setBusy(false);
    }
  };

  if (state === "ok") return <>{children}</>;
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-[13px] text-[#8B95A1]">불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col justify-center px-5 py-16">
          <Card className="text-center md:!p-7">
            <p className="text-[30px]">🔒</p>
            <h1 className="mt-2 text-[19px] font-black text-[#0B1227]">아직 등록되지 않았어요</h1>
            <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">
              Career Launch는 대학·기수별로 운영돼요. 발급받은 초대코드를 입력하거나, 운영자에게 등록을 문의해 주세요.
            </p>
            <form onSubmit={submit} className="mt-5 space-y-2 text-left">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="초대코드 (예: AB2C9D)"
                className="w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] tracking-[0.12em] text-[#191F28] placeholder:tracking-normal placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none"
              />
              {err ? <p className="text-[12.5px] text-[#E5484D]">{err}</p> : null}
              <button
                type="submit"
                disabled={!code.trim() || busy}
                className={`w-full rounded-xl py-3 text-[14px] font-bold transition ${
                  code.trim() && !busy ? "bg-[#0B46E8] text-white hover:bg-[#0A3ECB]" : "cursor-not-allowed bg-[#E5E8EB] text-[#B0B8C1]"
                }`}
              >
                {busy ? "등록 중…" : "등록하기"}
              </button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
