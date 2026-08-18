"use client";

// 나에게 관심을 준 회사 — 파트너가 '능력만 보고(블라인드)' 나를 관심 목록에 담으면 여기 쌓인다.
import { useEffect, useState } from "react";
import { Buildings, Sparkle, Globe } from "@phosphor-icons/react";
import { TalentAppShell } from "../app/TalentAppShell";
import { TPageHeader, TLoading } from "../ui/primitives";
import { getInterestedCompanies, type InterestedCompany } from "../../../lib/member-profile-client";
import { usePlatformT } from "../../../lib/i18n";

export function InterestedCompaniesScreen() {
  const t = usePlatformT();
  const [items, setItems] = useState<InterestedCompany[] | null>(null);

  useEffect(() => {
    let alive = true;
    void getInterestedCompanies()
      .then((list) => { if (alive) setItems(list); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, []);

  return (
    <TalentAppShell>
      <div className="flex flex-col gap-5">
        <TPageHeader
          title={t("나에게 관심 준 회사", "Companies interested in you", "对你感兴趣的公司", "Công ty quan tâm đến bạn", "あなたに関心を持った会社", "Perusahaan yang tertarik padamu")}
          description={t("회사들이 이름·국적이 아닌 ‘능력’만 보고 관심을 표한 곳이에요.", "These companies expressed interest based on your abilities — not your name or nationality.", "这些公司仅凭你的能力（而非姓名或国籍）表达了兴趣。", "Các công ty này quan tâm dựa trên năng lực của bạn — không phải tên hay quốc tịch.", "会社があなたの名前や国籍ではなく『能力』だけを見て関心を示した会社です。", "Perusahaan ini tertarik berdasarkan kemampuanmu — bukan nama atau kebangsaan.")}
        />

        {/* 블라인드 안내 배너 */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] px-4 py-3">
          <Sparkle className="mt-0.5 h-4 w-4 shrink-0 text-[#0B46E8]" weight="fill" />
          <p className="break-keep text-[12.5px] leading-relaxed text-[#4E5968]">
            {t("파트너에게는 당신의 이름·사진·성별·국적이 가려진 채, 스킬·경험·언어 능력만 보여요. 이력서·자기소개서를 충실히 채울수록 관심받을 확률이 높아져요.", "Partners see only your skills, experience, and language — your name, photo, gender, and nationality are hidden. A fuller resume and cover letter get more interest.", "合作方只看到你的技能、经验和语言能力，姓名、照片、性别和国籍都被隐藏。资料越完整，越容易获得关注。", "Đối tác chỉ thấy kỹ năng, kinh nghiệm và ngôn ngữ của bạn — tên, ảnh, giới tính và quốc tịch được ẩn. Hồ sơ đầy đủ hơn sẽ thu hút hơn.", "パートナーにはスキル・経験・語学力だけが見え、名前・写真・性別・国籍は隠されます。履歴書を充実させるほど関心を得やすくなります。", "Mitra hanya melihat keahlian, pengalaman, dan bahasa — nama, foto, gender, dan kebangsaan disembunyikan. Resume yang lengkap lebih menarik minat.")}
          </p>
        </div>

        {items === null ? (
          <TLoading />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] px-6 py-12 text-center">
            <Buildings className="mx-auto h-8 w-8 text-[#C4CAD2]" />
            <p className="mt-3 text-[14px] font-bold text-[#191F28]">{t("아직 관심을 준 회사가 없어요", "No companies yet", "还没有公司关注你", "Chưa có công ty nào", "まだ関心を持った会社はありません", "Belum ada perusahaan")}</p>
            <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("이력서·자기소개서를 완성하고 인재풀 공개를 켜면 회사들이 능력을 보고 관심을 표할 수 있어요.", "Complete your resume and cover letter and turn on talent-pool visibility so companies can find you by ability.", "完善简历和自我介绍并开启人才库公开，公司就能凭能力关注你。", "Hoàn thiện CV và thư xin việc, bật hiển thị talent pool để công ty tìm bạn theo năng lực.", "履歴書・自己PRを完成し人材プール公開をオンにすると、会社が能力を見て関心を示せます。", "Lengkapi resume dan surat lamaran serta aktifkan visibilitas talent pool agar perusahaan menemukanmu.")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((c) => (
              <div key={c.organizationId} className="flex items-start gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#F2F4F6] text-[16px] font-black text-[#4E5968]">
                  {c.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>{c.name.charAt(0).toUpperCase()}</span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[15px] font-bold text-[#191F28]">{c.name}</p>
                    <span className="shrink-0 rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[10.5px] font-bold text-[#0B46E8]">{t("관심", "Interested", "关注", "Quan tâm", "関心", "Tertarik")}</span>
                  </div>
                  {c.summary ? <p className="mt-1 line-clamp-2 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{c.summary}</p> : null}
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-[#B0B8C1]">
                    <span>{c.interestedAt.slice(0, 10).replace(/-/g, ".")} {t("관심 표함", "showed interest", "表达关注", "đã quan tâm", "関心を示す", "menandai")}</span>
                    {c.website ? (
                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#4E5968] transition hover:text-[#0B46E8]">
                        <Globe className="h-3.5 w-3.5" /> {t("홈페이지", "Website", "官网", "Website", "サイト", "Website")}
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </TalentAppShell>
  );
}
