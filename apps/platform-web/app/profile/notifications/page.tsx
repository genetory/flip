"use client";

import { useEffect, useState } from "react";
import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { readAccessToken } from "../../../lib/auth-client";
import { usePlatformT } from "../../../lib/i18n";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

export default function NotificationSettingsPage() {
  const { isReady, isAuthenticated } = useAuthSession();
  const t = usePlatformT();
  const [emailOn, setEmailOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(false);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    void (async () => {
      try {
        const token = readAccessToken();
        const res = await fetch(`${apiBase()}/members/me/notification-settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        const payload = (await res.json()) as { ok?: boolean; emailNotifications?: boolean };
        if (payload.ok) setEmailOn(payload.emailNotifications ?? true);
      } catch {
        // keep default
      } finally {
        setLoading(false);
      }
    })();
  }, [isReady, isAuthenticated]);

  async function update(next: boolean) {
    setEmailOn(next);
    setSaving(true);
    setSavedAt(false);
    try {
      const token = readAccessToken();
      await fetch(`${apiBase()}/members/me/notification-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ emailNotifications: next })
      });
      setSavedAt(true);
    } catch {
      setEmailOn(!next); // revert on failure
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F2F4F6]">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-5 py-10 md:py-14">
          <h1 className="text-[26px] font-extrabold tracking-tight text-[#191F28]">{t("알림 설정", "Notification settings", "通知设置", "Cài đặt thông báo", "通知設定", "Pengaturan notifikasi")}</h1>
          <p className="mt-2 text-[14px] text-[#4E5968]">{t("이메일 알림 수신 여부를 관리하세요. 서비스 내 알림은 계속 받습니다.", "Manage whether you receive email notifications. In-service notifications continue.", "管理是否接收邮件通知。服务内通知将继续接收。", "Quản lý việc nhận thông báo qua email. Thông báo trong dịch vụ vẫn tiếp tục.", "メール通知を受け取るかどうかを管理します。サービス内通知は引き続き受け取ります。", "Kelola apakah Anda menerima notifikasi email. Notifikasi dalam layanan tetap berlanjut.")}</p>

          <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.05)]">
            {loading ? (
              <p className="text-[14px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
            ) : (
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-[#191F28]">{t("이메일 알림", "Email notifications", "邮件通知", "Thông báo email", "メール通知", "Notifikasi email")}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#8B95A1]">
                    {t("지원·면접·과제·메시지 등 진행 알림을 이메일로 받습니다. 끄면 서비스 내 알림으로만 확인해요.", "Get progress alerts for applications, interviews, tasks, and messages by email. Turn off to see them only in-service.", "通过邮件接收申请、面试、任务、消息等进度提醒。关闭后仅在服务内查看。", "Nhận cảnh báo tiến trình về đơn ứng tuyển, phỏng vấn, nhiệm vụ và tin nhắn qua email. Tắt để chỉ xem trong dịch vụ.", "応募・面接・課題・メッセージなどの進捗通知をメールで受け取ります。オフにするとサービス内でのみ確認します。", "Terima peringatan progres lamaran, wawancara, tugas, dan pesan lewat email. Matikan untuk hanya melihatnya dalam layanan.")}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={emailOn}
                  disabled={saving}
                  onClick={() => void update(!emailOn)}
                  className={`relative h-7 w-12 flex-none rounded-full transition-colors ${emailOn ? "bg-[#3182f6]" : "bg-[#D1D6DB]"}`}
                >
                  <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${emailOn ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>
            )}
            {savedAt ? <p className="mt-4 text-[12.5px] font-semibold text-[#3182f6]">{t("저장되었습니다.", "Saved.", "已保存。", "Đã lưu.", "保存しました。", "Tersimpan.")}</p> : null}
          </div>

          <p className="mt-4 text-[12.5px] leading-relaxed text-[#8B95A1]">
            {t("※ 회원가입 인증 등 계정 보안에 필요한 메일은 이 설정과 무관하게 발송됩니다.", "※ Emails required for account security, such as sign-up verification, are sent regardless of this setting.", "※ 注册验证等账户安全所需的邮件将不受此设置影响发送。", "※ Email cần thiết cho bảo mật tài khoản, như xác minh đăng ký, được gửi bất kể cài đặt này.", "※ 会員登録認証などアカウントのセキュリティに必要なメールは、この設定に関係なく送信されます。", "※ Email yang diperlukan untuk keamanan akun, seperti verifikasi pendaftaran, dikirim terlepas dari pengaturan ini.")}
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
