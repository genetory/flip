"use client";

// 대학 랜딩용 '1분 커리어 진단 맛보기' — 가입 전에 3번의 탭만으로 대략적인 준비도와 다음
// 단계를 즉시 보여주는 훅. 정확한 진단은 가입 후로 유도(전환율↑). 서버 호출 없음(클라이언트).
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ArrowClockwise } from "@phosphor-icons/react";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

type Step = "goal" | "docs" | "interview";
type Answers = Partial<Record<Step, number>>;

function useQuestions(t: PlatformT) {
  return [
    {
      key: "goal" as Step,
      q: t("목표 직무가 정해졌나요?", "Do you have a target role?", "确定目标职务了吗？", "Bạn đã có vị trí mục tiêu chưa?", "目標の職種は決まっていますか？", "Sudah punya peran target?"),
      opts: [
        { label: t("정해졌어요", "Yes, decided", "已确定", "Đã có", "決まっています", "Sudah"), score: 16 },
        { label: t("탐색 중이에요", "Still exploring", "还在探索", "Đang tìm hiểu", "探し中です", "Masih cari"), score: 7 }
      ]
    },
    {
      key: "docs" as Step,
      q: t("이력서·자기소개서는요?", "Resume & cover letter?", "简历与自我介绍呢？", "CV & thư giới thiệu?", "履歴書・自己紹介書は？", "Resume & surat?"),
      opts: [
        { label: t("아직 없어요", "Not yet", "还没有", "Chưa có", "まだです", "Belum"), score: 6 },
        { label: t("초안 있어요", "Have a draft", "有草稿", "Có bản nháp", "下書きあり", "Ada draf"), score: 20 },
        { label: t("거의 완성", "Almost done", "基本完成", "Gần xong", "ほぼ完成", "Hampir jadi"), score: 30 }
      ]
    },
    {
      key: "interview" as Step,
      q: t("면접 준비는요?", "Interview prep?", "面试准备呢？", "Chuẩn bị phỏng vấn?", "面接準備は？", "Persiapan wawancara?"),
      opts: [
        { label: t("안 했어요", "Not started", "还没开始", "Chưa bắt đầu", "まだです", "Belum"), score: 6 },
        { label: t("조금 했어요", "A little", "做了一点", "Một chút", "少しだけ", "Sedikit"), score: 18 },
        { label: t("자신 있어요", "Confident", "很有信心", "Tự tin", "自信あり", "Pede"), score: 30 }
      ]
    }
  ];
}

export function UniversityDiagnosisTeaser({ accent, ctaHref, onCta }: { accent: string; ctaHref: string; onCta?: () => void }) {
  const t = usePlatformT();
  const questions = useQuestions(t);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  const done = idx >= questions.length;

  const pick = (key: Step, score: number) => {
    setAnswers((a) => ({ ...a, [key]: score }));
    setIdx((i) => i + 1);
  };
  const reset = () => {
    setAnswers({});
    setIdx(0);
  };

  // 대략적 준비도 — 긍정적으로 프레이밍(너무 낮게 보이지 않게 하한 35, 상한 96).
  const raw = (answers.goal ?? 0) + (answers.docs ?? 0) + (answers.interview ?? 0) + 12;
  const score = Math.max(35, Math.min(96, Math.round(raw)));
  const nextStep =
    (answers.docs ?? 0) <= 6
      ? t("이력서·자기소개서 만들기", "Build your resume & cover letter", "制作简历与自我介绍", "Làm CV & thư giới thiệu", "履歴書・自己紹介書の作成", "Buat resume & surat")
      : (answers.interview ?? 0) <= 6
        ? t("모의면접 연습하기", "Practice mock interviews", "练习模拟面试", "Luyện phỏng vấn thử", "模擬面接の練習", "Latihan wawancara")
        : t("실제 공고에 지원하기", "Apply to real jobs", "投递真实公告", "Ứng tuyển việc thật", "実際の求人に応募", "Lamar pekerjaan nyata");

  return (
    <section className="relative z-10 mx-auto max-w-5xl px-5 -mt-8 md:-mt-10">
      <div className="overflow-hidden rounded-3xl border border-[#EEF1F5] bg-white p-6 shadow-[0_16px_40px_-24px_rgba(11,18,39,0.3)] md:p-7">
        <p className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: accent }}>⚡ {t("1분 커리어 진단", "1-minute career check", "1分钟职业诊断", "Chẩn đoán 1 phút", "1分キャリア診断", "Cek karier 1 menit")}</p>

        {!done ? (
          <>
            <div className="mt-3 flex items-center gap-1.5">
              {questions.map((_, i) => (
                <span key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: i <= idx ? accent : "#EEF1F5" }} />
              ))}
            </div>
            <h3 className="mt-4 break-keep text-[18px] font-black text-[#0B1227] md:text-[20px]">{questions[idx].q}</h3>
            <div className="mt-4 flex flex-col gap-2">
              {questions[idx].opts.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => pick(questions[idx].key, o.score)}
                  className="group flex items-center justify-between rounded-2xl border border-[#EEF1F5] bg-white px-4 py-3.5 text-left text-[14.5px] font-bold text-[#191F28] transition hover:border-[color:var(--acc)] hover:bg-[#FAFBFC]"
                  style={{ ["--acc" as string]: accent }}
                >
                  {o.label}
                  <ArrowRight className="h-4 w-4 text-[#C9CDD2] transition group-hover:translate-x-0.5" weight="bold" aria-hidden />
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-[44px] font-black leading-none tracking-[-0.03em]" style={{ color: accent }}>{score}%</span>
              <span className="pb-1.5 text-[13px] font-bold text-[#8B95A1]">{t("예상 준비도", "Estimated readiness", "预计准备度", "Mức sẵn sàng ước tính", "推定準備度", "Perkiraan kesiapan")}</span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#EEF1F5]">
              <span className="block h-full rounded-full" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${accent}, #3182F6)` }} />
            </div>
            <p className="mt-4 break-keep text-[14px] leading-relaxed text-[#4E5968]">
              {t("다음 단계는 ", "Your next step: ", "下一步：", "Bước tiếp theo: ", "次のステップは ", "Langkah berikutnya: ")}
              <b className="text-[#0B1227]">{nextStep}</b>
              {t(" 예요. 정확한 진단은 가입 후 1분이면 끝나요.", ". Get the full check in a minute after signing up.", "。注册后1分钟即可完成精准诊断。", ". Chẩn đoán đầy đủ chỉ 1 phút sau khi đăng ký.", "。正確な診断は登録後1分で完了します。", ". Diagnosis lengkap 1 menit setelah daftar.")}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Link
                href={ctaHref}
                onClick={onCta}
                className="inline-flex items-center gap-1.5 rounded-2xl px-5 py-3 text-[14.5px] font-black text-white transition"
                style={{ backgroundColor: accent }}
              >
                {t("정확한 진단 받고 시작하기", "Get the full check & start", "获取精准诊断并开始", "Nhận chẩn đoán đầy đủ & bắt đầu", "正確な診断を受けて始める", "Cek lengkap & mulai")} <ArrowRight className="h-4 w-4" weight="bold" aria-hidden />
              </Link>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-2xl border border-[#E5E8EB] bg-white px-4 py-3 text-[13.5px] font-bold text-[#8B95A1] transition hover:text-[#191F28]">
                <ArrowClockwise className="h-4 w-4" weight="bold" aria-hidden /> {t("다시", "Retry", "重来", "Lại", "やり直し", "Ulang")}
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
