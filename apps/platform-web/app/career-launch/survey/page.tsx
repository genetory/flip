"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleNotch } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { readAccessToken } from "../../../lib/auth-client";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

type Data = {
  certificate: { certificateNo: string; issuedAt: string } | null;
  outcome: { status: string; companyName: string; positionTitle: string | null } | null;
};

type SurveyStatus = "SEARCHING" | "INTERVIEW" | "OFFER" | "HIRED";

const OPTIONS: { value: SurveyStatus; needsCompany: boolean }[] = [
  { value: "SEARCHING", needsCompany: false },
  { value: "INTERVIEW", needsCompany: true },
  { value: "OFFER", needsCompany: true },
  { value: "HIRED", needsCompany: true }
];

function statusLabel(t: PlatformT, value: SurveyStatus): string {
  switch (value) {
    case "SEARCHING":
      return t("아직 구직 중이에요", "Still job searching", "还在求职中", "Vẫn đang tìm việc", "まだ求職中です", "Masih mencari kerja");
    case "INTERVIEW":
      return t("면접 진행 중이에요", "Interviewing", "面试进行中", "Đang phỏng vấn", "面接中です", "Sedang wawancara");
    case "OFFER":
      return t("합격/오퍼를 받았어요", "Got an offer", "已收到录用/offer", "Đã nhận offer", "合格・オファーを受けました", "Sudah dapat offer");
    case "HIRED":
      return t("입사했어요", "Started the job", "已入职", "Đã vào làm", "入社しました", "Sudah bergabung");
  }
}

export default function CareerSurveyPage() {
  const { isReady, isAuthenticated } = useAuthSession();
  const t = usePlatformT();
  const [data, setData] = useState<Data | null>(null);
  const [status, setStatus] = useState<SurveyStatus>("SEARCHING");
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    void (async () => {
      try {
        const token = readAccessToken();
        const res = await fetch(`${apiBase()}/career-launch/me/employment-status`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: "no-store"
        });
        if (res.status === 403) {
          setError(t("Career Launch 참여자만 이용할 수 있어요.", "Only Career Launch participants can use this.", "仅限 Career Launch 参与者使用。", "Chỉ người tham gia Career Launch mới dùng được.", "Career Launch参加者のみ利用できます。", "Hanya peserta Career Launch yang bisa menggunakan ini."));
          return;
        }
        const payload = (await res.json()) as { ok?: boolean } & Data;
        if (payload.ok) {
          setData(payload);
          if (payload.outcome) {
            const st = payload.outcome.status;
            const mapped: SurveyStatus = st === "HIRED" ? "HIRED" : st === "OFFER" ? "OFFER" : st === "INTERVIEW" ? "INTERVIEW" : "SEARCHING";
            setStatus(mapped);
            if (payload.outcome.companyName && payload.outcome.companyName !== "구직 중") setCompany(payload.outcome.companyName);
            if (payload.outcome.positionTitle) setPosition(payload.outcome.positionTitle);
          }
        }
      } catch {
        setError(t("불러오지 못했어요.", "Couldn't load.", "加载失败。", "Không thể tải.", "読み込めませんでした。", "Gagal memuat."));
      } finally {
        setLoading(false);
      }
    })();
  }, [isReady, isAuthenticated]);

  const needsCompany = OPTIONS.find((o) => o.value === status)?.needsCompany ?? false;

  async function submit() {
    if (needsCompany && !company.trim()) {
      setError(t("회사명을 입력해 주세요.", "Please enter the company name.", "请输入公司名称。", "Vui lòng nhập tên công ty.", "会社名を入力してください。", "Masukkan nama perusahaan."));
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const token = readAccessToken();
      const res = await fetch(`${apiBase()}/career-launch/me/employment-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ status, companyName: company.trim() || undefined, positionTitle: position.trim() || undefined })
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError(t("저장에 실패했어요. 다시 시도해 주세요.", "Failed to save. Please try again.", "保存失败，请重试。", "Lưu thất bại. Vui lòng thử lại.", "保存に失敗しました。もう一度お試しください。", "Gagal menyimpan. Silakan coba lagi."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="isolate flex min-h-screen flex-col bg-[#F2F4F6]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 py-10 md:py-14">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">← {t("대시보드", "Dashboard", "仪表板", "Bảng điều khiển", "ダッシュボード", "Dasbor")}</Link>
          <h1 className="mt-4 text-[26px] font-extrabold tracking-tight text-[#191F28]">{t("취업 성과 설문", "Employment outcome survey", "就业成果调查", "Khảo sát kết quả việc làm", "就職成果アンケート", "Survei hasil kerja")}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#4E5968]">
            {t("프로그램 이후 취업 진행 상황을 알려주세요. 여러분의 성과는 프로그램을 더 좋게 만드는 데 쓰입니다.", "Let us know how your job search is going after the program. Your outcomes help make the program better.", "请告诉我们项目结束后的求职进展。您的成果将帮助我们改进项目。", "Hãy cho chúng tôi biết tiến trình tìm việc sau chương trình. Kết quả của bạn giúp cải thiện chương trình.", "プログラム後の就職状況を教えてください。皆さんの成果はプログラムの改善に活用されます。", "Beri tahu kami perkembangan pencarian kerja Anda setelah program. Hasil Anda membantu meningkatkan program.")}
          </p>

          {loading ? (
            <div className="mt-6 flex items-center gap-2 rounded-2xl bg-white p-5 text-[14px] text-[#8B95A1] shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.05)]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
          ) : error && !data ? (
            <div className="mt-6 rounded-2xl bg-white p-5 text-[14px] text-[#e5484d] shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.05)]">{error}</div>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_4px_16px_rgba(0,0,0,.05)]">
                <p className="text-[15px] font-bold text-[#191F28]">{t("현재 취업 상태", "Current employment status", "当前就业状态", "Tình trạng việc làm hiện tại", "現在の就職状況", "Status kerja saat ini")}</p>
                <div className="mt-3 flex flex-col gap-2">
                  {OPTIONS.map((o) => (
                    <label key={o.value} className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3.5 py-3 text-[14px] font-semibold transition ${status === o.value ? "bg-[#e8f2fe] text-[#1b64da]" : "bg-[#f7f8fa] text-[#4E5968] hover:bg-[#eef0f3]"}`}>
                      <input type="radio" name="status" checked={status === o.value} onChange={() => setStatus(o.value)} className="accent-[#3182f6]" />
                      {statusLabel(t, o.value)}
                    </label>
                  ))}
                </div>

                {needsCompany ? (
                  <div className="mt-4 flex flex-col gap-3">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-bold text-[#8B95A1]">{t("회사명", "Company name", "公司名称", "Tên công ty", "会社名", "Nama perusahaan")}</span>
                      <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t("예: 플리퍼스", "e.g. Flipers", "例：Flipers", "vd: Flipers", "例：Flipers", "mis. Flipers")} className="rounded-xl bg-[#f7f8fa] px-3.5 py-2.5 text-[14px] outline-none placeholder:text-[#B0B8C1]" />
                    </label>
                    <label className="flex flex-col gap-1.5">
                      <span className="text-[12px] font-bold text-[#8B95A1]">{t("직무 (선택)", "Role (optional)", "职务（选填）", "Vị trí (tùy chọn)", "職務（任意）", "Peran (opsional)")}</span>
                      <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder={t("예: 마케팅", "e.g. Marketing", "例：市场营销", "vd: Marketing", "例：マーケティング", "mis. Marketing")} className="rounded-xl bg-[#f7f8fa] px-3.5 py-2.5 text-[14px] outline-none placeholder:text-[#B0B8C1]" />
                    </label>
                  </div>
                ) : null}

                {error ? <p className="mt-3 text-[12.5px] font-semibold text-[#e5484d]">{error}</p> : null}
                {saved ? <p className="mt-3 text-[12.5px] font-semibold text-[#3182f6]">{t("제출되었습니다. 감사합니다!", "Submitted. Thank you!", "已提交，谢谢！", "Đã gửi. Cảm ơn bạn!", "送信されました。ありがとうございます！", "Terkirim. Terima kasih!")}</p> : null}

                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={saving}
                  className="mt-5 w-full rounded-xl bg-[#3182f6] px-4 py-3 text-[14px] font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {saving ? t("저장 중…", "Saving…", "保存中…", "Đang lưu…", "保存中…", "Menyimpan…") : t("제출하기", "Submit", "提交", "Gửi", "送信する", "Kirim")}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
