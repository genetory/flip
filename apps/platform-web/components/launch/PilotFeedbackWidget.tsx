"use client";

// Phase 9 학생용 짧은 인앱 피드백 — 각 주차(카테고리)를 끝냈을 때 그 주차 설문만 1회 노출한다.
// 상시로 떠 있지 않는다: surveyKey 가 지정되고 그 설문이 아직 미응답일 때만 나타나며, 응답/닫기 후에는 다시 뜨지 않는다.
// 원문은 서버로 보내지 않으며(정성 피드백은 category만), 분석 이벤트에도 원문·개인정보를 넣지 않는다.
import { useEffect, useState } from "react";
import { X, ChatCircleDots } from "@phosphor-icons/react";
import { fetchPendingSurveys, submitSurvey, submitQualitativeFeedback, type PendingSurvey } from "../../lib/launch/pilot-client";
import { trackCareerFunnel } from "../../lib/analytics";
import { useLaunchT } from "../../lib/launch/i18n";

type LaunchT = ReturnType<typeof useLaunchT>;
function quickFeedback(t: LaunchT): { category: string; label: string }[] {
  return [
    { category: "already_answered", label: t("이미 답했어요", "Already answered", "已经回答过", "Đã trả lời rồi", "すでに答えました", "Sudah dijawab") },
    { category: "too_many_questions", label: t("질문이 너무 많아요", "Too many questions", "问题太多了", "Quá nhiều câu hỏi", "質問が多すぎます", "Terlalu banyak pertanyaan") },
    { category: "result_mismatch", label: t("결과가 내 경험과 달라요", "Results don't match my experience", "结果与我的经历不符", "Kết quả không khớp kinh nghiệm của tôi", "結果が自分の経験と違います", "Hasil tidak sesuai pengalamanku") },
    { category: "want_human", label: t("사람에게 상담받고 싶어요", "I want to talk to a person", "我想找真人咨询", "Tôi muốn tư vấn với người thật", "人に相談したいです", "Ingin bicara dengan orang") },
    { category: "content_lost", label: t("작성 내용이 사라졌어요", "My work disappeared", "填写的内容消失了", "Nội dung đã viết bị mất", "入力内容が消えました", "Isianku hilang") }
  ];
}

// 닫은 설문은 재노출하지 않도록 로컬에 기록(주차 설문은 응답/닫기 후 다시 뜨지 않음).
const dismissKey = (k: string) => `cl_survey_dismissed_${k}`;
function isDismissed(k: string): boolean {
  try {
    return window.localStorage.getItem(dismissKey(k)) === "1";
  } catch {
    return false;
  }
}

// surveyKey 를 지정한 경우에만, 그 설문이 미응답이고 닫지 않았을 때 1회 노출한다.
// surveyKey 가 없으면 아무것도 렌더하지 않는다(상시 노출 방지).
export function PilotFeedbackWidget({ surveyKey, currentWeek, currentStep }: { surveyKey?: string; currentWeek?: number; currentStep?: string }) {
  const t = useLaunchT();
  const [survey, setSurvey] = useState<PendingSurvey | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [done, setDone] = useState(false);
  const [openQuick, setOpenQuick] = useState(false);
  const [quickSent, setQuickSent] = useState<string | null>(null);

  useEffect(() => {
    if (!surveyKey || isDismissed(surveyKey)) return; // 컨텍스트 없음 or 이미 닫음 → 노출 안 함.
    let alive = true;
    void (async () => {
      try {
        const pending = await fetchPendingSurveys();
        const pick = pending.find((p) => p.surveyKey === surveyKey);
        if (alive && pick) {
          setSurvey(pick);
          trackCareerFunnel("career_pilot_survey_prompted", { surveyKey: pick.surveyKey });
        }
      } catch {
        /* 등록 안 됨/파일럿 아님 — 조용히 무시 */
      }
    })();
    return () => {
      alive = false;
    };
  }, [surveyKey]);

  const submit = async () => {
    if (!survey) return;
    try {
      await submitSurvey(survey.surveyKey, answers, comment.trim() || undefined);
      trackCareerFunnel("career_pilot_survey_submitted", { surveyKey: survey.surveyKey });
    } catch {
      /* 실패해도 재노출 방지 */
    } finally {
      try {
        window.localStorage.setItem(dismissKey(survey.surveyKey), "1");
      } catch {
        /* 무시 */
      }
      setDone(true);
    }
  };
  const dismiss = () => {
    if (survey) {
      try {
        window.localStorage.setItem(dismissKey(survey.surveyKey), "1");
      } catch {
        /* 무시 */
      }
    }
    setDismissed(true);
  };
  const sendQuick = async (category: string) => {
    setQuickSent(category);
    try {
      await submitQualitativeFeedback(category, { currentWeek, currentStep });
      trackCareerFunnel("career_pilot_feedback_submitted", { category });
    } catch {
      /* 무시 */
    }
  };

  // 컨텍스트 설문이 없으면 상시로 떠 있지 않는다.
  if (dismissed || !survey) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[320px] max-w-[calc(100vw-2rem)]">
      {!done ? (
        <div className="bg-white rounded-xl border border-[#EEF1F5] shadow-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-semibold text-[#191F28]">{survey.label} {t("설문 (1분)", "survey (1 min)", "问卷（1分钟）", "khảo sát (1 phút)", "アンケート（1分）", "survei (1 mnt)")}</span>
            <button onClick={dismiss} aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} className="text-[#8B95A1]">
              <X size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-2 max-h-[46vh] overflow-y-auto">
            {survey.questions.map((q) => (
              <div key={q.key}>
                <div className="text-[12px] text-[#4E5968] mb-1">{q.text}</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setAnswers((a) => ({ ...a, [q.key]: n }))}
                      className={`w-8 h-8 rounded-lg text-[12px] border ${answers[q.key] === n ? "bg-[#3182F6] text-white border-[#3182F6]" : "bg-white text-[#8B95A1] border-[#E5E8EB]"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} placeholder={t("한 줄 의견(선택)", "One-line comment (optional)", "一句话意见（选填）", "Nhận xét một dòng (tùy chọn)", "一言コメント（任意）", "Komentar singkat (opsional)")} className="w-full h-14 px-2 py-1.5 rounded-lg border border-[#E5E8EB] text-[12px] resize-none" />
          </div>
          <button onClick={submit} disabled={Object.keys(answers).length === 0} className="mt-2 w-full h-9 rounded-lg bg-[#3182F6] text-white text-[13px] font-medium disabled:opacity-40">
            {t("제출", "Submit", "提交", "Gửi", "送信", "Kirim")}
          </button>
          {/* 빠른 정성 피드백 — 설문 컨텍스트 안에서만(상시 플로팅 아님) */}
          <div className="mt-2 border-t border-[#F2F4F6] pt-2">
            {quickSent ? (
              <p className="text-[12px] text-[#0A9B59]">{t("전달했어요. 감사합니다!", "Sent. Thank you!", "已发送，谢谢！", "Đã gửi. Cảm ơn!", "送信しました。ありがとうございます！", "Terkirim. Terima kasih!")}</p>
            ) : openQuick ? (
              <div className="flex flex-wrap gap-1.5">
                {quickFeedback(t).map((q) => (
                  <button key={q.category} onClick={() => sendQuick(q.category)} className="px-2.5 py-1 rounded-full bg-[#E8F3FF] text-[#1B64DA] text-[12px] border border-[#3182F6]/15">
                    {q.label}
                  </button>
                ))}
              </div>
            ) : (
              <button onClick={() => setOpenQuick(true)} className="flex items-center gap-1 text-[12px] text-[#4E5968]">
                <ChatCircleDots size={13} /> {t("다른 의견 남기기", "Leave other feedback", "留下其他意见", "Để lại ý kiến khác", "他の意見を残す", "Beri masukan lain")}
              </button>
            )}
          </div>
          <p className="text-[11px] text-[#B0B8C1] mt-1.5">{t("1~5점 척도. 응답은 익명 집계에만 쓰이며 원문은 저장하지 않아요.", "1–5 scale. Responses are used only for anonymous aggregates; text isn't stored.", "1~5分制。回答仅用于匿名统计，不保存原文。", "Thang 1–5. Phản hồi chỉ dùng cho tổng hợp ẩn danh; không lưu nội dung.", "1〜5点。回答は匿名集計のみに使い、原文は保存しません。", "Skala 1–5. Jawaban hanya untuk agregat anonim; teks tidak disimpan.")}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#EEF1F5] shadow-lg p-3 text-[13px] text-[#0A9B59]">{t("응답 감사합니다!", "Thanks for your response!", "感谢你的回答！", "Cảm ơn phản hồi của bạn!", "ご回答ありがとうございます！", "Terima kasih atas responsmu!")}</div>
      )}
    </div>
  );
}
