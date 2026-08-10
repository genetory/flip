"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCoverData, hasCoverContent } from "../../../lib/launch/cover-data";
import type { ResumeCoverLetterItem } from "../../../lib/member-profile-client";
import { CoverLetterPreviewPage } from "../../../components/resume-maker/CoverLetterPreviewPage";
import { CareerLaunchHeader } from "../../../components/launch/CareerLaunchHeader";
import { AplyFooter } from "../../../components/AplyFooter";
import { useAuthSession } from "../../../components/auth/AuthSessionProvider";
import { trackCareerPdfDownload } from "../../../lib/analytics";
import { useLaunchT } from "../../../lib/launch/i18n";

// 대화로 쓴 자기소개서를 resume-maker 의 자소서 미리보기/PDF 화면 그대로 보여준다.
export default function CoverPreviewPage() {
  const t = useLaunchT();
  const { isReady } = useAuthSession();
  const [items, setItems] = useState<ResumeCoverLetterItem[] | null>(null);
  const [company, setCompany] = useState("");
  const [state, setState] = useState<"loading" | "ready" | "empty">("loading");

  useEffect(() => {
    if (!isReady) return;
    void (async () => {
      try {
        const { data } = await fetchCoverData();
        if (hasCoverContent(data)) {
          const mapped = (data.items ?? [])
            .filter((x) => (x.answer ?? "").trim())
            .map((x, i) => ({ id: String(i), prompt: x.question ?? "", answer: x.answer ?? "" }));
          setItems(mapped);
          setCompany(data.company ?? "");
          setState("ready");
        } else {
          setState("empty");
        }
      } catch {
        setState("empty");
      }
    })();
  }, [isReady]);

  // 완성본이 있으면 resume-maker 자소서 미리보기/PDF 화면(embedded)으로 렌더.
  // [&_*]:!shadow-none — A4 페이지 카드 그림자(하단 실선처럼 보임) 제거.
  if (state === "ready" && items) {
    return (
      <div className="[&_*]:!shadow-none">
        <CoverLetterPreviewPage embedded preloadedItems={items} preloadedCompany={company} onPdf={() => trackCareerPdfDownload("cover")} />
      </div>
    );
  }

  // 로딩·빈 상태 — 사이트 셸로 안내.
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CareerLaunchHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-5 pt-6 md:pt-10">
          <Link href="/career-launch/dashboard" className="text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            ← {t("대시보드", "Dashboard", "仪表盘", "Bảng điều khiển", "ダッシュボード", "Dasbor")}
          </Link>
          <div className="mt-6">
            {state === "loading" ? (
              <div className="rounded-2xl border border-[#E5E8EB] bg-white p-8 text-center text-[14px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#D7DCE3] bg-white p-8 text-center">
                <p className="text-[14px] font-semibold text-[#4E5968]">{t("아직 작성한 자기소개서가 없어요.", "You haven't written a cover letter yet.", "你还没有写自我介绍信。", "Bạn chưa viết thư giới thiệu bản thân nào.", "まだ作成した自己紹介書がありません。", "Kamu belum menulis cover letter apa pun.")}</p>
                <p className="mt-1 text-[13px] text-[#8B95A1]">{t("AI와 대화하면 자기소개서가 자동으로 만들어져요.", "Chat with the AI and your cover letter is created automatically.", "与AI对话，系统会自动生成你的自我介绍信。", "Trò chuyện với AI và thư giới thiệu bản thân sẽ được tạo tự động.", "AIと会話すると、自己紹介書が自動で作成されます。", "Mengobrol dengan AI dan cover letter kamu dibuat secara otomatis.")}</p>
                <Link
                  href="/career-launch/cover-collect"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#0B46E8] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#0A3ECB]"
                >
                  {t("대화로 자기소개서 쓰기 →", "Write your cover letter by chatting →", "通过对话撰写自我介绍信 →", "Viết thư giới thiệu bản thân qua trò chuyện →", "会話で自己紹介書を書く →", "Tulis cover letter lewat obrolan →")}
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
