"use client";

// v2 내 커리어 — 로그인하지 않은 사람용. 같은 주소(/v2/career)에서 로그인 여부로 갈린다.
// "가입하면 이런 화면이 만들어진다"(예시 카드)와, 지금 바로 해 볼 수 있는 것(직무를 고르면 실제 공고 수·최신 공고)을 보여 준다.
// 가입이 필요한 행동은 모두 가입으로 보낸다(돌아올 곳 next=/v2/career). 화면 문구에 '무료'는 쓰지 않는다.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Chip, Masthead, Page, Row, RowsSkeleton, Section } from "../ui";
import { companyOf, jobPhotoOf } from "../lib";
import { useLanguage } from "../../i18n/LanguageProvider";
import { usePlatformT, type PlatformT } from "../../../lib/i18n";
import { getPublicPositionsPage, type PublicPositionListItem } from "../../../lib/member-profile-client";
import { jobCategoriesForInterests } from "../../../lib/talent/job-taxonomy";
import { jobTaxonomyLabelOf } from "../../../lib/talent/job-taxonomy-labels";

const SIGNUP = `/talent/signup?next=${encodeURIComponent("/talent/career")}`;
const LOGIN = `/talent/login?next=${encodeURIComponent("/talent/career")}`;

// 유학생·첫 취업 준비생이 많이 고르는 직무(표준 직무 분류의 소분류 이름 그대로).
// 서버 관련도 검색이 먼저 고르는 후보 수(의미 검색 상위) — 이 수에 닿으면 실제로는 더 많다.
const RELEVANCE_CAP = 150;

const POPULAR_ROLES = ["퍼포먼스 마케팅", "해외 영업", "무역/수출입", "백엔드 개발", "UX 디자이너", "데이터 분석가"];

export function V2CareerGuest() {
  const t = usePlatformT();
  return (
    <Page>
      <Masthead
        eyebrow={t("내 커리어", "My career", "我的职业", "Sự nghiệp", "マイキャリア", "Karier saya")}
        title={t("경험을 말하면, 이력서가 돼요", "Tell your story, get a resume", "说出经历，就成了简历", "Kể kinh nghiệm, thành CV", "経験を話せば履歴書に", "Ceritakan, jadi CV")}
        lede={t("알바·동아리·프로젝트도 괜찮아요. 말하듯 적으면 AI가 이력서·자기소개서로 정리하고, 지원할 때 공고에 맞춰 다듬어 줘요.", "Part-time jobs, clubs and projects all count. Write like you talk — AI shapes it into a resume and cover letter and tailors it to each job.", "兼职、社团、项目都可以。像聊天一样写下来，AI 整理成简历和自我介绍，投递时按职位优化。", "Việc làm thêm, CLB, dự án đều được. Viết như kể chuyện — AI sắp xếp thành CV và thư giới thiệu, chỉnh theo từng tin.", "バイト・サークル・プロジェクトもOK。話すように書けばAIが履歴書・自己紹介書に整え、応募時に求人に合わせて仕上げます。", "Kerja paruh waktu, organisasi, proyek—semua bisa. Tulis seperti bercerita, AI menyusunnya dan menyesuaikan per lowongan.")}
        action={
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:flex">
            <Button href={SIGNUP}>{t("시작하기", "Get started", "开始使用", "Bắt đầu", "はじめる", "Mulai")}</Button>
            <Button variant="secondary" href={LOGIN}>
              {t("로그인", "Log in", "登录", "Đăng nhập", "ログイン", "Masuk")}
            </Button>
          </div>
        }
      />

      {/* 내 커리어 그림 — 내 이력서를 들고 있는 학생(흰 바탕 → 곱하기 합성) */}
      <div className="-mt-2 px-5 pb-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- 장식 그림 */}
        <img src="/img_my_career_0.webp" alt="" aria-hidden className="mx-auto h-[240px] w-[240px] object-contain mix-blend-multiply min-[360px]:h-[260px] min-[360px]:w-[260px] md:h-[300px] md:w-[300px]" />
      </div>

      <SampleCard t={t} />
      <RoleJobs t={t} />

      <Section title={t("가입하면 할 수 있는 것", "What you can do", "注册后可以做的事", "Bạn có thể làm gì", "登録するとできること", "Yang bisa kamu lakukan")}>
        <Row href={SIGNUP} lead="📝" title={t("이력서·자기소개서 만들기", "Build your resume & cover letter", "制作简历和自我介绍", "Tạo CV & thư giới thiệu", "履歴書・自己紹介書づくり", "Buat CV & surat lamaran")} meta={t("말하듯 적으면 AI가 정리, 공고마다 맞춤 자소서", "AI tidies it; a tailored letter per job", "AI 整理，每个职位定制自荐信", "AI sắp xếp; thư theo từng tin", "AIが整理、求人ごとに自己PR", "AI merapikan; surat per lowongan")} />
        <Row href={SIGNUP} lead="🧩" title={t("직무별 준비 체크리스트", "Role checklist", "职位准备清单", "Checklist theo ngành", "職種別チェックリスト", "Checklist peran")} meta={t("실제 공고 요건과 내 서류를 비교해 빠진 것부터", "Compares real job requirements with your documents", "对比真实职位要求与你的材料", "So sánh yêu cầu thật với hồ sơ", "実際の要件と書類を比較", "Bandingkan syarat nyata dengan dokumen")} />
        <Row href={SIGNUP} lead="💪" title={t("기업이 보는 내 강점", "Strengths companies see", "企业眼中的我的优势", "Điểm mạnh doanh nghiệp thấy", "企業から見た強み", "Kelebihan di mata perusahaan")} meta={t("내 서류에서 AI가 강점을 찾아 한 줄로", "AI finds your strengths from your documents", "AI 从材料中找出你的优势", "AI tìm điểm mạnh từ hồ sơ", "書類からAIが強みを発見", "AI menemukan kelebihanmu")} />
        <Row href={SIGNUP} lead="🏢" title={t("기업이 먼저 연락해요", "Companies reach out first", "企业主动联系你", "Doanh nghiệp liên hệ trước", "企業から連絡が来る", "Perusahaan menghubungi duluan")} meta={t("이름·연락처를 가린 채 기업 인재 검색에 노출", "Shown in talent search with name and contact hidden", "隐藏姓名和联系方式展示在人才搜索中", "Hiển thị ẩn tên và liên hệ", "名前・連絡先を隠して人材検索に表示", "Tampil tanpa nama & kontak")} />
        <Row href="/talent/visa" lead="🛂" title={t("외국인이라면 비자 안내", "Visa guide for international students", "外国人签证指南", "Hướng dẫn visa", "外国籍の方へビザ案内", "Panduan visa")} meta={t("지금 비자에서 취업 비자(E-7)까지 어디쯤인지", "Where you are on the way to a work visa (E-7)", "从现有签证到工作签证（E-7）的进度", "Từ visa hiện tại đến visa lao động (E-7)", "今のビザから就労ビザ（E-7）まで", "Dari visa sekarang ke visa kerja (E-7)")} />
      </Section>

      <div className="px-5 pb-4 pt-4">
        <div className="rounded-3xl bg-[color:var(--v2-ink)] px-6 py-7 text-white">
          <p className="text-[20px] font-bold leading-[1.4]">{t("내 커리어, 지금 만들어 볼까요?", "Ready to build your career page?", "现在就来打造你的职业档案？", "Tạo hồ sơ sự nghiệp ngay?", "マイキャリアを作ってみましょう", "Buat halaman kariermu sekarang?")}</p>
          <p className="mt-1.5 text-[14px] leading-[1.6] text-white/75">{t("이메일이나 구글·카카오 계정으로 바로 시작해요.", "Start right away with email or Google/Kakao.", "用邮箱或 Google/Kakao 账号即可开始。", "Bắt đầu ngay bằng email hoặc Google/Kakao.", "メールかGoogle・Kakaoですぐ始められます。", "Mulai dengan email atau Google/Kakao.")}</p>
          <div className="mt-5">
            <Link href={SIGNUP} className="flex h-12 items-center justify-center rounded-xl bg-white text-[16px] font-semibold text-[color:var(--v2-ink)] transition hover:opacity-90">
              {t("시작하기", "Get started", "开始使用", "Bắt đầu", "はじめる", "Mulai")}
            </Link>
          </div>
        </div>
      </div>
    </Page>
  );
}

/** 가입하면 만들어지는 내 커리어 — 예시 카드(가상의 학생). */
function SampleCard({ t }: { t: PlatformT }) {
  return (
    <Section title={t("이런 화면이 만들어져요", "Here's what you'll get", "你会得到这样的页面", "Bạn sẽ có trang như này", "こんな画面ができます", "Hasilnya seperti ini")} aside={<span className="rounded-full bg-[color:var(--v2-band)] px-2.5 py-1 text-[12px] font-bold text-[color:var(--v2-muted)]">{t("예시", "Example", "示例", "Ví dụ", "例", "Contoh")}</span>}>
      <div className="rounded-3xl bg-[color:var(--v2-band)] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[20px] font-bold text-[color:var(--v2-accent)]" aria-hidden>
            A
          </span>
          <div className="min-w-0">
            <p className="truncate text-[18px] font-bold text-[color:var(--v2-ink)]">{t("어플라이", "Aply Student", "Aply 同学", "Aply", "アプライ", "Aply")}</p>
            <p className="truncate text-[13px] text-[color:var(--v2-muted)]">{t("경영학과 4학년 · 퍼포먼스 마케팅 희망", "Business senior · wants performance marketing", "经营学大四 · 期望效果营销", "SV năm 4 QTKD · muốn làm marketing", "経営学部4年 · パフォーマンスマーケ志望", "Mhs bisnis · ingin marketing")}</p>
          </div>
        </div>
        <p className="mt-4 text-[14px] leading-[1.65] text-[color:var(--v2-ink-2)]">
          {t("교환학생 시절 학교 SNS를 6개월 운영하며 업로드 시간대를 바꿔 참여율을 30% 올렸어요.", "Ran the school's social account for 6 months as an exchange student and raised engagement 30% by changing post times.", "交换生期间运营学校社交账号 6 个月，调整发布时间使互动率提升 30%。", "Quản lý SNS của trường 6 tháng, đổi giờ đăng tăng tương tác 30%.", "交換留学中に大学SNSを6か月運営し、投稿時間を変えてエンゲージメントを30%向上。", "Mengelola SNS kampus 6 bulan, menaikkan interaksi 30%.")}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {["GA4", "Meta Ads", "Excel", "Canva", "TOPIK 5"].map((k) => (
            <span key={k} className="rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold text-[color:var(--v2-ink-3)]">
              {k}
            </span>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <span className="rounded-2xl bg-white px-3.5 py-3">
            <span className="block text-[12px] font-bold text-[color:var(--v2-good)]">{t("준비됐어요", "Ready", "已就绪", "Sẵn sàng", "準備OK", "Siap")}</span>
            <span className="mt-0.5 block text-[15px] font-bold text-[color:var(--v2-ink)]">{t("이력서", "Resume", "简历", "CV", "履歴書", "CV")}</span>
          </span>
          <span className="rounded-2xl bg-white px-3.5 py-3">
            <span className="block text-[12px] font-bold text-[color:var(--v2-good)]">{t("문항 3개", "3 answers", "3 个问题", "3 câu", "3問", "3 jawaban")}</span>
            <span className="mt-0.5 block text-[15px] font-bold text-[color:var(--v2-ink)]">{t("자기소개서", "Cover letter", "自我介绍", "Thư GT", "自己紹介書", "Surat")}</span>
          </span>
        </div>
      </div>
    </Section>
  );
}

/** 지금 바로 해 볼 수 있는 것 — 직무를 고르면 그 직무 공고 수와 최신 공고(공개 데이터). 비교는 가입 후. */
function RoleJobs({ t }: { t: PlatformT }) {
  const { locale } = useLanguage();
  const [role, setRole] = useState(POPULAR_ROLES[0]);
  const [data, setData] = useState<Record<string, { total: number; items: PublicPositionListItem[] }>>({});
  const cur = data[role] ?? null;
  useEffect(() => {
    if (data[role]) return;
    let alive = true;
    // 같은 분류(예: 개발)에 여러 직무가 섞여 있어 직무 이름으로 관련도순 검색한다(내 커리어 체크리스트와 같은 방식).
    getPublicPositionsPage({ jobRoles: jobCategoriesForInterests([role]), search: jobTaxonomyLabelOf(t, role), sort: "relevance", page: 1, limit: 3, locale })
      .then((p) => alive && setData((m) => ({ ...m, [role]: { total: p.total ?? p.items.length, items: p.items } })))
      .catch(() => alive && setData((m) => ({ ...m, [role]: { total: 0, items: [] } })));
    return () => {
      alive = false;
    };
  }, [role, data, locale, t]);

  return (
    <Section title={t("내 직무 공고는 얼마나 있을까?", "How many jobs for your role?", "你的职位有多少招聘？", "Ngành bạn có bao nhiêu tin?", "自分の職種の求人は？", "Berapa lowongan untuk peranmu?")}>
      <div className="-mx-5 mb-3 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        {POPULAR_ROLES.map((r) => (
          <Chip key={r} active={r === role} onClick={() => setRole(r)}>
            {jobTaxonomyLabelOf(t, r)}
          </Chip>
        ))}
      </div>
      {cur === null ? (
        <RowsSkeleton count={3} />
      ) : (
        <>
          <p className="pb-1 text-[15px] text-[color:var(--v2-ink-3)]">
            {/* 관련도 검색은 의미가 가까운 150개 안에서 센다 — 그 끝에 닿으면 정확한 수 대신 '150개 넘게'. */}
            {cur.total >= RELEVANCE_CAP
              ? t(`${jobTaxonomyLabelOf(t, role)} 관련 공고 ${RELEVANCE_CAP}개 넘게`, `${RELEVANCE_CAP}+ jobs related to ${jobTaxonomyLabelOf(t, role)}`, `${jobTaxonomyLabelOf(t, role)} 相关职位 ${RELEVANCE_CAP}+ 个`, `${RELEVANCE_CAP}+ tin về ${jobTaxonomyLabelOf(t, role)}`, `${jobTaxonomyLabelOf(t, role)}関連の求人${RELEVANCE_CAP}件以上`, `${RELEVANCE_CAP}+ lowongan ${jobTaxonomyLabelOf(t, role)}`)
              : cur.total
              ? t(`${jobTaxonomyLabelOf(t, role)} 관련 공고 ${cur.total.toLocaleString()}개`, `${cur.total.toLocaleString()} jobs related to ${jobTaxonomyLabelOf(t, role)}`, `${jobTaxonomyLabelOf(t, role)} 相关职位 ${cur.total.toLocaleString()} 个`, `${cur.total.toLocaleString()} tin về ${jobTaxonomyLabelOf(t, role)}`, `${jobTaxonomyLabelOf(t, role)}関連の求人${cur.total.toLocaleString()}件`, `${cur.total.toLocaleString()} lowongan ${jobTaxonomyLabelOf(t, role)}`)
              : t("지금은 이 직무 공고가 없어요.", "No jobs for this role right now.", "目前没有该职位的招聘。", "Hiện chưa có tin.", "現在この職種の求人はありません。", "Belum ada lowongan.")}
          </p>
          {cur.items.map((j) => (
            <Row key={j.id} href={`/talent/jobs/${j.id}`} thumb={{ src: jobPhotoOf(j), fallback: companyOf(j) || j.title }} title={j.title} meta={companyOf(j) || undefined} />
          ))}
          <div className="mt-3 rounded-2xl bg-[#edf1fd] p-4">
            <p className="text-[14px] leading-[1.6] text-[color:var(--v2-ink-2)]">{t("가입하면 이 공고들이 원하는 기술·자격증·경험과 내 서류를 비교해, 빠진 것부터 알려 드려요.", "Sign up and we'll compare what these jobs ask for with your documents — starting with what's missing.", "注册后，我们会将这些职位要求的技能、证书、经验与你的材料对比，先告诉你缺什么。", "Đăng ký để so sánh yêu cầu của các tin này với hồ sơ — bắt đầu từ phần còn thiếu.", "登録すると、これらの求人が求めるスキル・資格・経験と書類を比べ、足りないものから教えます。", "Daftar untuk membandingkan syarat lowongan ini dengan dokumenmu.")}</p>
            <div className="mt-3">
              <Button size="sm" href={SIGNUP}>
                {t("내 서류와 비교해 보기", "Compare with mine", "与我的材料对比", "So với hồ sơ của tôi", "自分の書類と比べる", "Bandingkan")}
              </Button>
            </div>
          </div>
        </>
      )}
    </Section>
  );
}
