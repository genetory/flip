"use client";

import { Card, LaunchButton, LaunchContainer } from "../../../../components/launch/ui";
import { Header } from "../../../../components/site/Header";
import { Footer } from "../../../../components/site/Footer";
import { useLaunchT } from "../../../../lib/launch/i18n";

// 3. 신청 완료 페이지
export default function LaunchApplyCompletePage() {
  const t = useLaunchT();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center py-16">
      <LaunchContainer>
        <Card className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#B7FF5A] text-[30px]">🎉</div>
          <h1 className="mt-5 text-[22px] font-black tracking-[-0.01em] text-[#0B1227]">{t("신청이 접수되었어요!", "Your application has been received!", "你的申请已收到！", "Đơn đăng ký của bạn đã được tiếp nhận!", "お申し込みを受け付けました！", "Pendaftaranmu telah kami terima!")}</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-[#4E5968]">
            {t("APLY Global Career Launch 참가 신청이 완료되었습니다.", "Your application for APLY Global Career Launch is complete.", "你已完成 APLY Global Career Launch 的报名。", "Bạn đã hoàn tất đăng ký tham gia APLY Global Career Launch.", "APLY Global Career Launch への参加申請が完了しました。", "Pendaftaranmu untuk APLY Global Career Launch telah selesai.")}
            <br />
            {t("선발 결과와 프로그램 일정은", "Selection results and the program schedule will be sent by", "选拔结果和课程日程将通过", "Kết quả tuyển chọn và lịch chương trình sẽ được gửi qua", "選考結果とプログラムの日程は", "Hasil seleksi dan jadwal program akan dikirim melalui")} <b>{t("이메일", "email", "电子邮件", "email", "メール", "email")}</b>{t("로 안내드립니다.", ".", "通知你。", ".", "でご案内します。", ".")}
          </p>

          <div className="mt-6 rounded-2xl bg-[#F6F8FB] p-4 text-left">
            <p className="text-[12.5px] font-bold text-[#191F28]">{t("다음 단계", "Next steps", "下一步", "Bước tiếp theo", "次のステップ", "Langkah berikutnya")}</p>
            <ol className="mt-2 space-y-1.5 text-[13px] text-[#4E5968]">
              <li>{t("1. 서류 검토 후 선발 안내 (3~5일)", "1. Selection notice after document review (3–5 days)", "1. 材料审核后通知选拔结果（3~5天）", "1. Thông báo tuyển chọn sau khi xét hồ sơ (3–5 ngày)", "1. 書類審査後に選考をご案内（3〜5日）", "1. Pemberitahuan seleksi setelah tinjauan dokumen (3–5 hari)")}</li>
              <li>{t("2. 대시보드에서 Week 1 미션 시작", "2. Start the Week 1 mission on your dashboard", "2. 在仪表盘开始第1周任务", "2. Bắt đầu nhiệm vụ Tuần 1 trên bảng điều khiển", "2. ダッシュボードでWeek 1のミッション開始", "2. Mulai misi Minggu 1 di dasbor")}</li>
              <li>{t("3. 매주 세미나 참석 + 미션 수행", "3. Attend the weekly seminar + complete missions", "3. 每周参加研讨会 + 完成任务", "3. Tham dự hội thảo hằng tuần + hoàn thành nhiệm vụ", "3. 毎週セミナー参加＋ミッション遂行", "3. Hadiri seminar mingguan + selesaikan misi")}</li>
            </ol>
          </div>

          <div className="mt-6 flex flex-col gap-2.5">
            <LaunchButton href="/career-launch/dashboard" variant="primary" full>
              {t("대시보드로 이동", "Go to dashboard", "前往仪表盘", "Đến bảng điều khiển", "ダッシュボードへ移動", "Ke dasbor")}
            </LaunchButton>
            <LaunchButton href="/career-launch" variant="outline" full>
              {t("홈으로", "Home", "返回首页", "Về trang chủ", "ホームへ", "Ke beranda")}
            </LaunchButton>
          </div>
        </Card>
      </LaunchContainer>
      </main>
      <Footer />
    </div>
  );
}
