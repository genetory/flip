"use client";

// v2 자기소개서 미리보기 — 기존 CoverPreviewScreen 과 같은 A4(CoverA4Preview)를 v2 머리말 아래 크게.
// PDF 저장은 기존과 같이 브라우저 인쇄(PrintStyles 가 A4 영역만 남긴다).
import Link from "next/link";
import { V2Shell } from "../V2Shell";
import { Actions, Button, Masthead, Page, PageSkeleton } from "../ui";
import { CoverA4Preview } from "../../talent/career/CoverA4";
import { PDF_PRINT_AREA, PrintStyles } from "../../talent/career/pdf-print";
import { trackEditor } from "../../../lib/analytics";
import { useCoverDoc } from "../../../lib/talent/cover-doc";
import { useBasicInfo } from "../../../lib/talent/basic-info";
import { useRenewalDocsStatus } from "../../../lib/talent/resume-doc";
import { usePlatformT } from "../../../lib/i18n";

const EDITOR = "/talent/career/cover/editor";

export function V2CoverPreviewScreen() {
  return (
    <V2Shell requireAuth>
      <PreviewBody />
    </V2Shell>
  );
}

function PreviewBody() {
  const t = usePlatformT();
  const doc = useCoverDoc();
  const info = useBasicInfo();
  const status = useRenewalDocsStatus();

  // 계정 문서를 불러오는 동안엔 '아직 없어요'를 잠깐 띄우지 않는다.
  if (status !== "loaded" && doc === null) return <PageSkeleton />;

  const back = (
    <Link href={EDITOR} className="hover:text-[color:var(--v2-ink-3)]">
      ‹ {t("자기소개서", "Cover letter", "自我介绍", "Thư giới thiệu", "自己紹介書", "Surat lamaran")}
    </Link>
  );

  if (doc === null) {
    return (
      <Page>
        <Masthead
          eyebrow={back}
          title={t("아직 자기소개서가 없어요", "No cover letter yet", "还没有求职信", "Chưa có thư xin việc", "まだ自己PRがありません", "Belum ada surat lamaran")}
          lede={t("먼저 자기소개서를 만들어주세요.", "Please create a cover letter first.", "请先制作求职信。", "Hãy tạo thư xin việc trước.", "まず自己PRを作ってください。", "Buat surat lamaran dulu ya.")}
          action={<Button href={EDITOR}>{t("자기소개서 만들기", "Create cover letter", "制作求职信", "Tạo thư xin việc", "自己PRを作る", "Buat surat lamaran")}</Button>}
        />
      </Page>
    );
  }

  return (
    <Page>
      <PrintStyles />
      <div className="no-print">
        <Masthead
          eyebrow={back}
          title={t("자기소개서 미리보기", "Cover letter preview", "求职信预览", "Xem trước thư xin việc", "自己PRプレビュー", "Pratinjau surat lamaran")}
          lede={t("회사에 보낼 때와 같은 A4 모양이에요.", "Same A4 layout the company will see.", "与投递给公司时相同的 A4 版式。", "Bố cục A4 giống khi gửi công ty.", "会社に送るときと同じA4の形です。", "Tata letak A4 sama seperti yang dikirim.")}
          action={
            <Actions>
              <Button
                onClick={() => {
                  trackEditor("editor_pdf_download", { doc: "cover", source: "preview" });
                  window.print();
                }}
              >
                {t("PDF 다운받기", "Download PDF", "下载 PDF", "Tải PDF", "PDFダウンロード", "Unduh PDF")}
              </Button>
              <Button variant="neutral" href={EDITOR}>
                {t("고치기", "Edit", "修改", "Sửa", "編集", "Ubah")}
              </Button>
            </Actions>
          }
        />
      </div>
      <div className="px-5">
        <div className="rounded-3xl bg-[color:var(--v2-band)] p-3 md:p-6">
          <div className={`mx-auto w-full max-w-[794px] ${PDF_PRINT_AREA}`}>
            <CoverA4Preview doc={doc} info={info} />
          </div>
        </div>
      </div>
    </Page>
  );
}
