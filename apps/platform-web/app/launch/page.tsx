"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LAUNCH } from "../../lib/launch/data";
import { LaunchButton, LaunchContainer } from "../../components/launch/ui";

const inputCls =
  "mt-1 w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3.5 text-[15px] text-[#191F28] placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none";

// 첫 화면 — 로그인
export default function LaunchLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    // TODO: 백엔드 인증 연동. 지금은 대시보드로 이동(MVP).
    router.push("/launch/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col justify-center pb-16">
      <LaunchContainer>
        {/* 브랜드 */}
        <div className="mb-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B46E8]">
            <span className="inline-block h-4 w-4 rotate-45 rounded-[3px]" style={{ background: LAUNCH.lime }} />
          </span>
          <h1 className="text-[22px] font-black tracking-[-0.01em] text-[#0B1227]">APLY Global Career Launch</h1>
          <p className="mt-1.5 text-[13.5px] text-[#8B95A1]">{LAUNCH.tagline}</p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-[12.5px] font-semibold text-[#4E5968]">
            이메일
            <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </label>
          <label className="block text-[12.5px] font-semibold text-[#4E5968]">
            비밀번호
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" autoComplete="current-password" />
          </label>
          <div className="pt-2">
            <LaunchButton type="submit" variant="primary" full>
              {busy ? "로그인 중..." : "로그인"}
            </LaunchButton>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[13px] text-[#8B95A1]">
            아직 참가 신청 전이신가요?{" "}
            <a href="/launch/apply" className="font-bold text-[#0B46E8]">
              참가 신청하기
            </a>
          </p>
        </div>
      </LaunchContainer>
    </main>
  );
}
