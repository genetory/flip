"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RECOMMENDED_JOBS, type Step } from "../../lib/launch/data";
import { fetchProgress, patchProgress, type CareerProgress } from "../../lib/launch/progress-client";
import { fetchResumeData, hasResumeContent, type ResumeData, type ResumeExperience } from "../../lib/launch/resume-data";
import { fetchCoverData, hasCoverContent, type CoverData } from "../../lib/launch/cover-data";
import { STEP_KIND, isStepDone } from "../../lib/launch/step-status";
import { useLaunchT } from "../../lib/launch/i18n";
import { useStepText, useJobReason, useStepActionLabel, useJobName } from "../../lib/launch/data-i18n";

// 주차 페이지용 스텝 목록 — 1주차처럼 순차 잠금 + 스텝별(섹션별) 결과 표시.
// 완료 상태는 백엔드(progress)에 저장돼 기기 간 동기화된다.
export function WeekStepper({ steps, sequential = true }: { steps: Step[]; sequential?: boolean }) {
  const t = useLaunchT();
  const stepText = useStepText();
  const actionLabel = useStepActionLabel();
  const jobReason = useJobReason();
  const jobName = useJobName();
  const [prog, setProg] = useState<CareerProgress>({});
  const [resume, setResume] = useState<ResumeData>({});
  const [cover, setCover] = useState<CoverData>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const [p, r, c] = await Promise.all([fetchProgress(), fetchResumeData().catch(() => ({ data: {} })), fetchCoverData().catch(() => ({ data: {} }))]);
        if (!alive) return;
        setProg(p);
        setResume(r.data ?? {});
        setCover(c.data ?? {});
      } catch {
        // 조회 실패 시 빈 상태
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const eduN = resume.educations?.length ?? 0;
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
    if (kind === "jobs" && (prog.selectedJobs?.length ?? 0) > 0) {
      return (
        <ResultCard continueHref="/career-launch/jobs" continueLabel={t("이어서", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref="/career-launch/jobs?restart=1">
          <p className="text-[13.5px] font-bold text-[#191F28]">{t("선정한 직무", "Selected jobs", "已选职位", "Công việc đã chọn", "選んだ職務", "Pekerjaan yang dipilih")} <span className="text-[#0B46E8]">{t(`${prog.selectedJobs!.length}개`, `${prog.selectedJobs!.length}`, `${prog.selectedJobs!.length} 个`, `${prog.selectedJobs!.length}`, `${prog.selectedJobs!.length}件`, `${prog.selectedJobs!.length}`)}</span></p>
          <ul className="mt-2 space-y-2">
            {prog.selectedJobs!.map((role) => {
              const job = RECOMMENDED_JOBS.find((x) => x.role === role);
              return (
                <li key={role} className="rounded-xl border border-[#EEF1F5] bg-white p-3">
                  <p className="text-[13px] font-bold text-[#191F28]">{jobName(role)}</p>
                  {job?.reason ? <p className="mt-1 break-keep text-[12px] leading-relaxed text-[#4E5968]">{jobReason(job.id)}</p> : null}
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
            {resume.educations!.map((e, i) => (
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
    // 자기소개서 — 문항별(한 스텝 = 한 문항). 해당 문항의 질문+답변만 보여준다.
    if (kind === "cover1" || kind === "cover2" || kind === "cover3" || kind === "cover4") {
      const idx = kind === "cover1" ? 0 : kind === "cover2" ? 1 : kind === "cover3" ? 2 : 3;
      const section = (["motive", "growth", "strength", "aspiration"] as const)[idx];
      const filled = (cover.items ?? []).filter((x) => (x.answer ?? "").trim());
      const it = filled[idx];
      if (!it) return null;
      return (
        <ResultCard continueHref={`/career-launch/cover-collect?section=${section}`} continueLabel={t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")} restartHref={`/career-launch/cover-collect?section=${section}&restart=1`}>
          <p className="break-keep text-[12.5px] font-bold text-[#191F28]">📝 {it.question}</p>
          <p className="mt-1 break-keep text-[12px] leading-relaxed text-[#4E5968]">{it.answer}</p>
        </ResultCard>
      );
    }
    // 면접 — 유형별 모의면접(자기소개/직무/인성). 완료했으면 카드 + 다시 연습 링크.
    if (kind === "interview-self" || kind === "interview-job" || kind === "interview-fit") {
      const type = kind === "interview-self" ? "self" : kind === "interview-job" ? "job" : "fit";
      if (!practicedTypes.includes(type)) return null;
      const label =
        type === "self"
          ? t("자기소개 면접", "Self-introduction interview", "自我介绍面试", "Phỏng vấn giới thiệu bản thân", "自己紹介面接", "Wawancara perkenalan diri")
          : type === "job"
            ? t("직무 면접", "Job interview", "职务面试", "Phỏng vấn công việc", "職務面接", "Wawancara pekerjaan")
            : t("인성·컬처핏 면접", "Personality & culture-fit interview", "人品·文化契合面试", "Phỏng vấn tính cách · phù hợp văn hóa", "人柄·カルチャーフィット面接", "Wawancara kepribadian & kecocokan budaya");
      return (
        <div className="mt-3 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-bold text-[#191F28]">🎤 {t(`${label} 연습 완료`, `${label} practice done`, `${label} 练习完成`, `Đã luyện tập ${label}`, `${label} 練習完了`, `Latihan ${label} selesai`)}</p>
            <Link href={`/career-launch/interview?section=${type}`} className="shrink-0 rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]">{t("다시 연습", "Practice again", "再练习", "Luyện lại", "もう一度練習", "Latihan lagi")}</Link>
          </div>
          <p className="mt-1 break-keep text-[12.5px] text-[#4E5968]">{t("면접관과 실전처럼 주고받으며 연습을 마쳤어요. 필요하면 다시 연습해봐요.", "You practiced a realistic back-and-forth with the interviewer. Practice again anytime you need.", "你与面试官进行了实战般的问答练习。需要的话可以再练习。", "Bạn đã luyện tập hỏi đáp thực tế với người phỏng vấn. Cần thì hãy luyện lại nhé.", "面接官と実践のようにやり取りしながら練習を終えました。必要ならまた練習してみましょう。", "Anda berlatih tanya-jawab layaknya nyata dengan pewawancara. Latih lagi kapan pun perlu.")}</p>
        </div>
      );
    }
    // 이력서 + 자기소개서 최종 점검 — 요약을 보여주고, 고칠 곳은 각각 week2/week3 로 이동해 수정.
    if (kind === "both" && (resumeReady || coverReady)) {
      const filledCover = (cover.items ?? []).filter((x) => (x.answer ?? "").trim());
      return (
        <div className="mt-3 space-y-3 rounded-2xl border border-[#EEF1F5] bg-[#FAFBFC] p-4">
          {resumeReady ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-[#191F28]">📄 {t(`이력서 — 경력 ${expN} · 스킬 ${skillN}`, `Resume — Experience ${expN} · Skills ${skillN}`, `简历 — 经历 ${expN} · 技能 ${skillN}`, `CV — Kinh nghiệm ${expN} · Kỹ năng ${skillN}`, `履歴書 — 職歴 ${expN} · スキル ${skillN}`, `Resume — Pengalaman ${expN} · Keterampilan ${skillN}`)}</p>
                <Link href="/career-launch/week/2" className="shrink-0 rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]">{t("이력서 수정하기", "Edit resume", "编辑简历", "Chỉnh sửa CV", "履歴書を修正", "Edit resume")}</Link>
              </div>
              {expN > 0 ? (
                <ul className="mt-1.5 space-y-1">
                  {resume.experiences!.map((x, i) => (
                    <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]"><span className="text-[#3A6B00]">•</span>{[x.title, x.org].filter(Boolean).join(" · ")}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
          {coverReady ? (
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold text-[#191F28]">📝 {t(`자기소개서 — 문항 ${coverN}개`, `Cover letter — ${coverN} questions`, `自我介绍书 — ${coverN} 道题`, `Thư giới thiệu bản thân — ${coverN} câu hỏi`, `自己紹介書 — 設問 ${coverN}件`, `Surat lamaran — ${coverN} pertanyaan`)}{cover.company ? ` · ${cover.company}` : ""}</p>
                <Link href="/career-launch/week/3" className="shrink-0 rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]">{t("자기소개서 수정하기", "Edit cover letter", "编辑自我介绍书", "Chỉnh sửa thư giới thiệu", "自己紹介書を修正", "Edit surat lamaran")}</Link>
              </div>
              <ul className="mt-1.5 space-y-1">
                {filledCover.map((it, i) => (
                  <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]"><span className="text-[#3A6B00]">•</span>{it.question}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      );
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
        return (
          <li key={s.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <button
                type="button"
                disabled={!toggleable}
                onClick={toggleable ? () => toggle(s.id) : undefined}
                aria-label={toggleable ? (done ? t("완료 취소", "Undo complete", "取消完成", "Hủy hoàn thành", "完了を取り消す", "Batalkan selesai") : t("완료로 표시", "Mark as complete", "标记为完成", "Đánh dấu hoàn thành", "完了にする", "Tandai selesai")) : undefined}
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-[14px] font-black shadow-sm transition ${
                  done
                    ? "bg-[#0B46E8] text-white"
                    : locked
                      ? "cursor-default border-2 border-[#E5E8EB] bg-[#F8FAFC] text-[#C9CDD2]"
                      : "border-2 border-[#D7DCE3] bg-white text-[#4E5968]"
                } ${toggleable ? "hover:border-[#0B46E8] hover:text-[#0B46E8]" : "cursor-default"}`}
              >
                {done ? "✓" : locked ? "🔒" : i + 1}
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
                <p className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium text-[#B0B8C1]">🔒 {t("이전 단계를 완료하면 시작할 수 있어요", "Finish the previous step to start this one.", "完成上一步后即可开始。", "Hoàn thành bước trước để bắt đầu bước này.", "前のステップを完了すると始められます。", "Selesaikan langkah sebelumnya untuk memulai.")}</p>
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
                    <Link href={s.action.href} className="rounded-lg bg-[#EDF1FD] px-3 py-1.5 text-[12px] font-bold text-[#0B46E8] transition hover:bg-[#DDE7FC]">
                      {t("다시 하기", "Do again", "重新做", "Làm lại", "もう一度する", "Ulangi")}
                    </Link>
                  ) : null}
                </div>
              ) : s.action ? (
                <Link
                  href={s.action.href}
                  className="group mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#0B46E8] px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  {actionLabel(s.action.label)} <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                </Link>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
    </>
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
