"use client";

// UX Phase 5 — 나의 결과물 허브. 파일 목록이 아니라 취업 준비 흐름(방향/지원 패키지/면접 준비)으로 그룹화.
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, WarningCircle, Circle, FileText } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { DashboardSection, EmptyState, ErrorState, CardSkeleton } from "../../../components/launch/dashboard-states";
import { fetchArtifacts, type ArtifactHubVM, type ArtifactItem } from "../../../lib/launch/hub-client";
import { trackCareerFunnel } from "../../../lib/analytics";
import { useLaunchT } from "../../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;

const STATUS_TONE: Record<string, string> = { finalized: "text-[#0B46E8]", needs_confirmation: "text-[#C77700]", in_progress: "text-[#4E5968]", draft: "text-[#6339E5]", improvable: "text-[#1B64DA]", not_started: "text-[#B0B8C1]", archived: "text-[#8B95A1]" };
const StatusIcon = ({ s }: { s: string }) => (s === "finalized" ? <CheckCircle size={18} weight="fill" className="text-[#0B46E8]" /> : s === "needs_confirmation" ? <WarningCircle size={18} weight="fill" className="text-[#C77700]" /> : <Circle size={18} className="text-[#C9CDD2]" />);

// 결과물 상태 라벨 — 공유 한국어 상수(copy.ts) 대신 페이지 내에서 6개국어 처리.
function artifactStatusLabel(t: LaunchT, s: string): string {
  switch (s) {
    case "not_started": return t("아직 만들지 않았어요", "Not created yet", "尚未创建", "Chưa tạo", "まだ作成していません", "Belum dibuat");
    case "draft": return t("코치의 초안이 있어요", "Coach's draft ready", "已有教练草稿", "Có bản nháp của coach", "コーチの下書きがあります", "Ada draf coach");
    case "in_progress": return t("작성 중이에요", "In progress", "编写中", "Đang thực hiện", "作成中", "Sedang dibuat");
    case "needs_confirmation": return t("확인할 내용이 있어요", "Needs your review", "有待确认内容", "Cần bạn xem lại", "確認する内容があります", "Perlu ditinjau");
    case "finalized": return t("이 내용으로 확정했어요", "Finalized", "已确定", "Đã hoàn tất", "確定しました", "Sudah final");
    case "improvable": return t("더 개선할 수 있어요", "Can be improved", "可以改进", "Có thể cải thiện", "改善できます", "Bisa ditingkatkan");
    case "archived": return t("이전 버전", "Previous version", "旧版本", "Phiên bản trước", "以前のバージョン", "Versi sebelumnya");
    default: return s;
  }
}

function ArtifactCard({ a }: { a: ArtifactItem }) {
  const t = useLaunchT();
  return (
    <Link
      href={a.destination}
      onClick={() => trackCareerFunnel("career_artifact_opened", { artifactType: a.type, destination: a.destination })}
      className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-white p-4 transition hover:border-[#3182F6]/30"
    >
      <StatusIcon s={a.status} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold text-[#191F28]">{a.label}</p>
        <p className={`mt-0.5 text-[12.5px] font-semibold ${STATUS_TONE[a.status] ?? "text-[#8B95A1]"}`}>
          {artifactStatusLabel(t, a.status)}
          {a.remaining ? ` · ${t(`확인할 문장 ${a.remaining}개`, `${a.remaining} lines to review`, `${a.remaining} 句待确认`, `${a.remaining} câu cần xem`, `確認する文 ${a.remaining}件`, `${a.remaining} kalimat perlu ditinjau`)}` : a.detail ? ` · ${a.detail}` : ""}
        </p>
      </div>
      <ArrowRight size={16} className="flex-none text-[#C9CDD2]" />
    </Link>
  );
}

export default function ArtifactHubPage() {
  const t = useLaunchT();
  const [vm, setVm] = useState<ArtifactHubVM | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const load = () => {
    setPhase("loading");
    void fetchArtifacts()
      .then((d) => {
        setVm(d);
        setPhase("ready");
        trackCareerFunnel("career_artifact_hub_viewed");
      })
      .catch(() => setPhase("error"));
  };
  useEffect(load, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F8FB]">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-8">
          <p className="cl-eyebrow">Career Launch</p>
          <h1 className="cl-display mt-1.5">{t("나의 결과물", "My deliverables", "我的成果", "Kết quả của tôi", "私の成果物", "Hasil saya")}</h1>
          <p className="cl-lead mt-2.5 max-w-[52ch]">
            {t(
              "4주 동안 코치와 함께 만든 직무 방향, 지원서, 면접 준비 결과를 확인할 수 있어요.",
              "See the role direction, application, and interview prep you built with your coach over four weeks.",
              "查看你在4周里与教练一起完成的职业方向、申请材料和面试准备成果。",
              "Xem hướng nghề, hồ sơ và chuẩn bị phỏng vấn bạn đã xây cùng coach trong 4 tuần.",
              "4週間コーチと作った職種の方向・応募書類・面接準備の成果を確認できます。",
              "Lihat arah peran, lamaran, dan persiapan wawancara yang kamu buat bersama coach selama 4 minggu."
            )}
          </p>
          <hr className="cl-rule mt-5" />

          {phase === "loading" ? (
            <div className="mt-5 flex flex-col gap-3">
              <CardSkeleton height={96} />
              <CardSkeleton height={140} />
              <CardSkeleton height={140} />
            </div>
          ) : phase === "error" || !vm ? (
            <div className="mt-5">
              <ErrorState onRetry={load} />
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-7">
              {/* 상단 요약 */}
              <div className="rounded-2xl bg-gradient-to-br from-[#3182F6] to-[#1B64DA] p-5 text-white">
                <p className="text-[14.5px] font-semibold leading-relaxed">
                  {vm.summary.targetJob
                    ? t(`${vm.summary.targetJob} 직무를 준비하고 있어요.`, `Preparing for the ${vm.summary.targetJob} role.`, `正在准备 ${vm.summary.targetJob} 职务。`, `Đang chuẩn bị cho vị trí ${vm.summary.targetJob}.`, `${vm.summary.targetJob} 職種を準備しています。`, `Menyiapkan peran ${vm.summary.targetJob}.`)
                    : t("아직 목표 직무를 정하는 중이에요.", "Still deciding your target role.", "还在确定目标职务。", "Vẫn đang chọn nghề mục tiêu.", "まだ目標職種を決めているところです。", "Masih menentukan peran target.")}
                </p>
                <p className="mt-1.5 text-[13px] text-white/90">
                  {t(`완성한 결과물 ${vm.summary.finalizedCount}개`, `${vm.summary.finalizedCount} finished`, `已完成 ${vm.summary.finalizedCount} 项`, `${vm.summary.finalizedCount} đã hoàn thành`, `完成 ${vm.summary.finalizedCount}件`, `${vm.summary.finalizedCount} selesai`)}
                  {vm.summary.needsConfirmCount > 0
                    ? t(` · 확인이 필요한 결과물 ${vm.summary.needsConfirmCount}개`, ` · ${vm.summary.needsConfirmCount} need review`, ` · ${vm.summary.needsConfirmCount} 项待确认`, ` · ${vm.summary.needsConfirmCount} cần xem lại`, ` · 確認が必要 ${vm.summary.needsConfirmCount}件`, ` · ${vm.summary.needsConfirmCount} perlu ditinjau`)
                    : ""}
                </p>
                {vm.summary.firstNeedsConfirm ? (
                  <Link
                    href={vm.summary.firstNeedsConfirm.destination}
                    onClick={() => trackCareerFunnel("career_artifact_confirmation_clicked", { artifactType: vm.summary.firstNeedsConfirm?.type })}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-[13px] font-bold text-[#1B64DA]"
                  >
                    {t("확인할 내용 보기", "See what to review", "查看待确认内容", "Xem nội dung cần xem lại", "確認する内容を見る", "Lihat yang perlu ditinjau")} <ArrowRight size={14} weight="bold" />
                  </Link>
                ) : null}
              </div>

              <DashboardSection title={t("나의 방향", "My direction", "我的方向", "Hướng của tôi", "私の方向", "Arah saya")} sub={t("어떤 직무를 목표로 정했는지", "The role you're aiming for", "你确定的目标职务", "Nghề bạn nhắm tới", "目標に定めた職種", "Peran yang kamu tuju")}>
                <div className="flex flex-col gap-2.5">
                  {vm.groups.direction.map((a) => (
                    <ArtifactCard key={a.type} a={a} />
                  ))}
                </div>
              </DashboardSection>

              <DashboardSection title={t("지원 패키지", "Application package", "申请材料包", "Bộ hồ sơ", "応募パッケージ", "Paket lamaran")} sub={t("실제 지원할 서류", "Documents you'll apply with", "实际投递的材料", "Giấy tờ để ứng tuyển", "実際に応募する書類", "Dokumen untuk melamar")}>
                <div className="flex flex-col gap-2.5">
                  {vm.groups.applicationPackage.map((a) => (
                    <ArtifactCard key={a.type} a={a} />
                  ))}
                </div>
              </DashboardSection>

              <DashboardSection title={t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị phỏng vấn", "面接準備", "Persiapan wawancara")} sub={t("모의면접과 성장", "Mock interviews and growth", "模拟面试与成长", "Phỏng vấn thử và phát triển", "模擬面接と成長", "Wawancara simulasi & pertumbuhan")}>
                <div className="flex flex-col gap-2.5">
                  {vm.groups.interviewPrep.map((a) => (
                    <ArtifactCard key={a.type} a={a} />
                  ))}
                </div>
              </DashboardSection>

              <Link href="/career-launch/resume-preview" className="flex items-center gap-2 rounded-2xl border border-[#EEF1F5] bg-white p-4 text-[13.5px] font-semibold text-[#4E5968]">
                <FileText size={17} className="text-[#8B95A1]" /> {t("이력서·자기소개서 원본 모아보기", "See original resume & cover letter", "查看简历与求职信原件", "Xem CV & thư gốc", "履歴書・自己紹介書の原本をまとめて見る", "Lihat resume & surat lamaran asli")} <ArrowRight size={14} className="ml-auto text-[#C9CDD2]" />
              </Link>
            </div>
          )}
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
