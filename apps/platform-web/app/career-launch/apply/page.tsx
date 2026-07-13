"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, LaunchButton, SectionTitle } from "../../../components/launch/ui";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useLaunchT } from "../../../lib/launch/i18n";

const inputCls =
  "mt-1 w-full rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-3 text-[14px] text-[#191F28] placeholder:text-[#B0B8C1] focus:border-[#0B46E8] focus:outline-none";

// 2. 참가 신청폼 (MVP — 제출 시 완료 페이지로 이동)
export default function LaunchApplyPage() {
  const t = useLaunchT();
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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 pb-16">
      <div className="mx-auto w-full max-w-4xl px-5 pt-6 md:pt-10">
        <SectionTitle sub={t("선발 결과는 이메일로 안내됩니다", "Selection results will be sent by email", "选拔结果将通过电子邮件通知", "Kết quả tuyển chọn sẽ được thông báo qua email", "選考結果はメールでご案内します", "Hasil seleksi akan diberitahukan melalui email")}>{t("참가 신청", "Apply", "报名参加", "Đăng ký tham gia", "参加申請", "Daftar")}</SectionTitle>
        <form onSubmit={submit}>
          <Card className="space-y-4 md:!p-6">
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              {t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")} <span className="text-[#0B46E8]">*</span>
              <input className={inputCls} value={form.name} onChange={set("name")} placeholder="Nguyen Mai" />
            </label>
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              {t("이메일", "Email", "电子邮箱", "Email", "メールアドレス", "Email")} <span className="text-[#0B46E8]">*</span>
              <input className={inputCls} type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
            </label>
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              {t("연락처", "Phone", "联系方式", "Số điện thoại", "連絡先", "Nomor telepon")}
              <input className={inputCls} value={form.phone} onChange={set("phone")} placeholder="010-0000-0000" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-[12.5px] font-semibold text-[#4E5968]">
                {t("학교", "School", "学校", "Trường học", "学校", "Sekolah")} <span className="text-[#0B46E8]">*</span>
                <input className={inputCls} value={form.school} onChange={set("school")} placeholder={t("고려대학교", "Korea University", "高丽大学", "Đại học Korea", "高麗大学校", "Universitas Korea")} />
              </label>
              <label className="block text-[12.5px] font-semibold text-[#4E5968]">
                {t("전공", "Major", "专业", "Chuyên ngành", "専攻", "Jurusan")}
                <input className={inputCls} value={form.major} onChange={set("major")} placeholder={t("경영학", "Business Administration", "工商管理", "Quản trị kinh doanh", "経営学", "Manajemen Bisnis")} />
              </label>
            </div>
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              {t("비자 유형", "Visa type", "签证类型", "Loại visa", "ビザの種類", "Jenis visa")}
              <input className={inputCls} value={form.visa} onChange={set("visa")} placeholder={t("D-2, D-10 등", "e.g. D-2, D-10", "如 D-2、D-10 等", "ví dụ: D-2, D-10", "D-2、D-10 など", "mis. D-2, D-10")} />
            </label>
            <label className="block text-[12.5px] font-semibold text-[#4E5968]">
              {t("지원 동기", "Motivation", "申请动机", "Động lực ứng tuyển", "志望動機", "Motivasi")}
              <textarea className={`${inputCls} min-h-[96px] resize-none`} value={form.motivation} onChange={set("motivation")} placeholder={t("한국 취업을 준비하는 이유와 목표를 적어주세요.", "Tell us why you want to work in Korea and your goals.", "请写下你准备在韩国就业的原因和目标。", "Hãy cho biết lý do và mục tiêu khi bạn chuẩn bị xin việc tại Hàn Quốc.", "韓国での就職を準備する理由と目標を書いてください。", "Tuliskan alasan dan tujuanmu mempersiapkan kerja di Korea.")} />
            </label>
          </Card>

          <div className="mt-5">
            <LaunchButton type="submit" variant="primary" full>
              {submitting ? t("제출 중...", "Submitting...", "提交中...", "Đang gửi...", "送信中...", "Mengirim...") : t("신청서 제출하기", "Submit application", "提交申请", "Gửi đơn đăng ký", "申請書を提出する", "Kirim pendaftaran")}
            </LaunchButton>
            {!canSubmit ? <p className="mt-2 text-center text-[12px] text-[#8B95A1]">{t("이름·이메일·학교는 필수입니다.", "Name, email and school are required.", "姓名、电子邮箱和学校为必填项。", "Họ tên, email và trường học là bắt buộc.", "氏名・メール・学校は必須です。", "Nama, email, dan sekolah wajib diisi.")}</p> : null}
          </div>
        </form>
      </div>
      </main>
      <Footer />
    </div>
  );
}
