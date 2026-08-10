"use client";

// 푸터 '고객센터' 버튼 → 문의 팝업. 일반/기업 문의를 받아 기업 상담 엔드포인트로
// 전송하면 서버가 Discord 웹훅으로 알림을 보낸다. 전 페이지 공용(AplyFooter)에서 사용.
import { useEffect, useState } from "react";
import { X, CircleNotch, CheckCircle } from "@phosphor-icons/react";
import { submitContactInquiry } from "../lib/member-profile-client";

type InquiryType = "general" | "business";

export function FooterContactButton() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<InquiryType>("general");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function close() {
    setOpen(false);
    // 닫힘 애니메이션 없이 즉시 초기화
    setTimeout(() => {
      setDone(false);
      setErr(null);
    }, 150);
  }

  function submit() {
    if (busy) return;
    if (!name.trim() || !email.trim() || !message.trim() || (type === "business" && !company.trim())) {
      setErr("필수 항목을 모두 입력해 주세요.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr("올바른 이메일 주소를 입력해 주세요.");
      return;
    }
    setBusy(true);
    setErr(null);
    submitContactInquiry({ type, name, email, phone, company, message })
      .then((r) => {
        if (r.ok) {
          setDone(true);
          setName("");
          setEmail("");
          setPhone("");
          setCompany("");
          setMessage("");
        } else {
          setErr(r.message);
        }
      })
      .catch(() => setErr("문의 전송에 실패했어요. 잠시 후 다시 시도해 주세요."))
      .finally(() => setBusy(false));
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="transition hover:text-[#4E5968]">
        문의하기
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="고객센터 문의">
          <button type="button" aria-label="닫기" className="absolute inset-0 bg-[#0B1227]/45" onClick={close} />
          <div className="relative w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.24)]">
            <div className="flex items-center justify-between border-b border-[#F2F4F6] px-6 py-4">
              <p className="text-[16px] font-black tracking-[-0.02em] text-[#0B1227]">문의하기</p>
              <button type="button" onClick={close} aria-label="닫기" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B95A1] transition hover:bg-[#F2F4F6]">
                <X className="h-[18px] w-[18px]" weight="bold" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F8EF] text-[#0A9B59]"><CheckCircle className="h-8 w-8" weight="fill" /></span>
                <p className="text-[16px] font-bold text-[#0B1227]">문의가 접수됐어요</p>
                <p className="break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">담당자가 확인 후 입력하신 이메일로 답변드릴게요.</p>
                <button type="button" onClick={close} className="mt-2 rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">확인</button>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {/* 문의 유형 */}
                <div className="flex items-center gap-1 rounded-xl bg-[#F2F4F6] p-1">
                  {([["general", "일반 문의"], ["business", "기업 문의"]] as const).map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setType(v)} className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition ${type === v ? "bg-white text-[#191F28] shadow-[0_1px_3px_rgba(11,18,39,0.1)]" : "text-[#8B95A1]"}`}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <Field label="이름" required>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="이름" className={inputCls} />
                  </Field>
                  <Field label="이메일" required>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="답변받을 이메일" className={inputCls} />
                  </Field>
                  <Field label="휴대폰 번호">
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="휴대폰 번호 (선택)" className={inputCls} />
                  </Field>
                  <Field label="회사명" required={type === "business"}>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={type === "business" ? "회사명" : "회사명 (선택)"} className={inputCls} />
                  </Field>
                  <Field label="문의 내용" required>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="무엇을 도와드릴까요?" className={`${inputCls} resize-none`} />
                  </Field>
                </div>

                {err ? <p className="mt-3 text-[12.5px] font-semibold text-[#F04452]">{err}</p> : null}

                <button type="button" onClick={submit} disabled={busy} className="mt-4 inline-flex h-[50px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
                  {busy ? "보내는 중…" : "문의 보내기"}
                </button>
                <p className="mt-3 break-keep text-center text-[11.5px] leading-relaxed text-[#B0B8C1]">입력하신 정보는 문의 응대 목적으로만 사용돼요.</p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

const inputCls =
  "w-full rounded-xl bg-[#F5F6F8] px-3.5 py-2.5 text-[14px] text-[#191F28] outline-none placeholder:text-[#B0B8C1] focus:ring-2 focus:ring-[#0B46E8]/30";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-semibold text-[#4E5968]">
        {label} {required ? <span className="text-[#0B46E8]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
