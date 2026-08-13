"use client";

import { Header } from "../../../components/site/Header";
import { Footer } from "../../../components/site/Footer";
import { usePlatformT } from "../../../lib/i18n";

export function PrivacyPolicyContent() {
  const t = usePlatformT();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-foreground">
          {t(
            "개인정보 처리방침",
            "Privacy Policy",
            "隐私政策",
            "Chính sách bảo mật",
            "プライバシーポリシー",
            "Kebijakan Privasi"
          )}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t(
            "공고일자: 2025년 11월 12일 · 시행일자: 2025년 11월 12일",
            "Published: November 12, 2025 · Effective: November 12, 2025",
            "公布日期：2025年11月12日 · 生效日期：2025年11月12日",
            "Ngày công bố: 12 tháng 11 năm 2025 · Ngày hiệu lực: 12 tháng 11 năm 2025",
            "公示日：2025年11月12日 · 施行日：2025年11月12日",
            "Tanggal pengumuman: 12 November 2025 · Tanggal berlaku: 12 November 2025"
          )}
        </p>

        <section className="mt-8 space-y-8 text-sm leading-relaxed text-foreground">
          <p className="text-muted-foreground">
            {t(
              "주식회사 플리퍼스(이하 \"회사\")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령상의 개인정보보호 규정을 준수하며, 이용자의 개인정보 보호에 최선을 다하고 있습니다.",
              "Flippers Inc. (hereinafter the \"Company\") complies with the personal information protection regulations under relevant laws such as the Act on Promotion of Information and Communications Network Utilization and Information Protection and the Personal Information Protection Act, and does its utmost to protect users' personal information.",
              "株式会社Flippers（以下称\"公司\"）遵守《促进信息通信网络利用及信息保护等的法律》《个人信息保护法》等相关法律法规中的个人信息保护规定，并竭尽全力保护用户的个人信息。",
              "Flippers Inc. (sau đây gọi là \"Công ty\") tuân thủ các quy định về bảo vệ thông tin cá nhân theo các luật liên quan như Đạo luật Xúc tiến Sử dụng Mạng Thông tin và Truyền thông và Bảo vệ Thông tin, Đạo luật Bảo vệ Thông tin Cá nhân, và nỗ lực hết mình để bảo vệ thông tin cá nhân của người dùng.",
              "株式会社Flippers（以下「当社」）は、情報通信網利用促進及び情報保護等に関する法律、個人情報保護法など関連法令上の個人情報保護規定を遵守し、利用者の個人情報保護に最善を尽くしています。",
              "Flippers Inc. (selanjutnya disebut \"Perusahaan\") mematuhi ketentuan perlindungan informasi pribadi berdasarkan undang-undang terkait seperti Undang-Undang tentang Promosi Pemanfaatan Jaringan Informasi dan Komunikasi serta Perlindungan Informasi dan Undang-Undang Perlindungan Informasi Pribadi, dan berupaya semaksimal mungkin untuk melindungi informasi pribadi pengguna."
            )}
          </p>
          <p className="text-muted-foreground">
            {t(
              "본 개인정보 처리방침은 회사가 제공하는 서비스(웹사이트 및 웹 애플리케이션)에 적용됩니다.",
              "This Privacy Policy applies to the services (website and web application) provided by the Company.",
              "本隐私政策适用于公司提供的服务（网站及网络应用程序）。",
              "Chính sách bảo mật này áp dụng cho các dịch vụ (trang web và ứng dụng web) do Công ty cung cấp.",
              "本プライバシーポリシーは、当社が提供するサービス（ウェブサイト及びウェブアプリケーション）に適用されます。",
              "Kebijakan Privasi ini berlaku untuk layanan (situs web dan aplikasi web) yang disediakan oleh Perusahaan."
            )}
          </p>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제1조 (수집하는 개인정보 항목 및 수집 방법)",
                "Article 1 (Personal Information Collected and Collection Methods)",
                "第1条（收集的个人信息项目及收集方法）",
                "Điều 1 (Các mục thông tin cá nhân thu thập và phương thức thu thập)",
                "第1条（収集する個人情報の項目及び収集方法）",
                "Pasal 1 (Item Informasi Pribadi yang Dikumpulkan dan Metode Pengumpulan)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "회사는 회원가입, 프로그램 신청, 기업 파트너십 문의 등을 위해 아래와 같은 개인정보를 수집합니다.",
                "The Company collects the following personal information for membership registration, program applications, corporate partnership inquiries, and the like.",
                "公司为会员注册、项目申请、企业合作咨询等收集如下个人信息。",
                "Công ty thu thập các thông tin cá nhân sau đây cho việc đăng ký thành viên, đăng ký chương trình, yêu cầu hợp tác doanh nghiệp, v.v.",
                "当社は、会員登録、プログラム申請、企業パートナーシップのお問い合わせなどのため、以下のような個人情報を収集します。",
                "Perusahaan mengumpulkan informasi pribadi berikut untuk pendaftaran anggota, pendaftaran program, pertanyaan kemitraan perusahaan, dan sebagainya."
              )}
            </p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(
                "1. 학생 회원 (B2C)",
                "1. Student Members (B2C)",
                "1. 学生会员（B2C）",
                "1. Thành viên sinh viên (B2C)",
                "1. 学生会員（B2C）",
                "1. Anggota Pelajar (B2C)"
              )}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">
                  {t("필수 항목", "Required Items", "必填项目", "Mục bắt buộc", "必須項目", "Item Wajib")}
                </strong>
                {t(
                  ": 성명(여권상 영문 이름), 이메일 주소, 비밀번호, 연락처, 현재 거주 주소, 생년월일(만 20세 이상 확인용)",
                  ": Full name (English name as on passport), email address, password, contact number, current residential address, date of birth (for verifying age 20 or older)",
                  "：姓名（护照上的英文姓名）、电子邮箱地址、密码、联系方式、当前居住地址、出生年月日（用于确认年满20周岁）",
                  ": Họ tên (tên tiếng Anh theo hộ chiếu), địa chỉ email, mật khẩu, số liên lạc, địa chỉ cư trú hiện tại, ngày sinh (để xác minh từ 20 tuổi trở lên)",
                  "：氏名（パスポート上の英文氏名）、メールアドレス、パスワード、連絡先、現在の居住住所、生年月日（満20歳以上確認用）",
                  ": Nama lengkap (nama dalam bahasa Inggris sesuai paspor), alamat email, kata sandi, nomor kontak, alamat tempat tinggal saat ini, tanggal lahir (untuk verifikasi usia 20 tahun ke atas)"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t(
                    "프로그램 신청 시",
                    "When Applying for a Program",
                    "申请项目时",
                    "Khi đăng ký chương trình",
                    "プログラム申請時",
                    "Saat Mendaftar Program"
                  )}
                </strong>
                {t(
                  ": 최종 학력, 현재 비자 상태, 한국어 능력(TOPIK) 수준, 여권 사본, 이력서/커버레터/포트폴리오, 직무 관련 스킬",
                  ": Highest level of education, current visa status, Korean language proficiency (TOPIK) level, copy of passport, resume/cover letter/portfolio, job-related skills",
                  "：最终学历、当前签证状态、韩语能力（TOPIK）水平、护照复印件、简历/求职信/作品集、职务相关技能",
                  ": Trình độ học vấn cao nhất, tình trạng thị thực hiện tại, trình độ tiếng Hàn (TOPIK), bản sao hộ chiếu, sơ yếu lý lịch/thư xin việc/hồ sơ năng lực, kỹ năng liên quan đến công việc",
                  "：最終学歴、現在のビザ状況、韓国語能力（TOPIK）レベル、パスポートの写し、履歴書/カバーレター/ポートフォリオ、職務関連スキル",
                  ": Pendidikan terakhir, status visa saat ini, tingkat kemampuan bahasa Korea (TOPIK), salinan paspor, resume/surat lamaran/portofolio, keterampilan terkait pekerjaan"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("선택 항목", "Optional Items", "选填项目", "Mục tùy chọn", "任意項目", "Item Opsional")}
                </strong>
                {t(
                  ": 한국 체류 및 취업 계획",
                  ": Plans for staying and working in Korea",
                  "：在韩停留及就业计划",
                  ": Kế hoạch lưu trú và làm việc tại Hàn Quốc",
                  "：韓国滞在及び就業計画",
                  ": Rencana tinggal dan bekerja di Korea"
                )}
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(
                "2. 기업 회원 (B2B)",
                "2. Corporate Members (B2B)",
                "2. 企业会员（B2B）",
                "2. Thành viên doanh nghiệp (B2B)",
                "2. 企業会員（B2B）",
                "2. Anggota Perusahaan (B2B)"
              )}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">
                  {t("필수 항목", "Required Items", "必填项目", "Mục bắt buộc", "必須項目", "Item Wajib")}
                </strong>
                {t(
                  ": 회사명, 사업자등록번호, 담당자명, 담당자 이메일 주소, 담당자 연락처",
                  ": Company name, business registration number, contact person's name, contact person's email address, contact person's phone number",
                  "：公司名称、营业执照号码、负责人姓名、负责人电子邮箱地址、负责人联系方式",
                  ": Tên công ty, số đăng ký kinh doanh, tên người phụ trách, địa chỉ email người phụ trách, số liên lạc người phụ trách",
                  "：会社名、事業者登録番号、担当者名、担当者メールアドレス、担当者連絡先",
                  ": Nama perusahaan, nomor registrasi bisnis, nama penanggung jawab, alamat email penanggung jawab, nomor kontak penanggung jawab"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t(
                    "프로그램 운영 시",
                    "During Program Operation",
                    "项目运营时",
                    "Khi vận hành chương trình",
                    "プログラム運営時",
                    "Saat Operasi Program"
                  )}
                </strong>
                {t(
                  ": 채용 희망 직무(JD)",
                  ": Desired job positions for recruitment (JD)",
                  "：希望招聘的职务（JD）",
                  ": Vị trí công việc mong muốn tuyển dụng (JD)",
                  "：採用希望職務（JD）",
                  ": Posisi pekerjaan yang ingin direkrut (JD)"
                )}
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(
                "3. 서비스 이용 과정에서 자동 수집되는 정보",
                "3. Information Automatically Collected During Service Use",
                "3. 服务使用过程中自动收集的信息",
                "3. Thông tin được tự động thu thập trong quá trình sử dụng dịch vụ",
                "3. サービス利用過程で自動的に収集される情報",
                "3. Informasi yang Dikumpulkan Secara Otomatis Selama Penggunaan Layanan"
              )}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "IP 주소, 쿠키, 서비스 이용 기록, 기기 정보",
                  "IP address, cookies, service usage records, device information",
                  "IP地址、Cookie、服务使用记录、设备信息",
                  "Địa chỉ IP, cookie, hồ sơ sử dụng dịch vụ, thông tin thiết bị",
                  "IPアドレス、クッキー、サービス利用記録、機器情報",
                  "Alamat IP, cookie, catatan penggunaan layanan, informasi perangkat"
                )}
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(
                "4. 수집 방법",
                "4. Collection Methods",
                "4. 收集方法",
                "4. Phương thức thu thập",
                "4. 収集方法",
                "4. Metode Pengumpulan"
              )}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "홈페이지 및 웹 애플리케이션 회원가입, 프로그램 신청서 작성",
                  "Membership registration and program application forms on the website and web application",
                  "网站及网络应用程序会员注册、填写项目申请表",
                  "Đăng ký thành viên trên trang web và ứng dụng web, điền đơn đăng ký chương trình",
                  "ホームページ及びウェブアプリケーションの会員登録、プログラム申請書の作成",
                  "Pendaftaran anggota di situs web dan aplikasi web, pengisian formulir pendaftaran program"
                )}
              </li>
              <li>
                {t(
                  "기업 파트너십 신청서 작성",
                  "Completion of corporate partnership application forms",
                  "填写企业合作申请表",
                  "Điền đơn đăng ký hợp tác doanh nghiệp",
                  "企業パートナーシップ申請書の作成",
                  "Pengisian formulir pendaftaran kemitraan perusahaan"
                )}
              </li>
              <li>
                {t(
                  "고객센터 문의 (이메일, 전화)",
                  "Customer center inquiries (email, phone)",
                  "客服中心咨询（电子邮件、电话）",
                  "Liên hệ trung tâm khách hàng (email, điện thoại)",
                  "カスタマーセンターへのお問い合わせ（メール、電話）",
                  "Pertanyaan ke pusat layanan pelanggan (email, telepon)"
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제2조 (개인정보의 수집 및 이용 목적)",
                "Article 2 (Purpose of Collecting and Using Personal Information)",
                "第2条（个人信息的收集及使用目的）",
                "Điều 2 (Mục đích thu thập và sử dụng thông tin cá nhân)",
                "第2条（個人情報の収集及び利用目的）",
                "Pasal 2 (Tujuan Pengumpulan dan Penggunaan Informasi Pribadi)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.",
                "The Company uses the collected personal information for the following purposes.",
                "公司将收集的个人信息用于以下目的。",
                "Công ty sử dụng thông tin cá nhân đã thu thập cho các mục đích sau.",
                "当社は、収集した個人情報を以下の目的のために活用します。",
                "Perusahaan menggunakan informasi pribadi yang dikumpulkan untuk tujuan berikut."
              )}
            </p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(
                "1. 학생 회원 (B2C)",
                "1. Student Members (B2C)",
                "1. 学生会员（B2C）",
                "1. Thành viên sinh viên (B2C)",
                "1. 学生会員（B2C）",
                "1. Anggota Pelajar (B2C)"
              )}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">
                  {t("회원 관리", "Member Management", "会员管理", "Quản lý thành viên", "会員管理", "Manajemen Anggota")}
                </strong>
                {t(
                  ": 본인 식별, 가입 의사 확인, 불량 회원 방지",
                  ": Identity verification, confirmation of intent to register, prevention of misuse by members",
                  "：本人身份识别、确认注册意愿、防止不良会员",
                  ": Xác minh danh tính, xác nhận ý định đăng ký, ngăn chặn thành viên xấu",
                  "：本人識別、加入意思の確認、不良会員の防止",
                  ": Identifikasi diri, konfirmasi niat pendaftaran, pencegahan anggota bermasalah"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("프로그램 운영", "Program Operation", "项目运营", "Vận hành chương trình", "プログラム運営", "Operasi Program")}
                </strong>
                {t(
                  ": 'Aply' 등 신청 프로그램의 선발 절차 진행, 1:1 면접 진행",
                  ": Conducting the selection process for applied programs such as 'Aply' and conducting 1:1 interviews",
                  "：进行'Aply'等所申请项目的选拔流程、进行1:1面试",
                  ": Tiến hành quy trình tuyển chọn cho các chương trình đã đăng ký như 'Aply' và tiến hành phỏng vấn 1:1",
                  "：'Aply'など申請プログラムの選考手続きの実施、1:1面接の実施",
                  ": Melaksanakan proses seleksi untuk program yang didaftarkan seperti 'Aply' dan melakukan wawancara 1:1"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("매칭 서비스", "Matching Service", "匹配服务", "Dịch vụ kết nối", "マッチングサービス", "Layanan Pencocokan")}
                </strong>
                {t(
                  ": 수집된 정보(이력서, 프로필 등)를 바탕으로 호스트 기업과 매칭",
                  ": Matching with host companies based on collected information (resume, profile, etc.)",
                  "：以收集的信息（简历、个人资料等）为基础与主办企业匹配",
                  ": Kết nối với các công ty tiếp nhận dựa trên thông tin đã thu thập (sơ yếu lý lịch, hồ sơ, v.v.)",
                  "：収集した情報（履歴書、プロフィールなど）に基づくホスト企業とのマッチング",
                  ": Mencocokkan dengan perusahaan tuan rumah berdasarkan informasi yang dikumpulkan (resume, profil, dll.)"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("프로세스 관리", "Process Management", "流程管理", "Quản lý quy trình", "プロセス管理", "Manajemen Proses")}
                </strong>
                {t(
                  ": 지원 현황, 면접 일정, 합격 여부 등 대시보드 관리",
                  ": Dashboard management including application status, interview schedules, and acceptance results",
                  "：申请现况、面试日程、是否合格等仪表板管理",
                  ": Quản lý bảng điều khiển bao gồm tình trạng ứng tuyển, lịch phỏng vấn, kết quả đỗ trượt",
                  "：応募状況、面接日程、合否など、ダッシュボードの管理",
                  ": Manajemen dasbor termasuk status lamaran, jadwal wawancara, hasil kelulusan"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("결제 및 계약", "Payment and Contracts", "结算及合同", "Thanh toán và hợp đồng", "決済及び契約", "Pembayaran dan Kontrak")}
                </strong>
                {t(
                  ": 프로그램 비용 결제, 인보이스 발행, 계약서 작성",
                  ": Program fee payment, invoice issuance, and contract preparation",
                  "：项目费用结算、开具发票、编制合同",
                  ": Thanh toán chi phí chương trình, phát hành hóa đơn, lập hợp đồng",
                  "：プログラム費用の決済、インボイスの発行、契約書の作成",
                  ": Pembayaran biaya program, penerbitan faktur, pembuatan kontrak"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("지원 서비스", "Support Services", "支持服务", "Dịch vụ hỗ trợ", "サポートサービス", "Layanan Dukungan")}
                </strong>
                {t(
                  ": 사전 교육 오리엔테이션, 비자 발급 지원, 수료증 및 추천서 발급",
                  ": Pre-training orientation, visa issuance support, and issuance of certificates of completion and letters of recommendation",
                  "：事前培训说明会、签证发放支持、颁发结业证书及推荐信",
                  ": Định hướng đào tạo trước, hỗ trợ cấp thị thực, cấp giấy chứng nhận hoàn thành và thư giới thiệu",
                  "：事前教育オリエンテーション、ビザ発給支援、修了証及び推薦状の発給",
                  ": Orientasi pelatihan awal, dukungan penerbitan visa, penerbitan sertifikat penyelesaian dan surat rekomendasi"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("고지 사항 전달", "Delivery of Notices", "通知事项传达", "Truyền đạt thông báo", "告知事項の伝達", "Penyampaian Pemberitahuan")}
                </strong>
                {t(
                  ": 공지사항, 약관 변경 등 중요 정보 전달",
                  ": Delivery of important information such as announcements and changes to terms",
                  "：公告事项、条款变更等重要信息传达",
                  ": Truyền đạt thông tin quan trọng như thông báo, thay đổi điều khoản",
                  "：お知らせ、規約変更など重要情報の伝達",
                  ": Penyampaian informasi penting seperti pengumuman, perubahan ketentuan"
                )}
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(
                "2. 기업 회원 (B2B)",
                "2. Corporate Members (B2B)",
                "2. 企业会员（B2B）",
                "2. Thành viên doanh nghiệp (B2B)",
                "2. 企業会員（B2B）",
                "2. Anggota Perusahaan (B2B)"
              )}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">
                  {t("파트너십 관리", "Partnership Management", "合作关系管理", "Quản lý hợp tác", "パートナーシップ管理", "Manajemen Kemitraan")}
                </strong>
                {t(
                  ": 호스트 기업 본인 식별, 파트너십 승인 및 관리",
                  ": Identity verification of host companies, partnership approval and management",
                  "：主办企业本人身份识别、合作关系审批及管理",
                  ": Xác minh danh tính công ty tiếp nhận, phê duyệt và quản lý hợp tác",
                  "：ホスト企業の本人識別、パートナーシップの承認及び管理",
                  ": Identifikasi perusahaan tuan rumah, persetujuan dan manajemen kemitraan"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("매칭 서비스", "Matching Service", "匹配服务", "Dịch vụ kết nối", "マッチングサービス", "Layanan Pencocokan")}
                </strong>
                {t(
                  ": 등록된 직무(JD)와 학생 인재 풀 매칭",
                  ": Matching registered job positions (JD) with the student talent pool",
                  "：将已登记的职务（JD）与学生人才库匹配",
                  ": Kết nối vị trí công việc đã đăng ký (JD) với nguồn nhân lực sinh viên",
                  "：登録された職務（JD）と学生人材プールのマッチング",
                  ": Mencocokkan posisi pekerjaan terdaftar (JD) dengan kumpulan talenta pelajar"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("프로세스 관리", "Process Management", "流程管理", "Quản lý quy trình", "プロセス管理", "Manajemen Proses")}
                </strong>
                {t(
                  ": 학생 리스트 확인, 면접 일정 조율, 피드백 관리",
                  ": Reviewing student lists, coordinating interview schedules, and managing feedback",
                  "：确认学生名单、协调面试日程、反馈管理",
                  ": Kiểm tra danh sách sinh viên, điều phối lịch phỏng vấn, quản lý phản hồi",
                  "：学生リストの確認、面接日程の調整、フィードバックの管理",
                  ": Memeriksa daftar pelajar, mengoordinasikan jadwal wawancara, mengelola umpan balik"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("고지 사항 전달", "Delivery of Notices", "通知事项传达", "Truyền đạt thông báo", "告知事項の伝達", "Penyampaian Pemberitahuan")}
                </strong>
                {t(
                  ": 서비스 변경, 중요 공지사항 전달",
                  ": Delivery of service changes and important announcements",
                  "：服务变更、重要公告事项传达",
                  ": Truyền đạt thay đổi dịch vụ, thông báo quan trọng",
                  "：サービス変更、重要なお知らせの伝達",
                  ": Penyampaian perubahan layanan, pengumuman penting"
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제3조 (개인정보의 제3자 제공)",
                "Article 3 (Provision of Personal Information to Third Parties)",
                "第3条（个人信息的第三方提供）",
                "Điều 3 (Cung cấp thông tin cá nhân cho bên thứ ba)",
                "第3条（個人情報の第三者提供）",
                "Pasal 3 (Penyediaan Informasi Pribadi kepada Pihak Ketiga)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "회사는 이용자의 동의가 있거나 관련 법령의 규정에 의한 경우를 제외하고는 어떠한 경우에도 본 방침에서 고지한 범위를 넘어 이용자의 개인정보를 이용하거나 제3자에게 제공하지 않습니다.",
                "Except where the user has consented or where required by relevant laws, the Company shall in no case use users' personal information beyond the scope stated in this policy or provide it to third parties.",
                "除获得用户同意或依据相关法律法规规定的情形外，公司在任何情况下均不会超出本方针所告知的范围使用用户个人信息或向第三方提供。",
                "Ngoại trừ trường hợp có sự đồng ý của người dùng hoặc theo quy định của pháp luật liên quan, Công ty trong mọi trường hợp sẽ không sử dụng thông tin cá nhân của người dùng vượt quá phạm vi đã thông báo trong chính sách này hoặc cung cấp cho bên thứ ba.",
                "当社は、利用者の同意がある場合又は関連法令の規定による場合を除き、いかなる場合も本方針で告知した範囲を超えて利用者の個人情報を利用したり、第三者に提供したりしません。",
                "Kecuali dengan persetujuan pengguna atau berdasarkan ketentuan undang-undang terkait, Perusahaan dalam keadaan apa pun tidak akan menggunakan informasi pribadi pengguna melebihi cakupan yang diberitahukan dalam kebijakan ini atau menyediakannya kepada pihak ketiga."
              )}
            </p>
            <p className="mt-2 text-muted-foreground">
              {t(
                "단, 원활한 'Aply' 프로그램 매칭을 위해 아래의 경우에 한하여 이용자의 동의를 받고 개인정보를 제공합니다.",
                "However, for smooth 'Aply' program matching, the Company provides personal information only in the following cases with the user's consent.",
                "但为顺利进行'Aply'项目匹配，仅在以下情形下经用户同意后提供个人信息。",
                "Tuy nhiên, để việc kết nối chương trình 'Aply' được thuận lợi, chỉ trong các trường hợp dưới đây Công ty mới cung cấp thông tin cá nhân sau khi được người dùng đồng ý.",
                "ただし、円滑な'Aply'プログラムのマッチングのため、以下の場合に限り利用者の同意を得て個人情報を提供します。",
                "Namun, demi kelancaran pencocokan program 'Aply', hanya dalam kasus berikut Perusahaan menyediakan informasi pribadi setelah mendapat persetujuan pengguna."
              )}
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-border/60">
                    <th className="w-1/3 bg-muted/50 px-3 py-2 text-left font-medium text-foreground">
                      {t("제공받는 자", "Recipient", "接收方", "Bên tiếp nhận", "提供を受ける者", "Penerima")}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t(
                        "Aply 호스트 기업 (파트너사)",
                        "Aply host companies (partner companies)",
                        "Aply主办企业（合作公司）",
                        "Công ty tiếp nhận Aply (công ty đối tác)",
                        "Aplyホスト企業（パートナー社）",
                        "Perusahaan tuan rumah Aply (perusahaan mitra)"
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">
                      {t("제공 목적", "Purpose of Provision", "提供目的", "Mục đích cung cấp", "提供目的", "Tujuan Penyediaan")}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t(
                        "직무 체험 매칭 및 면접 진행",
                        "Job experience matching and conducting interviews",
                        "职务体验匹配及面试进行",
                        "Kết nối trải nghiệm công việc và tiến hành phỏng vấn",
                        "職務体験マッチング及び面接の実施",
                        "Pencocokan pengalaman kerja dan pelaksanaan wawancara"
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">
                      {t("제공 항목", "Items Provided", "提供项目", "Mục cung cấp", "提供項目", "Item yang Disediakan")}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t(
                        "[학생 회원]의 성명, 학력, 비자 상태, 이력서/커버레터/포트폴리오, 직무 관련 스킬, 한국어 능력",
                        "[Student member]'s name, education, visa status, resume/cover letter/portfolio, job-related skills, and Korean language proficiency",
                        "[学生会员]的姓名、学历、签证状态、简历/求职信/作品集、职务相关技能、韩语能力",
                        "Họ tên, học vấn, tình trạng thị thực, sơ yếu lý lịch/thư xin việc/hồ sơ năng lực, kỹ năng liên quan đến công việc, năng lực tiếng Hàn của [thành viên sinh viên]",
                        "[学生会員]の氏名、学歴、ビザ状況、履歴書/カバーレター/ポートフォリオ、職務関連スキル、韓国語能力",
                        "Nama, pendidikan, status visa, resume/surat lamaran/portofolio, keterampilan terkait pekerjaan, kemampuan bahasa Korea dari [anggota pelajar]"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">
                      {t(
                        "보유 및 이용 기간",
                        "Retention and Use Period",
                        "保有及使用期间",
                        "Thời gian lưu giữ và sử dụng",
                        "保有及び利用期間",
                        "Periode Penyimpanan dan Penggunaan"
                      )}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">
                      {t(
                        "매칭 및 프로그램 종료 시까지 (또는 법령이 정한 기간)",
                        "Until the completion of matching and the program (or the period prescribed by law)",
                        "至匹配及项目结束时（或法律法规规定的期间）",
                        "Cho đến khi kết thúc việc kết nối và chương trình (hoặc thời hạn do pháp luật quy định)",
                        "マッチング及びプログラム終了時まで（又は法令が定めた期間）",
                        "Hingga selesainya pencocokan dan program (atau periode yang ditentukan undang-undang)"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제4조 (개인정보의 보유 및 이용 기간)",
                "Article 4 (Retention and Use Period of Personal Information)",
                "第4条（个人信息的保有及使用期间）",
                "Điều 4 (Thời gian lưu giữ và sử dụng thông tin cá nhân)",
                "第4条（個人情報の保有及び利用期間）",
                "Pasal 4 (Periode Penyimpanan dan Penggunaan Informasi Pribadi)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "회사는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 다음의 정보에 대해서는 아래의 이유로 명시한 기간 동안 보존합니다.",
                "In principle, the Company destroys the relevant information without delay once the purpose of collecting and using personal information has been achieved. However, the following information is retained for the periods specified for the reasons stated below.",
                "原则上，公司在收集及使用个人信息的目的达成后将立即销毁相关信息。但对于以下信息，出于下述理由将在所明示的期间内予以保存。",
                "Về nguyên tắc, Công ty tiêu hủy thông tin liên quan không chậm trễ sau khi đạt được mục đích thu thập và sử dụng thông tin cá nhân. Tuy nhiên, đối với các thông tin sau đây, Công ty lưu giữ trong thời hạn được nêu rõ vì các lý do dưới đây.",
                "当社は、原則として個人情報の収集及び利用目的が達成された後は、当該情報を遅滞なく破棄します。ただし、次の情報については、以下の理由により明示した期間保存します。",
                "Pada prinsipnya, Perusahaan memusnahkan informasi terkait tanpa penundaan setelah tujuan pengumpulan dan penggunaan informasi pribadi tercapai. Namun, untuk informasi berikut, disimpan selama periode yang ditentukan dengan alasan di bawah ini."
              )}
            </p>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(
                "1. 회사 내부 방침에 의한 정보 보유",
                "1. Information Retained Under the Company's Internal Policy",
                "1. 依据公司内部方针的信息保有",
                "1. Lưu giữ thông tin theo chính sách nội bộ của Công ty",
                "1. 会社内部方針による情報保有",
                "1. Penyimpanan Informasi Berdasarkan Kebijakan Internal Perusahaan"
              )}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "부적격 회원의 재가입 방지, 분쟁 해결: 회원 탈퇴 후 1년",
                  "Prevention of re-registration by ineligible members, dispute resolution: 1 year after membership withdrawal",
                  "防止不合格会员再次注册、纠纷解决：会员退出后1年",
                  "Ngăn chặn tái đăng ký của thành viên không đủ điều kiện, giải quyết tranh chấp: 1 năm sau khi rút tư cách thành viên",
                  "不適格会員の再加入防止、紛争解決：会員退会後1年",
                  "Pencegahan pendaftaran ulang anggota yang tidak memenuhi syarat, penyelesaian sengketa: 1 tahun setelah keluar dari keanggotaan"
                )}
              </li>
            </ul>

            <h3 className="mt-4 text-sm font-semibold text-foreground">
              {t(
                "2. 관련 법령에 의한 정보 보유",
                "2. Information Retained Under Relevant Laws",
                "2. 依据相关法律法规的信息保有",
                "2. Lưu giữ thông tin theo pháp luật liên quan",
                "2. 関連法令による情報保有",
                "2. Penyimpanan Informasi Berdasarkan Undang-Undang Terkait"
              )}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)",
                  "Records on contracts or withdrawal of offers, etc.: 5 years (Act on Consumer Protection in Electronic Commerce)",
                  "有关合同或撤回要约等的记录：5年（《电子商务等交易中的消费者保护法》）",
                  "Hồ sơ về hợp đồng hoặc rút lại đề nghị, v.v.: 5 năm (Đạo luật Bảo vệ Người tiêu dùng trong Thương mại Điện tử)",
                  "契約又は申込撤回等に関する記録：5年（電子商取引等における消費者保護に関する法律）",
                  "Catatan tentang kontrak atau penarikan penawaran, dll.: 5 tahun (Undang-Undang Perlindungan Konsumen dalam Perdagangan Elektronik)"
                )}
              </li>
              <li>
                {t(
                  "대금 결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래법)",
                  "Records on payment and the supply of goods, etc.: 5 years (Electronic Commerce Act)",
                  "有关货款结算及货物等供应的记录：5年（《电子商务法》）",
                  "Hồ sơ về thanh toán và cung cấp hàng hóa, v.v.: 5 năm (Đạo luật Thương mại Điện tử)",
                  "代金決済及び財貨等の供給に関する記録：5年（電子商取引法）",
                  "Catatan tentang pembayaran dan penyediaan barang, dll.: 5 tahun (Undang-Undang Perdagangan Elektronik)"
                )}
              </li>
              <li>
                {t(
                  "소비자의 불만 또는 분쟁 처리에 관한 기록: 3년 (전자상거래법)",
                  "Records on handling consumer complaints or disputes: 3 years (Electronic Commerce Act)",
                  "有关消费者投诉或纠纷处理的记录：3年（《电子商务法》）",
                  "Hồ sơ về xử lý khiếu nại hoặc tranh chấp của người tiêu dùng: 3 năm (Đạo luật Thương mại Điện tử)",
                  "消費者の苦情又は紛争処理に関する記録：3年（電子商取引法）",
                  "Catatan tentang penanganan keluhan atau sengketa konsumen: 3 tahun (Undang-Undang Perdagangan Elektronik)"
                )}
              </li>
              <li>
                {t(
                  "로그인 기록: 3개월 (통신비밀보호법)",
                  "Login records: 3 months (Protection of Communications Secrets Act)",
                  "登录记录：3个月（《通信秘密保护法》）",
                  "Hồ sơ đăng nhập: 3 tháng (Đạo luật Bảo vệ Bí mật Truyền thông)",
                  "ログイン記録：3ヶ月（通信秘密保護法）",
                  "Catatan login: 3 bulan (Undang-Undang Perlindungan Rahasia Komunikasi)"
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제5조 (이용자 및 법정대리인의 권리 및 행사 방법)",
                "Article 5 (Rights of Users and Legal Representatives and How to Exercise Them)",
                "第5条（用户及法定代理人的权利及行使方法）",
                "Điều 5 (Quyền của người dùng và người đại diện theo pháp luật và cách thức thực hiện)",
                "第5条（利用者及び法定代理人の権利及び行使方法）",
                "Pasal 5 (Hak Pengguna dan Wakil Hukum serta Cara Menggunakannya)"
              )}
            </h2>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "이용자는 언제든지 등록되어 있는 자신의 개인정보를 [마이페이지/프로필]에서 조회하거나 수정할 수 있습니다.",
                  "Users may view or edit their registered personal information at any time in [My Page/Profile].",
                  "用户可随时在[我的页面/个人资料]中查询或修改已登记的自己的个人信息。",
                  "Người dùng có thể xem hoặc chỉnh sửa thông tin cá nhân đã đăng ký của mình bất cứ lúc nào tại [Trang của tôi/Hồ sơ].",
                  "利用者は、いつでも登録されている自身の個人情報を[マイページ/プロフィール]で照会又は修正することができます。",
                  "Pengguna dapat melihat atau mengubah informasi pribadi mereka yang terdaftar kapan saja di [Halaman Saya/Profil]."
                )}
              </li>
              <li>
                {t(
                  "이용자는 언제든지 회원 탈퇴를 통해 개인정보 수집 및 이용 동의를 철회할 수 있습니다.",
                  "Users may withdraw their consent to the collection and use of personal information at any time by withdrawing their membership.",
                  "用户可随时通过退出会员撤回对个人信息收集及使用的同意。",
                  "Người dùng có thể rút lại sự đồng ý về việc thu thập và sử dụng thông tin cá nhân bất cứ lúc nào bằng cách rút tư cách thành viên.",
                  "利用者は、いつでも会員退会を通じて個人情報の収集及び利用の同意を撤回することができます。",
                  "Pengguna dapat menarik persetujuan atas pengumpulan dan penggunaan informasi pribadi kapan saja dengan keluar dari keanggotaan."
                )}
              </li>
              <li>
                {t(
                  "이용자가 개인정보의 오류에 대한 정정을 요청한 경우에는 정정을 완료하기 전까지 당해 개인정보를 이용 또는 제공하지 않습니다.",
                  "If a user requests correction of an error in their personal information, the Company will not use or provide the relevant personal information until the correction is completed.",
                  "用户请求更正个人信息错误时，在完成更正之前不会使用或提供该个人信息。",
                  "Trong trường hợp người dùng yêu cầu chỉnh sửa lỗi trong thông tin cá nhân, Công ty sẽ không sử dụng hoặc cung cấp thông tin cá nhân đó cho đến khi hoàn tất việc chỉnh sửa.",
                  "利用者が個人情報の誤りについて訂正を要求した場合には、訂正を完了するまで当該個人情報を利用又は提供しません。",
                  "Jika pengguna meminta koreksi atas kesalahan dalam informasi pribadi, Perusahaan tidak akan menggunakan atau menyediakan informasi pribadi tersebut hingga koreksi selesai."
                )}
              </li>
            </ol>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제6조 (개인정보의 파기 절차 및 방법)",
                "Article 6 (Procedures and Methods for Destroying Personal Information)",
                "第6条（个人信息的销毁程序及方法）",
                "Điều 6 (Quy trình và phương thức tiêu hủy thông tin cá nhân)",
                "第6条（個人情報の破棄手続き及び方法）",
                "Pasal 6 (Prosedur dan Metode Pemusnahan Informasi Pribadi)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "회사는 원칙적으로 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우에는 지체 없이 해당 개인정보를 파기합니다.",
                "In principle, the Company destroys the relevant personal information without delay when the retention period has elapsed or the purpose of processing has been achieved.",
                "原则上，公司在个人信息保有期间届满或处理目的达成时，将立即销毁该个人信息。",
                "Về nguyên tắc, Công ty tiêu hủy thông tin cá nhân liên quan không chậm trễ khi thời hạn lưu giữ thông tin cá nhân đã hết hoặc mục đích xử lý đã đạt được.",
                "当社は、原則として個人情報の保有期間が経過し、又は処理目的が達成された場合には、遅滞なく当該個人情報を破棄します。",
                "Pada prinsipnya, Perusahaan memusnahkan informasi pribadi terkait tanpa penundaan ketika periode penyimpanan telah berlalu atau tujuan pemrosesan telah tercapai."
              )}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">
                  {t("파기 절차", "Destruction Procedure", "销毁程序", "Quy trình tiêu hủy", "破棄手続き", "Prosedur Pemusnahan")}
                </strong>
                {t(
                  ": 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보보호책임자의 승인을 받아 파기합니다.",
                  ": Personal information for which grounds for destruction have arisen is selected and destroyed with the approval of the Company's Personal Information Protection Officer.",
                  "：选定发生销毁事由的个人信息，并经公司个人信息保护负责人批准后予以销毁。",
                  ": Chọn thông tin cá nhân phát sinh lý do tiêu hủy và tiêu hủy sau khi được người phụ trách bảo vệ thông tin cá nhân của Công ty phê duyệt.",
                  "：破棄事由が発生した個人情報を選定し、当社の個人情報保護責任者の承認を受けて破棄します。",
                  ": Memilih informasi pribadi yang telah timbul alasan pemusnahannya, dan memusnahkannya setelah mendapat persetujuan dari penanggung jawab perlindungan informasi pribadi Perusahaan."
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("파기 방법", "Destruction Method", "销毁方法", "Phương thức tiêu hủy", "破棄方法", "Metode Pemusnahan")}
                </strong>
                {t(
                  ": 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이 문서에 기록된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.",
                  ": Information in electronic file form is deleted using technical methods that make the records unrecoverable, and personal information recorded on paper documents is destroyed by shredding or incineration.",
                  "：以电子文件形式存储的信息使用无法再现记录的技术方法删除，记录在纸质文件上的个人信息通过碎纸机粉碎或焚烧予以销毁。",
                  ": Thông tin ở dạng tệp điện tử được xóa bằng phương pháp kỹ thuật không thể khôi phục bản ghi, và thông tin cá nhân ghi trên tài liệu giấy được tiêu hủy bằng cách nghiền bằng máy hủy tài liệu hoặc đốt.",
                  "：電子ファイル形式の情報は記録を再生できない技術的方法を用いて削除し、紙の文書に記録された個人情報はシュレッダーで裁断又は焼却して破棄します。",
                  ": Informasi dalam bentuk file elektronik dihapus menggunakan metode teknis yang membuat catatan tidak dapat dipulihkan, dan informasi pribadi yang tercatat pada dokumen kertas dimusnahkan dengan cara dihancurkan menggunakan mesin penghancur atau dibakar."
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제7조 (개인정보의 안전성 확보 조치)",
                "Article 7 (Measures to Ensure the Security of Personal Information)",
                "第7条（个人信息安全性保障措施）",
                "Điều 7 (Các biện pháp đảm bảo an toàn cho thông tin cá nhân)",
                "第7条（個人情報の安全性確保措置）",
                "Pasal 7 (Langkah-Langkah untuk Menjamin Keamanan Informasi Pribadi)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "회사는 이용자의 개인정보를 안전하게 관리하기 위해 다음과 같은 기술적/관리적 보호 대책을 강구하고 있습니다.",
                "The Company takes the following technical and administrative protective measures to securely manage users' personal information.",
                "公司为安全管理用户个人信息，采取如下技术性/管理性保护措施。",
                "Công ty áp dụng các biện pháp bảo vệ về kỹ thuật/quản lý sau đây để quản lý an toàn thông tin cá nhân của người dùng.",
                "当社は、利用者の個人情報を安全に管理するため、次のような技術的/管理的保護対策を講じています。",
                "Perusahaan mengambil langkah-langkah perlindungan teknis/administratif berikut untuk mengelola informasi pribadi pengguna dengan aman."
              )}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">
                  {t("관리적 조치", "Administrative Measures", "管理性措施", "Biện pháp quản lý", "管理的措置", "Langkah Administratif")}
                </strong>
                {t(
                  ": 내부관리계획 수립, 개인정보 취급 직원 최소화, 정기적 직원 교육",
                  ": Establishment of an internal management plan, minimizing staff who handle personal information, and regular employee training",
                  "：制定内部管理计划、最大限度减少处理个人信息的员工、定期开展员工培训",
                  ": Xây dựng kế hoạch quản lý nội bộ, tối thiểu hóa nhân viên xử lý thông tin cá nhân, đào tạo nhân viên định kỳ",
                  "：内部管理計画の策定、個人情報取扱職員の最小化、定期的な職員教育",
                  ": Penyusunan rencana manajemen internal, meminimalkan staf yang menangani informasi pribadi, pelatihan karyawan secara berkala"
                )}
              </li>
              <li>
                <strong className="font-semibold text-foreground">
                  {t("기술적 조치", "Technical Measures", "技术性措施", "Biện pháp kỹ thuật", "技術的措置", "Langkah Teknis")}
                </strong>
                {t(
                  ": 비밀번호 암호화, 접근통제시스템 설치, 보안 프로그램(백신) 설치",
                  ": Password encryption, installation of an access control system, and installation of security programs (antivirus)",
                  "：密码加密、安装访问控制系统、安装安全程序（杀毒软件）",
                  ": Mã hóa mật khẩu, lắp đặt hệ thống kiểm soát truy cập, cài đặt chương trình bảo mật (phần mềm diệt virus)",
                  "：パスワードの暗号化、アクセス制御システムの設置、セキュリティプログラム（ワクチン）の設置",
                  ": Enkripsi kata sandi, pemasangan sistem kontrol akses, pemasangan program keamanan (antivirus)"
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제8조 (개인정보 보호책임자 및 민원서비스)",
                "Article 8 (Personal Information Protection Officer and Complaint Services)",
                "第8条（个人信息保护负责人及投诉服务）",
                "Điều 8 (Người phụ trách bảo vệ thông tin cá nhân và dịch vụ khiếu nại)",
                "第8条（個人情報保護責任者及び苦情サービス）",
                "Pasal 8 (Penanggung Jawab Perlindungan Informasi Pribadi dan Layanan Pengaduan)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "회사는 이용자의 개인정보를 보호하고 관련 불만을 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.",
                "To protect users' personal information and handle related complaints, the Company has designated a Personal Information Protection Officer as follows.",
                "公司为保护用户个人信息并处理相关投诉，指定个人信息保护负责人如下。",
                "Để bảo vệ thông tin cá nhân của người dùng và xử lý các khiếu nại liên quan, Công ty chỉ định người phụ trách bảo vệ thông tin cá nhân như sau.",
                "当社は、利用者の個人情報を保護し、関連する苦情を処理するため、以下のとおり個人情報保護責任者を指定しています。",
                "Untuk melindungi informasi pribadi pengguna dan menangani keluhan terkait, Perusahaan menunjuk penanggung jawab perlindungan informasi pribadi sebagai berikut."
              )}
            </p>
            <div className="mt-4 overflow-hidden rounded-xl border border-border/60">
              <table className="w-full text-xs">
                <tbody>
                  <tr className="border-b border-border/60">
                    <th className="w-1/3 bg-muted/50 px-3 py-2 text-left font-medium text-foreground">
                      {t("이름", "Name", "姓名", "Họ tên", "氏名", "Nama")}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">김남구</td>
                  </tr>
                  <tr className="border-b border-border/60">
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">
                      {t("직책", "Position", "职务", "Chức vụ", "役職", "Jabatan")}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">CEO</td>
                  </tr>
                  <tr>
                    <th className="bg-muted/50 px-3 py-2 text-left font-medium text-foreground">
                      {t("이메일", "Email", "电子邮箱", "Email", "メール", "Email")}
                    </th>
                    <td className="px-3 py-2 text-muted-foreground">
                      <a href="mailto:qoo@flip-ers.com" className="text-primary underline">
                        qoo@flip-ers.com
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-muted-foreground">
              {t(
                "기타 개인정보 침해에 대한 신고나 상담이 필요하신 경우에는 아래 기관에 문의하실 수 있습니다.",
                "For other reports or consultations regarding personal information infringement, you may contact the following organizations.",
                "如需就其他个人信息侵害进行举报或咨询，可向以下机构咨询。",
                "Trong trường hợp cần báo cáo hoặc tư vấn về các vi phạm thông tin cá nhân khác, bạn có thể liên hệ với các cơ quan sau.",
                "その他、個人情報の侵害に関する申告や相談が必要な場合は、以下の機関にお問い合わせいただけます。",
                "Jika Anda memerlukan pelaporan atau konsultasi mengenai pelanggaran informasi pribadi lainnya, Anda dapat menghubungi lembaga berikut."
              )}
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                {t(
                  "개인정보침해신고센터 (",
                  "Personal Information Infringement Report Center (",
                  "个人信息侵害举报中心（",
                  "Trung tâm Báo cáo Vi phạm Thông tin Cá nhân (",
                  "個人情報侵害申告センター（",
                  "Pusat Pelaporan Pelanggaran Informasi Pribadi ("
                )}
                <a
                  href="https://privacy.kisa.or.kr"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  privacy.kisa.or.kr
                </a>{" "}
                {t(
                  "/ 국번없이 118)",
                  "/ 118 without an area code)",
                  "/ 无区号直拨118）",
                  "/ 118 không cần mã vùng)",
                  "/ 局番なしで118)",
                  "/ 118 tanpa kode area)"
                )}
              </li>
              <li>
                {t(
                  "대검찰청 사이버수사과 (",
                  "Supreme Prosecutors' Office Cyber Investigation Division (",
                  "大检察厅网络调查科（",
                  "Phòng Điều tra Mạng Viện Kiểm sát Tối cao (",
                  "最高検察庁サイバー捜査課（",
                  "Divisi Investigasi Siber Kejaksaan Agung ("
                )}
                <a href="https://www.spo.go.kr" target="_blank" rel="noreferrer" className="text-primary underline">
                  www.spo.go.kr
                </a>{" "}
                {t(
                  "/ 국번없이 1301)",
                  "/ 1301 without an area code)",
                  "/ 无区号直拨1301）",
                  "/ 1301 không cần mã vùng)",
                  "/ 局番なしで1301)",
                  "/ 1301 tanpa kode area)"
                )}
              </li>
              <li>
                {t(
                  "경찰청 사이버수사국 (",
                  "National Police Agency Cyber Investigation Bureau (",
                  "警察厅网络调查局（",
                  "Cục Điều tra Mạng Cơ quan Cảnh sát Quốc gia (",
                  "警察庁サイバー捜査局（",
                  "Biro Investigasi Siber Kepolisian Nasional ("
                )}
                <a href="https://ecrm.police.go.kr" target="_blank" rel="noreferrer" className="text-primary underline">
                  ecrm.police.go.kr
                </a>{" "}
                {t(
                  "/ 국번없이 182)",
                  "/ 182 without an area code)",
                  "/ 无区号直拨182）",
                  "/ 182 không cần mã vùng)",
                  "/ 局番なしで182)",
                  "/ 182 tanpa kode area)"
                )}
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold">
              {t(
                "제9조 (개인정보 처리방침의 변경)",
                "Article 9 (Changes to the Privacy Policy)",
                "第9条（隐私政策的变更）",
                "Điều 9 (Thay đổi chính sách bảo mật)",
                "第9条（プライバシーポリシーの変更）",
                "Pasal 9 (Perubahan Kebijakan Privasi)"
              )}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {t(
                "본 개인정보 처리방침은 법령 및 방침에 따른 변경 내용의 추가, 삭제 및 수정이 있을 시에는 시행일의 7일 전부터 웹사이트 공지사항을 통하여 고지할 것입니다.",
                "When there are additions, deletions, or modifications to the content of this Privacy Policy in accordance with laws and policies, they will be announced through the website's notices from 7 days before the effective date.",
                "本隐私政策如因法律法规及方针而有变更内容的增加、删除及修改时，将从生效日的7天前起通过网站公告事项予以告知。",
                "Khi có sự bổ sung, xóa bỏ hoặc sửa đổi nội dung của Chính sách bảo mật này theo pháp luật và chính sách, chúng sẽ được thông báo qua mục thông báo trên trang web từ 7 ngày trước ngày hiệu lực.",
                "本プライバシーポリシーは、法令及び方針による変更内容の追加、削除及び修正がある場合には、施行日の7日前からウェブサイトのお知らせを通じて告知します。",
                "Apabila terdapat penambahan, penghapusan, atau perubahan isi Kebijakan Privasi ini sesuai dengan undang-undang dan kebijakan, hal tersebut akan diberitahukan melalui pengumuman situs web mulai 7 hari sebelum tanggal berlaku."
              )}
            </p>
          </div>

          <div className="border-t border-border/60 pt-6 text-muted-foreground">
            <p>
              {t(
                "공고일자: 2025년 11월 12일",
                "Published: November 12, 2025",
                "公布日期：2025年11月12日",
                "Ngày công bố: 12 tháng 11 năm 2025",
                "公示日：2025年11月12日",
                "Tanggal pengumuman: 12 November 2025"
              )}
            </p>
            <p>
              {t(
                "시행일자: 2025년 11월 12일",
                "Effective: November 12, 2025",
                "生效日期：2025年11月12日",
                "Ngày hiệu lực: 12 tháng 11 năm 2025",
                "施行日：2025年11月12日",
                "Tanggal berlaku: 12 November 2025"
              )}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
