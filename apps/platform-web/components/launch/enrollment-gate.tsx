"use client";

import { useEffect, useState } from "react";
import { fetchMyEnrollment, enrollByCode } from "../../lib/launch/enrollment-client";
import { trackCareerEnroll } from "../../lib/analytics";
import { Header } from "../site/Header";
import { Footer } from "../site/Footer";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

// Career Launch 접근 게이트 — 기수에 등록된 학생(또는 운영자)만 통과. 아니면 초대코드 입력 안내.
export function EnrollmentGate({ children }: { children: React.ReactNode }) {
  const t = useLaunchT();
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
      setErr(e instanceof Error ? e.message : t("등록에 실패했어요.", "Enrollment failed.", "注册失败。", "Đăng ký thất bại.", "登録に失敗しました。", "Pendaftaran gagal."));
    } finally {
      setBusy(false);
    }
  };

  if (state === "ok") return <>{children}</>;
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <span className="text-[13px] text-[#8B95A1]">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
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
            <h1 className="mt-2 text-[19px] font-black text-[#0B1227]">{t("아직 등록되지 않았어요", "You're not enrolled yet", "您还未注册", "Bạn chưa đăng ký", "まだ登録されていません", "Anda belum terdaftar")}</h1>
            <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">
              {t(
                "Career Launch는 대학·기수별로 운영돼요. 발급받은 초대코드를 입력하거나, 운영자에게 등록을 문의해 주세요.",
                "Career Launch runs by university and cohort. Enter your invitation code, or ask an administrator to enroll you.",
                "Career Launch 按大学和期次运营。请输入您收到的邀请码，或联系运营人员进行注册。",
                "Career Launch được vận hành theo trường đại học và khóa. Hãy nhập mã mời của bạn hoặc liên hệ quản trị viên để đăng ký.",
                "Career Launch は大学・期ごとに運営されています。発行された招待コードを入力するか、運営者に登録をお問い合わせください。",
                "Career Launch dijalankan per universitas dan angkatan. Masukkan kode undangan Anda, atau hubungi admin untuk mendaftar."
              )}
            </p>
            <form onSubmit={submit} className="mt-5 space-y-2 text-left">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t("초대코드 (예: AB2C9D)", "Invitation code (e.g. AB2C9D)", "邀请码（例：AB2C9D）", "Mã mời (ví dụ: AB2C9D)", "招待コード（例：AB2C9D）", "Kode undangan (mis. AB2C9D)")}
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
                {busy
                  ? t("등록 중…", "Enrolling…", "注册中…", "Đang đăng ký…", "登録中…", "Mendaftar…")
                  : t("등록하기", "Enroll", "注册", "Đăng ký", "登録する", "Daftar")}
              </button>
            </form>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
