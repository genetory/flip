"use client";

// Week 2 — Recruiter 10 Second Test. 채용담당자가 이력서를 10초 훑은 첫인상. "받기" 캐시.
import { useEffect, useState } from "react";
import { Sparkle, CircleNotch, Timer } from "@phosphor-icons/react";
import { fetchRecruiter10s, type Recruiter10s } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

export function Recruiter10sCard() {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [r, setR] = useState<Recruiter10s | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const res = await fetchRecruiter10s({ generate: false });
        if (!alive) return;
        if (res.unavailable) return setState("none");
        if (res.result) {
          setR(res.result);
          setStale(res.stale);
          setState("done");
        } else if (res.needsGenerate) setState("ready");
        else setState("none");
      } catch {
        if (alive) setState("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const run = async (force: boolean) => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const res = await fetchRecruiter10s({ generate: true, force });
      if (res.result) {
        setR(res.result);
        setStale(false);
        setState("done");
      } else setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (state === "none" || state === "loading") return null;

  return (
    <Card className="md:!p-6">
      <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]"><Timer className="h-4 w-4" weight="fill" /> {t("채용담당자 10초 테스트", "Recruiter 10-second test", "招聘官10秒测试", "Kiểm tra 10 giây của NTD", "採用担当10秒テスト", "Tes 10 detik perekrut")}</p>

      {state === "ready" ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>⏱️</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("10초만에 어떤 인상을 줄까요?", "What impression in 10 seconds?", "10秒内会给人什么印象？", "Ấn tượng gì trong 10 giây?", "10秒でどんな印象？", "Kesan apa dalam 10 detik?")}</p>
          <p className="mx-auto mt-1 max-w-[420px] break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("채용담당자가 이력서를 10초 훑었을 때의 솔직한 첫인상을 받아봐요.", "Get a recruiter's honest first impression after a 10-second skim.", "获取招聘官10秒速览后的真实第一印象。", "Nhận ấn tượng đầu tiên thật lòng của NTD sau 10 giây.", "採用担当が10秒見た正直な第一印象を受け取りましょう。", "Dapatkan kesan pertama jujur perekrut setelah 10 detik.")}</p>
          <button type="button" onClick={() => run(false)} disabled={busy} className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60">
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("훑어보는 중…", "Skimming…", "浏览中…", "Đang lướt…", "確認中…", "Meninjau…") : t("10초 테스트 받기", "Run 10-second test", "进行10秒测试", "Chạy test 10 giây", "10秒テストを受ける", "Jalankan tes 10 detik")}
          </button>
          {failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi.")}</p> : null}
        </div>
      ) : null}

      {state === "done" && r ? (
        <div className="mt-4 flex flex-col gap-3">
          {stale ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("이력서가 바뀌었어요. 다시 받아 갱신할 수 있어요.", "Your resume changed. Refresh to update.", "简历已更新，可重新获取。", "Hồ sơ đã đổi. Nhận lại để cập nhật.", "履歴書が変わりました。再取得で更新できます。", "Resume berubah. Ambil ulang.")}</span>
              <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">{busy ? "…" : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}</button>
            </div>
          ) : null}
          <div className="rounded-2xl bg-[#F8FAFF] p-4">
            <p className="text-[11.5px] font-bold text-[#8B95A1]">{t("어떤 사람으로 기억되나요", "Remembered as", "被记住的形象", "Được nhớ đến là", "どんな人として記憶", "Diingat sebagai")}</p>
            <p className="mt-1 break-keep text-[14px] font-bold leading-relaxed text-[#0B1227]">“{r.impression}”</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#EEF1F5] p-4">
              <p className="text-[11.5px] font-bold text-[#0A9B59]">👀 {t("가장 눈에 든 경험", "Standout experience", "最亮眼的经验", "Kinh nghiệm nổi bật", "目に留まった経験", "Pengalaman menonjol")}</p>
              <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#333D4B]">{r.standout}</p>
            </div>
            <div className="rounded-2xl border border-[#EEF1F5] p-4">
              <p className={`text-[11.5px] font-bold ${r.roleClear ? "text-[#0A9B59]" : "text-[#C77700]"}`}>{r.roleClear ? "✅" : "⚠️"} {t("지원 직무가 명확한가요", "Is the target role clear?", "目标职务清晰吗", "Nghề mục tiêu rõ chưa?", "志望職種は明確？", "Peran jelas?")}</p>
              <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#333D4B]">{r.roleNote}</p>
            </div>
          </div>
          {r.unclear.length > 0 ? (
            <div className="rounded-2xl border border-[#EEF1F5] p-4">
              <p className="text-[11.5px] font-bold text-[#C77700]">🤔 {t("애매하게 느껴진 부분", "Unclear parts", "含糊的地方", "Phần chưa rõ", "曖昧に感じた点", "Bagian kabur")}</p>
              <ul className="mt-1 space-y-0.5">{r.unclear.map((s, i) => <li key={i} className="break-keep text-[12.5px] leading-relaxed text-[#333D4B]">· {s}</li>)}</ul>
            </div>
          ) : null}
          {r.wantToAsk.length > 0 ? (
            <div className="rounded-2xl bg-[#0B1227] p-4 text-white">
              <p className="text-[11.5px] font-bold text-[#8FB0FF]">💬 {t("면접에서 물어보고 싶은 것", "Would ask in interview", "面试想问的", "Muốn hỏi khi phỏng vấn", "面接で聞きたいこと", "Ingin ditanyakan saat wawancara")}</p>
              <ul className="mt-1 space-y-0.5">{r.wantToAsk.map((s, i) => <li key={i} className="break-keep text-[12.5px] leading-relaxed text-[#E5E9F0]">· {s}</li>)}</ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {state === "error" ? <p className="mt-3 text-[13px] text-[#8B95A1]">{t("불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load. Please try again.", "无法加载，请稍后再试。", "Không thể tải. Vui lòng thử lại.", "読み込めませんでした。", "Tidak dapat memuat.")}</p> : null}
    </Card>
  );
}
