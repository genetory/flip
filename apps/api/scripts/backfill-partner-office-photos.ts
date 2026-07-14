/**
 * 파트너사 사무실 사진(base64) → Azure Blob 백필.
 *
 * 배경: 프론트는 사무실 사진을 여러 장 올릴 수 있어 JSON 배열을 문자열로 보낸다.
 * 백엔드는 그 값을 단일 data URL 로 보고 업로드 함수에 넘겼는데, 그 함수는
 * "data:image/" 로 시작하지 않으면(→ "[") 그냥 반환한다. 그래서 base64 배열이
 * 통째로 DB 에 저장됐고, /positions 목록 응답이 38MB 까지 커졌다.
 *
 * 코드는 고쳤지만 이미 쌓인 행은 그대로이므로 여기서 Blob 으로 옮기고 URL 로 교체한다.
 *
 * 실행:
 *   npx tsx scripts/backfill-partner-office-photos.ts          # 미리보기(변경 없음)
 *   npx tsx scripts/backfill-partner-office-photos.ts --apply  # 실제 반영
 */
import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaClient } from "@prisma/client";
import { BlobServiceClient } from "@azure/storage-blob";
import sharp from "sharp";

const prisma = new PrismaClient();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim() ?? "";
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME?.trim() || "uploads";
const APPLY = process.argv.includes("--apply");

function extFromMime(mime: string): string {
  const m = mime.toLowerCase();
  if (m === "image/jpeg") return "jpg";
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  if (m === "image/gif") return "gif";
  if (m === "image/svg+xml") return "svg";
  if (m === "image/heic") return "heic";
  return "bin";
}

async function main() {
  if (!connectionString) {
    console.error("AZURE_STORAGE_CONNECTION_STRING 이 없습니다. 업로드할 수 없어 중단합니다.");
    process.exit(1);
  }

  const container = BlobServiceClient.fromConnectionString(connectionString).getContainerClient(containerName);
  if (APPLY) await container.createIfNotExists({ access: "blob" });

  const orgs = await prisma.partnerOrganization.findMany({
    where: { officePhotoImageData: { not: null } },
    select: { id: true, name: true, officePhotoImageData: true }
  });

  let touched = 0;
  let bytesFreed = 0;

  for (const org of orgs) {
    const raw = (org.officePhotoImageData ?? "").trim();
    if (!raw || !raw.includes("data:image/")) continue; // 이미 URL 이면 건너뜀

    // 값은 JSON 배열 문자열이거나(대부분) 단일 data URL 일 수 있다.
    let entries: string[];
    if (raw.startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        entries = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
      } catch {
        console.warn(`  [skip] ${org.name}: JSON 파싱 실패`);
        continue;
      }
    } else {
      entries = [raw];
    }

    const urls: string[] = [];
    let orgBytes = 0;

    for (const entry of entries) {
      const match = entry.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i);
      if (!match) {
        urls.push(entry); // 이미 URL 인 항목은 그대로
        continue;
      }
      const mime = match[1]!;
      const original = Buffer.from(match[2]!, "base64");
      orgBytes += entry.length;

      // 옮기면서 함께 줄인다 — 원본 그대로 Blob 에 올리면 상세 페이지는 여전히 무겁다.
      // 긴 변 1600px, WebP 82 품질(서버 업로드 경로와 동일한 기준).
      let content = original;
      let outMime = mime;
      if (mime !== "image/svg+xml") {
        try {
          const resized = await sharp(original, { failOn: "none" })
            .rotate()
            .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 82 })
            .toBuffer();
          if (resized.length < original.length) {
            content = resized;
            outMime = "image/webp";
          }
        } catch (err) {
          console.warn("    (리사이즈 실패 — 원본 업로드)", err);
        }
      }

      if (!APPLY) {
        urls.push(
          `(예정: ${(original.length / 1024 / 1024).toFixed(2)}MB → ${(content.length / 1024).toFixed(0)}KB)`
        );
        continue;
      }
      const blobName = `partner/office-photo/${Date.now()}-${randomBytes(8).toString("hex")}.${extFromMime(outMime)}`;
      const client = container.getBlockBlobClient(blobName);
      await client.uploadData(content, {
        blobHTTPHeaders: { blobContentType: outMime, blobCacheControl: "public, max-age=31536000, immutable" }
      });
      urls.push(client.url);
    }

    const next = raw.startsWith("[") ? JSON.stringify(urls) : (urls[0] ?? null);

    console.log(
      `  ${APPLY ? "[변환]" : "[미리보기]"} ${org.name}: ${entries.length}장, ` +
        `${(orgBytes / 1024 / 1024).toFixed(2)}MB → ${next ? `${(String(next).length / 1024).toFixed(1)}KB` : "null"}`
    );

    if (APPLY) {
      await prisma.partnerOrganization.update({
        where: { id: org.id },
        data: { officePhotoImageData: next }
      });
    }
    touched += 1;
    bytesFreed += orgBytes;
  }

  console.log("");
  console.log(`대상 파트너사: ${touched}곳`);
  console.log(`DB에서 줄어드는 용량: ${(bytesFreed / 1024 / 1024).toFixed(1)} MB`);
  if (!APPLY) console.log("\n미리보기입니다. 실제 반영하려면 --apply 를 붙여 다시 실행하세요.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
