"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchOpsStudentDetail, type OpsStudentDetail } from "../../../../../lib/launch/ops-client";
import { hasResumeContent } from "../../../../../lib/launch/resume-data";
import { hasCoverContent } from "../../../../../lib/launch/cover-data";
import { RECOMMENDED_JOBS } from "../../../../../lib/launch/data";
import { ResumeRender } from "../../../../../components/launch/resume-render";
import { CoverRender } from "../../../../../components/launch/cover-render";
import { OperatorResumeFeedback } from "../../../../../components/launch/operator-resume-feedback";
import { Card, LaunchContainer, Pill, SectionTitle } from "../../../../../components/launch/ui";

// 운영자 학생 상세 — 진행 상태 + 대화로 만든 이력서 + 피드백 작성.
export default function LaunchOpsStudentDetailPage() {
  const params = useParams();
  const id = String((params as { id?: string })?.id ?? "");
  const [detail, setDetail] = useState<OpsStudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    let alive = true;
    void (async () => {
      try {
        const d = await fetchOpsStudentDetail(id);
        if (alive) setDetail(d);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "불러오지 못했어요.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const diag = detail?.state.diagnosis ?? null;
  const jobs = detail?.state.selectedJobs ?? [];
  const materials = detail?.state.materials ?? [];
  const doneSteps = detail?.state.doneSteps ?? [];
  const name = detail?.user.name?.trim() || detail?.user.realName?.trim() || detail?.user.email || "학생";

  return (
    <main className="pb-16">
      <LaunchContainer className="!max-w-6xl pt-6 md:pt-10">
        <Link href="/career-launch/ops/students" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
          ← 학생 목록
        </Link>

        {loading ? (
          <Card className="mt-4 !p-6 text-center text-[14px] text-[#8B95A1]">불러오는 중…</Card>
        ) : error || !detail ? (
          <Card className="mt-4 !p-6 text-center text-[14px] text-red-600">{error || "학생을 찾을 수 없어요."}</Card>
        ) : (
          <>
            {/* 헤더 */}
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-[#0B46E8] text-[18px] font-black text-white">
                {name.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-[19px] font-black tracking-[-0.01em] text-[#0B1227]">{name}</h1>
                <p className="truncate text-[12.5px] text-[#8B95A1]">
                  {detail.user.email}
                  {detail.user.phoneNumber ? ` · ${detail.user.phoneNumber}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-8">
              {/* 왼쪽: 진행 상태 + 이력서 */}
              <div>
            {/* 진단 결과 */}
            <div className="mt-6 first:mt-0">
              <SectionTitle>취업 준비 진단</SectionTitle>
              {diag && typeof diag.percent === "number" ? (
                <Card className="!p-4">
                  <p className="text-[14px] font-bold text-[#191F28]">
                    준비도 <span className="text-[#0B46E8]">{diag.percent}%</span>
                    {diag.level ? <span className="ml-1.5 text-[13px] font-normal text-[#4E5968]">· {diag.level}</span> : null}
                  </p>
                  {diag.strengths?.length ? (
                    <div className="mt-2">
                      <p className="text-[11.5px] font-bold text-[#3A6B00]">강점</p>
                      <ul className="mt-1 space-y-0.5">
                        {diag.strengths.map((x, i) => (
                          <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">✓</span>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {diag.improvements?.length ? (
                    <div className="mt-2">
                      <p className="text-[11.5px] font-bold text-[#8B95A1]">보완점</p>
                      <ul className="mt-1 space-y-0.5">
                        {diag.improvements.map((x, i) => (
                          <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#4E5968]"><span className="text-[#B0B8C1]">•</span>{x}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </Card>
              ) : (
                <Card className="!p-4 text-[13px] text-[#8B95A1]">아직 진단하지 않았어요.</Card>
              )}
            </div>

            {/* 선정 직무 */}
            <div className="mt-6">
              <SectionTitle>선정 직무 {jobs.length > 0 ? `(${jobs.length})` : ""}</SectionTitle>
              {jobs.length ? (
                <Card className="!p-4">
                  <ul className="space-y-2">
                    {jobs.map((role) => {
                      const job = RECOMMENDED_JOBS.find((x) => x.role === role);
                      return (
                        <li key={role} className="rounded-lg bg-[#F8FAFC] p-2.5">
                          <p className="text-[13px] font-bold text-[#191F28]">{role}</p>
                          {job?.reason ? <p className="mt-1 break-keep text-[12px] text-[#4E5968]">{job.reason}</p> : null}
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              ) : (
                <Card className="!p-4 text-[13px] text-[#8B95A1]">아직 선정하지 않았어요.</Card>
              )}
            </div>

            {/* 정리한 직무 정보 */}
            {materials.length ? (
              <div className="mt-6">
                <SectionTitle>정리한 직무 정보 ({materials.length})</SectionTitle>
                <Card className="!p-4">
                  <ul className="space-y-1.5">
                    {materials.map((m, i) => (
                      <li key={i} className="flex gap-1.5 break-keep text-[12.5px] text-[#333D4B]"><span className="text-[#3A6B00]">•</span>{m}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            ) : null}

            {/* 완료 스텝 */}
            {doneSteps.length ? (
              <div className="mt-6">
                <SectionTitle>완료 스텝 ({doneSteps.length})</SectionTitle>
                <Card className="!p-4">
                  <div className="flex flex-wrap gap-1.5">
                    {doneSteps.map((s) => (
                      <Pill key={s} tone="green">{s}</Pill>
                    ))}
                  </div>
                </Card>
              </div>
            ) : null}

            {/* 대화로 만든 이력서 */}
            <div className="mt-6">
              <SectionTitle>대화로 만든 이력서</SectionTitle>
              {hasResumeContent(detail.resume) ? (
                <ResumeRender data={detail.resume} maxWidth={440} />
              ) : (
                <Card className="!p-4 text-[13px] text-[#8B95A1]">아직 이력서를 만들지 않았어요.</Card>
              )}
            </div>

            {/* 대화로 만든 자기소개서 */}
            <div className="mt-6">
              <SectionTitle>대화로 만든 자기소개서</SectionTitle>
              {hasCoverContent(detail.cover) ? (
                <CoverRender data={detail.cover} />
              ) : (
                <Card className="!p-4 text-[13px] text-[#8B95A1]">아직 자기소개서를 만들지 않았어요.</Card>
              )}
            </div>

              </div>
              {/* 오른쪽: 피드백 (데스크탑에서 고정) */}
              <div className="lg:sticky lg:top-6">
                <SectionTitle>피드백</SectionTitle>
                <Card className="!p-4">
                  <OperatorResumeFeedback studentUserId={detail.user.id} allowDocTypeSelect studentName={name} />
                </Card>
              </div>
            </div>
          </>
        )}
      </LaunchContainer>
    </main>
  );
}
