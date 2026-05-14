import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";

export const metadata = {
  title: "이용약관 | Aply",
  description: "Aply 서비스 이용약관"
};

const refundTiers = [
  {
    no: "1",
    title: "면접 전 환불",
    amount: "참여비의 50% 환불",
    description: "기업 면접이 진행되기 전 단계에서 환불 요청 시"
  },
  {
    no: "2",
    title: "면접 후 환불",
    amount: "참여비의 20% 환불",
    description: "기업 면접이 진행된 후 최종 매칭 전 환불 요청 시"
  },
  {
    no: "3",
    title: "최종 매칭 후",
    amount: "환불 불가",
    description: "기업과의 최종 매칭이 완료된 이후에는 환불이 불가합니다"
  }
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-foreground">이용약관</h1>
        <p className="mt-2 text-sm text-muted-foreground">시행일: 2026년 1월 1일</p>

        <section className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <div>
            <h2 className="text-lg font-semibold">제1조 (목적)</h2>
            <p className="mt-2 text-muted-foreground">
              본 약관은 주식회사 플리퍼스(이하 &quot;회사&quot;)가 제공하는 Aply 실무 체험 매칭 서비스(이하 &quot;서비스&quot;)의
              이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제2조 (용어의 정의)</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>&quot;서비스&quot;란 회사가 제공하는 실무 체험 매칭, 교육, 멘토링 등 일체의 서비스를 의미합니다.</li>
              <li>&quot;이용자&quot;란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원을 의미합니다.</li>
              <li>&quot;참여비&quot;란 서비스 이용을 위해 이용자가 회사에 지불하는 금액을 의미합니다.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제3조 (서비스 내용)</h2>
            <p className="mt-2 text-muted-foreground">회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>6주~16주 기업 실무 체험 매칭</li>
              <li>1:1 전담 멘토 배정 및 멘토링</li>
              <li>이력서 및 면접 코칭</li>
              <li>비즈니스 한국어 교육</li>
              <li>실무 체험 수료증 발급</li>
              <li>커리어 네트워킹 지원</li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제4조 (환불 정책)</h2>
            <p className="mt-2 text-muted-foreground">
              이용자가 서비스 이용을 중단하고자 할 경우, 다음 기준에 따라 참여비를 환불합니다:
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {refundTiers.map((tier) => (
                <div key={tier.no} className="rounded-xl border border-border/60 bg-card p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-xs font-semibold text-background">
                      {tier.no}
                    </span>
                    <h3 className="text-sm font-semibold">{tier.title}</h3>
                  </div>
                  <p className="mt-3 text-base font-semibold text-foreground">{tier.amount}</p>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{tier.description}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              ※ 환불 요청은 이메일(
              <a href="mailto:info@flip-ers.com" className="text-primary underline">
                info@flip-ers.com
              </a>
              )로 접수해 주시기 바랍니다. 환불 처리는 요청일로부터 영업일 기준 7일 이내에 진행됩니다.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제5조 (이용자의 의무)</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>이용자는 서비스 신청 시 정확한 정보를 제공해야 합니다.</li>
              <li>이용자는 실무 체험 기간 중 회사가 정한 규정을 준수해야 합니다.</li>
              <li>이용자는 실무 체험 기업의 기밀정보를 외부에 유출해서는 안 됩니다.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제6조 (회사의 의무)</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>회사는 이용자에게 안정적인 서비스를 제공하기 위해 최선을 다합니다.</li>
              <li>회사는 이용자의 개인정보를 관련 법령에 따라 안전하게 관리합니다.</li>
              <li>회사는 이용자의 문의사항에 성실히 응대합니다.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제7조 (면책조항)</h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>회사는 천재지변, 전쟁, 기타 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.</li>
              <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
              <li>회사는 실무 체험 기업의 경영상황 변화로 인한 실무 체험 조기 종료에 대해 책임을 지지 않습니다.</li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold">제8조 (분쟁해결)</h2>
            <p className="mt-2 text-muted-foreground">
              본 약관과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의하여 해결하도록 노력합니다. 협의가 이루어지지
              않을 경우, 관할 법원은 서울중앙지방법원으로 합니다.
            </p>
          </div>

          <div className="border-t border-border/60 pt-6">
            <h2 className="text-lg font-semibold">부칙</h2>
            <p className="mt-2 text-muted-foreground">본 약관은 2026년 1월 1일부터 시행합니다.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
