"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, LaunchButton, LaunchContainer, LaunchTopBar, SectionTitle } from "../../../components/launch/ui";

const inputCls =
  "mt-1 w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none";

// 2. 참가 신청폼 (MVP — 제출 시 완료 페이지로 이동)
export default function LaunchApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", school: "", major: "", visa: "", motivation: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    // TODO: 백엔드 연동. 지금은 완료 페이지로 이동.
    router.push("/career-launch/apply/complete");
  }

  const canSubmit = form.name.trim() && form.email.trim() && form.school.trim();

  return (
    <main className="pb-16">
      <LaunchTopBar back={{ href: "/career-launch", label: "프로그램" }} />
      <LaunchContainer className="pt-6">
        <SectionTitle sub="선발 결과는 이메일로 안내됩니다">참가 신청</SectionTitle>
        <form onSubmit={submit}>
          <Card className="space-y-4">
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              이름 <span className="text-[#0B46E8]">*</span>
              <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Nguyen Mai" />
            </label>
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              이메일 <span className="text-[#0B46E8]">*</span>
              <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            </label>
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              연락처
              <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12.5px] font-semibold text-[#4E5968]">
                학교 <span className="text-[#0B46E8]">*</span>
                <input className={inputCls} value={form.school} onChange={set("school")} placeholder="고려대학교" />
              </label>
              <label className="block text-[12.5px] font-semibold text-[#4E5968]">
                전공
                <input className={inputCls} value={form.major} onChange={set("major")} placeholder="경영학" />
              </label>
            </div>
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              비자 유형
              <input className={inputCls} value={form.visa} onChange={set("visa")} placeholder="D-2, D-10 등" />
            </label>
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              지원 동기
              <textarea className={`${inputCls} min-h-[96px] resize-none`} value={form.motivation} onChange={set("motivation")} placeholder="한국 취업을 준비하는 이유와 목표를 적어주세요." />
            </label>
          </Card>

          <div className="mt-5">
            <LaunchButton type="submit" variant="primary" full>
              {submitting ? "제출 중..." : "신청서 제출하기"}
            </LaunchButton>
            {!canSubmit ? <p className="mt-2 text-center text-[12px] text-[#8B95A1]">이름·이메일·학교는 필수입니다.</p> : null}
          </div>
        </form>
      </LaunchContainer>
    </main>
  );
}
