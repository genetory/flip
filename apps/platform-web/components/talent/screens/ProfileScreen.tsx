"use client";

// 프로필 — 기본 인적 정보(실명·이메일·연락처·주소·사진) + 관심 직무.
// 소개·경험·학력·스킬 등은 이후 채팅/피드로 자동 정리된다.
import { CareerLayout } from "../career/CareerLayout";
import { BasicInfoForm } from "../career/BasicInfoForm";
import { JobInterestCard } from "../jobs/JobInterestCard";
import { TPageHeader } from "../ui/primitives";
import { useAuthSession } from "../../auth/AuthSessionProvider";
import { usePlatformT } from "../../../lib/i18n";

export function ProfileScreen() {
  return (
    <CareerLayout>
      <Content />
    </CareerLayout>
  );
}

function Content() {
  const t = usePlatformT();
  const { user } = useAuthSession();
  const defaultName = user?.realName || user?.name || "";
  return (
    <div className="flex flex-col gap-12">
      <TPageHeader title={t("프로필","Profile","个人资料","Hồ sơ","プロフィール","Profil")} description={t("이력서·자기소개서에 쓰이는 기본 정보예요. 나머지는 나중에 채워져요.","Basic info used in your resume and cover letter. The rest fills in later.","用于简历和求职信的基本信息，其余稍后填写。","Thông tin cơ bản dùng cho CV và thư xin việc. Phần còn lại điền sau.","履歴書・自己PRに使う基本情報です。残りは後で埋まります。","Info dasar untuk CV dan surat lamaran. Sisanya diisi nanti.")} />
      <section>
        <SectionTitle>{t("기본 정보","Basic info","基本信息","Thông tin cơ bản","基本情報","Info dasar")}</SectionTitle>
        <BasicInfoForm defaultName={defaultName} />
      </section>
      <section>
        <SectionTitle>{t("관심 직무","Job interests","感兴趣的职位","Vị trí quan tâm","関心のある職種","Minat pekerjaan")}</SectionTitle>
        <JobInterestCard variant="edit" />
      </section>
    </div>
  );
}

// 홈 화면과 동일한 섹션 타이틀.
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[18px] font-black tracking-[-0.02em] text-[#0B1227]">{children}</p>;
}
