"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchCoverData, hasCoverContent } from "../../lib/launch/cover-data";
import { SectionTitle, Card } from "./ui";
import { useLaunchT } from "../../lib/launch/i18n";

// 대시보드 '내 자기소개서' 카드 — 저장된 데이터 유무에 따라 시작하기/이어하기로 안내.
export function CoverCard() {
  const t = useLaunchT();
  const [has, setHas] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { data } = await fetchCoverData();
        if (alive) setHas(hasCoverContent(data));
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
      <SectionTitle>{t("내 자기소개서", "My cover letter", "我的自我介绍信", "Thư giới thiệu của tôi", "私の自己紹介書", "Surat lamaran saya")}</SectionTitle>
      <Card className="!p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[#EDF1FD] text-[20px]">📝</span>
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-[#191F28]">{t("대화로 만드는 자기소개서", "Build your cover letter through chat", "通过对话完成自我介绍信", "Viết thư giới thiệu qua trò chuyện", "会話で作る自己紹介書", "Buat surat lamaran lewat obrolan")}</p>
            <p className="mt-0.5 text-[12.5px] text-[#8B95A1]">
              {started
                ? t("이어서 대화하면 자기소개서가 더 채워져요", "Keep chatting to fill in more of your cover letter", "继续对话，自我介绍信会更加完善", "Tiếp tục trò chuyện để hoàn thiện thêm thư giới thiệu", "続けて会話すると自己紹介書がさらに充実します", "Lanjutkan mengobrol untuk melengkapi surat lamaran")
                : t("AI와 대화하면 자기소개서가 자동으로 쌓여요", "Chat with AI and your cover letter builds up automatically", "与 AI 对话，自我介绍信会自动积累", "Trò chuyện với AI, thư giới thiệu sẽ tự động hình thành", "AIと会話すると自己紹介書が自動で作られます", "Ngobrol dengan AI dan surat lamaran tersusun otomatis")}
            </p>
          </div>
        </div>
        <div className="mt-3">
          <Link
            href="/career-launch/cover-collect"
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
