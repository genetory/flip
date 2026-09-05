"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowClockwise, ArrowRight, Check, Lock } from "@phosphor-icons/react";
import Link from "next/link";
import { RECOMMENDED_JOBS, type Step } from "../../lib/launch/data";
import { fetchProgress, patchProgress, type CareerProgress } from "../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent, type ResumeData, type ResumeExperience } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { confirmTargetJob } from "../../lib/launch/week1";
import { STEP_KIND, isStepDone } from "../../lib/launch/step-status";
import { useLaunchT } from "../../lib/launch/i18n";
import { useStepText, useJobReason, useStepActionLabel, useJobName } from "../../lib/launch/data-i18n";

// 주차 페이지용 스텝 목록 — 1주차처럼 순차 잠금 + 스텝별(섹션별) 결과 표시.
// 완료 상태는 백엔드(progress)에 저장돼 기기 간 동기화된다.
// 모달로 여는 채팅 라우트(페이지 이동 대신 onOpenChat 호출).
const CHAT_ROUTE = /\/career-launch\/(diagnosis|experience|story|jobs|materials|basic-interview|interview)/;
export function WeekStepper({ steps, sequential = true, onOpenChat, refreshKey = 0 }: { steps: Step[]; sequential?: boolean; onOpenChat?: (href: string) => void; refreshKey?: number }) {
  const t = useLaunchT();
  // 채팅 라우트면 모달을 열고(onOpenChat), 아니면 기존처럼 페이지 이동(Link).
  const StepAction = ({ href, className, children }: { href: string; className: string; children: React.ReactNode }) =>
    onOpenChat && CHAT_ROUTE.test(href) ? (
      <button type="button" onClick={() => onOpenChat(href)} className={className}>{children}</button>
    ) : (
      <Link href={href} className={className}>{children}</Link>
    );
  const stepText = useStepText();
  const actionLabel = useStepActionLabel();
  const jobReason = useJobReason();
  const jobName = useJobName();
  const [prog, setProg] = useState<CareerProgress>({});
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [targetBusy, setTargetBusy] = useState<string | null>(null);

  // 관심 직무 중 1순위를 목표로 확정(2주차 서류 기준). 서버가 라벨→직무군 해석, reason 에 원문 보존.
  const confirmTarget = async (role: string) => {
    setTargetBusy(role);
    try {
      await confirmTargetJob(role, "primary", "confirmed", role);
      // 낙관적 반영 — 서버 상태 재조회(load) 결과가 늦어도 '관심 직무 선정' 스텝이 즉시 완료로 바뀌게 한다.
      setProg((p) => ({ ...p, targetJob: role }));
      await load();
    } catch {
      // 실패 시 상태 유지
    } finally {
      setTargetBusy(null);
    }
  };

  // 진행 상태 로드/재동기화 — 자동수집(이력서·자소서)이 늦게 반영될 때 수동 새로고침용.
  const load = async () => {
    setSyncing(true);
    try {
      const [p, r, c] = await Promise.all([fetchProgress(), fetchResumeData().catch(() => ({ data: {} })), fetchCoverData().catch(() => ({ data: {} }))]);
      setProg(p);
      setResume(r.data ?? {});
      setCover(c.data ?? {});
    } catch {
      // 조회 실패 시 빈 상태 유지
    } finally {
      setReady(true);
      setSyncing(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 대화(모달)에서 나오면 부모가 refreshKey 를 올린다 → 완료 상태·결과를 다시 불러온다.
  useEffect(() => {
    if (refreshKey > 0) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const eduN = (resume.educations ?? []).filter((e) => (e.school ?? "").trim().length > 0).length;
  const expN = resume.experiences?.length ?? 0;
  const skillN = resume.skills?.length ?? 0;
  const langN = resume.languages?.length ?? 0;
  const resumeBasicDone = Boolean(resume.basic?.name || resume.basic?.summary);
  const resumeReady = hasResumeContent(resume);
  const coverReady = hasCoverContent(cover);
  const coverN = (cover.items ?? []).filter((x) => (x.answer ?? "").trim().length > 0).length;
  const practicedTypes = prog.interview?.practiced ?? [];

  const isDone = (id: string) => isStepDone(id, { progress: prog, resume, cover });

  const toggle = (id: string) => {
    if (STEP_KIND[id]) return; // 결과 스텝은 수동 체크 불가
    const cur = prog.doneSteps ?? [];
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    setProg((p) => ({ ...p, doneSteps: next }));
    void patchProgress({ doneSteps: next }).catch(() => {
      // 저장 실패해도 화면 상태 유지
    });
  };

  // '해당 없음'으로 채울 수 있는 이력서 섹션(기본정보 제외 — 이름은 필수). 대화 없이 바로 완료 처리.
  const OPTIONAL_NONE = new Set(["w2-edu", "w2-exp", "w2-exp-other", "w2-skill", "w2-lang"]);
  const markNone = (id: string) => {
    const cur = prog.doneSteps ?? [];
    if (cur.includes(id)) return;
    const next = [...cur, id];
    setProg((p) => ({ ...p, doneSteps: next }));
    void patchProgress({ doneSteps: next }).catch(() => {
      // 저장 실패해도 화면 상태 유지
    });
  };

  // 스텝별 결과 패널 — 해당 섹션 데이터가 있으면 그 내용을, 없으면 null(→ 시작하기).
  const stepResult = (id: string) => {
    const kind = STEP_KIND[id];
    if (!kind) return null;

    // 경력/활동 결과 아이템 공통 렌더러.
    const renderExpItem = (x: ResumeExperience, i: number) => (
      <li key={i} className="rounded-xl border border-[#EEF1F5] bg-white p-3">
        <p className="text-[13px] font-bold text-[#191F28]">{[x.title, x.org].filter(Boolean).join(" · ")}{x.period ? <span className="font-normal text-[#8B95A1]"> ({x.period})</span> : null}</p>
        {x.bullets?.length ? (
          <ul className="mt-1 space-y-0.5">
            {x.bullets.map((b, bi) => (
              <li key={bi} className="flex gap-1.5 break-keep text-[12px] text-[#4E5968]"><span className="text-[#0B46E8]">•</span>{b}</li>
            ))}
          </ul>
        ) : null}
      </li>
    );

    if (kind === "diag" && prog.diagnosis && typeof prog.diagnosis.percent === "number") {
      const d = prog.diagnosis;
      return (
        <ResultCard continueHref="/career-launch/diagnosis" continueLabel={t("다시 보기", "View again", "再看一次", "Xem lại", "もう一度見る", "Lihat lagi")} restartHref="/career-launch/diagnosis?restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">{t("취업 준비도", "Job readiness", "求职准备度", "Mức độ sẵn sàng tìm việc", "就職準備度", "Kesiapan kerja")} <span className="text-[#0B46E8]">{d.percent}%</span></p>
          {d.level ? <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">{d.level}</p> : null}
          {d.strengths?.length ? (
            <div className="mt-2">
              <p className="text-[11.5px] font-bold text-[#3A6B00]">{t("강점", "Strengths", "优势", "Điểm mạnh", "強み", "Kelebihan")}</p>
              <ul className="mt-1 space-y-0.5">
                {d.strengths.map((x, i) => (
                  <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">✓</span>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {d.improvements?.length ? (
            <div className="mt-2">
              <p className="text-[11.5px] font-bold text-[#8B95A1]">{t("보완점", "Areas to improve", "待改进", "Điểm cần cải thiện", "改善点", "Yang perlu diperbaiki")}</p>
              <ul className="mt-1 space-y-0.5">
                {d.improvements.map((x, i) => (
                  <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]"><span className="text-[#B0B8C1]">•</span>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </ResultCard>
      );
    }
    if (kind === "experience" && (prog.experienceBank?.length ?? 0) > 0) {
      const n = prog.experienceBank!.length;
      return (
        <ResultCard continueHref="/career-launch/experience" continueLabel={t("경험 더 찾기", "Find more", "再发掘", "Tìm thêm", "もっと探す", "Cari lagi")} restartHref="/career-launch/experience">
          <p className="text-[13.5px] font-bold text-[#191F28]">{t("Experience Bank", "Experience Bank", "经验库", "Experience Bank", "Experience Bank", "Experience Bank")} <span className="text-[#0B46E8]">{t(`${n}개`, `${n}`, `${n} 条`, `${n}`, `${n}件`, `${n}`)}</span></p>
          <ul className="mt-2 space-y-1.5">
            {prog.experienceBank!.slice(0, 4).map((e, i) => (
              <li key={i} className="flex gap-1.5 break-keep rounded-xl border border-[#EEF1F5] bg-white px-3 py-2 text-[12.5px] text-[#333D4B]"><span className="text-[#0B46E8]">•</span>{e.experience}</li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    if (kind === "story" && (prog.strengthStories?.length ?? 0) > 0) {
      const n = prog.strengthStories!.length;
      return (
        <ResultCard continueHref="/career-launch/story" continueLabel={t("스토리 더 만들기", "Add more", "再做一个", "Tạo thêm", "もっと作る", "Buat lagi")} restartHref="/career-launch/story">
          <p className="text-[13.5px] font-bold text-[#191F28]">{t("강점 스토리", "Strength stories", "优势故事", "Câu chuyện điểm mạnh", "強みストーリー", "Cerita kelebihan")} <span className="text-[#0B46E8]">{t(`${n}개`, `${n}`, `${n} 个`, `${n}`, `${n}件`, `${n}`)}</span></p>
          <ul className="mt-2 space-y-1.5">
            {prog.strengthStories!.slice(0, 4).map((s, i) => (
              <li key={i} className="flex items-center gap-1.5 rounded-xl border border-[#EEF1F5] bg-white px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-[#333D4B]">{s.title}</span>
                {s.strength ? <span className="shrink-0 rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[10.5px] font-bold text-[#0B46E8]">{s.strength}</span> : null}
              </li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    if (kind === "jobs" && (prog.selectedJobs?.length ?? 0) > 0) {
      const target = prog.targetJob ?? null;
      return (
        <ResultCard continueHref="/career-launch/jobs" continueLabel={t("이어서", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/jobs?restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">{t("관심 직무", "Jobs of interest", "感兴趣职位", "Công việc quan tâm", "関心のある職務", "Pekerjaan diminati")} <span className="text-[#0B46E8]">{t(`${prog.selectedJobs!.length}개`, `${prog.selectedJobs!.length}`, `${prog.selectedJobs!.length} 个`, `${prog.selectedJobs!.length}`, `${prog.selectedJobs!.length}件`, `${prog.selectedJobs!.length}`)}</span></p>
          <p className={`mt-0.5 break-keep text-[12px] leading-relaxed ${target ? "text-[#8B95A1]" : "font-semibold text-[#C77700]"}`}>{target ? t("2주차 지원 서류가 이 목표 직무에 맞춰져요. 바꾸려면 다른 직무를 정하면 돼요.", "Week 2 docs follow this target. To change it, set another role.", "第2周材料以此目标为准。如需更改，另设一个职务即可。", "Hồ sơ Tuần 2 theo mục tiêu này. Muốn đổi, đặt nghề khác.", "2週目の書類はこの目標に合わせます。変更は別の職務を選べばOK。", "Dokumen Minggu 2 mengikuti target ini. Untuk ubah, pilih peran lain.") : t("여기서 1순위 '목표 직무'를 정해야 이 단계가 완료돼요. 2주차 서류가 그 직무에 맞춰집니다.", "Set your primary target here to complete this step — Week 2 docs follow it.", "在这里定下首选'目标职务'才算完成本步骤，第2周材料以此为准。", "Đặt 'nghề mục tiêu' số 1 tại đây để hoàn thành bước này — hồ sơ Tuần 2 theo đó.", "ここで第一の『目標職務』を決めるとこのステップが完了します。2週目の書類がそれに合わせます。", "Tetapkan 'peran target' utama di sini untuk menyelesaikan langkah ini — dokumen Minggu 2 mengikutinya.")}</p>
          <ul className="mt-2 space-y-2">
            {prog.selectedJobs!.map((role) => {
              const job = RECOMMENDED_JOBS.find((x) => x.role === role);
              const isTarget = target === role;
              return (
                <li key={role} className={`rounded-xl border p-3 ${isTarget ? "border-[#0B46E8] bg-[#F5F8FF]" : "border-[#EEF1F5] bg-white"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-keep text-[13px] font-bold text-[#191F28]">{isTarget ? "🎯 " : ""}{jobName(role)}</p>
                      {job?.reason ? <p className="mt-1 break-keep text-[12px] leading-relaxed text-[#4E5968]">{jobReason(job.id)}</p> : null}
                    </div>
                    {isTarget ? (
                      <span className="shrink-0 rounded-lg bg-[#0B46E8] px-2.5 py-1 text-[11px] font-bold text-white">{t("목표", "Target", "目标", "Mục tiêu", "目標", "Target")}</span>
                    ) : (
                      <button type="button" onClick={() => void confirmTarget(role)} disabled={targetBusy !== null} className="shrink-0 rounded-lg bg-[#EDF1FD] px-2.5 py-1.5 text-[11.5px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC] disabled:opacity-50">
                        {targetBusy === role ? "…" : t("목표로 정하기", "Set as target", "设为目标", "Đặt mục tiêu", "目標に設定", "Jadikan target")}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </ResultCard>
      );
    }
    if (kind === "materials" && (prog.materials?.length ?? 0) > 0) {
      return (
        <ResultCard continueHref="/career-launch/materials" continueLabel={t("이어서 정리", "Continue organizing", "继续整理", "Tiếp tục sắp xếp", "続けて整理", "Lanjut merapikan")} restartHref="/career-launch/materials?restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">{t("선정 직무 정보", "Selected job info", "所选职位信息", "Thông tin công việc đã chọn", "選んだ職務の情報", "Info pekerjaan yang dipilih")} <span className="text-[#0B46E8]">{t(`${prog.materials!.length}개`, `${prog.materials!.length}`, `${prog.materials!.length} 条`, `${prog.materials!.length}`, `${prog.materials!.length}件`, `${prog.materials!.length}`)}</span> {t("정리", "organized", "整理", "đã sắp xếp", "整理", "dirapikan")}</p>
          <ul className="mt-2 space-y-1.5">
            {prog.materials!.map((m, i) => (
              <li key={i} className="flex gap-1.5 break-keep rounded-xl border border-[#EEF1F5] bg-white px-3 py-2 text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">•</span>{m}</li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    // 이력서 — 기본정보·한줄소개
    if (kind === "resume-basic" && resumeBasicDone) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=basic" continueLabel={t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/resume-collect?section=basic&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 {t("기본정보 · 한줄소개", "Basic info · One-line intro", "基本信息 · 一句话介绍", "Thông tin cơ bản · Giới thiệu một dòng", "基本情報 · 一言紹介", "Info dasar · Perkenalan satu baris")}</p>
          {resume.basic?.name ? <p className="mt-1 text-[12.5px] font-semibold text-[#333D4B]">{[resume.basic.name, resume.basic.email, resume.basic.phone].filter(Boolean).join(" · ")}</p> : null}
          {resume.basic?.summary ? <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#4E5968]">“{resume.basic.summary}”</p> : null}
        </ResultCard>
      );
    }
    // 이력서 — 학력
    if (kind === "resume-edu" && eduN > 0) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=edu" continueLabel={t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/resume-collect?section=edu&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 {t("학력", "Education", "教育经历", "Học vấn", "学歴", "Pendidikan")} <span className="text-[#0B46E8]">{t(`${eduN}개`, `${eduN}`, `${eduN} 项`, `${eduN}`, `${eduN}件`, `${eduN}`)}</span></p>
          <ul className="mt-1.5 space-y-1">
            {resume.educations!.filter((e) => (e.school ?? "").trim().length > 0).map((e, i) => (
              <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]">
                <span className="text-[#3A6B00]">•</span>{[e.school, e.major, e.period].filter(Boolean).join(" · ")}
              </li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    // 이력서 — 경력(회사경험)
    if (kind === "resume-exp-work") {
      const items = (resume.experiences ?? []).filter((x) => x.kind !== "other");
      if (!items.length) return null;
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=exp" continueLabel={t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/resume-collect?section=exp&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 {t("경력", "Experience", "经历", "Kinh nghiệm", "職歴", "Pengalaman")} <span className="text-[#0B46E8]">{t(`${items.length}개`, `${items.length}`, `${items.length} 项`, `${items.length}`, `${items.length}件`, `${items.length}`)}</span></p>
          <ul className="mt-2 space-y-2">{items.map(renderExpItem)}</ul>
        </ResultCard>
      );
    }
    // 이력서 — 활동·프로젝트(나머지)
    if (kind === "resume-exp-other") {
      const items = (resume.experiences ?? []).filter((x) => x.kind === "other");
      if (!items.length) return null;
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=expOther" continueLabel={t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/resume-collect?section=expOther&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 {t("활동·프로젝트", "Activities & projects", "活动·项目", "Hoạt động·Dự án", "活動·プロジェクト", "Aktivitas·Proyek")} <span className="text-[#0B46E8]">{t(`${items.length}개`, `${items.length}`, `${items.length} 项`, `${items.length}`, `${items.length}件`, `${items.length}`)}</span></p>
          <ul className="mt-2 space-y-2">{items.map(renderExpItem)}</ul>
        </ResultCard>
      );
    }
    // 이력서 — 스킬
    if (kind === "resume-skill" && skillN > 0) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=skill" continueLabel={t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/resume-collect?section=skill&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 {t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keterampilan")} <span className="text-[#0B46E8]">{t(`${skillN}개`, `${skillN}`, `${skillN} 项`, `${skillN}`, `${skillN}件`, `${skillN}`)}</span></p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {resume.skills!.map((s, i) => (
              <span key={i} className="rounded-full bg-[#EDF1FD] px-2.5 py-1 text-[11.5px] font-semibold text-[#0B46E8]">{s}</span>
            ))}
          </div>
        </ResultCard>
      );
    }
    // 이력서 — 어학
    if (kind === "resume-lang" && langN > 0) {
      return (
        <ResultCard continueHref="/career-launch/resume-collect?section=lang" continueLabel={t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/resume-collect?section=lang&restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">📄 {t("어학", "Languages", "语言能力", "Ngoại ngữ", "語学", "Bahasa")} <span className="text-[#0B46E8]">{t(`${langN}개`, `${langN}`, `${langN} 项`, `${langN}`, `${langN}件`, `${langN}`)}</span></p>
          <p className="mt-1.5 text-[12.5px] text-[#4E5968]">{resume.languages!.map((l) => [l.language, l.level].filter(Boolean).join(" ")).join(" · ")}</p>
        </ResultCard>
      );
    }
    // 자기소개서 — 작성한 문항(제목+답변)들을 모아 보여준다(동적 문항).
    if (kind === "cover") {
      const filled = (cover.items ?? []).filter((x) => (x.answer ?? "").trim());
      if (!filled.length) return null;
      return (
        <ResultCard continueHref="/career-launch/cover-collect" continueLabel={t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/cover-collect">
          <p className="text-[13.5px] font-bold text-[#191F28]">📝 {t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Surat lamaran")} <span className="text-[#0B46E8]">{t(`${filled.length}문항`, `${filled.length}`, `${filled.length} 项`, `${filled.length}`, `${filled.length}項目`, `${filled.length}`)}</span></p>
          <ul className="mt-2 space-y-1.5">
            {filled.slice(0, 5).map((it, i) => (
              <li key={i} className="rounded-xl border border-[#EEF1F5] bg-white px-3 py-2">
                <p className="break-keep text-[12.5px] font-bold text-[#191F28]">{it.question}</p>
                <p className="mt-0.5 line-clamp-2 break-keep text-[12px] leading-relaxed text-[#8B95A1]">{it.answer}</p>
              </li>
            ))}
          </ul>
        </ResultCard>
      );
    }
    // 면접 — 유형별 기본 면접(자기소개/직무/인성/압박). 완료했으면 점수 요약 + 다시 연습 링크.
    if (kind === "interview-self" || kind === "interview-job" || kind === "interview-fit" || kind === "interview-pressure") {
      const type = kind.replace("interview-", "") as "self" | "job" | "fit" | "pressure";
      const basicLogs = (prog.basicInterviews ?? []).filter((l) => l.focus === type && (l.items?.length ?? 0) > 0);
      if (basicLogs.length === 0 && !practicedTypes.includes(type)) return null;
      const label =
        type === "self"
          ? t("자기소개 면접", "Self-introduction interview", "自我介绍面试", "Phỏng vấn giới thiệu bản thân", "自己紹介面接", "Wawancara perkenalan diri")
          : type === "job"
            ? t("직무 면접", "Job interview", "职务面试", "Phỏng vấn công việc", "職務面接", "Wawancara pekerjaan")
            : type === "fit"
              ? t("인성·컬처핏 면접", "Personality & culture-fit interview", "人品·文化契合面试", "Phỏng vấn tính cách · phù hợp văn hóa", "人柄·カルチャーフィット面接", "Wawancara kepribadian & kecocokan budaya")
              : t("압박 면접", "Pressure interview", "压力面试", "Phỏng vấn áp lực", "圧迫面接", "Wawancara tekanan");
      const latest = basicLogs[0];
      const avg = latest?.items?.length ? Math.round(latest.items.reduce((s, it) => s + it.score, 0) / latest.items.length) : null;
      return (
        <div className="mt-3 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-bold text-[#191F28]">🎤 {t(`${label} 완료`, `${label} done`, `${label} 完成`, `Đã xong ${label}`, `${label} 完了`, `${label} selesai`)}{avg != null ? ` · ${t("평균", "Avg", "平均", "TB", "平均", "Rata")} ${avg}` : ""}</p>
            <Link href={`/career-launch/basic-interview?focus=${type}`} className="shrink-0 rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]">{t("다시 연습", "Practice again", "再练习", "Luyện lại", "もう一度練習", "Latihan lagi")}</Link>
          </div>
          <p className="mt-1 break-keep text-[12.5px] text-[#4E5968]">{t("면접관과 실전처럼 주고받으며 연습을 마쳤어요. 필요하면 다시 연습해봐요.", "You practiced a realistic back-and-forth with the interviewer. Practice again anytime you need.", "你与面试官进行了实战般的问答练习。需要的话可以再练习。", "Bạn đã luyện tập hỏi đáp thực tế với người phỏng vấn. Cần thì hãy luyện lại nhé.", "面接官と実践のようにやり取りしながら練習を終えました。必要ならまた練習してみましょう。", "Anda berlatih tanya-jawab layaknya nyata dengan pewawancara. Latih lagi kapan pun perlu.")}</p>
        </div>
      );
    }
    // 이력서 + 자기소개서 최종 점검 — 내용을 AI로 요약해 보여주고, 고칠 곳은 week2/week3 에서 수정.
    if (kind === "both" && (resumeReady || coverReady)) {
      return <FinalDocsSummary resumeReady={resumeReady} coverReady={coverReady} />;
    }
    return null;
  };

  const doneN = steps.filter((s) => isDone(s.id)).length;

  return (
    <>
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF1F5]">
          <div className="h-full rounded-full bg-[#0B46E8] transition-[width]" style={{ width: `${steps.length ? (doneN / steps.length) * 100 : 0}%` }} />
        </div>
        <span className="shrink-0 text-[12px] font-bold text-[#4E5968]">{t(`${doneN}/${steps.length} 완료`, `${doneN}/${steps.length} done`, `${doneN}/${steps.length} 完成`, `${doneN}/${steps.length} hoàn thành`, `${doneN}/${steps.length} 完了`, `${doneN}/${steps.length} selesai`)}</span>
        <button
          type="button"
          onClick={() => void load()}
          disabled={syncing}
          title={t("최신 상태로 동기화", "Sync latest", "同步最新", "Đồng bộ mới nhất", "最新に同期", "Sinkron terbaru")}
          aria-label={t("동기화", "Sync", "同步", "Đồng bộ", "同期", "Sinkron")}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#B0B8C1] transition hover:bg-[#F2F4F6] hover:text-[#4E5968] disabled:opacity-50"
        >
          <ArrowClockwise className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} weight="bold" />
        </button>
      </div>
    <ol className="space-y-1">
      {steps.map((s, i) => {
        const done = isDone(s.id);
        const last = i === steps.length - 1;
        const result = Boolean(STEP_KIND[s.id]);
        const panel = stepResult(s.id);
        // 순차 연계 — 이전 스텝을 모두 완료해야 이 스텝을 시작할 수 있다(sequential=false 면 잠금 없음).
        const locked = sequential && ready && !done && !steps.slice(0, i).every((p) => isDone(p.id));
        const toggleable = !result && !locked;
        // 한 주차 안의 소그룹(예: 지원 패키지 = 이력서/자기소개서) 시작 지점에 구분 헤더.
        const groupStart = s.group && s.group !== steps[i - 1]?.group;
        return (
          <Fragment key={s.id}>
          {groupStart ? (
            <li className="flex items-center gap-2.5 pb-2 pt-1 first:pt-0">
              <span className="text-[12.5px] font-black uppercase tracking-[0.08em] text-[#0B46E8]">
                {s.group === "resume"
                  ? t("이력서", "Resume", "简历", "CV", "履歴書", "Resume")
                  : t("자기소개서", "Cover letter", "自我介绍书", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}
              </span>
              <span className="h-px flex-1 bg-[#EEF1F5]" />
            </li>
          ) : null}
          <li className="flex gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!toggleable}
                onClick={toggleable ? () => toggle(s.id) : undefined}
                aria-label={toggleable ? (done ? t("완료 취소", "Undo complete", "取消完成", "Hủy hoàn thành", "完了を取り消す", "Batalkan selesai") : t("완료로 표시", "Mark as complete", "标记为完成", "Đánh dấu hoàn thành", "完了にする", "Tandai selesai")) : undefined}
                className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-[14px] font-black shadow-sm transition ${
                  done
                    ? "bg-[#0B46E8] text-white"
                    : locked
                      ? "cursor-default border-2 border-[#E5E8EB] bg-[#F8FAFC] text-[#C9CDD2]"
                      : "border-2 border-[#D7DCE3] bg-white text-[#4E5968]"
                } ${toggleable ? "hover:border-[#0B46E8] hover:text-[#0B46E8]" : "cursor-default"}`}
              >
                {done ? <Check className="h-[15px] w-[15px]" weight="bold" aria-hidden /> : locked ? <Lock className="h-3.5 w-3.5" weight="fill" aria-hidden /> : i + 1}
              </button>
              {!last ? <span className="mt-1.5 w-[2px] flex-1 rounded bg-[#E5E8EB]" /> : null}
            </div>
            <div className={`min-w-0 flex-1 ${last ? "pb-0.5" : "pb-9"}`}>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className={`break-keep text-[17px] font-black leading-[1.25] tracking-[-0.02em] md:text-[18.5px] ${done ? "text-[#8B95A1]" : locked ? "text-[#B0B8C1]" : "text-[#0B1227]"}`}>
                  {stepText(s.id, "title")}
                </p>
                {!done && !locked && s.minutes ? (
                  <span className="rounded-full bg-[#F2F4F6] px-2 py-0.5 text-[11px] font-semibold text-[#8B95A1]">⏱ {t(`약 ${s.minutes}분`, `about ${s.minutes} min`, `约 ${s.minutes} 分钟`, `khoảng ${s.minutes} phút`, `約 ${s.minutes}分`, `sekitar ${s.minutes} mnt`)}</span>
                ) : null}
              </div>
              <p className={`mt-2 max-w-[560px] break-keep text-[14px] leading-[1.8] ${done ? "text-[#B0B8C1]" : locked ? "text-[#C9CDD2]" : "text-[#4E5968]"}`}>
                {stepText(s.id, "desc")
                  .split(/(?<=\.)\s+/)
                  .filter(Boolean)
                  .map((line, li) => (
                    <span key={li} className="block">
                      {line}
                    </span>
                  ))}
              </p>
              {locked ? (
                <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#B0B8C1]"><Lock className="h-3.5 w-3.5" weight="fill" aria-hidden /> {t("이전 단계를 완료하면 시작할 수 있어요", "Finish the previous step to start this one.", "完成上一步后即可开始。", "Hoàn thành bước trước để bắt đầu bước này.", "前のステップを完了すると始められます。", "Selesaikan langkah sebelumnya untuk memulai.")}</p>
              ) : panel ? (
                panel
              ) : done ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#E7F7EF] px-2.5 py-1.5 text-[12px] font-bold text-[#0A9B59]">✓ {t("완료", "Done", "已完成", "Hoàn thành", "完了", "Selesai")}</span>
                  {toggleable ? (
                    <button type="button" onClick={() => toggle(s.id)} className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#8B95A1] transition hover:border-[#0B46E8]/40 hover:text-[#4E5968]">
                      {t("완료 취소", "Undo complete", "取消完成", "Hủy hoàn thành", "完了を取り消す", "Batalkan selesai")}
                    </button>
                  ) : s.action ? (
                    <StepAction href={s.action.href} className="rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]">
                      {t("다시 하기", "Do again", "重新做", "Làm lại", "もう一度する", "Ulangi")}
                    </StepAction>
                  ) : null}
                </div>
              ) : s.action ? (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <StepAction
                    href={s.action.href}
                    className="group inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                  >
                    {actionLabel(s.action.label)} <ArrowRight className="h-3.5 w-3.5 transition" weight="bold" aria-hidden />
                  </StepAction>
                  {OPTIONAL_NONE.has(s.id) ? (
                    <button
                      type="button"
                      onClick={() => markNone(s.id)}
                      className="rounded-xl border border-[#E5E8EB] bg-white px-3.5 py-2.5 text-[12.5px] font-semibold text-[#8B95A1] transition hover:border-[#0B46E8]/40 hover:text-[#4E5968]"
                    >
                      {t("해당 없음", "None", "无", "Không có", "該当なし", "Tidak ada")}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </li>
          </Fragment>
        );
      })}
    </ol>
    </>
  );
}

// 최종 점검 — AI 요약 대신, 완성한 실제 서류를 미리보기로 확인하고 고칠 곳은 지원 패키지 주차에서 수정.
function FinalDocsSummary({ resumeReady, coverReady }: { resumeReady: boolean; coverReady: boolean }) {
  const t = useLaunchT();
  const row = (emoji: string, title: string, previewHref: string, editHref: string) => (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-[#EEF1F5] bg-white px-3 py-2.5">
      <p className="min-w-0 truncate text-[13px] font-bold text-[#191F28]">{emoji} {title} <span className="ml-1 text-[11.5px] font-semibold text-[#0A9B59]">✓ {t("완성", "Done", "完成", "Xong", "完成", "Selesai")}</span></p>
      <div className="flex shrink-0 gap-1.5">
        <Link href={previewHref} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-[12px] font-bold text-[#191F28] transition hover:bg-[#F6F8FB]">{t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}</Link>
        <Link href={editHref} className="rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]">{t("수정", "Edit", "编辑", "Sửa", "修正", "Edit")}</Link>
      </div>
    </div>
  );
  return (
    <div className="mt-3 space-y-2.5 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
      <p className="text-[12.5px] leading-relaxed text-[#4E5968]">{t("완성한 서류를 지원 전 마지막으로 확인해요. 고칠 곳은 '수정'에서 다듬으면 돼요.", "Give your finished documents one last look before applying. Fix anything via 'Edit'.", "投递前最后确认完成的材料，需要修改就点'编辑'。", "Xem lại hồ sơ hoàn thiện lần cuối trước khi ứng tuyển. Sửa gì thì bấm 'Sửa'.", "応募前に完成した書類を最終確認します。直したい所は「修正」で。", "Periksa dokumen jadimu sekali lagi sebelum melamar. Perbaiki lewat 'Edit'.")}</p>
      {resumeReady ? row("📄", t("내 이력서", "My resume", "我的简历", "CV của tôi", "私の履歴書", "Resume saya"), "/career-launch/resume-preview", "/career-launch/week/2") : null}
      {coverReady ? row("📝", t("내 자기소개서", "My cover letter", "我的自我介绍书", "Thư giới thiệu của tôi", "私の自己紹介書", "Surat lamaran saya"), "/career-launch/cover-preview", "/career-launch/week/2") : null}
    </div>
  );
}

// 결과 카드 — 진단/직무/이력서 섹션 공통 래퍼. 우상단에 이어하기 + 다시하기 링크.
function ResultCard({ continueHref, continueLabel, restartHref, children }: { continueHref: string; continueLabel: string; restartHref: string; children: React.ReactNode }) {
  const t = useLaunchT();
  return (
    <div className="mt-3 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">{children}</div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link href={continueHref} className="rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-center text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]">{continueLabel}</Link>
          <Link href={restartHref} className="rounded-lg border border-[#E5E8EB] bg-white px-3 py-1.5 text-center text-[12px] font-semibold text-[#8B95A1] transition hover:border-[#0B46E8]/40 hover:text-[#4E5968]">{t("다시하기", "Start over", "重新开始", "Làm lại", "やり直す", "Mulai ulang")}</Link>
        </div>
      </div>
    </div>
  );
}
