"use client";

import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { usePlatformT } from "../../../lib/i18n";

export function TermsContent() {
  const t = usePlatformT();

  const refundTiers = [
    {
      no: "1",
      title: t(
        "면접 전 환불",
        "Refund Before Interview",
        "面试前退款",
        "Hoàn tiền trước phỏng vấn",
        "面接前の返金",
        "Pengembalian Sebelum Wawancara"
      ),
      amount: t(
        "참여비의 50% 환불",
        "50% of the participation fee refunded",
        "退还参与费的50%",
        "Hoàn 50% phí tham gia",
        "参加費の50%を返金",
        "Pengembalian 50% dari biaya partisipasi"
      ),
      description: t(
        "기업 면접이 진행되기 전 단계에서 환불 요청 시",
        "When a refund is requested before the company interview takes place",
        "在企业面试进行之前的阶段申请退款时",
        "Khi yêu cầu hoàn tiền ở giai đoạn trước khi tiến hành phỏng vấn với doanh nghiệp",
        "企業面接が行われる前の段階で返金を要求した場合",
        "Saat pengembalian diminta pada tahap sebelum wawancara perusahaan berlangsung"
      )
    },
    {
      no: "2",
      title: t(
        "면접 후 환불",
        "Refund After Interview",
        "面试后退款",
        "Hoàn tiền sau phỏng vấn",
        "面接後の返金",
        "Pengembalian Setelah Wawancara"
      ),
      amount: t(
        "참여비의 20% 환불",
        "20% of the participation fee refunded",
        "退还参与费的20%",
        "Hoàn 20% phí tham gia",
        "参加費の20%を返金",
        "Pengembalian 20% dari biaya partisipasi"
      ),
      description: t(
        "기업 면접이 진행된 후 최종 매칭 전 환불 요청 시",
        "When a refund is requested after the company interview but before the final matching",
        "在企业面试进行后、最终匹配前申请退款时",
        "Khi yêu cầu hoàn tiền sau khi tiến hành phỏng vấn với doanh nghiệp và trước khi kết nối cuối cùng",
        "企業面接が行われた後、最終マッチング前に返金を要求した場合",
        "Saat pengembalian diminta setelah wawancara perusahaan tetapi sebelum pencocokan akhir"
      )
    },
    {
      no: "3",
      title: t(
        "최종 매칭 후",
        "After Final Matching",
        "最终匹配后",
        "Sau khi kết nối cuối cùng",
        "最終マッチング後",
        "Setelah Pencocokan Akhir"
      ),
      amount: t(
        "환불 불가",
        "No refund",
        "不可退款",
        "Không thể hoàn tiền",
        "返金不可",
        "Tidak dapat dikembalikan"
      ),
      description: t(
        "기업과의 최종 매칭이 완료된 이후에는 환불이 불가합니다",
        "No refund is available after the final matching with the company is completed",
        "与企业的最终匹配完成后不可退款",
        "Không thể hoàn tiền sau khi hoàn tất việc kết nối cuối cùng với doanh nghiệp",
        "企業との最終マッチングが完了した後は返金できません",
        "Tidak ada pengembalian setelah pencocokan akhir dengan perusahaan selesai"
      )
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-foreground">
          {t(
            "이용약관",
            "Terms of Service",
            "服务条款",
            "Điều khoản sử dụng",
            "利用規約",
            "Ketentuan Layanan"
          )}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "시행일: 2026년 1월 1일",
            "Effective date: January 1, 2026",
            "生效日期：2026年1月1日",
            "Ngày hiệu lực: 1 tháng 1 năm 2026",
            "施行日：2026年1月1日",
            "Tanggal berlaku: 1 Januari 2026"
          )}
        </p>

        <section className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <div>
            <h2 className="text-lg font-semibold">
              {t("제1조 (목적)", "Article 1 (Purpose)", "第1条（目的）", "Điều 1 (Mục đích)", "第1条（目的）", "Pasal 1 (Tujuan)")}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "본 약관은 주식회사 플리퍼스(이하 \"회사\")가 제공하는 Aply 실무 체험 매칭 서비스(이하 \"서비스\")의 이용조건 및 절차, 회사와 이용자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.",
                "The purpose of these Terms is to stipulate the conditions and procedures for using the Aply job experience matching service (hereinafter the \"Service\") provided by Flippers Inc. (hereinafter the \"Company\"), the rights, obligations, and responsibilities of the Company and users, and other necessary matters.",
                "本条款旨在规定株式会社Flippers（以下称\"公司\"）提供的Aply实务体验匹配服务（以下称\"服务\"）的使用条件及程序、公司与用户的权利、义务、责任事项及其他必要事项。",
                "Điều khoản này nhằm mục đích quy định các điều kiện và thủ tục sử dụng dịch vụ kết nối trải nghiệm thực tế Aply (sau đây gọi là \"Dịch vụ\") do Flippers Inc. (sau đây gọi là \"Công ty\") cung cấp, quyền, nghĩa vụ, trách nhiệm của Công ty và người dùng cùng các vấn đề cần thiết khác.",
                "本規約は、株式会社Flippers（以下「当社」）が提供するAply実務体験マッチングサービス（以下「サービス」）の利用条件及び手続き、当社と利用者の権利、義務、責任事項その他必要な事項を定めることを目的とします。",
                "Ketentuan ini bertujuan untuk mengatur syarat dan prosedur penggunaan layanan pencocokan pengalaman kerja Aply (selanjutnya disebut \"Layanan\") yang disediakan oleh Flippers Inc. (selanjutnya disebut \"Perusahaan\"), hak, kewajiban, tanggung jawab Perusahaan dan pengguna, serta hal-hal lain yang diperlukan."
              )}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제2조 (용어의 정의)",
                "Article 2 (Definition of Terms)",
                "第2条（用语的定义）",
                "Điều 2 (Định nghĩa thuật ngữ)",
                "第2条（用語の定義）",
                "Pasal 2 (Definisi Istilah)"
              )}
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "\"서비스\"란 회사가 제공하는 실무 체험 매칭, 교육, 멘토링 등 일체의 서비스를 의미합니다.",
                  "\"Service\" means all services provided by the Company, including job experience matching, education, and mentoring.",
                  "\"服务\"是指公司提供的实务体验匹配、教育、辅导等一切服务。",
                  "\"Dịch vụ\" nghĩa là toàn bộ các dịch vụ do Công ty cung cấp như kết nối trải nghiệm thực tế, đào tạo, cố vấn, v.v.",
                  "「サービス」とは、当社が提供する実務体験マッチング、教育、メンタリングなど一切のサービスを意味します。",
                  "\"Layanan\" berarti seluruh layanan yang disediakan oleh Perusahaan, termasuk pencocokan pengalaman kerja, pendidikan, dan pembimbingan."
                )}
              </li>
              <li>
                {t(
                  "\"이용자\"란 본 약관에 따라 회사가 제공하는 서비스를 받는 회원을 의미합니다.",
                  "\"User\" means a member who receives the services provided by the Company in accordance with these Terms.",
                  "\"用户\"是指依据本条款接受公司提供的服务的会员。",
                  "\"Người dùng\" nghĩa là thành viên nhận dịch vụ do Công ty cung cấp theo Điều khoản này.",
                  "「利用者」とは、本規約に従い当社が提供するサービスを受ける会員を意味します。",
                  "\"Pengguna\" berarti anggota yang menerima layanan yang disediakan oleh Perusahaan sesuai dengan Ketentuan ini."
                )}
              </li>
              <li>
                {t(
                  "\"참여비\"란 서비스 이용을 위해 이용자가 회사에 지불하는 금액을 의미합니다.",
                  "\"Participation fee\" means the amount paid by the user to the Company for using the Service.",
                  "\"参与费\"是指用户为使用服务而向公司支付的金额。",
                  "\"Phí tham gia\" nghĩa là số tiền người dùng thanh toán cho Công ty để sử dụng Dịch vụ.",
                  "「参加費」とは、サービス利用のために利用者が当社に支払う金額を意味します。",
                  "\"Biaya partisipasi\" berarti jumlah yang dibayarkan pengguna kepada Perusahaan untuk menggunakan Layanan."
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제3조 (서비스 내용)",
                "Article 3 (Service Content)",
                "第3条（服务内容）",
                "Điều 3 (Nội dung dịch vụ)",
                "第3条（サービス内容）",
                "Pasal 3 (Isi Layanan)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "회사는 다음과 같은 서비스를 제공합니다:",
                "The Company provides the following services:",
                "公司提供如下服务：",
                "Công ty cung cấp các dịch vụ sau:",
                "当社は、次のようなサービスを提供します：",
                "Perusahaan menyediakan layanan berikut:"
              )}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "6주~16주 기업 실무 체험 매칭",
                  "6- to 16-week corporate job experience matching",
                  "6周至16周企业实务体验匹配",
                  "Kết nối trải nghiệm thực tế tại doanh nghiệp từ 6 đến 16 tuần",
                  "6週間～16週間の企業実務体験マッチング",
                  "Pencocokan pengalaman kerja perusahaan selama 6 hingga 16 minggu"
                )}
              </li>
              <li>
                {t(
                  "1:1 전담 멘토 배정 및 멘토링",
                  "Assignment of a dedicated 1:1 mentor and mentoring",
                  "1:1专属导师分配及辅导",
                  "Phân công cố vấn chuyên trách 1:1 và cố vấn",
                  "1:1専任メンターの割り当て及びメンタリング",
                  "Penugasan mentor khusus 1:1 dan pembimbingan"
                )}
              </li>
              <li>
                {t(
                  "이력서 및 면접 코칭",
                  "Resume and interview coaching",
                  "简历及面试辅导",
                  "Tư vấn sơ yếu lý lịch và phỏng vấn",
                  "履歴書及び面接コーチング",
                  "Bimbingan resume dan wawancara"
                )}
              </li>
              <li>
                {t(
                  "비즈니스 한국어 교육",
                  "Business Korean language education",
                  "商务韩语教育",
                  "Đào tạo tiếng Hàn thương mại",
                  "ビジネス韓国語教育",
                  "Pendidikan bahasa Korea bisnis"
                )}
              </li>
              <li>
                {t(
                  "실무 체험 수료증 발급",
                  "Issuance of a job experience certificate of completion",
                  "颁发实务体验结业证书",
                  "Cấp giấy chứng nhận hoàn thành trải nghiệm thực tế",
                  "実務体験修了証の発給",
                  "Penerbitan sertifikat penyelesaian pengalaman kerja"
                )}
              </li>
              <li>
                {t(
                  "커리어 네트워킹 지원",
                  "Career networking support",
                  "职业发展人脉支持",
                  "Hỗ trợ kết nối sự nghiệp",
                  "キャリアネットワーキング支援",
                  "Dukungan jaringan karier"
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제4조 (환불 정책)",
                "Article 4 (Refund Policy)",
                "第4条（退款政策）",
                "Điều 4 (Chính sách hoàn tiền)",
                "第4条（返金ポリシー）",
                "Pasal 4 (Kebijakan Pengembalian)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "이용자가 서비스 이용을 중단하고자 할 경우, 다음 기준에 따라 참여비를 환불합니다:",
                "If a user wishes to discontinue use of the Service, the participation fee will be refunded according to the following criteria:",
                "用户欲中止使用服务时，将按照以下标准退还参与费：",
                "Trong trường hợp người dùng muốn ngừng sử dụng Dịch vụ, phí tham gia sẽ được hoàn lại theo các tiêu chí sau:",
                "利用者がサービスの利用を中止しようとする場合、次の基準に従って参加費を返金します：",
                "Jika pengguna ingin menghentikan penggunaan Layanan, biaya partisipasi akan dikembalikan sesuai dengan kriteria berikut:"
              )}
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
              {t(
                "※ 환불 요청은 이메일(",
                "※ Please submit refund requests by email (",
                "※ 退款申请请通过电子邮件（",
                "※ Vui lòng gửi yêu cầu hoàn tiền qua email (",
                "※ 返金のご請求はメール（",
                "※ Silakan ajukan permintaan pengembalian melalui email ("
              )}
              <a href="mailto:info@flip-ers.com" className="text-primary underline">
                info@flip-ers.com
              </a>
              {t(
                ")로 접수해 주시기 바랍니다. 환불 처리는 요청일로부터 영업일 기준 7일 이내에 진행됩니다.",
                "). Refunds will be processed within 7 business days from the date of request.",
                "）提交。退款处理将于申请日起7个工作日内进行。",
                "). Việc hoàn tiền sẽ được xử lý trong vòng 7 ngày làm việc kể từ ngày yêu cầu.",
                "）にてお申し込みください。返金処理は請求日から営業日基準で7日以内に行われます。",
                "). Pengembalian akan diproses dalam waktu 7 hari kerja sejak tanggal permintaan."
              )}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제5조 (이용자의 의무)",
                "Article 5 (Obligations of Users)",
                "第5条（用户的义务）",
                "Điều 5 (Nghĩa vụ của người dùng)",
                "第5条（利用者の義務）",
                "Pasal 5 (Kewajiban Pengguna)"
              )}
            </h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "이용자는 서비스 신청 시 정확한 정보를 제공해야 합니다.",
                  "Users must provide accurate information when applying for the Service.",
                  "用户申请服务时须提供准确的信息。",
                  "Người dùng phải cung cấp thông tin chính xác khi đăng ký Dịch vụ.",
                  "利用者は、サービス申請時に正確な情報を提供しなければなりません。",
                  "Pengguna harus memberikan informasi yang akurat saat mendaftar Layanan."
                )}
              </li>
              <li>
                {t(
                  "이용자는 실무 체험 기간 중 회사가 정한 규정을 준수해야 합니다.",
                  "Users must comply with the rules set by the Company during the job experience period.",
                  "用户在实务体验期间须遵守公司制定的规定。",
                  "Người dùng phải tuân thủ các quy định do Công ty đặt ra trong thời gian trải nghiệm thực tế.",
                  "利用者は、実務体験期間中、当社が定めた規定を遵守しなければなりません。",
                  "Pengguna harus mematuhi peraturan yang ditetapkan Perusahaan selama periode pengalaman kerja."
                )}
              </li>
              <li>
                {t(
                  "이용자는 실무 체험 기업의 기밀정보를 외부에 유출해서는 안 됩니다.",
                  "Users must not leak confidential information of the job experience company to outside parties.",
                  "用户不得向外部泄露实务体验企业的机密信息。",
                  "Người dùng không được tiết lộ thông tin mật của doanh nghiệp trải nghiệm thực tế ra bên ngoài.",
                  "利用者は、実務体験企業の機密情報を外部に漏洩してはなりません。",
                  "Pengguna tidak boleh membocorkan informasi rahasia perusahaan pengalaman kerja kepada pihak luar."
                )}
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제6조 (회사의 의무)",
                "Article 6 (Obligations of the Company)",
                "第6条（公司的义务）",
                "Điều 6 (Nghĩa vụ của Công ty)",
                "第6条（当社の義務）",
                "Pasal 6 (Kewajiban Perusahaan)"
              )}
            </h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "회사는 이용자에게 안정적인 서비스를 제공하기 위해 최선을 다합니다.",
                  "The Company does its utmost to provide users with stable services.",
                  "公司竭尽全力为用户提供稳定的服务。",
                  "Công ty nỗ lực hết mình để cung cấp dịch vụ ổn định cho người dùng.",
                  "当社は、利用者に安定的なサービスを提供するため最善を尽くします。",
                  "Perusahaan berupaya semaksimal mungkin untuk menyediakan layanan yang stabil bagi pengguna."
                )}
              </li>
              <li>
                {t(
                  "회사는 이용자의 개인정보를 관련 법령에 따라 안전하게 관리합니다.",
                  "The Company securely manages users' personal information in accordance with relevant laws.",
                  "公司依据相关法律法规安全管理用户的个人信息。",
                  "Công ty quản lý an toàn thông tin cá nhân của người dùng theo pháp luật liên quan.",
                  "当社は、利用者の個人情報を関連法令に従い安全に管理します。",
                  "Perusahaan mengelola informasi pribadi pengguna dengan aman sesuai dengan undang-undang terkait."
                )}
              </li>
              <li>
                {t(
                  "회사는 이용자의 문의사항에 성실히 응대합니다.",
                  "The Company responds sincerely to users' inquiries.",
                  "公司诚实应对用户的咨询事项。",
                  "Công ty phản hồi một cách chân thành đối với các thắc mắc của người dùng.",
                  "当社は、利用者のお問い合わせに誠実に対応します。",
                  "Perusahaan menanggapi pertanyaan pengguna dengan tulus."
                )}
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제7조 (면책조항)",
                "Article 7 (Disclaimer)",
                "第7条（免责条款）",
                "Điều 7 (Điều khoản miễn trừ trách nhiệm)",
                "第7条（免責条項）",
                "Pasal 7 (Penafian)"
              )}
            </h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "회사는 천재지변, 전쟁, 기타 불가항력으로 인해 서비스를 제공할 수 없는 경우 책임을 지지 않습니다.",
                  "The Company shall not be liable if it is unable to provide the Service due to natural disasters, war, or other force majeure.",
                  "因自然灾害、战争及其他不可抗力导致无法提供服务时，公司不承担责任。",
                  "Công ty không chịu trách nhiệm trong trường hợp không thể cung cấp Dịch vụ do thiên tai, chiến tranh hoặc các trường hợp bất khả kháng khác.",
                  "当社は、天災地変、戦争その他の不可抗力によりサービスを提供できない場合、責任を負いません。",
                  "Perusahaan tidak bertanggung jawab apabila tidak dapat menyediakan Layanan karena bencana alam, perang, atau force majeure lainnya."
                )}
              </li>
              <li>
                {t(
                  "회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.",
                  "The Company shall not be liable for service disruptions caused by reasons attributable to the user.",
                  "公司不对因用户自身原因导致的服务使用障碍承担责任。",
                  "Công ty không chịu trách nhiệm về sự cố sử dụng dịch vụ do lỗi thuộc về người dùng.",
                  "当社は、利用者の帰責事由によるサービス利用の障害について責任を負いません。",
                  "Perusahaan tidak bertanggung jawab atas gangguan penggunaan layanan yang disebabkan oleh alasan yang dapat diatribusikan kepada pengguna."
                )}
              </li>
              <li>
                {t(
                  "회사는 실무 체험 기업의 경영상황 변화로 인한 실무 체험 조기 종료에 대해 책임을 지지 않습니다.",
                  "The Company shall not be liable for the early termination of the job experience due to changes in the management situation of the job experience company.",
                  "公司不对因实务体验企业经营状况变化导致的实务体验提前终止承担责任。",
                  "Công ty không chịu trách nhiệm về việc kết thúc sớm trải nghiệm thực tế do thay đổi tình hình kinh doanh của doanh nghiệp trải nghiệm thực tế.",
                  "当社は、実務体験企業の経営状況の変化による実務体験の早期終了について責任を負いません。",
                  "Perusahaan tidak bertanggung jawab atas penghentian dini pengalaman kerja akibat perubahan situasi manajemen perusahaan pengalaman kerja."
                )}
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제8조 (분쟁해결)",
                "Article 8 (Dispute Resolution)",
                "第8条（纠纷解决）",
                "Điều 8 (Giải quyết tranh chấp)",
                "第8条（紛争解決）",
                "Pasal 8 (Penyelesaian Sengketa)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "본 약관과 관련하여 분쟁이 발생한 경우, 회사와 이용자는 상호 협의하여 해결하도록 노력합니다. 협의가 이루어지지 않을 경우, 관할 법원은 서울중앙지방법원으로 합니다.",
                "In the event of a dispute arising in connection with these Terms, the Company and the user shall endeavor to resolve it through mutual consultation. If no agreement is reached, the competent court shall be the Seoul Central District Court.",
                "就本条款发生纠纷时，公司与用户努力通过相互协商解决。协商未能达成一致时，管辖法院为首尔中央地方法院。",
                "Trong trường hợp phát sinh tranh chấp liên quan đến Điều khoản này, Công ty và người dùng nỗ lực giải quyết thông qua thỏa thuận chung. Nếu không đạt được thỏa thuận, tòa án có thẩm quyền là Tòa án Quận Trung tâm Seoul.",
                "本規約に関連して紛争が生じた場合、当社と利用者は相互協議により解決するよう努めます。協議が調わない場合、管轄裁判所はソウル中央地方裁判所とします。",
                "Apabila timbul sengketa sehubungan dengan Ketentuan ini, Perusahaan dan pengguna berupaya menyelesaikannya melalui musyawarah bersama. Jika tidak tercapai kesepakatan, pengadilan yang berwenang adalah Pengadilan Distrik Pusat Seoul."
              )}
            </p>
          </div>

          <div className="border-t border-border/60 pt-6">
            <h2 className="text-lg font-semibold">
              {t(
                "부칙",
                "Addendum",
                "附则",
                "Điều khoản bổ sung",
                "附則",
                "Ketentuan Tambahan"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "본 약관은 2026년 1월 1일부터 시행합니다.",
                "These Terms take effect on January 1, 2026.",
                "本条款自2026年1月1日起施行。",
                "Điều khoản này có hiệu lực từ ngày 1 tháng 1 năm 2026.",
                "本規約は2026年1月1日から施行します。",
                "Ketentuan ini berlaku mulai 1 Januari 2026."
              )}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
