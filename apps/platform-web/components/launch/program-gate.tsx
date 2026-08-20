"use client";

import { usePathname } from "next/navigation";
import { EnrollmentGate } from "./enrollment-gate";

// 학생 프로그램 라우트에만 등록(EnrollmentGate)을 적용한다.
// 랜딩/로그인(/career-launch), 운영 콘솔(/career-launch/ops·ops-report), 리다이렉트(/apply)는 제외 —
// 랜딩을 게이트로 감싸면 미로그인 방문자가 로그인 대신 초대코드 화면을 보게 되기 때문.
// 운영자는 API에서 항상 enrolled=true 로 처리되어 그대로 통과한다.
const GATED_PREFIXES = [
  "/career-launch/week",
  "/career-launch/diagnosis",
  "/career-launch/experience",
  "/career-launch/jobs",
  "/career-launch/materials",
  "/career-launch/resume-collect",
  "/career-launch/resume-preview",
  "/career-launch/cover-collect",
  "/career-launch/cover-preview",
  "/career-launch/interview",
  "/career-launch/culture"
];

export function ProgramGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const gated = GATED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!gated) return <>{children}</>;
  return <EnrollmentGate>{children}</EnrollmentGate>;
}
