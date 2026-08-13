"use client";

// 취업 가이드 — 매거진 스타일 콘텐츠 허브(직무 인사이트 · 취업 노하우 · 외국인 비자 · 취업 팁).
import { useEffect, useState } from "react";
import { CaretRight, X, ArrowRight } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { GuideModal } from "./HomeScreen";
import { roleInsights, jobHunting, jobVisas } from "../../../lib/talent/insights-content";
import { homeTips, type CareerGuide } from "../../../lib/talent/home-content";
import { VISA_DETAILS, type VisaStructuredLine } from "../../../lib/visa-details";
import { useLockBodyScroll } from "../../../lib/talent/useLockBodyScroll";
import { usePlatformT } from "../../../lib/i18n";

const oneLine = (t: string) => t.replace(/\n/g, " ");

// 공식 비자·출입국 안내처.
const HIKOREA_URL = "https://www.hikorea.go.kr";
const IMMIGRATION_URL = "https://www.immigration.go.kr";

export function InsightsScreen() {
  const t = usePlatformT();
  const [active, setActive] = useState<CareerGuide | null>(null);
  const [visa, setVisa] = useState<string | null>(null);

  const jobHuntingGuides = jobHunting(t);
  const feature = jobHuntingGuides[0];
  const howtos = jobHuntingGuides.slice(1);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-10">
        {/* 매스트헤드 */}
        <header>
          <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#0B46E8]">APLY CAREER GUIDE</p>
          <h1 className="mt-2 text-[26px] font-black leading-[1.2] tracking-[-0.02em] text-[#0B1227]">{t("취업, 막막할 땐 여기부터", "Job hunting? Start here", "求职迷茫？从这里开始", "Bối rối khi tìm việc? Bắt đầu tại đây", "就活に迷ったらここから", "Bingung cari kerja? Mulai di sini")}</h1>
          <p className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#8B95A1]">{t("직무 이야기부터 취업 노하우·비자까지, 취업에 필요한 정보를 모았어요.", "From roles to job-hunting know-how and visas—everything you need.", "从职位介绍到求职技巧和签证，汇集你所需的信息。", "Từ nghề nghiệp đến bí quyết xin việc và visa—mọi thứ bạn cần.", "職種の話から就活ノウハウ・ビザまで、必要な情報を集めました。", "Dari peran hingga tips kerja dan visa—semua yang Anda butuhkan.")}</p>
        </header>

        {/* 피처드 히어로 */}
        {feature ? (
          <button
            type="button"
            onClick={() => setActive(feature)}
            className="group relative overflow-hidden rounded-3xl bg-[#0B1227] p-7 text-left transition hover:bg-[#111a33]"
          >
            <span className="pointer-events-none absolute -right-3 -top-8 select-none text-[130px] leading-none opacity-[0.08]" aria-hidden>{feature.emoji}</span>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[#8CA8FF]">{t("에디터 추천", "Editor's pick", "编辑推荐", "Biên tập viên chọn", "編集者のおすすめ", "Pilihan editor")}</p>
            <h2 className="mt-3 max-w-[85%] break-keep text-[22px] font-black leading-[1.3] tracking-[-0.02em] text-white">{oneLine(feature.title)}</h2>
            <p className="mt-2.5 max-w-[88%] break-keep text-[14px] leading-relaxed text-white/65">{feature.desc}</p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-white">
              {t("읽어보기", "Read", "阅读", "Đọc", "読む", "Baca")} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" weight="bold" />
            </span>
          </button>
        ) : null}

        {/* 직무 인사이트 */}
        <section className="flex flex-col gap-4">
          <EditorialHeader kicker="JOBS" title={t("직무, 이런 일을 해요", "What each role really does", "职位，是做这些工作", "Mỗi nghề làm gì", "職種はこんな仕事です", "Apa yang dikerjakan tiap peran")} desc={t("관심 직무가 실제로 무슨 일을 하는지 살펴봐요.", "See what your target role actually involves.", "了解你感兴趣的职位实际做什么。", "Xem nghề bạn quan tâm thực sự làm gì.", "関心のある職種が実際に何をするのか見てみましょう。", "Lihat apa yang sebenarnya dilakukan peran incaran Anda.")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {roleInsights(t).map((g) => (
              <button
                key={g.title}
                type="button"
                onClick={() => setActive(g)}
                className="flex flex-col rounded-2xl border border-[#EEF1F5] bg-white p-5 text-left transition hover:border-[#D7DCE3] hover:shadow-[0_4px_16px_rgba(11,18,39,0.05)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F5F8FF] text-[24px]" aria-hidden>{g.emoji}</span>
                <p className="mt-4 break-keep text-[16px] font-black leading-snug tracking-[-0.01em] text-[#191F28]">{oneLine(g.title)}</p>
                <p className="mt-1.5 line-clamp-2 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{g.desc}</p>
                <span className="mt-3 inline-flex items-center gap-0.5 text-[12.5px] font-bold text-[#0B46E8]">{t("자세히", "Details", "详情", "Chi tiết", "詳しく", "Detail")} <CaretRight className="h-3.5 w-3.5" /></span>
              </button>
            ))}
          </div>
        </section>

        {/* 취업 노하우 — 넘버드 에디토리얼 리스트 */}
        <section className="flex flex-col gap-4">
          <EditorialHeader kicker="HOW-TO" title={t("취업 노하우", "Job-hunting know-how", "求职技巧", "Bí quyết xin việc", "就活ノウハウ", "Tips melamar kerja")} desc={t("첫 취업에서 자주 막히는 지점을 풀어드려요.", "We untangle the common snags of your first job hunt.", "帮你解决初次求职常遇到的难题。", "Gỡ rối những vướng mắc khi tìm việc lần đầu.", "初めての就活でつまずきやすい点を解きほぐします。", "Kami urai kendala umum saat pertama cari kerja.")} />
          <div className="overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white">
            {howtos.map((g, i) => (
              <button
                key={g.title}
                type="button"
                onClick={() => setActive(g)}
                className={`flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#F6F8FB] ${i > 0 ? "border-t border-[#F2F4F6]" : ""}`}
              >
                <span className="w-8 shrink-0 text-[22px] font-black text-[#C4CAD2]">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <p className="break-keep text-[14.5px] font-bold text-[#191F28]">{oneLine(g.title)}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-[#8B95A1]">{g.desc}</p>
                </div>
                <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
              </button>
            ))}
          </div>
        </section>

        {/* 외국인 비자 — 패널 */}
        <section className="rounded-3xl bg-[#F5F8FF] p-6">
          <EditorialHeader kicker="GLOBAL" title={t("외국인을 위한 비자 안내", "Visa guide for foreigners", "外国人签证指南", "Hướng dẫn visa cho người nước ngoài", "外国人向けビザ案内", "Panduan visa untuk WNA")} desc={t("구직·취업에 관련된 비자를 쉽게 정리했어요.", "A simple rundown of job- and work-related visas.", "简单整理了求职和就业相关的签证。", "Tóm tắt đơn giản về visa tìm việc và làm việc.", "求職・就職に関わるビザをわかりやすくまとめました。", "Ringkasan sederhana visa kerja dan pencarian kerja.")} />
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {jobVisas(t).map((v) => (
              <button
                key={v.code}
                type="button"
                onClick={() => setVisa(v.code)}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 text-left transition hover:shadow-[0_4px_16px_rgba(11,18,39,0.06)]"
              >
                <span className="flex h-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF1FD] px-3 text-[13px] font-black text-[#0B46E8]">{v.code}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-bold text-[#191F28]">{v.label}</p>
                  <p className="truncate text-[12.5px] text-[#8B95A1]">{v.desc}</p>
                </div>
                <CaretRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" />
              </button>
            ))}
          </div>
          <p className="mt-4 text-[12px] leading-relaxed text-[#8B95A1]">
            {t("비자 요건은 개인 상황·정책에 따라 달라질 수 있어요. 정확한 내용은 ", "Visa requirements may vary by situation and policy. For details, see ", "签证要求可能因个人情况和政策而异。详情请查阅 ", "Yêu cầu visa có thể thay đổi theo hoàn cảnh và chính sách. Xem chi tiết tại ", "ビザ要件は個人の状況・政策により異なります。詳しくは ", "Persyaratan visa dapat berbeda menurut situasi dan kebijakan. Lihat detail di ")}
            <a href={HIKOREA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0B46E8] hover:underline">{t("하이코리아", "HiKorea", "HiKorea", "HiKorea", "ハイコリア", "HiKorea")}</a>·
            <a href={IMMIGRATION_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0B46E8] hover:underline">{t("출입국사무소", "Immigration Office", "出入境事务所", "Sở Xuất nhập cảnh", "出入国事務所", "Kantor Imigrasi")}</a>{t("에서 확인하세요.", ".", "。", ".", "でご確認ください。", ".")}
          </p>
        </section>

        {/* 취업 팁 — 풀쿼트 */}
        <section className="flex flex-col gap-4">
          <EditorialHeader kicker="TIPS" title={t("알아두면 좋은 취업 팁", "Handy job-hunting tips", "值得了解的求职小贴士", "Mẹo tìm việc hữu ích", "知っておきたい就活のヒント", "Tips kerja yang berguna")} desc={t("가볍게 읽고 바로 써먹는 한 줄 팁이에요.", "Quick one-liners you can use right away.", "轻松阅读、即可实用的一句话贴士。", "Mẹo ngắn gọn dùng được ngay.", "サッと読んですぐ使える一言ヒントです。", "Tips singkat yang langsung bisa dipakai.")} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {homeTips(t).map((tip) => (
              <div key={tip.title} className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
                <span className="text-[30px] font-black leading-none text-[#E4EDFB]" aria-hidden>“</span>
                <p className="mt-1 break-keep text-[14.5px] font-bold leading-snug text-[#191F28]">{tip.title}</p>
                <p className="mt-1.5 break-keep text-[13px] leading-relaxed text-[#8B95A1]">{tip.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {active ? <GuideModal guide={active} onClose={() => setActive(null)} /> : null}
      {visa ? <VisaModal code={visa} onClose={() => setVisa(null)} /> : null}
    </TalentAppShell>
  );
}

function EditorialHeader({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B46E8]">{kicker}</p>
      <h2 className="mt-1 text-[19px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      {desc ? <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{desc}</p> : null}
    </div>
  );
}

// 비자 상세 팝업 — VISA_DETAILS(공식 안내)의 한국어 구조화 내용을 그대로 보여준다.
function VisaLines({ lines }: { lines: VisaStructuredLine[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {lines.map((l, i) =>
        l.kind === "heading" ? (
          <p key={i} className="mt-1.5 text-[13.5px] font-bold text-[#191F28]" style={{ paddingLeft: l.depth * 12 }}>{l.text}</p>
        ) : (
          <p key={i} className="flex gap-1.5 break-keep text-[13px] leading-[1.7] text-[#4E5968]" style={{ paddingLeft: l.depth * 12 }}>
            <span className="shrink-0 text-[#B0B8C1]">•</span>
            <span>{l.text}</span>
          </p>
        )
      )}
    </div>
  );
}

function VisaModal({ code, onClose }: { code: string; onClose: () => void }) {
  const t = usePlatformT();
  useLockBodyScroll();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const detail = VISA_DETAILS[code];
  if (!detail) return null;
  // 배지에 이미 코드가 있으니 제목의 코드 접두어는 제거.
  const visaFallback = t(`${code} 비자`, `${code} visa`, `${code} 签证`, `Visa ${code}`, `${code}ビザ`, `Visa ${code}`);
  const rawTitle = detail.titleKo?.trim() || visaFallback;
  const title = (rawTitle.startsWith(code) ? rawTitle.slice(code.length).trim() : rawTitle) || visaFallback;
  const sections: { heading: string; lines: VisaStructuredLine[] }[] = [
    { heading: t("안내", "Overview", "介绍", "Giới thiệu", "案内", "Ikhtisar"), lines: detail.descriptionKo ?? [] },
    { heading: t("대상", "Eligibility", "对象", "Đối tượng", "対象", "Kelayakan"), lines: detail.candidatesKo ?? [] },
    { heading: t("요건", "Requirements", "要求", "Yêu cầu", "要件", "Persyaratan"), lines: detail.requirementsKo ?? [] }
  ].filter((s) => s.lines.length > 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0B1227]/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[82vh] w-full max-w-[460px] flex-col overflow-hidden rounded-3xl bg-white" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 px-7 pb-5 pt-7">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="flex h-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F8FF] px-3 text-[13px] font-black text-[#0B46E8]">{code}</span>
            <h2 className="min-w-0 truncate text-[17px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
          </div>
          <button type="button" aria-label={t("닫기", "Close", "关闭", "Đóng", "閉じる", "Tutup")} onClick={onClose} className="-mr-1.5 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-[#8B95A1] transition hover:bg-[#F2F4F6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7 py-5">
          <div className="flex flex-col gap-5">
            {sections.map((s) => (
              <div key={s.heading}>
                <p className="text-[12px] font-bold text-[#8B95A1]">{s.heading}</p>
                <div className="mt-1.5">
                  <VisaLines lines={s.lines} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[12px] leading-relaxed text-[#B0B8C1]">
            {t("개인 상황·정책에 따라 달라질 수 있어요. 정확한 내용은 ", "May vary by situation and policy. For details, see ", "可能因个人情况和政策而异。详情请查阅 ", "Có thể thay đổi theo hoàn cảnh và chính sách. Xem chi tiết tại ", "個人の状況・政策により異なります。詳しくは ", "Dapat berbeda menurut situasi dan kebijakan. Lihat detail di ")}
            <a href={HIKOREA_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0B46E8] hover:underline">{t("하이코리아", "HiKorea", "HiKorea", "HiKorea", "ハイコリア", "HiKorea")}</a>·
            <a href={IMMIGRATION_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0B46E8] hover:underline">{t("출입국사무소", "Immigration Office", "出入境事务所", "Sở Xuất nhập cảnh", "出入国事務所", "Kantor Imigrasi")}</a>{t("에서 확인하세요.", ".", "。", ".", "でご確認ください。", ".")}
          </p>
        </div>
      </div>
    </div>
  );
}
