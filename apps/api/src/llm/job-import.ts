// 모의 면접용 '공고 가져오기' — 다른 서비스·회사 채용 페이지 URL 을 서버가 읽어 글만 뽑는다.
// 사용자가 넣은 주소를 서버가 대신 여는 기능이라 SSRF 를 막는다:
//  - http/https 만, 기본 포트(80/443)만
//  - 호스트를 DNS 로 풀어 사설·루프백·링크로컬·메타데이터 대역이면 거절(리다이렉트마다 다시 검사)
//  - 리다이렉트 최대 3번, 8초 제한, 본문 2MB 까지만 읽기, HTML/텍스트만
import { lookup } from "node:dns/promises";
import net from "node:net";
import type { LlmMessages } from "./prompts";
import { aiLangDirective } from "./prompts";

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80")) return true;
    const mapped = v.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);
    return false;
  }
  return true;
}

async function assertPublicUrl(raw: string): Promise<URL> {
  const u = new URL(raw);
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad_protocol");
  if (u.port && u.port !== "80" && u.port !== "443") throw new Error("bad_port");
  if (u.username || u.password) throw new Error("bad_auth");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("bad_host");
  const addrs = net.isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("private_address");
  return u;
}

/** 공개 웹페이지를 안전하게 읽어 제목과 본문 글만 돌려준다(최대 12,000자). */
export async function fetchPublicPageText(raw: string): Promise<{ url: string; title: string; text: string }> {
  let url = await assertPublicUrl(raw);
  for (let hop = 0; hop <= 3; hop++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    let res: Response;
    try {
      res = await fetch(url, { redirect: "manual", signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0 (compatible; AplyBot/1.0; +https://aply.global)", accept: "text/html,text/plain;q=0.9" } });
    } finally {
      clearTimeout(timer);
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc || hop === 3) throw new Error("too_many_redirects");
      url = await assertPublicUrl(new URL(loc, url).toString());
      continue;
    }
    if (!res.ok) throw new Error(`http_${res.status}`);
    const type = res.headers.get("content-type") ?? "";
    if (!/text\/html|text\/plain|application\/xhtml/i.test(type)) throw new Error("not_html");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("no_body");
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 2_000_000) {
        await reader.cancel();
        break;
      }
      chunks.push(value);
    }
    const html = new TextDecoder("utf-8").decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
    const title = (html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ?? html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "").trim();
    // JSON-LD JobPosting 이 있으면 그 글이 가장 깨끗하다(많은 채용 사이트가 넣는다).
    const ld = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).filter((x) => /JobPosting/i.test(x)).join("\n");
    const body = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();
    const text = `${ld ? `[구조화 데이터]\n${ld.replace(/<[^>]+>/g, " ").slice(0, 6000)}\n\n` : ""}${body}`.slice(0, 12000);
    return { url: url.toString(), title, text };
  }
  throw new Error("too_many_redirects");
}

export const JOB_IMPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    isJob: { type: "boolean" },
    company: { type: "string" },
    title: { type: "string" },
    responsibilities: { type: "string" },
    requirements: { type: "string" },
    preferred: { type: "string" }
  },
  required: ["isJob", "company", "title", "responsibilities", "requirements", "preferred"]
} as const;

export function buildJobImportMessages(input: { pageTitle?: string; text: string }): LlmMessages {
  const system =
    "당신은 채용 공고 정리 도우미입니다. 웹페이지에서 뽑은 글(또는 사용자가 붙여 넣은 글)에서 채용 공고의 핵심만 정리해 주세요.\n" +
    "[규칙]\n" +
    "- 채용 공고가 아니면(로그인 화면, 목록 페이지, 내용이 거의 없음 등) isJob=false 와 나머지는 빈 문자열.\n" +
    "- company: 회사 이름. title: 공고/직무 이름.\n" +
    "- responsibilities(주요 업무)·requirements(자격 요건)·preferred(우대 사항): 글에 실제로 적힌 내용만, 한 줄에 하나씩 '- '로 시작하는 목록으로. 없으면 빈 문자열.\n" +
    "- 글에 없는 내용을 지어내지 마세요. 메뉴·광고·다른 공고 목록·회사 홍보 문구는 빼세요." +
    aiLangDirective();
  return { system, user: `${input.pageTitle ? `[페이지 제목] ${input.pageTitle}\n\n` : ""}${input.text}` };
}
