"use client";

// 푸터 '고객센터' 버튼 → 문의 팝업. 일반/기업 문의를 받아 기업 상담 엔드포인트로
// 전송하면 서버가 Discord 웹훅으로 알림을 보낸다. 전 페이지 공용(AplyFooter)에서 사용.
import { useEffect, useState } from "react";
import { X, CircleNotch, CheckCircle } from "@phosphor-icons/react";
import { submitContactInquiry } from "../lib/member-profile-client";
import { usePlatformT } from "../lib/i18n";

type InquiryType = "general" | "business";

export function FooterContactButton() {
  const t = usePlatformT();
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
      setErr(t("필수 항목을 모두 입력해 주세요.", "Please fill in all required fields.", "请填写所有必填项。", "Vui lòng điền tất cả mục bắt buộc.", "必須項目をすべて入力してください。", "Isi semua kolom wajib."));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr(t("올바른 이메일 주소를 입력해 주세요.", "Please enter a valid email address.", "请输入有效的邮箱地址。", "Vui lòng nhập email hợp lệ.", "正しいメールアドレスを入力してください。", "Masukkan alamat email yang valid."));
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
      .catch(() => setErr(t("문의 전송에 실패했어요. 잠시 후 다시 시도해 주세요.", "Failed to send. Please try again shortly.", "发送失败，请稍后重试。", "Gửi thất bại. Vui lòng thử lại sau.", "送信に失敗しました。しばらくして再試行してください。", "Gagal mengirim. Coba lagi nanti.")))
      .finally(() => setBusy(false));
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="transition hover:text-[#4E5968]">
        {t("문의하기", "Contact us", "联系我们", "Liên hệ", "お問い合わせ", "Hubungi kami")}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={t("고객센터 문의", "Contact support", "客服咨询", "Liên hệ hỗ trợ", "サポートへのお問い合わせ", "Hubungi dukungan")}>
          <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="absolute inset-0 bg-[#0B1227]/45" onClick={close} />
          <div className="relative w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(11,18,39,0.24)]">
            <div className="flex items-center justify-between border-b border-[#F2F4F6] px-6 py-4">
              <p className="text-[16px] font-black tracking-[-0.02em] text-[#0B1227]">{t("문의하기", "Contact us", "联系我们", "Liên hệ", "お問い合わせ", "Hubungi kami")}</p>
              <button type="button" onClick={close} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8B95A1] transition hover:bg-[#F2F4F6]">
                <X className="h-[18px] w-[18px]" weight="bold" />
              </button>
            </div>

            {done ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E7F8EF] text-[#0A9B59]"><CheckCircle className="h-8 w-8" weight="fill" /></span>
                <p className="text-[16px] font-bold text-[#0B1227]">{t("문의가 접수됐어요", "Your inquiry was received", "咨询已收到", "Đã nhận câu hỏi của bạn", "お問い合わせを受け付けました", "Pertanyaan Anda diterima")}</p>
                <p className="break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{t("담당자가 확인 후 입력하신 이메일로 답변드릴게요.", "We'll review and reply to the email you provided.", "我们确认后会回复到您填写的邮箱。", "Chúng tôi sẽ xem xét và trả lời qua email bạn đã cung cấp.", "担当者が確認のうえ、ご入力のメールへ返信します。", "Kami akan meninjau dan membalas ke email Anda.")}</p>
                <button type="button" onClick={close} className="mt-2 rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">{t("확인", "OK", "确定", "OK", "OK", "OK")}</button>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                {/* 문의 유형 */}
                <div className="flex items-center gap-1 rounded-xl bg-[#F2F4F6] p-1">
                  {([["general", t("일반 문의", "General", "一般咨询", "Chung", "一般", "Umum")], ["business", t("기업 문의", "Business", "企业咨询", "Doanh nghiệp", "法人", "Bisnis")]] as const).map(([v, label]) => (
                    <button key={v} type="button" onClick={() => setType(v)} className={`flex-1 rounded-lg py-2 text-[13px] font-bold transition ${type === v ? "bg-white text-[#191F28] shadow-[0_1px_3px_rgba(11,18,39,0.1)]" : "text-[#8B95A1]"}`}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <Field label={t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")} required>
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")} className={inputCls} />
                  </Field>
                  <Field label={t("이메일", "Email", "邮箱", "Email", "メール", "Email")} required>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("답변받을 이메일", "Email for reply", "接收回复的邮箱", "Email nhận trả lời", "返信用メール", "Email untuk balasan")} className={inputCls} />
                  </Field>
                  <Field label={t("휴대폰 번호", "Phone", "手机号", "Số điện thoại", "電話番号", "No. HP")}>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("휴대폰 번호 (선택)", "Phone (optional)", "手机号（选填）", "Số điện thoại (tùy chọn)", "電話番号（任意）", "No. HP (opsional)")} className={inputCls} />
                  </Field>
                  <Field label={t("회사명", "Company", "公司名称", "Công ty", "会社名", "Perusahaan")} required={type === "business"}>
                    <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={type === "business" ? t("회사명", "Company", "公司名称", "Công ty", "会社名", "Perusahaan") : t("회사명 (선택)", "Company (optional)", "公司名称（选填）", "Công ty (tùy chọn)", "会社名（任意）", "Perusahaan (opsional)")} className={inputCls} />
                  </Field>
                  <Field label={t("문의 내용", "Message", "咨询内容", "Nội dung", "お問い合わせ内容", "Pesan")} required>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={t("무엇을 도와드릴까요?", "How can we help?", "有什么可以帮您？", "Chúng tôi có thể giúp gì?", "どのようなご用件でしょうか？", "Ada yang bisa kami bantu?")} className={`${inputCls} resize-none`} />
                  </Field>
                </div>

                {err ? <p className="mt-3 text-[12.5px] font-semibold text-[#F04452]">{err}</p> : null}

                <button type="button" onClick={submit} disabled={busy} className="mt-4 inline-flex h-[50px] w-full items-center justify-center gap-1.5 rounded-2xl bg-[#0B46E8] text-[15px] font-bold text-white transition hover:bg-[#0A3ECB] disabled:opacity-50">
                  {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : null}
                  {busy ? t("보내는 중…", "Sending…", "发送中…", "Đang gửi…", "送信中…", "Mengirim…") : t("문의 보내기", "Send inquiry", "发送咨询", "Gửi câu hỏi", "問い合わせを送信", "Kirim pertanyaan")}
                </button>
                <p className="mt-3 break-keep text-center text-[11.5px] leading-relaxed text-[#B0B8C1]">{t("입력하신 정보는 문의 응대 목적으로만 사용돼요.", "Your info is used only to respond to your inquiry.", "您的信息仅用于回复本次咨询。", "Thông tin của bạn chỉ dùng để phản hồi câu hỏi.", "ご入力情報はお問い合わせ対応にのみ使用されます。", "Info Anda hanya dipakai untuk menanggapi pertanyaan.")}</p>
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
