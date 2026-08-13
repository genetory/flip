// 직무 분류 라벨의 표시용 다국어 매핑. 한국어 문자열은 데이터 키(저장·매칭·필터·React key)로
// 그대로 두고, 화면에 보여줄 때만 이 헬퍼로 현지화한다. 키는 job-taxonomy.ts와 정확히 일치해야 한다.
import type { PlatformT } from "../i18n";

// 매핑되지 않은(커스텀 입력 등) 값은 입력 그대로 반환한다.
export function jobTaxonomyLabelOf(t: PlatformT, ko: string): string {
  switch (ko) {
    // ── 대분류 ────────────────────────────────────────────────
    case "개발":
      return t("개발", "Development", "开发", "Phát triển", "開発", "Pengembangan");
    case "데이터·AI":
      return t("데이터·AI", "Data & AI", "数据·AI", "Dữ liệu & AI", "データ・AI", "Data & AI");
    case "디자인":
      return t("디자인", "Design", "设计", "Thiết kế", "デザイン", "Desain");
    case "기획·PM":
      return t("기획·PM", "Planning & PM", "企划·PM", "Lập kế hoạch & PM", "企画・PM", "Perencanaan & PM");
    case "마케팅·광고":
      return t("마케팅·광고", "Marketing & Ads", "市场·广告", "Marketing & Quảng cáo", "マーケ・広告", "Pemasaran & Iklan");
    case "영업·제휴":
      return t("영업·제휴", "Sales & Partnerships", "销售·合作", "Kinh doanh & Hợp tác", "営業・提携", "Penjualan & Kemitraan");
    case "고객·CS":
      return t("고객·CS", "Customer & CS", "客户·CS", "Khách hàng & CS", "顧客・CS", "Pelanggan & CS");
    case "경영·비즈니스":
      return t("경영·비즈니스", "Management & Business", "经营·商务", "Quản lý & Kinh doanh", "経営・ビジネス", "Manajemen & Bisnis");
    case "인사·HR":
      return t("인사·HR", "HR", "人事·HR", "Nhân sự & HR", "人事・HR", "SDM & HR");
    case "재무·회계":
      return t("재무·회계", "Finance & Accounting", "财务·会计", "Tài chính & Kế toán", "財務・会計", "Keuangan & Akuntansi");
    case "미디어·콘텐츠":
      return t("미디어·콘텐츠", "Media & Content", "媒体·内容", "Truyền thông & Nội dung", "メディア・コンテンツ", "Media & Konten");
    case "생산·물류":
      return t("생산·물류", "Production & Logistics", "生产·物流", "Sản xuất & Logistics", "生産・物流", "Produksi & Logistik");

    // ── 중분류 ────────────────────────────────────────────────
    case "소프트웨어":
      return t("소프트웨어", "Software", "软件", "Phần mềm", "ソフトウェア", "Perangkat Lunak");
    case "모바일":
      return t("모바일", "Mobile", "移动端", "Di động", "モバイル", "Mobile");
    case "인프라·데브옵스":
      return t("인프라·데브옵스", "Infra & DevOps", "基础设施·DevOps", "Hạ tầng & DevOps", "インフラ・DevOps", "Infra & DevOps");
    case "보안·QA":
      return t("보안·QA", "Security & QA", "安全·QA", "Bảo mật & QA", "セキュリティ・QA", "Keamanan & QA");
    case "데이터":
      return t("데이터", "Data", "数据", "Dữ liệu", "データ", "Data");
    case "AI·ML":
      return t("AI·ML", "AI & ML", "AI·ML", "AI & ML", "AI・ML", "AI & ML");
    case "프로덕트·UX":
      return t("프로덕트·UX", "Product & UX", "产品·UX", "Sản phẩm & UX", "プロダクト・UX", "Produk & UX");
    case "그래픽·브랜드":
      return t("그래픽·브랜드", "Graphic & Brand", "平面·品牌", "Đồ họa & Thương hiệu", "グラフィック・ブランド", "Grafis & Merek");
    case "콘텐츠·영상":
      return t("콘텐츠·영상", "Content & Video", "内容·影像", "Nội dung & Video", "コンテンツ・映像", "Konten & Video");
    case "프로덕트":
      return t("프로덕트", "Product", "产品", "Sản phẩm", "プロダクト", "Produk");
    case "전략·사업":
      return t("전략·사업", "Strategy & Business", "战略·事业", "Chiến lược & Kinh doanh", "戦略・事業", "Strategi & Bisnis");
    case "디지털 마케팅":
      return t("디지털 마케팅", "Digital Marketing", "数字营销", "Marketing số", "デジタルマーケ", "Pemasaran Digital");
    case "브랜드·PR":
      return t("브랜드·PR", "Brand & PR", "品牌·PR", "Thương hiệu & PR", "ブランド・PR", "Merek & PR");
    case "영업":
      return t("영업", "Sales", "销售", "Kinh doanh", "営業", "Penjualan");
    case "제휴·세일즈":
      return t("제휴·세일즈", "Partnerships & Sales", "合作·销售", "Hợp tác & Bán hàng", "提携・セールス", "Kemitraan & Penjualan");
    case "고객 지원":
      return t("고객 지원", "Customer Support", "客户支持", "Hỗ trợ khách hàng", "カスタマーサポート", "Dukungan Pelanggan");
    case "경영지원":
      return t("경영지원", "Management Support", "经营支持", "Hỗ trợ quản lý", "経営支援", "Dukungan Manajemen");
    case "전략·컨설팅":
      return t("전략·컨설팅", "Strategy & Consulting", "战略·咨询", "Chiến lược & Tư vấn", "戦略・コンサル", "Strategi & Konsultasi");
    case "HR":
      return t("HR", "HR", "HR", "HR", "HR", "HR");
    case "콘텐츠":
      return t("콘텐츠", "Content", "内容", "Nội dung", "コンテンツ", "Konten");
    case "생산·품질":
      return t("생산·품질", "Production & Quality", "生产·质量", "Sản xuất & Chất lượng", "生産・品質", "Produksi & Kualitas");
    case "물류·무역":
      return t("물류·무역", "Logistics & Trade", "物流·贸易", "Logistics & Thương mại", "物流・貿易", "Logistik & Perdagangan");

    // ── 소분류(leaf) ──────────────────────────────────────────
    // 개발
    case "백엔드 개발":
      return t("백엔드 개발", "Backend", "后端开发", "Backend", "バックエンド", "Backend");
    case "프론트엔드 개발":
      return t("프론트엔드 개발", "Frontend", "前端开发", "Frontend", "フロントエンド", "Frontend");
    case "풀스택 개발":
      return t("풀스택 개발", "Full-stack", "全栈开发", "Full-stack", "フルスタック", "Full-stack");
    case "웹 개발":
      return t("웹 개발", "Web Dev", "Web开发", "Lập trình web", "Web開発", "Pengembang Web");
    case "소프트웨어 엔지니어":
      return t("소프트웨어 엔지니어", "Software Engineer", "软件工程师", "Kỹ sư phần mềm", "ソフトウェアエンジニア", "Software Engineer");
    case "안드로이드 개발":
      return t("안드로이드 개발", "Android", "安卓开发", "Android", "Android開発", "Android");
    case "iOS 개발":
      return t("iOS 개발", "iOS", "iOS开发", "iOS", "iOS開発", "iOS");
    case "크로스플랫폼 개발":
      return t("크로스플랫폼 개발", "Cross-platform", "跨平台开发", "Đa nền tảng", "クロスプラットフォーム", "Lintas Platform");
    case "DevOps":
      return t("DevOps", "DevOps", "DevOps", "DevOps", "DevOps", "DevOps");
    case "인프라 엔지니어":
      return t("인프라 엔지니어", "Infra Engineer", "基础设施工程师", "Kỹ sư hạ tầng", "インフラエンジニア", "Infra Engineer");
    case "시스템/네트워크":
      return t("시스템/네트워크", "System/Network", "系统/网络", "Hệ thống/Mạng", "システム・ネットワーク", "Sistem/Jaringan");
    case "SRE":
      return t("SRE", "SRE", "SRE", "SRE", "SRE", "SRE");
    case "보안 엔지니어":
      return t("보안 엔지니어", "Security Engineer", "安全工程师", "Kỹ sư bảo mật", "セキュリティエンジニア", "Security Engineer");
    case "QA 엔지니어":
      return t("QA 엔지니어", "QA Engineer", "QA工程师", "Kỹ sư QA", "QAエンジニア", "QA Engineer");
    // 데이터·AI
    case "데이터 분석가":
      return t("데이터 분석가", "Data Analyst", "数据分析师", "Chuyên viên phân tích dữ liệu", "データアナリスト", "Analis Data");
    case "데이터 엔지니어":
      return t("데이터 엔지니어", "Data Engineer", "数据工程师", "Kỹ sư dữ liệu", "データエンジニア", "Data Engineer");
    case "데이터 사이언티스트":
      return t("데이터 사이언티스트", "Data Scientist", "数据科学家", "Nhà khoa học dữ liệu", "データサイエンティスト", "Data Scientist");
    case "BI 분석가":
      return t("BI 분석가", "BI Analyst", "BI分析师", "Chuyên viên BI", "BIアナリスト", "Analis BI");
    case "머신러닝 엔지니어":
      return t("머신러닝 엔지니어", "ML Engineer", "机器学习工程师", "Kỹ sư ML", "MLエンジニア", "ML Engineer");
    case "AI 리서처":
      return t("AI 리서처", "AI Researcher", "AI研究员", "Nhà nghiên cứu AI", "AIリサーチャー", "AI Researcher");
    case "MLOps":
      return t("MLOps", "MLOps", "MLOps", "MLOps", "MLOps", "MLOps");
    // 디자인
    case "UX 디자이너":
      return t("UX 디자이너", "UX Designer", "UX设计师", "Thiết kế UX", "UXデザイナー", "Desainer UX");
    case "UI 디자이너":
      return t("UI 디자이너", "UI Designer", "UI设计师", "Thiết kế UI", "UIデザイナー", "Desainer UI");
    case "프로덕트 디자이너":
      return t("프로덕트 디자이너", "Product Designer", "产品设计师", "Thiết kế sản phẩm", "プロダクトデザイナー", "Desainer Produk");
    case "그래픽 디자이너":
      return t("그래픽 디자이너", "Graphic Designer", "平面设计师", "Thiết kế đồ họa", "グラフィックデザイナー", "Desainer Grafis");
    case "브랜드 디자이너":
      return t("브랜드 디자이너", "Brand Designer", "品牌设计师", "Thiết kế thương hiệu", "ブランドデザイナー", "Desainer Merek");
    case "BX 디자이너":
      return t("BX 디자이너", "BX Designer", "BX设计师", "Thiết kế BX", "BXデザイナー", "Desainer BX");
    case "영상 디자이너":
      return t("영상 디자이너", "Video Designer", "影像设计师", "Thiết kế video", "映像デザイナー", "Desainer Video");
    case "모션 디자이너":
      return t("모션 디자이너", "Motion Designer", "动效设计师", "Thiết kế chuyển động", "モーションデザイナー", "Desainer Motion");
    case "3D 디자이너":
      return t("3D 디자이너", "3D Designer", "3D设计师", "Thiết kế 3D", "3Dデザイナー", "Desainer 3D");
    // 기획·PM
    case "프로덕트 매니저(PM)":
      return t("프로덕트 매니저(PM)", "Product Manager (PM)", "产品经理(PM)", "Quản lý sản phẩm (PM)", "プロダクトマネージャー(PM)", "Product Manager (PM)");
    case "프로덕트 오너(PO)":
      return t("프로덕트 오너(PO)", "Product Owner (PO)", "产品负责人(PO)", "Product Owner (PO)", "プロダクトオーナー(PO)", "Product Owner (PO)");
    case "서비스 기획":
      return t("서비스 기획", "Service Planning", "服务企划", "Lập kế hoạch dịch vụ", "サービス企画", "Perencanaan Layanan");
    case "사업 기획":
      return t("사업 기획", "Business Planning", "事业企划", "Lập kế hoạch kinh doanh", "事業企画", "Perencanaan Bisnis");
    case "전략 기획":
      return t("전략 기획", "Strategy Planning", "战略企划", "Lập kế hoạch chiến lược", "戦略企画", "Perencanaan Strategi");
    case "프로젝트 매니저(PjM)":
      return t("프로젝트 매니저(PjM)", "Project Manager (PjM)", "项目经理(PjM)", "Quản lý dự án (PjM)", "プロジェクトマネージャー(PjM)", "Project Manager (PjM)");
    // 마케팅·광고
    case "퍼포먼스 마케팅":
      return t("퍼포먼스 마케팅", "Performance Marketing", "效果营销", "Performance Marketing", "パフォーマンスマーケ", "Performance Marketing");
    case "그로스 마케팅":
      return t("그로스 마케팅", "Growth Marketing", "增长营销", "Growth Marketing", "グロースマーケ", "Growth Marketing");
    case "콘텐츠 마케팅":
      return t("콘텐츠 마케팅", "Content Marketing", "内容营销", "Content Marketing", "コンテンツマーケ", "Content Marketing");
    case "SNS 마케팅":
      return t("SNS 마케팅", "Social Marketing", "社媒营销", "Marketing MXH", "SNSマーケ", "Pemasaran Media Sosial");
    case "브랜드 마케팅":
      return t("브랜드 마케팅", "Brand Marketing", "品牌营销", "Brand Marketing", "ブランドマーケ", "Brand Marketing");
    case "PR/홍보":
      return t("PR/홍보", "PR", "公关/宣传", "PR/Truyền thông", "PR・広報", "PR/Humas");
    case "CRM 마케팅":
      return t("CRM 마케팅", "CRM Marketing", "CRM营销", "CRM Marketing", "CRMマーケ", "CRM Marketing");
    // 영업·제휴
    case "B2B 영업":
      return t("B2B 영업", "B2B Sales", "B2B销售", "Kinh doanh B2B", "B2B営業", "Penjualan B2B");
    case "B2C 영업":
      return t("B2C 영업", "B2C Sales", "B2C销售", "Kinh doanh B2C", "B2C営業", "Penjualan B2C");
    case "해외 영업":
      return t("해외 영업", "Overseas Sales", "海外销售", "Kinh doanh quốc tế", "海外営業", "Penjualan Luar Negeri");
    case "기술 영업":
      return t("기술 영업", "Technical Sales", "技术销售", "Kinh doanh kỹ thuật", "技術営業", "Penjualan Teknis");
    case "제휴/BD":
      return t("제휴/BD", "Partnerships/BD", "合作/BD", "Hợp tác/BD", "提携・BD", "Kemitraan/BD");
    case "세일즈 매니저":
      return t("세일즈 매니저", "Sales Manager", "销售经理", "Quản lý bán hàng", "セールスマネージャー", "Sales Manager");
    // 고객·CS
    case "고객 상담(CS)":
      return t("고객 상담(CS)", "Customer Support (CS)", "客户咨询(CS)", "Tư vấn khách hàng (CS)", "カスタマーサポート(CS)", "Layanan Pelanggan (CS)");
    case "고객 경험(CX)":
      return t("고객 경험(CX)", "Customer Experience (CX)", "客户体验(CX)", "Trải nghiệm khách hàng (CX)", "カスタマーエクスペリエンス(CX)", "Customer Experience (CX)");
    case "온보딩/서포트":
      return t("온보딩/서포트", "Onboarding/Support", "引导/支持", "Onboarding/Hỗ trợ", "オンボーディング・サポート", "Onboarding/Dukungan");
    // 경영·비즈니스
    case "경영 기획":
      return t("경영 기획", "Management Planning", "经营企划", "Lập kế hoạch quản lý", "経営企画", "Perencanaan Manajemen");
    case "운영 매니저":
      return t("운영 매니저", "Operations Manager", "运营经理", "Quản lý vận hành", "オペレーションマネージャー", "Manajer Operasi");
    case "총무":
      return t("총무", "General Affairs", "总务", "Hành chính", "総務", "Urusan Umum");
    case "법무":
      return t("법무", "Legal", "法务", "Pháp chế", "法務", "Legal");
    case "비즈니스 애널리스트":
      return t("비즈니스 애널리스트", "Business Analyst", "商业分析师", "Chuyên viên phân tích kinh doanh", "ビジネスアナリスト", "Analis Bisnis");
    case "컨설턴트":
      return t("컨설턴트", "Consultant", "顾问", "Tư vấn viên", "コンサルタント", "Konsultan");
    // 인사·HR
    case "채용(리크루터)":
      return t("채용(리크루터)", "Recruiter", "招聘(招聘专员)", "Tuyển dụng (Recruiter)", "採用(リクルーター)", "Rekruter");
    case "인사(HRM)":
      return t("인사(HRM)", "HR Management (HRM)", "人事(HRM)", "Quản lý nhân sự (HRM)", "人事(HRM)", "Manajemen SDM (HRM)");
    case "조직문화(HRD)":
      return t("조직문화(HRD)", "HR Development (HRD)", "组织文化(HRD)", "Phát triển nhân sự (HRD)", "組織文化(HRD)", "Pengembangan SDM (HRD)");
    case "노무":
      return t("노무", "Labor Affairs", "劳务", "Quan hệ lao động", "労務", "Ketenagakerjaan");
    // 재무·회계
    case "회계":
      return t("회계", "Accounting", "会计", "Kế toán", "会計", "Akuntansi");
    case "재무":
      return t("재무", "Finance", "财务", "Tài chính", "財務", "Keuangan");
    case "세무":
      return t("세무", "Tax", "税务", "Thuế", "税務", "Perpajakan");
    case "IR":
      return t("IR", "IR", "IR", "IR", "IR", "IR");
    case "감사":
      return t("감사", "Audit", "审计", "Kiểm toán", "監査", "Audit");
    // 미디어·콘텐츠
    case "콘텐츠 에디터":
      return t("콘텐츠 에디터", "Content Editor", "内容编辑", "Biên tập nội dung", "コンテンツエディター", "Editor Konten");
    case "카피라이터":
      return t("카피라이터", "Copywriter", "文案", "Copywriter", "コピーライター", "Copywriter");
    case "영상 편집":
      return t("영상 편집", "Video Editor", "视频剪辑", "Dựng video", "動画編集", "Editor Video");
    case "PD":
      return t("PD", "Producer (PD)", "制片(PD)", "Nhà sản xuất (PD)", "プロデューサー(PD)", "Produser (PD)");
    // 생산·물류
    case "생산 관리":
      return t("생산 관리", "Production Management", "生产管理", "Quản lý sản xuất", "生産管理", "Manajemen Produksi");
    case "품질 관리(QC)":
      return t("품질 관리(QC)", "Quality Control (QC)", "质量管理(QC)", "Kiểm soát chất lượng (QC)", "品質管理(QC)", "Kontrol Kualitas (QC)");
    case "설비":
      return t("설비", "Facilities", "设备", "Thiết bị", "設備", "Fasilitas");
    case "물류 관리":
      return t("물류 관리", "Logistics Management", "物流管理", "Quản lý logistics", "物流管理", "Manajemen Logistik");
    case "구매/자재":
      return t("구매/자재", "Purchasing/Materials", "采购/物料", "Mua hàng/Vật tư", "購買・資材", "Pembelian/Material");
    case "무역/수출입":
      return t("무역/수출입", "Trade/Import-Export", "贸易/进出口", "Thương mại/XNK", "貿易・輸出入", "Perdagangan/Ekspor-Impor");

    default:
      return ko;
  }
}
