"use client";

// 통합 Career Profile — 커리어 패스포트 히어로(이름·Career Score 링·강점) + 점수 게이지 +
// 4주 내내 쌓인 데이터(방향·경험은행·서류·스토리·면접)를 홈 톤 흰 카드로. 읽기 전용 집계.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { LaunchAmbientBackground } from "../../../components/launch/LaunchAmbientBackground";
import { TalentPassportCard } from "../../../components/launch/TalentPassportCard";
import { MyTimelineCard } from "../../../components/launch/MyTimelineCard";
import { AplyFooter } from "../../../components/AplyFooter";
import { SectionTitle } from "../../../components/launch/ui";
import { fetchProgress, type CareerProgress, type ExperienceEntry } from "../../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../../lib/launch/cover-data";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

const INTERVIEW_LABEL: Record<string, string> = { self: "자기소개", job: "직무", fit: "인성·컬처핏", pressure: "압박" };

function scoreColor(s: number): string {
  return s >= 75 ? "#0A9B59" : s >= 50 ? "#0B46E8" : "#C77700";
}

// 원형 게이지.
function Ring({ value, size = 76, stroke = 7 }: { value: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, value)) / 100);
  const col = scoreColor(value);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EDF0F4" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[19px] font-black leading-none tabular-nums" style={{ color: col }}>{value}</span>
        <span className="mt-0.5 text-[8.5px] font-bold text-[#B0B8C1]">/ 100</span>
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="rounded-xl bg-[var(--cl-card-2)] px-4 py-5 text-center text-[12.5px] text-[#8B95A1]">{label}</p>;
}
function Panel({ children }: { children: React.ReactNode }) {
  return <section className="rounded-2xl bg-white p-5 shadow-[0_2px_12px_-6px_rgba(20,24,31,0.16)]">{children}</section>;
}

export default function CareerProfilePage() {
  const t = useLaunchT();
  const { user } = useAuthSession();
  const [prog, setProg] = useState<CareerProgress | null>(null);
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [p, r, c] = await Promise.all([
        fetchProgress().catch(() => ({}) as CareerProgress),
        fetchResumeData().catch(() => ({ data: {} })),
        fetchCoverData().catch(() => ({ data: {} }))
      ]);
      if (!alive) return;
      setProg(p);
      setResume(r.data ?? {});
      setCover(c.data ?? {});
    })();
    return () => {
      alive = false;
    };
  }, []);

  const name = user?.name?.trim() || user?.email || "";
  const initial = (name.trim().charAt(0) || "A").toUpperCase();
  const bank: ExperienceEntry[] = Array.isArray(prog?.experienceBank) ? prog!.experienceBank! : [];
  const selectedJobs = Array.isArray(prog?.selectedJobs) ? prog!.selectedJobs! : [];
  const recoJobs = prog?.jobRecommendation?.data?.jobs ?? [];
  const stories = (prog?.storyBank?.data?.stories ?? []) as Array<{ category?: string; title?: string }>;
  const answers = prog?.answerBank?.data?.answers ?? [];
  const practiced = prog?.interview?.practiced ?? [];
  const careerScore = prog?.careerReport?.data?.total ?? null;
  const resumeScore = prog?.scores?.resume?.data?.total ?? null;
  const coverScore = prog?.scores?.cover?.data?.total ?? null;
  const interviewScore = prog?.scores?.interview?.data?.total ?? null;
  const resumeReady = hasResumeContent(resume);
  const coverReady = hasCoverContent(cover);
  const educations = resume.educations ?? [];
  const languages = resume.languages ?? [];
  // 강점 칩 — 경험은행 역량 상위, 없으면 관심 직무.
  const topComps = Array.from(new Set(bank.flatMap((e) => e.competencies ?? []).map((c) => c.trim()).filter(Boolean))).slice(0, 5);
  const direction = selectedJobs[0] || recoJobs[0]?.role || "";

  const gauges = [
    { label: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), score: resumeScore, ready: resumeReady },
    { label: t("자기소개서", "Cover letter", "自我介绍", "Thư", "自己紹介書", "Surat"), score: coverScore, ready: coverReady },
    { label: t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara"), score: interviewScore, ready: practiced.length > 0 }
  ];

  return (
    <div className="cl-surface isolate flex min-h-screen flex-col bg-[#F1F1F4]">
      <LaunchAmbientBackground />
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-8">
          <Link href="/career-launch/dashboard" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("대시보드", "Dashboard", "仪表板", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
          </Link>

          <div className="mt-4 flex flex-col gap-6">
            {/* 커리어 패스포트 히어로 */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_10px_36px_-18px_rgba(20,24,31,0.3)]">
              <div className="flex items-center gap-2 bg-[#0E1526] px-6 py-2.5">
                <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-white/85">Career Passport</span>
                <span className="ml-auto text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">Aply · Career Launch</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 p-6">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3182F6] to-[#0B46E8] text-[26px] font-black text-white">{initial}</span>
                <div className="min-w-0 flex-1">
                  <h1 className="break-keep text-[22px] font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-[26px]">{name || t("내 커리어 프로필", "My career profile", "我的职业档案", "Hồ sơ nghề của tôi", "私のキャリアプロフィール", "Profil karierku")}</h1>
                  <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{direction ? t(`${direction} 준비생`, `Aiming for ${direction}`, `${direction} 求职中`, `Hướng ${direction}`, `${direction} 志望`, `Menuju ${direction}`) : t("4주 동안 쌓은 나의 커리어 데이터", "Your career data from 4 weeks", "4周积累的职业数据", "Dữ liệu nghề 4 tuần của bạn", "4週間のキャリアデータ", "Data karier 4 minggu")}</p>
                  {topComps.length > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {topComps.map((c, i) => <span key={i} className="rounded-full bg-[var(--cl-accent-soft)] px-2.5 py-1 text-[11.5px] font-bold text-[#0B46E8]">{c}</span>)}
                    </div>
                  ) : null}
                </div>
                {careerScore != null ? (
                  <div className="flex shrink-0 flex-col items-center">
                    <Ring value={careerScore} size={88} stroke={8} />
                    <span className="mt-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">Career Score</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* 서류·면접 점수 게이지 */}
            <div className="grid grid-cols-3 gap-3">
              {gauges.map((g, i) => (
                <div key={i} className="flex flex-col items-center gap-2.5 rounded-2xl bg-white p-4 shadow-[0_2px_12px_-6px_rgba(20,24,31,0.16)]">
                  {g.score != null ? <Ring value={g.score} size={64} stroke={6} /> : (
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--cl-card-2)] text-[20px] font-black text-[#C9CDD2]">{g.ready ? "✓" : "—"}</span>
                  )}
                  <p className="text-[12px] font-bold text-[#4E5968]">{g.label}</p>
                </div>
              ))}
            </div>

            {/* Talent Passport — 검증된 Talent 프로필(Readiness·Verified) */}
            <TalentPassportCard />
            {/* 내 여정 — TalentEvent 타임라인 */}
            <MyTimelineCard />

            {/* Career Direction */}
            <Panel>
              <SectionTitle>{t("커리어 방향", "Career direction", "职业方向", "Định hướng nghề", "キャリアの方向", "Arah karier")}</SectionTitle>
              {selectedJobs.length === 0 && recoJobs.length === 0 ? (
                <Empty label={t("1주차에서 직무 방향을 정하면 여기 채워져요.", "Set your direction in Week 1.", "在第1周确定方向后显示。", "Đặt hướng ở Tuần 1.", "Week 1で方向を決めると表示。", "Tentukan arah di Minggu 1.")} />
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedJobs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedJobs.map((j) => <span key={j} className="rounded-full bg-[var(--cl-accent-soft)] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">{j}</span>)}
                    </div>
                  ) : null}
                  {recoJobs.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {recoJobs.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl bg-[var(--cl-card-2)] px-3.5 py-2.5">
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-[#191F28]">{r.role}</span>
                          <span className="shrink-0 text-[12px] font-black text-[#0B46E8]">Fit {r.fit}%</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </Panel>

            {/* Experience Bank */}
            <Panel>
              <SectionTitle sub={t("모든 모듈이 참조하는 중심 데이터", "The central data every module reuses", "所有模块引用的中心数据", "Dữ liệu trung tâm mọi module dùng", "全モジュールが参照する中心データ", "Data pusat semua modul")}>Experience Bank · {bank.length}</SectionTitle>
              {bank.length === 0 ? (
                <Empty label={t("1주차 '내 경험 찾아보기'로 채워요.", "Fill it via 'Find my experiences' in Week 1.", "通过第1周‘发掘我的经验’填充。", "Điền qua 'Tìm kinh nghiệm' ở Tuần 1.", "Week 1『経験を見つける』で埋めます。", "Isi lewat 'Temukan pengalaman' di Minggu 1.")} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {bank.map((e) => (
                    <div key={e.id} className="rounded-2xl bg-[var(--cl-card-2)] p-4">
                      <p className="truncate text-[14px] font-bold text-[#191F28]">{e.experience}</p>
                      <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{[e.role, e.period].filter(Boolean).join(" · ")}</p>
                      {e.competencies.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {e.competencies.slice(0, 5).map((c, i) => <span key={i} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#0B46E8]">{c}</span>)}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* 기본 프로필(학력·어학) */}
            {educations.length > 0 || languages.length > 0 ? (
              <Panel>
                <SectionTitle>{t("기본 프로필", "Basic profile", "基本档案", "Hồ sơ cơ bản", "基本プロフィール", "Profil dasar")}</SectionTitle>
                <div className="flex flex-col gap-2 rounded-2xl bg-[var(--cl-card-2)] p-4 text-[13px] text-[#333D4B]">
                  {educations.map((ed, i) => <p key={i}>🎓 {[ed.school, ed.major].filter(Boolean).join(" · ")}</p>)}
                  {languages.length > 0 ? <p>🗣 {languages.map((l) => l.language).filter(Boolean).join(", ")}</p> : null}
                </div>
              </Panel>
            ) : null}

            {/* Story Bank */}
            {stories.length > 0 ? (
              <Panel>
                <SectionTitle>Story Bank · {stories.length}</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {stories.map((s, i) => <span key={i} className="rounded-full bg-[var(--cl-card-2)] px-3 py-1.5 text-[12.5px] font-semibold text-[#333D4B]">{s.category ? `[${s.category}] ` : ""}{s.title}</span>)}
                </div>
              </Panel>
            ) : null}

            {/* Interview */}
            {practiced.length > 0 || answers.length > 0 ? (
              <Panel>
                <SectionTitle>{t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị PV", "面接準備", "Persiapan wawancara")}</SectionTitle>
                <div className="flex flex-col gap-3">
                  {practiced.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {practiced.map((p) => <span key={p} className="rounded-full bg-[var(--cl-accent-soft)] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">🎤 {INTERVIEW_LABEL[p] ?? p}</span>)}
                    </div>
                  ) : null}
                  {answers.length > 0 ? <p className="text-[13px] text-[#4E5968]">{t(`면접 답변 노트 ${answers.length}개 정리됨`, `${answers.length} interview answers drafted`, `已整理 ${answers.length} 条面试回答`, `${answers.length} câu trả lời PV`, `面接回答 ${answers.length}件`, `${answers.length} jawaban wawancara`)}</p> : null}
                </div>
              </Panel>
            ) : null}
          </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
