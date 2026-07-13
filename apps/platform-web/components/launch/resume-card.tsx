"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchResumeData, hasResumeContent } from "../../lib/launch/resume-data";
import { SectionTitle, Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

// 대시보드 '내 이력서' 카드 — 저장된 데이터 유무에 따라 시작하기/이어하기로 안내.
export function ResumeCard() {
  const t = useLaunchT();
  const [has, setHas] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { data } = await fetchResumeData();
        if (alive) setHas(hasResumeContent(data));
      } catch {
        if (alive) setHas(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const started = has === true;

  return (
    <div>
      <SectionTitle>{t("내 이력서", "My resume", "我的简历", "Sơ yếu lý lịch của tôi", "私の履歴書", "Resume saya")}</SectionTitle>
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[20px]">📄</span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#191F28]">{t("대화로 만드는 이력서", "Build your resume through chat", "通过对话完成简历", "Viết sơ yếu lý lịch qua trò chuyện", "会話で作る履歴書", "Buat resume lewat obrolan")}</p>
            <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">
              {started
                ? t("이어서 대화하면 이력서가 더 채워져요", "Keep chatting to fill in more of your resume", "继续对话，简历会更加完善", "Tiếp tục trò chuyện để hoàn thiện thêm sơ yếu lý lịch", "続けて会話すると履歴書がさらに充実します", "Lanjutkan mengobrol untuk melengkapi resume")
                : t("AI와 대화하면 이력서가 자동으로 쌓여요", "Chat with AI and your resume builds up automatically", "与 AI 对话，简历会自动积累", "Trò chuyện với AI, sơ yếu lý lịch sẽ tự động hình thành", "AIと会話すると履歴書が自動で作られます", "Ngobrol dengan AI dan resume tersusun otomatis")}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Link
            href="/career-launch/resume-collect"
            className="flex items-center justify-center rounded-lg bg-[#0B46E8] px-3 py-2 text-[13px] font-bold text-white transition hover:bg-[#0A3ECB]"
          >
            {started
              ? t("이어하기", "Continue", "继续", "Tiếp tục", "続ける", "Lanjutkan")
              : t("시작하기", "Get started", "开始", "Bắt đầu", "始める", "Mulai")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
