"use client";

// Week 1 키스톤 — Career Report. 진단·선정직무·프로필을 종합한 점수화 리포트.
// 자동 생성/과금하지 않고, 저장분이 있으면 보여주고 없으면 '받기' 버튼으로 사용자가 요청할 때만 생성.
import { useEffect, useState } from "react";
import { Sparkle, CircleNotch, Target, TrendUp, Warning, MapTrifold } from "@phosphor-icons/react";
import { fetchCareerReport, type CareerReport } from "../../lib/launch/feedback-client";
import { Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;

function areaLabels(t: LaunchT): { key: keyof CareerReport["areas"]; label: string }[] {
  return [
    { key: "direction", label: t("직무 방향", "Career direction", "职业方向", "Định hướng nghề", "職務の方向", "Arah karier") },
    { key: "experience", label: t("경험", "Experience", "经验", "Kinh nghiệm", "経験", "Pengalaman") },
    { key: "competency", label: t("직무 역량", "Job competency", "职务能力", "Năng lực nghề", "職務力", "Kompetensi") },
    { key: "resume", label: t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume") },
    { key: "cover", label: t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran") },
    { key: "interview", label: t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị PV", "面接準備", "Persiapan wawancara") }
  ];
}

function scoreColor(v: number): string {
  if (v >= 75) return "bg-[#0A9B59]";
  if (v >= 50) return "bg-[#0B46E8]";
  return "bg-[#F5A524]";
}

export function CareerReportCard() {
  const t = useLaunchT();
  const [state, setState] = useState<"loading" | "ready" | "done" | "none" | "error">("loading");
  const [report, setReport] = useState<CareerReport | null>(null);
  const [stale, setStale] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const r = await fetchCareerReport({ generate: false });
        if (!alive) return;
        if (r.report) {
          setReport(r.report);
          setStale(r.stale);
          setState("done");
        } else if (r.needsGenerate) {
          setState("ready");
        } else {
          setState("none"); // 진단 전 → 숨김
        }
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
      const r = await fetchCareerReport({ force, generate: true });
      if (r.report) {
        setReport(r.report);
        setStale(false);
        setState("done");
      } else {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  if (state === "none" || state === "loading") return null; // 진단 전이거나 로딩 중엔 숨김

  return (
    <Card className="md:!p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#0B46E8]">Career Report</p>
        {state === "done" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[11px] font-bold text-[#0B46E8]">
            <Target className="h-3.5 w-3.5" weight="fill" /> CAREER DIRECTION READY
          </span>
        ) : null}
      </div>

      {state === "ready" ? (
        <div className="mt-3 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2F4F6] text-[22px]" aria-hidden>🎯</span>
          <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("나의 Career Report를 받아보세요", "Get your Career Report", "领取你的职业报告", "Nhận Career Report của bạn", "あなたのCareer Reportを受け取りましょう", "Dapatkan Career Report-mu")}</p>
          <p className="mx-auto mt-1 max-w-[420px] break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("진단·선정 직무를 종합해 Career Score(6영역)·강점·로드맵을 정리해드려요.", "We combine your diagnosis and chosen roles into a Career Score, strengths, and a roadmap.", "综合你的诊断与所选职务，为你整理职业分数、优势与路线图。", "Kết hợp chẩn đoán và nghề đã chọn thành Career Score, điểm mạnh và lộ trình.", "診断と選定職種を統合してCareer Score・強み・ロードマップを整理します。", "Menggabungkan diagnosis dan peran pilihanmu menjadi Career Score, kelebihan, dan roadmap.")}</p>
          <button
            type="button"
            onClick={() => run(false)}
            disabled={busy}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#191F28] px-5 py-2.5 text-[14px] font-bold text-white transition hover:bg-[#0B1227] disabled:opacity-60"
          >
            {busy ? <CircleNotch className="h-4 w-4 animate-spin" weight="bold" /> : <Sparkle className="h-4 w-4" weight="fill" />}
            {busy ? t("분석 중…", "Analyzing…", "分析中…", "Đang phân tích…", "分析中…", "Menganalisis…") : t("Career Report 받기", "Get Career Report", "获取职业报告", "Nhận Career Report", "Career Reportを受け取る", "Dapatkan Career Report")}
          </button>
          {failed ? <p className="mt-2 text-[12px] font-semibold text-[#F04452]">{t("잠시 문제가 생겼어요. 잠시 후 다시 시도해 주세요.", "Something went wrong. Please try again in a moment.", "出现了一点问题，请稍后再试。", "Đã xảy ra sự cố. Vui lòng thử lại sau.", "問題が発生しました。少し後にもう一度お試しください。", "Terjadi masalah. Silakan coba lagi.")}</p> : null}
        </div>
      ) : null}

      {state === "done" && report ? (
        <div className="mt-4 flex flex-col gap-5">
          {stale ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#FFF9EC] px-3 py-2">
              <span className="text-[12px] font-semibold text-[#B7791F]">{t("입력이 바뀌었어요. 다시 받아 최신으로 갱신할 수 있어요.", "Your inputs changed. Refresh to update.", "输入已更改，可重新获取以更新。", "Dữ liệu đã đổi. Nhận lại để cập nhật.", "入力が変わりました。再取得で更新できます。", "Input berubah. Ambil ulang untuk memperbarui.")}</span>
              <button type="button" onClick={() => run(true)} disabled={busy} className="rounded-lg bg-[#191F28] px-3 py-1.5 text-[12px] font-bold text-white disabled:opacity-60">
                {busy ? t("갱신 중…", "Refreshing…", "更新中…", "Đang cập nhật…", "更新中…", "Memperbarui…") : t("다시 받기", "Refresh", "重新获取", "Nhận lại", "再取得", "Ambil ulang")}
              </button>
            </div>
          ) : null}

          {/* Career Score */}
          <div className="rounded-2xl bg-[#F8FAFF] p-5 text-center">
            <p className="text-[12px] font-bold text-[#8B95A1]">Career Score</p>
            <p className="mt-1 text-[40px] font-black leading-none tracking-[-0.03em] text-[#0B1227]">{report.total}<span className="text-[18px] font-bold text-[#B0B8C1]"> / 100</span></p>
            {report.why ? <p className="mx-auto mt-3 max-w-[460px] break-keep text-[13px] leading-relaxed text-[#4E5968]">{report.why}</p> : null}
          </div>

          {/* 6영역 바 */}
          <div className="flex flex-col gap-2.5">
            {areaLabels(t).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-[12.5px] font-semibold text-[#4E5968]">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EEF1F5]">
                  <div className={`h-full rounded-full ${scoreColor(report.areas[key])}`} style={{ width: `${report.areas[key]}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-[12.5px] font-bold tabular-nums text-[#191F28]">{report.areas[key]}</span>
              </div>
            ))}
          </div>

          {/* 강점 / 부족한 역량 */}
          <div className="grid gap-3 sm:grid-cols-2">
            {report.strengths.length > 0 ? (
              <div className="rounded-2xl border border-[#EEF1F5] p-4">
                <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#0A9B59]"><TrendUp className="h-4 w-4" weight="bold" /> {t("내가 가진 강점", "Your strengths", "你的优势", "Điểm mạnh", "あなたの強み", "Kelebihanmu")}</p>
                <ul className="mt-2 space-y-1">
                  {report.strengths.map((s, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {s}</li>)}
                </ul>
              </div>
            ) : null}
            {report.gaps.length > 0 ? (
              <div className="rounded-2xl border border-[#EEF1F5] p-4">
                <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-[#C77700]"><Warning className="h-4 w-4" weight="bold" /> {t("보완할 역량", "To build", "需补强", "Cần bổ sung", "補うべき力", "Perlu diperkuat")}</p>
                <ul className="mt-2 space-y-1">
                  {report.gaps.map((s, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[#333D4B]">· {s}</li>)}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Career Roadmap */}
          <div className="rounded-2xl bg-[#0B1227] p-5 text-white">
            <p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.1em] text-[#8FB0FF]"><MapTrifold className="h-4 w-4" weight="fill" /> Career Roadmap</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {report.roadmap.targetRole ? (
                <div>
                  <p className="text-[11px] font-semibold text-[#9AA6BF]">{t("목표 직무", "Target role", "目标职务", "Nghề mục tiêu", "目標職務", "Peran target")}</p>
                  <p className="mt-0.5 text-[14px] font-bold">{report.roadmap.targetRole}</p>
                </div>
              ) : null}
              {report.roadmap.targetCompanies.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold text-[#9AA6BF]">{t("목표 기업", "Target companies", "目标企业", "Công ty mục tiêu", "目標企業", "Perusahaan target")}</p>
                  <p className="mt-0.5 text-[14px] font-bold">{report.roadmap.targetCompanies.join(" · ")}</p>
                </div>
              ) : null}
              {report.roadmap.recommendedExperience.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold text-[#9AA6BF]">{t("추천 경험", "Recommended experience", "推荐经验", "Kinh nghiệm gợi ý", "推奨経験", "Pengalaman disarankan")}</p>
                  <ul className="mt-0.5 space-y-0.5">{report.roadmap.recommendedExperience.map((s, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[#E5E9F0]">· {s}</li>)}</ul>
                </div>
              ) : null}
              {report.roadmap.toImprove.length > 0 ? (
                <div>
                  <p className="text-[11px] font-semibold text-[#9AA6BF]">{t("보완할 것", "To improve", "需补强", "Cần cải thiện", "補うこと", "Perlu diperbaiki")}</p>
                  <ul className="mt-0.5 space-y-0.5">{report.roadmap.toImprove.map((s, i) => <li key={i} className="break-keep text-[13px] leading-relaxed text-[#E5E9F0]">· {s}</li>)}</ul>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <p className="mt-3 text-[13px] text-[#8B95A1]">{t("리포트를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.", "Couldn't load the report. Please try again in a moment.", "无法加载报告，请稍后再试。", "Không thể tải báo cáo. Vui lòng thử lại.", "レポートを読み込めませんでした。少し後に再試行してください。", "Tidak dapat memuat laporan. Silakan coba lagi.")}</p>
      ) : null}
    </Card>
  );
}
