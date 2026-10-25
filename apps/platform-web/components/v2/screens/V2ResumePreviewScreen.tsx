"use client";

// v2 이력서 미리보기 — 기존 ResumePreviewScreen 과 같은 데이터(useResumeDoc·useBasicInfo)로 A4 를 크게 보여 주고 PDF 로 저장한다.
import { V2Shell } from "../V2Shell";
import { Actions, Button, Masthead, Page, PageSkeleton, PrimaryButton } from "../ui";
import { V2PdfButton } from "./V2ResumeParts";
import { ResumeA4Preview } from "../../talent/career/ResumeA4";
import { PDF_PRINT_AREA, PrintStyles } from "../../talent/career/pdf-print";
import { useRenewalDocsStatus, useResumeDoc } from "../../../lib/talent/resume-doc";
import { useBasicInfo } from "../../../lib/talent/basic-info";
import { usePlatformT } from "../../../lib/i18n";

export function V2ResumePreviewScreen() {
  return (
    <V2Shell requireAuth>
      <Body />
    </V2Shell>
  );
}

function Body() {
  const t = usePlatformT();
  const doc = useResumeDoc();
  const status = useRenewalDocsStatus();
  const info = useBasicInfo();

  if (status !== "loaded") return <PageSkeleton />;

  return (
    <Page>
      <PrintStyles />
      <div className="no-print">
        <Masthead
          eyebrow={t("내 이력서", "My resume", "我的简历", "CV của tôi", "履歴書", "CV saya")}
          title={t("이력서 미리보기", "Resume preview", "简历预览", "Xem trước CV", "履歴書プレビュー", "Pratinjau CV")}
          lede={
            doc
              ? t("회사에 내는 모습 그대로예요. PDF 로 저장해 바로 쓸 수 있어요.", "Exactly how companies will see it. Save it as a PDF to use right away.", "这就是公司看到的样子。可保存为 PDF 直接使用。", "Đúng như công ty sẽ thấy. Lưu PDF để dùng ngay.", "企業に出すそのままの姿です。PDFで保存してすぐ使えます。", "Persis seperti yang dilihat perusahaan. Simpan PDF untuk langsung dipakai.")
              : t("아직 이력서가 없어요. 먼저 이력서를 만들어 주세요.", "No resume yet. Please create one first.", "还没有简历，请先制作简历。", "Chưa có CV. Hãy tạo CV trước.", "まだ履歴書がありません。まず作ってください。", "Belum ada CV. Buat CV dulu ya.")
          }
          action={
            doc ? (
              <Actions>
                <V2PdfButton />
                <Button variant="neutral" href="/talent/career/resume/editor">
                  {t("고치기", "Edit", "修改", "Sửa", "編集", "Ubah")}
                </Button>
              </Actions>
            ) : (
              <PrimaryButton href="/talent/career/resume/editor">{t("이력서 만들기", "Create resume", "制作简历", "Tạo CV", "履歴書を作る", "Buat CV")}</PrimaryButton>
            )
          }
        />
      </div>
      {doc ? (
        <div className="px-5">
          <div className="rounded-3xl bg-[color:var(--v2-band)] p-3 md:p-6">
            <div className={`mx-auto w-full max-w-[794px] ${PDF_PRINT_AREA}`}>
              <ResumeA4Preview doc={doc} info={info} />
            </div>
          </div>
        </div>
      ) : null}
    </Page>
  );
}
