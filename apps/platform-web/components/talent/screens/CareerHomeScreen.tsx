"use client";

// 내 커리어 — 이력서/자기소개서 + 커리어 기록.
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkle } from "@phosphor-icons/react";
import { MockInterviewModal } from "../jobs/MockInterviewModal";
import { MockGateModal } from "../jobs/MockGateModal";
import { SelfMockResultModal } from "../jobs/SelfMockResultModal";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { CareerAdvisorModal } from "../career/CareerAdvisorModal";
import { CareerLayout } from "../career/CareerLayout";
import { ProfileGate } from "../career/ProfileGate";
import { FeedCard } from "../career/FeedCard";
import { CareerFunnelCards } from "../career/CareerFunnelCards";
import { TLoading, TPageHeader } from "../ui/primitives";
import { talentAppRoutes } from "../../../lib/talent/app-nav";
import { useCareerFeed, removeFeedEntry } from "../../../lib/talent/career-feed";
import { useBasicInfo, isBasicInfoComplete } from "../../../lib/talent/basic-info";
import { useResumeDoc, useRenewalDocsStatus, resumeCompleteness, displayMonth, type ResumeItem } from "../../../lib/talent/resume-doc";
import { useCoverDoc, coverCompleteness } from "../../../lib/talent/cover-doc";
import { useSelfMock } from "../../../lib/talent/self-mock";
import { useCareerHistorySync } from "../../../lib/talent/useCareerHistorySync";
import { usePlatformT } from "../../../lib/i18n";
export function CareerHomeScreen() {
  return (
    <CareerLayout>
      <Content />
    </CareerLayout>
  );
}

function Content() {
  const t = usePlatformT();
  const feed = useCareerFeed();
  const basicInfo = useBasicInfo();
  const resume = useResumeDoc();
  const cover = useCoverDoc();
  const docsStatus = useRenewalDocsStatus();
  const ready = isBasicInfoComplete(basicInfo);

  // 이미 입력된 이력서/자소서 항목도 커리어 기록으로 백필(멱등, refId 중복 방지).
  useCareerHistorySync();

  // 내 서류(이력서·자기소개서) 기반 self 모의 면접 — 시작 전 서류 완성 게이트 + 지난 결과.
  const [mockGateOpen, setMockGateOpen] = useState(false);
  const [mockOpen, setMockOpen] = useState(false);
  const [mockResultOpen, setMockResultOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const selfMock = useSelfMock();
  const mockAnsweredCount = selfMock?.answers?.length ?? 0;

  // 계정(서버) 기본 정보·문서 로드 완료 전에는 게이트를 판단하지 않는다(깜빡임 방지).
  if (docsStatus !== "loaded") {
    return (
      <div className="flex flex-col gap-12">
        <TPageHeader title={t("내 커리어","My Career","我的职业","Sự nghiệp của tôi","マイキャリア","Karier Saya")} description={t("이력서·자기소개서에 쓸 기본 정보부터 등록해요.","Start by adding the basic info for your resume and cover letter.","先填写用于简历和求职信的基本信息。","Bắt đầu bằng thông tin cơ bản cho CV và thư xin việc.","履歴書・自己PRに使う基本情報から登録しましょう。","Mulai dengan info dasar untuk CV dan surat lamaran.")} />
        <TLoading />
      </div>
    );
  }

  // 기본 정보가 등록되지 않으면 무조건 그것부터.
  if (!ready) {
    return (
      <div className="flex flex-col gap-12">
        <TPageHeader title={t("내 커리어","My Career","我的职业","Sự nghiệp của tôi","マイキャリア","Karier Saya")} description={t("이력서·자기소개서에 쓸 기본 정보부터 등록해요.","Start by adding the basic info for your resume and cover letter.","先填写用于简历和求职信的基本信息。","Bắt đầu bằng thông tin cơ bản cho CV và thư xin việc.","履歴書・自己PRに使う基本情報から登録しましょう。","Mulai dengan info dasar untuk CV dan surat lamaran.")} />
        <ProfileGate />
      </div>
    );
  }

  const rp = resumeCompleteness(resume);
  const cp = coverCompleteness(cover);
  const workItems = resume?.items.filter((i) => i.section === "experience") ?? [];

  return (
    <div className="flex flex-col gap-12">
      <header>
        <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#0B46E8]">MY CAREER</p>
        <h1 className="mt-2 break-keep text-[26px] font-black leading-[1.2] tracking-[-0.02em] text-[#0B1227]">{t("내 커리어를 하나씩 완성해요","Build your career step by step","一步步完善我的职业","Hoàn thiện sự nghiệp từng bước","キャリアを一つずつ完成させよう","Bangun karier langkah demi langkah")}</h1>
        <p className="mt-1.5 break-keep text-[14px] leading-relaxed text-[#8B95A1]">{t("이력서·자기소개서를 만들고, 오늘 한 걸음씩 취업에 가까워져요.","Create your resume and cover letter, and get one step closer to a job each day.","制作简历和求职信，每天离就业更近一步。","Tạo CV và thư xin việc, mỗi ngày tiến gần hơn tới việc làm.","履歴書・自己PRを作り、今日も一歩ずつ就職に近づこう。","Buat CV dan surat lamaran, makin dekat ke pekerjaan tiap hari.")}</p>
      </header>

      {/* AI 커리어 상담 — 나에 대해 알아가며 어울리는 직무·방향을 찾는다 */}
      <section className="flex flex-col gap-4">
        <SectionHead title={t("AI와 나를 알아가요","Get to know yourself with AI","用 AI 认识我自己","Hiểu bản thân cùng AI","AIで自分を知る","Kenali dirimu dengan AI")} desc={t("AI와 대화하며 나에게 어울리는 직무·직업, 봐야 할 공고, 이력서·자기소개서 방향까지 찾아요.","Chat with AI to find fitting roles, which jobs to target, and how to write your resume and cover letter.","与 AI 对话，找到适合的职位、该看的招聘和简历自我介绍的方向。","Trò chuyện với AI để tìm nghề phù hợp, tin tuyển nên xem và cách viết CV, thư xin việc.","AIと対話して自分に合う職種、見るべき求人、履歴書・自己PRの方向まで見つけます。","Ngobrol dengan AI untuk menemukan peran cocok, lowongan yang perlu dilihat, dan cara menulis resume & surat lamaran.")} />
        <div className="grid gap-4 sm:grid-cols-2 sm:items-start">
          {/* AI 커리어 상담 시작 */}
          <button
            type="button"
            onClick={() => setAdvisorOpen(true)}
            className="group flex h-full items-center gap-3.5 rounded-3xl border border-[#E5E8EB] bg-white p-4 text-left shadow-[0_6px_20px_-10px_rgba(11,18,39,0.18)] transition hover:border-[#0B46E8]/40 hover:shadow-[0_12px_28px_-10px_rgba(11,70,232,0.3)]"
          >
            <span className="relative flex h-[72px] w-[72px] shrink-0 items-center justify-center" aria-hidden>
              <Image src="/images/img_career_position_ai.webp" alt="" width={72} height={72} className="h-full w-full object-contain" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#EDF1FD] px-2 py-0.5 text-[10.5px] font-black uppercase tracking-[0.12em] text-[#0B46E8]">
                <Sparkle className="h-3 w-3" weight="fill" /> AI
              </span>
              <p className="mt-1.5 text-[15px] font-black tracking-[-0.02em] text-[#0B1227]">{t("AI 커리어 상담 시작하기","Start an AI career chat","开始 AI 职业咨询","Bắt đầu tư vấn nghề AI","AIキャリア相談を始める","Mulai konsultasi karier AI")}</p>
              <p className="mt-0.5 break-keep text-[12px] leading-relaxed text-[#8B95A1]">{t("나에게 어울리는 일을 함께 찾고, 관심 직무로 담아드려요.","Find work that fits you and save it to your interests.","一起找到适合你的工作并加入兴趣职位。","Cùng tìm việc phù hợp và lưu vào nghề quan tâm.","自分に合う仕事を一緒に見つけて関心職種に保存します。","Temukan pekerjaan yang cocok dan simpan ke minatmu.")}</p>
            </div>
          </button>

          {/* 관심 직무 — 직접 고르거나 수정 */}
          <div className="flex flex-col gap-1.5">
            <p className="px-1 text-[12px] font-semibold text-[#8B95A1]">{t("관심 직무 — 직접 고르거나 수정하기","Job interests — pick or edit directly","兴趣职位 — 直接选择或修改","Nghề quan tâm — tự chọn hoặc sửa","関心職種 — 直接選ぶ・修正","Minat pekerjaan — pilih atau ubah")}</p>
            <JobInterestCard variant="edit" />
          </div>
        </div>
      </section>

      {/* 이력서 · 자기소개서 */}
      <section className="flex flex-col gap-4">
        <SectionHead title={t("지원 서류를 만들어요","Create your documents","制作申请材料","Tạo hồ sơ ứng tuyển","応募書類を作る","Buat dokumen lamaran")} desc={t("AI 챗으로 편하게 채우고, 미리보기로 확인해요.","Fill it in easily with AI chat and check the preview.","用 AI 聊天轻松填写，并通过预览查看。","Điền dễ dàng bằng AI chat và xem trước.","AIチャットで手軽に入力し、プレビューで確認。","Isi mudah dengan AI chat dan cek pratinjau.")} />
        <CareerFunnelCards showPreview />
      </section>

      {/* 모의 면접 — 내 이력서·자기소개서 기반 self 연습 */}
      <section className="flex flex-col gap-4">
        <SectionHead title={t("모의 면접으로 연습해요","Practice with mock interviews","用模拟面试练习","Luyện tập với phỏng vấn thử","模擬面接で練習する","Latihan wawancara simulasi")} desc={t("내 이력서·자기소개서를 바탕으로 예상 질문을 풀고 AI 피드백을 받아요.","Answer likely questions based on your resume and cover letter, and get AI feedback.","根据你的简历和求职信回答预测问题，并获得 AI 反馈。","Trả lời câu hỏi dự kiến dựa trên CV và thư xin việc, nhận phản hồi AI.","履歴書・自己PRをもとに予想質問に答え、AIフィードバックを受けよう。","Jawab pertanyaan berdasarkan CV dan surat lamaranmu, dapat masukan AI.")} />
        <button
          type="button"
          // 이력서·자기소개서가 모두 준비(100%)됐으면 게이트를 건너뛰고 바로 유형 선택으로.
          onClick={() => (rp >= 100 && cp >= 100 ? setMockOpen(true) : setMockGateOpen(true))}
          className="flex items-center gap-3.5 rounded-2xl border border-[#E4EDFB] bg-[#F5F8FF] p-4 text-left transition hover:border-[#0B46E8]/40"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[20px] shadow-[0_2px_10px_rgba(11,70,232,0.1)]" aria-hidden>🎤</span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-[#191F28]">{t("내 서류로 모의 면접 보기","Mock interview from my docs","用我的材料模拟面试","Phỏng vấn thử từ hồ sơ","自分の書類で模擬面接","Wawancara simulasi dari dokumenku")}</p>
            <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t("이력서·자기소개서에서 예상 질문을 뽑아 연습하고 AI 피드백을 받아요.","Practice likely questions drawn from your resume and cover letter, with AI feedback.","从简历和求职信中提取预测问题练习并获得 AI 反馈。","Luyện các câu hỏi rút từ CV và thư xin việc kèm phản hồi AI.","履歴書・自己PRから予想質問を出して練習し、AIフィードバックを受けよう。","Latih pertanyaan dari CV dan surat lamaranmu dengan masukan AI.")}</p>
          </div>
          <Sparkle className="h-5 w-5 shrink-0 text-[#0B46E8]" weight="fill" />
        </button>
        {mockAnsweredCount ? (
          <button
            type="button"
            onClick={() => setMockResultOpen(true)}
            className="flex items-center gap-3.5 rounded-2xl border border-[#EEF1F5] bg-white p-4 text-left transition hover:border-[#D7DCE3] hover:bg-[#F6F8FB]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px]" aria-hidden>🗂️</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold text-[#191F28]">{t("내 모의 면접 연습 결과","My mock interview results","我的模拟面试结果","Kết quả phỏng vấn thử","模擬面接の練習結果","Hasil wawancara simulasiku")}</p>
              <p className="mt-0.5 break-keep text-[12.5px] text-[#8B95A1]">{t(`답변한 ${mockAnsweredCount}문항의 답변·AI 피드백을 다시 확인해요.`, `Review answers and AI feedback for ${mockAnsweredCount} question(s).`, `重新查看已回答的 ${mockAnsweredCount} 道题的答案和 AI 反馈。`, `Xem lại câu trả lời và phản hồi AI cho ${mockAnsweredCount} câu hỏi.`, `回答した${mockAnsweredCount}問の回答・AIフィードバックを再確認。`, `Tinjau jawaban dan masukan AI untuk ${mockAnsweredCount} soal.`)}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-[#C4CAD2]" weight="bold" />
          </button>
        ) : null}
      </section>

      {/* 이력서에 담긴 내 커리어 — 직장(경력)만 심플 요약 */}
      <section className="flex flex-col gap-4">
        <SectionHead title={t("이력서에 담긴 내 커리어","My career in my resume","简历中的我的职业","Sự nghiệp trong CV","履歴書に載る私のキャリア","Karier dalam CV-ku")} desc={t("소속했던 곳을 시간순으로 보여드려요.","Places you've worked, in order of time.","按时间顺序展示你所在过的地方。","Những nơi bạn từng làm, theo trình tự thời gian.","所属した場所を時系列で表示します。","Tempat kamu pernah bekerja, urut waktu.")} />
        {workItems.length ? (
          <>
            <CareerSummary items={workItems} />
            <Link
              href={talentAppRoutes.resume}
              className="flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]"
            >
              {t("이력서 편집하러 가기","Edit resume","去编辑简历","Chỉnh sửa CV","履歴書を編集","Edit CV")} <ArrowRight className="h-4 w-4" weight="bold" />
            </Link>
          </>
        ) : (
          <EmptyWork />
        )}
      </section>

      {/* 작성 히스토리 */}
      <section className="flex flex-col gap-4">
        <SectionHead title={`${t("작성 히스토리","Writing history","编写记录","Lịch sử viết","作成履歴","Riwayat penulisan")}${feed.length ? ` (${feed.length})` : ""}`} desc={t("이력서·자기소개서에 남긴 내용이 순서대로 쌓여요.","What you add to your resume and cover letter piles up in order.","你在简历和求职信中留下的内容会按顺序累积。","Nội dung bạn thêm vào CV và thư xin việc được lưu theo thứ tự.","履歴書・自己PRに残した内容が順に積み重なります。","Isian di CV dan surat lamaranmu tersimpan berurutan.")} />
        {feed.length ? (
          <>
            <div className="flex flex-col gap-2.5">
              {feed.slice(0, 5).map((e) => (
                <FeedCard key={e.id} entry={e} onDelete={removeFeedEntry} />
              ))}
            </div>
            {feed.length > 5 ? (
              <Link
                href={talentAppRoutes.history}
                className="flex items-center justify-center gap-1 rounded-2xl border border-[#EEF1F5] bg-white py-3.5 text-[14px] font-bold text-[#0B46E8] transition hover:bg-[#F6F8FB]"
              >
                {t("전체 히스토리 보기","View all history","查看全部记录","Xem toàn bộ","全履歴を見る","Lihat semua")} ({feed.length}) <ArrowRight className="h-4 w-4" weight="bold" />
              </Link>
            ) : null}
          </>
        ) : (
          <EmptyFeed />
        )}
      </section>

      {mockGateOpen ? (
        <MockGateModal
          onClose={() => setMockGateOpen(false)}
          onConfirm={() => {
            setMockGateOpen(false);
            setMockOpen(true);
          }}
        />
      ) : null}
      {mockOpen ? <MockInterviewModal onClose={() => setMockOpen(false)} /> : null}
      {mockResultOpen ? <SelfMockResultModal onClose={() => setMockResultOpen(false)} /> : null}
      {advisorOpen ? <CareerAdvisorModal onClose={() => setAdvisorOpen(false)} /> : null}
    </div>
  );
}

function SectionHead({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{title}</h2>
      <p className="mt-1 break-keep text-[13px] text-[#8B95A1]">{desc}</p>
    </div>
  );
}

// 소속했던 회사(경력)를 시간순 타임라인으로 보여준다.
function CareerSummary({ items }: { items: ResumeItem[] }) {
  return (
    <div className="rounded-2xl border border-[#EEF1F5] bg-white p-5">
      <ol className="flex flex-col">
        {items.map((it, i) => {
          const period = [displayMonth(it.startDate ?? ""), displayMonth(it.endDate ?? "")].filter(Boolean).join(" ~ ");
          const last = i === items.length - 1;
          return (
            <li key={it.id} className="flex gap-3">
              {/* 타임라인 점 + 연결선 */}
              <div className="flex flex-col items-center">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0B46E8] ring-4 ring-[#EDF1FD]" />
                {!last ? <span className="w-px flex-1 bg-[#E5E8EB]" /> : null}
              </div>
              <div className={`min-w-0 flex-1 ${last ? "" : "pb-5"}`}>
                {period ? <p className="text-[11.5px] font-normal text-[#8B95A1]">{period}</p> : null}
                <p className="mt-0.5 break-keep text-[14.5px] font-bold text-[#191F28]">{it.company || it.text}</p>
                {it.company && it.text ? <p className="mt-0.5 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{it.text}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function EmptyWork() {
  const t = usePlatformT();
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px]" aria-hidden>💼</span>
      <p className="mt-3 text-[14px] font-bold text-[#191F28]">{t("아직 직장 경력이 없어요","No work experience yet","还没有工作经历","Chưa có kinh nghiệm làm việc","まだ職歴がありません","Belum ada pengalaman kerja")}</p>
      <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("이력서에 경력을 추가하면 여기에 보여요.","Add work experience to your resume to see it here.","在简历中添加经历后会显示在这里。","Thêm kinh nghiệm vào CV để hiển thị ở đây.","履歴書に職歴を追加すると表示されます。","Tambahkan pengalaman di CV agar muncul di sini.")}</p>
    </div>
  );
}

function EmptyFeed() {
  const t = usePlatformT();
  return (
    <div className="rounded-2xl border border-dashed border-[#DCE3F0] bg-[#FAFBFC] p-6 text-center">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF1FD] text-[20px]" aria-hidden>📝</span>
      <p className="mt-3 text-[14px] font-bold text-[#191F28]">{t("아직 남긴 기록이 없어요","No records yet","还没有记录","Chưa có ghi chép","まだ記録がありません","Belum ada catatan")}</p>
      <p className="mt-1 break-keep text-[12.5px] leading-relaxed text-[#8B95A1]">{t("위에서 이력서나 자기소개서를 만들면 자동으로 여기에 쌓여요.","Create a resume or cover letter above and it piles up here automatically.","在上方制作简历或求职信后会自动累积在这里。","Tạo CV hoặc thư xin việc ở trên để tự động lưu tại đây.","上で履歴書や自己PRを作ると自動でここに溜まります。","Buat CV atau surat lamaran di atas, otomatis tersimpan di sini.")}</p>
    </div>
  );
}
