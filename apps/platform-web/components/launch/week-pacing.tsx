"use client";

// "이번 주 이렇게 진행해봐요" — 한 주 분량을 며칠에 나눠 하도록 안내하는 페이싱 가이드.
// 한자리에서 다 끝내기보다 세션을 나눠 깊이 있게 준비하도록 유도한다. 콘텐츠 없으면 숨음.
import { useState } from "react";
import { CalendarBlank, CaretDown } from "@phosphor-icons/react";
import { useLaunchT } from "../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;
type Session = { day: string; label: string; mins: string };

function weekSessions(t: LaunchT, week: number): Session[] {
  if (week === 1)
    return [
      { day: t("1일차", "Day 1", "第1天", "Ngày 1", "1日目", "Hari 1"), label: t("배우기 + 첫 커리어 상담(진단)", "Read + first coaching (diagnosis)", "学习 + 首次咨询（诊断）", "Đọc + tư vấn đầu (chẩn đoán)", "学び + 初回相談（診断）", "Baca + konseling awal (diagnosis)"), mins: "~20m" },
      { day: t("2일차", "Day 2", "第2天", "Ngày 2", "2日目", "Hari 2"), label: t("내 경험 찾아보기", "Find my experiences", "发掘我的经验", "Tìm kinh nghiệm", "経験を見つける", "Temukan pengalaman"), mins: "~15m" },
      { day: t("3일차", "Day 3", "第3天", "Ngày 3", "3日目", "Hari 3"), label: t("관심 직무 선정 + 목표 직무 확정", "Pick roles + confirm target", "选定职务 + 确定目标", "Chọn nghề + xác nhận mục tiêu", "職務選定 + 目標確定", "Pilih peran + konfirmasi target"), mins: "~20m" },
      { day: t("4일차", "Day 4", "第4天", "Ngày 4", "4日目", "Hari 4"), label: t("선정 직무 깊이 알기", "Learn your roles in depth", "深入了解职务", "Hiểu sâu nghề", "職務を深く知る", "Pahami peran"), mins: "~15m" },
      { day: t("5일차", "Day 5", "第5天", "Ngày 5", "5日目", "Hari 5"), label: t("강점 스토리 만들기", "Build a strength story", "打造优势故事", "Tạo câu chuyện điểm mạnh", "強みストーリー作成", "Buat cerita kelebihan"), mins: "~15m" },
      { day: t("6일차", "Day 6", "第6天", "Ngày 6", "6日目", "Hari 6"), label: t("한국 기업문화 이해 + 이번 주 정리", "Korean work culture + weekly wrap-up", "了解韩国企业文化 + 本周总结", "Văn hóa công sở Hàn + tổng kết tuần", "韓国企業文化 + 週まとめ", "Budaya kerja Korea + rangkuman"), mins: "~15m" }
    ];
  return [];
}

export function WeekPacing({ week }: { week: number }) {
  const t = useLaunchT();
  const sessions = weekSessions(t, week);
  const [open, setOpen] = useState(true); // 기본 펼침
  if (sessions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-2.5 px-4 py-3 text-left">
        <CalendarBlank className="h-[18px] w-[18px] flex-none text-[#0B46E8]" weight="fill" aria-hidden />
        <span className="min-w-0 flex-1 break-keep text-[13.5px] font-bold text-[#191F28]">{t("이번 주, 며칠에 나눠서 해보세요", "Spread this week over a few days", "本周分几天来完成", "Chia tuần này ra vài ngày", "今週は数日に分けて進めよう", "Bagi minggu ini jadi beberapa hari")}</span>
        <CaretDown className={`h-4 w-4 flex-none text-[#8B95A1] transition-transform ${open ? "rotate-180" : ""}`} weight="bold" aria-hidden />
      </button>
      {open ? (
        <div className="border-t border-[#EEF1F5] px-4 py-3">
          <p className="mb-2.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("한 번에 다 하기보다 며칠에 나눠 하면 더 깊이 있게 준비할 수 있어요. 아래는 추천 진행일 뿐, 편한 속도로 하세요.", "Doing it over several days beats cramming it all at once. This is just a suggestion — go at your own pace.", "分几天进行比一次全部完成更深入。以下只是建议，按你舒服的节奏来。", "Chia ra vài ngày sẽ sâu hơn làm dồn một lần. Đây chỉ là gợi ý — cứ theo nhịp của bạn.", "一度に全部よりも数日に分けた方が深く準備できます。あくまで目安なので、無理なく進めて。", "Beberapa hari lebih baik daripada sekaligus. Ini hanya saran — sesuaikan ritmemu.")}</p>
          <ol className="flex flex-col gap-1.5">
            {sessions.map((s, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl bg-[#FAFBFC] px-3 py-2.5">
                <span className="w-12 flex-none text-[11.5px] font-black text-[#0B46E8]">{s.day}</span>
                <span className="min-w-0 flex-1 break-keep text-[13px] font-semibold text-[#333D4B]">{s.label}</span>
                <span className="flex-none text-[11px] font-semibold text-[#B0B8C1]">{s.mins}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
