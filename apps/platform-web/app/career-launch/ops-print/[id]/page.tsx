"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetchOpsStudentDetail } from "../../../../lib/launch/ops-client";
import { hasResumeContent } from "../../../../lib/launch/resume-data";
import { hasCoverContent } from "../../../../lib/launch/cover-data";
import { toResumeContent } from "../../../../components/launch/resume-render";
import type { ResumeContent, ResumeCoverLetterItem } from "../../../../lib/member-profile-client";
import { ResumeBuilderPreviewPage } from "../../../../components/resume-maker/ResumeBuilderPreviewPage";
import { CoverLetterPreviewPage } from "../../../../components/resume-maker/CoverLetterPreviewPage";
import { useAuthSession } from "../../../../components/auth/AuthSessionProvider";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 운영자용 학생 산출물 인쇄/PDF 화면.
// ops 세그먼트 바깥에 두어 운영 콘솔의 사이드바·헤더가 인쇄물에 섞이지 않게 한다.
// 학생용 미리보기와 동일한 resume-maker 컴포넌트를 재사용하므로 결과물이 완전히 같다.
export default function OpsPrintPage() {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const params = useParams();
  const search = useSearchParams();
  const id = String((params as { id?: string })?.id ?? "");
  const doc = search.get("doc") === "cover" ? "cover" : "resume";

  const [resume, setResume] = useState<ResumeContent | null>(null);
  const [items, setItems] = useState<ResumeCoverLetterItem[] | null>(null);
  const [company, setCompany] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    if (!isReady || !id) return;
    void (async () => {
      try {
        const d = await fetchOpsStudentDetail(id);
        if (doc === "resume") {
          if (hasResumeContent(d.resume)) {
            setResume(toResumeContent(d.resume));
            setState("ready");
          } else setState("empty");
        } else {
          if (hasCoverContent(d.cover)) {
            setItems(
              (d.cover.items ?? [])
                .filter((x) => (x.answer ?? "").trim())
                .map((x, i) => ({ id: String(i), prompt: x.question ?? "", answer: x.answer ?? "" }))
            );
            setCompany(d.cover.company ?? "");
            setState("ready");
          } else setState("empty");
        }
      } catch {
        setState("empty");
      }
    })();
  }, [isReady, id, doc]);

  if (state === "ready" && doc === "resume" && resume) {
    // [&_*]:!shadow-none — A4 페이지 카드 그림자(하단 실선처럼 보임) 제거.
    return (
      <div className="[&_*]:!shadow-none">
        <ResumeBuilderPreviewPage resumeId="" embedded preloadedContent={resume} />
      </div>
    );
  }

  if (state === "ready" && doc === "cover" && items) {
    return (
      <div className="[&_*]:!shadow-none">
        <CoverLetterPreviewPage embedded preloadedItems={items} preloadedCompany={company} />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6 text-center">
      <p className="text-[14px] text-[#8B95A1]">
        {state === "loading"
          ? t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")
          : doc === "resume"
            ? t("이 학생은 아직 이력서를 만들지 않았어요.", "This student hasn't created a resume yet.", "该学生尚未生成简历。", "Sinh viên này chưa tạo CV.", "この学生はまだ履歴書を作っていません。", "Siswa ini belum membuat resume.")
            : t("이 학생은 아직 자기소개서를 만들지 않았어요.", "This student hasn't created a cover letter yet.", "该学生尚未生成自我介绍。", "Sinh viên này chưa tạo thư xin việc.", "この学生はまだ自己PRを作っていません。", "Siswa ini belum membuat cover letter.")}
      </p>
    </main>
  );
}
