"use client";

// 작성 히스토리(전체) — 이력서·자기소개서에 남긴 커리어 기록 전체 목록.
import { CareerLayout } from "../career/CareerLayout";
import { FeedCard } from "../career/FeedCard";
import { useCareerFeed, removeFeedEntry } from "../../../lib/talent/career-feed";
import { usePlatformT } from "../../../lib/i18n";

export function CareerHistoryScreen() {
  const t = usePlatformT();
  const feed = useCareerFeed();
  return (
    <CareerLayout>
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-[20px] font-black tracking-[-0.02em] text-[#0B1227]">{t("작성 히스토리","Writing history","编写记录","Lịch sử viết","作成履歴","Riwayat penulisan")}{feed.length ? ` (${feed.length})` : ""}</h1>
          <p className="mt-1 text-[13.5px] text-[#8B95A1]">{t("이력서·자기소개서에 남긴 내용이 순서대로 쌓여요.","What you add to your resume and cover letter piles up in order.","你在简历和求职信中留下的内容会按顺序累积。","Nội dung bạn thêm vào CV và thư xin việc được lưu theo thứ tự.","履歴書・自己PRに残した内容が順に積み重なります。","Isian di CV dan surat lamaranmu tersimpan berurutan.")}</p>
        </div>

        {feed.length ? (
          <div className="flex flex-col gap-2.5">
            {feed.map((e) => (
              <FeedCard key={e.id} entry={e} onDelete={removeFeedEntry} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-8 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[22px]" aria-hidden>📝</span>
            <p className="mt-3 text-[15px] font-bold text-[#191F28]">{t("아직 남긴 기록이 없어요","No records yet","还没有记录","Chưa có ghi chép","まだ記録がありません","Belum ada catatan")}</p>
            <p className="mt-1 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{t("이력서나 자기소개서를 만들면 자동으로 여기에 쌓여요.","Create a resume or cover letter and it piles up here automatically.","制作简历或求职信后会自动累积在这里。","Tạo CV hoặc thư xin việc sẽ tự động lưu tại đây.","履歴書や自己PRを作ると自動でここに溜まります。","Buat CV atau surat lamaran, otomatis tersimpan di sini.")}</p>
          </div>
        )}
      </div>
    </CareerLayout>
  );
}
