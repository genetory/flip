"use client";

// 4주차 면접 준비 체크리스트 — 점수가 아니라 '무엇을 준비했는지'로 자신감을 쌓는다.
// 체크 상태는 유저별 localStorage에 저장(기기 공유 누수 방지).
import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Circle } from "@phosphor-icons/react";
import { Card } from "./ui";
import { useAuthSession } from "../auth/AuthSessionProvider";
import { useLaunchT } from "../../lib/launch/i18n";

export function InterviewPrepChecklist() {
  const t = useLaunchT();
  const { user } = useAuthSession();
  const uid = user?.id ?? "anon";
  const key = `aply_launch_interview_prep:${uid}`;

  // 준비 항목 — 한국 취업 면접 실전 기준.
  const items = useMemo(
    () => [
      { id: "intro", label: t("1분 자기소개 준비 (강점 1~2개 포함)", "Prepare a 1-min intro (with 1–2 strengths)", "准备1分钟自我介绍（含1~2个优势）", "Chuẩn bị giới thiệu 1 phút (kèm 1–2 điểm mạnh)", "1分自己紹介の準備（強み1~2つ）", "Siapkan perkenalan 1 menit (1–2 kelebihan)") },
      { id: "motive", label: t("지원 동기 3문장으로 정리", "Sum up your motivation in 3 sentences", "用3句话总结应聘动机", "Tóm tắt động lực ứng tuyển trong 3 câu", "志望動機を3文でまとめる", "Rangkum motivasi dalam 3 kalimat") },
      { id: "questions", label: t("예상 질문 5개 뽑아 답 연습", "Draft answers to 5 likely questions", "准备5个预测问题的答案", "Luyện trả lời 5 câu hỏi dự kiến", "予想質問5つの回答を練習", "Latih 5 pertanyaan yang mungkin") },
      { id: "research", label: t("지원 회사·직무 리서치 (하는 일·인재상)", "Research the company & role", "调研公司与职位", "Tìm hiểu công ty & vị trí", "会社・職務のリサーチ", "Riset perusahaan & posisi") },
      { id: "weakness", label: t("약점·개선점 답변 준비", "Prepare a weakness answer", "准备缺点/改进点回答", "Chuẩn bị câu trả lời điểm yếu", "弱み・改善点の回答準備", "Siapkan jawaban kelemahan") },
      { id: "logistics", label: t("복장·면접 장소/온라인 접속 점검", "Check attire & interview access", "检查着装与面试方式", "Kiểm tra trang phục & cách phỏng vấn", "服装・面接会場/接続の確認", "Cek pakaian & akses wawancara") }
    ],
    [t]
  );

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      const arr = raw ? (JSON.parse(raw) as unknown) : [];
      setChecked(new Set(Array.isArray(arr) ? (arr.filter((x) => typeof x === "string") as string[]) : []));
    } catch { /* ignore */ }
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  function toggle(id: string) {
    setChecked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      if (typeof window !== "undefined") {
        try { window.localStorage.setItem(key, JSON.stringify([...n])); } catch { /* ignore */ }
      }
      return n;
    });
  }

  const done = items.filter((i) => checked.has(i.id)).length;

  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-[#4E5968]">{t("면접 준비 체크리스트", "Interview prep checklist", "面试准备清单", "Danh sách chuẩn bị phỏng vấn", "面接準備チェックリスト", "Daftar persiapan wawancara")}</span>
        <span className="text-[12px] font-bold text-[#0B46E8]">{loaded ? `${done}/${items.length}` : ""}</span>
      </div>
      <p className="mt-1.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("점수가 아니라, 무엇을 준비했는지로 자신감을 쌓아요.", "Build confidence by what you've prepared — not a score.", "用准备程度而非分数建立自信。", "Xây tự tin bằng sự chuẩn bị, không phải điểm số.", "点数ではなく、準備した内容で自信を積みましょう。", "Bangun percaya diri dari persiapan, bukan skor.")}</p>
      <ul className="mt-3 flex flex-col gap-1.5">
        {items.map((it) => {
          const on = checked.has(it.id);
          return (
            <li key={it.id}>
              <button type="button" onClick={() => toggle(it.id)} className="flex w-full items-start gap-2.5 rounded-xl px-1 py-1.5 text-left transition hover:bg-[#F6F8FB]">
                {on ? <CheckCircle className="mt-[1px] h-5 w-5 shrink-0 text-[#0A9B59]" weight="fill" /> : <Circle className="mt-[1px] h-5 w-5 shrink-0 text-[#C4CAD2]" />}
                <span className={`break-keep text-[13.5px] leading-relaxed ${on ? "text-[#8B95A1] line-through" : "text-[#333D4B]"}`}>{it.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
