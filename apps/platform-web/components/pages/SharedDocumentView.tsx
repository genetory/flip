"use client";

// 공개(무인증) 이력서/자소서 원본 뷰 — 공유 링크로 접근. 실제 A4 렌더.
import Link from "next/link";
import { useEffect, useState } from "react";
import { CaretLeft } from "@phosphor-icons/react";
import { fetchSharedDocument } from "../../lib/launch/progress-client";
import { usePlatformT } from "../../lib/i18n";
import { ResumePreview } from "../resume-maker/ResumePreview";
import { DEFAULT_DESIGN } from "../../lib/resume-maker-types";
import { toResumeContent } from "../launch/resume-render";
import type { ResumeData } from "../../lib/launch/resume-data";
import { CoverRender } from "../launch/cover-render";
import type { CoverData } from "../../lib/launch/cover-data";

export function SharedDocumentView({ token, type }: { token: string; type: "resume" | "cover" }) {
  const t = usePlatformT();
  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");

  useEffect(() => {
    if (!token) return;
    let alive = true;
    void fetchSharedDocument(token, type).then((d) => {
      if (!alive) return;
      if (d) {
        setContent(d.content);
        setName(d.name);
        setStatus("ready");
      } else {
        setStatus("notfound");
      }
    });
    return () => {
      alive = false;
    };
  }, [token, type]);

  const title = type === "resume" ? t("이력서", "Resume", "简历", "Sơ yếu lý lịch", "履歴書", "Resume") : t("자기소개서", "Cover Letter", "自我介绍信", "Thư giới thiệu", "自己PR", "Surat Lamaran");

  return (
    <main className="min-h-screen bg-[#F4F6F9] px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <Link href={`/p/${token}`} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#8B95A1] transition hover:text-[#191F28]">
            <CaretLeft className="h-4 w-4" weight="bold" aria-hidden /> {t("프로필로", "To profile", "返回资料", "Về hồ sơ", "プロフィールへ", "Ke profil")}
          </Link>
          <p className="text-[13px] font-bold text-[#191F28]">{name ? `${name} · ${title}` : title}</p>
        </div>

        {status === "loading" ? (
          <p className="py-20 text-center text-[13px] text-[#8B95A1]">{t("불러오는 중…", "Loading…", "加载中…", "Đang tải…", "読み込み中…", "Memuat…")}</p>
        ) : status === "notfound" || !content ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_16px_40px_-20px_rgba(11,18,39,0.3)]">
            <p className="text-[15px] font-bold text-[#191F28]">{t("문서를 찾을 수 없어요", "Document not found", "找不到该文档", "Không tìm thấy tài liệu", "書類が見つかりません", "Dokumen tidak ditemukan")}</p>
            <p className="mt-1.5 text-[13px] text-[#8B95A1]">{t("링크가 만료되었거나 아직 작성되지 않았을 수 있어요.", "The link may have expired or the document may not be written yet.", "链接可能已过期，或文档尚未撰写。", "Liên kết có thể đã hết hạn hoặc tài liệu chưa được viết.", "リンクの有効期限が切れているか、まだ作成されていない可能性があります。", "Tautan mungkin sudah kedaluwarsa atau dokumen belum dibuat.")}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-[#F2F4F6] p-3 shadow-[0_16px_44px_-20px_rgba(11,18,39,0.34)]">
            {type === "resume" ? (
              <ResumePreview content={toResumeContent(content as ResumeData)} design={DEFAULT_DESIGN} preserveOrder />
            ) : (
              <CoverRender data={content as CoverData} />
            )}
          </div>
        )}
      </div>
    </main>
  );
}
