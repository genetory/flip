"use client";

// 통합 Career Profile — 4주 내내 쌓인 데이터를 하나의 도시에(dossier)로. 읽기 전용 집계.
// 기본프로필·Career Direction·Experience Bank·Resume·Story Bank·Cover·Interview 를 한 화면에.
import { useEffect, useState } from "react";
import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { SectionTitle } from "../../../components/launch/ui";
import { fetchProgress, type CareerProgress, type ExperienceEntry } from "../../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent, type ResumeData } from "../../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../../lib/launch/cover-data";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

const INTERVIEW_LABEL: Record<string, string> = { self: "자기소개", job: "직무", fit: "인성·컬처핏", pressure: "압박" };

function Empty({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] px-4 py-5 text-center text-[12.5px] text-[#8B95A1]">{label}</p>;
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

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <CareerLaunchHeader />
      <main className="flex-1 pb-16">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("대시보드", "Dashboard", "仪表板", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
          </Link>

          {/* 커버 — 이름 + Career Score */}
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-[#F2F4F6] pb-6">
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#0B46E8]">Career Profile</p>
              <h1 className="mt-2 break-keep text-[26px] font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-[34px]">{name || t("내 커리어 프로필", "My career profile", "我的职业档案", "Hồ sơ nghề của tôi", "私のキャリアプロフィール", "Profil karierku")}</h1>
              <p className="mt-2 break-keep text-[13.5px] leading-relaxed text-[#8B95A1]">{t("4주 동안 쌓은 나의 커리어 데이터를 한 곳에 모았어요.", "All your career data, gathered over 4 weeks in one place.", "4周积累的职业数据集中在此。", "Dữ liệu nghề 4 tuần của bạn, gộp một chỗ.", "4週間で積み上げたキャリアデータを一箇所に。", "Semua data kariermu selama 4 minggu di satu tempat.")}</p>
            </div>
            {careerScore != null ? (
              <div className="text-right">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">Career Score</p>
                <p className="text-[40px] font-black leading-none tracking-[-0.03em] text-[#0B1227]">{careerScore}<span className="text-[15px] font-bold text-[#B0B8C1]"> / 100</span></p>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-col gap-10">
            {/* Career Direction */}
            <section>
              <SectionTitle>{t("커리어 방향", "Career direction", "职业方向", "Định hướng nghề", "キャリアの方向", "Arah karier")}</SectionTitle>
              {selectedJobs.length === 0 && recoJobs.length === 0 ? (
                <Empty label={t("1주차에서 직무 방향을 정하면 여기 채워져요.", "Set your direction in Week 1.", "在第1周确定方向后显示。", "Đặt hướng ở Tuần 1.", "Week 1で方向を決めると表示。", "Tentukan arah di Minggu 1.")} />
              ) : (
                <div className="flex flex-col gap-3">
                  {selectedJobs.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedJobs.map((j) => <span key={j} className="rounded-full bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">{j}</span>)}
                    </div>
                  ) : null}
                  {recoJobs.length > 0 ? (
                    <div className="flex flex-col gap-1.5">
                      {recoJobs.slice(0, 3).map((r, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl border border-[#EEF1F5] px-3.5 py-2.5">
                          <span className="min-w-0 flex-1 truncate text-[13.5px] font-bold text-[#191F28]">{r.role}</span>
                          <span className="shrink-0 text-[12px] font-black text-[#0B46E8]">Fit {r.fit}%</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            {/* Experience Bank */}
            <section>
              <SectionTitle sub={t("모든 모듈이 참조하는 중심 데이터", "The central data every module reuses", "所有模块引用的中心数据", "Dữ liệu trung tâm mọi module dùng", "全モジュールが参照する中心データ", "Data pusat semua modul")}>Experience Bank · {bank.length}</SectionTitle>
              {bank.length === 0 ? (
                <Empty label={t("1주차 '내 경험 찾아보기'로 채워요.", "Fill it via 'Find my experiences' in Week 1.", "通过第1周‘发掘我的经验’填充。", "Điền qua 'Tìm kinh nghiệm' ở Tuần 1.", "Week 1『経験を見つける』で埋めます。", "Isi lewat 'Temukan pengalaman' di Minggu 1.")} />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {bank.map((e) => (
                    <div key={e.id} className="rounded-2xl border border-[#EEF1F5] p-4">
                      <p className="truncate text-[14px] font-bold text-[#191F28]">{e.experience}</p>
                      <p className="mt-0.5 truncate text-[12px] text-[#8B95A1]">{[e.role, e.period].filter(Boolean).join(" · ")}</p>
                      {e.competencies.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {e.competencies.slice(0, 5).map((c, i) => <span key={i} className="rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[11px] font-semibold text-[#0B46E8]">{c}</span>)}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 기본 프로필(학력·어학) */}
            {educations.length > 0 || languages.length > 0 ? (
              <section>
                <SectionTitle>{t("기본 프로필", "Basic profile", "基本档案", "Hồ sơ cơ bản", "基本プロフィール", "Profil dasar")}</SectionTitle>
                <div className="flex flex-col gap-2 rounded-2xl border border-[#EEF1F5] p-4 text-[13px] text-[#333D4B]">
                  {educations.map((ed, i) => <p key={i}>🎓 {[ed.school, ed.major].filter(Boolean).join(" · ")}</p>)}
                  {languages.length > 0 ? <p>🗣 {languages.map((l) => l.language).filter(Boolean).join(", ")}</p> : null}
                </div>
              </section>
            ) : null}

            {/* 서류 & 점수 */}
            <section>
              <SectionTitle>{t("서류 & 점수", "Docs & scores", "材料与分数", "Hồ sơ & điểm", "書類とスコア", "Dokumen & skor")}</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: t("이력서", "Resume", "简历", "Hồ sơ", "履歴書", "Resume"), ready: resumeReady, score: resumeScore },
                  { label: t("자기소개서", "Cover letter", "自我介绍", "Thư", "自己紹介書", "Surat"), ready: coverReady, score: coverScore },
                  { label: t("면접", "Interview", "面试", "Phỏng vấn", "面接", "Wawancara"), ready: practiced.length > 0, score: interviewScore }
                ].map((d, i) => (
                  <div key={i} className="rounded-2xl border border-[#EEF1F5] p-4 text-center">
                    <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#8B95A1]">{d.label}</p>
                    <p className="mt-1.5 text-[26px] font-black leading-none text-[#0B1227]">{d.score != null ? d.score : <span className="text-[#D1D6DB]">{d.ready ? "✓" : "—"}</span>}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Story Bank */}
            {stories.length > 0 ? (
              <section>
                <SectionTitle>Story Bank · {stories.length}</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {stories.map((s, i) => <span key={i} className="rounded-full border border-[#EEF1F5] px-3 py-1.5 text-[12.5px] font-semibold text-[#333D4B]">{s.category ? `[${s.category}] ` : ""}{s.title}</span>)}
                </div>
              </section>
            ) : null}

            {/* Interview */}
            {practiced.length > 0 || answers.length > 0 ? (
              <section>
                <SectionTitle>{t("면접 준비", "Interview prep", "面试准备", "Chuẩn bị PV", "面接準備", "Persiapan wawancara")}</SectionTitle>
                <div className="flex flex-col gap-3">
                  {practiced.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {practiced.map((p) => <span key={p} className="rounded-full bg-[#EDF1FD] px-3 py-1.5 text-[12.5px] font-bold text-[#0B46E8]">🎤 {INTERVIEW_LABEL[p] ?? p}</span>)}
                    </div>
                  ) : null}
                  {answers.length > 0 ? <p className="text-[13px] text-[#4E5968]">{t(`면접 답변 노트 ${answers.length}개 정리됨`, `${answers.length} interview answers drafted`, `已整理 ${answers.length} 条面试回答`, `${answers.length} câu trả lời PV`, `面接回答 ${answers.length}件`, `${answers.length} jawaban wawancara`)}</p> : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
