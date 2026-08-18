"use client";

// 지원/모의 면접 준비도 — 기본 정보 + 이력서 + 자기소개서 완성도를 한곳에서 계산.
// 지원·모의는 세 가지가 모두 100%여야 열린다(ApplyModal/MockGateModal과 동일 기준).
import { useBasicInfo, isBasicInfoComplete, basicInfoChecklist } from "./basic-info";
import { useResumeDoc, resumeCompleteness, useRenewalDocsStatus } from "./resume-doc";
import { useCoverDoc, coverCompleteness } from "./cover-doc";
import { talentAppRoutes } from "./app-nav";
import { usePlatformT } from "../i18n";

export interface ReadinessStep {
  key: "basic" | "resume" | "cover";
  label: string;
  pct: number; // 0~100
  done: boolean;
  href: string;
  cta: string; // 미완료 시 행동 라벨
}

export interface ApplyReadiness {
  loaded: boolean;
  ready: boolean; // 지원·모의 가능
  pct: number; // 전체 준비도(세 항목 평균)
  steps: ReadinessStep[];
  remaining: ReadinessStep[]; // 미완료 항목만(준비도 낮은 순)
}

export function useApplyReadiness(): ApplyReadiness {
  const t = usePlatformT();
  const status = useRenewalDocsStatus();
  const basic = useBasicInfo();
  const resume = useResumeDoc();
  const cover = useCoverDoc();

  const checklist = basicInfoChecklist(basic, t).filter((c) => !c.optional);
  const basicDone = checklist.filter((c) => c.done).length;
  const basicPct = checklist.length ? Math.round((basicDone / checklist.length) * 100) : 0;
  const resumePct = resumeCompleteness(resume);
  const coverPct = coverCompleteness(cover);

  const steps: ReadinessStep[] = [
    { key: "basic", label: t("기본 정보", "Basic info", "基本信息", "Thông tin cơ bản", "基本情報", "Info dasar"), pct: basicPct, done: isBasicInfoComplete(basic), href: talentAppRoutes.profile, cta: basicPct === 0 ? t("등록하기", "Add", "填写", "Thêm", "登録", "Isi") : t("완성하기", "Complete", "完成", "Hoàn thành", "完成", "Lengkapi") },
    { key: "resume", label: t("이력서", "Resume", "简历", "CV", "履歴書", "Resume"), pct: resumePct, done: resumePct >= 100, href: talentAppRoutes.resume, cta: resumePct === 0 ? t("만들기", "Create", "制作", "Tạo", "作成", "Buat") : t("완성하기", "Complete", "完成", "Hoàn thành", "完成", "Lengkapi") },
    { key: "cover", label: t("자기소개서", "Cover letter", "自荐信", "Thư giới thiệu", "自己PR", "Surat lamaran"), pct: coverPct, done: coverPct >= 100, href: talentAppRoutes.cover, cta: coverPct === 0 ? t("만들기", "Create", "制作", "Tạo", "作成", "Buat") : t("완성하기", "Complete", "完成", "Hoàn thành", "完成", "Lengkapi") }
  ];

  const ready = steps.every((s) => s.done);
  const pct = Math.round(steps.reduce((sum, s) => sum + s.pct, 0) / steps.length);
  const remaining = steps.filter((s) => !s.done).sort((a, b) => b.pct - a.pct);

  return { loaded: status === "loaded", ready, pct, steps, remaining };
}
