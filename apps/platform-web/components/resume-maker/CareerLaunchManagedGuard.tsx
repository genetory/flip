"use client";

// 커리어런치 미러 문서(이력서·자소서) 편집 진입 차단.
//
// 커리어런치는 자기 작업본을 저장할 때마다 미러 Resume/CoverLetter 의 본문을 통째로 덮어쓴다.
// 그래서 resume-maker 편집기에서 미러를 고치면 저장된 것처럼 보였다가 조용히 사라졌고,
// 이제는 서버가 본문 수정을 409(CAREER_LAUNCH_MANAGED)로 거절한다. 편집기에 들어가면
// 자동 저장이 거절을 반복하므로, 라우트 단에서 막고 커리어런치로 안내한다.
// 미리보기(/preview)는 읽기 전용이라 그대로 통과시킨다.

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Button } from "../ui/button";
import { getDraftResume } from "../../lib/resume-maker-client";
import { getCoverLetter } from "../../lib/cover-letter-client";
import { usePlatformT } from "../../lib/i18n";

type Kind = "resume" | "coverLetter";

export function CareerLaunchManagedGuard({
  kind,
  id,
  previewHref,
  children
}: {
  kind: Kind;
  id: string;
  previewHref: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isPreview = pathname?.endsWith("/preview") ?? false;
  // null = 확인 중. 확인 전에 편집기를 그리면 자동 저장이 먼저 나갈 수 있어 기다린다.
  const [managed, setManaged] = useState<boolean | null>(isPreview ? false : null);

  useEffect(() => {
    if (isPreview) return;
    let alive = true;
    (async () => {
      try {
        const doc = kind === "resume" ? await getDraftResume(id) : await getCoverLetter(id);
        if (alive) setManaged(doc.source === "career-launch");
      } catch {
        // 조회 실패(없음·권한 등)는 기존 화면이 스스로 처리하도록 통과시킨다.
        if (alive) setManaged(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [kind, id, isPreview]);

  if (managed === null) return <div className="min-h-[40vh]" aria-busy="true" />;
  if (!managed) return <>{children}</>;
  return <ManagedNotice kind={kind} previewHref={previewHref} />;
}

function ManagedNotice({ kind, previewHref }: { kind: Kind; previewHref: string }) {
  const t = usePlatformT();
  const isResume = kind === "resume";
  const title = isResume
    ? t("커리어런치에서 작성한 이력서예요", "This resume was written in Career Launch", "这份简历是在 Career Launch 中编写的", "CV này được viết trong Career Launch", "キャリアローンチで作成した履歴書です", "CV ini dibuat di Career Launch")
    : t("커리어런치에서 작성한 자기소개서예요", "This cover letter was written in Career Launch", "这份自我介绍是在 Career Launch 中编写的", "Thư giới thiệu này được viết trong Career Launch", "キャリアローンチで作成した自己紹介書です", "Surat lamaran ini dibuat di Career Launch");
  const body = t(
    "커리어런치에서 저장할 때마다 내용이 새로 반영돼요. 여기서 고치면 사라지므로, 수정은 커리어런치에서 해 주세요.",
    "It is refreshed every time you save in Career Launch. Edits made here would be lost, so please edit it in Career Launch.",
    "每次在 Career Launch 保存时内容都会重新同步。在这里修改会丢失，请在 Career Launch 中修改。",
    "Nội dung được cập nhật mỗi khi bạn lưu trong Career Launch. Chỉnh sửa ở đây sẽ bị mất, vui lòng chỉnh sửa trong Career Launch.",
    "キャリアローンチで保存するたびに内容が更新されます。ここで編集すると失われるため、キャリアローンチで編集してください。",
    "Isinya diperbarui setiap kali Anda menyimpan di Career Launch. Perubahan di sini akan hilang, jadi silakan edit di Career Launch."
  );
  const editHref = isResume ? "/career-launch/resume-collect" : "/career-launch/cover-collect";

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-[18px] font-bold text-[#191F28]">{title}</h1>
      <p className="mt-2 break-keep text-[14px] leading-relaxed text-[#4E5968]">{body}</p>
      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href={editHref}>{t("커리어런치에서 수정하기", "Edit in Career Launch", "在 Career Launch 中修改", "Chỉnh sửa trong Career Launch", "キャリアローンチで編集", "Edit di Career Launch")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href={previewHref}>{t("미리보기", "Preview", "预览", "Xem trước", "プレビュー", "Pratinjau")}</Link>
        </Button>
      </div>
    </div>
  );
}
