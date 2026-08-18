"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { ShieldCheck, UserCheck, FlowArrow as Workflow, Globe as Globe2, X } from "@phosphor-icons/react";
import { useLanguage } from "../i18n/LanguageProvider";
import { getSiteMessages } from "../../lib/site-messages";
import { usePlatformT } from "../../lib/i18n";
import { Reveal } from "./Reveal";
import { paperlogy } from "../../lib/fonts";

const valueIcons = [ShieldCheck, UserCheck, Workflow, Globe2] as const;
const valueCardThemes = [
  "bg-[#2563EB]",
  "bg-[#7C3AED]",
  "bg-[#10B981]",
  "bg-[#F97316]",
] as const;

export const BusinessValue = () => {
  const { locale } = useLanguage();
  const t = usePlatformT();
  const copy = getSiteMessages(locale).businessValue;
  const isEnglish = locale === "en";
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    message: ""
  });
  const labels = {
    title: t("기업 상담 문의", "Company Consultation", "企业咨询", "Tư vấn doanh nghiệp", "企業向けお問い合わせ", "Konsultasi Perusahaan"),
    subtitle: t(
      "담당자가 빠르게 확인할 수 있도록 기본 정보를 남겨주세요.",
      "Leave your basic information so our team can follow up quickly.",
      "请留下基础信息，方便负责人尽快联系您。",
      "Vui lòng để lại thông tin cơ bản để đội ngũ phản hồi nhanh hơn.",
      "担当者が迅速にご対応できるよう、基本情報をご記入ください。",
      "Silakan tinggalkan informasi dasar agar tim kami dapat segera menindaklanjuti."
    ),
    company: t("기업명", "Company", "公司名称", "Tên công ty", "会社名", "Nama Perusahaan"),
    name: t("담당자 이름", "Contact Name", "联系人姓名", "Người phụ trách", "ご担当者名", "Nama Penanggung Jawab"),
    email: t("이메일", "Email", "邮箱", "Email", "メールアドレス", "Email"),
    phone: t("연락처", "Phone", "联系电话", "Số điện thoại", "電話番号", "Nomor Telepon"),
    message: t("문의 내용", "Message", "咨询内容", "Nội dung tư vấn", "お問い合わせ内容", "Isi Konsultasi"),
    placeholderMessage: t(
      "필요한 채용 인재, 진행 시기, 문의 사항을 자유롭게 작성해주세요.",
      "Tell us what talent you need, timeline, and any questions.",
      "请自由填写所需人才、招聘时间和咨询问题。",
      "Hãy chia sẻ nhu cầu tuyển dụng, thời gian triển khai và câu hỏi của bạn.",
      "ご希望の採用人材、実施時期、ご質問などをご自由にご記入ください。",
      "Silakan tuliskan kebutuhan rekrutmen, jadwal pelaksanaan, dan pertanyaan Anda."
    ),
    cancel: t("취소", "Cancel", "取消", "Hủy", "キャンセル", "Batal"),
    submit: t("문의 보내기", "Send Inquiry", "发送咨询", "Gửi tư vấn", "お問い合わせを送信", "Kirim Konsultasi"),
    submitting: t("보내는 중...", "Sending...", "发送中...", "Đang gửi...", "送信中...", "Mengirim..."),
    doneTitle: t("문의가 접수되었어요", "Inquiry received", "咨询已提交", "Đã tiếp nhận yêu cầu", "お問い合わせを受け付けました", "Permintaan telah diterima"),
    doneBody: t(
      "입력해주신 연락처로 빠르게 안내드릴게요.",
      "We will contact you shortly using the details you shared.",
      "我们将通过您提供的联系方式尽快联系您。",
      "Chúng tôi sẽ liên hệ sớm qua thông tin bạn đã để lại.",
      "ご記入いただいた連絡先へ速やかにご案内いたします。",
      "Kami akan segera menghubungi Anda melalui kontak yang telah diberikan."
    ),
    close: t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup"),
    submitError: t(
      "문의 전송에 실패했어요. 잠시 후 다시 시도해주세요.",
      "Failed to submit inquiry. Please try again in a moment.",
      "咨询提交失败，请稍后重试。",
      "Gửi yêu cầu thất bại. Vui lòng thử lại sau.",
      "送信に失敗しました。しばらくしてから再度お試しください。",
      "Gagal mengirim permintaan. Silakan coba lagi nanti."
    )
  };

  function getApiBaseUrl() {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  }

  function handleCloseConsultModal() {
    setIsConsultOpen(false);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setSubmitError(null);
    setForm({
      companyName: "",
      contactName: "",
      email: "",
      phone: "",
      message: ""
    });
  }

  async function handleSubmitConsultation(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch(`${getApiBaseUrl()}/company-consultations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          contactName: form.contactName,
          email: form.email,
          phone: form.phone || undefined,
          message: form.message,
          locale,
          source: "platform-web"
        })
      });

      if (!response.ok) {
        let serverMessage = "";
        try {
          const payload = (await response.json()) as { message?: string };
          serverMessage = payload.message ? String(payload.message) : "";
        } catch {
          serverMessage = "";
        }
        throw new Error(serverMessage || `Failed with status ${response.status}`);
      }

      setIsSubmitted(true);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "";
      setSubmitError(reason ? `${labels.submitError} (${reason})` : labels.submitError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section id="for-business" className="relative overflow-hidden border-y border-slate-200 bg-white py-20 text-[#0B1227]">
      <div className="container relative max-w-[1200px]">
        <Reveal className="mx-auto mb-14 grid max-w-4xl items-center gap-6 md:grid-cols-[220px_1fr]">
          <div className="mx-auto w-[150px] md:mx-0 md:w-[220px]">
            <Image
              src="/img_for_business.webp"
              alt="Global talent illustration"
              width={1468}
              height={1126}
              className="h-auto w-full rounded-2xl object-cover shadow-[0_24px_50px_-34px_rgba(15,23,42,0.5)]"
              sizes="220px"
            />
          </div>
          <div className="text-center md:text-left">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#2563EB]">
            {copy.sectionLabel}
          </p>
          <h2 className={`${paperlogy.className} text-3xl font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-5xl`}>
            {copy.titleTop}
            <br />
            <span className="mt-2 inline-block">
              {copy.titleBottom}
            </span>
          </h2>
          <p className="mt-5 text-slate-600">{copy.description}</p>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {copy.cards.map((card, index) => {
            const Icon = valueIcons[index];
            return (
              <Reveal
                key={card.title}
                className={`group rounded-2xl p-6 text-white transition-all duration-300 hover:-translate-y-1 ${valueCardThemes[index]}`}
                delayMs={index * 80}
                y="sm"
              >
                <Icon className="mb-5 h-6 w-6 text-white" weight="fill" />
                <h3 className={`mb-2 font-display font-black leading-tight tracking-[-0.02em] text-white text-balance ${isEnglish ? "text-[1.55rem] md:text-[1.65rem]" : "text-2xl md:text-[1.9rem]"}`}>
                  {card.title}
                </h3>
                <p className={`leading-relaxed text-white/95 text-pretty ${isEnglish ? "text-[0.98rem] md:text-base" : "text-base md:text-[1.05rem]"}`}>
                  {card.description}
                </p>
              </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-12 flex flex-wrap items-center justify-center gap-3" delayMs={180}>
          <Button
            variant="dark"
            size="lg"
            className="h-11 rounded-xl border-0 bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            onClick={() => setIsConsultOpen(true)}
          >
            {copy.primaryCta}
          </Button>
        </Reveal>

        {isConsultOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
            <div className="w-full max-w-xl rounded-2xl bg-white p-5 md:p-6">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className={`${paperlogy.className} text-2xl font-black tracking-[-0.02em] text-[#0B1227] md:text-3xl`}>{labels.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{labels.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseConsultModal}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
                  aria-label={labels.close}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {isSubmitted ? (
                <div className="rounded-xl bg-slate-50 p-5 text-center">
                  <p className="text-xl font-black text-[#0B1227]">{labels.doneTitle}</p>
                  <p className="mt-2 text-sm text-slate-600">{labels.doneBody}</p>
                  <Button
                    variant="dark"
                    size="lg"
                    className="mt-4 h-11 rounded-xl border-0 bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    onClick={handleCloseConsultModal}
                  >
                    {labels.close}
                  </Button>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleSubmitConsultation}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700">{labels.company}</span>
                      <input
                        required
                        value={form.companyName}
                        onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700">{labels.name}</span>
                      <input
                        required
                        value={form.contactName}
                        onChange={(event) => setForm((prev) => ({ ...prev, contactName: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700">{labels.email}</span>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1.5 block font-medium text-slate-700">{labels.phone}</span>
                      <input
                        value={form.phone}
                        onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-slate-300"
                      />
                    </label>
                  </div>
                  <label className="mt-1 block text-sm">
                    <span className="mb-1.5 block font-medium text-slate-700">{labels.message}</span>
                    <textarea
                      rows={5}
                      required
                      value={form.message}
                      onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                      placeholder={labels.placeholderMessage}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-300"
                    />
                  </label>
                  {submitError ? <p className="text-sm text-rose-600">{submitError}</p> : null}
                  <div className="mt-4 flex justify-end gap-2">
                    <Button type="button" variant="ghost" className="h-11 rounded-xl px-4 text-sm font-medium text-slate-700" onClick={handleCloseConsultModal}>
                      {labels.cancel}
                    </Button>
                    <Button
                      type="submit"
                      variant="dark"
                      size="lg"
                      disabled={isSubmitting}
                      className="h-11 rounded-xl border-0 bg-[#b7ff5a] px-4 text-sm font-semibold text-[#111111] transition-colors hover:bg-[#a8ee4d] focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    >
                      {isSubmitting ? labels.submitting : labels.submit}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
};
