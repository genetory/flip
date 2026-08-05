// 클라이언트 이미지 전처리 — 업로드 전에 WebP 로 리사이즈·압축한다.
// 원본 그대로 base64 로 보내면 DB/응답이 폭증하므로(사무실 사진 이슈) 반드시 축소한다.

export function estimateDataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? "";
  return Math.floor((base64.length * 3) / 4);
}

function readFileAsDataUrl(file: File, readFailed: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error(readFailed));
    };
    reader.onerror = () => reject(new Error(readFailed));
    reader.readAsDataURL(file);
  });
}

export async function convertImageFileToWebpDataUrl(
  file: File,
  readFailed = "파일을 읽지 못했습니다."
): Promise<string> {
  const originalDataUrl = await readFileAsDataUrl(file, readFailed);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(readFailed));
    img.src = originalDataUrl;
  });

  // 긴 변을 1600px 로 제한하고 목표 용량은 400KB. 초과하면 품질·해상도를 낮춰 재시도.
  const MAX_DIM = 1600;
  const TARGET_BYTES = 400 * 1024;

  const scale = Math.min(1, MAX_DIM / Math.max(image.width, image.height));
  let width = image.width * scale;
  let height = image.height * scale;
  let quality = 0.82;
  let output = originalDataUrl;

  for (let i = 0; i < 6; i += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error(readFailed);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    output = canvas.toDataURL("image/webp", quality);
    if (estimateDataUrlBytes(output) <= TARGET_BYTES) {
      return output;
    }
    quality = Math.max(0.5, quality - 0.08);
    width *= 0.85;
    height *= 0.85;
  }

  return output;
}

// 사무실 사진은 문자열 배열을 JSON 으로 직렬화해 officePhotoImageData 한 필드에 저장한다.
export function parseOfficePhotos(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    // 단일 문자열(구버전)로 저장된 경우.
    return [raw];
  }
  return [raw];
}
