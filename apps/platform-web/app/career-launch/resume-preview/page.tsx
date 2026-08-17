"use client";
import { CaretLeft, CircleNotch } from "@phosphor-icons/react";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchResumeData, hasResumeContent } from "../../../lib/launch/resume-data";
import { toResumeContent } from "../../../components/launch/resume-render";
import type { ResumeContent } from "../../../lib/member-profile-client";
import { ResumeBuilderPreviewPage } from "../../../components/resume-maker/ResumeBuilderPreviewPage";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { trackCareerPdfDownload } from "../../../lib/analytics";
import { useLaunchT } from "../../../lib/launch/i18n";

// 대화로 쌓은 이력서를 resume-maker 의 이력서 미리보기/PDF 화면 그대로 보여준다.
export default function ResumePreviewPage() {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const [content, setContent] = useState<ResumeContent | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    if (!isReady) return;
    void (async () => {
      try {
        const { data } = await fetchResumeData();
        if (hasResumeContent(data)) {
          setContent(toResumeContent(data));
          setState("ready");
        } else {
          setState("empty");
        }
      } catch {
        setState("empty");
      }
    })();
  }, [isReady]);

  // 완성본이 있으면 resume-maker 미리보기/PDF 화면(embedded)으로 렌더.
  // [&_*]:!shadow-none — A4 페이지 카드 그림자(하단 실선처럼 보임) 제거.
  if (state === "ready" && content) {
    return (
      <div className="[&_*]:!shadow-none">
        <ResumeBuilderPreviewPage resumeId="" embedded preloadedContent={content} onPdf={() => trackCareerPdfDownload("resume")} />
      </div>
    );
  }

  // 로딩·빈 상태 — 사이트 셸로 안내.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-5xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("대시보드", "Dashboard", "仪表盘", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
          </Link>
          <div className="mt-6">
            {state === "loading" ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-[#E5E8EB] bg-white p-8 text-[14px] text-[#8B95A1]"><CircleNotch className="h-4 w-4 animate-spin" weight="bold" aria-hidden /> {t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D7DCE3] bg-white p-8 text-center">
                <p className="text-[14px] font-semibold text-[#4E5968]">{t("아직 채운 이력서 정보가 없어요.", "You haven't filled in any resume details yet.", "你还没有填写任何简历信息。", "Bạn chưa điền thông tin sơ yếu lý lịch nào.", "まだ入力された履歴書の情報がありません。", "Kamu belum mengisi detail resume apa pun.")}</p>
                <p className="mt-1 text-[13px] text-[#8B95A1]">{t("AI와 대화하면 이력서가 자동으로 만들어져요.", "Chat with the AI and your resume is created automatically.", "与AI对话，系统会自动生成你的简历。", "Trò chuyện với AI và sơ yếu lý lịch của bạn sẽ được tạo tự động.", "AIと会話すると、履歴書が自動で作成されます。", "Mengobrol dengan AI dan resume kamu dibuat secara otomatis.")}</p>
                <Link
                  href="/career-launch/resume-collect"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  {t("대화로 이력서 채우기 →", "Build your resume by chatting →", "通过对话填写简历 →", "Điền sơ yếu lý lịch qua trò chuyện →", "会話で履歴書を作成する →", "Isi resume lewat obrolan →")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <AplyFooter />
    </div>
  );
}
