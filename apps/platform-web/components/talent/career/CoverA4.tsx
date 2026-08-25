"use client";

// 자기소개서 A4 미리보기 — 문항+답변을 고정 A4로 렌더하고 축소. 문항(섹션)은 통째로 다음 장으로
// 내려 잘리지 않게, 긴 답변만 문단 단위로 이어진다. 로고·슬로건 바닥글은 매 장 맨 아래 고정.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { coverSectionOrder, type CoverDoc } from "../../../lib/talent/cover-doc";
import type { BasicInfo } from "../../../lib/talent/basic-info";
import { packBlocks } from "./ResumeA4";
import { PdfBrandFooter } from "./pdf-print";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

// 자소서 문항 헤더 표시용 라벨(COVER_QUESTIONS 값은 데이터 키로 유지, 화면 표기만 번역).
function questionLabel(t: PlatformT, q: string): string {
  switch (q) {
    case "지원 동기":
      return t("지원 동기", "Motivation", "应聘动机", "Động lực ứng tuyển", "志望動機", "Motivasi melamar");
    case "나의 강점과 준비된 경험":
      return t("나의 강점과 준비된 경험", "Strengths & experience", "我的优势与经验", "Điểm mạnh & kinh nghiệm", "強みと準備した経験", "Kekuatan & pengalaman");
    case "성장 과정":
      return t("성장 과정", "Background", "成长经历", "Quá trình trưởng thành", "成長過程", "Latar belakang");
    case "성격의 장단점":
      return t("성격의 장단점", "Strengths & weaknesses", "性格优缺点", "Ưu & nhược điểm", "性格の長所短所", "Kelebihan & kekurangan");
    case "입사 후 포부":
      return t("입사 후 포부", "Goals after joining", "入职后抱负", "Mục tiêu sau khi vào", "入社後の抱負", "Aspirasi setelah bergabung");
    default:
      return q;
  }
}

const PAGE_W = 794;
const PAGE_H = 1123;
const PAGE_PAD = 52;
const FOOTER_H = 44;
const CONTENT_H = PAGE_H - PAGE_PAD * 2 - FOOTER_H;

export function CoverA4Preview({ doc, info, maxWidth }: { doc: CoverDoc; info: BasicInfo; maxWidth?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [starts, setStarts] = useState<number[]>([0]);
  const [total, setTotal] = useState(CONTENT_H);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => setW(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const { starts: s, total: tt } = packBlocks(el, CONTENT_H);
    setStarts((prev) => (prev.length === s.length && prev.every((v, i) => v === s[i]) ? prev : s));
    setTotal(tt);
  });

  const target = maxWidth ? Math.min(w, maxWidth) : w;
  const scale = target > 0 ? target / PAGE_W : 0;

  return (
    <div ref={wrapRef} className="w-full">
      {/* 높이 측정용 숨김 시트(바닥글 제외) */}
      <div aria-hidden className="pointer-events-none absolute -left-[99999px] top-0" style={{ width: PAGE_W, visibility: "hidden" }}>
        <div ref={sheetRef}>
          <CoverA4Body doc={doc} info={info} />
        </div>
      </div>

      {scale ? (
        <div className="flex flex-col gap-3">
          {starts.map((startPx, i) => {
            const endPx = i < starts.length - 1 ? starts[i + 1] : total;
            const windowH = Math.min(endPx - startPx, CONTENT_H);
            return (
              <div
                key={i}
                className="relative mx-auto overflow-hidden rounded-[8px] border border-[#E5E8EB] bg-white shadow-[0_8px_28px_rgba(11,18,39,0.10)]"
                style={{ width: PAGE_W * scale, height: PAGE_H * scale }}
              >
                <div className="absolute left-0 overflow-hidden" style={{ top: PAGE_PAD * scale, width: PAGE_W * scale, height: windowH * scale }}>
                  <div style={{ position: "absolute", top: -(startPx * scale), width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
                    <CoverA4Body doc={doc} info={info} />
                  </div>
                </div>
                {/* 로고·슬로건 — 매 장 맨 아래 고정 */}
                <div className="absolute inset-x-0" style={{ bottom: PAGE_PAD * scale }}>
                  <div className="px-[56px]" style={{ width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "bottom left" }}>
                    <PdfBrandFooter />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

// A4 본문(고정 폭, 자연 높이). 세로 패딩·바닥글 없음.
function CoverA4Body({ doc, info }: { doc: CoverDoc; info: BasicInfo }) {
  const t = usePlatformT();
  const contact = [info.email, info.phone, info.address].filter(Boolean);
  return (
    <div className="w-full bg-white px-[56px] text-[#191F28]">
      {/* 헤더 — 이력서와 동일 */}
      <header className="flex items-start gap-6 border-b border-[#E5E8EB] pb-6">
        {info.photoUrl && doc.showPhoto === true ? (
          <span className="h-[104px] w-[84px] shrink-0 overflow-hidden rounded-[6px] border border-[#E5E8EB] bg-[#F2F4F6]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={info.photoUrl} alt="" className="h-full w-full object-cover" />
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[32px] font-black leading-tight tracking-[-0.02em] text-[#0B1227]">{info.realName || t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")}</p>
          <div className="mt-4 flex flex-col gap-1 text-[13px] leading-relaxed text-[#4E5968]">
            {contact.map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-7 pb-2">
        {doc.items.length === 0 ? (
          <p className="text-[13.5px] text-[#B0B8C1]">{t("문항에 답을 채우면 여기에 자기소개서로 정리돼요.", "Answer the prompts and they'll appear here as your cover letter.", "填写问题答案后会在此整理成自我介绍。", "Trả lời các câu hỏi để hiển thị thành thư giới thiệu tại đây.", "設問に答えると、ここに自己紹介書として整理されます。", "Jawab pertanyaan, akan tersusun sebagai surat lamaran di sini.")}</p>
        ) : null}
        {coverSectionOrder(doc).map((q) => {
          const items = doc.items.filter((it) => it.question === q);
          if (items.length === 0) return null;
          return (
            <section key={q}>
              <h2 className="border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{questionLabel(t, q)}</h2>
              <div className="mt-3 flex flex-col gap-2.5">
                {items.map((it) => (
                  <p key={it.id} className="whitespace-pre-line break-keep text-[13.5px] leading-[1.9] text-[#333D4B]">{it.text}</p>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
