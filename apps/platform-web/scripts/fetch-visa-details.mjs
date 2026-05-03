import { writeFile } from "node:fs/promises";
import path from "node:path";
import { load } from "cheerio";

const CODES = [
  "A-1","A-2","A-3",
  "B-1","B-2",
  "C-1","C-3","C-4",
  "D-1","D-2","D-3","D-4","D-5","D-6","D-7","D-8","D-9","D-10",
  "E-1","E-2","E-3","E-4","E-5","E-6","E-7","E-8","E-9","E-10",
  "F-1","F-2","F-2-7","F-2-R","F-3","F-4","F-5","F-6",
  "H-1","H-2","G-1"
];

function cleanText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function parseList($, ulEl, depth = 0) {
  const out = [];
  $(ulEl)
    .children("li")
    .each((_, li) => {
      const $li = $(li);
      const nested = $li.children("ul").first();
      const cloned = $li.clone();
      cloned.children("ul").remove();
      const raw = cleanText(cloned.text());
      if (raw) {
        out.push({
          kind: "bullet",
          depth,
          text: raw
        });
      }
      if (nested.length) {
        out.push(...parseList($, nested, depth + 1));
      }
    });
  return out;
}

function extractSection($, contentRoot, headingText) {
  const headings = contentRoot.find("h2").toArray();
  const startIdx = headings.findIndex((h) => cleanText($(h).text()).includes(headingText));
  if (startIdx < 0) return [];
  const start = headings[startIdx];
  const end = headings[startIdx + 1] ?? null;

  const lines = [];
  let node = $(start).next();
  while (node.length && (!end || node.get(0) !== end)) {
    const tag = node.get(0)?.tagName?.toLowerCase();
    if (tag === "ul") {
      lines.push(...parseList($, node, 0));
    } else if (tag === "p") {
      const text = cleanText(node.text());
      if (text) lines.push({ kind: "heading", depth: 0, text });
    }
    node = node.next();
  }
  return lines;
}

function extractData(html, locale) {
  const $ = load(html);
  const contentRoot = $(".notion-content").first();
  const title = cleanText($("title").first().text()) || null;
  const updatedAtText =
    locale === "ko"
      ? contentRoot.text().match(/최근 수정일\s*\d{4}\/\d{2}\/\d{2}/)?.[0] ?? null
      : contentRoot.text().match(/Last updated on\s*\d{4}\/\d{2}\/\d{2}/i)?.[0] ?? null;

  const description = extractSection($, contentRoot, locale === "ko" ? "비자 설명" : "Visa Description");
  const candidates = extractSection($, contentRoot, locale === "ko" ? "비자 대상자" : "Visa Candidate");
  const requirements = extractSection($, contentRoot, locale === "ko" ? "비자 발급 필요서류" : "Visa Requirements");

  return { title, updatedAt: updatedAtText, description, candidates, requirements };
}

async function fetchCode(code) {
  const visaSourceDomain = `https://${["ko", "work"].join("")}.kr`;
  const koUrl = `${visaSourceDomain}/visa/${encodeURIComponent(code)}`;
  const enUrl = `${visaSourceDomain}/en/visa/${encodeURIComponent(code)}`;

  const koRes = await fetch(koUrl, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CareerBridgeBot/1.0)" }
  });
  if (!koRes.ok) throw new Error(`${code}: KO HTTP ${koRes.status}`);
  const koHtml = await koRes.text();
  const ko = extractData(koHtml, "ko");

  let en = null;
  try {
    const enRes = await fetch(enUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; CareerBridgeBot/1.0)" }
    });
    if (enRes.ok) {
      const enHtml = await enRes.text();
      en = extractData(enHtml, "en");
    }
  } catch {
    en = null;
  }

  return {
    titleKo: ko.title,
    titleEn: en?.title ?? null,
    updatedAtKo: ko.updatedAt,
    updatedAtEn: en?.updatedAt ?? null,
    descriptionKo: ko.description,
    descriptionEn: en?.description ?? [],
    candidatesKo: ko.candidates,
    candidatesEn: en?.candidates ?? [],
    requirementsKo: ko.requirements,
    requirementsEn: en?.requirements ?? [],
    description: ko.description,
    candidates: ko.candidates,
    requirements: ko.requirements
  };
}

async function main() {
  const out = {};
  for (const code of CODES) {
    try {
      const detail = await fetchCode(code);
      out[code] = detail;
      console.log(`OK ${code} (desc:${detail.description.length}, cand:${detail.candidates.length}, req:${detail.requirements.length})`);
    } catch (e) {
      out[code] = {
        titleKo: null,
        titleEn: null,
        updatedAtKo: null,
        updatedAtEn: null,
        descriptionKo: [],
        descriptionEn: [],
        candidatesKo: [],
        candidatesEn: [],
        requirementsKo: [],
        requirementsEn: [],
        description: [],
        candidates: [],
        requirements: [],
        error: String(e)
      };
      console.log(`FAIL ${code}: ${String(e)}`);
    }
  }

  const body = `export type VisaStructuredLine = {\n  kind: \"heading\" | \"bullet\";\n  depth: number;\n  text: string;\n};\n\nexport type VisaDetail = {\n  titleKo: string | null;\n  titleEn: string | null;\n  updatedAtKo: string | null;\n  updatedAtEn: string | null;\n  descriptionKo: VisaStructuredLine[];\n  descriptionEn: VisaStructuredLine[];\n  candidatesKo: VisaStructuredLine[];\n  candidatesEn: VisaStructuredLine[];\n  requirementsKo: VisaStructuredLine[];\n  requirementsEn: VisaStructuredLine[];\n  description: VisaStructuredLine[];\n  candidates: VisaStructuredLine[];\n  requirements: VisaStructuredLine[];\n  error?: string;\n};\n\nexport const VISA_DETAILS: Record<string, VisaDetail> = ${JSON.stringify(out, null, 2)} as const;\n`;
  const target = path.join(process.cwd(), "apps/platform-web/lib/visa-details.ts");
  await writeFile(target, body, "utf8");
  console.log(`Saved -> ${target}`);
}

main();
