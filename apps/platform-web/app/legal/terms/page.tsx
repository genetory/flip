import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

export const metadata = {
  title: "이용약관 | Aply",
  description: "Aply 서비스 이용약관"
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-foreground">이용약관</h1>
        <p className="mt-2 text-sm text-muted-foreground">시행일: 2026년 5월 11일</p>

        <section className="mt-8 space-y-6 text-sm leading-relaxed text-foreground">
          <div>
            <h2 className="text-lg font-semibold">제1조 (목적)</h2>
            <p className="mt-2 text-muted-foreground">
              본 약관은 Aply(이하 "회사")가 제공하는 국제 인재-국내 기업 채용 매칭 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 사이의 권리와 의무를 규정합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제2조 (용어 정의)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>"회원": 본 약관에 동의하고 서비스 이용 계정을 등록한 자</li>
              <li>"학생 회원": 채용을 희망하는 국제 인재</li>
              <li>"파트너 회원": 인재를 채용하고자 하는 한국 기업 또는 기관</li>
              <li>"운영자": 서비스를 관리·운영하는 자</li>
              <li>"매칭": 학생과 파트너 간 채용 연결을 위한 서비스 기능</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제3조 (회원가입 및 자격)</h2>
            <p className="mt-2 text-muted-foreground">
              회원가입은 이메일 또는 소셜 로그인(네이버, 카카오, 구글)을 통해 가능합니다. 만 14세 미만은 가입할 수 없습니다. 파트너 회원은 사업자등록증 등 회사 확인 서류를 제출해야 하며, 운영자의 승인을 받아야 채용 활동을 시작할 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제4조 (서비스 제공)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>학생: 프로필 작성, 포지션 검색·지원, 면접 일정 선택, 과제 제출, 프로그램 참여, 추천서·수료증 수령</li>
              <li>파트너: 포지션 등록, 지원자 검토, 면접 일정 제안, 과제 부여, 프로그램 운영, 추천서·수료증 발급</li>
              <li>운영자: 서비스 검수, 분쟁 조정, 학점 인정 검토 등</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제5조 (회원의 의무)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>가입 시 정확한 정보를 제공하고, 변경 시 즉시 갱신해야 합니다.</li>
              <li>타인의 정보를 도용하거나, 허위 정보로 매칭을 시도해서는 안 됩니다.</li>
              <li>스팸, 명예훼손, 차별, 괴롭힘 등의 행위를 금지합니다.</li>
              <li>이용 중 알게 된 타 회원의 개인정보를 무단으로 외부에 공유할 수 없습니다.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제6조 (계정 정지 및 해지)</h2>
            <p className="mt-2 text-muted-foreground">
              회사는 회원이 본 약관을 위반한 경우 경고, 일시 정지, 영구 정지 등의 조치를 할 수 있습니다. 회원은 언제든지 회원 탈퇴를 통해 이용 계약을 해지할 수 있습니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제7조 (책임 제한)</h2>
            <p className="mt-2 text-muted-foreground">
              회사는 매칭 결과를 보장하지 않으며, 학생과 파트너 간의 면접·고용·프로그램 운영 등에서 발생하는 분쟁에 대해 직접적인 법적 책임을 지지 않습니다. 단, 명백한 회사의 귀책사유가 있는 경우 별도 검토합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제8조 (약관 변경)</h2>
            <p className="mt-2 text-muted-foreground">
              본 약관이 변경될 경우 시행 7일 전 서비스 공지사항을 통해 안내합니다. 회원이 명시적으로 거부 의사를 표시하지 않으면 변경에 동의한 것으로 봅니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제9조 (준거법 및 관할)</h2>
            <p className="mt-2 text-muted-foreground">
              본 약관은 대한민국 법을 준거법으로 하며, 회사와 회원 간 분쟁은 대한민국 법원을 관할 법원으로 합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">문의</h2>
            <p className="mt-2 text-muted-foreground">
              이용 관련 문의: <a href="mailto:info@flip-ers.com" className="text-primary underline">info@flip-ers.com</a>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
