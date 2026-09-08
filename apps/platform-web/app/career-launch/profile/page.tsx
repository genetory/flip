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
import { fetchResumeData, type ResumeData } from "../../../lib/launch/resume-data";
import { fetchCoverData, type CoverData } from "../../../lib/launch/cover-data";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../lib/launch/i18n";

const INTERVIEW_LABEL: Record<string, string> = { self: "자기소개", job: "직무", fit: "인성·컬처핏", pressure: "압박" };

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
  const educations = resume.educations ?? [];
  const languages = resume.languages ?? [];
  const direction = selectedJobs[0] || recoJobs[0]?.role || "";

  // ── 공유 카드용 요약(이력서·자소서 기반) — '내가 어떤 사람인지'를 매력적으로 ──
  // 한줄 소개는 이력서 요약 → 없으면 자기소개서 첫 문항 답변에서 가져온다.
  const coverIntro = (cover.items ?? []).map((it) => (it.answer ?? "").trim()).find(Boolean) ?? "";
  const pitch = (resume.basic?.summary ?? "").trim() || coverIntro;
  // 관심 직무 — 어떤 직무를 보고 있는지(여러 개). 확정 직무 → 없으면 추천 직무.
  const targetJobs = (selectedJobs.length ? selectedJobs : recoJobs.map((r) => r.role)).map((j) => (j ?? "").trim()).filter(Boolean);
  const skills = (resume.skills ?? []).map((s) => (s ?? "").trim()).filter(Boolean);
  const highlights = (resume.experiences ?? [])
    .filter((e) => (e.title ?? "").trim() || (e.org ?? "").trim())
    .slice(0, 4)
    .map((e) => ({ head: [e.title, e.org].map((x) => (x ?? "").trim()).filter(Boolean).join(" · "), period: (e.period ?? "").trim(), bullets: (e.bullets ?? []).map((b) => (b ?? "").trim()).filter(Boolean).slice(0, 2) }));
  const eduLine = educations.map((ed) => [ed.school, ed.major].map((x) => (x ?? "").trim()).filter(Boolean).join(" ")).filter(Boolean).join(" · ");
  const langLine = languages.map((l) => [l.language, l.level].map((x) => (x ?? "").trim()).filter(Boolean).join(" ")).filter(Boolean).join(", ");
  const cardEmpty = !pitch && targetJobs.length === 0 && skills.length === 0 && highlights.length === 0 && !eduLine && !langLine;

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
            {/* ── 공유 카드 — 남들에게 보여줄 나의 커리어 한 장 ── */}
            <div className="overflow-hidden rounded-3xl bg-white shadow-[0_16px_44px_-20px_rgba(20,24,31,0.34)]">
              <div className="flex items-center gap-2 bg-[#0E1526] px-6 py-2.5">
                <span className="text-[10.5px] font-black uppercase tracking-[0.22em] text-white/85">Career Passport</span>
                <span className="ml-auto text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/45">Aply · Career Launch</span>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3182F6] to-[#0B46E8] text-[26px] font-black text-white">{initial}</span>
                  <div className="min-w-0 flex-1">
                    <h1 className="break-keep text-[22px] font-black leading-[1.15] tracking-[-0.03em] text-[#0B1227] md:text-[26px]">{name || t("내 커리어 프로필", "My career profile", "我的职业档案", "Hồ sơ nghề của tôi", "私のキャリアプロフィール", "Profil karierku")}</h1>
                    <p className="mt-1 break-keep text-[13px] font-semibold text-[#0B46E8]">{direction ? t(`${direction} 준비생`, `Aiming for ${direction}`, `${direction} 求职中`, `Hướng ${direction}`, `${direction} 志望`, `Menuju ${direction}`) : t("4주 커리어 런치 수료", "Career Launch graduate", "职业启程结业", "Hoàn thành Career Launch", "キャリアランチ修了", "Lulusan Career Launch")}</p>
                  </div>
                </div>

                {pitch ? <p className="mt-4 break-keep text-[15px] font-semibold leading-relaxed text-[#333D4B]">{pitch}</p> : null}

                {targetJobs.length > 0 ? (
                  <div className="mt-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("보고 있는 직무", "Roles I'm exploring", "关注的职务", "Nghề đang tìm", "見ている職種", "Peran yang dilirik")}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {targetJobs.map((j, i) => <span key={i} className="rounded-full bg-[#0B46E8] px-3 py-1.5 text-[12.5px] font-bold text-white">{j}</span>)}
                    </div>
                  </div>
                ) : null}

                {skills.length > 0 ? (
                  <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("보유 스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian")}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {skills.map((s, i) => <span key={i} className="rounded-full bg-[var(--cl-accent-soft)] px-2.5 py-1 text-[11.5px] font-bold text-[#0B46E8]">{s}</span>)}
                    </div>
                  </div>
                ) : null}

                {highlights.length > 0 ? (
                  <div className="mt-5 border-t border-[#EEF1F5] pt-5">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#8B95A1]">{t("핵심 경험", "Key experience", "核心经历", "Kinh nghiệm chính", "主な経験", "Pengalaman utama")}</p>
                    <div className="mt-3 flex flex-col gap-3.5">
                      {highlights.map((h, i) => (
                        <div key={i} className="flex gap-2.5">
                          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                          <div className="min-w-0">
                            <p className="break-keep text-[13.5px] font-bold text-[#191F28]">{h.head}{h.period ? <span className="font-semibold text-[#8B95A1]"> · {h.period}</span> : null}</p>
                            {h.bullets.map((b, bi) => <p key={bi} className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">· {b}</p>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {eduLine || langLine ? (
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#8B95A1]">
                    {eduLine ? <span>🎓 {eduLine}</span> : null}
                    {langLine ? <span>🗣 {langLine}</span> : null}
                  </div>
                ) : null}

                {cardEmpty ? <p className="break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("이력서·자기소개서를 작성하면 나를 소개하는 프로필이 자동으로 채워져요.", "Fill your resume and cover letter to auto-build a profile that introduces you.", "填写简历与自我介绍后，会自动生成介绍你的档案。", "Điền CV và thư giới thiệu để tự tạo hồ sơ giới thiệu bạn.", "履歴書・自己紹介書を作成すると自己紹介プロフィールが自動で埋まります。", "Isi resume dan surat lamaran untuk membangun profil yang memperkenalkanmu.")}</p> : null}
              </div>
            </div>

            {/* ── 나만 보는 커리어 데이터 ── */}
            <div className="mt-2">
              <h2 className="text-[15px] font-black tracking-[-0.01em] text-[#191F28]">{t("나만 보는 커리어 데이터", "My working data", "仅我可见的数据", "Dữ liệu chỉ mình xem", "自分だけの作業データ", "Data kerja pribadi")}</h2>
              <p className="mt-1 text-[12.5px] text-[#8B95A1]">{t("4주 동안 쌓은 자료예요. 공유 카드에는 표시되지 않아요.", "The material you built over 4 weeks. Not shown on the share card.", "你4周积累的资料，不会显示在分享卡上。", "Tư liệu bạn xây trong 4 tuần. Không hiện trên thẻ chia sẻ.", "4週間で蓄積した資料です。共有カードには表示されません。", "Materi yang kamu buat selama 4 minggu. Tidak tampil di kartu bagikan.")}</p>
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
