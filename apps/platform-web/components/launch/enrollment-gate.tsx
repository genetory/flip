"use client";

import { useEffect, useState } from "react";
import { GraduationCap, ArrowRight, CircleNotch } from "@phosphor-icons/react";
import { fetchMyEnrollment, enrollByCode } from "../../lib/launch/enrollment-client";
import { trackCareerEnroll } from "../../lib/analytics";
import { CareerLaunchHeader } from "./CareerLaunchHeader";
import { CareerLaunchIntro } from "./CareerLaunchIntro";
import { AplyFooter } from "../AplyFooter";
import { Reveal } from "../site/Reveal";
import { useLaunchT } from "../../lib/launch/i18n";

// Career Launch 접근 게이트 — 기수에 등록된 학생(또는 운영자)만 통과. 아니면 초대코드 입력 안내.
export function EnrollmentGate({ children }: { children: React.ReactNode }) {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ok" | "gate">("loading");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const check = async (): Promise<boolean> => {
    try {
      return (await fetchMyEnrollment()).enrolled;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    void (async () => {
      if (await check()) {
        setState("ok");
        return;
      }
      // 초대 링크(?invite=CODE)로 들어오면 코드를 채우고 자동 등록 — 링크/QR 클릭 학생이
      // 코드를 직접 입력하지 않아도 바로 시작할 수 있게 한다(대학 랜딩·운영자 초대링크 공용).
      let invite = "";
      try {
        // URL 파라미터 우선, 없으면 로그인 전에 저장해둔 값(미로그인 초대링크→로그인 후 유지).
        invite = (new URLSearchParams(window.location.search).get("invite") ?? "").trim().toUpperCase();
        if (!invite) invite = (window.localStorage.getItem("cl_invite") ?? "").trim().toUpperCase();
      } catch {
        invite = "";
      }
      if (invite) {
        setCode(invite);
        setBusy(true);
        try {
          await enrollByCode(invite);
          trackCareerEnroll("code");
          try { window.localStorage.removeItem("cl_invite"); } catch { /* 무시 */ }
          if (await check()) {
            setState("ok");
            setBusy(false);
            return;
          }
        } catch (e) {
          setErr(e instanceof Error ? e.message : t("등록에 실패했어요.", "Enrollment failed.", "注册失败。", "Đăng ký thất bại.", "登録に失敗しました。", "Pendaftaran gagal."));
        }
        setBusy(false);
      }
      setState("gate");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (await check()) setState("ok"); // 성공 → 재확인 후 통과
    } catch (e) {
      setErr(e instanceof Error ? e.message : t("등록에 실패했어요.", "Enrollment failed.", "注册失败。", "Đăng ký thất bại.", "登録に失敗しました。", "Pendaftaran gagal."));
    } finally {
      setBusy(false);
    }
  };

  if (state === "ok") return <>{children}</>;
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="text-[15px] text-[color:var(--v2-faint)]">{t("불러오는 중...", "Loading...", "加载中...", "Đang tải...", "読み込み中...", "Memuat...")}</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-8 md:py-14">
          <Reveal>
            <div className="grid gap-6 md:grid-cols-2 md:items-start md:gap-10">
            <CareerLaunchIntro />
            <div className="rounded-3xl bg-[color:var(--v2-band)] p-6 md:p-8">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[color:var(--v2-accent)]">
                <GraduationCap className="h-7 w-7" weight="fill" />
              </span>
              <h1 className="mt-5 text-[24px] font-bold leading-[1.38] tracking-[-0.02em] text-[color:var(--v2-ink)]">{t("초대코드를 입력해주세요", "Enter your invitation code", "请输入邀请码", "Nhập mã mời của bạn", "招待コードを入力してください", "Masukkan kode undangan")}</h1>
              <p className="mt-2.5 break-keep text-[15px] leading-[1.6] text-[color:var(--v2-ink-3)]">
                {t(
                  "Career Launch는 대학·기수별로 운영돼요. 발급받은 초대코드를 입력하면 바로 시작할 수 있어요.",
                  "Career Launch runs by university and cohort. Enter the invitation code you received to get started.",
                  "Career Launch 按大学和期次运营。输入您收到的邀请码即可开始。",
                  "Career Launch được vận hành theo trường và khóa. Nhập mã mời bạn nhận được để bắt đầu.",
                  "Career Launch は大学・期ごとに運営されています。発行された招待コードを入力すればすぐ始められます。",
                  "Career Launch dijalankan per universitas dan angkatan. Masukkan kode undangan untuk memulai."
                )}
              </p>
              <form onSubmit={submit} className="mt-6 space-y-3">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t("초대코드", "Invitation code", "邀请码", "Mã mời", "招待コード", "Kode undangan")}
                  autoCapitalize="characters"
                  className="h-14 w-full rounded-2xl bg-white px-4 text-center text-[18px] font-bold tracking-[0.24em] text-[color:var(--v2-ink)] outline-none placeholder:text-[16px] placeholder:font-medium placeholder:tracking-normal placeholder:text-[color:var(--v2-faint)] focus:ring-2 focus:ring-[color:var(--v2-accent)]"
                />
                {err ? <p className="text-center text-[14px] font-semibold text-[color:var(--v2-attention)]">{err}</p> : null}
                <button
                  type="submit"
                  disabled={!code.trim() || busy}
                  className="inline-flex h-14 w-full items-center justify-center gap-1.5 rounded-xl bg-[color:var(--v2-accent)] text-[16px] font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                >
                  {busy ? (
                    <>
                      <CircleNotch className="h-4 w-4 animate-spin" weight="bold" />
                      {t("등록 중…", "Enrolling…", "注册中…", "Đang đăng ký…", "登録中…", "Mendaftar…")}
                    </>
                  ) : (
                    <>
                      {t("등록하고 시작하기", "Enroll and start", "注册并开始", "Đăng ký và bắt đầu", "登録して始める", "Daftar dan mulai")}
                      <ArrowRight className="h-4 w-4" weight="bold" />
                    </>
                  )}
                </button>
              </form>
              <p className="mt-4 break-keep text-center text-[13px] leading-[1.6] text-[color:var(--v2-faint)]">
                {t("코드가 없으신가요? 운영자에게 등록을 문의해 주세요.", "No code? Ask an administrator to enroll you.", "没有邀请码？请联系运营人员注册。", "Chưa có mã? Hãy liên hệ quản trị viên để đăng ký.", "コードがありませんか？運営者に登録をお問い合わせください。", "Tidak punya kode? Hubungi admin untuk mendaftar.")}
              </p>
            </div>
            </div>
          </Reveal>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
