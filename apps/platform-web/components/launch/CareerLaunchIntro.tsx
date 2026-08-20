"use client";

// Career Launch가 무슨 서비스인지 한눈에 — 로그인·초대코드 등 진입 화면 어디서든 공용.
// 로그인/등록 여부와 무관하게 방문자가 "4주 취업 준비 프로그램"임을 바로 인지하게 한다.
import { ClipboardText, FileText, ChatCircleText, Microphone } from "@phosphor-icons/react";
import { useLaunchT } from "../../lib/launch/i18n";

export function CareerLaunchIntro({ className = "" }: { className?: string }) {
  const t = useLaunchT();
  const steps = [
    {
      icon: ClipboardText,
      label: t("취업 진단·직무 찾기", "Career check · find roles", "求职诊断·找方向", "Chẩn đoán·tìm nghề", "就職診断・職種探し", "Cek karier·cari peran")
    },
    {
      icon: FileText,
      label: t("이력서 완성", "Build your resume", "完成简历", "Hoàn thiện CV", "履歴書を完成", "Susun resume")
    },
    {
      icon: ChatCircleText,
      label: t("자기소개서 완성", "Write your cover letter", "完成自我介绍", "Viết thư giới thiệu", "自己紹介書を完成", "Tulis surat lamaran")
    },
    {
      icon: Microphone,
      label: t("AI 모의 면접", "AI mock interview", "AI 模拟面试", "Phỏng vấn thử AI", "AI模擬面接", "Wawancara simulasi AI")
    }
  ];

  return (
    <div className={`overflow-hidden rounded-2xl border border-[#E7EDFB] bg-[#F8FAFF] ${className}`}>
      <img
        src="/img_global_career_launch.webp"
        alt={t("Career Launch", "Career Launch", "Career Launch", "Career Launch", "Career Launch", "Career Launch")}
        className="block h-auto w-full"
        loading="lazy"
      />
      <div className="p-5">
      <span className="inline-flex items-center rounded-full bg-[#0B46E8] px-2.5 py-0.5 text-[11px] font-bold text-white">
        {t("4주 프로그램", "4-week program", "4周项目", "Chương trình 4 tuần", "4週間プログラム", "Program 4 minggu")}
      </span>
      <p className="mt-2.5 break-keep text-[13.5px] leading-relaxed text-[#4E5968]">
        {t(
          "AI 코치와 함께 취업 진단부터 이력서·자기소개서·모의면접까지 4주 만에 끝내고, 완성한 서류로 APLY 채용에 바로 연결돼요.",
          "With an AI coach, finish everything from a career check to your resume, cover letter, and mock interview in 4 weeks — then connect straight to APLY hiring with your completed docs.",
          "在 AI 教练的陪伴下，4 周内完成从求职诊断到简历、自我介绍、模拟面试的全部内容，并凭完成的材料直接对接 APLY 招聘。",
          "Cùng huấn luyện viên AI, hoàn thành mọi thứ từ chẩn đoán nghề đến CV, thư giới thiệu và phỏng vấn thử trong 4 tuần — rồi kết nối thẳng đến tuyển dụng APLY bằng hồ sơ đã hoàn thiện.",
          "AIコーチと一緒に、就職診断から履歴書・自己紹介書・模擬面接まで4週間で仕上げ、完成した書類でそのままAPLY採用につながります。",
          "Bersama pelatih AI, selesaikan semuanya dari cek karier hingga resume, surat lamaran, dan wawancara simulasi dalam 4 minggu — lalu terhubung langsung ke rekrutmen APLY dengan dokumen jadi."
        )}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 rounded-xl border border-[#EEF1F5] bg-white px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EDF1FD] text-[#0B46E8]">
              <s.icon className="h-4 w-4" weight="fill" />
            </span>
            <span className="min-w-0 text-[12.5px] font-semibold leading-tight text-[#191F28]">{s.label}</span>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
