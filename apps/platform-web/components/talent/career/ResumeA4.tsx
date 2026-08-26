"use client";

// 이력서 A4 미리보기 — 실제 이력서 형태를 고정 A4(794×1123, 96dpi) 로 렌더하고
// 컨테이너 폭에 맞춰 축소(transform scale). 내용이 한 장을 넘으면 '섹션 단위'로 다음 장에
// 통째로 내려 붙인다(섹션은 중간에서 잘리지 않음). 로고·슬로건 바닥글은 마지막 장 맨 아래 고정.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type CareerSection } from "../../../lib/talent/career-chat";
import { displayMonth, normalizeUrl, type ResumeDoc } from "../../../lib/talent/resume-doc";
import type { BasicInfo } from "../../../lib/talent/basic-info";
import { PdfBrandFooter } from "./pdf-print";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";

// 이력서 섹션 헤더 표시용 라벨(키는 그대로, 화면 표기만 번역).
function sectionLabel(t: PlatformT, section: CareerSection): string {
  switch (section) {
    case "education":
      return t("학력", "Education", "学历", "Học vấn", "学歴", "Pendidikan");
    case "certificate":
      return t("자격증", "Certificates", "证书", "Chứng chỉ", "資格", "Sertifikat");
    case "experience":
      return t("경험", "Experience", "经历", "Kinh nghiệm", "経験", "Pengalaman");
    case "project":
      return t("프로젝트", "Projects", "项目", "Dự án", "プロジェクト", "Proyek");
    case "language":
      return t("어학", "Languages", "语言", "Ngoại ngữ", "語学", "Bahasa");
    case "skill":
      return t("스킬", "Skills", "技能", "Kỹ năng", "スキル", "Keahlian");
    case "award":
      return t("수상", "Awards", "获奖", "Giải thưởng", "受賞", "Penghargaan");
    case "activity":
      return t("대외활동", "Activities", "课外活动", "Hoạt động", "課外活動", "Aktivitas");
    default:
      return section;
  }
}

const PAGE_W = 794;
const PAGE_H = 1123;
const PAGE_PAD = 52; // 각 페이지 위·아래 여백(px).
const FOOTER_H = 44; // 바닥글이 차지하는 하단 예약 높이.
const CONTENT_H = PAGE_H - PAGE_PAD * 2 - FOOTER_H; // 페이지당 콘텐츠 영역(바닥글 공간 제외).
// 이력서 순서 — 경험·프로젝트·자격증·어학·스킬·대외활동·수상, 학력은 맨 아래.
const SECTION_ORDER: CareerSection[] = ["experience", "project", "certificate", "language", "skill", "activity", "award", "education"];

// 블록(헤더·섹션, 필요 시 [data-break] 문단) 단위로 페이지를 나눈다 — 한 블록이 현재 페이지에
// 안 들어가면 통째로 다음 장으로 내린다(섹션 중간 안 잘림). 한 블록이 한 장보다 크면(예외)
// 그때만 페이지 경계에서 이어 자른다.
export function packBlocks(root: HTMLElement, contentH: number): { starts: number[]; total: number } {
  const total = root.scrollHeight;
  const rootTop = root.getBoundingClientRect().top;
  const tops = Array.from(root.querySelectorAll<HTMLElement>("header, section, [data-break]"))
    .map((el) => el.getBoundingClientRect().top - rootTop)
    .filter((t) => t >= 0)
    .sort((a, b) => a - b);
  const starts = [0];
  let pageTop = 0;
  for (let i = 0; i < tops.length; i++) {
    const top = tops[i];
    if (top <= pageTop + 1) continue; // 이미 이 페이지 시작 근처
    const bottom = i < tops.length - 1 ? tops[i + 1] : total;
    if (bottom - pageTop > contentH) {
      if (top - pageTop > 1) {
        starts.push(top);
        pageTop = top;
      }
      // 한 블록이 한 장보다 큰 예외 — 잘림 방지용으로만 경계 분할.
      while (bottom - pageTop > contentH) {
        pageTop += contentH;
        starts.push(pageTop);
      }
    }
  }
  return { starts, total };
}

export function ResumeA4Preview({ doc, info, maxWidth }: { doc: ResumeDoc; info: BasicInfo; maxWidth?: number }) {
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
      {/* 높이 측정용 숨김 시트(바닥글 제외 — 바닥글은 페이지에 고정 배치) */}
      <div aria-hidden className="pointer-events-none absolute -left-[99999px] top-0" style={{ width: PAGE_W, visibility: "hidden" }}>
        <div ref={sheetRef}>
          <ResumeA4Body doc={doc} info={info} />
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
                    <ResumeA4Body doc={doc} info={info} />
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

// A4 본문(고정 폭, 자연 높이). 세로 패딩·바닥글 없음 — 여백과 바닥글은 각 페이지가 준다.
function ResumeA4Body({ doc, info }: { doc: ResumeDoc; info: BasicInfo }) {
  const t = usePlatformT();
  const contact = [info.email, info.phone, info.address].filter(Boolean);
  return (
    <div className="w-full bg-white px-[56px] text-[#191F28]">
      {/* 헤더 — 프로필 사진(있으면) 맨 왼쪽 */}
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

      {/* 본문 */}
      <div className="mt-8 flex flex-col gap-7 pb-2">
        {/* 자기소개·요약 — Career Launch 등 요약이 있는 이력서에서 노출 */}
        {doc.summary?.trim() ? (
          <section>
            <h2 className="border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{t("자기소개", "About", "自我介绍", "Giới thiệu", "自己紹介", "Tentang")}</h2>
            <p className="mt-3 whitespace-pre-line break-keep text-[13.5px] leading-relaxed text-[#333D4B]">{doc.summary.trim()}</p>
          </section>
        ) : null}
        {SECTION_ORDER.map((section) => {
          const items = doc.items.filter((it) => it.section === section);
          if (items.length === 0) return null;
          return (
            <section key={section}>
              <h2 className="border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{sectionLabel(t, section)}</h2>
              <ul className="mt-3 flex flex-col gap-2.5">
                {items.map((it) => {
                  const range = [it.startDate, it.endDate].map((d) => displayMonth(d ?? "")).filter(Boolean).join(" – ");
                  return (
                    <li key={it.id} className="flex items-start gap-3 break-keep text-[13.5px] leading-relaxed text-[#333D4B]">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                      <span className="min-w-0 flex-1">
                        {it.company ? <span className="block font-bold text-[#191F28]">{it.company}</span> : null}
                        {it.text ? <span className={`whitespace-pre-line ${it.company ? "mt-0.5 block text-[#4E5968]" : ""}`}>{it.text}</span> : null}
                      </span>
                      {range ? <span className="shrink-0 text-[12px] font-medium text-[#8B95A1]">{range}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
        {/* 링크·포트폴리오 — 이력서 맨 아래 섹션 */}
        {doc.links && doc.links.some((l) => l.url?.trim()) ? (
          <section>
            <h2 className="border-l-[3px] border-[#0B46E8] pl-2.5 text-[15px] font-black tracking-[-0.01em] text-[#0B1227]">{t("링크·포트폴리오", "Links & portfolio", "链接·作品集", "Liên kết & portfolio", "リンク・ポートフォリオ", "Tautan & portofolio")}</h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {doc.links
                .filter((l) => l.url?.trim())
                .map((l, i) => (
                  <li key={i} className="flex items-start gap-3 break-keep text-[13.5px] leading-relaxed text-[#333D4B]">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B46E8]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      {l.label?.trim() ? <span className="block font-bold text-[#191F28]">{l.label.trim()}</span> : null}
                      <a href={normalizeUrl(l.url)} target="_blank" rel="noopener noreferrer" className={`${l.label?.trim() ? "mt-0.5 block " : ""}break-all font-semibold text-[#0B46E8] underline`}>{l.url.trim()}</a>
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
        {doc.items.length === 0 && !doc.summary?.trim() && !(doc.links && doc.links.some((l) => l.url?.trim())) ? <p className="text-[13.5px] text-[#B0B8C1]">{t("항목을 추가하면 여기에 이력서로 정리돼요.", "Add items and they'll appear here as your resume.", "添加条目后会在此整理成简历。", "Thêm mục để hiển thị thành hồ sơ tại đây.", "項目を追加すると、ここに履歴書として整理されます。", "Tambahkan item, akan tersusun sebagai resume di sini.")}</p> : null}
      </div>
    </div>
  );
}
