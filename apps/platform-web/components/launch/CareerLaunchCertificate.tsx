"use client";

// Career Launch 수료증 — 4주 과정을 완주한 학생에게 발급. 인쇄/PDF 저장 지원.
// 완주(모든 스텝 완료) 전에는 안내만 노출한다.
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Printer, ArrowLeft, SealCheck } from "@phosphor-icons/react";
import { WEEKS } from "../../lib/launch/data";
import { fetchProgress, type CareerProgress } from "../../lib/launch/progress-client";
import { fetchMyEnrollment } from "../../lib/launch/enrollment-client";
import { weekDoneCount } from "../../lib/launch/step-status";
import { fetchResumeData } from "../../lib/launch/resume-data";
import { fetchCoverData } from "../../lib/launch/cover-data";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

export function CareerLaunchCertificate() {
  const t = useLaunchT();
  const { user } = useAuthSession();
  const [progress, setProgress] = useState<CareerProgress | null>(null);
  const [resume, setResume] = useState<Record<string, unknown>>({});
  const [cover, setCover] = useState<Record<string, unknown>>({});
  const [cohort, setCohort] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [issuedDate, setIssuedDate] = useState(""); // 클라 마운트 후 채워 하이드레이션 불일치 방지

  useEffect(() => {
    let alive = true;
    void Promise.allSettled([fetchProgress(), fetchResumeData(), fetchCoverData(), fetchMyEnrollment()]).then((r) => {
      if (!alive) return;
      if (r[0].status === "fulfilled") setProgress(r[0].value);
      if (r[1].status === "fulfilled") setResume(r[1].value.data as Record<string, unknown>);
      if (r[2].status === "fulfilled") setCover(r[2].value.data as Record<string, unknown>);
      if (r[3].status === "fulfilled") {
        const c = r[3].value.cohorts?.[0];
        setCohort(c ? [c.university, c.name].filter(Boolean).join(" · ") : "");
      }
      setLoading(false);
    });
    const now = new Date();
    setIssuedDate(`${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}.`);
    return () => { alive = false; };
  }, []);

  const name = user?.name?.trim() || user?.email || t("수료생", "Graduate", "结业者", "Học viên", "修了生", "Lulusan");
  const data = { progress: progress ?? {}, resume: resume as never, cover: cover as never };
  const totalSteps = WEEKS.reduce((n, w) => n + w.steps.length, 0);
  const doneSteps = WEEKS.reduce((n, w) => n + weekDoneCount(w.steps, data), 0);
  const completed = totalSteps > 0 && doneSteps >= totalSteps;

  const init = progress?.diagnosisInitial?.percent;
  const fin = progress?.diagnosisFinal?.percent ?? progress?.diagnosis?.percent;
  const showGrowth = typeof init === "number" && typeof fin === "number" && fin >= init;

  if (loading) {
    return <div className="flex min-h-[60vh] items-center justify-center text-[13.5px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>;
  }

  if (!completed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-[440px] flex-col items-center justify-center px-6 text-center">
        <span className="text-[40px]" aria-hidden>🎓</span>
        <p className="mt-3 text-[17px] font-black text-[#0B1227]">{t("아직 완주 전이에요", "Not finished yet", "尚未完成", "Chưa hoàn thành", "まだ完走前です", "Belum selesai")}</p>
        <p className="mt-1.5 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{t(`4주 과정을 모두 마치면 수료증이 발급돼요. (지금 ${doneSteps}/${totalSteps} 완료)`, `Finish all 4 weeks to get your certificate. (${doneSteps}/${totalSteps} done)`, `完成全部4周后可获得结业证书。（${doneSteps}/${totalSteps}）`, `Hoàn thành 4 tuần để nhận chứng chỉ. (${doneSteps}/${totalSteps})`, `4週間をすべて終えると修了証が発行されます。（${doneSteps}/${totalSteps}）`, `Selesaikan 4 minggu untuk sertifikat. (${doneSteps}/${totalSteps})`)}</p>
        <Link href="/career-launch/dashboard" className="mt-5 inline-flex h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#0B46E8] px-5 text-[14px] font-bold text-white transition hover:bg-[#0A3ECB]">
          <ArrowLeft className="h-4 w-4" weight="bold" /> {t("대시보드로", "Back to dashboard", "返回主页", "Về bảng điều khiển", "ダッシュボードへ", "Ke dashboard")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 py-8">
      {/* 액션 (인쇄 시 숨김) */}
      <div className="no-print mb-5 flex items-center justify-between gap-2">
        <Link href="/career-launch/dashboard" className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[13px] font-bold text-[#4E5968] transition hover:bg-[#F2F4F6]">
          <ArrowLeft className="h-4 w-4" weight="bold" /> {t("대시보드", "Dashboard", "主页", "Bảng điều khiển", "ダッシュボード", "Dashboard")}
        </Link>
        <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]">
          <Printer className="h-4 w-4" weight="fill" /> {t("인쇄 · PDF 저장", "Print · Save PDF", "打印 · 保存PDF", "In · Lưu PDF", "印刷 · PDF保存", "Cetak · Simpan PDF")}
        </button>
      </div>

      {/* 수료증 본체 */}
      <div className="cert relative overflow-hidden rounded-3xl border border-[#E7ECF3] bg-white px-8 py-12 text-center shadow-[0_10px_40px_-16px_rgba(11,18,39,0.2)] sm:px-14">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#0B46E8] to-[#6C4DFF]" />
        <div className="flex items-center justify-center gap-2">
          <Image src="/img_logo.webp" alt="" width={64} height={22} className="h-5 w-auto" />
          <span className="rounded-md bg-[#EDF1FD] px-2 py-0.5 text-[10.5px] font-black tracking-[0.08em] text-[#0B46E8]">CAREER LAUNCH</span>
        </div>

        <p className="mt-8 text-[12px] font-bold uppercase tracking-[0.22em] text-[#8B95A1]">Certificate of Completion</p>
        <h1 className="mt-2 text-[30px] font-black tracking-[-0.03em] text-[#0B1227]">{t("수료증", "Certificate", "结业证书", "Chứng chỉ", "修了証", "Sertifikat")}</h1>

        <p className="mx-auto mt-8 max-w-[420px] break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
          {t("아래 수료생은 Career Launch 4주 취업 준비 과정을 성실히 이수하였기에 이 증서를 드립니다.", "The graduate below has diligently completed the 4-week Career Launch program.", "以下结业者已认真完成 Career Launch 四周求职准备课程。", "Học viên dưới đây đã hoàn thành nghiêm túc chương trình Career Launch 4 tuần.", "下記の修了生はCareer Launch 4週間の就職準備課程を誠実に修了しました。", "Lulusan berikut telah menyelesaikan program Career Launch 4 minggu dengan tekun.")}
        </p>

        <p className="mt-7 inline-flex items-center gap-1.5 text-[26px] font-black tracking-[-0.02em] text-[#0B1227]">
          <SealCheck className="h-6 w-6 text-[#0B46E8]" weight="fill" /> {name}
        </p>
        {cohort ? <p className="mt-1 text-[13px] font-semibold text-[#8B95A1]">{cohort}</p> : null}

        {/* 성취 요약 */}
        <div className="mx-auto mt-8 flex max-w-[420px] flex-wrap items-center justify-center gap-x-8 gap-y-3">
          <div>
            <p className="text-[22px] font-black text-[#0B46E8]">{doneSteps}/{totalSteps}</p>
            <p className="mt-0.5 text-[11px] font-bold text-[#8B95A1]">{t("완료 미션", "Missions done", "完成任务", "Nhiệm vụ", "達成ミッション", "Misi selesai")}</p>
          </div>
          {showGrowth ? (
            <div>
              <p className="text-[22px] font-black text-[#0A9B59]">{init}% → {fin}%</p>
              <p className="mt-0.5 text-[11px] font-bold text-[#8B95A1]">{t("취업 준비도 향상", "Readiness growth", "求职准备度提升", "Mức sẵn sàng tăng", "準備度の向上", "Kenaikan kesiapan")}</p>
            </div>
          ) : null}
        </div>

        {/* 4주 여정 */}
        <div className="mx-auto mt-8 grid max-w-[460px] grid-cols-2 gap-2 sm:grid-cols-4">
          {WEEKS.map((w) => (
            <div key={w.week} className="rounded-xl bg-[#F7F9FC] px-2 py-2.5">
              <p className="text-[10.5px] font-black text-[#0B46E8]">WEEK {w.week}</p>
              <p className="mt-0.5 break-keep text-[10.5px] font-semibold leading-tight text-[#4E5968]">{w.title}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-end justify-between gap-4 border-t border-[#F2F4F6] pt-5 text-left">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[#B0B8C1]">{t("발급일", "Issued", "签发日期", "Ngày cấp", "発行日", "Diterbitkan")}</p>
            <p className="mt-0.5 text-[13px] font-bold text-[#4E5968]" suppressHydrationWarning>{issuedDate}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-black text-[#0B1227]">Aply</p>
            <p className="text-[10.5px] font-semibold text-[#8B95A1]">flip-ers</p>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
          .cert { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
